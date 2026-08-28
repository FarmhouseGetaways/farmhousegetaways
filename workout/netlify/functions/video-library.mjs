/**
 * GET  /api/video-library                              → every saved video
 * POST /api/video-library { intent: "add", label, url } → save one
 * POST /api/video-library { intent: "remove", id }      → drop one
 *
 * Admin-only, the same shared password that gates the editor — this is
 * part of building the week, not something any signed-in account needs.
 *
 * A link is validated the same way an exercise's own video field is
 * (safeUrl, in _lib/data.mjs): http(s) only, so a library entry can never be
 * a scheme the app would refuse to embed anyway.
 */
import { LIBRARY, LIBRARY_KEY, signedIn, configured, json } from "./_lib/auth.mjs";
import { normaliseLibrary, normaliseLibraryEntry } from "./_lib/data.mjs";

export const config = { path: "/api/video-library" };

const read = async () => {
  try { return normaliseLibrary(await LIBRARY().get(LIBRARY_KEY, { type: "json" })); }
  catch (err) {
    console.warn("video-library: read failed,", err && err.message);
    return null;
  }
};

export default async (req) => {
  if (!configured()) return json({ ok: false, error: "This app is not set up yet." }, 503);
  if (!signedIn(req)) return json({ ok: false, error: "Admin only." }, 401);

  if (req.method === "GET") {
    const list = await read();
    if (list === null) return json({ ok: false, error: "The store could not be reached." }, 502);
    return json({ ok: true, videos: list });
  }

  if (req.method !== "POST") return json({ ok: false }, 405);
  let body = {};
  try { body = await req.json(); } catch { return json({ ok: false, error: "Could not read that." }, 400); }

  const list = await read();
  if (list === null) return json({ ok: false, error: "The store could not be reached." }, 502);

  const intent = String(body.intent || "");
  let next;

  if (intent === "add") {
    const entry = normaliseLibraryEntry({ label: body.label, url: body.url });
    if (!entry) return json({ ok: false, error: "Give it a name and a video link." }, 400);
    if (list.some((e) => e.url === entry.url)) {
      return json({ ok: false, error: "That link is already saved." }, 400);
    }
    next = [entry, ...list].slice(0, 200);
  } else if (intent === "remove") {
    next = list.filter((e) => e.id !== body.id);
  } else {
    return json({ ok: false, error: "Not something this can do." }, 400);
  }

  try {
    await LIBRARY().setJSON(LIBRARY_KEY, next);
  } catch (err) {
    return json({ ok: false, error: "Could not save: " + (err?.message || err) }, 502);
  }
  return json({ ok: true, videos: next });
};
