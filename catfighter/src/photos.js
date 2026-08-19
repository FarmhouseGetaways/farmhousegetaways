/* ==========================================================================
   Cat Fighter II — real photographs of the real cats

   Two steps: drop a picture into assets/cats/, then name it on that cat in
   characters.js — `photo: 'mittens.jpg'`. It then appears on the
   character-select card and on the winner screen.

   Naming it explicitly rather than guessing at filenames means the game never
   fires off requests for files that are not there, so the console stays clean
   and a missing photo costs nothing.

   Square-ish crops around the face look best; anything from about 200px up is
   plenty at this resolution.
   ========================================================================== */
(function () {
  var cache = {};      // id -> { img, ready, failed }

  function load(id, file) {
    if (cache[id]) return cache[id];
    var entry = { img: null, ready: false, failed: false };
    cache[id] = entry;
    if (!file) { entry.failed = true; return entry; }
    var img = new Image();
    img.onload = function () { entry.img = img; entry.ready = true; };
    img.onerror = function () { entry.failed = true; };
    img.src = 'assets/cats/' + file;
    return entry;
  }

  /* Preload the photographs that have actually been named, once, at boot. */
  function preload() {
    if (!CF.ROSTER) return;
    for (var i = 0; i < CF.ROSTER.length; i++) {
      var c = CF.ROSTER[i];
      if (c.photo) load(c.id, c.photo);
    }
  }

  function get(id) {
    var e = cache[id];
    return (e && e.ready) ? e.img : null;
  }

  function has(id) { return !!get(id); }

  /* Draw the photograph as a circle, cropped to fill, with a ring around it. */
  function drawCircle(ctx, id, cx, cy, r, ring) {
    var img = get(id);
    if (!img) return false;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    /* cover-fit: fill the circle without squashing the cat */
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    var s = Math.max((r * 2) / iw, (r * 2) / ih);
    var dw = iw * s, dh = ih * s;
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();

    if (ring !== false) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = ring || 'rgba(255,224,122,.85)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }
    return true;
  }

  CF.Photos = { preload: preload, get: get, has: has, drawCircle: drawCircle };
})();
