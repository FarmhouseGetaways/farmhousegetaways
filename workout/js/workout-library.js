/* ==========================================================================
   The workout library — talking to /api/workout-library.

   Admin only. A workout is a title, a picture, and an ordered list of
   exercise ids from the exercise pool — never a copy of the exercises
   themselves. Assigning it to an account is a separate step; see
   assignments.js.
   ========================================================================== */

const API = "/api/workout-library";

async function call(options = {}) {
  let res, body;
  try {
    res = await fetch(API, {
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

export const list = () => call();

/** A fresh workout. Never pass an id in `w` — the server mints one. */
export const add = (w) => call({
  method: "POST",
  body: JSON.stringify({
    intent: "add",
    title: w.title, description: w.description, image: w.image,
    minutes: w.minutes, exerciseIds: w.exerciseIds,
  }),
});

export const update = (id, w) => call({
  method: "POST",
  body: JSON.stringify({
    intent: "update", id,
    title: w.title, description: w.description, image: w.image,
    minutes: w.minutes, exerciseIds: w.exerciseIds,
  }),
});

export const remove = (id) => call({ method: "POST", body: JSON.stringify({ intent: "remove", id }) });
