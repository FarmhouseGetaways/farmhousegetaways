/* =======================================================================
   6 — THE FRONT PORCH
   The sun going down behind the windmill, moths at the lantern, the
   neighbours leaning on the rail to watch.

   The composition, because everything else here serves it: the left third
   is the house — a warm lit wall you can read against — the right two
   thirds are sky, with the SUN and the WINDMILL sitting in them at a size
   you cannot ignore. The porch roof crops the top of the windmill, which
   is the scale contrast: something enormous and close (the roof, the corner
   posts, the lantern) framing something enormous and far.
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

  /* The sun, banded.

     A plain disc with a radial gradient reads as a glowing ball of gas; the
     reference draws a setting sun as flat bands of colour stacked up, and
     the banding is what makes it look like a sprite rather than a lens
     effect. The bands get thicker towards the bottom so the disc reads as
     sinking into its own haze. Clipped once — the clip is the expensive
     call, so it is one clip and six rectangles, not six arcs. */
  function sunDisc(ctx, x, y, r) {
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    ctx.fillStyle = '#ffe0a2';
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    var bands = [[0.30, '#ffc266'], [0.46, '#ffa347'], [0.60, '#f7873a'],
                 [0.72, '#e56d33'], [0.83, '#cf5730'], [0.92, '#b4442d']];
    for (var i = 0; i < bands.length; i++) {
      ctx.fillStyle = bands[i][1];
      ctx.fillRect(x - r, y - r + r * 2 * bands[i][0], r * 2, r * 2);
    }
    ctx.restore();
  }

  /* A flight of geese, right to left, on a fifteen-second loop.

     This is the thing to wait for. The windmill turns all the time so it
     stops being an event within about four seconds; the geese are gone for
     most of a round and then cross the face of the sun, which is the one
     moment on this stage where the background asks for your eye. */
  function geese(ctx, t) {
    var cycle = (t % 900) / 900;
    if (cycle > 0.62) return;                 /* off frame for a third of the loop */
    /* Ends at 110, not off the left edge: the house is drawn over this layer,
       so anything past 110 is behind the wall and the flock appeared to
       vanish for half its run. It flies BEHIND the house now, which is
       what it looks like it should do anyway. */
    var k = cycle / 0.62;
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
     the flat purple slab this stage had for a week. */
  function siding(ctx, x, y, w, h, colour) {
    ctx.fillStyle = colour;
    ctx.fillRect(x, y, w, h);
    var lit = K.lighter(colour, 0.16), dark = K.darker(colour, 0.34);
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

  CF.StageDefs = CF.StageDefs || {};
  CF.StageDefs.porch = {
    id: 'porch', name: 'THE FRONT PORCH',
    blurb: 'The sun behind the windmill, moths at the lantern.',
    /* the colour of the air here — see K.deepen. Warm, because the haze at
       this hour is lit by the sun rather than by the sky. */
    air: { air: '#b2748a', haze: 0.26, floorDark: 0.3, horizon: 124 },
    init: function () {
      this.fluff = new P({ count: 18, kind: 'dust', depth: 0.55, seed: 67,
                           band: [40, FLOOR_Y], vx: 0.16, vy: -0.02,
                           size: 1.7, color: 'rgba(255,240,214,.9)', wobble: 2.2 });
    },
    drawBack: function (ctx, camX, t, mood) {
      var self = this;
      K.sky(ctx, [[0, '#241d4c'], [0.3, '#4b2f63'], [0.56, '#8c4a6c'],
                  [0.78, '#cf6f57'], [1, '#f3ad63']], 0, 152);

      /* first stars, only in the top of the sky where it is still dark */
      K.layer(ctx, camX, 0.03, function () {
        K.repeatX(camX, 0, 21, function (x, i) {
          if (!K.chance(i, 140, 0.45)) return;
          var sy = K.vary(i, 141, 4, 58);
          ctx.fillStyle = 'rgba(255,248,230,' + K.vary(i, 142, 0.15, 0.6).toFixed(2) + ')';
          ctx.fillRect(x, sy, 1.2, 1.2);
        });
      });

      /* --- THE SUN. Forty pixels of radius, a fifth of the screen across,
             and the brightest thing in the picture by a mile. It sits just
             left of the windmill so the tower's legs cross its face rather
             than hiding it, and it is high enough that the far ridge only
             takes the bottom third — a sun already half set has nothing left
             to look at. --- */
      var sunX = K.at(camX, 0, 250) - camX * 0.012, sunY = 76, sunR = 47;
      /* A wide pale glow flattened the whole sky and took the bands with it.
         Kept tight and warm instead: the sun should be the brightest thing
         in the picture by a distance, not a fog light. */
      K.glow(ctx, sunX, sunY, 86, 'rgba(255,150,72,.7)', 0.34);
      sunDisc(ctx, sunX, sunY, sunR);

      K.layer(ctx, camX, 0.05, function () { geese(ctx, t); });

      K.ridge(ctx, camX, 0.07, '#5b3a63', 130, 30, 7);
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
             close, and close is what makes it a landmark. --- */
      K.layer(ctx, camX, 0.13, function () {
        var mx = K.at(camX, 0, 300) - camX * 0.03;
        var base = 168, topY = 52, wr = 37;

        /* the tower: four legs in perspective, braced */
        function leg(x0, x1) {
          ctx.beginPath();
          ctx.moveTo(mx + x0, base); ctx.lineTo(mx + x1, topY + 22);
          ctx.stroke();
        }
        ctx.strokeStyle = '#1e1730'; ctx.lineWidth = 3.6;
        leg(-34, -8); leg(34, 8);
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#2b2140';
        leg(-22, -5); leg(22, 5);
        /* the cross bracing, narrowing as it goes up */
        ctx.lineWidth = 1.5;
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
        ctx.fillStyle = '#241c34';
        ctx.fillRect(mx - 16, topY + 18, 32, 3);
        K.mass(ctx, mx - 12, topY - 2, 24, 21, '#463a5c', { top: 3, side: 5, foot: false });

        /* the head, the tail vane, and the wheel */
        ctx.save();
        ctx.translate(mx, topY - 6);
        ctx.fillStyle = '#2c2340';
        ctx.fillRect(-6, -5, 12, 10);
        /* the tail vane, off to one side, catching the last of the light */
        ctx.fillStyle = '#3a2d4e';
        ctx.beginPath();
        ctx.moveTo(5, -3); ctx.lineTo(38, -12); ctx.lineTo(38, 9); ctx.lineTo(5, 3);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,190,140,.34)'; ctx.lineWidth = 1;
        ctx.stroke();
        /* the wheel: a rim, a hub and twenty blades */
        ctx.rotate(t * 0.014);
        ctx.strokeStyle = '#1e1730'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(0, 0, wr, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, wr * 0.42, 0, TAU); ctx.stroke();
        for (var q = 0; q < 20; q++) {
          ctx.rotate(TAU / 20);
          ctx.fillStyle = q % 2 ? '#3a2d4e' : '#2c2340';
          ctx.beginPath();
          ctx.moveTo(7, -2); ctx.lineTo(wr, -4.6); ctx.lineTo(wr, 3.4); ctx.lineTo(7, 2);
          ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = '#1e1730';
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
        ctx.restore();

        /* two birds on the brace, one of them shuffling along */
        var shuffle = Math.sin(t * 0.008) * 5;
        ctx.fillStyle = '#1e1730';
        [[-12, 0], [9, shuffle]].forEach(function (bd) {
          ctx.beginPath();
          ctx.ellipse(mx + bd[0] + bd[1], topY + 15, 3.2, 2.3, -0.2, 0, TAU);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(mx + bd[0] + bd[1] + 2.6, topY + 12.4, 1.6, 0, TAU);
          ctx.fill();
        });
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
        siding(ctx, hx - 90, 36, 132, FLOOR_Y - 36, '#4a3a5c');
        /* the corner of the house, turning away from the light */
        ctx.fillStyle = 'rgba(0,0,0,.26)';
        ctx.fillRect(hx + 30, 36, 12, FLOOR_Y - 36);

        /* The door, standing open a crack, with the hall light behind it.
           Moved along to the corner: the lantern in the foreground hangs
           over the left end of this wall, and everything warm was stacked up
           behind it where none of it could be seen. */
        K.mass(ctx, hx + 2, 88, 36, FLOOR_Y - 88, '#33273f', { top: 0, side: 4, foot: false });
        ctx.fillStyle = 'rgba(255,214,146,.9)';
        ctx.fillRect(hx + 32, 88, 5, FLOOR_Y - 88);
        K.spill(ctx, hx + 30, FLOOR_Y, 14, H - FLOOR_Y + 12, 'rgba(255,206,130,.7)', 0.34);

        /* two windows, one with somebody watching out of it. The second is
           dressed differently on purpose — two identical windows is the
           same mistake as eleven identical cats. */
        function window2(wx, wy, ww, wh, idx) {
          K.mass(ctx, wx, wy, ww, wh, '#5a412c', { top: 0, side: 3, foot: false });
          ctx.fillStyle = 'rgba(255,216,150,.92)';
          ctx.fillRect(wx + 3, wy + 3, ww - 6, wh - 6);
          ctx.fillStyle = 'rgba(58,38,28,.75)';
          ctx.fillRect(wx + ww / 2 - 1.2, wy + 3, 2.4, wh - 6);
          ctx.fillRect(wx + 3, wy + wh / 2 - 1.2, ww - 6, 2.4);
          /* only the big window gets a glow — a radial gradient apiece for
             two windows six pixels apart is a gradient wasted */
          if (idx === 0) K.glow(ctx, wx + ww / 2, wy + wh / 2, ww * 1.6, 'rgba(255,206,130,.8)', 0.24);
          /* Somebody indoors, watching the fight over the sill. Sat on the
             left of the pane the hanging fern in the foreground covered them
             at both camera positions anybody checked; the right half of the
             glass is clear. */
          if (idx === 0) K.spectator(ctx, wx + ww * 0.68, wy + wh - 4, 0.62, 909, t * 0.35, null);
        }
        window2(hx - 84, 66, 24, 20, 1);
        window2(hx - 40, 48, 42, 36, 0);
        /* the sill under the big one */
        ctx.fillStyle = '#3a2c22';
        ctx.fillRect(hx - 43, 84, 48, 3);

        /* Things hung on the wall. The stretch of siding between the window
           and the rail is where a fighter stands, so it stays quiet — but
           quiet is not the same as empty, and three small shapes at the edge
           of it are the sort of thing somebody notices on their twentieth
           round here. */
        ctx.strokeStyle = '#8a7c55'; ctx.lineWidth = 2.4; ctx.lineCap = 'butt';
        ctx.beginPath();                                   /* a horseshoe on a nail */
        ctx.arc(hx - 62, 106, 5, Math.PI, TAU);            /* the top half — an
           arc given increasing angles wraps the long way round and came out
           as a walking cane */
        ctx.moveTo(hx - 67, 106); ctx.lineTo(hx - 67, 109);
        ctx.moveTo(hx - 57, 106); ctx.lineTo(hx - 57, 109);
        ctx.stroke();
        ctx.strokeStyle = '#6e5f42'; ctx.lineWidth = 1.6;  /* a coil of rope */
        for (var cq = 0; cq < 3; cq++) {
          ctx.beginPath();
          ctx.ellipse(hx - 40, 104 + cq * 2.4, 6 - cq * 0.6, 4 - cq * 0.5, 0, 0, TAU);
          ctx.stroke();
        }
        ctx.strokeStyle = '#7a6242'; ctx.lineWidth = 2;    /* a broom, leaning */
        ctx.beginPath();
        ctx.moveTo(hx - 14, 112); ctx.lineTo(hx - 8, 148); ctx.stroke();
        ctx.fillStyle = '#b99a5c';
        ctx.beginPath();
        ctx.moveTo(hx - 11, 146); ctx.lineTo(hx - 4, 146);
        ctx.lineTo(hx - 2, 160); ctx.lineTo(hx - 12, 160);
        ctx.closePath(); ctx.fill();
      });

      /* --- the neighbours, out in the yard with their elbows on the rail.
             Drawn BEFORE the rail so it passes in front of them, which is
             the only thing that puts them on the far side of it. --- */
      /* yBase is deliberately well ABOVE the porch floor. They are standing
         in the yard, which is further away and therefore higher up the
         screen, and it is the only height at which their heads clear the top
         rail — at 176 the rail ate all of them and the row was a waste. */
      /* Spacing 40 and a 30% gap put seven of them on screen and cost most
         of a millisecond; six read as a crowd just as well. */
      K.crowdRow(ctx, camX, 0.62, 46, 156, t, mood,
                 { seed: 310, gap: 0.3, min: 1.15, max: 1.45 });
      /* The crowd is drawn in the toolkit's own palette, which is nearly
         white on two of the eight cats, and against a dusk sky that came out
         as a row of hovering ghosts. One band of the air colour laid over
         them puts them back behind the rail where they belong. K.deepen does
         the same job for the picture as a whole but runs after drawBack, so
         it cannot sit between the crowd and the railing. */
      var hz = ctx.createLinearGradient(0, 124, 0, 176);
      hz.addColorStop(0, 'rgba(178,116,138,0)');
      hz.addColorStop(0.45, 'rgba(178,116,138,.28)');
      hz.addColorStop(1, 'rgba(178,116,138,.22)');
      ctx.fillStyle = hz;
      ctx.fillRect(0, 124, W, 52);

      /* --- porch rail and posts, weathered differently --- */
      K.layer(ctx, camX, 0.62, function () {
        K.repeatX(camX, 0, 26, function (x, i) {
          ctx.fillStyle = K.pick(i, 143, ['#7a6650', '#6b5a44', '#8a7259']);
          ctx.fillRect(x, 152, 3.4, 18);
        });
        /* top and bottom rails, painted rather than filled — the top one is
           the nearest horizontal in the picture and a flat bar across it was
           the flattest thing on the stage */
        K.mass(ctx, -20, 149, W + 40, 6, '#6b5a44', { top: 2, side: 0, foot: false, edge: false });
        K.mass(ctx, -20, 166, W + 40, 4, '#5f4f3c', { top: 1, side: 0, foot: false, edge: false });
        K.repeatX(camX, 0, 118, function (x, i) {
          K.mass(ctx, x, 24, 10, 148, '#5c4c3a', { top: 0, side: 3, foot: false, edge: false });
          /* the bracket where post meets roof — a farmhouse porch has one at
             every post and it is most of what says "porch" rather than
             "fence" */
          ctx.fillStyle = '#4d3f30';
          ctx.beginPath();
          ctx.moveTo(x + 10, 26); ctx.lineTo(x + 34, 26); ctx.lineTo(x + 10, 50);
          ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(x, 26); ctx.lineTo(x - 24, 26); ctx.lineTo(x, 50);
          ctx.closePath(); ctx.fill();
          /* a hurricane lantern hung off every other post */
          if (K.chance(i, 144, 0.5)) {
            var lsw = K.sway(t, 0.014, 2.2, i);
            ctx.strokeStyle = '#3a3128'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + 5, 52); ctx.lineTo(x + 5 + lsw, 62); ctx.stroke();
            ctx.fillStyle = '#2f2820';
            ctx.fillRect(x + lsw + 0.5, 62, 9, 2.4);
            ctx.fillStyle = '#ffd27a';
            ctx.fillRect(x + lsw + 1.6, 64, 6.8, 9);
            ctx.fillStyle = '#2f2820';
            ctx.fillRect(x + lsw + 0.5, 73, 9, 2.4);
            var pulse = 0.7 + 0.3 * Math.sin(t * 0.06 + i);
            K.glow(ctx, x + lsw + 5, 68, 26, 'rgba(255,196,110,.9)', 0.34 * pulse);
          }
        });
      });

      /* --- the rocking chair, with somebody asleep in it. Off to the right,
             clear of where the fighters stand. --- */
      K.layer(ctx, camX, 0.8, function () {
        var cx3 = K.at(camX, 0, 324) - camX * 0.02;
        var rock = Math.sin(t * 0.026) * 0.075;
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
        chair(5, '#2a2033');
        chair(2.2, '#b08e64');
        /* The sleeper. Drawn in the chair's own tan it was one lump with the
           chair; a dark cat on pale wood is legible at fifteen pixels, which
           is all it gets. */
        var breath = Math.sin(t * 0.05) * 0.5;
        ctx.fillStyle = '#2a2033';
        ctx.beginPath();
        ctx.ellipse(0, -25 + breath, 10.4, 6.4 + breath * 0.4, -0.12, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#5c5468';
        ctx.beginPath();
        ctx.ellipse(-0.4, -26 + breath, 8.6, 4.8 + breath * 0.4, -0.12, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#2a2033';
        ctx.beginPath(); ctx.arc(7.4, -29, 4.6, 0, TAU); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(5.2, -32.4); ctx.lineTo(6.2, -37.4); ctx.lineTo(9.4, -32.6);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5c5468';
        ctx.beginPath(); ctx.arc(7.8, -29.6, 3.2, 0, TAU); ctx.fill();
        /* the tail hanging over the arm of the chair, twitching in its sleep */
        ctx.strokeStyle = '#2a2033'; ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-8, -24);
        ctx.quadraticCurveTo(-15, -20 + K.sway(t, 0.05, 2.2, 2), -11, -15);
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
          var sw = K.sway(t, 0.016, 3, i);
          ctx.strokeStyle = 'rgba(50,40,28,.85)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x + sw, 30); ctx.stroke();
          /* pot */
          ctx.fillStyle = '#9c6b45';
          ctx.beginPath();
          ctx.moveTo(x + sw - 12, 30); ctx.lineTo(x + sw + 12, 30);
          ctx.lineTo(x + sw + 9, 43); ctx.lineTo(x + sw - 9, 43);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#7d5334';
          ctx.fillRect(x + sw - 13, 29, 26, 3);
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
            ctx.strokeStyle = '#33532a'; ctx.lineWidth = 1.6;
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

        /* one set of wind chimes, on the same rafter and its own spacing */
        K.repeatX(camX, 0, 330, function (x, i) {
          var cx = x + 118, sw = K.sway(t, 0.028, 2.4, i * 3);
          ctx.fillStyle = '#8a6642';
          ctx.beginPath(); ctx.arc(cx, 30, 5, Math.PI, 0); ctx.fill();
          for (var c = 0; c < 4; c++) {
            var dx = cx + (c - 1.5) * 3.4 + sw * (0.4 + c * 0.2);
            ctx.strokeStyle = 'rgba(160,160,175,.75)'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(cx + (c - 1.5) * 3.4, 30); ctx.lineTo(dx, 40 + c * 2); ctx.stroke();
            ctx.strokeStyle = 'rgba(226,226,236,.95)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(dx, 40 + c * 2); ctx.lineTo(dx, 54 + c * 4); ctx.stroke();
          }
        });
      });

      /* --- the frame: the two corner posts of the porch and the roof they
             hold up, at the scale you would actually see them --- */
      K.layer(ctx, camX, 0.9, function () {
        var d = camX * 0.05;
        ctx.fillStyle = '#241c30';
        ctx.beginPath();
        ctx.moveTo(-20, -10); ctx.lineTo(W + 20, -10);
        ctx.lineTo(W + 20, 12); ctx.lineTo(-20, 20);
        ctx.closePath(); ctx.fill();
        [[-12, 1], [W + 12, -1]].forEach(function (side) {
          var ex = side[0] - d * side[1], dir = side[1];
          var px = ex + (dir > 0 ? 0 : -36);
          K.mass(ctx, px, 10, 36, H, '#3f3145',
                 { top: 0, side: 7, light: dir > 0 ? 1 : -1, foot: false, edge: false });
          ctx.fillStyle = 'rgba(255,196,130,.10)';
          ctx.fillRect(ex + (dir > 0 ? 28 : -36), 10, 7, H);
          /* the bracket where post meets roof */
          ctx.fillStyle = '#2e2436';
          ctx.beginPath();
          ctx.moveTo(ex + dir * 36, 14);
          ctx.lineTo(ex + dir * 74, 14);
          ctx.lineTo(ex + dir * 36, 48);
          ctx.closePath(); ctx.fill();
        });
      });

      K.grain(ctx, camX, 60, ['#6b4c33', '#a87c52'], 0.1);
      /* the rail's shadow thrown back across the boards. The floor is a
         third of the picture and grain alone still reads as lino; a long
         raking shadow is what says the sun is where the sun is. */
      ctx.save();
      ctx.fillStyle = 'rgba(46,22,48,.15)';
      K.repeatX(camX, 1, 26, function (x) {
        ctx.beginPath();
        ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x + 3.6, FLOOR_Y);
        ctx.lineTo(x - 20, FLOOR_Y + 36); ctx.lineTo(x - 25, FLOOR_Y + 36);
        ctx.closePath(); ctx.fill();
      });
      ctx.fillStyle = 'rgba(46,22,48,.12)';
      ctx.fillRect(0, FLOOR_Y + 11, W, 5);
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
        ctx.fillStyle = '#cbc0a8'; ctx.fillRect(-10, 0, W + 20, 15);
        ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(-10, 15, W + 20, 3);
        /* rafter ends along the beam — cheap, and they carry the light */
        K.repeatX(camX, 0, 22, function (x) {
          ctx.fillStyle = 'rgba(255,238,206,.5)'; ctx.fillRect(x, 0, 9, 3);
          ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(x + 9, 0, 3, 15);
        });

      });

      /* THE LANTERN, hung right in the corner of frame and far too close to
         focus on, with the moths going round it. Screen-pinned with a little
         drift: a foreground element that scrolls away is not a frame.

         Twice the size it started at. Next to the other five stages — the
         flamingo on the pool deck in particular — a hand-sized lantern was
         not framing anything, it was a prop that happened to be in front.
         The near half of a scale contrast has to be too big for the frame. */
      var lx = 44 - camX * 0.06 % 480;
      var lsw = K.sway(t, 0.019, 1.8, 4);
      var lcx = lx + lsw;
      ctx.save();
      ctx.strokeStyle = '#2a2218'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lcx, 24); ctx.stroke();
      K.glow(ctx, lcx, 56, 92, 'rgba(255,192,104,.95)', 0.5);
      /* the vented cap */
      ctx.fillStyle = '#241d16';
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
      ctx.fillStyle = '#241d16';
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
