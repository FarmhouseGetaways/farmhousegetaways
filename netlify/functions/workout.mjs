/**
 * Carissa's workout tracker — the only server it has.
 *
 *   GET  /api/workout            the plan, and the history if you are signed in
 *   POST /api/workout            save the plan, log a workout, delete a workout
 *
 * WHERE THE DATA ACTUALLY LIVES
 *
 * In this repository, as `workout/data/plan.json` and
 * `workout/data/history.json`, written by committing to GitHub — the same
 * mechanism `publish.mjs` uses for the website itself, and for the same
 * reason: the repository is the source of truth, so nothing can drift away
 * from it. It also means a year of training is version-controlled and can
 * never be lost to a wiped store or an expired free tier, and that a workout
 * logged from a phone is readable from a laptop a minute later.
 *
 * The cost is that a finished workout produces a commit, and a commit
 * produces a Netlify build. That is one build a day for a person training
 * daily, which is nothing, and it buys a full history of every change.
 *
 * IT USES THE TWO VARIABLES THAT ARE ALREADY SET
 *
 *   GITHUB_TOKEN     write access to FarmhouseGetaways/farmhousegetaways
 *   ADMIN_PASSWORD   the same one that guards /edit.html and /api/emailoctopus
 *
 * so there is nothing new to configure. If either is missing the app does not
 * break: it falls back to storing everything in the browser and says so on
 * screen. A missing password means nobody can write, the owner included —
 * this FAILS CLOSED, like everything else here.
 *
 * WHY READING THE PLAN NEEDS NO PASSWORD, AND READING THE HISTORY DOES
 *
 * The plan is a list of exercises. The history is a record of one named
 * person's body and what it did every day for a year. The first is not worth
 * gating; the second is nobody else's business.
 *
 * WHY THE HISTORY IS NOT STORED HERE BY DEFAULT
 *
 * FarmhouseGetaways/farmhousegetaways is a PUBLIC repository. The plan being
 * committed to it costs nothing — it is a list of exercises. The history is
 * different: dates, sets, minutes and a body weight, under a person's name,
 * for as long as she keeps training. Committing that to a public repository
 * publishes it, and no amount of the site being noindexed changes that.
 *
 * So the record stays on her phone unless somebody deliberately turns sync on:
 *
 *     WORKOUT_HISTORY_SYNC = on
 *
 * Set that in Netlify only once the repository is private (or once the store
 * has been moved somewhere private). Until then the app keeps every workout in
 * the browser, says so plainly on screen, and offers a CSV download so nothing
 * is trapped. The plan still syncs either way, which is the half that has to:
 * it is written on one device and followed on another.
 */

import {
  normalisePlan, normaliseHistory, mergeHistory, dropSessions, emptyPlan,
} from "./_lib/workout.mjs";

const GH = "https://api.github.com";
const PLAN_PATH = "workout/data/plan.json";
const HISTORY_PATH = "workout/data/history.json";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

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

const givenKey = (req) => {
  let fromQuery = null;
  try { fromQuery = new URL(req.url).searchParams.get("key"); } catch { /* ignore */ }
  return fromQuery || req.headers.get("x-admin-password");
};

/**
 * Is the record allowed to leave the phone?
 *
 * Off unless it is switched on, and switched on by a human who has read why.
 * A missing variable means no, which is the right way round for a default that
 * decides whether somebody's training log ends up on the public internet.
 */
const historySync = () => {
  const v = String(process.env.WORKOUT_HISTORY_SYNC || "").trim().toLowerCase();
  return v === "on" || v === "true" || v === "1" || v === "yes";
};

const settings = () => ({
  token: process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "",
  repo: process.env.GITHUB_REPO || "FarmhouseGetaways/farmhousegetaways",
  branch: process.env.GITHUB_BRANCH || "main",
});

function ghHeaders(token) {
  return {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "farmhouse-workout-tracker",
  };
}

