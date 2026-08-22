/**
 * POST /api/media   → upload a picture or a short clip (signed in).
 *                     The body is the raw bytes; the content type says what.
 * GET  /media/:id   → serve one. Public.
 *
 * Content-addressed: the id is a hash of the bytes. Uploading the same file
 * twice gives the same URL and costs nothing extra, and because a URL can only
 * ever mean one file, it is safe to cache for a year without ever going stale.
 *
 * WHY THE LIMIT IS WHAT IT IS
 * A function's request body has to fit through Lambda, which caps it around
 * six megabytes once encoded — so the real ceiling for raw bytes is nearer
 * four and a half. Pictures never come close: the browser resizes them to
 * 1600px before sending and they land at two or three hundred kilobytes.
 * Video is the one that bumps into it, which is why the message says so
 * plainly and points at YouTube rather than just refusing.
 *
 * Serving is public on purpose. These are pictures of dumbbells, the app has
 * to show them before anybody signs in, and the ids are unguessable hashes.
 * Uploading is not: it needs the session cookie, like every other write.
 */
import { MEDIA, signedIn, json } from "./_lib/auth.mjs";
import { createHash } from "node:crypto";

export const config = { path: ["/api/media", "/media/:id"] };

const MAX_BYTES = 4 * 1024 * 1024;

const TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const EXT_TO_TYPE = Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [v, k]));

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
  if (!signedIn(req)) return json({ ok: false, error: "Not signed in." }, 401);

  const type = (req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!TYPES[type]) {
    return json({ ok: false, error: "That has to be a JPEG, PNG, WebP or GIF picture, or an MP4, WebM or MOV clip." }, 415);
  }

  const buf = Buffer.from(await req.arrayBuffer());
  if (!buf.length) return json({ ok: false, error: "That file came through empty." }, 400);
  if (buf.length > MAX_BYTES) {
    return json({
      ok: false,
      error: type.startsWith("video/")
        ? "That clip is over 4 MB, which is as much as an upload can carry. Put it on YouTube as an unlisted video and paste the link instead — the app plays it just the same."
        : "That picture is over 4 MB even after resizing, which usually means the browser could not re-encode it. Try a JPEG.",
    }, 413);
  }

  const id = createHash("sha256").update(buf).digest("hex").slice(0, 32) + "." + TYPES[type];
  try {
    await MEDIA().set(id, buf, { metadata: { type, bytes: buf.length } });
  } catch (err) {
    return json({ ok: false, error: "Could not store that file: " + (err?.message || err) }, 502);
  }

  return json({ ok: true, id, url: "/media/" + id, bytes: buf.length, kind: type.startsWith("video/") ? "video" : "image" });
};
