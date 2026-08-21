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
  var canvas, game, scale = 1, dpr = 1;

  /* How many device pixels the game is allowed to draw into, per axis.

     A 384 x 224 game on a 4K monitor would otherwise get a backing store of
     7405 x 4320 — thirty-two million pixels, redrawn sixty times a second,
     for artwork with no detail finer than a whisker. The drawing itself
     survives that; handing the compositor a texture that size every frame
     does not. Five times the arcade resolution is 1920 x 1120, which is
     sharper than any of the art actually is, and CSS stretches it the rest of
     the way. */
  var MAX_DEVICE_SCALE = 5, MIN_DEVICE_SCALE = 2;
  var quality = MAX_DEVICE_SCALE;     // lowered if the machine cannot keep up

  function resize() {
    var wrap = document.getElementById('wrap');
    var cw = wrap.clientWidth, ch = wrap.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    scale = Math.min(cw / W, ch / H);
    if (!isFinite(scale) || scale <= 0) scale = 1;
    var device = Math.max(1, Math.min(scale * dpr, quality));
    canvas.style.width = Math.floor(W * scale) + 'px';
    canvas.style.height = Math.floor(H * scale) + 'px';
    canvas.width = Math.round(W * device);
    canvas.height = Math.round(H * device);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(device, 0, 0, device, 0, 0);
    game && (game.deviceScale = +device.toFixed(2));
  }

  /* If the machine cannot hold a frame rate at this resolution, draw fewer
     pixels. Some machines have no working GPU acceleration at all and end up
     compositing the canvas in software, where the cost is all in the pixel
     count and nothing else — and a fighting game that runs is worth more than
     a sharp one that does not.

     It only ever steps down, never back up. Hunting between two resolutions
     looks far worse than sitting at the lower one. */
  var slowFor = 0;
  function adaptQuality(measured) {
    if (!measured) return;
    if (measured < 50 && quality > MIN_DEVICE_SCALE) {
      if (++slowFor >= 6) {           // about three seconds of it
        quality = Math.max(MIN_DEVICE_SCALE, quality - 1);
        slowFor = 0;
        resize();
      }
    } else if (measured >= 50) {
      slowFor = 0;
    }
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
      adaptQuality(fps.value);
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
