/**
 * GET  /api/exercise-library                    → every saved exercise
 * POST /api/exercise-library { intent: "add", ...exercise fields }  → save one
 * POST /api/exercise-library { intent: "remove", id }               → drop one
 *
 * Admin-only, same as the video library and the editor itself — this is
 * part of building the week, not something any signed-in account needs.
 *
 * A saved exercise is exactly the shape one already has inside a day —
 * name, video, image, sets, reps, rest, effort, notes — normalised and
 * clamped by the same normaliseExercise a day's own exercises go through,
 * so a pool entry can never carry something the day editor itself would
 * have refused.
 */
import { EXERCISE_LIBRARY, EXERCISE_LIBRARY_KEY, signedIn, configured, json } from "./_lib/auth.mjs";
import { normaliseExerciseLibrary, normaliseExercise } from "./_lib/data.mjs";

export const config = { path: "/api/exercise-library" };

const read = async () => {
  try { return normaliseExerciseLibrary(await EXERCISE_LIBRARY().get(EXERCISE_LIBRARY_KEY, { type: "json" })); }
  catch (err) {
    console.warn("exercise-library: read failed,", err && err.message);
    return null;
  }
};

export default async (req) => {
  if (!configured()) return json({ ok: false, error: "This app is not set up yet." }, 503);
  if (!signedIn(req)) return json({ ok: false, error: "Admin only." }, 401);

  if (req.method === "GET") {
    const list = await read();
    if (list === null) return json({ ok: false, error: "The store could not be reached." }, 502);
    return json({ ok: true, exercises: list });
  }

  if (req.method !== "POST") return json({ ok: false }, 405);
  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Could not read that." }, 400); }

  const list = await read();
  if (list === null) return json({ ok: false, error: "The store could not be reached." }, 502);

  const intent = String(body.intent || "");
  let next;

  if (intent === "add") {
    const entry = normaliseExercise(body);
    if (!entry) return json({ ok: false, error: "Give it a name first." }, 400);
    next = [entry, ...list].slice(0, 300);
  } else if (intent === "remove") {
    next = list.filter((e) => e.id !== body.id);
  } else {
    return json({ ok: false, error: "Not something this can do." }, 400);
  }

  try {
    await EXERCISE_LIBRARY().setJSON(EXERCISE_LIBRARY_KEY, next);
  } catch (err) {
    return json({ ok: false, error: "Could not save: " + (err?.message || err) }, 502);
  }
  return json({ ok: true, exercises: next });
};
