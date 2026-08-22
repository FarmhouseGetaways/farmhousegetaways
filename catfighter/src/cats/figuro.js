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
  /* Thicker through the body and a size smaller in the head than he was.
     Two reasons, and they are the same reason. A boxer at this weight is
     mostly chest, and a small head next to a head-sized mitt makes the mitt
     look enormous — the glove is measured off the skull, so shrinking the
     skull is free emphasis. It also got him out from under Gracie: the
     roster test counts how many silhouette marks two cats share, and at
     girth 1.12 with a 1.00 head the pair of them differed only in the skull
     and the limb weight. */
  build: { s: 1.00, girth: 1.24, limb: 0.98, head: 0.94, muscle: 1.45,
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
      /* THREE materials: the red of the kit, the navy of the trunks, and
         one oatmeal for the towel. Everything else is a shade of one of
         those.

         The waistband was sand to begin with, on the theory that a boxer's
         trunks carry a gold band. It disappeared: his belly is cream and
         his fur is tan, and a sand band across the middle of that is three
         near-identical values stacked on top of each other. Made the glove
         red it survives the drop to 384x224, AND it ties the gloves, the
         boots, the band and the towel stripe into one kit rather than four
         separate ideas that happen to be on the same cat. */
      var GLOVE = '#c0392f', CUFF = '#8d2622';
      /* The far mitt in its own darker red. Both gloves the same colour and
         both up by the same cheek is one red mass with a seam in it — the
         near one has to be the lit one and the far one the shadowed one, or
         the guard has no depth and there is no point drawing it twice. */
      var GLOVE_B = '#8e2a26', CUFF_B = '#6b1d1c';
      var TRUNK = '#232c4c', BAND = '#c0392f', TRIM = '#8d2622';
      var BOOT = '#c0392f', BOOTTOP = '#8d2622';
      /* The towel came down from near-white. Measured against the roster he
         was the palest cat in the game — 83 median luminance against 53 for
         the twins — and on the bright stages (the pool floor reads 175) a
         cream towel the size of his back is the brightest thing in the frame
         and the eye goes to it rather than to him. A gym towel is not white
         anyway; it has been through a hot wash a hundred times. Taken all
         the way down to #bdb08c it stopped being a towel and became part of
         his coat, so this is the value that keeps both. */
      var TOWEL = '#cfc3a2';

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

         THREE pieces per hand, and every one of them is in the outline:
         the mass, a thumb lobe proud of the leading edge, and a cuff
         narrower than the mitt so there is a wrist. That is the whole list
         on purpose. It used to be five — a cream wrap showing past the cuff
         and a pale lace panel along the knuckles as well — and both were
         sub-pixel at 384x224: invisible in every 1x screenshot, a smear of
         cream on his chest at 8x, and four clips and four fills a frame on
         what was then the most expensive cat in the game.

         The mitt straddles the wrist rather than sitting in front of it.
         Drawn forward of the joint — which is where a glove actually is —
         the fur fist rig.js draws at `handF` poked out round the back of it
         as a tan lump on his chest in every guard pose. The back of the ring
         and the cuff between them now bury that fist completely.        */
      /* The mass. Fat and round at the knuckles, pinched in towards the
         wrist — a glove is a ball on a stick, and the pinch is what stops it
         reading as a cushion. The first version was near enough a circle at
         both ends and, with a cuff the same width beside it, came out as an
         armchair: three rounded rectangles of a size, stacked. */
      var ring = [[-0.78, 0.44], [-0.26, 0.92], [0.42, 1.06], [1.00, 0.88],
                  [1.30, 0.20], [1.22, -0.48], [0.76, -0.94],
                  [0.06, -1.06], [-0.54, -0.78], [-0.82, -0.30]];

      function glove(layer, hand, elb, r, mit, cuf, far) {
        var o = frame(elb, hand);

        A.add(layer, function (cx) {
          var pts = [], i;
          for (i = 0; i < ring.length; i++) pts.push(P(o, hand, ring[i][0] * r, ring[i][1] * r));
          A.smooth(cx, pts);
        }, mit, far ? { flat: true, edge: true } : { band: true, edge: true });

        /* THE THUMB. A round lobe standing proud of the leading edge with a
           notch between it and the mass — the same trick fistPath uses, and
           the one shape that separates a boxing glove from a mitten. It was a
           capsule before, which is a stadium: at 1:1 it read as a second
           smaller rounded rectangle parked beside the first. Flat because it
           is about five pixels across in the finished picture and the clip a
           cel-shaded fill costs buys nothing at that size. */
        A.add(layer, function (cx) {
          A.ellipse(cx, P(o, hand, 0.30 * r, -0.94 * r).x,
                        P(o, hand, 0.30 * r, -0.94 * r).y, r * 0.46, r * 0.42);
        }, mit, { flat: true, edge: true });

        /* THE CUFF. Half the width of the mitt, so the outline steps IN at
           the wrist. Matching the mitt's width — which is what it did — the
           glove has no wrist at all and the whole arm ends in one slab.
           The lace panel that used to sit along the knuckles is gone: it was
           sub-pixel at 384x224, invisible in every 1x screenshot, and cost
           two clips and two fills per hand on a cat that was the most
           expensive on the roster. The overlay ticks say `laces` for free. */
        A.add(layer, function (cx) {
          A.smooth(cx, [P(o, hand, -1.30 * r, 0.44 * r), P(o, hand, -0.72 * r, 0.62 * r),
                        P(o, hand, -0.66 * r, -0.62 * r), P(o, hand, -1.28 * r, -0.42 * r)]);
        }, cuf, far ? { flat: true, edge: true } : { band: true, edge: true });
      }

      /* BOTH gloves go on 'front', the far one first so the near one paints
         over it. The far one was on 'body' to begin with, which is the
         honest depth — after the torso, under the leading arm — and it was
         invisible: the near forearm crosses the chest in a peek-a-boo guard
         and ate the whole mitt, and what was left of it was painted over
         again by the tabby stripes, which are laid down after the body
         layer and clipped inside it. Put back on 'body' a second time, in
         August 2026, to check: the chest came out a flat cream-and-tan mush
         with no red in it at all. It stays on 'front'.

         So the far mitt cheats forward one layer. It is smaller and it is
         overlapped by the near one, which is all the depth cue this needs at
         ninety pixels tall, and the result is what the guard is for: TWO red
         masses stacked by his cheek rather than one and a rumour. */
      /* Sized off the skull on purpose: the mitt comes out wider than his
         head, which is the whole brief and is also true of a real 16oz
         glove next to a face. At 0.88 — the first go — the two lobes merged
         into the skull in the silhouette test and he came out a blob with
         boots on. */
      var gr = f.headR * 1.16;
      /* Both mitts are the SAME object at two sizes — the far one at 0.84
         because it is further from the camera — and `far` also fills it
         flat. They used to be a head-sized red mass on the near hand and, on
         the far one, a version with different pieces in it, which read as a
         different object rather than the other half of a pair.

         Going smaller than this was tried, at 0.72, on the reasoning that a
         far-side glove should be modest. rig.js draws the belly patch AFTER
         the costume's front layer, so at that size the far mitt was cut in
         half by it and read as a stray dark chip rather than the other
         glove. 0.84 clears the patch. */
      glove('front', j.handB, j.elbB, gr * 0.84, GLOVE_B, CUFF_B, true);
      glove('front', j.handF, j.elbF, gr, GLOVE, CUFF);

      /* ================= THE BOOTS ==================================

         Up over the calf, with a folded collar at the top. The collar is
         what makes them boots rather than red socks: a hard band across the
         leg two thirds of the way up, wider than the leg it sits on, so the
         shin steps out of the silhouette instead of tapering into it. */
      function boot(layer, knee, foot, collar) {
        var o = frame(knee, foot);
        var top = { x: knee.x + (foot.x - knee.x) * 0.40,
                    y: knee.y + (foot.y - knee.y) * 0.40 };

        var opt = collar ? { band: true, edge: true } : { flat: true, edge: true };
        A.add(layer, function (cx) {
          A.limb(cx, top, foot, f.R_MID * 1.22, f.R_END * 1.44, 0.35, 'shin');
        }, BOOT, opt);

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
        }, BOOT, opt);

        if (collar) A.add(layer, function (cx) {
          A.smooth(cx, [P(o, top, -0.42 * f.R_MID, 1.50 * f.R_MID),
                        P(o, top, 0.62 * f.R_MID, 1.36 * f.R_MID),
                        P(o, top, 0.66 * f.R_MID, -1.36 * f.R_MID),
                        P(o, top, -0.40 * f.R_MID, -1.50 * f.R_MID)]);
        }, BOOTTOP, { flat: true, edge: true });
      }
      /* The far boot goes without a collar. It is four pixels of dark red on
         a leg already behind the near one, and it cost a clip and two fills
         on the cat that was the most expensive on the roster. */
      boot('body', j.kneeB, j.footB, false);
      boot('front', j.kneeF, j.footF, true);

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

         It is drawn to the HIP width, not the waist width. Sized off
         `waistW` — which is 0.82 on this build, because he has a taper — it
         came out half the width of the trunks it was supposed to be
         finishing, sat in the middle of the hip like a patch, and was
         hidden behind the near forearm into the bargain. See the colour
         note at the top for why it is red. */
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
      }, TRIM, { flat: true });

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
      /* Anchored high: the towel has to break the SHOULDER LINE, not start
         under it. In the silhouette test he was a smooth dome from ear to
         hip — every other cat on the roster has something happening at the
         top of the outline (Gracie's ties, Mario's topknot, the tall ears on
         the twins) and he had nothing. Slung up level with the base of the
         skull, the roll is that something, and it is the most boxer-ish
         shape available. */
      var tw = { x: nk.x - cw * 1.02, y: nk.y + cw * 0.62 };   /* clear of the back */
      /* The hanging end, and its direction is the whole silhouette argument.
         It used to drop almost straight down the spine — honest gravity, and
         invisible: the back of a cat this thick is wider than the towel, so
         in black it was a flat wall from shoulder to hip with nothing
         happening on it. Flung well back it clears the body and finishes in a
         squared hem past the hip, which is the second thing on his outline
         that is not cat-shaped. Swung out further still (1.9 chests) it left
         the figure altogether and read as a diving board. */
      var te = { x: tw.x - cw * 1.06 + f.sway * 1.3, y: tw.y - cw * 2.80 };
      A.add('back', function (cx) {
        slab(cx, tw.x, tw.y, te.x, te.y, cw * 0.34, cw * 0.30, cw * 0.13);
      }, TOWEL, { band: true, edge: true });
      /* one red stripe above the hem. Every towel in every corner of every
         gym has one, it is a solid shape rather than a line so it survives
         the drop to 1:1, and it pulls the towel into the same kit as the
         gloves instead of leaving it a loose white rag. */
      /* Laid ALONG the towel at 0.80 of its length rather than at fixed world
         coordinates — pinned to the screen it stayed put when the towel was
         flung back and ended up as a red chip floating beside his hip. */
      A.add('back', function (cx) {
        var dx = te.x - tw.x, dy = te.y - tw.y;
        var ax = tw.x + dx * 0.78, ay = tw.y + dy * 0.78;
        slab(cx, ax, ay, ax + dx * 0.10, ay + dy * 0.10, cw * 0.32, cw * 0.31, 0);
      }, '#c0392f', { flat: true, edge: true });
      /* The roll over the shoulder — what makes the slab read as draped on
         him rather than hung on a hook behind. Its BACK end is lifted well
         above the front one on purpose: laid flat along the shoulder it was
         inside the outline and, in black, he was one smooth dome from ear to
         hip with nothing happening at the top of him. Tipped up it puts a
         hump behind the skull with a notch between the two, which is the
         cheapest silhouette feature available and the most boxer-ish. */
      A.add('back', function (cx) {
        A.capsule(cx, { x: nk.x - cw * 0.02, y: nk.y + cw * 0.80 },
                      { x: nk.x - cw * 1.10, y: nk.y + cw * 1.06 },
                  cw * 0.26, cw * 0.34);
      }, TOWEL, { band: true, edge: true });

      /* A short end of the towel hanging over the FRONT of that shoulder
         was tried, to say draped rather than hung on a hook. It landed on
         the chest, took the near arm's cast shadow across it, and read as a
         satchel — a hard dark rectangle in the one place the eye goes. The
         roll over the shoulder does the same job without putting anything
         in front of him, so there is only the roll and the back end now. */
    },

    /* The laces. Three ticks across the near mitt, one pixel wide, drawn
       free-hand over the finished cat because a stroke added to the shape
       list gets the contour pass too and comes out as three fat black bars.
       They are the only thing on him that is detail rather than shape, and
       they earn it: laces are what the eye checks a boxing glove against —
       which is also why the pale lace PANEL under them could go without
       being missed, and these could not.

       The radius follows `gr`, not the old 0.88 of a skull: measured off the
       smaller number the ticks landed inside the mitt in a huddle rather
       than across its knuckles. */
    overlay: function (ctx, j, fig) {
      var s = fig.s;
      ctx.save();
      ctx.strokeStyle = 'rgba(60,40,30,.65)';
      ctx.lineWidth = Math.max(1, 0.9 * s);
      ctx.lineCap = 'butt';
      /* The near mitt only. The far hand's ticks landed on his chest as
         often as on the glove — it is behind the near one — and three more
         strokes a draw is three more on a cat that was already the most
         expensive to draw on the roster. */
      [[j.handF, j.elbF, 1.16]].forEach(function (h) {
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
    fur: '#9c7c4e', fur2: '#7d6039', belly: '#e4d5b2', marks: '#4c3520',
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
