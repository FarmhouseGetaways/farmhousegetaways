/* ==========================================================================
   Super Cat Fighter 6 — stage toolkit

   The parts every stage is built from: scrolling layers, swaying things,
   weather, light, and a crowd of cats who actually watch the fight.

   A stage is a stack of layers, each with a `depth`. Depth 0 never moves
   (sky), 1 moves exactly with the fighters (the floor they stand on), and
   anything above 1 is FOREGROUND — it passes in front of the cats and sells
   the whole illusion more than any amount of background detail does.
   ========================================================================== */
(function () {
  var U = CF.util;
  var W = 384, H = 224, FLOOR_Y = 172;

  /* ---- layers ------------------------------------------------------------ */

  /* Group a layer's drawing at a given depth.

     Deliberately does NOT translate the canvas. Translating would scroll the
     full-width pieces inside a layer — a wall, a porch rail, a roof beam —
     right off one edge and leave a gap at the other. Instead the depth is
     remembered, and `repeatX` inside the layer inherits it and works out its
     own screen positions. Full-width fills then stay full-width, and tiled
     elements still wrap forever. */
  var _depth = null;

  function layer(ctx, camX, depth, fn) {
    var prev = _depth;
    _depth = depth;
    ctx.save();
    fn(ctx);
    ctx.restore();
    _depth = prev;
  }

  /* Tile an element across a layer, giving each copy a stable index so it can
     have its own colour, height or phase without ever flickering. Pass depth
     0 inside a `layer` to inherit that layer's depth. */
  function repeatX(camX, depth, spacing, fn) {
    var d = (depth === 0 && _depth !== null) ? _depth : depth;
    var off = camX * d;
    var first = Math.floor(off / spacing) - 1;
    var n = Math.ceil(W / spacing) + 3;
    for (var i = first; i < first + n; i++) fn(i * spacing - off, i);
  }

  /* Deterministic pseudo-random from an integer — for per-element variation
     that stays put between frames. */
  function hash(i, salt) {
    var x = Math.sin(i * 127.1 + (salt || 0) * 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function sway(t, speed, amp, phase) {
    return Math.sin(t * speed + (phase || 0)) * amp;
  }

  /* ---- light ------------------------------------------------------------- */

  function sky(ctx, stops, top, bottom) {
    var g = ctx.createLinearGradient(0, top || 0, 0, bottom === undefined ? FLOOR_Y : bottom);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, (bottom === undefined ? FLOOR_Y : bottom) + 2);
  }

  function glow(ctx, x, y, r, color, alpha) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 0.5 : alpha;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* A shaft of light falling through a window or a gap in the roof. */
  function lightShaft(ctx, x, topW, botW, color, alpha, top, bottom) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createLinearGradient(0, top || 0, 0, bottom || FLOOR_Y);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - topW / 2, top || 0);
    ctx.lineTo(x + topW / 2, top || 0);
    ctx.lineTo(x + botW / 2, bottom || FLOOR_Y);
    ctx.lineTo(x - botW / 2, bottom || FLOOR_Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* Darken the corners. Cheap, and it pulls the eye to the middle where the
     fight is happening. */
  function vignette(ctx, strength) {
    var g = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.45, W * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,' + (strength === undefined ? 0.34 : strength) + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /* ---- landscape --------------------------------------------------------- */

  function hills(ctx, camX, depth, color, base, amp, seed) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y + 4);
    var off = camX * depth;
    for (var x = 0; x <= W; x += 6) {
      var wx = x + off;
      var y = base - Math.sin((wx + seed) * 0.010) * amp
                   - Math.sin((wx + seed) * 0.027) * amp * 0.45
                   - Math.sin((wx + seed) * 0.061) * amp * 0.18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, FLOOR_Y + 4);
    ctx.closePath();
    ctx.fill();
  }

  /* Jagged mountains rather than rolling hills. */
  function ridge(ctx, camX, depth, color, base, amp, seed) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y + 4);
    var off = camX * depth, step = 26;
    var first = Math.floor(off / step) - 1;
    for (var i = first; i < first + Math.ceil(W / step) + 3; i++) {
      var x = i * step - off;
      var y = base - hash(i, seed) * amp - Math.sin(i * 0.7 + seed) * amp * 0.3;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W + step, FLOOR_Y + 4);
    ctx.closePath();
    ctx.fill();
  }

  /* ---- ground ------------------------------------------------------------ */

  function ground(ctx, camX, near, far, lineAlpha) {
    var g = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
    g.addColorStop(0, far); g.addColorStop(1, near);
    ctx.fillStyle = g;
    ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    ctx.strokeStyle = 'rgba(0,0,0,' + (lineAlpha || 0.10) + ')';
    ctx.lineWidth = 1;
    repeatX(camX, 1, 48, function (x) {
      ctx.beginPath(); ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x - 30, H); ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(0,0,0,' + (lineAlpha || 0.10) * 0.6 + ')';
    for (var r = 1; r < 5; r++) {
      var y = FLOOR_Y + Math.pow(r / 5, 1.7) * (H - FLOOR_Y);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function planks(ctx, camX, near, far, gap) {
    var g = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
    g.addColorStop(0, far); g.addColorStop(1, near);
    ctx.fillStyle = g;
    ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1;
    for (var r = 1; r < 6; r++) {
      var y = FLOOR_Y + Math.pow(r / 6, 1.6) * (H - FLOOR_Y);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,.13)';
    repeatX(camX, 1, gap || 56, function (x) {
      ctx.beginPath(); ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x - 34, H); ctx.stroke();
    });
  }

  /* ---- trees ------------------------------------------------------------- */

  function tree(ctx, x, y, s, trunk, leaf, leaf2, t, phase) {
    var bend = sway(t, 0.013, 2.2 * s, phase);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = trunk;
    ctx.beginPath();
    ctx.moveTo(-2.4 * s, 0);
    ctx.quadraticCurveTo(-1.6 * s + bend * 0.4, -9 * s, bend, -17 * s);
    ctx.lineTo(bend + 2.4 * s, -17 * s);
    ctx.quadraticCurveTo(1.6 * s + bend * 0.4, -9 * s, 2.4 * s, 0);
    ctx.closePath(); ctx.fill();
    ctx.translate(bend, -17 * s);
    ctx.fillStyle = leaf;
    ctx.beginPath(); ctx.arc(0, -7 * s, 11.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-8.5 * s, -1 * s, 8.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8.5 * s, -2 * s, 9 * s, 0, Math.PI * 2); ctx.fill();
    if (leaf2) {
      ctx.fillStyle = leaf2;
      ctx.beginPath(); ctx.arc(-3 * s, -11 * s, 6.5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(6 * s, -7 * s, 5 * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /* ---- the crowd ---------------------------------------------------------

     Simplified cats — a body, a head, two ears, two eyes. They bob gently,
     turn to follow whoever last landed a hit, and jump up when something big
     happens. Deliberately not the full rig: a spectator that reads as much
     detail as a fighter competes with the fight.                            */

  var CROWD_COLOURS = [
    ['#b9b3a8', '#f2efe8'], ['#e09a55', '#f7e6cf'], ['#3c3c46', '#f0efe9'],
    ['#8a6a4f', '#f4e7d6'], ['#e8dcc8', '#f8f2e6'], ['#c98f4a', '#f6e6cd'],
    ['#6e6e7a', '#e8e6e0'], ['#d9b382', '#f7ead6']
  ];

  function spectator(ctx, x, yBase, s, idx, t, mood) {
    var pal = CROWD_COLOURS[Math.abs(idx) % CROWD_COLOURS.length];
    var phase = hash(idx, 3) * 6.28;
    var excite = mood || 0;

    /* idle bob, plus a hop when the crowd is excited */
    var bob = Math.sin(t * 0.06 + phase) * 1.1 * s;
    var hop = excite > 0.5
      ? Math.max(0, Math.sin(t * 0.22 + phase)) * 5.5 * s * excite
      : 0;
    var y = yBase - bob - hop;
    var lean = Math.sin(t * 0.03 + phase) * 0.06;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);

    /* tail, flicking */
    ctx.strokeStyle = pal[0];
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.2 * s;
    ctx.beginPath();
    ctx.moveTo(-4 * s, -2 * s);
    ctx.quadraticCurveTo(-9 * s, -6 * s - sway(t, 0.09, 2 * s, phase),
                         -8 * s, -12 * s + sway(t, 0.09, 2.5 * s, phase));
    ctx.stroke();

    /* body */
    ctx.fillStyle = pal[0];
    ctx.beginPath();
    ctx.ellipse(0, -5 * s, 5.2 * s, 6.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = pal[1];
    ctx.beginPath();
    ctx.ellipse(0.6 * s, -4 * s, 2.6 * s, 3.6 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    /* raised paws when cheering */
    if (excite > 0.5) {
      ctx.fillStyle = pal[0];
      var lift = Math.max(0, Math.sin(t * 0.22 + phase)) * 3 * s;
      ctx.beginPath(); ctx.arc(-4.6 * s, -11 * s - lift, 1.9 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(4.6 * s, -11 * s - lift, 1.9 * s, 0, Math.PI * 2); ctx.fill();
    }

    /* head */
    var hy = -13.5 * s;
    ctx.fillStyle = pal[0];
    ctx.beginPath(); ctx.moveTo(-4.4 * s, hy - 1 * s); ctx.lineTo(-3.1 * s, hy - 6.4 * s);
    ctx.lineTo(-0.7 * s, hy - 2.4 * s); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4.4 * s, hy - 1 * s); ctx.lineTo(3.1 * s, hy - 6.4 * s);
    ctx.lineTo(0.7 * s, hy - 2.4 * s); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0, hy, 4.6 * s, 0, Math.PI * 2); ctx.fill();

    /* eyes — wide open when something exciting is happening */
    var eo = 0.9 + excite * 0.7;
    ctx.fillStyle = 'rgba(24,18,16,.92)';
    ctx.beginPath(); ctx.ellipse(-1.7 * s, hy - 0.4 * s, 0.85 * s, 1.1 * s * eo, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(1.7 * s, hy - 0.4 * s, 0.85 * s, 1.1 * s * eo, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* ---- weather and ambience ----------------------------------------------

     One system, several looks. Particles live in a world-space band and wrap,
     so they parallax with their layer and never pop at the screen edge.     */

  function Particles(opts) {
    this.o = U.deepMerge({
      count: 24, kind: 'dust', depth: 0.6,
      band: [20, FLOOR_Y], span: W * 2,
      vx: 0.12, vy: 0.05, size: 1.6,
      color: 'rgba(255,240,210,.7)', color2: null,
      wobble: 1.0, speedVar: 0.6
    }, opts || {});
    var r = U.rng(opts && opts.seed || 12345);
    this.p = [];
    for (var i = 0; i < this.o.count; i++) {
      this.p.push({
        x: r() * this.o.span,
        y: this.o.band[0] + r() * (this.o.band[1] - this.o.band[0]),
        s: 0.55 + r() * 0.9,
        ph: r() * 6.28,
        sp: 1 - this.o.speedVar / 2 + r() * this.o.speedVar,
        rot: r() * 6.28
      });
    }
  }

  Particles.prototype.update = function () {
    var o = this.o;
    for (var i = 0; i < this.p.length; i++) {
      var q = this.p[i];
      q.x += o.vx * q.sp;
      q.y += o.vy * q.sp;
      q.rot += 0.03 * q.sp;
      if (q.x > o.span) q.x -= o.span;
      if (q.x < 0) q.x += o.span;
      if (q.y > o.band[1]) { q.y = o.band[0]; }
      if (q.y < o.band[0]) { q.y = o.band[1]; }
    }
  };

  Particles.prototype.draw = function (ctx, camX, t) {
    var o = this.o, off = camX * o.depth;
    ctx.save();
    for (var i = 0; i < this.p.length; i++) {
      var q = this.p[i];
      var x = ((q.x - off) % o.span + o.span) % o.span;
      if (x > W + 12) continue;
      var wob = Math.sin(t * 0.03 + q.ph) * o.wobble * 4;
      var y = q.y;
      var sz = o.size * q.s;

      if (o.kind === 'dust') {
        ctx.globalAlpha = 0.20 + 0.30 * (0.5 + 0.5 * Math.sin(t * 0.04 + q.ph));
        ctx.fillStyle = o.color;
        ctx.beginPath(); ctx.arc(x + wob, y, sz, 0, Math.PI * 2); ctx.fill();

      } else if (o.kind === 'firefly') {
        var pulse = 0.5 + 0.5 * Math.sin(t * 0.07 + q.ph * 3);
        ctx.globalAlpha = 0.16 * pulse;
        ctx.fillStyle = o.color2 || o.color;
        ctx.beginPath(); ctx.arc(x + wob, y, sz * 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.55 + 0.45 * pulse;
        ctx.fillStyle = o.color;
        ctx.beginPath(); ctx.arc(x + wob, y, sz, 0, Math.PI * 2); ctx.fill();

      } else if (o.kind === 'petal') {
        ctx.globalAlpha = 0.85;
        ctx.save();
        ctx.translate(x + wob, y);
        ctx.rotate(q.rot);
        ctx.fillStyle = (i % 3 === 0 && o.color2) ? o.color2 : o.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, sz * 1.9, sz * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

      } else if (o.kind === 'ember') {
        var life = (0.5 + 0.5 * Math.sin(t * 0.05 + q.ph));
        ctx.globalAlpha = 0.35 + 0.55 * life;
        ctx.fillStyle = life > 0.6 ? (o.color2 || o.color) : o.color;
        ctx.beginPath(); ctx.arc(x + wob * 1.6, y, sz * (0.6 + life * 0.6), 0, Math.PI * 2); ctx.fill();

      } else if (o.kind === 'sparkle') {
        var tw = Math.sin(t * 0.11 + q.ph * 5);
        if (tw < 0.3) continue;
        ctx.globalAlpha = tw;
        ctx.strokeStyle = o.color;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(x - sz * 2, y); ctx.lineTo(x + sz * 2, y);
        ctx.moveTo(x, y - sz * 2); ctx.lineTo(x, y + sz * 2);
        ctx.stroke();

      } else if (o.kind === 'moth') {
        var flap = Math.sin(t * 0.5 + q.ph) * 0.8;
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = o.color;
        ctx.save();
        ctx.translate(x + wob * 2, y + Math.sin(t * 0.05 + q.ph) * 3);
        ctx.beginPath(); ctx.ellipse(-sz, 0, sz * 1.4, sz * (0.5 + flap * 0.5), -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(sz, 0, sz * 1.4, sz * (0.5 + flap * 0.5), 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

      } else if (o.kind === 'bubble') {
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = o.color; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.arc(x + wob, y, sz * 1.5, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();
  };

  /* ---- small living things ------------------------------------------------ */

  /* A chicken that walks, stops, pecks, and walks on. */
  function chicken(ctx, x, y, s, t, phase, body, comb) {
    var cyc = (t * 0.012 + phase) % 1;
    var walking = cyc < 0.62;
    var step = walking ? Math.sin(t * 0.22 + phase * 9) : 0;
    var peck = walking ? 0 : Math.max(0, Math.sin((cyc - 0.62) / 0.38 * Math.PI * 3)) * 4 * s;

    ctx.save();
    ctx.translate(x, y);
    /* legs */
    ctx.strokeStyle = '#d9a441'; ctx.lineWidth = 1.1 * s; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-0.8 * s, -2.6 * s); ctx.lineTo(-0.8 * s + step * 1.4 * s, 0);
    ctx.moveTo(1.2 * s, -2.6 * s); ctx.lineTo(1.2 * s - step * 1.4 * s, 0);
    ctx.stroke();
    /* body */
    ctx.fillStyle = body || '#f4efe4';
    ctx.beginPath(); ctx.ellipse(0, -5.4 * s, 4.4 * s, 3.6 * s, 0, 0, Math.PI * 2); ctx.fill();
    /* tail */
    ctx.beginPath();
    ctx.moveTo(-3.6 * s, -6 * s); ctx.lineTo(-6.6 * s, -9.4 * s); ctx.lineTo(-2.8 * s, -7.6 * s);
    ctx.closePath(); ctx.fill();
    /* head */
    var hx = 3.4 * s, hy = -9.4 * s + peck;
    ctx.beginPath(); ctx.arc(hx, hy, 2.3 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = comb || '#d8453a';
    ctx.beginPath(); ctx.arc(hx - 0.4 * s, hy - 2.4 * s, 1.1 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a33c';
    ctx.beginPath();
    ctx.moveTo(hx + 2 * s, hy); ctx.lineTo(hx + 4.2 * s, hy + 0.6 * s); ctx.lineTo(hx + 2 * s, hy + 1.3 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#241c18';
    ctx.beginPath(); ctx.arc(hx + 0.9 * s, hy - 0.5 * s, 0.5 * s, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* A distant bird, flapping, crossing the sky. */
  function bird(ctx, x, y, s, t, phase, color) {
    var flap = Math.sin(t * 0.16 + phase);
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color || 'rgba(40,40,60,.65)';
    ctx.lineWidth = 1.1 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3.4 * s, flap * 1.8 * s);
    ctx.quadraticCurveTo(-1.4 * s, -1.6 * s * flap - 0.6 * s, 0, 0);
    ctx.quadraticCurveTo(1.4 * s, -1.6 * s * flap - 0.6 * s, 3.4 * s, flap * 1.8 * s);
    ctx.stroke();
    ctx.restore();
  }

  /* Steam, smoke or mist rising from a point. */
  function plume(ctx, x, y, t, opts) {
    opts = opts || {};
    var n = opts.count || 6;
    ctx.save();
    ctx.globalCompositeOperation = opts.dark ? 'source-over' : 'lighter';
    for (var i = 0; i < n; i++) {
      var k = ((t * (opts.speed || 0.012) + i / n) % 1);
      var yy = y - k * (opts.rise || 46);
      var xx = x + Math.sin(k * 5 + i) * (opts.drift || 9) * k;
      var r = (opts.size || 5) * (0.5 + k * 1.7);
      ctx.globalAlpha = (opts.alpha || 0.28) * (1 - k) * (k < 0.12 ? k / 0.12 : 1);
      ctx.fillStyle = opts.color || 'rgba(255,255,255,.9)';
      ctx.beginPath(); ctx.arc(xx, yy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /* Animated water: a band with moving highlights and a caustic shimmer. */
  function water(ctx, x, y, w, h, t, deep, shallow, hi) {
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, shallow); g.addColorStop(1, deep);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.strokeStyle = hi || 'rgba(255,255,255,.55)';
    ctx.lineWidth = 1;
    for (var r = 0; r < 6; r++) {
      var wy = y + 1.5 + r * (h / 7);
      ctx.globalAlpha = 0.20 + 0.30 * Math.sin(t * 0.05 + r);
      ctx.beginPath();
      for (var px = x; px <= x + w; px += 5) {
        ctx.lineTo(px, wy + Math.sin((px + t * 1.5 + r * 26) * 0.055) * 1.2);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---- variety ------------------------------------------------------------

     A row of identical things is the thing that makes a background look
     cheap, and it is what every one of these stages was doing: the same
     cabinet seven times, the same bush eleven times. These take the stable
     hash and turn it into per-instance difference — a size, a tilt, a colour,
     a choice of which of four things this one is. Stable between frames,
     because a prop that changes shape as the camera moves is worse than a
     repeated one. */
  /* Where a fixed thing in the world lands on screen at this depth. Repeated
     props are what a `repeatX` is for; a landmark needs to stay put, and a
     stage without one is a strip of wallpaper. */
  function at(camX, depth, worldX) { return worldX - camX * depth; }

  function vary(i, salt, lo, hi) { return lo + hash(i, salt) * (hi - lo); }
  function pick(i, salt, arr) { return arr[Math.floor(hash(i, salt) * arr.length) % arr.length]; }
  function chance(i, salt, p) { return hash(i, salt) < p; }

  /* ---- light on the floor -------------------------------------------------

     The band the fighters stand on was a flat gradient in every stage, which
     is most of why they read as a backdrop with a carpet in front of it.
     A pool of light gives the floor somewhere to be, and puts the fight in
     the middle of the picture rather than on top of it. */
  function floorPool(ctx, cx, w, colour, alpha) {
    var g = ctx.createRadialGradient(cx, FLOOR_Y + 6, 2, cx, FLOOR_Y + 6, w);
    g.addColorStop(0, colour);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 0.5 : alpha;
    ctx.fillStyle = g;
    ctx.fillRect(0, FLOOR_Y - 10, W, H - FLOOR_Y + 10);
    ctx.restore();
  }

  /* Grit, gravel, crumbs — whatever the floor of this place would have on it.
     Twenty specks kill more of the "flat carpet" feeling than any amount of
     gradient. */
  function litter(ctx, camX, depth, spacing, colours, sizeLo, sizeHi) {
    repeatX(camX, depth, spacing, function (x, i) {
      var n = 2 + Math.floor(hash(i, 5) * 3);
      for (var q = 0; q < n; q++) {
        var yy = FLOOR_Y + 4 + hash(i * 7 + q, 6) * (H - FLOOR_Y - 8);
        var r = vary(i * 7 + q, 7, sizeLo, sizeHi);
        ctx.fillStyle = pick(i * 7 + q, 8, colours);
        ctx.beginPath();
        ctx.ellipse(x + hash(i * 7 + q, 9) * spacing, yy, r, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  /* A crowd that is not one cat printed eleven times: each gets its own size,
     colour, bob and a chance of doing something. */
  function crowdRow(ctx, camX, depth, spacing, yBase, t, mood, opts) {
    opts = opts || {};
    var salt = opts.seed || 0;
    layer(ctx, camX, depth, function () {
      repeatX(camX, 0, spacing, function (x, i) {
        if (chance(i, salt + 1, opts.gap === undefined ? 0.18 : opts.gap)) return;
        var sc = vary(i, salt + 2, opts.min || 0.72, opts.max || 1.12);
        var yy = yBase + vary(i, salt + 3, -2, 2);
        spectator(ctx, x + vary(i, salt + 4, -4, 4), yy, sc,
                  Math.abs(Math.floor(hash(i, salt + 5) * 997)), t + i * 13, mood);
      });
    });
  }

  /* A shape drawn with a heavy dark edge, the way every prop in a Street
     Fighter II background is: a solid mass with a rim, not a flat fill. */
  function prop(ctx, path, fill, edge, edgeW) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    path(ctx);
    ctx.fillStyle = fill;
    ctx.fill();
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = edgeW || 1.4;
      ctx.stroke();
    }
    ctx.restore();
  }

  /* Warm light falling out of a window or a doorway, onto whatever is under
     it. Cheap, and it does more for depth than another parallax layer. */
  function spill(ctx, x, y, w, h, colour, alpha) {
    var g = ctx.createLinearGradient(x, y, x - w * 0.4, y + h);
    g.addColorStop(0, colour);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 0.35 : alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w * 0.55, y + h);
    ctx.lineTo(x - w * 0.45, y + h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /* Real grain on the floor.

     The floor in the reference is not a gradient — it is planks with strong
     grain, knots, and boards that are not all the same colour. It is a third
     of the picture and it was the flattest part of every stage here. */
  function grain(ctx, camX, boardW, tones, lineAlpha) {
    var g = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
    g.addColorStop(0, tones[0]); g.addColorStop(1, tones[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

    /* boards receding, each its own shade */
    repeatX(camX, 1, boardW, function (x, i) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x + boardW, FLOOR_Y);
      ctx.lineTo(x + boardW - boardW * 0.62, H); ctx.lineTo(x - boardW * 0.62, H);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,' + vary(i, 200, 0, 0.09).toFixed(3) + ')';
      ctx.fillRect(x - boardW, FLOOR_Y, boardW * 3, H - FLOOR_Y);
      /* grain lines following the board */
      ctx.strokeStyle = 'rgba(0,0,0,' + (lineAlpha || 0.09) + ')';
      ctx.lineWidth = 1;
      for (var q = 0; q < 4; q++) {
        var f = (q + 1) / 5;
        ctx.beginPath();
        ctx.moveTo(x + boardW * f, FLOOR_Y);
        ctx.bezierCurveTo(x + boardW * (f + vary(i * 4 + q, 201, -0.1, 0.1)), FLOOR_Y + 18,
                          x + boardW * (f - 0.3), FLOOR_Y + 34,
                          x + boardW * (f - 0.62), H);
        ctx.stroke();
      }
      /* a knot on some boards */
      if (chance(i, 202, 0.3)) {
        var ky = FLOOR_Y + vary(i, 203, 8, H - FLOOR_Y - 8);
        var kx = x + boardW * vary(i, 204, 0.2, 0.8) - (ky - FLOOR_Y) * 0.62 * (boardW / boardW);
        ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(kx, ky, 3.4, 2, 0.3, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(kx, ky, 1.6, 1, 0.3, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    });
    /* the board joints across */
    ctx.strokeStyle = 'rgba(0,0,0,' + (lineAlpha || 0.09) * 1.8 + ')';
    for (var r = 1; r < 5; r++) {
      var y = FLOOR_Y + Math.pow(r / 5, 1.7) * (H - FLOOR_Y);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  CF.StageKit = {
    W: W, H: H, FLOOR_Y: FLOOR_Y,
    layer: layer, repeatX: repeatX, hash: hash, sway: sway,
    vary: vary, pick: pick, chance: chance, at: at,
    floorPool: floorPool, litter: litter, crowdRow: crowdRow, prop: prop, spill: spill,
    grain: grain,
    sky: sky, glow: glow, lightShaft: lightShaft, vignette: vignette,
    hills: hills, ridge: ridge, ground: ground, planks: planks, tree: tree,
    spectator: spectator, Particles: Particles,
    chicken: chicken, bird: bird, plume: plume, water: water,
    CROWD_COLOURS: CROWD_COLOURS
  };
})();
