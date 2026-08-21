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
      /* --- the far wall --- */
      K.sky(ctx, [[0, '#2a1524'], [0.5, '#5b2a38'], [1, '#8a4436']], 0, FLOOR_Y);
      K.layer(ctx, camX, 0.18, function () {
        K.repeatX(camX, 0, 34, function (x, i) {
          ctx.fillStyle = i % 2 ? 'rgba(0,0,0,.16)' : 'rgba(0,0,0,.09)';
          ctx.fillRect(x, 0, 34, FLOOR_Y);
        });
      });

      /* --- roof trusses, receding --- */
      K.layer(ctx, camX, 0.26, function () {
        ctx.strokeStyle = '#4a2b22'; ctx.lineWidth = 3;
        K.repeatX(camX, 0, 96, function (x) {
          ctx.beginPath();
          ctx.moveTo(x - 46, 26); ctx.lineTo(x, 6); ctx.lineTo(x + 46, 26);
          ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - 46, 26); ctx.lineTo(x + 46, 26); ctx.stroke();
        });
      });

      /* --- arcade machines along the back wall, screens alive --- */
      K.layer(ctx, camX, 0.42, function () {
        K.repeatX(camX, 0, 62, function (x, i) {
          var h = K.hash(i, 1);
          var top = 92, bh = 66;
          ctx.fillStyle = ['#2f3a6b', '#6b2f4a', '#2f6b4a', '#6b5a2f'][Math.abs(i) % 4];
          ctx.fillRect(x, top, 40, bh);
          ctx.fillStyle = 'rgba(0,0,0,.3)';
          ctx.fillRect(x + 34, top, 6, bh);
          /* marquee */
          ctx.fillStyle = ['#ffd166', '#ff7a8a', '#8fe6ff', '#b6ff8f'][Math.abs(i + 1) % 4];
          ctx.fillRect(x + 2, top + 2, 36, 7);
          /* screen — scrolling bars, each cabinet at its own rate */
          ctx.fillStyle = '#0d0f18';
          ctx.fillRect(x + 4, top + 12, 32, 22);
          for (var b = 0; b < 5; b++) {
            var sy = top + 13 + ((b * 5 + t * (0.5 + h)) % 20);
            ctx.globalAlpha = 0.75;
            ctx.fillStyle = ['#ff5b7a', '#ffd166', '#6fe3a0', '#7ab6ff'][(b + Math.abs(i)) % 4];
            ctx.fillRect(x + 5, sy, 30, 2.2);
            ctx.globalAlpha = 1;
          }
          /* control panel and a glowing joystick ball */
          ctx.fillStyle = 'rgba(0,0,0,.34)';
          ctx.fillRect(x + 2, top + 38, 36, 8);
          ctx.fillStyle = '#ff5b5b';
          ctx.beginPath(); ctx.arc(x + 11, top + 42, 2, 0, Math.PI * 2); ctx.fill();
          K.glow(ctx, x + 20, top + 23, 22, 'rgba(160,190,255,.5)', 0.22);
        });
      });

      /* --- hay bales and the crowd on top of them --- */
      K.layer(ctx, camX, 0.62, function () {
        K.repeatX(camX, 0, 74, function (x, i) {
          var by = FLOOR_Y - 4;
          ctx.fillStyle = '#c9a24a';
          ctx.fillRect(x, by - 26, 46, 26);
          ctx.fillStyle = '#b08b38';
          ctx.fillRect(x, by - 26, 46, 4);
          ctx.strokeStyle = 'rgba(90,64,20,.55)'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(x + 12, by - 26); ctx.lineTo(x + 12, by);
          ctx.moveTo(x + 34, by - 26); ctx.lineTo(x + 34, by); ctx.stroke();
          /* two spectators per bale, at slightly different scales */
          K.spectator(ctx, x + 13, by - 26, 1.02, i * 2, t, mood);
          K.spectator(ctx, x + 33, by - 26, 0.88, i * 2 + 1, t + 40, mood);
        });
      });

      K.planks(ctx, camX, '#6b4a2e', '#966b42', 52);
      /* light pools on the floor from the string lights */
      K.repeatX(camX, 1, 92, function (x) {
        K.glow(ctx, x, FLOOR_Y + 16, 46, 'rgba(255,196,110,.55)', 0.14);
      });
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
      K.sky(ctx, [[0, '#0d63a8'], [0.45, '#4fa8dd'], [0.8, '#a8dcf0'], [1, '#e6f4f7']], 0, FLOOR_Y);

      /* sun with a slow flare */
      K.glow(ctx, 302 - camX * 0.04, 40, 58, 'rgba(255,244,180,.9)', 0.5);
      ctx.fillStyle = '#fff8d4';
      ctx.beginPath(); ctx.arc(302 - camX * 0.04, 40, 17, 0, Math.PI * 2); ctx.fill();

      /* drifting clouds */
      K.layer(ctx, camX, 0.06, function () {
        K.repeatX(camX, 0, 150, function (x, i) {
          var cy = 26 + K.hash(i, 5) * 34;
          var cx = x + t * 0.09 % 150;
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy, 13, 0, Math.PI * 2);
          ctx.arc(cx + 14, cy + 3, 10, 0, Math.PI * 2);
          ctx.arc(cx - 13, cy + 4, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      });

      /* birds */
      for (var b = 0; b < 4; b++) {
        var bx = ((t * 0.25 + b * 110) % (W + 80)) - 40;
        K.bird(ctx, bx, 34 + b * 9 + Math.sin(t * 0.02 + b) * 4, 1.1, t, b * 2, 'rgba(30,50,80,.5)');
      }

      K.hills(ctx, camX, 0.10, '#8fae72', 128, 18, 0);
      K.hills(ctx, camX, 0.22, '#5f8a56', 146, 12, 420);

      /* vineyard rows on the slope */
      K.layer(ctx, camX, 0.36, function () {
        K.repeatX(camX, 0, 26, function (x, i) {
          ctx.strokeStyle = 'rgba(42,76,44,.75)'; ctx.lineWidth = 2.2;
          ctx.beginPath(); ctx.moveTo(x, 148); ctx.lineTo(x - 7, 166); ctx.stroke();
          ctx.fillStyle = 'rgba(58,102,54,.85)';
          ctx.beginPath(); ctx.ellipse(x - 3, 156, 5, 3.4, -0.4, 0, Math.PI * 2); ctx.fill();
        });
      });

      /* loungers with cats on them, plus a parasol */
      /* far deck, on the other side of the pool */
      ctx.fillStyle = '#ddd2b8';
      ctx.fillRect(0, FLOOR_Y - 34, W, 15);
      ctx.fillStyle = 'rgba(0,0,0,.07)';
      ctx.fillRect(0, FLOOR_Y - 22, W, 3);
      K.layer(ctx, camX, 0.58, function () {
        K.repeatX(camX, 0, 118, function (x, i) {
          var ly = FLOOR_Y - 24;
          /* parasol */
          var px = x + 74, tilt = K.sway(t, 0.012, 0.04, i);
          ctx.save(); ctx.translate(px, ly); ctx.rotate(tilt);
          ctx.strokeStyle = '#c9bda6'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -34); ctx.stroke();
          ctx.fillStyle = Math.abs(i) % 2 ? '#e8574a' : '#f0b429';
          ctx.beginPath();
          ctx.moveTo(-22, -34); ctx.quadraticCurveTo(0, -46, 22, -34);
          ctx.quadraticCurveTo(0, -30, -22, -34); ctx.closePath(); ctx.fill();
          ctx.restore();
          /* lounger */
          ctx.fillStyle = '#f2ede2';
          ctx.save(); ctx.translate(x, ly); ctx.rotate(-0.18);
          ctx.fillRect(0, -5, 30, 5);
          ctx.restore();
          ctx.fillStyle = '#d8d2c4';
          ctx.fillRect(x + 2, ly, 3, 8); ctx.fillRect(x + 24, ly, 3, 8);
          /* the cat on it, sunbathing rather than watching */
          K.spectator(ctx, x + 15, ly - 3, 0.72, i * 3 + 7, t, mood * 0.4);
        });
      });

      /* the pool, right behind the fighters */
      K.water(ctx, 0, FLOOR_Y - 20, W, 20, t, '#1d78ad', '#57bfe4', 'rgba(255,255,255,.6)');
      /* an inflatable flamingo, bobbing, with a cat asleep on it */
      var fx = ((t * 0.16) % (W + 120)) - 60;
      var fy = FLOOR_Y - 14 + Math.sin(t * 0.045) * 1.6;
      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(Math.sin(t * 0.04) * 0.05);
      ctx.fillStyle = '#ff8fb0';
      ctx.beginPath(); ctx.ellipse(0, 0, 17, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-12, -7, 3.4, 6, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-14, -13, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#241c18';
      ctx.beginPath(); ctx.arc(-15, -13.6, 0.7, 0, Math.PI * 2); ctx.fill();
      K.spectator(ctx, 3, -4, 0.6, 99, t * 0.4, 0);
      ctx.restore();

      K.ground(ctx, camX, '#cbbfa6', '#eee4cf', 0.08);
      this.sparkle.update(); this.sparkle.draw(ctx, camX, t);
      this.heat.update();   this.heat.draw(ctx, camX, t);
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
      K.sky(ctx, [[0, '#e07a4a'], [0.35, '#f0a95e'], [0.7, '#f7d79a'], [1, '#fdf1d6']], 0, FLOOR_Y);

      /* low sun and long rays */
      var sx = 96 - camX * 0.03;
      K.glow(ctx, sx, 120, 90, 'rgba(255,214,120,.95)', 0.42);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (var r = 0; r < 9; r++) {
        ctx.globalAlpha = 0.045 + 0.02 * Math.sin(t * 0.014 + r);
        ctx.fillStyle = '#ffe3a0';
        ctx.save(); ctx.translate(sx, 120); ctx.rotate(-1.1 + r * 0.26);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(400, -16); ctx.lineTo(400, 16); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      ctx.fillStyle = '#fff2cc';
      ctx.beginPath(); ctx.arc(sx, 120, 20, 0, Math.PI * 2); ctx.fill();

      K.hills(ctx, camX, 0.08, 'rgba(170,120,80,.75)', 132, 16, 90);

      /* three ranks of trees, each swaying at its own rate */
      K.layer(ctx, camX, 0.20, function () {
        K.repeatX(camX, 0, 52, function (x, i) {
          K.tree(ctx, x, FLOOR_Y - 16, 0.62, '#7a5638', '#5d7a3c', null, t, i);
        });
      });
      K.layer(ctx, camX, 0.42, function () {
        K.repeatX(camX, 0, 78, function (x, i) {
          K.tree(ctx, x, FLOOR_Y - 6, 0.95, '#6b4a2c', '#4f7a3a', '#68954a', t * 1.2, i * 2);
        });
      });

      /* the fence, and cats sitting along it */
      K.layer(ctx, camX, 0.66, function () {
        K.repeatX(camX, 0, 44, function (x, i) {
          ctx.fillStyle = '#c9b48c';
          ctx.fillRect(x, FLOOR_Y - 30, 4, 30);
          ctx.fillRect(x - 20, FLOOR_Y - 26, 44, 3.4);
          ctx.fillRect(x - 20, FLOOR_Y - 16, 44, 3.4);
          if (Math.abs(i) % 2 === 0) K.spectator(ctx, x + 12, FLOOR_Y - 26, 0.94, i, t, mood);
        });
      });

      K.ground(ctx, camX, '#6f8a42', '#a2bc63', 0.10);

      /* chickens, doing their own thing on the grass */
      K.layer(ctx, camX, 1, function () {
        K.repeatX(camX, 1, 132, function (x, i) {
          var wander = Math.sin(t * 0.008 + i * 2.1) * 26;
          K.chicken(ctx, x + wander, FLOOR_Y + 12 + (Math.abs(i) % 3) * 7,
                    0.95, t, i * 1.7,
                    ['#f4efe4', '#d8a45a', '#e8ded0'][Math.abs(i) % 3]);
        });
      });

      this.motes.update();  this.motes.draw(ctx, camX, t);
      this.petals.update(); this.petals.draw(ctx, camX, t);
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
      K.sky(ctx, [[0, '#080d1e'], [0.4, '#1c2a52'], [0.75, '#4a3f72'], [1, '#8a5f76']], 0, FLOOR_Y);

      /* stars */
      for (var s = 0; s < 70; s++) {
        var stx = ((s * 137 - camX * 0.03) % (W + 20) + W + 20) % (W + 20);
        var sty = (s * 53) % 118 + 4;
        var tw = 0.25 + 0.6 * Math.abs(Math.sin(t * 0.02 + s * 1.3));
        ctx.globalAlpha = tw;
        ctx.fillStyle = s % 9 === 0 ? '#ffd9a0' : '#ffffff';
        var sz = s % 11 === 0 ? 1.8 : 1.1;
        ctx.fillRect(stx, sty, sz, sz);
      }
      ctx.globalAlpha = 1;

      /* an occasional shooting star */
      var sh = this.shoot;
      if (sh.t < 0 && (t % 420 | 0) === 0) { sh.t = 0; sh.x = 60 + (t * 7 % 240); sh.y = 18 + (t * 3 % 50); }
      if (sh.t >= 0) {
        sh.t++;
        var k = sh.t / 34;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - k);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sh.x + k * 130, sh.y + k * 52);
        ctx.lineTo(sh.x + k * 130 - 26, sh.y + k * 52 - 10);
        ctx.stroke();
        ctx.restore();
        if (sh.t > 34) sh.t = -1;
      }

      /* moon with a halo */
      var mx = 74 - camX * 0.025;
      K.glow(ctx, mx, 38, 46, 'rgba(220,230,255,.75)', 0.35);
      ctx.fillStyle = '#f4f2dc';
      ctx.beginPath(); ctx.arc(mx, 38, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(190,190,170,.5)';
      ctx.beginPath(); ctx.arc(mx + 5, 34, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx - 4, 43, 2.4, 0, Math.PI * 2); ctx.fill();

      /* bats crossing the moon */
      for (var b = 0; b < 3; b++) {
        var bx = ((t * 0.42 + b * 130) % (W + 90)) - 45;
        K.bird(ctx, bx, 52 + Math.sin(t * 0.04 + b * 2) * 12, 1.3, t * 2.2, b * 3, 'rgba(12,12,26,.85)');
      }

      K.ridge(ctx, camX, 0.07, '#161d38', 120, 34, 1);
      K.ridge(ctx, camX, 0.16, '#101627', 140, 24, 7);
      K.hills(ctx, camX, 0.30, '#0b0f1c', 156, 12, 300);

      /* pines */
      K.layer(ctx, camX, 0.44, function () {
        K.repeatX(camX, 0, 46, function (x, i) {
          var h = 26 + K.hash(i, 2) * 18;
          ctx.fillStyle = '#0c1420';
          ctx.beginPath();
          ctx.moveTo(x, FLOOR_Y - 8);
          ctx.lineTo(x + 9, FLOOR_Y - 8 - h);
          ctx.lineTo(x + 18, FLOOR_Y - 8);
          ctx.closePath(); ctx.fill();
        });
      });

      /* granite boulders */
      K.layer(ctx, camX, 0.68, function () {
        K.repeatX(camX, 0, 104, function (x, i) {
          ctx.fillStyle = '#3e3e4a';
          ctx.beginPath(); ctx.ellipse(x, FLOOR_Y - 4, 28, 17, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#51515e';
          ctx.beginPath(); ctx.ellipse(x - 7, FLOOR_Y - 11, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(150,160,190,.18)';
          ctx.beginPath(); ctx.ellipse(x - 11, FLOOR_Y - 15, 8, 4, -0.3, 0, Math.PI * 2); ctx.fill();
        });
      });

      /* the campfire, and the cats warming themselves at it */
      K.layer(ctx, camX, 0.78, function () {
        K.repeatX(camX, 0, 190, function (x, i) {
          var fy = FLOOR_Y - 6;
          ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x - 9, fy); ctx.lineTo(x + 7, fy - 9);
          ctx.moveTo(x + 9, fy); ctx.lineTo(x - 7, fy - 9);
          ctx.stroke();
          var flick = 0.72 + 0.28 * Math.sin(t * 0.28 + i) + 0.14 * Math.sin(t * 0.61 + i * 3);
          K.glow(ctx, x, fy - 12, 62, 'rgba(255,150,60,.85)', 0.34 * flick);
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          for (var f = 0; f < 3; f++) {
            var fh = (11 + f * 5) * flick;
            ctx.globalAlpha = 0.55 - f * 0.13;
            ctx.fillStyle = ['#ffd166', '#ff8a3c', '#e8442a'][f];
            ctx.beginPath();
            ctx.moveTo(x - 6 + f, fy - 4);
            ctx.quadraticCurveTo(x - 2 + Math.sin(t * 0.2 + f) * 2, fy - fh, x, fy - fh - 3);
            ctx.quadraticCurveTo(x + 2 + Math.sin(t * 0.23 + f) * 2, fy - fh, x + 6 - f, fy - 4);
            ctx.closePath(); ctx.fill();
          }
          ctx.restore();
          K.spectator(ctx, x - 34, fy, 0.98, i * 5, t, mood);
          K.spectator(ctx, x + 34, fy, 0.9, i * 5 + 2, t + 30, mood);
        });
      });

      K.ground(ctx, camX, '#2b2a33', '#474553', 0.16);
      this.embers.update(); this.embers.draw(ctx, camX, t);
      this.flies.update();  this.flies.draw(ctx, camX, t);
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
      K.sky(ctx, [[0, '#d8c3a2'], [1, '#f4e8d2']], 0, FLOOR_Y);

      /* wall panelling */
      K.layer(ctx, camX, 0.14, function () {
        K.repeatX(camX, 0, 22, function (x, i) {
          ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.16)' : 'rgba(150,120,90,.07)';
          ctx.fillRect(x, 0, 22, FLOOR_Y);
        });
      });

      /* the window, with the orchard visible through it and a light shaft */
      K.layer(ctx, camX, 0.28, function () {
        K.repeatX(camX, 0, 300, function (x) {
          var wx = x + 40, wy = 22, ww = 96, wh = 62;
          ctx.fillStyle = '#8fd0e8'; ctx.fillRect(wx, wy, ww, wh);
          var g = ctx.createLinearGradient(0, wy, 0, wy + wh);
          g.addColorStop(0, '#a8e0f2'); g.addColorStop(1, '#e6f2c9');
          ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh);
          ctx.fillStyle = 'rgba(80,130,70,.75)';
          for (var k = 0; k < 4; k++) {
            var tx = wx + 14 + k * 24;
            ctx.beginPath(); ctx.arc(tx, wy + wh - 12, 9 + (k % 2) * 3, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = 'rgba(90,150,80,.9)'; ctx.fillRect(wx, wy + wh - 8, ww, 8);
          ctx.strokeStyle = '#7a5638'; ctx.lineWidth = 4; ctx.strokeRect(wx, wy, ww, wh);
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh);
          ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2);
          ctx.stroke();
          K.lightShaft(ctx, wx + ww / 2 + 10, ww * 0.8, ww * 1.5,
                       'rgba(255,240,190,.55)', 0.34, wy + wh, H);
        });
      });

      /* open shelves with jars, and a clock whose hands actually move */
      K.layer(ctx, camX, 0.4, function () {
        K.repeatX(camX, 0, 300, function (x) {
          var sx = x + 176;
          ctx.fillStyle = '#8a6642'; ctx.fillRect(sx, 54, 84, 4);
          ctx.fillRect(sx, 86, 84, 4);
          for (var j = 0; j < 5; j++) {
            var jx = sx + 8 + j * 16;
            ctx.fillStyle = ['#d9a441', '#c96a5a', '#8fae72', '#d9c2a0', '#a88fc9'][j];
            ctx.fillRect(jx, 40, 10, 14);
            ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(jx + 1, 41, 3, 12);
            ctx.fillStyle = '#6b5238'; ctx.fillRect(jx - 1, 37, 12, 3.4);
          }
          for (var m = 0; m < 4; m++) {
            var mx2 = sx + 12 + m * 20;
            ctx.fillStyle = ['#8a8a92', '#b0752f', '#8a8a92', '#c9c9d2'][m];
            ctx.beginPath(); ctx.arc(mx2, 76, 7, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(mx2 - 1.4, 62, 2.8, 8);
          }
          /* the clock */
          var cx = sx - 46, cy = 30;
          ctx.fillStyle = '#f4ecd8';
          ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#7a5638'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
          var a1 = t * 0.004, a2 = t * 0.05;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a1) * 5, cy - Math.cos(a1) * 5); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a2) * 8, cy - Math.cos(a2) * 8); ctx.stroke();
        });
      });

      /* the range, with a pot boiling over */
      K.layer(ctx, camX, 0.58, function () {
        K.repeatX(camX, 0, 300, function (x) {
          var rx = x + 96, ry = FLOOR_Y - 4;
          ctx.fillStyle = '#4a4a56'; ctx.fillRect(rx, ry - 54, 74, 54);
          ctx.fillStyle = '#5e5e6c'; ctx.fillRect(rx + 3, ry - 51, 68, 12);
          ctx.fillStyle = '#2a2a34'; ctx.fillRect(rx + 6, ry - 34, 62, 26);
          /* oven glow, flickering */
          var fl = 0.6 + 0.4 * Math.sin(t * 0.09);
          K.glow(ctx, rx + 37, ry - 21, 30, 'rgba(255,140,50,.9)', 0.30 * fl);
          ctx.fillStyle = 'rgba(255,150,60,' + (0.45 * fl) + ')';
          ctx.fillRect(rx + 9, ry - 31, 56, 20);
          /* pot */
          ctx.fillStyle = '#8a8a92';
          ctx.fillRect(rx + 22, ry - 68, 30, 15);
          ctx.fillStyle = '#6e6e78'; ctx.fillRect(rx + 20, ry - 70, 34, 4);
          K.plume(ctx, rx + 37, ry - 70, t, { count: 7, rise: 54, drift: 12, size: 5,
                                              alpha: 0.30, speed: 0.010 });
        });
      });

      /* a cat on the counter, batting at something it shouldn't */
      K.layer(ctx, camX, 0.7, function () {
        K.repeatX(camX, 0, 300, function (x) {
          var cx = x + 246, cy = FLOOR_Y - 46;
          ctx.fillStyle = '#c9a87c'; ctx.fillRect(cx - 40, cy, 92, 8);
          ctx.fillStyle = '#a8845c'; ctx.fillRect(cx - 40, cy + 8, 92, 40);
          K.spectator(ctx, cx, cy, 0.86, 12, t, 0.9);
          /* the thing it is batting, wobbling closer to the edge */
          var w = Math.sin(t * 0.07) * 3;
          ctx.fillStyle = '#e8574a';
          ctx.beginPath(); ctx.arc(cx + 20 + w, cy - 3, 3.4, 0, Math.PI * 2); ctx.fill();
        });
      });

      /* the crowd, sat on the floor along the cabinets */
      K.layer(ctx, camX, 0.82, function () {
        K.repeatX(camX, 0, 88, function (x, i) {
          if (Math.abs(i) % 3 === 0) return;
          K.spectator(ctx, x, FLOOR_Y + 4, 0.95, i + 20, t, mood);
        });
      });

      K.planks(ctx, camX, '#9a6f45', '#c49d70', 58);
      this.flour.update(); this.flour.draw(ctx, camX, t);
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
      K.sky(ctx, [[0, '#1d2a55'], [0.32, '#5a4a7e'], [0.62, '#c46a6a'], [0.85, '#f0975c'], [1, '#f8c98a']], 0, FLOOR_Y);

      /* first stars, only in the top third */
      for (var s = 0; s < 26; s++) {
        var stx = ((s * 191 - camX * 0.02) % (W + 20) + W + 20) % (W + 20);
        var sty = (s * 37) % 54 + 4;
        ctx.globalAlpha = 0.30 + 0.45 * Math.abs(Math.sin(t * 0.017 + s));
        ctx.fillStyle = '#fff6e0'; ctx.fillRect(stx, sty, 1.2, 1.2);
      }
      ctx.globalAlpha = 1;

      K.hills(ctx, camX, 0.07, '#4a3a5e', 128, 20, 220);
      K.hills(ctx, camX, 0.15, '#33294a', 146, 13, 640);

      /* the windmill on the ridge, turning */
      K.layer(ctx, camX, 0.15, function () {
        K.repeatX(camX, 0, 420, function (x) {
          var wx = x + 250, wy = 138;
          ctx.strokeStyle = '#241d38'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(wx - 4, wy); ctx.lineTo(wx, wy - 30);
          ctx.lineTo(wx + 4, wy); ctx.stroke();
          ctx.save();
          ctx.translate(wx, wy - 30);
          ctx.rotate(t * 0.02);
          ctx.strokeStyle = '#2e2545'; ctx.lineWidth = 1.4;
          for (var b = 0; b < 6; b++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -9); ctx.stroke();
          }
          ctx.restore();
        });
      });

      /* fields */
      K.layer(ctx, camX, 0.30, function () {
        K.repeatX(camX, 0, 30, function (x, i) {
          ctx.strokeStyle = 'rgba(60,48,40,.5)'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x, 152); ctx.lineTo(x - 9, 168); ctx.stroke();
        });
      });

      /* porch rail with cats sitting along it, and the rocking chair */
      K.layer(ctx, camX, 0.62, function () {
        K.repeatX(camX, 0, 64, function (x, i) {
          ctx.fillStyle = '#c3b79f'; ctx.fillRect(x, 112, 3, FLOOR_Y - 112);
        });
        ctx.fillStyle = '#d2c6ad'; ctx.fillRect(-10, 108, W + 20, 4);
        ctx.fillStyle = 'rgba(90,70,60,.35)'; ctx.fillRect(-10, 112, W + 20, 1.5);
        ctx.fillStyle = '#b7ab93'; ctx.fillRect(-10, 132, W + 20, 3);
        K.repeatX(camX, 0, 76, function (x, i) {
          if (Math.abs(i) % 2) K.spectator(ctx, x + 30, 108, 0.9, i + 40, t, mood);
        });
        /* the rocking chair, rocking */
        K.repeatX(camX, 0, 260, function (x) {
          var rx = x + 150, ry = FLOOR_Y - 2;
          var rock = Math.sin(t * 0.035) * 0.10;
          ctx.save(); ctx.translate(rx, ry); ctx.rotate(rock);
          ctx.strokeStyle = '#7a5638'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-13, 0); ctx.quadraticCurveTo(0, 5, 13, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-7, -14); ctx.lineTo(9, -14);
          ctx.lineTo(11, 0); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-7, -14); ctx.lineTo(-11, -32); ctx.stroke();
          for (var sl = 0; sl < 3; sl++) {
            ctx.beginPath();
            ctx.moveTo(-8 - sl, -18 - sl * 5); ctx.lineTo(2 - sl, -20 - sl * 5);
            ctx.stroke();
          }
          ctx.restore();
        });
      });

      /* the lantern — the light source everything else answers to */
      K.layer(ctx, camX, 0.62, function () {
        K.repeatX(camX, 0, 260, function (x, i) {
          var lx = x + 44, ly = 44;
          var fl = 0.78 + 0.22 * Math.sin(t * 0.15 + i) + 0.08 * Math.sin(t * 0.43);
          ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(lx, 10); ctx.lineTo(lx, ly - 10); ctx.stroke();
          K.glow(ctx, lx, ly, 54, 'rgba(255,196,110,.95)', 0.42 * fl);
          ctx.fillStyle = '#3a2a1c';
          ctx.fillRect(lx - 8, ly - 10, 16, 3);
          ctx.fillRect(lx - 8, ly + 9, 16, 3);
          ctx.fillStyle = 'rgba(255,214,140,' + (0.9 * fl) + ')';
          ctx.fillRect(lx - 6, ly - 8, 12, 17);
          ctx.fillStyle = '#3a2a1c';
          ctx.fillRect(lx - 1, ly - 8, 2, 17);
        });
      });

      K.planks(ctx, camX, '#7a5a3c', '#a8855f', 46);
      this.fluff.update(); this.fluff.draw(ctx, camX, t);
      this.moths.update(); this.moths.draw(ctx, camX, t);
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
