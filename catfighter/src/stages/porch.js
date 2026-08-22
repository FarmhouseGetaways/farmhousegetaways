/* =======================================================================
   6 — THE FRONT PORCH
   Sunset into dusk. A windmill turning, moths at the lantern.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  CF.StageDefs = CF.StageDefs || {};
  CF.StageDefs.porch = {
    id: 'porch', name: 'THE FRONT PORCH',
    blurb: 'Sunset, a windmill turning, and moths around the lantern.',
    /* the colour of the air here — see K.deepen */
    air: { air: '#9c7099', haze: 0.24, floorDark: 0.28, horizon: 122 },
    init: function () {
      this.moths = new P({ count: 12, kind: 'moth', depth: 0.95, seed: 66,
                           band: [26, 96], vx: 0.06, vy: 0.02,
                           size: 1.6, color: 'rgba(240,232,200,.9)', wobble: 3.2 });
      this.fluff = new P({ count: 20, kind: 'dust', depth: 0.55, seed: 67,
                           band: [40, FLOOR_Y], vx: 0.16, vy: -0.02,
                           size: 1.7, color: 'rgba(255,240,214,.9)', wobble: 2.2 });
    },
    drawBack: function (ctx, camX, t, mood) {
      K.sky(ctx, [[0, '#2b2350'], [0.45, '#7a4a70'], [0.75, '#d4795e'], [1, '#f0a860']], 0, 150);
      K.layer(ctx, camX, 0.03, function () {
        K.repeatX(camX, 0, 17, function (x, i) {
          if (!K.chance(i, 140, 0.5)) return;
          var sy = K.vary(i, 141, 4, 74);
          ctx.fillStyle = 'rgba(255,248,230,' + K.vary(i, 142, 0.2, 0.7).toFixed(2) + ')';
          ctx.fillRect(x, sy, 1.2, 1.2);
        });
      });

      K.ridge(ctx, camX, 0.07, '#4a3a5e', 132, 30, 7);
      K.ridge(ctx, camX, 0.13, '#3a2c4a', 146, 20, 21);

      /* --- THE LANDMARK: the windmill. It was eleven pixels across on the
             far ridge and you could not tell what it was. It is now most of
             the height of the picture, close enough that the sun goes down
             behind it, with the tank on its platform and a pair of birds
             sitting on the crosspiece. --- */
      K.layer(ctx, camX, 0.13, function () {
        var mx = K.at(camX, 0, 306) - camX * 0.03;
        var base = 158, topY = 46;

        /* the tower: four legs in perspective, braced */
        function leg(x0, x1) {
          ctx.beginPath();
          ctx.moveTo(mx + x0, base); ctx.lineTo(mx + x1, topY + 10);
          ctx.stroke();
        }
        ctx.strokeStyle = '#241b34'; ctx.lineWidth = 2.6;
        leg(-26, -6); leg(26, 6);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = '#2e2440';
        leg(-17, -4); leg(17, 4);
        /* the cross bracing, narrowing as it goes up */
        ctx.lineWidth = 1.4;
        for (var bnd = 0; bnd < 5; bnd++) {
          var k5 = bnd / 5, k6 = (bnd + 1) / 5;
          var y0 = base + (topY + 10 - base) * k5, y1 = base + (topY + 10 - base) * k6;
          var w0 = 26 - 20 * k5, w1 = 26 - 20 * k6;
          ctx.beginPath();
          ctx.moveTo(mx - w0, y0); ctx.lineTo(mx + w1, y1);
          ctx.moveTo(mx + w0, y0); ctx.lineTo(mx - w1, y1);
          ctx.moveTo(mx - w1, y1); ctx.lineTo(mx + w1, y1);
          ctx.stroke();
        }

        /* the platform and the tank on it */
        ctx.fillStyle = '#2a2138';
        ctx.fillRect(mx - 14, topY + 6, 28, 3);
        K.mass(ctx, mx - 11, topY - 14, 22, 20, '#4a3d5e', { top: 3, side: 5, foot: false });

        /* the head, the tail vane, and the wheel */
        ctx.save();
        ctx.translate(mx, topY - 18);
        ctx.fillStyle = '#332845';
        ctx.fillRect(-5, -4, 10, 8);
        /* the tail vane, off to one side */
        ctx.fillStyle = '#3d3050';
        ctx.beginPath();
        ctx.moveTo(4, -2); ctx.lineTo(30, -9); ctx.lineTo(30, 7); ctx.lineTo(4, 2);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,190,140,.30)'; ctx.lineWidth = 1;
        ctx.stroke();
        /* the wheel: a rim, a hub and eighteen blades */
        ctx.rotate(t * 0.014);
        ctx.strokeStyle = '#241b34'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.stroke();
        for (var q = 0; q < 18; q++) {
          ctx.rotate(Math.PI * 2 / 18);
          ctx.fillStyle = q % 2 ? '#3d3050' : '#332845';
          ctx.beginPath();
          ctx.moveTo(6, -1.6); ctx.lineTo(25, -3.4); ctx.lineTo(25, 2.6); ctx.lineTo(6, 1.6);
          ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = '#241b34';
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        /* two birds on the brace, one of them shuffling along */
        var shuffle = Math.sin(t * 0.008) * 4;
        ctx.fillStyle = '#241b34';
        [[-9, 0], [7, shuffle]].forEach(function (bd) {
          ctx.beginPath();
          ctx.ellipse(mx + bd[0] + bd[1], topY + 3, 3, 2.2, -0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(mx + bd[0] + bd[1] + 2.4, topY + 0.6, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      /* --- the house wall the porch belongs to, with a lit window --- */
      K.layer(ctx, camX, 0.34, function () {
        var hx = K.at(camX, 0, 96);
        ctx.fillStyle = '#3b3050';
        ctx.fillRect(hx - 78, 40, 120, FLOOR_Y - 40);
        K.repeatX(camX, 0, 13, function (x) {
          ctx.fillStyle = 'rgba(0,0,0,.10)';
          if (x > hx - 78 && x < hx + 42) ctx.fillRect(x, 40, 6, FLOOR_Y - 40);
        });
        /* the door, standing open a crack */
        ctx.fillStyle = '#2a2138';
        ctx.fillRect(hx - 20, 92, 34, FLOOR_Y - 92);
        ctx.fillStyle = 'rgba(255,206,130,.85)';
        ctx.fillRect(hx + 8, 92, 6, FLOOR_Y - 92);
        K.spill(ctx, hx + 6, FLOOR_Y, 12, H - FLOOR_Y + 10, 'rgba(255,206,130,.7)', 0.3);
        /* the window, warm, with somebody at it */
        ctx.fillStyle = '#4a3a2a';
        ctx.fillRect(hx - 68, 62, 40, 34);
        ctx.fillStyle = 'rgba(255,214,146,.9)';
        ctx.fillRect(hx - 65, 65, 34, 28);
        ctx.fillStyle = 'rgba(60,40,30,.7)';
        ctx.fillRect(hx - 49, 65, 2.4, 28);
        ctx.fillRect(hx - 65, 77.5, 34, 2.4);
        K.spectator(ctx, hx - 56, 93, 0.62, 909, t * 0.3, null);
        K.glow(ctx, hx - 48, 79, 40, 'rgba(255,206,130,.8)', 0.2);
      });

      /* --- porch rail and posts, weathered differently --- */
      K.layer(ctx, camX, 0.62, function () {
        ctx.fillStyle = '#6b5a44';
        ctx.fillRect(-20, 150, W + 40, 5);
        ctx.fillRect(-20, 166, W + 40, 4);
        K.repeatX(camX, 0, 26, function (x, i) {
          ctx.fillStyle = K.pick(i, 143, ['#7a6650', '#6b5a44', '#8a7259']);
          ctx.fillRect(x, 152, 3.4, 16);
        });
        K.repeatX(camX, 0, 118, function (x, i) {
          ctx.fillStyle = '#5c4c3a';
          ctx.fillRect(x, 30, 9, 140);
          ctx.fillStyle = 'rgba(255,255,255,.06)';
          ctx.fillRect(x, 30, 2.4, 140);
          /* a hanging fern or a lantern off each post, alternating */
          if (K.chance(i, 144, 0.5)) {
            var lsw = K.sway(t, 0.014, 2.2, i);
            ctx.strokeStyle = '#3a3128'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + 4, 34); ctx.lineTo(x + 4 + lsw, 48); ctx.stroke();
            ctx.fillStyle = '#caa25c';
            ctx.fillRect(x + lsw, 48, 9, 13);
            var pulse = 0.65 + 0.35 * Math.sin(t * 0.06 + i);
            K.glow(ctx, x + 4.5 + lsw, 54, 22, 'rgba(255,196,110,.9)', 0.3 * pulse);
          } else {
            var fsw = K.sway(t, 0.011, 2.6, i);
            ctx.fillStyle = '#4d7a3a';
            for (var fr = 0; fr < 7; fr++) {
              ctx.save();
              ctx.translate(x + 4 + fsw, 40);
              ctx.rotate(-0.9 + fr * 0.3);
              ctx.beginPath();
              ctx.ellipse(0, 13, 3, 13, 0, 0, Math.PI * 2); ctx.fill();
              ctx.restore();
            }
          }
        });
      });

      /* --- the rocking chair, still going --- */
      K.layer(ctx, camX, 0.8, function () {
        var cx3 = K.at(camX, 0, 250);
        var rock = Math.sin(t * 0.028) * 0.08;
        ctx.save();
        ctx.translate(cx3, FLOOR_Y);
        ctx.rotate(rock);
        ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, 5, 12, 0); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-9, 0); ctx.lineTo(-7, -16); ctx.lineTo(9, -16); ctx.lineTo(10, 0);
        ctx.moveTo(-7, -16); ctx.lineTo(-10, -34);
        ctx.moveTo(-10, -34); ctx.lineTo(2, -30);
        ctx.stroke();
        ctx.restore();
      });

      /* --- the frame: the two corner posts of the porch, and the roof they
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
          ctx.fillStyle = '#3a2e42';
          ctx.fillRect(ex + (dir > 0 ? 0 : -34), 10, 34, H);
          ctx.fillStyle = 'rgba(255,220,170,.07)';
          ctx.fillRect(ex + (dir > 0 ? 27 : -34), 10, 6, H);
          /* the bracket where post meets roof */
          ctx.fillStyle = '#2e2436';
          ctx.beginPath();
          ctx.moveTo(ex + dir * 34, 14);
          ctx.lineTo(ex + dir * 68, 14);
          ctx.lineTo(ex + dir * 34, 44);
          ctx.closePath(); ctx.fill();
        });
      });

      K.grain(ctx, camX, 60, ['#6b4c33', '#a87c52'], 0.1);
      K.floorPool(ctx, W * 0.3, 190, 'rgba(255,206,130,.6)', 0.3);
      K.litter(ctx, camX, 1, 66, ['rgba(120,96,64,.4)', 'rgba(200,170,120,.35)'], 0.7, 1.9);
      this.fluff.update();
      this.fluff.draw(ctx, camX, t);
    },
    drawFore: function (ctx, camX, t) {
      /* the porch roof beam, a hanging fern with actual foliage, and one
         set of chimes rather than a forest of them */
      K.layer(ctx, camX, 1.28, function () {
        ctx.fillStyle = '#cbc0a8'; ctx.fillRect(-10, 0, W + 20, 14);
        ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(-10, 14, W + 20, 3);
        K.repeatX(camX, 0, 210, function (x, i) {
          var sw = K.sway(t, 0.016, 3, i);
          ctx.strokeStyle = 'rgba(50,40,28,.85)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(x, 17); ctx.lineTo(x + sw, 30); ctx.stroke();
          /* pot */
          ctx.fillStyle = '#9c6b45';
          ctx.beginPath();
          ctx.moveTo(x + sw - 10, 30); ctx.lineTo(x + sw + 10, 30);
          ctx.lineTo(x + sw + 7, 42); ctx.lineTo(x + sw - 7, 42);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#7d5334';
          ctx.fillRect(x + sw - 11, 29, 22, 3);
          /* fronds — vines with leaves down each side */
          for (var v = -2; v <= 2; v++) {
            if (v === 0) continue;
            var lean = v * 7 + sw * 0.6;
            ctx.strokeStyle = '#3f6630'; ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(x + sw + v * 3, 40);
            ctx.quadraticCurveTo(x + sw + lean, 52, x + sw + lean * 1.25, 68 + Math.abs(v) * 5);
            ctx.stroke();
            for (var lf = 1; lf <= 4; lf++) {
              var k = lf / 4;
              var lx2 = x + sw + v * 3 + (lean - v * 3) * k * 1.15;
              var ly2 = 40 + (28 + Math.abs(v) * 5) * k;
              ctx.fillStyle = lf % 2 ? '#4f7a3a' : '#5d8f45';
              ctx.beginPath();
              ctx.ellipse(lx2, ly2, 4.2, 2.1, v > 0 ? 0.7 : -0.7, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
        /* one set of wind chimes, on its own spacing */
        K.repeatX(camX, 0, 330, function (x, i) {
          var cx = x + 118, sw = K.sway(t, 0.028, 2.4, i * 3);
          ctx.fillStyle = '#8a6642';
          ctx.beginPath(); ctx.arc(cx, 22, 5, Math.PI, 0); ctx.fill();
          for (var c = 0; c < 4; c++) {
            var dx = cx + (c - 1.5) * 3.4 + sw * (0.4 + c * 0.2);
            ctx.strokeStyle = 'rgba(160,160,175,.75)'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(cx + (c - 1.5) * 3.4, 22); ctx.lineTo(dx, 32 + c * 2); ctx.stroke();
            ctx.strokeStyle = 'rgba(226,226,236,.95)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(dx, 32 + c * 2); ctx.lineTo(dx, 46 + c * 4); ctx.stroke();
          }
        });
      });
      K.vignette(ctx, 0.26);
    }
  };
})();
