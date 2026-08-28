/* ==========================================================================
   The video library — talking to /api/video-library.

   Admin only, same as editing the week. A saved video is a name and a
   YouTube (or other recognised) link; picking one from here is what replaces
   pasting a link in fresh every time an exercise needs one.
   ========================================================================== */

const API = "/api/video-library";

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
export const add = (label, url) => call({ method: "POST", body: JSON.stringify({ intent: "add", label, url }) });
export const update = (id, label, url) => call({ method: "POST", body: JSON.stringify({ intent: "update", id, label, url }) });
export const remove = (id) => call({ method: "POST", body: JSON.stringify({ intent: "remove", id }) });
