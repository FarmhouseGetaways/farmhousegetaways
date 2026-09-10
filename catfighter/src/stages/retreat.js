/* =======================================================================
   4 — MOUNTAIN RETREAT

   Night on the granite. A moon you could climb, a lit cabin, campfires,
   fireflies, mist off the cold rock. The quiet one — quiet is not the
   same as empty, and the first version of this stage confused the two.

   THE THING THIS STAGE IS FOR. Warm light in a dark picture is the
   strongest landmark there is, and this is the only stage in the game
   that is dark. Everything here is arranged so the eye has exactly three
   places to rest — the moon, the cabin, the camp — and so nothing else
   in the frame competes with them.

   THE STAGED MOMENTS. See MOMENTS below. The owner's most useful note on
   this whole project was "I love the cat swinging by the barn lol": what
   delights is not a painting, it is a character doing something with
   timing that you catch out of the corner of your eye. Seven things
   happen here on seven different clocks, all of them prime so they never
   line up and a player finds them one at a time over several rounds.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  /* Where the light in this picture comes from. Everything on the stage is
     shaded off this one point, because a night scene with two light sources
     is a night scene with none. */
  var MOON_X = 150, MOON_Y = 46, MOON_R = 31;

  /* ---- MOMENTS -----------------------------------------------------------

     Every period is PRIME, in frames at 60Hz. That is not decoration: with
     round numbers two moments eventually share a factor and start firing on
     the same beat, and the moment they do the stage reads as one animation
     on a loop instead of a place where several unrelated things are going
     on. Primes never line up.

        761  (12.7s)  the cat on the porch rail stretches
        977  (16.3s)  the wind gets up — smoke, lanterns, flames, mist
       1009  (16.8s)  somebody walks the length of the cabin, window to window
       1103  (18.4s)  eyes open in the treeline, blink twice, go out
       1699  (28.3s)  a shooting star
       1811  (30.2s)  a window goes dark and a light comes on upstairs
       2003  (33.4s)  the owl on the near rock drops off it and flies out

     `beat` returns 0..1 while a moment is running and -1 the rest of the
     time; `nth` numbers the occurrences so each one can be placed somewhere
     different without keeping any state. Both are pure functions of the
     clock — the previous version of this file kept a `this.shoot` object
     that was initialised and then never read by anything, which is how you
     end up with a promise in the stage blurb and nothing on the screen. */
  var P_STRETCH = 761,  L_STRETCH = 132;
  var P_GUST    = 977,  L_GUST    = 200;
  var P_WALK    = 1009, L_WALK    = 250;
  var P_EYES    = 1103, L_EYES    = 214;
  var P_STAR    = 1699, L_STAR    = 58;
  var P_UPSTAIRS = 1811, L_UPSTAIRS = 620;
  var P_OWL     = 2003, L_OWL     = 300;

  function beat(t, period, len) {
    var k = (t % period) / len;
    return k < 1 ? k : -1;
  }
  function nth(t, period) { return Math.floor(t / period); }

  /* The wind. One number, shared by the smoke, the lanterns, the string
     lights, the campfires, the waterfall spray and the mist, so a gust is
     one event in the picture rather than six things twitching. Smooth in
     and out of zero — anything that jumps here reads as a bug. */
  function gust(t) {
    var k = beat(t, P_GUST, L_GUST);
    if (k < 0) return 0;
    return Math.sin(k * Math.PI) * (0.66 + 0.34 * Math.sin(k * 19));
  }

  /* ---- the sky -----------------------------------------------------------
     STEPPED BANDS, not a ramp. A limited-palette arcade board could not
     express a smooth vertical fade and never tried to: the sky in the
     reference is a stack of flat colours and the steps between them ARE the
     look, the same argument that turned K.glow into four flat rings. The
     bands are deep at the top and thin towards the horizon, which is what
     atmospheric compression looks like and what stops eight equal stripes
     reading as a test card. */
  var SKY = [
    [0,   '#060919'], [24,  '#080c21'], [46,  '#0c1129'], [66,  '#111634'],
    [84,  '#161b3c'], [100, '#1c1e42'], [113, '#231f45'], [124, '#2b2247'],
    [133, '#332649'], [141, '#3b2b4b'], [148, '#432f4c']
  ];
  function nightSky(ctx) {
    for (var i = 0; i < SKY.length; i++) {
      var y = SKY[i][0];
      var h = (i + 1 < SKY.length ? SKY[i + 1][0] : 158) - y;
      ctx.fillStyle = SKY[i][1];
      ctx.fillRect(0, y, W, h);
    }
  }

  /* ---- cloud bars --------------------------------------------------------
     Three long clouds drifting across the moon. Each is three flat rows —
     a lit top, a base, a shaded underside — with the rows inset from each
     other, so the silhouette comes out chunky and stepped rather than
     airbrushed. They are the one thing that puts SCALE in the sky: a moon
     with something passing in front of it is a long way away. */
  function cloudBar(ctx, x, y, w, h, dark, base, lit) {
    ctx.fillStyle = dark;
    ctx.fillRect(x + w * 0.14, y + h, w * 0.74, h);
    ctx.fillStyle = base;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = lit;
    ctx.fillRect(x + w * 0.22, y - h, w * 0.56, h);
    ctx.fillRect(x, y, w, 1);
  }
  /*  y   drift  length  row-height  under      base       moonlit top  */
  var CLOUDS = [
    [28, 0.020, 122, 5, '#0c1030', '#1c2452', '#4d5c96'],
    [60, 0.013, 168, 6, '#0a0e28', '#171e46', '#3f4d82'],
    [94, 0.008, 210, 4, '#080c22', '#12193a', '#2c3868']
  ];
  function clouds(ctx, camX, t) {
    for (var i = 0; i < CLOUDS.length; i++) {
      var c = CLOUDS[i];
      var span = W + c[2] + 60;
      var x = ((-t * c[1] - camX * 0.02) % span + span) % span - c[2] - 30;
      cloudBar(ctx, x, c[0], c[2], c[3], c[4], c[5], c[6]);
    }
  }

  /* ---- bats over the moon ------------------------------------------------
     A loose skein crossing right to left, dark against the disc, taking
     about eleven seconds to clear the frame. Silhouettes alone would have
     been invisible over the sky, so each one carries a thread of moonlight
     along the top of the wing — the same trick as the rock. */
  function bats(ctx, t) {
    var span = W + 200;
    for (var i = 0; i < 7; i++) {
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

  /* MOMENT · a shooting star, once every twenty-eight seconds.
     Rare on purpose. Something that happens every fifteen seconds is
     scenery; something that happens twice a round is the thing a player
     tells somebody else about.

     The trail is five flat segments at stepped alpha, NOT a gradient. The
     old one built a createLinearGradient every frame it ran, which is both
     the one thing this game's art direction forbids and a per-frame
     allocation for a five-pixel streak. */
  var STAR_TRAIL = [0.95, 0.62, 0.38, 0.20, 0.09];
  function shootingStar(ctx, t) {
    var k = beat(t, P_STAR, L_STAR);
    if (k < 0) return;
    var n = nth(t, P_STAR);
    var sx = 26 + K.hash(n, 71) * 250, sy = 6 + K.hash(n, 72) * 32;
    var dx = 92 + K.hash(n, 73) * 62, dy = 40 + K.hash(n, 74) * 30;
    var hx = sx + dx * k, hy = sy + dy * k;
    /* the unit vector back up the trail */
    var len = Math.sqrt(dx * dx + dy * dy);
    var ux = -dx / len, uy = -dy / len;
    var a = Math.sin(k * Math.PI);
    var seg = 9;
    ctx.save();
    ctx.lineCap = 'butt';
    for (var s = 0; s < STAR_TRAIL.length; s++) {
      ctx.strokeStyle = 'rgba(255,252,232,' + (STAR_TRAIL[s] * a).toFixed(3) + ')';
      ctx.lineWidth = s < 2 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(hx + ux * seg * s, hy + uy * seg * s);
      ctx.lineTo(hx + ux * seg * (s + 1), hy + uy * seg * (s + 1));
      ctx.stroke();
    }
    /* the head: a hard two-pixel block with one banded ring round it */
    ctx.fillStyle = 'rgba(255,255,246,' + a.toFixed(2) + ')';
    ctx.fillRect(hx - 1, hy - 1, 3, 3);
    K.glow(ctx, hx, hy, 11, 'rgba(226,238,255,.9)', 0.42 * a);
    ctx.restore();
  }

  /* MOMENT · eyes in the treeline, once every eighteen seconds.
     Two dots of eyeshine open in the dark pines, drift a little, blink
     twice, and go out. The cheapest moment on the stage and the one most
     likely to make somebody say "did you see that" — because at 384x224 two
     lit pixels in a black mass is unmistakably an animal and nothing else. */
  function treeEyes(ctx, t) {
    var e = t % P_EYES;
    if (e > L_EYES) return;
    var n = nth(t, P_EYES);
    var a = e < 34 ? e / 34 : (e > L_EYES - 44 ? (L_EYES - e) / 44 : 1);
    if ((e > 96 && e < 105) || (e > 134 && e < 142)) return;   /* the blinks */
    if (a <= 0.02) return;
    var ex = 34 + K.hash(n, 88) * (W - 70) + Math.sin(e * 0.022) * 3;
    var ey = 128 + K.hash(n, 89) * 24;
    var gap = 4 + K.hash(n, 90) * 2;
    ctx.save();
    ctx.globalAlpha = a;
    K.glow(ctx, ex, ey, 9, 'rgba(190,236,150,.8)', 0.30 * a);
    ctx.fillStyle = '#dcf29a';
    ctx.fillRect(ex - gap, ey - 1, 2, 2);
    ctx.fillRect(ex + gap - 1, ey - 1, 2, 2);
    ctx.restore();
  }

  /* ---- the owl on the near rock -----------------------------------------
     MOMENT · once every thirty-three seconds it drops off the branch and
     flies out of the picture, and the branch springs back behind it.

     It is perched on the FOREGROUND slab, which is what makes this the big
     one: a near-layer silhouette at the edge of frame is the only thing on
     the stage the eye is guaranteed to catch while a fight is going on. The
     flight arcs up and out to the right, well above the fighters, so it can
     never sit on top of the action. */
  function owlPerched(ctx, x, y, t) {
    /* body and head, one dark mass with ear tufts, plus a slow blink */
    ctx.fillStyle = '#0b0d1c';
    ctx.beginPath();
    ctx.moveTo(x - 4.5, y + 1);
    ctx.quadraticCurveTo(x - 5.4, y - 6, x - 3.4, y - 8.4);
    ctx.lineTo(x - 4.2, y - 11.4);                    /* the ear tufts */
    ctx.lineTo(x - 1.6, y - 9.6);
    ctx.lineTo(x + 1.6, y - 9.6);
    ctx.lineTo(x + 4.2, y - 11.4);
    ctx.lineTo(x + 3.4, y - 8.4);
    ctx.quadraticCurveTo(x + 5.4, y - 6, x + 4.5, y + 1);
    ctx.closePath();
    ctx.fill();
    /* the moon down its back, so it is not a hole in the rock */
    ctx.strokeStyle = 'rgba(186,206,255,.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3.4, y - 8.4);
    ctx.quadraticCurveTo(x + 5.4, y - 6, x + 4.5, y + 1);
    ctx.stroke();
    var blink = Math.sin(t * 0.021 + 1.3);
    if (blink > -0.94) {
      ctx.fillStyle = '#e8b552';
      ctx.fillRect(x - 2.6, y - 7.4, 2, 2);
      ctx.fillRect(x + 0.8, y - 7.4, 2, 2);
    }
  }

  function owlFlying(ctx, x0, y0, k, t) {
    /* out to the right and up, dipping once as it leaves the rock */
    var x = x0 + k * (W + 70 - x0);
    var y = y0 + Math.sin(k * Math.PI) * 26 - k * 22;
    var beats = k < 0.16 ? 0.42 : 0.14;               /* hard beats, then a glide */
    var flap = Math.sin(t * beats * 2.2);
    var s = 1.5;
    ctx.fillStyle = '#0b0d1c';
    ctx.beginPath();
    ctx.moveTo(x - 11 * s, y + flap * 6 * s);
    ctx.quadraticCurveTo(x - 4 * s, y - 2 * s, x, y - 1.4 * s);
    ctx.quadraticCurveTo(x + 4 * s, y - 2 * s, x + 11 * s, y + flap * 6 * s);
    ctx.quadraticCurveTo(x + 4 * s, y + 3.4 * s, x, y + 4 * s);
    ctx.quadraticCurveTo(x - 4 * s, y + 3.4 * s, x - 11 * s, y + flap * 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(190,210,255,.34)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 11 * s, y + flap * 6 * s);
    ctx.quadraticCurveTo(x - 4 * s, y - 2 * s, x, y - 1.4 * s);
    ctx.quadraticCurveTo(x + 4 * s, y - 2 * s, x + 11 * s, y + flap * 6 * s);
    ctx.stroke();
    ctx.fillStyle = '#171a2e';
    ctx.beginPath();
    ctx.ellipse(x, y + 0.4 * s, 3.6, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* MOMENT · the cat on the porch rail stretches, every twelve and a half
     seconds. Small, frequent, and the one that is purely for fun. It reads
     because the SHAPE changes: a sitting cat is a tall lump and a stretching
     one is a long low one with a hump in the middle, and at ten pixels that
     difference is the whole animation. */
  function porchCat(ctx, x, y, t, warm) {
    var k = beat(t, P_STRETCH, L_STRETCH);
    var s = 0;
    if (k >= 0) {
      var r = Math.sin(k * Math.PI);
      s = r * r * (3 - 2 * r);                        /* ease in, hold, ease out */
    }
    var bw = 4.6 + s * 3.0, bh = 5.6 - s * 2.0;
    var by = y - 5 + s * 0.6;
    var hx = x + 1.6 + s * 4.6, hy = y - 11.4 + s * 4.4;

    ctx.save();
    ctx.fillStyle = '#1d1622';
    /* the tail, up and curled when it stretches, hanging when it does not */
    ctx.strokeStyle = '#1d1622';
    ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 3.6, by);
    ctx.quadraticCurveTo(x - 8 - s * 2, by + 4 - s * 12,
                         x - 6 - s * 4, by + 8 - s * 20 + Math.sin(t * 0.06) * 1.4);
    ctx.stroke();
    /* the body */
    ctx.beginPath();
    ctx.ellipse(x, by, bw, bh, -s * 0.16, 0, Math.PI * 2);
    ctx.fill();
    /* the arch over the back, only once it is really stretching */
    if (s > 0.28) {
      ctx.beginPath();
      ctx.moveTo(x - bw, by - bh * 0.3);
      ctx.quadraticCurveTo(x, by - bh - 3.4 * s, x + bw, by - bh * 0.3);
      ctx.quadraticCurveTo(x, by - bh * 0.2, x - bw, by - bh * 0.3);
      ctx.closePath();
      ctx.fill();
    }
    /* the front legs, reaching */
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(x + bw * 0.5, by + bh * 0.5);
    ctx.lineTo(x + bw * 0.5 + s * 5.4, y + 0.6);
    ctx.stroke();
    /* the head, with ears */
    ctx.beginPath();
    ctx.moveTo(hx - 3, hy + 0.6); ctx.lineTo(hx - 2.4, hy - 3.8);
    ctx.lineTo(hx - 0.3, hy - 1.2); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + 3, hy + 0.6); ctx.lineTo(hx + 2.4, hy - 3.8);
    ctx.lineTo(hx + 0.3, hy - 1.2); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.arc(hx, hy, 3.1, 0, Math.PI * 2);
    ctx.fill();
    /* the window light down its near side — without this it is a black
       lump on a dark wall and nobody ever sees it move */
    ctx.strokeStyle = warm;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hx, hy, 3.1, -1.5, 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, by, bw, bh, -s * 0.16, -1.4, 0.5);
    ctx.stroke();
    ctx.restore();
  }

  /* ---- the floor ---------------------------------------------------------
     GRANITE SLABS, and specifically not a ramp. This was the largest
     continuous gradient in the game — a single linear fade across the whole
     play surface, directly under the fighters — and a ramp reads as an
     airbrush however carefully it is aimed. Stone reads as flat tones with
     hard seams between them, so that is what it is now: three bands of
     value, each seam a dark line with one lit pixel-row above it, exactly
     the recipe the monolith's strata use. The light lands on the horizontal
     and misses the vertical.

     The slabs are laid in two courses with the joints offset half a slab,
     because a paved floor is bonded and a floor of full-width strips is a
     road. */
  var SEAM_A = FLOOR_Y + 17, SEAM_B = FLOOR_Y + 34;
  function graniteFloor(ctx, camX) {
    ctx.fillStyle = '#4b4661'; ctx.fillRect(0, FLOOR_Y, W, SEAM_A - FLOOR_Y);
    ctx.fillStyle = '#413c57'; ctx.fillRect(0, SEAM_A, W, SEAM_B - SEAM_A);
    ctx.fillStyle = '#36314a'; ctx.fillRect(0, SEAM_B, W, H - SEAM_B);

    var BW = 62;
    function course(top, bot, phase, salt) {
      K.repeatX(camX, 1, BW, function (x, i) {
        var lean = 0.64 * ((top - FLOOR_Y) / (H - FLOOR_Y));
        var lean2 = 0.64 * ((bot - FLOOR_Y) / (H - FLOOR_Y));
        var x0 = x + phase;
        ctx.beginPath();
        ctx.moveTo(x0 - BW * lean, top);
        ctx.lineTo(x0 + BW - BW * lean, top);
        ctx.lineTo(x0 + BW - BW * lean2, bot);
        ctx.lineTo(x0 - BW * lean2, bot);
        ctx.closePath();
        var tint = K.vary(i, salt, -0.05, 0.055);
        ctx.fillStyle = tint < 0
          ? 'rgba(0,0,0,' + (-tint).toFixed(3) + ')'
          : 'rgba(226,234,255,' + tint.toFixed(3) + ')';
        ctx.fill();
        /* the joint down the left edge, dark, with the moon on its near lip */
        ctx.strokeStyle = 'rgba(10,8,20,.46)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0 - BW * lean, top);
        ctx.lineTo(x0 - BW * lean2, bot);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(206,220,255,.09)';
        ctx.beginPath();
        ctx.moveTo(x0 + 1 - BW * lean, top);
        ctx.lineTo(x0 + 1 - BW * lean2, bot);
        ctx.stroke();
      });
    }
    course(FLOOR_Y, SEAM_A, 0, 210);
    course(SEAM_A, SEAM_B, 31, 216);
    course(SEAM_B, H, 0, 218);

    /* the two seams across, hard: a dark line and a lit row above it */
    ctx.fillStyle = 'rgba(10,8,20,.44)';
    ctx.fillRect(0, SEAM_A - 1, W, 2);
    ctx.fillRect(0, SEAM_B - 1, W, 2);
    ctx.fillStyle = 'rgba(206,220,255,.10)';
    ctx.fillRect(0, SEAM_A - 2, W, 1);
    ctx.fillRect(0, SEAM_B - 2, W, 1);

    /* a few fractures running out of the joints, so the courses are not a
       grid of identical rectangles */
    ctx.strokeStyle = 'rgba(12,10,22,.26)';
    K.repeatX(camX, 1, BW, function (x, i) {
      if (!K.chance(i, 211, 0.5)) return;
      var f = K.vary(i, 212, 0.25, 0.85);
      var jy = FLOOR_Y + f * (H - FLOOR_Y);
      ctx.beginPath();
      ctx.moveTo(x - BW * 0.64 * f, jy);
      ctx.lineTo(x + K.vary(i, 213, 12, 38), jy + K.vary(i, 214, 3, 11));
      ctx.stroke();
    });
  }

  /* The moon on the wet granite. K.floorPool is a radial gradient and this
     stage cannot have one: it is stepped ellipses instead, the same four
     flat rings K.glow uses, so the pool of light bands exactly like every
     other light in the picture. */
  var POOL = [[164, 0.05], [116, 0.055], [72, 0.06], [36, 0.06]];
  function moonPool(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(184,202,248,1)';
    for (var i = 0; i < POOL.length; i++) {
      ctx.globalAlpha = POOL[i][1];
      ctx.beginPath();
      ctx.ellipse(MOON_X, FLOOR_Y + 26, POOL[i][0], POOL[i][0] * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* Light falling out of a window onto the ground, in three flat steps.
     K.spill ramps to transparent, which is the airbrush again. Stepped, the
     edge of the light has a shape — and a shape is what tells you there is a
     window casting it. */
  function spillSteps(ctx, x, y, w, h, colour, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = colour;
    for (var s = 3; s >= 1; s--) {
      var f = s / 3;
      ctx.globalAlpha = alpha * 0.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w - w * 0.20 * f, y + h * f);
      ctx.lineTo(x - w * 0.16 * f, y + h * f);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
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
      var gu = gust(t);

      nightSky(ctx);

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
      /* The halo is small and hard. K.glow is four flat rings now, so a big
         radius does not fade out at the edge — it lays a pale DISC across a
         third of the sky, which is what this was doing at 2.6 radii: the
         moon read as a lamp behind frosted glass and the whole upper picture
         came up in value. At 1.75 radii the rings sit tight round the disc
         and read as a corona, which is what a banded palette does with a
         bright light and what this stage wanted all along. */
      K.glow(ctx, MOON_X, MOON_Y, MOON_R * 1.75, 'rgba(206,222,255,.75)', 0.30);
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
      clouds(ctx, camX, t);
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

      /* --- THREE ranges, each flatter, cooler and paler than the one in
             front of it, at three different rates. Two ridges read as a
             backdrop with a cut-out in front of it; three read as distance,
             because the eye gets the RATE of the change as well as the
             change. The farthest is nearly a straight line, which is what a
             mountain forty miles off actually looks like. --- */
      K.ridge(ctx, camX, 0.035, '#2e3565', 122, 22, 29);
      K.layer(ctx, camX, 0.07, function () {
        K.ridge(ctx, camX, 0.07, '#242a52', 134, 50, 5);
        /* snow on the tops, offset up-right towards the moon */
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, 132); ctx.clip();
        ctx.globalAlpha = 0.5;
        K.ridge(ctx, camX, 0.07, '#6b7db0', 130, 50, 5);
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
            var wob = Math.sin(wy * 0.13 + t * 0.09) * (1.8 + gu * 2.6);
            ctx.lineTo(fx + wob - (2.2 + k2 * 5.5) * band[0], wy);
          }
          for (wy = FLOOR_Y - 4; wy > 58; wy -= 6) {
            var k3 = (wy - 58) / (FLOOR_Y - 62);
            var wob2 = Math.sin(wy * 0.13 + t * 0.09) * (1.8 + gu * 2.6);
            ctx.lineTo(fx + wob2 + (2.2 + k3 * 5.5) * band[0], wy);
          }
          ctx.closePath(); ctx.fill();
        });
        K.plume(ctx, fx, FLOOR_Y - 12, t, { count: 5, rise: 26,
                                            drift: 7 + gu * 18,
                                            size: 5, alpha: 0.22,
                                            color: 'rgba(206,226,255,.9)' });
        K.glow(ctx, fx, FLOOR_Y - 10, 26, 'rgba(190,220,255,.7)', 0.22);
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
      K.layer(ctx, camX, 0.32, function () {
        K.repeatX(camX, 0, 25, function (x, i) {
          if (K.chance(i, 115, 0.18)) return;
          var ph = K.vary(i, 116, 44, 92), pw = ph * K.vary(i, 117, 0.20, 0.30);
          var col = K.pick(i, 118, ['#0a0e1e', '#0d1226', '#070b19']);
          /* three tiers rather than one triangle — a pine is a stack of
             skirts and the notches are what stop a row of them reading as
             bunting. They lean with the gust: a still tree in a wind that is
             moving the smoke and the lanterns is the thing that gives away
             that the wind is a trick. */
          var lean = gu * 1.9 * Math.sin(i * 1.7);
          ctx.fillStyle = col;
          for (var tier = 0; tier < 3; tier++) {
            var f = tier / 3;
            var ty = 164 - ph * (1 - f * 0.62);
            var tw = pw * (0.42 + f * 0.58);
            var lx = x + lean * (1 - f);
            ctx.beginPath();
            ctx.moveTo(lx, ty);
            ctx.lineTo(lx - tw, ty + ph * 0.42);
            ctx.lineTo(lx + tw, ty + ph * 0.42);
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
          ctx.moveTo(x + lean + 1, 164 - ph);
          ctx.lineTo(x + pw * 0.9, 164 - ph * 0.16);
          ctx.stroke();
        });
      });
      treeEyes(ctx, t);

      /* --- THE CABIN. Warm light in a cold picture is the strongest
             landmark there is, and this one was too small to do the job:
             a hundred pixels of it at the very edge of frame, half cropped.
             It is now a third of the width and half the height, up on its
             own granite shelf, and it drifts a little so it is not a decal
             stuck to the glass.

             It is also where three of the seven moments live, because a lit
             window is the only place on a night stage where a silhouette
             reads at all. --- */
      K.layer(ctx, camX, 0.42, function () {
        var hx = K.at(camX, 0, 306) - camX * 0.05;
        var flick = 0.78 + 0.22 * Math.sin(t * 0.13) * Math.sin(t * 0.31);

        /* MOMENT · somebody goes upstairs. A window goes dark, a beat later
           a light comes on in the gable, and after a while it all reverses.
           Slow, undramatic and completely legible — the cabin is a different
           cabin for ten seconds in every thirty. */
        var e = t % P_UPSTAIRS;
        var downstairsOut = (e > 10 && e < 520);
        var gable = (e > 86 && e < 470);

        /* MOMENT · somebody walks the length of the cabin. The figure is
           tracked in the cabin's own coordinates and each window asks
           whether it is currently behind it, so the same walk lights up
           three windows in turn instead of one shape jittering in one pane.
           The pane dims a little as the body passes, which is the half of
           this that sells it. */
        var wk = t % P_WALK;
        var walkX = wk < L_WALK ? -104 + (wk / L_WALK) * 176 : null;

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
        /* smoke, rising and spreading — and laid flat when the wind gets up,
           which is the most readable thing a gust can do to a picture */
        for (var sm = 0; sm < 7; sm++) {
          var sp2 = ((t * 0.5 + sm * 19) % 133) / 133;
          ctx.globalAlpha = 0.20 * (1 - sp2);
          ctx.fillStyle = '#c9cbe0';
          ctx.beginPath();
          ctx.arc(hx + 70 + Math.sin(sp2 * 4 + sm) * 11 + gu * sp2 * 38,
                  50 - sp2 * 54 + gu * sp2 * 16,
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

        /* the gable window, up under the roof peak. Dark almost all the
           time, which is exactly the point: a window that is only ever lit
           has nothing to say, and one that comes on has a story in it. */
        ctx.fillStyle = '#120f1c';
        ctx.fillRect(hx - 22, 74, 20, 15);
        if (gable) {
          ctx.fillStyle = 'rgba(255,198,116,' + (0.62 + 0.24 * flick).toFixed(2) + ')';
          ctx.fillRect(hx - 20, 76, 16, 11);
          ctx.strokeStyle = 'rgba(30,22,16,.85)'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(hx - 12, 76); ctx.lineTo(hx - 12, 87); ctx.stroke();
          K.glow(ctx, hx - 12, 82, 22, 'rgba(255,186,90,.9)', 0.26 * flick);
        } else {
          ctx.fillStyle = 'rgba(150,168,210,.10)';   /* moon on cold glass */
          ctx.fillRect(hx - 20, 76, 16, 11);
        }

        /* the three big windows, and whoever is walking past them */
        [[-72, 104, 24, 20], [-38, 104, 24, 20], [22, 104, 24, 20]]
          .forEach(function (wp, wi) {
            var out = (wi === 2 && downstairsOut);
            ctx.fillStyle = '#171325';
            ctx.fillRect(hx + wp[0] - 2, wp[1] - 2, wp[2] + 4, wp[3] + 4);
            if (out) {
              ctx.fillStyle = 'rgba(150,168,210,.12)';
              ctx.fillRect(hx + wp[0], wp[1], wp[2], wp[3]);
            } else {
              /* the pane dims while a body is in front of it */
              var shade = 1;
              if (walkX !== null && walkX > wp[0] - 12 && walkX < wp[0] + wp[2] + 12) shade = 0.82;
              ctx.fillStyle = 'rgba(255,206,130,'
                + ((0.62 + 0.26 * flick) * shade).toFixed(2) + ')';
              ctx.fillRect(hx + wp[0], wp[1], wp[2], wp[3]);
              if (walkX !== null && walkX > wp[0] - 10 && walkX < wp[0] + wp[2] + 10) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(hx + wp[0], wp[1], wp[2], wp[3]);
                ctx.clip();
                var px = hx + walkX;
                var bobY = wp[1] + 3 + Math.abs(Math.sin(wk * 0.20)) * 1.2;
                ctx.fillStyle = 'rgba(36,22,16,.86)';
                ctx.fillRect(px - 4, bobY + 5, 9, 13);      /* body */
                ctx.beginPath();
                ctx.arc(px + 0.5, bobY + 3.4, 3.4, 0, Math.PI * 2);
                ctx.fill();                                  /* head */
                ctx.restore();
              }
            }
            ctx.strokeStyle = 'rgba(30,22,16,.85)'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(hx + wp[0] + wp[2] / 2, wp[1]);
            ctx.lineTo(hx + wp[0] + wp[2] / 2, wp[1] + wp[3]);
            ctx.moveTo(hx + wp[0], wp[1] + wp[3] / 2);
            ctx.lineTo(hx + wp[0] + wp[2], wp[1] + wp[3] / 2);
            ctx.stroke();
            if (!out) {
              K.glow(ctx, hx + wp[0] + wp[2] / 2, wp[1] + wp[3] / 2, 22,
                     'rgba(255,186,90,.9)', 0.24 * flick);
            }
          });
        /* the door, stood open, with the hall light behind it */
        ctx.fillStyle = '#171325';
        ctx.fillRect(hx - 10, 118, 24, 42);
        ctx.fillStyle = 'rgba(255,196,112,' + (0.66 + 0.2 * flick).toFixed(2) + ')';
        ctx.fillRect(hx - 8, 120, 14, 40);
        ctx.fillStyle = '#2e2338';
        ctx.fillRect(hx + 6, 118, 8, 42);
        K.glow(ctx, hx - 1, 142, 26, 'rgba(255,178,84,.9)', 0.30 * flick);

        /* the porch, its rail, a hanging lantern and somebody out watching */
        ctx.fillStyle = '#241e30';
        ctx.fillRect(hx - 100, 158, 176, 6);
        ctx.strokeStyle = '#453a55'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx - 96, 158); ctx.lineTo(hx - 96, 106);
        ctx.moveTo(hx + 70, 158); ctx.lineTo(hx + 70, 106);
        ctx.moveTo(hx - 96, 146); ctx.lineTo(hx + 70, 146);
        ctx.stroke();
        var lsw = Math.sin(t * 0.028) * (3 + gu * 7);
        ctx.strokeStyle = '#2b2438'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx - 52, 108); ctx.lineTo(hx - 52 + lsw, 118); ctx.stroke();
        ctx.fillStyle = 'rgba(255,198,110,' + (0.8 * flick).toFixed(2) + ')';
        ctx.fillRect(hx - 55 + lsw, 118, 6, 8);
        K.glow(ctx, hx - 52 + lsw, 122, 18, 'rgba(255,180,80,.9)', 0.36 * flick);

        /* MOMENT · the cat on the rail */
        porchCat(ctx, hx - 60, 146, t, 'rgba(255,196,112,.42)');

        K.spectator(ctx, hx + 40, 158, 0.8, 511, t, mood);
        K.spectator(ctx, hx - 84, 158, 0.66, 733, t + 40, mood);

        /* the light it throws down onto the granite, in flat steps */
        spillSteps(ctx, hx - 96, 164, 170, H - 164, 'rgba(255,186,90,.6)', 0.26 * flick);
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
             of three points along it */
          var nx = x + 92, ny = 158 - K.vary(i + 1, 141, 74, 86);
          var sagAmt = 26 + gu * 4;
          var swing = Math.sin(t * 0.02 + i) * (1.2 + gu * 6);
          ctx.strokeStyle = 'rgba(20,17,30,.85)'; ctx.lineWidth = 1;
          ctx.beginPath();
          for (var q = 0; q <= 8; q++) {
            var u = q / 8;
            var lx2 = x + (nx - x) * u;
            var ly2 = py + (ny - py) * u + Math.sin(u * Math.PI) * sagAmt + swing;
            if (q === 0) ctx.moveTo(lx2, ly2); else ctx.lineTo(lx2, ly2);
          }
          ctx.stroke();
          /* Three lamps to a span, not five, and a halo on every other one.
             Five spans are on screen at once, so five lamps each meant
             twenty-five glows composited with `lighter` every frame — 1.4ms
             of the stage's budget for lights nobody can count. The bulb
             itself is a two-pixel ellipse and costs nothing. */
          for (var b = 1; b <= 3; b++) {
            var u2 = b / 4;
            var bx = x + (nx - x) * u2;
            var by2 = py + (ny - py) * u2 + Math.sin(u2 * Math.PI) * sagAmt + swing;
            var lf = 0.7 + 0.3 * Math.sin(t * 0.055 + i * 2 + b);
            ctx.fillStyle = 'rgba(255,206,126,' + lf.toFixed(2) + ')';
            ctx.beginPath();
            ctx.ellipse(bx, by2 + 3, 2.4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            if (b === 2) K.glow(ctx, bx, by2 + 3, 15, 'rgba(255,176,74,.95)', 0.40 * lf);
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
          /* the moon on the two facets that face it. A hard bright edge on
             the top-right of every near rock is most of what says "there is
             a moon up there" once the moon itself is out of frame. */
          ctx.strokeStyle = 'rgba(198,216,255,.34)'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pts[6].x + 1, pts[6].y - 2);
          ctx.lineTo(pts[0].x + 1, pts[0].y - 2);
          ctx.lineTo(pts[1].x + 1, pts[1].y - 2);
          ctx.stroke();
          /* a fire on some of them, and somebody sat by it */
          if (K.chance(i, 124, 0.3)) {
            var fx = x + K.vary(i, 125, -14, 14), fy = FLOOR_Y - 10;
            var fl = 0.7 + 0.3 * Math.sin(t * 0.17 + i);
            K.glow(ctx, fx, fy - 8, 30, 'rgba(255,150,60,.9)', 0.42 * fl);
            ctx.fillStyle = '#5c4028';
            ctx.fillRect(fx - 9, fy - 1, 18, 3);
            ctx.fillStyle = '#e0762a';
            ctx.beginPath();
            ctx.moveTo(fx - 7, fy);
            ctx.quadraticCurveTo(fx + gu * 5, fy - 20 * fl, fx + 7 + gu * 7, fy);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ffb03a';
            ctx.beginPath();
            ctx.moveTo(fx - 4, fy);
            ctx.quadraticCurveTo(fx + 1 + gu * 4, fy - 14 * fl, fx + 4 + gu * 5, fy);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fff0b0';
            ctx.beginPath();
            ctx.moveTo(fx - 2, fy);
            ctx.quadraticCurveTo(fx + gu * 2, fy - 7 * fl, fx + 2 + gu * 3, fy);
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
             boulder fires above are seasoning; this is a light source. --- */
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
          /* The glow is centred ABOVE the embers, because centred on the
             fuel it lands inside the hard shadow K.deepen lays along the
             floor line and comes out as a dull brown smudge.

             And it is HALF the radius it was. K.glow stopped being a soft
             radial bloom and became four flat rings, and at 118 pixels those
             rings are not a halo — they are a flat orange disc a third of
             the screen across, laid over the monolith, the pines and both
             fighters. It measured as the brightest thing in the picture
             after the moon and it was lighting nothing. A tight halo at
             higher alpha throws the same amount of warm light onto the band
             the fight happens in and leaves the rest of the stage alone. */
          K.glow(ctx, cx, by - 26, 56, 'rgba(255,146,52,.95)', 0.46 * fl);
          K.glow(ctx, cx, by - 12, 24, 'rgba(255,230,158,.95)', 0.44 * fl);

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
            ctx.quadraticCurveTo(cx + fm[0] - 7 + gu * 6, by - h2 * 0.6,
                                 cx + fm[0] + Math.sin(t * 0.13 + fm[3]) * 4 + gu * 16,
                                 by - h2 * (1 - gu * 0.22));
            ctx.quadraticCurveTo(cx + fm[0] + 7 + gu * 8, by - h2 * 0.6,
                                 cx + fm[0] + 8, by);
            ctx.closePath(); ctx.fill();
          });
          K.plume(ctx, cx, by - 46, t, { count: 5, rise: 54,
                                         drift: 12 + gu * 26, size: 5,
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
          var kw = Math.sin(t * 0.045) * (1.6 + gu * 3);
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
        var ow = t % P_OWL;
        var perchX = 0, perchY = 0;
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
          /* a scrub pine growing out of the top of it. The left one is the
             owl's branch, and it SPRINGS for half a second after the bird
             leaves it — a decaying wobble on the trunk. A landing and a
             take-off both read almost entirely off what the branch does. */
          var spring = (dir > 0 && ow < 46)
            ? Math.sin(ow * 0.62) * Math.exp(-ow * 0.06) * 3.4 : 0;
          ctx.fillStyle = '#0d1224';
          for (var tr = 0; tr < 3; tr++) {
            var tw = 9 - tr * 2.4;
            var lx = ex + dir * 40 + spring * (1 - tr * 0.3);
            ctx.beginPath();
            ctx.moveTo(lx, 4 + tr * 9);
            ctx.lineTo(lx - tw, 20 + tr * 9);
            ctx.lineTo(lx + tw, 20 + tr * 9);
            ctx.closePath(); ctx.fill();
          }
          if (dir > 0) { perchX = ex + dir * 40 + spring; perchY = 8; }
        });
        /* MOMENT · the owl. Sat on that branch nearly all the time, blinking;
           once every thirty-three seconds it goes. Drawn last in the layer so
           it is never behind the rock it is sitting on. */
        if (ow < L_OWL) owlFlying(ctx, perchX, perchY, ow / L_OWL, t);
        else owlPerched(ctx, perchX, perchY, t);
      });

      /* --- granite underfoot, wet-looking, with the moon on it --- */
      graniteFloor(ctx, camX);
      moonPool(ctx);
      K.litter(ctx, camX, 1, 46,
               ['rgba(170,180,215,.30)', 'rgba(90,88,110,.45)',
                'rgba(226,236,255,.22)'], 0.8, 2.6);
      this.flies.update();
      this.flies.draw(ctx, camX, t);
      this.embers.update();
      this.embers.draw(ctx, camX, t);
    },
    drawFore: function (ctx, camX, t) {
      var gu = gust(t);
      /* Low mist rolling across the fighters' ankles. Many thin, faint bands
         rather than a few fat ones — four big ellipses read as a grey smear,
         which is worse than no mist at all. It also does the job K.deepen
         cannot: it puts a pale layer at shin height so a dark cat has
         something to be seen against. It surges with the gust, which is the
         cheapest and most legible thing wind can do down here. */
      ctx.save();
      ctx.fillStyle = '#c2cfe8';
      for (var i = 0; i < 10; i++) {
        var span = W + 240;
        var mx = ((t * (0.13 + i * 0.035) + gu * 34 - camX * 1.08) % span + span) % span - 120;
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

         It was an evenly spaced row of five identical black spikes, which
         reads as a comb along the bottom of the picture, not as grass. Now
         it is CLUMPS at irregular spacing, with a blade count and a height
         that vary, and the tallest blade in each clump takes a thread of
         moonlight down one side — so the near edge is a shape rather than a
         black band with teeth. */
      K.repeatX(camX, 1.24, 37, function (x, i) {
        if (K.chance(i, 240, 0.30)) return;
        var gy = H - 1 + K.vary(i, 241, -5, 2);
        var gh = K.vary(i, 242, 8, 22);
        var n = 3 + Math.floor(K.hash(i, 245) * 4);
        var spread = K.vary(i, 246, 2.4, 3.8);
        var tall = -1, tx = 0, ty = 0, tb = 0;
        ctx.fillStyle = '#0e0c1a';
        for (var b = 0; b < n; b++) {
          var lean = K.vary(i * 5 + b, 243, -6, 6) + gu * 3;
          var bh = gh * K.vary(i * 5 + b, 244, 0.45, 1);
          var bx = x + b * spread - n * spread * 0.5;
          ctx.beginPath();
          ctx.moveTo(bx - 1.6, gy);
          ctx.lineTo(bx + lean, gy - bh);
          ctx.lineTo(bx + 1.6, gy);
          ctx.closePath(); ctx.fill();
          if (bh > tall) { tall = bh; tx = bx; ty = gy; tb = lean; }
        }
        ctx.strokeStyle = 'rgba(158,180,232,.26)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tx + 1.6, ty); ctx.lineTo(tx + tb, ty - tall);
        ctx.stroke();
      });
      K.nearLip(ctx, 14, 0.40);
      K.vignette(ctx, 0.34);
    }
  };
})();
