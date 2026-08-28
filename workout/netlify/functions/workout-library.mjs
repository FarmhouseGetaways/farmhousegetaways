/**
 * GET  /api/workout-library                                    → every saved workout
 * POST /api/workout-library { intent: "add", ...workout fields }     → save one
 * POST /api/workout-library { intent: "update", id, ...workout fields } → edit one in place
 * POST /api/workout-library { intent: "remove", id }                    → drop one
 *
 * Admin-only — building the week is the admin's job, not any signed-in
 * account's. A workout is a title, a picture, and an ORDERED LIST OF
 * EXERCISE IDS from the exercise pool (see exercise-library.mjs) — never a
 * copy of the exercises themselves, so editing one in the pool changes it
 * in every workout that uses it.
 *
 * Not tied to any day. See assignments.mjs for what puts a workout on an
 * actual account's actual weekday.
 */
import { WORKOUT_LIBRARY, WORKOUT_LIBRARY_KEY, signedIn, configured, json } from "./_lib/auth.mjs";
import { normaliseWorkoutLibrary, normaliseWorkout } from "./_lib/data.mjs";

export const config = { path: "/api/workout-library" };

const read = async () => {
  try { return normaliseWorkoutLibrary(await WORKOUT_LIBRARY().get(WORKOUT_LIBRARY_KEY, { type: "json" })); }
  catch (err) {
    console.warn("workout-library: read failed,", err && err.message);
    return null;
  }
};

export default async (req) => {
  if (!configured()) return json({ ok: false, error: "This app is not set up yet." }, 503);
  if (!signedIn(req)) return json({ ok: false, error: "Admin only." }, 401);

  if (req.method === "GET") {
    const list = await read();
    if (list === null) return json({ ok: false, error: "The store could not be reached." }, 502);
    return json({ ok: true, workouts: list });
  }

  if (req.method !== "POST") return json({ ok: false }, 405);
  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Could not read that." }, 400); }

  const list = await read();
  if (list === null) return json({ ok: false, error: "The store could not be reached." }, 502);

  const intent = String(body.intent || "");
  let next;

  if (intent === "add") {
    const entry = normaliseWorkout(body);
    if (!entry) return json({ ok: false, error: "Give it a title first." }, 400);
    next = [entry, ...list].slice(0, 200);
  } else if (intent === "update") {
    const entry = normaliseWorkout({ ...body, id: body.id });
    if (!entry) return json({ ok: false, error: "Give it a title first." }, 400);
    if (!list.some((w) => w.id === entry.id)) return json({ ok: false, error: "That workout is not in the library." }, 404);
    next = list.map((w) => (w.id === entry.id ? entry : w));
  } else if (intent === "remove") {
    next = list.filter((w) => w.id !== body.id);
  } else {
    return json({ ok: false, error: "Not something this can do." }, 400);
  }

  try {
    await WORKOUT_LIBRARY().setJSON(WORKOUT_LIBRARY_KEY, next);
  } catch (err) {
    return json({ ok: false, error: "Could not save: " + (err?.message || err) }, 502);
  }
  return json({ ok: true, workouts: next });
};
