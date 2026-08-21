/* ==========================================================================
   Super Cat Fighter 6 — boot

   The canvas is always 384 x 224 logical units — the exact resolution of the
   arcade board this game is pretending to be from — and the context is scaled
   to fill whatever window it is given. Drawing happens at native device
   resolution, so it is sharp on a 4K monitor without any of the art changing.
   ========================================================================== */
(function () {
  var W = CF.STAGE.W, H = CF.STAGE.H;
  var DT = 1000 / 60;
  var canvas, game, scale = 1;

  /* ---- THE GAME IS DRAWN AT 384 x 224. FULL STOP. ------------------------

     This is the whole reason it looks like a fighting game rather than a
     cartoon. Street Fighter II is not "vector art with hard shading" — it is
     a 384 x 224 grid of pixels, and the grid IS the style: chunky aliased
     edges, no half-tones smoothing anything over, every edge landing on a
     pixel boundary because there is nowhere else for it to land.

     Drawing into a 1920 x 1120 backing store and calling it a 384 x 224 game
     gets you smooth anti-aliased curves — which is exactly what a cartoon
     looks like and exactly what Street Fighter II does not. So the backing
     store is the arcade resolution, and CSS blows it up with nearest
     neighbour. The staircase on every edge is the point.

     The scale is a whole number. A fractional one makes some game pixels two
     screen pixels across and their neighbours three, which shimmers when
     anything moves and is the one thing worse than being slightly small.

     It is also about twenty times less to draw, so the frame rate problem
     this game had stops being possible.                                   */

  /* How many real pixels the game draws per logical pixel. 1 is the arcade
     board exactly; 2 halves the size of every pixel, which keeps the hard
     aliased edge but gives the art twice the detail to be drawn with. It is
     an option because it is a taste, and because the answer was not obvious
     until it was on a real screen. */
  var pixel = 2;

  function resize() {
    var wrap = document.getElementById('wrap');
    var cw = wrap.clientWidth, ch = wrap.clientHeight;
    var fit = Math.min(cw / W, ch / H);
    if (!isFinite(fit) || fit <= 0) fit = 1;
    /* The on-screen scale has to be a whole multiple of the pixel size, or
       some game pixels come out wider than their neighbours and the whole
       picture shimmers when it moves. */
    var mult = Math.max(1, Math.floor(fit / pixel));
    scale = pixel * mult;
    canvas.style.width = (W * scale) + 'px';
    canvas.style.height = (H * scale) + 'px';
    var bw = W * pixel, bh = H * pixel;
    if (canvas.width !== bw) { canvas.width = bw; canvas.height = bh; }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(pixel, 0, 0, pixel, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (game) { game.deviceScale = scale; game.pixelScale = pixel; }
  }

  function setPixel(n) {
    pixel = Math.max(1, Math.min(4, n | 0));
    resize();
  }

  function loop(now) {
    if (!game.last) game.last = now;
    var delta = now - game.last;
    game.last = now;
    if (delta > 250) delta = DT;          // a backgrounded tab must not fast-forward
    game.acc += delta;

    /* If the machine has fallen far enough behind that the catch-up loop
       cannot close the gap, throw the backlog away rather than carrying it.
       Carrying it means every frame from then on runs the maximum six steps,
       which is how a hitch turns into permanent slow motion — and how one
       push on the stick moves a menu cursor three places. */
    if (game.acc > DT * 6) game.acc = DT;

    var guard = 0;
    while (game.acc >= DT && guard < 6) {
      game.step();
      game.acc -= DT;
      guard++;
    }
    fpsTick(now);
    game.render();
    requestAnimationFrame(loop);
  }

  /* The page can be embedded — in an artifact viewer, in an iframe on a
     site. Keyboard events only reach a document that HAS focus, so a game
     that just listens on window is silently dead until the player happens to
     click the right thing. Take focus on load and on every pointer press, and
     make the menus clickable so one press both focuses and chooses. */
  /* A frame-rate readout, on F3. "It is laggy" is hard to act on; "it says 9"
     is a bug report. */
  var fps = { on: false, frames: 0, since: 0, value: 0 };
  function fpsTick(now) {
    fps.frames++;
    if (!fps.since) fps.since = now;
    if (now - fps.since >= 500) {
      fps.value = Math.round(fps.frames * 1000 / (now - fps.since));
      fps.frames = 0;
      fps.since = now;
    }
    game.fps = fps.on ? fps.value : 0;
  }

  function grabFocus() {
    try { window.focus(); } catch (e) { /* cross-origin parent: nothing to do */ }
    if (canvas) canvas.focus({ preventScroll: true });
  }

  /* Where a pointer press landed, in the game's own 384 x 224 coordinates. */
  function pointerAt(e) {
    var r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    return {
      x: (e.clientX - r.left) / r.width * W,
      y: (e.clientY - r.top) / r.height * H
    };
  }

  function boot() {
    canvas = document.getElementById('screen');
    game = new CF.Game(canvas);
    CF.game = game;
    resize();
    window.addEventListener('resize', resize);

    grabFocus();
    window.addEventListener('pointerdown', grabFocus, true);

    canvas.addEventListener('pointermove', function (e) {
      var p = pointerAt(e);
      if (!p) return;
      if (p.x !== game.pointer.x || p.y !== game.pointer.y) game.pointer.moved = true;
      game.pointer.x = p.x; game.pointer.y = p.y; game.pointer.seen = true;
    });
    canvas.addEventListener('pointerdown', function (e) {
      var p = pointerAt(e);
      if (!p) return;
      game.pointer.x = p.x;
      game.pointer.y = p.y;
      game.pointer.seen = true;
      game.pointer.clicked = true;
      e.preventDefault();
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    /* WebAudio needs a gesture before it will make a sound. */
    function wake() {
      CF.Audio.init();
      grabFocus();
      document.getElementById('boot').classList.add('gone');
      window.removeEventListener('keydown', wake);
      window.removeEventListener('pointerdown', wake);
    }
    window.addEventListener('keydown', wake);
    window.addEventListener('pointerdown', wake);

    /* Handy globals while building: F for fullscreen, F1 for hitboxes. */
    window.addEventListener('keydown', function (e) {
      if (e.code === 'F11' || (e.code === 'KeyF' && e.altKey)) {
        e.preventDefault();
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      }
      if (e.code === 'F1') { e.preventDefault(); game.settings.showBoxes = !game.settings.showBoxes; }
      if (e.code === 'F3') { e.preventDefault(); fps.on = !fps.on; }
    });

    requestAnimationFrame(loop);
  }

  /* The options screen changes the pixel size, and the canvas has to be
     rebuilt when it does. */
  CF.Screen = { setPixel: setPixel, getPixel: function () { return pixel; } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
