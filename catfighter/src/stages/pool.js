/* =======================================================================
   2 — THE POOL DECK
   Hot, blue, and somebody is asleep on the flamingo.

   The shape of the picture, decided 22 Aug 2026 and worth stating because
   every element below is placed to serve it:

     - the RIGHT THIRD is the landmark: a slide tower running off the top of
       the frame, with a cat down it every four seconds and a splash.
     - the LEFT EDGE is the frame: a parasol canopy too close to see the top
       of, and an inflatable flamingo the size of a car propped on the deck
       to dry, looking down at the fight. The cooler and the towels are over
       at the other corner so the bottom of the frame is weighted at both
       ends rather than only one.
     - between them, far off and small, the pool, a palm grove, a lifeguard
       on a high chair, and the crowd along the far rail.

   Something enormous at each edge framing something small and far away is
   the whole trick; a repeating strip of parasols is not a place.

   TWO LOOPS, on deliberately different clocks. The slide runs every four
   seconds — you see it in the first round and it is the stage's pulse. The
   banner plane runs every fifteen, which is long enough that you find it in
   your third match rather than your first, and that is what "neat things to
   discover" has to mean at this scale: not more detail, a longer period.

   BUDGET. This stage costs about 8.8ms of the 16.7 (software rendering, no
   GPU), which puts it level with the barn rather than above it, so it is not
   the one that decides the worst case. It got there by flat-filling: the
   palms, the plane and the flamingo's seams are all "small parts" under the
   rule the cats' paws are flat by, and routing them through K.paint for a
   one-pixel crescent nobody can see cost 1.5ms on its own. Paint the big
   shapes. Everything under about six pixels is flat.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  /* ---- the flume ------------------------------------------------------

     One centreline, held in one place, used for three things: the painted
     ribbon, the dark trough inside it, and where the rider is. The first
     version drew the slide with three stacked strokes and sampled a copy of
     the bezier for the rider, which meant the rider drifted off the slide
     the moment either curve was nudged. A chain of cubics with one sampler
     cannot do that.

     Coordinates are relative to the tower anchor; y is absolute. It starts
     above the top of the frame on purpose — a slide you can see the top of
     is a playground slide. */
  var FLUME = [
    [[ 36,  22], [ 80,  40], [ -6,  50], [-24,  74]],
    [[-24,  74], [-40,  96], [ 26, 120], [ 40, 152]]
  ];

  /* A second flume, further back and running off the top of the picture.
     The main one now starts on the platform where you can see the queue get
     on it, which is the better read — but a slide whose top you can see is a
     playground slide, and the whole point of this thing is that it is bigger
     than the frame. One more ribbon, hazed back, buys both. */
  var FLUME_B = [
    [[-104, -34], [-64, -6], [-58,  16], [-26,  34]]
  ];

  function bez1(a, b, c, d, k) {
    var m = 1 - k;
    return m*m*m*a + 3*m*m*k*b + 3*m*k*k*c + k*k*k*d;
  }

  /* Position along the whole chain, 0..1, plus the tangent so a wall can be
     offset square to it. */
  function flumeAt(u, tx, chain) {
    var C = chain || FLUME;
    var n = C.length;
    var i = Math.min(n - 1, Math.floor(u * n));
    var k = u * n - i, s = C[i];
    var x = bez1(s[0][0], s[1][0], s[2][0], s[3][0], k) + tx;
    var y = bez1(s[0][1], s[1][1], s[2][1], s[3][1], k);
    var k2 = Math.min(1, k + 0.02);
    var dx = bez1(s[0][0], s[1][0], s[2][0], s[3][0], k2) + tx - x;
    var dy = bez1(s[0][1], s[1][1], s[2][1], s[3][1], k2) - y;
    var L = Math.hypot(dx, dy) || 1;
    return { x: x, y: y, nx: -dy / L, ny: dx / L };
  }

  /* The flume as a closed polygon: walk the centreline out on one side and
     back on the other, tapering. K.paint can then give it the same three
     tones as everything else in the stage — a stroked line, however fat,
     stays one flat colour and reads as a drawn squiggle, which is exactly
     what this was before. */
  function flumeRibbon(tx, w0, w1, chain) {
    return function (ctx) {
      var i, p, w, N = 26;
      ctx.beginPath();
      for (i = 0; i <= N; i++) {
        p = flumeAt(i / N, tx, chain); w = (w0 + (w1 - w0) * (i / N)) / 2;
        ctx[i ? 'lineTo' : 'moveTo'](p.x + p.nx * w, p.y + p.ny * w);
      }
      for (i = N; i >= 0; i--) {
        p = flumeAt(i / N, tx, chain); w = (w0 + (w1 - w0) * (i / N)) / 2;
        ctx.lineTo(p.x - p.nx * w, p.y - p.ny * w);
      }
      ctx.closePath();
    };
  }

  /* A stroke that follows the centreline, offset square to it. Used for the
     dark trough, the sheet of water in it, and the near wall that crosses in
     front of the rider so he sits IN the tube rather than on top of it. */
  function flumeStroke(ctx, tx, off, width, style, chain) {
    ctx.strokeStyle = style; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i <= 24; i++) {
      var p = flumeAt(i / 24, tx, chain);
      ctx[i ? 'lineTo' : 'moveTo'](p.x + p.nx * off, p.y + p.ny * off);
    }
    ctx.stroke();
  }

  /* ---- a palm ----------------------------------------------------------

     Not in the shared kit, and this is the stage that needed one. The far
     side of the pool was two flat green bands with a row of small blobs on
     it and nothing taller than a parasol anywhere, so the whole middle
     distance read as a printed strip rather than as a place with a scale of
     its own. A palm is the cheapest vertical there is and it names the
     location before you have read anything else in the frame.

     Nothing here goes through K.paint. A palm is a six-pixel trunk and seven
     fourteen-pixel blades; every one of them is a "small part" by the rule
     the cats' paws are flat under, and the first version — trunk painted,
     fronds one path each — measured at 1.25ms for four palms. Flat fills
     and two batched frond paths brought it to 0.4 and the picture at 1x is
     the same drawing. */
  function palm(ctx, x, base, s, t, ph) {
    var h = 42 * s, lean = Math.sin(ph) * 8 * s;
    var top = base - h;
    var cx2 = x + lean + Math.sin(t * 0.013 + ph) * 1.8 * s;
    /* The lit edge is one stroke up the light side. On a shape three pixels
       wide that is all the form there is room for — a second tone lands on
       top of the first and you get a trunk one pixel narrower. */
    ctx.beginPath();
    ctx.moveTo(x - 3.0 * s, base);
    ctx.quadraticCurveTo(x + lean * 0.35 - 1.5 * s, base - h * 0.55, cx2 - 1.4 * s, top);
    ctx.lineTo(cx2 + 1.4 * s, top);
    ctx.quadraticCurveTo(x + lean * 0.35 + 1.8 * s, base - h * 0.55, x + 3.0 * s, base);
    ctx.closePath();
    ctx.fillStyle = '#7d5f3b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(38,26,14,.6)';
    ctx.lineWidth = Math.max(1, 0.9 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 2.2 * s, base);
    ctx.quadraticCurveTo(x + lean * 0.35 - 1.0 * s, base - h * 0.55, cx2 - 0.9 * s, top);
    ctx.strokeStyle = '#a98a5c';
    ctx.lineWidth = Math.max(1, 1.1 * s);
    ctx.stroke();

    /* seven fronds fanned across the upper half-circle, each drooping
       further the more horizontal it is — a fan of straight blades is a
       shuttlecock, and the droop is the whole read of a palm.

       Two passes, not seven: every frond of a tone goes into ONE path and
       is filled and stroked once. Seven fills and seven strokes a palm over
       four palms measured at half a millisecond on its own — canvas charges
       per path, not per square pixel, and a frond is fourteen pixels long. */
    for (var pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (var f2 = pass; f2 < 7; f2 += 2) {
        var a = -Math.PI + (f2 + 0.5 + Math.sin(ph * 3 + f2) * 0.16) / 7 * Math.PI;
        var L = (14 + ((f2 * 3 + Math.floor(ph * 5)) % 3) * 4) * s
              + Math.sin(t * 0.02 + ph + f2) * 0.8 * s;
        var ca = Math.cos(a), sa = Math.sin(a);
        ctx.moveTo(cx2, top + 1);
        ctx.quadraticCurveTo(cx2 + ca * L * 0.55, top + sa * L * 0.52 - 2.6 * s,
                             cx2 + ca * L, top + sa * L * 0.66 + Math.abs(ca) * L * 0.40);
        ctx.quadraticCurveTo(cx2 + ca * L * 0.48, top + sa * L * 0.44 + 3.2 * s,
                             cx2, top + 3 * s);
        ctx.closePath();
      }
      /* the even fronds darker and underneath: without the split the crown
         is one green blot and the palm loses its only bit of depth */
      ctx.fillStyle = pass ? '#4d9a52' : '#2f6d3c';
      ctx.fill();
      ctx.strokeStyle = 'rgba(24,52,28,.55)';
      ctx.lineWidth = Math.max(1, 0.9 * s);
      ctx.stroke();
    }
    /* coconuts, on the bigger ones only — three dark pixels that make the
       crown read as having a middle */
    if (s > 1.05) {
      ctx.fillStyle = '#5a4326';
      ctx.beginPath(); ctx.arc(cx2 - 2 * s, top + 4 * s, 1.7 * s, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx2 + 2.2 * s, top + 5 * s, 1.7 * s, 0, Math.PI * 2); ctx.fill();
    }
  }

  CF.StageDefs = CF.StageDefs || {};
  CF.StageDefs.pool = {
    id: 'pool', name: 'THE POOL DECK',
    blurb: 'Hot, blue, and somebody is asleep on the flamingo.',
    /* the colour of the air here — see K.deepen */
    air: { air: '#c2dcef', haze: 0.30, floorDark: 0.26, horizon: 118 },
    init: function () {
      this.sparkle = new P({ count: 20, kind: 'sparkle', depth: 0.9, seed: 22,
                             band: [FLOOR_Y - 22, FLOOR_Y - 4], vx: 0.05, vy: 0,
                             size: 1.5, color: 'rgba(255,255,255,.95)' });
      this.heat = new P({ count: 14, kind: 'bubble', depth: 0.5, seed: 23,
                          band: [70, 150], vx: 0.09, vy: -0.04,
                          size: 2.2, color: 'rgba(255,255,255,.5)' });
    },

    drawBack: function (ctx, camX, t, mood) {
      K.sky(ctx, [[0, '#2f7fd0'], [0.55, '#79c2ea'], [1, '#cfe9f2']], 0, 128);

      /* --- clouds, no two the same size or speed --- */
      K.layer(ctx, camX, 0.06, function () {
        K.repeatX(camX, 0, 118, function (x, i) {
          var s = K.vary(i, 70, 0.7, 1.5), y = K.vary(i, 71, 16, 54);
          var d = x + t * K.vary(i, 72, 0.02, 0.06);
          ctx.fillStyle = 'rgba(255,255,255,' + K.vary(i, 73, 0.55, 0.95).toFixed(2) + ')';
          for (var q = 0; q < 4; q++) {
            ctx.beginPath();
            ctx.ellipse(d + q * 13 * s, y + K.vary(i * 4 + q, 74, -4, 4) * s,
                        K.vary(i * 4 + q, 75, 8, 15) * s,
                        K.vary(i * 4 + q, 76, 5, 9) * s, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });
      K.glow(ctx, 138, 26, 58, 'rgba(255,246,190,.9)', 0.5);
      ctx.fillStyle = '#fff8d0';
      ctx.beginPath(); ctx.arc(138, 26, 16, 0, Math.PI * 2); ctx.fill();

      /* --- A BANNER PLANE, once every fifteen seconds ------------------
             Two things wrong that this fixes at once. The top third of the
             picture was sky and four clouds, which is a lot of nothing at
             384 across; and the stage had exactly ONE thing happening on a
             loop, the slide, on a four-second period you notice immediately
             and then stop seeing. A second loop on a much longer period is
             the thing you find in your third match and point at, which is
             what "neat things to discover" actually means.

             The banner is coloured panels, not lettering. A word at this
             resolution is six grey pixels and reads as a rendering fault;
             ripple and colour read as cloth on a rope from across a room. */
      K.layer(ctx, camX, 0.04, function () {
        var pl = (t % 900) / 900;
        if (pl >= 0.84) return;
        var px = -170 + (pl / 0.84) * (W + 340) - camX * 0.04;
        /* y 54, not 34. At 34 it flew straight through the health bars and
           the MATCH counter — invisible for the whole of an actual fight,
           which was only obvious from a `shot.mjs fight` frame and not from
           a stage render. Anything put in the top forty pixels of this game
           is put behind the HUD. */
        var py = 54 + Math.sin(t * 0.03) * 1.8;

        ctx.strokeStyle = 'rgba(50,54,64,.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px - 2, py + 5); ctx.lineTo(px - 18, py + 6); ctx.stroke();
        var cols = ['#e4574c', '#f0b429', '#f4f0e4', '#4aa8c9'];
        var b, bx, w0, w1;
        for (b = 0; b < 8; b++) {
          bx = px - 18 - b * 7;
          w0 = Math.sin(t * 0.09 - b * 0.7) * 1.7;
          w1 = Math.sin(t * 0.09 - (b + 1) * 0.7) * 1.7;
          ctx.fillStyle = cols[b % 4];
          ctx.beginPath();
          ctx.moveTo(bx, py + 1 + w0); ctx.lineTo(bx - 7, py + 1 + w1);
          ctx.lineTo(bx - 7, py + 11 + w1); ctx.lineTo(bx, py + 11 + w0);
          ctx.closePath(); ctx.fill();
        }
        /* The lit top hem. Without it the panels are flat swatches and the
           banner sits in a different world from the rest of the stage — but
           it is one colour over all eight panels, so it is one path and one
           fill rather than eight of each. */
        ctx.beginPath();
        for (b = 0; b < 8; b++) {
          bx = px - 18 - b * 7;
          w0 = Math.sin(t * 0.09 - b * 0.7) * 1.7;
          w1 = Math.sin(t * 0.09 - (b + 1) * 0.7) * 1.7;
          ctx.moveTo(bx, py + 1 + w0); ctx.lineTo(bx - 7, py + 1 + w1);
          ctx.lineTo(bx - 7, py + 2.4 + w1); ctx.lineTo(bx, py + 2.4 + w0);
          ctx.closePath();
        }
        ctx.fillStyle = 'rgba(255,255,255,.4)';
        ctx.fill();

        /* Tail fin, then the fuselage over it, then the near wing hanging
           below — three shapes, because a single silhouette of a plane at
           twenty pixels is an arrowhead.

           All three flat-filled. They went through K.paint first and cost
           three clips for three one-pixel crescents on a shape twenty-five
           pixels long, which is the same bad trade the palm trunks were
           making. Three tones ACROSS the three parts does the work instead:
           the fin dark, the fuselage light, the underwing darker still. */
        ctx.strokeStyle = 'rgba(70,80,92,.75)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px - 2, py + 6); ctx.lineTo(px + 1, py - 4);
        ctx.lineTo(px + 8, py + 5); ctx.closePath();
        ctx.fillStyle = '#c2cad2'; ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px + 15, py + 6); ctx.lineTo(px + 21, py + 13);
        ctx.lineTo(px + 12, py + 13); ctx.lineTo(px + 9, py + 7); ctx.closePath();
        ctx.fillStyle = '#9fa9b4'; ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px + 25, py + 5);
        ctx.quadraticCurveTo(px + 16, py + 1, px - 2, py + 3);
        ctx.lineTo(px - 2, py + 8);
        ctx.quadraticCurveTo(px + 14, py + 10, px + 25, py + 5);
        ctx.closePath();
        ctx.fillStyle = '#f4f2ea'; ctx.fill(); ctx.stroke();
        /* the cabin window strip — two dark pixels, and they are what stop
           the fuselage reading as a thrown bread roll */
        ctx.fillStyle = 'rgba(60,72,86,.8)';
        ctx.fillRect(px + 10, py + 4, 6, 1.6);
        /* the propeller disc — a fan blur, not two blades. Blades at this
           size strobe against the frame rate and read as a broken sprite. */
        ctx.fillStyle = 'rgba(220,228,236,.45)';
        ctx.beginPath(); ctx.ellipse(px + 26, py + 5, 1.6, 6, 0, 0, Math.PI * 2); ctx.fill();
      });

      /* --- hills, then the vineyard rows climbing them --- */
      K.hills(ctx, camX, 0.10, '#6ea84e', 124, 20, 3);
      K.hills(ctx, camX, 0.17, '#5b9142', 133, 14, 9);
      K.layer(ctx, camX, 0.17, function () {
        ctx.strokeStyle = 'rgba(40,70,30,.35)'; ctx.lineWidth = 1.2;
        K.repeatX(camX, 0, 21, function (x, i) {
          ctx.beginPath();
          ctx.moveTo(x, 126 + K.vary(i, 77, 2, 8));
          ctx.lineTo(x - 8, 140);
          ctx.stroke();
        });
      });

      /* --- the palm row, standing on the far side of the pool.
             Spaced wide and thinned out: four big ones read as a grove,
             eight small ones read as a fence, and a fence across the band
             the fighters' heads are in is exactly the clutter that makes a
             stage hard to fight on. --- */
      K.layer(ctx, camX, 0.24, function () {
        K.repeatX(camX, 0, 84, function (x, i) {
          if (K.chance(i, 133, 0.16)) return;
          palm(ctx, x, K.vary(i, 134, 128, 137), K.vary(i, 135, 0.78, 1.5),
               t, K.vary(i, 136, 0, 6.28));
        });
      });

      /* =================================================================
         THE LANDMARK — the slide tower, right third, top of frame to pool.
         ================================================================= */
      K.layer(ctx, camX, 0.30, function () {
        /* Anchored at 296, not 252. At 252 the flume's descent came down at
           x 252 — exactly where the right-hand fighter stands — so the cat
           riding it was hidden behind a cat fighting, which is the one place
           a four-second event must not happen. The tower owns everything
           right of 250 now and the fight owns the middle. */
        var tx = K.at(camX, 0, 296) - camX * 0.03;

        /* the second flume, behind everything and pushed towards the colour
           of the air so it sits back */
        K.paint(ctx, flumeRibbon(tx, 22, 26, FLUME_B), '#7fc4dd',
                { step: 2.5, shade: 0.3, hi: 0.2, edgeW: 1.2 });
        flumeStroke(ctx, tx, 1.5, 11, 'rgba(40,110,150,.7)', FLUME_B);

        /* --- the tower it stands on. Painted boxes, not lines: at this size
               a stroked leg is a wire and the whole thing floats. --- */
        [[-2, 12], [46, 9]].forEach(function (leg, n) {
          var x0 = tx + leg[0], w = leg[1];
          /* legs lean in slightly towards the top — perfectly vertical posts
             read as a printed grid rather than a structure */
          for (var s2 = 0; s2 < 5; s2++) {
            var yy = 8 + s2 * 34, hh = 34;
            var lean = (1 - yy / 180) * (n ? -5 : 5);
            K.mass(ctx, x0 + lean, yy, w, hh, '#b7c0c8',
                   { top: 0, side: 3, foot: false, edgeW: 1 });
          }
        });
        /* one diagonal a bay, not a cross. Two of them made the top corner
           of the picture a grey mesh and you could not see the tower for
           the bracing. */
        ctx.strokeStyle = '#8d98a2'; ctx.lineWidth = 2;
        for (var br = 0; br < 5; br++) {
          var by = 26 + br * 34;
          ctx.beginPath();
          ctx.moveTo(tx + 2, by + (br % 2 ? 22 : 0));
          ctx.lineTo(tx + 52, by + (br % 2 ? 0 : 22));
          ctx.stroke();
        }
        /* the ladder up the back of it */
        ctx.strokeStyle = '#9aa4ae'; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(tx + 62, 22); ctx.lineTo(tx + 66, 176);
        ctx.moveTo(tx + 74, 22); ctx.lineTo(tx + 76, 176); ctx.stroke();
        ctx.lineWidth = 1.4;
        for (var rg = 0; rg < 14; rg++) {
          var ry2 = 26 + rg * 11;
          ctx.beginPath(); ctx.moveTo(tx + 62.5, ry2); ctx.lineTo(tx + 75, ry2); ctx.stroke();
        }

        /* the platform at the top, with a queue on it waiting their turn —
           the queue is what tells you the slide is in use */
        /* The platform sat at y 6 with the queue half off the top of the
           picture, which made it read as a yellow sign hanging in the sky.
           It is low enough now that you can see two cats standing on it
           waiting their turn, and that is the thing that tells you what the
           whole structure is for. */
        K.spectator(ctx, tx - 6, 22, 0.74, 311, t, mood);
        K.spectator(ctx, tx + 18, 22, 0.66, 512, t + 40, mood);
        K.mass(ctx, tx - 30, 22, 96, 7, '#d8b45c', { top: 4, side: 5 });
        ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx - 28, 22); ctx.lineTo(tx - 28, 0);
        ctx.moveTo(tx + 30, 22); ctx.lineTo(tx + 30, 0);
        ctx.moveTo(tx - 28, 4); ctx.lineTo(tx + 30, 4);
        ctx.moveTo(tx - 28, 13); ctx.lineTo(tx + 30, 13); ctx.stroke();

        /* --- the flume itself --- */
        K.paint(ctx, flumeRibbon(tx, 32, 25), '#39b0d8',
                { step: 3, shade: 0.42, hi: 0.26, edgeW: 1.4 });
        flumeStroke(ctx, tx, 1.5, 15, '#12557a');                  /* the trough */
        flumeStroke(ctx, tx, 1.5, 7, 'rgba(190,244,255,.7)');      /* water in it */

        /* somebody coming down it, once every four seconds or so */
        var ride = (t % 250) / 250;
        if (ride < 0.58) {
          var u = ride / 0.58;
          var p = flumeAt(u, tx);
          /* spray thrown up behind them */
          ctx.fillStyle = 'rgba(255,255,255,.7)';
          for (var sp2 = 1; sp2 < 5; sp2++) {
            var q2 = flumeAt(Math.max(0, u - sp2 * 0.035), tx);
            ctx.beginPath();
            ctx.arc(q2.x, q2.y - sp2 * 1.4, 4 - sp2 * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
          K.spectator(ctx, p.x, p.y + 5, 0.66, 909, t * 3, 1);
        } else if (ride < 0.70) {
          /* the splash where they land, and a ring going out from it */
          var s3 = (ride - 0.58) / 0.12;
          var lx2 = flumeAt(1, tx).x - 6, ly2 = 150;
          ctx.fillStyle = 'rgba(255,255,255,' + (0.85 * (1 - s3)).toFixed(2) + ')';
          for (var d2 = 0; d2 < 9; d2++) {
            var a2 = -0.25 - d2 * 0.29, r2 = 5 + s3 * 30;
            ctx.beginPath();
            ctx.arc(lx2 + Math.cos(a2) * r2, ly2 + Math.sin(a2) * r2 * 0.75,
                    3.4 * (1 - s3) + 1, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 * (1 - s3)).toFixed(2) + ')';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(lx2, ly2 + 4, 8 + s3 * 34, 3 + s3 * 11, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        /* the near wall of the tube, laid over the rider so he is inside it */
        flumeStroke(ctx, tx, 11.5, 8, K.lighter('#39b0d8', 0.14));
      });

      /* --- the far deck: parasols, loungers and the crowd round the pool.
             Small, and deliberately so — they are what the tower and the
             flamingo are measured against. --- */
      K.layer(ctx, camX, 0.34, function () {
        K.repeatX(camX, 0, 74, function (x, i) {
          if (K.chance(i, 78, 0.3)) return;
          var top = K.vary(i, 79, 108, 116), lean = K.vary(i, 80, -0.1, 0.1);
          ctx.save();
          ctx.translate(x, top + 22);
          ctx.rotate(lean);
          ctx.strokeStyle = '#b9a478'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -22); ctx.stroke();
          var col = K.pick(i, 81, ['#e4574c', '#f0b429', '#4aa8c9', '#e07ab0', '#5bbd7a']);
          /* Flat, with the underside painted in as a second shape.

             A far parasol is thirty pixels across and K.paint was buying
             each one a clip to produce a crescent a pixel and a half wide.
             Six on screen at once measured at 0.5ms — a whole palm's worth
             of budget for something you cannot see at 1x. Two flat paths
             give the identical picture: the canopy, and the shadowed
             underside that is the only thing stopping it reading as a
             coloured lozenge. */
          ctx.beginPath();
          ctx.moveTo(-16, -21);
          ctx.quadraticCurveTo(0, -31, 16, -21);
          ctx.quadraticCurveTo(0, -17, -16, -21);
          ctx.closePath();
          ctx.fillStyle = col;
          ctx.fill();
          ctx.strokeStyle = K.darker(col, 0.58);
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-16, -21);
          ctx.quadraticCurveTo(0, -17, 16, -21);
          ctx.quadraticCurveTo(0, -19.4, -16, -21);
          ctx.closePath();
          ctx.fillStyle = K.darker(col, 0.36);
          ctx.fill();
          ctx.restore();
          if (K.chance(i, 82, 0.5)) {
            ctx.fillStyle = K.pick(i, 83, ['#f2ede0', '#dfe8ef', '#f5dcc8']);
            ctx.save();
            ctx.translate(x + K.vary(i, 84, -14, 14), top + 23);
            ctx.rotate(-0.12);
            ctx.fillRect(-12, -4, 24, 4);
            ctx.restore();
          }
        });
      });
      /* THE LIFEGUARD CHAIR, on the far deck.

         The header of this file promised one and nobody ever drew it. It
         earns the place: the band from y100 to y135 sits directly behind the
         fighters and was plain green hill with a row of small blobs on it,
         and a stage that is empty exactly where the eye rests all match is
         wallpaper. A tall white vertical is the cheapest possible fix — it
         is the only thing on the far side taller than a parasol, so it reads
         as the far side having a scale of its own rather than being a strip.

         Small on purpose. It is one of the things the flamingo and the tower
         are measured AGAINST; drawn any bigger it competes with them. */
      K.layer(ctx, camX, 0.34, function () {
        var lx = K.at(camX, 0.34, 40);
        /* legs, splayed — a chair with parallel legs reads as a lamp post */
        ctx.strokeStyle = '#e8e2d2'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx - 3, 134); ctx.lineTo(lx + 1, 106);
        ctx.moveTo(lx + 13, 134); ctx.lineTo(lx + 9, 106);
        ctx.moveTo(lx - 1, 122); ctx.lineTo(lx + 11, 122);   /* the cross-brace */
        ctx.stroke();
        /* seat and back, painted rather than stroked so they have a lit top */
        K.mass(ctx, lx - 1, 106, 12, 4, '#f2ece0', { top: 2, side: 2, foot: false, edgeW: 1 });
        K.mass(ctx, lx + 8, 96, 4, 12, '#f2ece0', { top: 2, side: 1, foot: false, edgeW: 1 });
        /* the guard, and the red torpedo float across their knees — the
           float is the one saturated pixel up here and it is what names
           the whole prop from thirty pixels away */
        K.spectator(ctx, lx + 5, 106, 0.52, 617, t * 0.3, mood);
        ctx.fillStyle = '#d8322c';
        ctx.beginPath(); ctx.ellipse(lx + 3, 104, 6, 2, -0.15, 0, Math.PI * 2); ctx.fill();
        /* a parasol shading them, tilted off the vertical */
        ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(lx + 6, 100); ctx.lineTo(lx + 10, 84); ctx.stroke();
        K.paint(ctx, function (c) {
          c.beginPath();
          c.moveTo(lx - 6, 85);
          c.quadraticCurveTo(lx + 10, 76, lx + 26, 87);
          c.quadraticCurveTo(lx + 10, 90, lx - 6, 85);
          c.closePath();
        }, '#e4574c', { step: 1.6, edgeW: 1 });
      });

      /* the crowd at the far rail, watching the fight rather than the pool */
      K.crowdRow(ctx, camX, 0.34, 27, 132, t, mood,
                 { seed: 140, gap: 0.34, min: 0.52, max: 0.74 });

      /* --- the pool. It reaches from the far rail almost to the fighters'
             feet, so the fight happens on the lip of it. --- */
      K.water(ctx, 0, 136, W, 32, t, '#1d76b0', '#63c3e9', 'rgba(255,255,255,.6)');
      /* the lane tiles on the bottom of the pool, wobbling through the water */
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#0d4f78'; ctx.lineWidth = 2;
      [146, 156].forEach(function (ly3, n3) {
        ctx.beginPath();
        for (var lx3 = 0; lx3 <= W; lx3 += 6) {
          ctx.lineTo(lx3, ly3 + Math.sin((lx3 + t * 1.2 + n3 * 40) * 0.05) * 1.6);
        }
        ctx.stroke();
      });
      ctx.restore();
      /* the sun's glitter path — a wedge of broken white running towards the
         viewer from under the sun. One highlight line across the whole band
         reads as a river; a hot patch under the light reads as a pool. */
      ctx.save();
      for (var gr = 0; gr < 22; gr++) {
        var gy = 137 + (gr % 8) * 3.9;
        var spread = 8 + (gy - 137) * 2.2;
        var gx = 138 + Math.sin(gr * 2.4 + t * 0.05) * spread;
        ctx.globalAlpha = 0.25 + 0.4 * Math.abs(Math.sin(t * 0.07 + gr));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(gx, gy, 2 + (gr % 3) * 2.5, 1.4);
      }
      ctx.restore();
      /* the wobbling reflection of the tower, on the water under it */
      K.layer(ctx, camX, 0.30, function () {
        var rx3 = K.at(camX, 0, 296) - camX * 0.03;
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = '#0d4f78';
        for (var r3 = 0; r3 < 7; r3++) {
          var yy3 = 138 + r3 * 4;
          ctx.fillRect(rx3 - 6 + Math.sin(t * 0.05 + r3) * 2.4, yy3, 56, 2.4);
        }
        ctx.restore();
      });

      K.layer(ctx, camX, 0.5, function () {
        /* floats — three kinds, and never two of a kind next to each other */
        K.repeatX(camX, 0, 92, function (x, i) {
          var fy = 152 + Math.sin(t * 0.03 + i) * 1.6;
          var kind = Math.floor(K.hash(i, 87) * 3);
          /* Both of these were K.paint too, for the same non-reason: a ring
             ten pixels tall does not have room for a lit rim. Flat fill,
             one dark line under the near edge for the waterline. */
          if (kind === 0) {                     /* a flamingo ring */
            ctx.fillStyle = '#ff8fb0';
            ctx.beginPath(); ctx.ellipse(x, fy, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#c25e80'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.ellipse(x, fy, 14, 5, 0, 0, Math.PI); ctx.stroke();
            ctx.strokeStyle = '#ff8fb0'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 10, fy - 2);
            ctx.quadraticCurveTo(x - 16, fy - 13, x - 8, fy - 15);
            ctx.stroke();
          } else if (kind === 1) {              /* a lilo with somebody asleep */
            ctx.fillStyle = '#4ad0c0';
            ctx.beginPath(); ctx.ellipse(x, fy, 16, 4.4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#2b8b82'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.ellipse(x, fy, 16, 4.4, 0, 0, Math.PI); ctx.stroke();
            K.spectator(ctx, x, fy - 2, 0.58, Math.abs(i * 5), t * 0.2, null);
          } else {                              /* a beach ball */
            ctx.fillStyle = '#f5f0e4';
            ctx.beginPath(); ctx.arc(x, fy - 3, 5.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#e4574c';
            ctx.beginPath(); ctx.moveTo(x, fy - 8.5); ctx.arc(x, fy - 3, 5.5, -Math.PI / 2, 0); ctx.fill();
          }
        });
        /* somebody in the water with only their ears out — a thing to find */
        var sw = K.at(camX, 0, 132) + Math.sin(t * 0.012) * 26;
        ctx.fillStyle = '#4a4038';
        ctx.beginPath(); ctx.moveTo(sw - 4, 160); ctx.lineTo(sw - 3, 154); ctx.lineTo(sw - 1, 160); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sw + 4, 160); ctx.lineTo(sw + 3, 154); ctx.lineTo(sw + 1, 160); ctx.fill();
        ctx.beginPath(); ctx.ellipse(sw, 161, 5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(sw, 162.5, 9 + Math.sin(t * 0.08) * 2, 3, 0, 0, Math.PI * 2); ctx.stroke();
      });

      /* the near coping — the tiled lip the fighters stand behind */
      K.layer(ctx, camX, 0.9, function () {
        ctx.fillStyle = '#9fc3d2';
        ctx.fillRect(0, 166, W, 2);
        K.repeatX(camX, 0, 22, function (x, i) {
          K.mass(ctx, x, 168, 21, 6,
                 Math.abs(i) % 2 ? '#e2d8c4' : '#d6cab2', { top: 2, side: 2, foot: false, edgeW: 1 });
        });
      });

      /* --- the deck --- */
      K.ground(ctx, camX, '#d8cdb4', '#efe6d2', 0.06);
      this.pavers(ctx, camX);

      /* wet paw prints coming up out of the pool and away to the right */
      K.layer(ctx, camX, 1, function () {
        K.repeatX(camX, 1, 240, function (x0, i0) {
          for (var s4 = 0; s4 < 7; s4++) {
            var px3 = x0 + s4 * 15, py3 = FLOOR_Y + 6 + s4 * 5.4;
            var side = s4 % 2 ? 5 : -5;
            ctx.fillStyle = 'rgba(150,175,190,' + (0.32 - s4 * 0.035).toFixed(2) + ')';
            ctx.beginPath();
            ctx.ellipse(px3 + side, py3, 3.4, 2.2, 0, 0, Math.PI * 2); ctx.fill();
            for (var tq = -1; tq <= 1; tq++) {
              ctx.beginPath();
              ctx.ellipse(px3 + side + tq * 2.4, py3 - 2.6, 1, 0.9, 0, 0, Math.PI * 2); ctx.fill();
            }
          }
        });
        /* a towel and a pair of flip-flops, dropped where somebody got out */
        K.repeatX(camX, 1, 150, function (x, i) {
          ctx.save();
          ctx.translate(x, FLOOR_Y + K.vary(i, 89, 14, 40));
          ctx.rotate(K.vary(i, 90, -0.26, 0.26));
          var tc = K.pick(i, 91, ['#e4574c', '#f0b429', '#4aa8c9', '#e07ab0']);
          K.mass(ctx, -18, -4, 36, 7, tc, { top: 2, side: 3, foot: false, edgeW: 1 });
          ctx.fillStyle = 'rgba(255,255,255,.35)';
          ctx.fillRect(-18, -4, 36, 1.6);
          ctx.restore();
          if (K.chance(i, 96, 0.5)) {
            var fx = x + K.vary(i, 97, 40, 90), fy2 = FLOOR_Y + K.vary(i, 98, 18, 42);
            ctx.fillStyle = 'rgba(60,50,44,.5)';
            ctx.beginPath(); ctx.ellipse(fx, fy2 + 1, 4, 2.2, 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(fx + 7, fy2 + 2.4, 4, 2.2, 0.1, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = K.pick(i, 99, ['#4aa8c9', '#f0b429']);
            ctx.beginPath(); ctx.ellipse(fx, fy2, 4, 2.2, 0.2, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(fx + 7, fy2 + 1.4, 4, 2.2, 0.1, 0, Math.PI * 2); ctx.fill();
          }
        });
        /* A PUDDLE, big enough to see the sky in.

           The deck below the tile course was still the emptiest plane in the
           picture, and the instinct — scatter more small litter over it —
           was tried and only made noise. What an empty plane needs is ONE
           large shape. A puddle earns its keep twice: it is a hole in the
           beige, and it is the only place in the stage where the sky turns
           up BELOW the horizon, which is what makes the deck read as wet
           rather than as sand.

           Two flat tones with a hard edge between them, not a gradient. A
           gradient here reads as an airbrushed blob; the hard line is the
           water's own far edge catching sky and its near edge looking into
           the deep, and it is the same rule the cats are shaded by. */
        K.repeatX(camX, 1, 178, function (x0, i0) {
          var pxr = x0 + K.vary(i0, 130, -34, 34);
          var pyr = 196 + K.vary(i0, 131, -8, 8);
          var sc = K.vary(i0, 132, 0.78, 1.28);
          var path = function (c) {
            c.beginPath();
            c.moveTo(pxr - 52 * sc, pyr);
            c.bezierCurveTo(pxr - 44 * sc, pyr - 13 * sc, pxr - 6 * sc, pyr - 13 * sc,
                            pxr + 14 * sc, pyr - 7 * sc);
            c.bezierCurveTo(pxr + 42 * sc, pyr - 1, pxr + 52 * sc, pyr + 7 * sc,
                            pxr + 28 * sc, pyr + 12 * sc);
            c.bezierCurveTo(pxr + 2 * sc, pyr + 17 * sc, pxr - 40 * sc, pyr + 12 * sc,
                            pxr - 52 * sc, pyr);
            c.closePath();
          };
          ctx.save();
          path(ctx); ctx.clip();
          ctx.globalAlpha = 0.72;
          ctx.fillStyle = '#a8d2e8';
          ctx.fillRect(pxr - 60 * sc, pyr - 20, 124 * sc, 44);
          ctx.fillStyle = '#5d95b6';
          ctx.fillRect(pxr - 60 * sc, pyr + 3 * sc, 124 * sc, 22);
          /* two glints crawling across it — a still puddle is a sticker */
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#ffffff';
          for (var gq = 0; gq < 3; gq++) {
            ctx.fillRect(pxr - 30 * sc + gq * 22 * sc + Math.sin(t * 0.02 + gq) * 5,
                         pyr - 4 + gq * 3, 11 * sc, 1.4);
          }
          ctx.restore();
          /* the wet rim. Without it the puddle is a blue shape lying on the
             deck rather than a wet patch OF it. */
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.strokeStyle = '#8d8266'; ctx.lineWidth = 1.6;
          path(ctx); ctx.stroke();
          ctx.restore();
        });

        /* splashed water drying on the hot deck */
        K.repeatX(camX, 1, 74, function (x, i) {
          ctx.fillStyle = 'rgba(140,190,215,.3)';
          ctx.beginPath();
          ctx.ellipse(x + K.vary(i, 92, -20, 20), FLOOR_Y + K.vary(i, 93, 8, 44),
                      K.vary(i, 94, 6, 16), K.vary(i, 95, 2, 5), 0, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      K.floorPool(ctx, W * 0.45, 190, 'rgba(255,246,214,.6)', 0.32);
      K.litter(ctx, camX, 1, 70, ['rgba(120,150,170,.3)', 'rgba(255,255,255,.35)'], 0.8, 2.2);
      this.sparkle.update();
      this.sparkle.draw(ctx, camX, t);
      this.heat.update();
      this.heat.draw(ctx, camX, t);
    },

    /* Pavers, in perspective, each one a slightly different tone.

       The deck is a quarter of the picture and it was a gradient with some
       confetti on it. Real pavers with a joint between them and no two the
       same colour do more than any amount of scattered detail: the eye reads
       the joints converging and the floor lies down flat. */
    pavers: function (ctx, camX) {
      var rows = 5;
      for (var r = 0; r < rows; r++) {
        var y0 = FLOOR_Y + Math.pow(r / rows, 1.55) * (H - FLOOR_Y);
        var y1 = FLOOR_Y + Math.pow((r + 1) / rows, 1.55) * (H - FLOOR_Y);
        var sp = 24 + r * 14;
        (function (r2, y0b, y1b, sp2) {
          K.repeatX(camX, 1, sp2, function (x, i) {
            var v = K.vary(i * 7 + r2, 120, -0.05, 0.05);
            ctx.fillStyle = v > 0 ? K.lighter('#e3d8c0', v * 4) : K.darker('#e3d8c0', -v * 4);
            ctx.fillRect(x, y0b, sp2 - 1, y1b - y0b);
            /* the lit top lip of each course — one pixel, and it is what
               makes the joint read as a groove rather than a drawn line */
            ctx.fillStyle = 'rgba(255,252,240,.45)';
            ctx.fillRect(x, y0b, sp2 - 1, 1);
          });
        })(r, y0, y1, sp);
        ctx.fillStyle = 'rgba(120,108,88,.28)';
        ctx.fillRect(0, y1 - 1, W, 1);
      }

      /* A MOSAIC BORDER COURSE, two rows down.

         Every paver on this deck is the same beige, and beige over a third
         of the picture is a lot of nothing — the joints alone were too
         quiet to read as perspective at 384 across. A real pool deck has a
         tiled border round it, and it earns its place twice: it is the one
         piece of saturated colour in the floor, and being a straight line
         across the converging joints it is what tells the eye the deck is
         lying down rather than standing up.

         It sits at row 1 rather than right on the lip, so the fighters'
         feet are on plain paving and the colour is behind them. */
      var by0 = FLOOR_Y + Math.pow(1 / rows, 1.55) * (H - FLOOR_Y);
      var by1 = FLOOR_Y + Math.pow(2 / rows, 1.55) * (H - FLOOR_Y);
      /* One dark base course, then ONE coloured face per tile inset by a
         pixel, so the base shows through as grout; the glazed top lip and
         the shaded bottom run the whole width in one rect each. Drawn the
         obvious way — three fillRects a tile over forty tiles — this cost a
         quarter of a millisecond on the stage that is already the heaviest
         of the six, for a highlight nobody could have pointed to. */
      ctx.fillStyle = '#0f5c8c';
      ctx.fillRect(0, by0, W, by1 - by0);
      K.repeatX(camX, 1, 9, function (x, i) {
        ctx.fillStyle = K.pick(i, 121, ['#2f7fb8', '#2f7fb8', '#59b6dc', '#0f5c8c', '#eae2cc']);
        ctx.fillRect(x, by0 + 1, 8, by1 - by0 - 2);
      });
      /* the glazed top lip. One pixel of near-white is the whole reason a
         tile reads as ceramic and not as a painted stripe. */
      ctx.fillStyle = 'rgba(255,255,255,.45)';
      ctx.fillRect(0, by0, W, 1);
      ctx.fillStyle = 'rgba(20,50,70,.4)';
      ctx.fillRect(0, by1 - 1, W, 1);
    },

    drawFore: function (ctx, camX, t) {
      /* --- LEFT FRAME: a parasol close enough that its top is off the
             picture, and the deck furniture under it. --- */
      K.layer(ctx, camX, 1.15, function () {
        var drift = camX * 0.05;
        var px2 = -34 - drift;
        K.mass(ctx, px2 + 44, -10, 7, H + 20, '#c9b48a', { top: 0, side: 3, foot: false });
        ['#e4574c', '#f4f0e4'].forEach(function (col, seg) {
          K.paint(ctx, function (c) {
            c.beginPath();
            c.moveTo(px2 + 47, -30);
            c.quadraticCurveTo(px2 + 150, 6, px2 + 176 - seg * 40, 54 - seg * 10);
            c.quadraticCurveTo(px2 + 110, 34, px2 + 47, 46 - seg * 8);
            c.closePath();
          }, col, { step: 3, shade: 0.34, edgeW: 1.4, edge: 'rgba(60,30,26,.5)' });
        });
        /* the cooler and the towel stack used to sit at the foot of this
           pole; the flamingo stands there now, so they are at the other
           corner where they still weight the bottom of the frame */
        var cx2 = W - 62 + drift * 0.4;
        K.mass(ctx, cx2, H - 30, 38, 22, '#3f8fc4', { top: 5, side: 6 });
        ctx.fillStyle = '#e8eef4';
        ctx.fillRect(cx2, H - 35, 38, 5);
        ctx.fillStyle = 'rgba(255,255,255,.4)';
        ctx.fillRect(cx2 + 4, H - 26, 30, 2);
        K.mass(ctx, cx2 + 44, H - 20, 24, 6, '#f2e0d2', { top: 2, side: 3 });
        K.mass(ctx, cx2 + 46, H - 26, 22, 6, '#e0b8c4', { top: 2, side: 3 });
      });

      /* --- LEFT FRAME: the inflatable flamingo, propped on the deck to dry.
             It is deliberately enormous — twice a fighter tall, its head
             alone bigger than one. Something the size of a car at the edge
             of frame is what makes the tower behind read as far away; a
             float bobbing in the pool at the correct scale did nothing.

             It is on the LEFT because the slide needs the whole right third:
             with both of them over there the flume came down through the
             middle of the fight to get past the bird. --- */
      K.layer(ctx, camX, 1.22, function () {
        var fx = 30 - camX * 0.055;
        /* A DUSTY ROSE, not a hot pink, and the reason is measurable. The
           flamingo is the biggest shape in the frame and at '#ff9dbb' it was
           also the brightest and the most saturated — brighter than the deck
           it stands on — so at 1x the eye went to the bird and not to the
           fighter standing in front of it. The reference's huge near objects
           are DARK: scale contrast is bought with size, never with value.
           This sits it below the deck's own tone, which is what a thing
           propped in the shade of that parasol would do anyway. Keep the
           size; it is only the value that was wrong. */
        var PINK = '#bd6a86';
        var PINK_SHADE = K.darker(PINK, 0.34);   /* the same tone K.paint's
           own crescent leaves, so the hard shadows below and the crescent
           read as one shadow side rather than as two different greys */

        /* shadow on the deck under it */
        ctx.fillStyle = 'rgba(70,60,52,.26)';
        ctx.beginPath(); ctx.ellipse(fx + 4, H - 6, 62, 12, 0, 0, Math.PI * 2); ctx.fill();

        /* body, running off the bottom of the frame */
        K.paint(ctx, function (c) {
          c.beginPath();
          c.moveTo(fx + 56, H + 12);
          c.bezierCurveTo(fx + 62, 168, fx + 26, 146, fx - 8, 150);
          c.bezierCurveTo(fx - 44, 154, fx - 62, 176, fx - 60, H + 12);
          c.closePath();
        }, PINK, { step: 9, shade: 0.34, hi: 0.24, edgeW: 1.6 });

        /* the tail, a stack of three inflated wedges */
        K.paint(ctx, function (c) {
          c.beginPath();
          c.moveTo(fx - 34, 168);
          c.quadraticCurveTo(fx - 78, 140, fx - 74, 178);
          c.quadraticCurveTo(fx - 58, 172, fx - 34, 168);
          c.closePath();
        }, K.lighter(PINK, 0.1), { step: 3, edgeW: 1.4 });

        /* neck and head. Drawn as one path so the contour runs unbroken —
           a neck and a head as two shapes gives you a join line across the
           throat that reads as a crack. */
        K.paint(ctx, function (c) {
          c.beginPath();
          /* up the back of the neck, over the crown, down the throat and
             back into the chest — one outline, so the contour never breaks */
          c.moveTo(fx + 6, 158);
          c.bezierCurveTo(fx - 12, 118, fx - 22, 88, fx - 4, 60);
          c.bezierCurveTo(fx + 6, 44, fx + 32, 44, fx + 38, 60);
          c.bezierCurveTo(fx + 42, 71, fx + 33, 79, fx + 24, 76);
          c.bezierCurveTo(fx + 10, 71, fx - 2, 92, fx + 4, 112);
          c.bezierCurveTo(fx + 10, 132, fx + 22, 142, fx + 20, 160);
          c.closePath();
        }, PINK, { step: 7, shade: 0.34, hi: 0.24, edgeW: 1.6 });

        /* the shadow the head and neck throw across the body. On a shape
           this big the one-step crescent K.paint leaves is not enough form —
           it needs a hard shadow EDGE somewhere, which is the whole
           difference between a sprite and a piece of vector art. */
        ctx.save();
        ctx.fillStyle = 'rgba(196,96,130,.5)';
        ctx.beginPath();
        ctx.moveTo(fx - 4, 152);
        ctx.bezierCurveTo(fx - 26, 168, fx - 44, 186, fx - 40, H);
        ctx.lineTo(fx - 68, H);
        ctx.bezierCurveTo(fx - 66, 178, fx - 40, 156, fx - 22, 150);
        ctx.closePath(); ctx.fill();
        ctx.restore();

        /* THE WING. The body below the neck was four thousand pixels of one
           pink with a single crescent on it — the largest flat area in the
           stage, and it read as coloured paper laid down. A wing is the one
           shape on a flamingo that carries a hard edge, and a hard edge is
           the difference this whole game is built on. The trailing edge is
           scalloped into four feather tips because a smooth oval is just a
           second flat shape sitting on the first.

           The tone is a long way off the body's, not a shade off it. The
           first pass lightened the pink by 0.16 and at 1x the wing simply
           was not there — on a shape this large the separation has to read
           from across the room or the whole exercise is a decoration
           nobody sees.

           No lit band on it (`band: false`). The wing is already a lighter
           plane than the body and the hard edge is doing the separating; the
           highlight pass on a shape this large was a second bright field
           rather than a rim, and it put the brightest pixels in the picture
           back on the bird. */
        K.paint(ctx, function (c) {
          c.beginPath();
          c.moveTo(fx + 44, 172);
          c.bezierCurveTo(fx + 22, 154, fx - 20, 158, fx - 38, 180);
          c.quadraticCurveTo(fx - 28, 190, fx - 18, 182);
          c.quadraticCurveTo(fx - 6, 196, fx + 4, 186);
          c.quadraticCurveTo(fx + 16, 200, fx + 26, 188);
          c.quadraticCurveTo(fx + 38, 192, fx + 44, 172);
          c.closePath();
        }, K.lighter(PINK, 0.32), { step: 5, shade: 0.26, band: false, edgeW: 1.8,
                                    edge: 'rgba(96,36,58,.85)' });
        /* the shadow it throws on the body below the feather tips — the
           wing has to sit ON something or it is a decal */
        ctx.save();
        ctx.fillStyle = 'rgba(190,88,124,.42)';
        ctx.beginPath();
        ctx.moveTo(fx - 38, 182);
        ctx.quadraticCurveTo(fx - 26, 196, fx - 16, 188);
        ctx.quadraticCurveTo(fx - 4, 202, fx + 6, 192);
        ctx.quadraticCurveTo(fx + 18, 206, fx + 28, 194);
        ctx.lineTo(fx + 30, 202);
        ctx.quadraticCurveTo(fx - 6, 214, fx - 40, 192);
        ctx.closePath(); ctx.fill();
        ctx.restore();

        /* the beak, black-tipped, pointing down into the fight */
        K.paint(ctx, function (c) {
          c.beginPath();
          c.moveTo(fx + 36, 52);
          c.lineTo(fx + 66, 72);
          c.lineTo(fx + 34, 68);
          c.closePath();
        }, '#f2d0a8', { step: 2, edgeW: 1.4 });
        ctx.fillStyle = '#3a3038';
        ctx.beginPath();
        ctx.moveTo(fx + 54, 64); ctx.lineTo(fx + 66, 72); ctx.lineTo(fx + 52, 69);
        ctx.closePath(); ctx.fill();

        /* eye — an almond with a slit, not a circle with a dot. A round
           white disc with a black dot is a cartoon eye on the largest
           landmark in the stage; every fighter on the roster earned an
           almond and a slit pupil for exactly this reason and the flamingo
           had not. */
        ctx.save();
        ctx.translate(fx + 27, 57);
        ctx.rotate(-0.18);
        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.quadraticCurveTo(-2, -3.4, 5, -0.6);
        ctx.quadraticCurveTo(2, 3.2, -5, 0);
        ctx.closePath();
        ctx.fillStyle = '#f4ead6'; ctx.fill();
        ctx.beginPath();
        ctx.ellipse(1.4, -0.1, 1.7, 3.0, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#241c22'; ctx.fill();
        ctx.restore();

        /* the seams and the valve — what makes it read as inflatable rather
           than as a pink bird */
        ctx.strokeStyle = 'rgba(190,90,124,.55)'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(fx + 40, 176); ctx.quadraticCurveTo(fx - 6, 162, fx - 52, 182);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fx + 12, 150); ctx.quadraticCurveTo(fx - 8, 118, fx + 4, 84);
        ctx.stroke();
        ctx.fillStyle = '#e07a9c';
        ctx.beginPath(); ctx.ellipse(fx - 30, 176, 5, 3.4, 0.3, 0, Math.PI * 2); ctx.fill();
      });

      /* pool coping tiles running across the very front */
      K.layer(ctx, camX, 1.35, function () {
        K.repeatX(camX, 0, 26, function (x, i) {
          ctx.fillStyle = Math.abs(i) % 2 ? 'rgba(226,216,196,.95)' : 'rgba(210,198,176,.95)';
          ctx.fillRect(x, H - 13, 26, 13);
        });
        ctx.fillStyle = 'rgba(120,110,92,.5)';
        ctx.fillRect(0, H - 14, W, 1.5);
      });
      K.vignette(ctx, 0.22);
    }
  };
})();
