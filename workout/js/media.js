/* ==========================================================================
   Pictures and clips.

   Picking a file from a phone and having it appear in the app, without
   anybody thinking about where it went.

   The shrinking is the part that matters. A phone photo is four or five
   megabytes; nobody wants that in a store and nobody in a garage with two
   bars wants to download it. Resized to 1600px and re-encoded as JPEG it is
   usually two or three hundred kilobytes and looks identical at the size this
   app shows it.

   Video cannot be shrunk in a browser, so it is passed through as it is and
   checked against the limit before anything is sent — a clear "that is too
   big, put it on YouTube" beats a four-megabyte upload that fails at the far
   end after thirty seconds of waiting.
   ========================================================================== */

const MAX_EDGE = 1600;
const QUALITY = 0.82;
const MAX_BYTES = 4 * 1024 * 1024;      // must match media.mjs

export const isImage = (file) => /^image\//i.test(file?.type || "");
export const isVideo = (file) => /^video\//i.test(file?.type || "");

/** file → a Blob with the long edge capped, re-encoded as JPEG. */
function shrink(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a picture the browser can open."));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("The browser could not re-encode that picture.")),
          "image/jpeg", QUALITY,
        );
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1) + " MB";

/**
 * Send a file and get back the path it now lives at.
 *
 * Throws with something a person can act on. "Not signed in" and "too big"
 * are both ordinary things to do by accident, and neither should produce a
 * stack trace or a silent nothing.
 */
export async function upload(file) {
  if (!file) throw new Error("No file was chosen.");

  let body = file;
  let type = file.type;

  if (isImage(file) && type !== "image/gif") {
    // GIFs are left alone: re-encoding one to JPEG would throw the animation
    // away, and an animated GIF of a movement is a perfectly good demo.
    body = await shrink(file);
    type = "image/jpeg";
  } else if (!isImage(file) && !isVideo(file)) {
    throw new Error("That has to be a picture or a video clip.");
  }

  if (body.size > MAX_BYTES) {
    throw new Error(
      isVideo(file)
        ? `That clip is ${mb(body.size)}, and an upload can carry 4 MB. Put it on YouTube as an unlisted video and paste the link instead — the app plays it just the same.`
        : `That picture is still ${mb(body.size)} after resizing. Try saving it as a JPEG first.`,
    );
  }

  const res = await fetch("/api/media", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": type },
    body,
  });

  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out.ok) {
    throw new Error(out.error || (res.status === 401
      ? "Signed out — sign in again and retry."
      : `The upload failed (${res.status}).`));
  }
  return out;
}

/** A local preview to show the moment a file is chosen, before it has landed. */
export const previewUrl = (file) => URL.createObjectURL(file);
