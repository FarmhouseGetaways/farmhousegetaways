/* ==========================================================================
   Cat Fighter II — boot

   The canvas is always 384 x 224 logical units — the exact resolution of the
   arcade board this game is pretending to be from — and the context is scaled
   to fill whatever window it is given. Drawing happens at native device
   resolution, so it is sharp on a 4K monitor without any of the art changing.
   ========================================================================== */
(function () {
  var W = CF.STAGE.W, H = CF.STAGE.H;
  var DT = 1000 / 60;
  var canvas, game, scale = 1, dpr = 1;

  function resize() {
    var wrap = document.getElementById('wrap');
    var cw = wrap.clientWidth, ch = wrap.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    scale = Math.min(cw / W, ch / H);
    if (!isFinite(scale) || scale <= 0) scale = 1;
    canvas.style.width = Math.floor(W * scale) + 'px';
    canvas.style.height = Math.floor(H * scale) + 'px';
    canvas.width = Math.floor(W * scale * dpr);
    canvas.height = Math.floor(H * scale * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  }

  function loop(now) {
    if (!game.last) game.last = now;
    var delta = now - game.last;
    game.last = now;
    if (delta > 250) delta = DT;          // a backgrounded tab must not fast-forward
    game.acc += delta;

    var guard = 0;
    while (game.acc >= DT && guard < 6) {
      game.step();
      game.acc -= DT;
      guard++;
    }
    game.render();
    requestAnimationFrame(loop);
  }

  /* The page can be embedded — in an artifact viewer, in an iframe on a
     site. Keyboard events only reach a document that HAS focus, so a game
     that just listens on window is silently dead until the player happens to
     click the right thing. Take focus on load and on every pointer press, and
     make the menus clickable so one press both focuses and chooses. */
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
    if (CF.Photos) CF.Photos.preload();
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
    });

    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
