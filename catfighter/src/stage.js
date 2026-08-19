/* ==========================================================================
   Cat Fighter II — stages

   Drawn, not photographed, so they scale to any window and cost nothing to
   load. Each stage is three parallax layers plus a floor. The two named
   stages are the two properties; the rest are the places a cat actually goes.
   ========================================================================== */
(function () {
  var W = 384, H = 224, FLOOR_Y = 172;   // floor line in screen space

  function sky(ctx, stops) {
    var g = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    for (var i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, FLOOR_Y + 2);
  }

  function hills(ctx, camX, depth, color, base, amp, seedOff) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    var off = camX * depth;
    for (var x = 0; x <= W; x += 8) {
      var wx = x + off;
      var y = base - Math.sin((wx + seedOff) * 0.012) * amp
                   - Math.sin((wx + seedOff) * 0.031) * amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, FLOOR_Y);
    ctx.closePath();
    ctx.fill();
  }

  function floor(ctx, camX, near, far) {
    var g = ctx.createLinearGradient(0, FLOOR_Y, 0, H);
    g.addColorStop(0, far); g.addColorStop(1, near);
    ctx.fillStyle = g;
    ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    /* perspective lines so movement reads */
    ctx.strokeStyle = 'rgba(0,0,0,.10)'; ctx.lineWidth = 1;
    for (var i = -2; i < 26; i++) {
      var x = ((i * 48 - camX * 0.9) % (W + 96) + W + 96) % (W + 96) - 48;
      ctx.beginPath(); ctx.moveTo(x, FLOOR_Y); ctx.lineTo(x - 26, H); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,.07)';
    for (var r = 1; r < 5; r++) {
      var y = FLOOR_Y + Math.pow(r / 5, 1.7) * (H - FLOOR_Y);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  function tree(ctx, x, y, s, trunk, leaf) {
    ctx.fillStyle = trunk;
    ctx.fillRect(x - 2 * s, y - 16 * s, 4 * s, 16 * s);
    ctx.fillStyle = leaf;
    ctx.beginPath(); ctx.arc(x, y - 22 * s, 11 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 8 * s, y - 16 * s, 8 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 8 * s, y - 17 * s, 8.5 * s, 0, Math.PI * 2); ctx.fill();
  }

  var STAGES = [
    {
      id: 'barn', name: 'THE GAME BARN',
      draw: function (ctx, camX, t) {
        sky(ctx, [[0, '#3a2a44'], [0.55, '#6b4360'], [1, '#c2725c']]);
        /* barn interior — beams and string lights */
        ctx.fillStyle = '#4a2f28';
        for (var i = -1; i < 8; i++) {
          var x = ((i * 110 - camX * 0.35) % 880 + 880) % 880 - 110;
          ctx.fillRect(x, 20, 12, FLOOR_Y - 20);
          ctx.fillRect(x - 40, 20, 92, 10);
        }
        ctx.fillStyle = 'rgba(255,220,150,.10)';
        ctx.fillRect(0, 0, W, FLOOR_Y);
        for (var k = -2; k < 14; k++) {
          var lx = ((k * 46 - camX * 0.5) % 690 + 690) % 690 - 46;
          var ly = 26 + Math.sin(lx * 0.05) * 6;
          ctx.beginPath(); ctx.arc(lx, ly, 2.6, 0, Math.PI * 2);
          ctx.fillStyle = (k % 3 === 0) ? '#ffd76e' : (k % 3 === 1 ? '#ff9d6e' : '#8ee6ff');
          ctx.fill();
          ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 0.06 + k);
          ctx.beginPath(); ctx.arc(lx, ly, 7, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        }
        floor(ctx, camX, '#6b4a32', '#8a6242');
      }
    },
    {
      id: 'pool', name: 'THE POOL DECK',
      draw: function (ctx, camX, t) {
        sky(ctx, [[0, '#1e5f9e'], [0.6, '#69b6e0'], [1, '#cfe9f5']]);
        /* sun */
        ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.arc(300 - camX * 0.05, 44, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#fff3c4'; ctx.fill(); ctx.globalAlpha = 1;
        hills(ctx, camX, 0.12, '#7c9b6a', 132, 16, 0);
        hills(ctx, camX, 0.28, '#5e7d52', 148, 11, 400);
        /* vineyard rows */
        ctx.strokeStyle = 'rgba(50,80,45,.5)'; ctx.lineWidth = 2;
        for (var i = -1; i < 16; i++) {
          var x = ((i * 34 - camX * 0.4) % 544 + 544) % 544 - 34;
          ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x - 6, 168); ctx.stroke();
        }
        /* the pool itself, behind the fighters */
        ctx.fillStyle = '#3fa9d8';
        ctx.fillRect(0, FLOOR_Y - 12, W, 12);
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
        for (var w = 0; w < 5; w++) {
          var wy = FLOOR_Y - 10 + w * 2.2;
          ctx.beginPath();
          for (var x2 = 0; x2 <= W; x2 += 6) {
            ctx.lineTo(x2, wy + Math.sin((x2 + t * 1.4 + w * 20) * 0.06) * 1.1);
          }
          ctx.stroke();
        }
        floor(ctx, camX, '#c9bda6', '#e3d9c6');
      }
    },
    {
      id: 'orchard', name: 'THE ORCHARD',
      draw: function (ctx, camX, t) {
        sky(ctx, [[0, '#f2b46b'], [0.5, '#f5d9a0'], [1, '#fdf0d5']]);
        hills(ctx, camX, 0.1, '#b98f5e', 136, 14, 120);
        for (var i = -1; i < 12; i++) {
          var x = ((i * 74 - camX * 0.45) % 888 + 888) % 888 - 74;
          tree(ctx, x, FLOOR_Y - 2, 1.0, '#6b4a2c', '#4f7a3a');
        }
        for (var j = -1; j < 9; j++) {
          var x2 = ((j * 96 - camX * 0.75) % 864 + 864) % 864 - 96;
          tree(ctx, x2, FLOOR_Y + 6, 1.35, '#5a3d24', '#3f6630');
        }
        floor(ctx, camX, '#7a8f4e', '#9db268');
      }
    },
    {
      id: 'retreat', name: 'MOUNTAIN RETREAT',
      draw: function (ctx, camX, t) {
        sky(ctx, [[0, '#141d33'], [0.5, '#33406b'], [1, '#8a6f8e']]);
        /* stars */
        for (var s = 0; s < 40; s++) {
          var sx = ((s * 97 - camX * 0.04) % 384 + 384) % 384;
          var sy = (s * 53) % 110 + 6;
          ctx.globalAlpha = 0.4 + 0.5 * Math.abs(Math.sin(t * 0.02 + s));
          ctx.fillStyle = '#fff'; ctx.fillRect(sx, sy, 1.4, 1.4);
        }
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(78 - camX * 0.03, 40, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#f7f3d8'; ctx.fill();
        hills(ctx, camX, 0.08, '#242c48', 128, 26, 0);
        hills(ctx, camX, 0.2, '#1b2138', 148, 18, 500);
        /* granite boulders */
        for (var b = -1; b < 8; b++) {
          var bx = ((b * 118 - camX * 0.5) % 944 + 944) % 944 - 118;
          ctx.fillStyle = '#4a4a55';
          ctx.beginPath(); ctx.ellipse(bx, FLOOR_Y - 4, 26, 16, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#5c5c68';
          ctx.beginPath(); ctx.ellipse(bx - 6, FLOOR_Y - 10, 15, 10, 0, 0, Math.PI * 2); ctx.fill();
        }
        floor(ctx, camX, '#3b3a42', '#55535e');
      }
    },
    {
      id: 'kitchen', name: 'THE FARMHOUSE KITCHEN',
      draw: function (ctx, camX, t) {
        sky(ctx, [[0, '#e8d9bf'], [1, '#f6ecd9']]);
        /* cabinetry */
        ctx.fillStyle = '#c9a87c';
        ctx.fillRect(0, 96, W, FLOOR_Y - 96);
        for (var i = -1; i < 10; i++) {
          var x = ((i * 62 - camX * 0.4) % 620 + 620) % 620 - 62;
          ctx.fillStyle = '#b8946a'; ctx.fillRect(x + 4, 100, 54, 60);
          ctx.fillStyle = '#8f7050'; ctx.fillRect(x + 26, 126, 10, 3);
        }
        /* window */
        var wx = ((-camX * 0.3) % 620 + 620) % 620 - 100;
        ctx.fillStyle = '#8fd0e8'; ctx.fillRect(wx, 30, 90, 54);
        ctx.strokeStyle = '#6b4a2c'; ctx.lineWidth = 3; ctx.strokeRect(wx, 30, 90, 54);
        ctx.beginPath(); ctx.moveTo(wx + 45, 30); ctx.lineTo(wx + 45, 84); ctx.stroke();
        /* hanging pans */
        for (var k = -1; k < 8; k++) {
          var px = ((k * 52 - camX * 0.35) % 520 + 520) % 520 - 52;
          ctx.fillStyle = '#8a8a92';
          ctx.beginPath(); ctx.arc(px, 22, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(px + 7, 20, 14, 3);
        }
        floor(ctx, camX, '#a87f56', '#c49d70');
      }
    },
    {
      id: 'porch', name: 'THE FRONT PORCH',
      draw: function (ctx, camX, t) {
        sky(ctx, [[0, '#2c3f6b'], [0.5, '#7a6f9c'], [1, '#e0916f']]);
        hills(ctx, camX, 0.1, '#3d3a56', 134, 18, 200);
        /* porch posts and rail */
        for (var i = -1; i < 7; i++) {
          var x = ((i * 128 - camX * 0.55) % 896 + 896) % 896 - 128;
          ctx.fillStyle = '#e8e2d4'; ctx.fillRect(x, 24, 11, FLOOR_Y - 24);
          ctx.fillStyle = '#d6cfbe'; ctx.fillRect(x - 60, 118, 130, 5);
        }
        ctx.fillStyle = '#e8e2d4'; ctx.fillRect(0, 12, W, 14);
        /* lantern */
        var lx = ((60 - camX * 0.55) % 896 + 896) % 896 - 128;
        ctx.fillStyle = '#ffcf7a';
        ctx.globalAlpha = 0.4 + 0.08 * Math.sin(t * 0.1);
        ctx.beginPath(); ctx.arc(lx + 5, 40, 18, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillRect(lx, 34, 11, 12);
        floor(ctx, camX, '#8a6a4a', '#a8855f');
      }
    }
  ];

  CF.Stages = STAGES;
  CF.STAGE = { W: W, H: H, FLOOR_Y: FLOOR_Y };
})();
