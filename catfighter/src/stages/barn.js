/* =======================================================================
   1 — THE GAME BARN
   Warm, loud, and full of glowing machines. The crowd is on the hay bales.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  /* A prize cat in the claw machine. Two ears and a face is enough at five
     pixels across — anything more turned into a smudge. */
  /* Crowd palettes steered towards the darker cats. CROWD_COLOURS runs cream
     to charcoal and the pale half of it disappears against a straw bale — a
     row of faint smudges was what the first crowd here actually looked like.
     These are indices whose modulo lands on the four darkest entries. */
  var DARKS = [2, 3, 5, 6, 10, 11, 13, 14, 18, 19, 21, 22];

  /* Reused every frame rather than allocated — this runs sixty times a
     second and a fresh array a frame is free garbage nobody needs. */
  var seats = [];

  /* One hay bale: a painted mass, two lines of twine, and a few straws off
     the top edge so the silhouette is not a perfect rectangle. */
  function bale(ctx, x, y, w, h, i) {
    K.mass(ctx, x, y, w, h,
           K.pick(i, 62, ['#c9a24a', '#bf9743', '#d3ac54', '#b78f3c']),
           { top: 4, side: 5 });
    ctx.strokeStyle = 'rgba(90,64,20,.55)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 11, y); ctx.lineTo(x + 11, y + h);
    ctx.moveTo(x + w - 11, y); ctx.lineTo(x + w - 11, y + h);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(214,176,78,.75)'; ctx.lineWidth = 1;
    for (var st = 0; st < 5; st++) {
      var sx = x + K.vary(i * 5 + st, 63, 2, w - 2);
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + K.vary(i * 5 + st, 64, -3, 3), y - K.vary(i * 5 + st, 65, 2, 5));
      ctx.stroke();
    }
  }

  function plush(ctx, x, y, r, col) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y - r * 0.4); ctx.lineTo(x - r * 0.55, y - r * 1.5);
    ctx.lineTo(x - r * 0.1, y - r * 0.75); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + r * 0.9, y - r * 0.4); ctx.lineTo(x + r * 0.55, y - r * 1.5);
    ctx.lineTo(x + r * 0.1, y - r * 0.75); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(30,20,18,.8)';
    ctx.fillRect(x - r * 0.5, y - r * 0.2, 1, 1);
    ctx.fillRect(x + r * 0.35, y - r * 0.2, 1, 1);
  }

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

      /* --- what is hung on the wall.

             At some scroll positions the back of this barn was a bare maroon
             field two feet wide — nothing to look at between one cabinet and
             the next. A barn wall is never bare: tack, wheels, a dartboard,
             rosettes from the county fair. Drawn BEFORE the loft so the loft
             opening covers them, which is right — you cannot hang a horseshoe
             over a hole. --- */
      K.layer(ctx, camX, 0.3, function () {
        K.repeatX(camX, 0, 46, function (x, i) {
          var wy = K.vary(i, 100, 28, 64);
          var kind = Math.floor(K.hash(i, 101) * 5);
          if (kind === 0) {                            /* a wagon wheel */
            var r = K.vary(i, 102, 13, 18);
            ctx.strokeStyle = '#71472a'; ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.arc(x, wy, r, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = 1.4;
            for (var sp = 0; sp < 8; sp++) {
              var a = sp * Math.PI / 4;
              ctx.beginPath();
              ctx.moveTo(x, wy); ctx.lineTo(x + Math.cos(a) * r, wy + Math.sin(a) * r);
              ctx.stroke();
            }
            ctx.fillStyle = '#8a5a34';
            ctx.beginPath(); ctx.arc(x, wy, 3, 0, Math.PI * 2); ctx.fill();
          } else if (kind === 1) {                     /* a dartboard, with a
                                                          dart still in it */
            [[12, '#2a2420'], [9, '#d8cbb0'], [6, '#2a2420'], [3, '#b8342f']]
              .forEach(function (ring) {
                ctx.fillStyle = ring[1];
                ctx.beginPath(); ctx.arc(x, wy, ring[0], 0, Math.PI * 2); ctx.fill();
              });
            ctx.strokeStyle = '#e8e0cc'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x + 4, wy - 3); ctx.lineTo(x + 11, wy - 9); ctx.stroke();
          } else if (kind === 2) {                     /* a hanging lantern */
            ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x, wy - 16); ctx.lineTo(x, wy - 6); ctx.stroke();
            K.mass(ctx, x - 5, wy - 6, 10, 12, '#6b5230', { top: 2, side: 3, foot: false });
            ctx.fillStyle = 'rgba(255,206,120,.9)';
            ctx.fillRect(x - 3, wy - 4, 6, 8);
            K.glow(ctx, x, wy, 22, 'rgba(255,196,110,.8)', 0.24);
          } else if (kind === 3) {                     /* three horseshoes */
            for (var hs = 0; hs < 3; hs++) {
              var hx = x + (hs - 1) * 12, hy2 = wy + (hs === 1 ? -6 : 0);
              ctx.strokeStyle = '#8e8577'; ctx.lineWidth = 2.6;
              ctx.beginPath(); ctx.arc(hx, hy2, 5.5, Math.PI * 0.15, Math.PI * 0.85, true);
              ctx.stroke();
            }
          } else {                                     /* a rosette board */
            K.mass(ctx, x - 14, wy - 9, 28, 20, '#5a3520', { top: 2, side: 4, foot: false });
            for (var rz = 0; rz < 3; rz++) {
              var rx = x - 8 + rz * 8;
              ctx.fillStyle = K.pick(i * 3 + rz, 103, ['#c8354a', '#3f6fb0', '#d8a83a']);
              ctx.beginPath(); ctx.arc(rx, wy - 3, 3.2, 0, Math.PI * 2); ctx.fill();
              ctx.fillRect(rx - 2.4, wy - 1, 1.8, 6);
              ctx.fillRect(rx + 0.6, wy - 1, 1.8, 6);
            }
          }
        });
      });

      /* --- THE HAYLOFT, and the hoist.

             The far mass. It was a 124-pixel window and it read as a window;
             at 172 across and nearly half the height of the picture it reads
             as the whole open end of the barn with the night behind it. That
             is the scale contrast the reference lives on — the claw machine is
             enormous and near, this is enormous and far, and the fighters are
             small between them.

             The second loop lives here: a bale on the block and tackle,
             hauled up out of the dark and swung into the loft, over and over.
             It runs on a different period from the claw so the two never
             settle into lockstep. --- */
      K.layer(ctx, camX, 0.22, function () {
        var wx = K.at(camX, 0, 252) - camX * 0.03;
        var OW = 86, OT = 4, OB = 100;                 /* half-width, top, bottom */
        /* the opening itself */
        ctx.fillStyle = '#150e1c';
        ctx.fillRect(wx - OW - 5, OT - 2, OW * 2 + 10, OB - OT + 4);
        /* night sky through it, dark at the top so the moon has somewhere to be */
        ctx.fillStyle = '#22345c'; ctx.fillRect(wx - OW, OT, OW * 2, OB - OT);
        ctx.fillStyle = '#33507f'; ctx.fillRect(wx - OW, OT, OW * 2, (OB - OT) * 0.52);
        ctx.fillStyle = '#4d76ad'; ctx.fillRect(wx - OW, OT, OW * 2, (OB - OT) * 0.24);
        /* stars, and the moon with a halo */
        for (var s2 = 0; s2 < 16; s2++) {
          ctx.fillStyle = 'rgba(226,236,255,' + K.vary(s2, 80, 0.3, 0.85).toFixed(2) + ')';
          ctx.fillRect(wx - OW + 6 + K.hash(s2, 81) * (OW * 2 - 12),
                       OT + 3 + K.hash(s2, 82) * 44, 1, 1);
        }
        K.glow(ctx, wx + 44, OT + 22, 30, 'rgba(190,215,255,.7)', 0.3);
        ctx.fillStyle = '#e8eaf6';
        ctx.beginPath(); ctx.arc(wx + 44, OT + 22, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#cdd3e8';
        ctx.beginPath(); ctx.arc(wx + 47, OT + 19, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(wx + 40, OT + 26, 1.6, 0, Math.PI * 2); ctx.fill();
        /* two ridges of hill, the far one hazed towards the night sky */
        [[0.55, '#2b4068', 62, 9], [1, '#1b2b4c', 74, 13]].forEach(function (r) {
          ctx.fillStyle = r[1];
          ctx.beginPath();
          ctx.moveTo(wx - OW, OB);
          for (var hx = -OW; hx <= OW; hx += 7) {
            ctx.lineTo(wx + hx, r[2] - Math.sin(hx * 0.04 + r[0] * 3) * r[3]
                                     - Math.sin(hx * 0.11) * r[3] * 0.4);
          }
          ctx.lineTo(wx + OW, OB); ctx.closePath(); ctx.fill();
        });
        /* a bird crossing the moon, once in a while */
        var bp = (t * 0.18) % 520;
        if (bp < 170) K.bird(ctx, wx - OW + bp * 0.9, OT + 20 + Math.sin(bp * 0.05) * 6, 0.8, t, 0, '#1a2338');

        /* bales stacked in the mouth of it — the thing that makes the opening
           read as a room you could stand in rather than a hole */
        K.mass(ctx, wx - OW + 4, OB - 34, 40, 34, '#a3823a', { top: 4, side: 5 });
        K.mass(ctx, wx - OW + 10, OB - 62, 32, 28, '#b08d40', { top: 4, side: 5 });
        K.mass(ctx, wx + OW - 46, OB - 28, 44, 28, '#987a36', { top: 4, side: 5 });

        /* THE HOIST. Rope over the beam, a bale coming up on it. */
        var HC = 420, hu = (t % HC) / HC;
        var hoistX = wx - 8, beamY = OT - 2;
        var bY = hu < 0.62
          ? FLOOR_Y - 30 - (FLOOR_Y - 30 - (OB - 36)) * (hu / 0.62)   /* rising */
          : hu < 0.78 ? OB - 36                                        /* held  */
          : FLOOR_Y - 30 - (FLOOR_Y - 30 - (OB - 36)) * (1 - (hu - 0.78) / 0.22);
        var swingX = Math.sin(t * 0.017) * 4 * (hu < 0.78 ? 1 : 0.4);
        ctx.strokeStyle = 'rgba(28,20,14,.95)'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(hoistX, beamY); ctx.lineTo(hoistX + swingX, bY - 8); ctx.stroke();
        ctx.fillStyle = '#3a2418'; ctx.fillRect(hoistX + swingX - 5, bY - 12, 10, 6);
        K.mass(ctx, hoistX + swingX - 15, bY - 4, 30, 22, '#c2a04a', { top: 3, side: 4 });
        ctx.strokeStyle = 'rgba(90,64,20,.6)'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hoistX + swingX - 7, bY - 4); ctx.lineTo(hoistX + swingX - 7, bY + 18);
        ctx.moveTo(hoistX + swingX + 7, bY - 4); ctx.lineTo(hoistX + swingX + 7, bY + 18);
        ctx.stroke();

        /* the frame round the opening, and the loft floor it sits on */
        ctx.strokeStyle = '#40261c'; ctx.lineWidth = 6;
        ctx.strokeRect(wx - OW - 2, OT - 1, OW * 2 + 4, OB - OT + 2);
        K.mass(ctx, wx - OW - 12, OB + 1, OW * 2 + 24, 9, '#54321f', { top: 3, side: 6 });
        /* the hoist beam sticking out over the drop */
        K.mass(ctx, wx - 26, beamY - 3, 46, 7, '#4a2c1e', { top: 2, side: 4, foot: false });

        /* the ladder down out of it, leaning */
        ctx.strokeStyle = '#5c3a24'; ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(wx + OW - 14, OB + 10); ctx.lineTo(wx + OW - 26, FLOOR_Y - 18);
        ctx.moveTo(wx + OW + 4, OB + 10); ctx.lineTo(wx + OW - 8, FLOOR_Y - 18);
        ctx.stroke();
        ctx.lineWidth = 1.8;
        for (var rung = 0; rung < 8; rung++) {
          var f2 = rung / 8, ry = OB + 14 + f2 * (FLOOR_Y - 34 - OB);
          ctx.beginPath();
          ctx.moveTo(wx + OW - 14 - f2 * 12, ry); ctx.lineTo(wx + OW + 4 - f2 * 12, ry);
          ctx.stroke();
        }
        /* the moonlight falling out of the opening onto the barn floor */
        K.spill(ctx, wx - OW + 6, OB + 10, OW * 2 - 12, FLOOR_Y - OB - 10,
                'rgba(150,185,235,.55)', 0.24);
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

      /* --- THE LANDMARK: THE BIG CLAW.

             It used to be a claw machine 60px wide standing in a row of
             cabinets 46px wide, which is not a landmark, it is another
             cabinet. A landmark has to be the size of the building it is in:
             this one is 104 wide and runs from the floor up out of the top of
             the picture, cropped by the roof beam, and cropped again by the
             left edge of the screen. Cropping is most of what sells scale —
             a thing you can see all of is a thing you can measure.

             It is also the loop. The claw tracks, drops, grabs, lifts and
             carries a plush cat to the chute, and every third go it fumbles
             it on the way — which is the bit worth waiting for. --- */
      K.layer(ctx, camX, 0.42, function () {
        /* Pinned to the screen with a whisper of drift. A landmark that
           scrolls out of frame stops being one; a landmark nailed to the
           glass reads as a matte painting. A twentieth of the camera is the
           compromise the other stages use. */
        var mx = K.at(camX, 0, 0) - camX * 0.02;
        var MW = 104, MTOP = 16, MBOT = FLOOR_Y;
        var bx = mx + 16;                       /* the near stall partition crops it */

        /* the cabinet: one painted mass, lit from the right because the light
           in this barn comes off the string lights over the fight */
        K.mass(ctx, bx, MTOP, MW, MBOT - MTOP, '#b8342f',
               { top: 0, side: 9, light: -1, foot: false });

        /* the glass box */
        var gx = bx + 12, gy = MTOP + 20, gw = MW - 26, gh = 88;
        ctx.fillStyle = '#0e1426'; ctx.fillRect(gx - 3, gy - 3, gw + 6, gh + 6);
        ctx.fillStyle = '#1b2540'; ctx.fillRect(gx, gy, gw, gh);
        /* the back wall of it, lit, so the prizes have something to sit against */
        ctx.fillStyle = '#26325a'; ctx.fillRect(gx, gy, gw, gh * 0.55);

        /* the pile of plushes at the bottom of the box */
        var pileY = gy + gh - 9;
        /* the prizes were drawn in mid-air over a navy box. A mound under them
           is one fill and it is the difference between a pile and a pattern. */
        ctx.fillStyle = '#141c34';
        ctx.beginPath();
        ctx.moveTo(gx, gy + gh);
        ctx.lineTo(gx, pileY - 1);
        ctx.quadraticCurveTo(gx + gw * 0.5, pileY - 9, gx + gw, pileY - 3);
        ctx.lineTo(gx + gw, gy + gh); ctx.closePath(); ctx.fill();
        for (var q2 = 0; q2 < 11; q2++) {
          plush(ctx, gx + 7 + (q2 % 6) * 12 + (q2 > 5 ? 6 : 0),
                pileY - (q2 > 5 ? 9 : 0), K.vary(q2, 50, 4.2, 5.6),
                K.pick(q2, 51, ['#ffd166', '#ff7a8a', '#8fe6ff', '#b6ff8f', '#ffa04a', '#d3a0ff']));
        }

        /* ---- the loop ----
           One cycle, five and a half seconds, in normalised time so the
           phases can be shuffled without recomputing frame numbers. */
        var CYCLE = 330;
        var n = Math.floor(t / CYCLE), u = (t % CYCLE) / CYCLE;
        var fumble = (n % 3) === 2;
        function seg(a, b) { var v = (u - a) / (b - a); return v < 0 ? 0 : v > 1 ? 1 : v; }
        function ease(v) { return v * v * (3 - 2 * v); }

        var home = gx + 11, far = gx + gw - 14;
        var clawX = home + (far - home) * ease(seg(0, 0.26))
                         - (far - home) * ease(seg(0.62, 0.80));
        var railY = gy + 5;
        var deep = pileY - 7;
        var clawY = railY + (deep - railY) * (ease(seg(0.26, 0.40)) - ease(seg(0.48, 0.62)));
        var grip = u > 0.36 && u < 0.66 ? 1 : 0;          /* fingers closed */
        var carrying = u > 0.40 && u < (fumble ? 0.71 : 0.84);

        /* the gantry rail, and the trolley riding it */
        ctx.fillStyle = '#8e8577'; ctx.fillRect(gx + 4, railY - 3, gw - 8, 2);
        ctx.fillStyle = '#cfc6b4'; ctx.fillRect(clawX - 5, railY - 5, 10, 5);
        ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(clawX, railY); ctx.lineTo(clawX, clawY); ctx.stroke();
        /* the fingers — three of them, opening and closing */
        var spread = 5.5 - grip * 3;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(clawX - spread, clawY + 7); ctx.lineTo(clawX - spread * 0.5, clawY);
        ctx.lineTo(clawX + spread * 0.5, clawY); ctx.lineTo(clawX + spread, clawY + 7);
        ctx.moveTo(clawX, clawY); ctx.lineTo(clawX, clawY + 7);
        ctx.stroke();

        /* the prize in transit, and the tease */
        if (carrying) {
          plush(ctx, clawX, clawY + 11, 5.4, '#ffd166');
        } else if (fumble && u >= 0.71 && u < 0.80) {
          var fall = (u - 0.71) / 0.09;
          plush(ctx, clawX, clawY + 11 + fall * fall * (pileY - clawY - 8), 5.4, '#ffd166');
        }
        /* delivered: it sits in the chute tray, and the cat at the panel
           throws its paws up */
        var won = !fumble && u >= 0.84;
        if (won) plush(ctx, bx + MW - 17, MBOT - 12, 5.4, '#ffd166');

        /* glass, over everything inside it — one diagonal, no gradient */
        ctx.fillStyle = 'rgba(200,230,255,.09)';
        ctx.beginPath();
        ctx.moveTo(gx, gy); ctx.lineTo(gx + gw * 0.55, gy);
        ctx.lineTo(gx, gy + gh * 0.8); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,240,210,.30)'; ctx.lineWidth = 1;
        ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);

        /* control panel and chute, at fighter height, which is what makes the
           machine read as something a cat could walk up to */
        ctx.fillStyle = '#6d1f1c'; ctx.fillRect(bx + 4, gy + gh + 6, MW - 12, 12);
        ctx.fillStyle = '#8f2a25'; ctx.fillRect(bx + 4, gy + gh + 6, MW - 12, 2);
        ctx.fillStyle = '#2a2028';
        ctx.fillRect(bx + 22, gy + gh + 3, 4, 5);                   /* stick */
        ctx.fillStyle = '#e8d24a';
        ctx.beginPath(); ctx.arc(bx + 24, gy + gh + 3, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff5b5b';
        ctx.beginPath(); ctx.arc(bx + 40, gy + gh + 12, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#241a14';
        ctx.fillRect(bx + MW - 26, MBOT - 22, 20, 20);              /* the chute */
        ctx.fillStyle = 'rgba(255,224,140,.14)';
        ctx.fillRect(bx + MW - 26, MBOT - 22, 20, 3);

        /* the sign over it, flashing, tucked under the roof beam */
        var lit = (t % 64) < 38;
        K.mass(ctx, bx + 10, MTOP + 2, MW - 22, 15, lit ? '#ffd45c' : '#6f5f33',
               { top: 0, side: 4, light: -1, foot: false });
        K.glow(ctx, bx + MW / 2, MTOP + 9, 52, 'rgba(255,214,92,.85)', lit ? 0.26 : 0.06);
        ctx.fillStyle = '#3a2410';
        ctx.font = '800 9px "Arial Narrow", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('THE CLAW', bx + MW / 2, MTOP + 13);
        ctx.textAlign = 'left';

        /* somebody working it, and celebrating when it pays out */
        K.spectator(ctx, bx + MW + 9, FLOOR_Y - 2, 0.95, 404, t, won ? 1 : (mood || 0) * 0.5);
      });

      /* --- the bales, and the house on them.

             This row used to be one bale, 70 pixels apart, forever — the
             flattest thing in the stage and unluckily also the band the
             fighters stand in front of. It is now a run of clusters that are
             not the same object: stacks one to three high, bales stood on end,
             barrels, a tower of tyres, and gaps where the crowd stands on the
             floor instead. The crowd sits on two tiers so the row has a front
             and a back, and the palettes are steered towards the darker cats
             — a cream cat on a straw bale is invisible, which is what the
             first version was full of. --- */
      K.layer(ctx, camX, 0.62, function () {
        K.repeatX(camX, 0, 76, function (x, i) {
          var kind = K.hash(i, 60);
          var topY = FLOOR_Y - 30, seatX = x + 16, seatX2 = x + 44;

          if (kind < 0.13) {
            /* barrels — three tones, rings, no top face because you are
               looking at them from just above standing height */
            for (var b = 0; b < 2; b++) {
              var bxx = x + 6 + b * 26, bh = K.vary(i * 2 + b, 69, 26, 32);
              K.mass(ctx, bxx, FLOOR_Y - 4 - bh, 20, bh,
                     K.pick(i + b, 70, ['#7a4b2a', '#8c5730', '#6b4023']),
                     { top: 3, side: 4 });
              ctx.fillStyle = 'rgba(0,0,0,.28)';
              ctx.fillRect(bxx, FLOOR_Y - 4 - bh * 0.72, 20, 1.6);
              ctx.fillRect(bxx, FLOOR_Y - 4 - bh * 0.26, 20, 1.6);
            }
            topY = FLOOR_Y - 36; seatX = x + 16; seatX2 = x + 42;
          } else if (kind < 0.22) {
            /* a tower of tyres, because a barn has one */
            for (var ty = 0; ty < 4; ty++) {
              var tyY = FLOOR_Y - 8 - ty * 9;
              ctx.fillStyle = ty % 2 ? '#22201f' : '#2b2827';
              ctx.beginPath();
              ctx.ellipse(x + 24 + (ty % 2 ? 1.5 : 0), tyY, 15, 5.4, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = 'rgba(255,230,190,.10)';
              ctx.beginPath();
              ctx.ellipse(x + 24 + (ty % 2 ? 1.5 : 0), tyY - 2.4, 12, 2.6, 0, 0, Math.PI * 2);
              ctx.fill();
            }
            topY = FLOOR_Y - 44; seatX = x + 24; seatX2 = null;
          } else {
            var stack = kind < 0.46 ? 1 : kind < 0.82 ? 2 : 3;
            var bw = K.vary(i, 61, 40, 52);
            for (var lvl = 0; lvl < stack; lvl++) {
              var lx = x + lvl * K.vary(i * 3 + lvl, 71, -4, 6);
              var lw = lvl ? bw - lvl * K.vary(i, 72, 4, 12) : bw;
              bale(ctx, lx, FLOOR_Y - 4 - lvl * 25 - 26, lw, 26, i * 3 + lvl);
            }
            /* one stood on end against the stack — a different rectangle in
               the row does more than another shade of straw */
            if (K.chance(i, 73, 0.4)) bale(ctx, x + bw - 4, FLOOR_Y - 42, 20, 38, i + 91);
            topY = FLOOR_Y - 4 - (stack - 1) * 25 - 26;
            seatX = x + 13; seatX2 = x + bw - 11;
          }

          /* Seats are collected, not drawn. Every cat used to be drawn with
             its own cluster, and the next cluster's bales then buried it —
             the crowd was a row of ears sticking out of hay. Two passes cost
             one array and the whole house is visible. */
          if (!K.chance(i, 65, 0.14)) {
            seats.push([seatX, topY, K.vary(i, 66, 0.86, 1.1), K.pick(i, 74, DARKS), i * 23]);
          }
          if (seatX2 !== null && K.chance(i, 67, 0.62)) {
            seats.push([seatX2, topY, K.vary(i, 68, 0.78, 1.0), K.pick(i, 75, DARKS), i * 41 + 60]);
          }
          /* A third and fourth cat along the same top, at their own sizes.
             The front tier that used to be here stood on the floor at
             FLOOR_Y — which is inside the contact shadow `K.deepen` lays down
             every frame, so the whole row was quietly wiped out. Anything
             meant to be seen belongs above y 150 in this stage. */
          if (K.chance(i, 76, 0.55)) {
            seats.push([x + K.vary(i, 77, 6, 52), topY + K.vary(i, 84, 0, 3),
                        K.vary(i, 78, 0.7, 0.92), K.pick(i, 79, DARKS), i * 11 + 30]);
          }
          if (K.chance(i, 85, 0.4)) {
            seats.push([x + K.vary(i, 86, 2, 58), topY - 1,
                        K.vary(i, 87, 0.72, 0.95), K.pick(i, 88, DARKS), i * 29 + 90]);
          }
        });
        for (var sI = 0; sI < seats.length; sI++) {
          var st2 = seats[sI];
          K.spectator(ctx, st2[0], st2[1], st2[2], st2[3], t + st2[4], mood);
        }
        seats.length = 0;
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
            c.lineTo(ex + dir * 66, -10);
            c.lineTo(ex + dir * 58, 44);
            c.lineTo(ex + dir * 52, H);
            c.closePath();
          }, '#4a2c1c', { step: 3, lx: -dir * 0.9, ly: 0.2, hi: 0.16, edgeW: 1.6 });
          ctx.fillStyle = 'rgba(255,220,160,.10)';
          ctx.fillRect(ex + dir * 50, -10, dir * 5, H + 10);
          ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
          for (var q = 0; q < 5; q++) {
            ctx.beginPath();
            ctx.moveTo(ex + dir * (10 + q * 13), -10);
            ctx.lineTo(ex + dir * (8 + q * 12), H);
            ctx.stroke();
          }
          /* an iron bracket, at fighter height so the scale reads */
          ctx.fillStyle = '#2a2028';
          ctx.fillRect(ex + (dir > 0 ? 0 : -56), 96, 56, 9);
          /* On the right-hand post, the house sign — hung on the near timber
             rather than painted on the far wall, so it is a warm light at the
             edge of the frame instead of another thing in the distance. The
             corner it fills was dead maroon at every scroll position. */
          if (dir < 0) {
            var sx3 = ex - 46, sy3 = 26;
            K.mass(ctx, sx3, sy3, 34, 84, '#2f1a12', { top: 3, side: 5, foot: false });
            var buzz = (t % 190) < 4 ? 0.35 : 1;      /* the tube is on its way out */
            ctx.globalAlpha = buzz;
            'GAME BARN'.split('').forEach(function (ch, k) {
              if (ch === ' ') return;
              ctx.fillStyle = '#ffdf8c';
              ctx.font = '800 9px "Arial Narrow", Arial, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(ch, sx3 + 17, sy3 + 13 + k * 8);
            });
            ctx.textAlign = 'left';
            ctx.globalAlpha = 1;
            K.glow(ctx, sx3 + 17, sy3 + 42, 46, 'rgba(255,206,120,.75)', 0.22 * buzz);
          }
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

      /* --- the floor.

             A third of the picture, and it was a plank texture and twenty
             specks. It now has something ON it: the shuffleboard court painted
             across the boards, worn through where everyone walks, with a puck
             left in the seven. The court is anchored in the WORLD, not the
             screen, so it slides past as the fight moves and tells you how far
             you have travelled — which a repeating floor never can. --- */
      K.grain(ctx, camX, 56, ['#6d4a2c', '#bd854e'], 0.1);
      K.layer(ctx, camX, 1, function () {
        var cx2 = K.at(camX, 1, 150);
        var apexY = FLOOR_Y + 7, baseY = H + 6;
        function court(f) {                       /* half-width at 0..1 down */
          return 15 + f * 74;
        }
        function edge(c, w, alpha) {
          ctx.strokeStyle = c; ctx.lineWidth = w; ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.moveTo(cx2 - court(0), apexY); ctx.lineTo(cx2 - court(1), baseY);
          ctx.moveTo(cx2 + court(0), apexY); ctx.lineTo(cx2 + court(1), baseY);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = 'rgba(226,196,140,.10)';
        ctx.beginPath();
        ctx.moveTo(cx2 - court(0), apexY); ctx.lineTo(cx2 + court(0), apexY);
        ctx.lineTo(cx2 + court(1), baseY); ctx.lineTo(cx2 - court(1), baseY);
        ctx.closePath(); ctx.fill();
        /* two passes: a dark one offset down, then the pale paint over it, so
           the line has a shadow in the grain the way worn paint does */
        edge('rgba(38,22,10,.62)', 3, 1);
        edge('rgba(248,235,202,.62)', 1.8, 1);
        [0.3, 0.62].forEach(function (f) {
          var y = apexY + (baseY - apexY) * f;
          ctx.strokeStyle = 'rgba(38,22,10,.5)'; ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(cx2 - court(f), y + 1); ctx.lineTo(cx2 + court(f), y + 1);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(248,235,202,.5)'; ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(cx2 - court(f), y); ctx.lineTo(cx2 + court(f), y);
          ctx.stroke();
        });
        /* the puck somebody left in the seven */
        var pz = cx2 + 26, py = apexY + (baseY - apexY) * 0.46;
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        ctx.beginPath(); ctx.ellipse(pz, py + 1.6, 6, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c23b34';
        ctx.beginPath(); ctx.ellipse(pz, py, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e8635a';
        ctx.beginPath(); ctx.ellipse(pz - 0.6, py - 0.8, 4.4, 1.8, 0, 0, Math.PI * 2); ctx.fill();
      });

      /* the light on it: a warm pool under the string lights, cold moonlight
         where it falls out of the loft, and the string lights repeating */
      K.floorPool(ctx, W * 0.5, 190, 'rgba(255,196,110,.6)', 0.34);
      K.floorPool(ctx, K.at(camX, 0, 252) - camX * 0.03, 150,
                  'rgba(150,190,240,.5)', 0.2);
      K.repeatX(camX, 1, 92, function (x) {
        K.glow(ctx, x, FLOOR_Y + 16, 46, 'rgba(255,196,110,.55)', 0.1);
      });
      /* tokens and straw underfoot, and one token catching the light */
      K.litter(ctx, camX, 1, 64, ['rgba(214,178,74,.6)', 'rgba(120,88,44,.5)',
                                  'rgba(255,224,140,.45)'], 0.7, 1.9);
      K.layer(ctx, camX, 1, function () {
        ctx.strokeStyle = 'rgba(206,168,78,.55)'; ctx.lineWidth = 1;
        K.repeatX(camX, 0, 48, function (x, i) {
          for (var st = 0; st < 3; st++) {
            var sx = x + K.vary(i * 3 + st, 90, 0, 46);
            var sy = FLOOR_Y + 6 + K.hash(i * 3 + st, 91) * (H - FLOOR_Y - 8);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + K.vary(i * 3 + st, 92, -5, 5), sy + K.vary(i * 3 + st, 93, -1.6, 1.6));
            ctx.stroke();
          }
        });
        var tk = K.at(camX, 1, 84), glint = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.03));
        ctx.fillStyle = '#d8ae44';
        ctx.beginPath(); ctx.ellipse(tk, H - 22, 3.2, 1.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = glint;
        ctx.fillStyle = '#fff4c8';
        ctx.fillRect(tk - 1, H - 23, 2, 1);
        ctx.globalAlpha = 1;
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
      /* the near edge of the floor, in front of the fighters feet — the
         plane turns away from the light as it comes towards you, and that
         alone is the difference between a floor and a coloured band */
      K.nearLip(ctx, 15, 0.4);
      K.vignette(ctx, 0.26);
    }
  };
})();
