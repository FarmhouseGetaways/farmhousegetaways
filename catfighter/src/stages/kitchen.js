/* =======================================================================
   5 — THE FARMHOUSE KITCHEN
   Warm, domestic, and busy. Something is always on the stove.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  CF.StageDefs = CF.StageDefs || {};
  CF.StageDefs.kitchen = {
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
})();
