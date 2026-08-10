/**
 * Farmhouse Getaways — one-click publish.
 *
 * The editor at /edit.html POSTs its change list here. This function commits
 * the result to GitHub. Netlify sees the commit and builds the site, exactly
 * as it does when a change is pushed by hand.
 *
 * WHY IT COMMITS INSTEAD OF DEPLOYING
 *
 * This used to call the Netlify API and push a deploy straight to the site.
 * That works, and it is a trap: a deploy made that way never reaches the repo,
 * so the live site and `main` drift apart, and the next ordinary commit
 * silently reverts whatever the editor published. That is precisely how the
 * D16 version of this site was lost. Everything goes through the repo now, so
 * the editor and a hand edit cannot overwrite each other.
 *
 * How it works:
 *   1. read the current branch head from GitHub
 *   2. read the pages being changed straight from the repo, not the live site
 *   3. apply the text replacements and swap any photographs
 *   4. write one commit containing every changed file
 *   5. move the branch to it — Netlify builds, the site is live in ~30s
 *
 * Requires two environment variables, set in Netlify → Site configuration →
 * Environment variables:
 *   GITHUB_TOKEN     a fine-grained personal access token with Contents: Read
 *                    and write on FarmhouseGetaways/farmhousegetaways
 *   ADMIN_PASSWORD   the same one that guards /api/emailoctopus
 *
 * Optional, only if the repo or branch ever moves:
 *   GITHUB_REPO    owner/name       (default FarmhouseGetaways/farmhousegetaways)
 *   GITHUB_BRANCH  branch to commit (default main)
 *
 * The token never reaches the browser.
 *
 * WHY THERE IS A PASSWORD ON IT NOW
 *
 * /edit.html is on the open web and so is this endpoint. While the old Netlify
 * token was dead that cost nothing. A working GitHub token changes the maths:
 * without a gate, anyone who found this URL could commit to the repo. It FAILS
 * CLOSED — with no ADMIN_PASSWORD set, nobody publishes, including the owner.
 */

const GH = "https://api.github.com";

/* ---------- text replacement — mirrors tools/apply-edits.py ---------- */

