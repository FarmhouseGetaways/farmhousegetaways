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
    headR: 18.4,
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

  /* Nudge a hex colour lighter or darker. Used to separate the front limbs
     from the torso by TONE rather than by an outline, which keeps the
     silhouette unbroken while still letting you read an arm as an arm. */
  function shade(hex, amount) {
    if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
    var r = parseInt(hex.slice(1, 3), 16),
        g = parseInt(hex.slice(3, 5), 16),
        b = parseInt(hex.slice(5, 7), 16);
    function mix(v) {
      var t = amount > 0 ? 255 : 0;
      return Math.round(v + (t - v) * Math.abs(amount));
    }
    return 'rgb(' + mix(r) + ',' + mix(g) + ',' + mix(b) + ')';
  }

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

  /* ---- Drawing ------------------------------------------------------------

     The cat is drawn in TWO PASSES over one list of shapes.

     Pass one strokes every shape with a thick contour colour. Pass two fills
     them in draw order, which paints over all the interior strokes and leaves
     only the outer edge standing. The result is a single unbroken silhouette
     with one bold outline — the difference between a fighting-game character
     and a doll with visible joints, which is what you get if each limb draws
     its own outline.

     Everything that is not part of the silhouette — markings, the face, fur
     shading — goes in a third pass on top.
     ------------------------------------------------------------------------ */

  function capsulePath(ctx, a, b, r1, r2) {
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
  }

  function ellipsePath(ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
    ctx.closePath();
  }

  /* kept for callers that still want a one-off shape */
  function capsule(ctx, a, b, r1, r2, fill, stroke) {
    capsulePath(ctx, a, b, r1, r2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke(); }
  }
  function blob(ctx, x, y, rx, ry, rot, fill, stroke) {
    ellipsePath(ctx, x, y, rx, ry, rot);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.2; ctx.stroke(); }
  }

  function tailPath(ctx, j) {
    ctx.beginPath();
    ctx.moveTo(j.tail[0].x, j.tail[0].y);
    ctx.quadraticCurveTo(j.tail[1].x, j.tail[1].y, j.tail[2].x, j.tail[2].y);
    ctx.quadraticCurveTo(j.tail[2].x, j.tail[2].y, j.tail[3].x, j.tail[3].y);
  }

  function earPath(ctx, r, sx) {
    ctx.beginPath();
    ctx.moveTo(sx * r * 0.34, r * 0.56);
    ctx.quadraticCurveTo(sx * r * 0.74, r * 1.14, sx * r * 0.96, r * 1.60);
    ctx.quadraticCurveTo(sx * r * 1.06, r * 1.02, sx * r * 1.02, r * 0.40);
    ctx.closePath();
  }

  /* ---- fur patterns, drawn inside the body silhouette --------------------- */
  function drawPattern(ctx, c, j) {
    var pat = c.pattern;
    if (!pat || pat === 'solid') return;
    var mid = { x: (j.pelvis.x + j.neck.x) / 2, y: (j.pelvis.y + j.neck.y) / 2 };
    var ang = Math.atan2(j.neck.x - j.pelvis.x, j.neck.y - j.pelvis.y);
    /* markings grow with the cat, but only about half as fast as its girth */
    var s = j.s * (1 + ((j.girth || 1) - 1) * 0.45);
    ctx.save();
    ctx.translate(mid.x, mid.y);
    ctx.rotate(-ang);
    if (pat === 'tabby') {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = c.marks;
      for (var i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.ellipse(-1.5 * s, i * 7 * s, 12 * s, 2.0 * s, 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (pat === 'tuxedo') {
      ctx.fillStyle = c.belly;
      ctx.beginPath();
      ctx.ellipse(5.5 * s, -1 * s, 6.2 * s, 13.5 * s, 0.06, 0, Math.PI * 2);
      ctx.fill();
    } else if (pat === 'calico') {
      ctx.globalAlpha = 0.9; ctx.fillStyle = c.marks;
      ctx.beginPath(); ctx.ellipse(-4 * s, -7 * s, 7 * s, 8 * s, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.marks2 || c.belly;
      ctx.beginPath(); ctx.ellipse(5 * s, 6 * s, 6 * s, 7 * s, -0.3, 0, Math.PI * 2); ctx.fill();
    } else if (pat === 'tortie') {
      ctx.globalAlpha = 0.9; ctx.fillStyle = c.marks;
      ctx.beginPath(); ctx.ellipse(-3 * s, -5 * s, 8 * s, 10 * s, 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c.marks2 || c.fur2;
      ctx.beginPath(); ctx.ellipse(4 * s, 4 * s, 7 * s, 9 * s, -0.4, 0, Math.PI * 2); ctx.fill();
    } else if (pat === 'siamese') {
      var g = ctx.createLinearGradient(0, -20 * s, 0, 20 * s);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, c.marks);
      ctx.globalAlpha = 0.42; ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, 14 * s, 20 * s, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /* ---- the cat ------------------------------------------------------------ */

  function drawCat(ctx, j, c, opts) {
    opts = opts || {};
    var flash = opts.flash;
    var s = j.s, G = j.girth || 1;
    var white = flash === 'white';

    var fur   = white ? '#ffffff' : c.fur;
    var fur2  = white ? '#eeeeee' : c.fur2;
    var belly = white ? '#ffffff' : c.belly;
    /* One solid contour for the whole figure. The old per-cat lines were
       semi-transparent, which is fine for an internal seam and useless as a
       silhouette — a translucent dark edge on a dark stage is no edge at all. */
    var line  = white ? '#ffffff' : (c.outline || '#191410');

    /* A real taper — thick at the shoulder, slim at the wrist — is most of
       what stops a limb reading as a sausage. */
    var R_TOP = 6.9 * s * G, R_MID = 5.0 * s * G, R_END = 3.7 * s * G;
    var HAND = 6.9 * s * G, FOOT_X = 8.0 * s * G, FOOT_Y = 4.9 * s * G;
    var hipW = 10.4 * s * G, chestW = 15.2 * s * G;
    var OUTLINE = 1.9 * s;

    /* Three tones front to back: the shaded far side, the torso, and a
       slightly brighter near side. Depth without a single extra line. */
    /* The near limbs need to read by TONE, not just by an edge. Too small a
       difference and you get an outline floating on a flat field, which looks
       like an x-ray rather than an arm. */
    var furFront = white ? '#ffffff' : shade(c.fur, 0.15);
    var tailW = (c.longhair ? 11.0 : 8.4) * s * G;

    var shapes = [];
    function fillShape(path, colour) { shapes.push({ k: 'f', p: path, c: colour }); }
    function strokeShape(path, colour, w) { shapes.push({ k: 's', p: path, c: colour, w: w }); }

    var back = c.points ? c.marks : fur2;
    var shinF = c.points ? c.marks : (c.sock ? (c.sockColor || belly) : fur);
    var footF = c.points ? c.marks : shinF;
    var tailCol = c.points ? c.marks : fur;
    var tailUp = (j.pose && j.pose.tailFront > 0.5);

    function addTail() {
      strokeShape(function () { tailPath(ctx, j); }, tailUp ? tailCol : (c.points ? c.marks : fur2), tailW);
    }

    if (!tailUp) addTail();

    /* back leg and arm, in the shade */
    fillShape(function () { capsulePath(ctx, j.hipB, j.kneeB, R_TOP * 0.94, R_MID * 0.9); }, back);
    fillShape(function () { capsulePath(ctx, j.kneeB, j.footB, R_MID * 0.9, R_END * 0.9); }, back);
    fillShape(function () { ellipsePath(ctx, j.footB.x, j.footB.y, FOOT_X * 0.88, FOOT_Y * 0.88); }, back);
    fillShape(function () { capsulePath(ctx, j.shB, j.elbB, R_TOP * 0.82, R_MID * 0.82); }, c.points ? c.marks : fur2);
    fillShape(function () { capsulePath(ctx, j.elbB, j.handB, R_MID * 0.82, R_END * 0.82); }, c.points ? c.marks : fur2);
    fillShape(function () { ellipsePath(ctx, j.handB.x, j.handB.y, HAND * 0.82, HAND * 0.78); }, c.gloves || (c.points ? c.marks : fur2));

    /* the long-haired underlayer, wider than the body it sits behind */
    if (c.longhair) {
      fillShape(function () { capsulePath(ctx, j.pelvis, j.neck, hipW * 1.26, chestW * 1.20); }, fur2);
    }

    /* torso, and a neck mass so the head is not balanced on a stick */
    fillShape(function () { capsulePath(ctx, j.pelvis, j.neck, hipW, chestW); }, fur);
    fillShape(function () {
      ellipsePath(ctx, (j.neck.x + j.head.x) / 2, (j.neck.y + j.head.y) / 2,
                  chestW * 0.72, chestW * 0.62);
    }, fur);

    /* front leg and arm */
    var frontParts = [
      function () { capsulePath(ctx, j.hipF, j.kneeF, R_TOP, R_MID); },
      function () { capsulePath(ctx, j.kneeF, j.footF, R_MID, R_END); },
      function () { ellipsePath(ctx, j.footF.x, j.footF.y, FOOT_X, FOOT_Y); },
      function () { capsulePath(ctx, j.shF, j.elbF, R_TOP * 0.92, R_MID * 0.92); },
      function () { capsulePath(ctx, j.elbF, j.handF, R_MID * 0.92, R_END * 0.92); },
      function () { ellipsePath(ctx, j.handF.x, j.handF.y, HAND, HAND * 0.94); }
    ];
    fillShape(frontParts[0], c.points ? shade(c.marks, 0.10) : furFront);
    fillShape(frontParts[1], shinF === fur ? furFront : shinF);
    fillShape(frontParts[2], footF === fur ? furFront : footF);
    fillShape(frontParts[3], furFront);
    fillShape(frontParts[4], furFront);
    fillShape(frontParts[5], c.gloves || furFront);

    if (tailUp) addTail();

    /* the head joins the silhouette rather than sitting on top of it */
    var r = j.headR, rot = -(j.headRot || 0) * DEG;
    function inHead(fn) {
      return function () {
        ctx.save();
        ctx.translate(j.head.x, j.head.y);
        ctx.rotate(rot);
        fn();
        ctx.restore();
      };
    }
    fillShape(inHead(function () { earPath(ctx, r, 1); }), c.points ? c.marks : fur);
    fillShape(inHead(function () { earPath(ctx, r, -0.76); }), c.points ? c.marks : fur);
    fillShape(inHead(function () { ellipsePath(ctx, 0, 0, r * 1.06, r * 0.98); }), fur);

    /* ---- pass one: the contour ---- */
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = line;
    for (var i = 0; i < shapes.length; i++) {
      var sh = shapes[i];
      ctx.lineWidth = sh.k === 's' ? sh.w + OUTLINE * 2 : OUTLINE * 2;
      sh.p();
      ctx.stroke();
    }
    ctx.restore();

    /* ---- pass two: the fills ---- */
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (var k = 0; k < shapes.length; k++) {
      var sh2 = shapes[k];
      sh2.p();
      if (sh2.k === 's') { ctx.strokeStyle = sh2.c; ctx.lineWidth = sh2.w; ctx.stroke(); }
      else { ctx.fillStyle = sh2.c; ctx.fill(); }
    }
    ctx.restore();

    /* A soft line round the near limbs only. It reads as the edge of an arm
       lying over a chest, and it is the difference between a figure and a
       blob — without ever breaking the outer contour. */
    if (!white) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,.22)';
      ctx.lineWidth = 1.15 * s;
      ctx.lineJoin = 'round';
      for (var fp = 0; fp < frontParts.length; fp++) { frontParts[fp](); ctx.stroke(); }
      ctx.restore();
    }

    /* ---- pass three: everything that is not the silhouette ---- */

    /* markings and volume, clipped inside the body */
    ctx.save();
    capsulePath(ctx, j.pelvis, j.neck, hipW, chestW);
    ctx.clip();
    drawPattern(ctx, c, j);
    if (c.pattern !== 'tuxedo' && c.pattern !== 'siamese') {
      ctx.globalAlpha = 0.42;
      var bx = U.lerp(j.pelvis.x, j.neck.x, 0.46) + 5 * s * G;
      var by = U.lerp(j.pelvis.y, j.neck.y, 0.46);
      ellipsePath(ctx, bx, by, 6 * s * G, 12 * s * G);
      ctx.fillStyle = belly; ctx.fill();
      ctx.globalAlpha = 1;
    }
    /* a soft shadow under the chest gives the body weight */
    if (!white) {
      var sg = ctx.createLinearGradient(0, j.pelvis.y - hipW, 0, j.neck.y + chestW);
      sg.addColorStop(0, 'rgba(0,0,0,.26)');
      sg.addColorStop(0.55, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(j.pelvis.x - 40 * s, j.pelvis.y - 40 * s, 80 * s, 90 * s);
    }
    ctx.restore();

    /* the ruff where the neck meets the chest */
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = belly;
    var rx = U.lerp(j.pelvis.x, j.neck.x, 0.88), ry = U.lerp(j.pelvis.y, j.neck.y, 0.88);
    ctx.beginPath();
    for (var rf = 0; rf < 7; rf++) {
      var ra = -0.55 + rf * 0.44;
      ctx.arc(rx + Math.cos(ra) * 5.2 * s * G, ry + Math.sin(ra) * 3.0 * s * G - 2 * s,
              3.1 * s * G, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();

    if (c.tailTip) {
      ctx.beginPath();
      ctx.arc(j.tail[3].x, j.tail[3].y, tailW * 0.52, 0, Math.PI * 2);
      ctx.fillStyle = white ? '#fff' : c.tailTip;
      ctx.fill();
    }

    drawHead(ctx, j, c, fur, fur2, belly, line, opts);
  }

  /* ---- the face, drawn on top of the finished silhouette ------------------ */

  function drawHead(ctx, j, c, fur, fur2, belly, line, opts) {
    var r = j.headR, s = j.s;
    var es = s;
    var white = opts.flash === 'white';

    ctx.save();
    ctx.translate(j.head.x, j.head.y);
    ctx.rotate(-(j.headRot || 0) * DEG);

    /* inner ear */
    function innerEar(sx) {
      ctx.beginPath();
      ctx.moveTo(sx * r * 0.50, r * 0.62);
      ctx.quadraticCurveTo(sx * r * 0.78, r * 1.02, sx * r * 0.88, r * 1.34);
      ctx.quadraticCurveTo(sx * r * 0.92, r * 0.94, sx * r * 0.90, r * 0.52);
      ctx.closePath();
      ctx.fillStyle = white ? '#fff' : (c.inner || '#e8a6ad');
      ctx.fill();
      if (c.longhair) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,.6)';
        ctx.lineWidth = 0.62 * es; ctx.lineCap = 'round';
        for (var w = 0; w < 3; w++) {
          var wb = 0.54 + w * 0.11;
          ctx.beginPath();
          ctx.moveTo(sx * r * wb, r * (0.64 + w * 0.12));
          ctx.quadraticCurveTo(sx * r * (wb + 0.10), r * (0.90 + w * 0.14),
                               sx * r * (wb + 0.13), r * (1.08 + w * 0.16));
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    innerEar(1); innerEar(-0.76);

    /* a shadow across the top of the skull, so the head reads as a ball */
    if (!white) {
      ctx.save();
      ellipsePath(ctx, 0, 0, r * 1.06, r * 0.98);
      ctx.clip();
      var hg = ctx.createLinearGradient(0, -r, 0, r);
      hg.addColorStop(0, 'rgba(0,0,0,.22)');
      hg.addColorStop(0.6, 'rgba(0,0,0,0)');
      hg.addColorStop(1, 'rgba(255,255,255,.10)');
      ctx.fillStyle = hg;
      ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
      ctx.restore();
    }

    /* head markings */
    if (c.pattern === 'tabby') {
      ctx.strokeStyle = c.marks; ctx.lineWidth = 1.7 * es; ctx.globalAlpha = 0.9;
      ctx.lineCap = 'round';
      for (var i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 3.4, r * 0.92);
        ctx.lineTo(i * 5.0, r * 0.40);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else if (c.pattern === 'tuxedo') {
      ctx.fillStyle = belly;
      ctx.beginPath();
      ctx.moveTo(r * 0.00, r * 0.80);
      ctx.quadraticCurveTo(r * 0.22, r * 0.36, r * 0.10, -r * 0.16);
      ctx.lineTo(r * 0.62, -r * 0.16);
      ctx.quadraticCurveTo(r * 0.50, r * 0.38, r * 0.30, r * 0.78);
      ctx.closePath();
      ctx.fill();
    } else if (c.pattern === 'siamese') {
      var mg = ctx.createRadialGradient(r * 0.36, -r * 0.10, r * 0.10,
                                        r * 0.36, -r * 0.10, r * 1.24);
      mg.addColorStop(0, c.marks);
      mg.addColorStop(0.62, c.marks);
      mg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.92; ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.ellipse(r * 0.26, -r * 0.06, r * 0.98, r * 0.86, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (c.pattern === 'calico' || c.pattern === 'tortie') {
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.ellipse(-r * 0.45, r * 0.2, r * 0.6, r * 0.66, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = c.marks; ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* an elder cat goes pale round the muzzle */
    if (c.elder) {
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(r * 0.36, -r * 0.28, r * 0.66, r * 0.50, 0, 0, Math.PI * 2);
      ctx.fillStyle = c.silver || '#d8d3c8'; ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* muzzle */
    ctx.beginPath();
    ctx.ellipse(r * 0.42, -r * 0.34, r * 0.56, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fillStyle = c.muzzleColor || belly; ctx.fill();

    /* an open mouth, for a cat that is making a noise */
    if (opts.mouth === 'open') {
      ctx.beginPath();
      ctx.ellipse(r * 0.56, -r * 0.46, r * 0.23, r * 0.18, -0.12, 0, Math.PI * 2);
      ctx.fillStyle = '#4a2026'; ctx.fill();
      ctx.beginPath();
      ctx.ellipse(r * 0.56, -r * 0.41, r * 0.14, r * 0.095, -0.12, 0, Math.PI * 2);
      ctx.fillStyle = '#c9707e'; ctx.fill();
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
    ctx.lineTo(r * 0.90, -r * 0.06);
    ctx.lineTo(r * 0.78, -r * 0.30);
    ctx.closePath();
    ctx.fillStyle = c.nose || '#d98a94'; ctx.fill();

    /* eyes */
    var eyeState = opts.eyes || 'normal';
    function eye(ex, ey, sc) {
      if (eyeState === 'closed' || eyeState === 'ko') {
        ctx.strokeStyle = line; ctx.lineWidth = 1.7 * sc; ctx.lineCap = 'round';
        ctx.beginPath();
        if (eyeState === 'ko') {
          ctx.moveTo(ex - 2.8 * sc, ey - 2.8 * sc); ctx.lineTo(ex + 2.8 * sc, ey + 2.8 * sc);
          ctx.moveTo(ex + 2.8 * sc, ey - 2.8 * sc); ctx.lineTo(ex - 2.8 * sc, ey + 2.8 * sc);
        } else {
          ctx.moveTo(ex - 3.2 * sc, ey); ctx.quadraticCurveTo(ex, ey - 2.2 * sc, ex + 3.2 * sc, ey);
        }
        ctx.stroke();
        return;
      }
      var open = eyeState === 'angry' ? 0.76 : 1;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 3.5 * sc, 4.0 * sc * open, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fdfbf5'; ctx.fill();
      ctx.strokeStyle = line; ctx.lineWidth = 1.1 * sc; ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(ex + 0.9 * sc, ey, 2.1 * sc, 3.3 * sc * open, 0, 0, Math.PI * 2);
      ctx.fillStyle = c.eye || '#8fd14f'; ctx.fill();
      ctx.beginPath();
      ctx.ellipse(ex + 1.0 * sc, ey, 0.85 * sc, 3.0 * sc * open, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#181414'; ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + 1.9 * sc, ey + 1.5 * sc, 0.9 * sc, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fill();
    }
    eye(r * 0.42, r * 0.2, es);
    eye(-r * 0.28, r * 0.22, 0.92 * es);

    /* a heavy brow is most of what makes a face look like it means it */
    if (eyeState === 'angry') {
      ctx.strokeStyle = line; ctx.lineWidth = 2.4 * es; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r * 0.10, r * 0.66); ctx.lineTo(r * 0.76, r * 0.42);
      ctx.moveTo(-r * 0.58, r * 0.46); ctx.lineTo(-r * 0.02, r * 0.68);
      ctx.stroke();
    }

    if (c.elder) {
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.strokeStyle = c.silver || '#e8e4da';
      ctx.lineWidth = 0.85 * es; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(r * 0.22, r * 0.56); ctx.quadraticCurveTo(r * 0.46, r * 0.64, r * 0.64, r * 0.52);
      ctx.moveTo(-r * 0.46, r * 0.50); ctx.quadraticCurveTo(-r * 0.26, r * 0.62, -r * 0.06, r * 0.58);
      ctx.stroke();
      ctx.restore();
    }

    /* whiskers */
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 0.85 * es;
    ctx.lineCap = 'round';
    for (var w2 = -1; w2 <= 1; w2++) {
      ctx.beginPath();
      ctx.moveTo(r * 0.62, -r * 0.28 + w2 * r * 0.10);
      ctx.quadraticCurveTo(r * 1.3, -r * 0.30 + w2 * r * 0.26,
                           r * 1.75, -r * 0.24 + w2 * r * 0.37);
      ctx.stroke();
    }

    /* per-cat accessory */
    if (c.accessory === 'headband') {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, r * 0.02, r * 1.0, r * 0.93, 0, Math.PI * 0.08, Math.PI * 0.92);
      ctx.lineWidth = r * 0.30;
      ctx.strokeStyle = c.accent;
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(-r * 0.86, r * 0.42, r * 0.17, 0, Math.PI * 2);
      ctx.fillStyle = c.accent; ctx.fill();
      ctx.strokeStyle = c.accent; ctx.lineCap = 'round';
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
      [[r * 0.44, 1], [-r * 0.34, 0.9]].forEach(function (g2) {
        ctx.beginPath();
        ctx.ellipse(g2[0], r * 0.52, r * 0.32 * g2[1], r * 0.28 * g2[1], 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20,20,28,1)'; ctx.fill();
        ctx.beginPath();
        ctx.ellipse(g2[0], r * 0.52, r * 0.22 * g2[1], r * 0.19 * g2[1], 0, 0, Math.PI * 2);
        ctx.fillStyle = c.accent; ctx.fill();
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
