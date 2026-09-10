/* =======================================================================
   3 — THE ORCHARD
   Golden hour. A low sun, four ranks of trees going back into the haze, a
   red barn, and half a dozen small things that happen on their own clocks.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  /* One light for the whole picture, and everything here is aimed at it:
     the sky bands, the rays, the rim on the near trunk, the lit side of
     every canopy, the dapple on the grass. Low and to the left. */
  var SUN_X = 62, SUN_Y = 116;

  /* The floor is a PLANE, and it has to behave like one.

     `u` is 0 at the fighters' feet and 1 at the bottom of the screen, and a
     screen coordinate taken at the feet is pushed further from the vanishing
     point the nearer it comes. Everything lying on the grass — mown stripes,
     tufts, windfall, dapple, shadows — goes through this, so it all shares
     one perspective.

     The old mown stripes were parallelograms of the SAME width top and
     bottom. At 384x224 that read as a white picket fence lying flat in the
     grass, which is exactly what the first render showed. */
  var VP = 150;                    /* vanishing point, sat under the sun */
  function spread(x, u) { return VP + (x - VP) / (1 - 0.62 * u); }

  /* --- THE MOMENTS ------------------------------------------------------

     Four staged events on four periods that share no factors, so no two
     ever start together and you meet the rarest one somewhere in your
     fourth match. At 60Hz: 7.2s, 13.1s, 19.4s, 24.2s.

     The rule they all obey: a moment has to read as a SILHOUETTE DOING
     SOMETHING at 384x224. A cat that creeps, wiggles and pounces reads at
     fourteen pixels because those are three unmistakable shapes in a row.
     A cat that grooms itself does not read at all. Pick the action first
     and the drawing second. */
  var T_APPLE = 431;    /* an apple lets go, bounces twice and rests      */
  var T_HENS  = 787;    /* four hens cross the near grass, one behind     */
  var T_STALK = 1163;   /* a cat stalks the long grass, pounces on nothing */
  var T_CROWS = 1451;   /* the crows leave the barn roof all at once      */

  /* --- THE SKY IS BANDED, not ramped ------------------------------------

     K.sky builds a linear gradient, which is 150 pixels of perfectly smooth
     interpolation across the top two thirds of the picture — the single
     most modern thing that can be put on the screen. A 1991 board could not
     express a ramp; it had a palette, so its skies came out as flat bands
     with hard steps between them, and the BANDING is the look. Eleven flat
     fillRects, unequal, thinner as they approach the horizon because that
     is where the colour actually moves fastest.

     Cheaper than the gradient it replaces, too, and no cache needed. */
  var SKY = [
    [-2,  '#a2563d'], [24,  '#b5643f'], [46,  '#c77444'], [66,  '#d6854a'],
    [85,  '#e29750'], [101, '#eaa95a'], [114, '#f0ba69'], [125, '#f4c87d'],
    [134, '#f8d694'], [142, '#fae2aa'], [150, '#fcecc1'], [176, null]
  ];

  /* A hen. Nine pixels tall, so flat fills only — a cel-shaded one is nine
     pixels of mud. Body, tail and head are one path so it is one fill. */
  function hen(ctx, x, y, s, step, body, comb) {
    ctx.fillStyle = 'rgba(18,42,14,.30)';
    ctx.beginPath();
    ctx.ellipse(x, y + 0.6, 4.4 * s, 1.4 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9913a'; ctx.lineWidth = Math.max(1, 1.1 * s);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 0.8 * s, y - 2.8 * s); ctx.lineTo(x - 0.8 * s + step * 2.1 * s, y);
    ctx.moveTo(x + 1.2 * s, y - 2.8 * s); ctx.lineTo(x + 1.2 * s - step * 2.1 * s, y);
    ctx.stroke();
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(x, y - 5.2 * s, 4.3 * s, 3.4 * s, 0, 0, Math.PI * 2);
    ctx.moveTo(x - 3.2 * s, y - 5.8 * s);
    ctx.lineTo(x - 6.6 * s, y - 9.4 * s);
    ctx.lineTo(x - 2.4 * s, y - 7.4 * s);
    ctx.closePath();
    ctx.moveTo(x + 5.6 * s, y - 9.2 * s);
    ctx.arc(x + 3.3 * s, y - 9.2 * s, 2.3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = comb;
    ctx.beginPath();
    ctx.arc(x + 2.9 * s, y - 11.6 * s, 1.1 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8a33c';
    ctx.beginPath();
    ctx.moveTo(x + 5.3 * s, y - 9.2 * s); ctx.lineTo(x + 7.5 * s, y - 8.5 * s);
    ctx.lineTo(x + 5.3 * s, y - 7.9 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#241c18';
    ctx.beginPath();
    ctx.arc(x + 4.2 * s, y - 9.8 * s, 0.55 * s, 0, Math.PI * 2); ctx.fill();
  }

  /* A crow, perched or flying. Drawn twice — the silhouette shifted a pixel
     towards the sun in a hot tone, then the body over it — which is the same
     rim trick the ridge crowd uses, and the only way a five-pixel bird reads
     against a red roof. */
  function crow(ctx, x, y, s, col, rim) {
    function shape(c, dx) {
      c.beginPath();
      c.ellipse(x + dx, y - 3.0 * s, 3.0 * s, 2.2 * s, -0.26, 0, Math.PI * 2);
      c.moveTo(x + dx - 2.4 * s, y - 3.6 * s);
      c.lineTo(x + dx - 6.0 * s, y - 5.8 * s);
      c.lineTo(x + dx - 2.0 * s, y - 2.2 * s);
      c.closePath();
      c.moveTo(x + dx + 3.9 * s, y - 5.6 * s);
      c.arc(x + dx + 2.4 * s, y - 5.6 * s, 1.5 * s, 0, Math.PI * 2);
    }
    ctx.fillStyle = rim; shape(ctx, -1.0); ctx.fill();
    ctx.fillStyle = col; shape(ctx, 0); ctx.fill();
    ctx.fillStyle = '#c8a34a';
    ctx.beginPath();
    ctx.moveTo(x + 3.6 * s, y - 6.0 * s); ctx.lineTo(x + 5.8 * s, y - 5.3 * s);
    ctx.lineTo(x + 3.6 * s, y - 4.6 * s); ctx.closePath(); ctx.fill();
  }

  /* The stalking cat. `p` is the whole pose in five numbers, because the
     phase machine below is easier to read and to retime than a pile of
     drawing code repeated six times.

       lift    how far off the grass the body is
       stretch >1 long and low, <1 bunched up
       hx, hy  where the head is, relative to the front of the body
       tail    how high the tail is carried
       legs    the step phase, 0 when the feet are planted             */
  function stalkCat(ctx, x, y, s, p) {
    var rx = 7.2 * s * p.stretch, ry = 3.4 * s / p.stretch;
    var by = y - p.lift - ry;
    ctx.fillStyle = 'rgba(16,40,12,.34)';
    ctx.beginPath();
    ctx.ellipse(x, y + 0.5, rx * 0.86, 1.5 * s, 0, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = '#8a5a30';
    ctx.lineWidth = Math.max(1, 1.4 * s); ctx.lineCap = 'round';
    ctx.beginPath();                                   /* the tail */
    ctx.moveTo(x - rx * 0.86, by);
    ctx.quadraticCurveTo(x - rx * 1.7, by + 1.5 * s, x - rx * 1.75, by - p.tail);
    ctx.stroke();
    if (p.legs !== 0) {                                /* legs, when moving */
      ctx.lineWidth = Math.max(1, 1.3 * s);
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.5, by + ry * 0.3);
      ctx.lineTo(x - rx * 0.5 - p.legs * 1.8 * s, y - p.lift);
      ctx.moveTo(x + rx * 0.5, by + ry * 0.3);
      ctx.lineTo(x + rx * 0.5 + p.legs * 1.8 * s, y - p.lift);
      ctx.stroke();
    }

    var hx = x + rx * 0.82 + p.hx, hy = by - ry * 0.1 + p.hy;
    function body(c, dx) {
      c.beginPath();
      c.ellipse(x + dx, by, rx, ry, p.tilt || 0, 0, Math.PI * 2);
      c.moveTo(hx + dx + 2.7 * s, hy);
      c.arc(hx + dx, hy, 2.7 * s, 0, Math.PI * 2);
      c.moveTo(hx + dx - 2.5 * s, hy - 1.1 * s);
      c.lineTo(hx + dx - 3.0 * s, hy - 4.6 * s);
      c.lineTo(hx + dx - 0.4 * s, hy - 2.5 * s);
      c.closePath();
      c.moveTo(hx + dx + 0.5 * s, hy - 2.6 * s);
      c.lineTo(hx + dx + 2.7 * s, hy - 4.6 * s);
      c.lineTo(hx + dx + 2.8 * s, hy - 1.1 * s);
      c.closePath();
    }
    ctx.fillStyle = '#ffdc9e'; body(ctx, -1.1); ctx.fill();
    ctx.fillStyle = '#a4682f'; body(ctx, 0); ctx.fill();
    ctx.fillStyle = '#f2e2cc';                          /* a white bib */
    ctx.beginPath();
    ctx.ellipse(x + rx * 0.5, by + ry * 0.35, rx * 0.28, ry * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* One orchard tree.

     Two or three FLAT fills, never K.paint: there are two dozen of these on
     screen and K.paint costs a clip apiece. The cel recipe survives without
     the clip because the lit pass is drawn SMALLER and offset towards the
     sun, so it can never escape the shadow shape underneath it — what is
     left round the away side is a hard crescent one step wide, which is the
     whole of what the recipe is for.

     `tones` is the aerial perspective: the far ranks get one flat fill and
     no lit pass at all, because a rank that is hazed to within ten points of
     the sky behind it has no light on it to draw. */
  function orchardTree(ctx, x, y, s, t, ph, c, tones, i) {
    var bend = K.sway(t, 0.011, 2.1 * s, ph);
    var th = 17 * s;
    ctx.fillStyle = c[0];
    ctx.beginPath();
    ctx.moveTo(x - 2.4 * s, y);
    ctx.quadraticCurveTo(x - 1.6 * s + bend * 0.4, y - 9 * s, x + bend, y - th);
    ctx.lineTo(x + bend + 2.4 * s, y - th);
    ctx.quadraticCurveTo(x + 1.6 * s + bend * 0.4, y - 9 * s, x + 2.4 * s, y);
    ctx.closePath(); ctx.fill();
    if (tones > 2) {                        /* the sun down the trunk's edge */
      ctx.fillStyle = c[4];
      ctx.fillRect(x - 2.4 * s, y - th * 0.9, Math.max(1, 0.9 * s), th * 0.9);
    }

    var cx = x + bend, cy = y - th - 5 * s;
    /* no two trees the same: the lobes move and change size per index */
    var a = K.vary(i, 150, 0.82, 1.18), b = K.vary(i, 151, 0.84, 1.16);
    var L = [[0, -1.6 * b, 11.4 * a], [-8.6 * a, 4.4, 8.4 * b], [8.4 * a, 3.2, 9.0 * b]];
    function lobes(c2, dx, dy, k) {
      c2.beginPath();
      for (var q = 0; q < 3; q++) {
        c2.moveTo(cx + L[q][0] * s + dx + L[q][2] * s * k, cy + L[q][1] * s + dy);
        c2.arc(cx + L[q][0] * s + dx, cy + L[q][1] * s + dy, L[q][2] * s * k, 0, Math.PI * 2);
      }
      c2.fill();
    }
    ctx.fillStyle = c[1]; lobes(ctx, 0, 0, 1);
    if (tones > 1) { ctx.fillStyle = c[2]; lobes(ctx, -1.15 * s, -1.0 * s, 0.87); }
    if (tones > 2) { ctx.fillStyle = c[3]; lobes(ctx, -3.0 * s, -2.6 * s, 0.50); }
  }

  CF.StageDefs = CF.StageDefs || {};
  CF.StageDefs.orchard = {
    id: 'orchard', name: 'THE ORCHARD',
    blurb: 'Golden hour, falling blossom, and chickens who are not watching.',
    /* the colour of the air here — see K.deepen */
    air: { air: '#f4c684', haze: 0.28, floorDark: 0.28, horizon: 122 },
    init: function () {
      this.petals = new P({ count: 30, kind: 'petal', depth: 0.85, seed: 33,
                            band: [10, FLOOR_Y + 10], vx: 0.28, vy: 0.20,
                            size: 1.5, color: 'rgba(255,225,235,.95)',
                            color2: 'rgba(255,246,214,.95)', wobble: 1.8 });
      this.motes = new P({ count: 18, kind: 'dust', depth: 0.6, seed: 34,
                           band: [40, FLOOR_Y], vx: -0.05, vy: -0.02,
                           size: 1.5, color: 'rgba(255,232,180,.9)' });
    },
    drawBack: function (ctx, camX, t, mood) {
      var i, q;

      /* --- sky, in flat bands ---------------------------------------- */
      for (i = 0; i < SKY.length - 1; i++) {
        ctx.fillStyle = SKY[i][1];
        ctx.fillRect(0, SKY[i][0], W, SKY[i + 1][0] - SKY[i][0]);
      }
      /* Three band boundaries get a one-pixel lighter line. This is the
         oldest trick on a palette board — the eye reads a hard bright edge
         as glare in the air, and it costs three fillRects. */
      ctx.fillStyle = 'rgba(255,232,176,.34)';
      ctx.fillRect(0, 114, W, 1); ctx.fillRect(0, 134, W, 1);
      ctx.fillStyle = 'rgba(255,244,206,.30)';
      ctx.fillRect(0, 150, W, 1);

      /* --- the sun ----------------------------------------------------

         This was a 98-pixel halo: a quarter of the picture spent on one
         soft disc bleeding into a soft sky, and the softest element in any
         of the six stages. It is 34 pixels now. A low sun is not big, it is
         BRIGHT and it is HARD — the golden hour is carried by the sky bands
         and by the rays, not by the size of the disc. Three flat rings at
         stepped alpha, a disc, and a hotter core, with the silo standing
         across its right-hand edge, because something crossing the sun is
         what gives it size. */
      ctx.save();
      ctx.fillStyle = '#ffe9a8';
      [[34, 0.11], [26, 0.15], [20, 0.20]].forEach(function (ring) {
        ctx.globalAlpha = ring[1];
        ctx.beginPath(); ctx.arc(SUN_X, SUN_Y, ring[0], 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
      ctx.fillStyle = '#ffeeb4';
      ctx.beginPath(); ctx.arc(SUN_X, SUN_Y, 14, 0, Math.PI * 2); ctx.fill();
      /* a hotter core. K.deepen hazes the whole picture towards #f4c684 on
         the way past, and a disc of #fff2c8 on a #f5c07a sky did not survive
         it — the sun was a slightly paler patch of sky. */
      ctx.fillStyle = '#fffdf0';
      ctx.beginPath(); ctx.arc(SUN_X, SUN_Y, 8, 0, Math.PI * 2); ctx.fill();

      /* --- rays -------------------------------------------------------

         K.lightShaft is a vertical gradient composited with 'lighter' — a
         shaft that fades smoothly and points straight down whatever the sun
         is doing. These are flat wedges that actually radiate FROM the sun,
         two alpha steps each so the edge between them is a hard ring of the
         same kind the halo has. Clipped to the sky: a ray landing on the
         grass is what the dapple is for. */
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, 152); ctx.clip();
      ctx.fillStyle = '#fff3cc';
      for (i = 0; i < 7; i++) {
        var ang = -1.44 + i * 0.205 + Math.sin(t * 0.0031 + i * 1.7) * 0.014;
        for (q = 0; q < 2; q++) {
          var hw = (q ? 0.030 : 0.062) + K.hash(i, 170) * 0.02;
          ctx.globalAlpha = q ? 0.07 : 0.05;
          ctx.beginPath();
          ctx.moveTo(SUN_X, SUN_Y);
          ctx.lineTo(SUN_X + Math.cos(ang - hw) * 330, SUN_Y + Math.sin(ang - hw) * 330);
          ctx.lineTo(SUN_X + Math.cos(ang + hw) * 330, SUN_Y + Math.sin(ang + hw) * 330);
          ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();

      /* --- cloud bars -------------------------------------------------

         The top third was sky and nothing else, which is a lot of nothing at
         384 across. Golden hour clouds are DARKER than the sky with a
         brilliant lit hem underneath, because the sun is below them — so the
         gold pass goes down first and the body over it, and what survives is
         a hard two-pixel hem. Two fills a cloud, no clip. Kept below y=44,
         which is where the HUD stops. */
      K.layer(ctx, camX, 0.035, function () {
        K.repeatX(camX, 0, 128, function (x, ci) {
          if (K.chance(ci, 172, 0.18)) return;
          var cy = 48 + K.vary(ci, 173, 0, 48);
          var cw = K.vary(ci, 174, 0.7, 1.35);
          var near = 1 - Math.min(1, Math.abs(x + 30 * cw - SUN_X) / 260);
          function bar(c, dy) {
            c.beginPath();
            c.ellipse(x, cy + dy, 30 * cw, 3.6 * cw, 0, 0, Math.PI * 2);
            c.moveTo(x - 34 * cw, cy + dy - 1);
            c.ellipse(x - 20 * cw, cy + dy - 1, 14 * cw, 2.4 * cw, 0, 0, Math.PI * 2);
            c.moveTo(x + 34 * cw, cy + dy + 1);
            c.ellipse(x + 18 * cw, cy + dy + 1, 16 * cw, 2.8 * cw, 0, 0, Math.PI * 2);
          }
          ctx.fillStyle = K.mix('#ffcf80', '#fff0c0', near);
          bar(ctx, 2.2); ctx.fill();
          ctx.fillStyle = K.mix('#b56b4c', '#c98358', near * 0.8);
          bar(ctx, 0); ctx.fill();
        });
      });

      K.hills(ctx, camX, 0.1, '#c98f5e', 150, 20, 4);
      K.hills(ctx, camX, 0.16, '#a9764c', 158, 13, 12);

      /* --- the far treeline -------------------------------------------

         The fourth rank, and the reason the stage has depth at all: a single
         flat hazy mass of bumps, one path and one fill, sitting above the
         ranks that have trunks. It is nearly the colour of the air, which is
         what "further away" actually looks like — and it gives the ridge of
         spectators in front of it something PLAIN to be a silhouette
         against, which is the one thing they never had. */
      K.layer(ctx, camX, 0.13, function () {
        ctx.fillStyle = '#a08a63';
        ctx.beginPath();
        K.repeatX(camX, 0, 15, function (x, i2) {
          var r = K.vary(i2, 140, 4.5, 9.5), yy = 148 - K.vary(i2, 141, 0, 5);
          ctx.moveTo(x + r, yy); ctx.arc(x, yy, r, 0, Math.PI * 2);
        });
        ctx.fill();
        ctx.fillRect(0, 146, W, 10);
        ctx.fillStyle = 'rgba(255,226,168,.20)';   /* the low sun on the tops */
        ctx.fillRect(0, 146, W, 1);
      });

      /* --- the second landmark: the red barn out across the field, with the
             low sun on the near face of it. One landmark on one side of the
             picture leaves the other side empty; two, at different distances,
             is what makes it a place. --- */
      K.layer(ctx, camX, 0.19, function () {
        /* Screen-anchored, like every other landmark here: K.at with a depth
           of 0 returns the coordinate unchanged, so a landmark placed this way
           stays put in the frame while the layers slide past behind it. Put it
           past 384 and it is simply never on screen. */
        var bx = K.at(camX, 0, 178) - camX * 0.04;
        var BASE = 150, WALL = 96, RIDGE = 52;   /* the barn, top to bottom */
        var j, cf;

        /* The shadow the barn throws east, away from the sun. A building
           this size standing on a field with nothing under it floats. */
        ctx.fillStyle = 'rgba(78,46,30,.34)';
        ctx.beginPath();
        ctx.moveTo(bx - 66, BASE - 2); ctx.lineTo(bx + 66, BASE - 2);
        ctx.lineTo(bx + 108, BASE + 6); ctx.lineTo(bx - 40, BASE + 6);
        ctx.closePath(); ctx.fill();

        /* The gambrel roof, painted rather than filled. It was 46 units
           across and a fighter is 90 tall — at that size it was a shed in a
           field, not the second landmark, and the eye went straight past it.
           It is now wider than a fighter is tall and its ridge is above
           their heads, which is the whole point of scale contrast: the tree
           dwarfs the barn, the barn dwarfs the cats. */
        function roof(c) {
          c.beginPath();
          c.moveTo(bx - 74, WALL); c.lineTo(bx - 64, RIDGE + 22);
          c.lineTo(bx - 26, RIDGE); c.lineTo(bx + 26, RIDGE);
          c.lineTo(bx + 64, RIDGE + 22); c.lineTo(bx + 74, WALL);
          c.closePath();
        }
        K.paint(ctx, roof, '#8f3b29', { step: 5, lx: -1, ly: 0.5, shade: 0.4, hi: 0.24 });
        /* The hot edge along the sunward pitch and the ridge. Two hard
           strokes, and they are what turn a red shape into a roof with a
           low sun on it. */
        ctx.strokeStyle = 'rgba(255,224,160,.62)'; ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx - 73, WALL - 1); ctx.lineTo(bx - 63, RIDGE + 21);
        ctx.lineTo(bx - 25, RIDGE + 0.7); ctx.lineTo(bx + 26, RIDGE + 0.7);
        ctx.stroke();

        /* The walls. They were '#b2402c', which measured at luminance 96 —
           the SAME value as Figuro's glove red, #c0392f, and this wall fills
           the middle third of the frame at exactly his chest height. At 1x
           his torso melted into it and only the navy trunks survived.
           Oxblood at 66 puts thirty points of value between them while the
           barn still reads as red, and the roof is now the LIGHTER half of
           the shape, so the landmark is a dark mass with the low sun on the
           gambrel rather than a mid-value red field standing behind the
           fight. Do not take it back up. */
        K.mass(ctx, bx - 66, WALL, 132, BASE - WALL, '#7a2c1f',
               { top: 0, side: 13, light: 1, foot: false });
        /* Board joints, so 132 pixels of red is not one flat panel. Dark
           lines vanished once the wall went to oxblood; the joints are the
           gaps between boards catching the low sun instead. */
        ctx.strokeStyle = 'rgba(255,214,160,.13)'; ctx.lineWidth = 1;
        for (j = 1; j < 8; j++) {
          ctx.beginPath();
          ctx.moveTo(bx - 66 + j * 16.5, WALL); ctx.lineTo(bx - 66 + j * 16.5, BASE);
          ctx.stroke();
        }
        /* A stone footing. A wall that meets the grass with nothing at the
           join reads as a flat panel standing on end. */
        ctx.fillStyle = '#6a5b48';
        ctx.fillRect(bx - 66, BASE - 7, 132, 7);
        ctx.fillStyle = 'rgba(255,226,168,.22)';
        ctx.fillRect(bx - 66, BASE - 7, 132, 1);

        /* Two windows with the sun full in them. Warm light in the middle
           distance is the cheapest depth cue this stage has, and a pane
           catching a low sun is brighter than anything else on the wall. */
        [-52, 46].forEach(function (wx) {
          ctx.fillStyle = '#2e1109';
          ctx.fillRect(bx + wx, WALL + 10, 13, 15);
          ctx.fillStyle = '#ffdc92';
          ctx.fillRect(bx + wx + 1, WALL + 11, 11, 13);
          ctx.fillStyle = '#fff6d4';
          ctx.fillRect(bx + wx + 1, WALL + 11, 5, 6);
          ctx.fillStyle = '#2e1109';
          ctx.fillRect(bx + wx + 6, WALL + 11, 1, 13);
          ctx.fillRect(bx + wx + 1, WALL + 17, 11, 1);
        });

        /* the great door, standing open — the warm light coming out of it is
           the one dark-to-light contrast in the middle distance, and it is
           what stops the barn reading as a flat red rectangle. The spill was
           K.spill, which is a linear gradient; it is three flat wedges now,
           for the same reason the halo is three flat rings. */
        ctx.fillStyle = '#361009';
        ctx.fillRect(bx - 22, 108, 44, BASE - 108);
        ctx.save();
        ctx.fillStyle = '#ffd684';
        [[0.30, 1.0], [0.16, 1.7], [0.09, 2.5]].forEach(function (sp) {
          ctx.globalAlpha = sp[0];
          ctx.beginPath();
          ctx.moveTo(bx - 20, 110); ctx.lineTo(bx + 20, 110);
          ctx.lineTo(bx + 20 - 14 * sp[1], 110 + 22 * sp[1]);
          ctx.lineTo(bx - 20 - 20 * sp[1], 110 + 22 * sp[1]);
          ctx.closePath(); ctx.fill();
        });
        ctx.restore();
        ctx.fillStyle = '#efe0c0';                     /* the door, slid aside */
        ctx.fillRect(bx + 22, 106, 22, BASE - 106);
        ctx.strokeStyle = '#a8845a'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(bx + 22, 108); ctx.lineTo(bx + 44, BASE - 2);
        ctx.moveTo(bx + 44, 108); ctx.lineTo(bx + 22, BASE - 2);
        ctx.stroke();
        ctx.strokeStyle = '#3a1c16'; ctx.lineWidth = 1.6;   /* the door rail */
        ctx.beginPath(); ctx.moveTo(bx - 26, 105); ctx.lineTo(bx + 48, 105); ctx.stroke();

        /* the hay hood and the loft door, with a cat sat in it watching the
           whole business from a safe height — one of the things to find */
        ctx.fillStyle = '#3c150f';
        ctx.beginPath();
        ctx.moveTo(bx - 13, RIDGE - 3); ctx.lineTo(bx + 13, RIDGE - 3);
        ctx.lineTo(bx + 10, RIDGE + 9); ctx.lineTo(bx - 10, RIDGE + 9);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#220d09';
        ctx.fillRect(bx - 12, RIDGE + 12, 24, 22);
        K.spectator(ctx, bx, RIDGE + 34, 0.5, 77, t, mood);
        ctx.strokeStyle = '#3a1c16'; ctx.lineWidth = 1;   /* the block and tackle */
        ctx.beginPath(); ctx.moveTo(bx + 8, RIDGE + 6); ctx.lineTo(bx + 8, RIDGE + 26); ctx.stroke();
        ctx.fillStyle = '#6b4a2e';
        ctx.fillRect(bx + 5, RIDGE + 26, 7, 5);

        /* The silo, ringed — the rings are what tell it from a chimney and
           they cost five strokes.

           It stood on the RIGHT of the barn to begin with, which put it in
           the same few pixels as the rope swing and the near trunk, and
           three things at three depths in one place is a mess. Moved to the
           sunward side, where it stands across the setting sun instead and
           gives that half of the picture its vertical. */
        K.mass(ctx, bx - 106, 58, 32, BASE - 58, '#cdbea3',
               { top: 0, side: 10, light: 1, foot: false });
        ctx.strokeStyle = 'rgba(70,58,44,.28)'; ctx.lineWidth = 1;
        for (j = 1; j < 6; j++) {
          ctx.beginPath();
          ctx.moveTo(bx - 106, 58 + j * 15); ctx.lineTo(bx - 74, 58 + j * 15); ctx.stroke();
        }
        K.paint(ctx, function (c) {
          c.beginPath();
          c.ellipse(bx - 90, 58, 17, 11, 0, Math.PI, 0);
          c.closePath();
        }, '#9a8b74', { step: 3, lx: -1, ly: 0.6, shade: 0.34 });
        ctx.fillStyle = 'rgba(255,238,190,.55)';   /* the sun down its edge */
        ctx.fillRect(bx - 107, 58, 1.6, BASE - 58);

        /* a weather vane on the ridge, turning slowly */
        var vn = Math.sin(t * 0.004);
        ctx.strokeStyle = '#3a1c16'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(bx, RIDGE - 14); ctx.lineTo(bx, RIDGE - 3); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx - 6 * vn, RIDGE - 14); ctx.lineTo(bx + 6 * vn, RIDGE - 14);
        ctx.stroke();

        /* --- THE CROWS, every twenty-four seconds ---------------------

           Four of them on the roof and the silo for twenty seconds, which is
           long enough that you stop seeing them — then one head comes up,
           and two frames later all four are off the roof at once. Leaving
           TOGETHER is the whole joke; a stagger of a few frames is what makes
           it read as a flock rather than as four separate birds. The roof is
           then empty for six seconds, which is its own small pleasure once
           you have noticed them at all. */
        var cw = t % T_CROWS;
        var PERCH = [[-22, RIDGE + 0.5], [-6, RIDGE + 0.5], [14, RIDGE + 0.5],
                     [-90, 48]];
        if (cw < 1120) {
          for (j = 0; j < 4; j++) {
            var lead = cw - 980 - j * 3;               /* the lift-off clock */
            var cxp = bx + PERCH[j][0], cyp = PERCH[j][1];
            if (lead < 0) {
              /* perched: a slow head bob, and a startle at the very end */
              cf = cw > 968 ? Math.sin((cw - 968) * 0.9) * 1.2 : 0;
              crow(ctx, cxp, cyp - Math.abs(Math.sin(t * 0.02 + j * 1.9)) * 0.9 + cf,
                   0.95, '#241c1c', 'rgba(255,222,158,.85)');
            } else {
              var u2 = lead / 140;
              K.bird(ctx, cxp + u2 * u2 * 340, cyp - 4 - u2 * u2 * 120 - u2 * 16,
                     1.15, t, j * 1.4, 'rgba(36,28,28,.9)');
            }
          }
        }

        /* three rooks going round the silo — the slow loop out in the
           distance, against the swing's fast one up close */
        for (j = 0; j < 3; j++) {
          var a2 = t * 0.006 + j * 2.2;
          K.bird(ctx, bx - 90 + Math.cos(a2) * 58, 40 + Math.sin(a2) * 13,
                 0.7 + 0.3 * Math.sin(a2), t, j * 2.1, 'rgba(58,34,26,.75)');
        }
      });

      /* --- the crowd, on the ridge behind the orchard -------------------

         This was a K.crowdRow of full-colour spectators at y=158, sat along
         the fence rail. Two things were wrong with it and they compound:
         158 is fourteen pixels above the floor — the fighters' shins — and
         K.spectator draws a little cat in the same palette family as the
         roster, so at 1x they read as small copies of the fighters standing
         in the ring. That is the one silhouette that must never appear at
         that height.

         First fix was to raise them to 141 and blacken them, still in front
         of the trees. It failed for a reason worth writing down: a
         ten-pixel dark shape standing among tree trunks IS a tree trunk. A
         silhouette only works if there is something plain behind it.

         So they went BEHIND the orchard instead, standing on the tan hill
         band at y=147 and drawn at the barn's own depth, so the two never
         slide against each other and the row has real ground under it — and
         the far treeline above now gives them the plain backdrop the second
         attempt was missing. The trees cut them off at the chest and the
         heads and ears clear the canopies. That height is not arbitrary: at
         149 all but one of them hid behind the near rank at half the camera
         positions, and anything above about 144 lifts their feet off the
         band so they float wherever a tree happens not to be. Nineteen apart
         rather than twenty-seven, so enough of them land in the gaps to read
         as an audience. The sun is out at x=62 behind them, which makes
         near-black with a hard warm rim on the sunward side the honest
         drawing rather than a stylistic choice. Two flat fills each, no cel
         shading: a hard rim reads at this size and a shaded one is mud. It
         also costs less than the row it replaced, which drew a whole little
         cat apiece. --- */
      K.layer(ctx, camX, 0.19, function () {
        K.repeatX(camX, 0, 19, function (x, i2) {
          if (K.chance(i2, 61, 0.24)) return;
          var sc = K.vary(i2, 62, 0.92, 1.18);
          var ph = K.hash(i2, 63) * 6.28;
          /* the idle bob, and the hop when a round has just been won */
          var y = 147 + K.vary(i2, 64, -3, 3)
                  - Math.sin(t * 0.06 + ph) * 1.0 * sc
                  - (mood > 0.5 ? Math.max(0, Math.sin(t * 0.22 + ph)) * 5 * sc * mood : 0);
          var lean = Math.sin(t * 0.03 + ph) * 0.06;

          function shape(c, dx) {
            var cx = x + K.vary(i2, 65, -4, 4) + dx, hy = y - 11 * sc;
            var hx = cx + lean * 10;
            c.beginPath();
            /* SHOULDERS WIDER THAN THE HEAD, and that is the whole trick.
               The first pass had them the same width, so head, neck and body
               fused into one column with a V cut in the top and every
               spectator read as a fence post. The step in at the neck is
               what says "living thing" at eleven pixels tall. */
            c.moveTo(cx - 5.4 * sc, y + 5 * sc);
            c.lineTo(cx - 4.2 * sc + lean * 8, hy + 2.2 * sc);
            c.lineTo(cx + 4.2 * sc + lean * 8, hy + 2.2 * sc);
            c.lineTo(cx + 5.4 * sc, y + 5 * sc);
            c.closePath();
            c.moveTo(hx + 3.0 * sc, hy);
            c.arc(hx, hy, 3.0 * sc, 0, Math.PI * 2);
            /* Ears out past the width of the skull, with sky between them.
               Tucked inside the head's own circle they simply disappear —
               an ear only exists in a silhouette if it breaks the outline.
               Not much taller than that, though — at 6.6 units on a 3-unit
               skull the row read as rabbits. */
            c.moveTo(hx - 2.9 * sc, hy - 0.8 * sc);
            c.lineTo(hx - 4.4 * sc, hy - 5.4 * sc);
            c.lineTo(hx - 0.7 * sc, hy - 2.9 * sc);
            c.closePath();
            c.moveTo(hx + 0.7 * sc, hy - 2.9 * sc);
            c.lineTo(hx + 4.4 * sc, hy - 5.4 * sc);
            c.lineTo(hx + 2.9 * sc, hy - 0.8 * sc);
            c.closePath();
            /* a tail up behind on about half of them, so the ridge is not a
               row of fourteen identical lumps */
            if (K.chance(i2, 66, 0.5)) {
              c.moveTo(cx - 4.4 * sc, y + 3 * sc);
              c.lineTo(cx - 7.2 * sc, y - 7 * sc);
              c.lineTo(cx - 5.4 * sc, y - 7.6 * sc);
              c.lineTo(cx - 2.4 * sc, y + 2 * sc);
              c.closePath();
            }
          }
          /* the rim first, as the same silhouette shifted towards the sun,
             then the body over it — what survives is a hard edge of low sun
             a pixel or so wide down the sunward side */
          ctx.fillStyle = 'rgba(255,228,168,.9)';
          shape(ctx, -1.2); ctx.fill();
          ctx.fillStyle = K.pick(i2, 67, ['#2b2320', '#342a25', '#241d1b']);
          shape(ctx, 0); ctx.fill();
        });
      });

      /* --- three ranks of trees, every one a different size and shade ---

         The recession is not just size: each rank back is FLATTER as well as
         cooler, because that is what haze actually does. The far rank gets
         one flat tone and no light on it at all; the middle gets two; only
         the near rank, which is the one standing behind the fighters, gets
         the full shadow / base / lit-crown recipe and a lit edge down its
         trunks.

         The three ranks used to run '#2f5c28'/'#3d7534' up to
         '#457f38'/'#57a049'. The nearest rank stands directly behind the
         fighters and its lit green measured at luminance 128 — ten points
         off Luigi's jade scarf, #2f9e63, in the same hue family, so his one
         piece of identity colour landed on the stage's own colour and
         disappeared. They are olive now: same three-step recession, a
         quarter less saturation, and the near rank a good twenty points
         darker. Golden hour flatters an olive orchard anyway; a saturated
         emerald was never what a late sun does to leaves. */
      [/* depth, scale, tones, [trunk, shadow, base, lit, trunkLit] */
       [0.22, 0.62, 1, ['#5c4a34', '#4c6141', '#4c6141', '#4c6141', '#4c6141']],
       [0.32, 0.80, 2, ['#503c28', '#33512c', '#426636', '#426636', '#426636']],
       [0.46, 1.00, 3, ['#4a3524', '#2e4b28', '#3d5f33', '#6d9040', '#8a6a3e']]
      ].forEach(function (rank, ri) {
        K.layer(ctx, camX, rank[0], function () {
          K.repeatX(camX, 0, 58 - ri * 6, function (x, i2) {
            if (K.chance(i2, 92 + ri, 0.16)) return;
            var sc = rank[1] * K.vary(i2, 95 + ri, 0.78, 1.22);
            orchardTree(ctx, x, 152 + ri * 6, sc, t, i2 * 1.7, rank[3], rank[2], i2 + ri * 13);
            /* the odd apple, on the rank you can actually see one on */
            if (ri === 2 && K.chance(i2, 98 + ri, 0.34)) {
              ctx.fillStyle = '#c9382f';
              ctx.beginPath();
              ctx.arc(x + K.vary(i2, 99, -8, 8) * sc, 152 + ri * 6 - 34 * sc, 2.4 * sc, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        });
      });

      /* --- the fence, with a gap or two --- */
      K.layer(ctx, camX, 0.6, function () {
        ctx.strokeStyle = '#b8935e'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-20, 158); ctx.lineTo(W + 20, 158); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-20, 166); ctx.lineTo(W + 20, 166); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,232,178,.34)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-20, 156.6); ctx.lineTo(W + 20, 156.6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-20, 164.6); ctx.lineTo(W + 20, 164.6); ctx.stroke();
        K.repeatX(camX, 0, 42, function (x, i2) {
          ctx.fillStyle = K.pick(i2, 100, ['#a8814e', '#b8935e', '#96703f']);
          ctx.fillRect(x, 150, 4.5, FLOOR_Y - 150);
          ctx.fillStyle = 'rgba(255,232,178,.3)';
          ctx.fillRect(x, 150, 1, FLOOR_Y - 150);
        });
      });

      /* --- the floor: a mown orchard in perspective ---------------------

         A third of the picture, and it was a linear gradient with stripes
         painted on it — an airbrush where the ground should be. It is six
         flat bands now, spaced in perspective so they crowd together towards
         the fighters' feet and open out at the bottom of the screen. A floor
         made of steps reads as ground; a floor made of a ramp reads as an
         airbrush, and no amount of detail laid on top of it fixes that.

         Every stripe, tuft, apple and pool of dapple below runs through
         spread(), so the whole plane converges on one vanishing point. */
      var BAND = [[0, '#6aa949'], [0.055, '#61a043'], [0.14, '#59963e'],
                  [0.27, '#518c39'], [0.45, '#4a8234'], [0.68, '#437830'], [1, null]];
      for (i = 0; i < BAND.length - 1; i++) {
        ctx.fillStyle = BAND[i][1];
        ctx.fillRect(0, FLOOR_Y + BAND[i][0] * (H - FLOOR_Y), W,
                     (BAND[i + 1][0] - BAND[i][0]) * (H - FLOOR_Y) + 1);
      }

      /* mown stripes: the mower went up and back, so every other band took
         the light the other way. Wedges, wide at the near edge. */
      K.repeatX(camX, 1, 40, function (x, i2) {
        var lit = Math.abs(i2) % 2 === 0;
        ctx.fillStyle = lit ? 'rgba(255,250,190,.13)' : 'rgba(20,54,14,.12)';
        ctx.beginPath();
        ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x + 40, FLOOR_Y);
        ctx.lineTo(spread(x + 40, 1), H); ctx.lineTo(spread(x, 1), H);
        ctx.closePath(); ctx.fill();
      });

      /* The shadow of the near trunk at the left edge, thrown down and to the
         right: the sun is low and away at x=62, so anything standing left of
         it lays a long shadow across the mown grass. It has to go through
         spread() like everything else or it crosses the stripes at the wrong
         angle and the plane comes apart.

         The great tree's own shadow is not drawn — it stands to the RIGHT of
         the sun, so its shadow falls off the right-hand edge of the frame,
         and inventing one going the other way would put two suns in the
         picture. It gets a contact shadow at the base instead. */
      var su = 0.66, sy2 = FLOOR_Y + su * (H - FLOOR_Y);
      ctx.fillStyle = 'rgba(22,48,18,.26)';
      ctx.beginPath();
      ctx.moveTo(0, FLOOR_Y); ctx.lineTo(46, FLOOR_Y);
      ctx.lineTo(spread(140, su), sy2); ctx.lineTo(spread(86, su), sy2);
      ctx.closePath(); ctx.fill();

      /* --- DAPPLE ------------------------------------------------------

         The one thing a daylight stage has that a night one does not: broken
         sun coming through a canopy and landing on the grass in hard-edged
         pools. It replaces K.floorPool, which was a radial gradient — the
         same soft disc the sun's halo used to be, laid flat.

         Two flat ellipses per pool at stepped alpha, so the pool has a rim
         and a hotter middle, and the whole field drifts a pixel or two on
         the same clock the canopies sway on, which is what makes it read as
         light through leaves rather than as paint on the ground. Thinned to
         under half in the middle third of the screen, because that is where
         the fight is and a bright patch under a dark cat is the one thing
         that costs readability. */
      var drift = K.sway(t, 0.0062, 2.6, 0), drift2 = K.sway(t, 0.0041, 1.7, 2);
      K.repeatX(camX, 1, 44, function (x, i2) {
        for (q = 0; q < 3; q++) {
          var n = i2 * 3 + q;
          if (K.chance(n, 180, 0.28)) continue;
          var u = K.vary(n, 181, 0.04, 1);
          var px = spread(x + K.vary(n, 182, 0, 44), u) + drift * (0.4 + u);
          var py = FLOOR_Y + u * (H - FLOOR_Y) + drift2 * u * 0.4;
          if (px < -20 || px > W + 20) continue;
          var m = (px > 108 && px < 268) ? 0.42 : 1;
          var rw = K.vary(n, 183, 5, 14) * (0.5 + u * 1.1);
          ctx.fillStyle = 'rgba(255,236,168,' + (0.10 * m).toFixed(3) + ')';
          ctx.beginPath();
          ctx.ellipse(px, py, rw, rw * 0.42, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,246,198,' + (0.11 * m).toFixed(3) + ')';
          ctx.beginPath();
          ctx.ellipse(px - rw * 0.14, py - rw * 0.06, rw * 0.55, rw * 0.24, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      /* tufts, clover, windfall. Bigger and looser the nearer they are —
         one size everywhere is what makes a floor read as wallpaper. */
      K.layer(ctx, camX, 1, function () {
        K.repeatX(camX, 0, 15, function (x, i2) {
          for (var q2 = 0; q2 < 3; q2++) {
            var u2 = K.vary(i2 * 3 + q2, 110, 0.02, 1);
            var px = spread(x + K.vary(i2 * 3 + q2, 111, 0, 15), u2);
            var py = FLOOR_Y + u2 * (H - FLOOR_Y);
            var sc = 0.6 + u2 * 1.05;
            var r = K.hash(i2 * 3 + q2, 112);
            if (r < 0.13) {                       /* a windfall apple */
              ctx.fillStyle = 'rgba(20,44,16,.35)';
              ctx.beginPath();
              ctx.ellipse(px, py + 1.4 * sc, 2.4 * sc, 1.1 * sc, 0, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = K.pick(i2 * 3 + q2, 113, ['#c9382f', '#d9532f', '#a82c26']);
              ctx.beginPath();
              ctx.arc(px, py, 1.9 * sc, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = 'rgba(255,236,170,.5)';
              ctx.beginPath();
              ctx.arc(px - 0.7 * sc, py - 0.7 * sc, 0.7 * sc, 0, Math.PI * 2); ctx.fill();
            } else if (r < 0.3) {                 /* drifted blossom */
              ctx.fillStyle = 'rgba(255,232,238,.42)';
              ctx.beginPath();
              ctx.ellipse(px, py, 3.4 * sc, 1.1 * sc, 0, 0, Math.PI * 2); ctx.fill();
            } else {                              /* a tuft the mower missed */
              ctx.strokeStyle = 'rgba(28,64,20,' + K.vary(i2 * 3 + q2, 114, 0.16, 0.4).toFixed(2) + ')';
              ctx.lineWidth = Math.max(1, sc * 0.9);
              var gh = K.vary(i2 * 3 + q2, 115, 2, 5) * sc;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px + K.sway(t, 0.02, 1.6, i2 + q2), py - gh);
              ctx.stroke();
            }
          }
        });
      });

      /* --- THE HENS, every thirteen seconds ---------------------------

         Four of them cross the near grass in a line, and the fourth is a
         chick half the size who is late and running to catch up. The gap is
         the joke, so it has to be big enough to see: it opens to twenty-odd
         pixels and closes to eight over the crossing.

         The step is a plain sine on the leg pair rather than K.chicken's
         walk-stop-peck cycle, because a hen that stops to peck while its
         body keeps sliding right is a hen moonwalking. */
      var hf = t % T_HENS;
      if (hf < 610) {
        var hu = hf / 610;
        var hx0 = -34 + hu * (W + 110) - camX * 0.35;
        var CHK = [[0, 1, '#e8b45c'], [-24, 0.94, '#f2ecdd'], [-47, 1.02, '#d9c9a8']];
        for (i = 0; i < 3; i++) {
          hen(ctx, hx0 + CHK[i][0], 205 + i * 2.5, CHK[i][1],
              Math.sin(hf * 0.42 + i * 2.1), CHK[i][2], '#c9382f');
        }
        /* the chick: behind, and closing */
        var lagx = hx0 - 78 + hu * 22;
        hen(ctx, lagx, 208, 0.52, Math.sin(hf * 0.72), '#f6dc8e', '#e0714a');
      }

      /* --- THE STALK, every nineteen seconds --------------------------

         A barn cat creeps through the grass, freezes, does the wiggle every
         cat does before it commits, launches — and lands on nothing. Then it
         sits up and looks around as though that had been the plan.

         The wiggle is the reason this reads at fourteen pixels. Creep,
         wiggle, leap are three unmistakable shapes in a row, and the wiggle
         is the one nobody can mistake for anything else. It is on the
         longest of the four clocks bar the crows precisely because it is the
         best of them: a thing you see rarely is a thing you point at. */
      var sf = t % T_STALK;
      if (sf < 434) {
        var sx, sp, u3;
        if (sf < 150) {                              /* creeping in */
          u3 = sf / 150;
          sx = 24 + u3 * 78;
          sp = { lift: 0, stretch: 1.20, hx: 1.2, hy: 1.9,
                 tail: -1.2, legs: Math.sin(sf * 0.13) * 0.8, tilt: 0.05 };
        } else if (sf < 198) {                       /* frozen, then the wiggle */
          var wg = sf > 168 ? Math.sin((sf - 168) * 0.95) : 0;
          sx = 102 + wg * 0.8;
          sp = { lift: 0, stretch: 1.24, hx: 1.4, hy: 2.2,
                 tail: 4 + wg * 3, legs: 0, tilt: 0.04 + wg * 0.02 };
        } else if (sf < 216) {                       /* the pounce */
          u3 = (sf - 198) / 18;
          sx = 102 + u3 * 32;
          sp = { lift: 22 * 4 * u3 * (1 - u3), stretch: 1.42, hx: 1.6, hy: 1.0,
                 tail: 7, legs: -1.5, tilt: -0.16 };
        } else if (sf < 240) {                       /* pinned it. pinned nothing */
          sx = 134;
          sp = { lift: 0, stretch: 0.84, hx: 0.4, hy: 3.4, tail: 2, legs: 0, tilt: 0 };
        } else if (sf < 306) {                       /* sits up, looks about */
          u3 = (sf - 240) / 66;
          sx = 134;
          sp = { lift: 0, stretch: 0.78 - u3 * 0.06, hx: -0.6 + Math.sin(u3 * 7.2) * 2.2,
                 hy: -2.6 - u3 * 1.4, tail: 3.5, legs: 0, tilt: 0 };
        } else {                                     /* strolls off, tail up */
          u3 = (sf - 306) / 128;
          sx = 134 + u3 * (W + 40 - 134);
          sp = { lift: 0, stretch: 1.02, hx: 0.4, hy: -1.0,
                 tail: 7 + Math.sin(sf * 0.09) * 1.2, legs: Math.sin(sf * 0.26) * 1.1, tilt: 0 };
        }
        stalkCat(ctx, sx - camX * 0.35, 202, 1.05, sp);
        if (sf >= 216 && sf < 228) {                 /* grass flicked up by it */
          ctx.strokeStyle = 'rgba(32,70,22,.6)'; ctx.lineWidth = 1;
          for (i = 0; i < 3; i++) {
            var gx = 134 - camX * 0.35 + (i - 1) * 5;
            ctx.beginPath();
            ctx.moveTo(gx, 202);
            ctx.lineTo(gx + (i - 1) * 3, 202 - 5 - (sf - 216) * 0.4);
            ctx.stroke();
          }
        }
      }

      /* --- THE LANDMARK: the old orchard tree ---------------------------

         The brief asks for one huge thing the eye returns to, and the
         previous version of this was a bush the size of a fighter's head
         sitting at 0.34. A landmark has to be BIG — this one runs off the
         top of the frame, fills the right third, and doubles as the right
         edge of the picture, which is why the second frame trunk that used
         to stand there is gone. Two vast trunks AND a great tree was three
         dark verticals fighting each other.

         Everything of any size here goes through K.paint: a flat green blob
         is coloured paper, and the canopy is a quarter of the screen. --- */
      K.layer(ctx, camX, 0.82, function () {
        var tx = K.at(camX, 0, 336) - camX * 0.03;
        var bend = K.sway(t, 0.006, 2.4, 0);
        var ah;

        /* the canopy, one path of overlapping lobes so K.paint shades the
           union of them rather than each blob separately — separately, every
           lobe gets its own crescent of shadow and the mass reads as a
           bunch of grapes */
        var LOBE = [[-146, 40, 26], [-118, 14, 32], [-92, 44, 32], [-84, -10, 36],
                    [-40, 30, 40], [-32, -20, 40], [14, 40, 38], [16, -6, 42],
                    [62, 22, 38], [72, -20, 36]];
        function canopy(c) {
          c.beginPath();
          for (var q2 = 0; q2 < LOBE.length; q2++) {
            var b = LOBE[q2];
            c.moveTo(tx + b[0] + b[2] + bend, b[1]);
            c.arc(tx + b[0] + bend, b[1], b[2], 0, Math.PI * 2);
          }
        }
        /* edge:false matters. K.paint strokes the path it is given, and this
           path is ten circles — stroked, every lobe got its own outline and
           the canopy read as a bunch of grapes. The shadow crescent gives it
           all the form it needs. */
        /* The base green came down from '#41803a' when the mid ranks went
           olive: the canopy hangs into the band a fighter's head occupies on
           the right-hand side, and its shadowed green was ten points off
           Luigi's scarf. Deepening it costs the landmark nothing — the lit
           crowns below are what the eye actually returns to, and a darker
           mass under them makes them read harder, not softer. */
        K.paint(ctx, canopy, '#3a6f33',
                { step: 4, lx: -1, ly: 0.7, shade: 0.42, hi: 0.16, edge: false });

        /* sunlit crowns on the lobes facing the sun, and blossom in them.
           Flat, deliberately: they sit inside a mass that is already
           painted, and a second shading pass on top of the first is the
           pale-blob mistake the rig notes warn about. Warmed towards yellow
           when the golden hour went in — a late sun on leaves is not a
           brighter green, it is a yellower one. */
        ctx.save();
        canopy(ctx); ctx.clip();
        LOBE.forEach(function (b, q2) {
          var lx2 = tx + b[0] + bend, ly2 = b[1];
          /* An opaque lit clump pushed up and towards the sun, clipped
             inside the canopy so it is cut off hard at the outline. The
             first version was a half-transparent circle sitting on top of
             the green, which at this size reads as a bubble rather than as
             a clump of leaves with the light on it. */
          ctx.fillStyle = q2 % 2 ? '#65a044' : '#72ab49';
          ctx.beginPath();
          ctx.arc(lx2 - b[2] * 0.34, ly2 - b[2] * 0.38, b[2] * 0.62, 0, Math.PI * 2);
          ctx.fill();
          if (b[0] < 30) {
            ctx.fillStyle = '#9ac457';
            ctx.beginPath();
            ctx.arc(lx2 - b[2] * 0.52, ly2 - b[2] * 0.54, b[2] * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
          /* blossom, in threes. One fat dot per lobe read as a hole punched
             in the leaves; three small ones read as flowers. */
          ctx.fillStyle = 'rgba(255,236,242,.9)';
          for (var bl = 0; bl < 3; bl++) {
            ctx.beginPath();
            ctx.arc(lx2 + K.vary(q2 * 3 + bl, 130, -0.7, 0.7) * b[2],
                    ly2 + K.vary(q2 * 3 + bl, 131, -0.7, 0.7) * b[2], 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();
        for (ah = 0; ah < 5; ah++) {              /* fruit still on the tree */
          ctx.fillStyle = '#c9382f';
          ctx.beginPath();
          ctx.arc(tx + K.vary(ah, 120, -110, 90) + bend, K.vary(ah, 121, 30, 56),
                  2.6, 0, Math.PI * 2);
          ctx.fill();
        }

        /* the great limb reaching back over the field.

           First attempt was a straight bar of even thickness and it read as
           a scaffolding plank bolted to the tree. A branch has to TAPER and
           it has to change direction — this one rises out of the fork, dips,
           and thins to nothing, with one twig off the top of it. */
        function limb(c) {
          c.beginPath();
          c.moveTo(tx - 14 + bend, 30);
          c.bezierCurveTo(tx - 54 + bend, 34, tx - 78 + bend, 50, tx - 112 + bend, 52);
          c.lineTo(tx - 112 + bend, 56);
          c.bezierCurveTo(tx - 76 + bend, 58, tx - 50 + bend, 46, tx - 12 + bend, 48);
          c.closePath();
          c.moveTo(tx - 62 + bend, 44);
          c.lineTo(tx - 78 + bend, 22); c.lineTo(tx - 74 + bend, 21);
          c.lineTo(tx - 58 + bend, 43); c.closePath();
        }
        K.paint(ctx, limb, '#54381f', { step: 2, lx: -1, ly: 0.4, shade: 0.34 });

        /* --- THE APPLE, every seven seconds ---------------------------

           It hangs on the limb for five seconds, lets go, falls, bounces
           twice and rolls to a stop in the grass, where it stays until the
           clock comes round again — and there is already windfall down there
           for it to join, so the rest of the picture agrees with what just
           happened.

           The bounce is the whole thing. A fruit that falls and stops dead
           reads as a dropped sprite; two bounces at a quarter of the height
           each is what a hard little apple on mown grass actually does, and
           it is four lines of arithmetic. */
        var af = t % T_APPLE, apx = tx - 118 + bend, apy = 54;
        if (af < 300) {
          ctx.fillStyle = '#cf3f31';
          ctx.beginPath(); ctx.arc(apx, apy, 2.8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,236,170,.75)';
          ctx.beginPath(); ctx.arc(apx - 0.9, apy - 0.9, 1, 0, Math.PI * 2); ctx.fill();
          if (af > 288) {                       /* it is about to go */
            ctx.strokeStyle = 'rgba(40,24,12,.7)'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(apx, apy - 2.6);
            ctx.lineTo(apx + Math.sin(af * 1.3) * 1.4, apy - 5);
            ctx.stroke();
          }
        } else {
          var e = af - 300, ay, GY = 196, p2;
          if (e < 36) { ay = apy + 0.1114 * e * e; }
          else if (e < 51) { p2 = (e - 36) / 15; ay = GY - 23 * 4 * p2 * (1 - p2); }
          else if (e < 60) { p2 = (e - 51) / 9; ay = GY - 7 * 4 * p2 * (1 - p2); }
          else if (e < 65) { p2 = (e - 60) / 5; ay = GY - 2 * 4 * p2 * (1 - p2); }
          else { ay = GY; }
          var ax = apx + Math.min(e, 78) * 0.30;
          ctx.fillStyle = 'rgba(20,44,16,.3)';
          ctx.beginPath();
          ctx.ellipse(ax, GY + 1.6, 2.8, 1.2, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#cf3f31';
          ctx.beginPath(); ctx.arc(ax, ay, 2.8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,236,170,.75)';
          ctx.beginPath(); ctx.arc(ax - 0.9, ay - 0.9, 1, 0, Math.PI * 2); ctx.fill();
          if (e >= 36 && e < 44) {              /* grass kicked at the landing */
            ctx.strokeStyle = 'rgba(32,70,22,.55)'; ctx.lineWidth = 1;
            for (ah = 0; ah < 3; ah++) {
              ctx.beginPath();
              ctx.moveTo(ax, GY + 1);
              ctx.lineTo(ax + (ah - 1) * 4, GY - 3 - (e - 36) * 0.5);
              ctx.stroke();
            }
          }
          if (e < 120) {                        /* two leaves shaken loose */
            for (ah = 0; ah < 2; ah++) {
              var le = e + ah * 14;
              ctx.fillStyle = 'rgba(96,132,58,.85)';
              ctx.save();
              ctx.translate(apx + Math.sin(le * 0.09 + ah * 2) * 11, apy + le * 0.9);
              ctx.rotate(le * 0.06 + ah);
              ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.1, 0, 0, Math.PI * 2); ctx.fill();
              ctx.restore();
            }
          }
        }

        /* contact shadow at the foot of the tree — a trunk this size sitting
           straight on the grass with nothing under it floats */
        ctx.fillStyle = 'rgba(18,40,14,.34)';
        ctx.beginPath();
        ctx.ellipse(tx, 194, 74, 13, 0, 0, Math.PI * 2); ctx.fill();

        /* Roots. Kept SHORT and tapered: the first pair reached sixty pixels
           out across the grass at an even thickness and read as a plank
           lying against the tree, not as something growing out of it. */
        function roots(c) {
          c.beginPath();
          c.moveTo(tx - 34, 182); c.bezierCurveTo(tx - 52, 188, tx - 62, 196, tx - 70, 203);
          c.lineTo(tx - 54, 209); c.bezierCurveTo(tx - 46, 200, tx - 34, 194, tx - 16, 192);
          c.closePath();
          c.moveTo(tx - 30, 196); c.bezierCurveTo(tx - 44, 204, tx - 50, 212, tx - 52, 222);
          c.lineTo(tx - 22, 222); c.bezierCurveTo(tx - 20, 212, tx - 14, 204, tx - 4, 200);
          c.closePath();
        }
        K.paint(ctx, roots, '#5b3f27', { step: 2, lx: -1, ly: 0.3, shade: 0.36 });

        function trunk(c) {
          c.beginPath();
          c.moveTo(tx - 54, H + 10);
          c.bezierCurveTo(tx - 34, 166, tx - 28, 112, tx - 24 + bend, 40);
          c.lineTo(tx - 18 + bend, -12);
          c.lineTo(tx + 30 + bend, -12);
          c.bezierCurveTo(tx + 28 + bend, 56, tx + 36, 124, tx + 60, H + 10);
          c.closePath();
        }
        /* The trunk is the biggest single shape in the stage and K.paint's
           default step of two or three pixels is invisible across ninety of
           them — the first version came out as one flat slab of brown. It
           wants the SF2 recipe at trunk scale: a wide dark side away from
           the sun, and a hard narrow lit strip down the sunward contour.
           band:false because K.paint's highlight pass would otherwise take
           over most of the width; the lit strip is drawn as its own ribbon
           instead, clipped inside the trunk so it hugs the silhouette. */
        K.paint(ctx, trunk, '#5b3f27',
                { step: 26, lx: -1, ly: 0.12, shade: 0.46, band: false, edgeW: 1.4 });
        ctx.save();
        trunk(ctx); ctx.clip();
        ctx.fillStyle = K.lighter('#5b3f27', 0.42);
        ctx.beginPath();
        ctx.moveTo(tx - 54, H + 10);
        ctx.bezierCurveTo(tx - 34, 166, tx - 28, 112, tx - 24 + bend, 40);
        ctx.lineTo(tx - 18 + bend, -12);
        ctx.lineTo(tx - 8 + bend, -12);
        ctx.bezierCurveTo(tx - 14 + bend, 40, tx - 18, 112, tx - 24, 166);
        ctx.lineTo(tx - 44, H + 10);
        ctx.closePath(); ctx.fill();
        /* and a hot edge one pixel wide right on the sunward contour, which
           is the difference between a lit tree and a beige one */
        ctx.fillStyle = 'rgba(255,232,168,.5)';
        ctx.beginPath();
        ctx.moveTo(tx - 54, H + 10);
        ctx.bezierCurveTo(tx - 34, 166, tx - 28, 112, tx - 24 + bend, 40);
        ctx.lineTo(tx - 18 + bend, -12);
        ctx.lineTo(tx - 15 + bend, -12);
        ctx.bezierCurveTo(tx - 21 + bend, 40, tx - 25, 112, tx - 31, 166);
        ctx.lineTo(tx - 51, H + 10);
        ctx.closePath(); ctx.fill();
        ctx.restore();

        /* bark: long curved grooves, clipped inside the trunk so they can
           never spill over the silhouette the paint pass just drew */
        ctx.save();
        trunk(ctx); ctx.clip();
        ctx.strokeStyle = 'rgba(30,18,8,.38)';
        for (var g2 = 0; g2 < 6; g2++) {
          ctx.lineWidth = Math.max(1, 1.8 - g2 * 0.18);
          ctx.beginPath();
          ctx.moveTo(tx - 44 + g2 * 19, H + 10);
          ctx.bezierCurveTo(tx - 30 + g2 * 14, 140, tx - 26 + g2 * 13, 70, tx - 16 + g2 * 11, -12);
          ctx.stroke();
        }
        /* Two burls and an old sawn-off branch. Ninety pixels of even brown
           is a fence post; the eye needs one or two irregularities to call
           it a tree, and they have to be big enough to survive the haze. */
        ctx.fillStyle = 'rgba(38,22,10,.34)';
        ctx.beginPath(); ctx.ellipse(tx - 6, 96, 15, 10, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(tx + 22, 150, 11, 8, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = K.lighter('#5b3f27', 0.26);
        ctx.beginPath(); ctx.ellipse(tx - 9, 94, 9, 6, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        /* There was a sawn-off stub here too, sticking out of the left
           contour. It landed in the same few pixels as the limb, the ropes
           and the swing seat, and a fourth brown stick in that corner read
           as breakage rather than as a tree. The burls do the job. */

        /* A crate of apples already picked, at the foot of it. There was a
           ladder here too and it went: leaning across the limb it made a
           triangle of struts that read as scaffolding, and the eye stopped
           at the clutter instead of going to the tree. */
        K.mass(ctx, tx - 104, FLOOR_Y - 15, 24, 13, '#8a6339', { top: 4, side: 5, light: 1 });
        for (var ap = 0; ap < 5; ap++) {
          ctx.fillStyle = K.pick(ap, 91, ['#c9382f', '#d94a34', '#a82c26']);
          ctx.beginPath();
          ctx.arc(tx - 100 + ap * 4.6, FLOOR_Y - 17, 2.4, 0, Math.PI * 2); ctx.fill();
        }

        /* THE THING THAT HAPPENS: a cat on the rope swing, out and back on a
           three-second arc. A background you wait for is a background you
           look at, and the owner has said in as many words that this is the
           bit they like — so it stays exactly where it is, and everything
           else added to this stage was built to the standard it set. */
        var ang = Math.sin(t * 0.035) * 0.62;
        var px = tx - 88 + bend, py = 54, len = 74;
        var sx2 = px + Math.sin(ang) * len, sy = py + Math.cos(ang) * len;
        ctx.strokeStyle = '#d8bd8c'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px - 4, py); ctx.lineTo(sx2 - 6, sy);
        ctx.moveTo(px + 4, py); ctx.lineTo(sx2 + 6, sy);
        ctx.stroke();
        ctx.save();
        ctx.translate(sx2, sy);
        ctx.rotate(ang);
        ctx.fillStyle = '#6b4a2e';
        ctx.fillRect(-9, 0, 18, 3.5);
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        ctx.fillRect(-9, 2.6, 18, 1);
        K.spectator(ctx, 0, 0, 0.82, 411, t, 0);
        ctx.restore();
      });

      /* --- the frame: one vast trunk at the left edge of the picture,
             close enough that you cannot see the top of it.

             It stands between the camera and the sun, which is the best luck
             this composition has: a near-black mass with a blazing rim down
             its sunward contour is the single strongest thing in the
             picture, and it costs two fills. Warm light against dark is what
             the night stages get for free; this is the daylight version of
             it. --- */
      K.layer(ctx, camX, 0.86, function () {
        var dr = camX * 0.05;
        var ex = -24 - dr, dir = 1;
        ctx.fillStyle = '#33220f';
        ctx.beginPath();
        ctx.moveTo(ex, H + 10);
        ctx.bezierCurveTo(ex + dir * 8, 120, ex - dir * 6, 60, ex + dir * 4, -10);
        ctx.lineTo(ex + dir * 48, -10);
        ctx.bezierCurveTo(ex + dir * 38, 70, ex + dir * 54, 130, ex + dir * 44, H + 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.32)'; ctx.lineWidth = 2.4;
        for (var q2 = 0; q2 < 5; q2++) {
          ctx.beginPath();
          ctx.moveTo(ex + dir * (8 + q2 * 10), -10);
          ctx.bezierCurveTo(ex + dir * (4 + q2 * 11), 70,
                            ex + dir * (14 + q2 * 10), 130,
                            ex + dir * (10 + q2 * 9), H + 10);
          ctx.stroke();
        }
        /* the rim: the same contour drawn again a few pixels in, in a hot
           tone, so what survives is a hard strip of low sun down the whole
           height of the trunk */
        ctx.fillStyle = 'rgba(255,224,150,.62)';
        ctx.beginPath();
        ctx.moveTo(ex + 44, H + 10);
        ctx.bezierCurveTo(ex + 54, 130, ex + 38, 70, ex + 48, -10);
        ctx.lineTo(ex + 44, -10);
        ctx.bezierCurveTo(ex + 34, 70, ex + 50, 130, ex + 40, H + 10);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,206,128,.34)';
        ctx.beginPath();
        ctx.moveTo(ex + 40, H + 10);
        ctx.bezierCurveTo(ex + 50, 130, ex + 34, 70, ex + 44, -10);
        ctx.lineTo(ex + 38, -10);
        ctx.bezierCurveTo(ex + 28, 70, ex + 44, 130, ex + 34, H + 10);
        ctx.closePath(); ctx.fill();
      });

      K.chicken(ctx, K.at(camX, 1, 150), FLOOR_Y + 22, 1, t, 0, '#e8b45c', '#c9382f');
      K.chicken(ctx, K.at(camX, 1, 470), FLOOR_Y + 34, 0.86, t, 2.4, '#f2ecdd', '#c9382f');
      this.petals.update();
      this.petals.draw(ctx, camX, t);
      this.motes.update();
      this.motes.draw(ctx, camX, t);
    },
    drawFore: function (ctx, camX, t) {
      /* A branch hanging into frame. Clumped, with gaps — a solid band of
         leaves across the top just reads as a green stripe.

         Nearly black, and that is the change that made it work: it is
         between the camera and a low sun, so it is backlit, and a mid-green
         foreground competes with the mid-greens forty feet behind it. A dark
         one with a warm hem along the bottom of each clump sits obviously in
         front of everything, which is the entire job of a foreground. */
      K.layer(ctx, camX, 1.5, function () {
        ctx.save();
        /* Kept to the left two thirds. The great tree's canopy owns the
           top right, and a foreground branch at depth 1.5 crossing it slid
           over it at a different rate — two sets of leaves sliding through
           each other reads as a rendering fault, not as depth. */
        ctx.beginPath(); ctx.rect(0, 0, 236, 72); ctx.clip();
        ctx.strokeStyle = '#2a1c0e';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        K.repeatX(camX, 0, 190, function (bx) {
          ctx.beginPath();
          ctx.moveTo(bx - 30, -4);
          ctx.quadraticCurveTo(bx + 50, 14 + Math.sin(t * 0.014) * 3, bx + 150, -8);
          ctx.stroke();
        });
        K.repeatX(camX, 0, 30, function (x, i2) {
          var h = K.hash(i2, 8);
          if (h < 0.42) return;                 // gaps: most of the sky stays visible
          var s2 = 0.7 + h * 0.7;
          var yy = 6 + h * 16 + Math.sin(x * 0.03 + t * 0.018) * 4;
          function clump(c, dy) {
            c.beginPath();
            c.arc(x, yy + dy, 10 * s2, 0, Math.PI * 2);
            c.moveTo(x + 15 * s2, yy - 5 * s2 + dy);
            c.arc(x + 8 * s2, yy - 5 * s2 + dy, 7 * s2, 0, Math.PI * 2);
          }
          ctx.fillStyle = 'rgba(255,214,140,.5)';   /* the lit hem underneath */
          clump(ctx, 2); ctx.fill();
          ctx.fillStyle = ['#1f3418', '#26401d', '#2d4a22'][Math.abs(i2) % 3];
          clump(ctx, 0); ctx.fill();
          if (h > 0.8) {                        // the odd apple
            ctx.fillStyle = '#8f2a24';
            ctx.beginPath(); ctx.arc(x - 4, yy + 11 * s2, 3.2, 0, Math.PI * 2); ctx.fill();
          }
        });
        ctx.restore();
      });
      /* the grass turns away from the light as it comes towards you: without
         this the bottom of the picture is the same green as the middle and
         the fighters stand on a coloured band rather than in a field */
      K.nearLip(ctx, 16, 0.34);
      K.vignette(ctx, 0.24);
    }
  };
})();
