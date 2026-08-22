/**
 * GET    /api/history                        → the record
 * POST   /api/history  { sessions, settings } → fold new workouts in
 * DELETE /api/history  { ids }                → remove workouts logged by mistake
 *
 * Every one of them needs the session cookie, reading included. This is a
 * record of one person's body and what it did every day for a year; it is not
 * public the way the plan is.
 *
 * POST IS A MERGE, NEVER A REPLACEMENT
 * She may finish a workout on her phone while the iPad still holds last week's
 * copy. If either device ever sent its whole list as the new truth, the other
 * device's workout would vanish. Only what is new is sent, the union is taken
 * here by id, and the two can never delete each other's work.
 */
import { HISTORY, HISTORY_KEY, signedIn, configured, json } from "./_lib/auth.mjs";
import { normaliseHistory, mergeHistory, dropSessions } from "./_lib/data.mjs";

export const config = { path: "/api/history" };

const read = async () => {
  try { return normaliseHistory(await HISTORY().get(HISTORY_KEY, { type: "json" })); }
  catch (err) {
    console.warn("history: blob read failed,", err && err.message);
    return null;                       // told apart from "no workouts yet"
  }
};

export default async (req) => {
  if (!configured()) {
    return json({ ok: false, error: "This app has no password set, so the record is kept on the phone only." }, 503);
  }
  if (!signedIn(req)) return json({ ok: false, error: "Not signed in." }, 401);

  if (req.method === "GET") {
    const stored = await read();
    if (!stored) return json({ ok: false, error: "The store could not be reached." }, 502);
    return json({ ok: true, history: stored });
  }

  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Could not read that." }, 400); }

  const stored = await read();
  if (!stored) return json({ ok: false, error: "The store could not be reached." }, 502);

  let next;
  if (req.method === "POST") next = mergeHistory(stored, body);
  else if (req.method === "DELETE") next = dropSessions(stored, body.ids || body.deleteSessions);
  else return json({ ok: false }, 405);

  try {
    await HISTORY().setJSON(HISTORY_KEY, next);
  } catch (err) {
    return json({ ok: false, error: "Could not save the record: " + (err?.message || err) }, 502);
  }
  return json({ ok: true, history: next });
};
