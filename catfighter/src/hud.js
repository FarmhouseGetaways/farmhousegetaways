/* ==========================================================================
   Super Cat Fighter 6 — HUD and effects

   Health bars drain in two stages: a fast red bar and a slow yellow "ghost"
   behind it, so you can see at a glance how much a combo actually took.
   ========================================================================== */
(function () {
  var U = CF.util, S = CF.STAGE;

  function text(ctx, str, x, y, size, color, align, weight, track) {
    ctx.save();
    ctx.font = (weight || 700) + ' ' + size + 'px "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = 'alphabetic';
    if (track) {
      var chars = String(str).split('');
      var total = 0, i;
      for (i = 0; i < chars.length; i++) total += ctx.measureText(chars[i]).width + track;
      total -= track;
      var cx = align === 'center' ? x - total / 2 : (align === 'right' ? x - total : x);
      ctx.textAlign = 'left';
      for (i = 0; i < chars.length; i++) {
        ctx.fillStyle = color;
        ctx.fillText(chars[i], cx, y);
        cx += ctx.measureText(chars[i]).width + track;
      }
    } else {
      ctx.fillStyle = color;
      ctx.fillText(str, x, y);
    }
    ctx.restore();
  }

  /* How wide `text` would draw that string, tracking included. Used to size a
     plate behind a label so the plate always fits the words on it. */
  function measure(ctx, str, size, weight, track) {
    ctx.save();
    ctx.font = (weight || 700) + ' ' + size + 'px "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
    var total;
    if (track) {
      var chars = String(str).split('');
      total = 0;
      for (var i = 0; i < chars.length; i++) total += ctx.measureText(chars[i]).width + track;
      total -= track;
    } else {
      total = ctx.measureText(String(str)).width;
    }
    ctx.restore();
    return total;
  }

  function outlineText(ctx, str, x, y, size, fill, stroke, align, track) {
    ctx.save();
    ctx.font = '800 ' + size + 'px "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = align || 'center';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.16);
    ctx.strokeStyle = stroke; ctx.strokeText(str, x, y);
    ctx.fillStyle = fill; ctx.fillText(str, x, y);
    ctx.restore();
  }

  /* Break a string into lines that fit `maxWidth`, honouring any newlines
     already in it. Character blurbs are written by hand and get edited, so
     they must wrap rather than run off into the next column. */
  function wrapText(ctx, str, maxWidth, size, weight) {
    ctx.save();
    ctx.font = (weight || 600) + ' ' + size + 'px "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
    var out = [];
    var paras = String(str).split('\n');
    for (var p = 0; p < paras.length; p++) {
      var words = paras[p].split(/\s+/), line = '';
      for (var i = 0; i < words.length; i++) {
        var probe = line ? line + ' ' + words[i] : words[i];
        if (ctx.measureText(probe).width > maxWidth && line) {
          out.push(line);
          line = words[i];
        } else {
          line = probe;
        }
      }
      if (line) out.push(line);
    }
    ctx.restore();
    return out;
  }

  /* ---- health bars ------------------------------------------------------- */
  function bar(ctx, f, side, ghost) {
    var W = 152, H = 12;
    var x = side === 0 ? 14 : S.W - 14 - W;
    var y = 14;
    var pct = U.clamp(f.health / f.maxHealth, 0, 1);
    var gpct = U.clamp(ghost / f.maxHealth, 0, 1);

    /* frame */
    ctx.fillStyle = 'rgba(10,8,12,.72)';
    ctx.fillRect(x - 3, y - 3, W + 6, H + 6);
    ctx.fillStyle = '#241c22';
    ctx.fillRect(x, y, W, H);

    /* Both bars drain toward the middle of the screen, so the remaining
       health always sits against the outer edge — the arcade convention. */
    function fillFrom(p, style) {
      var w = W * p;
      if (w <= 0) return;
      ctx.fillStyle = style;
      if (side === 0) ctx.fillRect(x, y, w, H);
      else ctx.fillRect(x + W - w, y, w, H);
    }
    fillFrom(gpct, '#e8c84a');
    var g = ctx.createLinearGradient(0, y, 0, y + H);
    if (pct > 0.35) { g.addColorStop(0, '#6fe36f'); g.addColorStop(0.5, '#2fb02f'); g.addColorStop(1, '#1c7a1c'); }
    else { g.addColorStop(0, '#ff8a6a'); g.addColorStop(0.5, '#e0402a'); g.addColorStop(1, '#a01a10'); }
    fillFrom(pct, g);

    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, W - 1, H - 1);

    /* name plate */
    text(ctx, f.chr.displayName, side === 0 ? x : x + W, y + H + 11, 10,
         '#ffe9b8', side === 0 ? 'left' : 'right', 700, 0.6);

    /* round win pips */
    for (var i = 0; i < 2; i++) {
      var px = side === 0 ? x + 2 + i * 12 : x + W - 8 - i * 12;
      var py = y + H + 17;
      ctx.beginPath(); ctx.arc(px + 3, py + 3, 4, 0, Math.PI * 2);
      ctx.fillStyle = i < f.roundWins ? '#ffd24a' : 'rgba(255,255,255,.20)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; ctx.stroke();
    }

    /* stun bar, only once it means something */
    if (f.stun > 4) {
      var sw = W * 0.62, sx = side === 0 ? x : x + W - sw;
      var sy = y + H + 24;
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(sx - 1, sy - 1, sw + 2, 5);
      ctx.fillStyle = f.stun >= f.stunMax * 0.85 ? '#ff5b5b' : '#7ec8ff';
      var swf = sw * U.clamp(f.stun / f.stunMax, 0, 1);
      ctx.fillRect(side === 0 ? sx : sx + sw - swf, sy, swf, 3);
    }
  }

  function meterBar(ctx, f, side) {
    var W = 118, H = 8;
    var x = side === 0 ? 14 : S.W - 14 - W;
    var y = S.H - 16;
    ctx.fillStyle = 'rgba(10,8,12,.72)';
    ctx.fillRect(x - 2, y - 2, W + 4, H + 4);
    ctx.fillStyle = '#1d1a24';
    ctx.fillRect(x, y, W, H);
    var pct = U.clamp(f.meter / f.maxMeter, 0, 1);
    var w = W * pct;
    var full = pct >= 1;
    var g = ctx.createLinearGradient(0, y, 0, y + H);
    if (full) { g.addColorStop(0, '#fff3b0'); g.addColorStop(1, '#f0a020'); }
    else { g.addColorStop(0, '#8fd6ff'); g.addColorStop(1, '#2a7fd0'); }
    ctx.fillStyle = g;
    if (side === 0) ctx.fillRect(x, y, w, H); else ctx.fillRect(x + W - w, y, w, H);
    if (full) {
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(Date.now() * 0.012);
      ctx.strokeStyle = '#fff6cc'; ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 1.5, y - 1.5, W + 3, H + 3);
      ctx.globalAlpha = 1;
      text(ctx, 'SUPER', side === 0 ? x + W + 6 : x - 6, y + H, 9, '#ffe07a',
           side === 0 ? 'left' : 'right', 800, 0.8);
    }
  }

  function timer(ctx, seconds) {
    var s = Math.max(0, Math.ceil(seconds));
    var str = s < 10 ? '0' + s : String(s);
    ctx.save();
    ctx.fillStyle = 'rgba(10,8,12,.72)';
    ctx.fillRect(S.W / 2 - 24, 8, 48, 30);
    outlineText(ctx, str, S.W / 2, 32, 26, s <= 10 ? '#ff6b5b' : '#ffe9b8', '#1a1218', 'center');
    ctx.restore();
  }

  function combo(ctx, f, side) {
    if (f.comboCount < 2) return;
    var x = side === 0 ? 26 : S.W - 26;
    var y = 78;
    outlineText(ctx, f.comboCount + ' HIT', x, y, 17, '#ffe07a', '#2a1408',
                side === 0 ? 'left' : 'right');
    outlineText(ctx, 'COMBO', x, y + 13, 10, '#fff', '#2a1408',
                side === 0 ? 'left' : 'right');
  }

  /* ---- particles --------------------------------------------------------- */
  function drawFx(ctx, list, camX) {
    for (var i = list.length - 1; i >= 0; i--) {
      var e = list[i];
      var sx = e.x - camX, sy = S.FLOOR_Y - e.y;
      e.t++;
      ctx.save();
      if (e.kind === 'impact') {
        /* A Street Fighter II hit spark is a solid shape, not a spray of
           lines: a fat white star that flashes out over four or five frames
           with a coloured rim behind it. At the arcade resolution a 2px line
           radiating outwards is a scratch, and reads as an error rather than
           a hit. */
        var life = e.big ? 6 : 5;
        if (e.t > life) { list.splice(i, 1); ctx.restore(); continue; }
        var k1 = e.t / life;
        var R = (e.big ? 13 : 9) * (0.62 + k1 * 0.62);
        var pts = e.big ? 5 : 4;
        function star(rad, inner, spin) {
          ctx.beginPath();
          for (var q = 0; q < pts * 2; q++) {
            var a2 = (q / (pts * 2)) * Math.PI * 2 + spin;
            var rr = (q % 2 ? rad * inner : rad);
            var px = sx + Math.cos(a2) * rr, py = sy + Math.sin(a2) * rr;
            if (q === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
        }
        ctx.globalAlpha = Math.max(0, 1 - k1 * 1.15);
        ctx.fillStyle = e.color || '#ffb43a';
        star(R * 1.28, 0.34, e.spin || 0.3);
        ctx.fill();
        ctx.globalAlpha = Math.max(0, 1 - k1 * 1.8);
        ctx.fillStyle = '#fff8dc';
        star(R * 0.92, 0.38, (e.spin || 0.3) + 0.4);
        ctx.fill();
        /* the white core, gone in three frames */
        if (e.t < 3) {
          ctx.globalAlpha = 1 - e.t / 3;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(sx, sy, R * (e.big ? 0.6 : 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
        /* chips thrown off the impact */
        ctx.globalAlpha = Math.max(0, 1 - k1);
        ctx.fillStyle = e.color || '#ffb43a';
        for (var cq = 0; cq < (e.big ? 6 : 4); cq++) {
          var ca = (cq / (e.big ? 6 : 4)) * Math.PI * 2 + (e.spin || 0);
          var cd = R * (1.6 + k1 * 2.2);
          ctx.fillRect(sx + Math.cos(ca) * cd - 1, sy + Math.sin(ca) * cd - 1, 2, 2);
        }
      } else if (e.kind === 'guard') {
        ctx.globalAlpha = Math.max(0, 1 - e.t / 6);
        ctx.fillStyle = '#bfe9ff';
        var gr = 9 + e.t * 1.2;
        ctx.beginPath();
        ctx.moveTo(sx - 3, sy - gr);
        ctx.quadraticCurveTo(sx + gr * 0.9, sy, sx - 3, sy + gr);
        ctx.quadraticCurveTo(sx + gr * 0.34, sy, sx - 3, sy - gr);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = Math.max(0, 0.9 - e.t / 5);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(sx - 2, sy - gr * 0.6);
        ctx.quadraticCurveTo(sx + gr * 0.5, sy, sx - 2, sy + gr * 0.6);
        ctx.quadraticCurveTo(sx + gr * 0.18, sy, sx - 2, sy - gr * 0.6);
        ctx.closePath();
        ctx.fill();
        if (e.t > 6) list.splice(i, 1);
      } else if (e.kind === 'dust') {
        ctx.globalAlpha = Math.max(0, 0.55 - e.t / 18);
        ctx.fillStyle = '#e8dcc4';
        for (var d = 0; d < (e.n || 5); d++) {
          var ang = Math.PI + (d / (e.n || 5)) * Math.PI;
          var rr = e.t * 1.6;
          ctx.beginPath();
          ctx.arc(sx + Math.cos(ang) * rr * 1.6, sy + Math.sin(ang) * rr * 0.5 - e.t * 0.2,
                  3.2 - e.t * 0.12, 0, Math.PI * 2);
          ctx.fill();
        }
        if (e.t > 16) list.splice(i, 1);
      } else if (e.kind === 'poof') {
        ctx.globalAlpha = Math.max(0, 0.85 - e.t / 14);
        ctx.fillStyle = '#d9c6ef';
        for (var q = 0; q < 8; q++) {
          var qa = (q / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(sx + Math.cos(qa) * e.t * 2.2, sy + Math.sin(qa) * e.t * 2.2, 5 - e.t * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        if (e.t > 13) list.splice(i, 1);
      } else if (e.kind === 'spark') {
        ctx.globalAlpha = Math.max(0, 1 - e.t / 8);
        ctx.strokeStyle = '#c8f0ff'; ctx.lineWidth = 1.6;
        for (var z = 0; z < 5; z++) {
          ctx.beginPath();
          var zx = sx, zy = sy - 22;
          ctx.moveTo(zx, zy);
          for (var seg = 0; seg < 4; seg++) {
            zx += (Math.random() - 0.5) * 22; zy += 11;
            ctx.lineTo(zx, zy);
          }
          ctx.stroke();
        }
        if (e.t > 6) list.splice(i, 1);
      } else if (e.kind === 'text') {
        ctx.globalAlpha = Math.max(0, 1 - e.t / 40);
        /* keep it on screen — a popup half off the edge reads as a glitch */
        var half = (e.str.length * (e.size || 15) * 0.30);
        var tx = U.clamp(sx, half + 4, S.W - half - 4);
        outlineText(ctx, e.str, tx, sy - e.t * 0.7, e.size || 15, e.color || '#ffe07a', '#2a1408', 'center');
        if (e.t > 42) list.splice(i, 1);
      } else {
        list.splice(i, 1);
      }
      ctx.restore();
    }
  }

  /* ---- projectiles ------------------------------------------------------- */
  function drawProjectile(ctx, p, camX, t) {
    var sx = p.x - camX, sy = S.FLOOR_Y - p.y;
    ctx.save();
    ctx.translate(sx, sy);
    var pulse = 1 + 0.08 * Math.sin(t * 0.4 + p.x * 0.1);
    if (p.style === 'blade') {
      ctx.scale(p.facing, 1);
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = p.color2;
      ctx.beginPath(); ctx.ellipse(-14, 0, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(16, 0); ctx.lineTo(-8, -8); ctx.lineTo(-4, 0); ctx.lineTo(-8, 8);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = p.color2;
      ctx.beginPath();
      ctx.moveTo(11, 0); ctx.lineTo(-4, -4); ctx.lineTo(-2, 0); ctx.lineTo(-4, 4);
      ctx.closePath(); ctx.fill();
    } else if (p.style === 'wave') {
      /* A growl, drawn as sound rather than as a ball: nested arcs racing
         forward off a bright core, breathing in and out as they travel. */
      ctx.scale(p.facing, 1);
      var rings = p.super ? 5 : 4;
      for (var k = 0; k < rings; k++) {
        var rr = (p.w * 0.30) + k * (p.w * 0.20) + Math.sin(t * 0.22 - k * 0.8) * 1.6;
        ctx.globalAlpha = (0.85 - k * 0.15) * (p.super ? 1 : 0.9);
        ctx.strokeStyle = k === 0 ? p.color2 : p.color;
        ctx.lineWidth = (p.super ? 3.4 : 2.6) - k * 0.45;
        ctx.beginPath();
        ctx.arc(-k * (p.w * 0.13), 0, rr, -1.05, 1.05);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.9;
      var cg = ctx.createRadialGradient(0, 0, 0, 0, 0, p.h * 0.42);
      cg.addColorStop(0, p.color2);
      cg.addColorStop(0.6, p.color);
      cg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.ellipse(0, 0, p.h * 0.34, p.h * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      /* a short trail so it reads as travelling */
      ctx.globalAlpha = 0.30;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.6;
      for (var q = -1; q <= 1; q += 2) {
        ctx.beginPath();
        ctx.moveTo(-p.w * 0.28, q * p.h * 0.16);
        ctx.lineTo(-p.w * 0.72, q * p.h * 0.30);
        ctx.stroke();
      }

    } else if (p.style === 'fluff') {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = p.color;
      for (var k = 0; k < 7; k++) {
        var a = (k / 7) * Math.PI * 2 + t * 0.05;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 7, Math.sin(a) * 7, 7 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.color2;
      ctx.beginPath(); ctx.arc(0, 0, 7 * pulse, 0, Math.PI * 2); ctx.fill();
    } else {
      var R = (p.w / 2) * pulse;
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(-p.facing * 13, 0, R * 1.5, R * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      var g = ctx.createRadialGradient(0, 0, 1, 0, 0, R);
      g.addColorStop(0, p.color2); g.addColorStop(0.55, p.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
      /* a couple of whiskers of fur trailing off it */
      ctx.strokeStyle = p.color2; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.8;
      for (var w = -1; w <= 1; w++) {
        ctx.beginPath();
        ctx.moveTo(-p.facing * R * 0.6, w * 4);
        ctx.lineTo(-p.facing * (R * 1.5 + 5), w * 8);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  CF.HUD = {
    text: text, outlineText: outlineText, wrapText: wrapText, measure: measure,
    bar: bar, meterBar: meterBar, timer: timer, combo: combo,
    drawFx: drawFx, drawProjectile: drawProjectile
  };
})();