/** Call GitHub, and fail in plain English rather than falling through. */
async function gh(path, token, repo, branch, init = {}) {
  const res = await fetch(`${GH}${path}`, {
    ...init,
    headers: {
      ...ghHeaders(token),
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    const why =
      res.status === 401 ? "GITHUB_TOKEN is not valid — it has expired or been revoked. Make a new one and update the environment variable in Netlify."
      : res.status === 403 ? `GITHUB_TOKEN cannot write to ${repo}. It needs Contents: Read and write on that repository.`
      : res.status === 404 ? `GitHub cannot see ${repo} at that path.`
      : res.status === 409 || res.status === 422 ? `Something else wrote to ${branch} at the same moment.`
      : "GitHub rejected the request.";
    const err = new Error(`GitHub said ${res.status}. ${why}`);
    err.status = res.status;
    err.detail = body.slice(0, 300);
    throw err;
  }
  return res;
}

/** Read a JSON file from the repository at a given commit. Missing is not an error. */
async function readJson(path, token, repo, ref) {
  const res = await fetch(`${GH}/repos/${repo}/contents/${path}?ref=${encodeURIComponent(ref)}`, {
    headers: { ...ghHeaders(token), accept: "application/vnd.github.raw" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Could not read ${path} from the repository (${res.status}).`);
  try { return JSON.parse(await res.text()); }
  catch { return null; }         // a corrupt file is treated as no file, and rewritten
}

/**
 * Write one or both files in a single commit.
 *
 * `build` is handed the current contents and returns what should be written.
 * It can be called more than once: if somebody pushed between the read and the
 * ref update, everything is read again from the new head and rebuilt on top of
 * it, rather than the branch being forced and their commit thrown away. The
 * history merge is a union by id, so replaying it is safe by construction.
 */
async function commitFiles(build, message) {
  const { token, repo, branch } = settings();

  for (let attempt = 0; attempt < 3; attempt++) {
    const ref = await gh(`/repos/${repo}/git/ref/heads/${branch}`, token, repo, branch).then((r) => r.json());
    const headSha = ref.object.sha;
    const headCommit = await gh(`/repos/${repo}/git/commits/${headSha}`, token, repo, branch).then((r) => r.json());

    const current = {
      plan: await readJson(PLAN_PATH, token, repo, headSha),
      history: await readJson(HISTORY_PATH, token, repo, headSha),
    };

    const next = await build(current);
    const tree = [];
    for (const [path, value] of Object.entries(next)) {
      if (value === undefined) continue;
      const blob = await gh(`/repos/${repo}/git/blobs`, token, repo, branch, {
        method: "POST",
        body: JSON.stringify({ content: JSON.stringify(value, null, 2) + "\n", encoding: "utf-8" }),
      }).then((r) => r.json());
      tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
    }
    if (!tree.length) return { ok: true, unchanged: true, ...next };

    const newTree = await gh(`/repos/${repo}/git/trees`, token, repo, branch, {
      method: "POST",
      body: JSON.stringify({ base_tree: headCommit.tree.sha, tree }),
    }).then((r) => r.json());

    const commit = await gh(`/repos/${repo}/git/commits`, token, repo, branch, {
      method: "POST",
      body: JSON.stringify({ message, tree: newTree.sha, parents: [headSha] }),
    }).then((r) => r.json());

    try {
      // No force. If the branch moved, this fails and the loop starts again
      // from wherever it moved to.
      await gh(`/repos/${repo}/git/refs/heads/${branch}`, token, repo, branch, {
        method: "PATCH",
        body: JSON.stringify({ sha: commit.sha, force: false }),
      });
    } catch (err) {
      if ((err.status === 409 || err.status === 422) && attempt < 2) continue;
      throw err;
    }

    return { ok: true, commit: commit.sha, ...next };
  }
  throw new Error("The branch kept moving while this was saving. Nothing was lost — try again.");
}

/* ---------- the handler ---------- */

export default async (req) => {
  const { token, repo, branch } = settings();
  const signedIn = secretOk(givenKey(req));
  const hasPassword = !!process.env.ADMIN_PASSWORD;

  /* With no token there is no server-side store at all. Say so plainly and
     let the app fall back to the browser rather than pretending to save. */
  const offline = (extra = {}) =>
    json({
      storage: "local",
      signedIn,
      hasPassword,
      why: !token
        ? "GITHUB_TOKEN is not set in Netlify, so this app is storing everything in this browser only."
        : "ADMIN_PASSWORD is not set in Netlify, so nothing can be saved to the server.",
      ...extra,
    }, 200);

  if (req.method === "GET") {
    if (!token) return offline();
    try {
      const plan = await readJson(PLAN_PATH, token, repo, branch);
      const out = {
        storage: "server",
        signedIn,
        hasPassword,
        historySync: historySync(),
        plan: plan ? normalisePlan(plan) : emptyPlan(),
      };
      // The history is the private half. It is only sent to somebody holding
      // the password, and only when sync has been deliberately switched on.
      if (signedIn && historySync()) {
        out.history = normaliseHistory(await readJson(HISTORY_PATH, token, repo, branch));
      }
      return json(out);
    } catch (err) {
      return json({ storage: "local", signedIn, hasPassword, why: err.message }, 502);
    }
  }

  if (req.method !== "POST") return json({ error: "Use GET or POST." }, 405);

  if (!hasPassword) {
    return json({
      error: "Saving is shut.",
      detail: "ADMIN_PASSWORD is not set in Netlify, so nothing here can save. Add it under Site configuration → Environment variables.",
      storage: "local",
    }, 503);
  }
  if (!signedIn) return json({ error: "Wrong key.", detail: "That is not the password." }, 401);
  if (!token) {
    return json({
      error: "Not set up yet.",
      detail: `Add GITHUB_TOKEN under Site configuration → Environment variables. It needs Contents: Read and write on ${repo}.`,
      storage: "local",
    }, 503);
  }

  let payload;
  try { payload = await req.json(); }
  catch { return json({ error: "Could not read what was sent." }, 400); }

  try {
    /* Saving the plan. The whole week arrives and replaces the whole week —
       there is one editor and one plan, so there is nothing to merge. */
    if (payload?.plan) {
      const plan = normalisePlan(payload.plan);
      const named = plan.days.filter((d) => d.exercises.length).length;
      const result = await commitFiles(
        () => ({ [PLAN_PATH]: plan }),
        `Workout: plan updated — ${named} training day${named === 1 ? "" : "s"} this week\n\nSaved from /workout/.`,
      );
      return json({ ok: true, storage: "server", commit: result.commit, plan });
    }

    if ((payload?.sessions || payload?.settings || payload?.deleteSessions) && !historySync()) {
      return json({
        ok: true,
        storage: "local",
        historySync: false,
        note: "The record is kept on this phone. This repository is public, so workouts are not committed to it.",
      });
    }

    /* Logging finished workouts, and saving her weight. Only what is new is
       sent; the merge is a union, so two devices cannot delete each other. */
    if (payload?.sessions || payload?.settings) {
      let saved = null;
      const result = await commitFiles((current) => {
        saved = mergeHistory(current.history, payload);
        return { [HISTORY_PATH]: saved };
      }, commitMessageFor(payload));
      return json({ ok: true, storage: "server", commit: result.commit, history: saved });
    }

    /* Removing a workout logged by mistake. */
    if (payload?.deleteSessions) {
      let saved = null;
      const result = await commitFiles((current) => {
        saved = dropSessions(current.history, payload.deleteSessions);
        return { [HISTORY_PATH]: saved };
      }, "Workout: removed a logged workout\n\nSaved from /workout/.");
      return json({ ok: true, storage: "server", commit: result.commit, history: saved });
    }

    return json({ error: "Nothing to save." }, 400);
  } catch (err) {
    return json({ error: err.message || "Could not save.", detail: err.detail || String(err), storage: "server" }, 500);
  }
};

function commitMessageFor(payload) {
  const list = Array.isArray(payload?.sessions) ? payload.sessions : [];
  if (!list.length) return "Workout: settings updated\n\nSaved from /workout/.";
  const one = list[0];
  const what = list.length === 1
    ? `${one?.title || "Workout"} — ${one?.setsDone ?? 0} sets, ${Math.round((one?.elapsedSec || 0) / 60)} min`
    : `${list.length} workouts logged`;
  return `Workout: ${what}\n\nSaved from /workout/.`;
}
