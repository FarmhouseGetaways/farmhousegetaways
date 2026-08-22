/* =======================================================================
   5 — THE FARMHOUSE KITCHEN

   Evening. The range is lit, the pot is about to go over, and the last of
   the sun is coming through the sash window over the sink.

   What this stage was, and why it was rebuilt on 22 Aug 2026: a wall of
   tongue-and-groove with a cooker-sized cooker in front of it, a
   window-sized window, and two rails of identical lollipop pans across the
   top. Every value in the picture sat in the same mid-brown, so there was
   nothing for the eye to return to and the cats had nothing to read
   against.

   The composition now is the Street Fighter II one — something ENORMOUS at
   each edge framing something tiny and far in the middle:

     left edge    the range and its chimney breast, floor to ceiling and
                  off the top of frame, with fire in it
     centre       the sash window: blazing, and through it a windmill the
                  size of a thumbnail turning on a hill a mile away
     right edge   the dresser, a dark mass with an oil lamp in it

   Three warm sources — firebox, window, lamp — in a room otherwise taken
   down to dark oak. Warm light in a dark picture is the strongest landmark
   there is, and it is also what stops a black cat vanishing into the wall.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  /* ---------------------------------------------------------------------
     THE BOIL-OVER — the thing on a loop that is worth waiting for.

     Seven seconds. Six of them are a quiet simmer, then the lid starts to
     hop, then it goes over: the lid lands askew, froth runs down the side
     of the pot and hisses off the hotplate, and the cat asleep in the
     basket sits bolt upright. Then it settles and the lid goes back on.

     A short burst inside a long calm is the shape that makes somebody
     watch for it a second time. A pot that boiled continuously would just
     be more steam.
     ------------------------------------------------------------------- */
  var BOIL = 420;                       /* frames; the sim is a fixed 60Hz */
  function boil(t) {
    var c = (t % BOIL) / BOIL;
    if (c < 0.72) return { rattle: 0, over: 0 };
    if (c < 0.80) {                     /* building — the lid starts to hop */
      var k = (c - 0.72) / 0.08;
      return { rattle: k, over: 0 };
    }
    var k2 = (c - 0.80) / 0.20;         /* over, then dying away */
    return { rattle: 1 - k2, over: Math.max(0, 1 - k2 * 1.4) };
  }

  /* ---------------------------------------------------------------------
     A pan seen from the side, hanging.

     The old rail drew a filled circle per pan, which at this size is a
     lollipop and nothing else — eleven of them across the top of frame was
     the single worst thing in the picture. A pan reads from its HANDLE and
     from being open at the top; the bowl alone reads as a balloon.
     ------------------------------------------------------------------- */
  function hangPan(ctx, x, y, r, col, kind) {
    var dark = K.darker(col, 0.45), lit = K.lighter(col, 0.30);
    ctx.save();
    if (kind === 0) {                             /* saucepan, deep */
      ctx.fillStyle = dark;
      ctx.fillRect(x - r, y, r * 2, r * 1.5);
      ctx.fillStyle = col;
      ctx.fillRect(x - r, y, r * 1.4, r * 1.5);
      ctx.fillStyle = lit;
      ctx.fillRect(x - r, y, Math.max(1, r * 0.34), r * 1.5);
      ctx.fillStyle = dark;                       /* the open mouth */
      ctx.fillRect(x - r - 1, y - 1.5, r * 2 + 2, 2.5);
      ctx.fillStyle = '#3a2f26';                  /* handle, out to one side */
      ctx.fillRect(x + r, y + 1, r * 1.5, 2);
    } else if (kind === 1) {                      /* frying pan, shallow */
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(x, y + r * 0.5, r, r * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(x - r * 0.2, y + r * 0.34, r * 0.8, r * 0.56, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2f26';
      ctx.fillRect(x + r * 0.7, y + r * 0.3, r * 1.7, 2);
    } else {                                      /* colander, holes and all */
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x - r * 0.15, y - 1, r * 0.82, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(30,24,18,.8)';
      for (var h = 0; h < 4; h++) {
        ctx.fillRect(x - r * 0.6 + h * r * 0.4, y - r * 0.45 - (h % 2) * 2, 1.4, 1.4);
      }
      ctx.fillStyle = dark;
      ctx.fillRect(x - r - 1, y - 1, r * 2 + 2, 2);
    }
    ctx.restore();
  }

  /* A cat curled in a basket, and the same cat sitting bolt upright when
     the pot goes over. Deliberately tiny and simple: it lives at the foot
     of the range where nothing else is, and anything with more detail than
     this competes with the fight. */
  function basketCat(ctx, x, y, t, alarm, s) {
    var breathe = Math.sin(t * 0.045) * 0.7;
    ctx.save();
    ctx.translate(x, y);
    /* It was drawn at 1:1 and came out as a bun at the bottom corner: at
       fifteen pixels across, a curled cat inside a basket is a brown oval.
       Half as big again, and it reads. */
    ctx.scale(s || 1, s || 1);
    /* the basket, behind */
    ctx.fillStyle = '#8a6534';
    ctx.beginPath(); ctx.ellipse(0, -4, 15, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    if (alarm > 0.2) {
      /* sat up, ears flat, tail straight out */
      var up = alarm * 9;
      ctx.fillStyle = '#e2a35c';
      ctx.beginPath(); ctx.ellipse(0, -8 - up * 0.4, 6, 8 + up * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(1, -17 - up, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();                            /* ears back */
      ctx.moveTo(-3, -20 - up); ctx.lineTo(-7, -23 - up); ctx.lineTo(-2, -22.5 - up);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4, -20 - up); ctx.lineTo(7, -24 - up); ctx.lineTo(5, -22.5 - up);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1e1814';                  /* eyes wide */
      ctx.beginPath(); ctx.arc(-0.6, -17.5 - up, 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(3.2, -17.5 - up, 1.3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#e2a35c';                  /* curled, breathing */
      ctx.beginPath(); ctx.ellipse(0, -10 + breathe, 11, 6 + breathe * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-7, -11, 4.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c08240';
      ctx.beginPath(); ctx.ellipse(6, -11, 5, 2.4, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2a1e';                  /* shut eye */
      ctx.fillRect(-9, -12, 3, 1);
    }
    /* the front of the basket, over the cat, so it sits IN it */
    ctx.fillStyle = '#a87c42';
    ctx.beginPath(); ctx.ellipse(0, -2, 15, 5, 0, Math.PI, 0, true); ctx.fill();
    ctx.strokeStyle = 'rgba(60,42,20,.6)'; ctx.lineWidth = 1;
    for (var b = -12; b <= 12; b += 5) {
      ctx.beginPath(); ctx.moveTo(b, -6.5); ctx.lineTo(b, -1); ctx.stroke();
    }
    /* the firelight, on the side facing the range */
    ctx.fillStyle = 'rgba(255,168,80,.30)';
    ctx.beginPath(); ctx.ellipse(-9, -4, 6, 5, 0, Math.PI * 0.5, Math.PI * 1.5); ctx.fill();
    ctx.restore();
  }

  /* A mouse along the skirting. Ten seconds apart, gone in two — one of the
     things to find rather than one of the things to look at. */
  function mouse(ctx, camX, t) {
    var c = ((t + 130) % 620) / 620;
    if (c > 0.30) return;
    var k = c / 0.30;
    var x = 350 - k * 330 - camX * 0.5;
    if (x < -10 || x > W + 10) return;
    var y = FLOOR_Y + 3 + Math.sin(k * 40) * 0.6;
    ctx.save();
    ctx.fillStyle = '#6b5a4a';
    ctx.beginPath(); ctx.ellipse(x, y, 3.4, 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x - 3, y - 0.4, 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#6b5a4a'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 3, y);
    ctx.quadraticCurveTo(x + 7, y - 1 + Math.sin(t * 0.4) * 1.5, x + 9, y + 1);
    ctx.stroke();
    ctx.restore();
  }

  CF.StageDefs = CF.StageDefs || {};
  CF.StageDefs.kitchen = {
    id: 'kitchen', name: 'THE FARMHOUSE KITCHEN',
    blurb: 'The range is lit, the pot is going over, and the sun is nearly down.',
    /* The colour of the air in here is the evening coming through the glass,
       not the grey of outdoors — see K.deepen. */
    air: { air: '#c08a52', haze: 0.10, floorDark: 0.32, horizon: 128 },
    init: function () {
      this.flour = new P({ count: 20, kind: 'dust', depth: 0.5, seed: 55,
                           band: [28, FLOOR_Y - 20], vx: 0.05, vy: 0.05,
                           size: 1.4, color: 'rgba(255,236,190,.95)', wobble: 1.6 });
    },

    drawBack: function (ctx, camX, t, mood) {
      var b = boil(t);

      /* The room, dark oak. Everything that follows is either warm light or
         something standing in front of it. */
      K.sky(ctx, [[0, '#3a2a1c'], [0.5, '#4a3624'], [1, '#5c4229']], 0, FLOOR_Y);

      /* --- the wall behind everything: tongue-and-groove, no two boards the
             same shade, and a plate rail across it ------------------------ */
      K.layer(ctx, camX, 0.10, function () {
        K.repeatX(camX, 0, 13, function (x, i) {
          ctx.fillStyle = 'rgba(18,10,4,' + K.vary(i, 130, 0.02, 0.20).toFixed(3) + ')';
          ctx.fillRect(x, 0, 13, FLOOR_Y);
          ctx.fillStyle = 'rgba(255,214,150,.045)';
          ctx.fillRect(x, 0, 1, FLOOR_Y);
        });
        K.mass(ctx, -10, 40, W + 20, 5, '#4e3722', { top: 2, side: 0, foot: false, edge: false });
      });

      /* =================================================================
         THE WINDOW — the bright landmark, and the only real light source.

         Pinned to the screen with a hair of drift, because a landmark that
         scrolls away is not a landmark. It is 160 wide and 120 tall in a
         384x224 frame: a third of the picture, which is the size the brief
         asks for and roughly ten times the size the old one was.
         ================================================================= */
      var wx = 202 - camX * 0.03;
      K.layer(ctx, camX, 0.16, function () {
        var gx0 = wx - 70, gx1 = wx + 70, gy0 = 20, gy1 = 122;

        /* the reveal — a deep splay, so the wall has thickness */
        K.mass(ctx, wx - 82, 12, 164, 118, '#4a3420', { top: 4, side: 8, foot: false });

        ctx.save();
        ctx.beginPath(); ctx.rect(gx0, gy0, 140, 102); ctx.clip();

        /* the evening itself */
        var sg = ctx.createLinearGradient(0, gy0, 0, gy1);
        /* A window that is all one pale peach is a lamp, not a view — the
           first pass was exactly that and the hills inside it vanished.
           Dusk violet at the top down through to the sun's own band gives
           the glass its own light-to-dark run, so what is in front of it
           reads as silhouette rather than as more of the same colour. */
        sg.addColorStop(0, '#5b4a78');
        sg.addColorStop(0.30, '#a86a86');
        sg.addColorStop(0.55, '#ec9758');
        sg.addColorStop(0.72, '#ffd489');
        sg.addColorStop(1, '#c4643f');
        ctx.fillStyle = sg;
        ctx.fillRect(gx0, gy0, 140, 102);

        /* the sun, low and nearly down */
        /* Both of these were at the left of the glass, which is precisely
           where fighter one's head is: the windmill turned for a week
           behind a cat and nobody ever saw it. The gap between two
           fighters in a neutral stance is the middle of the window, so
           that is where the two things worth seeing now live. */
        var sunX = wx + 8, sunY = 90;
        K.glow(ctx, sunX, sunY, 40, 'rgba(255,214,140,.85)', 0.5);
        ctx.fillStyle = '#fff0c4';
        ctx.beginPath(); ctx.arc(sunX, sunY, 11, 0, Math.PI * 2); ctx.fill();

        /* two hazed hill bands — the far one nearly the colour of the sky,
           which is the whole of what makes it read as far */
        ctx.fillStyle = '#8f4f60';
        ctx.beginPath();
        ctx.moveTo(gx0, gy1);
        for (var hx = 0; hx <= 140; hx += 7) {
          ctx.lineTo(gx0 + hx, 84 - Math.sin(hx * 0.035) * 7 - Math.sin(hx * 0.11) * 2.5);
        }
        ctx.lineTo(gx1, gy1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#6b3a4e'; ctx.lineWidth = 1.4;   /* hedgerows */
        for (var hg = 0; hg < 3; hg++) {
          ctx.beginPath();
          ctx.moveTo(gx0 + 12 + hg * 46, 96);
          ctx.quadraticCurveTo(gx0 + 30 + hg * 46, 90, gx0 + 26 + hg * 46, 82);
          ctx.stroke();
        }
        ctx.fillStyle = '#4a2a36';
        ctx.beginPath();
        ctx.moveTo(gx0, gy1);
        for (var hx2 = 0; hx2 <= 140; hx2 += 7) {
          ctx.lineTo(gx0 + hx2, 98 - Math.sin(hx2 * 0.05 + 2) * 6 - Math.sin(hx2 * 0.14) * 2);
        }
        ctx.lineTo(gx1, gy1); ctx.closePath(); ctx.fill();

        /* SCALE CONTRAST — the whole point of the window. A windmill the
           size of a fingernail, a mile off, framed by a window frame the
           size of a door. It turns; it is the second thing on a loop. */
        var mx = wx - 16, my = 82;
        ctx.fillStyle = '#33202c';
        ctx.beginPath();
        ctx.moveTo(mx - 4.5, my + 14); ctx.lineTo(mx - 2.2, my - 14);
        ctx.lineTo(mx + 2.2, my - 14); ctx.lineTo(mx + 4.5, my + 14);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();                                    /* the cap */
        ctx.moveTo(mx - 3.4, my - 13); ctx.lineTo(mx, my - 18);
        ctx.lineTo(mx + 3.4, my - 13); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#33202c'; ctx.lineWidth = 1.6;
        var a0 = t * 0.014;
        for (var s = 0; s < 4; s++) {
          var a = a0 + s * Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(mx, my - 14);
          ctx.lineTo(mx + Math.cos(a) * 14, my - 14 + Math.sin(a) * 14);
          ctx.stroke();
        }
        /* a barn and a silo beside it, smaller still — the far end of the
           scale run that starts with the range hood at the left edge */
        ctx.fillStyle = '#33202c';
        ctx.fillRect(mx + 16, my + 5, 12, 9);
        ctx.beginPath();
        ctx.moveTo(mx + 15, my + 5); ctx.lineTo(mx + 22, my); ctx.lineTo(mx + 29, my + 5);
        ctx.closePath(); ctx.fill();
        ctx.fillRect(mx + 31, my - 1, 4.5, 15);

        /* poplars along the lane, varied and NOT evenly spaced */
        for (var pl = 0; pl < 7; pl++) {
          var px = gx0 + 8 + pl * 20 + K.vary(pl, 141, -5, 5);
          ctx.fillStyle = pl > 3 ? '#3a2430' : '#2e1d28';
          ctx.beginPath();
          ctx.ellipse(px, 92 - K.vary(pl, 142, 2, 8), K.vary(pl, 143, 2.4, 4),
                      K.vary(pl, 144, 9, 17), 0, 0, Math.PI * 2);
          ctx.fill();
        }

        /* rooks going home across the glass, on a slow loop */
        for (var bd = 0; bd < 4; bd++) {
          var bx = gx0 - 20 + ((t * 0.22 + bd * 46) % 190);
          K.bird(ctx, bx, 44 + Math.sin(t * 0.02 + bd) * 5 + bd * 5, 1.1,
                 t, bd * 2, 'rgba(70,40,44,.7)');
        }

        /* the glass itself: a wedge of reflected room across the top panes.
           Cheap, and it is the difference between a window and a hole. */
        ctx.fillStyle = 'rgba(255,244,214,.09)';
        ctx.beginPath();
        ctx.moveTo(gx0, gy0); ctx.lineTo(gx0 + 74, gy0);
        ctx.lineTo(gx0, gy0 + 62); ctx.closePath(); ctx.fill();
        ctx.restore();

        /* the sashes — six panes, the meeting rail thickest */
        ctx.fillStyle = '#3e2c1a';
        ctx.fillRect(gx0 + 45, gy0, 4, 102);
        ctx.fillRect(gx0 + 91, gy0, 4, 102);
        ctx.fillRect(gx0, 66, 140, 6);
        ctx.fillStyle = 'rgba(255,222,168,.28)';   /* light catching the bars */
        ctx.fillRect(gx0 + 45, gy0, 1.4, 102);
        ctx.fillRect(gx0 + 91, gy0, 1.4, 102);
        ctx.fillRect(gx0, 66, 140, 1.4);

        /* THE CROWD — six cats sat along the sill, against the light.

           They were going to be round the kitchen table, and they were
           invisible there: the table edge took their bodies, the dresser
           took the three on the right, and what was left was three pairs of
           ears in a dark band. On the sill they are black against the
           brightest thing in the picture, which is the one place a
           spectator cannot be lost. Each gets its own size, ear angle, tail
           phase and how far it leans in, and the two nearest the middle
           turn to follow the fight. */
        K.mass(ctx, wx - 88, 122, 176, 9, '#9c7f52', { top: 4, side: 6 });
        for (var c = 0; c < 6; c++) {
          var sc = K.vary(c, 180, 0.72, 1.06);
          var cxx = wx - 62 + c * 25 + K.vary(c, 181, -4, 4);
          var ph = K.hash(c, 182) * 6.28;
          var hop = (mood || 0) > 0.5
            ? Math.max(0, Math.sin(t * 0.2 + ph)) * 5 * (mood || 0) : 0;
          var bob = Math.sin(t * 0.035 + ph) * 0.9 + hop;
          var lean = K.vary(c, 183, -0.12, 0.12);
          ctx.save();
          ctx.translate(cxx, 122 - bob);
          ctx.rotate(lean);
          /* the rim first, one step up and back, so a warm edge survives
             where the sun is behind them — the whole reason for putting
             them here rather than anywhere else in the room */
          ctx.fillStyle = 'rgba(255,214,150,.8)';
          ctx.beginPath(); ctx.ellipse(-0.8 * sc, -8.6 * sc, 7.4 * sc, 9.8 * sc, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(1.3 * sc, -20.6 * sc, 5.7 * sc, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(26,17,14,.94)';
          ctx.beginPath(); ctx.ellipse(0, -8 * sc, 7 * sc, 9.4 * sc, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(2 * sc, -20 * sc, 5.4 * sc, 0, Math.PI * 2); ctx.fill();
          var ear = K.vary(c, 184, 0.7, 1.35);          /* ears differ a lot */
          ctx.beginPath();
          ctx.moveTo(-2 * sc, -22 * sc); ctx.lineTo(-1 * sc, (-26 - 3 * ear) * sc);
          ctx.lineTo(2.6 * sc, -24 * sc); ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.moveTo(4 * sc, -23 * sc); ctx.lineTo((6 + ear) * sc, (-26 - 3 * ear) * sc);
          ctx.lineTo(6.6 * sc, -22.6 * sc); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(26,17,14,.94)';        /* tail over the edge */
          ctx.lineWidth = Math.max(1, 2.2 * sc);
          ctx.beginPath();
          ctx.moveTo(-5 * sc, -1 * sc);
          ctx.quadraticCurveTo(-12 * sc, K.sway(t, 0.06, 3, ph), -11 * sc, 8 * sc);
          ctx.stroke();
          ctx.restore();
        }
      });

      /* --- the sink under the window, and the dish rack ------------------ */
      K.layer(ctx, camX, 0.20, function () {
        K.mass(ctx, wx - 44, 132, 88, 24, '#9c917c', { top: 3, side: 7 });
        ctx.fillStyle = 'rgba(40,28,18,.35)';
        ctx.fillRect(wx - 38, 136, 76, 5);
        ctx.strokeStyle = '#9aa4ac'; ctx.lineWidth = 2.4;   /* the tap */
        ctx.beginPath();
        ctx.moveTo(wx + 26, 132); ctx.lineTo(wx + 26, 124);
        ctx.quadraticCurveTo(wx + 26, 119, wx + 16, 120);
        ctx.stroke();
        /* Draining, beside the sink. Four narrow upright ellipses were
           meant to be plates on edge and came out as a row of white fangs
           under the cats on the sill — at this size a plate has to be
           round, or it is not a plate. */
        for (var d = 0; d < 3; d++) {
          var pdx = wx - 34 + d * 13;
          ctx.fillStyle = '#8e8574';
          ctx.beginPath(); ctx.arc(pdx, 130, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#b8ae98';
          ctx.beginPath(); ctx.arc(pdx - 1, 129, 5.4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#a89c84';                          /* a jug beside them */
        ctx.fillRect(wx + 4, 120, 10, 12);
        ctx.beginPath(); ctx.ellipse(wx + 9, 120, 5, 2.4, 0, 0, Math.PI * 2); ctx.fill();
      });

      /* --- the mid ground: the scrubbed table, with the day's work on it -

             No crowd on it. Six spectators were tried here and every one
             was either cut off at the chest by the table edge or hidden by
             the dresser; they are on the window sill now, where the light
             is behind them.                                             */
      K.layer(ctx, camX, 0.30, function () {
        var tx = 296 - camX * 0.09;
        K.mass(ctx, tx - 100, 144, 196, 8, '#8a6238', { top: 5, side: 7 });
        ctx.fillStyle = 'rgba(30,18,8,.45)';                 /* legs, in shadow */
        ctx.fillRect(tx - 92, 152, 7, FLOOR_Y - 152);
        ctx.fillRect(tx + 82, 152, 7, FLOOR_Y - 152);
        /* a board with a loaf on it, and a bowl */
        K.mass(ctx, tx - 54, 136, 34, 8, '#c2a06a', { top: 3, side: 4, foot: false });
        ctx.fillStyle = '#c98d4a';
        ctx.beginPath(); ctx.ellipse(tx - 36, 136, 13, 8, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#e2b06a';
        ctx.beginPath(); ctx.ellipse(tx - 39, 134, 9, 5, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#dcd2ba';
        ctx.beginPath(); ctx.ellipse(tx + 22, 144, 14, 7, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#b8ab92';
        ctx.beginPath(); ctx.ellipse(tx + 22, 143, 14, 3, 0, 0, Math.PI * 2); ctx.fill();
      });

      /* =================================================================
         THE RANGE — the huge close thing at the left edge.

         Chimney breast off the top of frame, range under it, fire in it.
         It is the frame on this side: anchored to the screen with only a
         little drift, because something this size sliding past at layer
         speed would swing the whole picture.
         ================================================================= */
      var rx = 62 - camX * 0.06;
      K.layer(ctx, camX, 0.28, function () {
        /* THE CANOPY.

           It was a plain box the width of the range and it read as a band
           across the top-left, not as a mass. A range hood TAPERS, and the
           taper is the only strong diagonal in a picture otherwise built
           entirely of uprights and horizontals — which is most of why the
           left edge now reads as enormous rather than as more furniture.
           It overlaps the left edge of the window on purpose: a near thing
           crossing a far thing is worth more depth than another layer. */
        K.paint(ctx, function (c) {
          c.beginPath();
          c.moveTo(rx - 78, 34); c.lineTo(rx + 78, 34);
          c.lineTo(rx + 42, 2); c.lineTo(rx + 42, -26);
          c.lineTo(rx - 42, -26); c.lineTo(rx - 42, 2);
          c.closePath();
        }, '#7a6042', { step: 3, edgeW: 1.6 });
        ctx.fillStyle = 'rgba(18,10,6,.32)';          /* sixty years of soot */
        ctx.beginPath();
        ctx.moveTo(rx - 34, 34); ctx.lineTo(rx + 34, 34);
        ctx.lineTo(rx + 20, -26); ctx.lineTo(rx - 20, -26); ctx.closePath(); ctx.fill();
        K.mass(ctx, rx - 82, 34, 164, 8, '#8a6a44', { top: 4, side: 7 });   /* the lip */

        /* THE RECESS the range stands in. Dark, and the whole reason the
           steam off the pot can be seen at all — against the old
           light-brown wall it was a pale plume on a pale ground. */
        ctx.fillStyle = '#241a11';
        ctx.fillRect(rx - 72, 42, 144, 52);
        ctx.fillStyle = 'rgba(255,140,50,.09)';       /* firelight up the flue */
        ctx.fillRect(rx - 72, 62, 144, 32);
        /* implements on hooks under the lip — a kitchen tells you what
           happens in it by what is left hanging where it is used */
        for (var u = 0; u < 5; u++) {
          var ux = rx - 56 + u * 26 + K.vary(u, 166, -3, 3);
          var ul = K.vary(u, 167, 12, 22);
          ctx.strokeStyle = '#8a8a94'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(ux, 43); ctx.lineTo(ux, 43 + ul); ctx.stroke();
          ctx.fillStyle = '#9aa0aa';
          if (u % 3 === 0) {                          /* a ladle */
            ctx.beginPath(); ctx.arc(ux, 43 + ul + 3, 4, 0, Math.PI); ctx.fill();
          } else if (u % 3 === 1) {                   /* a fish slice */
            ctx.beginPath();
            ctx.moveTo(ux - 4, 43 + ul); ctx.lineTo(ux + 4, 43 + ul);
            ctx.lineTo(ux + 3, 43 + ul + 6); ctx.lineTo(ux - 3, 43 + ul + 6);
            ctx.closePath(); ctx.fill();
          } else {                                    /* a skimmer */
            ctx.beginPath(); ctx.arc(ux, 43 + ul + 3.5, 4.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#3a3a42';
            ctx.beginPath(); ctx.arc(ux, 43 + ul + 3.5, 2, 0, Math.PI * 2); ctx.fill();
          }
        }
        /* what stands on the lip: the clock, and four crocks */
        ctx.fillStyle = '#3f2f20';
        ctx.beginPath(); ctx.arc(rx + 40, 24, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e8dcc0';
        ctx.beginPath(); ctx.arc(rx + 40, 24, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3f2f20'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(rx + 40, 24);
        ctx.lineTo(rx + 40 + Math.cos(t * 0.004 - 1) * 4, 24 + Math.sin(t * 0.004 - 1) * 4);
        ctx.moveTo(rx + 40, 24); ctx.lineTo(rx + 40, 20);
        ctx.stroke();
        for (var j = 0; j < 4; j++) {
          K.mass(ctx, rx - 66 + j * 16, 22, 10, 12,
                 K.pick(j, 164, ['#b5763a', '#8a9c56', '#a8524e', '#6e8ab0']),
                 { top: 2, side: 2 });
        }

        /* the cast-iron body */
        K.mass(ctx, rx - 60, 92, 120, FLOOR_Y - 92, '#3e3e46', { top: 5, side: 10 });
        ctx.fillStyle = '#565660';                      /* the hotplate lids */
        ctx.fillRect(rx - 54, 90, 108, 4);
        ctx.fillStyle = '#7a7a86';
        ctx.fillRect(rx - 54, 89, 108, 1.4);

        /* THE FIRE. A firebox with the door open, logs in it, and the light
           it throws. This is the second warm source and it is what keeps a
           dark cat from disappearing on this side of the screen. */
        var fl = 0.74 + 0.26 * Math.sin(t * 0.09) + 0.08 * Math.sin(t * 0.31);
        ctx.fillStyle = '#241c1c';
        ctx.fillRect(rx - 44, 110, 60, 40);
        ctx.fillStyle = 'rgba(255,120,40,' + (0.5 * fl).toFixed(2) + ')';
        ctx.fillRect(rx - 41, 113, 54, 34);
        ctx.fillStyle = '#5a3a24';                      /* logs */
        ctx.fillRect(rx - 36, 136, 44, 6);
        ctx.fillRect(rx - 30, 130, 34, 5);
        for (var f2 = 0; f2 < 5; f2++) {                /* flames, hard shapes */
          var fx = rx - 32 + f2 * 11;
          var fh = 12 + Math.sin(t * 0.16 + f2 * 2.1) * 7 + K.vary(f2, 165, 0, 6);
          ctx.fillStyle = f2 % 2 ? 'rgba(255,196,90,.95)' : 'rgba(255,140,50,.95)';
          ctx.beginPath();
          ctx.moveTo(fx - 4, 132);
          ctx.lineTo(fx, 132 - fh);
          ctx.lineTo(fx + 4, 132);
          ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,240,190,.85)';
        ctx.fillRect(rx - 30, 128, 32, 3);
        K.glow(ctx, rx - 14, 130, 62, 'rgba(255,140,50,.9)', 0.30 * fl);
        /* the oven below, and the brass rail with a towel over it */
        ctx.fillStyle = '#2c2c34';
        ctx.fillRect(rx + 22, 110, 32, 40);
        ctx.fillStyle = 'rgba(255,150,60,.16)';
        ctx.fillRect(rx + 25, 113, 26, 34);
        ctx.strokeStyle = '#b08a3e'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(rx - 56, 104); ctx.lineTo(rx + 56, 104); ctx.stroke();
        ctx.fillStyle = '#c9553e';
        ctx.fillRect(rx + 36, 104, 14, 20 + Math.sin(t * 0.02) * 1.5);

        /* --- THE POT. Simmering for six seconds, over for one. --- */
        var pot = rx - 22;
        ctx.fillStyle = '#4e5058';                      /* body */
        ctx.beginPath(); ctx.ellipse(pot, 82, 21, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#63656e';
        ctx.beginPath(); ctx.ellipse(pot - 4, 80, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
        if (b.over > 0.05) {
          /* froth running down the side and hissing off the plate */
          ctx.fillStyle = 'rgba(248,242,220,' + (0.8 * b.over).toFixed(2) + ')';
          ctx.beginPath();
          ctx.moveTo(pot - 18, 76); ctx.lineTo(pot - 21, 92); ctx.lineTo(pot - 13, 92);
          ctx.lineTo(pot - 11, 76); ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.ellipse(pot - 16, 92, 12 * b.over, 3, 0, 0, Math.PI * 2); ctx.fill();
        }
        var hop = b.rattle * (2 + Math.abs(Math.sin(t * 0.9)) * 5);
        var tilt = b.over * 0.7;
        ctx.save();
        ctx.translate(pot + 2, 70 - hop);
        ctx.rotate(-tilt);
        ctx.fillStyle = '#8b909a';
        ctx.beginPath(); ctx.ellipse(0, 0, 20, 5.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b0b5bf';
        ctx.beginPath(); ctx.ellipse(-2, -1.4, 16, 3.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5a5c64';
        ctx.beginPath(); ctx.arc(0, -5, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        K.plume(ctx, pot, 68 - hop, t, {
          w: 12, rise: b.over > 0.1 ? 74 : 42, size: b.over > 0.1 ? 8 : 4.5,
          count: b.over > 0.1 ? 9 : 5, drift: 12,
          alpha: 0.34 + b.over * 0.40, speed: 0.014 + b.over * 0.02
        });
        /* the kettle, and a griddle leaning */
        ctx.fillStyle = '#9c4046';
        ctx.beginPath(); ctx.ellipse(rx + 34, 80, 12, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b8535a';
        ctx.beginPath(); ctx.ellipse(rx + 31, 78, 8, 7.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#7a3036'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(rx + 34, 72, 9, Math.PI, 0); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(rx + 45, 76); ctx.lineTo(rx + 52, 71); ctx.stroke();
      });

      /* =================================================================
         THE DRESSER — the huge close thing at the right edge. Dark, so the
         picture is dark-bright-dark across, with an oil lamp in it for the
         third warm source.
         ================================================================= */
      K.layer(ctx, camX, 0.42, function () {
        var dx = 352 - camX * 0.11;
        K.mass(ctx, dx - 62, -14, 130, H + 28, '#3a2a1a', { top: 0, side: 12, foot: false });
        ctx.fillStyle = '#241a10';
        ctx.fillRect(dx - 52, 16, 108, 122);
        for (var r = 0; r < 3; r++) {
          var sy = 44 + r * 34;
          /* Plates stood on edge at the back of the shelf. Drawn as whole
             circles and let the shelf lip cut them off — the first pass
             drew half-ellipses sitting ON the shelf and every row came out
             as a line of little rainbows. */
          for (var pp = 0; pp < 3; pp++) {
            var ppx = dx - 44 + pp * 21 + K.vary(r * 4 + pp, 172, -3, 3);
            var pr = K.vary(r * 4 + pp, 171, 8, 11.5);
            ctx.fillStyle = K.pick(r * 4 + pp, 170, ['#8e836e', '#7a7160', '#968b74']);
            ctx.beginPath(); ctx.arc(ppx, sy - 9, pr, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = K.pick(r * 4 + pp, 173, ['#b8ab92', '#a89c84', '#c2b69c']);
            ctx.beginPath(); ctx.arc(ppx - 1, sy - 10.5, pr - 1.5, 0, Math.PI * 2); ctx.fill();
          }
          /* jars in front of them, some missing */
          for (var q = 0; q < 4; q++) {
            if (K.chance(r * 7 + q, 131, 0.30)) continue;
            var jx = dx - 50 + q * 15.2;
            var jh = K.vary(r * 7 + q, 132, 8, 17);
            var jw = K.vary(r * 7 + q, 133, 4.4, 7);
            ctx.fillStyle = K.pick(r * 7 + q, 134,
              ['#b5763a', '#8a9c56', '#a8524e', '#6e8ab0', '#c2a94e', '#8a6bb0']);
            ctx.fillRect(jx, sy - jh, jw, jh);
            ctx.fillStyle = 'rgba(255,226,170,.20)';
            ctx.fillRect(jx, sy - jh, 1.4, jh);
            ctx.fillStyle = '#4a3520';
            ctx.fillRect(jx - 0.6, sy - jh - 2.2, jw + 1.2, 2.2);
          }
          K.mass(ctx, dx - 54, sy, 112, 5, '#6b5030', { top: 2, side: 5, foot: false });
        }
        /* the oil lamp, guttering */
        var lg = 0.8 + 0.2 * Math.sin(t * 0.07 + 1.4);
        K.glow(ctx, dx - 30, 106, 44, 'rgba(255,190,90,.9)', 0.34 * lg);
        ctx.fillStyle = '#c9b48a';
        ctx.beginPath();
        ctx.moveTo(dx - 36, 112); ctx.lineTo(dx - 24, 112);
        ctx.lineTo(dx - 26, 98); ctx.lineTo(dx - 34, 98); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,232,170,' + lg.toFixed(2) + ')';
        ctx.beginPath(); ctx.ellipse(dx - 30, 104, 3, 5.5 * lg, 0, 0, Math.PI * 2); ctx.fill();
        /* The base of it. Thirty pixels of flat black was the last dead
           area left in the picture: two panelled doors and the crocks
           stacked beside them cost four rects and fix it. */
        K.mass(ctx, dx - 52, 140, 108, FLOOR_Y - 140, '#4a3520', { top: 3, side: 8 });
        for (var dr = 0; dr < 2; dr++) {
          ctx.fillStyle = 'rgba(16,9,4,.45)';
          ctx.fillRect(dx - 48 + dr * 36, 148, 32, 20);
          ctx.fillStyle = 'rgba(255,214,150,.07)';
          ctx.fillRect(dx - 48 + dr * 36, 148, 32, 1.4);
          ctx.fillStyle = '#c2a05c';
          ctx.beginPath();
          ctx.arc(dx - 20 + dr * 36, 158, 2.2, 0, Math.PI * 2); ctx.fill();
        }
        /* a stack of pancheons against the foot of it, and the cat's bowl */
        for (var pn = 0; pn < 3; pn++) {
          var pw = 13 - pn * 1.5, py = 168 - pn * 7;
          ctx.fillStyle = ['#8a5a3a', '#9c6b44', '#7a4e32'][pn];
          ctx.beginPath(); ctx.ellipse(dx - 8, py, pw, 5, 0, Math.PI, 0); ctx.fill();
          ctx.fillStyle = 'rgba(255,214,150,.18)';   /* the rim, or they stack
                                                        up as one brown lump */
          ctx.fillRect(dx - 8 - pw, py - 5.5, pw * 2, 1.4);
        }

        /* A cat asleep on top of the dresser, only its back showing. Drawn
           in near-black to start with, on a near-black dresser top, which
           is to say not drawn at all. Ginger: a warm shape up in the dark
           corner, and it rhymes with the one in the basket by the range. */
        ctx.fillStyle = '#c9873f';
        ctx.beginPath();
        ctx.ellipse(dx - 30, 14 + Math.sin(t * 0.04) * 0.6, 16, 6, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.arc(dx - 16, 12, 5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath();                              /* an ear over the edge */
        ctx.moveTo(dx - 18, 8); ctx.lineTo(dx - 17, 3); ctx.lineTo(dx - 13, 7);
        ctx.closePath(); ctx.fill();
      });

      /* --- the light, laid over everything it falls on ------------------- */
      /* Narrow, and half the strength it started at: a shaft wide enough to
         cover the middle of the frame is not a shaft, it is a filter over
         the fight. */
      K.lightShaft(ctx, wx - 2, 84, 150, 'rgba(255,206,132,.5)', 0.13, 24, FLOOR_Y + 24);

      /* --- the floor: boards, and the window printed on them ------------- */
      K.grain(ctx, camX, 58, ['#4a3018', '#8a5f30'], 0.12);

      /* The patch of window light on the boards, with the shadow of the
         glazing bars across it. The bars are the detail that tells you the
         light came from the window rather than from nowhere. */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.30;
      ctx.fillStyle = 'rgba(255,198,120,.9)';
      ctx.beginPath();
      ctx.moveTo(wx - 66, FLOOR_Y); ctx.lineTo(wx + 62, FLOOR_Y);
      ctx.lineTo(wx + 24, H); ctx.lineTo(wx - 126, H);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = '#2e1c0e';
      ctx.beginPath();
      ctx.moveTo(wx - 22, FLOOR_Y); ctx.lineTo(wx - 16, FLOOR_Y);
      ctx.lineTo(wx - 44, H); ctx.lineTo(wx - 52, H); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(wx + 24, FLOOR_Y); ctx.lineTo(wx + 30, FLOOR_Y);
      ctx.lineTo(wx + 2, H); ctx.lineTo(wx - 6, H); ctx.closePath(); ctx.fill();
      ctx.restore();

      K.floorPool(ctx, W * 0.5, 190, 'rgba(255,214,146,.55)', 0.28);
      /* crumbs, flour, and a dropped wooden spoon */
      K.litter(ctx, camX, 1, 50, ['rgba(228,204,150,.40)', 'rgba(120,88,52,.45)'], 0.7, 1.9);
      ctx.save();
      ctx.translate(K.at(camX, 1, 210) % 460, 0);
      ctx.fillStyle = 'rgba(240,232,206,.30)';
      ctx.beginPath(); ctx.ellipse(0, 196, 16, 5, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#a8792f'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-8, 200); ctx.lineTo(8, 196); ctx.stroke();
      ctx.fillStyle = '#a8792f';
      ctx.beginPath(); ctx.ellipse(11, 195, 4, 2.6, -0.25, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      /* The basket goes in AFTER the floor. It was drawn with the range,
         which is before `grain`, so the floor painted straight over it and
         the cat was invisible for two rounds. */
      basketCat(ctx, rx - 32, FLOOR_Y + 20, t, b.over, 1.5);
      mouse(ctx, camX, t);
      /* Embers off the fire. Drawn here rather than through Particles:
         that system works in world space and wraps over a span, and what
         this wants is nine sparks tied to one firebox that moves with the
         range. Feeding it a fake camX to fake that was a trick that only
         half worked. */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (var e = 0; e < 9; e++) {
        var ek = ((t * 0.008 + K.hash(e, 210)) % 1);
        var ea = ek < 0.15 ? ek / 0.15 : 1 - (ek - 0.15) / 0.85;
        ctx.globalAlpha = Math.max(0, ea) * 0.8;
        ctx.fillStyle = e % 3 ? 'rgba(255,150,60,.95)' : 'rgba(255,232,170,.95)';
        var exx = rx - 34 + K.hash(e, 211) * 46 + Math.sin(t * 0.05 + e) * 4 * ek;
        ctx.beginPath();
        ctx.arc(exx, 132 - ek * 74, 1 + K.hash(e, 212), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      this.flour.update();
      this.flour.draw(ctx, camX, t);
    },

    drawFore: function (ctx, camX, t) {
      /* The pan rail, close enough to be cut off by the top of the frame.
         Six pans of three kinds at three lengths, not eleven circles. */
      K.layer(ctx, camX, 1.25, function () {
        K.mass(ctx, -10, 4, W + 20, 7, '#5c4128', { top: 3, side: 0, foot: false, edge: false });
        K.repeatX(camX, 0, 62, function (x, i) {
          if (K.chance(i, 136, 0.14)) return;
          var hang = K.vary(i, 137, 12, 34);
          var sw = K.sway(t, 0.018, 2.2, i);
          ctx.strokeStyle = '#2e2620'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(x, 11); ctx.lineTo(x + sw, 11 + hang); ctx.stroke();
          hangPan(ctx, x + sw, 11 + hang, K.vary(i, 138, 7, 12),
                  K.pick(i, 139, ['#a8712e', '#8d939c', '#9c4046', '#c08a3a']),
                  Math.abs(i) % 3);
        });
      });
      /* A string of onions in the very near corner. It was a bunch of herbs
         and it came out as a dark green blob — round warm shapes survive at
         this size, thin stems do not. */
      K.layer(ctx, camX, 1.4, function () {
        var hx = W - 20 - camX * 0.02;
        ctx.strokeStyle = '#6b5a34'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx - 3, 46); ctx.stroke();
        for (var o = 0; o < 7; o++) {
          var oy = 8 + o * 6.5;
          var ox2 = hx - o * 0.4 + (o % 2 ? 6 : -6) + K.vary(o, 190, -1.5, 1.5);
          var orr = K.vary(o, 191, 5, 7.5);
          ctx.fillStyle = K.pick(o, 192, ['#b5762e', '#c78a3c', '#9c6428']);
          ctx.beginPath(); ctx.ellipse(ox2, oy, orr, orr * 1.1, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,226,170,.28)';
          ctx.beginPath(); ctx.ellipse(ox2 - orr * 0.35, oy - orr * 0.3, orr * 0.3, orr * 0.5, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#7a5a24';
          ctx.fillRect(ox2 - 1, oy - orr * 1.5, 2, orr * 0.6);
        }
      });

      K.nearLip(ctx, 14, 0.40);
      K.vignette(ctx, 0.34);
    }
  };
})();
