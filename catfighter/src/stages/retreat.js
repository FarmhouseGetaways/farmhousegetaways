/* =======================================================================
   4 — MOUNTAIN RETREAT
   Night. A campfire, fireflies, and granite. The quiet one.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  CF.StageDefs = CF.StageDefs || {};
  CF.StageDefs.retreat = {
    id: 'retreat', name: 'MOUNTAIN RETREAT',
    blurb: 'Night on the granite. Firelight, fireflies, and bats over the moon.',
    /* the colour of the air here — see K.deepen */
    air: { air: '#33436b', haze: 0.22, floorDark: 0.26, horizon: 126 },
    init: function () {
      this.flies = new P({ count: 26, kind: 'firefly', depth: 0.8, seed: 44,
                           band: [96, FLOOR_Y + 14], vx: 0.07, vy: -0.03,
                           size: 1.15, color: 'rgba(198,255,150,1)',
                           color2: 'rgba(150,255,110,1)', wobble: 2.6 });
      this.embers = new P({ count: 16, kind: 'ember', depth: 0.72, seed: 45,
                            band: [96, FLOOR_Y - 8], vx: 0.05, vy: -0.30,
                            size: 1.2, color: 'rgba(255,120,50,1)',
                            color2: 'rgba(255,220,140,1)', wobble: 1.6 });
      this.shoot = { x: -100, y: 0, t: -1 };
    },
    drawBack: function (ctx, camX, t, mood) {
      K.sky(ctx, [[0, '#0d1330'], [0.5, '#252c58'], [1, '#4d3d63']], 0, 150);

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
      K.glow(ctx, 96, 42, 54, 'rgba(226,236,255,.85)', 0.4);
      ctx.fillStyle = '#e8eeff';
      ctx.beginPath(); ctx.arc(96, 42, 19, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(180,190,215,.5)';
      ctx.beginPath(); ctx.arc(102, 37, 4.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(90, 48, 3.2, 0, Math.PI * 2); ctx.fill();

      /* an aurora, slow enough that you only notice it if you look */
      K.layer(ctx, camX, 0.04, function () {
        for (var a2 = 0; a2 < 3; a2++) {
          ctx.beginPath();
          for (var x2 = -20; x2 <= W + 20; x2 += 12) {
            var yy = 40 + a2 * 13 + Math.sin(x2 * 0.014 + t * 0.006 + a2) * 15;
            if (x2 === -20) ctx.moveTo(x2, yy); else ctx.lineTo(x2, yy);
          }
          ctx.strokeStyle = ['rgba(90,220,180,.16)', 'rgba(120,180,255,.13)',
                             'rgba(170,130,235,.11)'][a2];
          ctx.lineWidth = 14 + a2 * 5;
          ctx.stroke();
        }
      });

      K.ridge(ctx, camX, 0.08, '#232a4c', 138, 44, 5);
      K.ridge(ctx, camX, 0.16, '#1a2040', 152, 30, 17);

      /* --- a granite face on one side, with a thread of water down it --- */
      K.layer(ctx, camX, 0.2, function () {
        var fx = K.at(camX, 0, 40);
        ctx.fillStyle = '#232132';
        ctx.beginPath();
        ctx.moveTo(fx - 90, FLOOR_Y);
        ctx.lineTo(fx - 74, 40); ctx.lineTo(fx - 30, 22); ctx.lineTo(fx + 6, 62);
        ctx.lineTo(fx + 24, 108); ctx.lineTo(fx + 30, FLOOR_Y);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(190,205,245,.07)';
        ctx.beginPath();
        ctx.moveTo(fx - 74, 40); ctx.lineTo(fx - 30, 22); ctx.lineTo(fx - 18, 74);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1.4;
        for (var c2 = 0; c2 < 4; c2++) {
          ctx.beginPath();
          ctx.moveTo(fx - 66 + c2 * 22, 44 + c2 * 10);
          ctx.lineTo(fx - 78 + c2 * 22, FLOOR_Y);
          ctx.stroke();
        }
        /* the fall, and the light it catches */
        ctx.strokeStyle = 'rgba(200,225,255,.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (var wy = 64; wy < FLOOR_Y - 8; wy += 8) {
          ctx.lineTo(fx - 6 + Math.sin(wy * 0.2 + t * 0.09) * 2, wy);
        }
        ctx.stroke();
        K.glow(ctx, fx - 6, FLOOR_Y - 12, 26, 'rgba(190,220,255,.7)', 0.16);
      });

      /* --- pines, each its own height, with a gap here and there --- */
      K.layer(ctx, camX, 0.26, function () {
        K.repeatX(camX, 0, 22, function (x, i) {
          if (K.chance(i, 115, 0.16)) return;
          var ph = K.vary(i, 116, 34, 78), pw = ph * K.vary(i, 117, 0.22, 0.34);
          ctx.fillStyle = K.pick(i, 118, ['#12182f', '#161d38', '#0e1428']);
          ctx.beginPath();
          ctx.moveTo(x, 160 - ph);
          ctx.lineTo(x - pw, 162); ctx.lineTo(x + pw, 162);
          ctx.closePath(); ctx.fill();
        });
      });

      /* --- THE LANDMARK: the cabin. It was a lean-to the size of a kennel,
             which is no use at all in a stage this dark — the eye had nowhere
             to go. It is now a whole log cabin with four lit windows, a porch
             with somebody on it, a stone chimney and smoke going up out of
             it. Warm light in a cold picture is the strongest landmark there
             is. --- */
      K.layer(ctx, camX, 0.4, function () {
        var hx = K.at(camX, 0, 296);
        var flick = 0.78 + 0.22 * Math.sin(t * 0.13) * Math.sin(t * 0.31);

        /* the stone chimney, up the near end */
        K.mass(ctx, hx + 46, 76, 18, 88, '#4e4a5e', { top: 3, side: 4, foot: false });
        for (var st2 = 0; st2 < 7; st2++) {
          ctx.strokeStyle = 'rgba(0,0,0,.30)'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(hx + 46, 84 + st2 * 12); ctx.lineTo(hx + 64, 84 + st2 * 12);
          ctx.stroke();
        }
        /* smoke, rising and spreading */
        for (var sm = 0; sm < 6; sm++) {
          var sp2 = ((t * 0.5 + sm * 22) % 132) / 132;
          ctx.globalAlpha = 0.22 * (1 - sp2);
          ctx.fillStyle = '#c9cbe0';
          ctx.beginPath();
          ctx.arc(hx + 55 + Math.sin(sp2 * 4 + sm) * 9, 74 - sp2 * 62,
                  3 + sp2 * 9, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        /* the body of it, in logs */
        K.mass(ctx, hx - 54, 104, 102, 60, '#3a3048', { top: 0, side: 8, foot: false });
        ctx.strokeStyle = 'rgba(0,0,0,.34)'; ctx.lineWidth = 1;
        for (var lg = 1; lg < 7; lg++) {
          ctx.beginPath();
          ctx.moveTo(hx - 54, 104 + lg * 8.5); ctx.lineTo(hx + 48, 104 + lg * 8.5);
          ctx.stroke();
        }
        /* the roof, overhanging at both ends */
        ctx.fillStyle = '#2a2336';
        ctx.beginPath();
        ctx.moveTo(hx - 66, 106); ctx.lineTo(hx - 4, 74);
        ctx.lineTo(hx + 60, 106); ctx.lineTo(hx + 60, 112);
        ctx.lineTo(hx - 4, 80); ctx.lineTo(hx - 66, 112);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(210,222,255,.10)';    /* moon on the near pitch */
        ctx.beginPath();
        ctx.moveTo(hx - 66, 106); ctx.lineTo(hx - 4, 74);
        ctx.lineTo(hx - 4, 80); ctx.lineTo(hx - 66, 112);
        ctx.closePath(); ctx.fill();

        /* four windows, all lit, one of them with somebody moving past it */
        [[-42, 112], [-14, 112], [14, 112], [-42, 138]].forEach(function (wp, wi) {
          ctx.fillStyle = '#171325';
          ctx.fillRect(hx + wp[0] - 1, wp[1] - 1, 20, 18);
          ctx.fillStyle = 'rgba(255,206,130,' + (0.62 + 0.24 * flick).toFixed(2) + ')';
          ctx.fillRect(hx + wp[0], wp[1], 18, 16);
          if (wi === 1) {                       /* a shape crossing the light */
            var pw2 = ((t * 0.7) % 200) / 200;
            if (pw2 < 0.4) {
              ctx.fillStyle = 'rgba(40,26,20,.75)';
              ctx.fillRect(hx + wp[0] + pw2 * 44 - 4, wp[1] + 2, 7, 14);
            }
          }
          ctx.strokeStyle = 'rgba(30,22,16,.8)'; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(hx + wp[0] + 9, wp[1]); ctx.lineTo(hx + wp[0] + 9, wp[1] + 16);
          ctx.moveTo(hx + wp[0], wp[1] + 8); ctx.lineTo(hx + wp[0] + 18, wp[1] + 8);
          ctx.stroke();
          K.glow(ctx, hx + wp[0] + 9, wp[1] + 8, 22, 'rgba(255,186,90,.9)', 0.24 * flick);
        });

        /* the porch, its rail, and somebody out on it watching */
        ctx.fillStyle = '#241e30';
        ctx.fillRect(hx - 58, 160, 110, 5);
        ctx.strokeStyle = '#3c3349'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hx - 56, 160); ctx.lineTo(hx - 56, 148);
        ctx.moveTo(hx + 48, 160); ctx.lineTo(hx + 48, 148);
        ctx.moveTo(hx - 56, 150); ctx.lineTo(hx + 48, 150);
        ctx.stroke();
        K.spectator(ctx, hx + 30, 160, 0.7, 511, t, mood);

        /* the light it throws down onto the granite */
        K.spill(ctx, hx - 50, 164, 96, H - 164, 'rgba(255,186,90,.6)', 0.24 * flick);
      });

      /* --- boulders: every one a different lump, not the same oval --- */
      K.layer(ctx, camX, 0.62, function () {
        K.repeatX(camX, 0, 76, function (x, i) {
          var bw = K.vary(i, 120, 16, 34), bh = K.vary(i, 121, 9, 20);
          var pts = [], n = 7;
          for (var q = 0; q < n; q++) {
            var a2 = (q / n) * Math.PI * 2;
            var rr = 1 + K.hash(i * 9 + q, 122) * 0.34;
            pts.push({ x: x + Math.cos(a2) * bw * rr, y: FLOOR_Y - 4 + Math.sin(a2) * bh * rr });
          }
          ctx.fillStyle = K.pick(i, 123, ['#4a4658', '#403c50', '#565064']);
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (var q2 = 1; q2 < pts.length; q2++) ctx.lineTo(pts[q2].x, pts[q2].y);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,240,220,.07)';
          ctx.beginPath();
          ctx.ellipse(x - bw * 0.2, FLOOR_Y - 4 - bh * 0.4, bw * 0.5, bh * 0.3, -0.3, 0, Math.PI * 2);
          ctx.fill();
          /* a fire on some of them, and somebody sat by it */
          if (K.chance(i, 124, 0.3)) {
            var fx = x + K.vary(i, 125, -12, 12), fy = FLOOR_Y - 10;
            var fl = 0.7 + 0.3 * Math.sin(t * 0.17 + i);
            K.glow(ctx, fx, fy, 30, 'rgba(255,150,60,.9)', 0.34 * fl);
            ctx.fillStyle = '#6b4a2e';
            ctx.fillRect(fx - 7, fy - 1, 14, 3);
            ctx.fillStyle = '#ffb03a';
            ctx.beginPath();
            ctx.moveTo(fx - 4, fy); ctx.quadraticCurveTo(fx, fy - 13 * fl, fx + 4, fy);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fff0b0';
            ctx.beginPath();
            ctx.moveTo(fx - 2, fy); ctx.quadraticCurveTo(fx, fy - 7 * fl, fx + 2, fy);
            ctx.closePath(); ctx.fill();
          }
          if (K.chance(i, 126, 0.45)) {
            K.spectator(ctx, x + K.vary(i, 127, -10, 10), FLOOR_Y - 6 - bh * 0.5,
                        K.vary(i, 128, 0.7, 0.95), Math.abs(i * 11), t + i * 29, mood);
          }
        });
      });

      /* --- the frame: two boulders the size of sheds --- */
      K.layer(ctx, camX, 0.86, function () {
        var drift3 = camX * 0.05;
        [[-20, 1], [W + 20, -1]].forEach(function (side) {
          var ex = side[0] - drift3 * side[1], dir = side[1];
          ctx.fillStyle = '#1d1b2a';
          ctx.beginPath();
          ctx.moveTo(ex - dir * 30, H + 10);
          ctx.lineTo(ex - dir * 20, 66);
          ctx.lineTo(ex + dir * 18, 34);
          ctx.lineTo(ex + dir * 50, 74);
          ctx.lineTo(ex + dir * 58, H + 10);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(190,205,245,.06)';
          ctx.beginPath();
          ctx.moveTo(ex - dir * 20, 66); ctx.lineTo(ex + dir * 18, 34);
          ctx.lineTo(ex + dir * 24, 96); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(ex + dir * 16, 36); ctx.lineTo(ex + dir * 6, 118);
          ctx.lineTo(ex + dir * 30, H); ctx.stroke();
        });
      });

      /* --- granite underfoot, wet-looking, with the moon on it --- */
      K.ground(ctx, camX, '#39364a', '#565169', 0.14);
      K.floorPool(ctx, 96, 150, 'rgba(190,205,245,.5)', 0.22);
      K.litter(ctx, camX, 1, 58, ['rgba(150,150,175,.3)', 'rgba(90,88,110,.4)'], 0.9, 2.4);
      this.flies.update();
      this.flies.draw(ctx, camX, t);
      this.embers.update();
      this.embers.draw(ctx, camX, t);
    },
    drawFore: function (ctx, camX, t) {
      /* Low mist rolling across the fighters' ankles. Many thin, faint bands
         rather than a few fat ones — four big ellipses read as a grey smear,
         which is worse than no mist at all. */
      ctx.save();
      ctx.fillStyle = '#b9c6e0';
      for (var i = 0; i < 9; i++) {
        var span = W + 240;
        var mx = ((t * (0.13 + i * 0.035) - camX * 1.08) % span + span) % span - 120;
        var my = FLOOR_Y + 10 + i * 5.5;
        ctx.globalAlpha = 0.055 + 0.035 * Math.sin(t * 0.02 + i * 1.7);
        ctx.beginPath();
        ctx.ellipse(mx, my, 62 + (i % 3) * 26, 4.2 - i * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      K.vignette(ctx, 0.32);
    }
  };
})();
