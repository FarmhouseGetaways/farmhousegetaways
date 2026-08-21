/* ==========================================================================
   Super Cat Fighter 6 — the character card

   The screen a cat gets to itself: lit from behind, name across the top, and
   its three specials with the buttons that actually bring them out. It is the
   reveal when you lock a cat in, and it is the roster page you can sit and
   read from the title screen.

   The buttons it prints are the buttons for the scheme you are playing on.
   A move list that names quarter-circles to somebody on the four-button
   layout is worse than no move list at all, so this asks `CF.Input` which
   scheme is live and prints that one.
   ========================================================================== */
(function () {
  var U = CF.util, S = CF.STAGE, HUD = CF.HUD;
  var W = S.W, H = S.H;

  /* Short enough to fit the screen. `MOVES.md` spells them out in full. */
  var MOTION_NAMES = {
    qcf: 'QCF', qcb: 'QCB', dp: 'DP', rdp: 'RDP',
    hcf: 'HCF', hcb: 'HCB', qcfx2: 'QCF QCF',
    p360: '360', mash: 'MASH', pp: 'HOLD PP'
  };

  function classicInput(m) {
    var btns = (m.buttons || []).join('/');
    if (m.charge) {
      return (m.charge === 'bf' ? 'HOLD BACK' : 'HOLD DOWN') +
             ' ' + (m.chargeFrames || 40) + 'f, ' +
             (m.charge === 'bf' ? 'FWD' : 'UP') + ' + ' + btns;
    }
    var base = MOTION_NAMES[m.motion] || (m.motion || '').toUpperCase();
    return m.motion === 'mash' ? base + ' ' + btns : base + ' + ' + btns;
  }

  /* On the four-button scheme every cat's moves are asked for the same way,
     which is the whole point of it. */
  var SIMPLE_INPUT = ['PUNCH + KICK', 'PUNCH + BLOCK'];

  /* One list, used for drawing the card, for hit-testing it, and for the
     generated move list — so the three can never disagree about what a move
     is called or how you do it. */
  function moveRows(chr) {
    var simple = CF.Input.getScheme() === 'simple';
    var out = [];
    (chr.specials || []).forEach(function (m, i) {
      out.push({
        tag: 'SPECIAL ' + (i + 1), name: m.name, desc: m.desc || '',
        input: simple ? (SIMPLE_INPUT[i] || SIMPLE_INPUT[0]) : classicInput(m),
        move: m
      });
    });
    (chr.supers || []).forEach(function (m) {
      out.push({
        tag: 'SUPER', name: m.name, desc: m.desc || '', big: true,
        input: simple ? 'DODGE + LUNGE' : classicInput(m),
        note: 'needs a full meter', move: m
      });
    });
    return out;
  }

  /* ---- the art ------------------------------------------------------------ */

  function rays(ctx, cx, cy, t, colour, n, alpha, len) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.004);
    ctx.fillStyle = colour;
    for (var i = 0; i < n; i++) {
      ctx.rotate(Math.PI * 2 / n);
      /* Clamped, and not for tidiness. Canvas SILENTLY IGNORES a globalAlpha
         outside 0..1 and keeps whatever was set before — so one ray whose
         brightness dipped a hair below zero drew at full opacity, as a solid
         white wedge across the card. */
      ctx.globalAlpha = U.clamp(alpha * (0.5 + 0.5 * Math.sin(t * 0.03 + i * 1.7)), 0, 1);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, -len * 0.075);
      ctx.lineTo(len, len * 0.075);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function catAt(ctx, chr, pose, x, yBase, scale, opts) {
    var j = CF.Rig.solve(pose, scale, chr.build);
    ctx.save();
    ctx.translate(x, yBase);
    ctx.scale(1, -1);
    CF.Rig.drawCat(ctx, j, chr.palette, opts || {});
    ctx.restore();
  }

  /* `o.t` animates, `o.intro` runs 0 to 1 for the entrance, `o.detail` turns
     the move descriptions on, `o.pick` is the highlighted row. */
  function draw(ctx, chr, o) {
    o = o || {};
    var t = o.t || 0;
    var intro = o.intro === undefined ? 1 : U.clamp(o.intro, 0, 1);
    var ease = 1 - Math.pow(1 - intro, 3);
    var pal = chr.palette;
    var accent = pal.accent || '#ffd166';

    ctx.fillStyle = '#0b0810';
    ctx.fillRect(0, 0, W, H);

    /* a wash pulled from the cat itself, so no two cards look alike */
    var wash = ctx.createRadialGradient(W * 0.34, H * 0.52, 8, W * 0.34, H * 0.52, 230);
    wash.addColorStop(0, pal.fur2 || '#3a3040');
    wash.addColorStop(0.55, 'rgba(20,12,26,.75)');
    wash.addColorStop(1, '#0b0810');
    ctx.globalAlpha = 0.85 * ease;
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    var cx = o.detail ? W * 0.22 : W * 0.24;
    var cy = H * 0.50;
    rays(ctx, cx, cy, t, accent, 14, 0.16 * ease, 300);
    rays(ctx, cx, cy, -t * 0.6, '#ffffff', 9, 0.06 * ease, 300);

    /* the spot the cat is standing in */
    var spot = ctx.createRadialGradient(cx, cy + 4, 4, cx, cy + 4, 92);
    spot.addColorStop(0, 'rgba(255,246,214,.30)');
    spot.addColorStop(1, 'rgba(255,246,214,0)');
    ctx.globalAlpha = ease;
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    /* ---- the cat ---- */
    var floor = H - (o.detail ? 44 : 34);
    var bob = Math.sin(t * 0.055) * 1.6;
    /* The reveal gets the triumphant pose held; the roster page, which you
       sit and read, gets the fighting stance breathing. */
    var pose = o.detail
      ? CF.Anim.cycle([CF.Pose.stand, CF.Pose.standB, CF.Pose.stand, CF.Pose.standC], 26, t)
      : CF.Anim.cycle([CF.Pose.winPose, CF.Pose.winPose, CF.Pose.tauntPose], 90, t);
    var scale = (o.detail ? 1.30 : 1.62);
    var slide = (1 - ease) * -70;

    ctx.save();
    ctx.globalAlpha = ease;
    /* a shadow, so the cat is standing on something */
    ctx.fillStyle = 'rgba(0,0,0,.42)';
    ctx.beginPath();
    ctx.ellipse(cx + slide, floor, 34 * scale * 0.6, 7 * scale * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    catAt(ctx, chr, pose, cx + slide, floor + bob, scale, { eyes: 'angry' });
    ctx.restore();

    /* ---- the name ---- */
    var nx = o.detail ? W * 0.45 : W * 0.47;
    var nameSlide = (1 - ease) * 120;
    ctx.save();
    ctx.globalAlpha = ease;
    HUD.outlineText(ctx, chr.displayName, nx + nameSlide, o.detail ? 40 : 58,
                    o.detail ? 24 : 30, '#ffe07a', '#1a1018', 'left', 1.6);
    HUD.text(ctx, (chr.subtitle || '').toUpperCase(), nx + nameSlide,
             o.detail ? 52 : 72, 9, '#ffb8a0', 'left', 700, 1.6);

    /* weight class — the trade the whole roster is built on */
    var cls = CF.CLASSES[chr.weightClass] || CF.CLASSES.medium;
    var clsCol = chr.weightClass === 'heavy' ? '#ff9d6a'
               : (chr.weightClass === 'light' ? '#8fe6ff' : '#c9d96a');
    var ty = o.detail ? 62 : 84;
    var label = cls.label + (chr.weightClass === 'heavy' ? ' — HARD TO MOVE'
              : chr.weightClass === 'light' ? ' — FAST, FRAGILE' : ' — EVEN');
    var plateW = Math.min(HUD.measure(ctx, label, 7.5, 700, 0.8) + 8, W - 8 - (nx - 2));
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(nx + nameSlide - 2, ty - 8, plateW, 12);
    ctx.fillStyle = clsCol;
    ctx.fillRect(nx + nameSlide - 2, ty - 8, 2, 12);
    HUD.text(ctx, label, nx + nameSlide + 4, ty, 7.5, clsCol, 'left', 700, 0.8);
    ctx.restore();

    /* ---- the moves ---- */
    var rows = moveRows(chr);
    var ry = o.detail ? 84 : 108;
    var step = o.detail ? 25 : 23;
    ctx.save();
    ctx.globalAlpha = ease;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], y = ry + i * step;
      var on = o.detail && o.pick === i;
      if (on) {
        ctx.fillStyle = 'rgba(255,224,122,.14)';
        ctx.fillRect(nx - 7, y - 11, W - nx - 3, step - 3);
        ctx.fillStyle = '#ffe07a';
        ctx.fillRect(nx - 7, y - 11, 2, step - 3);
      }
      /* Label and buttons share the top line, the move's name gets the one
         below to itself. Putting the two on the same line looked tidier right
         up until a cat turned up with a long move name and drove it straight
         through the buttons. */
      HUD.text(ctx, r.tag, nx, y - 2, 6.6,
               r.big ? '#ff9d6a' : 'rgba(255,240,220,.5)', 'left', 700, 0.8);
      HUD.text(ctx, r.input, W - 10, y - 2, 6.8,
               on ? '#ffe07a' : '#8fd6ff', 'right', 800, 0.4);
      HUD.text(ctx, r.name.toUpperCase(), nx, y + 8, r.big ? 10 : 9.4,
               r.big ? '#ffd24a' : '#ffe9c8', 'left', 800, 0.5);
    }
    ctx.restore();

    /* ---- what the highlighted move actually does ---- */
    if (o.detail) {
      var pickRow = rows[o.pick || 0];
      var by = H - 40;
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.fillRect(10, by, W - 20, 32);
      ctx.fillStyle = pickRow.big ? '#ff9d6a' : accent;
      ctx.fillRect(10, by, 2, 32);
      var lines = HUD.wrapText(ctx, pickRow.desc, W - 44, 7.4, 600);
      for (var L = 0; L < Math.min(lines.length, 3); L++) {
        HUD.text(ctx, lines[L], 17, by + 11 + L * 9, 7.4,
                 'rgba(255,240,220,.86)', 'left', 600, 0.2);
      }
    }

    if (!o.detail && o.prompt && intro > 0.9) {
      HUD.text(ctx, o.prompt, W - 12, H - 22, 7.5,
               'rgba(255,240,220,' + (0.4 + 0.35 * Math.sin(t * 0.11)) + ')',
               'right', 700, 1);
    }

    /* ---- letterbox, which is most of why this feels like a card ---- */
    var barH = 14 * Math.min(1, intro * 3);
    ctx.fillStyle = '#08060c';
    ctx.fillRect(0, 0, W, barH);
    ctx.fillRect(0, H - barH, W, barH);
    ctx.fillStyle = 'rgba(255,224,122,.22)';
    ctx.fillRect(0, barH - 1, W, 1);
    ctx.fillRect(0, H - barH, W, 1);

    /* the flash on arrival */
    if (intro < 0.42) {
      ctx.globalAlpha = Math.max(0, 1 - intro / 0.42) * 0.75;
      ctx.fillStyle = '#fff6e0';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  CF.Card = { draw: draw, moveRows: moveRows, MOTION_NAMES: MOTION_NAMES,
              classicInput: classicInput, SIMPLE_INPUT: SIMPLE_INPUT };
})();
