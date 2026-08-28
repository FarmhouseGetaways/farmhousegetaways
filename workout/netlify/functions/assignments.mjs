/**
 * GET  /api/assignments               → the signed-in ACCOUNT's own schedule,
 *                                        resolved: each assignment with its
 *                                        workout, each workout with its
 *                                        exercises, live from the pools.
 * GET  /api/assignments?user=<id>     → admin only: that account's schedule,
 *                                        resolved the same way, for editing.
 * POST /api/assignments { intent: "add",    userId, day, time, workoutId }
 * POST /api/assignments { intent: "update", userId, id, day, time, workoutId }
 * POST /api/assignments { intent: "remove", userId, id }
 *
 * Assigning a workout is the admin's job — the owner's own description of
 * the flow is "select a user, then a day, then a workout, then a time" — so
 * every write here needs the admin password, never just an account signed
 * in. Reading is different: an account can always read its own schedule
 * (that is how the app shows her what to do today), but never anyone
 * else's.
 */
import { configured, json, WORKOUT_LIBRARY, WORKOUT_LIBRARY_KEY, EXERCISE_LIBRARY, EXERCISE_LIBRARY_KEY } from "./_lib/auth.mjs";
import { currentAccount, findById, setAssignments, isAdminRequest } from "./_lib/users.mjs";
import {
  normaliseAssignment, normaliseAssignments, resolveAssignments,
  normaliseWorkoutLibrary, normaliseExerciseLibrary,
} from "./_lib/data.mjs";

export const config = { path: "/api/assignments" };

async function readPools() {
  const [wRaw, eRaw] = await Promise.all([
    WORKOUT_LIBRARY().get(WORKOUT_LIBRARY_KEY, { type: "json" }).catch(() => null),
    EXERCISE_LIBRARY().get(EXERCISE_LIBRARY_KEY, { type: "json" }).catch(() => null),
  ]);
  return { workouts: normaliseWorkoutLibrary(wRaw), exercises: normaliseExerciseLibrary(eRaw) };
}

export default async (req) => {
  if (!configured()) return json({ ok: false, error: "This app is not set up yet." }, 503);

  const url = new URL(req.url);
  const admin = await isAdminRequest(req);

  if (req.method === "GET") {
    let user;
    const targetId = url.searchParams.get("user");
    if (targetId) {
      if (!admin) return json({ ok: false, error: "Admin only." }, 401);
      user = await findById(targetId);
      if (!user) return json({ ok: false, error: "No such account." }, 404);
    } else {
      user = await currentAccount(req);
      if (!user) return json({ ok: false, error: "Not signed in." }, 401);
    }
    const { workouts, exercises } = await readPools();
    const assignments = normaliseAssignments(user.assignments);
    return json({ ok: true, assignments: resolveAssignments(assignments, workouts, exercises) });
  }

  if (req.method !== "POST") return json({ ok: false }, 405);
  if (!admin) return json({ ok: false, error: "Admin only." }, 401);

  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Could not read that." }, 400); }

  const user = await findById(body.userId);
  if (!user) return json({ ok: false, error: "No such account." }, 404);

  const current = normaliseAssignments(user.assignments);
  const intent = String(body.intent || "");
  let next;

  if (intent === "add") {
    const entry = normaliseAssignment(body);
    if (!entry) return json({ ok: false, error: "Pick a day and a workout first." }, 400);
    next = normaliseAssignments([...current, entry]);
  } else if (intent === "update") {
    const entry = normaliseAssignment({ ...body, id: body.id });
    if (!entry) return json({ ok: false, error: "Pick a day and a workout first." }, 400);
    if (!current.some((a) => a.id === entry.id)) return json({ ok: false, error: "That assignment is gone." }, 404);
    next = normaliseAssignments(current.map((a) => (a.id === entry.id ? entry : a)));
  } else if (intent === "remove") {
    next = current.filter((a) => a.id !== body.id);
  } else {
    return json({ ok: false, error: "Not something this can do." }, 400);
  }

  try {
    await setAssignments(user.id, next);
  } catch (err) {
    return json({ ok: false, error: "Could not save: " + (err?.message || err) }, 502);
  }

  const { workouts, exercises } = await readPools();
  return json({ ok: true, assignments: resolveAssignments(next, workouts, exercises) });
};
