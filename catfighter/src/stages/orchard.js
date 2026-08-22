/* =======================================================================
   3 — THE ORCHARD
   Golden hour, three depths of trees, chickens who could not care less.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

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
      K.sky(ctx, [[0, '#f2a35a'], [0.4, '#f5c07a'], [1, '#f7dcb0']], 0, 150);
      K.glow(ctx, 120, 130, 92, 'rgba(255,236,170,.95)', 0.55);
      ctx.fillStyle = '#fff2c8';
      ctx.beginPath(); ctx.arc(120, 132, 26, 0, Math.PI * 2); ctx.fill();

      /* sun rays, fanning out from where the sun actually is */
      K.layer(ctx, camX, 0.05, function () {
        for (var r = 0; r < 11; r++) {
          K.lightShaft(ctx, 120 + (r - 5) * 34, 6, 44,
                       'rgba(255,238,190,.5)', 0.10 + 0.05 * Math.sin(t * 0.01 + r), 132, 0);
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
        var bx = K.at(camX, 0, 196) - camX * 0.04;
        /* the gambrel roof */
        ctx.fillStyle = '#7e2b22';
        ctx.beginPath();
        ctx.moveTo(bx - 46, 118); ctx.lineTo(bx - 40, 96);
        ctx.lineTo(bx - 16, 82); ctx.lineTo(bx + 16, 82);
        ctx.lineTo(bx + 40, 96); ctx.lineTo(bx + 46, 118);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,224,160,.16)';
        ctx.beginPath();
        ctx.moveTo(bx - 46, 118); ctx.lineTo(bx - 40, 96);
        ctx.lineTo(bx - 16, 82); ctx.lineTo(bx - 12, 88);
        ctx.lineTo(bx - 34, 100); ctx.lineTo(bx - 39, 118);
        ctx.closePath(); ctx.fill();
        /* the walls, lit down the sunward side */
        K.mass(ctx, bx - 44, 118, 88, 42, '#a8382a', { top: 0, side: 9, light: -1, foot: false });
        /* the big door, and the hay hood over it */
        ctx.fillStyle = '#f0e2c4';
        ctx.fillRect(bx - 15, 124, 30, 36);
        ctx.fillStyle = '#8e3026';
        ctx.fillRect(bx - 15, 124, 30, 4);
        ctx.strokeStyle = '#f0e2c4'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx - 15, 128); ctx.lineTo(bx + 15, 158);
        ctx.moveTo(bx + 15, 128); ctx.lineTo(bx - 15, 158);
        ctx.stroke();
        ctx.fillStyle = '#4a1c16';
        ctx.beginPath();
        ctx.moveTo(bx - 8, 84); ctx.lineTo(bx + 8, 84);
        ctx.lineTo(bx + 6, 94); ctx.lineTo(bx - 6, 94);
        ctx.closePath(); ctx.fill();
        /* the silo beside it, catching the same light */
        K.mass(ctx, bx + 50, 88, 24, 72, '#c3b49a', { top: 0, side: 7, light: -1, foot: false });
        ctx.fillStyle = '#8d8272';
        ctx.beginPath();
        ctx.ellipse(bx + 62, 88, 12, 7, 0, Math.PI, 0);
        ctx.fill();
        /* a weather vane, turning slowly */
        var vn = Math.sin(t * 0.004);
        ctx.strokeStyle = '#3a1c16'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(bx, 76); ctx.lineTo(bx, 84); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx - 5 * vn, 76); ctx.lineTo(bx + 5 * vn, 76);
        ctx.stroke();
      });

      /* --- the landmark: one enormous old tree with a rope swing, and a
             ladder leaning against it. Everything else is a row. --- */
      K.layer(ctx, camX, 0.34, function () {
        var tx = K.at(camX, 0, 300);
        ctx.fillStyle = '#4a3524';
        ctx.beginPath();
        ctx.moveTo(tx - 9, FLOOR_Y);
        ctx.lineTo(tx - 5, 96); ctx.lineTo(tx + 5, 96); ctx.lineTo(tx + 10, FLOOR_Y);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx, 108); ctx.lineTo(tx - 30, 90);
        ctx.moveTo(tx, 116); ctx.lineTo(tx + 28, 100);
        ctx.stroke();
        var swayX = K.sway(t, 0.008, 3, 0);
        ['#3f7a35', '#4d8f3d', '#356b2c'].forEach(function (col, ci) {
          ctx.fillStyle = col;
          for (var q = 0; q < 7; q++) {
            ctx.beginPath();
            ctx.arc(tx + swayX + Math.cos(q * 0.9 + ci) * (30 + ci * 8),
                    72 + Math.sin(q * 1.3 + ci) * 16 + ci * 4,
                    K.vary(q + ci * 7, 90, 15, 25), 0, Math.PI * 2);
            ctx.fill();
          }
        });
        /* the rope swing, moving */
        var sw = Math.sin(t * 0.018) * 9;
        ctx.strokeStyle = '#c4a878'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(tx + 20, 102); ctx.lineTo(tx + 20 + sw, 146); ctx.stroke();
        ctx.fillStyle = '#6b4a2e';
        ctx.fillRect(tx + 13 + sw, 146, 15, 3.5);
        /* a ladder against the trunk */
        ctx.strokeStyle = '#a8814e'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx - 26, FLOOR_Y); ctx.lineTo(tx - 12, 104);
        ctx.moveTo(tx - 18, FLOOR_Y); ctx.lineTo(tx - 4, 104);
        ctx.stroke();
        ctx.lineWidth = 1.4;
        for (var rr = 0; rr < 6; rr++) {
          var ry = FLOOR_Y - rr * 12;
          ctx.beginPath();
          ctx.moveTo(tx - 26 + rr * 2.3, ry); ctx.lineTo(tx - 18 + rr * 2.3, ry); ctx.stroke();
        }
        /* an apple crate at the foot of it, half full */
        ctx.fillStyle = '#8a6339';
        ctx.fillRect(tx + 30, FLOOR_Y - 16, 26, 16);
        ctx.fillStyle = 'rgba(0,0,0,.25)';
        ctx.fillRect(tx + 30, FLOOR_Y - 16, 26, 3);
        for (var ap = 0; ap < 5; ap++) {
          ctx.fillStyle = K.pick(ap, 91, ['#c9382f', '#d94a34', '#a82c26']);
          ctx.beginPath();
          ctx.arc(tx + 35 + ap * 4.6, FLOOR_Y - 18, 3, 0, Math.PI * 2); ctx.fill();
        }
      });

      /* --- three ranks of trees, every one a different size and shade --- */
      [[0.22, 0.62, '#2f5c28', '#3d7534'], [0.32, 0.8, '#3a6f30', '#4a8a3e'],
       [0.46, 1.0, '#457f38', '#57a049']].forEach(function (rank, ri) {
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
          if (K.chance(i, 101, 0.22)) {
            K.spectator(ctx, x + 2, 150, K.vary(i, 102, 0.6, 0.8),
                        Math.abs(i * 17), t + i * 33, mood);
          }
        });
      });

      /* --- the frame: two vast trunks at the edge of the picture, close
             enough that you cannot see the top of them --- */
      K.layer(ctx, camX, 0.86, function () {
        var drift2 = camX * 0.05;
        [[-24, 1], [W + 24, -1]].forEach(function (side) {
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

      /* --- grass, and things moving in it --- */
      K.ground(ctx, camX, '#4e8f3a', '#6fae4c', 0.07);
      /* mown stripes: the mower went up and back, so every other band is
         lighter. A lawn with no stripes in it is a green rectangle. */
      K.repeatX(camX, 1, 46, function (x, i) {
        if (Math.abs(i) % 2) return;
        ctx.fillStyle = 'rgba(255,255,210,.13)';
        ctx.beginPath();
        ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x + 46, FLOOR_Y);
        ctx.lineTo(x + 46 - 30, H); ctx.lineTo(x - 30, H);
        ctx.closePath(); ctx.fill();
      });
      /* clover and windfall apples lying in it */
      K.litter(ctx, camX, 1, 34, ['rgba(210,60,44,.75)', 'rgba(255,244,190,.5)',
                                  'rgba(40,90,30,.35)'], 1.1, 2.6);
      K.floorPool(ctx, W * 0.42, 210, 'rgba(255,238,180,.6)', 0.32);
      K.layer(ctx, camX, 1, function () {
        K.repeatX(camX, 0, 9, function (x, i) {
          ctx.strokeStyle = 'rgba(40,80,26,' + K.vary(i, 103, 0.14, 0.34).toFixed(2) + ')';
          ctx.lineWidth = 1;
          var gh = K.vary(i, 104, 3, 8);
          ctx.beginPath();
          ctx.moveTo(x, H);
          ctx.lineTo(x + K.sway(t, 0.02, 2, i), H - gh - 30);
          ctx.stroke();
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
      K.vignette(ctx, 0.24);
    }
  };
})();
