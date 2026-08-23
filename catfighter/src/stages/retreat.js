/* =======================================================================
   4 — MOUNTAIN RETREAT
   Night on the granite. A moon you could climb, a lit cabin, campfires,
   fireflies, mist off the cold rock. The quiet one — quiet is not the
   same as empty, and the first version of this stage confused the two.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  /* Where the light in this picture comes from. Everything on the stage is
     shaded off this one point, because a night scene with two light sources
     is a night scene with none. */
  var MOON_X = 150, MOON_Y = 46, MOON_R = 31;

  /* ---- bats over the moon ------------------------------------------------
     The stage blurb has promised bats since the day it was written and there
     were never any. They are the loop you wait for: a loose skein crossing
     right to left, dark against the disc, taking about eleven seconds to
     clear the frame. Silhouettes only would have made them invisible over
     the sky, so each one carries a thread of moonlight along the top of the
     wing — the same trick as the rock. */
  function bats(ctx, t) {
    var span = W + 200;
    for (var i = 0; i < 8; i++) {
      var sp = 0.44 + K.hash(i, 61) * 0.18;
      var x = W + 100 - ((t * sp + i * 51) % span);
      if (x < -20 || x > W + 20) continue;
      var y = 30 + K.hash(i, 62) * 46 + Math.sin(t * 0.032 + i * 1.9) * 8;
      var s = 0.9 + K.hash(i, 63) * 1.0;
      var flap = Math.sin(t * 0.36 + i * 2.1);
      var tip = -3.2 * s + flap * 3.4 * s;

      ctx.beginPath();
      ctx.moveTo(x - 6.5 * s, y + tip);
      ctx.quadraticCurveTo(x - 3 * s, y + 1.4 * s, x - 1.4 * s, y + 0.4 * s);
      ctx.lineTo(x + 1.4 * s, y + 0.4 * s);
      ctx.quadraticCurveTo(x + 3 * s, y + 1.4 * s, x + 6.5 * s, y + tip);
      ctx.quadraticCurveTo(x + 2.6 * s, y - 0.8 * s, x, y - 1.6 * s);
      ctx.quadraticCurveTo(x - 2.6 * s, y - 0.8 * s, x - 6.5 * s, y + tip);
      ctx.closePath();
      ctx.fillStyle = '#0a0c1e';
      ctx.fill();
      ctx.strokeStyle = 'rgba(198,214,255,.30)';
      ctx.lineWidth = Math.max(1, 0.8 * s);
      ctx.beginPath();
      ctx.moveTo(x - 6.5 * s, y + tip);
      ctx.quadraticCurveTo(x - 2.6 * s, y - 0.8 * s, x, y - 1.6 * s);
      ctx.quadraticCurveTo(x + 2.6 * s, y - 0.8 * s, x + 6.5 * s, y + tip);
      ctx.stroke();
    }
  }

  /* A shooting star, roughly every fifteen seconds. Derived straight from
     the clock rather than kept in a field: the old `this.shoot` object was
     initialised and then never read by anything, which is how you end up
     with a promise in the blurb and nothing on the screen. */
  function shootingStar(ctx, t) {
    var period = 880, k = (t % period) / 46;
    if (k > 1) return;
    var n = Math.floor(t / period);
    var sx = 40 + K.hash(n, 71) * 260, sy = 12 + K.hash(n, 72) * 34;
    var ex = sx + 110, ey = sy + 54;
    var hx = sx + (ex - sx) * k, hy = sy + (ey - sy) * k;
    var g = ctx.createLinearGradient(hx, hy, hx - 46, hy - 23);
    var a = Math.sin(k * Math.PI);
    g.addColorStop(0, 'rgba(255,255,240,' + (0.9 * a).toFixed(2) + ')');
    g.addColorStop(1, 'rgba(255,255,240,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - 46, hy - 23); ctx.stroke();
  }

  /* An owl on a long crossing, in front of the pines. Slow glide, two beats
     at each end of it. The kind of thing you only catch the third time you
     fight here, which is exactly what it is for. */
  function owl(ctx, t) {
    var period = 660, k = (t % period) / 300;
    if (k > 1) return;
    var x = W + 30 - k * (W + 60);
    var y = 108 + Math.sin(k * Math.PI * 1.4) * -16 + Math.sin(t * 0.05) * 1.5;
    var beat = (k < 0.18 || k > 0.74) ? Math.sin(t * 0.28) : Math.sin(t * 0.06) * 0.25;
    ctx.fillStyle = '#191a2e';
    ctx.beginPath();
    ctx.moveTo(x - 13, y + beat * 5);
    ctx.quadraticCurveTo(x - 5, y - 2.5, x, y - 1);
    ctx.quadraticCurveTo(x + 5, y - 2.5, x + 13, y + beat * 5);
    ctx.quadraticCurveTo(x + 4, y + 3, x, y + 3.4);
    ctx.quadraticCurveTo(x - 4, y + 3, x - 13, y + beat * 5);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b2c46';
    ctx.beginPath(); ctx.ellipse(x, y + 0.6, 3.4, 3, 0, 0, Math.PI * 2); ctx.fill();
  }

  /* ---- the floor ---------------------------------------------------------
     Granite slabs, not a grey band. K.grain draws boards and this is rock,
     so the joints run the other way: long cracks converging on the vanishing
     point, each slab its own shade, quartz picking up the moon. The floor is
     a third of the picture and it was the flattest part of the stage. */
  function graniteFloor(ctx, camX) {
    var g = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
    g.addColorStop(0, '#565169');
    g.addColorStop(0.55, '#484461');
    g.addColorStop(1, '#332f46');
    ctx.fillStyle = g;
    ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

    var BW = 62;
    K.repeatX(camX, 1, BW, function (x, i) {
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x + BW, FLOOR_Y);
      ctx.lineTo(x + BW * 0.36, H); ctx.lineTo(x - BW * 0.64, H);
      ctx.closePath();
      var tint = K.vary(i, 210, -0.055, 0.075);
      ctx.fillStyle = tint < 0
        ? 'rgba(0,0,0,' + (-tint).toFixed(3) + ')'
        : 'rgba(226,234,255,' + tint.toFixed(3) + ')';
      ctx.fill();
      /* the crack down the joint, and a hairline branching off it */
      ctx.strokeStyle = 'rgba(12,10,22,.42)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x - BW * 0.64, H); ctx.stroke();
      if (K.chance(i, 211, 0.55)) {
        var f = K.vary(i, 212, 0.3, 0.7);
        var jy = FLOOR_Y + f * (H - FLOOR_Y);
        ctx.strokeStyle = 'rgba(12,10,22,.26)';
        ctx.beginPath();
        ctx.moveTo(x - BW * 0.64 * f, jy);
        ctx.lineTo(x + K.vary(i, 213, 14, 40), jy + K.vary(i, 214, 4, 14));
        ctx.stroke();
      }
    });
    /* three joints running across, tightening towards the horizon */
    ctx.strokeStyle = 'rgba(12,10,22,.30)';
    for (var r = 1; r < 4; r++) {
      var y = FLOOR_Y + Math.pow(r / 4, 1.7) * (H - FLOOR_Y);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  CF.StageDefs = CF.StageDefs || {};
  CF.StageDefs.retreat = {
    id: 'retreat', name: 'MOUNTAIN RETREAT',
    blurb: 'Night on the granite. Firelight, fireflies, and bats over the moon.',
    /* The colour of the air here — see K.deepen.
       Haze was 0.24, and on a NIGHT stage that is backwards. Haze pulls the
       mid-ground towards `air`, and `air` is a mid-blue, so 24 percent of it
       LIFTED the pines and the ridge into the same value band as a dark cat:
       the backdrop where the fighters stand measured 46 out of 255 against
       Lilly's own median of 57, and at 1x her legs and tail simply went into
       the trees. On a night stage the air has to be darker than the objects
       standing in it, so the haze is down to a tenth and the pines and the
       ridges have each come down a step to match.

       floorDark is up as well, from 0.24 to 0.38. That band — 22 pixels above
       the floor line — is exactly where a cat's shins and feet are, and it
       measured BRIGHTER than the rest of the backdrop, so a dark-legged cat
       lost her legs and stood on stumps. It stays narrow, because a narrow
       dark band reads as contact and a wide one reads as fog.

       `back` is set at all here — most stages take the 0.26 default — because
       the four changes above got the band from 46 to 36 and the last four
       points had to come out of the picture as a whole rather than out of any
       one object. It multiplies towards black instead of washing towards
       grey, so the stage lost brightness and kept its contrast: the moon, the
       cabin windows and the campfires are still the only bright things in
       frame, and the backdrop now sits at 32 against Lilly's 57. */
    air: { air: '#3b4a74', haze: 0.10, floorDark: 0.38, back: 0.34,
           horizon: 130 },
    init: function () {
      this.flies = new P({ count: 26, kind: 'firefly', depth: 0.8, seed: 44,
                           band: [96, FLOOR_Y + 14], vx: 0.07, vy: -0.03,
                           size: 1.15, color: 'rgba(198,255,150,1)',
                           color2: 'rgba(150,255,110,1)', wobble: 2.6 });
      this.embers = new P({ count: 16, kind: 'ember', depth: 0.72, seed: 45,
                            band: [96, FLOOR_Y - 8], vx: 0.05, vy: -0.30,
                            size: 1.2, color: 'rgba(255,120,50,1)',
                            color2: 'rgba(255,220,140,1)', wobble: 1.6 });
    },
    drawBack: function (ctx, camX, t, mood) {
      /* The horizon glow used to run up to #5b4468, and that turned out to be
         the single brightest thing in the band the fighters stand in — a
         purple wash at value 75 behind their shoulders. Pretty on its own and
         the wrong end of the scale for a night stage: the moon is meant to be
         the only place the eye rests. Both lower stops are down about a third,
         which keeps the warmth in the horizon without lifting it. */
      K.sky(ctx, [[0, '#080c26'], [0.42, '#151a3c'], [0.78, '#272045'], [1, '#3b2b49']], 0, 150);

      /* stars, of three different brightnesses, some of them twinkling */
      K.layer(ctx, camX, 0.03, function () {
        K.repeatX(camX, 0, 13, function (x, i) {
          var n = 1 + Math.floor(K.hash(i, 110) * 2);
          for (var q = 0; q < n; q++) {
            var sy = K.vary(i * 3 + q, 111, 4, 132);
            var br = K.vary(i * 3 + q, 112, 0.25, 0.95);
            if (K.chance(i * 3 + q, 113, 0.2)) br *= 0.5 + 0.5 * Math.sin(t * 0.06 + i + q);
            ctx.fillStyle = 'rgba(255,250,235,' + br.toFixed(2) + ')';
            var sz = K.vary(i * 3 + q, 114, 0.5, 1.5);
            ctx.fillRect(x + q * 5, sy, sz, sz);
          }
        });
      });
      shootingStar(ctx, t);

      /* THE MOON. It was nineteen pixels across, which at this resolution is
         a coin, not a moon. At thirty-one it is the brightest thing in the
         picture and the only place the eye can rest between the two dark
         masses — and it gives the bats something to be seen against. */
      /* The halo was 0.36 over a 96-pixel radius, which reaches y=142 — the
         middle of the picture, and it was quietly lifting the whole band the
         fighters stand in. Down to 0.26 and pulled in a little: the disc is
         still the brightest thing on the stage and now it is the ONLY bright
         thing up there, which is what makes it read as the light source
         rather than as a lamp behind frosted glass. */
      K.glow(ctx, MOON_X, MOON_Y, MOON_R * 2.6, 'rgba(206,222,255,.75)', 0.26);
      ctx.fillStyle = '#f2f5ff';
      ctx.beginPath(); ctx.arc(MOON_X, MOON_Y, MOON_R, 0, Math.PI * 2); ctx.fill();
      /* the terminator: a sliver of the disc in shadow down the far side,
         so it reads as a sphere and not a hole punched in the sky */
      ctx.save();
      ctx.beginPath(); ctx.arc(MOON_X, MOON_Y, MOON_R, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#cfd7ee';
      ctx.beginPath();
      ctx.arc(MOON_X + 7, MOON_Y + 4, MOON_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(150,160,192,.55)';
      [[8, -8, 6.4], [-9, 7, 4.4], [3, 12, 3.2], [-6, -11, 3.0], [14, 6, 2.6]]
        .forEach(function (c) {
          ctx.beginPath();
          ctx.arc(MOON_X + c[0], MOON_Y + c[1], c[2], 0, Math.PI * 2);
          ctx.fill();
        });
      ctx.restore();
      bats(ctx, t);

      /* an aurora, slow enough that you only notice it if you look */
      K.layer(ctx, camX, 0.045, function () {
        for (var a2 = 0; a2 < 3; a2++) {
          ctx.beginPath();
          for (var x2 = -20; x2 <= W + 20; x2 += 12) {
            var yy = 34 + a2 * 14 + Math.sin(x2 * 0.014 + t * 0.006 + a2) * 16;
            if (x2 === -20) ctx.moveTo(x2, yy); else ctx.lineTo(x2, yy);
          }
          ctx.strokeStyle = ['rgba(90,220,180,.19)', 'rgba(120,180,255,.15)',
                             'rgba(170,130,235,.12)'][a2];
          ctx.lineWidth = 15 + a2 * 6;
          ctx.stroke();
        }
      });

      /* --- two ranges: snow catching the moon, then the black wall in
             front of it. One ridge alone reads as a cardboard cut-out. --- */
      K.layer(ctx, camX, 0.07, function () {
        K.ridge(ctx, camX, 0.07, '#2a3057', 132, 52, 5);
        /* snow on the tops, offset up-right towards the moon */
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, 132); ctx.clip();
        ctx.globalAlpha = 0.5;
        K.ridge(ctx, camX, 0.07, '#7183b4', 128, 52, 5);
        ctx.restore();
      });
      K.ridge(ctx, camX, 0.14, '#131934', 152, 34, 17);

      /* --- THE MONOLITH: a granite tor most of the height of the picture,
             with a fall of water down the near face of it. It used to be a
             flat grey triangle 90 wide with a 7% wash on one side; the whole
             left of the stage was dead. It is painted now, so the moon is
             genuinely on one side of it, and it goes off the top of the
             frame — a landmark you can see the whole of is a prop. --- */
      K.layer(ctx, camX, 0.2, function () {
        var mx = K.at(camX, 0, 52) - camX * 0.03;
        var body = function (c) {
          c.beginPath();
          c.moveTo(mx - 96, FLOOR_Y + 6);
          c.lineTo(mx - 78, 104);
          c.lineTo(mx - 56, 46);
          c.lineTo(mx - 24, 8);
          c.lineTo(mx + 4, 30);
          c.lineTo(mx + 20, 86);
          c.lineTo(mx + 46, 126);
          c.lineTo(mx + 58, FLOOR_Y + 6);
          c.closePath();
        };
        /* Lit from the right, because that is where the moon is — but by
           hand, not through K.paint. K.paint shifts the base tone over the
           shadow by a couple of pixels, which is exactly right on a crate
           and useless on something a hundred and fifty pixels tall: the
           shifted copies cover the whole shape and all you get back is the
           highlight tone, flat. The first go at this rock came out as a
           sheet of pale grey. A big mass wants explicit facets. */
        body(ctx);
        ctx.fillStyle = '#16132a';                 /* the face turned away */
        ctx.fill();
        ctx.save();
        body(ctx); ctx.clip();
        ctx.fillStyle = '#242137';                 /* the moonward flank */
        ctx.beginPath();
        ctx.moveTo(mx - 24, 8); ctx.lineTo(mx + 4, 30); ctx.lineTo(mx + 20, 86);
        ctx.lineTo(mx + 46, 126); ctx.lineTo(mx + 58, FLOOR_Y + 6);
        ctx.lineTo(mx - 14, FLOOR_Y + 6); ctx.lineTo(mx - 30, 60);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#453f5e';                 /* the crown, full moon on it */
        ctx.beginPath();
        ctx.moveTo(mx - 24, 8); ctx.lineTo(mx + 4, 30); ctx.lineTo(mx - 6, 52);
        ctx.lineTo(mx - 34, 34); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#100d1e';                 /* the gully down the middle */
        ctx.beginPath();
        ctx.moveTo(mx - 30, 60); ctx.lineTo(mx - 14, FLOOR_Y + 6);
        ctx.lineTo(mx - 30, FLOOR_Y + 6); ctx.lineTo(mx - 44, 66);
        ctx.closePath(); ctx.fill();

        /* Strata. Without them this is a pale wedge — three facets is enough
           to say "solid" and not nearly enough to say "granite". Each ledge
           is a dark underside with one lit pixel-row on top of it, which is
           the whole of how the reference draws a cliff: the light lands on
           the horizontal and misses the vertical. */
        for (var lb = 0; lb < 5; lb++) {
          var ly2 = 40 + lb * 27;
          var lw = 24 + lb * 11;
          ctx.fillStyle = 'rgba(10,8,20,.34)';
          ctx.beginPath();
          ctx.moveTo(mx - lw * 0.4, ly2);
          ctx.lineTo(mx + lw * 0.6, ly2 + 5);
          ctx.lineTo(mx + lw * 0.6, ly2 + 9);
          ctx.lineTo(mx - lw * 0.4, ly2 + 4);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(198,214,255,.11)';
          ctx.beginPath();
          ctx.moveTo(mx - lw * 0.4, ly2 - 2);
          ctx.lineTo(mx + lw * 0.6, ly2 + 3);
          ctx.lineTo(mx + lw * 0.6, ly2 + 5);
          ctx.lineTo(mx - lw * 0.4, ly2);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        body(ctx);
        ctx.strokeStyle = '#0c0a18'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
        ctx.stroke();
        /* the moon catching the edge that faces it. One line, and it is the
           difference between a rock standing in front of the sky and a hole
           cut out of the sky. */
        ctx.strokeStyle = 'rgba(206,220,255,.42)'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(mx - 24, 8); ctx.lineTo(mx + 4, 30);
        ctx.lineTo(mx + 20, 86); ctx.lineTo(mx + 46, 126);
        ctx.stroke();
        /* the fracture lines that make it granite rather than a wedge */
        ctx.save();
        body(ctx); ctx.clip();
        ctx.strokeStyle = 'rgba(8,8,20,.38)'; ctx.lineWidth = 1.3;
        for (var c2 = 0; c2 < 3; c2++) {
          ctx.beginPath();
          ctx.moveTo(mx - 58 + c2 * 34, 26 + c2 * 22);
          ctx.lineTo(mx - 80 + c2 * 36, FLOOR_Y);
          ctx.stroke();
        }
        ctx.restore();

        /* the fall — a broad ribbon with a bright core, and spray where it
           lands. Three widths rather than one line: a 3px stroke reads as a
           wire, and water at this scale is a shape. */
        var fx = mx + 2;
        [[0.9, 'rgba(140,172,230,.34)'], [0.55, 'rgba(196,220,255,.55)'],
         [0.16, 'rgba(244,250,255,.9)']].forEach(function (band) {
          ctx.fillStyle = band[1];
          ctx.beginPath();
          var wy;
          /* down one side and back up the other, widening as it falls —
             a stroke of constant width reads as a wire, which is what the
             first version of this was */
          for (wy = 58; wy < FLOOR_Y - 4; wy += 6) {
            var k2 = (wy - 58) / (FLOOR_Y - 62);
            var wob = Math.sin(wy * 0.13 + t * 0.09) * 1.8;
            ctx.lineTo(fx + wob - (2.2 + k2 * 5.5) * band[0], wy);
          }
          for (wy = FLOOR_Y - 4; wy > 58; wy -= 6) {
            var k3 = (wy - 58) / (FLOOR_Y - 62);
            var wob2 = Math.sin(wy * 0.13 + t * 0.09) * 1.8;
            ctx.lineTo(fx + wob2 + (2.2 + k3 * 5.5) * band[0], wy);
          }
          ctx.closePath(); ctx.fill();
        });
        K.plume(ctx, fx, FLOOR_Y - 12, t, { count: 5, rise: 26, drift: 7,
                                            size: 5, alpha: 0.22,
                                            color: 'rgba(206,226,255,.9)' });
        K.glow(ctx, fx, FLOOR_Y - 10, 30, 'rgba(190,220,255,.7)', 0.20);
      });

      /* --- pines, in two bands at different rates, each its own height --- */
      K.layer(ctx, camX, 0.24, function () {
        K.repeatX(camX, 0, 19, function (x, i) {
          if (K.chance(i, 130, 0.14)) return;
          var ph = K.vary(i, 131, 26, 54), pw = ph * K.vary(i, 132, 0.24, 0.34);
          ctx.fillStyle = K.pick(i, 133, ['#121831', '#151c39', '#0e1329']);
          ctx.beginPath();
          ctx.moveTo(x, 158 - ph);
          ctx.lineTo(x - pw, 160); ctx.lineTo(x + pw, 160);
          ctx.closePath(); ctx.fill();
        });
      });
      owl(ctx, t);
      K.layer(ctx, camX, 0.32, function () {
        K.repeatX(camX, 0, 25, function (x, i) {
          if (K.chance(i, 115, 0.18)) return;
          var ph = K.vary(i, 116, 44, 92), pw = ph * K.vary(i, 117, 0.20, 0.30);
          var col = K.pick(i, 118, ['#0a0e1e', '#0d1226', '#070b19']);
          /* three tiers rather than one triangle — a pine is a stack of
             skirts and the notches are what stop a row of them reading as
             bunting */
          ctx.fillStyle = col;
          for (var tier = 0; tier < 3; tier++) {
            var f = tier / 3;
            var ty = 164 - ph * (1 - f * 0.62);
            var tw = pw * (0.42 + f * 0.58);
            ctx.beginPath();
            ctx.moveTo(x, ty);
            ctx.lineTo(x - tw, ty + ph * 0.42);
            ctx.lineTo(x + tw, ty + ph * 0.42);
            ctx.closePath(); ctx.fill();
          }
          /* Moonlight down the right-hand edge of the nearer ones. Lifted
             from .16 to .28 when the pine mass itself came down a step: a
             near-black tree needs the edge to keep its shape, and an edge is
             one pixel wide so it costs nothing in the value of the band —
             which was the whole point of darkening them. */
          ctx.strokeStyle = 'rgba(150,172,225,.28)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 1, 164 - ph); ctx.lineTo(x + pw * 0.9, 164 - ph * 0.16);
          ctx.stroke();
        });
      });

      /* --- THE CABIN. Warm light in a cold picture is the strongest
             landmark there is, and this one was too small to do the job:
             a hundred pixels of it at the very edge of frame, half cropped.
             It is now a third of the width and half the height, up on its
             own granite shelf, and it drifts a little so it is not a decal
             stuck to the glass. --- */
      K.layer(ctx, camX, 0.42, function () {
        var hx = K.at(camX, 0, 306) - camX * 0.05;
        var flick = 0.78 + 0.22 * Math.sin(t * 0.13) * Math.sin(t * 0.31);

        /* the shelf it stands on, so it is not floating on the floor line */
        K.mass(ctx, hx - 104, 158, 190, 20, '#2c2a3d', { top: 4, side: 6, foot: false });

        /* the stone chimney, up the near end */
        K.mass(ctx, hx + 58, 52, 24, 112, '#3e3a4d', { top: 4, side: 5, foot: false });
        ctx.strokeStyle = 'rgba(0,0,0,.32)'; ctx.lineWidth = 1;
        for (var st2 = 0; st2 < 9; st2++) {
          ctx.beginPath();
          ctx.moveTo(hx + 58, 62 + st2 * 12); ctx.lineTo(hx + 82, 62 + st2 * 12);
          ctx.stroke();
        }
        /* smoke, rising and spreading */
        for (var sm = 0; sm < 7; sm++) {
          var sp2 = ((t * 0.5 + sm * 19) % 133) / 133;
          ctx.globalAlpha = 0.20 * (1 - sp2);
          ctx.fillStyle = '#c9cbe0';
          ctx.beginPath();
          ctx.arc(hx + 70 + Math.sin(sp2 * 4 + sm) * 11, 50 - sp2 * 54,
                  3.5 + sp2 * 11, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        /* the body of it, in logs */
        K.mass(ctx, hx - 88, 94, 152, 66, '#332a40', { top: 0, side: 10, foot: false });
        ctx.strokeStyle = 'rgba(0,0,0,.32)'; ctx.lineWidth = 1;
        for (var lg = 1; lg < 8; lg++) {
          ctx.beginPath();
          ctx.moveTo(hx - 88, 94 + lg * 8.2); ctx.lineTo(hx + 64, 94 + lg * 8.2);
          ctx.stroke();
        }
        /* the log ends stacked at the corner — the one detail that says
           "log cabin" rather than "shed" at this size */
        for (var le = 0; le < 8; le++) {
          ctx.fillStyle = le % 2 ? '#40354f' : '#2c2436';
          ctx.beginPath();
          ctx.ellipse(hx - 90, 98 + le * 8.2, 4, 3.6, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        /* the roof, overhanging at both ends */
        ctx.fillStyle = '#1d1826';
        ctx.beginPath();
        ctx.moveTo(hx - 104, 98); ctx.lineTo(hx - 12, 54);
        ctx.lineTo(hx + 78, 98); ctx.lineTo(hx + 78, 106);
        ctx.lineTo(hx - 12, 62); ctx.lineTo(hx - 104, 106);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(196,214,255,.16)';    /* moon on the near pitch */
        ctx.beginPath();
        ctx.moveTo(hx - 104, 98); ctx.lineTo(hx - 12, 54);
        ctx.lineTo(hx - 12, 62); ctx.lineTo(hx - 104, 106);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(224,236,255,.30)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx - 104, 98); ctx.lineTo(hx - 12, 54); ctx.stroke();

        /* windows: three big ones and a door, all lit, one with somebody
           moving past it */
        [[-72, 104, 24, 20], [-38, 104, 24, 20], [22, 104, 24, 20]]
          .forEach(function (wp, wi) {
            ctx.fillStyle = '#171325';
            ctx.fillRect(hx + wp[0] - 2, wp[1] - 2, wp[2] + 4, wp[3] + 4);
            ctx.fillStyle = 'rgba(255,206,130,' + (0.62 + 0.26 * flick).toFixed(2) + ')';
            ctx.fillRect(hx + wp[0], wp[1], wp[2], wp[3]);
            if (wi === 1) {                       /* a shape crossing the light */
              var pw2 = ((t * 0.7) % 210) / 210;
              if (pw2 < 0.4) {
                ctx.fillStyle = 'rgba(40,26,20,.78)';
                ctx.fillRect(hx + wp[0] + pw2 * 54 - 5, wp[1] + 2, 9, 18);
              }
            }
            ctx.strokeStyle = 'rgba(30,22,16,.85)'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hx + wp[0] + wp[2] / 2, wp[1]);
            ctx.lineTo(hx + wp[0] + wp[2] / 2, wp[1] + wp[3]);
            ctx.moveTo(hx + wp[0], wp[1] + wp[3] / 2);
            ctx.lineTo(hx + wp[0] + wp[2], wp[1] + wp[3] / 2);
            ctx.stroke();
            K.glow(ctx, hx + wp[0] + wp[2] / 2, wp[1] + wp[3] / 2, 30,
                   'rgba(255,186,90,.9)', 0.26 * flick);
          });
        /* the door, stood open, with the hall light behind it */
        ctx.fillStyle = '#171325';
        ctx.fillRect(hx - 10, 118, 24, 42);
        ctx.fillStyle = 'rgba(255,196,112,' + (0.66 + 0.2 * flick).toFixed(2) + ')';
        ctx.fillRect(hx - 8, 120, 14, 40);
        ctx.fillStyle = '#2e2338';
        ctx.fillRect(hx + 6, 118, 8, 42);
        K.glow(ctx, hx - 1, 142, 34, 'rgba(255,178,84,.9)', 0.30 * flick);

        /* the porch, its rail, a hanging lantern and somebody out watching */
        ctx.fillStyle = '#241e30';
        ctx.fillRect(hx - 100, 158, 176, 6);
        ctx.strokeStyle = '#453a55'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx - 96, 158); ctx.lineTo(hx - 96, 106);
        ctx.moveTo(hx + 70, 158); ctx.lineTo(hx + 70, 106);
        ctx.moveTo(hx - 96, 146); ctx.lineTo(hx + 70, 146);
        ctx.stroke();
        var lsw = Math.sin(t * 0.028) * 3;
        ctx.strokeStyle = '#2b2438'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx - 52, 108); ctx.lineTo(hx - 52 + lsw, 118); ctx.stroke();
        ctx.fillStyle = 'rgba(255,198,110,' + (0.8 * flick).toFixed(2) + ')';
        ctx.fillRect(hx - 55 + lsw, 118, 6, 8);
        K.glow(ctx, hx - 52 + lsw, 122, 22, 'rgba(255,180,80,.9)', 0.34 * flick);
        K.spectator(ctx, hx + 40, 158, 0.8, 511, t, mood);
        K.spectator(ctx, hx - 78, 158, 0.66, 733, t + 40, mood);

        /* the light it throws down onto the granite */
        K.spill(ctx, hx - 96, 164, 170, H - 164, 'rgba(255,186,90,.6)', 0.26 * flick);
      });

      /* --- STRING LIGHTS between the camp and the cabin. This was a split
             rail fence with a lamp on every third post and you could not see
             a single one of them: it sat at y 146-166, which is precisely
             the band K.deepen drops a hard shadow across, so the whole idea
             went into the dark. Lifted to head height it does three jobs at
             once — it fills the empty middle of the picture, it joins the
             two landmarks into one place instead of two props, and it puts
             warm light across the band the fighters stand in, which was one
             cold blue-grey value from edge to edge. --- */
      K.layer(ctx, camX, 0.52, function () {
        K.repeatX(camX, 0, 92, function (x, i) {
          var ph = K.vary(i, 141, 74, 86);           /* the pole */
          var py = 158 - ph;
          ctx.fillStyle = '#221d2e';
          ctx.fillRect(x, py, 3, ph);
          ctx.fillStyle = 'rgba(206,220,255,.16)';
          ctx.fillRect(x + 2, py, 1, ph);
          /* the wire, sagging to the next pole, with a lantern hung at each
             of five points along it */
          var nx = x + 92, ny = 158 - K.vary(i + 1, 141, 74, 86);
          var sagAmt = 26;
          ctx.strokeStyle = 'rgba(20,17,30,.85)'; ctx.lineWidth = 1;
          ctx.beginPath();
          for (var q = 0; q <= 8; q++) {
            var u = q / 8;
            var lx2 = x + (nx - x) * u;
            var ly2 = py + (ny - py) * u + Math.sin(u * Math.PI) * sagAmt
                      + Math.sin(t * 0.02 + i) * 1.2;
            if (q === 0) ctx.moveTo(lx2, ly2); else ctx.lineTo(lx2, ly2);
          }
          ctx.stroke();
          /* Three lamps to a span, not five, and a halo on every other one.
             Five spans are on screen at once, so five lamps each meant
             twenty-five radial gradients composited with `lighter` every
             frame — 1.4ms of the stage's budget for lights nobody can count.
             The bulb itself is a two-pixel ellipse and costs nothing. */
          for (var b = 1; b <= 3; b++) {
            var u2 = b / 4;
            var bx = x + (nx - x) * u2;
            var by2 = py + (ny - py) * u2 + Math.sin(u2 * Math.PI) * sagAmt
                      + Math.sin(t * 0.02 + i) * 1.2;
            var lf = 0.7 + 0.3 * Math.sin(t * 0.055 + i * 2 + b);
            ctx.fillStyle = 'rgba(255,206,126,' + lf.toFixed(2) + ')';
            ctx.beginPath();
            ctx.ellipse(bx, by2 + 3, 2.4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            if (b % 2) K.glow(ctx, bx, by2 + 3, 18, 'rgba(255,176,74,.95)', 0.36 * lf);
          }
        });
      });

      /* --- boulders: every one a different lump, not the same oval --- */
      K.layer(ctx, camX, 0.66, function () {
        K.repeatX(camX, 0, 76, function (x, i) {
          var bw = K.vary(i, 120, 18, 38), bh = K.vary(i, 121, 10, 22);
          var pts = [], n = 7;
          for (var q = 0; q < n; q++) {
            var a2 = (q / n) * Math.PI * 2;
            var rr = 1 + K.hash(i * 9 + q, 122) * 0.34;
            pts.push({ x: x + Math.cos(a2) * bw * rr, y: FLOOR_Y - 4 + Math.sin(a2) * bh * rr });
          }
          var lump = function (c) {
            c.beginPath();
            c.moveTo(pts[0].x, pts[0].y);
            for (var q2 = 1; q2 < pts.length; q2++) c.lineTo(pts[q2].x, pts[q2].y);
            c.closePath();
          };
          /* Three tones by hand rather than through K.paint. K.paint clips,
             and clip() is the expensive call — seven boulders a frame at two
             clips each was most of a millisecond for a shape twenty pixels
             across. Drawing the shape once in shadow and once again shifted
             towards the moon gets the same crescent for two fills and no
             clip at all. */
          var base = K.pick(i, 123, ['#2c2940', '#262338', '#332f49']);
          lump(ctx);
          ctx.fillStyle = K.darker(base, 0.4); ctx.fill();
          ctx.save();
          ctx.translate(0.8, -1.8);
          lump(ctx); ctx.fillStyle = base; ctx.fill();
          ctx.translate(0.7, -1.4);
          lump(ctx); ctx.fillStyle = K.lighter(base, 0.15); ctx.fill();
          ctx.restore();
          lump(ctx);
          ctx.strokeStyle = K.darker(base, 0.72); ctx.lineWidth = 1; ctx.stroke();
          /* a fire on some of them, and somebody sat by it */
          if (K.chance(i, 124, 0.3)) {
            var fx = x + K.vary(i, 125, -14, 14), fy = FLOOR_Y - 10;
            var fl = 0.7 + 0.3 * Math.sin(t * 0.17 + i);
            K.glow(ctx, fx, fy - 4, 44, 'rgba(255,150,60,.9)', 0.40 * fl);
            ctx.fillStyle = '#5c4028';
            ctx.fillRect(fx - 9, fy - 1, 18, 3);
            ctx.fillStyle = '#e0762a';
            ctx.beginPath();
            ctx.moveTo(fx - 7, fy); ctx.quadraticCurveTo(fx, fy - 20 * fl, fx + 7, fy);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ffb03a';
            ctx.beginPath();
            ctx.moveTo(fx - 4, fy); ctx.quadraticCurveTo(fx + 1, fy - 14 * fl, fx + 4, fy);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fff0b0';
            ctx.beginPath();
            ctx.moveTo(fx - 2, fy); ctx.quadraticCurveTo(fx, fy - 7 * fl, fx + 2, fy);
            ctx.closePath(); ctx.fill();
          }
          if (K.chance(i, 126, 0.34)) {
            K.spectator(ctx, x + K.vary(i, 127, -12, 12), FLOOR_Y - 6 - bh * 0.5,
                        K.vary(i, 128, 0.7, 0.95), Math.abs(i * 11), t + i * 29, mood);
          }
        });
      });
      /* --- THE CAMP. One fire, pinned in the world, big enough to matter.
             Everything on this stage was cold: two shots of it side by side
             and the whole band the fighters stand in was one blue-grey
             value, which is what makes a dark cat vanish. The scattered
             boulder fires above are seasoning; this is a light source. It is
             placed with K.at at the layer's own depth, so it is a PLACE you
             scroll past rather than a decal on the glass. --- */
      K.layer(ctx, camX, 0.66, function () {
        /* Repeated at a wide spacing rather than pinned to one world point.
           Pinned, there was exactly one camp on the whole mountain: scroll
           four hundred pixels and the middle of the picture went cold and
           empty again, which is the problem the fire was added to solve.
           At 430 apart there is nearly always one in frame and never two
           close enough to look like wallpaper. */
        K.repeatX(camX, 0, 430, function (cx, ci) {
          if (cx < -70 || cx > W + 70) return;
          var fl = 0.72 + 0.28 * Math.sin(t * 0.19 + ci) * Math.sin(t * 0.07 + ci);
          var by = FLOOR_Y - 8;

          /* the ring of stones — flat and dark, they are five pixels each */
          for (var rs = 0; rs < 7; rs++) {
            var ra = -0.15 + rs * 0.52 + K.hash(ci, 154) * 0.4;
            ctx.fillStyle = rs % 2 ? '#4a4560' : '#38344c';
            ctx.beginPath();
            ctx.ellipse(cx + Math.cos(ra) * 21, by + 3 + Math.sin(ra) * 4.5,
                        4.4, 3.2, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          /* The glow is centred well ABOVE the embers. Centred on the fuel
             it lands inside the hard shadow K.deepen lays along the floor
             line and comes out as a dull brown smudge; lifted to the top of
             the flames it lights the band the fight happens in, which is
             the whole reason the fire is here. */
          K.glow(ctx, cx, by - 30, 118, 'rgba(255,146,52,.95)', 0.50 * fl);
          K.glow(ctx, cx, by - 12, 40, 'rgba(255,230,158,.95)', 0.44 * fl);

          /* the bed of it, then three tongues at different rates — one
             flame shape pulsing is a gas ring, three out of phase is a
             fire */
          ctx.fillStyle = '#5c3a1e';
          ctx.fillRect(cx - 15, by, 30, 4);
          ctx.fillStyle = '#4a2f18';
          ctx.fillRect(cx - 11, by - 3, 22, 4);
          /* Brighter than they look right on their own. This fire sits
             inside the hard shadow K.deepen lays along the floor line, and a
             flame palette that reads well in isolation comes out as a brown
             smear once that band is over it — the tones have to be picked
             against the finished picture, not against the swatch. */
          [[-7, 38, '#e8701e', 0.0], [3, 48, '#f5902c', 1.7], [-1, 30, '#ffc44e', 3.1],
           [0, 16, '#fff8dc', 4.4]].forEach(function (fm) {
            var h2 = fm[1] * (0.74 + 0.26 * Math.sin(t * 0.23 + fm[3] + ci));
            ctx.fillStyle = fm[2];
            ctx.beginPath();
            ctx.moveTo(cx + fm[0] - 8, by);
            ctx.quadraticCurveTo(cx + fm[0] - 7, by - h2 * 0.6,
                                 cx + fm[0] + Math.sin(t * 0.13 + fm[3]) * 4, by - h2);
            ctx.quadraticCurveTo(cx + fm[0] + 7, by - h2 * 0.6, cx + fm[0] + 8, by);
            ctx.closePath(); ctx.fill();
          });
          K.plume(ctx, cx, by - 46, t, { count: 5, rise: 54, drift: 12, size: 5,
                                         alpha: 0.16, dark: true,
                                         color: 'rgba(150,150,175,.9)' });

          /* the tripod and the kettle hung off it — the detail that says
             somebody lives here rather than somebody lit a fire */
          ctx.strokeStyle = '#2b2334'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(cx - 20, by + 4); ctx.lineTo(cx - 1, by - 44);
          ctx.moveTo(cx + 20, by + 4); ctx.lineTo(cx + 1, by - 44);
          ctx.moveTo(cx + 6, by + 4); ctx.lineTo(cx - 2, by - 44);
          ctx.stroke();
          var kw = Math.sin(t * 0.045) * 1.6;
          ctx.strokeStyle = '#2b2334'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx - 1, by - 43); ctx.lineTo(cx - 1 + kw, by - 33); ctx.stroke();
          ctx.fillStyle = '#3a3346';
          ctx.beginPath();
          ctx.ellipse(cx - 1 + kw, by - 29, 5, 4.4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,180,90,.5)';
          ctx.beginPath();
          ctx.ellipse(cx - 1 + kw, by - 30, 5, 2, 0, Math.PI, 0); ctx.fill();

          /* three sat round it, all different, none of them facing the same
             way — K.spectator takes a seed and this is what it is for */
          K.spectator(ctx, cx - 34, by + 8, K.vary(ci, 150, 0.82, 0.98),
                      Math.abs(ci * 37 + 271), t, mood);
          K.spectator(ctx, cx + 33, by + 7, K.vary(ci, 151, 0.7, 0.86),
                      Math.abs(ci * 53 + 88), t + 51, mood);
          if (K.chance(ci, 152, 0.7)) {
            K.spectator(ctx, cx + 15, by + 12, K.vary(ci, 153, 0.92, 1.06),
                        Math.abs(ci * 71 + 640), t + 113, mood);
          }
        });
      });

      /* the crowd sat along the back of the shelf, warmed by the fires */
      /* Spaced at 41 this row alone put nine more spectators on screen, and
         a spectator is about ten fills. Thinned to a handful sat along the
         back — the camp and the boulders already carry the crowd. */
      K.crowdRow(ctx, camX, 0.7, 56, FLOOR_Y - 2, t, mood,
                 { seed: 300, gap: 0.42, min: 0.6, max: 0.86 });

      /* --- the frame: two granite slabs the size of houses, hard up against
             the lens. They ran from y 34 to the bottom before, which is a
             boulder; a frame has to leave the top of the picture. --- */
      K.layer(ctx, camX, 0.86, function () {
        var drift3 = camX * 0.05;
        [[-26, 1], [W + 26, -1]].forEach(function (side) {
          var ex = side[0] - drift3 * side[1], dir = side[1];
          var slab = function (c) {
            c.beginPath();
            c.moveTo(ex - dir * 46, H + 12);
            c.lineTo(ex - dir * 34, -14);
            c.lineTo(ex + dir * 26, -22);
            c.lineTo(ex + dir * 62, 48);
            c.lineTo(ex + dir * 52, 118);
            c.lineTo(ex + dir * 74, H + 12);
            c.closePath();
          };
          /* Near-black, with one lit facet. Same lesson as the monolith:
             run this through K.paint and the highlight tone floods the
             whole slab, and a frame that is the same value as the middle
             distance is not a frame. */
          slab(ctx);
          ctx.fillStyle = '#121022';
          ctx.fill();
          ctx.save();
          slab(ctx); ctx.clip();
          ctx.fillStyle = '#221f36';
          ctx.beginPath();
          ctx.moveTo(ex + dir * 26, -22); ctx.lineTo(ex + dir * 62, 48);
          ctx.lineTo(ex + dir * 52, 118); ctx.lineTo(ex + dir * 74, H + 12);
          ctx.lineTo(ex + dir * 30, H + 12); ctx.lineTo(ex + dir * 10, 40);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,.42)'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ex + dir * 18, -18); ctx.lineTo(ex + dir * 2, 96);
          ctx.lineTo(ex + dir * 34, H + 12); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ex - dir * 20, 20); ctx.lineTo(ex - dir * 4, 150); ctx.stroke();
          /* moonlight down the inward edge — the one line that keeps a black
             mass from reading as a hole cut in the picture */
          ctx.strokeStyle = 'rgba(178,198,248,.20)'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ex + dir * 26, -18); ctx.lineTo(ex + dir * 62, 48);
          ctx.lineTo(ex + dir * 52, 118); ctx.stroke();
          ctx.restore();
          /* a scrub pine growing out of the top of it */
          ctx.fillStyle = '#0d1224';
          for (var tr = 0; tr < 3; tr++) {
            var tw = 9 - tr * 2.4;
            ctx.beginPath();
            ctx.moveTo(ex + dir * 40, 4 + tr * 9);
            ctx.lineTo(ex + dir * 40 - tw, 20 + tr * 9);
            ctx.lineTo(ex + dir * 40 + tw, 20 + tr * 9);
            ctx.closePath(); ctx.fill();
          }
        });
      });

      /* --- granite underfoot, wet-looking, with the moon on it --- */
      graniteFloor(ctx, camX);
      K.floorPool(ctx, MOON_X, 150, 'rgba(190,205,245,.5)', 0.24);
      K.litter(ctx, camX, 1, 46,
               ['rgba(170,180,215,.30)', 'rgba(90,88,110,.45)',
                'rgba(226,236,255,.22)'], 0.8, 2.6);
      this.flies.update();
      this.flies.draw(ctx, camX, t);
      this.embers.update();
      this.embers.draw(ctx, camX, t);
    },
    drawFore: function (ctx, camX, t) {
      /* Low mist rolling across the fighters' ankles. Many thin, faint bands
         rather than a few fat ones — four big ellipses read as a grey smear,
         which is worse than no mist at all. It also does the job K.deepen
         cannot: it puts a pale layer at shin height so a dark cat has
         something to be seen against. */
      ctx.save();
      ctx.fillStyle = '#c2cfe8';
      for (var i = 0; i < 10; i++) {
        var span = W + 240;
        var mx = ((t * (0.13 + i * 0.035) - camX * 1.08) % span + span) % span - 120;
        var my = FLOOR_Y + 4 + i * 5.2;
        ctx.globalAlpha = 0.06 + 0.04 * Math.sin(t * 0.02 + i * 1.7);
        ctx.beginPath();
        ctx.ellipse(mx, my, 62 + (i % 3) * 26, 4.4 - i * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      /* The very bottom of the frame was bare granite for thirteen pixels.
         In the reference something is always crossing the near edge — a
         kerb, a rope, a tuft of grass — because that is what tells you the
         floor carries on towards you rather than stopping at the glass.
         Near-black, no detail: anything readable down here competes with
         the fight for no reason. */
      K.repeatX(camX, 1.24, 43, function (x, i) {
        if (K.chance(i, 240, 0.34)) return;
        var gy = H - 2 + K.vary(i, 241, -4, 2);
        var gh = K.vary(i, 242, 9, 20);
        ctx.fillStyle = '#0e0c1a';
        for (var b = 0; b < 5; b++) {
          var lean = K.vary(i * 5 + b, 243, -6, 6);
          ctx.beginPath();
          ctx.moveTo(x + b * 3.2 - 6, gy);
          ctx.lineTo(x + b * 3.2 - 6 + lean, gy - gh * K.vary(i * 5 + b, 244, 0.5, 1));
          ctx.lineTo(x + b * 3.2 - 3.4, gy);
          ctx.closePath(); ctx.fill();
        }
      });
      K.nearLip(ctx, 14, 0.40);
      K.vignette(ctx, 0.34);
    }
  };
})();
