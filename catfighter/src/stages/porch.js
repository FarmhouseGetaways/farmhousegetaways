/* =======================================================================
   6 — THE FRONT PORCH
   The sun going down behind the windmill, moths at the lantern, the
   neighbours leaning on the rail to watch.

   THE COMPOSITION, because everything else here serves it: the left third
   is the house — a warm lit wall you can read against — the right two
   thirds are sky, with the SUN and the WINDMILL sitting in them at a size
   you cannot ignore. The porch roof crops the top of the windmill, which
   is the scale contrast: something enormous and close (the roof, the corner
   posts, the lantern) framing something enormous and far.

   THE LIGHT, which is the other half of it. There are TWO lights here and
   they do different jobs:

     1. THE SUN, low in the sky at screen x=250. It is behind everything, so
        every surface facing the camera is in SHADE and every edge facing
        x=250 carries a hot rim. That is contre-jour, it is what a farm
        looks like at this hour, and it is the reason the windmill and the
        rail read at all — they are dark shapes with a hot line down one
        side, not objects with their fronts painted lighter.
     2. THE PRACTICALS — the hall through the door, the two windows, the
        hurricane lanterns on the posts, the big lantern in the corner of
        frame. They are the only warm light landing ON anything, which is
        why the porch itself is warm and everything past the rail is not.

   Everything left of the sun is rimmed on its RIGHT; everything right of it
   is rimmed on its LEFT. That single rule is worth more than any amount of
   local shading, and breaking it anywhere makes the whole picture read as
   flat again.

   NOTHING HERE IS A GRADIENT. The sky is fifteen flat bands with hard
   edges between them, the sun is eight flat bands, the clouds are flat
   slabs with a one-pixel lit underside, the floor is boards. A limited
   palette arcade board could not express a ramp and the banding IS the
   look — the same reason `K.glow` is four flat rings.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;
  var TAU = Math.PI * 2;
  /* hoisted: this is read once per leaf, and there are about 140 leaves a
     frame across the ferns on screen — no reason to build the array again
     each time */
  var FROND = ['#416630', '#4d7d3a', '#375c2b'];

  /* Where the sun is, and the rim it throws. One place, so nothing can
     drift out of agreement with it. */
  var SUN_X = 250, SUN_Y = 78, SUN_R = 46;
  var RIM = 'rgba(255,190,120,.9)';        /* the hot edge, on the sun side */
  var RIM_SOFT = 'rgba(255,168,104,.5)';   /* the same, further away */

  /* =====================================================================
     THE CLOCKS

     Four staged moments, each on its own period, and the periods share no
     factors on purpose: they interleave rather than firing together, and a
     player meets them one at a time over several rounds. The rare one is
     the point — a thing that happens every thirty seconds is scenery, a
     thing that happens once in a round is a treat.

       GUST    every  620 frames (~10.3s), runs 190  — the wind comes
                       through: windmill spins up, chimes swing, ferns
                       thrash, chaff blows across the porch
       ROCKER  every  880 frames (~14.7s), runs 330  — the sleeper shifts,
                       the chair rocks hard and damps out to still
       DOOR    every 1030 frames (~17.2s), runs 430  — the door swings
                       open, a cat comes out into the light, sits, and
                       goes back in
       GEESE   every 1310 frames (~21.8s), runs 570  — a flight crosses
                       the face of the sun
       ROOST   every 1790 frames (~29.8s), runs 150  — THE RARE ONE. The
                       three birds on the windmill brace go up together.

     `beat` returns -1 while a moment is dormant and 0..1 through it, so
     the read at the call site is `if (b >= 0)`.
     ===================================================================== */
  function beat(t, period, len, offset) {
    var p = (t + (offset || 0)) % period;
    return p < len ? p / len : -1;
  }
  /* 0 at both ends, 1 in the middle, smooth — the shape of a swell. */
  function swell(k) { return 0.5 - 0.5 * Math.cos(k * TAU); }
  /* 0 -> 1 -> 0 with a flat middle: ramp up over `edge`, hold, ramp down. */
  function hold(k, edge) {
    if (k < edge) return k / edge;
    if (k > 1 - edge) return (1 - k) / edge;
    return 1;
  }

  var GUST_P = 620, GUST_L = 190;
  function gustAt(t) {
    var p = t % GUST_P;
    return p >= GUST_L ? 0 : swell(p / GUST_L);
  }
  /* The INTEGRAL of `gustAt` from 0 to t, in frames.

     The windmill has to turn faster in a gust, and a rotation worked out as
     `t * speed(t)` jumps backwards the moment the speed drops — the blades
     visibly snap the wrong way, which reads as a bug and not as wind. The
     honest answer is to integrate the speed, and a raised cosine is the one
     swell shape whose integral is elementary, which is why it is the one
     used above. Whole periods contribute GUST_L/2 each; the part period is
     the closed form. */
  function gustSpin(t) {
    var n = Math.floor(t / GUST_P), p = t % GUST_P;
    var k = Math.min(p, GUST_L) / GUST_L;
    return n * GUST_L * 0.5 + GUST_L * (k * 0.5 - Math.sin(k * TAU) / (2 * TAU));
  }

  /* =====================================================================
     THE SKY — fifteen flat bands.

     Built as a gradient with the stops DOUBLED at every boundary, which is
     the trick that gets hard edges out of `K.sky` and keeps the whole thing
     inside its cache: two stops at the same offset with different colours
     is a hard step, and the sky then costs one blit a frame like every
     other stage's.

     The bands get thinner towards the horizon. That is not decoration — it
     is what makes the sky read as a dome seen edge-on rather than a wall,
     and it is the single cheapest depth cue in the picture.
     ===================================================================== */
  var SKY_TOP = 0, SKY_BOT = 152;
  var SKY_BANDS = [
    [0,   '#141048'], [18,  '#1b1256'], [34,  '#271764'], [48,  '#391c70'],
    [61,  '#4f1f76'], [73,  '#6b2475'], [84,  '#8a2b70'], [94,  '#a83366'],
    [103, '#c33d59'], [111, '#da4c4a'], [118, '#ec623b'], [125, '#f87c31'],
    [131, '#ff9836'], [137, '#ffb648'], [143, '#ffd270'], [148, '#ffe8a4']
  ];
  var SKY_STOPS = (function () {
    var s = [], span = SKY_BOT - SKY_TOP, n = SKY_BANDS.length;
    for (var i = 0; i < n; i++) {
      var y0 = (SKY_BANDS[i][0] - SKY_TOP) / span;
      var y1 = (i + 1 < n ? SKY_BANDS[i + 1][0] - SKY_TOP : span) / span;
      s.push([y0, SKY_BANDS[i][1]]);
      s.push([Math.min(1, y1), SKY_BANDS[i][1]]);
    }
    return s;
  })();

  /* The sun, banded.

     A plain disc with a radial gradient reads as a glowing ball of gas; the
     reference draws a setting sun as flat bands of colour stacked up, and
     the banding is what makes it look like a sprite rather than a lens
     effect. The bands get thicker towards the bottom so the disc reads as
     sinking into its own haze. Clipped once — the clip is the expensive
     call, so it is one clip and eight rectangles, not eight arcs. */
  var SUN_BANDS = [[0.13, '#ffe89c'], [0.26, '#ffd371'], [0.38, '#ffbc55'],
                   [0.49, '#ffa444'], [0.59, '#fb8e3b'], [0.69, '#f07935'],
                   [0.78, '#e26630'], [0.86, '#cf532c'], [0.93, '#b74328'],
                   [0.98, '#9c3524']];
  function sunDisc(ctx, x, y, r) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    ctx.fillStyle = '#fff7cc';
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    for (var i = 0; i < SUN_BANDS.length; i++) {
      ctx.fillStyle = SUN_BANDS[i][1];
      ctx.fillRect(x - r, y - r + r * 2 * SUN_BANDS[i][0], r * 2, r * 2);
    }
    ctx.restore();
  }

  /* Cloud bars across the face of the sun.

     Flat slabs, hard edged, with ONE lit pixel along the underside where
     the low sun catches them — drawn by filling the same path a pixel
     lower in the rim colour first and laying the slab over it, the same
     one-pass trick the ridges and the crowd use. A cloud with a lit
     underside is most of what says "the sun is BELOW this" and it costs two
     fills.

     They drift, very slowly, and independently of the camera: at 0.006px a
     frame a bar crosses the screen in about twenty minutes, which is
     exactly the speed a real one moves at and is invisible until you look
     twice. */
  var CLOUDS = [
    [-40, 44, 150, 7], [150, 58, 210, 6], [30, 70, 120, 5],
    [250, 88, 180, 6], [-10, 100, 240, 5], [190, 112, 140, 4],
    [70, 122, 190, 4]
  ];
  function cloudBar(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, y + h * 0.55);
    ctx.lineTo(x + w * 0.16, y);
    ctx.lineTo(x + w * 0.78, y);
    ctx.lineTo(x + w, y + h * 0.38);
    ctx.lineTo(x + w * 0.66, y + h);
    ctx.lineTo(x + w * 0.18, y + h);
    ctx.closePath();
  }
  function clouds(ctx, camX, t) {
    var span = W + 300;
    for (var i = 0; i < CLOUDS.length; i++) {
      var c = CLOUDS[i];
      var x = ((c[0] - t * 0.006 - camX * 0.02) % span + span) % span - 150;
      /* lit underside first, body over it */
      ctx.fillStyle = i < 4 ? 'rgba(255,186,116,.95)' : 'rgba(255,158,110,.7)';
      cloudBar(ctx, x, c[1] + 1.4, c[2], c[3]); ctx.fill();
      ctx.fillStyle = i < 4 ? 'rgba(38,20,58,.88)' : 'rgba(52,28,70,.7)';
      cloudBar(ctx, x, c[1], c[2], c[3]); ctx.fill();
    }
  }

  /* A flight of geese, right to left.

     This is the thing to wait for. The windmill turns all the time so it
     stops being an event within about four seconds; the geese are gone for
     most of a round and then cross the face of the sun, which is one of the
     two moments on this stage where the background asks for your eye. */
  function geese(ctx, t) {
    var k = beat(t, 1310, 570, 240);
    if (k < 0) return;
    /* Ends at 110, not off the left edge: the house is drawn over this
       layer, so anything past 110 is behind the wall and the flock appeared
       to vanish for half its run. It flies BEHIND the house now, which is
       what it looks like it should do anyway. */
    var lead = 430 - k * 320;
    var sink = k * 14;
    for (var i = 0; i < 7; i++) {
      var row = i < 4 ? i : i - 4, side = i < 4 ? -1 : 1;
      if (i === 0) side = 0;
      K.bird(ctx, lead + row * 12, 58 + sink + row * 6 * (side || 1) + side * 1.5,
             1 + row * 0.06, t, i * 1.7, 'rgba(28,18,40,.82)');
    }
  }

  /* Clapboard siding: a base tone, then one lit edge and one dark edge per
     board. Two rectangles a board is nothing, and without them the wall is
     the flat purple slab this stage had for a week. Contre-jour, so the
     "lit" edge is only a shade — the sun is behind this wall, not on it. */
  function siding(ctx, x, y, w, h, colour) {
    ctx.fillStyle = colour;
    ctx.fillRect(x, y, w, h);
    var lit = K.lighter(colour, 0.13), dark = K.darker(colour, 0.38);
    for (var by = y + 4; by < y + h; by += 9) {
      ctx.fillStyle = lit; ctx.fillRect(x, by, w, 1);
      ctx.fillStyle = dark; ctx.fillRect(x, by + 1, w, 1.4);
    }
  }

  /* One moth, on its own tilted orbit round the lantern. The particle system
     wanders a band, which is right for pollen and wrong for a moth — a moth
     circles a light and keeps coming back to it, and the coming back is the
     whole reason anybody looks. */
  function moth(ctx, cx, cy, t, i) {
    var sp = 0.021 + K.hash(i, 88) * 0.016;
    var a = t * sp + i * 2.1;
    var rx = 15 + K.hash(i, 89) * 22, ry = 6 + K.hash(i, 90) * 10;
    var tilt = K.hash(i, 91) * 1.2 - 0.6;
    var ca = Math.cos(tilt), sa = Math.sin(tilt);
    var ox = Math.cos(a) * rx, oy = Math.sin(a) * ry;
    var x = cx + ox * ca - oy * sa, y = cy + ox * sa + oy * ca;
    var flap = Math.abs(Math.sin(t * 0.42 + i));
    var s = 1.9 + K.hash(i, 92) * 1.1;
    ctx.fillStyle = 'rgba(246,236,206,.92)';
    ctx.beginPath();
    ctx.ellipse(x - s * 0.7, y, s, s * (0.28 + flap * 0.62), -0.5, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + s * 0.7, y, s, s * (0.28 + flap * 0.62), 0.5, 0, TAU);
    ctx.fill();
  }

  /* =====================================================================
     A CAT IN SILHOUETTE

     The neighbours out in the yard, and the one who comes out of the door.
     Both are dark shapes against a bright ground, which is the only way a
     twenty-pixel cat reads at this resolution — the toolkit's `spectator`
     paints them in its own near-white palette, and against a dusk sky that
     came out as a row of hovering ghosts.

     Built as ONE path with every subpath in it — tail, body, head, ears —
     so it can be filled twice: once shifted a pixel towards the sun for the
     rim, once in place for the body. Filling part by part would put a rim
     round the inside of every joint.
     ===================================================================== */
  function catPath(ctx, s, sit, tailA, paw) {
    var bodyY = -5.4 * s, bodyRX = 5.0 * s, bodyRY = 6.4 * s;
    if (sit) { bodyY = -6.2 * s; bodyRX = 4.6 * s; bodyRY = 7.4 * s; }
    ctx.beginPath();
    /* tail — a filled taper. A stroked tail cannot be part of a filled
       path, and two passes would want two rims. */
    ctx.moveTo(-3.4 * s, -3.2 * s);
    ctx.quadraticCurveTo(-10.4 * s, -4.4 * s - tailA * 3 * s,
                         -9.0 * s, -13.4 * s + tailA * 2.4 * s);
    ctx.quadraticCurveTo(-6.4 * s, -6.6 * s, -1.6 * s, -1.4 * s);
    ctx.closePath();
    /* body */
    ctx.moveTo(bodyRX, bodyY);
    ctx.ellipse(0, bodyY, bodyRX, bodyRY, 0, 0, TAU);
    /* haunch, on a sitting cat — the shape that says "sitting" at this size */
    if (sit) {
      ctx.moveTo(-1.2 * s, -1.2 * s);
      ctx.ellipse(-2.6 * s, -3.4 * s, 4.2 * s, 3.4 * s, -0.2, 0, TAU);
    }
    /* raised paws when cheering */
    if (paw > 0) {
      ctx.moveTo(-4.6 * s + 2 * s, -11.4 * s - paw);
      ctx.ellipse(-4.6 * s, -11.4 * s - paw, 2 * s, 2 * s, 0, 0, TAU);
      ctx.moveTo(4.6 * s + 2 * s, -11.4 * s - paw);
      ctx.ellipse(4.6 * s, -11.4 * s - paw, 2 * s, 2 * s, 0, 0, TAU);
    }
    /* head and ears */
    var hy = (sit ? -15.4 : -13.8) * s;
    ctx.moveTo(-4.6 * s, hy - 0.6 * s);
    ctx.lineTo(-3.2 * s, hy - 7.0 * s); ctx.lineTo(-0.6 * s, hy - 2.6 * s);
    ctx.closePath();
    ctx.moveTo(4.6 * s, hy - 0.6 * s);
    ctx.lineTo(3.2 * s, hy - 7.0 * s); ctx.lineTo(0.6 * s, hy - 2.6 * s);
    ctx.closePath();
    ctx.moveTo(4.7 * s, hy);
    ctx.ellipse(0, hy, 4.7 * s, 4.4 * s, 0, 0, TAU);
  }

  /* One of the neighbours. Rimmed on the RIGHT: they stand left of the sun. */
  function yardCat(ctx, x, yBase, s, t, idx, mood) {
    var ph = K.hash(idx, 3) * TAU;
    var bob = Math.sin(t * 0.06 + ph) * 1.1 * s;
    var hop = mood > 0.5 ? Math.max(0, Math.sin(t * 0.22 + ph)) * 5.2 * s * mood : 0;
    var paw = mood > 0.5 ? Math.max(0, Math.sin(t * 0.22 + ph)) * 3 * s : 0;
    var tailA = Math.sin(t * 0.09 + ph);
    ctx.save();
    ctx.translate(x, yBase - bob - hop);
    ctx.rotate(Math.sin(t * 0.03 + ph) * 0.06);
    ctx.fillStyle = RIM_SOFT;
    ctx.translate(1.3, -0.6);
    catPath(ctx, s, false, tailA, paw); ctx.fill();
    ctx.translate(-1.3, 0.6);
    ctx.fillStyle = K.pick(idx, 311, ['#251b38', '#2d2140', '#1f1730', '#332545']);
    catPath(ctx, s, false, tailA, paw); ctx.fill();
    ctx.restore();
  }

  /* =====================================================================
     THE STAGE
     ===================================================================== */
  CF.StageDefs = CF.StageDefs || {};
  CF.StageDefs.porch = {
    id: 'porch', name: 'THE FRONT PORCH',
    blurb: 'The sun behind the windmill, moths at the lantern.',
    /* the colour of the air here — see K.deepen. Warm, because the haze at
       this hour is lit by the sun rather than by the sky. Haze is kept
       lower than it was: the sky is fifteen hard bands now and a heavy haze
       melts them back into the ramp they were built to replace. */
    air: { air: '#b2748a', haze: 0.19, floorDark: 0.3, horizon: 124, back: 0.22 },
    init: function () {
      this.fluff = new P({ count: 18, kind: 'dust', depth: 0.55, seed: 67,
                           band: [40, FLOOR_Y], vx: 0.16, vy: -0.02,
                           size: 1.7, color: 'rgba(255,240,214,.9)', wobble: 2.2 });
    },
    drawBack: function (ctx, camX, t, mood) {
      var self = this;
      var gust = gustAt(t);

      K.sky(ctx, SKY_STOPS, SKY_TOP, SKY_BOT);

      /* first stars, only in the top of the sky where it is still dark */
      K.layer(ctx, camX, 0.03, function () {
        K.repeatX(camX, 0, 21, function (x, i) {
          if (!K.chance(i, 140, 0.45)) return;
          var sy = K.vary(i, 141, 4, 58);
          ctx.fillStyle = 'rgba(255,248,230,' + K.vary(i, 142, 0.15, 0.6).toFixed(2) + ')';
          ctx.fillRect(x, sy, 1.2, 1.2);
        });
      });

      /* --- THE SUN. Forty-six pixels of radius, a quarter of the screen
             across, and the brightest thing in the picture by a mile. It
             sits just left of the windmill so the tower's legs cross its
             face rather than hiding it, and it is high enough that the far
             ridge only takes the bottom third — a sun already half set has
             nothing left to look at. --- */
      var sunX = K.at(camX, 0, SUN_X) - camX * 0.012;
      /* A wide pale glow flattened the whole sky and took the bands with it.
         Kept tight and warm instead: the sun should be the brightest thing
         in the picture by a distance, not a fog light. */
      K.glow(ctx, sunX, SUN_Y, 78, 'rgba(255,138,58,.62)', 0.2);
      sunDisc(ctx, sunX, SUN_Y, SUN_R);

      K.layer(ctx, camX, 0.05, function () { geese(ctx, t); });
      clouds(ctx, camX, t);

      /* --- the land, in three plates, each flatter and cooler than the one
             in front of it, and each with ONE lit pixel along its crest.
             The crest line is the whole reason they read as distance rather
             than as three purple cut-outs: it is the sun coming over the
             top of each ridge in turn, and it is drawn by laying the same
             ridge down a pixel higher in the rim colour first. --- */
      K.ridge(ctx, camX, 0.07, 'rgba(255,164,110,.55)', 129, 30, 7);
      K.ridge(ctx, camX, 0.07, '#5b3a63', 130, 30, 7);
      K.ridge(ctx, camX, 0.13, 'rgba(255,150,104,.42)', 145, 20, 21);
      K.ridge(ctx, camX, 0.13, '#3e2a4e', 146, 20, 21);
      /* a treeline along the foot of the near ridge: one more layer between
         the mountains and the yard, and it stops the ridge reading as a
         paper cut-out laid on the sky */
      K.layer(ctx, camX, 0.19, function () {
        K.repeatX(camX, 0, 11, function (x, i) {
          var h2 = K.vary(i, 150, 6, 15);
          ctx.fillStyle = i % 3 ? '#2d2140' : '#332648';
          ctx.beginPath();
          ctx.moveTo(x - 5, 158); ctx.lineTo(x, 158 - h2); ctx.lineTo(x + 5, 158);
          ctx.closePath(); ctx.fill();
        });
      });

      /* --- THE LANDMARK: the windmill. It was eleven pixels across on the
             far ridge and you could not tell what it was; then it was
             half-height and the corner post ate it. It is now big enough
             that the porch roof crops the top of the wheel, which is the
             whole trick — a landmark you cannot fit in the frame reads as
             close, and close is what makes it a landmark.

             It is IRON, and iron at this hour against this sky is black
             with a hot line down the sun side. Nothing on it is painted
             lighter on its face; the rim does all the work. --- */
      K.layer(ctx, camX, 0.13, function () {
        var mx = K.at(camX, 0, 300) - camX * 0.03;
        var base = 168, topY = 52, wr = 37;
        /* the sun is at 250 and the tower at 300, so the tower is lit down
           its LEFT side */
        var LX = -1.3;

        function legs(dx, colour, w) {
          ctx.strokeStyle = colour; ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(mx + dx - 34, base); ctx.lineTo(mx + dx - 8, topY + 22);
          ctx.moveTo(mx + dx + 34, base); ctx.lineTo(mx + dx + 8, topY + 22);
          ctx.stroke();
        }
        legs(LX, RIM, 3.8);
        legs(0, '#191325', 3.6);
        ctx.lineWidth = 2.2; ctx.strokeStyle = '#251d38';
        ctx.beginPath();
        ctx.moveTo(mx - 22, base); ctx.lineTo(mx - 5, topY + 22);
        ctx.moveTo(mx + 22, base); ctx.lineTo(mx + 5, topY + 22);
        ctx.stroke();
        /* the cross bracing, narrowing as it goes up */
        ctx.lineWidth = 1.5; ctx.strokeStyle = '#191325';
        for (var bnd = 0; bnd < 6; bnd++) {
          var k5 = bnd / 6, k6 = (bnd + 1) / 6;
          var y0 = base + (topY + 22 - base) * k5, y1 = base + (topY + 22 - base) * k6;
          var w0 = 34 - 26 * k5, w1 = 34 - 26 * k6;
          ctx.beginPath();
          ctx.moveTo(mx - w0, y0); ctx.lineTo(mx + w1, y1);
          ctx.moveTo(mx + w0, y0); ctx.lineTo(mx - w1, y1);
          ctx.moveTo(mx - w1, y1); ctx.lineTo(mx + w1, y1);
          ctx.stroke();
        }

        /* the platform and the tank on it */
        ctx.fillStyle = '#1d1729';
        ctx.fillRect(mx - 16, topY + 18, 32, 3);
        ctx.fillStyle = RIM;
        ctx.fillRect(mx - 17, topY + 18, 1.4, 3);
        ctx.fillStyle = '#2c2440';
        ctx.fillRect(mx - 12, topY - 2, 24, 21);
        ctx.fillStyle = 'rgba(255,178,112,.75)';
        ctx.fillRect(mx - 12, topY - 2, 1.6, 21);
        ctx.fillStyle = 'rgba(255,206,150,.5)';
        ctx.fillRect(mx - 12, topY - 3, 24, 1.4);
        ctx.fillStyle = 'rgba(0,0,0,.28)';
        ctx.fillRect(mx + 6, topY - 2, 6, 21);

        /* the head, the tail vane, and the wheel */
        ctx.save();
        ctx.translate(mx, topY - 6);
        ctx.fillStyle = '#241c34';
        ctx.fillRect(-6, -5, 12, 10);
        /* the tail vane, off to one side, catching the last of the light */
        ctx.fillStyle = '#2e243f';
        ctx.beginPath();
        ctx.moveTo(5, -3); ctx.lineTo(38, -12); ctx.lineTo(38, 9); ctx.lineTo(5, 3);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,190,140,.4)'; ctx.lineWidth = 1;
        ctx.stroke();
        /* THE WHEEL. `gustSpin` is the integral of the gust, not the gust —
           see the note on it. Multiplied on here it means the wheel runs at
           about three and a half times its idle speed at the top of a gust
           and comes back down without ever turning backwards. */
        ctx.rotate(t * 0.0135 + gustSpin(t) * 0.031);
        ctx.strokeStyle = '#191325'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(0, 0, wr, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, wr * 0.42, 0, TAU); ctx.stroke();
        for (var q = 0; q < 20; q++) {
          ctx.rotate(TAU / 20);
          ctx.fillStyle = q % 2 ? '#332947' : '#241c34';
          ctx.beginPath();
          ctx.moveTo(7, -2); ctx.lineTo(wr, -4.6); ctx.lineTo(wr, 3.4); ctx.lineTo(7, 2);
          ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = '#191325';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
        ctx.restore();

        /* --- THE ROOST, and it is the rarest thing on this stage.

               Three birds sit on the brace for most of half a minute, one
               of them shuffling along it. Then all three go at once, in
               sequence, climbing away to the left across the sun. It is
               about two and a half seconds long and it happens once every
               thirty, which is the whole idea: most rounds you never see
               it, and the round you do you say something out loud. --- */
        var fly = beat(t, 1790, 150, 1200);
        var shuffle = Math.sin(t * 0.008) * 5;
        var perch = [[-13, 0], [-1, shuffle * 0.4], [11, shuffle]];
        for (var b = 0; b < 3; b++) {
          var bx = mx + perch[b][0] + perch[b][1], by = topY + 15;
          if (fly < 0) {
            /* sitting: a body, a head, and a hot pixel on the sun side */
            ctx.fillStyle = RIM;
            ctx.beginPath();
            ctx.ellipse(bx - 1.1, by, 3.2, 2.3, -0.2, 0, TAU); ctx.fill();
            ctx.fillStyle = '#191325';
            ctx.beginPath();
            ctx.ellipse(bx, by, 3.2, 2.3, -0.2, 0, TAU); ctx.fill();
            ctx.beginPath();
            ctx.arc(bx + 2.6, by - 2.6, 1.6, 0, TAU); ctx.fill();
          } else {
            /* going. Each one leaves a beat after the last, and the climb
               is quadratic in x and linear in y with a bob on it — a bird
               that leaves in a straight line reads as a thrown stone. */
            var kk = (fly - b * 0.07) / (1 - b * 0.07);
            if (kk < 0) {
              ctx.fillStyle = '#191325';
              ctx.beginPath();
              ctx.ellipse(bx, by, 3.2, 2.3, -0.2, 0, TAU); ctx.fill();
              continue;
            }
            K.bird(ctx, bx - kk * kk * 250, by - kk * 44 - Math.sin(kk * 9) * 5,
                   1.15 - kk * 0.35, t, b * 2.2, 'rgba(25,19,37,' + (1 - kk * 0.5).toFixed(2) + ')');
          }
        }
      });

      /* --- the house the porch belongs to: clapboard, two lit windows and
             a door standing open. This is the left third of the picture and
             the only place a pale cat has a dark ground to read against. --- */
      K.layer(ctx, camX, 0.34, function () {
        /* Pinned to the screen with a little drift on the end. K.at at depth
           0 returns the world x unchanged, which nails the house to the lens
           — fine for the sun, wrong for a building the fighters walk past.
           A tenth of the camera is enough to feel without ever losing it off
           the side. */
        var hx = K.at(camX, 0, 96) - camX * 0.1;
        siding(ctx, hx - 90, 36, 132, FLOOR_Y - 36, '#43344f');
        /* The corner of the house, turning back towards the sun — so it is
           the one face on the building that catches any of it. The front is
           in shade; contre-jour, the same as everything else here. */
        ctx.fillStyle = '#4e3d5c';
        ctx.fillRect(hx + 30, 36, 12, FLOOR_Y - 36);
        ctx.fillStyle = 'rgba(255,178,112,.55)';
        ctx.fillRect(hx + 40, 36, 2, FLOOR_Y - 36);
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        ctx.fillRect(hx + 28, 36, 3, FLOOR_Y - 36);

        /* ==== THE DOOR, and the cat who comes out of it ==================

           The doorway is a warm slot in a dark wall, which makes anything
           standing in it a perfect silhouette — the only way a fifteen-pixel
           cat reads at all at this resolution.

           The threshold sits at 152, not at the porch floor. A farmhouse
           has a step up into it, and the practical reason is that the porch
           rail crosses this wall from 149 down: a cat standing on the deck
           would be a pair of ears above a handrail. On the step it is a
           whole cat with the hall light behind it.                       */
        var d = beat(t, 1030, 430, 500);
        var open = d < 0 ? 0 : hold(d, 0.13);
        var openW = 4 + 19 * open;
        var THR = 152, dTop = 84, dR = hx + 36;

        /* the frame, then the panel, then the light between them */
        K.mass(ctx, hx + 2, dTop, 38, FLOOR_Y - dTop, '#2c2237',
               { top: 0, side: 4, foot: false });
        ctx.fillStyle = 'rgba(255,222,158,.95)';
        ctx.fillRect(dR - openW, dTop + 2, openW, THR - dTop - 2);
        /* the boards of the hall floor showing through, so the opening is a
           room and not a light box */
        ctx.fillStyle = 'rgba(150,96,46,.5)';
        ctx.fillRect(dR - openW, THR - 6, openW, 6);
        /* the door itself, swung inwards — a dark edge against the light */
        ctx.fillStyle = '#1d1728';
        ctx.fillRect(dR - openW - 3, dTop + 2, 3, THR - dTop - 2);

        if (d >= 0) {
          /* the cat: out at 0.10, sits from 0.24 to 0.70, back in by 0.86 */
          var walk = d < 0.24 ? Math.max(0, (d - 0.10) / 0.14)
                   : d < 0.70 ? 1
                   : Math.max(0, 1 - (d - 0.70) / 0.16);
          if (walk > 0) {
            var sitting = d > 0.26 && d < 0.72;
            var cxq = dR - openW * 0.5 - (1 - walk) * 9;
            var step = sitting ? 0 : Math.abs(Math.sin(t * 0.24)) * 1.4;
            ctx.save();
            ctx.beginPath();
            ctx.rect(dR - openW - 3, dTop, openW + 3, THR - dTop);
            ctx.clip();
            ctx.translate(cxq, THR - step);
            /* a whole-body look round, which is what a cat coming out of a
               door actually does and what makes fifteen pixels read as
               alive rather than as a stamp */
            ctx.rotate(sitting ? Math.sin(t * 0.035) * 0.09 : 0);
            ctx.fillStyle = '#170f22';
            catPath(ctx, 1.0, sitting, Math.sin(t * 0.06) * 1.2, 0);
            ctx.fill();
            ctx.restore();
          }
        }

        /* what the doorway throws onto the deck, which is how you notice it
           opened even when you are looking somewhere else */
        K.spill(ctx, dR - openW - 2, FLOOR_Y, openW + 10, H - FLOOR_Y + 14,
                'rgba(255,206,130,.72)', 0.24 + open * 0.34);
        if (open > 0.02) K.glow(ctx, dR - openW * 0.5, 120, 30 + open * 26,
                                'rgba(255,196,116,.8)', 0.10 + open * 0.16);

        /* two windows, one with somebody watching out of it. The second is
           dressed differently on purpose — two identical windows is the
           same mistake as eleven identical cats. */
        function window2(wx, wy, ww, wh, idx) {
          K.mass(ctx, wx, wy, ww, wh, '#513a28', { top: 0, side: 3, foot: false });
          /* GLASS. Not a gradient and not one flat fill either: a warm pane
             with a hotter block where the room's own lamp is behind it, and
             hard edges between. A window painted one colour is a hole. */
          ctx.fillStyle = 'rgba(255,206,132,.94)';
          ctx.fillRect(wx + 3, wy + 3, ww - 6, wh - 6);
          ctx.fillStyle = 'rgba(255,236,186,.95)';
          ctx.fillRect(wx + 3, wy + 3, ww - 6, (wh - 6) * 0.44);
          ctx.fillStyle = 'rgba(58,38,28,.75)';
          ctx.fillRect(wx + ww / 2 - 1.2, wy + 3, 2.4, wh - 6);
          ctx.fillRect(wx + 3, wy + wh / 2 - 1.2, ww - 6, 2.4);
          /* only the big window gets a glow — four flat rings apiece for two
             windows six pixels apart is three rings wasted */
          if (idx === 0) K.glow(ctx, wx + ww / 2, wy + wh / 2, ww * 1.5, 'rgba(255,206,130,.8)', 0.2);
          /* Somebody indoors, watching the fight over the sill. Sat on the
             left of the pane the hanging fern in the foreground covered them
             at both camera positions anybody checked; the right half of the
             glass is clear. */
          if (idx === 0) K.spectator(ctx, wx + ww * 0.68, wy + wh - 4, 0.62, 909, t * 0.35, null);
        }
        window2(hx - 84, 66, 24, 20, 1);
        window2(hx - 40, 48, 42, 36, 0);
        /* the sill under the big one */
        ctx.fillStyle = '#33261d';
        ctx.fillRect(hx - 43, 84, 48, 3);
        ctx.fillStyle = 'rgba(255,196,124,.4)';
        ctx.fillRect(hx - 43, 84, 48, 1);

        /* Things hung on the wall. The stretch of siding between the window
           and the rail is where a fighter stands, so it stays quiet — but
           quiet is not the same as empty, and three small shapes at the edge
           of it are the sort of thing somebody notices on their twentieth
           round here. */
        ctx.strokeStyle = '#7a6d4a'; ctx.lineWidth = 2.4; ctx.lineCap = 'butt';
        ctx.beginPath();                                   /* a horseshoe on a nail */
        ctx.arc(hx - 62, 106, 5, Math.PI, TAU);            /* the top half — an
           arc given increasing angles wraps the long way round and came out
           as a walking cane */
        ctx.moveTo(hx - 67, 106); ctx.lineTo(hx - 67, 109);
        ctx.moveTo(hx - 57, 106); ctx.lineTo(hx - 57, 109);
        ctx.stroke();
        ctx.strokeStyle = '#5f5239'; ctx.lineWidth = 1.6;  /* a coil of rope */
        for (var cq = 0; cq < 3; cq++) {
          ctx.beginPath();
          ctx.ellipse(hx - 40, 104 + cq * 2.4, 6 - cq * 0.6, 4 - cq * 0.5, 0, 0, TAU);
          ctx.stroke();
        }
        ctx.strokeStyle = '#6b563a'; ctx.lineWidth = 2;    /* a broom, leaning */
        ctx.beginPath();
        ctx.moveTo(hx - 14, 112); ctx.lineTo(hx - 8, 148); ctx.stroke();
        ctx.fillStyle = '#a68a52';
        ctx.beginPath();
        ctx.moveTo(hx - 11, 146); ctx.lineTo(hx - 4, 146);
        ctx.lineTo(hx - 2, 160); ctx.lineTo(hx - 12, 160);
        ctx.closePath(); ctx.fill();
      });

      /* --- the neighbours, out in the yard with their elbows on the rail.
             Drawn BEFORE the rail so it passes in front of them, which is
             the only thing that puts them on the far side of it.

             yBase is deliberately well ABOVE the porch floor. They are
             standing in the yard, which is further away and therefore higher
             up the screen, and it is the only height at which their heads
             clear the top rail — at 176 the rail ate all of them and the row
             was a waste.

             Drawn here rather than through K.crowdRow because the toolkit
             paints a spectator in its own near-white palette. Against this
             sky that was a row of hovering ghosts, and one flat haze band
             laid over them to fix it took the sunset down with them. In
             silhouette with a hot rim on the sun side they are the best
             thing in the middle distance instead of the worst. --- */
      K.layer(ctx, camX, 0.62, function () {
        K.repeatX(camX, 0, 46, function (x, i) {
          if (K.chance(i, 311, 0.3)) return;
          yardCat(ctx, x + K.vary(i, 314, -4, 4), 156 + K.vary(i, 313, -2, 2),
                  K.vary(i, 312, 1.15, 1.45), t + i * 13,
                  Math.abs(Math.floor(K.hash(i, 315) * 997)), mood);
        });
      });

      /* --- porch rail and posts, weathered differently --- */
      K.layer(ctx, camX, 0.62, function () {
        K.repeatX(camX, 0, 26, function (x, i) {
          ctx.fillStyle = K.pick(i, 143, ['#4a3d30', '#413628', '#544537']);
          ctx.fillRect(x, 152, 3.4, 18);
          /* the hot edge on the sun side of every baluster. It is one pixel
             and it is most of what makes this rail read as wood in front of
             a sunset rather than a row of brown ticks. */
          ctx.fillStyle = 'rgba(255,186,116,.6)';
          ctx.fillRect(x + 2.6, 152, 1, 18);
        });
        /* top and bottom rails, painted rather than filled — the top one is
           the nearest horizontal in the picture and a flat bar across it was
           the flattest thing on the stage */
        K.mass(ctx, -20, 149, W + 40, 6, '#463a2c', { top: 2, side: 0, foot: false, edge: false });
        ctx.fillStyle = 'rgba(255,198,132,.72)';
        ctx.fillRect(-20, 147, W + 40, 1.4);
        K.mass(ctx, -20, 166, W + 40, 4, '#3d3227', { top: 1, side: 0, foot: false, edge: false });
        ctx.fillStyle = 'rgba(255,178,112,.34)';
        ctx.fillRect(-20, 165, W + 40, 1);
        K.repeatX(camX, 0, 118, function (x, i) {
          K.mass(ctx, x, 24, 10, 148, '#3c3126', { top: 0, side: 3, foot: false, edge: false });
          ctx.fillStyle = 'rgba(255,186,116,.5)';
          ctx.fillRect(x + 8.6, 24, 1.4, 148);
          /* the bracket where post meets roof — a farmhouse porch has one at
             every post and it is most of what says "porch" rather than
             "fence" */
          ctx.fillStyle = '#31281f';
          ctx.beginPath();
          ctx.moveTo(x + 10, 26); ctx.lineTo(x + 34, 26); ctx.lineTo(x + 10, 50);
          ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x, 26); ctx.lineTo(x - 24, 26); ctx.lineTo(x, 50);
          ctx.closePath(); ctx.fill();
          /* a hurricane lantern hung off every other post, swinging harder
             the moment the wind gets up */
          if (K.chance(i, 144, 0.5)) {
            var lsw = K.sway(t, 0.014 + gust * 0.03, 2.2 + gust * 5.5, i);
            ctx.strokeStyle = '#2e271f'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + 5, 52); ctx.lineTo(x + 5 + lsw, 62); ctx.stroke();
            ctx.fillStyle = '#2f2820';
            ctx.fillRect(x + lsw + 0.5, 62, 9, 2.4);
            ctx.fillStyle = '#ffd27a';
            ctx.fillRect(x + lsw + 1.6, 64, 6.8, 9);
            ctx.fillStyle = '#fff0c4';
            ctx.fillRect(x + lsw + 3.2, 66, 3.4, 5);
            ctx.fillStyle = '#2f2820';
            ctx.fillRect(x + lsw + 0.5, 73, 9, 2.4);
            /* the flame gutters in a gust — a lamp that swings and burns
               steady is a lamp on a string, not a lamp in the wind */
            var pulse = 0.7 + 0.3 * Math.sin(t * 0.06 + i)
                      - gust * 0.3 * Math.abs(Math.sin(t * 0.31 + i));
            K.glow(ctx, x + lsw + 5, 68, 26, 'rgba(255,196,110,.9)', 0.34 * pulse);
          }
        });
      });

      /* --- THE ROCKING CHAIR, and the cat asleep in it.

             It used to rock for ever, at a speed no chair rocks at, which
             means it never reads as anything happening. It is STILL now,
             almost all the time — and then once every fifteen seconds the
             sleeper shifts, the chair takes off, and it damps out to nothing
             over five and a half seconds. A thing that moves all the time is
             scenery; a thing that starts is an event.

             Off to the right, clear of where the fighters stand. --- */
      K.layer(ctx, camX, 0.8, function () {
        var cx3 = K.at(camX, 0, 324) - camX * 0.02;
        var r = beat(t, 880, 330, 200);
        /* the burst starts at full swing — something made it move — and
           decays exponentially, which is what a real rocker does */
        var amp = 0.005 + (r < 0 ? 0 : 0.105 * Math.exp(-r * 4.4));
        /* 0.09 rad a frame is a 70-frame period, about 1.2 seconds a swing.
           A chair the size of a chair rocks at roughly that; the old 0.026
           was a four-second swing and read as a boat. */
        var rock = Math.sin(t * 0.09) * amp;
        /* the stretch that starts it: a paw comes out over the arm and goes
           back in over the first three quarters of a second */
        var stretch = (r >= 0 && r < 0.14) ? Math.sin(r / 0.14 * Math.PI) : 0;
        ctx.save();
        /* Sat on FLOOR_Y the rockers were under the floor, which is drawn
           last and over the top of them — a rocking chair with no rockers is
           a kitchen chair. Lifted three pixels so the curve shows. */
        ctx.translate(cx3, FLOOR_Y - 3);
        ctx.rotate(rock);
        /* Two passes, dark under pale — the same contour trick the cats use.
           Drawn dark it vanished against the sky; drawn pale it vanished
           against the tan rail behind it. With its own outline it reads
           against both. */
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        function chair(w, col) {
          ctx.strokeStyle = col; ctx.lineWidth = w;
          ctx.beginPath();                       /* the rockers */
          ctx.moveTo(-15, 0); ctx.quadraticCurveTo(0, 6, 15, 0); ctx.stroke();
          ctx.beginPath();                       /* legs, seat, back */
          ctx.moveTo(-11, -1); ctx.lineTo(-9, -19); ctx.lineTo(11, -19); ctx.lineTo(12, -1);
          ctx.moveTo(-9, -19); ctx.lineTo(-15, -45);
          ctx.moveTo(-15, -45); ctx.lineTo(2, -39);
          ctx.moveTo(-13.2, -37); ctx.lineTo(4, -31);
          ctx.stroke();
        }
        chair(5, '#241b2e');
        chair(2.2, '#9c7c58');
        chair(1, 'rgba(255,190,124,.55)');
        /* The sleeper. Drawn in the chair's own tan it was one lump with the
           chair; a dark cat on pale wood is legible at fifteen pixels, which
           is all it gets. */
        var breath = Math.sin(t * 0.05) * 0.5;
        ctx.fillStyle = '#241b2e';
        ctx.beginPath();
        ctx.ellipse(0, -25 + breath, 10.4 + stretch * 2.4, 6.4 + breath * 0.4, -0.12, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#544b60';
        ctx.beginPath();
        ctx.ellipse(-0.4, -26 + breath, 8.6 + stretch * 2, 4.8 + breath * 0.4, -0.12, 0, TAU);
        ctx.fill();
        if (stretch > 0.02) {                    /* the paw over the arm */
          ctx.strokeStyle = '#241b2e'; ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(6, -24);
          ctx.lineTo(11 + stretch * 6, -21 + stretch * 3);
          ctx.stroke();
        }
        ctx.fillStyle = '#241b2e';
        ctx.beginPath(); ctx.arc(7.4, -29, 4.6, 0, TAU); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(5.2, -32.4); ctx.lineTo(6.2, -37.4); ctx.lineTo(9.4, -32.6);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#544b60';
        ctx.beginPath(); ctx.arc(7.8, -29.6, 3.2, 0, TAU); ctx.fill();
        /* the tail hanging over the arm of the chair, twitching in its sleep */
        ctx.strokeStyle = '#241b2e'; ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-8, -24);
        ctx.quadraticCurveTo(-15, -20 + K.sway(t, 0.05, 2.2 + stretch * 4, 2), -11, -15);
        ctx.stroke();
        ctx.restore();
      });

      /* --- THE HANGING FERNS AND THE CHIMES, and why they are back here
             rather than in the foreground with the rest of the porch.

             They used to hang in drawFore at a parallax of 1.28. drawFore
             runs AFTER the fighters, they repeat every 250, and a fighter's
             centre can be anywhere from x=26 to x=358 (EDGE in game.js) — so
             as the camera tracks, a fern passes over every part of the
             picture and no phase offset keeps it out of the play area. The
             fronds ended at y=79 and hung across Mario's ear and skull; he
             appeared to be wearing a plant.

             Shortening them was tried first and it fails twice over. The
             topmost drawn pixel of a standing cat is 52 — Luigi, who is
             light, tall-eared and carries his tail high; Gracie is 75 and
             Figuro 79, but the honest line is the tallest cat on the roster,
             not the average one. So a foreground fern has to finish above 50
             — and everything above 50 is HUD during a match. A fern that
             clears every head is a fern nobody ever sees, and the shortened
             one duly vanished behind the health bars.

             So they hang from a rafter further back instead, in front of the
             rail and behind the corner posts. Full size, the cats pass in
             front of them, and all three greens are lighter than any cat's
             median tone so a silhouette still reads against the leaves. The
             foreground keeps the beam, the rafters and the lantern, which is
             where the near half of the scale contrast really lives. --- */
      K.layer(ctx, camX, 0.86, function () {
        K.repeatX(camX, 0, 250, function (x, i) {
          var sw = K.sway(t, 0.016 + gust * 0.02, 3 + gust * 8, i);
          ctx.strokeStyle = 'rgba(44,34,24,.9)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x + sw, 30); ctx.stroke();
          /* pot */
          ctx.fillStyle = '#8a5e3d';
          ctx.beginPath();
          ctx.moveTo(x + sw - 12, 30); ctx.lineTo(x + sw + 12, 30);
          ctx.lineTo(x + sw + 9, 43); ctx.lineTo(x + sw - 9, 43);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#6d482d';
          ctx.fillRect(x + sw - 13, 29, 26, 3);
          ctx.fillStyle = 'rgba(255,190,124,.4)';
          ctx.fillRect(x + sw + 9, 30, 1.4, 12);
          /* fronds — vines with leaves down each side.

             v=0 is drawn, and it is the frond that makes this a plant. With
             only the outer vines the fern was symmetrical about the pot and
             read as a garland swagged along the beam. A hanging basket seen
             from below has its longest fronds straight down the middle and
             the side ones sweeping up and out, which is why y1 gets SHORTER
             as v grows rather than longer. */
          for (var v = -3; v <= 3; v++) {
            var av = Math.abs(v);
            var lean = v * 8.6 + sw * 0.6;
            /* Out, then back in and down — a fern frond bows away from the
               pot and droops at the tip. A vine run straight out to its
               widest point (which is what the first attempt at this did) is
               a splay of leaves under a pot, not a hanging plant.

               Every vine is jittered off the seed. Seven of them drawn to the
               same formula came out as a stencil, which is the repeating
               strip mistake at the scale of one prop. */
            var hs = K.hash(i * 8 + v + 3, 151);
            var x0 = x + sw + v * 2.4, y0 = 37;
            var cx2 = x + sw + lean * (1.24 + hs * 0.22), cy2 = 55 + hs * 3;
            var x1 = x + sw + lean * 1.12, y1 = 76 - av * 4.2 + hs * 4;
            ctx.strokeStyle = '#2c4823'; ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.quadraticCurveTo(cx2, cy2, x1, y1);
            ctx.stroke();
            /* the leaves sit ON the curve — lerping to the endpoint instead
               walks them off the inside of the bow, which is why the fern
               used to look like leaves floating near a stem */
            for (var lf = 1; lf <= 4; lf++) {
              var k = lf / 4, ik = 1 - k;
              var lx2 = ik * ik * x0 + 2 * ik * k * cx2 + k * k * x1;
              var ly2 = ik * ik * y0 + 2 * ik * k * cy2 + k * k * y1;
              /* leaves taper towards the tip, and the third green keeps the
                 clump from reading as two alternating rows */
              var lr = (4.8 - k * 1.2) * (0.86 + hs * 0.24);
              ctx.fillStyle = K.pick(i * 8 + v + lf, 152, FROND);
              ctx.beginPath();
              ctx.ellipse(lx2, ly2, lr, lr * 0.5, v > 0 ? 0.62 : -0.62, 0, TAU);
              ctx.fill();
            }
          }
        });

        /* THE WIND CHIMES, on the same rafter and their own spacing.

           They are here for the gust. Idle they barely move; when the wind
           comes through the tubes swing wide and — this is the bit that
           sells it — they swing at DIFFERENT rates, so they cross each other
           and catch the light one at a time instead of moving as a comb.
           Chimes that all lean the same way are a bracket. */
        K.repeatX(camX, 0, 330, function (x, i) {
          var cx = x + 118;
          ctx.fillStyle = '#7a5a3a';
          ctx.beginPath(); ctx.arc(cx, 30, 5, Math.PI, 0); ctx.fill();
          for (var c = 0; c < 4; c++) {
            var sp = 0.028 + c * 0.006 + gust * 0.05;
            var sw = K.sway(t, sp, 2.4 + gust * 9, i * 3 + c * 1.7);
            var x0 = cx + (c - 1.5) * 3.4;
            var dx = x0 + sw;
            ctx.strokeStyle = 'rgba(150,150,166,.75)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x0, 30); ctx.lineTo(dx, 40 + c * 2); ctx.stroke();
            ctx.strokeStyle = 'rgba(214,214,226,.95)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(dx, 40 + c * 2); ctx.lineTo(dx, 54 + c * 4); ctx.stroke();
            /* the hot pixel down the sun side of each tube — brass at
               sunset, and it flashes as the tube turns */
            ctx.strokeStyle = 'rgba(255,206,150,' + (0.35 + gust * 0.5).toFixed(2) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(dx + 1, 40 + c * 2); ctx.lineTo(dx + 1, 54 + c * 4); ctx.stroke();
          }
        });
      });

      /* --- CHAFF ON THE WIND. Only while a gust is running, which is what
             makes the gust a thing you can see rather than a thing the
             windmill knows about. Straw off the yard, blowing right to left
             across the whole picture and tumbling as it goes. --- */
      if (gust > 0.04) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, gust * 1.5);
        for (var ch = 0; ch < 11; ch++) {
          var csp = 2.4 + K.hash(ch, 61) * 3.4;
          var cxx = W + 26 - ((t * csp + K.hash(ch, 62) * 1100) % (W + 100));
          var cyy = 40 + K.hash(ch, 63) * 128 + Math.sin(t * 0.07 + ch * 2) * 7;
          ctx.save();
          ctx.translate(cxx, cyy);
          ctx.rotate(t * (0.06 + K.hash(ch, 64) * 0.09) + ch);
          ctx.fillStyle = K.pick(ch, 65, ['rgba(226,198,142,.9)', 'rgba(198,166,116,.85)',
                                          'rgba(244,224,178,.8)']);
          ctx.fillRect(-2.4, -0.5, 4.8, 1.1);
          ctx.restore();
        }
        ctx.restore();
      }

      /* --- THE DECK.

             Boards, then the light on them. The sun is high and to the
             right, so the rail and its balusters throw long bars of shadow
             down and to the LEFT, all the way to the bottom of the frame —
             towards the camera. The bars are what make this a lit floor; the
             grain alone reads as lino. --- */
      K.grain(ctx, camX, 60, ['#6b4c33', '#a87c52'], 0.1);
      ctx.save();
      /* the balusters' shadows, run right off the bottom edge */
      ctx.fillStyle = 'rgba(42,20,46,.19)';
      K.repeatX(camX, 1, 26, function (x) {
        ctx.beginPath();
        ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x + 3.6, FLOOR_Y);
        ctx.lineTo(x - 30, H); ctx.lineTo(x - 35, H);
        ctx.closePath(); ctx.fill();
      });
      /* the top rail's own shadow, a hard bar across all of it */
      ctx.fillStyle = 'rgba(42,20,46,.16)';
      ctx.fillRect(0, FLOOR_Y + 10, W, 6);
      ctx.fillStyle = 'rgba(42,20,46,.1)';
      ctx.fillRect(0, FLOOR_Y + 27, W, 4);
      /* and the warm band the sun lays between them, one board deep */
      ctx.fillStyle = 'rgba(255,178,104,.11)';
      ctx.fillRect(0, FLOOR_Y + 16, W, 11);
      ctx.restore();
      K.floorPool(ctx, W * 0.22, 200, 'rgba(255,206,130,.6)', 0.34);
      K.litter(ctx, camX, 1, 66, ['rgba(120,96,64,.4)', 'rgba(200,170,120,.35)'], 0.7, 1.9);
      self.fluff.update();
      self.fluff.draw(ctx, camX, t);
    },
    drawFore: function (ctx, camX, t) {
      /* The nearest layer: the underside of the porch roof with its rafters,
         and the big lantern with the moths at it. All of it is meant to be
         too close to focus on — the near half of the scale contrast.

         NOTHING HANGS FROM THIS BEAM ANY MORE. drawFore runs after the
         fighters, so anything here reaching below y=50 is drawn over a cat's
         head, and above 50 is HUD — there is no band left for a hanging prop
         to live in. The ferns and the chimes moved back a rafter, into
         drawBack, where they can be full size and still be seen. Add nothing
         here that hangs below the beam except at the frame edges, which is
         where the lantern already is. */
      K.layer(ctx, camX, 1.28, function () {
        ctx.fillStyle = '#c2b69d'; ctx.fillRect(-10, 0, W + 20, 15);
        ctx.fillStyle = 'rgba(0,0,0,.26)'; ctx.fillRect(-10, 15, W + 20, 3);
        /* rafter ends along the beam — cheap, and they carry the light */
        K.repeatX(camX, 0, 22, function (x) {
          ctx.fillStyle = 'rgba(255,238,206,.5)'; ctx.fillRect(x, 0, 9, 3);
          ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + 9, 0, 3, 15);
        });
      });

      /* THE LANTERN, hung right in the corner of frame and far too close to
         focus on, with the moths going round it. Screen-pinned with a little
         drift: a foreground element that scrolls away is not a frame.

         Twice the size it started at. Next to the other five stages — the
         flamingo on the pool deck in particular — a hand-sized lantern was
         not framing anything, it was a prop that happened to be in front.
         The near half of a scale contrast has to be too big for the frame.

         Its GLOW is deliberately tighter than it was. K.glow is four flat
         rings now, and at radius 92 the outermost of them was a hard-edged
         disc most of the width of the house — three enormous circles laid
         over the wall, which is what banding looks like when you let it get
         bigger than the thing making it. */
      var lx = 44 - camX * 0.06 % 480;
      var lsw = K.sway(t, 0.019 + gustAt(t) * 0.02, 1.8 + gustAt(t) * 3, 4);
      var lcx = lx + lsw;
      ctx.save();
      ctx.strokeStyle = '#251e15'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lcx, 24); ctx.stroke();
      K.glow(ctx, lcx, 58, 54, 'rgba(255,192,104,.95)', 0.44);
      /* the vented cap */
      ctx.fillStyle = '#1f1913';
      ctx.beginPath();
      ctx.moveTo(lcx - 20, 36); ctx.lineTo(lcx + 20, 36);
      ctx.lineTo(lcx + 13, 23); ctx.lineTo(lcx - 13, 23);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3d3223';
      ctx.fillRect(lcx - 20, 33, 40, 2);
      /* the glass: bright core, warmer at the edges, and the wick in it */
      ctx.fillStyle = '#ffcf7a';
      ctx.fillRect(lcx - 16, 38, 32, 40);
      ctx.fillStyle = '#fff3cf';
      ctx.fillRect(lcx - 9, 42, 18, 32);
      ctx.fillStyle = '#ff9a44';
      ctx.beginPath();
      ctx.ellipse(lcx, 60, 3.6, 8 + Math.sin(t * 0.3) * 1.1, 0, 0, TAU);
      ctx.fill();
      /* the two uprights of the cage, which are what makes it a lantern and
         not a glowing box */
      ctx.fillStyle = '#1f1913';
      ctx.fillRect(lcx - 16, 38, 3, 40);
      ctx.fillRect(lcx + 13, 38, 3, 40);
      ctx.fillRect(lcx - 19, 76, 38, 7);
      ctx.fillRect(lcx - 17, 36, 34, 3);
      ctx.fillStyle = '#3d3223';
      ctx.fillRect(lcx - 19, 76, 38, 2);
      ctx.restore();
      for (var m = 0; m < 7; m++) moth(ctx, lcx, 56, t, m);

      K.vignette(ctx, 0.28);
    }
  };
})();
