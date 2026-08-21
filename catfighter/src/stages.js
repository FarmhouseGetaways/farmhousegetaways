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
    init: function () {
      this.dust = new P({ count: 30, kind: 'dust', depth: 0.75, seed: 11,
                          band: [24, FLOOR_Y - 6], vx: 0.06, vy: -0.03,
                          size: 1.3, color: 'rgba(255,226,168,.85)', wobble: 1.4 });
    },
    drawBack: function (ctx, camX, t, mood) {
      /* --- the far wall: boards, not a flat field --- */
      K.sky(ctx, [[0, '#25121f'], [0.45, '#4d2432'], [1, '#7d3d33']], 0, FLOOR_Y);
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

      /* --- the loft window, and the light that falls out of it --- */
      K.layer(ctx, camX, 0.22, function () {
        var wx = K.at(camX, 0, 250);
        ctx.fillStyle = '#1a1020';
        ctx.fillRect(wx - 26, 12, 52, 34);
        ctx.fillStyle = '#5b7fb8';
        ctx.fillRect(wx - 23, 15, 46, 28);
        ctx.fillStyle = 'rgba(20,12,26,.85)';
        ctx.fillRect(wx - 1.5, 15, 3, 28);
        ctx.fillRect(wx - 23, 27.5, 46, 3);
        K.spill(ctx, wx - 22, 44, 44, FLOOR_Y - 44, 'rgba(150,185,235,.5)', 0.22);
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
          /* the cabinet */
          ctx.fillStyle = body;
          ctx.fillRect(x, top, wdt, bh + 22);
          ctx.fillStyle = 'rgba(0,0,0,.34)';
          ctx.fillRect(x + wdt - 6, top, 6, bh + 22);
          ctx.fillStyle = 'rgba(255,255,255,.07)';
          ctx.fillRect(x, top, 3, bh + 22);
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
        ctx.fillStyle = '#b8342f';
        ctx.fillRect(cx - 30, FLOOR_Y - 96, 60, 96);
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        ctx.fillRect(cx + 22, FLOOR_Y - 96, 8, 96);
        /* the glass box of prizes */
        ctx.fillStyle = '#1d2740';
        ctx.fillRect(cx - 25, FLOOR_Y - 88, 47, 52);
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
            ctx.fillStyle = K.pick(i * 3 + lvl, 62, ['#c9a24a', '#bf9743', '#d3ac54']);
            ctx.fillRect(x + lvl * 5, by - 26, bw, 26);
            ctx.fillStyle = 'rgba(255,255,255,.10)';
            ctx.fillRect(x + lvl * 5, by - 26, bw, 4);
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
          ctx.fillStyle = '#3d2418';
          ctx.beginPath();
          ctx.moveTo(ex, H);
          ctx.lineTo(ex, -10);
          ctx.lineTo(ex + dir * 50, -10);
          ctx.lineTo(ex + dir * 42, 44);
          ctx.lineTo(ex + dir * 38, H);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = 'rgba(255,220,160,.07)';
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
        ctx.fillStyle = '#33200f';
        ctx.beginPath();
        ctx.moveTo(-20, -10); ctx.lineTo(W + 20, -10);
        ctx.lineTo(W + 20, 16); ctx.lineTo(-20, 22);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,220,160,.07)';
        ctx.fillRect(-20, 14, W + 40, 3);
      });

      /* --- the floor --- */
      K.grain(ctx, camX, 56, ['#5f4028', '#9a6c42'], 0.1);
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
      K.vignette(ctx, 0.38);
    }
  };

  /* =======================================================================
     2 — THE POOL DECK
     Bright, blue, and hot. Cats on loungers, one asleep on a lilo.
     ======================================================================= */
  var pool = {
    id: 'pool', name: 'THE POOL DECK',
    blurb: 'Hot, blue, and somebody is asleep on the flamingo.',
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

      /* --- the landmark: a water slide coming down off the hill, with a
             lifeguard chair beside it. Fixed in the world, so the eye has
             somewhere to go back to. --- */
      K.layer(ctx, camX, 0.3, function () {
        var sx = K.at(camX, 0, 78);
        ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 9; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx - 26, 112);
        ctx.quadraticCurveTo(sx + 6, 128, sx - 4, 152);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx - 26, 110);
        ctx.quadraticCurveTo(sx + 4, 126, sx - 6, 150);
        ctx.stroke();
        ctx.strokeStyle = '#c8891f'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(sx - 22, 122); ctx.lineTo(sx - 22, 152);
        ctx.moveTo(sx - 2, 138); ctx.lineTo(sx - 2, 152); ctx.stroke();
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
      K.vignette(ctx, 0.30);
    }
  };

  /* =======================================================================
     4 — MOUNTAIN RETREAT
     Night. A campfire, fireflies, and granite. The quiet one.
     ======================================================================= */
  var retreat = {
    id: 'retreat', name: 'MOUNTAIN RETREAT',
    blurb: 'Night on the granite. Firelight, fireflies, and bats over the moon.',
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
      K.sky(ctx, [[0, '#0a0e26'], [0.5, '#1c2145'], [1, '#3b2f4e']], 0, 150);

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

      /* --- the landmark: a lean-to shelter with a lamp burning in it, up on
             the granite. Somewhere for the eye to rest in all that dark. --- */
      K.layer(ctx, camX, 0.4, function () {
        var hx = K.at(camX, 0, 300);
        ctx.fillStyle = '#2b2438';
        ctx.beginPath();
        ctx.moveTo(hx - 34, 162); ctx.lineTo(hx - 26, 126);
        ctx.lineTo(hx + 30, 134); ctx.lineTo(hx + 34, 162);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3c3149';
        ctx.beginPath();
        ctx.moveTo(hx - 40, 128); ctx.lineTo(hx - 22, 118);
        ctx.lineTo(hx + 36, 128); ctx.lineTo(hx + 18, 137);
        ctx.closePath(); ctx.fill();
        /* the doorway, and the lamp inside it */
        ctx.fillStyle = '#12101c';
        ctx.fillRect(hx - 10, 140, 20, 22);
        var flick = 0.7 + 0.3 * Math.sin(t * 0.13) * Math.sin(t * 0.31);
        K.glow(ctx, hx, 148, 26, 'rgba(255,186,90,.95)', 0.38 * flick);
        ctx.fillStyle = 'rgba(255,206,130,' + (0.7 * flick).toFixed(2) + ')';
        ctx.fillRect(hx - 7, 143, 14, 16);
        K.spill(ctx, hx - 9, 162, 18, H - 162, 'rgba(255,186,90,.6)', 0.2 * flick);
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
      K.ground(ctx, camX, '#2c2a38', '#413e4f', 0.14);
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
      K.vignette(ctx, 0.46);
    }
  };

  /* =======================================================================
     5 — THE FARMHOUSE KITCHEN
     Warm, domestic, and busy. Something is always on the stove.
     ======================================================================= */
  var kitchen = {
    id: 'kitchen', name: 'THE FARMHOUSE KITCHEN',
    blurb: 'Something is on the stove and something is going off the counter.',
    init: function () {
      this.flour = new P({ count: 22, kind: 'dust', depth: 0.7, seed: 55,
                           band: [30, FLOOR_Y], vx: 0.05, vy: 0.06,
                           size: 1.4, color: 'rgba(255,248,226,.95)', wobble: 1.5 });
    },
    drawBack: function (ctx, camX, t, mood) {
      K.sky(ctx, [[0, '#e4d6bd'], [0.6, '#d6c5a8'], [1, '#c2ad8c']], 0, FLOOR_Y);

      /* tongue-and-groove behind everything, with real variation */
      K.layer(ctx, camX, 0.14, function () {
        K.repeatX(camX, 0, 15, function (x, i) {
          ctx.fillStyle = 'rgba(120,92,58,' + K.vary(i, 130, 0.04, 0.14).toFixed(3) + ')';
          ctx.fillRect(x, 0, 15, FLOOR_Y);
          ctx.fillStyle = 'rgba(255,255,255,.05)';
          ctx.fillRect(x, 0, 1.5, FLOOR_Y);
        });
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

      K.grain(ctx, camX, 62, ['#7a5330', '#b1834e'], 0.1);
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

      /* --- the landmark: the windmill on the ridge, turning --- */
      K.layer(ctx, camX, 0.13, function () {
        var mx = K.at(camX, 0, 300);
        ctx.strokeStyle = '#2e2440'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(mx - 7, 146); ctx.lineTo(mx - 1, 104);
        ctx.moveTo(mx + 7, 146); ctx.lineTo(mx + 1, 104);
        ctx.moveTo(mx - 5, 132); ctx.lineTo(mx + 5, 132);
        ctx.moveTo(mx - 3, 118); ctx.lineTo(mx + 3, 118);
        ctx.stroke();
        ctx.save();
        ctx.translate(mx, 102);
        ctx.rotate(t * 0.02);
        ctx.strokeStyle = '#2e2440'; ctx.lineWidth = 1.6;
        for (var q = 0; q < 8; q++) {
          ctx.rotate(Math.PI / 4);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11, 0); ctx.stroke();
        }
        ctx.restore();
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

      K.grain(ctx, camX, 60, ['#5f4530', '#976f49'], 0.1);
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
      K.vignette(ctx, 0.34);
    }
  };

  var STAGES = [barn, pool, orchard, retreat, kitchen, porch];
  STAGES.forEach(function (s) { if (s.init) s.init(); });

  CF.Stages = STAGES;
  CF.STAGE = { W: W, H: H, FLOOR_Y: FLOOR_Y };
})();
