/* =====================================================================
   4 — LILLY. Siamese, and built entirely out of angles.

   LIGHT: the fastest cat on the roster and the easiest to hurt. Both her
   moves leave the ground, which is where she wants to be.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.lilly = {
  id: 'lilly',
  weightClass: 'light',
    /* Poised on the back leg with the front one light, lead paw high and
       open, torso up. Everything about her is ready to leave the ground.

       `py` is 0 and not the 2 it was. She has the longest limbs on the
       roster (limb 1.20) and the smallest scale, and py is in POSE units
       while the legs scale with the build — so a raised pelvis that looked
       right standing left her hovering six units off the floor the moment
       the crouch folded those long legs up under her. Two tests catch it
       and both name this file. The height she wanted comes from the torso
       and the arms instead, which cost nothing on the ground. */
  stance: { torso: 3, py: 0, armF: [26, -38], armB: [-6, 10],
            legF: [-10, -8], legB: [-10, 20] },
  build: { s: 0.96, girth: 0.82, limb: 1.20, head: 0.94, muscle: 1.25,
           headShape: 'narrow', ear: 'tall', shoulder: 0.88, waist: 0.76, limbW: 0.80 },
  /* ---- HER LOOK ---------------------------------------------------------

     The Chun-Li slot, and the one cat on the roster who is hardly ever
     standing on the floor. So the costume is built to be read in the AIR:
     a short fighting dress with the hem cut away high at the front and
     trailing long at the back, a wide sash with two streamers off it, and
     ribbons at both wrists. Four things that move when she does.

     The first pass was a plain tunic and it was useless — a rectangle of
     colour on a cream cat, the same black shape as everybody else. What
     makes her silhouette hers is the CLOTH BEHIND HER: the streamers and
     the long back point of the skirt run out past her tail, so even at
     384x224 the outline says "something is trailing off this one".

     Angles, not curves. Gracie's gi is frayed and soft; Lilly's hem is cut
     with lineTo and every corner is sharp, because she is the angular cat
     and because two rounded skirts in a six-cat line-up is one too many. */
  look: {
    pieces: function (A, j, f) {
      /* Deep jade against her cream, gold at the waist and the ankles so
         the metal on her reads as one set. A red sash was tried first and
         put her in Mario's and Gracie's colour; gold keeps her elegant and
         is the one value that survives a dark stage. */
      var DRESS = '#3a838a', FOLD = '#215a63', SASH = '#e6b755', KNOT = '#b3812f';

      /* Everything hangs off the spine. T(t, w): t is 0 at the pelvis and 1
         at the neck, w is sideways with + towards the front. Negative t is
         below the pelvis, which is where the hem and the streamers live. */
      var p = j.pelvis, n = j.neck;
      var dx = n.x - p.x, dy = n.y - p.y;
      var L = Math.hypot(dx, dy) || 1;
      var fx = dy / L, fy = -dx / L;
      function T(t, w) { return { x: p.x + dx * t + fx * w, y: p.y + dy * t + fy * w }; }
      function line(cx, t, w) { var q = T(t, w); cx.lineTo(q.x, q.y); }

      var sway = Math.max(-6, Math.min(9, f.sway));

      /* A ribbon: a strip that leaves a point at `ang`, bends by `curl`
         along its length and tapers to a swallowtail. Built as an outline
         rather than a stroked line because a stroke cannot taper, and a
         ribbon the same width at the tip as at the knot is a length of
         hose. Six segments — at four the bend is visibly faceted. */
      function ribbon(cx, ax, ay, ang, len, wid, curl, wave) {
        var N = 8, pts = [], i, x = ax, y = ay, th = ang;
        for (i = 0; i <= N; i++) {
          pts.push({ x: x, y: y, th: th, w: Math.max(0.5, wid * (1 - 0.70 * i / N)) });
          x += Math.cos(th) * (len / N);
          y += Math.sin(th) * (len / N);
          /* curl is the steady droop; the sine on top is the ripple running
             down it. Without the ripple a long streamer is a circular arc,
             which at this length reads as a plank rather than as cloth. */
          th += curl / N + Math.sin(i / N * Math.PI * 2.2 + (wave || 0)) * 0.14;
        }
        cx.beginPath();
        for (i = 0; i <= N; i++) {
          var q = pts[i];
          var nx = -Math.sin(q.th) * q.w, ny = Math.cos(q.th) * q.w;
          if (i === 0) cx.moveTo(q.x + nx, q.y + ny); else cx.lineTo(q.x + nx, q.y + ny);
        }
        var e = pts[N], ex = Math.cos(e.th), ey = Math.sin(e.th);
        var enx = -Math.sin(e.th) * e.w, eny = Math.cos(e.th) * e.w;
        cx.lineTo(e.x + enx + ex * e.w * 1.6, e.y + eny + ey * e.w * 1.6);
        cx.lineTo(e.x + ex * e.w * 0.5, e.y + ey * e.w * 0.5);   /* the notch */
        cx.lineTo(e.x - enx + ex * e.w * 1.6, e.y - eny + ey * e.w * 1.6);
        for (i = N; i >= 0; i--) {
          var q2 = pts[i];
          cx.lineTo(q2.x + Math.sin(q2.th) * q2.w, q2.y - Math.cos(q2.th) * q2.w);
        }
        cx.closePath();
      }

      /* --- the two sash streamers. On 'back' and 'front' rather than both
             behind her: a sash tied at the waist has one end on the near
             side of the body and one on the far side, and putting both on
             'back' hid them under the tail, which is the widest dark shape
             on the cat. Different lengths and different bends — a matched
             pair reads as a printed decal. --- */
      var drift = Math.sin(f.t * 0.075) * 0.10;
      A.add('back', function (cx) {
        var k1 = T(0.34, -f.hipW * 1.05);
        ribbon(cx, k1.x, k1.y, Math.PI + 0.14 - sway * 0.045 + drift,
               L * 1.45, f.hipW * 0.52, 0.86 + sway * 0.02, f.t * 0.10);
      }, SASH, { edge: true });

      /* --- the dress. Fitted through the waist, cut away at the shoulders
             so the deltoids stay in the outline, on 'body' so the near arm
             passes in front of the cloth. --- */
      A.add('body', function (cx) {
        A.smooth(cx, [
          T(0.22, f.hipW * 1.10), T(0.46, f.waistW * 1.22),
          T(0.70, f.chestW * 1.04), T(0.92, f.chestW * 1.12),
          T(1.06, f.chestW * 0.38), T(1.08, -f.chestW * 0.44),
          T(0.98, -f.chestW * 1.14), T(0.60, -f.chestW * 1.20),
          T(0.38, -f.waistW * 1.30), T(0.18, -f.hipW * 1.14)
        ]);
      }, DRESS, { band: true, edge: true });

      /* the standing mandarin collar. It is here for the SILHOUETTE — a
         collar that only shows as a colour change on the neck is worth
         nothing, one that stands proud of it changes the shape of her
         shoulders and neck against the sky. */
      A.add('body', function (cx) {
        cx.beginPath();
        var a = T(0.96, f.chestW * 0.46); cx.moveTo(a.x, a.y);
        line(cx, 1.24, f.chestW * 0.54);
        line(cx, 1.30, -f.chestW * 0.16);
        line(cx, 1.26, -f.chestW * 0.72);
        line(cx, 0.96, -f.chestW * 0.78);
        line(cx, 0.98, -f.chestW * 0.10);
        cx.closePath();
      }, FOLD, { band: true, edge: true });

      /* --- the skirt, and the slit. The hem is a straight diagonal: high
             at the front so the lead thigh is bare from the hip down, long
             at the back so there is cloth streaming past her legs. That
             diagonal is the whole silhouette idea — a symmetrical hem is
             Gracie's, and a symmetrical hem on an acrobat looks like she is
             standing still. On 'front' so it hangs OVER the near thigh. --- */
      A.add('front', function (cx) {
        cx.beginPath();
        var a = T(0.30, f.hipW * 1.08); cx.moveTo(a.x, a.y);
        line(cx, 0.06, f.hipW * 1.62);
        line(cx, -0.16, f.hipW * 1.22);      /* the top of the slit */
        line(cx, -0.40, -f.hipW * 0.10);
        line(cx, -0.72, -f.hipW * 1.00);     /* the long trailing point */
        line(cx, -0.48, -f.hipW * 1.70);
        line(cx, -0.04, -f.hipW * 1.76);
        line(cx, 0.16, -f.hipW * 1.40);
        line(cx, 0.30, -f.hipW * 1.10);
        cx.closePath();
      }, DRESS, { band: true, edge: true });

      /* Gold piping along the hem, laid over the skirt.

         Gold on the collar rim was tried first, on the theory that she
         needed a highlight at the TOP of the figure — and it never appeared
         once, because the head is drawn after the body layer and sat on top
         of it in every pose. This is the same idea in the place it can be
         seen. It follows the one long straight diagonal on her, so at game
         size it is a defined edge rather than noise, and it makes the
         biggest shape in the costume read on a dark stage as well as a
         bright one. A border all the way round was tried and lost the
         diagonal in a teal outline; only the cut edge carries it. */
      A.add('front', function (cx) {
        var hem = [[-0.16, 1.22], [-0.40, -0.10], [-0.72, -1.00], [-0.48, -1.70]];
        cx.beginPath();
        var a = T(hem[0][0], f.hipW * hem[0][1]); cx.moveTo(a.x, a.y);
        for (var q = 1; q < hem.length; q++) line(cx, hem[q][0], f.hipW * hem[q][1]);
        for (q = hem.length - 1; q >= 0; q--) line(cx, hem[q][0] + 0.085, f.hipW * hem[q][1] * 0.90);
        cx.closePath();
      }, SASH, { edge: true, flat: true });

      /* --- the wide sash, over both. Wider than the dress at that height
             so it reads as a band laid on top and not a stripe printed on
             it, and gold, which is the one hard value break on a cat who is
             cream above and dark brown below. --- */
      A.add('front', function (cx) {
        cx.beginPath();
        var a = T(0.10, f.hipW * 1.28); cx.moveTo(a.x, a.y);
        line(cx, 0.40, f.hipW * 1.14);
        line(cx, 0.44, -f.hipW * 1.22);
        line(cx, 0.12, -f.hipW * 1.36);
        cx.closePath();
      }, SASH, { band: true, edge: true });
      A.add('front', function (cx) {
        var k = T(0.24, -f.hipW * 1.02);
        A.ellipse(cx, k.x, k.y, f.hipW * 0.42, f.hipW * 0.34, 0.25);
      }, KNOT, { band: true, edge: true });

      /* the near end of the sash, added AFTER the skirt on purpose — added
         before it, the skirt painted straight over it and only one streamer
         ever showed.

         The pair went wrong twice before this. Both long, both gold and both
         leaving at the same angle read as a gold X behind her hips — two
         crossed swords, and they buried the skirt. They now differ in every
         way that matters: this one leaves BELOW the sash and falls steeply,
         it is two thirds the length, and it is the darker gold, so the eye
         takes the long flat one first and this one second. */
      A.add('front', function (cx) {
        var k2 = T(0.06, -f.hipW * 1.55);
        ribbon(cx, k2.x, k2.y, Math.PI + 0.92 - sway * 0.045 - drift,
               L * 0.95, f.hipW * 0.38, 0.34 - sway * 0.02, f.t * 0.10 + 1.9);
      }, KNOT, { edge: true });

      /* --- the pin.

             Lilly and Luigi are both `ear: 'tall'`, and turned black they
             were the same pair of spikes on the same narrow skull. Widening
             her ears would have cost her the elegance, which is the whole
             point of her, so the difference goes in the GAP between them:
             a gold pin leaning back out of the crown with a diamond head.
             The first cut had a three-pointed fan on it and sat hard against
             the far ear, where it read as a gold lightning bolt stuck to the
             side of her head; one diamond, and moved forward into the middle
             of the gap, reads as an ornament. It never crosses an ear — Gracie's headband tails taught
             everybody that at this size anything laid over an ear wins the
             ear — it only fills the notch, so from a distance she reads as
             two spikes with something between them and he reads as two
             spikes. Head layer, so it is cel-shaded with the skull and sits
             under the face. --- */
      A.add('head', function (cx) {
        var r = j.headR;
        cx.beginPath();
        cx.moveTo(0.20 * r, 0.74 * r);           /* the shaft, out of the crown */
        cx.lineTo(0.04 * r, 1.88 * r);
        cx.lineTo(-0.20 * r, 2.10 * r);          /* the head: one diamond */
        cx.lineTo(-0.04 * r, 2.40 * r);
        cx.lineTo(0.20 * r, 2.14 * r);
        cx.lineTo(0.16 * r, 1.84 * r);
        cx.lineTo(0.04 * r, 0.70 * r);
        cx.closePath();
      }, SASH, { edge: true });

      /* --- the wrist ribbons.

             First go was a long streamer off each hand. At game size it sat
             directly in front of the fist and read as a gold banana she was
             holding — the worst kind of failure, because it was legible and
             legible as the wrong thing. What she wears now is a CUFF at the
             wrist with a short end trailing off the back of it: the cuff is
             a hard dark band across a cream forearm, which is the part that
             actually reads at 90 pixels, and the end only ever appears
             behind the arm where there is nothing to confuse it with. --- */
      function cuff(layer, h, e, col) {
        var ax = h.x - (h.x - e.x) * 0.42, ay = h.y - (h.y - e.y) * 0.42;
        var ang = Math.atan2(h.y - e.y, h.x - e.x);
        A.add(layer, function (cx) {
          var nx = -Math.sin(ang), ny = Math.cos(ang);
          var lx = Math.cos(ang), ly = Math.sin(ang);
          var w = f.R_MID * 1.28, l = f.R_MID * 0.72;
          cx.beginPath();
          cx.moveTo(ax + nx * w + lx * l, ay + ny * w + ly * l);
          cx.lineTo(ax - nx * w + lx * l, ay - ny * w + ly * l);
          cx.lineTo(ax - nx * w - lx * l, ay - ny * w - ly * l);
          cx.lineTo(ax + nx * w - lx * l, ay + ny * w - ly * l);
          cx.closePath();
        }, col, { edge: true, flat: true });
        A.add(layer, function (cx) {
          ribbon(cx, ax, ay, Math.PI + 0.70 - sway * 0.030 + drift * 1.4,
                 L * 0.42, f.hipW * 0.20, 0.55);
        }, col, { edge: true });
      }
      cuff('body', j.handB, j.elbB, FOLD);
      cuff('front', j.handF, j.elbF, FOLD);
    }
  },
  displayName: 'LILLY',
  subtitle: 'The Acrobat',
  blurb: 'Seal point, blue eyes, and never on the floor for long. Hits like a rumour, but she is already behind you.',
  difficulty: 3,
  palette: {
    /* The acrobat. Anklets and a collar with a bell on it, so you can
       hear where she is going to be. */
    kit: { anklets: '#d9b26a' },
    fur: '#e2d5bd', fur2: '#c9b99c', belly: '#f6efe2', marks: '#4a352b',
    eye: '#69b0e8', nose: '#5a4038', inner: '#a8827a',
    muzzleColor: '#6b5042',
    accent: '#2f6f74', accessory: 'collar', pattern: 'siamese',
    tailTip: '#4a352b', longhair: true, points: true,
    line: 'rgba(48,36,28,.5)'
  },
  stats: { walkF: 2.02, walkB: 1.78, jumpVy: 10.6, jumpVx: 4.0, gravity: 0.44,
           health: 570, stunMax: 86, weight: 0.78, hasDash: true, airDash: true },
  mod: { reach: 1.05, damage: 0.82, speed: 0.80 },
  specials: [
    {
      id: 'flipattack', name: 'Flip Attack',
      desc: 'Straight up in four frames, invincible on the way. Her answer to anything coming down at her.', kind: 'special',
      motion: 'dp', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      startup: 4, active: 15, recovery: 22,
      damage: [70, 82, 94], stun: [16, 18, 20], chip: 7,
      hitstun: 21, blockstun: 12, knockdown: 'hard',
      pushback: 1.8, blockPushback: 3.2,
      invuln: [0, 6], airborne: [3, 32],
      hitbox: { x: -6, y: 36, w: 40, h: 56 },
      meterGain: 18, meterOnHit: 9,
      anim: [{ at: 0, p: Ps.stand }, { at: 3, p: Ps.flipWind },
             { at: 8, p: Ps.flipUp }, { at: 14, p: Ps.flipOver },
             { at: 22, p: Ps.flipDown }, { at: 30, p: Ps.land },
             { at: 41, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr === 2) { f.vy = 7.6 + strength * 0.6; f.vx = f.facing * 1.4; f.grounded = false; }
      }
    },
    {
      id: 'cranekick', name: 'Crane Kick',
      desc: 'A forward-leaping overhead. It has to be blocked standing, and it closes the distance while it does it.', kind: 'special',
      motion: 'qcf', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      startup: 12, active: 8, recovery: 20,
      damage: [52, 60, 68], stun: [13, 15, 17], chip: 6,
      hitstun: 20, blockstun: 13, hitLevel: 'overhead', knockdown: 'soft',
      pushback: 2.6, blockPushback: 3.2,
      airborne: [9, 28],
      hitbox: { x: 14, y: 26, w: 52, h: 30 },
      meterGain: 16, meterOnHit: 8,
      anim: [{ at: 0, p: Ps.stand }, { at: 6, p: Ps.craneUp },
             { at: 12, p: Ps.craneKick }, { at: 19, p: Ps.craneKick },
             { at: 26, p: Ps.craneUp }, { at: 40, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr === 9) { f.vy = 3.8; f.vx = f.facing * (3.4 + strength * 0.5); f.grounded = false; }
      }
    }
  ],
  supers: [{
    id: 'superCrane', name: 'CRANE ASCENDING',
    desc: 'Thirty-four frames of rising kick, invincible for the first twelve. Nothing gets underneath it.', motion: 'qcfx2',
    buttons: ['LK', 'MK', 'HK'], cost: 100,
    startup: 4, active: 34, recovery: 30, freeze: 26,
    damage: 30, stun: 6, chip: 6, multiHit: 6, hitGap: 6,
    hitstun: 18, blockstun: 12, knockdown: 'hard',
    pushback: 1.4, blockPushback: 2.6,
    invuln: [0, 12], airborne: [3, 44],
    /* Reaches down as well as up: she climbs through the move, and a
       hitbox that only covers where she IS leaves a standing opponent
       underneath her after the first hit. */
    hitbox: { x: -10, y: 6, w: 52, h: 86 },
    anim: [{ at: 0, p: Ps.flipWind }, { at: 4, p: Ps.flipUp },
           { at: 12, p: Ps.flipOver }, { at: 20, p: Ps.craneKick },
           { at: 28, p: Ps.flipOver }, { at: 36, p: Ps.flipDown },
           { at: 48, p: Ps.land }, { at: 68, p: Ps.stand }],
    moveSelf: function (f, fr) {
      if (fr === 3) { f.vy = 7.2; f.vx = f.facing * 2.6; f.grounded = false; }
      /* she hangs, and drifts after them, rather than leaving the screen */
      if (fr > 3 && fr < 34) { f.vy += 0.30; f.vx = f.facing * 2.2; }
    }
  }]
  };
})();
