/* =======================================================================
   2 — THE POOL DECK
   Bright, blue, and hot. Cats on loungers, one asleep on a lilo.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

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
      K.glow(ctx, 300, 34, 60, 'rgba(255,246,190,.9)', 0.5);
      ctx.fillStyle = '#fff8d0';
      ctx.beginPath(); ctx.arc(300, 34, 17, 0, Math.PI * 2); ctx.fill();

      /* --- hills, then the vineyard rows climbing them --- */
      K.hills(ctx, camX, 0.12, '#6ea84e', 128, 22, 3);
      K.hills(ctx, camX, 0.2, '#5b9142', 138, 15, 9);
      K.layer(ctx, camX, 0.2, function () {
        ctx.strokeStyle = 'rgba(40,70,30,.35)'; ctx.lineWidth = 1.2;
        K.repeatX(camX, 0, 21, function (x, i) {
          ctx.beginPath();
          ctx.moveTo(x, 128 + K.vary(i, 77, 2, 8));
          ctx.lineTo(x - 9, 150);
          ctx.stroke();
        });
      });

      /* --- THE LANDMARK: a water slide, and not a small one. It starts off
             the top of the picture, turns through most of the frame on its
             scaffold, and dumps into the pool — with a cat coming down it
             every few seconds and a splash where they land. It was a nine
             pixel line before; something huge with something happening on it
             is what the reference does and what this needed. --- */
      K.layer(ctx, camX, 0.3, function () {
        var sx = K.at(camX, 0, 78);

        /* the scaffold it stands on */
        ctx.strokeStyle = '#9aa4b0'; ctx.lineWidth = 2.6;
        [[-34, -6], [10, 30]].forEach(function (leg) {
          ctx.beginPath();
          ctx.moveTo(sx + leg[0], 30); ctx.lineTo(sx + leg[1], 158);
          ctx.stroke();
        });
        ctx.lineWidth = 1.6;
        for (var br = 0; br < 5; br++) {
          var by = 44 + br * 24;
          var k = (by - 30) / 128;
          ctx.beginPath();
          ctx.moveTo(sx - 34 + k * 28, by); ctx.lineTo(sx + 10 + k * 20, by);
          ctx.stroke();
        }

        /* the flume: a fat outer wall, a dark trough, and a lit inner edge */
        function flume(w, style) {
          ctx.strokeStyle = style; ctx.lineWidth = w; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(sx - 40, -12);
          ctx.bezierCurveTo(sx + 26, 30, sx - 44, 62, sx - 16, 96);
          ctx.bezierCurveTo(sx + 4, 120, sx + 30, 132, sx + 16, 156);
          ctx.stroke();
        }
        flume(20, '#1f6f96');
        flume(15, '#2fa3cf');
        flume(7, 'rgba(180,240,255,.85)');

        /* somebody coming down it, once every four seconds or so */
        var ride = (t % 260) / 260;
        if (ride < 0.62) {
          var u = ride / 0.62;
          /* the same bezier, sampled — one curve, so the rider cannot drift
             off the slide when the slide is redrawn */
          function bez(p0, p1, p2, p3, k2) {
            var m = 1 - k2;
            return m*m*m*p0 + 3*m*m*k2*p1 + 3*m*k2*k2*p2 + k2*k2*k2*p3;
          }
          var rx, ry;
          if (u < 0.5) {
            var k3 = u / 0.5;
            rx = bez(sx - 40, sx + 26, sx - 44, sx - 16, k3);
            ry = bez(-12, 30, 62, 96, k3);
          } else {
            var k4 = (u - 0.5) / 0.5;
            rx = bez(sx - 16, sx + 4, sx + 30, sx + 16, k4);
            ry = bez(96, 120, 132, 156, k4);
          }
          ctx.fillStyle = 'rgba(255,255,255,.75)';
          ctx.beginPath(); ctx.ellipse(rx, ry + 4, 9, 3.4, 0, 0, Math.PI * 2); ctx.fill();
          K.spectator(ctx, rx, ry + 5, 0.62, 909, t * 3, 1);
        } else if (ride < 0.72) {
          /* the splash at the bottom */
          var sp = (ride - 0.62) / 0.10;
          ctx.fillStyle = 'rgba(255,255,255,' + (0.8 * (1 - sp)).toFixed(2) + ')';
          for (var d2 = 0; d2 < 7; d2++) {
            var a2 = -0.4 - d2 * 0.34, r2 = 6 + sp * 26;
            ctx.beginPath();
            ctx.arc(sx + 18 + Math.cos(a2) * r2, 158 + Math.sin(a2) * r2 * 0.8,
                    3.2 * (1 - sp) + 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        /* the lifeguard, watching nothing in particular */
        var lx = K.at(camX, 0, 322);
        ctx.strokeStyle = '#d9c08a'; ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(lx - 9, 158); ctx.lineTo(lx - 6, 128);
        ctx.moveTo(lx + 9, 158); ctx.lineTo(lx + 6, 128); ctx.stroke();
        ctx.fillStyle = '#e8d3a0';
        ctx.fillRect(lx - 11, 120, 22, 9);
        ctx.fillStyle = '#c94f4f';
        ctx.fillRect(lx - 11, 114, 22, 4);
        K.spectator(ctx, lx, 120, 0.9, 404, t, mood);
      });

      /* --- parasols, each a different colour and lean --- */
      K.layer(ctx, camX, 0.36, function () {
        K.repeatX(camX, 0, 96, function (x, i) {
          if (K.chance(i, 78, 0.25)) return;
          var top = K.vary(i, 79, 118, 130), lean = K.vary(i, 80, -0.12, 0.12);
          ctx.save();
          ctx.translate(x, top + 34);
          ctx.rotate(lean);
          ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -34); ctx.stroke();
          ctx.fillStyle = K.pick(i, 81, ['#e4574c', '#f0b429', '#4aa8c9', '#e07ab0', '#5bbd7a']);
          ctx.beginPath();
          ctx.moveTo(-22, -32);
          ctx.quadraticCurveTo(0, -44, 22, -32);
          ctx.quadraticCurveTo(0, -27, -22, -32);
          ctx.closePath(); ctx.fill();
          ctx.restore();
          /* a lounger under about half of them */
          if (K.chance(i, 82, 0.55)) {
            ctx.fillStyle = K.pick(i, 83, ['#f2ede0', '#dfe8ef', '#f5dcc8']);
            ctx.save();
            ctx.translate(x + K.vary(i, 84, -16, 16), top + 34);
            ctx.rotate(-0.12);
            ctx.fillRect(-15, -5, 30, 5);
            ctx.restore();
            K.spectator(ctx, x + K.vary(i, 85, -14, 14), top + 32,
                        K.vary(i, 86, 0.7, 0.95), Math.abs(i * 13), t + i * 27, mood);
          }
        });
      });

      /* --- the pool itself, with floats on it --- */
      /* The pool was a thin strip up at the back and the deck was a blank
         band. It comes forward to meet the floor now, and the tiled lip of it
         sits right behind the fighters. */
      K.water(ctx, 0, 138, W, 34, t, '#15619a', '#3d9fd6', 'rgba(255,255,255,.55)');
      ctx.fillStyle = '#cfe3ea';
      ctx.fillRect(0, 168, W, 5);
      K.layer(ctx, camX, 0.55, function () {
        K.repeatX(camX, 0, 22, function (x, i) {
          ctx.fillStyle = i % 2 ? 'rgba(120,170,190,.5)' : 'rgba(255,255,255,.5)';
          ctx.fillRect(x, 168, 11, 5);
        });
        /* a diving board over the deep end */
        var dx = K.at(camX, 0, 330);
        ctx.fillStyle = '#8a949c';
        ctx.fillRect(dx - 4, 150, 8, 22);
        ctx.fillStyle = '#e8ecef';
        ctx.fillRect(dx - 30, 144, 54, 6);
        ctx.fillStyle = '#c9d2d8';
        ctx.fillRect(dx - 30, 150, 54, 2);
      });
      K.layer(ctx, camX, 0.5, function () {
        K.repeatX(camX, 0, 110, function (x, i) {
          var fy = 156 + Math.sin(t * 0.03 + i) * 1.6;
          var kind = Math.floor(K.hash(i, 87) * 3);
          if (kind === 0) {                     /* a flamingo ring */
            ctx.fillStyle = '#ff8fb0';
            ctx.beginPath(); ctx.ellipse(x, fy, 15, 5.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ffb8cd';
            ctx.beginPath(); ctx.ellipse(x, fy, 7, 2.4, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#ff8fb0'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 11, fy - 2);
            ctx.quadraticCurveTo(x - 17, fy - 14, x - 9, fy - 16);
            ctx.stroke();
          } else if (kind === 1) {              /* a lilo with somebody asleep */
            ctx.fillStyle = '#4ad0c0';
            ctx.beginPath(); ctx.ellipse(x, fy, 17, 4.6, 0, 0, Math.PI * 2); ctx.fill();
            K.spectator(ctx, x, fy - 2, 0.62, Math.abs(i * 5), t * 0.2, null);
          } else {                              /* a beach ball */
            ctx.fillStyle = '#f5f0e4';
            ctx.beginPath(); ctx.arc(x, fy - 3, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#e4574c';
            ctx.beginPath(); ctx.moveTo(x, fy - 9); ctx.arc(x, fy - 3, 6, -Math.PI / 2, 0); ctx.fill();
          }
        });
      });

      /* --- the deck --- */
      /* --- the frame: a diving tower close enough to lose the top of, and a
             parasol that fills the other corner --- */
      K.layer(ctx, camX, 0.88, function () {
        var d = camX * 0.05;
        var tx = -12 - d;
        ctx.fillStyle = '#d8dde2';
        ctx.fillRect(tx, -10, 30, H + 20);
        ctx.fillStyle = '#b6bfc6';
        ctx.fillRect(tx + 30, -10, 8, H + 20);
        ctx.fillStyle = '#8fa0ab';
        for (var q = 0; q < 5; q++) ctx.fillRect(tx, 20 + q * 40, 30, 5);
        ctx.fillStyle = '#e8ecef';
        ctx.fillRect(tx + 4, 44, 62, 8);
        ctx.fillStyle = '#c2ccd3';
        ctx.fillRect(tx + 4, 52, 62, 3);
        ctx.strokeStyle = '#8fa0ab'; ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(tx + 62, 44); ctx.lineTo(tx + 62, 8);
        ctx.moveTo(tx + 38, 44); ctx.lineTo(tx + 38, 8); ctx.stroke();

        /* the parasol is on screen, so it reads as a parasol rather than a
           red ribbon across the sky */
        var px = W - 18 + d;
        ctx.strokeStyle = '#c9b48a'; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(px + 6, H + 10); ctx.lineTo(px - 2, 34); ctx.stroke();
        ctx.fillStyle = '#e4574c';
        ctx.beginPath();
        ctx.moveTo(px + 62, 56);
        ctx.quadraticCurveTo(px - 2, 4, px - 66, 56);
        ctx.quadraticCurveTo(px - 2, 38, px + 62, 56);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.18)';
        ctx.beginPath();
        ctx.moveTo(px + 62, 56);
        ctx.quadraticCurveTo(px - 2, 38, px - 66, 56);
        ctx.lineTo(px - 62, 62);
        ctx.quadraticCurveTo(px - 2, 46, px + 58, 62);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1.4;
        for (var pq = -2; pq <= 2; pq++) {
          ctx.beginPath();
          ctx.moveTo(px - 2, 12);
          ctx.lineTo(px - 2 + pq * 30, 54);
          ctx.stroke();
        }
      });

      K.ground(ctx, camX, '#d8cdb4', '#efe6d2', 0.09);
      /* towels and puddles on the hot deck */
      K.layer(ctx, camX, 1, function () {
        K.repeatX(camX, 0, 96, function (x, i) {
          if (K.chance(i, 88, 0.35)) return;
          ctx.save();
          ctx.translate(x, FLOOR_Y + K.vary(i, 89, 12, 40));
          ctx.rotate(K.vary(i, 90, -0.3, 0.3));
          ctx.fillStyle = K.pick(i, 91, ['#e4574c', '#f0b429', '#4aa8c9', '#e07ab0']);
          ctx.fillRect(-17, -5, 34, 10);
          ctx.fillStyle = 'rgba(255,255,255,.32)';
          ctx.fillRect(-17, -5, 34, 2.4);
          ctx.restore();
        });
        K.repeatX(camX, 0, 74, function (x, i) {
          ctx.fillStyle = 'rgba(140,190,215,.3)';
          ctx.beginPath();
          ctx.ellipse(x + K.vary(i, 92, -20, 20), FLOOR_Y + K.vary(i, 93, 8, 44),
                      K.vary(i, 94, 6, 16), K.vary(i, 95, 2, 5), 0, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      K.floorPool(ctx, W * 0.5, 200, 'rgba(255,246,214,.65)', 0.3);
      K.litter(ctx, camX, 1, 70, ['rgba(120,150,170,.35)', 'rgba(255,255,255,.4)'], 0.8, 2.2);
      this.sparkle.update();
      this.sparkle.draw(ctx, camX, t);
      this.heat.update();
      this.heat.draw(ctx, camX, t);
    },
    drawFore: function (ctx, camX, t) {
      /* --- the frame: one enormous parasol at the left edge and a lounger
             under it, close enough that they dwarf the fighters. The sky was
             a big flat field of blue with nothing to measure it against. --- */
      K.layer(ctx, camX, 1.15, function () {
        var drift = camX * 0.05;
        var px2 = -34 - drift;
        /* the pole */
        K.mass(ctx, px2 + 44, -10, 7, H + 20, '#c9b48a', { top: 0, side: 3, foot: false });
        /* the canopy, filling the top-left corner */
        ['#e4574c', '#f4f0e4'].forEach(function (col, seg) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(px2 + 47, -30);
          ctx.quadraticCurveTo(px2 + 150, 6, px2 + 176 - seg * 40, 54 - seg * 10);
          ctx.quadraticCurveTo(px2 + 110, 34, px2 + 47, 46 - seg * 8);
          ctx.closePath();
          ctx.fillStyle = col;
          ctx.fill();
          ctx.strokeStyle = 'rgba(60,30,26,.45)'; ctx.lineWidth = 1.4; ctx.stroke();
          ctx.restore();
        });
        ctx.fillStyle = 'rgba(0,0,0,.16)';
        ctx.beginPath();
        ctx.moveTo(px2 + 47, 40); ctx.quadraticCurveTo(px2 + 110, 30, px2 + 150, 44);
        ctx.lineTo(px2 + 150, 50); ctx.quadraticCurveTo(px2 + 110, 38, px2 + 47, 48);
        ctx.closePath(); ctx.fill();
        /* a cooler and a stack of towels at the foot of it, on the deck */
        K.mass(ctx, px2 + 16, H - 34, 34, 20, '#3f8fc4', { top: 4, side: 5 });
        ctx.fillStyle = '#e8eef4';
        ctx.fillRect(px2 + 16, H - 38, 34, 4);
        K.mass(ctx, px2 + 56, H - 24, 22, 5, '#f2e0d2', { top: 2, side: 3 });
        K.mass(ctx, px2 + 58, H - 29, 20, 5, '#e0b8c4', { top: 2, side: 3 });
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
