/* =====================================================================
   5 — FIGURO. Lilly's brother, and the strong one.

   MEDIUM: rears up on his back legs and throws hands, then leaves. The
   retreat is the point — he is the only cat who can simply not be there.

   He is the roster's boxer, and that is the whole design of him. A cat
   in a boxing kit is the one silhouette on the line-up nobody can
   mistake: two mitts the size of his head held up by his cheeks, a
   waistband you could read from the back of the room, boots to the knee
   and a towel still over his shoulder because he never went to the
   corner. Everything below is built to survive being turned black.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  CF.CatDefs.figuro = {
  id: 'figuro',
  weightClass: 'medium',
    /* Peek-a-boo: lead glove up by the cheek, elbows tucked in, chin down
       behind it. He is a boxer before he is a cat.

       The back arm stays tucked. Swinging it forward was tried, to get the
       far mitt clear of the skull, and it turned the guard into a man
       reaching for a door handle in every pose the stance touches — which
       is all of them. The mitt is got out of hiding by DRAW ORDER instead;
       see the glove block below. */
  stance: { torso: 4, py: -1, armF: [-30, 52], armB: [-8, 30],
            head: [1, -1.5, 5] },
  build: { s: 1.00, girth: 1.12, limb: 0.98, head: 1.00, muscle: 1.45,
           headShape: 'blocky', ear: 'small', shoulder: 1.26, waist: 0.82, limbW: 1.14 },

  /* ---- HIS LOOK ---------------------------------------------------------

     rig.js already has a `kit.gloves`, and it is two ellipses the size of a
     paw laid over the fists. At 384x224 that is a red bead on the end of an
     arm — it says "holding something", not "boxer". Everything here is built
     in `look.pieces` instead, where it goes through the contour pass and the
     cel shading with the rest of him, and where it can be made big enough to
     change the outline. `kit` is left empty on purpose: the built-in gloves
     and belt are drawn AFTER the costume layers and would have landed on top
     of all of this.                                                       */
  look: {
    pieces: function (A, j, f) {
      /* Red mitts, navy trunks, a sand-coloured waistband and an off-white
         towel. Four values and no more — a fifth (gold trim was tried on the
         waistband) turned the hip into confetti at game size. */
      var GLOVE = '#c0392f', CUFF = '#8d2622', LACE = '#efe4cc';
      var TRUNK = '#232c4c', BAND = '#c0392f', TRIM = '#8d2622';
      var BOOT = '#c0392f', BOOTTOP = '#8d2622';
      var WRAP = '#e9e1cf', TOWEL = '#d8cdb2';

      /* --- two little frames, because every piece of this kit is aligned to
             a bone rather than to the screen. `frame(a,b)` gives the axis
             from a to b and the one across it; P() places a point in that
             axis in the figure's own units. Written once because a glove
             hand-placed in world coordinates slides off the fist the moment
             he throws a punch — which is what the first pass did. --- */
      function frame(a, b) {
        var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
        return { ux: dx / L, uy: dy / L, px: -dy / L, py: dx / L, L: L };
      }
      function P(o, at, u, v) {
        return { x: at.x + o.ux * u + o.px * v, y: at.y + o.uy * u + o.py * v };
      }

      /* the spine, for the trunks — t is 0 at the pelvis and 1 at the neck,
         w is sideways, +w forward */
      var pv = j.pelvis, nk = j.neck;
      var sdx = nk.x - pv.x, sdy = nk.y - pv.y;
      var sL = Math.hypot(sdx, sdy) || 1;
      var sfx = sdy / sL, sfy = -sdx / sL;
      function T(t, w) { return { x: pv.x + sdx * t + sfx * w, y: pv.y + sdy * t + sfy * w }; }
      function seg(cx, t, w) { var q = T(t, w); cx.lineTo(q.x, q.y); }

      /* ================= THE GLOVES =================================

         The one shape that has to work. `r` is set off the skull radius so
         they are literally head-sized: the mitt spans about 2.2r across and
         the head is 2 headR, and at 1:1 that is a 20-pixel red mass either
         side of a 22-pixel face. Anything smaller and he is a cat holding
         his paws up, which is every other cat on the roster.

         Five pieces per hand, in this order so each paints over the last:
         the wrap showing past the cuff, the mitt, the thumb, the lace panel
         along the knuckles, and the cuff banding the wrist. The thumb is a
         separate lobe rather than a bump in the ring — folded into the ring
         it smoothed away to a nub, and the thumb is half of what says
         boxing glove and not mitten.                                   */
      var ring = [[-0.66, 0.58], [-0.24, 1.00], [0.46, 1.04], [1.02, 0.80],
                  [1.28, 0.14], [1.16, -0.56], [0.66, -1.02],
                  [0.04, -1.12], [-0.46, -0.94], [-0.74, -0.30]];

      function glove(layer, hand, elb, r, simple) {
        var o = frame(elb, hand);

        if (!simple) A.add(layer, function (cx) {
          A.smooth(cx, [P(o, hand, -1.72 * r, 0.50 * r), P(o, hand, -1.10 * r, 0.60 * r),
                        P(o, hand, -1.08 * r, -0.58 * r), P(o, hand, -1.68 * r, -0.48 * r)]);
        }, WRAP, { edge: true });

        A.add(layer, function (cx) {
          var pts = [], i;
          for (i = 0; i < ring.length; i++) pts.push(P(o, hand, ring[i][0] * r, ring[i][1] * r));
          A.smooth(cx, pts);
        }, GLOVE, { band: true, edge: true });

        A.add(layer, function (cx) {
          A.capsule(cx, P(o, hand, -0.16 * r, -0.84 * r), P(o, hand, 0.66 * r, -0.74 * r),
                    r * 0.36, r * 0.28);
        }, GLOVE, { edge: true });

        if (!simple) A.add(layer, function (cx) {
          A.smooth(cx, [P(o, hand, -0.30 * r, 0.90 * r), P(o, hand, 0.44 * r, 0.94 * r),
                        P(o, hand, 0.88 * r, 0.64 * r), P(o, hand, 0.72 * r, 0.38 * r),
                        P(o, hand, 0.32 * r, 0.60 * r), P(o, hand, -0.30 * r, 0.56 * r)]);
        }, LACE, { edge: true });

        A.add(layer, function (cx) {
          A.smooth(cx, [P(o, hand, -1.22 * r, 0.74 * r), P(o, hand, -0.54 * r, 0.88 * r),
                        P(o, hand, -0.48 * r, -0.86 * r), P(o, hand, -1.20 * r, -0.72 * r)]);
        }, CUFF, { band: true, edge: true });
      }

      /* BOTH gloves go on 'front', the far one first so the near one paints
         over it. The far one was on 'body' to begin with, which is the
         honest depth — after the torso, under the leading arm — and it was
         invisible: the near forearm crosses the chest in a peek-a-boo guard
         and ate the whole mitt, and what was left of it was painted over
         again by the tabby stripes, which are laid down after the body
         layer and clipped inside it.

         So the far mitt cheats forward one layer. It is smaller and it is
         overlapped by the near one, which is all the depth cue this needs at
         ninety pixels tall, and the result is what the guard is for: TWO red
         masses stacked by his cheek rather than one and a rumour. */
      var gr = f.headR * 0.88;
      /* The far mitt is drawn `simple` — no wrap showing, no lace panel.
         Both are cream, and stacked against the cream belly, the cream
         towel and the near mitt's own wrap they turned his whole chest into
         one pale smear. What the far hand needs to be is a red mass with a
         dark cuff, and nothing else. */
      glove('front', j.handB, j.elbB, gr * 0.86, true);
      glove('front', j.handF, j.elbF, gr);

      /* ================= THE BOOTS ==================================

         Up over the calf, with a folded collar at the top. The collar is
         what makes them boots rather than red socks: a hard band across the
         leg two thirds of the way up, wider than the leg it sits on, so the
         shin steps out of the silhouette instead of tapering into it. */
      function boot(layer, knee, foot) {
        var o = frame(knee, foot);
        var top = { x: knee.x + (foot.x - knee.x) * 0.40,
                    y: knee.y + (foot.y - knee.y) * 0.40 };

        A.add(layer, function (cx) {
          A.limb(cx, top, foot, f.R_MID * 1.22, f.R_END * 1.44, 0.35, 'shin');
        }, BOOT, { band: true, edge: true });

        /* the foot. footPath in rig.js is the shape of a cat's foot and this
           is the same shape a size larger with the toes taken off — a boot
           has one sole, not three pads. */
        A.add(layer, function (cx) {
          var lean = (foot.x - knee.x) * 0.16;
          var lx = f.FOOT_X * 1.08, ly = f.FOOT_Y * 1.18;
          cx.save();
          cx.translate(foot.x, foot.y);
          cx.beginPath();
          cx.moveTo(-lx * 0.70 + lean, ly * 0.62);
          cx.quadraticCurveTo(-lx * 0.90 + lean, -ly * 0.55, -lx * 0.48, -ly * 1.00);
          cx.lineTo(lx * 0.70, -ly * 1.06);
          cx.quadraticCurveTo(lx * 1.30, -ly * 0.92, lx * 1.26, -ly * 0.18);
          cx.quadraticCurveTo(lx * 0.92, ly * 0.40, lx * 0.10, ly * 0.58);
          cx.quadraticCurveTo(-lx * 0.30, ly * 0.74, -lx * 0.70 + lean, ly * 0.62);
          cx.closePath();
          cx.restore();
        }, BOOT, { band: true, edge: true });

        A.add(layer, function (cx) {
          A.smooth(cx, [P(o, top, -0.42 * f.R_MID, 1.50 * f.R_MID),
                        P(o, top, 0.62 * f.R_MID, 1.36 * f.R_MID),
                        P(o, top, 0.66 * f.R_MID, -1.36 * f.R_MID),
                        P(o, top, -0.40 * f.R_MID, -1.50 * f.R_MID)]);
        }, BOOTTOP, { band: true, edge: true });
      }
      boot('body', j.kneeB, j.footB);
      boot('front', j.kneeF, j.footF);

      /* ================= THE TRUNKS =================================

         High-waisted, the way a fighter's are, and the hem flares well past
         the hip so his outline below the belt is cloth. The bottom edge is
         cut with lineTo rather than smoothed — A.smooth rounds the leg
         openings into a skirt, and the notch between them is the difference
         between trunks and a tutu. */
      A.add('front', function (cx) {
        cx.beginPath();
        var a = T(0.46, f.hipW * 1.36); cx.moveTo(a.x, a.y);
        seg(cx, 0.28, f.hipW * 1.50);
        seg(cx, 0.00, f.hipW * 1.78);
        seg(cx, -0.24, f.hipW * 1.62);
        seg(cx, -0.13, f.hipW * 0.26);        /* the notch between the legs */
        seg(cx, -0.27, -f.hipW * 1.48);
        seg(cx, -0.03, -f.hipW * 1.76);
        seg(cx, 0.28, -f.hipW * 1.48);
        seg(cx, 0.46, -f.hipW * 1.34);
        cx.closePath();
      }, TRUNK, { band: true, edge: true });

      /* the waistband. Deliberately enormous — a boxer's rides up over the
         bottom rib, and at this resolution a narrow one is a pencil line
         that the contour pass eats.

         It was sand-coloured first, and it vanished: his belly is cream and
         his fur is tan, and a sand band across the middle of that is three
         near-identical values stacked up. It is the glove red now, which
         both survives the drop to 384x224 and ties the gloves, the boots
         and the trunks into one kit instead of three separate ideas. */
      A.add('front', function (cx) {
        cx.beginPath();
        var b = T(0.52, f.hipW * 1.34); cx.moveTo(b.x, b.y);
        seg(cx, 0.28, f.hipW * 1.50);
        seg(cx, 0.28, -f.hipW * 1.48);
        seg(cx, 0.52, -f.hipW * 1.32);
        cx.closePath();
      }, BAND, { band: true, edge: true });
      /* one darker strip along the bottom of it, so the band has a thickness
         rather than being a flat plaque */
      A.add('front', function (cx) {
        cx.beginPath();
        var b = T(0.34, f.hipW * 1.48); cx.moveTo(b.x, b.y);
        seg(cx, 0.28, f.hipW * 1.50);
        seg(cx, 0.28, -f.hipW * 1.48);
        seg(cx, 0.34, -f.hipW * 1.46);
        cx.closePath();
      }, TRIM, {});

      /* ================= THE TOWEL ==================================

         Over the back shoulder and down behind him, on 'back' so only the
         part standing proud of the body survives — which is the part that
         is doing the silhouette work. It swings off `f.sway`, so it lifts
         when he walks in and hangs when he stops. A towel that does not
         move is a white flag stapled to a cat.

         The first go used A.streamer. A streamer TAPERS, and a tapering
         white shape leaving a shoulder at forty degrees is a sword — that
         is exactly what it looked like, in every pose. A towel is a SLAB:
         near enough the same width the whole way down, blunt at the end,
         with a hem cut square. It is drawn with lineTo for that reason and
         hung off world-down rather than off the spine, because a towel is
         held up by nothing but gravity and does not lean when he does.  */
      function slab(cx, ax, ay, bx, by, w0, w1, hem) {
        var dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
        var px = -dy / L, py = dx / L;
        cx.beginPath();
        cx.moveTo(ax + px * w0, ay + py * w0);
        cx.lineTo(bx + px * w1, by + py * w1);
        /* the hem: a squared step across the bottom, not a rounded end */
        cx.lineTo(bx + px * w1 * 0.30 - dx / L * hem, by + py * w1 * 0.30 - dy / L * hem);
        cx.lineTo(bx - px * w1 * 0.30 - dx / L * hem, by - py * w1 * 0.30 - dy / L * hem);
        cx.lineTo(bx - px * w1, by - py * w1);
        cx.lineTo(ax - px * w0, ay - py * w0);
        cx.closePath();
      }

      var cw = f.chestW;
      var tw = { x: nk.x - cw * 0.98, y: nk.y + cw * 0.26 };   /* clear of the back */
      A.add('back', function (cx) {
        slab(cx, tw.x, tw.y,
             tw.x - cw * 0.40 + f.sway * 1.2, tw.y - cw * 1.85,
             cw * 0.38, cw * 0.34, cw * 0.14);
      }, TOWEL, { band: true, edge: true });
      /* the roll sitting on top of the shoulder, which is what makes the
         slab read as draped over him rather than hung on a hook behind */
      A.add('back', function (cx) {
        A.capsule(cx, { x: nk.x - cw * 0.10, y: nk.y + cw * 0.48 },
                      { x: nk.x - cw * 1.00, y: nk.y + cw * 0.18 },
                  cw * 0.26, cw * 0.30);
      }, TOWEL, { band: true, edge: true });

      /* A short end of the towel hanging over the FRONT of that shoulder
         was tried, to say draped rather than hung on a hook. It landed on
         the chest, took the near arm's cast shadow across it, and read as a
         satchel — a hard dark rectangle in the one place the eye goes. The
         roll over the shoulder does the same job without putting anything
         in front of him, so there is only the roll and the back end now. */
    },

    /* The laces. Three ticks across the pale panel on each mitt, one pixel
       wide, drawn free-hand over the finished cat because a stroke added to
       the shape list gets the contour pass too and comes out as three fat
       black bars. They are the only thing on him that is detail rather than
       shape, and they earn it: laces are what the eye checks a boxing glove
       against. */
    overlay: function (ctx, j, fig) {
      var s = fig.s;
      ctx.save();
      ctx.strokeStyle = 'rgba(60,40,30,.65)';
      ctx.lineWidth = Math.max(1, 0.9 * s);
      ctx.lineCap = 'butt';
      [[j.handF, j.elbF, 1.0], [j.handB, j.elbB, 0.9]].forEach(function (h) {
        var hand = h[0], elb = h[1], k = h[2];
        var dx = hand.x - elb.x, dy = hand.y - elb.y, L = Math.hypot(dx, dy) || 1;
        var ux = dx / L, uy = dy / L, px = -dy / L, py = dx / L;
        var r = j.headR * 0.88 * k;
        for (var q = 0; q < 3; q++) {
          var u = (-0.14 + q * 0.30) * r;
          ctx.beginPath();
          ctx.moveTo(hand.x + ux * u + px * r * 0.86, hand.y + uy * u + py * r * 0.86);
          ctx.lineTo(hand.x + ux * (u + 0.16 * r) + px * r * 0.58,
                     hand.y + uy * (u + 0.16 * r) + py * r * 0.58);
          ctx.stroke();
        }
      });
      ctx.restore();
    }
  },

  displayName: 'FIGURO',
  subtitle: 'The Boxer',
  blurb: 'Stands up on his back legs and throws hands until you stop enjoying it, then he is somewhere else entirely.',
  difficulty: 2,
  palette: {
    /* `kit` is empty on purpose — see the note above `look`. The gloves,
       trunks, boots, wraps and towel are all geometry now, not decals, and
       rig's built-in versions would draw on top of them.

       The fur went a shade deeper and browner than it was. The old tan sat
       at nearly the same value as the sand waistband, and a cat wearing kit
       he is the same brightness as is a cat wearing nothing. */
    kit: {},
    fur: '#9c7c4e', fur2: '#7d6039', belly: '#eddfc2', marks: '#4c3520',
    eye: '#8fc24a', nose: '#d99aa0', inner: '#e2a8a0',
    accent: '#7a5c32', accessory: 'none', pattern: 'tabby',
    tailTip: '#4c3520', line: 'rgba(40,28,16,.55)'
  },
  stats: { walkF: 1.64, walkB: 1.44, jumpVy: 9.6, jumpVx: 3.2, gravity: 0.48,
           health: 670, stunMax: 106, weight: 1.02, hasDash: true },
  mod: { reach: 0.98, damage: 1.06, speed: 0.90 },
  specials: [
    {
      id: 'rapidpaws', name: 'Rapid Paws',
      desc: 'Up on his back legs with both paws going, twenty-eight frames of it. Mash the button to bring it out.', kind: 'special',
      motion: 'mash', buttons: ['LP', 'MP', 'HP'], stance: ['stand'],
      startup: 5, active: 28, recovery: 18,
      damage: [15, 16, 17], stun: 3, chip: 3,
      hitstun: 11, blockstun: 9, multiHit: 6, hitGap: 5,
      pushback: 0.6, blockPushback: 1.4,
      hitbox: { x: 20, y: 42, w: 34, h: 24 },
      meterGain: 5, meterOnHit: 4,
      anim: [{ at: 0, p: Ps.stand }, { at: 5, p: Ps.boxStance },
             { at: 9, p: Ps.boxA }, { at: 14, p: Ps.boxB },
             { at: 19, p: Ps.boxA }, { at: 24, p: Ps.boxB },
             { at: 29, p: Ps.boxA }, { at: 34, p: Ps.boxStance },
             { at: 51, p: Ps.stand }]
    },
    {
      id: 'cutandrun', name: 'Cut and Run',
      desc: 'Not an attack at all — a fast, invincible retreat. Frames 1 to 12 pass straight through whatever they threw.', kind: 'special',
      motion: 'qcb', buttons: ['LK', 'MK', 'HK'], stance: ['stand', 'crouch'],
      startup: 3, active: 10, recovery: 12, noAttack: true,
      /* invincible on the way out — the only true escape on the roster */
      invuln: [1, 12], meterGain: 7,
      anim: [{ at: 0, p: Ps.stand }, { at: 3, p: Ps.retreatWind },
             { at: 7, p: Ps.retreatAir }, { at: 16, p: Ps.retreatAir },
             { at: 21, p: Ps.land }, { at: 25, p: Ps.stand }],
      moveSelf: function (f, fr, strength) {
        if (fr === 2) {
          f.vx = -f.facing * (6.0 + strength * 0.8);
          f.vy = 3.4;
          f.grounded = false;
        }
      }
    }
  ],
  supers: [{
    id: 'superPaws', name: 'TEN THOUSAND PAWS',
    desc: 'Forty-four frames of paws, and the first nine of them are invincible.', motion: 'qcfx2',
    buttons: ['LP', 'MP', 'HP'], cost: 100,
    startup: 5, active: 44, recovery: 24, freeze: 26,
    damage: 28, stun: 4, chip: 5, multiHit: 12, hitGap: 4,
    hitstun: 12, blockstun: 9, knockdown: 'soft',
    pushback: 0.5, blockPushback: 1.4,
    invuln: [0, 9],
    hitbox: { x: 18, y: 38, w: 40, h: 30 },
    anim: [{ at: 0, p: Ps.boxStance }, { at: 5, p: Ps.boxA },
           { at: 11, p: Ps.boxB }, { at: 17, p: Ps.boxA },
           { at: 23, p: Ps.boxB }, { at: 29, p: Ps.boxA },
           { at: 35, p: Ps.boxB }, { at: 41, p: Ps.boxA },
           { at: 49, p: Ps.boxStance }, { at: 73, p: Ps.stand }]
  }]
  };
})();
