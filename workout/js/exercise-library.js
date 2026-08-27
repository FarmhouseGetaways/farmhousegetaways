/* ==========================================================================
   The exercise pool — talking to /api/exercise-library.

   Admin only, same as the video library and the editor itself. A saved
   exercise is name, video, image, sets, reps, rest, effort and notes — the
   whole thing, ready to drop into a day rather than typed out again.
   ========================================================================== */

const API = "/api/exercise-library";

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

/** `ex` is a day's exercise object — id is deliberately left out, so the pool
 * entry gets a fresh one of its own rather than sharing the day exercise's. */
export const add = (ex) => call({
  method: "POST",
  body: JSON.stringify({
    intent: "add",
    name: ex.name, video: ex.video, image: ex.image,
    sets: ex.sets, reps: ex.reps, rest: ex.rest, effort: ex.effort, notes: ex.notes,
  }),
});

export const remove = (id) => call({ method: "POST", body: JSON.stringify({ intent: "remove", id }) });
