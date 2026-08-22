/* =======================================================================
   2 — THE POOL DECK
   Hot, blue, and somebody is asleep on the flamingo.

   The shape of the picture, decided 22 Aug 2026 and worth stating because
   every element below is placed to serve it:

     - the RIGHT THIRD is the landmark: a slide tower running off the top of
       the frame, with a cat down it every four seconds and a splash.
     - the LEFT EDGE is the frame: a parasol canopy too close to see the top
       of, and under it a cooler and a lifeguard chair.
     - the BOTTOM RIGHT is the discovery: an inflatable flamingo the size of
       a car, propped on the deck to dry, looking down at the fight.
     - between them, far off and small, the pool with the crowd round it.

   Something enormous at each edge framing something small and far away is
   the whole trick; a repeating strip of parasols is not a place.
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
    [[ 62, -26], [116,  24], [-44,  40], [ 26,  76]],
    [[ 26,  76], [ 74, 100], [-14, 112], [-58, 148]]
  ];

  function bez1(a, b, c, d, k) {
    var m = 1 - k;
    return m*m*m*a + 3*m*m*k*b + 3*m*k*k*c + k*k*k*d;
  }

  /* Position along the whole chain, 0..1, plus the tangent so a wall can be
     offset square to it. */
  function flumeAt(u, tx) {
    var n = FLUME.length;
    var i = Math.min(n - 1, Math.floor(u * n));
    var k = u * n - i, s = FLUME[i];
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
  function flumeRibbon(tx, w0, w1) {
    return function (ctx) {
      var i, p, w, N = 26;
      ctx.beginPath();
      for (i = 0; i <= N; i++) {
        p = flumeAt(i / N, tx); w = (w0 + (w1 - w0) * (i / N)) / 2;
        ctx[i ? 'lineTo' : 'moveTo'](p.x + p.nx * w, p.y + p.ny * w);
      }
      for (i = N; i >= 0; i--) {
        p = flumeAt(i / N, tx); w = (w0 + (w1 - w0) * (i / N)) / 2;
        ctx.lineTo(p.x - p.nx * w, p.y - p.ny * w);
      }
      ctx.closePath();
    };
  }

  /* A stroke that follows the centreline, offset square to it. Used for the
     dark trough, the sheet of water in it, and the near wall that crosses in
     front of the rider so he sits IN the tube rather than on top of it. */
  function flumeStroke(ctx, tx, off, width, style) {
    ctx.strokeStyle = style; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i <= 24; i++) {
      var p = flumeAt(i / 24, tx);
      ctx[i ? 'lineTo' : 'moveTo'](p.x + p.nx * off, p.y + p.ny * off);
    }
    ctx.stroke();
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
      K.glow(ctx, 96, 30, 58, 'rgba(255,246,190,.9)', 0.5);
      ctx.fillStyle = '#fff8d0';
      ctx.beginPath(); ctx.arc(96, 30, 16, 0, Math.PI * 2); ctx.fill();

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

      /* =================================================================
         THE LANDMARK — the slide tower, right third, top of frame to pool.
         ================================================================= */
      K.layer(ctx, camX, 0.30, function () {
        var tx = K.at(camX, 0, 286) - camX * 0.03;   /* a hair of drift, so it
                                                        is not glued to the glass */

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
        ctx.strokeStyle = '#8d98a2'; ctx.lineWidth = 2;
        for (var br = 0; br < 5; br++) {
          var by = 26 + br * 34;
          ctx.beginPath();
          ctx.moveTo(tx + 2, by); ctx.lineTo(tx + 52, by + 22);
          ctx.moveTo(tx + 52, by); ctx.lineTo(tx + 2, by + 22);
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
        K.mass(ctx, tx - 6, 6, 92, 8, '#d8b45c', { top: 4, side: 5 });
        ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx + 30, 2); ctx.lineTo(tx + 30, -18);
        ctx.moveTo(tx + 84, 2); ctx.lineTo(tx + 84, -18);
        ctx.moveTo(tx + 30, -16); ctx.lineTo(tx + 84, -16); ctx.stroke();
        K.spectator(ctx, tx + 46, 4, 0.72, 311, t, mood);
        K.spectator(ctx, tx + 70, 4, 0.66, 512, t + 40, mood);

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
          K.paint(ctx, function (c) {
            c.beginPath();
            c.moveTo(-16, -21);
            c.quadraticCurveTo(0, -31, 16, -21);
            c.quadraticCurveTo(0, -17, -16, -21);
            c.closePath();
          }, col, { step: 1.6, edgeW: 1 });
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
      /* the crowd at the far rail, watching the fight rather than the pool */
      K.crowdRow(ctx, camX, 0.34, 27, 132, t, mood,
                 { seed: 140, gap: 0.34, min: 0.52, max: 0.74 });

      /* --- the pool. It reaches from the far rail almost to the fighters'
             feet, so the fight happens on the lip of it. --- */
      K.water(ctx, 0, 136, W, 32, t, '#1d76b0', '#63c3e9', 'rgba(255,255,255,.6)');
      /* the wobbling reflection of the tower, on the water under it */
      K.layer(ctx, camX, 0.30, function () {
        var rx3 = K.at(camX, 0, 286) - camX * 0.03;
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
          if (kind === 0) {                     /* a flamingo ring */
            K.paint(ctx, function (c) {
              c.beginPath(); c.ellipse(x, fy, 14, 5, 0, 0, Math.PI * 2);
            }, '#ff8fb0', { step: 1.6, edgeW: 1 });
            ctx.strokeStyle = '#ff8fb0'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 10, fy - 2);
            ctx.quadraticCurveTo(x - 16, fy - 13, x - 8, fy - 15);
            ctx.stroke();
          } else if (kind === 1) {              /* a lilo with somebody asleep */
            K.paint(ctx, function (c) {
              c.beginPath(); c.ellipse(x, fy, 16, 4.4, 0, 0, Math.PI * 2);
            }, '#4ad0c0', { step: 1.6, edgeW: 1 });
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
        /* a cooler and a stack of towels at the foot of it */
        K.mass(ctx, px2 + 16, H - 34, 34, 20, '#3f8fc4', { top: 4, side: 5 });
        ctx.fillStyle = '#e8eef4';
        ctx.fillRect(px2 + 16, H - 38, 34, 4);
        K.mass(ctx, px2 + 56, H - 24, 22, 5, '#f2e0d2', { top: 2, side: 3 });
        K.mass(ctx, px2 + 58, H - 29, 20, 5, '#e0b8c4', { top: 2, side: 3 });
      });

      /* --- RIGHT FRAME: the inflatable flamingo, propped on the deck to dry.
             It is deliberately enormous — its head alone is bigger than a
             fighter's. Something the size of a car at the edge of frame is
             what makes the tower behind read as far away; a float bobbing in
             the pool at the correct scale did nothing at all. --- */
      K.layer(ctx, camX, 1.22, function () {
        var fx = W - 22 - camX * 0.055;
        var PINK = '#ff9dbb';

        /* shadow on the deck under it */
        ctx.fillStyle = 'rgba(70,60,52,.26)';
        ctx.beginPath(); ctx.ellipse(fx - 4, H - 6, 62, 12, 0, 0, Math.PI * 2); ctx.fill();

        /* body, running off the bottom of the frame */
        K.paint(ctx, function (c) {
          c.beginPath();
          c.moveTo(fx - 56, H + 12);
          c.bezierCurveTo(fx - 62, 168, fx - 26, 146, fx + 8, 150);
          c.bezierCurveTo(fx + 44, 154, fx + 62, 176, fx + 60, H + 12);
          c.closePath();
        }, PINK, { step: 4, shade: 0.34, hi: 0.24, edgeW: 1.6 });

        /* the tail, a stack of three inflated wedges */
        K.paint(ctx, function (c) {
          c.beginPath();
          c.moveTo(fx + 34, 168);
          c.quadraticCurveTo(fx + 78, 140, fx + 74, 178);
          c.quadraticCurveTo(fx + 58, 172, fx + 34, 168);
          c.closePath();
        }, K.lighter(PINK, 0.1), { step: 3, edgeW: 1.4 });

        /* neck and head. Drawn as one path so the contour runs unbroken —
           a neck and a head as two shapes gives you a join line across the
           throat that reads as a crack. */
        K.paint(ctx, function (c) {
          c.beginPath();
          c.moveTo(fx - 18, 156);
          c.bezierCurveTo(fx - 4, 116, fx + 20, 96, fx + 4, 62);
          c.bezierCurveTo(fx - 4, 44, fx - 30, 42, fx - 40, 56);
          c.bezierCurveTo(fx - 48, 68, fx - 40, 78, fx - 28, 76);
          c.bezierCurveTo(fx - 14, 74, fx - 4, 88, fx - 2, 104);
          c.bezierCurveTo(fx - 2, 124, fx - 12, 140, fx + 2, 158);
          c.closePath();
        }, PINK, { step: 4, shade: 0.34, hi: 0.24, edgeW: 1.6 });

        /* the beak, black-tipped, pointing down into the fight */
        K.paint(ctx, function (c) {
          c.beginPath();
          c.moveTo(fx - 38, 52);
          c.lineTo(fx - 74, 70);
          c.lineTo(fx - 36, 68);
          c.closePath();
        }, '#f2d0a8', { step: 2, edgeW: 1.4 });
        ctx.fillStyle = '#3a3038';
        ctx.beginPath();
        ctx.moveTo(fx - 60, 62); ctx.lineTo(fx - 74, 70); ctx.lineTo(fx - 58, 68);
        ctx.closePath(); ctx.fill();

        /* eye */
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(fx - 30, 56, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#241c22';
        ctx.beginPath(); ctx.arc(fx - 31, 57, 2.4, 0, Math.PI * 2); ctx.fill();

        /* the seams and the valve — what makes it read as inflatable rather
           than as a pink bird */
        ctx.strokeStyle = 'rgba(190,90,124,.55)'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(fx - 40, 176); ctx.quadraticCurveTo(fx + 6, 162, fx + 52, 182);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(fx - 14, 150); ctx.quadraticCurveTo(fx + 4, 120, fx - 6, 86);
        ctx.stroke();
        ctx.fillStyle = '#e07a9c';
        ctx.beginPath(); ctx.ellipse(fx + 30, 176, 5, 3.4, 0.3, 0, Math.PI * 2); ctx.fill();
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
