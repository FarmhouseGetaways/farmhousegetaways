/* ==========================================================================
   Cat Fighter II — skeleton and cat rendering

   Everything is drawn from a small joint rig rather than sprite sheets, so a
   new move needs a handful of numbers instead of thirty hand-drawn frames.
   Author coordinates are Y-UP with the origin between the feet and +X
   FORWARD; the canvas transform does the flipping.

   Limb angles are absolute and measured from straight-down, rotating toward
   +X. So 0 = hanging down, 90 = pointing forward, 180 = straight up.
   ========================================================================== */
(function () {
  var U = CF.util, DEG = U.DEG;

  /* Proportions, in screen units. A cat stands about 96 tall in a 224-tall
     screen, which is roughly the Street Fighter II sprite-to-screen ratio. */
  var P = {
    torsoLen: 26,
    headR: 17,
    upperArm: 13, foreArm: 12,
    thigh: 17.5, shin: 16.5,
    tail: [14, 12, 10],
    shoulderY: -2, shoulderX: 3.4,
    /* Poses were authored against 21+21 legs. Shortening them to a stockier
       fighting-game build would leave every pose hovering, so pelvis height
       is scaled by the same ratio and the whole library still lands on the
       floor without a single number being re-typed. */
    pelvisScale: 34 / 42
  };
  CF.PROP = P;

  function pt(x, y) { return { x: x, y: y }; }
  function seg(from, ang, len) {
    var a = ang * DEG;
    return pt(from.x + len * Math.sin(a), from.y - len * Math.cos(a));
  }

  /* Per-character build. `girth` fattens the drawing, `limb` lengthens the
     reach, `head` sizes the skull — so a heavyweight reads as one from the
     silhouette alone, before it has thrown a single punch. */
  var DEFAULT_BUILD = { s: 1, girth: 1, limb: 1, head: 1 };

  /* ---- Solve a pose into world-space joints ------------------------------ */
  function solve(pose, scale, build) {
    var B = build || DEFAULT_BUILD;
    var s = (scale || 1) * (B.s || 1);
    var lm = B.limb || 1;
    var L = function (v) { return v * s * lm; };

    var pelvis = pt(pose.px * s, pose.py * P.pelvisScale * s * lm);
    var t = pose.torso * DEG;
    var tl = P.torsoLen * s;
    var neck = pt(pelvis.x + tl * Math.sin(t), pelvis.y + tl * Math.cos(t));

    var shF = pt(neck.x + P.shoulderX * s, neck.y + P.shoulderY * s);
    var shB = pt(neck.x - P.shoulderX * s * 0.6, neck.y + P.shoulderY * s);

    var elbF = seg(shF, pose.armF[0], L(P.upperArm));
    var handF = seg(elbF, pose.armF[0] + pose.armF[1], L(P.foreArm));
    var elbB = seg(shB, pose.armB[0], L(P.upperArm));
    var handB = seg(elbB, pose.armB[0] + pose.armB[1], L(P.foreArm));

    var hipF = pt(pelvis.x + L(2), pelvis.y);
    var hipB = pt(pelvis.x - L(2), pelvis.y);
    var kneeF = seg(hipF, pose.legF[0], L(P.thigh));
    var footF = seg(kneeF, pose.legF[0] + pose.legF[1], L(P.shin));
    var kneeB = seg(hipB, pose.legB[0], L(P.thigh));
    var footB = seg(kneeB, pose.legB[0] + pose.legB[1], L(P.shin));

    var head = pt(neck.x + pose.head[0] * s, neck.y + pose.head[1] * s * (B.head || 1));

    /* `tailLen` stretches the tail. A tail whip has to actually reach the
       thing it hits, and a cat's tail at rest is nowhere near long enough —
       so the pose lengthens it through the swing, which reads as a whip
       cracking rather than as a cheat. */
    var tl = pose.tailLen === undefined ? 1 : pose.tailLen;
    var tailRoot = pt(pelvis.x - 13 * s * (B.girth || 1), pelvis.y + 4 * s);
    var t1 = seg(tailRoot, pose.tail[0], L(P.tail[0]) * tl);
    var t2 = seg(t1, pose.tail[0] + pose.tail[1], L(P.tail[1]) * tl);
    var t3 = seg(t2, pose.tail[0] + pose.tail[1] + pose.tail[2], L(P.tail[2]) * tl);

    return {
      s: s, girth: (B.girth || 1), pose: pose,
      pelvis: pelvis, neck: neck, head: head,
      headR: P.headR * s * (B.head || 1), headRot: pose.head[2] || 0,
      shF: shF, elbF: elbF, handF: handF,
      shB: shB, elbB: elbB, handB: handB,
      hipF: hipF, kneeF: kneeF, footF: footF,
      hipB: hipB, kneeB: kneeB, footB: footB,
      tail: [tailRoot, t1, t2, t3]
    };
  }

  /* ---- Drawing helpers --------------------------------------------------- */
  function capsule(ctx, a, b, r1, r2, fill, stroke) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.hypot(dx, dy) || 0.001;
    var nx = -dy / len, ny = dx / len;
    ctx.beginPath();
    ctx.moveTo(a.x + nx * r1, a.y + ny * r1);
    ctx.lineTo(b.x + nx * r2, b.y + ny * r2);
    ctx.arc(b.x, b.y, r2, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
    ctx.lineTo(a.x - nx * r1, a.y - ny * r1);
    ctx.arc(a.x, a.y, r1, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke(); }
  }

  function blob(ctx, x, y, rx, ry, rot, fill, stroke) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke(); }
    ctx.restore();
  }

  /* ---- Fur patterns ------------------------------------------------------ */
  function drawPattern(ctx, c, j, part) {
    var pat = c.pattern;
    ctx.save();
    if (part === 'torso') {
      var mid = pt((j.pelvis.x + j.neck.x) / 2, (j.pelvis.y + j.neck.y) / 2);
      var ang = Math.atan2(j.neck.x - j.pelvis.x, j.neck.y - j.pelvis.y);
      ctx.translate(mid.x, mid.y); ctx.rotate(-ang);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = c.marks;
      if (pat === 'tabby') {
        for (var i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.ellipse(0, i * 9, 11, 2.1, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (pat === 'tuxedo') {
        ctx.fillStyle = c.belly;
        ctx.beginPath(); ctx.ellipse(3, -2, 6.5, 15, 0, 0, Math.PI * 2); ctx.fill();
      } else if (pat === 'calico') {
        ctx.beginPath(); ctx.ellipse(-4, -7, 6, 7, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.marks2 || c.belly;
        ctx.beginPath(); ctx.ellipse(5, 6, 5, 6, -0.3, 0, Math.PI * 2); ctx.fill();
      } else if (pat === 'tortie') {
        ctx.fillStyle = c.marks;
        ctx.beginPath(); ctx.ellipse(-3, -5, 7, 9, 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.marks2 || c.fur2;
        ctx.beginPath(); ctx.ellipse(4, 4, 6, 8, -0.4, 0, Math.PI * 2); ctx.fill();
      } else if (pat === 'siamese') {
        var g = ctx.createLinearGradient(0, -16, 0, 16);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, c.marks);
        ctx.globalAlpha = 0.4; ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, 0, 12, 17, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ---- The cat ----------------------------------------------------------- */
  function drawCat(ctx, j, c, opts) {
    opts = opts || {};
    var flash = opts.flash;        // 'hit' | 'white' | null
    var fur = flash === 'white' ? '#ffffff' : c.fur;
    var fur2 = flash === 'white' ? '#eeeeee' : c.fur2;
    var belly = flash === 'white' ? '#ffffff' : c.belly;
    var line = flash === 'white' ? '#ffffff' : c.line || 'rgba(30,22,18,.55)';

    var G = j.girth || 1;
    var limbR = 6.2 * j.s * G, limbR2 = 4.7 * j.s * G;

    /* The tail normally hangs behind the cat. A pose can set `tailFront` to
       bring it over the body instead, which is what a tail whip needs —
       otherwise the business end of the attack is hidden behind the torso. */
    function drawTail(front) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(j.tail[0].x, j.tail[0].y);
      ctx.quadraticCurveTo(j.tail[1].x, j.tail[1].y, j.tail[2].x, j.tail[2].y);
      ctx.quadraticCurveTo(j.tail[2].x, j.tail[2].y, j.tail[3].x, j.tail[3].y);
      ctx.lineCap = 'round';
      ctx.strokeStyle = line; ctx.lineWidth = 9.4 * j.s * G; ctx.stroke();
      ctx.strokeStyle = front ? fur : fur2; ctx.lineWidth = 8.0 * j.s * G; ctx.stroke();
      ctx.strokeStyle = front ? belly : fur; ctx.lineWidth = 5.2 * j.s * G; ctx.stroke();
      if (c.tailTip) {
        ctx.beginPath(); ctx.arc(j.tail[3].x, j.tail[3].y, 4.0 * j.s * G, 0, Math.PI * 2);
        ctx.fillStyle = flash === 'white' ? '#fff' : c.tailTip; ctx.fill();
      }
      ctx.restore();
    }
    var tailUp = (j.pose && j.pose.tailFront > 0.5);
    if (!tailUp) drawTail(false);

    /* --- back limbs --- */
    capsule(ctx, j.hipB, j.kneeB, limbR * 1.15, limbR2, fur2, null);
    capsule(ctx, j.kneeB, j.footB, limbR2, limbR2 * 0.9, fur2, null);
    blob(ctx, j.footB.x, j.footB.y, 6.4 * j.s * G, 4.2 * j.s * G, 0, fur2);

    capsule(ctx, j.shB, j.elbB, limbR * 0.95, limbR2 * 0.9, fur2, null);
    capsule(ctx, j.elbB, j.handB, limbR2 * 0.9, limbR2 * 0.85, fur2, null);
    blob(ctx, j.handB.x, j.handB.y, 5.6 * j.s * G, 5.2 * j.s * G, 0, fur2);

    /* --- torso --- */
    var hipW = 12.8 * j.s * G, chestW = 14.2 * j.s * G;
    capsule(ctx, j.pelvis, j.neck, hipW, chestW, fur, line);
    drawPattern(ctx, c, j, 'torso');
    // belly highlight
    var bx = U.lerp(j.pelvis.x, j.neck.x, 0.45) + 4 * j.s;
    var by = U.lerp(j.pelvis.y, j.neck.y, 0.45);
    if (c.pattern !== 'tuxedo') {
      ctx.globalAlpha = 0.5;
      blob(ctx, bx, by, 5 * j.s, 11 * j.s, 0, belly);
      ctx.globalAlpha = 1;
    }

    /* chest ruff — cheap, and it makes the silhouette read as a cat */
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = belly;
    var rx = U.lerp(j.pelvis.x, j.neck.x, 0.86), ry = U.lerp(j.pelvis.y, j.neck.y, 0.86);
    var RG = G;
    ctx.beginPath();
    for (var rf = 0; rf < 7; rf++) {
      var ra = -0.5 + rf * 0.42;
      ctx.arc(rx + Math.cos(ra) * 5.5 * j.s * RG, ry + Math.sin(ra) * 3.4 * j.s - 2 * j.s,
              3.6 * j.s * RG, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();

    /* --- front limbs --- */
    capsule(ctx, j.hipF, j.kneeF, limbR * 1.2, limbR2, fur, line);
    capsule(ctx, j.kneeF, j.footF, limbR2, limbR2 * 0.95, fur, line);
    blob(ctx, j.footF.x, j.footF.y, 7.0 * j.s * G, 4.4 * j.s * G, 0, fur, line);

    capsule(ctx, j.shF, j.elbF, limbR, limbR2 * 0.95, fur, line);
    capsule(ctx, j.elbF, j.handF, limbR2 * 0.95, limbR2 * 0.9, fur, line);
    // fist / paw
    blob(ctx, j.handF.x, j.handF.y, 6.4 * j.s * G, 5.9 * j.s * G, 0, fur, line);
    if (c.gloves) blob(ctx, j.handF.x, j.handF.y, 6.8 * j.s, 6.3 * j.s, 0, c.gloves, line);
    if (c.gloves) blob(ctx, j.handB.x, j.handB.y, 6.0 * j.s, 5.6 * j.s, 0, c.gloves, null);

    if (tailUp) drawTail(true);

    /* --- head --- */
    drawHead(ctx, j, c, fur, fur2, belly, line, opts);
  }

  function drawHead(ctx, j, c, fur, fur2, belly, line, opts) {
    var r = j.headR, s = j.s;
    var es = s;                  // facial detail scales with the figure
    ctx.save();
    ctx.translate(j.head.x, j.head.y);
    ctx.rotate(-(j.headRot || 0) * DEG);

    /* ears — drawn before the skull so they tuck behind it */
    function ear(sx) {
      ctx.beginPath();
      ctx.moveTo(sx * r * 0.38, r * 0.62);
      ctx.lineTo(sx * r * 0.98, r * 1.62);
      ctx.lineTo(sx * r * 1.02, r * 0.42);
      ctx.closePath();
      ctx.fillStyle = fur; ctx.fill();
      ctx.strokeStyle = line; ctx.lineWidth = 1.1 * es; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx * r * 0.52, r * 0.66);
      ctx.lineTo(sx * r * 0.88, r * 1.32);
      ctx.lineTo(sx * r * 0.9, r * 0.56);
      ctx.closePath();
      ctx.fillStyle = c.inner || '#e8a6ad'; ctx.fill();
    }
    ear(1); ear(-0.75);

    /* skull */
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.02, r * 0.94, 0, 0, Math.PI * 2);
    ctx.fillStyle = fur; ctx.fill();
    ctx.strokeStyle = line; ctx.lineWidth = 1.3 * es; ctx.stroke();

    /* head markings */
    if (c.pattern === 'tabby') {
      ctx.strokeStyle = c.marks; ctx.lineWidth = 1.6 * es; ctx.globalAlpha = 0.9;
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 3.2, r * 0.9);
        ctx.lineTo(i * 4.6, r * 0.42);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (c.pattern === 'tuxedo') {
      ctx.beginPath();
      ctx.ellipse(r * 0.28, -r * 0.28, r * 0.62, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = belly; ctx.fill();
    } else if (c.pattern === 'siamese' || c.pattern === 'calico' || c.pattern === 'tortie') {
      ctx.globalAlpha = c.pattern === 'siamese' ? 0.55 : 0.9;
      ctx.beginPath();
      ctx.ellipse(-r * 0.45, r * 0.2, r * 0.6, r * 0.66, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = c.marks; ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* muzzle. An elder cat's goes pale and spreads up the cheeks — the one
       marking that reads as age without needing a single grey hair drawn. */
    if (c.elder) {
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(r * 0.36, -r * 0.28, r * 0.66, r * 0.50, 0, 0, Math.PI * 2);
      ctx.fillStyle = c.silver || '#d8d3c8'; ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.beginPath();
    ctx.ellipse(r * 0.42, -r * 0.34, r * 0.56, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = belly; ctx.fill();

    /* an open mouth, for a cat that is making a noise */
    if (opts.mouth === 'open') {
      ctx.beginPath();
      ctx.ellipse(r * 0.56, -r * 0.46, r * 0.23, r * 0.18, -0.12, 0, Math.PI * 2);
      ctx.fillStyle = '#4a2026'; ctx.fill();
      ctx.beginPath();
      ctx.ellipse(r * 0.56, -r * 0.41, r * 0.14, r * 0.095, -0.12, 0, Math.PI * 2);
      ctx.fillStyle = '#c9707e'; ctx.fill();
      /* two small fangs, hanging from the top lip */
      ctx.fillStyle = '#fdfbf5';
      ctx.beginPath();
      ctx.moveTo(r * 0.40, -r * 0.36); ctx.lineTo(r * 0.47, -r * 0.36);
      ctx.lineTo(r * 0.435, -r * 0.47); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(r * 0.66, -r * 0.36); ctx.lineTo(r * 0.73, -r * 0.36);
      ctx.lineTo(r * 0.695, -r * 0.47); ctx.closePath(); ctx.fill();
    }

    /* nose */
    ctx.beginPath();
    ctx.moveTo(r * 0.66, -r * 0.12);
    ctx.lineTo(r * 0.9, -r * 0.06);
    ctx.lineTo(r * 0.78, -r * 0.3);
    ctx.closePath();
    ctx.fillStyle = c.nose || '#d98a94'; ctx.fill();

    /* eyes */
    var eyeState = opts.eyes || 'normal';
    function eye(ex, ey, sc) {
      if (eyeState === 'closed' || eyeState === 'ko') {
        ctx.strokeStyle = line; ctx.lineWidth = 1.6 * es;
        ctx.beginPath();
        if (eyeState === 'ko') {  // X eyes
          ctx.moveTo(ex - 2.6 * sc, ey - 2.6 * sc); ctx.lineTo(ex + 2.6 * sc, ey + 2.6 * sc);
          ctx.moveTo(ex + 2.6 * sc, ey - 2.6 * sc); ctx.lineTo(ex - 2.6 * sc, ey + 2.6 * sc);
        } else {
          ctx.moveTo(ex - 3 * sc, ey); ctx.quadraticCurveTo(ex, ey - 2 * sc, ex + 3 * sc, ey);
        }
        ctx.stroke();
        return;
      }
      var open = eyeState === 'angry' ? 0.78 : 1;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 3.4 * sc, 3.9 * sc * open, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fdfbf5'; ctx.fill();
      ctx.strokeStyle = line; ctx.lineWidth = 0.9 * es; ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(ex + 0.9 * sc, ey, 2.0 * sc, 3.2 * sc * open, 0, 0, Math.PI * 2);
      ctx.fillStyle = c.eye || '#8fd14f'; ctx.fill();
      ctx.beginPath();
      ctx.ellipse(ex + 1.0 * sc, ey, 0.8 * sc, 2.9 * sc * open, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#181414'; ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + 1.9 * sc, ey + 1.4 * sc, 0.85 * sc, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fill();
    }
    eye(r * 0.42, r * 0.2, es);
    eye(-r * 0.28, r * 0.22, 0.92 * es);

    if (eyeState === 'angry') {
      ctx.strokeStyle = line; ctx.lineWidth = 1.5 * es;
      ctx.beginPath();
      ctx.moveTo(r * 0.14, r * 0.62); ctx.lineTo(r * 0.72, r * 0.44);
      ctx.moveTo(-r * 0.54, r * 0.5); ctx.lineTo(-r * 0.04, r * 0.66);
      ctx.stroke();
    }

    if (c.elder) {
      /* silvered brows — a few hairs, not two painted dashes */
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.strokeStyle = c.silver || '#e8e4da';
      ctx.lineWidth = 0.85 * es;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r * 0.22, r * 0.56); ctx.quadraticCurveTo(r * 0.46, r * 0.64, r * 0.64, r * 0.52);
      ctx.moveTo(-r * 0.46, r * 0.50); ctx.quadraticCurveTo(-r * 0.26, r * 0.62, -r * 0.06, r * 0.58);
      ctx.stroke();
      ctx.restore();
    }

    /* whiskers */
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 0.8 * es;
    ctx.lineCap = 'round';
    for (var w = -1; w <= 1; w++) {
      ctx.beginPath();
      ctx.moveTo(r * 0.62, -r * 0.28 + w * r * 0.10);
      ctx.quadraticCurveTo(r * 1.3, -r * 0.30 + w * r * 0.26,
                           r * 1.75, -r * 0.24 + w * r * 0.37);
      ctx.stroke();
    }

    /* per-cat accessory */
    if (c.accessory === 'headband') {
      /* A band across the brow, not a sun visor: narrow, following the skull,
         with a knot at the side and two short tails behind. */
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, r * 0.02, r * 1.0, r * 0.93, 0, Math.PI * 0.08, Math.PI * 0.92);
      ctx.lineWidth = r * 0.30;
      ctx.strokeStyle = c.accent;
      ctx.stroke();
      ctx.restore();
      /* knot */
      ctx.beginPath();
      ctx.arc(-r * 0.86, r * 0.42, r * 0.17, 0, Math.PI * 2);
      ctx.fillStyle = c.accent; ctx.fill();
      /* two tails streaming back */
      ctx.strokeStyle = c.accent;
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.9 * es;
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, r * 0.44);
      ctx.quadraticCurveTo(-r * 1.5, r * 0.5, -r * 1.95, r * 0.86);
      ctx.stroke();
      ctx.lineWidth = 1.5 * es;
      ctx.beginPath();
      ctx.moveTo(-r * 0.9, r * 0.38);
      ctx.quadraticCurveTo(-r * 1.5, r * 0.18, -r * 1.85, r * 0.32);
      ctx.stroke();
    } else if (c.accessory === 'goggles') {
      ctx.fillStyle = 'rgba(30,30,38,.95)';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.52, r * 1.08, r * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
      [[r * 0.44, 1], [-r * 0.34, 0.9]].forEach(function (g) {
        ctx.beginPath();
        ctx.ellipse(g[0], r * 0.52, r * 0.32 * g[1], r * 0.28 * g[1], 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20,20,28,1)'; ctx.fill();
        ctx.beginPath();
        ctx.ellipse(g[0], r * 0.52, r * 0.22 * g[1], r * 0.19 * g[1], 0, 0, Math.PI * 2);
        ctx.fillStyle = c.accent; ctx.fill();
        ctx.beginPath();
        ctx.ellipse(g[0] + r * 0.08, r * 0.58, r * 0.08, r * 0.06, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fill();
      });
    } else if (c.accessory === 'collar') {
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.86, r * 0.84, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = c.accent; ctx.fill();
      ctx.beginPath(); ctx.arc(r * 0.2, -r * 1.02, r * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#f5d76e'; ctx.fill();
    } else if (c.accessory === 'crown') {
      ctx.fillStyle = c.accent;
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, r * 0.85); ctx.lineTo(-r * 0.4, r * 1.5);
      ctx.lineTo(0, r * 0.95); ctx.lineTo(r * 0.4, r * 1.5);
      ctx.lineTo(r * 0.7, r * 0.85); ctx.closePath(); ctx.fill();
    }

    ctx.restore();
  }

  /* Hurtboxes derived straight from the solved skeleton. Because they come
     from the pose, a crouch or a lean automatically ducks under things. */
  function hurtboxes(j) {
    function box(a, b, pad) {
      var x1 = Math.min(a.x, b.x) - pad, x2 = Math.max(a.x, b.x) + pad;
      var y1 = Math.min(a.y, b.y) - pad, y2 = Math.max(a.y, b.y) + pad;
      return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    }
    return [
      { x: j.head.x - j.headR, y: j.head.y - j.headR, w: j.headR * 2, h: j.headR * 2, part: 'head' },
      box(j.pelvis, j.neck, 11 * j.s),
      box(j.hipF, j.footF, 6 * j.s),
      box(j.hipB, j.footB, 5 * j.s)
    ];
  }

  CF.Rig = {
    DEFAULT_BUILD: DEFAULT_BUILD,
    solve: solve, drawCat: drawCat, hurtboxes: hurtboxes,
    capsule: capsule, blob: blob, P: P
  };
})();