const ENT = {
  "—": "&mdash;", "–": "&ndash;", "&": "&amp;", "·": "&middot;",
  "→": "&rarr;", "←": "&larr;", "’": "&rsquo;", "‘": "&lsquo;",
  "“": "&ldquo;", "”": "&rdquo;", "…": "&hellip;", "★": "&#9733;",
  "<": "&lt;", ">": "&gt;", " ": "&nbsp;", "°": "&deg;",
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Match text whether the source wrote a literal character or its entity. */
function tolerant(s) {
  let out = "";
  for (const ch of s) {
    if (ch === "\n") { out += "(?:[ \\t]*<br\\s*/?>[ \\t]*\\n?|\\s+)"; continue; }
    if (/\s/.test(ch)) { out += "\\s+"; continue; }
    out += ENT[ch] ? `(?:${esc(ch)}|${esc(ENT[ch])})` : esc(ch);
  }
  return out.replace(/(?:\\s\+)+/g, "\\s+");
}

/** Write replacements back in the house entity style. */
function encode(s) {
  s = s.replace(/&/g, "&amp;");
  for (const [ch, ent] of Object.entries(ENT)) {
    if (ch === "&" || ch === "<" || ch === ">") continue;
    s = s.split(ch).join(ent);
  }
  s = s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return s.replace(/\n/g, "<br>\n");   // deliberate line breaks become <br>
}

function applyToPage(html, changes) {
  const applied = [], missed = [];
  for (const c of changes) {
    const re = new RegExp(tolerant(c.before));
    const m = html.match(re);
    if (!m) { missed.push(c.before.slice(0, 60)); continue; }
    html = html.slice(0, m.index) + encode(c.after) + html.slice(m.index + m[0].length);
    applied.push(c.before.slice(0, 60));
  }
  return { html, applied, missed };
}

/**
 * Point one <img> at its freshly committed file.
 * The file keeps its path so nothing else has to change, but /images/* is
 * cached immutable for a year — so the src gets a ?v= stamp to force browsers
 * to fetch it again. Width and height are rewritten to the new dimensions so
 * the page does not jump while it loads.
 */
function swapImage(html, p) {
  const re = new RegExp(`<img\\b[^>]*?src="${esc(p.src)}(?:\\?[^"]*)?"[^>]*>`, "g");
  let m, seen = 0, hit = null;
  while ((m = re.exec(html))) { if (++seen === (p.occurrence || 1)) { hit = m; break; } }
  if (!hit) return { html, ok: false };

  let tag = hit[0]
    .replace(/src="[^"]*"/, `src="${p.src}?v=${p.version}"`)
    .replace(/width="\d+"/, `width="${p.width}"`)
    .replace(/height="\d+"/, `height="${p.height}"`);

  return { html: html.slice(0, hit.index) + tag + html.slice(hit.index + hit[0].length), ok: true };
}

/* ---------- commit message ---------- */

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function commitMessage(report, changes, photos) {
  const parts = [];
  if (changes.length) parts.push(plural(changes.length, "text change"));
  if (photos.length) parts.push(plural(photos.length, "photograph"));

  const lines = [`Editor: ${parts.join(" and ")}`, ""];
  for (const r of report) {
    const bits = [];
    if (r.applied) bits.push(plural(r.applied, "change"));
    if (r.photos) bits.push(plural(r.photos, "photograph"));
    lines.push(`- ${r.page}: ${bits.join(", ") || "no change"}`);
  }
  lines.push("", "Published from /edit.html. Netlify builds this commit.");
  return lines.join("\n");
}

/* ---------- who is allowed to publish ---------- */

/** Constant time, so the endpoint cannot be used to guess the password. */
function secretOk(given) {
  const want = process.env.ADMIN_PASSWORD || "";
  if (!want) return false;
  const a = new TextEncoder().encode(String(given || ""));
  const b = new TextEncoder().encode(want);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/* ---------- handler ---------- */

export default async (req) => {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });

  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  if (!process.env.ADMIN_PASSWORD) {
    return json({
      error: "Publishing is shut.",
      detail: "ADMIN_PASSWORD is not set in Netlify, so nothing here can publish. Add it under Site configuration → Environment variables.",
    }, 503);
  }
  if (!secretOk(new URL(req.url).searchParams.get("key") || req.headers.get("x-admin-password"))) {
    return json({ error: "Wrong publishing key.", detail: "Wrong publishing key." }, 401);
  }

  const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const REPO = process.env.GITHUB_REPO || "FarmhouseGetaways/farmhousegetaways";
  const BRANCH = process.env.GITHUB_BRANCH || "main";

  if (!TOKEN) {
    return json({
      error: "Not set up yet.",
      detail:
        "Add GITHUB_TOKEN under Site configuration → Environment variables. It needs a fine-grained personal access token with Contents: Read and write on " +
        REPO + ". Then redeploy.",
    }, 500);
  }

  let payload;
  try { payload = await req.json(); }
  catch { return json({ error: "Could not read the changes." }, 400); }

  const changes = payload?.changes || [];
  const photos = payload?.photos || [];
  if (!changes.length && !photos.length) return json({ error: "No changes to publish." }, 400);

  const headers = {
    authorization: `Bearer ${TOKEN}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "farmhouse-getaways-editor",
  };

  /** Call GitHub and fail loudly, in plain English, rather than falling through. */
  async function gh(path, init = {}) {
    const res = await fetch(`${GH}${path}`, {
      ...init,
      headers: { ...headers, ...(init.body ? { "content-type": "application/json" } : {}), ...(init.headers || {}) },
    });
    if (!res.ok) {
      const body = await res.text();
      const why =
        res.status === 401 ? "GITHUB_TOKEN is not valid. It was probably revoked or has expired. Make a new fine-grained token with Contents: Read and write and update the environment variable."
        : res.status === 403 ? "GITHUB_TOKEN does not have permission to write to " + REPO + ". Check the token grants Contents: Read and write on that repository."
        : res.status === 404 ? "GitHub cannot see " + REPO + " at that path. Either the repository name is wrong or the token has no access to it."
        : res.status === 409 || res.status === 422 ? "Someone pushed to " + BRANCH + " while this was publishing. Nothing was lost — press Publish again."
        : "GitHub rejected the request.";
      const err = new Error(`GitHub said ${res.status}. ${why}`);
      err.detail = body.slice(0, 400);
      throw err;
    }
    return res;
  }

  const repoPath = (webPath) => webPath.replace(/^\/+/, "");

  try {
    // 1. where the branch is now — every read and the commit's parent both use
    //    this exact sha, so a push mid-publish cannot half-apply.
    const ref = await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`).then((r) => r.json());
    const headSha = ref.object.sha;
    const headCommit = await gh(`/repos/${REPO}/git/commits/${headSha}`).then((r) => r.json());
    const baseTree = headCommit.tree.sha;

    // 2. group the work by page
    const byPage = {};
    for (const c of changes) (byPage[c.page] ||= []).push(c);
    for (const p of photos) (byPage[p.page] ||= []);

    // 3. rebuild each page from the repo copy, not from the live site
    const tree = [], report = [];
    for (const [page, items] of Object.entries(byPage)) {
      const res = await fetch(`${GH}/repos/${REPO}/contents/${repoPath(page)}?ref=${headSha}`, {
        headers: { ...headers, accept: "application/vnd.github.raw" },
      });
      if (!res.ok) { report.push({ page, error: `could not read ${page} from the repo (${res.status})` }); continue; }

      let { html, applied, missed } = applyToPage(await res.text(), items);

      let swapped = 0;
      for (const p of photos.filter((x) => x.page === page)) {
        const r = swapImage(html, p);
        if (r.ok) { html = r.html; swapped++; }
        else missed.push("photo " + p.src);
      }

      const blob = await gh(`/repos/${REPO}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: html, encoding: "utf-8" }),
      }).then((r) => r.json());

      tree.push({ path: repoPath(page), mode: "100644", type: "blob", sha: blob.sha });
      report.push({ page, applied: applied.length, photos: swapped, missed });
    }

    // 4. new image bytes go in at their existing paths
    const written = [];
    for (const p of photos) {
      const blob = await gh(`/repos/${REPO}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: p.data, encoding: "base64" }),
      }).then((r) => r.json());
      tree.push({ path: repoPath(p.src), mode: "100644", type: "blob", sha: blob.sha });
      written.push(p.src);
    }

    if (!tree.length) return json({ error: "Nothing could be applied.", report }, 500);

    // 5. one tree, one commit, every changed file in it
    const newTree = await gh(`/repos/${REPO}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseTree, tree }),
    }).then((r) => r.json());

    const commit = await gh(`/repos/${REPO}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: commitMessage(report, changes, photos),
        tree: newTree.sha,
        parents: [headSha],
      }),
    }).then((r) => r.json());

    // 6. move the branch. No force — if someone pushed in the meantime this
    //    fails rather than throwing their commit away.
    await gh(`/repos/${REPO}/git/refs/heads/${BRANCH}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });

    return json({
      ok: true,
      commit: commit.sha,
      branch: BRANCH,
      pages: report.filter((r) => !r.error).map((r) => r.page),
      photos: written,
      report,
      message: "Committed to " + BRANCH + ". Netlify is building — give it about thirty seconds, then refresh your site.",
    });
  } catch (err) {
    return json({ error: err.message || "Publish failed.", detail: err.detail || String(err) }, 500);
  }
};
