/**
 * GET /api/plan  → the week. Public: it is a list of exercises, and the app
 *                  has to be able to show the week before anybody signs in.
 * PUT /api/plan  → replace it. Needs the session cookie.
 *
 * WHY THE BASELINE IS AN IMPORT AND NOT A FETCH
 * A function that fetches its own site's /data/plan.json fails silently in
 * production and returns nothing — a lesson already paid for twice on these
 * sites. Importing the JSON has esbuild inline it at build time: no network
 * call, no origin to get wrong, no runtime failure mode.
 *
 * So data/plan.json is the floor. If the store has never been written, or is
 * wiped, the app falls back to whatever was committed rather than to a blank
 * week.
 */
import seed from "../../data/plan.json";
import { PLAN, PLAN_KEY, signedIn, configured, json } from "./_lib/auth.mjs";
import { normalisePlan } from "./_lib/data.mjs";

export const config = { path: "/api/plan" };

export default async (req) => {
  if (req.method === "GET") {
    let plan = null, source = "committed";
    try {
      const saved = await PLAN().get(PLAN_KEY, { type: "json" });
      if (saved) { plan = saved; source = "live"; }
    } catch (err) {
      /* Storage being unavailable is not a reason to show an empty week. */
      console.warn("plan: blob read failed,", err && err.message);
      source = "committed-fallback";
    }
    return json({
      plan: normalisePlan(plan || seed),
      source,
      editable: configured(),
      signedIn: signedIn(req),
    });
  }

  if (req.method !== "PUT") return json({ ok: false }, 405);
  if (!configured()) return json({ ok: false, error: "This app has no password set, so nothing can be saved." }, 503);
  if (!signedIn(req)) return json({ ok: false, error: "Not signed in." }, 401);

  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Could not read that." }, 400); }

  const plan = normalisePlan(body.plan || body);
  try {
    await PLAN().setJSON(PLAN_KEY, plan);
  } catch (err) {
    return json({ ok: false, error: "Could not save the week: " + (err?.message || err) }, 502);
  }
  return json({ ok: true, plan });
};
