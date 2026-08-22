/* =====================================================================
   2 — MARIO. Huge and fat, and it is the whole plan.

   HEAVY: hardest to hurt, hardest to shift, slowest to arrive. His two
   moves are both about closing that distance and then being enormous.

   He is the E.Honda slot, so he is dressed as one: a mawashi wound
   twice round the middle, a stiff apron hanging off the front of it, a
   gold knot with two ends hanging, a topknot, and crimson wraps at the
   wrists and ankles. The apron is the important part — it is the only
   thing on the roster that hangs BELOW the waist, and it turns a round
   cat into a bell. Turn all six black and he is the one you can still
   name.
   ===================================================================== */
(function () {
  var Ps = CF.Pose, Kit = CF.CatKit;
  var fireballSpecial = Kit.fireballSpecial;
  var uppercutSpecial = Kit.uppercutSpecial;
  var spinKickSpecial = Kit.spinKickSpecial;

  /* The apron's path and its tones, handed from `pieces` to `overlay`.
     See the long note by `apronPath` for why it has to travel. */
  var stash = null;

  CF.CatDefs.mario = {
  id: 'mario',
  weightClass: 'heavy',
    /* A sumo's stance, not a wrestler's: weight down, chest over the
       toes, hands out in front at chest height.

       THE ARMS. They used to be armF [34, -74] and armB [30, -80], which
       on top of the base guard put both forearms nearly parallel with the
       ground and buried them in a chest that is 1.62 girth wide. In black
       there was no elbow, no wrist and no fist on either side: the whole
       top half was one mass from hip to crown. A sumo does not guard at
       head height anyway. At [22, -50] the upper arm runs forward and
       down, the forearm comes forward and up, and the fist clears the
       front of the belly as a separate lobe with a notch under it —
       which is the first thing on him you can name in the silhouette.

       THE HEAD used to be sunk 3 units INTO the collar, on the theory
       that a sumo has no neck. All that did was bury the muzzle, so the
       skull read as a bump on top of the shoulder rather than as a head.
       Two units up and the muzzle and the near ear both stand clear —
       and with the mane gone (see `look`) there is finally a notch under
       the jaw in the black shape. He still has the slope: it comes from
       the girth and the shoulder, which are untouched.

       The leg splay is the widest on the roster: at 25 degrees his feet
       are 31 units apart against everybody else's twenty. Splaying legs
       SHORTENS them, so the pelvis had to come back up to compensate —
       py went to -5.4 first and he ended up shin-deep in the boards on
       the back half of the walk cycle, which the floor test caught. */
  stance: { torso: 2, py: -1.6, armF: [22, -50], armB: [14, -34],
            legF: [25, -25], legB: [-24, 22], head: [1.4, 2.0, 0] },
  /* limbW was 1.22, and that is what cost him his hands. R_END is
     3.4 * s * girth * limbW, so at 1.22 the wrist was over seven units
     across and `fistPath` — which is drawn at HAND, not at R_END — sat
     entirely inside the forearm's own silhouette. He was the one cat on
     the roster with no readable fist: both arms simply stopped in a ball.
     At 0.98 the forearm tapers past the knuckles and the wedge stands
     proud of it. The heaviness was never in his wrists; girth 1.62 and
     shoulder 1.36 are untouched and still do all of it. */
  build: { s: 1.12, girth: 1.62, limb: 0.88, head: 0.94, muscle: 0.45,
           headShape: 'broad', ear: 'wide', shoulder: 1.36, waist: 1.30, limbW: 0.98 },

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
         crimson, one gold knot. */
      var TAPE = '#8f2438';
      var GOLD = '#f2c94c';

      /* THE MANE IS GONE, and that is what gave him a head.

         He used to wear the rig's `mane` — a ring of fur centred between
         neck and skull and wider than the chest. It did give him sloped
         shoulders, and it also filled the whole gap under his jaw, so in
         black the head was not a head, it was a bump on top of the
         shoulder mass. Taking it off is the single change that put a
         notch between jaw and shoulder in the silhouette.

         A dark collar drawn at the neck instead was tried twice, once
         tucked in and once bulging up behind the skull like withers, and
         neither one is visible: at girth 1.62 the shoulders sit well
         INSIDE the body outline, so anything laid over them is a costume
         drawn inside the silhouette — the exact failure the brief opens
         with. His slope now comes from the head delta and the girth,
         which cost nothing and can be seen. */

      /* The spine frame: t runs pelvis(0) to neck(1), w is across it,
         positive forward. Same trick as Gracie's gi. */
      var p = j.pelvis, n = j.neck;
      var dx = n.x - p.x, dy = n.y - p.y;
      var L = Math.hypot(dx, dy) || 1;
      var fx = dy / L, fy = -dx / L;
      function T(t, w) { return { x: p.x + dx * t + fx * w,
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
      var a1 = T(0.09, f.waistW * 1.62);     /* front edge of the belt       */
      var a0 = T(0.01, -f.hipW * 0.10);      /* back edge, at the spine       */
      /* Length. At 32 it reached the floor and hid both legs, so he
         walked without any legs visible — a character whose legs you
         cannot see does not read as moving. Ending it above the knee
         leaves the crimson ankle wraps swinging under the hem, which is
         where the walk cycle now lives. */
      var D = 23 * f.s;
      var flare = 4.2 * f.s;
      /* IT HAS TO SWING. This was a board: the whole panel was built from
         fixed constants, so the largest piece of costume on the roster held
         one shape through the walk, the dash and the jump. A stiff apron
         still swings — it trails behind the hips and rides UP as it goes,
         because it is pivoting about the belt rather than stretching. So
         the hem alone takes `f.sway` and lifts by the same amount either
         way, and the top edge on the belt does not move at all. Only the
         hem, deliberately: swinging the top edge as well shears the panel
         and it stops looking attached to him.

         The LIFT is the read that matters, and it is the one that cannot
         be wrong: a stiff panel rises whichever way the man carrying it
         is going, so `Math.abs`. The sideways swing follows the roster's
         convention — positive sway offset towards the back, the same as
         Ruby's hide and Luigi's scarf. Worth knowing before changing it:
         the rig builds sway as `vx * facing * -0.9`, so walking forward
         makes it NEGATIVE, and the panel therefore leans forward rather
         than trailing. That reads fine on him — he only reaches any real
         speed inside the belly bump, where a skirt shoved out ahead of
         the belly is what you want anyway — but it is a rig-wide sign and
         not something to correct in one cat file. */
      var swing = -f.sway * 1.1 * f.s;
      var lift  = Math.abs(f.sway) * 0.62 * f.s;
      var bx1 = a1.x + flare + swing, by1 = a1.y - D + lift;
      var bx0 = a0.x - flare * 0.7 + swing, by0 = a0.y - D * 0.86 + lift;
      /* The apron hangs from the belt, and the belt follows the pelvis —
         so on a crouch or a sweep it would hang thirty units THROUGH the
         floor, which is what the first long version did. y = 0 is the
         sole plane, so the hem is clamped just above it: standing it
         brushes the ground, crouching it bunches up short, which is what
         a stiff apron does when it lands on something. */
      var FLOOR = 1.6 * f.s;
      if (by1 < FLOOR) by1 = FLOOR;
      if (by0 < FLOOR) by0 = FLOOR;
      function hem(t, lift) {
        return { x: bx1 * t + bx0 * (1 - t),
                 y: by1 * t + by0 * (1 - t) + lift * f.s };
      }
      /* The two notches used to sit at fixed t, so even the fringe was the
         same drawing every frame. They drift a little with the clock and a
         little with the swing — a couple of pixels, which is all it takes
         at ninety pixels tall for the hem to stop looking painted on. */
      var drift = Math.sin(f.t * 0.06) * 0.018 + f.sway * 0.006;
      /* WHERE THE APRON IS PAINTED, and why it is painted twice.

         It sits on 'front', which is right: from the side a sagari hangs
         off the front of the belt and the near leg passes behind it.
         (Moving it to 'body' was tried — the near thigh then covers the
         whole panel and the one thing that makes him a bell is gone.)

         But `drawForm` runs after every layer and paints the near thigh's
         quad and hamstring on top, clipped to the leg — so a mid-grey
         rounded blob sat across the lower half of the red panel in every
         standing and guarding pose. At 1x that is a stain or a hole in
         the garment, not a leg. Nothing in a cat file can be drawn after
         drawForm except `overlay`, so the panel goes in here FLAT — one
         cheap fill, which is all the shape list needs it for, since what
         it is really doing there is putting the apron into the contour
         and into the silhouette — and `overlay` lays the three tones and
         the grooves back over the top afterwards. `stash` is how the two
         halves agree about the path; build and paint run back to back in
         one drawCat call, so there is nothing to go stale between them. */
      function apronPath(cx) {
        var h;
        cx.beginPath();
        cx.moveTo(a0.x, a0.y);
        cx.lineTo(a1.x, a1.y);
        cx.lineTo(bx1, by1);
        /* the hem: two notches, so it reads as stiff panels */
        h = hem(0.70 + drift, 3.6); cx.lineTo(h.x, h.y);
        h = hem(0.64 + drift, 0);   cx.lineTo(h.x, h.y);
        h = hem(0.36 - drift, 3.6); cx.lineTo(h.x, h.y);
        h = hem(0.30 - drift, 0);   cx.lineTo(h.x, h.y);
        cx.lineTo(bx0, by0);
        cx.closePath();
      }
      /* the grooves. Drawn as strokes because a filled slot this narrow
         would vanish the moment the sprite is scaled down. */
      function groovePath(cx) {
        var h;
        cx.beginPath();
        cx.moveTo(a1.x * 0.72 + a0.x * 0.28, a1.y * 0.72 + a0.y * 0.28);
        h = hem(0.67 + drift, 0); cx.lineTo(h.x, h.y);
        cx.moveTo(a1.x * 0.38 + a0.x * 0.62, a1.y * 0.38 + a0.y * 0.62);
        h = hem(0.33 - drift, 0); cx.lineTo(h.x, h.y);
      }
      A.add('front', apronPath, MAW, { flat: true });
      stash = {
        step: 1.75 * f.s,
        groove: groovePath,
        grooveCol: A.shade(MAW, 0.55), grooveW: Math.max(1, 1.3 * f.s),
        /* Everything that lies ON the apron, in the order it is painted.
           The tones are worked out here because only `pieces` is handed
           the lamp; `overlay` gets raw canvas and nothing else. */
        items: [{ path: apronPath, band: true,
                  shadow: A.shade(MAW, 0.46), base: MAW, lit: A.lit(MAW, 0.36) }]
      };

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
         as one red slab with no waist in it.

         The back of the band is deliberately tighter than the front. Run
         out to the same width both ways and the tail end pokes out past
         his back as a crimson wedge, which reads as a second tail. */
      A.add('front', function (cx) {
        A.smooth(cx, [
          T(0.00, f.hipW * 1.28), T(0.13, f.hipW * 1.44),
          T(0.26, f.waistW * 1.54), T(0.27, -f.waistW * 1.14),
          T(0.12, -f.hipW * 1.08), T(-0.01, -f.hipW * 1.00)
        ]);
      }, MAW, { band: true, edge: true });

      /* the upper wind, a hair narrower and a shade darker, so the two
         read as cloth lying over cloth rather than one thick slab */
      A.add('front', function (cx) {
        A.smooth(cx, [
          T(0.27, f.waistW * 1.52), T(0.38, f.waistW * 1.40),
          T(0.39, -f.waistW * 1.06), T(0.28, -f.waistW * 1.12)
        ]);
      }, MAW_D, { band: true, edge: true });

      /* --- the knot ---------------------------------------------------

         This was a regular hexagon with a lit hexagon inside it, straight
         edges, centred on the belt — which at game size is an inventory
         icon glued to a cat, and the decal failure the brief names by
         name. A knot is not a regular anything: it is an off-centre lump
         with the cord going in one side and two short ends hanging out of
         the bottom, and it is the asymmetry that says "tied" rather than
         "printed".

         It stays gold. He is a very dark cat on mostly dark stages and
         this is the one bright thing on him — it is how your eye finds
         him across the screen, and swapping it for crimson lost him. */
      var pc = T(0.13, f.hipW * 1.22);
      function knotPath(cx) {
        A.smooth(cx, [
          { x: pc.x - 4.6 * f.s, y: pc.y + 1.6 * f.s },
          { x: pc.x - 1.6 * f.s, y: pc.y + 6.0 * f.s },
          { x: pc.x + 3.4 * f.s, y: pc.y + 4.6 * f.s },
          { x: pc.x + 5.4 * f.s, y: pc.y - 0.6 * f.s },
          { x: pc.x + 2.2 * f.s, y: pc.y - 4.4 * f.s },
          { x: pc.x - 3.4 * f.s, y: pc.y - 3.0 * f.s }
        ]);
      }
      /* the two ends, falling out of the bottom of it and swinging with
         the apron they lie on. Different lengths on purpose — a matched
         pair reads as a bow tie. */
      function endLong(cx) {
        A.capsule(cx, { x: pc.x + 1.2 * f.s, y: pc.y - 2.0 * f.s },
                      { x: pc.x + 2.6 * f.s + swing * 0.5, y: pc.y - 9.6 * f.s },
                  2.4 * f.s, 1.5 * f.s);
      }
      function endShort(cx) {
        A.capsule(cx, { x: pc.x - 2.0 * f.s, y: pc.y - 1.8 * f.s },
                      { x: pc.x - 3.2 * f.s + swing * 0.5, y: pc.y - 6.2 * f.s },
                  2.1 * f.s, 1.3 * f.s);
      }
      /* The knot lies ON the apron, so it has to be repainted with it —
         otherwise the overlay's crimson buries the one bright thing on
         him, which is what happened the first time it was tried. Flat in
         the shape list for the contour, three tones in the overlay. */
      A.add('front', knotPath,  GOLD, { flat: true });
      A.add('front', endLong,   A.shade(GOLD, 0.24), { flat: true });
      A.add('front', endShort,  A.shade(GOLD, 0.38), { flat: true });
      stash.items.push(
        { path: endLong,  flat: true, base: A.shade(GOLD, 0.24), edge: true },
        { path: endShort, flat: true, base: A.shade(GOLD, 0.38), edge: true },
        { path: knotPath, band: true, edge: true,
          shadow: A.shade(GOLD, 0.46), base: GOLD, lit: A.lit(GOLD, 0.36) });

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
      /* Radius, second time of asking. R_END * 0.86 was still wider than
         the forearm it was wrapped round, so the band filled the limb
         edge to edge — a solid maroon disc in the middle of a grey oval,
         which at game size is what a WOUND looks like, not a wrap. The
         band has to leave fur showing on both sides of it. Short, too:
         starting at 0.74 rather than 0.66 keeps it near the wrist. */
      wrap('front', j.elbF, j.handF, 0.74, 0.96, f.R_END * 0.62, TAPE);
      wrap('front', j.kneeF, j.footF, 0.62, 0.90, f.R_END * 0.68, TAPE);
      /* Only the far ANKLE. A far-wrist wrap has to go on 'body' — there
         is no layer between the far limbs and the torso — and on a punch
         the far hand is behind the chest, so it came out as a crimson
         blob sitting on his belly. The far foot is never behind the
         torso, so that one is safe. */
      wrap('body',  j.kneeB, j.footB, 0.62, 0.90, f.R_END * 0.62, A.shade(TAPE, 0.30));

      /* --- the topknot -----------------------------------------------

         Head-layer pieces are drawn in the skull's own frame: origin at
         the head, +y up, +x the way he faces, r the skull radius. It sits
         between the ears and leans back, which puts a notch in the top of
         his silhouette that nobody else on the roster has. */
      /* It was a capsule of even thickness leaning back a few degrees, and
         at game size it came out as a grey PIPE growing out of his
         forehead, overlapping the near ear so the two read as one horn.
         The note under the old version said that was the thing to avoid;
         it was not avoided, because a capsule with the same radius at
         both ends cannot read as hair.

         Two changes. It TAPERS — r * 0.34 at the root against r * 0.16 at
         the tip, so it comes to a point — and it lies much further back,
         tip at -r * 0.86 rather than -r * 0.44, which walks it off the
         near ear and puts a clean V between the two of them in the black
         shape instead of a second ear-sized lump. */
      var r = f.headR;
      A.add('head', function (cx) {
        A.capsule(cx, { x: -r * 0.06, y: r * 0.72 }, { x: -r * 0.86, y: r * 1.62 },
                  r * 0.34, r * 0.16);
      }, f.fur, { band: true });
      /* the tie at its base. Kept narrow: at r * 0.26 it was as fat as
         the tuft and the whole thing read as a red pipe coming out of
         his head rather than as hair bound at the root. */
      A.add('head', function (cx) {
        A.capsule(cx, { x: -r * 0.02, y: r * 0.80 }, { x: -r * 0.20, y: r * 0.98 },
                  r * 0.32, r * 0.28);
      }, MAW, { edge: true, flat: true });
    },

    /* The apron again, after `drawForm` has had its go at the near leg.
       This is `celFill`'s recipe written out by hand: fill the whole panel
       in shadow, clip to it, then lay the base tone back over shifted
       towards the light, and the lit band once more on top of that. The
       light direction is the rig's own (0.52, 0.85) — a piece of costume
       lit by a different lamp from the shoulder above it is worse than a
       piece of costume with no shading at all. */
    overlay: function (ctx, j, fig) {
      var st = stash;
      if (!st) return;
      var dx = 0.52 * st.step, dy = 0.85 * st.step;
      ctx.save();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (var i = 0; i < st.items.length; i++) {
        var it = st.items[i];
        if (it.flat) { it.path(ctx); ctx.fillStyle = it.base; ctx.fill(); }
        else {
          it.path(ctx); ctx.fillStyle = it.shadow; ctx.fill();
          ctx.save();
          it.path(ctx); ctx.clip();
          ctx.translate(dx, dy);
          it.path(ctx); ctx.fillStyle = it.base; ctx.fill();
          ctx.translate(dx * 1.15, dy * 1.15);
          it.path(ctx); ctx.fillStyle = it.lit; ctx.fill();
          ctx.translate(dx * 0.9, dy * 0.9);
          it.path(ctx); ctx.fillStyle = it.base; ctx.fill();
          ctx.restore();
        }
        if (it.edge) {
          it.path(ctx); ctx.strokeStyle = fig.line;
          ctx.lineWidth = 1.15 * fig.s; ctx.stroke();
        }
        /* the grooves go on the apron, under everything lying on it */
        if (i === 0) {
          it.path(ctx); ctx.strokeStyle = fig.line;
          ctx.lineWidth = 1.15 * fig.s; ctx.stroke();
          st.groove(ctx); ctx.strokeStyle = st.grooveCol;
          ctx.lineWidth = st.grooveW; ctx.stroke();
        }
      }
      ctx.restore();
    }
  },

  displayName: 'MARIO',
  subtitle: 'The Immovable',
  blurb: 'Enormous, and entirely aware of it. Getting to you takes a while. Being under him does not take long at all.',
  difficulty: 2,
  palette: {
    /* Nothing in the kit at all, and both absences are deliberate.

       No `belt`: the rig's belt is a flat rectangle painted on after the
       fills, and a rectangle cannot be wound round anything — the mawashi
       in `look` is real geometry and goes into the silhouette, which is
       the entire point of him.

       No `mane` either, as of this pass. It was there to fill the gap
       between skull and chest so his shoulders sloped straight off his
       ears — and it worked, at the price of making the head unfindable in
       black. See the note in `look`. */
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
