/* =======================================================================
   3 — THE ORCHARD
   Golden hour, three depths of trees, chickens who could not care less.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  /* The floor is a PLANE, and it has to behave like one.

     `u` is 0 at the fighters' feet and 1 at the bottom of the screen, and a
     screen coordinate taken at the feet is pushed further from the vanishing
     point the nearer it comes. Everything lying on the grass — mown stripes,
     tufts, windfall, shadows — goes through this, so it all shares one
     perspective.

     The old mown stripes were parallelograms of the SAME width top and
     bottom. At 384x224 that read as a white picket fence lying flat in the
     grass, which is exactly what the first render showed. */
  var VP = 150;                    /* vanishing point, sat under the sun */
  function spread(x, u) { return VP + (x - VP) / (1 - 0.62 * u); }

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
      /* The sun sat at x=120 and the barn group grew across it, so golden
         hour had no sun in it at all. It is out at 62 now, low, with the
         silo standing across its right-hand edge — which is worth more than
         a clear disc: something crossing the sun is what gives it size. */
      K.sky(ctx, [[0, '#f2a35a'], [0.4, '#f5c07a'], [1, '#f7dcb0']], 0, 150);

      /* THE HALO IS STEPPED, not a gradient.

         This was K.glow — a 98-pixel radial gradient composited with
         'lighter', which is a quarter of a 384-wide picture rendered as a
         perfectly smooth disc bleeding into a perfectly smooth sky. Street
         Fighter II has no additive bloom anywhere in it; a limited palette
         cannot make one, so its skies step. Four flat-alpha discs at
         stepped radii give the same shape with hard rings, and they are
         cheaper than the gradient and the compositing pass together.

         The alphas stack, so the numbers are per-ring and not cumulative —
         the middle ends up around 0.6 by the time the sun disc goes over
         it. Alphas any higher and the rings read as targets rather than as
         glare. */
      ctx.save();
      ctx.fillStyle = '#ffeaa6';
      [[98, 0.10], [76, 0.16], [55, 0.22], [35, 0.30]].forEach(function (ring) {
        ctx.globalAlpha = ring[1];
        ctx.beginPath(); ctx.arc(62, 114, ring[0], 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
      ctx.fillStyle = '#fff2c8';
      ctx.beginPath(); ctx.arc(62, 116, 27, 0, Math.PI * 2); ctx.fill();
      /* a hotter core. K.deepen hazes the whole picture towards #f4c684 on
         the way past, and a disc of #fff2c8 on a #f5c07a sky did not survive
         it — the sun was a slightly paler patch of sky. */
      ctx.fillStyle = '#fffdf0';
      ctx.beginPath(); ctx.arc(62, 116, 17, 0, Math.PI * 2); ctx.fill();

      /* sun rays, fanning out from where the sun actually is */
      K.layer(ctx, camX, 0.05, function () {
        for (var r = 0; r < 11; r++) {
          K.lightShaft(ctx, 62 + (r - 3) * 36, 6, 46,
                       'rgba(255,238,190,.5)', 0.10 + 0.05 * Math.sin(t * 0.01 + r), 118, 0);
        }
      });

      K.hills(ctx, camX, 0.1, '#c98f5e', 150, 20, 4);
      K.hills(ctx, camX, 0.16, '#a9764c', 158, 13, 12);

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
        for (var bd = 1; bd < 8; bd++) {
          ctx.beginPath();
          ctx.moveTo(bx - 66 + bd * 16.5, WALL); ctx.lineTo(bx - 66 + bd * 16.5, BASE);
          ctx.stroke();
        }

        /* the great door, standing open — the warm light coming out of it is
           the one dark-to-light contrast in the middle distance, and it is
           what stops the barn reading as a flat red rectangle */
        ctx.fillStyle = '#361009';
        ctx.fillRect(bx - 22, 108, 44, BASE - 108);
        K.spill(ctx, bx - 20, 110, 40, 44, 'rgba(255,214,132,.85)', 0.5);
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
        for (var rg = 1; rg < 6; rg++) {
          ctx.beginPath();
          ctx.moveTo(bx - 106, 58 + rg * 15); ctx.lineTo(bx - 74, 58 + rg * 15); ctx.stroke();
        }
        K.paint(ctx, function (c) {
          c.beginPath();
          c.ellipse(bx - 90, 58, 17, 11, 0, Math.PI, 0);
          c.closePath();
        }, '#9a8b74', { step: 3, lx: -1, ly: 0.6, shade: 0.34 });

        /* a weather vane on the ridge, turning slowly */
        var vn = Math.sin(t * 0.004);
        ctx.strokeStyle = '#3a1c16'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(bx, RIDGE - 14); ctx.lineTo(bx, RIDGE - 3); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx - 6 * vn, RIDGE - 14); ctx.lineTo(bx + 6 * vn, RIDGE - 14);
        ctx.stroke();

        /* rooks going round the silo — the slow loop out in the distance,
           against the swing's fast one up close */
        for (var bi = 0; bi < 4; bi++) {
          var a2 = t * 0.006 + bi * 1.7;
          K.bird(ctx, bx - 90 + Math.cos(a2) * 58, 42 + Math.sin(a2) * 13,
                 0.7 + 0.3 * Math.sin(a2), t, bi * 2.1, 'rgba(58,34,26,.75)');
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
         slide against each other and the row has real ground under it. The
         trees cut them off at the chest and the heads and ears clear the
         canopies. That height is not arbitrary: at 149 all but one of them
         hid behind the near rank at half the camera positions, and anything
         above about 144 lifts their feet off the band so they float
         wherever a tree happens not to be. Nineteen apart rather than
         twenty-seven, so enough of them land in the gaps to read as an
         audience. The sun is out at x=62 behind them, which makes near-black with a hard warm rim on the
         sunward side the honest drawing rather than a stylistic choice.
         Two flat fills each, no cel shading: a hard rim reads at this size
         and a shaded one is mud. It also costs less than the row it
         replaced, which drew a whole little cat apiece. --- */
      K.layer(ctx, camX, 0.19, function () {
        K.repeatX(camX, 0, 19, function (x, i) {
          if (K.chance(i, 61, 0.24)) return;
          var sc = K.vary(i, 62, 0.92, 1.18);
          var ph = K.hash(i, 63) * 6.28;
          /* the idle bob, and the hop when a round has just been won */
          var y = 147 + K.vary(i, 64, -3, 3)
                  - Math.sin(t * 0.06 + ph) * 1.0 * sc
                  - (mood > 0.5 ? Math.max(0, Math.sin(t * 0.22 + ph)) * 5 * sc * mood : 0);
          var lean = Math.sin(t * 0.03 + ph) * 0.06;

          function shape(c, dx) {
            var cx = x + K.vary(i, 65, -4, 4) + dx, hy = y - 11 * sc;
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
            if (K.chance(i, 66, 0.5)) {
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
          ctx.fillStyle = K.pick(i, 67, ['#2b2320', '#342a25', '#241d1b']);
          shape(ctx, 0); ctx.fill();
        });
      });

      /* --- three ranks of trees, every one a different size and shade --- */
      /* The three ranks used to run '#2f5c28'/'#3d7534' up to
         '#457f38'/'#57a049'. The nearest rank stands directly behind the
         fighters and its lit green measured at luminance 128 — ten points
         off Luigi's jade scarf, #2f9e63, in the same hue family, so his one
         piece of identity colour landed on the stage's own colour and
         disappeared. They are olive now: same three-step recession, a
         quarter less saturation, and the near rank a good twenty points
         darker. Golden hour flatters an olive orchard anyway; a saturated
         emerald was never what a late sun does to leaves. */
      [[0.22, 0.62, '#33512c', '#405f34'], [0.32, 0.8, '#3a5c31', '#496e3a'],
       [0.46, 1.0, '#41653a', '#527a41']].forEach(function (rank, ri) {
        K.layer(ctx, camX, rank[0], function () {
          K.repeatX(camX, 0, 58 - ri * 6, function (x, i) {
            if (K.chance(i, 92 + ri, 0.16)) return;
            var sc = rank[1] * K.vary(i, 95 + ri, 0.78, 1.22);
            K.tree(ctx, x, 152 + ri * 6, sc, '#4a3524', rank[2], rank[3], t, i * 1.7);
            /* the odd apple, and the odd cat in the branches */
            if (K.chance(i, 98 + ri, 0.3)) {
              ctx.fillStyle = '#c9382f';
              ctx.beginPath();
              ctx.arc(x + K.vary(i, 99, -8, 8) * sc, 152 + ri * 6 - 34 * sc, 2.6 * sc, 0, Math.PI * 2);
              ctx.fill();
            }
          });
        });
      });

      /* --- the fence, with a gap or two and a cat sat on the rail --- */
      K.layer(ctx, camX, 0.6, function () {
        ctx.strokeStyle = '#b8935e'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-20, 158); ctx.lineTo(W + 20, 158); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-20, 166); ctx.lineTo(W + 20, 166); ctx.stroke();
        K.repeatX(camX, 0, 42, function (x, i) {
          ctx.fillStyle = K.pick(i, 100, ['#a8814e', '#b8935e', '#96703f']);
          ctx.fillRect(x, 150, 4.5, FLOOR_Y - 150);
        });
      });

      /* --- the floor: a mown orchard in perspective ---------------------
         A third of the picture, and it used to be a gradient with stripes
         painted on it. Every stripe, tuft and apple below runs through
         spread(), so the whole plane converges on one vanishing point. */
      var gr = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
      gr.addColorStop(0, '#54973d'); gr.addColorStop(0.55, '#5da344');
      gr.addColorStop(1, '#4a8a35');
      ctx.fillStyle = gr;
      ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);

      /* mown stripes: the mower went up and back, so every other band took
         the light the other way. Wedges, wide at the near edge. */
      K.repeatX(camX, 1, 40, function (x, i) {
        var lit = Math.abs(i) % 2 === 0;
        ctx.fillStyle = lit ? 'rgba(255,250,190,.14)' : 'rgba(20,54,14,.13)';
        ctx.beginPath();
        ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x + 40, FLOOR_Y);
        ctx.lineTo(spread(x + 40, 1), H); ctx.lineTo(spread(x, 1), H);
        ctx.closePath(); ctx.fill();
      });

      /* The shadow of the near trunk at the left edge, thrown down and to the
         right: the sun is low and away at x=120, so anything standing left of
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

      /* tufts, clover, windfall. Bigger and looser the nearer they are —
         one size everywhere is what makes a floor read as wallpaper. */
      K.layer(ctx, camX, 1, function () {
        K.repeatX(camX, 0, 15, function (x, i) {
          for (var q = 0; q < 3; q++) {
            var u = K.vary(i * 3 + q, 110, 0.02, 1);
            var px = spread(x + K.vary(i * 3 + q, 111, 0, 15), u);
            var py = FLOOR_Y + u * (H - FLOOR_Y);
            var sc = 0.6 + u * 1.05;
            var r = K.hash(i * 3 + q, 112);
            if (r < 0.13) {                       /* a windfall apple */
              ctx.fillStyle = 'rgba(20,44,16,.35)';
              ctx.beginPath();
              ctx.ellipse(px, py + 1.4 * sc, 2.4 * sc, 1.1 * sc, 0, 0, Math.PI * 2); ctx.fill();
              ctx.fillStyle = K.pick(i * 3 + q, 113, ['#c9382f', '#d9532f', '#a82c26']);
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
              ctx.strokeStyle = 'rgba(28,64,20,' + K.vary(i * 3 + q, 114, 0.16, 0.4).toFixed(2) + ')';
              ctx.lineWidth = Math.max(1, sc * 0.9);
              var gh = K.vary(i * 3 + q, 115, 2, 5) * sc;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(px + K.sway(t, 0.02, 1.6, i + q), py - gh);
              ctx.stroke();
            }
          }
        });
      });
      K.floorPool(ctx, W * 0.42, 210, 'rgba(255,238,180,.6)', 0.32);

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

        /* the canopy, one path of overlapping lobes so K.paint shades the
           union of them rather than each blob separately — separately, every
           lobe gets its own crescent of shadow and the mass reads as a
           bunch of grapes */
        var LOBE = [[-146, 40, 26], [-118, 14, 32], [-92, 44, 32], [-84, -10, 36],
                    [-40, 30, 40], [-32, -20, 40], [14, 40, 38], [16, -6, 42],
                    [62, 22, 38], [72, -20, 36]];
        function canopy(c) {
          c.beginPath();
          for (var q = 0; q < LOBE.length; q++) {
            var b = LOBE[q];
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
           pale-blob mistake the rig notes warn about. */
        ctx.save();
        canopy(ctx); ctx.clip();
        LOBE.forEach(function (b, q) {
          var lx2 = tx + b[0] + bend, ly2 = b[1];
          /* An opaque lit clump pushed up and towards the sun, clipped
             inside the canopy so it is cut off hard at the outline. The
             first version was a half-transparent circle sitting on top of
             the green, which at this size reads as a bubble rather than as
             a clump of leaves with the light on it. */
          ctx.fillStyle = q % 2 ? '#5aa049' : '#67ac4f';
          ctx.beginPath();
          ctx.arc(lx2 - b[2] * 0.34, ly2 - b[2] * 0.38, b[2] * 0.62, 0, Math.PI * 2);
          ctx.fill();
          if (b[0] < 30) {
            ctx.fillStyle = '#84c25c';
            ctx.beginPath();
            ctx.arc(lx2 - b[2] * 0.52, ly2 - b[2] * 0.54, b[2] * 0.3, 0, Math.PI * 2);
            ctx.fill();
          }
          /* blossom, in threes. One fat dot per lobe read as a hole punched
             in the leaves; three small ones read as flowers. */
          ctx.fillStyle = 'rgba(255,236,242,.9)';
          for (var bl = 0; bl < 3; bl++) {
            ctx.beginPath();
            ctx.arc(lx2 + K.vary(q * 3 + bl, 130, -0.7, 0.7) * b[2],
                    ly2 + K.vary(q * 3 + bl, 131, -0.7, 0.7) * b[2], 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();
        for (var ah = 0; ah < 5; ah++) {          /* fruit still on the tree */
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
           look at, and this is the one loop in the stage with a character in
           it — the chickens are scenery, this is an event. */
        var ang = Math.sin(t * 0.035) * 0.62;
        var px = tx - 88 + bend, py = 54, len = 74;
        var sx = px + Math.sin(ang) * len, sy = py + Math.cos(ang) * len;
        ctx.strokeStyle = '#d8bd8c'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px - 4, py); ctx.lineTo(sx - 6, sy);
        ctx.moveTo(px + 4, py); ctx.lineTo(sx + 6, sy);
        ctx.stroke();
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(ang);
        ctx.fillStyle = '#6b4a2e';
        ctx.fillRect(-9, 0, 18, 3.5);
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        ctx.fillRect(-9, 2.6, 18, 1);
        K.spectator(ctx, 0, 0, 0.82, 411, t, 0);
        ctx.restore();
      });

      /* --- the frame: one vast trunk at the left edge of the picture,
             close enough that you cannot see the top of it --- */
      K.layer(ctx, camX, 0.86, function () {
        var drift2 = camX * 0.05;
        [[-24, 1]].forEach(function (side) {
          var ex = side[0] - drift2 * side[1], dir = side[1];
          ctx.fillStyle = '#3d2a1a';
          ctx.beginPath();
          ctx.moveTo(ex, H + 10);
          ctx.bezierCurveTo(ex + dir * 8, 120, ex - dir * 6, 60, ex + dir * 4, -10);
          ctx.lineTo(ex + dir * 48, -10);
          ctx.bezierCurveTo(ex + dir * 38, 70, ex + dir * 54, 130, ex + dir * 44, H + 10);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2.4;
          for (var q = 0; q < 5; q++) {
            ctx.beginPath();
            ctx.moveTo(ex + dir * (8 + q * 10), -10);
            ctx.bezierCurveTo(ex + dir * (4 + q * 11), 70,
                              ex + dir * (14 + q * 10), 130,
                              ex + dir * (10 + q * 9), H + 10);
            ctx.stroke();
          }
          ctx.fillStyle = 'rgba(255,240,190,.09)';
          ctx.fillRect(ex + (dir > 0 ? 38 : -44), -10, 6, H + 20);
        });
      });

      K.chicken(ctx, K.at(camX, 1, 150), FLOOR_Y + 22, 1, t, 0, '#e8b45c', '#c9382f');
      K.chicken(ctx, K.at(camX, 1, 470), FLOOR_Y + 34, 0.86, t, 2.4, '#f2ecdd', '#c9382f');
      this.petals.update();
      this.petals.draw(ctx, camX, t);
      this.motes.update();
      this.motes.draw(ctx, camX, t);
    },
    drawFore: function (ctx, camX, t) {
      /* a branch hanging into frame, out of focus. Clumped, with gaps —
         a solid band of leaves across the top just reads as a green stripe. */
      K.layer(ctx, camX, 1.5, function () {
        ctx.save();
        /* Kept to the left two thirds. The great tree's canopy owns the
           top right, and a foreground branch at depth 1.5 crossing it slid
           over it at a different rate — two sets of leaves sliding through
           each other reads as a rendering fault, not as depth. */
        ctx.beginPath(); ctx.rect(0, 0, 236, 70); ctx.clip();
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#4a3320';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        K.repeatX(camX, 0, 190, function (bx) {
          ctx.beginPath();
          ctx.moveTo(bx - 30, -4);
          ctx.quadraticCurveTo(bx + 50, 14 + Math.sin(t * 0.014) * 3, bx + 150, -8);
          ctx.stroke();
        });
        K.repeatX(camX, 0, 30, function (x, i) {
          var h = K.hash(i, 8);
          if (h < 0.42) return;                 // gaps: most of the sky stays visible
          var s2 = 0.7 + h * 0.7;
          var yy = 6 + h * 16 + Math.sin(x * 0.03 + t * 0.018) * 4;
          ctx.fillStyle = ['#33552a', '#3f6630', '#4f7a3a'][Math.abs(i) % 3];
          ctx.beginPath(); ctx.arc(x, yy, 10 * s2, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(x + 8 * s2, yy - 5 * s2, 7 * s2, 0, Math.PI * 2); ctx.fill();
          if (h > 0.8) {                        // the odd apple
            ctx.fillStyle = '#d8453a';
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
