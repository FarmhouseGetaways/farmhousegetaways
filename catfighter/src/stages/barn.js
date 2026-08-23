/* =======================================================================
   1 — THE GAME BARN
   Warm, loud, and full of glowing machines. The crowd is on the hay bales.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  /* A prize cat in the claw machine. Two ears and a face is enough at five
     pixels across — anything more turned into a smudge. */
  /* Crowd palettes steered towards the darker cats. CROWD_COLOURS runs cream
     to charcoal and the pale half of it disappears against a straw bale — a
     row of faint smudges was what the first crowd here actually looked like.
     `spectator` takes an index and reduces it modulo eight, so these are the
     classes that land on a cat you can see.

     The first cut of this list kept the tan (class 5) as well, on the theory
     that four palettes beat two. Tan on straw is the same value AND the same
     hue and it was still a smudge; ginger (class 1) is the same value and a
     different hue, and that one does read. Kept: ginger, charcoal, brown,
     grey. Dropped: tan, sand, cream, pale grey. */
  var DARKS = [1, 2, 3, 6, 9, 10, 11, 14, 17, 18, 19, 22];

  /* A seated cat needs the bale to go dark where it sits on it. Without this
     a mid-tone cat and a lit straw top face meet with no edge at all and the
     crowd reads as lumps in the hay — which is what four rounds of palette
     fiddling failed to fix, because the problem was never the palette. */
  function seatShadow(ctx, x, y, s) {
    ctx.fillStyle = 'rgba(46,28,10,.42)';
    ctx.beginPath();
    ctx.ellipse(x, y - 0.5, 6.4 * s, 2.2 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* A cat watching from BEHIND a bale — ears, the top of a head, and two
     paws hooked over the edge, and nothing else.

     Two jobs. It fills the long bare runs of bale top that a row of seated
     cats leaves between them, at about a fifth of what a full `spectator`
     costs. And it breaks the straight lit line along the top of every bale,
     which is the thing that made the row read as a wall of boxes however
     much the boxes varied. Cheap enough to have a lot of. */
  var PEEK = [['#3c3c46', '#e6e4de'], ['#8a6a4f', '#f0e3d2'],
              ['#6e6e7a', '#e4e2dc'], ['#e09a55', '#f2e1ca']];
  function peeker(ctx, x, y, s, i, t) {
    var pal = PEEK[Math.abs(i) % 4];
    var bob = Math.sin(t * 0.05 + i) * 0.8 * s;
    var yy = y + bob;
    ctx.fillStyle = pal[0];
    ctx.beginPath();                                    /* ears */
    ctx.moveTo(x - 3.6 * s, yy - 1.5 * s); ctx.lineTo(x - 2.6 * s, yy - 6 * s);
    ctx.lineTo(x - 0.6 * s, yy - 2.2 * s); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 3.6 * s, yy - 1.5 * s); ctx.lineTo(x + 2.6 * s, yy - 6 * s);
    ctx.lineTo(x + 0.6 * s, yy - 2.2 * s); ctx.closePath(); ctx.fill();
    ctx.beginPath();                                    /* the top of the head */
    ctx.arc(x, yy, 4 * s, Math.PI, 0); ctx.fill();
    ctx.fillRect(x - 4 * s, yy, 8 * s, 1.2 * s);
    ctx.fillStyle = 'rgba(24,18,16,.92)';               /* two eyes, just clear */
    ctx.fillRect(x - 2.2 * s, yy - 1.8 * s, 1.3 * s, 1.4 * s);
    ctx.fillRect(x + 0.9 * s, yy - 1.8 * s, 1.3 * s, 1.4 * s);
    ctx.fillStyle = pal[1];                             /* paws over the edge */
    ctx.fillRect(x - 5.6 * s, yy + 0.4 * s, 2.4 * s, 2 * s);
    ctx.fillRect(x + 3.2 * s, yy + 0.4 * s, 2.4 * s, 2 * s);
  }

  /* K.glow builds a radial gradient and rasterises it on the spot, and this
     stage asks for thirty-six of them a frame — string lights, marquees,
     screens, lanterns, two signs and the moon. Measured with the calls
     stubbed out it was 2.2ms of a 9.4ms frame, comfortably the most
     expensive thing in the barn and more than the whole floor costs.

     Every one of them is the same handful of soft discs over and over, so
     they are baked once into little canvases and blitted from then on. The
     picture is identical; the gradient work happens about sixteen times for
     the life of the process instead of thirty-six times a second.

     Blitted 1:1 with the logical pixel grid deliberately. A glow sprite
     drawn at a fractional scale is exactly the place smoothing would creep
     back into a game whose whole art direction is nearest-neighbour. */
  var glowCache = {};
  function softGlow(ctx, x, y, r, colour, alpha) {
    /* Canvas silently IGNORES a negative globalAlpha and keeps the previous
       value, which on the character card once put a solid white wedge across
       the screen. Anything that pulses gets clamped here instead. */
    if (!(alpha > 0)) return;
    var key = colour + '@' + r;
    var g = glowCache[key];
    if (!g) {
      var d = Math.ceil(r * 2);
      g = document.createElement('canvas');
      g.width = d; g.height = d;
      var gx = g.getContext('2d');
      var grad = gx.createRadialGradient(r, r, 0, r, r, r);
      grad.addColorStop(0, colour);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      gx.fillStyle = grad;
      gx.fillRect(0, 0, d, d);
      glowCache[key] = g;
    }
    ctx.save();
    ctx.globalAlpha = alpha > 1 ? 1 : alpha;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(g, Math.round(x - r), Math.round(y - r));
    ctx.restore();
  }

  /* Reused every frame rather than allocated — this runs sixty times a
     second and a fresh array a frame is free garbage nobody needs. */
  var seats = [], peeks = [];

  /* Where each lit cabinet throws its light on the boards. Collected in the
     cabinet pass and spent after the floor is down, because the floor is
     depth 1 and the cabinets are 0.42 — anything painted on the boards from
     inside the cabinet layer is buried by the boards a moment later. */
  var spills = [];

  /* One hay bale: a painted mass, two lines of twine, and a few straws off
     the top edge so the silhouette is not a perfect rectangle. */
  function bale(ctx, x, y, w, h, i) {
    /* Straw a step darker and a shade cooler than it was. The bale row is
       the band the fighters stand in front of, and at the old value it was
       the brightest large area in the picture after the floor — a tan cat
       like Ruby had nothing to be seen against. Twelve percent down is
       enough; the lit top faces `K.mass` puts on still carry the light. */
    K.mass(ctx, x, y, w, h,
           K.pick(i, 62, ['#b08b40', '#a68139', '#ba9549', '#9e7b33']),
           { top: 4, side: 5 });
    ctx.strokeStyle = 'rgba(90,64,20,.55)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x + 11, y); ctx.lineTo(x + 11, y + h);
    ctx.moveTo(x + w - 11, y); ctx.lineTo(x + w - 11, y + h);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(214,176,78,.75)'; ctx.lineWidth = 1;
    for (var st = 0; st < 5; st++) {
      var sx = x + K.vary(i * 5 + st, 63, 2, w - 2);
      ctx.beginPath();
      ctx.moveTo(sx, y);
      ctx.lineTo(sx + K.vary(i * 5 + st, 64, -3, 3), y - K.vary(i * 5 + st, 65, 2, 5));
      ctx.stroke();
    }
  }

  function plush(ctx, x, y, r, col) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y - r * 0.4); ctx.lineTo(x - r * 0.55, y - r * 1.5);
    ctx.lineTo(x - r * 0.1, y - r * 0.75); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + r * 0.9, y - r * 0.4); ctx.lineTo(x + r * 0.55, y - r * 1.5);
    ctx.lineTo(x + r * 0.1, y - r * 0.75); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(30,20,18,.8)';
    ctx.fillRect(x - r * 0.5, y - r * 0.2, 1, 1);
    ctx.fillRect(x + r * 0.35, y - r * 0.2, 1, 1);
  }

  CF.StageDefs = CF.StageDefs || {};
  CF.StageDefs.barn = {
    id: 'barn', name: 'THE GAME BARN',
    blurb: 'Arcade cabinets, string lights, and a full house on the hay bales.',
    /* the colour of the air here — see K.deepen */
    air: { air: '#6b4038', haze: 0.07, floorDark: 0.34, horizon: 128 },
    init: function () {
      this.dust = new P({ count: 30, kind: 'dust', depth: 0.75, seed: 11,
                          band: [24, FLOOR_Y - 6], vx: 0.06, vy: -0.03,
                          size: 1.3, color: 'rgba(255,226,168,.85)', wobble: 1.4 });
    },
    drawBack: function (ctx, camX, t, mood) {
      /* --- the far wall: boards, not a flat field --- */
      K.sky(ctx, [[0, '#3a1b28'], [0.42, '#6f3038'], [1, '#a8583c']], 0, FLOOR_Y);
      K.layer(ctx, camX, 0.18, function () {
        K.repeatX(camX, 0, 17, function (x, i) {
          ctx.fillStyle = 'rgba(0,0,0,' + (0.05 + K.hash(i, 21) * 0.16).toFixed(3) + ')';
          ctx.fillRect(x, 0, 17, FLOOR_Y);
          if (K.chance(i, 22, 0.22)) {          /* a knot in the board */
            ctx.fillStyle = 'rgba(0,0,0,.22)';
            ctx.beginPath();
            ctx.ellipse(x + 8, K.vary(i, 23, 20, FLOOR_Y - 30), 2.2, 3.4, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });

      /* --- what is hung on the wall.

             At some scroll positions the back of this barn was a bare maroon
             field two feet wide — nothing to look at between one cabinet and
             the next. A barn wall is never bare: tack, wheels, a dartboard,
             rosettes from the county fair. Drawn BEFORE the loft so the loft
             opening covers them, which is right — you cannot hang a horseshoe
             over a hole. --- */
      /* Where the loft opening will land, worked out before the wall is
         dressed. The opening is 172 pixels of a 384-wide frame and it is
         drawn over the top of all this — a horseshoe or a dartboard behind
         it is paid for in full and never seen. Skipping those is a third of
         this layer for no change to the picture at all. */
      var loftX = 252 - camX * 0.03;
      K.layer(ctx, camX, 0.3, function () {
        K.repeatX(camX, 0, 46, function (x, i) {
          /* The margin is deliberately tighter than the opening's own 91:
             an item is up to 28 across and drawn centred, and at 105 the
             skip was eating the rosette board that fills the strip of wall
             between the claw machine and the loft. */
          if (x > loftX - 82 && x < loftX + 82) return;
          var wy = K.vary(i, 100, 28, 64);
          var kind = Math.floor(K.hash(i, 101) * 5);
          if (kind === 0) {                            /* a wagon wheel */
            var r = K.vary(i, 102, 13, 18);
            ctx.strokeStyle = '#71472a'; ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.arc(x, wy, r, 0, Math.PI * 2); ctx.stroke();
            ctx.lineWidth = 1.4;
            for (var sp = 0; sp < 8; sp++) {
              var a = sp * Math.PI / 4;
              ctx.beginPath();
              ctx.moveTo(x, wy); ctx.lineTo(x + Math.cos(a) * r, wy + Math.sin(a) * r);
              ctx.stroke();
            }
            ctx.fillStyle = '#8a5a34';
            ctx.beginPath(); ctx.arc(x, wy, 3, 0, Math.PI * 2); ctx.fill();
          } else if (kind === 1) {                     /* a dartboard, with a
                                                          dart still in it */
            [[12, '#2a2420'], [9, '#d8cbb0'], [6, '#2a2420'], [3, '#b8342f']]
              .forEach(function (ring) {
                ctx.fillStyle = ring[1];
                ctx.beginPath(); ctx.arc(x, wy, ring[0], 0, Math.PI * 2); ctx.fill();
              });
            ctx.strokeStyle = '#e8e0cc'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x + 4, wy - 3); ctx.lineTo(x + 11, wy - 9); ctx.stroke();
          } else if (kind === 2) {                     /* a hanging lantern */
            ctx.strokeStyle = '#3a2a1c'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x, wy - 16); ctx.lineTo(x, wy - 6); ctx.stroke();
            K.mass(ctx, x - 5, wy - 6, 10, 12, '#6b5230', { top: 2, side: 3, foot: false });
            ctx.fillStyle = 'rgba(255,206,120,.9)';
            ctx.fillRect(x - 3, wy - 4, 6, 8);
            softGlow(ctx, x, wy, 22, 'rgba(255,196,110,.8)', 0.24);
          } else if (kind === 3) {                     /* three horseshoes */
            for (var hs = 0; hs < 3; hs++) {
              var hx = x + (hs - 1) * 12, hy2 = wy + (hs === 1 ? -6 : 0);
              ctx.strokeStyle = '#8e8577'; ctx.lineWidth = 2.6;
              ctx.beginPath(); ctx.arc(hx, hy2, 5.5, Math.PI * 0.15, Math.PI * 0.85, true);
              ctx.stroke();
            }
          } else {                                     /* a rosette board */
            K.mass(ctx, x - 14, wy - 9, 28, 20, '#5a3520', { top: 2, side: 4, foot: false });
            for (var rz = 0; rz < 3; rz++) {
              var rx = x - 8 + rz * 8;
              ctx.fillStyle = K.pick(i * 3 + rz, 103, ['#c8354a', '#3f6fb0', '#d8a83a']);
              ctx.beginPath(); ctx.arc(rx, wy - 3, 3.2, 0, Math.PI * 2); ctx.fill();
              ctx.fillRect(rx - 2.4, wy - 1, 1.8, 6);
              ctx.fillRect(rx + 0.6, wy - 1, 1.8, 6);
            }
          }
        });
      });

      /* --- THE HAYLOFT, and the hoist.

             The far mass. It was a 124-pixel window and it read as a window;
             at 172 across and nearly half the height of the picture it reads
             as the whole open end of the barn with the night behind it. That
             is the scale contrast the reference lives on — the claw machine is
             enormous and near, this is enormous and far, and the fighters are
             small between them.

             The second loop lives here: a bale on the block and tackle,
             hauled up out of the dark and swung into the loft, over and over.
             It runs on a different period from the claw so the two never
             settle into lockstep. --- */
      K.layer(ctx, camX, 0.22, function () {
        var wx = K.at(camX, 0, 252) - camX * 0.03;
        var OW = 86, OT = 4, OB = 100;                 /* half-width, top, bottom */
        /* the opening itself */
        ctx.fillStyle = '#150e1c';
        ctx.fillRect(wx - OW - 5, OT - 2, OW * 2 + 10, OB - OT + 4);
        /* Night sky, DARKEST AT THE TOP. The comment here used to say "dark at
           the top so the moon has somewhere to be" and then the code put the
           palest blue up there and the deepest navy down at the hills — which
           is a daytime sky upside down, and it left the moon and the stars
           sitting on the brightest part of the picture with nothing to shine
           against. Zenith dark, horizon warm and pale, the way it actually
           goes; the hills gained their separation from the same change. */
        ctx.fillStyle = '#5b7ba8'; ctx.fillRect(wx - OW, OT, OW * 2, OB - OT);
        ctx.fillStyle = '#33507f'; ctx.fillRect(wx - OW, OT, OW * 2, (OB - OT) * 0.62);
        ctx.fillStyle = '#1d2c50'; ctx.fillRect(wx - OW, OT, OW * 2, (OB - OT) * 0.30);
        /* stars, and the moon with a halo */
        for (var s2 = 0; s2 < 16; s2++) {
          ctx.fillStyle = 'rgba(226,236,255,' + K.vary(s2, 80, 0.3, 0.85).toFixed(2) + ')';
          ctx.fillRect(wx - OW + 6 + K.hash(s2, 81) * (OW * 2 - 12),
                       OT + 3 + K.hash(s2, 82) * 44, 1, 1);
        }
        softGlow(ctx, wx + 44, OT + 22, 30, 'rgba(190,215,255,.7)', 0.3);
        ctx.fillStyle = '#e8eaf6';
        ctx.beginPath(); ctx.arc(wx + 44, OT + 22, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#cdd3e8';
        ctx.beginPath(); ctx.arc(wx + 47, OT + 19, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(wx + 40, OT + 26, 1.6, 0, Math.PI * 2); ctx.fill();
        /* THREE ridges of hill, not two, and the far one hazed towards the
           night sky. Two ridges of almost the same blue read as one shape
           with a wobble in it; the third gives the valley a floor and lets
           the middle one carry something. */
        [[0.55, '#33507f', 44, 8], [1.7, '#22375f', 56, 10], [1, '#141f39', 70, 13]]
          .forEach(function (r) {
            ctx.fillStyle = r[1];
            ctx.beginPath();
            ctx.moveTo(wx - OW, OB);
            for (var hx = -OW; hx <= OW; hx += 7) {
              ctx.lineTo(wx + hx, r[2] - Math.sin(hx * 0.04 + r[0] * 3) * r[3]
                                       - Math.sin(hx * 0.11) * r[3] * 0.4);
            }
            ctx.lineTo(wx + OW, OB); ctx.closePath(); ctx.fill();
          });

        /* THE NEIGHBOUR'S PLACE, out on the middle ridge.

           The window was a cold blue rectangle with a moon in it and nothing
           to find. One small warm light a long way off does more for the
           depth of a picture than another ridge of hill does — you read the
           distance from the fact that the whole farm is thirty pixels wide.
           It is drawn in silhouette apart from the windows, because at this
           size any detail on the walls is a smudge.

           Kept OFF the moon's side of the frame so the two bright things are
           not fighting each other. */
        /* The bales stacked in the mouth of the loft fill the bottom corners
           of the opening from y 38 down, and the first attempt put the farm
           squarely behind them. Everything out here has to live above the
           ridge line and inside the middle third. */
        var fmX = wx - 22, fmY = 50;
        ctx.fillStyle = '#0f1729';
        ctx.fillRect(fmX - 13, fmY - 9, 26, 11);              /* the house */
        ctx.beginPath();                                       /* its roof */
        ctx.moveTo(fmX - 15, fmY - 9); ctx.lineTo(fmX, fmY - 17);
        ctx.lineTo(fmX + 15, fmY - 9); ctx.closePath(); ctx.fill();
        ctx.fillRect(fmX + 16, fmY - 14, 8, 16);               /* the silo */
        ctx.beginPath();
        ctx.arc(fmX + 20, fmY - 14, 4, Math.PI, 0); ctx.fill();
        ctx.fillRect(fmX - 24, fmY - 6, 3, 8);                 /* a pole */
        /* the windows: two lit, one dark, because a farm at this hour is
           mostly asleep and the odd one out is what makes it read as lived in */
        softGlow(ctx, fmX - 2, fmY - 4, 17, 'rgba(255,196,110,.8)', 0.34);
        ctx.fillStyle = '#ffd487';
        ctx.fillRect(fmX - 9, fmY - 6, 4, 4);
        ctx.fillRect(fmX - 1, fmY - 6, 4, 4);
        ctx.fillStyle = '#2a3350';
        ctx.fillRect(fmX + 7, fmY - 6, 4, 4);

        /* the fence running away along the near ridge — the one thing in the
           window with perspective in it, so the eye reads the distance */
        ctx.strokeStyle = '#0d1526'; ctx.lineWidth = 1;
        ctx.beginPath();
        for (var fp = 0; fp < 9; fp++) {
          var fpx = wx - 60 + fp * 15, fpy = 60 + fp * 0.9;
          ctx.moveTo(fpx, fpy); ctx.lineTo(fpx, fpy - (4 + fp * 0.4));
        }
        ctx.moveTo(wx - 60, 57.5); ctx.lineTo(wx + 62, 65);
        ctx.stroke();
        /* a bird crossing the moon, once in a while */
        var bp = (t * 0.18) % 520;
        if (bp < 170) K.bird(ctx, wx - OW + bp * 0.9, OT + 20 + Math.sin(bp * 0.05) * 6, 0.8, t, 0, '#1a2338');

        /* bales stacked in the mouth of it — the thing that makes the opening
           read as a room you could stand in rather than a hole */
        /* Drawn through `bale`, not `K.mass`. As plain painted boxes they read
           as three blocks of butter stacked in a window — the twine and the
           loose straw off the top edge are the entire difference between a
           box and a bale, and they cost four strokes each. */
        bale(ctx, wx - OW + 4, OB - 34, 40, 34, 201);
        bale(ctx, wx - OW + 10, OB - 62, 32, 28, 202);
        bale(ctx, wx + OW - 46, OB - 28, 44, 28, 203);

        /* THE HOIST. Rope over the beam, a bale coming up on it. */
        var HC = 420, hu = (t % HC) / HC;
        var hoistX = wx - 8, beamY = OT - 2;
        var bY = hu < 0.62
          ? FLOOR_Y - 30 - (FLOOR_Y - 30 - (OB - 36)) * (hu / 0.62)   /* rising */
          : hu < 0.78 ? OB - 36                                        /* held  */
          : FLOOR_Y - 30 - (FLOOR_Y - 30 - (OB - 36)) * (1 - (hu - 0.78) / 0.22);
        var swingX = Math.sin(t * 0.017) * 4 * (hu < 0.78 ? 1 : 0.4);
        ctx.strokeStyle = 'rgba(28,20,14,.95)'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(hoistX, beamY); ctx.lineTo(hoistX + swingX, bY - 8); ctx.stroke();
        ctx.fillStyle = '#3a2418'; ctx.fillRect(hoistX + swingX - 5, bY - 12, 10, 6);
        K.mass(ctx, hoistX + swingX - 15, bY - 4, 30, 22, '#c2a04a', { top: 3, side: 4 });
        ctx.strokeStyle = 'rgba(90,64,20,.6)'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hoistX + swingX - 7, bY - 4); ctx.lineTo(hoistX + swingX - 7, bY + 18);
        ctx.moveTo(hoistX + swingX + 7, bY - 4); ctx.lineTo(hoistX + swingX + 7, bY + 18);
        ctx.stroke();

        /* the frame round the opening, and the loft floor it sits on */
        ctx.strokeStyle = '#40261c'; ctx.lineWidth = 6;
        ctx.strokeRect(wx - OW - 2, OT - 1, OW * 2 + 4, OB - OT + 2);
        K.mass(ctx, wx - OW - 12, OB + 1, OW * 2 + 24, 9, '#54321f', { top: 3, side: 6 });
        /* the hoist beam sticking out over the drop */
        K.mass(ctx, wx - 26, beamY - 3, 46, 7, '#4a2c1e', { top: 2, side: 4, foot: false });

        /* the ladder down out of it, leaning */
        ctx.strokeStyle = '#5c3a24'; ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(wx + OW - 14, OB + 10); ctx.lineTo(wx + OW - 26, FLOOR_Y - 18);
        ctx.moveTo(wx + OW + 4, OB + 10); ctx.lineTo(wx + OW - 8, FLOOR_Y - 18);
        ctx.stroke();
        ctx.lineWidth = 1.8;
        for (var rung = 0; rung < 8; rung++) {
          var f2 = rung / 8, ry = OB + 14 + f2 * (FLOOR_Y - 34 - OB);
          ctx.beginPath();
          ctx.moveTo(wx + OW - 14 - f2 * 12, ry); ctx.lineTo(wx + OW + 4 - f2 * 12, ry);
          ctx.stroke();
        }
        /* the moonlight falling out of the opening onto the barn floor */
        K.spill(ctx, wx - OW + 6, OB + 10, OW * 2 - 12, FLOOR_Y - OB - 10,
                'rgba(150,185,235,.55)', 0.24);
      });

      /* --- roof trusses --- */
      K.layer(ctx, camX, 0.26, function () {
        ctx.strokeStyle = '#3f2620'; ctx.lineWidth = 3;
        /* 128 apart rather than 96. Only the bottom four pixels of a truss
           clear the near roof beam, so the row reads as a rhythm of tie
           beams whatever the spacing, and this is one fewer on screen. */
        K.repeatX(camX, 0, 128, function (x) {
          ctx.beginPath();
          ctx.moveTo(x - 46, 26); ctx.lineTo(x, 6); ctx.lineTo(x + 46, 26);
          ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x - 46, 26); ctx.lineTo(x + 46, 26); ctx.stroke();
          ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(x - 24, 16); ctx.lineTo(x - 24, 26);
          ctx.moveTo(x + 24, 16); ctx.lineTo(x + 24, 26); ctx.stroke();
          ctx.strokeStyle = '#3f2620'; ctx.lineWidth = 3;
        });
      });

      /* --- the cabinets. No two the same: different heights, widths,
             marquees, screens, and one in four is dark with a note taped to
             it. A row of identical machines is what made this read as
             wallpaper. --- */
      K.layer(ctx, camX, 0.42, function () {
        K.repeatX(camX, 0, 54, function (x, i) {
          /* `repeatX` runs three tiles wider than the screen so nothing pops
             in at the edge, which for a cabinet means three whole machines a
             frame — mass, marquee, bezel, screen, clip, scanlines and a glow
             — drawn outside the picture. A cabinet is 46 wide at most. */
          if (x > W + 4 || x < -50) return;
          var h = K.hash(i, 1);
          var wdt = K.vary(i, 30, 34, 46);
          var bh = K.vary(i, 31, 58, 80);
          var top = FLOOR_Y - 22 - bh;
          var dead = K.chance(i, 32, 0.18);
          /* The bodies used to be mid-saturated blue, green and magenta at
             full size, and a row of them read as market stalls with awnings
             — big flat colour with a black hole punched in it. An arcade
             cabinet is nearly all dark side art; what is bright on it is the
             marquee and the screen, and it is the CONTRAST between those two
             that says "arcade" rather than "shed". Bodies dropped two thirds
             of the way to black, screens and marquees pushed up. It also
             gave the mid band somewhere for a dark cat to be seen against.

             NO GREEN in this list, deliberately. It had `#1c3f2c` in it, and
             a dark-green cabinet is the tallest thing behind the fighters at
             mid-screen — which is exactly where Luigi stands, a near-black cat
             whose one identity colour is a jade scarf in the same hue family.
             His fur has almost no value separation from a cabinet this dark,
             so the scarf is all the reading you get, and the stage was
             printing it twice at four times the size. A cold slate blue
             instead — blue-dominant rather than teal, so it does not go and
             collide with Lilly's collar either. It is at the light end of
             this row on purpose: the cabinet bank is what a dark cat stands
             in front of, and a body at luminance ~54 gives a tuxedo silhouette
             something to be cut out against instead of merging with it. */
          var body = K.pick(i, 33, ['#1e2440', '#3f1d2c', '#1d3a58', '#3f351c',
                                    '#2a1c3f', '#3f251c']);
          /* the cabinet — a painted mass with a lit face, a shaded side and
             an edge, not a flat rectangle */
          K.mass(ctx, x, top, wdt, bh + 22, body, { top: 3, side: 6, foot: false });
          var mc = dead ? '#5a5148' : K.pick(i, 34, ['#ffd166', '#ff7a8a', '#8fe6ff',
                                                     '#b6ff8f', '#ffa04a']);
          /* The marquee: a LIT PANEL let into a dark crown, never a triangle
             spanning the whole width — that was the awning. A third of them
             get a raised topper, which changes the roof line along the row
             without changing what the light is doing. */
          if (K.chance(i, 35, 0.34)) {
            K.mass(ctx, x + 5, top - 6, wdt - 10, 7, K.darker(body, 0.25),
                   { top: 2, side: 3, foot: false });
            ctx.fillStyle = mc;
            ctx.fillRect(x + 8, top - 4, wdt - 16, 3);
          }
          ctx.fillStyle = 'rgba(0,0,0,.45)';
          ctx.fillRect(x + 1, top, wdt - 2, 11);
          ctx.fillStyle = mc;
          ctx.fillRect(x + 3, top + 2, wdt - 9, 7);
          if (!dead) {
            /* two bars of the marquee art across the light, so it is a sign
               and not a strip of tape */
            ctx.fillStyle = 'rgba(30,18,40,.55)';
            ctx.fillRect(x + 6, top + 3, wdt - 15, 1.4);
            ctx.fillRect(x + 6, top + 6, (wdt - 15) * 0.6, 1.4);
            /* No glow round the marquee. It had one, and it was a second
               52-pixel disc of `lighter` blending a few pixels above the
               screen's own — twice the cost for a halo you cannot pick out
               from the screen's. The bright strip carries it on its own. */
          }
          /* screen — in a bezel, and the bezel is what makes it read as glass
             set into a box rather than a hole cut in a wall */
          var sw = wdt - 12, sh = Math.min(26, bh * 0.36);
          ctx.fillStyle = '#0a0a10';
          ctx.fillRect(x + 2, top + 11, sw + 4, sh + 4);
          ctx.fillStyle = dead ? '#14161f' : '#141a33';
          ctx.fillRect(x + 4, top + 13, sw, sh);
          if (!dead) {
            var kind = Math.floor(K.hash(i, 36) * 3);
            /* Every screen gets a WASH of its own colour before anything is
               drawn on it. A CRT in a dark room is a lamp, and the first
               version left the glass near-black with a few thin sprites on
               it — from six feet away that is a hole in a wall, and a row of
               holes is what the whole cabinet bank looked like. */
            var sc = K.pick(i, 44, ['#1c3a6e', '#3a1c4e', '#123c34', '#4a2410']);
            ctx.fillStyle = sc; ctx.fillRect(x + 4, top + 13, sw, sh);
            ctx.save();
            ctx.beginPath(); ctx.rect(x + 4, top + 13, sw, sh); ctx.clip();
            if (kind === 0) {                 /* a scrolling shooter */
              for (var b2 = 0; b2 < 5; b2++) {
                ctx.globalAlpha = 0.95;
                ctx.fillStyle = K.pick(i * 5 + b2, 37, ['#ff5b7a', '#ffd166', '#6fe3a0', '#7ab6ff']);
                ctx.fillRect(x + 5, top + 14 + ((b2 * 6 + t * (0.4 + h)) % sh), sw - 2, 3);
              }
              ctx.globalAlpha = 1; ctx.fillStyle = '#fff6d8';
              ctx.fillRect(x + 4 + sw / 2 - 2, top + 11 + sh - 8, 4, 4);
            } else if (kind === 1) {          /* a maze of blocks */
              for (var q = 0; q < 12; q++) {
                ctx.globalAlpha = 0.92;
                ctx.fillStyle = K.pick(i * 12 + q, 38, ['#4ad0ff', '#ffd166', '#ff6b8a']);
                ctx.fillRect(x + 5 + (q % 4) * (sw / 4),
                             top + 14 + Math.floor(q / 4) * (sh / 3), sw / 4 - 1.5, sh / 3 - 1.5);
              }
            } else {                          /* two paddles and a dot */
              ctx.globalAlpha = 1;
              ctx.fillStyle = 'rgba(200,230,255,.22)';   /* the halfway line */
              for (var dl = 0; dl < 5; dl++)
                ctx.fillRect(x + 3 + sw / 2, top + 14 + dl * (sh / 5), 1.4, sh / 9);
              ctx.fillStyle = '#e8f0ff';
              ctx.fillRect(x + 6, top + 15 + (Math.sin(t * 0.06 + i) * 0.5 + 0.5) * (sh - 10), 2.4, 8);
              ctx.fillRect(x + sw, top + 15 + (Math.cos(t * 0.05 + i) * 0.5 + 0.5) * (sh - 10), 2.4, 8);
              ctx.fillRect(x + 3 + sw / 2 + Math.sin(t * 0.09 + i) * sw * 0.34,
                           top + 12 + sh / 2 + Math.cos(t * 0.07 + i) * sh * 0.3, 2.4, 2.4);
            }
            /* scanlines: two dark bands across the glass. At this size a line
               per pixel row is mud, but two of them tilt it from "painted
               rectangle" to "screen". */
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'rgba(0,0,0,.22)';
            for (var sl = 2; sl < sh; sl += 4) ctx.fillRect(x + 4, top + 13 + sl, sw, 1);
            ctx.restore();
            ctx.globalAlpha = 1;
            softGlow(ctx, x + 4 + sw / 2, top + 13 + sh / 2, 26, 'rgba(150,185,255,.6)', 0.26);
            spills.push([x + wdt / 2, mc]);
          } else {
            /* out of order, with a note taped on */
            ctx.fillStyle = '#e8e0cc';
            ctx.save();
            ctx.translate(x + wdt / 2, top + 13 + sh / 2);
            ctx.rotate(K.vary(i, 39, -0.2, 0.2));
            ctx.fillRect(-8, -5, 16, 10);
            ctx.restore();
          }
          /* control panel */
          ctx.fillStyle = 'rgba(0,0,0,.4)';
          ctx.fillRect(x + 1, top + 15 + sh, wdt - 8, 8);
          ctx.fillStyle = K.pick(i, 40, ['#ff5b5b', '#ffd166', '#6fe3a0']);
          ctx.beginPath(); ctx.arc(x + 10, top + 19 + sh, 2, 0, Math.PI * 2); ctx.fill();
          /* Somebody playing it, standing on a milk crate.

             They used to stand on the floor at FLOOR_Y - 2, which puts the
             whole nineteen-pixel cat inside the contact shadow `K.deepen`
             lays across the bottom of the background every frame — they came
             out as pale ghosts with no faces. The crate is not a dodge: it is
             what you stand on to reach the buttons when you are a cat, and it
             lifts the head clear of the band. */
          if (!dead && K.chance(i, 41, 0.34)) {
            var pcx = x + wdt / 2 + 3, pcs = K.vary(i, 42, 0.72, 0.92);
            K.mass(ctx, pcx - 8, FLOOR_Y - 12, 16, 12, '#6b4a2a', { top: 3, side: 4 });
            ctx.fillStyle = 'rgba(0,0,0,.3)';
            ctx.fillRect(pcx - 6, FLOOR_Y - 9, 12, 1.4);
            K.spectator(ctx, pcx, FLOOR_Y - 12, pcs, K.pick(i, 43, DARKS), t + i * 17, mood);
          }
        });
      });

      /* --- the bales, and the house on them.

             This row used to be one bale, 70 pixels apart, forever — the
             flattest thing in the stage and unluckily also the band the
             fighters stand in front of. It is now a run of clusters that are
             not the same object: stacks one to three high, bales stood on end,
             barrels, a tower of tyres, and gaps where the crowd stands on the
             floor instead. The crowd sits on two tiers so the row has a front
             and a back, and the palettes are steered towards the darker cats
             — a cream cat on a straw bale is invisible, which is what the
             first version was full of. --- */
      K.layer(ctx, camX, 0.62, function () {
        K.repeatX(camX, 0, 76, function (x, i) {
          /* Same cull as the cabinets. A cluster is at most 72 across, so
             anything starting past the right edge or ending before the left
             one cannot show — and each of them is up to four bales, four
             seated cats and three peekers. */
          if (x > W + 4 || x < -78) return;
          var kind = K.hash(i, 60);
          var topY = FLOOR_Y - 30, seatX = x + 16, seatX2 = x + 44;

          if (kind < 0.13) {
            /* barrels — three tones, rings, no top face because you are
               looking at them from just above standing height */
            for (var b = 0; b < 2; b++) {
              var bxx = x + 6 + b * 26, bh = K.vary(i * 2 + b, 69, 26, 32);
              K.mass(ctx, bxx, FLOOR_Y - 4 - bh, 20, bh,
                     K.pick(i + b, 70, ['#7a4b2a', '#8c5730', '#6b4023']),
                     { top: 3, side: 4 });
              ctx.fillStyle = 'rgba(0,0,0,.28)';
              ctx.fillRect(bxx, FLOOR_Y - 4 - bh * 0.72, 20, 1.6);
              ctx.fillRect(bxx, FLOOR_Y - 4 - bh * 0.26, 20, 1.6);
            }
            topY = FLOOR_Y - 36; seatX = x + 16; seatX2 = x + 42;
          } else if (kind < 0.22) {
            /* A tower of tyres, because a barn has one.

               Tones lifted well clear of black. Four near-black ellipses
               stacked from FLOOR_Y-8 to FLOOR_Y-44 land exactly across the
               fighters' shins and knees, and at #22201f they were DARKER than
               a tuxedo cat's fur — so Luigi's legs and the tyres were one
               mass and his contour did nothing. The fighters' outline has to
               be the darkest thing at floor level; dusty rubber catching the
               string lights is perfectly happy at this value. */
            for (var ty = 0; ty < 4; ty++) {
              var tyY = FLOOR_Y - 8 - ty * 9;
              ctx.fillStyle = ty % 2 ? '#3a3634' : '#454140';
              ctx.beginPath();
              ctx.ellipse(x + 24 + (ty % 2 ? 1.5 : 0), tyY, 15, 5.4, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = 'rgba(255,230,190,.10)';
              ctx.beginPath();
              ctx.ellipse(x + 24 + (ty % 2 ? 1.5 : 0), tyY - 2.4, 12, 2.6, 0, 0, Math.PI * 2);
              ctx.fill();
              /* A hole down the middle of the top one only. At near-black the
                 stack got away with being four discs because nobody could see
                 it; lifted into the light it needs one dark centre to say
                 rubber rather than pancakes. One tyre, because the ones
                 underneath have the next tyre sitting in their hole. */
              if (ty === 3) {
                ctx.fillStyle = 'rgba(14,12,12,.75)';
                ctx.beginPath();
                ctx.ellipse(x + 24 + 1.5, tyY - 1.6, 5.4, 2, 0, 0, Math.PI * 2);
                ctx.fill();
              }
            }
            topY = FLOOR_Y - 44; seatX = x + 24; seatX2 = null;
          } else {
            var stack = kind < 0.46 ? 1 : kind < 0.82 ? 2 : 3;
            var bw = K.vary(i, 61, 40, 52);
            for (var lvl = 0; lvl < stack; lvl++) {
              var lx = x + lvl * K.vary(i * 3 + lvl, 71, -4, 6);
              var lw = lvl ? bw - lvl * K.vary(i, 72, 4, 12) : bw;
              bale(ctx, lx, FLOOR_Y - 4 - lvl * 25 - 26, lw, 26, i * 3 + lvl);
            }
            /* one stood on end against the stack — a different rectangle in
               the row does more than another shade of straw */
            if (K.chance(i, 73, 0.4)) bale(ctx, x + bw - 4, FLOOR_Y - 42, 20, 38, i + 91);
            topY = FLOOR_Y - 4 - (stack - 1) * 25 - 26;
            seatX = x + 13; seatX2 = x + bw - 11;
          }

          /* Seats are collected, not drawn. Every cat used to be drawn with
             its own cluster, and the next cluster's bales then buried it —
             the crowd was a row of ears sticking out of hay. Two passes cost
             one array and the whole house is visible. */
          if (!K.chance(i, 65, 0.14)) {
            seats.push([seatX, topY, K.vary(i, 66, 0.86, 1.1), K.pick(i, 74, DARKS), i * 23]);
          }
          if (seatX2 !== null && K.chance(i, 67, 0.62)) {
            seats.push([seatX2, topY, K.vary(i, 68, 0.78, 1.0), K.pick(i, 75, DARKS), i * 41 + 60]);
          }
          /* A third and fourth cat along the same top, at their own sizes.
             The front tier that used to be here stood on the floor at
             FLOOR_Y — which is inside the contact shadow `K.deepen` lays down
             every frame, so the whole row was quietly wiped out. Anything
             meant to be seen belongs above y 150 in this stage. */
          if (K.chance(i, 76, 0.55)) {
            seats.push([x + K.vary(i, 77, 6, 52), topY + K.vary(i, 84, 0, 3),
                        K.vary(i, 78, 0.7, 0.92), K.pick(i, 79, DARKS), i * 11 + 30]);
          }
          if (K.chance(i, 85, 0.62)) {
            seats.push([x + K.vary(i, 86, 2, 58), topY - 1,
                        K.vary(i, 87, 0.72, 0.95), K.pick(i, 88, DARKS), i * 29 + 90]);
          }
          /* the fifth of the row: a pair sitting together, because a crowd
             made only of evenly spaced individuals is a chart, not a house */
          if (K.chance(i, 94, 0.45)) {
            var pr = x + K.vary(i, 95, 8, 46);
            seats.push([pr, topY, K.vary(i, 96, 0.8, 1.0), K.pick(i, 97, DARKS), i * 7]);
            seats.push([pr + K.vary(i, 98, 8, 12), topY + 1,
                        K.vary(i, 99, 0.66, 0.82), K.pick(i, 104, DARKS), i * 7 + 44]);
          }
          /* and the ones who could not get a seat, watching over the top.
             Collected, not drawn — a peeker painted here is buried by the
             next cluster's bales a moment later, which is the same trap the
             seats fell into and the reason there are two passes at all. */
          for (var pk = 0; pk < 3; pk++) {
            if (!K.chance(i * 3 + pk, 105, 0.5)) continue;
            peeks.push([x + K.vary(i * 3 + pk, 106, 4, 56), topY + 1,
                        K.vary(i * 3 + pk, 107, 0.78, 1.05), i * 3 + pk]);
          }
        });
        /* `repeatX` deliberately runs three clusters wider than the screen so
           nothing pops in at the edge, and every one of those off-screen
           clusters was seating a full crowd — about a third of the cats in
           this stage were drawn outside the frame. A spectator is the most
           expensive thing per pixel in the barn, so they are culled here
           rather than at the point they are collected: the collection pass
           has to run whole, because a cluster's bales are on screen even
           when its right-hand seat is not. */
        function onScreen(x) { return x > -14 && x < W + 14; }
        for (var pI = 0; pI < peeks.length; pI++)
          if (onScreen(peeks[pI][0]))
            peeker(ctx, peeks[pI][0], peeks[pI][1], peeks[pI][2], peeks[pI][3], t);
        peeks.length = 0;
        for (var sI = 0; sI < seats.length; sI++)
          if (onScreen(seats[sI][0])) seatShadow(ctx, seats[sI][0], seats[sI][1], seats[sI][2]);
        for (sI = 0; sI < seats.length; sI++) {
          var st2 = seats[sI];
          if (onScreen(st2[0])) K.spectator(ctx, st2[0], st2[1], st2[2], st2[3], t + st2[4], mood);
        }
        seats.length = 0;
      });

      /* --- THE LANDMARK: THE BIG CLAW.

             It used to be a claw machine 60px wide standing in a row of
             cabinets 46px wide, which is not a landmark, it is another
             cabinet. A landmark has to be the size of the building it is in:
             this one is 104 wide and runs from the floor up out of the top of
             the picture, cropped by the roof beam, and cropped again by the
             left edge of the screen. Cropping is most of what sells scale —
             a thing you can see all of is a thing you can measure.

             It is also the loop. The claw tracks, drops, grabs, lifts and
             carries a plush cat to the chute, and every third go it fumbles
             it on the way — which is the bit worth waiting for.

             DRAWN AFTER THE HAY BALES, at depth 0.72 rather than 0.42. It
             used to sit in the cabinet layer, which put the row of bales in
             FRONT of it — and the bale tops cut across the glass at y 92,
             which is above the prize pile at 115. The whole payoff of the
             loop, the grab and the fumble, happened behind a hay bale where
             nobody could see it. A landmark that is enormous and close has
             to be in a layer that is enormous and close. --- */
      K.layer(ctx, camX, 0.72, function () {
        /* Pinned to the screen with a whisper of drift. A landmark that
           scrolls out of frame stops being one; a landmark nailed to the
           glass reads as a matte painting. A twentieth of the camera is the
           compromise the other stages use. */
        var mx = K.at(camX, 0, 0) - camX * 0.02;
        var MW = 104, MTOP = 16, MBOT = FLOOR_Y;
        var bx = mx + 16;                       /* the near stall partition crops it */

        /* the cabinet: one painted mass, lit from the right because the light
           in this barn comes off the string lights over the fight */
        K.mass(ctx, bx, MTOP, MW, MBOT - MTOP, '#b8342f',
               { top: 0, side: 9, light: -1, foot: false });

        /* the glass box */
        var gx = bx + 12, gy = MTOP + 20, gw = MW - 26, gh = 88;
        ctx.fillStyle = '#0e1426'; ctx.fillRect(gx - 3, gy - 3, gw + 6, gh + 6);
        ctx.fillStyle = '#1b2540'; ctx.fillRect(gx, gy, gw, gh);
        /* the back wall of it, lit, so the prizes have something to sit against */
        ctx.fillStyle = '#26325a'; ctx.fillRect(gx, gy, gw, gh * 0.55);

        /* THE BIG ONE, at the back of the box.

           Two thirds of the glass was empty navy above a single row of small
           prizes, which is not what a claw machine looks like and is a lot of
           dead area for the biggest object in the stage. This is the prize
           nobody is ever going to win: half the height of the box, wedged in
           the back corner, drawn a shade duller than the front row because it
           is a foot further back and behind the machine's own light. Every
           good arcade has one and it is the first thing a child points at. */
        plush(ctx, gx + 22, gy + gh - 26, 16, '#9c7aa8');
        ctx.fillStyle = 'rgba(14,20,38,.34)';                 /* pushed back */
        ctx.fillRect(gx, gy, gw, gh * 0.72);
        ctx.strokeStyle = 'rgba(255,240,210,.35)'; ctx.lineWidth = 1.4;
        ctx.beginPath();                                       /* its rosette */
        ctx.arc(gx + 22, gy + gh - 34, 5, 0, Math.PI * 2); ctx.stroke();

        /* the pile of plushes at the bottom of the box */
        var pileY = gy + gh - 9;
        /* the prizes were drawn in mid-air over a navy box. A mound under them
           is one fill and it is the difference between a pile and a pattern. */
        ctx.fillStyle = '#141c34';
        ctx.beginPath();
        ctx.moveTo(gx, gy + gh);
        ctx.lineTo(gx, pileY - 1);
        ctx.quadraticCurveTo(gx + gw * 0.5, pileY - 14, gx + gw, pileY - 4);
        ctx.lineTo(gx + gw, gy + gh); ctx.closePath(); ctx.fill();
        /* The prize palette, a step down in chroma and a step down in value.
           At full saturation this pile was the highest-contrast thing on the
           screen AND it sits at fighter head height directly behind P1 — and
           because the prizes are cat-shaped it was competing with the
           fighters for identity, not merely for attention. A row of nine
           luminous cat faces behind Gracie's head is the one thing a
           background must never be. Muted, they still read as a heap of soft
           toys; what stays bright is the claw and whatever it is carrying,
           which is the part of the landmark that moves. */
        var PRIZE = ['#c7a45c', '#c07079', '#7fb0c2', '#96b884', '#c18049', '#a390c2'];
        /* Three rows, not one, and the back rows sit higher and to the side:
           a heap, which is what the machine has, rather than a shelf. */
        for (var q2 = 0; q2 < 17; q2++) {
          var row = q2 < 6 ? 0 : q2 < 12 ? 1 : 2;
          var inRow = q2 - (row === 0 ? 0 : row === 1 ? 6 : 12);
          plush(ctx, gx + 7 + inRow * 12.5 + row * 5,
                pileY - row * 9 - (row === 2 ? 1 : 0),
                K.vary(q2, 50, 4.4, 5.8), K.pick(q2, 51, PRIZE));
        }

        /* The glass in shadow, over everything already inside the box and
           under everything still to come. The prize pile is at fighter head
           height and P1 stands in front of it; even muted it was reading at
           the fighters' own value, and two things at the same value fight.
           One flat fill across the WHOLE interior rather than a band over the
           pile alone — a band puts a hard horizontal edge across the glass
           and that reads as a shelf. The gantry, the claw and the prize in
           transit are drawn after this, so the mechanism keeps its full
           brightness and is now the lightest thing in the machine, which is
           where the eye should go anyway. */
        ctx.fillStyle = 'rgba(10,16,34,.30)';
        ctx.fillRect(gx, gy, gw, gh);

        /* ---- the loop ----
           One cycle, five and a half seconds, in normalised time so the
           phases can be shuffled without recomputing frame numbers. */
        var CYCLE = 330;
        var n = Math.floor(t / CYCLE), u = (t % CYCLE) / CYCLE;
        var fumble = (n % 3) === 2;
        function seg(a, b) { var v = (u - a) / (b - a); return v < 0 ? 0 : v > 1 ? 1 : v; }
        function ease(v) { return v * v * (3 - 2 * v); }

        var home = gx + 11, far = gx + gw - 14;
        var clawX = home + (far - home) * ease(seg(0, 0.26))
                         - (far - home) * ease(seg(0.62, 0.80));
        var railY = gy + 5;
        var deep = pileY - 7;
        var clawY = railY + (deep - railY) * (ease(seg(0.26, 0.40)) - ease(seg(0.48, 0.62)));
        var grip = u > 0.36 && u < 0.66 ? 1 : 0;          /* fingers closed */
        var carrying = u > 0.40 && u < (fumble ? 0.71 : 0.84);

        /* The gantry, the trolley and the claw.

           All of it used to be drawn in 1.4px pale grey on a navy box, and
           the mechanism — the thing the whole landmark is about — read as a
           scratch on the glass. Everything here is now backed by a dark line
           first and the metal laid over it, the same trick the cats use: a
           contour, then the fill. The claw is a solid head with fingers hung
           off it rather than a chevron of hairlines. */
        ctx.fillStyle = '#2a2b38'; ctx.fillRect(gx + 4, railY - 4, gw - 8, 4);
        ctx.fillStyle = '#8e8577'; ctx.fillRect(gx + 4, railY - 3, gw - 8, 2);
        ctx.fillStyle = '#1a1b26'; ctx.fillRect(clawX - 7, railY - 7, 14, 8);
        ctx.fillStyle = '#cfc6b4'; ctx.fillRect(clawX - 6, railY - 6, 12, 6);
        ctx.fillStyle = '#f2ecdc'; ctx.fillRect(clawX - 6, railY - 6, 12, 2);
        ctx.fillStyle = '#14151f';                       /* the cable */
        ctx.fillRect(clawX - 1.5, railY, 3, clawY - railY);
        ctx.fillStyle = '#d8d2c4';
        ctx.fillRect(clawX - 0.5, railY, 1.4, clawY - railY);
        /* the head */
        ctx.fillStyle = '#14151f'; ctx.fillRect(clawX - 5, clawY - 4, 10, 6);
        ctx.fillStyle = '#b9b1a0'; ctx.fillRect(clawX - 4, clawY - 3, 8, 4);
        ctx.fillStyle = '#f2ecdc'; ctx.fillRect(clawX - 4, clawY - 3, 8, 1.4);
        /* the fingers — three of them, opening and closing */
        var spread = 6.5 - grip * 4;
        [[-1, spread], [0, 0], [1, spread]].forEach(function (fg) {
          var tipX = clawX + fg[0] * fg[1];
          ctx.strokeStyle = '#14151f'; ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(clawX + fg[0] * 2.4, clawY + 1);
          ctx.lineTo(tipX, clawY + 5); ctx.lineTo(tipX - fg[0] * 1.4, clawY + 8);
          ctx.stroke();
          ctx.strokeStyle = '#cfc6b4'; ctx.lineWidth = 1.6;
          ctx.stroke();
        });

        /* the prize in transit, and the tease */
        if (carrying) {
          plush(ctx, clawX, clawY + 11, 5.4, '#ffd166');
        } else if (fumble && u >= 0.71 && u < 0.80) {
          var fall = (u - 0.71) / 0.09;
          plush(ctx, clawX, clawY + 11 + fall * fall * (pileY - clawY - 8), 5.4, '#ffd166');
        }
        /* delivered: it sits in the chute tray, and the cat at the panel
           throws its paws up */
        var won = !fumble && u >= 0.84;
        if (won) plush(ctx, bx + MW - 17, MBOT - 12, 5.4, '#ffd166');

        /* glass, over everything inside it — one diagonal, no gradient */
        ctx.fillStyle = 'rgba(200,230,255,.09)';
        ctx.beginPath();
        ctx.moveTo(gx, gy); ctx.lineTo(gx + gw * 0.55, gy);
        ctx.lineTo(gx, gy + gh * 0.8); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,240,210,.30)'; ctx.lineWidth = 1;
        ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, gh - 1);

        /* control panel and chute, at fighter height, which is what makes the
           machine read as something a cat could walk up to */
        ctx.fillStyle = '#6d1f1c'; ctx.fillRect(bx + 4, gy + gh + 6, MW - 12, 12);
        ctx.fillStyle = '#8f2a25'; ctx.fillRect(bx + 4, gy + gh + 6, MW - 12, 2);
        ctx.fillStyle = '#2a2028';
        ctx.fillRect(bx + 22, gy + gh + 3, 4, 5);                   /* stick */
        ctx.fillStyle = '#e8d24a';
        ctx.beginPath(); ctx.arc(bx + 24, gy + gh + 3, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff5b5b';
        ctx.beginPath(); ctx.arc(bx + 40, gy + gh + 12, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#241a14';
        ctx.fillRect(bx + MW - 26, MBOT - 22, 20, 20);              /* the chute */
        ctx.fillStyle = 'rgba(255,224,140,.14)';
        ctx.fillRect(bx + MW - 26, MBOT - 22, 20, 3);

        /* the sign over it, flashing, tucked under the roof beam */
        var lit = (t % 64) < 38;
        K.mass(ctx, bx + 10, MTOP + 2, MW - 22, 15, lit ? '#ffd45c' : '#6f5f33',
               { top: 0, side: 4, light: -1, foot: false });
        softGlow(ctx, bx + MW / 2, MTOP + 9, 52, 'rgba(255,214,92,.85)', lit ? 0.26 : 0.06);
        CF.Font.draw(ctx, 'THE CLAW',
          CF.Font.originFor(bx + MW / 2, CF.Font.widthOf('THE CLAW', 1, 0), 'center'),
          MTOP + 13, 1, 0);

        /* The base of the machine, which was a flat red panel a foot and a
           half tall right at fighter height. A kick plate, the scuffs where
           a hundred cats have braced against it, and the price taped on. */
        ctx.fillStyle = '#571714'; ctx.fillRect(bx + 2, MBOT - 9, MW - 4, 9);
        ctx.fillStyle = 'rgba(255,220,190,.10)'; ctx.fillRect(bx + 2, MBOT - 9, MW - 4, 1.4);
        ctx.fillStyle = 'rgba(20,8,8,.35)';
        for (var sf = 0; sf < 5; sf++)
          ctx.fillRect(bx + 8 + sf * 17, MBOT - 7, K.vary(sf, 108, 4, 11), 1.2);
        ctx.fillStyle = '#e8e0cc';
        ctx.fillRect(bx + 58, gy + gh + 8, 14, 8);
        ctx.fillStyle = 'rgba(60,40,30,.7)';
        ctx.fillRect(bx + 60, gy + gh + 10, 10, 1.2);
        ctx.fillRect(bx + 60, gy + gh + 13, 7, 1.2);

        /* Somebody working it, and celebrating when it pays out — on a crate
           like the cabinet players, and out of the pale half of the crowd
           palette. Index 404 landed on cream, and a cream cat standing in
           the contact shadow at the front of the picture was a bright smudge
           at exactly fighter height. */
        K.mass(ctx, bx + MW + 2, FLOOR_Y - 13, 16, 13, '#6b4a2a', { top: 3, side: 4 });
        K.spectator(ctx, bx + MW + 10, FLOOR_Y - 13, 0.95, 402, t,
                    won ? 1 : (mood || 0) * 0.5);
      });

      /* --- the frame: two enormous stall partitions at the edges of the
             picture, near enough that they dwarf the fighters. Scale contrast
             is what stops a background being a flat band — something huge and
             close on either side of something small and far. --- */
      K.layer(ctx, camX, 0.82, function () {
        /* Anchored near the edges of the screen with only a little drift.
           A frame that scrolls away is not a frame. */
        var drift = camX * 0.05;
        [[-16, 1], [W + 16, -1]].forEach(function (side) {
          var ex = side[0] - drift * side[1], dir = side[1];
          K.paint(ctx, function (c) {
            c.beginPath();
            c.moveTo(ex, H);
            c.lineTo(ex, -10);
            c.lineTo(ex + dir * 66, -10);
            c.lineTo(ex + dir * 58, 44);
            c.lineTo(ex + dir * 52, H);
            c.closePath();
          }, '#4a2c1c', { step: 3, lx: -dir * 0.9, ly: 0.2, hi: 0.16, edgeW: 1.6 });
          ctx.fillStyle = 'rgba(255,220,160,.10)';
          ctx.fillRect(ex + dir * 50, -10, dir * 5, H + 10);
          ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
          for (var q = 0; q < 5; q++) {
            ctx.beginPath();
            ctx.moveTo(ex + dir * (10 + q * 13), -10);
            ctx.lineTo(ex + dir * (8 + q * 12), H);
            ctx.stroke();
          }
          /* an iron bracket, at fighter height so the scale reads */
          ctx.fillStyle = '#2a2028';
          ctx.fillRect(ex + (dir > 0 ? 0 : -56), 96, 56, 9);
          /* On the right-hand post, the house sign — hung on the near timber
             rather than painted on the far wall, so it is a warm light at the
             edge of the frame instead of another thing in the distance. The
             corner it fills was dead maroon at every scroll position. */
          if (dir < 0) {
            var sx3 = ex - 46, sy3 = 26;
            K.mass(ctx, sx3, sy3, 34, 84, '#2f1a12', { top: 3, side: 5, foot: false });
            var buzz = (t % 190) < 4 ? 0.35 : 1;      /* the tube is on its way out */
            ctx.globalAlpha = buzz;
            ctx.fillStyle = '#ffdf8c';
            'GAME BARN'.split('').forEach(function (ch, k) {
              if (ch === ' ') return;
              CF.Font.draw(ctx, ch, sx3 + 17 - 2, sy3 + 13 + k * 8, 1, 0);
            });
            ctx.globalAlpha = 1;
            softGlow(ctx, sx3 + 17, sy3 + 42, 46, 'rgba(255,206,120,.75)', 0.22 * buzz);
          }
        });
      });

      /* --- a great roof beam overhead, close enough to be out of focus --- */
      K.layer(ctx, camX, 0.9, function () {
        K.paint(ctx, function (c) {
          c.beginPath();
          c.moveTo(-20, -10); c.lineTo(W + 20, -10);
          c.lineTo(W + 20, 16); c.lineTo(-20, 22);
          c.closePath();
        }, '#3f2812', { step: 3, lx: 0, ly: -1, hi: 0.20, edgeW: 1.6 });
        ctx.fillStyle = 'rgba(255,220,160,.10)';
        ctx.fillRect(-20, 14, W + 40, 3);
      });

      /* --- the floor.

             A third of the picture, and it was a plank texture and twenty
             specks. It now has something ON it: the shuffleboard court painted
             across the boards, worn through where everyone walks, with a puck
             left in the seven. The court is anchored in the WORLD, not the
             screen, so it slides past as the fight moves and tells you how far
             you have travelled — which a repeating floor never can. --- */
      K.grain(ctx, camX, 56, ['#6d4a2c', '#bd854e'], 0.1);
      K.layer(ctx, camX, 1, function () {
        var cx2 = K.at(camX, 1, 150);
        var apexY = FLOOR_Y + 7, baseY = H + 6;
        function court(f) {                       /* half-width at 0..1 down */
          return 15 + f * 74;
        }
        function edge(c, w, alpha) {
          ctx.strokeStyle = c; ctx.lineWidth = w; ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.moveTo(cx2 - court(0), apexY); ctx.lineTo(cx2 - court(1), baseY);
          ctx.moveTo(cx2 + court(0), apexY); ctx.lineTo(cx2 + court(1), baseY);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = 'rgba(226,196,140,.10)';
        ctx.beginPath();
        ctx.moveTo(cx2 - court(0), apexY); ctx.lineTo(cx2 + court(0), apexY);
        ctx.lineTo(cx2 + court(1), baseY); ctx.lineTo(cx2 - court(1), baseY);
        ctx.closePath(); ctx.fill();
        /* two passes: a dark one offset down, then the pale paint over it, so
           the line has a shadow in the grain the way worn paint does */
        edge('rgba(38,22,10,.62)', 3, 1);
        edge('rgba(248,235,202,.62)', 1.8, 1);
        [0.3, 0.62].forEach(function (f) {
          var y = apexY + (baseY - apexY) * f;
          ctx.strokeStyle = 'rgba(38,22,10,.5)'; ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(cx2 - court(f), y + 1); ctx.lineTo(cx2 + court(f), y + 1);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(248,235,202,.5)'; ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(cx2 - court(f), y); ctx.lineTo(cx2 + court(f), y);
          ctx.stroke();
        });
        /* the puck somebody left in the seven */
        var pz = cx2 + 26, py = apexY + (baseY - apexY) * 0.46;
        ctx.fillStyle = 'rgba(0,0,0,.3)';
        ctx.beginPath(); ctx.ellipse(pz, py + 1.6, 6, 2.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c23b34';
        ctx.beginPath(); ctx.ellipse(pz, py, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e8635a';
        ctx.beginPath(); ctx.ellipse(pz - 0.6, py - 0.8, 4.4, 1.8, 0, 0, Math.PI * 2); ctx.fill();
      });

      /* THE CABINETS ON THE BOARDS.

         The floor was a third of the picture and the only colour in it was
         brown. Every one of those machines is a lamp pointed at the ground
         and none of them was casting anything — which is the same mistake the
         screens themselves had, one plane further down. A wedge of the
         marquee's own colour, narrow at the machine and spreading towards
         you, and the boards stop being a band and start being the floor of a
         room with arcade cabinets in it.

         Drawn with `lighter` so it adds to the wood rather than tinting it
         grey; a plain translucent fill washed the grain out completely.

         A hard-edged wedge was the first attempt and it was wrong twice
         over: six triangles with crisp sides read as stage spotlights aimed
         at the floor, and their bottom edges cut straight across the boards.
         Light from a screen four feet away has no edge at all. A radial that
         dies out inside forty pixels is what it actually looks like. */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.42;
      for (var spI = 0; spI < spills.length; spI++) {
        var sp = spills[spI];
        /* The same five marquee colours come round every frame, so the pool
           is a cached sprite like the glows — only the lower half of the
           disc is ever wanted, so the sprite is that half and nothing is
           blended above the floor line. */
        var pk = 'pool' + sp[1], pc = glowCache[pk];
        if (!pc) {
          pc = document.createElement('canvas');
          pc.width = 100; pc.height = H - FLOOR_Y + 2;
          var pcx2 = pc.getContext('2d');
          var pg = pcx2.createRadialGradient(50, 0, 2, 50, 0, 50);
          pg.addColorStop(0, sp[1]);
          pg.addColorStop(1, 'rgba(0,0,0,0)');
          pcx2.fillStyle = pg;
          pcx2.fillRect(0, 0, 100, pc.height);
          glowCache[pk] = pc;
        }
        ctx.drawImage(pc, Math.round(sp[0]) - 50, FLOOR_Y - 2);
      }
      ctx.restore();
      spills.length = 0;

      /* the light on it: a warm pool under the string lights, cold moonlight
         where it falls out of the loft, and the string lights repeating */
      K.floorPool(ctx, W * 0.5, 190, 'rgba(255,196,110,.6)', 0.34);
      K.floorPool(ctx, K.at(camX, 0, 252) - camX * 0.03, 150,
                  'rgba(150,190,240,.5)', 0.2);
      /* A repeating row of 92-pixel warm discs used to sit here at a tenth
         opacity — five of the largest blends in the stage for something you
         had to be told was there. The cabinet spill above does the same job
         where the light actually comes from. */
      /* tokens and straw underfoot, and one token catching the light */
      K.litter(ctx, camX, 1, 64, ['rgba(214,178,74,.6)', 'rgba(120,88,44,.5)',
                                  'rgba(255,224,140,.45)'], 0.7, 1.9);
      K.layer(ctx, camX, 1, function () {
        ctx.strokeStyle = 'rgba(206,168,78,.55)'; ctx.lineWidth = 1;
        K.repeatX(camX, 0, 48, function (x, i) {
          for (var st = 0; st < 3; st++) {
            var sx = x + K.vary(i * 3 + st, 90, 0, 46);
            var sy = FLOOR_Y + 6 + K.hash(i * 3 + st, 91) * (H - FLOOR_Y - 8);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + K.vary(i * 3 + st, 92, -5, 5), sy + K.vary(i * 3 + st, 93, -1.6, 1.6));
            ctx.stroke();
          }
        });
        var tk = K.at(camX, 1, 84), glint = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.03));
        ctx.fillStyle = '#d8ae44';
        ctx.beginPath(); ctx.ellipse(tk, H - 22, 3.2, 1.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = glint;
        ctx.fillStyle = '#fff4c8';
        ctx.fillRect(tk - 1, H - 23, 2, 1);
        ctx.globalAlpha = 1;
      });
      this.dust.update();
      this.dust.draw(ctx, camX, t);
    },
    drawFore: function (ctx, camX, t, mood) {
      /* --- string lights swinging across the front --- */
      K.layer(ctx, camX, 1.22, function () {
        ctx.strokeStyle = 'rgba(30,18,14,.85)'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (var x = -40; x <= W + 40; x += 6) {
          ctx.lineTo(x, 12 + Math.sin(x * 0.03 + t * 0.02) * 5 + Math.abs(Math.sin(x * 0.012)) * 12);
        }
        ctx.stroke();
        K.repeatX(camX, 0, 30, function (x, i) {
          var y = 12 + Math.sin(x * 0.03 + t * 0.02) * 5 + Math.abs(Math.sin(x * 0.012)) * 12;
          var sw = K.sway(t, 0.024, 2.2, i);
          var c = ['#ffd166', '#ff8a5b', '#8fe6ff', '#b6ff8f', '#ff7ab6'][Math.abs(i) % 5];
          var pulse = 0.72 + 0.28 * Math.sin(t * 0.05 + i * 1.7);
          ctx.strokeStyle = 'rgba(30,18,14,.8)'; ctx.lineWidth = 0.9;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw, y + 7); ctx.stroke();
          softGlow(ctx, x + sw, y + 9, 13, c, 0.42 * pulse);
          ctx.globalAlpha = pulse;
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.arc(x + sw, y + 9, 2.4, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
        });
      });
      /* the near edge of the floor, in front of the fighters feet — the
         plane turns away from the light as it comes towards you, and that
         alone is the difference between a floor and a coloured band */
      K.nearLip(ctx, 15, 0.4);
      K.vignette(ctx, 0.26);
    }
  };
})();
