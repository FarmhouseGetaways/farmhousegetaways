/* =====================================================================
   3 — LUIGI. The other twin, and none of the weight.

   LIGHT: quick, mobile, and folds if he gets caught. Comes at you from
   above with the flying body attack and from below with the sweep.

   THE PROBLEM WITH HIM is that he wears his brother's coat. Black and
   white tuxedo, both of them, and colour is the one thing that cannot
   tell them apart. So everything here is aimed at the OUTLINE: turn
   the pair of them black and Mario is a bell — wide, low, an apron
   hanging off a belt — and Luigi is a blade with a long scarf coming
   off the back of it. Nothing on him is decided by pigment.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.luigi = {
  id: 'luigi',
  weightClass: 'light',
    /* Up on his toes and leaning in, with the narrowest base on the
       roster — his feet are about eight units apart against Mario's
       thirty-one, and that alone is half of the twin problem solved.
       Guard is high and tight to the chin rather than out in front:
       a light cat who has to get out of the way keeps his elbows in. */
  stance: { torso: 7, py: 1.8, armF: [16, -10], armB: [4, 10],
            legF: [-4, 5], legB: [4, -5], head: [0, 0, 3] },
    /* Lean everywhere it costs silhouette: girth well under one, the
       longest limbs on the roster, and a waist pulled in hard. `muscle`
       goes UP rather than down — a light fighter is not soft, he is a
       whippet, and the muscle shapes are what stop a thin cat reading as
       a starved one.

       `head` and `limbW` went down a step each after the roster test called
       him and Lilly the same cat: they are both light, both tall-eared and
       both lean, and only the skull and the girth were telling them apart.
       A small skull on long thin limbs is also just the right answer for
       him — it is what makes a figure read as tall, and he is the tallest
       cat on the roster with the least on him. */
  build: { s: 1.05, girth: 0.78, limb: 1.24, head: 0.86, muscle: 1.30,
           headShape: 'long', ear: 'tall', shoulder: 0.86, waist: 0.74, limbW: 0.72 },

  /* ---- HIS LOOK ---------------------------------------------------------

     Three pieces, and each one is doing a different job.

     THE SCARF is the silhouette. It is very long on purpose — about
     three quarters of his own height streaming off the back of his neck
     — because a short one is a neckerchief and reads as nothing at game
     size. It is the only thing on the roster that leaves the body and
     keeps going, so at 384x224 you know which twin is which from the
     shape alone, before a single pixel of him has been identified.

     THE SASH is the value break. A bare chest on a black cat is a black
     hole; one band crossing it diagonally gives the trunk a direction,
     and diagonal is a line nobody else on the roster has.

     THE SLEEVE is the asymmetry. One arm dressed and one bare is what
     stops a symmetrical figure reading as a paper doll, and it puts the
     brightest value on the roster on the arm that does the hitting.

     Bare feet, deliberately: Mario has cream socks and cream feet, so
     Luigi's legs run black all the way to the floor and read as one long
     line. Same coat, opposite leg.                                      */
  look: {
    pieces: function (A, j, f) {
      /* A clean jade. It has to survive being a mid-tone shape on a
         near-black cat, so it is saturated rather than dark — a forest
         green went in first and disappeared into the fur completely at
         game size. Green is also the one hue nobody else on the roster
         has: red on Gracie, crimson on Mario, blue on Lilly. */
      var SCARF = '#2f9e63';
      var SCARF_D = A.shade(SCARF, 0.26);
      var BONE = '#f2ecdc';

      /* the spine frame: t runs pelvis(0) to neck(1), w across it and
         positive forward. Same trick as Gracie's gi and Mario's mawashi. */
      var p = j.pelvis, n = j.neck;
      var dx = n.x - p.x, dy = n.y - p.y;
      var L = Math.hypot(dx, dy) || 1;
      var fx = dy / L, fy = -dx / L;
      function T(t, w) { return { x: p.x + dx * t + fx * w, y: p.y + dy * t + fy * w }; }

      /* A tapering ribbon through a list of {x,y,w}. Built by walking the
         centre line and pushing each point out along the normal, because a
         stroked line cannot taper and a scarf that does not taper is a
         plank. */
      function ribbon(pts, notch) {
        return function (cx) {
          var fwd = [], bwd = [], q;
          for (q = 0; q < pts.length; q++) {
            var a = pts[Math.max(0, q - 1)], b = pts[Math.min(pts.length - 1, q + 1)];
            var ux = b.x - a.x, uy = b.y - a.y, ul = Math.hypot(ux, uy) || 1;
            var nx = -uy / ul * pts[q].w, ny = ux / ul * pts[q].w;
            fwd.push({ x: pts[q].x + nx, y: pts[q].y + ny });
            bwd.push({ x: pts[q].x - nx, y: pts[q].y - ny });
          }
          cx.beginPath();
          cx.moveTo(fwd[0].x, fwd[0].y);
          for (q = 1; q < fwd.length; q++) cx.lineTo(fwd[q].x, fwd[q].y);
          /* A swallowtail cut into the tip. A blunt taper ends in a point
             and reads as a rope; the notch is the one detail that says
             cloth, and it survives the drop to game size because it is cut
             into the SILHOUETTE rather than drawn inside it. */
          if (notch) {
            var e = pts[pts.length - 1], d = pts[pts.length - 2];
            var vx2 = d.x - e.x, vy2 = d.y - e.y, vl = Math.hypot(vx2, vy2) || 1;
            cx.lineTo(e.x + vx2 / vl * notch, e.y + vy2 / vl * notch);
          }
          for (q = bwd.length - 1; q >= 0; q--) cx.lineTo(bwd[q].x, bwd[q].y);
          cx.closePath();
        };
      }

      /* Where the scarf is tied. It went at the throat first, a third of
         the way up towards the skull, and the head sat straight on top of
         it — the collar was invisible and the tails appeared to grow out
         of the back of his neck fur. Down on the collarbone the knot is
         in the clear and the tails leave from something. */
      var nk = { x: j.neck.x * 0.82 + j.head.x * 0.18,
                 y: j.neck.y * 0.82 + j.head.y * 0.18 };

      /* `sway` already folds his speed, a slow idle drift and being
         airborne into one number, positive meaning blown backwards. The
         scarf is the piece it was put there for: standing still it barely
         moves, walking forward it lifts and trails, and in the air it is
         straight out behind him. */
      var SW = f.sway;

      function scarfTail(len, rise, drop, wid, phase, ripple) {
        var pts = [], N = 9;
        var ex = nk.x - len * f.s;
        var ey = nk.y - drop * f.s + SW * 2.6 * f.s;
        for (var q = 0; q <= N; q++) {
          var t = q / N, u = 1 - t;
          /* a quadratic from the knot out to the tip. The control point is
             ABOVE the line between them, so the cloth kicks up as it leaves
             the neck and falls away at the far end — an S, not a rod. The
             first version put the control almost on the line and the tail
             came out as a straight green wire stuck to his collar. */
          var mx = nk.x - len * 0.46 * f.s;
          var my = nk.y + (rise + SW * 1.2) * f.s;
          var px = u * u * nk.x + 2 * u * t * mx + t * t * ex;
          var py = u * u * nk.y + 2 * u * t * my + t * t * ey;
          /* the ripple grows towards the tip — the end of a scarf moves,
             the bit knotted at the throat does not */
          py += Math.sin(t * 4.2 + f.t * 0.13 + phase) * ripple * t * t * f.s;
          /* Tapered the whole way, fat at the knot and about a third of that
             at the tip. It used to hold full width until t=0.7 and then give
             up, which at game size is a garden hose with a flick on the end.
             The exponent is 1.35 rather than 1 because a straight linear
             taper takes the middle down to two pixels, which is where a
             scarf breaks into dashes — this keeps the middle broad enough to
             read and still narrows continuously. */
          pts.push({ x: px, y: py, w: wid * f.s * (1 - 0.66 * Math.pow(t, 1.35)) });
        }
        return ribbon(pts, 6.4 * f.s);
      }

      /* ONE tail, and it took four rounds of the silhouette test to get
         here. It has to stay clear of the cat's own tail, and that is the
         whole reason these numbers look the way they do.

         Measured off the solved rig, in the units these calls take and
         relative to the knot: his tail leaves the rump at (-12, -32), swings
         back to (-27, -24) and (-33, -10), and curls up to finish at
         (-32, +2) — level with the knot and a third of his height behind
         it. That is exactly where a scarf wants to be, so the two fight
         unless the numbers are chosen against those four points.

         The first pass ignored them. There were two long tails, one running
         52 back across the tail tip and one dropping 26 straight through the
         arc, and the black shape came out with a HOLE through it. A lasso,
         and it was the loudest thing on the roster page. Nudging did not fix
         it: turning the short tail up to clear the arc only moved the hole,
         and the long one still landed on the tail tip and trapped a crescent
         under it. The scarf has to pass OVER the tail with daylight, or the
         wedge between them closes somewhere.

         And it has to lift further than the arithmetic says. Five units of
         clearance is not clearance: every shape here carries a contour
         stroke a couple of pixels wide on each side, so two edges five units
         apart weld shut and you get one fat boomerang behind him with no
         telling cloth from cat. `rise 20, drop -24` puts about thirteen
         units through the crossing, which survives the contour and survives
         the drop to ninety pixels tall.

         The second tail is gone rather than retuned. Every position that
         made it visible put it in the gap between the banner and the tail,
         where it bridged the two and brought the hole back in whichever pose
         was not being looked at — jumpKick and guardHigh, mostly. The one
         place it never bridged was tucked so far behind the trunk that
         nothing of it showed. A shape that either breaks the silhouette or
         cannot be seen is not worth a draw call, and the judges wanted fewer
         bars trailing off him anyway: cloth and tail, a V, and nothing else.
         The collar and the knot below it are what say the banner is tied on.

         Anything that reaches past x=-30 and sits below +8 makes the ring
         again, and it will not show up in colour — `node tools/shot.mjs
         silhouette`, and check the other five poses too, because stand is
         the one pose where the tail is furthest out of the way. */
      A.add('back', scarfTail(44, 20.0, -24.0, 5.6, 0.0, 3.2), SCARF, { band: true, edge: true });

      /* The collar the banner is tied to. Without it the cloth grew straight
         out of the fur, which reads as a mistake rather than as a garment. */
      A.add('body', function (cx) {
        A.ellipse(cx, nk.x, nk.y, f.chestW * 0.56, f.chestW * 0.40, 0.22);
      }, SCARF, { band: true, edge: true });
      A.add('body', function (cx) {
        A.ellipse(cx, nk.x - f.chestW * 0.30, nk.y - f.chestW * 0.10,
                  f.chestW * 0.30, f.chestW * 0.26, 0.4);
      }, SCARF_D, { edge: true });

      /* --- the sash. One band from over the back of the shoulder down
             across the chest to the front of the hip. Built as a strip
             with a normal rather than as a hand-placed polygon, so it
             stays the same width when he leans and does not shear into a
             wedge on the sweep. --- */
      var top = T(1.02, -f.chestW * 0.26);
      var bot = T(0.08, f.hipW * 1.26);
      (function () {
        var sx = bot.x - top.x, sy = bot.y - top.y;
        var sl = Math.hypot(sx, sy) || 1;
        var nx2 = -sy / sl, ny2 = sx / sl;
        var W = f.chestW * 0.62;
        function S(t, k) {
          return { x: top.x + sx * t + nx2 * W * k,
                   y: top.y + sy * t + ny2 * W * k };
        }
        A.add('body', function (cx) {
          /* bowed out a little at the middle: a sash lies on a chest, and
             a chest is round. Dead straight it read as tape. */
          A.smooth(cx, [S(0, 1), S(0.5, 1.16), S(1, 1),
                        S(1, -1), S(0.5, -1.16), S(0, -1)]);
        }, SCARF, { band: true, edge: true });
      })();

      /* the knot where the sash meets the hip, with one short end hanging
         off it. Short on purpose — the long streaming is the scarf's job
         and two long things fight each other. */
      A.add('front', function (cx) {
        var k = T(0.14, f.hipW * 1.16);
        A.ellipse(cx, k.x, k.y, 3.4 * f.s, 2.8 * f.s, 0.5);
      }, SCARF_D, { band: true, edge: true });
      A.add('front', function (cx) {
        var a = T(0.14, f.hipW * 1.20);
        var swing = SW * 1.4;
        cx.beginPath();
        cx.moveTo(a.x - 1.6 * f.s, a.y);
        cx.lineTo(a.x + 1.8 * f.s, a.y);
        cx.lineTo(a.x + 3.0 * f.s + swing * f.s, a.y - 11 * f.s);
        cx.lineTo(a.x + 0.4 * f.s + swing * f.s, a.y - 9.0 * f.s);
        cx.lineTo(a.x - 2.4 * f.s + swing * f.s, a.y - 11.6 * f.s);
        cx.closePath();
      }, SCARF, { edge: true });

      /* --- the ankle wrap. He fights barefoot, so the one thing down
             there is a band of the same cloth just above the foot. It is
             doing a job as well as being kit: his legs are black from hip
             to floor, which is the long line that makes him a blade, and
             without a mark on them the eye has nothing to measure the
             stride by on the walk cycle. Flat-filled — it is about four
             pixels across in the finished picture and cel-shading it
             costs a clip to change nothing anybody can see.

             It sits well up the shin. Down at the joint it read as a
             slipper, which is the one thing a barefoot fighter must not
             be wearing. --- */
      (function () {
        var kx = j.footF.x - j.kneeF.x, ky = j.footF.y - j.kneeF.y;
        function P(t) { return { x: j.kneeF.x + kx * t, y: j.kneeF.y + ky * t }; }
        A.add('front', function (cx) {
          A.limb(cx, P(0.60), P(0.80), f.R_END * 1.28, f.R_END * 1.22, 0);
        }, SCARF, { edge: true, flat: true });
      })();

      /* --- the one sleeve. It flares from the shoulder out to a torn bell
             past the elbow, so the near arm is a wedge and not a tube —
             and the bright value lands on the arm that throws the punch.
             The far arm gets nothing at all: a matched pair is a costume,
             one sleeve is a character. --- */
      A.add('front', function (cx) {
        A.limb(cx, j.shF, j.elbF, f.R_TOP * 1.18, f.R_MID * 1.46, 0.35, 'upperArm');
      }, BONE, { band: true, edge: true });

      (function () {
        var ax = j.elbF.x - j.shF.x, ay = j.elbF.y - j.shF.y;
        var al = Math.hypot(ax, ay) || 1;
        var ux = ax / al, uy = ay / al, px2 = -uy, py2 = ux;
        var W = f.R_MID * 1.46;
        function E(along, across) {
          return { x: j.elbF.x + ux * along * f.s + px2 * across,
                   y: j.elbF.y + uy * along * f.s + py2 * across };
        }
        /* The cuff, torn rather than sewn, cut with lineTo and never
           smoothed — A.smooth rounds a two-pixel tooth away to nothing and
           the tear is the whole reason the sleeve is not a bandage.

           It is GREEN, not a second shade of bone. In bone it was the same
           value as the sleeve above it and the same value as the tuxedo
           bib beside it, and the whole front of him turned into one pale
           blob at game size. In the scarf's colour it cuts the sleeve off
           at the elbow and ties the kit together: green at the throat, the
           chest, the hip and the cuff, and nowhere else. */
        A.add('front', function (cx) {
          var q, e = E(-1.0, W); cx.beginPath(); cx.moveTo(e.x, e.y);
          var teeth = [3.6, 0.6, 4.4, 1.2, 3.0];
          for (q = 0; q < teeth.length; q++) {
            e = E(teeth[q], W - (W * 2) * (q / (teeth.length - 1)));
            cx.lineTo(e.x, e.y);
          }
          e = E(-1.0, -W); cx.lineTo(e.x, e.y);
          cx.closePath();
        }, SCARF_D, { edge: true });
      })();
    }
  },

  displayName: 'LUIGI',
  subtitle: 'The Twin',
  blurb: 'Same coat, half the cat. Comes in over the top or takes your legs — and you have to guess which.',
  difficulty: 2,
  palette: {
    /* No `kit.scarf`. The rig has one and it is a short pair of tails
       falling off the throat — fine on a cat who is wearing a scarf, no
       use at all to a cat whose scarf IS his silhouette. The one in
       `look` is real geometry, goes into the outline, and streams.

       No `sock` either. It painted his leading shin and foot cream, which
       is Mario's colouring exactly and put the two of them one step
       closer together rather than further apart. His legs run black to
       the floor now.

       `longhair` is off for the same reason: it lays a ruff wider than
       the body behind the trunk and thickens the tail by a third, which
       is bulk, and bulk is the twin he is not. */
    kit: {},
    fur: '#433b3d', fur2: '#2c2628', belly: '#f8f5ee', marks: '#1b1719',
    eye: '#cdd94a', nose: '#e8a2ac', inner: '#c98d95',
    accent: '#2f9e63', accessory: 'none', pattern: 'tuxedo',
    tailTip: '#433b3d',
    line: 'rgba(12,10,11,.6)'
  },
  stats: { walkF: 1.86, walkB: 1.62, jumpVy: 10.2, jumpVx: 3.7, gravity: 0.46,
           health: 600, stunMax: 92, weight: 0.88, hasDash: true },
  mod: { reach: 1.00, damage: 0.90, speed: 0.86 },
  specials: [
    {
      id: 'flyingbody', name: 'Flying Body Attack',
      desc: 'He leaves the floor and arrives shoulder first. An overhead, so crouch-blocking does not stop it.', kind: 'special',
      motion: 'qcf', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      startup: 9, active: 16, recovery: 20,
      damage: [56, 64, 72], stun: [14, 16, 18], chip: 7,
      hitstun: 20, blockstun: 13, knockdown: 'soft',
      /* he is in the air, so it has to be blocked standing */
      hitLevel: 'overhead',
      pushback: 3.0, blockPushback: 3.6,
      airborne: [7, 30],
      hitbox: { x: 8, y: 22, w: 50, h: 40 },
      meterGain: 16, meterOnHit: 8,
      anim: [{ at: 0, p: Ps.stand }, { at: 6, p: Ps.flyWind },
             { at: 10, p: Ps.flyBody }, { at: 24, p: Ps.flyBody },
             { at: 30, p: Ps.flyLand }, { at: 45, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr === 7) {
          f.vy = 5.6 + strength * 0.5;
          f.vx = f.facing * (5.2 + strength * 0.7);
          f.grounded = false;
        }
      }
    },
    {
      id: 'legsweep', name: 'Leg Sweep',
      desc: 'Low, fast, and a hard knockdown. Eight frames of startup — the quickest thing he has for interrupting.', kind: 'special',
      motion: 'qcb', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      startup: 8, active: 6, recovery: 22,
      damage: [30, 34, 38], stun: [9, 10, 12], chip: 5,
      hitstun: 18, blockstun: 12, hitLevel: 'low', knockdown: 'hard',
      pushback: 2.6, blockPushback: 3.0,
      lowProfile: [6, 16],
      hitbox: { x: 12, y: 0, w: 52, h: 18 },
      meterGain: 15, meterOnHit: 8,
      anim: [{ at: 0, p: Ps.stand }, { at: 5, p: Ps.sweepWindL },
             { at: 8, p: Ps.sweepLow }, { at: 14, p: Ps.sweepLow },
             { at: 20, p: Ps.sweepWindL }, { at: 36, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr >= 6 && fr < 14) f.vx = f.facing * (2.6 + strength * 0.4);
      }
    }
  ],
  supers: [{
    id: 'superFly', name: 'OVER THE TOP',
    desc: 'Thirty active frames of him in the air, overhead the whole way, invincible for the first ten.', motion: 'qcfx2',
    buttons: ['LK', 'MK', 'HK'], cost: 100,
    startup: 8, active: 30, recovery: 26, freeze: 26,
    damage: 34, stun: 7, chip: 7, multiHit: 5, hitGap: 6,
    hitstun: 18, blockstun: 12, hitLevel: 'overhead', knockdown: 'hard',
    pushback: 2.0, blockPushback: 3.0,
    invuln: [0, 10], airborne: [6, 40],
    hitbox: { x: 6, y: 20, w: 56, h: 46 },
    anim: [{ at: 0, p: Ps.stand }, { at: 6, p: Ps.flyWind },
           { at: 10, p: Ps.flyBody }, { at: 22, p: Ps.jumpKick },
           { at: 32, p: Ps.flyBody }, { at: 44, p: Ps.flyLand },
           { at: 64, p: Ps.stand }],
    moveSelf: function (f, fr) {
      if (fr === 6) { f.vy = 6.4; f.vx = f.facing * 5.4; f.grounded = false; }
      if (fr > 6 && fr < 34) f.vy += 0.20;
    }
  }]
  };
})();
