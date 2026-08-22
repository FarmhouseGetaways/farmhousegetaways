/* =====================================================================
   2 — MARIO. Huge and fat, and it is the whole plan.

   HEAVY: hardest to hurt, hardest to shift, slowest to arrive. His two
   moves are both about closing that distance and then being enormous.

   He is the E.Honda slot, so he is dressed as one: a mawashi wound
   thick round the middle with a stiff apron hanging off the front, a
   champion's plate, a topknot, and tape on every joint. The apron is
   the important part — it is the only thing on the roster that hangs
   BELOW the waist and it turns a round cat into a bell.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.mario = {
  id: 'mario',
  weightClass: 'heavy',
    /* A sumo's stance, not a wrestler's: weight down, chest over the
       toes, head sunk into the shoulders so there is no neck to see.
       The head delta is what gives him the sloped shoulders — you
       cannot move P.shoulderY from a cat file, but dropping the skull
       into the collar reads as the same thing and costs nothing. */
  stance: { torso: 2, py: -5.4, armF: [34, -74], armB: [30, -80],
            legF: [25, -25], legB: [-24, 22], head: [1.4, -3.0, 0] },
  build: { s: 1.12, girth: 1.62, limb: 0.88, head: 0.94, muscle: 0.45,
           headShape: 'broad', ear: 'wide', shoulder: 1.36, waist: 1.30, limbW: 1.22 },

  /* ---- HIS LOOK ---------------------------------------------------------

     Everything here is geometry, not paint. `pieces` adds real shapes into
     the figure's own draw order and they get the same contour and the same
     cel shading as the fur — so the mawashi is lit by the lamp that lights
     his shoulder, and the apron is part of his outline rather than a
     sticker on it. See the COSTUME block in rig.js.                       */
  look: {
    pieces: function (A, j, f) {
      var MAW  = '#7d1f31';                 /* deep crimson mawashi */
      var MAW_D = A.shade(MAW, 0.30);
      /* The wraps started off white, which is what a sumo actually
         tapes with — but he is a black cat with a cream bib and cream
         feet, and four more cream lumps turned his ankles into slippers.
         In his own crimson they read as HIS, they tie the outfit
         together, and the whole cat comes down to three colours: black,
         crimson, one gold plate. */
      var TAPE = '#8f2438';
      var GOLD = '#f2c94c';

      /* The spine frame: t runs pelvis(0) to neck(1), w is across it,
         positive forward. Same trick as Gracie's gi. */
      var p = j.pelvis, n = j.neck;
      var dx = n.x - p.x, dy = n.y - p.y;
      var L = Math.hypot(dx, dy) || 1;
      var fx = dy / L, fy = -dx / L;
      function T(t, w) { return { x: p.x + dx * t + fy * 0 + fx * w,
                                  y: p.y + dy * t + fy * w }; }

      /* --- the sagari: the stiff apron off the front of the belt ------

         It hangs by gravity, not along the spine, so it is built in world
         y and only its top edge follows the lean of his body. Solid, with
         two grooves cut into it and a notched hem: five separate strands
         would be under three pixels each at game size and turn to fringe
         mush, which is the whole trap at this resolution.

         Its width is the span from a0 to a1 along the belt. The first
         version ran from the front of the hip to the front of the waist,
         which in a side view is a hand's breadth — it read as a necktie.
         Starting it back near the spine is what makes it a panel, and
         keeping both ends at nearly the same t is what makes it HANG:
         a top edge that climbed the spine made it stick out forwards
         like a shelf instead. */
      var a1 = T(0.12, f.waistW * 1.62);     /* front edge of the belt       */
      var a0 = T(0.04, -f.hipW * 0.10);      /* back edge, at the spine       */
      var D = 32 * f.s;                      /* down past the knee           */
      var flare = 4.2 * f.s;
      var bx1 = a1.x + flare, by1 = a1.y - D;
      var bx0 = a0.x - flare * 0.7, by0 = a0.y - D * 0.86;
      function hem(t, lift) {
        return { x: bx1 * t + bx0 * (1 - t),
                 y: by1 * t + by0 * (1 - t) + lift * f.s };
      }
      A.add('front', function (cx) {
        var h;
        cx.beginPath();
        cx.moveTo(a0.x, a0.y);
        cx.lineTo(a1.x, a1.y);
        cx.lineTo(bx1, by1);
        /* the hem: two notches, so it reads as stiff panels */
        h = hem(0.70, 3.6); cx.lineTo(h.x, h.y);
        h = hem(0.64, 0);   cx.lineTo(h.x, h.y);
        h = hem(0.36, 3.6); cx.lineTo(h.x, h.y);
        h = hem(0.30, 0);   cx.lineTo(h.x, h.y);
        cx.lineTo(bx0, by0);
        cx.closePath();
      }, MAW, { band: true, edge: true });

      /* the grooves. Drawn as strokes because a filled slot this narrow
         would vanish the moment the sprite is scaled down. */
      A.stroke('front', function (cx) {
        var h;
        cx.beginPath();
        cx.moveTo(a1.x * 0.72 + a0.x * 0.28, a1.y * 0.72 + a0.y * 0.28);
        h = hem(0.67, 0); cx.lineTo(h.x, h.y);
        cx.moveTo(a1.x * 0.38 + a0.x * 0.62, a1.y * 0.38 + a0.y * 0.62);
        h = hem(0.33, 0); cx.lineTo(h.x, h.y);
      }, A.shade(MAW, 0.55), Math.max(1, 1.3 * f.s));

      /* --- the mawashi, in two winds ---------------------------------

         One band is a belt. Two bands with a line between them is cloth
         that has been wound round somebody, and that is the difference
         between Mario and every other cat with a strap on. The lower
         wind is the wider of the two because that is where the bulk is.

         Two things about where it is drawn. It goes on 'front', not
         'body': on 'body' the near thigh's hip mass covers it and all
         you see of a belt at this girth is a sliver at the back, which
         is what the first attempt looked like. And it goes AFTER the
         apron, because the apron is tucked UNDER the belt — drawn
         before it, the apron swallowed the belt whole and the two read
         as one red slab with no waist in it. */
      A.add('front', function (cx) {
        A.smooth(cx, [
          T(0.04, f.hipW * 1.30), T(0.17, f.hipW * 1.44),
          T(0.30, f.waistW * 1.52), T(0.31, -f.waistW * 1.46),
          T(0.15, -f.hipW * 1.38), T(0.03, -f.hipW * 1.26)
        ]);
      }, MAW, { band: true, edge: true });

      /* the upper wind, a hair narrower and a shade darker, so the two
         read as cloth lying over cloth rather than one thick slab */
      A.add('front', function (cx) {
        A.smooth(cx, [
          T(0.31, f.waistW * 1.50), T(0.44, f.waistW * 1.38),
          T(0.45, -f.waistW * 1.32), T(0.32, -f.waistW * 1.44)
        ]);
      }, MAW_D, { band: true, edge: true });

      /* --- the champion's plate --------------------------------------

         Front and centre on the belt, where the light hits it. It is the
         one bright thing on a very dark cat and it is what your eye finds
         him by across the screen. */
      var pc = T(0.16, f.hipW * 1.36);
      A.add('front', function (cx) {
        cx.beginPath();
        cx.moveTo(pc.x + 1.0 * f.s, pc.y + 5.4 * f.s);
        cx.lineTo(pc.x + 4.8 * f.s, pc.y + 2.4 * f.s);
        cx.lineTo(pc.x + 4.4 * f.s, pc.y - 3.2 * f.s);
        cx.lineTo(pc.x + 0.4 * f.s, pc.y - 5.8 * f.s);
        cx.lineTo(pc.x - 3.4 * f.s, pc.y - 2.8 * f.s);
        cx.lineTo(pc.x - 3.0 * f.s, pc.y + 2.8 * f.s);
        cx.closePath();
      }, GOLD, { band: true, edge: true });

      /* --- tape ------------------------------------------------------

         Thick enough to be a lump in the outline, not a painted stripe —
         but only just. The first pass used R_END * 1.4, and at his girth
         R_END is already seven units, so he came out with four white
         beach balls stuck to him. A wrap is a band ROUND a limb: barely
         proud of it, and short. */
      function wrap(layer, a, b, t0, t1, rad, col) {
        var q0 = { x: a.x + (b.x - a.x) * t0, y: a.y + (b.y - a.y) * t0 };
        var q1 = { x: a.x + (b.x - a.x) * t1, y: a.y + (b.y - a.y) * t1 };
        A.add(layer, function (cx) { A.capsule(cx, q0, q1, rad, rad * 0.96); },
              col, { edge: true });
      }
      wrap('front', j.elbF, j.handF, 0.66, 0.94, f.R_END * 0.86, TAPE);
      wrap('front', j.kneeF, j.footF, 0.54, 0.86, f.R_END * 0.94, TAPE);
      /* Only the far ANKLE. A far-wrist wrap has to go on 'body' — there
         is no layer between the far limbs and the torso — and on a punch
         the far hand is behind the chest, so it came out as a crimson
         blob sitting on his belly. The far foot is never behind the
         torso, so that one is safe. */
      wrap('body',  j.kneeB, j.footB, 0.54, 0.86, f.R_END * 0.86, A.shade(TAPE, 0.30));

      /* --- the topknot -----------------------------------------------

         Head-layer pieces are drawn in the skull's own frame: origin at
         the head, +y up, +x the way he faces, r the skull radius. It sits
         between the ears and leans back, which puts a notch in the top of
         his silhouette that nobody else on the roster has. */
      var r = f.headR;
      A.add('head', function (cx) {
        A.capsule(cx, { x: r * 0.02, y: r * 0.76 }, { x: -r * 0.44, y: r * 1.76 },
                  r * 0.34, r * 0.42);
      }, f.fur, { band: true });
      /* the tie at its base. Kept narrow: at r * 0.26 it was as fat as
         the tuft and the whole thing read as a red pipe coming out of
         his head rather than as hair bound at the root. */
      A.add('head', function (cx) {
        A.capsule(cx, { x: r * 0.02, y: r * 0.82 }, { x: -r * 0.08, y: r * 0.98 },
                  r * 0.34, r * 0.32);
      }, MAW, { edge: true, flat: true });
    }
  },

  displayName: 'MARIO',
  subtitle: 'The Immovable',
  blurb: 'Enormous, and entirely aware of it. Getting to you takes a while. Being under him does not take long at all.',
  difficulty: 2,
  palette: {
    /* No `belt` in the kit any more. The rig's belt is a flat rectangle
       painted on after the fills, and a rectangle cannot be wound round
       anything — the mawashi in `look` is real geometry and goes into the
       silhouette, which is the entire point of him. */
    kit: {},
    fur: '#4b4243', fur2: '#332c2e', belly: '#f6f2e8', marks: '#211b1d',
    eye: '#d9c04a', nose: '#e8a2ac', inner: '#c98d95',
    accent: '#7a4a3c', accessory: 'none', pattern: 'tuxedo',
    tailTip: '#4b4243', longhair: true, line: 'rgba(14,11,12,.6)'
  },
  stats: { walkF: 1.02, walkB: 0.86, jumpVy: 8.8, jumpVx: 2.2, gravity: 0.54,
           health: 800, stunMax: 138, weight: 1.48, hasDash: false },
  mod: { reach: 1.02, damage: 1.22, speed: 1.24 },
  specials: [
    {
      id: 'bellybump', name: 'Belly Bump',
      desc: 'All of him, at once. He shrugs off a hit on the way in, frames 8 to 24, so trading with him is a losing idea.', kind: 'special',
      motion: 'qcf', buttons: ['LP', 'MP', 'HP'], stance: ['stand', 'crouch'],
      startup: 13, active: 10, recovery: 26,
      damage: [72, 84, 96], stun: [20, 22, 24], chip: 9,
      hitstun: 20, blockstun: 14, knockdown: 'soft',
      pushback: 4.2, blockPushback: 5.0,
      hitbox: { x: 10, y: 18, w: 48, h: 46 },
      /* He is too big to be interrupted by one jab on the way in. */
      armor: [8, 24], meterGain: 18, meterOnHit: 9,
      anim: [{ at: 0, p: Ps.stand }, { at: 8, p: Ps.bellyWind },
             { at: 14, p: Ps.bellyHit }, { at: 23, p: Ps.bellyHit },
             { at: 30, p: Ps.bellyEnd }, { at: 49, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr >= 11 && fr < 24) f.vx = f.facing * (3.6 + strength * 0.6);
      }
    },
    {
      id: 'smother', name: 'The Smother',
      desc: 'A grab, so blocking will not save them. Four frames of startup and a hard knockdown — but thirty-six frames of standing there if it misses.', kind: 'special',
      motion: 'hcf', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      isCommandThrow: true, range: 56,
      /* A missed command grab has to be a real punish, or the grappler
         just throws it out for free. Big reward, big risk. */
      startup: 4, active: 3, recovery: 36, whiffRecovery: 42,
      damage: [150, 175, 200], stun: [30, 33, 36],
      knockdown: 'hard', meterGain: 24,
      anim: [{ at: 0, p: Ps.smotherWind }, { at: 6, p: Ps.smotherWind },
             { at: 12, p: Ps.smotherDrop }, { at: 30, p: Ps.smotherDrop },
             { at: 43, p: Ps.stand }]
    }
  ],
  supers: [{
    id: 'superSmother', name: 'THE FULL WEIGHT',
    desc: 'Three frames, ungrabbable to block, 330 damage, invincible while it starts. If his meter is full and you are stood next to him, you are already in it.', motion: 'qcfx2',
    buttons: ['LK', 'MK', 'HK'], cost: 100,
    isCommandThrow: true, range: 64,
    startup: 3, active: 3, recovery: 44, freeze: 30, whiffRecovery: 48,
    damage: 330, stun: 44, knockdown: 'hard', invuln: [0, 6],
    anim: [{ at: 0, p: Ps.smotherWind }, { at: 8, p: Ps.smotherWind },
           { at: 16, p: Ps.smotherDrop }, { at: 36, p: Ps.smotherDrop },
           { at: 50, p: Ps.stand }]
  }]
  };
})();
