/**
 * POST /api/media   → upload a picture (signed in). The body is the raw
 *                     bytes; the content type says what.
 * GET  /media/:id   → serve one. Public.
 *
 * Content-addressed: the id is a hash of the bytes. Uploading the same file
 * twice gives the same URL and costs nothing extra, and because a URL can only
 * ever mean one file, it is safe to cache for a year without ever going stale.
 *
 * PHOTOS ONLY, ON PURPOSE
 * Video used to accept a phone upload too, capped at 4 MB because that is as
 * much as a function's request body can carry through Lambda. The owner asked
 * for that door closed: a video is now a YouTube link only, chosen from the
 * library or pasted in (see video-library.mjs and js/app.js's media sheet) —
 * never a file, and never uploaded here. POST accordingly only takes picture
 * types. GET still serves an old .mp4/.webm/.mov by hash, so an exercise
 * built before this change does not go dark; there is simply no way to add
 * another one.
 *
 * Serving is public on purpose. These are pictures of dumbbells, the app has
 * to show them before anybody signs in, and the ids are unguessable hashes.
 * Uploading is not: it needs the session cookie, like every other write.
 */
import { MEDIA, json } from "./_lib/auth.mjs";
import { isAdminRequest } from "./_lib/users.mjs";
import { createHash } from "node:crypto";

export const config = { path: ["/api/media", "/media/:id"] };

const MAX_BYTES = 4 * 1024 * 1024;

/* What POST will still accept. */
const TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/* What GET will still serve — includes video extensions from before this
 * changed, so an exercise built with the old phone-upload flow keeps playing. */
const EXT_TO_TYPE = {
  ...Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [v, k])),
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export default async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const id = decodeURIComponent(url.pathname.split("/").pop() || "");
    if (!/^[a-f0-9]{32}\.(jpg|png|webp|gif|mp4|webm|mov)$/.test(id)) {
      return new Response("Not found", { status: 404 });
    }

    let bytes;
    try {
      bytes = await MEDIA().get(id, { type: "arrayBuffer" });
    } catch (err) {
      console.warn("media: read failed,", err && err.message);
      return new Response("Unavailable", { status: 503 });
    }
    if (!bytes) return new Response("Not found", { status: 404 });

    return new Response(bytes, {
      headers: {
        "Content-Type": EXT_TO_TYPE[id.split(".").pop()] || "application/octet-stream",
        // Safe for a year precisely because the name is the hash of the bytes.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (req.method !== "POST") return json({ ok: false }, 405);
  if (!(await isAdminRequest(req))) return json({ ok: false, error: "Admin only." }, 401);

  const type = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!TYPES[type]) {
    return json({
      ok: false,
      error: type.startsWith("video/")
        ? "Video is not uploaded here any more — paste a YouTube link instead, or pick one from the library."
        : "That has to be a JPEG, PNG, WebP or GIF picture.",
    }, 415);
  }

  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return json({ ok: false, error: "That file came through empty." }, 400);
  if (buf.length > MAX_BYTES) {
    return json({
      ok: false,
      error: "That picture is over 4 MB even after resizing, which usually means the browser could not re-encode it. Try a JPEG.",
    }, 413);
  }

  const id = createHash("sha256").update(buf).digest("hex").slice(0, 32) + "." + TYPES[type];
  try {
    await MEDIA().set(id, buf, { metadata: { type, bytes: buf.length } });
  } catch (err) {
    return json({ ok: false, error: "Could not store that file: " + (err?.message || err) }, 502);
  }

  return json({ ok: true, id, url: "/media/" + id, bytes: buf.length, kind: "image" });
};
