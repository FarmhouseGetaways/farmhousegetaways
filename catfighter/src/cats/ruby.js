/* =====================================================================
   6 — RUBY. Rubidoux. Short for nothing, she just is.

   HEAVY: hard to hurt and hard to move, with a bite that goes through
   whatever you were doing and a flip kick for anyone who jumps at her.

   THE LOOK. She is the one on the select screen you do not want to
   pick a fight with. That is a costume job, not a colour job — a ginger
   tabby with no kit on is a ginger tabby, which is exactly what she was
   until 22 Aug 2026. Studded leather cut, one enormous shoulder pad,
   a chain round her neck, trousers torn off below the knee, bare feet.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.ruby = {
  id: 'ruby',
  weightClass: 'heavy',
    /* Hunched forward over her shoulders with her head low and her hands
       carried LOW and open — she is not guarding, she is waiting for you
       to come inside her arms. The hunch is the read: every other cat on
       the roster stands up straight. */
  stance: { torso: 15, py: -2, head: [1, -2, 11], armF: [9, -25],
            armB: [7, -17], legF: [9, -9], legB: [-7, 10] },
    /* Shoulder well past girth so the taper is a V and not a barrel — a
       heavyweight with a matching waist reads as fat rather than as the
       most dangerous thing in the line-up, which was the first pass. */
  build: { s: 1.06, girth: 1.34, limb: 0.94, head: 0.98, muscle: 1.20,
           headShape: 'blocky', ear: 'torn', shoulder: 1.34, waist: 0.96, limbW: 1.22 },

  /* ---- HER LOOK ---------------------------------------------------------

     Four things stand OUT of the body outline, because a costume drawn
     inside it is worth nothing in black:

       1. the pauldron — one, on the leading shoulder, wider than her head
       2. the hackle — a ridge of raised fur down the back of her neck
       3. the long back hem of the cut, hanging past her tail root
       4. the torn trouser legs, cut off in teeth below the knee

     Everything else — the chain, the studs, the buckle — is value work
     that makes her read as leather rather than as fur, and none of it is
     load-bearing at 384x224.                                            */
  look: {
    pieces: function (A, j, f) {
      /* Leather nearly black. It was a mid brown first and it disappeared
         into the ginger: at game size a costume on a warm cat has to be a
         VALUE break, not a hue one. The studs and the chain are the only
         light things on her, which is why the eye goes to the shoulder. */
      var HIDE = '#2e1d18', HIDE2 = '#4a2e24', STUD = '#c8c0ae',
          CHAIN = '#9c968a', TROU = '#443f36', TROU2 = '#2c2924',
          HACKLE = '#7a3f26';

      function frame(a, b) {
        var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
        return { ux: dx / L, uy: dy / L, px: -dy / L, py: dx / L, L: L };
      }
      function P(o, at, u, v) {
        return { x: at.x + o.ux * u + o.px * v, y: at.y + o.uy * u + o.py * v };
      }
      /* the spine: t is 0 at the pelvis and 1 at the neck, w sideways,
         +w forward. Everything worn on the trunk hangs off this so it
         leans when she does. */
      var pv = j.pelvis, nk = j.neck;
      var sdx = nk.x - pv.x, sdy = nk.y - pv.y;
      var sL = Math.hypot(sdx, sdy) || 1;
      var sfx = sdy / sL, sfy = -sdx / sL;
      function T(t, w) { return { x: pv.x + sdx * t + sfx * w, y: pv.y + sdy * t + sfy * w }; }
      function seg(cx, t, w) { var q = T(t, w); cx.lineTo(q.x, q.y); }
      function L2(cx, p) { cx.lineTo(p.x, p.y); }

      /* ================= THE HACKLE =================================

         A ridge of fur standing up along the back of her neck and
         shoulders. On 'back', so all that survives is the part proud of
         the body — which is the whole point of it. It is the cheapest
         silhouette she has and it is the one that says ANGRY: a cat with
         its hackles up is a cat that has already decided.

         Pointing back and up rather than straight up, because straight up
         on a hunched figure reads as a mohawk sitting on nothing.      */
      A.add('back', function (cx) {
        A.tuft(cx, T(0.86, -f.chestW * 0.62), 6, f.chestW * 0.92, 74, 128, true);
      }, HACKLE, { edge: true });

      /* ================= THE CUT ====================================

         Open down the front, so there is a band of ginger showing between
         the two edges — a waistcoat closed across the chest is a shirt at
         this size. The BACK of it runs long, past the hip, and that tail
         of leather is what her outline is doing from behind.           */
      A.add('body', function (cx) {
        cx.beginPath();
        var a = T(0.20, f.hipW * 1.36); cx.moveTo(a.x, a.y);   /* front hem, flared */
        seg(cx, 0.50, f.waistW * 0.96);
        seg(cx, 0.80, f.chestW * 0.74);
        seg(cx, 1.10, f.chestW * 0.66);                         /* collar, front edge */
        seg(cx, 1.30, -f.chestW * 0.34);                        /* stands up behind the neck */
        seg(cx, 1.14, -f.chestW * 1.32);
        seg(cx, 0.66, -f.chestW * 1.40);
        seg(cx, 0.22, -f.hipW * 1.52);
        seg(cx, -0.24, -f.hipW * 1.44);                         /* the long back hem */
        seg(cx, -0.30, -f.hipW * 0.62);
        seg(cx, 0.02, -f.hipW * 0.30);
        cx.closePath();
      }, HIDE, { band: true, edge: true });

      /* The lit face of the lapel — one material, two planes. Without it
         the cut is a black hole with a cat behind it and the three-tone
         rule has nothing to work with. */
      A.add('body', function (cx) {
        A.smooth(cx, [T(1.28, -f.chestW * 0.30), T(1.08, f.chestW * 0.62),
                      T(0.78, f.chestW * 0.70), T(0.74, f.chestW * 0.28),
                      T(1.04, f.chestW * 0.24), T(1.18, -f.chestW * 0.44)]);
      }, HIDE2, { edge: true });

      /* studs down the front edge of the cut. Flat — they are two pixels
         across in the game and a clip on each is four calls for nothing. */
      for (var q = 0; q < 4; q++) {
        (function (t) {
          A.add('body', function (cx) {
            var p = T(t, f.chestW * (0.30 + (1 - t) * 0.34));
            A.ellipse(cx, p.x, p.y, f.s * 1.5, f.s * 1.5, 0);
          }, STUD, { flat: true });
        })(0.42 + q * 0.20);
      }

      /* ================= THE CHAIN ==================================

         Five links round the throat rather than a band, because a band at
         this size is a black collar and she has enough black on her. They
         are drawn as separate flat discs and the gaps between them are
         what says metal. The ring hanging off the front is the bright
         spot the eye lands on and the only round thing on her.        */
      var cw = f.chestW;
      for (var k = 0; k < 5; k++) {
        (function (u) {
          A.add('body', function (cx) {
            var p = T(1.14 + u * 0.10, cw * (0.78 - u * 1.70));
            A.ellipse(cx, p.x, p.y, cw * 0.20, cw * 0.17, 0);
          }, CHAIN, { flat: true });
        })(k / 4);
      }
      A.add('body', function (cx) {
        var p = T(1.02, cw * 0.86);
        cx.beginPath();
        cx.ellipse(p.x, p.y, cw * 0.30, cw * 0.30, 0, 0, Math.PI * 2);
        cx.ellipse(p.x, p.y, cw * 0.14, cw * 0.14, 0, Math.PI * 2, 0, true);
        cx.closePath();
      }, STUD, { edge: true });

      /* ================= THE BELT ===================================
         Wide and low, with a plate buckle. A narrow belt is eaten by the
         contour pass — this one is deliberately as deep as her hand. */
      A.add('front', function (cx) {
        A.smooth(cx, [T(0.14, f.hipW * 1.30), T(0.36, f.hipW * 1.22),
                      T(0.38, -f.hipW * 1.34), T(0.16, -f.hipW * 1.42)]);
      }, HIDE, { band: true, edge: true });
      A.add('front', function (cx) {
        var b = T(0.25, f.hipW * 1.06);
        A.ellipse(cx, b.x, b.y, f.s * 3.4, f.s * 2.8, 0.25);
      }, STUD, { edge: true });
      /* the tongue of the belt hanging loose off the buckle, swinging on
         f.sway. A strap that does not move is a strip of tape. */
      A.add('front', function (cx) {
        cx.beginPath();
        var a = T(0.22, f.hipW * 1.16); cx.moveTo(a.x, a.y);
        var d = f.sway * 0.5;
        seg(cx, 0.06, f.hipW * 1.30 + d);
        seg(cx, -0.22, f.hipW * 1.34 + d * 1.8);
        seg(cx, -0.26, f.hipW * 0.98 + d * 1.8);
        seg(cx, -0.02, f.hipW * 0.96 + d);
        cx.closePath();
      }, HIDE2, { edge: true });

      /* ================= THE TROUSERS ===============================

         Torn off in teeth below the knee, bare feet under them. Cut with
         lineTo and never smoothed — A.smooth rounds a two-pixel tooth
         away to nothing and the tear IS the shape. The far leg goes on
         'body' and the near one on 'front', same as every other kit on
         the roster, or the leading thigh paints straight over it.

         The widths are given per JOINT and not as one number scaled up and
         down the leg. The first pass took a single `w` and multiplied it by
         1.3 everywhere, which put the hem at one and a half thigh-radii
         out at the ankle: she came out in bell-bottoms, and the two flares
         met in the middle and read as a skirt. A trouser is barely wider
         than the leg inside it. The TEETH are cut along the leg, varying
         the length of the hem, not across it — swinging them sideways is
         what made the sawtooth read as pinking shears.                  */
      function trouser(layer, hip, knee, foot, wh, wk, ws) {
        var a = frame(hip, knee), b = frame(knee, foot);
        A.add(layer, function (cx) {
          cx.beginPath();
          var s0 = P(a, hip, -a.L * 0.30, wh); cx.moveTo(s0.x, s0.y);
          L2(cx, P(a, hip, a.L * 0.96, wk));
          L2(cx, P(b, knee, b.L * 0.36, ws));
          /* the tear */
          L2(cx, P(b, knee, b.L * 0.46, ws * 0.46));
          L2(cx, P(b, knee, b.L * 0.24, ws * 0.12));
          L2(cx, P(b, knee, b.L * 0.44, -ws * 0.34));
          L2(cx, P(b, knee, b.L * 0.26, -ws * 0.74));
          L2(cx, P(b, knee, b.L * 0.40, -ws));
          L2(cx, P(a, hip, a.L * 0.96, -wk));
          L2(cx, P(a, hip, -a.L * 0.30, -wh));
          cx.closePath();
        }, TROU, { band: true, edge: true });
        /* one dark panel down the back of the leg so it is a trouser with
           a light on it and not a grey tube */
        A.add(layer, function (cx) {
          cx.beginPath();
          var s1 = P(a, hip, -a.L * 0.26, -wh * 0.96); cx.moveTo(s1.x, s1.y);
          L2(cx, P(a, hip, a.L * 0.96, -wk * 0.98));
          L2(cx, P(b, knee, b.L * 0.30, -ws * 0.94));
          L2(cx, P(b, knee, b.L * 0.24, -ws * 0.24));
          L2(cx, P(a, hip, -a.L * 0.26, -wh * 0.34));
          cx.closePath();
        }, TROU2, {});
      }
      trouser('body', j.hipB, j.kneeB, j.footB,
              f.R_TOP * 1.06, f.R_MID * 1.36, f.R_MID * 1.24);
      trouser('front', j.hipF, j.kneeF, j.footF,
              f.R_TOP * 1.12, f.R_MID * 1.44, f.R_MID * 1.30);

      /* ================= THE PAULDRON ===============================

         One. On the leading shoulder, wider than her skull, with three
         spikes standing off the top of it. A matched pair reads as armour
         and armour is not what she is — one scavenged plate strapped on
         over a leather cut is. It is on 'front' so it caps the near arm
         wherever that arm goes, and it is the single biggest thing she
         does to a black shape.                                        */
      var pr = f.chestW * 0.66;
      A.add('front', function (cx) {
        A.pad(cx, j.shF, j.elbF, pr, 1.30);
      }, HIDE, { band: true, edge: true });
      /* the spikes off the outer rim */
      A.add('front', function (cx) {
        var o = frame(j.shF, j.elbF);
        A.tuft(cx, P(o, j.shF, -pr * 0.34, pr * 0.86), 3, pr * 0.62, 60,
               Math.atan2(-o.uy, -o.ux) * 180 / Math.PI + 34, false);
      }, STUD, { edge: true });
      /* the lit top plane of the pad, cut across it — the hard shadow edge
         is what makes it read as a curved plate rather than a black disc */
      A.add('front', function (cx) {
        var o = frame(j.shF, j.elbF);
        A.smooth(cx, [P(o, j.shF, -pr * 0.50, pr * 0.10),
                      P(o, j.shF, -pr * 0.30, pr * 0.96),
                      P(o, j.shF, pr * 0.36, pr * 1.08),
                      P(o, j.shF, pr * 0.30, pr * 0.44),
                      P(o, j.shF, -pr * 0.20, pr * 0.20)]);
      }, HIDE2, {});
      for (var z = 0; z < 3; z++) {
        (function (u) {
          A.add('front', function (cx) {
            var o = frame(j.shF, j.elbF);
            var p = P(o, j.shF, pr * (-0.30 + u * 0.66), pr * (0.98 - u * 0.10));
            A.ellipse(cx, p.x, p.y, f.s * 1.4, f.s * 1.4, 0);
          }, STUD, { flat: true });
        })(z / 2);
      }
    },

    /* Old damage, in three pale lines. It goes on the bare upper arm and
       across the muzzle — everywhere else on her is under leather now, and
       a scar drawn on a studded hide reads as a scratch in the paint.
       One pixel, because two is a stripe. The rig has a `kit.scars` that
       rakes the chest; hers is off, since the chest is covered. */
    overlay: function (ctx, j, fig) {
      var s = fig.s;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,238,224,.5)';
      ctx.lineWidth = Math.max(1, 0.95 * s);
      ctx.lineCap = 'butt';
      /* two rakes across the near forearm */
      var dx = j.handF.x - j.elbF.x, dy = j.handF.y - j.elbF.y;
      var L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      var px = -uy, py = ux;
      for (var q = 0; q < 2; q++) {
        var u = L * (0.34 + q * 0.22);
        ctx.beginPath();
        ctx.moveTo(j.elbF.x + ux * u + px * 3.4 * s, j.elbF.y + uy * u + py * 3.4 * s);
        ctx.lineTo(j.elbF.x + ux * (u + 1.6 * s) - px * 2.6 * s,
                   j.elbF.y + uy * (u + 1.6 * s) - py * 2.6 * s);
        ctx.stroke();
      }
      ctx.restore();

      /* and one over the bridge of the nose, clear of the eye — over the
         eye it splits the pupil and reads as a fault in the drawing */
      var r = j.headR;
      ctx.save();
      ctx.translate(j.head.x, j.head.y);
      ctx.rotate(-(j.headRot || 0) * Math.PI / 180);
      ctx.strokeStyle = 'rgba(255,238,224,.55)';
      ctx.lineWidth = Math.max(1, 0.95 * fig.s);
      ctx.beginPath();
      ctx.moveTo(r * 0.52, r * 0.30);
      ctx.lineTo(r * 0.20, -r * 0.30);
      ctx.stroke();
      ctx.restore();
    }
  },

  displayName: 'RUBY',
  subtitle: 'The Jaw',
  blurb: 'Rubidoux when she is in trouble. Hold down and wait, and anything that jumps at her gets flipped out of the sky.',
  difficulty: 3,
  palette: {
    /* `kit` is empty on purpose: the collar, the studs and the scars are
       all geometry in `look` now, and rig's built-in versions draw on top
       of them. The old `accessory: 'collar'` in particular put a little
       gold BELL under her chin, which is the exact opposite of the read. */
    kit: {},
    fur: '#a55c34', fur2: '#82452a', belly: '#e8c9a4', marks: '#5d2f1c',
    eye: '#e0b23a', nose: '#c4736a', inner: '#d99a90',
    accent: '#6b2f22', pattern: 'tabby',
    tailTip: '#5d2f1c', line: 'rgba(38,20,14,.6)'
  },
  stats: { walkF: 1.22, walkB: 1.04, jumpVy: 9.0, jumpVx: 2.6, gravity: 0.50,
           health: 750, stunMax: 128, weight: 1.30, hasDash: false },
  mod: { reach: 1.00, damage: 1.16, speed: 1.14 },
  specials: [
    {
      id: 'crushingbite', name: 'Crushing Bite',
      desc: 'She takes a hit on the way in, frames 7 to 18, and answers it with a hard knockdown.', kind: 'special',
      motion: 'qcf', buttons: ['LP', 'MP', 'HP'], stance: ['stand', 'crouch'],
      startup: 11, active: 6, recovery: 26,
      damage: [82, 96, 110], stun: [22, 25, 28], chip: 10,
      hitstun: 22, blockstun: 14, knockdown: 'hard',
      pushback: 3.4, blockPushback: 4.0,
      /* she comes through one hit to land it */
      armor: [7, 18],
      hitbox: { x: 16, y: 30, w: 44, h: 30 },
      mouth: 'open', mouthFrom: 7,
      meterGain: 18, meterOnHit: 9,
      anim: [{ at: 0, p: Ps.stand }, { at: 7, p: Ps.biteWind },
             { at: 11, p: Ps.biteOut }, { at: 17, p: Ps.biteOut },
             { at: 26, p: Ps.stand }, { at: 43, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr >= 9 && fr < 18) f.vx = f.facing * (3.0 + strength * 0.5);
      }
    },
    {
      id: 'flipkick', name: 'Flip Kick',
      desc: 'A charge move: hold down for about forty frames, then up and kick. Three frames of startup, invincible going up.', kind: 'special',
      charge: 'du', chargeFrames: 40, buttons: ['LK', 'MK', 'HK'],
      stance: ['stand', 'crouch'],
      startup: 3, active: 16, recovery: 26,
      damage: [80, 94, 108], stun: [18, 21, 24], chip: 8,
      hitstun: 22, blockstun: 13, knockdown: 'hard',
      pushback: 1.6, blockPushback: 3.4,
      invuln: [0, 5], airborne: [2, 34],
      hitbox: { x: -4, y: 40, w: 42, h: 58 },
      meterGain: 18, meterOnHit: 9,
      anim: [{ at: 0, p: Ps.flipKickWind }, { at: 3, p: Ps.flipKickWind },
             { at: 8, p: Ps.flipKickUp }, { at: 19, p: Ps.flipKickUp },
             { at: 28, p: Ps.flipKickDown }, { at: 45, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr === 1) { f.vy = 8.2 + strength * 0.6; f.vx = f.facing * 1.2; f.grounded = false; }
      }
    }
  ],
  supers: [{
    id: 'superBite', name: 'THE VICE',
    desc: 'Eight frames of startup, invincible for eleven, and a hard knockdown on the end of it.', motion: 'qcfx2',
    buttons: ['LP', 'MP', 'HP'], cost: 100,
    startup: 8, active: 20, recovery: 34, freeze: 28,
    damage: 62, stun: 12, chip: 12, multiHit: 4, hitGap: 5,
    hitstun: 22, blockstun: 14, knockdown: 'hard',
    pushback: 3.0, blockPushback: 4.0,
    invuln: [0, 11],
    hitbox: { x: 12, y: 26, w: 50, h: 38 },
    mouth: 'open', mouthFrom: 4,
    anim: [{ at: 0, p: Ps.biteWind }, { at: 8, p: Ps.biteOut },
           { at: 14, p: Ps.biteWind }, { at: 20, p: Ps.biteOut },
           { at: 28, p: Ps.biteOut }, { at: 62, p: Ps.stand }],
    moveSelf: function (f, fr) {
      if (fr >= 6 && fr < 26) f.vx = f.facing * 3.4;
    }
  }]
  };
})();
