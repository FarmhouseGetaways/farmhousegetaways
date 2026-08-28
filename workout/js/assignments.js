/* ==========================================================================
   Assignments — talking to /api/assignments.

   Which workout(s) an account does, on which weekday, at which time.
   Self-service reading (my own schedule) needs an account signed in;
   admin reading (anyone's) and every write need the admin password.
   Assigning a workout is the admin's job — see the owner's own description
   of the flow: pick a user, then a day, then a workout, then a time.
   ========================================================================== */

const API = "/api/assignments";

async function call(url, options = {}) {
  let res, body;
  try {
    res = await fetch(url, {
      credentials: "include",
      cache: "no-store",
      ...options,
      headers: { ...(options.body ? { "content-type": "application/json" } : {}), ...(options.headers || {}) },
    });
    body = await res.json().catch(() => ({}));
  } catch {
    return { ok: false, error: "Could not reach the app's server." };
  }
  if (!res.ok || !body.ok) return { ok: false, error: body.error || `The server said ${res.status}.` };
  return body;
}

/** My own schedule, resolved — needs an account signed in. */
export const mine = () => call(API);

/** Admin only — a given account's schedule, resolved, for editing. */
export const forUser = (userId) => call(`${API}?user=${encodeURIComponent(userId)}`);

const post = (payload) => call(API, { method: "POST", body: JSON.stringify(payload) });

export const add = (userId, { day, time, workoutId }) => post({ intent: "add", userId, day, time, workoutId });
export const update = (userId, id, { day, time, workoutId }) => post({ intent: "update", userId, id, day, time, workoutId });
export const remove = (userId, id) => post({ intent: "remove", userId, id });
