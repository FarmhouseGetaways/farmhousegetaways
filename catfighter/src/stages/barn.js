/* =======================================================================
   1 — THE GAME BARN
   Warm, loud, and full of glowing machines. The crowd is on the hay bales.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  CF.StageDefs = CF.StageDefs || {};
  CF.StageDefs.barn = {
    id: 'barn', name: 'THE GAME BARN',
    blurb: 'Arcade cabinets, string lights, and a full house on the hay bales.',
    /* the colour of the air here — see K.deepen */
    air: { air: '#6b4038', haze: 0.07, floorDark: 0.34, horizon: 128 },
    init: function () {
      this.dust = new P({ count: 30, kind: 'dust', depth: 0.75, seed: 11,
                          band: [24, FLOOR_Y - 6], vx: 0.06, vy: -0.03,
                          size: 1.3, color: 'rgba(255,226,168,.85)', wobble: 1.4 });
    },
    drawBack: function (ctx, camX, t, mood) {
      /* --- the far wall: boards, not a flat field --- */
      K.sky(ctx, [[0, '#3a1b28'], [0.42, '#6f3038'], [1, '#a8583c']], 0, FLOOR_Y);
      K.layer(ctx, camX, 0.18, function () {
        K.repeatX(camX, 0, 17, function (x, i) {
          ctx.fillStyle = 'rgba(0,0,0,' + (0.05 + K.hash(i, 21) * 0.16).toFixed(3) + ')';
          ctx.fillRect(x, 0, 17, FLOOR_Y);
          if (K.chance(i, 22, 0.22)) {          /* a knot in the board */
            ctx.fillStyle = 'rgba(0,0,0,.22)';
            ctx.beginPath();
            ctx.ellipse(x + 8, K.vary(i, 23, 20, FLOOR_Y - 30), 2.2, 3.4, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });

      /* --- THE HAYLOFT. The top third of this stage used to be an empty
             maroon wall with a small window in it. It is now the whole open
             end of the loft: a moonlit doorway two thirds the height of a
             fighter, bales stacked in it, a ladder down, and a block and
             tackle hanging off the beam. Something huge and far away, framing
             something small and near, is the whole trick. --- */
      K.layer(ctx, camX, 0.22, function () {
        var wx = K.at(camX, 0, 250);
        /* the opening itself */
        ctx.fillStyle = '#150e1c';
        ctx.fillRect(wx - 62, 2, 124, 74);
        ctx.fillStyle = '#33507f';                    /* night outside */
        ctx.fillRect(wx - 57, 6, 114, 66);
        ctx.fillStyle = '#4d76ad';
        ctx.fillRect(wx - 57, 6, 114, 30);
        /* a moon, and hills under it */
        ctx.fillStyle = '#e8eaf6';
        ctx.beginPath(); ctx.arc(wx + 28, 22, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#22355c';
        ctx.beginPath();
        ctx.moveTo(wx - 57, 72);
        for (var hx = -57; hx <= 57; hx += 8) {
          ctx.lineTo(wx + hx, 50 - Math.sin(hx * 0.05) * 7 - Math.sin(hx * 0.13) * 3);
        }
        ctx.lineTo(wx + 57, 72); ctx.closePath(); ctx.fill();
        /* bales stacked in the mouth of it, so the scale reads */
        K.mass(ctx, wx - 54, 48, 30, 24, '#b8933f', { top: 3, side: 4 });
        K.mass(ctx, wx - 50, 26, 26, 22, '#c2a04a', { top: 3, side: 4 });
        K.mass(ctx, wx + 22, 52, 32, 20, '#ad8a3a', { top: 3, side: 4 });
        /* the frame round it */
        ctx.strokeStyle = '#40261c'; ctx.lineWidth = 5;
        ctx.strokeRect(wx - 59.5, 4.5, 119, 69);
        ctx.fillStyle = '#4a2c1e';
        ctx.fillRect(wx - 66, 74, 132, 7);
        ctx.fillStyle = 'rgba(255,225,170,.12)';
        ctx.fillRect(wx - 66, 74, 132, 2);
        /* block and tackle on the hoist beam, swinging a little */
        var hook = wx + 74, swing = Math.sin(t * 0.011) * 5;
        ctx.fillStyle = '#3a2418'; ctx.fillRect(hook - 4, 0, 8, 10);
        ctx.strokeStyle = 'rgba(24,16,12,.9)'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(hook, 10); ctx.lineTo(hook + swing, 44); ctx.stroke();
        K.mass(ctx, hook + swing - 5, 44, 10, 12, '#6b5a3a', { top: 2, side: 3 });
        /* the ladder down out of it */
        ctx.strokeStyle = '#5c3a24'; ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(wx - 46, 78); ctx.lineTo(wx - 52, FLOOR_Y - 20);
        ctx.moveTo(wx - 30, 78); ctx.lineTo(wx - 36, FLOOR_Y - 20);
        ctx.stroke();
        ctx.lineWidth = 1.8;
        for (var rung = 0; rung < 9; rung++) {
          var ry = 84 + rung * ((FLOOR_Y - 104) / 9);
          var lean = (ry - 78) / (FLOOR_Y - 98) * 6;
          ctx.beginPath();
          ctx.moveTo(wx - 46 - lean, ry); ctx.lineTo(wx - 30 - lean, ry);
          ctx.stroke();
        }
        /* the moonlight falling out of the opening */
        K.spill(ctx, wx - 54, 76, 108, FLOOR_Y - 76, 'rgba(150,185,235,.55)', 0.26);
      });

      /* --- roof trusses --- */
      K.layer(ctx, camX, 0.26, function () {
        ctx.strokeStyle = '#3f2620'; ctx.lineWidth = 3;
        K.repeatX(camX, 0, 96, function (x) {
          ctx.beginPath();
          ctx.moveTo(x - 46, 26); ctx.lineTo(x, 6); ctx.lineTo(x + 46, 26);
          ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - 46, 26); ctx.lineTo(x + 46, 26); ctx.stroke();
          ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x - 24, 16); ctx.lineTo(x - 24, 26);
          ctx.moveTo(x + 24, 16); ctx.lineTo(x + 24, 26); ctx.stroke();
          ctx.strokeStyle = '#3f2620'; ctx.lineWidth = 3;
        });
      });

      /* --- the cabinets. No two the same: different heights, widths,
             marquees, screens, and one in four is dark with a note taped to
             it. A row of identical machines is what made this read as
             wallpaper. --- */
      K.layer(ctx, camX, 0.42, function () {
        K.repeatX(camX, 0, 54, function (x, i) {
          var h = K.hash(i, 1);
          var wdt = K.vary(i, 30, 34, 46);
          var bh = K.vary(i, 31, 58, 80);
          var top = FLOOR_Y - 22 - bh;
          var dead = K.chance(i, 32, 0.18);
          var body = K.pick(i, 33, ['#2f3a6b', '#6b2f4a', '#2f6b4a', '#6b5a2f',
                                    '#472f6b', '#6b3f2f']);
          /* the cabinet — a painted mass with a lit face, a shaded side and
             an edge, not a flat rectangle */
          K.mass(ctx, x, top, wdt, bh + 22, body, { top: 3, side: 6, foot: false });
          /* marquee, in one of three shapes */
          var mc = dead ? '#5a5148' : K.pick(i, 34, ['#ffd166', '#ff7a8a', '#8fe6ff',
                                                     '#b6ff8f', '#ffa04a']);
          ctx.fillStyle = mc;
          if (K.chance(i, 35, 0.34)) {
            ctx.beginPath();
            ctx.moveTo(x + 1, top + 9); ctx.lineTo(x + wdt / 2, top - 3);
            ctx.lineTo(x + wdt - 1, top + 9);
            ctx.closePath(); ctx.fill();
          } else {
            ctx.fillRect(x + 2, top + 1, wdt - 10, 8);
          }
          /* screen */
          var sw = wdt - 12, sh = Math.min(26, bh * 0.36);
          ctx.fillStyle = '#0b0d16';
          ctx.fillRect(x + 4, top + 13, sw, sh);
          if (!dead) {
            var kind = Math.floor(K.hash(i, 36) * 3);
            ctx.save();
            ctx.beginPath(); ctx.rect(x + 4, top + 13, sw, sh); ctx.clip();
            if (kind === 0) {                 /* scrolling bars */
              for (var b2 = 0; b2 < 5; b2++) {
                ctx.globalAlpha = 0.8;
                ctx.fillStyle = K.pick(i * 5 + b2, 37, ['#ff5b7a', '#ffd166', '#6fe3a0', '#7ab6ff']);
                ctx.fillRect(x + 5, top + 14 + ((b2 * 6 + t * (0.4 + h)) % sh), sw - 2, 2.2);
              }
            } else if (kind === 1) {          /* a maze of blocks */
              for (var q = 0; q < 12; q++) {
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = K.pick(i * 12 + q, 38, ['#4ad0ff', '#ffd166', '#ff6b8a']);
                ctx.fillRect(x + 5 + (q % 4) * (sw / 4),
                             top + 14 + Math.floor(q / 4) * (sh / 3), sw / 4 - 1.5, sh / 3 - 1.5);
              }
            } else {                          /* two paddles and a dot */
              ctx.globalAlpha = 0.9; ctx.fillStyle = '#e8f0ff';
              ctx.fillRect(x + 6, top + 15 + (Math.sin(t * 0.06 + i) * 0.5 + 0.5) * (sh - 10), 2, 7);
              ctx.fillRect(x + 2 + sw, top + 15 + (Math.cos(t * 0.05 + i) * 0.5 + 0.5) * (sh - 10), 2, 7);
              ctx.beginPath();
              ctx.arc(x + 4 + sw / 2 + Math.sin(t * 0.09 + i) * sw * 0.34,
                      top + 13 + sh / 2 + Math.cos(t * 0.07 + i) * sh * 0.3, 1.6, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
            ctx.globalAlpha = 1;
            K.glow(ctx, x + 4 + sw / 2, top + 13 + sh / 2, 24, 'rgba(150,185,255,.55)', 0.2);
          } else {
            /* out of order, with a note taped on */
            ctx.fillStyle = '#e8e0cc';
            ctx.save();
            ctx.translate(x + wdt / 2, top + 13 + sh / 2);
            ctx.rotate(K.vary(i, 39, -0.2, 0.2));
            ctx.fillRect(-8, -5, 16, 10);
            ctx.restore();
          }
          /* control panel */
          ctx.fillStyle = 'rgba(0,0,0,.4)';
          ctx.fillRect(x + 1, top + 15 + sh, wdt - 8, 8);
          ctx.fillStyle = K.pick(i, 40, ['#ff5b5b', '#ffd166', '#6fe3a0']);
          ctx.beginPath(); ctx.arc(x + 10, top + 19 + sh, 2, 0, Math.PI * 2); ctx.fill();
          /* somebody playing it */
          if (!dead && K.chance(i, 41, 0.34)) {
            K.spectator(ctx, x + wdt / 2, FLOOR_Y - 2,
                        K.vary(i, 42, 0.72, 0.92), Math.abs(i * 31), t + i * 17, mood);
          }
        });
      });

      /* --- the landmark: a claw machine, lit up, with a jackpot sign over
             it. It stays where it is in the world, which is what makes this
             a place rather than a pattern. --- */
      K.layer(ctx, camX, 0.42, function () {
        var cx = K.at(camX, 0, 96);
        K.mass(ctx, cx - 30, FLOOR_Y - 96, 60, 96, '#b8342f', { top: 4, side: 8, foot: false });
        /* the glass box of prizes, sunk into the front of it */
        ctx.fillStyle = '#141c30';
        ctx.fillRect(cx - 26, FLOOR_Y - 89, 49, 54);
        ctx.fillStyle = '#1d2740';
        ctx.fillRect(cx - 25, FLOOR_Y - 88, 47, 52);
        ctx.fillStyle = 'rgba(190,225,255,.10)';   /* the glass catching light */
        ctx.beginPath();
        ctx.moveTo(cx - 25, FLOOR_Y - 88); ctx.lineTo(cx - 4, FLOOR_Y - 88);
        ctx.lineTo(cx - 25, FLOOR_Y - 52); ctx.closePath(); ctx.fill();
        for (var q2 = 0; q2 < 9; q2++) {
          ctx.fillStyle = K.pick(q2, 50, ['#ffd166', '#ff7a8a', '#8fe6ff', '#b6ff8f', '#ffa04a']);
          ctx.beginPath();
          ctx.arc(cx - 19 + (q2 % 5) * 9, FLOOR_Y - 44 - Math.floor(q2 / 5) * 8,
                  K.vary(q2, 51, 2.4, 3.8), 0, Math.PI * 2);
          ctx.fill();
        }
        /* the claw, tracking slowly back and forth */
        var clawX = cx - 2 + Math.sin(t * 0.012) * 16;
        ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(clawX, FLOOR_Y - 88); ctx.lineTo(clawX, FLOOR_Y - 62); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(clawX - 4, FLOOR_Y - 56); ctx.lineTo(clawX, FLOOR_Y - 62);
        ctx.lineTo(clawX + 4, FLOOR_Y - 56); ctx.stroke();
        /* the sign, flashing */
        var lit = (t % 60) < 34;
        ctx.fillStyle = lit ? '#ffe07a' : '#7a6a3a';
        ctx.fillRect(cx - 28, FLOOR_Y - 110, 56, 13);
        K.glow(ctx, cx, FLOOR_Y - 104, 34, 'rgba(255,224,122,.8)', lit ? 0.3 : 0.08);
        ctx.fillStyle = '#3a2410';
        ctx.font = '800 8px "Arial Narrow", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('JACKPOT', cx, FLOOR_Y - 101);
        ctx.textAlign = 'left';
      });

      /* --- hay bales, stacked to different heights, with a crowd on them --- */
      K.layer(ctx, camX, 0.62, function () {
        K.repeatX(camX, 0, 70, function (x, i) {
          var stack = K.chance(i, 60, 0.34) ? 2 : 1;
          var bw = K.vary(i, 61, 40, 50);
          for (var lvl = 0; lvl < stack; lvl++) {
            var by = FLOOR_Y - 4 - lvl * 25;
            K.mass(ctx, x + lvl * 5, by - 26, bw, 26,
                   K.pick(i * 3 + lvl, 62, ['#c9a24a', '#bf9743', '#d3ac54']),
                   { top: 4, side: 5 });
            ctx.strokeStyle = 'rgba(90,64,20,.55)'; ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(x + lvl * 5 + 12, by - 26); ctx.lineTo(x + lvl * 5 + 12, by);
            ctx.moveTo(x + lvl * 5 + bw - 12, by - 26); ctx.lineTo(x + lvl * 5 + bw - 12, by);
            ctx.stroke();
            /* loose straw off the top */
            ctx.strokeStyle = 'rgba(210,170,70,.7)'; ctx.lineWidth = 0.8;
            for (var st = 0; st < 4; st++) {
              var sx2 = x + lvl * 5 + K.vary(i * 4 + st, 63, 2, bw - 2);
              ctx.beginPath();
              ctx.moveTo(sx2, by - 26);
              ctx.lineTo(sx2 + K.vary(i * 4 + st, 64, -3, 3), by - 30);
              ctx.stroke();
            }
          }
          var topY = FLOOR_Y - 4 - (stack - 1) * 25 - 26;
          if (!K.chance(i, 65, 0.2)) {
            K.spectator(ctx, x + 13, topY, K.vary(i, 66, 0.86, 1.08),
                        Math.abs(i * 7), t + i * 23, mood);
          }
          if (K.chance(i, 67, 0.55)) {
            K.spectator(ctx, x + bw - 11, topY, K.vary(i, 68, 0.78, 1.0),
                        Math.abs(i * 7 + 3), t + i * 41 + 60, mood);
          }
        });
      });

      /* --- the frame: two enormous stall partitions at the edges of the
             picture, near enough that they dwarf the fighters. Scale contrast
             is what stops a background being a flat band — something huge and
             close on either side of something small and far. --- */
      K.layer(ctx, camX, 0.82, function () {
        /* Anchored near the edges of the screen with only a little drift.
           A frame that scrolls away is not a frame. */
        var drift = camX * 0.05;
        [[-16, 1], [W + 16, -1]].forEach(function (side) {
          var ex = side[0] - drift * side[1], dir = side[1];
          K.paint(ctx, function (c) {
            c.beginPath();
            c.moveTo(ex, H);
            c.lineTo(ex, -10);
            c.lineTo(ex + dir * 50, -10);
            c.lineTo(ex + dir * 42, 44);
            c.lineTo(ex + dir * 38, H);
            c.closePath();
          }, '#4a2c1c', { step: 3, lx: -dir * 0.9, ly: 0.2, hi: 0.16, edgeW: 1.6 });
          ctx.fillStyle = 'rgba(255,220,160,.10)';
          ctx.fillRect(ex + dir * 36, -10, dir * 5, H + 10);
          ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
          for (var q = 0; q < 4; q++) {
            ctx.beginPath();
            ctx.moveTo(ex + dir * (10 + q * 12), -10);
            ctx.lineTo(ex + dir * (8 + q * 11), H);
            ctx.stroke();
          }
          /* an iron bracket, at fighter height so the scale reads */
          ctx.fillStyle = '#2a2028';
          ctx.fillRect(ex + (dir > 0 ? 0 : -42), 96, 42, 9);
        });
      });

      /* --- a great roof beam overhead, close enough to be out of focus --- */
      K.layer(ctx, camX, 0.9, function () {
        K.paint(ctx, function (c) {
          c.beginPath();
          c.moveTo(-20, -10); c.lineTo(W + 20, -10);
          c.lineTo(W + 20, 16); c.lineTo(-20, 22);
          c.closePath();
        }, '#3f2812', { step: 3, lx: 0, ly: -1, hi: 0.20, edgeW: 1.6 });
        ctx.fillStyle = 'rgba(255,220,160,.10)';
        ctx.fillRect(-20, 14, W + 40, 3);
      });

      /* --- the floor --- */
      K.grain(ctx, camX, 56, ['#6d4a2c', '#bd854e'], 0.1);
      K.floorPool(ctx, W * 0.5, 190, 'rgba(255,196,110,.6)', 0.34);
      K.repeatX(camX, 1, 92, function (x) {
        K.glow(ctx, x, FLOOR_Y + 16, 46, 'rgba(255,196,110,.55)', 0.1);
      });
      /* tokens and straw underfoot */
      K.litter(ctx, camX, 1, 64, ['rgba(214,178,74,.6)', 'rgba(120,88,44,.5)',
                                  'rgba(255,224,140,.45)'], 0.7, 1.9);
      this.dust.update();
      this.dust.draw(ctx, camX, t);
    },
    drawFore: function (ctx, camX, t, mood) {
      /* --- string lights swinging across the front --- */
      K.layer(ctx, camX, 1.22, function () {
        ctx.strokeStyle = 'rgba(30,18,14,.85)'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (var x = -40; x <= W + 40; x += 6) {
          ctx.lineTo(x, 12 + Math.sin(x * 0.03 + t * 0.02) * 5 + Math.abs(Math.sin(x * 0.012)) * 12);
        }
        ctx.stroke();
        K.repeatX(camX, 0, 30, function (x, i) {
          var y = 12 + Math.sin(x * 0.03 + t * 0.02) * 5 + Math.abs(Math.sin(x * 0.012)) * 12;
          var sw = K.sway(t, 0.024, 2.2, i);
          var c = ['#ffd166', '#ff8a5b', '#8fe6ff', '#b6ff8f', '#ff7ab6'][Math.abs(i) % 5];
          var pulse = 0.72 + 0.28 * Math.sin(t * 0.05 + i * 1.7);
          ctx.strokeStyle = 'rgba(30,18,14,.8)'; ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y + 7); ctx.stroke();
          K.glow(ctx, x + sw, y + 9, 13, c, 0.42 * pulse);
          ctx.globalAlpha = pulse;
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.arc(x + sw, y + 9, 2.4, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        });
      });
      K.vignette(ctx, 0.26);
    }
  };
})();
