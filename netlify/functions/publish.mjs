/**
 * Farmhouse Getaways — one-click publish.
 *
 * The editor at /edit.html POSTs its change list here. This function runs on
 * Netlify's own servers, so unlike a browser (or a sandboxed assistant) it can
 * talk to the Netlify API directly.
 *
 * How it publishes without re-uploading the whole 12 MB site:
 *   1. ask Netlify for the file manifest of the currently published deploy
 *   2. fetch only the pages that changed, apply the text replacements
 *   3. post the same manifest back with new digests for just those pages
 *   4. upload only the files Netlify says it is missing
 *
 * Requires two environment variables, set in Netlify → Site configuration →
 * Environment variables:
 *   NETLIFY_TOKEN   a personal access token
 *   NETLIFY_SITE_ID the site's API ID (Site configuration → General → Site ID)
 *
 * Neither ever reaches the browser.
 */

import { createHash } from "node:crypto";

const API = "https://api.netlify.com/api/v1";

/* ---------- text replacement — mirrors tools/apply-edits.py ---------- */

const ENT = {
  "—": "&mdash;", "–": "&ndash;", "&": "&amp;", "·": "&middot;",
  "→": "&rarr;", "←": "&larr;", "’": "&rsquo;", "‘": "&lsquo;",
  "“": "&ldquo;", "”": "&rdquo;", "…": "&hellip;", "★": "&#9733;",
  "<": "&lt;", ">": "&gt;", " ": "&nbsp;", "°": "&deg;",
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

const sha1 = (buf) => createHash("sha1").update(buf).digest("hex");

/**
 * Point one <img> at its freshly uploaded file.
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

/* ---------- handler ---------- */

export default async (req) => {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });

  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const TOKEN = process.env.NETLIFY_TOKEN;
  const SITE = process.env.NETLIFY_SITE_ID;
  if (!TOKEN || !SITE) {
    return json({
      error: "Not set up yet.",
      detail: "Add NETLIFY_TOKEN and NETLIFY_SITE_ID under Site configuration → Environment variables, then redeploy.",
    }, 500);
  }

  let payload;
  try { payload = await req.json(); }
  catch { return json({ error: "Could not read the changes." }, 400); }

  const changes = payload?.changes || [];
  const photos = payload?.photos || [];
  if (!changes.length && !photos.length) return json({ error: "No changes to publish." }, 400);

  const auth = { authorization: `Bearer ${TOKEN}` };
  const origin = new URL(req.url).origin;

  try {
    // 1. what is live right now
    //
    // This call used to be .then(r => r.json()) with no status check, so a 401
    // from a revoked token or a 404 from a wrong site ID both fell through to
    // "No published deploy found on this site." — which sent us looking at the
    // deploy list when the real problem was the credential. Check the status.
    const siteRes = await fetch(`${API}/sites/${SITE}`, { headers: auth });
    if (!siteRes.ok) {
      const body = await siteRes.text();
      const why =
        siteRes.status === 401
          ? "NETLIFY_TOKEN is not valid. It was probably revoked or expired. Make a new personal access token in Netlify and update the environment variable."
          : siteRes.status === 404
          ? "NETLIFY_SITE_ID does not match a site on this account."
          : "Netlify rejected the request.";
      return json(
        { error: `Netlify said ${siteRes.status}. ${why}`, detail: body.slice(0, 400) },
        500
      );
    }
    const site = await siteRes.json();
    const liveId = site.published_deploy?.id;
    if (!liveId) {
      return json({
        error: "No published deploy found on this site.",
        detail:
          "The token and site ID are fine — Netlify genuinely reports nothing published. Open the Deploys page and click Publish deploy on the deploy you want live, then try again.",
      }, 500);
    }

    const fileList = await fetch(`${API}/deploys/${liveId}/files`, { headers: auth }).then((r) => r.json());
    if (!Array.isArray(fileList)) return json({ error: "Could not read the current file list." }, 500);

    const manifest = {};
    for (const f of fileList) manifest[f.path || f.id] = f.sha;

    // 2. rebuild just the pages that changed
    const byPage = {};
    for (const c of changes) (byPage[c.page] ||= []).push(c);
    for (const p of photos) (byPage[p.page] ||= []);

    // new image bytes go in at their existing paths
    const binaries = {};
    for (const p of photos) {
      const buf = Buffer.from(p.data, "base64");
      binaries[p.src] = buf;
      manifest[p.src] = sha1(buf);
    }

    const edited = {}, report = [];
    for (const [page, items] of Object.entries(byPage)) {
      const res = await fetch(`${origin}${page}`, { headers: { "cache-control": "no-cache" } });
      if (!res.ok) { report.push({ page, error: `could not read live page (${res.status})` }); continue; }

      let { html, applied, missed } = applyToPage(await res.text(), items);

      let swapped = 0;
      for (const p of photos.filter((x) => x.page === page)) {
        const r = swapImage(html, p);
        if (r.ok) { html = r.html; swapped++; }
        else missed.push("photo " + p.src);
      }

      edited[page] = html;
      manifest[page] = sha1(Buffer.from(html, "utf8"));
      report.push({ page, applied: applied.length, photos: swapped, missed });
    }
    if (!Object.keys(edited).length) return json({ error: "Nothing could be applied.", report }, 500);

    // 3. new deploy from the same manifest, new digests for the edited pages
    const deploy = await fetch(`${API}/sites/${SITE}/deploys`, {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify({
        files: manifest,
        draft: false,
        // shows in the Netlify Deploys list instead of "No deploy message"
        title: `Farmhouse Getaways editor — ${
          changes.length ? changes.length + " text change" + (changes.length === 1 ? "" : "s") : ""
        }${changes.length && photos.length ? ", " : ""}${
          photos.length ? photos.length + " photo" + (photos.length === 1 ? "" : "s") : ""
        }`,
      }),
    }).then((r) => r.json());

    if (!deploy.id) return json({ error: "Netlify refused the deploy.", detail: deploy }, 500);

    // 4. upload only what Netlify is missing
    const required = new Set(deploy.required || []);
    const outgoing = Object.entries(edited)
      .map(([path, html]) => [path, Buffer.from(html, "utf8")])
      .concat(Object.entries(binaries));

    for (const [path, body] of outgoing) {
      if (required.size && !required.has(manifest[path])) continue;
      const up = await fetch(`${API}/deploys/${deploy.id}/files${path}`, {
        method: "PUT",
        headers: { ...auth, "content-type": "application/octet-stream" },
        body,
      });
      if (!up.ok) return json({ error: `Upload failed for ${path}`, detail: await up.text() }, 500);
    }

    return json({
      ok: true,
      deployId: deploy.id,
      pages: Object.keys(edited),
      photos: Object.keys(binaries),
      report,
      message: "Published. Give it about thirty seconds, then refresh your site.",
    });
  } catch (err) {
    return json({ error: "Publish failed.", detail: String(err) }, 500);
  }
};
