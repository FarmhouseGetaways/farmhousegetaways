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
    torsoLen: 28,
    /* The skull used to be 18.4 — two thirds the length of the torso, which
       is plush-toy proportion, not fighting-game proportion. A Street Fighter
       II sprite is about six and a half heads tall. Shrinking it is the
       single biggest thing that turns this from a mascot into a fighter. */
    headR: 13.6,
    neckLen: 4.6,
    /* Arms long enough to actually reach. A fierce punch that does not break
       the silhouette does not read as a punch at all. */
    upperArm: 15.4, foreArm: 14.2,
    thigh: 19.5, shin: 18.5,
    tail: [14, 12, 10],
    shoulderY: -3.4, shoulderX: 3.6,
    /* Poses give the head's offset from the neck, and they were authored
       against the old skull. Holding the crown at the height it always had
       keeps every anti-air and jump-in landing where it used to. */
    headOffset: 1.18,
    /* Poses were authored against 21+21 legs. Shortening them to a stockier
       fighting-game build would leave every pose hovering, so pelvis height
       is scaled by the same ratio and the whole library still lands on the
       floor without a single number being re-typed. */
    pelvisScale: 38 / 42
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
      var out = Math.round(v + (t - v) * Math.abs(amount));
      return (out < 16 ? '0' : '') + out.toString(16);
    }
    /* Hex out, not `rgb(...)`. Everything downstream tests for a leading `#`
       before it will build a gradient from a colour, so a shaded tone that
       came back in the other notation was silently dropped back to a flat
       fill — and the shaded tones are the near and far limbs, which are the
       parts that most need the light. */
    return '#' + mix(r) + mix(g) + mix(b);
  }

  /* How light a colour is, 0..1. A near-black cat cannot be separated from
     itself by shading further into black — there is nowhere left to go — so
     the near side has to do the work instead. */
  function lum(hex) {
    if (!hex || hex[0] !== '#' || hex.length < 7) return 0.5;
    return (parseInt(hex.slice(1, 3), 16) * 0.299 +
            parseInt(hex.slice(3, 5), 16) * 0.587 +
            parseInt(hex.slice(5, 7), 16) * 0.114) / 255;
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
    var shB = pt(neck.x - P.shoulderX * s * 0.42, neck.y + P.shoulderY * s);

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

    var hf = P.headOffset * (B.head || 1);
    var head = pt(neck.x + pose.head[0] * s * hf, neck.y + pose.head[1] * s * hf);

    /* `tailLen` stretches the tail. A tail whip has to actually reach the
       thing it hits, and a cat's tail at rest is nowhere near long enough —
       so the pose lengthens it through the swing, which reads as a whip
       cracking rather than as a cheat. */
    var tl = pose.tailLen === undefined ? 1 : pose.tailLen;
    var tailRoot = pt(pelvis.x - 6.2 * s * (B.girth || 1), pelvis.y + 2.6 * s);
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

     A fighting-game character has to read as ONE creature at ninety-odd
     pixels tall, mid-move, against a busy stage. Three ideas do that work.

     ONE SILHOUETTE. Every part goes into a single list of paths. The fills
     are laid down in draw order, and then the contour is put UNDERNEATH them
     with `destination-over`, so only the part of the stroke that sticks out
     past the fills survives. The interior never gets an edge, so an arm
     crossing a chest does not cut a hole in it.

     ONE LIGHT. Every part is filled with a gradient, and all of those
     gradients run between the same two points in space — so the light
     crosses the whole cat continuously rather than being decided per part.
     Consistent light is most of the difference between a solid form and a
     pile of flat shapes. See `lights()` for why it is done this way and not
     as a wash over the finished figure.

     ONE BODY. The torso is a drawn curve — narrow hips, a waist, a broad
     chest — carrying a deltoid at each shoulder and a mass at each hip, so
     the limbs grow out of it instead of being parked on it. A capsule is the
     same width at the shoulder as at the waist, which is exactly why the old
     figure read as a bean with arms pushed into the sides.

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

  /* A paw, laid along the limb it belongs to rather than stuck on the end of
     it as a ball. Two knuckle bumps on the leading edge do the rest — a
     perfect circle is what made these look like mittens. */
  function pawPath(ctx, wrist, from, rx, ry, toes) {
    var dx = wrist.x - from.x, dy = wrist.y - from.y;
    var len = Math.hypot(dx, dy) || 0.001;
    var ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(wrist.x + (dx / len) * rx * 0.28, wrist.y + (dy / len) * rx * 0.28);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.closePath();
    if (toes) {
      ctx.moveTo(rx * 0.98, -ry * 0.16);
      ctx.arc(rx * 0.52, -ry * 0.52, ry * 0.46, 0, Math.PI * 2);
      ctx.moveTo(rx * 0.62, ry * 0.62);
      ctx.arc(rx * 0.20, ry * 0.60, ry * 0.42, 0, Math.PI * 2);
    }
    ctx.restore();
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

  /* THE LIGHT.

     Every part is filled with a gradient rather than a flat colour, and every
     one of those gradients runs between the SAME two points in space — the
     top-forward corner of the figure to the bottom-back one. So the light
     crosses the whole cat continuously: a shoulder and the thigh below it are
     lit by the same lamp, and the body reads as one solid object instead of a
     stack of flat cut-outs.

     Doing it this way rather than compositing a wash over the finished figure
     matters. A wash needs an offscreen canvas and a `source-atop`, and it
     double-darkens wherever two parts overlap. Baking it into the fill costs
     one gradient per colour per frame and nothing else. Rendering the cats
     through an offscreen was measured at 22.8ms a frame against a 16.7ms
     budget; this is a tenth of that and looks the same.                    */
  function lights(ctx, bounds) {
    var cache = {};
    var x1 = bounds.x2 * 0.30 + bounds.x1 * 0.70, y1 = bounds.y2;
    var x2 = bounds.x1 * 0.30 + bounds.x2 * 0.70, y2 = bounds.y1;
    return function (colour) {
      if (!colour) return colour;
      var hit = cache[colour];
      if (hit) return hit;
      if (colour[0] !== '#') { cache[colour] = colour; return colour; }
      var g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, shade(colour, 0.17));
      g.addColorStop(0.46, colour);
      g.addColorStop(1, shade(colour, -0.24));
      cache[colour] = g;
      return g;
    };
  }

  /* A closed curve through a ring of points, rounded at every one of them.
     Corners are cut by aiming each quadratic at the point and landing on the
     midpoint of the next edge, which is the cheapest smoothing there is and
     the only kind a body outline needs. */
  function smoothClosed(ctx, pts) {
    var n = pts.length;
    function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
    var start = mid(pts[n - 1], pts[0]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    for (var i = 0; i < n; i++) {
      var cur = pts[i], nxt = pts[(i + 1) % n], m = mid(cur, nxt);
      ctx.quadraticCurveTo(cur.x, cur.y, m.x, m.y);
    }
    ctx.closePath();
  }

  /* The torso. `t` runs 0 at the pelvis to 1 at the neck; `w` is sideways,
     positive towards the front of the cat. */
  function bodyPoints(j, hipW, waistW, chestW) {
    var p = j.pelvis, n = j.neck;
    var dx = n.x - p.x, dy = n.y - p.y;
    var len = Math.hypot(dx, dy) || 0.001;
    var ux = dx / len, uy = dy / len;
    var fx = uy, fy = -ux;                     /* forward, across the spine */
    function at(t, w) {
      return { x: p.x + dx * t + fx * w, y: p.y + dy * t + fy * w };
    }
    return [
      at(0.00,  hipW * 0.94),                  /* belly, over the hip */
      at(0.32,  waistW),                       /* the waist, pulled in */
      at(0.68,  chestW * 0.99),                /* chest, thrown forward */
      at(0.95,  chestW * 0.80),                /* front of the shoulder */
      at(1.10,  chestW * 0.20),
      at(1.10, -chestW * 0.24),
      at(0.95, -chestW * 0.74),                /* back of the shoulder */
      at(0.66, -chestW * 0.90),                /* the shoulder blades */
      at(0.30, -waistW * 1.10),
      at(-0.06, -hipW * 1.02),                 /* the rump */
      at(-0.14, 0)
    ];
  }

  /* A tail is thick where it leaves the rump and fine at the tip. Stroking
     one line at a constant width gave a length of hosepipe, which was the
     loudest wrong shape in the silhouette. This walks the curve and builds
     the outline by hand, so it can narrow along its length. */
  function tailPath(ctx, j, w0, w1) {
    var p = j.tail, N = 16, i, t, pts = [];
    if (w0 === undefined) {                 /* plain centreline, for callers */
      ctx.beginPath();
      ctx.moveTo(p[0].x, p[0].y);
      ctx.quadraticCurveTo(p[1].x, p[1].y, p[2].x, p[2].y);
      ctx.quadraticCurveTo(p[2].x, p[2].y, p[3].x, p[3].y);
      return;
    }
    for (i = 0; i <= N; i++) {
      t = i / N;
      var u = 1 - t;
      pts.push({
        x: u * u * u * p[0].x + 3 * u * u * t * p[1].x + 3 * u * t * t * p[2].x + t * t * t * p[3].x,
        y: u * u * u * p[0].y + 3 * u * u * t * p[1].y + 3 * u * t * t * p[2].y + t * t * t * p[3].y
      });
    }
    function widthAt(k) {
      var f = k / N;
      return w0 + (w1 - w0) * (f * f * (3 - 2 * f));
    }
    function normal(k) {
      var a = pts[Math.max(0, k - 1)], b = pts[Math.min(N, k + 1)];
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 0.001;
      return { x: -dy / len, y: dx / len };
    }
    ctx.beginPath();
    for (i = 0; i <= N; i++) {
      var n1 = normal(i), w = widthAt(i);
      var x = pts[i].x + n1.x * w, y = pts[i].y + n1.y * w;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    /* round the tip rather than chopping it square across */
    var tn = normal(N), tw = widthAt(N);
    var ta = Math.atan2(tn.y, tn.x);
    ctx.arc(pts[N].x, pts[N].y, tw, ta, ta + Math.PI, false);
    for (i = N; i >= 0; i--) {
      var n2 = normal(i), w2 = widthAt(i);
      ctx.lineTo(pts[i].x - n2.x * w2, pts[i].y - n2.y * w2);
    }
    ctx.closePath();
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
      ctx.ellipse(4.2 * s, -2 * s, 4.4 * s, 12.5 * s, 0.06, 0, Math.PI * 2);
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
      ctx.beginPath(); ctx.ellipse(0, 0, 12 * s, 20 * s, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /* ---- the cat ------------------------------------------------------------ */

  function drawCat(ctx, j, c, opts) {
    opts = opts || {};
    paintFigure(ctx, buildFigure(j, c, opts), j, c, opts);
  }

  /* Work out every shape the cat is made of, and how big a box it needs. */
  function buildFigure(j, c, opts) {
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
    var R_TOP = 6.2 * s * G, R_MID = 4.6 * s * G, R_END = 3.4 * s * G;
    var HAND = 4.8 * s * G, FOOT_X = 7.4 * s * G, FOOT_Y = 4.2 * s * G;
    var hipW = 8.8 * s * G, waistW = 7.4 * s * G, chestW = 11.8 * s * G;
    var OUTLINE = 1.8 * s;

    /* Three tones front to back: the shaded far side, the torso, and a
       slightly brighter near side. Depth without a single extra line. */
    var dark = lum(c.fur) < 0.34;
    var furFront = white ? '#ffffff' : shade(c.fur, dark ? 0.24 : 0.12);
    var furBack  = white ? '#eeeeee' : shade(c.fur2 || c.fur, dark ? -0.22 : -0.17);
    var tailW = (c.longhair ? 6.4 : 4.7) * s * G;

    var shapes = [];
    function fillShape(path, colour) { shapes.push({ k: 'f', p: path, c: colour }); }
    function strokeShape(path, colour, w) { shapes.push({ k: 's', p: path, c: colour, w: w }); }

    var back = c.points ? c.marks : furBack;
    var shinF = c.points ? c.marks : (c.sock ? (c.sockColor || belly) : fur);
    var footF = c.points ? c.marks : shinF;
    var tailCol = c.points ? c.marks : fur;
    var tailUp = (j.pose && j.pose.tailFront > 0.5);

    function addTail() {
      var tc = tailUp ? tailCol : (c.points ? c.marks : furBack);
      fillShape(function (cx) { tailPath(cx, j, tailW, tailW * 0.52); }, tc);
      if (c.tailTip) {
        fillShape(function (cx) {
          ellipsePath(cx, j.tail[3].x, j.tail[3].y, tailW * 0.56, tailW * 0.56);
        }, white ? '#fff' : c.tailTip);
      }
    }
    if (!tailUp) addTail();

    /* back leg and arm, in the shade */
    fillShape(function (cx) { ellipsePath(cx, j.hipB.x, j.hipB.y, R_TOP * 1.10, R_TOP * 1.02); }, back);
    fillShape(function (cx) { capsulePath(cx, j.hipB, j.kneeB, R_TOP * 0.94, R_MID * 0.9); }, back);
    fillShape(function (cx) { capsulePath(cx, j.kneeB, j.footB, R_MID * 0.9, R_END * 0.9); }, back);
    fillShape(function (cx) { pawPath(cx, j.footB, j.kneeB, FOOT_X * 0.80, FOOT_Y * 0.92, false); }, back);
    var armBack = c.points ? c.marks : furBack;
    fillShape(function (cx) { ellipsePath(cx, j.shB.x, j.shB.y, R_TOP * 1.24, R_TOP * 1.16); }, armBack);
    fillShape(function (cx) { capsulePath(cx, j.shB, j.elbB, R_TOP * 0.94, R_MID * 0.90); }, armBack);
    fillShape(function (cx) { capsulePath(cx, j.elbB, j.handB, R_MID * 0.90, R_END * 0.88); }, armBack);
    fillShape(function (cx) { pawPath(cx, j.handB, j.elbB, HAND * 0.84, HAND * 0.72, false); }, c.gloves || armBack);

    /* the long-haired underlayer, wider than the body it sits behind */
    var bodyPts = bodyPoints(j, hipW, waistW, chestW);
    if (c.longhair) {
      var ruffPts = bodyPoints(j, hipW * 1.20, waistW * 1.20, chestW * 1.16);
      fillShape(function (cx) { smoothClosed(cx, ruffPts); }, fur2);
    }

    /* the body itself, then the masses that carry the limbs out of it */
    fillShape(function (cx) { smoothClosed(cx, bodyPts); }, fur);
    fillShape(function (cx) { ellipsePath(cx, j.hipF.x, j.hipF.y, R_TOP * 1.16, R_TOP * 1.06); }, fur);
    /* a neck, so the head is not balanced straight on the shoulders */
    fillShape(function (cx) { capsulePath(cx, j.neck, j.head, chestW * 0.46, j.headR * 0.60); }, fur);

    /* front leg and arm */
    var frontParts = [
      function (cx) { ellipsePath(cx, j.shF.x, j.shF.y, R_TOP * 1.16, R_TOP * 1.06); },
      function (cx) { capsulePath(cx, j.hipF, j.kneeF, R_TOP, R_MID); },
      function (cx) { capsulePath(cx, j.kneeF, j.footF, R_MID, R_END); },
      function (cx) { pawPath(cx, j.footF, j.kneeF, FOOT_X * 0.92, FOOT_Y, true); },
      function (cx) { capsulePath(cx, j.shF, j.elbF, R_TOP * 0.90, R_MID * 0.90); },
      function (cx) { capsulePath(cx, j.elbF, j.handF, R_MID * 0.90, R_END * 0.90); },
      function (cx) { pawPath(cx, j.handF, j.elbF, HAND * 1.02, HAND * 0.82, true); }
    ];
    var frontStart = shapes.length;
    fillShape(frontParts[0], furFront);
    fillShape(frontParts[1], c.points ? shade(c.marks, 0.10) : furFront);
    fillShape(frontParts[2], shinF === fur ? furFront : shinF);
    fillShape(frontParts[3], footF === fur ? furFront : footF);
    fillShape(frontParts[4], furFront);
    fillShape(frontParts[5], furFront);
    fillShape(frontParts[6], c.gloves || furFront);

    if (tailUp) addTail();

    /* the head joins the silhouette rather than sitting on top of it */
    var r = j.headR, rot = -(j.headRot || 0) * DEG;
    function inHead(fn) {
      return function (cx) {
        cx.save();
        cx.translate(j.head.x, j.head.y);
        cx.rotate(rot);
        fn(cx);
        cx.restore();
      };
    }
    var headShapes = [
      { p: inHead(function (cx) { earPath(cx, r, 1); }), c: c.points ? c.marks : fur },
      { p: inHead(function (cx) { earPath(cx, r, -0.76); }), c: c.points ? c.marks : fur },
      { p: inHead(function (cx) { ellipsePath(cx, 0, 0, r * 1.10, r * 1.00); }), c: fur }
    ];
    headShapes.forEach(function (hs) { fillShape(hs.p, hs.c); });

    /* The box everything has to fit in. Whiskers reach furthest forward and
       a headband's ties furthest back, so the head gets a wide allowance. */
    var xs = [], ys = [];
    ['pelvis', 'neck', 'head', 'shF', 'elbF', 'handF', 'shB', 'elbB', 'handB',
     'hipF', 'kneeF', 'footF', 'hipB', 'kneeB', 'footB'].forEach(function (k) {
      xs.push(j[k].x); ys.push(j[k].y);
    });
    j.tail.forEach(function (t) { xs.push(t.x); ys.push(t.y); });
    var margin = Math.max(chestW, R_TOP * 2, tailW) + OUTLINE * 2 + 4 * s;
    var headMargin = r * 2.2 + 4 * s;
    var bounds = {
      x1: Math.min.apply(null, xs) - margin,
      x2: Math.max.apply(null, xs) + margin,
      y1: Math.min.apply(null, ys) - margin,
      y2: Math.max.apply(null, ys) + margin
    };
    bounds.x1 = Math.min(bounds.x1, j.head.x - headMargin);
    bounds.x2 = Math.max(bounds.x2, j.head.x + headMargin);
    bounds.y1 = Math.min(bounds.y1, j.head.y - headMargin);
    bounds.y2 = Math.max(bounds.y2, j.head.y + headMargin);

    return {
      shapes: shapes, frontParts: frontParts, bodyPts: bodyPts, bounds: bounds,
      frontStart: frontStart,
      fur: fur, fur2: fur2, belly: belly, line: line, white: white,
      hipW: hipW, waistW: waistW, chestW: chestW, tailW: tailW,
      OUTLINE: OUTLINE, s: s, G: G
    };
  }

  /* Lay the figure down: fills, markings, cast shadows, then the light, then
     the contour underneath it all, then the face on top. */
  function paintFigure(ctx, fig, j, c, opts) {
    var s = fig.s, G = fig.G, white = fig.white;
    var shapes = fig.shapes;
    var i, sh;
    var lit = white ? function (x) { return x; } : lights(ctx, fig.bounds);
    fig.lit = lit;

    /* ---- pass one: the contour ----

       Every shape is stroked with a thick line in the contour colour before
       any of them is filled. Pass two then paints over all of those strokes
       from the inside, and the only line left standing is the outer edge of
       the union — one unbroken silhouette, no matter how the limbs overlap.
       An arm crossing a chest cannot cut a hole in it, because there is no
       per-part outline to cut with. */
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = fig.line;
    for (i = 0; i < shapes.length; i++) {
      sh = shapes[i];
      ctx.lineWidth = sh.k === 's' ? sh.w + fig.OUTLINE * 2 : fig.OUTLINE * 2;
      sh.p(ctx);
      ctx.stroke();
    }
    ctx.restore();

    /* ---- pass two: the fills, each carrying the same light ---- */
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (i = 0; i < shapes.length; i++) {
      sh = shapes[i];
      sh.p(ctx);
      if (sh.k === 's') { ctx.strokeStyle = lit(sh.c); ctx.lineWidth = sh.w; ctx.stroke(); }
      else { ctx.fillStyle = lit(sh.c); ctx.fill(); }
    }
    ctx.restore();

    /* ---- markings, belly and ruff, clipped inside the body ---- */
    ctx.save();
    smoothClosed(ctx, fig.bodyPts);
    ctx.clip();
    drawPattern(ctx, c, j);
    if (c.pattern !== 'tuxedo' && c.pattern !== 'siamese') {
      var bx = U.lerp(j.pelvis.x, j.neck.x, 0.44) + 4 * s * G;
      var by = U.lerp(j.pelvis.y, j.neck.y, 0.44);
      var bg = ctx.createRadialGradient(bx, by, 1, bx, by, 11 * s * G);
      bg.addColorStop(0, fig.belly);
      bg.addColorStop(0.55, fig.belly);
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.36;
      ellipsePath(ctx, bx, by, 5.4 * s * G, 11 * s * G);
      ctx.fillStyle = bg; ctx.fill();
      ctx.globalAlpha = 1;
    }

    /* The near limbs used to carry a dark line all the way round, which drew
       them as stickers laid on the chest. A cast shadow says the same thing —
       this is in front of that — without ever cutting the body. It is an
       offset copy inside the torso; the limbs are then laid down again on
       top, so all that survives is the part sticking out from under them. */
    if (!white) {
      ctx.save();
      ctx.translate(-2.1 * s, -2.7 * s);
      ctx.fillStyle = 'rgba(20,12,26,.30)';
      for (i = 0; i < fig.frontParts.length; i++) { fig.frontParts[i](ctx); ctx.fill(); }
      ellipsePath(ctx, j.head.x, j.head.y, j.headR * 1.06, j.headR * 0.96);
      ctx.fill();
      ctx.translate(-1.4 * s, -1.7 * s);
      ctx.fillStyle = 'rgba(20,12,26,.17)';
      for (i = 0; i < fig.frontParts.length; i++) { fig.frontParts[i](ctx); ctx.fill(); }
      ellipsePath(ctx, j.head.x, j.head.y, j.headR * 1.06, j.headR * 0.96);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    /* the near limbs and the head again, over the shadow they just cast */
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (i = fig.frontStart; i < shapes.length; i++) {
      sh = shapes[i];
      sh.p(ctx);
      if (sh.k === 's') { ctx.strokeStyle = fig.lit(sh.c); ctx.lineWidth = sh.w; ctx.stroke(); }
      else { ctx.fillStyle = fig.lit(sh.c); ctx.fill(); }
    }
    ctx.restore();

    /* the ruff where the neck meets the chest */
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = fig.belly;
    var rx = U.lerp(j.pelvis.x, j.neck.x, 0.92), ry = U.lerp(j.pelvis.y, j.neck.y, 0.92);
    ctx.beginPath();
    for (var rf = 0; rf < 6; rf++) {
      var ra = -0.50 + rf * 0.44;
      ctx.arc(rx + Math.cos(ra) * 3.8 * s * G, ry + Math.sin(ra) * 2.2 * s * G - 1.4 * s,
              2.1 * s * G, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();

    drawHead(ctx, j, c, fig.fur, fig.fur2, fig.belly, fig.line, opts);
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
      ctx.ellipse(ex, ey, 2.75 * sc, 3.15 * sc * open, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fdfbf5'; ctx.fill();
      ctx.strokeStyle = line; ctx.lineWidth = 1.1 * sc; ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(ex + 0.7 * sc, ey, 1.65 * sc, 2.6 * sc * open, 0, 0, Math.PI * 2);
      ctx.fillStyle = c.eye || '#8fd14f'; ctx.fill();
      ctx.beginPath();
      ctx.ellipse(ex + 0.8 * sc, ey, 0.66 * sc, 2.35 * sc * open, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#181414'; ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + 1.5 * sc, ey + 1.2 * sc, 0.72 * sc, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fill();
    }
    eye(r * 0.46, r * 0.12, es);
    eye(-r * 0.30, r * 0.15, 0.92 * es);

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
      ctx.quadraticCurveTo(r * 1.10, -r * 0.30 + w2 * r * 0.24,
                           r * 1.44, -r * 0.24 + w2 * r * 0.34);
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
      /* The skull is drawn smaller than it used to be. The box it fights with
         is deliberately a little larger than the drawing, so shrinking the
         head did not silently re-tune every anti-air in the game. */
      { x: j.head.x - j.headR * 1.3, y: j.head.y - j.headR * 1.3,
        w: j.headR * 2.6, h: j.headR * 2.6, part: 'head' },
      box(j.pelvis, j.neck, 11 * j.s),
      box(j.hipF, j.footF, 6 * j.s),
      box(j.hipB, j.footB, 5 * j.s)
    ];
  }

  CF.Rig = {
    DEFAULT_BUILD: DEFAULT_BUILD,
    solve: solve, drawCat: drawCat, hurtboxes: hurtboxes, tailPath: tailPath,
    capsule: capsule, blob: blob, P: P
  };
})();
