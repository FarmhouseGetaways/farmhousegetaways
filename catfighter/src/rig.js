/* ==========================================================================
   Super Cat Fighter 6 — skeleton and cat rendering

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
    /* 28 once. The five units are the ones the skull gave up: they had to go
       somewhere or the whole figure would have simply got shorter, and the
       torso is the only segment that can take them without moving a foot.

       LEG LENGTH IS NOT AVAILABLE for this, which is worth knowing before
       anyone tries. 21.5 and 20.5 is the proportion a fighter really wants
       and it fails `every cat stands on the floor`: `pelvisScale` corrects
       exactly for a straight leg and only approximately for a bent one, so
       lilly's crouch floated five units and ruby's walk sank five — in
       hand-tuned poses that live in cat files. That change needs whoever
       owns those poses in the room. */
    torsoLen: 33,
    /* HEAD COUNT is the number that decides whether these read as fighters
       or as mascots, and for a long time it was 3.4 — a child's proportion,
       and the reason no costume could stop them reading as mascots: when the
       skull is a third of the black shape, the costume is a minority of it.
       Street Fighter II runs 4.8 (E. Honda) to 6.5 (Ryu). The skull came
       down from 18.4 to 13.6 once and stopped a head and a half short.

       At 10.0, with the difference put into the torso, the roster measures
       4.7 (gracie) to 6.5 (luigi) crown-to-sole over head diameter, at the
       same overall height — so no pose, no hitbox and no stage anchor
       moves. Everything else on the head is expressed in headR, so the
       ears, muzzle, face and neck all followed without a second edit. */
    headR: 10.0,
    /* unused by the solver — the neck is drawn as a capsule between `neck`
       and `head`, which is why lengthening it here does nothing. Kept only
       so a reader looking for it finds this note. */
    neckLen: 4.6,
    /* Arms long enough to actually reach. A fierce punch that does not break
       the silhouette does not read as a punch at all. */
    upperArm: 15.4, foreArm: 14.2,
    thigh: 19.5, shin: 18.5,
    tail: [14, 12, 10],
    /* The shoulders. In a side view the "width" of an upper body is its
       depth — how far the deltoid stands proud of the neck front and back —
       and these were 3.6 forward and 1.5 back, which is a bottle, not a
       fighter. Spreading them is what gives the torso its V. */
    shoulderY: -4.6, shoulderX: 5.6, shoulderBack: 0.80,
    /* Poses give the head's offset from the neck, and they were authored
       against the old skull. Holding the crown at the height it always had
       keeps every anti-air and jump-in landing where it used to. */
    headOffset: 1.18,
    /* Poses were authored against 21+21 legs. Shortening them to a stockier
       fighting-game build would leave every pose hovering, so pelvis height
       is scaled by the same ratio and the whole library still lands on the
       floor without a single number being re-typed.

       Derived rather than typed: it was the literal 38/42, and it is the one
       number that has to move the moment a leg length does. Leaving it
       behind puts every cat in the game a few units into the floor, which is
       a very loud bug to introduce by editing a leg. */
    pelvisScale: 1
  };
  P.pelvisScale = (P.thigh + P.shin) / 42;
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

  /* Mix two colours. Shadows in a Street Fighter II sprite are not the base
     colour turned down — they are the base colour pushed towards a cool dark,
     which is why the shadow side of a white gi reads blue-grey rather than
     grey. */
  function mix(hex, other, amt) {
    if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
    if (!other || other[0] !== '#') return hex;
    function ch(h, i) { return parseInt(h.slice(1 + i * 2, 3 + i * 2), 16); }
    var out = '#';
    for (var i = 0; i < 3; i++) {
      var v = Math.round(ch(hex, i) + (ch(other, i) - ch(hex, i)) * amt);
      v = Math.max(0, Math.min(255, v));
      out += (v < 16 ? '0' : '') + v.toString(16);
    }
    return out;
  }

  var SHADE_TO = '#2a2140';        /* cool dark, for every shadow */
  var LIGHT_TO = '#fff4d8';        /* warm light, for every highlight */

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
    var shB = pt(neck.x - P.shoulderX * s * P.shoulderBack, neck.y + P.shoulderY * s);

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
      s: s, girth: (B.girth || 1), build: B, pose: pose,
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

  /* A FIST, not a mitten.

     A round blob on the end of an arm is the single loudest wrong shape on a
     fighting-game figure: hands are what a punch is made of, and the eye goes
     straight to them. This is a chunky wedge laid along the forearm with the
     knuckles proud on the leading edge and the thumb ridge across the back —
     four shapes, all of which survive down at the arcade resolution because
     they are in the OUTLINE rather than painted on.                        */
  function fistPath(ctx, wrist, from, r, open) {
    var dx = wrist.x - from.x, dy = wrist.y - from.y;
    var len = Math.hypot(dx, dy) || 0.001;
    var ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(wrist.x + (dx / len) * r * 0.34, wrist.y + (dy / len) * r * 0.34);
    ctx.rotate(ang);
    ctx.beginPath();
    /* the mass of the hand: longer along the arm than it is across */
    ctx.moveTo(-r * 0.85, -r * 0.72);
    ctx.quadraticCurveTo(r * 0.55, -r * 0.95, r * 0.92, -r * 0.52);
    ctx.quadraticCurveTo(r * 1.16, 0, r * 0.92, r * 0.56);
    ctx.quadraticCurveTo(r * 0.40, r * 0.98, -r * 0.85, r * 0.76);
    ctx.quadraticCurveTo(-r * 1.14, 0, -r * 0.85, -r * 0.72);
    ctx.closePath();
    if (!open) {
      /* the knuckles, standing proud of the leading edge */
      ctx.moveTo(r * 1.10, -r * 0.34);
      ctx.arc(r * 0.80, -r * 0.34, r * 0.30, 0, Math.PI * 2);
      ctx.moveTo(r * 1.14, r * 0.20);
      ctx.arc(r * 0.84, r * 0.20, r * 0.30, 0, Math.PI * 2);
      /* the thumb, folded across the back of it */
      ctx.moveTo(r * 0.30, -r * 0.86);
      ctx.arc(r * 0.02, -r * 0.86, r * 0.28, 0, Math.PI * 2);
    } else {
      /* an open paw: three toes off the leading edge */
      for (var t2 = -1; t2 <= 1; t2++) {
        ctx.moveTo(r * 1.22, t2 * r * 0.50);
        ctx.arc(r * 0.94, t2 * r * 0.50, r * 0.28, 0, Math.PI * 2);
      }
    }
    ctx.restore();
  }

  /* A FOOT, standing on the floor rather than balled up at the ankle.

     Laid along the direction the cat is facing, not along the shin — a foot
     that rotates with the calf points at the sky the moment a knee bends, and
     that is what made every kick look like it was thrown with a stump. */
  function footPath(ctx, ankle, knee, lx, ly, toes) {
    var lean = (ankle.x - knee.x) * 0.16;      /* a little of the shin's angle */
    ctx.save();
    ctx.translate(ankle.x, ankle.y);
    ctx.beginPath();
    ctx.moveTo(-lx * 0.62 + lean, ly * 0.55);          /* the heel, up the back */
    ctx.quadraticCurveTo(-lx * 0.80 + lean, -ly * 0.55, -lx * 0.44, -ly * 0.92);
    ctx.lineTo(lx * 0.66, -ly * 0.98);                 /* along the sole */
    ctx.quadraticCurveTo(lx * 1.22, -ly * 0.86, lx * 1.18, -ly * 0.20);
    ctx.quadraticCurveTo(lx * 0.86, ly * 0.34, lx * 0.10, ly * 0.50);
    ctx.quadraticCurveTo(-lx * 0.28, ly * 0.66, -lx * 0.62 + lean, ly * 0.55);
    ctx.closePath();
    if (toes) {
      ctx.moveTo(lx * 1.34, -ly * 0.62);
      ctx.arc(lx * 1.06, -ly * 0.62, ly * 0.36, 0, Math.PI * 2);
      ctx.moveTo(lx * 1.24, -ly * 0.10);
      ctx.arc(lx * 0.96, -ly * 0.10, ly * 0.34, 0, Math.PI * 2);
    }
    ctx.restore();
  }

  /* A limb with muscle in it.

     A capsule is the same width the whole way down apart from an even taper,
     which is exactly what makes a limb read as a tube — and a figure built
     from tubes reads as a doll however well it is lit. A real limb swells at
     the belly of the muscle and pulls in at the joint. `bulge` is how much,
     so an acrobat and a heavyweight are not made from the same part. */
  var LIMB_T = [0, 0.16, 0.34, 0.56, 0.78, 1];
  var LIMB_W = [1.00, 1.20, 1.13, 0.90, 0.83, 1.00];

  /* One profile per segment, because an arm and a shin are not the same
     shape. Each row is the width multiplier at LIMB_T, so the belly of the
     muscle and the pinch at the joint are both explicit. Sharing one profile
     across every limb is what made the whole figure read as bent tubing. */
  var PROFILE = {
    upperArm: [1.00, 1.30, 1.20, 0.94, 0.76, 1.00],   /* deltoid, bicep, elbow */
    foreArm:  [1.00, 1.20, 1.08, 0.86, 0.70, 1.00],   /* brachioradialis, wrist */
    thigh:    [1.00, 1.24, 1.28, 1.04, 0.76, 1.00],   /* quad, knee */
    shin:     [1.00, 1.22, 1.04, 0.78, 0.70, 1.00]    /* calf high, thin ankle */
  };

  function limbPath(ctx, a, b, rA, rB, bulge, profile) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.hypot(dx, dy) || 0.001;
    var ux = dx / len, uy = dy / len;
    var nx = -uy, ny = ux;
    var k = bulge === undefined ? 1 : bulge;
    var prof = (profile && PROFILE[profile]) || LIMB_W;
    var i, t, w, side = [], back = [];
    for (i = 0; i < LIMB_T.length; i++) {
      t = LIMB_T[i];
      w = (rA + (rB - rA) * t) * (1 + (prof[i] - 1) * k);
      var px = a.x + dx * t, py = a.y + dy * t;
      side.push({ x: px + nx * w, y: py + ny * w });
      back.push({ x: px - nx * w, y: py - ny * w });
    }
    ctx.beginPath();
    ctx.moveTo(side[0].x, side[0].y);
    for (i = 1; i < side.length; i++) {
      var m = { x: (side[i - 1].x + side[i].x) / 2, y: (side[i - 1].y + side[i].y) / 2 };
      ctx.quadraticCurveTo(side[i - 1].x, side[i - 1].y, m.x, m.y);
    }
    ctx.lineTo(side[side.length - 1].x, side[side.length - 1].y);
    ctx.arc(b.x, b.y, rB, Math.atan2(ny, nx), Math.atan2(-ny, -nx), true);
    for (i = back.length - 1; i >= 1; i--) {
      var m2 = { x: (back[i].x + back[i - 1].x) / 2, y: (back[i].y + back[i - 1].y) / 2 };
      ctx.quadraticCurveTo(back[i].x, back[i].y, m2.x, m2.y);
    }
    ctx.lineTo(back[0].x, back[0].y);
    ctx.arc(a.x, a.y, rA, Math.atan2(-ny, -nx), Math.atan2(ny, nx), true);
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
  /* The light comes from up and forward, and it is a hard light. In local
     coordinates +x is forward and +y is up, so this is the direction the lit
     side faces. */
  var LX = 0.52, LY = 0.85;

  /* Three flat tones per material with hard boundaries between them.

     This is the single biggest thing that separates a Street Fighter II
     sprite from a piece of vector art. The gi is white, blue-grey where it
     turns away, and near-white where it catches the light — three regions
     with a hard edge, not a gradient. A gradient reads as a smooth plastic
     tube however carefully it is aimed; a hard shadow edge reads as a form
     with a light on it.

     Drawn by filling the whole part in shadow, clipping to it, and then
     laying the base tone back over it shifted towards the light. What
     survives at the edge is a crescent of shadow exactly one shift wide. The
     highlight is the same trick a second time, bracketed so it comes out as
     a band along the lit edge rather than covering the whole lit side. */
  function celFill(ctx, path, colour, band, step) {
    if (!colour || colour[0] !== '#' || !step) {
      /* rgba() and the like — and anything too small for three tones to read.
         A paw is about five pixels across at the arcade resolution: shading
         it costs a clip and four fills and changes nothing anybody can see.
         Flattening the small parts took two cats from 13.5ms a frame to
         under 9 under software rendering, which is the difference between
         50fps and 60 on a machine with no GPU to fall back on. */
      path(ctx); ctx.fillStyle = colour; ctx.fill();
      return;
    }
    var dx = LX * step, dy = LY * step;

    /* `clip()` does not reset the current path, so the shadow fill can reuse
       the path the clip was built from. One fewer path construction per
       shape, twenty-odd shapes a cat, twice a frame — it buys back most of
       what the wider crescent above costs. */
    ctx.save();
    path(ctx);
    ctx.clip();
    ctx.fillStyle = mix(colour, SHADE_TO, 0.46);
    ctx.fill();

    /* This branch used to skip the clip, on the reasoning that the contour
       pass has already laid a stroke of OUTLINE * 2 under everything, so a
       base fill offset by less than OUTLINE spills onto the contour and is
       invisible. True — and only true while `step` is under 1.8 * s, which
       is precisely the cap that made every shadow crescent too narrow to
       see. The clip is back and the crescent is worth what it costs. */
    if (!band) {
      ctx.translate(dx, dy);
      path(ctx);
      ctx.fillStyle = colour;
      ctx.fill();
      ctx.restore();
      return;
    }

    /* the mid tone, one step towards the light */
    ctx.translate(dx, dy);
    path(ctx);
    ctx.fillStyle = colour;
    ctx.fill();
    if (band) {
      /* the lit band, bracketed so it comes out as a band and not a wash */
      ctx.translate(dx * 1.15, dy * 1.15);
      path(ctx);
      ctx.fillStyle = mix(colour, LIGHT_TO, 0.36);
      ctx.fill();
      ctx.translate(dx * 0.9, dy * 0.9);
      path(ctx);
      ctx.fillStyle = colour;
      ctx.fill();
      /* NOTE for anyone tempted to add a fourth, brighter band here: every
         fill in this recipe is offset in the SAME direction and paints over
         the one before, so the tones stack up as crescents on one side and
         the last fill owns the whole of the other side. A brighter pass added
         at the end therefore does not become a rim — it becomes a pale blob
         across the middle of the part. It was tried on 21 Aug 2026 and made
         every cat look pieced together again. Three tones is the recipe. */
    }
    ctx.restore();
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
    /* Broad across the chest and the shoulder blades, hard in at the waist,
       out again at the hip. The old curve went almost straight from hip to
       chest, so the whole trunk read as one bag — and no amount of lighting
       rescues a bag. The pull-in at 0.34 is the single line that makes this
       look like something that trains. */
    return [
      at(-0.02, hipW * 0.98),                  /* belly, over the hip */
      at(0.20,  waistW * 0.98),
      at(0.36,  waistW * 0.80),                /* the waist, pulled hard in */
      at(0.56,  chestW * 0.88),                /* the rib cage opening out */
      at(0.74,  chestW * 1.06),                /* the chest, thrown forward */
      at(0.93,  chestW * 0.86),                /* front of the shoulder */
      at(1.08,  chestW * 0.22),
      at(1.08, -chestW * 0.30),
      at(0.93, -chestW * 0.82),                /* back of the shoulder */
      at(0.72, -chestW * 1.00),                /* the shoulder blades */
      at(0.50, -chestW * 0.86),                /* the lat, running down */
      at(0.32, -waistW * 0.94),
      at(0.08, -hipW * 0.98),
      at(-0.08, -hipW * 1.04),                 /* the rump */
      at(-0.16, 0)
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

  /* Ears carry more of a cat's identity than anything but colour, so they are
     per-character: tall and pointed, small and round, wide and low. */
  /* Ears are the top of the silhouette and the cheapest distinguishing mark
     on the whole figure, so the spread here is deliberately large — the old
     range was 0.74 to 1.34, which is not enough to tell two black shapes
     apart from across a room. `lean` swings them forward or back, which
     changes an outline more than height does. */
  var EARS = {
    normal: { h: 1.00, w: 1.00, lean: 0.00 },
    /* 1.72 high and 0.80 wide put the tip two and three quarter head-radii
       above the skull in a straight vertical pair — a hare, not a cat, and
       both Luigi and Lilly wore it, which is most of why they were the
       confusable pair in the black-shape test. 1.34 is still the tallest
       ear on the roster and still reads from across a room. */
    tall:   { h: 1.34, w: 0.86, lean: 0.14 },
    /* Raked hard back, so a cat wearing it has a different TOP to its black
       shape rather than a different height of the same shape. Nothing uses
       it yet; it is here so a cat file can pick `ear: 'swept'` in one word
       instead of two cats sharing `tall`. */
    swept:  { h: 1.30, w: 0.78, lean: -0.34 },
    small:  { h: 0.60, w: 1.02, lean: -0.06 },
    wide:   { h: 0.86, w: 1.44, lean: 0.16 },
    torn:   { h: 1.18, w: 1.06, lean: -0.14, notch: true },
    /* laid flat back along the skull — a cat that is not pleased */
    back:   { h: 0.94, w: 1.10, lean: -0.46 }
  };
  function earPath(ctx, r, sx, kind) {
    var e = EARS[kind] || EARS.normal;
    var h = e.h, w = e.w, lean = e.lean * sx;
    ctx.beginPath();
    ctx.moveTo(sx * r * 0.34 * w, r * 0.56);
    ctx.quadraticCurveTo(sx * r * (0.74 + lean) * w, r * (1.14 * h),
                         sx * r * (0.96 + lean * 2) * w, r * (1.60 * h));
    if (e.notch) {
      /* one ear that has been through something */
      ctx.lineTo(sx * r * (0.80 + lean) * w, r * (1.24 * h));
      ctx.lineTo(sx * r * (1.04 + lean) * w, r * (1.14 * h));
    }
    ctx.quadraticCurveTo(sx * r * 1.06 * w, r * (1.02 * h), sx * r * 1.02 * w, r * 0.40);
    ctx.closePath();
  }

  /* The skull. Round is the default; the rest are what stop six cats being
     the same cat in six colours. */
  /* At the arcade resolution a head is about twenty-five pixels across, and
     nothing inside it survives. Whatever tells one cat from another has to be
     in the OUTLINE — so the differences here are large, and the muzzle and
     the cheek tufts are silhouette shapes rather than markings painted on.
     `cheek` is how much fur stands out at the side of the face, `muzzle` how
     far the snout is pushed forward. */
  var SKULLS = {
    round:  { rx: 1.08, ry: 1.02, jaw: 0.02, cheek: 0.36, muzzle: 0.46, brow: 0.5 },
    broad:  { rx: 1.38, ry: 0.84, jaw: 0.20, cheek: 0.86, muzzle: 0.36, brow: 0.7 },
    narrow: { rx: 0.80, ry: 1.20, jaw: 0,    cheek: 0.04, muzzle: 0.70, brow: 0.3 },
    blocky: { rx: 1.20, ry: 0.96, jaw: 0.34, cheek: 0.52, muzzle: 0.56, brow: 1.0 },
    long:   { rx: 0.90, ry: 1.34, jaw: 0,    cheek: 0.18, muzzle: 0.62, brow: 0.4 }
  };
  function skull(kind) { return SKULLS[kind] || SKULLS.round; }

  function skullPath(ctx, r, kind) {
    var k = skull(kind);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * k.rx, r * k.ry, 0, 0, Math.PI * 2);
    ctx.closePath();
    if (k.jaw) {
      /* a heavy jaw, thrown forward under the skull */
      ctx.moveTo(r * k.rx * 0.98, -r * k.ry * 0.30);
      ctx.ellipse(r * k.rx * 0.40, -r * k.ry * 0.34,
                  r * k.rx * (0.54 + k.jaw), r * k.ry * (0.44 + k.jaw * 0.6),
                  0, 0, Math.PI * 2);
      ctx.closePath();
    }
  }

  /* The snout, as part of the head's outline rather than a pale patch on it.
     A cat with no muzzle in its silhhouette is a ball with a face drawn on. */
  function muzzlePath(ctx, r, kind) {
    var k = skull(kind);
    var mx = r * k.rx * 0.46, my = -r * k.ry * 0.30;
    var mw = r * (0.40 + k.muzzle * 0.34), mh = r * (0.30 + k.muzzle * 0.20);
    ctx.beginPath();
    ctx.ellipse(mx, my, mw, mh, -0.06, 0, Math.PI * 2);
    ctx.closePath();
  }

  /* Cheek fur, which is most of the difference between a lean face and a
     broad one at this size. */
  function cheekPath(ctx, r, kind, sx) {
    var k = skull(kind);
    var cw = r * k.cheek;
    if (cw < r * 0.16) { ctx.beginPath(); return; }
    ctx.beginPath();
    ctx.moveTo(sx * r * k.rx * 0.42, -r * k.ry * 0.52);
    ctx.quadraticCurveTo(sx * r * (k.rx + k.cheek * 0.7), -r * k.ry * 0.42,
                         sx * r * (k.rx + k.cheek * 0.55), r * k.ry * 0.10);
    ctx.quadraticCurveTo(sx * r * (k.rx * 0.9), r * k.ry * 0.32,
                         sx * r * k.rx * 0.5, r * k.ry * 0.18);
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

  /* ---- how much of the drawing to do -------------------------------------

     The cats are drawn twice a frame and a cat costs about six milliseconds
     of rasterising against a sixteen-millisecond budget, so there has to be
     a way to buy frames back on a machine that needs them. This is that
     dial, and the order it gives things up in is deliberate — cheapest to
     lose first:

       2  everything (default)
       1  no muscle shapes and no cast shadow under the near limbs — the two
          passes with clips in them, which is where the time actually goes
       0  flat fills as well: one tone per part, no cel shading at all

     Level 1 keeps the contour, the costume, the three-tone head and the
     whole silhouette, so it still reads as the same character. Level 0 is a
     last resort and looks like one. */
  var DETAIL = 2;
  function setDetail(n) { DETAIL = Math.max(0, Math.min(2, n | 0)); }
  function getDetail() { return DETAIL; }

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
    var B = j.build || {};
    var MUS = B.muscle === undefined ? 1 : B.muscle;     // how shaped the limbs are
    var SKULL = B.headShape || 'round';
    var EAR = B.ear || 'normal';
    var SH = B.shoulder === undefined ? 1 : B.shoulder;  // chest, apart from girth
    var WA = B.waist === undefined ? 1 : B.waist;
    var LIMBW = B.limbW === undefined ? 1 : B.limbW;     // how thick the limbs are

    var R_TOP = 6.2 * s * G * LIMBW, R_MID = 4.6 * s * G * LIMBW, R_END = 3.4 * s * G * LIMBW;
    var HAND = 4.8 * s * G * LIMBW, FOOT_X = 7.4 * s * G, FOOT_Y = 4.2 * s * G;
    /* Girth widens the trunk SUB-linearly. At full strength a heavyweight came
       out 23 units across against a 28-unit torso — as wide as it was long,
       which is a pear, not a fighter. The square-rootish curve keeps a heavy
       cat obviously heavy without letting the trunk swallow the limbs. */
    var GW = Math.pow(G, 0.62);
    var hipW = 8.4 * s * GW, waistW = 6.6 * s * GW * WA, chestW = 11.4 * s * GW * SH;
    var OUTLINE = 1.8 * s;

    /* Three tones front to back: the shaded far side, the torso, and a
       slightly brighter near side. Depth without a single extra line. */
    /* How hard the near/far split is pushed. A quarter of a stop either way
       is what gives the figure depth without a single extra line — but on a
       cat whose MARKING is the point, it fights the marking: a tuxedo's legs
       are meant to be one unbroken black, and the near one came out mid-grey
       against the far one. `palette.depth` turns the split down for those,
       0 being none at all. Luigi's artist found this. */
    var dark = lum(c.fur) < 0.34;
    var DEPTH = c.depth === undefined ? 1 : c.depth;
    var furFront = white ? '#ffffff' : shade(c.fur, (dark ? 0.34 : 0.24) * DEPTH);
    var furBack  = white ? '#dddddd' : shade(c.fur2 || c.fur, -0.30 * DEPTH);
    /* The tail sits BEHIND the cat, so it takes the far-side tone and it is
       thinner than it was — at full girth it came out as thick as a thigh and
       read as a third limb arching over the shoulder. */
    var tailW = (c.longhair ? 5.4 : 4.0) * s * GW;

    var shapes = [];
    /* `band` puts a highlight along the lit edge as well as a shadow along
       the dark one — worth the extra pass on the big forms, wasted on a paw.
       `edge` draws a line round the piece, for a material that is not the fur
       it is sitting on. */
    function fillShape(path, colour, opt) {
      shapes.push({ k: 'f', p: path, c: colour,
                    band: !!(opt && opt.band), edge: !!(opt && opt.edge),
                    flat: !!(opt && opt.flat) });
    }
    function strokeShape(path, colour, w) { shapes.push({ k: 's', p: path, c: colour, w: w }); }

    /* ---- COSTUME ---------------------------------------------------------

       Six cats built from one skeleton with six palettes are six of the same
       cat. What makes a Street Fighter II character recognisable at a glance
       is never the face — it is the COSTUME and the SILHOUETTE: a gi, a
       qipao, a mohawk, boxing gloves, a topknot. You know Zangief from his
       outline with the screen turned upside down.

       So each cat file may carry a `look` block, and it gets to add real
       geometry at four points in the draw order. Everything it adds goes
       through the same contour pass and the same cel shading as the body, so
       a scarf is lit by the same lamp as the shoulder it sits on.

           look.pieces(A, j, fig)     A.add(layer, pathFn, colour, opts)
           look.overlay(ctx, j, fig)  free drawing, over the finished figure

       Layers, in draw order:
         'back'  behind everything — a cape, a banner, a long braid
         'far'   on the FAR arm and leg, under the torso — the other glove,
                 the other wrap, the other anklet. Without this layer a piece
                 belonging to the far arm has nowhere to go: in 'back' the arm
                 is painted over it, in 'body' it lands on top of the belly.
                 Mario's far wrist wrap was dropped for exactly that reason.
         'body'  on the torso, over the far limbs — a gi, a vest, a belt
         'front' over the near arm and leg — a glove, a wrap, a pauldron
         'head'  on the skull, under the face — a headband, a topknot, horns

       `opts` is the same as any other shape: {band, edge, flat}. Use
       `edge: true` for anything that is a different material from the fur,
       which is nearly everything a costume is made of.                   */
    var costume = { back: [], far: [], body: [], front: [], head: [] };
    var LOOK = c.look;
    if (LOOK && LOOK.pieces) {
      var api = {
        add: function (layer, path, colour, opt) {
          var bin = costume[layer];
          if (!bin) throw new Error('unknown costume layer: ' + layer);
          bin.push({ k: 'f', p: path, c: colour,
                     band: !!(opt && opt.band), edge: !!(opt && opt.edge),
                     flat: !!(opt && opt.flat) });
        },
        stroke: function (layer, path, colour, w) {
          var bin = costume[layer];
          if (!bin) throw new Error('unknown costume layer: ' + layer);
          bin.push({ k: 's', p: path, c: colour, w: w });
        },
        /* the tones a costume should be built from, so a piece of kit is lit
           by the same lamp as the cat wearing it */
        shade: function (col, amt) { return mix(col, SHADE_TO, amt === undefined ? 0.34 : amt); },
        lit: function (col, amt) { return mix(col, LIGHT_TO, amt === undefined ? 0.24 : amt); },
        smooth: smoothClosed,
        capsule: capsulePath,
        ellipse: ellipsePath,
        limb: limbPath,

        /* ---- shapes that stick OUT ------------------------------------

           A costume drawn inside the body outline changes nothing about a
           silhouette — a gi across the chest and a belt round the waist look
           like a lot of work in colour and vanish completely in black. What
           changes an outline is what stands proud of it, and these are the
           four shapes that do it. Hand-rolled in raw paths they come out as
           mush, which is why they live here.

           Every one takes the figure's own coordinates: +y up, +x forward. */

        /* A mass of fur round the neck and shoulders, standing out past the
           chest — a lion's mane, a ruff, a fur collar. `n` spikes, `out` how
           far past the body they reach, `drop` how far down the chest it
           comes. */
        mane: function (cx, j, out, n, drop, ragged) {
          var nk = j.neck, pv = j.pelvis;
          var dx = nk.x - pv.x, dy = nk.y - pv.y;
          var L2 = Math.hypot(dx, dy) || 1;
          var ux = dx / L2, uy = dy / L2;          /* up the spine */
          var fx2 = uy, fy2 = -ux;                 /* forward */
          var cxp = nk.x - ux * L2 * drop, cyp = nk.y - uy * L2 * drop;
          var pts = [];
          for (var q = 0; q < n; q++) {
            var a3 = (q / n) * Math.PI * 2;
            var spike = ragged ? (q % 2 ? 1 : 0.62) : 1;
            var rr = out * spike;
            /* squashed along the spine so it is a collar, not a ball */
            pts.push({ x: cxp + fx2 * Math.cos(a3) * rr + ux * Math.sin(a3) * rr * 0.78,
                       y: cyp + fy2 * Math.cos(a3) * rr + uy * Math.sin(a3) * rr * 0.78 });
          }
          smoothClosed(cx, pts);
        },

        /* A pauldron: a cap over the shoulder that overhangs the arm and
           flares out past the body. Drawn as a fan of points rather than
           four bezier guesses — the guesses came out as a disc. */
        pad: function (cx, at, toward, r, flare) {
          var dx = toward.x - at.x, dy = toward.y - at.y;
          var L3 = Math.hypot(dx, dy) || 1;
          var ux = dx / L3, uy = dy / L3;          /* down the arm */
          var px = -uy, py = ux;                   /* across it */
          var f2 = flare === undefined ? 1.3 : flare;
          /* u runs from just above the joint to a third down the arm; v is
             across, widening as it goes so the cap sits ON the shoulder and
             the skirt hangs off it */
          var ring = [[-0.55, -0.55], [-0.72, 0.10], [-0.55, 0.72],
                      [0.10, 1.02], [0.86, 1.24], [1.20, 0.86],
                      [1.16, -0.30], [0.70, -1.05], [0.05, -1.00]];
          var pts = [];
          for (var q4 = 0; q4 < ring.length; q4++) {
            var u4 = ring[q4][0] * r, v4 = ring[q4][1] * r * f2;
            pts.push({ x: at.x + ux * u4 + px * v4, y: at.y + uy * u4 + py * v4 });
          }
          smoothClosed(cx, pts);
        },

        /* A ribbon that trails backwards and tapers — a scarf, a headband
           tail, a belt end, a sash. `ang` is the direction it leaves in
           (degrees, 0 = straight back), `sway` bends it; pass `f.sway`. */
        streamer: function (cx, from, len, wide, ang, sway) {
          var a4 = (ang || 0) * DEG;
          var bx = -Math.cos(a4), by = Math.sin(a4);      /* backwards */
          var n2 = 7, pts = [], i2;
          for (i2 = 0; i2 <= n2; i2++) {
            var t2 = i2 / n2;
            /* the further along, the more it whips */
            var curl = Math.sin(t2 * 2.1) * sway * (0.4 + t2 * 1.5);
            pts.push({ x: from.x + bx * len * t2,
                       y: from.y + by * len * t2 + curl,
                       w: wide * (1 - t2 * 0.82) });
          }
          var fwd = [], bwd = [];
          for (i2 = 0; i2 < pts.length; i2++) {
            var a5 = pts[Math.max(0, i2 - 1)], b5 = pts[Math.min(pts.length - 1, i2 + 1)];
            var ddx = b5.x - a5.x, ddy = b5.y - a5.y, dl2 = Math.hypot(ddx, ddy) || 1;
            fwd.push({ x: pts[i2].x - ddy / dl2 * pts[i2].w, y: pts[i2].y + ddx / dl2 * pts[i2].w });
            bwd.push({ x: pts[i2].x + ddy / dl2 * pts[i2].w, y: pts[i2].y - ddx / dl2 * pts[i2].w });
          }
          cx.beginPath();
          cx.moveTo(fwd[0].x, fwd[0].y);
          for (i2 = 1; i2 < fwd.length; i2++) cx.lineTo(fwd[i2].x, fwd[i2].y);
          for (i2 = bwd.length - 1; i2 >= 0; i2--) cx.lineTo(bwd[i2].x, bwd[i2].y);
          cx.closePath();
        },

        /* A crest of spikes: a mohawk, a topknot, a torn crop of fur. `ang`
           is the direction they point in degrees (90 = straight up). */
        tuft: function (cx, at, n, len, spread, ang, jag) {
          var base = (ang === undefined ? 90 : ang) * DEG;
          /* The roots sit along a line ACROSS the direction the spikes point,
             not along it — laid out the other way they all grow from the same
             spot and come out as one blob. */
          var rx2 = -Math.sin(base), ry2 = Math.cos(base);
          cx.beginPath();
          for (var q2 = 0; q2 < n; q2++) {
            var k2 = n === 1 ? 0.5 : q2 / (n - 1);
            var a6 = base + (k2 - 0.5) * spread * DEG;
            var ln = len * (jag ? (0.52 + 0.48 * Math.abs(Math.sin(q2 * 2.3)))
                                : (1 - Math.abs(k2 - 0.5) * 0.55));
            var w2 = len * 0.22;
            var ox2 = at.x + rx2 * (k2 - 0.5) * len * 1.05;
            var oy2 = at.y + ry2 * (k2 - 0.5) * len * 1.05;
            cx.moveTo(ox2 - Math.sin(a6) * w2, oy2 + Math.cos(a6) * w2);
            cx.lineTo(ox2 + Math.cos(a6) * ln, oy2 + Math.sin(a6) * ln);
            cx.lineTo(ox2 + Math.sin(a6) * w2, oy2 - Math.cos(a6) * w2);
            cx.closePath();
          }
        }
      };
      /* Measurements a costume needs, in the same units the body uses.

         `t`, `vx` and `air` are what make a costume ALIVE. A scarf that does
         not stream and a belt end that does not swing are two more stiff
         shapes glued to a cat; the reference sells its characters as much on
         what trails behind them as on what they are wearing. `sway` is the
         one number most pieces want: it already folds the cat's speed and a
         slow idle drift together, positive meaning "blown backwards". */
      var vx = opts.vx || 0;
      var tNow = opts.t || 0;
      var sway = vx * (opts.facing || 1) * -0.9
               + Math.sin(tNow * 0.055) * 1.5
               + (opts.air ? 2.2 : 0);
      LOOK.pieces(api, j, {
        t: tNow, vx: vx, air: !!opts.air, sway: sway,
        s: s, G: G, GW: GW, white: white,
        hipW: hipW, waistW: waistW, chestW: chestW,
        R_TOP: R_TOP, R_MID: R_MID, R_END: R_END,
        HAND: HAND, FOOT_X: FOOT_X, FOOT_Y: FOOT_Y,
        headR: j.headR, line: line,
        fur: fur, fur2: fur2, belly: belly, furFront: furFront, furBack: furBack
      });
    }
    function pour(layer) {
      var bin = costume[layer];
      for (var q = 0; q < bin.length; q++) shapes.push(bin[q]);
    }

    /* SILHOUETTE MODE. Every fill forced to one colour, no shading, no face.

       This is the test that decides whether a roster works: turn two
       characters black and if you cannot tell them apart, the costume work is
       not finished. It has to flatten the COSTUME too — pieces carry their
       own colours, so a white gi and a red mawashi were still telling the two
       apart in the first version of this and it proved nothing. */
    var SIL = opts.silhouette;

    var back = c.points ? c.marks : furBack;
    var shinF = c.points ? c.marks : (c.sock ? (c.sockColor || belly) : fur);
    var footF = c.points ? c.marks : shinF;
    var tailCol = c.points ? c.marks : fur;
    var tailUp = (j.pose && j.pose.tailFront > 0.5);

    function addTail() {
      var tc = c.points ? c.marks : (tailUp ? shade(tailCol, dark ? -0.18 : -0.20) : furBack);
      fillShape(function (cx) { tailPath(cx, j, tailW, tailW * 0.52); }, tc);
      if (c.tailTip) {
        fillShape(function (cx) {
          ellipsePath(cx, j.tail[3].x, j.tail[3].y, tailW * 0.56, tailW * 0.56);
        }, white ? '#fff' : c.tailTip);
      }
    }
    pour('back');
    if (!tailUp) addTail();

    /* back leg and arm, in the shade */
    fillShape(function (cx) { ellipsePath(cx, j.hipB.x, j.hipB.y, R_TOP * 1.10, R_TOP * 1.02); }, back, { flat: true });
    fillShape(function (cx) { limbPath(cx, j.hipB, j.kneeB, R_TOP * 1.16, R_MID * 0.80, MUS * 1.25, 'thigh'); }, back, { band: true });
    fillShape(function (cx) { limbPath(cx, j.kneeB, j.footB, R_MID * 0.80, R_END * 0.74, MUS * 1.0, 'shin'); }, back);
    fillShape(function (cx) { footPath(cx, j.footB, j.kneeB, FOOT_X * 0.80, FOOT_Y * 0.92, false); }, back, { flat: true });
    var armBack = c.points ? c.marks : furBack;
    fillShape(function (cx) { ellipsePath(cx, j.shB.x, j.shB.y, R_TOP * 1.24, R_TOP * 1.16); }, armBack, { flat: true });
    fillShape(function (cx) { limbPath(cx, j.shB, j.elbB, R_TOP * 0.98, R_MID * 0.80, MUS * 1.0, 'upperArm'); }, armBack, { band: true });
    fillShape(function (cx) { limbPath(cx, j.elbB, j.handB, R_MID * 0.80, R_END * 0.76, MUS * 0.9, 'foreArm'); }, armBack);
    fillShape(function (cx) { fistPath(cx, j.handB, j.elbB, HAND * 0.86, false); }, c.gloves || armBack, { flat: true });

    /* Kit that belongs to the FAR limbs. It has to land here: after the far
       arm and leg are painted, and before the torso goes down over them. */
    pour('far');

    /* the long-haired underlayer, wider than the body it sits behind */
    var bodyPts = bodyPoints(j, hipW, waistW, chestW);
    if (c.longhair) {
      var ruffPts = bodyPoints(j, hipW * 1.20, waistW * 1.20, chestW * 1.16);
      fillShape(function (cx) { smoothClosed(cx, ruffPts); }, fur2);
    }

    /* the body itself, then the masses that carry the limbs out of it */
    fillShape(function (cx) { smoothClosed(cx, bodyPts); }, fur, { band: true });

    /* The chest and belly are a different material from the back, and in a
       sprite of this kind a different material gets a hard edge, not a soft
       one. This is the cat's equivalent of a gi over skin: it is the shape
       that stops the torso being one undifferentiated mass. */
    if (c.pattern !== 'tuxedo' && c.pattern !== 'siamese') {
      var bibPts = (function () {
        var pv = j.pelvis, nv = j.neck;
        var dxv = nv.x - pv.x, dyv = nv.y - pv.y;
        var lv = Math.hypot(dxv, dyv) || 0.001;
        var fxv = dyv / lv, fyv = -dxv / lv;
        function bp(tt, ww) {
          return { x: pv.x + dxv * tt + fxv * ww, y: pv.y + dyv * tt + fyv * ww };
        }
        return [ bp(0.02, hipW * 0.52), bp(0.28, waistW * 0.86),
                 bp(0.60, chestW * 0.92), bp(0.90, chestW * 0.74),
                 bp(1.02, chestW * 0.06), bp(0.64, -chestW * 0.20),
                 bp(0.28, -waistW * 0.16), bp(0.02, -hipW * 0.10) ];
      })();
      fillShape(function (cx) { smoothClosed(cx, bibPts); }, belly, { band: true });
    }
    fillShape(function (cx) { ellipsePath(cx, j.hipF.x, j.hipF.y, R_TOP * 1.16, R_TOP * 1.06); }, fur, { flat: true });
    /* a neck, so the head is not balanced straight on the shoulders */
    /* The neck. At chestW * 0.46 it was nearly as wide as the chest, which is
       why the head looked stuck straight onto the shoulders — a fighter has a
       throat, and you can see it. Narrow, and a shade darker than the chest
       so it sits back in the shadow the jaw throws. */
    fillShape(function (cx) {
      capsulePath(cx, j.neck, j.head, chestW * 0.30, j.headR * 0.52);
    }, shade(fur, dark ? -0.10 : -0.14), { flat: true });

    pour('body');

    /* front leg and arm */
    var frontParts = [
      function (cx) { ellipsePath(cx, j.shF.x, j.shF.y, R_TOP * 1.16, R_TOP * 1.06); },
      function (cx) { limbPath(cx, j.hipF, j.kneeF, R_TOP * 1.24, R_MID * 0.86, MUS * 1.25, 'thigh'); },
      function (cx) { limbPath(cx, j.kneeF, j.footF, R_MID * 0.86, R_END * 0.80, MUS * 1.0, 'shin'); },
      function (cx) { footPath(cx, j.footF, j.kneeF, FOOT_X * 0.92, FOOT_Y, true); },
      function (cx) { limbPath(cx, j.shF, j.elbF, R_TOP * 1.04, R_MID * 0.86, MUS * 1.05, 'upperArm'); },
      function (cx) { limbPath(cx, j.elbF, j.handF, R_MID * 0.86, R_END * 0.80, MUS * 0.95, 'foreArm'); },
      function (cx) { fistPath(cx, j.handF, j.elbF, HAND * 1.00, false); }
    ];
    var frontStart = shapes.length;
    fillShape(frontParts[0], furFront, { flat: true });
    fillShape(frontParts[1], c.points ? shade(c.marks, 0.10) : furFront, { band: true });
    fillShape(frontParts[2], shinF === fur ? furFront : shinF);
    fillShape(frontParts[3], footF === fur ? furFront : footF, { flat: true });
    fillShape(frontParts[4], furFront, { band: true });
    fillShape(frontParts[5], furFront);
    fillShape(frontParts[6], c.gloves || furFront, { flat: true });

    pour('front');

    /* ---- the kit -------------------------------------------------------

       Six cats in six colours are still one cat. What separates a Ryu from a
       Zangief at a glance is not the face, it is the gear: a headband with
       tails, a champion's belt, gloves the size of your head. These pieces go
       into the shape list where they change the outline, and are drawn on top
       where they only mark it. */
    var kit = c.kit || {};

    if (kit.gloves) {
      var gw = 7.4 * s * G, gc = kit.gloves;
      shapes.push({ k: 'f', c: gc, band: true, edge: true, p: function (cx) {
        ellipsePath(cx, j.handB.x, j.handB.y, gw * 0.86, gw * 0.80); } });
      shapes.push({ k: 'f', c: gc, band: true, edge: true, p: function (cx) {
        ellipsePath(cx, j.handF.x, j.handF.y, gw, gw * 0.92); } });
    }
    if (kit.boots) {
      var bw = 8.6 * s * G, bc = kit.boots;
      shapes.push({ k: 'f', c: bc, p: function (cx) {
        limbPath(cx, j.kneeB, j.footB, R_MID * 1.02, R_END * 1.3, 0.3); } });
      shapes.push({ k: 'f', c: bc, p: function (cx) {
        pawPath(cx, j.footB, j.kneeB, bw * 0.86, FOOT_Y * 1.02, false); } });
      shapes.push({ k: 'f', c: bc, p: function (cx) {
        limbPath(cx, j.kneeF, j.footF, R_MID * 1.06, R_END * 1.34, 0.3); } });
      shapes.push({ k: 'f', c: bc, p: function (cx) {
        pawPath(cx, j.footF, j.kneeF, bw, FOOT_Y * 1.06, true); } });
    }
    if (kit.scarf) {
      /* A knot at the throat with two tails falling away behind. It was a
         single wide wedge to begin with, which read as a paper aeroplane
         stuck to his neck. */
      var sc = kit.scarf;
      var nk = { x: U.lerp(j.neck.x, j.head.x, 0.22), y: U.lerp(j.neck.y, j.head.y, 0.22) };
      var lag = (j.pose && j.pose.tail && j.pose.tail[0] || 240) - 240;
      function tail(len, drop, wid) {
        var mid = { x: nk.x - len * 0.55 * s, y: nk.y - drop * 0.35 * s };
        var end = { x: nk.x - len * s + lag * 0.06 * s, y: nk.y - drop * s };
        return function (cx) {
          var pts = [], q;
          for (q = 0; q <= 6; q++) {
            var t = q / 6, u = 1 - t;
            var px = u * u * nk.x + 2 * u * t * mid.x + t * t * end.x;
            var py = u * u * nk.y + 2 * u * t * mid.y + t * t * end.y;
            pts.push({ x: px, y: py, w: wid * s * (1 - t * 0.62) });
          }
          var fwd = [], bwd = [];
          for (q = 0; q < pts.length; q++) {
            var a2 = pts[Math.max(0, q - 1)], b2 = pts[Math.min(pts.length - 1, q + 1)];
            var ddx = b2.x - a2.x, ddy = b2.y - a2.y, dl = Math.hypot(ddx, ddy) || 1;
            fwd.push({ x: pts[q].x - ddy / dl * pts[q].w, y: pts[q].y + ddx / dl * pts[q].w });
            bwd.push({ x: pts[q].x + ddy / dl * pts[q].w, y: pts[q].y - ddx / dl * pts[q].w });
          }
          cx.beginPath();
          cx.moveTo(fwd[0].x, fwd[0].y);
          for (q = 1; q < fwd.length; q++) cx.lineTo(fwd[q].x, fwd[q].y);
          for (q = bwd.length - 1; q >= 0; q--) cx.lineTo(bwd[q].x, bwd[q].y);
          cx.closePath();
        };
      }
      shapes.push({ k: 'f', c: shade(sc, -0.18), edge: true, p: tail(26, -9, 2.6) });
      shapes.push({ k: 'f', c: sc, edge: true, p: tail(20, 5, 3.0) });
      shapes.push({ k: 'f', c: sc, band: true, edge: true, p: function (cx) {
        ellipsePath(cx, nk.x, nk.y, chestW * 0.46, chestW * 0.34, 0.2); } });
    }
    if (kit.mane) {
      /* a ruff of fur round the neck, which widens the head into the body */
      var mn = kit.mane;
      var mx = U.lerp(j.neck.x, j.head.x, 0.30), my = U.lerp(j.neck.y, j.head.y, 0.30);
      shapes.splice(frontStart, 0, { k: 'f', c: mn, p: function (cx) {
        var pts = [], n = 11;
        for (var q = 0; q < n; q++) {
          var a2 = (q / n) * Math.PI * 2;
          var rr = (q % 2 ? 1.34 : 1.00) * chestW * 0.86;
          pts.push({ x: mx + Math.cos(a2) * rr, y: my + Math.sin(a2) * rr * 0.86 });
        }
        smoothClosed(cx, pts);
      } });
    }

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
      { p: inHead(function (cx) { earPath(cx, r, 1, EAR); }), c: c.points ? c.marks : fur },
      { p: inHead(function (cx) { earPath(cx, r, -0.76, EAR); }), c: c.points ? c.marks : fur },
      { p: inHead(function (cx) { cheekPath(cx, r, SKULL, -0.55); }), c: c.points ? c.marks : fur },
      { p: inHead(function (cx) { skullPath(cx, r, SKULL); }), c: fur, band: true },
      { p: inHead(function (cx) { cheekPath(cx, r, SKULL, 1); }), c: fur },
      { p: inHead(function (cx) { muzzlePath(cx, r, SKULL); }),
        c: c.muzzleColor || belly, band: true }
    ];
    headShapes.forEach(function (hs) { fillShape(hs.p, hs.c, { band: hs.band }); });

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
      hipW: hipW, waistW: waistW, chestW: chestW, tailW: tailW, kit: c.kit || {},
      OUTLINE: OUTLINE, s: s, G: G, limbW: LIMBW,
      costumeHead: costume.head, look: LOOK, silhouette: SIL
    };
  }

  /* Which of `frontParts` are worth casting a shadow with, and worth
     outlining against the chest: thigh, shin, upper arm, forearm. */
  var SHADOW_PARTS = [1, 2, 4, 5];

  /* Lay the figure down: fills, markings, cast shadows, then the light, then
     the contour underneath it all, then the face on top. */
  function paintFigure(ctx, fig, j, c, opts) {
    var s = fig.s, G = fig.G, white = fig.white;
    var shapes = fig.shapes;
    var i, sh;
    /* THE SHADOW CRESCENT'S WIDTH, and the single number that decided
       whether this roster read as a sprite or as vector art.

       It was 1.75 * s, deliberately just under OUTLINE (1.8 * s) so the
       unclipped base fill in `celFill` could spill onto the contour instead
       of being clipped. That works, and it costs the whole effect: a shadow
       crescent 1.8px wide sitting directly on top of a 1.8px black outline
       is not a shadow, it is a slightly thicker outline. Every large form —
       torso, thigh, upper arm, gi, tail, headband tails — came out a flat
       fill with a heavy edge, which is exactly what vector art looks like.

       At 4.2 the crescent is a visible band of shadow tone on the near arm,
       both thighs, the calf and the gi at 1x game scale. It is past OUTLINE,
       so the no-clip shortcut in `celFill` is no longer valid and that
       branch clips again — measured at about a third of a millisecond a
       cat, which is the price of the thing the art brief is mostly about. */
    var step = white ? 0 : 4.2 * s;

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

    /* ---- pass two: the fills, each cel-shaded from the same light ---- */
    if (fig.silhouette) {
      ctx.save();
      ctx.fillStyle = fig.silhouette;
      for (i = 0; i < shapes.length; i++) {
        sh = shapes[i];
        if (sh.k === 's') { sh.p(ctx); ctx.strokeStyle = fig.silhouette; ctx.lineWidth = sh.w; ctx.stroke(); }
        else { sh.p(ctx); ctx.fill(); }
      }
      /* The costume's HEAD layer too — a topknot, a headband's tails, horns.
         Those are exactly the pieces that change an outline, so leaving them
         out made the test miss the thing it exists to measure. They live in
         the head's own frame, which is why they need the transform. */
      if (fig.costumeHead && fig.costumeHead.length) {
        ctx.translate(j.head.x, j.head.y);
        ctx.rotate(-(j.headRot || 0) * DEG);
        for (i = 0; i < fig.costumeHead.length; i++) {
          var hsq = fig.costumeHead[i];
          if (hsq.k === 's') { hsq.p(ctx); ctx.strokeStyle = fig.silhouette; ctx.lineWidth = hsq.w; ctx.stroke(); }
          else { hsq.p(ctx); ctx.fill(); }
        }
      }
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (i = 0; i < shapes.length; i++) {
      sh = shapes[i];
      if (sh.k === 's') { sh.p(ctx); ctx.strokeStyle = sh.c; ctx.lineWidth = sh.w; ctx.stroke(); }
      else if (white) { sh.p(ctx); ctx.fillStyle = sh.c; ctx.fill(); }
      else celFill(ctx, sh.p, sh.c, sh.band, (sh.flat || DETAIL < 1) ? 0 : step);
      /* A piece of kit is a different material from the fur under it, and a
         material boundary in a sprite of this kind carries a line. Fur on fur
         does not — that is what turns a limb into a sticker. */
      if (sh.edge) {
        sh.p(ctx);
        ctx.strokeStyle = fig.line;
        ctx.lineWidth = 1.15 * s;
        ctx.stroke();
      }
    }
    ctx.restore();

    /* ---- markings, belly and ruff, clipped inside the body ---- */
    ctx.save();
    smoothClosed(ctx, fig.bodyPts);
    ctx.clip();
    drawPattern(ctx, c, j);

    /* The near limbs used to carry a dark line all the way round, which drew
       them as stickers laid on the chest. A cast shadow says the same thing —
       this is in front of that — without ever cutting the body. It is an
       offset copy inside the torso; the limbs are then laid down again on
       top, so all that survives is the part sticking out from under them. */
    if (!white && DETAIL >= 2) {
      /* One pass, not two. The second, wider, fainter copy was fourteen more
         fills to soften an edge nobody can see softening at ninety pixels
         tall, and the cats are drawn twice a frame. */
      ctx.save();
      ctx.translate(-3.0 * s, -3.8 * s);
      ctx.fillStyle = 'rgba(18,10,24,.46)';
      /* The two big limb segments and the head, not all seven parts. The
         shoulder cap, the foot and the fist are either inside the torso
         already or nowhere near it, so their offset copies were three fills
         that changed no pixel. Order in `frontParts` is shoulder, thigh,
         shin, foot, upper arm, forearm, fist. */
      SHADOW_PARTS.forEach(function (q) { fig.frontParts[q](ctx); ctx.fill(); });
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
      if (sh.k === 's') { sh.p(ctx); ctx.strokeStyle = sh.c; ctx.lineWidth = sh.w; ctx.stroke(); }
      else if (white) { sh.p(ctx); ctx.fillStyle = sh.c; ctx.fill(); }
      else celFill(ctx, sh.p, sh.c, sh.band, (sh.flat || DETAIL < 1) ? 0 : step);
      if (sh.edge) {
        sh.p(ctx);
        ctx.strokeStyle = fig.line;
        ctx.lineWidth = 1.15 * s;
        ctx.stroke();
      }
    }
    ctx.restore();

    /* The near limbs get a line WHERE THEY CROSS THE BODY, and nowhere else.

       The old rule here — fur on fur never carries a line — was learned from
       a version that outlined every limb all the way round, which does turn
       them into stickers. But the opposite is worse: without any line at all
       the near arm and the chest are one continuous grey mass and you cannot
       see where the arm is, which is most of what "the cats look nothing like
       Street Fighter characters" meant. Ryu's near arm is outlined against
       his gi; so is this.

       Clipping to the torso is what keeps both true. The line can only appear
       inside the body outline, so it separates the arm from the chest and
       never touches the silhouette the contour pass already drew. */
    if (!white) {
      ctx.save();
      smoothClosed(ctx, fig.bodyPts);
      ctx.clip();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = fig.line;
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = 1.9 * s;
      /* Same list: the clip is the torso, so a foot or a fist can only ever
         stroke into empty space and be thrown away. */
      SHADOW_PARTS.forEach(function (q) { fig.frontParts[q](ctx); ctx.stroke(); });
      ctx.restore();
    }

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

    if (!white && DETAIL >= 2) drawForm(ctx, fig, j);
    if (!white) drawKit(ctx, fig, j, c);
    drawHead(ctx, j, c, fig.fur, fig.fur2, fig.belly, fig.line, opts, fig);

    /* Anything the costume wants drawn over the finished cat — stripes, a
       scar, an insignia on a belt. After the face, so it can cross it. */
    if (fig.look && fig.look.overlay && !fig.white) {
      ctx.save();
      fig.look.overlay(ctx, j, fig);
      ctx.restore();
    }
  }

  /* Anatomy lines: the creases a body actually has.

     A short dark line inside the elbow and behind the knee, and a line where
     the near arm crosses the chest. Every fighting-game sprite has them, and
     without them a limb is a shape rather than a joint — which is most of
     what "geometric shapes moving unlike a body" meant. They are drawn on top
     of the fills and under the kit, in the contour colour so they read as
     part of the same drawing. */
  function drawForm(ctx, fig, j) {
    var s = fig.s, G = fig.G;
    ctx.save();
    ctx.strokeStyle = 'rgba(24,18,28,.32)';
    ctx.lineCap = 'round';

    /* A crease sits at the joint, on the inside of the bend, and runs across
       the limb rather than along it. The inside of the bend is where the two
       segments point when you add their directions together — no bend, no
       crease, which is right: a straight arm has no line in it. */
    function crease(a2, b2, c2, rad) {
      var ax = a2.x - b2.x, ay = a2.y - b2.y, al = Math.hypot(ax, ay) || 1;
      var cx2 = c2.x - b2.x, cy2 = c2.y - b2.y, cl = Math.hypot(cx2, cy2) || 1;
      var mx = ax / al + cx2 / cl, my = ay / al + cy2 / cl;
      var ml = Math.hypot(mx, my);
      if (ml < 0.35) return;                 /* straight: nothing to crease */
      mx /= ml; my /= ml;
      var bend = Math.min(1, (ml - 0.35) / 0.9);
      ctx.globalAlpha = 0.20 + 0.5 * bend;
      ctx.lineWidth = 1.05 * s;
      var px = -my, py = mx;                 /* across the limb */
      var ox = b2.x + mx * rad * 0.42, oy = b2.y + my * rad * 0.42;
      var half = rad * 0.62;
      ctx.beginPath();
      ctx.moveTo(ox - px * half, oy - py * half);
      ctx.quadraticCurveTo(ox + mx * rad * 0.22, oy + my * rad * 0.22,
                           ox + px * half, oy + py * half);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    var R = 5.6 * s * G;
    crease(j.shF, j.elbF, j.handF, R);
    crease(j.hipF, j.kneeF, j.footF, R * 1.12);
    crease(j.hipB, j.kneeB, j.footB, R * 0.92);
    crease(j.shB, j.elbB, j.handB, R * 0.88);

    /* A WRIST.

       Both elbows and both knees were creased and nothing else, so a fist
       ran straight into its own forearm and the limb finished in a rounded
       stub. It is loudest on the FAR arm, which is filled flat in the
       darkened back tone with no shading to break it up at all — Lilly's
       read as a scabbard hanging off her elbow and Gracie's as a second
       tail. One line across the joint, the same idea as the elbow crease,
       two strokes a cat and no clip. */
    var HANDR = 4.8 * s * G * (fig.limbW || 1);
    function wrist(elbow, hand, rad) {
      var dx = hand.x - elbow.x, dy = hand.y - elbow.y;
      var dl = Math.hypot(dx, dy) || 1;
      var px = -dy / dl, py = dx / dl;          /* across the forearm */
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 1.05 * s;
      ctx.beginPath();
      ctx.moveTo(hand.x - px * rad, hand.y - py * rad);
      ctx.lineTo(hand.x + px * rad, hand.y + py * rad);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    wrist(j.elbF, j.handF, HANDR * 0.45);
    wrist(j.elbB, j.handB, HANDR * 0.40);

    /* the line under the collarbone, where the chest meets the shoulders */
    var cx1 = U.lerp(j.pelvis.x, j.neck.x, 0.82), cy1 = U.lerp(j.pelvis.y, j.neck.y, 0.82);
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1.0 * s;
    ctx.beginPath();
    ctx.moveTo(cx1 - fig.chestW * 0.46, cy1 - 0.5 * s);
    ctx.quadraticCurveTo(cx1, cy1 + 2.2 * s, cx1 + fig.chestW * 0.50, cy1 - 1.2 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;

    /* ---- muscle, in the shadow tone, with hard edges ---------------------

       Creases say where a limb bends. They do not say what is under the fur,
       and a limb with no mass in it is the "geometric shapes moving unlike a
       body" complaint in one sentence.

       Two things matter here and the first version got both wrong. The tone
       has to be the SAME shadow the cel shading uses — the base colour pushed
       towards the one cool dark — and not a wash of translucent black, which
       greys the fur wherever it lands and reads as dirt. And the edge has to
       be hard: a pectoral in Street Fighter II is a flat block of the shadow
       tone with a definite boundary, not a soft blob.

       Everything below is clipped to the part it belongs to, so nothing can
       spill past the silhouette.                                          */
    var sh1 = mix(fig.fur, SHADE_TO, 0.30);     /* the form shadow */
    var sh2 = mix(fig.fur, SHADE_TO, 0.46);     /* the crease under it */
    var lit1 = mix(fig.fur, LIGHT_TO, 0.20);    /* the top of a muscle */

    /* A block of tone laid inside one limb segment, described in the limb's
       own frame: `u` runs 0 at the top joint to 1 at the bottom one, `v` is
       across it, +1 being the leading edge. */
    function inLimb(a2, b2, r, pts, colour) {
      var dx = b2.x - a2.x, dy = b2.y - a2.y, dl = Math.hypot(dx, dy) || 1;
      var ux = dx / dl, uy = dy / dl, px = -uy, py = ux;
      var ring = [];
      for (var q = 0; q < pts.length; q++) {
        ring.push({ x: a2.x + ux * dl * pts[q][0] + px * r * pts[q][1],
                    y: a2.y + uy * dl * pts[q][0] + py * r * pts[q][1] });
      }
      /* rounded, not faceted — a muscle drawn with straight edges reads as
         a plate of armour, which is what the first version of this looked
         like */
      smoothClosed(ctx, ring);
      ctx.fillStyle = colour;
      ctx.fill();
    }

    /* ---- the near limbs ---------------------------------------------------

       All four near segments are clipped ONCE, against a single path holding
       all of them. Canvas clips to the union of a path's subpaths, so this is
       the same picture as clipping each limb in turn — but `clip()` is the
       expensive call in a software rasteriser, and five of them per cat per
       frame measured at twice the cost of the muscle shapes themselves. Two
       clips instead of five took two cats from 14ms a frame back under 10. */
    var armR = 5.2 * s * G * (fig.limbW || 1);
    var legR = 6.2 * s * G * (fig.limbW || 1);
    ctx.save();
    ctx.beginPath();
    limbPath(ctx, j.shF, j.elbF, armR * 1.12, armR * 0.86, 1, 'upperArm');
    limbPath(ctx, j.elbF, j.handF, armR * 0.86, armR * 0.80, 1, 'foreArm');
    limbPath(ctx, j.hipF, j.kneeF, legR * 1.24, legR * 0.86, 1, 'thigh');
    limbPath(ctx, j.kneeF, j.footF, legR * 0.86, legR * 0.80, 1, 'shin');
    ctx.clip();

    /* the deltoid cap, sitting on top of the arm where it leaves the body */
    inLimb(j.shF, j.elbF, armR, [[-0.10, -1.3], [0.34, -1.3], [0.30, 0.3], [-0.10, 1.3]], sh1);
    /* the bicep belly catching the light, and the tricep in shadow behind it */
    inLimb(j.shF, j.elbF, armR, [[0.36, 0.20], [0.72, 0.30], [0.86, 1.3], [0.34, 1.3]], lit1);
    inLimb(j.shF, j.elbF, armR, [[0.30, -1.3], [0.94, -1.3], [0.86, -0.30], [0.40, -0.40]], sh1);
    /* The forearm gets ONE shape, not two. It is about six pixels across in
       the finished picture and the second tone was invisible. */
    inLimb(j.elbF, j.handF, armR * 0.86,
           [[0.00, -1.3], [0.80, -1.3], [0.66, -0.34], [0.06, -0.44]], sh1);
    /* the quad down the front of the thigh, the hamstring behind it */
    inLimb(j.hipF, j.kneeF, legR, [[0.02, 0.10], [0.52, 0.34], [0.86, 1.3], [0.00, 1.3]], lit1);
    inLimb(j.hipF, j.kneeF, legR, [[0.00, -1.3], [0.84, -1.3], [0.72, -0.28], [0.06, -0.44]], sh1);
    /* the calf: high on the back of the leg, which is what makes it a calf */
    inLimb(j.kneeF, j.footF, legR * 0.86,
           [[0.02, -1.3], [0.52, -1.3], [0.62, -0.20], [0.08, -0.30]], lit1);
    inLimb(j.kneeF, j.footF, legR * 0.86,
           [[0.52, -1.3], [0.96, -1.3], [0.92, -0.40], [0.60, -0.24]], sh1);
    ctx.restore();

    /* ---- the trunk: pectoral, ribs, abdomen, lat ---- */
    ctx.save();
    smoothClosed(ctx, fig.bodyPts);
    ctx.clip();

    /* the spine of the trunk, in its own frame: t up the body, w forward */
    var tp = j.pelvis, tn = j.neck;
    var tdx = tn.x - tp.x, tdy = tn.y - tp.y;
    var tlen = Math.hypot(tdx, tdy) || 1;
    var tfx = tdy / tlen, tfy = -tdx / tlen;
    function T(t2, w) {
      return { x: tp.x + tdx * t2 + tfx * w, y: tp.y + tdy * t2 + tfy * w };
    }
    function shape(pts, colour) {
      var ring = [];
      for (var q2 = 0; q2 < pts.length; q2++) {
        ring.push(T(pts[q2][0], pts[q2][1] * fig.chestW));
      }
      smoothClosed(ctx, ring);
      ctx.fillStyle = colour;
      ctx.fill();
    }

    /* Four shapes, not nine. The trunk is about twenty pixels across in the
       finished picture and every extra block on it turns to noise; what has
       to survive is the pec, the shadow under it, the lat, and the line down
       the middle of the belly. */
    shape([[0.62, 0.26], [0.90, 0.40], [0.94, 0.96], [0.64, 0.94]], lit1);
    shape([[0.56, 0.26], [0.64, 0.94], [0.58, 1.00], [0.50, 0.42]], sh2);
    shape([[0.84, -0.94], [0.88, -0.34], [0.42, -0.38], [0.38, -0.84]], sh1);
    shape([[0.16, 0.10], [0.46, 0.16], [0.45, 0.30], [0.15, 0.24]], sh1);
    ctx.restore();

    ctx.restore();
  }

  /* The parts of the kit that mark the body rather than change its outline.
     Drawn after the fills so they sit on the fur, and before the face so a
     headband goes under the eyes rather than over them. */
  function drawKit(ctx, fig, j, c) {
    var kit = c.kit || {};
    var s = fig.s, G = fig.G;
    var lit = function (x) { return x; };

    if (kit.belt) {
      var bx = U.lerp(j.pelvis.x, j.neck.x, 0.30), by = U.lerp(j.pelvis.y, j.neck.y, 0.30);
      var ang = Math.atan2(j.neck.x - j.pelvis.x, j.neck.y - j.pelvis.y);
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(-ang);
      ctx.fillStyle = lit(kit.belt);
      ctx.fillRect(-fig.hipW * 1.15, -2.6 * s * G, fig.hipW * 2.3, 5.2 * s * G);
      ctx.fillStyle = kit.beltPlate || '#f5d76e';
      ctx.beginPath();
      ctx.ellipse(fig.hipW * 0.22, 0, 4.4 * s * G, 3.4 * s * G, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = 0.9 * s;
      ctx.stroke();
      ctx.restore();
    }

    if (kit.wraps) {
      /* bandage over the forearm, the mark of somebody who has been doing
         this a long time */
      ctx.save();
      ctx.strokeStyle = lit(kit.wraps);
      ctx.lineCap = 'butt';
      [[j.elbF, j.handF, 1], [j.elbB, j.handB, 0.86]].forEach(function (arm) {
        var a = arm[0], b = arm[1], k = arm[2];
        var dx = b.x - a.x, dy = b.y - a.y;
        ctx.lineWidth = 3.4 * s * G * k;
        for (var q = 0; q < 4; q++) {
          var t0 = 0.34 + q * 0.16;
          ctx.beginPath();
          ctx.moveTo(a.x + dx * t0, a.y + dy * t0);
          ctx.lineTo(a.x + dx * (t0 + 0.11), a.y + dy * (t0 + 0.11));
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    if (kit.anklets) {
      ctx.save();
      ctx.strokeStyle = lit(kit.anklets);
      ctx.lineWidth = 3.6 * s * G;
      ctx.lineCap = 'butt';
      [[j.kneeF, j.footF], [j.kneeB, j.footB]].forEach(function (leg) {
        var a = leg[0], b = leg[1];
        ctx.beginPath();
        ctx.moveTo(U.lerp(a.x, b.x, 0.74), U.lerp(a.y, b.y, 0.74));
        ctx.lineTo(U.lerp(a.x, b.x, 0.90), U.lerp(a.y, b.y, 0.90));
        ctx.stroke();
      });
      ctx.restore();
    }

    if (kit.scars) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,236,220,.55)';
      ctx.lineWidth = 1.15 * s;
      ctx.lineCap = 'round';
      var sx = U.lerp(j.pelvis.x, j.neck.x, 0.80) + 1 * s * G;
      var sy = U.lerp(j.pelvis.y, j.neck.y, 0.80);
      for (var q2 = 0; q2 < kit.scars; q2++) {
        ctx.beginPath();
        ctx.moveTo(sx + q2 * 3.4 * s, sy + 5 * s);
        ctx.lineTo(sx + q2 * 3.4 * s - 2 * s, sy - 6 * s);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* ---- the face, drawn on top of the finished silhouette ------------------ */

  function drawHead(ctx, j, c, fur, fur2, belly, line, opts, fig) {
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

    /* The skull, cel-shaded to match the body.

       This was a soft vertical gradient, which is why the head read as a
       shiny plastic ball while everything under it was hard-shaded — one
       smooth form on an otherwise faceted figure is more obvious than no
       shading at all. Four hard shapes instead: the crown catching the light,
       the brow throwing a shadow down over the eyes, the far cheek turning
       away, and the underside of the jaw. */
    if (!white) {
      ctx.save();
      skullPath(ctx, r, (j.build && j.build.headShape) || 'round');
      ctx.clip();

      /* The four tones were LIGHT_TO 0.20, then SHADE_TO 0.26, 0.34 and
         0.40 — the two darkest six percent apart, all four inside a twenty
         percent band. Four faceted shapes that close together do not read as
         facets at 90px, they average out into the soft vertical gradient the
         comment above says was fixed. Spread apart they are what they were
         meant to be: a lit crown and three separated darks. */
      /* the crown, lit */
      ctx.fillStyle = mix(fur, LIGHT_TO, 0.32);
      ctx.beginPath();
      ctx.moveTo(-r * 1.2, r * 0.30);
      ctx.quadraticCurveTo(0, r * 0.86, r * 1.2, r * 0.16);
      ctx.lineTo(r * 1.2, r * 1.4);
      ctx.lineTo(-r * 1.2, r * 1.4);
      ctx.closePath();
      ctx.fill();

      /* the brow, and the shadow it throws over the eyes */
      ctx.fillStyle = mix(fur, SHADE_TO, 0.30);
      ctx.beginPath();
      ctx.moveTo(-r * 1.2, r * 0.34);
      ctx.quadraticCurveTo(0, r * 0.10, r * 1.2, r * 0.30);
      ctx.lineTo(r * 1.2, r * 0.02);
      ctx.quadraticCurveTo(0, -r * 0.16, -r * 1.2, r * 0.06);
      ctx.closePath();
      ctx.fill();

      /* the far cheek, turning away from the light */
      ctx.fillStyle = mix(fur, SHADE_TO, 0.50);
      ctx.beginPath();
      ctx.moveTo(-r * 1.2, r * 0.72);
      ctx.quadraticCurveTo(-r * 0.50, r * 0.10, -r * 0.62, -r * 0.90);
      ctx.lineTo(-r * 1.3, -r * 0.90);
      ctx.closePath();
      ctx.fill();

      /* under the jaw */
      ctx.fillStyle = mix(fur, SHADE_TO, 0.62);
      ctx.beginPath();
      ctx.moveTo(-r * 1.2, -r * 0.52);
      ctx.quadraticCurveTo(0, -r * 0.86, r * 1.2, -r * 0.60);
      ctx.lineTo(r * 1.2, -r * 1.4);
      ctx.lineTo(-r * 1.2, -r * 1.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /* The costume's head layer — a headband, a topknot, horns. Drawn in the
       head's own frame, after the skull is shaded and before the face, so a
       band goes under the eyes rather than over them. Contour first, then
       fills, the same two passes the body gets. */
    if (fig && fig.costumeHead && fig.costumeHead.length && !white) {
      var hp = fig.costumeHead, q3;
      ctx.save();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = line;
      for (q3 = 0; q3 < hp.length; q3++) {
        ctx.lineWidth = (hp[q3].k === 's' ? hp[q3].w : 0) + (fig.OUTLINE || 1.8) * 2;
        hp[q3].p(ctx); ctx.stroke();
      }
      for (q3 = 0; q3 < hp.length; q3++) {
        var hs = hp[q3];
        if (hs.k === 's') { hs.p(ctx); ctx.strokeStyle = hs.c; ctx.lineWidth = hs.w; ctx.stroke(); }
        else { celFill(ctx, hs.p, hs.c, hs.band, hs.flat ? 0 : 2.3 * s); }
        if (hs.edge) { hs.p(ctx); ctx.strokeStyle = line; ctx.lineWidth = 1.15 * s; ctx.stroke(); }
      }
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

    /* ---- the eyes -----------------------------------------------------

       A fighting-game face is not a cute face. What was here was a big round
       eye with a white bubble of sclera and a cartoon catchlight, which reads
       as a plush toy from any distance — and it is the first thing anybody
       looks at, so it decided the whole character.

       A Street Fighter II eye is a NARROW almond under a heavy brow, tilted
       down towards the nose, with the iris filling nearly all of it and only
       a sliver of white at the outside corner. At twelve pixels across that
       reads as determination; a circle reads as surprise.                */
    var eyeState = opts.eyes || 'normal';
    var skullKind = (j.build && j.build.headShape) || 'round';
    /* how far the brow comes down over the eye — heavy on a blocky skull */
    var browK = 0.30 + 0.70 * ((SKULLS[skullKind] && SKULLS[skullKind].brow) || 0.5)
              + (eyeState === 'angry' ? 0.55 : 0);

    function eye(ex, ey, sc, near) {
      if (eyeState === 'closed' || eyeState === 'ko') {
        ctx.strokeStyle = line; ctx.lineWidth = 1.9 * sc; ctx.lineCap = 'round';
        ctx.beginPath();
        if (eyeState === 'ko') {
          ctx.moveTo(ex - 2.8 * sc, ey - 2.8 * sc); ctx.lineTo(ex + 2.8 * sc, ey + 2.8 * sc);
          ctx.moveTo(ex + 2.8 * sc, ey - 2.8 * sc); ctx.lineTo(ex - 2.8 * sc, ey + 2.8 * sc);
        } else {
          ctx.moveTo(ex - 3.4 * sc, ey + 0.6 * sc);
          ctx.quadraticCurveTo(ex, ey - 1.8 * sc, ex + 3.4 * sc, ey + 0.2 * sc);
        }
        ctx.stroke();
        return;
      }

      /* Even at rest the eye is a slit, not a circle — and it is SMALL. The
         old one was a quarter of the skull's radius across, which is manga
         proportion; a Street Fighter II eye is about an eighth of the head
         and mostly iris. */
      /* Width to height wants to be about two to one, and nearer three when
         the cat means it. At 0.56 the almond came out 1.4:1, which is a
         circle with corners — and a circle reads as surprise however small
         you draw it. */
      /* 0.32/0.44 was measured on the 8x view and lost the fight at game
         size: a 2.45 x 1.3 pixel almond is one dark pixel with a lighter one
         beside it, which is why the duplicated plush eye underneath it went
         unnoticed for so long. Wider lids keep the two-to-one almond and
         give the iris something to sit in at 90px tall. */
      var lid = eyeState === 'angry' ? 0.52 : 0.72;
      var w = 2.45 * sc, h = 2.9 * sc * lid;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(near ? -0.30 : -0.22);        /* down towards the nose */

      function almond(cx2) {
        cx2.beginPath();
        cx2.moveTo(-w, h * 0.16);
        cx2.quadraticCurveTo(-w * 0.30, h * 1.10, w * 0.86, h * 0.30);
        cx2.quadraticCurveTo(w * 1.08, -h * 0.16, w * 0.70, -h * 0.66);
        cx2.quadraticCurveTo(-w * 0.20, -h * 1.14, -w, h * 0.16);
        cx2.closePath();
      }

      almond(ctx);
      ctx.fillStyle = '#efe8d8'; ctx.fill();

      /* The iris fills nearly all of it — a sliver of white at the outside
         corner is the only sclera a sprite this size can afford.

         Drawn as an INSET COPY of the almond rather than an oversized
         ellipse behind a clip. Same picture; the clip was there only to trim
         an ellipse that was deliberately too big, and `clip()` is the
         expensive call — two of them per eye, four per cat, twice a frame. */
      /* 0.90/0.88 left a sliver of sclera a fifth of a pixel wide at game
         scale, so the whole eye rasterised as one dark mark and the faces
         came out blank. Backed off until the pale corner is a real pixel:
         at 90px tall the eye is about 4x3 pixels and it has to be a dark
         pupil ON something light or it is not an eye at all. */
      ctx.save();
      ctx.translate(w * 0.26, 0);
      ctx.scale(0.78, 0.76);
      almond(ctx);
      ctx.fillStyle = c.eye || '#8fd14f'; ctx.fill();
      /* the lid's shadow, over the top third of the iris */
      ctx.beginPath();
      ctx.moveTo(-w * 1.02, h * 0.10);
      ctx.quadraticCurveTo(-w * 0.20, -h * 1.18, w * 0.78, -h * 0.60);
      ctx.quadraticCurveTo(-w * 0.10, -h * 0.42, -w * 0.98, -h * 0.16);
      ctx.closePath();
      ctx.fillStyle = 'rgba(24,14,26,.30)'; ctx.fill();
      ctx.restore();
      /* the slit pupil, which is the one thing that says cat. Narrow enough
         that it never reaches the almond's edge, so it needs no trimming. */
      ctx.beginPath();
      ctx.ellipse(w * 0.26, 0, w * 0.19, h * 0.86, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#140f12'; ctx.fill();

      /* the lash line: heavy on top, nothing underneath. A line all the way
         round is a cartoon eye however narrow you make it. */
      ctx.strokeStyle = line;
      ctx.lineWidth = Math.max(1, 0.85 * sc);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-w * 1.02, h * 0.10);
      ctx.quadraticCurveTo(-w * 0.20, -h * 1.18, w * 0.76, -h * 0.60);
      ctx.stroke();

      /* The brow ridge, drawn HERE rather than over the skull, because a brow
         is a thing that sits on an eye and moves with it. It is a shape with
         mass in the shadow tone: a drawn line reads as a pencilled-on
         eyebrow, and a bar laid across the whole skull reads as a monobrow
         sticker. Both were tried, on 22 Aug 2026. */
      ctx.fillStyle = mix(fur, SHADE_TO, 0.46);
      ctx.beginPath();
      /* The quad spans -1.86h to +0.46h in its own frame and the eye spans
         -h to +h, so with no lift the "brow ridge" was filled straight over
         the top two thirds of the almond — the eye was a green sliver under
         a shadow-toned lozenge, which is why the plush eyes the duplicate
         block was drawing underneath went unnoticed for so long. Painted red
         and re-rendered on 22 Aug 2026 to find it. Lifted until the lower
         edge clears the lash line and no further: at 3h it floats off as a
         separate eyebrow, at 0.5h it still covers half the iris. */
      var bl = h * 1.45;
      ctx.moveTo(-w * 1.10, bl + h * 0.24 + browK * h * 0.34);
      ctx.quadraticCurveTo(-w * 0.10, bl - h * 1.05 + browK * h * 0.42,
                           w * 1.02, bl - h * 0.72 + browK * h * 0.16);
      ctx.lineTo(w * 0.94, bl - h * 1.34);
      ctx.quadraticCurveTo(-w * 0.16, bl - h * 1.86, -w * 1.18, bl - h * 0.40);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    eye(r * 0.52, r * 0.22, es, true);
    eye(-r * 0.16, r * 0.26, 0.88 * es, false);

    /* ---- the mouth ----------------------------------------------------

       There was no mouth at all, so every expression had to be carried by
       the eyes alone. A short hard line under the muzzle, set grim by
       default and opening into a shout when the move says to. */
    ctx.save();
    ctx.strokeStyle = line;
    ctx.lineCap = 'round';
    if (opts.mouth === 'open') {
      ctx.beginPath();
      ctx.moveTo(r * 0.50, -r * 0.30);
      ctx.quadraticCurveTo(r * 0.72, -r * 0.84, r * 0.96, -r * 0.32);
      ctx.quadraticCurveTo(r * 0.74, -r * 0.20, r * 0.50, -r * 0.30);
      ctx.closePath();
      ctx.fillStyle = '#4a1c26'; ctx.fill();
      ctx.lineWidth = 1.1 * es; ctx.stroke();
      ctx.fillStyle = '#f6f1e4';                /* one fang is all that fits */
      ctx.beginPath();
      ctx.moveTo(r * 0.60, -r * 0.32);
      ctx.lineTo(r * 0.70, -r * 0.32);
      ctx.lineTo(r * 0.65, -r * 0.52);
      ctx.closePath(); ctx.fill();
    } else {
      ctx.lineWidth = Math.max(1, 1.5 * es);
      ctx.beginPath();
      ctx.moveTo(r * 0.46, -r * 0.42);
      ctx.quadraticCurveTo(r * 0.68, -r * 0.56, r * 0.90, -r * 0.36);
      ctx.stroke();
      ctx.lineWidth = 1.0 * es;                 /* the philtrum */
      ctx.beginPath();
      ctx.moveTo(r * 0.72, -r * 0.14);
      ctx.lineTo(r * 0.70, -r * 0.34);
      ctx.stroke();
    }
    ctx.restore();

    /* WHISKERS, kept quiet.

       Three pure-white hairlines running to r * 1.44 put an eleven-pixel
       bright line out past the muzzle and into the background, at higher
       contrast than the eyes and than the contour that is supposed to be the
       brightest edge on the figure. At 1x on a dark stage they read exactly
       like the radiating-line hit sparks the art brief bans: scratches on
       the display. Two of them, stopping at the edge of the silhouette, in
       the cat's own lit fur tone — the cat still reads as a cat and the eyes
       get to be the loudest thing on the face again. */
    ctx.strokeStyle = mix(fur, LIGHT_TO, 0.62);
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = Math.max(1, 0.9 * es);
    ctx.lineCap = 'round';
    for (var w2 = -1; w2 <= 1; w2 += 2) {
      ctx.beginPath();
      ctx.moveTo(r * 0.62, -r * 0.28 + w2 * r * 0.09);
      ctx.quadraticCurveTo(r * 0.88, -r * 0.30 + w2 * r * 0.20,
                           r * 1.08, -r * 0.26 + w2 * r * 0.28);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* per-cat accessory */
    if (c.accessory === 'headband') {
      /* Its own colour, not the palette accent — an accent picked to sit
         beside the fur is by definition too close to the fur to read as a
         band across it. */
      var bandCol = (c.kit && c.kit.band) || '#b8332f';
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, r * 0.16, r * 0.96, r * 0.82, 0, Math.PI * 0.10, Math.PI * 0.90);
      ctx.lineWidth = r * 0.26;
      ctx.strokeStyle = bandCol;
      ctx.stroke();
      ctx.lineWidth = r * 0.26;
      ctx.strokeStyle = 'rgba(0,0,0,.25)';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.16, r * 0.96, r * 0.82, 0, Math.PI * 0.10, Math.PI * 0.32);
      ctx.stroke();
      ctx.restore();
      c = Object.create(c);
      c.accent = bandCol;
      ctx.beginPath();
      ctx.arc(-r * 0.82, r * 0.40, r * 0.13, 0, Math.PI * 2);
      ctx.fillStyle = c.accent; ctx.fill();
      ctx.strokeStyle = c.accent; ctx.lineCap = 'round';
      ctx.lineWidth = 1.5 * es;
      ctx.beginPath();
      ctx.moveTo(-r * 0.85, r * 0.42);
      ctx.quadraticCurveTo(-r * 1.25, r * 0.46, -r * 1.55, r * 0.74);
      ctx.stroke();
      ctx.lineWidth = 1.2 * es;
      ctx.beginPath();
      ctx.moveTo(-r * 0.85, r * 0.34);
      ctx.quadraticCurveTo(-r * 1.2, r * 0.16, -r * 1.45, r * 0.26);
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
         head did not silently re-tune every anti-air in the game.

         The multiplier moved with it. It was 1.3 against a headR of 13.6;
         dropping headR to 10.0 for the head count would have taken 35 world
         units of head hitbox down to 26 and quietly made every anti-air in
         the game worse. 1.77 puts it back where it was. An art change must
         not be a balance change. */
      { x: j.head.x - j.headR * 1.77, y: j.head.y - j.headR * 1.77,
        w: j.headR * 3.54, h: j.headR * 3.54, part: 'head' },
      box(j.pelvis, j.neck, 11 * j.s),
      box(j.hipF, j.footF, 6 * j.s),
      box(j.hipB, j.footB, 5 * j.s)
    ];
  }

  CF.Rig = {
    DEFAULT_BUILD: DEFAULT_BUILD,
    solve: solve, drawCat: drawCat, hurtboxes: hurtboxes, tailPath: tailPath,
    setDetail: setDetail, getDetail: getDetail,
    capsule: capsule, blob: blob, P: P
  };
})();
