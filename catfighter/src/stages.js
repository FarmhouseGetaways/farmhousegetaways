/* ==========================================================================
   Super Cat Fighter 6 — the stages

   Six places on the property, each built as a stack of parallax layers with
   something moving in every one of them. What sold Street Fighter II's
   backgrounds was never detail, it was LIFE: the crowd reacting, the boats
   rocking, the geese taking off. So every stage here has a crowd that watches
   the fight and gets louder when it gets good, weather or ambience drifting
   through, and at least one thing going about its own business regardless.

   Each stage draws in two passes. `drawBack` goes behind the fighters,
   `drawFore` in front of them — the foreground pass is what makes a flat
   background feel like a place the cats are standing inside.
   ========================================================================== */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  /* =======================================================================
     1 — THE GAME BARN
     Warm, loud, and full of glowing machines. The crowd is on the hay bales.
     ======================================================================= */
  var barn = {
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

  /* =======================================================================
     2 — THE POOL DECK
     Bright, blue, and hot. Cats on loungers, one asleep on a lilo.
     ======================================================================= */
  var pool = {
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

  /* =======================================================================
     3 — THE ORCHARD
     Golden hour, three depths of trees, chickens who could not care less.
     ======================================================================= */
  var orchard = {
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

  /* =======================================================================
     4 — MOUNTAIN RETREAT
     Night. A campfire, fireflies, and granite. The quiet one.
     ======================================================================= */
  var retreat = {
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

  /* =======================================================================
     5 — THE FARMHOUSE KITCHEN
     Warm, domestic, and busy. Something is always on the stove.
     ======================================================================= */
  var kitchen = {
    id: 'kitchen', name: 'THE FARMHOUSE KITCHEN',
    blurb: 'Something is on the stove and something is going off the counter.',
    /* the colour of the air here — see K.deepen */
    air: { air: '#caa87c', haze: 0.06, floorDark: 0.34, horizon: 130 },
    init: function () {
      this.flour = new P({ count: 22, kind: 'dust', depth: 0.7, seed: 55,
                           band: [30, FLOOR_Y], vx: 0.05, vy: 0.06,
                           size: 1.4, color: 'rgba(255,248,226,.95)', wobble: 1.5 });
    },
    drawBack: function (ctx, camX, t, mood) {
      K.sky(ctx, [[0, '#f2e6cd'], [0.6, '#e3d2b4'], [1, '#cdb995']], 0, FLOOR_Y);

      /* tongue-and-groove behind everything, with real variation */
      K.layer(ctx, camX, 0.14, function () {
        K.repeatX(camX, 0, 15, function (x, i) {
          ctx.fillStyle = 'rgba(120,92,58,' + K.vary(i, 130, 0.04, 0.14).toFixed(3) + ')';
          ctx.fillRect(x, 0, 15, FLOOR_Y);
          ctx.fillStyle = 'rgba(255,255,255,.05)';
          ctx.fillRect(x, 0, 1.5, FLOOR_Y);
        });
      });

      /* --- THE SECOND LANDMARK: the big sash window over the sink, with the
             evening outside it and the light coming through. A room with no
             window in it has no light source, which is why this stage read as
             a flat wall of wood however much was hung on it. --- */
      K.layer(ctx, camX, 0.24, function () {
        var wx2 = K.at(camX, 0, 200);
        /* the reveal, and the sky through it */
        K.mass(ctx, wx2 - 38, 22, 76, 78, '#8a6a44', { top: 0, side: 6, foot: false });
        var g2 = ctx.createLinearGradient(0, 32, 0, 94);
        g2.addColorStop(0, '#f6c98a');
        g2.addColorStop(0.55, '#f3ab72');
        g2.addColorStop(1, '#cf8f74');
        ctx.fillStyle = g2;
        ctx.fillRect(wx2 - 33, 28, 66, 66);
        /* what you can see out of it: the hills and a line of poplars */
        ctx.fillStyle = '#a97a63';
        ctx.beginPath();
        ctx.moveTo(wx2 - 33, 94);
        for (var hx2 = -33; hx2 <= 33; hx2 += 6) {
          ctx.lineTo(wx2 + hx2, 78 - Math.sin(hx2 * 0.06) * 5 - Math.sin(hx2 * 0.15) * 2);
        }
        ctx.lineTo(wx2 + 33, 94); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#7e5a4e';
        for (var pl = 0; pl < 5; pl++) {
          var px3 = wx2 - 26 + pl * 13 + (pl % 2) * 3;
          ctx.beginPath();
          ctx.ellipse(px3, 70 - (pl % 3) * 4, 3.4, 11 + (pl % 3) * 3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        /* the bars */
        ctx.fillStyle = '#7a5c3c';
        ctx.fillRect(wx2 - 2, 28, 4, 66);
        ctx.fillRect(wx2 - 33, 58, 66, 4);
        ctx.fillStyle = 'rgba(255,240,205,.20)';   /* the glass */
        ctx.beginPath();
        ctx.moveTo(wx2 - 33, 28); ctx.lineTo(wx2 - 4, 28);
        ctx.lineTo(wx2 - 33, 72); ctx.closePath(); ctx.fill();
        /* the sill, with a jar of something on it */
        ctx.fillStyle = '#c2a67e';
        ctx.fillRect(wx2 - 42, 94, 84, 6);
        ctx.fillStyle = 'rgba(255,255,255,.16)';
        ctx.fillRect(wx2 - 42, 94, 84, 1.5);
        K.mass(ctx, wx2 + 22, 84, 10, 10, '#6fae4c', { top: 2, side: 2 });
        /* and the light it throws across the room and down onto the boards */
        K.spill(ctx, wx2 - 32, 100, 64, FLOOR_Y - 100, 'rgba(255,214,150,.75)', 0.38);
      });

      /* --- the landmark: the range, with a pot going on it --- */
      K.layer(ctx, camX, 0.3, function () {
        var rx = K.at(camX, 0, 120);
        ctx.fillStyle = '#4a4a52';
        ctx.fillRect(rx - 42, 96, 84, FLOOR_Y - 96);
        ctx.fillStyle = '#5c5c66';
        ctx.fillRect(rx - 42, 96, 84, 7);
        ctx.fillStyle = '#33333a';
        ctx.fillRect(rx - 34, 116, 68, 34);
        /* the oven door glowing */
        var fl = 0.72 + 0.28 * Math.sin(t * 0.08);
        ctx.fillStyle = 'rgba(255,150,60,' + (0.55 * fl).toFixed(2) + ')';
        ctx.fillRect(rx - 30, 120, 60, 26);
        K.glow(ctx, rx, 133, 46, 'rgba(255,150,60,.9)', 0.24 * fl);
        ctx.strokeStyle = '#8a8a95'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(rx - 34, 112); ctx.lineTo(rx + 34, 112); ctx.stroke();
        /* the pot, lid rattling */
        var lid = Math.sin(t * 0.22) * 1.2;
        ctx.fillStyle = '#6b7078';
        ctx.beginPath();
        ctx.ellipse(rx - 12, 92, 15, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8b9098';
        ctx.beginPath();
        ctx.ellipse(rx - 12, 86 + lid, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
        K.plume(ctx, rx - 12, 82, t, { w: 12, h: 44, alpha: 0.3 });
        /* a kettle beside it */
        ctx.fillStyle = '#a8464a';
        ctx.beginPath();
        ctx.ellipse(rx + 22, 90, 11, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#a8464a'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(rx + 22, 84, 8, Math.PI, 0); ctx.stroke();
      });

      /* --- the dresser: shelves of jars, no two alike --- */
      K.layer(ctx, camX, 0.34, function () {
        var dx = K.at(camX, 0, 290);
        ctx.fillStyle = '#8a6339';
        ctx.fillRect(dx - 56, 54, 112, 6);
        ctx.fillRect(dx - 56, 86, 112, 6);
        ctx.fillRect(dx - 56, 118, 112, 6);
        for (var row = 0; row < 3; row++) {
          for (var q = 0; q < 8; q++) {
            var jx = dx - 50 + q * 13.4;
            if (K.chance(row * 8 + q, 131, 0.18)) continue;
            var jh = K.vary(row * 8 + q, 132, 10, 24);
            var jw = K.vary(row * 8 + q, 133, 4.4, 6.4);
            var jy = 54 + row * 32 - jh;
            ctx.fillStyle = K.pick(row * 8 + q, 134,
              ['#c98a3a', '#8ab55e', '#c95a5a', '#6b9ec9', '#d9c05a', '#a86bc9']);
            ctx.globalAlpha = 0.85;
            ctx.fillRect(jx, jy, jw, jh);
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(255,255,255,.22)';
            ctx.fillRect(jx, jy, 1.4, jh);
            ctx.fillStyle = '#5c4630';
            ctx.fillRect(jx - 0.6, jy - 2.4, jw + 1.2, 2.4);
          }
        }
      });

      /* --- the window, with a real view and light falling in --- */
      K.layer(ctx, camX, 0.22, function () {
        var wx = K.at(camX, 0, 470);
        ctx.fillStyle = '#6b4a2e';
        ctx.fillRect(wx - 34, 26, 68, 62);
        ctx.fillStyle = '#a8cfe0';
        ctx.fillRect(wx - 30, 30, 60, 54);
        ctx.fillStyle = '#7fae5e';
        ctx.fillRect(wx - 30, 62, 60, 22);
        ctx.fillStyle = '#5f8f42';
        for (var b2 = 0; b2 < 4; b2++) {
          ctx.beginPath();
          ctx.arc(wx - 24 + b2 * 16, 64, K.vary(b2, 135, 6, 10), 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#6b4a2e';
        ctx.fillRect(wx - 1.6, 30, 3.2, 54);
        ctx.fillRect(wx - 30, 55, 60, 3.2);
        K.spill(ctx, wx - 28, 88, 56, FLOOR_Y - 88, 'rgba(255,244,200,.6)', 0.26);
      });

      /* --- the worktop, and what has been left on it --- */
      K.layer(ctx, camX, 0.5, function () {
        var cx2 = K.at(camX, 0, 250);
        ctx.fillStyle = '#c9a875';
        ctx.fillRect(cx2 - 70, 138, 140, 8);
        ctx.fillStyle = '#a8874f';
        ctx.fillRect(cx2 - 70, 146, 140, FLOOR_Y - 146);
        ctx.fillStyle = 'rgba(0,0,0,.16)';
        for (var d2 = 0; d2 < 3; d2++) ctx.fillRect(cx2 - 62 + d2 * 46, 152, 40, 16);
        /* a bowl, a jug, and one thing on the very edge */
        ctx.fillStyle = '#e8ddc8';
        ctx.beginPath(); ctx.ellipse(cx2 - 40, 136, 13, 6, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#7fa8c9';
        ctx.fillRect(cx2 + 10, 122, 14, 16);
        ctx.beginPath(); ctx.ellipse(cx2 + 17, 122, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
        var nudge = Math.max(0, Math.sin(t * 0.02)) * 5;
        ctx.fillStyle = '#c95a5a';
        ctx.beginPath();
        ctx.arc(cx2 + 62 + nudge, 133, 4.4, 0, Math.PI * 2); ctx.fill();
        K.spectator(ctx, cx2 + 50, 138, 0.8, 77, t, mood);
      });

      /* --- pans overhead, at different lengths --- */
      K.layer(ctx, camX, 0.6, function () {
        ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(-20, 22); ctx.lineTo(W + 20, 22); ctx.stroke();
        K.repeatX(camX, 0, 44, function (x, i) {
          if (K.chance(i, 136, 0.2)) return;
          var hang = K.vary(i, 137, 12, 30);
          var sw = K.sway(t, 0.012, 1.6, i);
          ctx.strokeStyle = '#5c5c66'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(x, 22); ctx.lineTo(x + sw, 22 + hang); ctx.stroke();
          var pr = K.vary(i, 138, 6, 11);
          ctx.fillStyle = K.pick(i, 139, ['#8b6b3f', '#7a7f88', '#a8464a', '#5c5c66']);
          ctx.beginPath();
          ctx.arc(x + sw, 22 + hang + pr, pr, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.18)';
          ctx.beginPath();
          ctx.arc(x + sw - pr * 0.3, 22 + hang + pr * 0.7, pr * 0.4, 0, Math.PI * 2); ctx.fill();
        });
      });

      /* --- the frame: the end of the dresser on one side, a doorway through
             to somewhere warmer on the other --- */
      K.layer(ctx, camX, 0.88, function () {
        var d = camX * 0.05;
        var dx2 = -14 - d;
        ctx.fillStyle = '#5c4025';
        ctx.fillRect(dx2, -10, 46, H + 20);
        ctx.fillStyle = '#6e4d2d';
        ctx.fillRect(dx2 + 40, -10, 8, H + 20);
        ctx.fillStyle = 'rgba(0,0,0,.28)';
        for (var q = 0; q < 4; q++) ctx.fillRect(dx2 + 4, 26 + q * 48, 34, 34);
        ctx.fillStyle = '#caa25c';
        for (var q2 = 0; q2 < 4; q2++) {
          ctx.beginPath();
          ctx.arc(dx2 + 32, 43 + q2 * 48, 2.4, 0, Math.PI * 2); ctx.fill();
        }

        var ox = W + 14 + d;
        ctx.fillStyle = '#4a3524';
        ctx.fillRect(ox - 54, -10, 60, H + 20);
        ctx.fillStyle = '#f2d9a4';
        ctx.fillRect(ox - 46, 24, 40, H - 24);
        K.spill(ctx, ox - 46, H - 40, 40, 60, 'rgba(255,232,180,.7)', 0.3);
        ctx.fillStyle = '#4a3524';
        ctx.fillRect(ox - 50, 20, 48, 6);
      });

      K.grain(ctx, camX, 62, ['#6a4728', '#a97b48'], 0.1);
      K.floorPool(ctx, W * 0.55, 200, 'rgba(255,226,160,.6)', 0.34);
      K.litter(ctx, camX, 1, 52, ['rgba(210,180,120,.45)', 'rgba(140,110,70,.4)'], 0.7, 1.8);
      this.flour.update();
      this.flour.draw(ctx, camX, t);
    },
    drawFore: function (ctx, camX, t) {
      /* pans hanging from a rail across the top of frame */
      K.layer(ctx, camX, 1.3, function () {
        ctx.fillStyle = '#6b5238'; ctx.fillRect(0, 6, W, 4);
        K.repeatX(camX, 0, 48, function (x, i) {
          var sw = K.sway(t, 0.02, 2.6, i);
          ctx.strokeStyle = 'rgba(40,32,24,.8)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x + sw, 20); ctx.stroke();
          ctx.fillStyle = ['#8a8a92', '#b0752f', '#c9c9d2'][Math.abs(i) % 3];
          ctx.beginPath(); ctx.arc(x + sw, 28, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.28)';
          ctx.beginPath(); ctx.arc(x + sw - 3, 25, 3.4, 0, Math.PI * 2); ctx.fill();
        });
      });
      K.vignette(ctx, 0.28);
    }
  };

  /* =======================================================================
     6 — THE FRONT PORCH
     Sunset into dusk. A windmill turning, moths at the lantern.
     ======================================================================= */
  var porch = {
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

  var STAGES = [barn, pool, orchard, retreat, kitchen, porch];
  STAGES.forEach(function (s) { if (s.init) s.init(); });

  CF.Stages = STAGES;
  CF.STAGE = { W: W, H: H, FLOOR_Y: FLOOR_Y };
})();
