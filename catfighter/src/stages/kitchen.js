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

   The composition is the Street Fighter II one — something ENORMOUS at
   each edge framing something tiny and far in the middle:

     left edge    the range and its chimney breast, floor to ceiling and
                  off the top of frame, with fire in it
     centre       the sash window: blazing, and through it a windmill the
                  size of a thumbnail turning on a hill a mile away
     right edge   the dresser, a dark mass with an oil lamp in it

   Three warm sources — firebox, window, lamp — in a room otherwise taken
   down to dark oak. Warm light in a dark picture is the strongest landmark
   there is, and it is also what stops a black cat vanishing into the wall.

   ------------------------------------------------------------------------
   WARM AGAINST COLD, added 10 Sep 2026.

   The room was all one temperature. Everything in it — the sink, the
   plates, the wall by the window, the pot — was some shade of the same
   brown, so the fire had nothing to be warm AGAINST and read as a patch of
   orange paint rather than as a light.

   The two sources are now different colours and the room is split between
   them. The sun coming through the glass is gold, but the SKY behind it is
   not: skylight is blue, and everything on the window side that the sun
   itself does not touch — the sink, the enamel, the draining plates, the
   wall in the reveal — is now a cold grey-blue. The range side is orange.
   The seam runs down the middle of the picture, which is where the fight
   is, so the cats cross from cold light into warm light as they move.

   ------------------------------------------------------------------------
   WHAT IS ALIVE IN HERE, and how often

   The owner's note on another stage — "I love the cat swinging by the
   barn" — is the most useful sentence in the project. What delights is not
   a painting, it is a character doing something with timing that you catch
   out of the corner of your eye. Everything below is on its own clock, and
   the periods are deliberately coprime so they never fall into step and a
   player finds them one at a time over several rounds:

     DRIP      197 frames   3.3 s   a drop swells at the tap and falls
     BOIL      421 frames   7.0 s   the pot goes over, the basket cat sits up
     MOUSE     617 frames  10.3 s   a mouse crosses along the skirting
     KETTLE    683 frames  11.4 s   the kettle finally boils and whistles
     WASH      887 frames  14.8 s   the cat on the mantel washes an ear
     THIEF    1013 frames  16.9 s   a cat steals the loaf off the table
     COLLAPSE 1571 frames  26.2 s   a log gives way: sparks, and the room
                                    brightens for a beat

   The rare ones are the treats. A long calm with a short burst in it is
   the shape that makes somebody watch for it a second time; a fire that
   showered sparks continuously would just be a fire with more sparks.
   ======================================================================= */
(function () {
  var K = CF.StageKit;
  var W = K.W, H = K.H, FLOOR_Y = K.FLOOR_Y;
  var P = K.Particles;

  /* --- the seven clocks. Coprime on purpose; see the header. ---------- */
  var DRIP = 197, BOIL = 421, MOUSE = 617, KETTLE = 683;
  var WASH = 887, THIEF = 1013, COLLAPSE = 1571;

  /* Where we are in a cycle, 0..1. */
  function ph(t, period, off) { return (((t + (off || 0)) % period) + period) / period % 1; }
  /* 0..1 across a window of a cycle, or -1 outside it. Every staged moment
     below is a handful of these stacked up, which is the whole of the
     timing language in this file. */
  function win(c, a, b) { return (c < a || c >= b) ? -1 : (c - a) / (b - a); }

  /* ---------------------------------------------------------------------
     THE BOIL-OVER. Seven seconds. Six of them are a quiet simmer, then the
     lid starts to hop, then it goes over: the lid lands askew, froth runs
     down the side of the pot and hisses off the hotplate, and the cat
     asleep in the basket sits bolt upright.
     ------------------------------------------------------------------- */
  function boil(t) {
    var c = ph(t, BOIL);
    if (c < 0.72) return { rattle: 0, over: 0 };
    if (c < 0.80) return { rattle: (c - 0.72) / 0.08, over: 0 };
    var k = (c - 0.80) / 0.20;
    return { rattle: 1 - k, over: Math.max(0, 1 - k * 1.4) };
  }

  /* ---------------------------------------------------------------------
     THE LOG COLLAPSE — the rarest thing in the room, once every 26 seconds.

     The top log gives way and drops into the bed. The flames go DOWN for
     about a quarter of a second first, which is the part that makes it
     read as an event rather than as a flicker, then everything comes back
     at once: a shower of sparks up the flue, the firelight on the floor a
     step brighter, and the whole left half of the picture lifts for a
     second before settling.

     Returns `heat` (a multiplier on flame height and on every warm light
     tied to the fire), `drop` (how far the top log has fallen) and `burst`
     (0..1 while the sparks are in the air).
     ------------------------------------------------------------------- */
  function fire(t) {
    var c = ph(t, COLLAPSE);
    var idle = 0.88 + 0.12 * Math.sin(t * 0.037) + 0.05 * Math.sin(t * 0.11);
    var dip = win(c, 0.80, 0.826);          /* the log gives — fire drops */
    var flare = win(c, 0.826, 0.92);        /* and comes back up          */
    if (dip >= 0) return { heat: idle * (1 - dip * 0.55), drop: dip * 4, burst: 0, settle: 1 };
    if (flare >= 0) {
      /* Straight up in three frames, then a long slow settle: that
         asymmetry is what a collapsing log actually does, and an even ease
         in and out reads as a pulsing lamp. */
      var up = flare < 0.06 ? flare / 0.06 : 1 - (flare - 0.06) / 0.94;
      return { heat: idle * (1 + up * 0.95), drop: 4, burst: Math.max(0, 1 - flare * 1.15), settle: 1 };
    }
    return { heat: idle, drop: c > 0.92 || c < 0.80 ? 0 : 4, burst: 0, settle: 0 };
  }

  /* ---------------------------------------------------------------------
     THE KETTLE. Eleven seconds of nothing, then two seconds of whistling:
     a hard white jet out of the spout, the lid chattering, and the whole
     thing rocking on the plate.
     ------------------------------------------------------------------- */
  function kettle(t) {
    var k = win(ph(t, KETTLE, 90), 0.74, 0.93);
    if (k < 0) return 0;
    /* on hard, off soft — a kettle does not fade in */
    return k < 0.08 ? k / 0.08 : 1 - Math.pow((k - 0.08) / 0.92, 2.2);
  }

  /* THE TAP. A drop swells, hangs, falls, and rings the enamel. Three and
     a bit seconds, and it is the thing that keeps the room from ever being
     completely still. */
  function drip(t) {
    var c = ph(t, DRIP);
    return { swell: win(c, 0.00, 0.58), fall: win(c, 0.58, 0.74), ring: win(c, 0.74, 0.92) };
  }

  /* ---------------------------------------------------------------------
     A flame. Three flat tones stacked, hard edges, no alpha ramp anywhere
     — a fire drawn with translucent triangles is a decal of a fire, which
     is what was here before.

     And it is STEPPED. Street Fighter II does not tween, and a flame is
     the most obvious place in a stage to break that rule by accident: a
     sine driving a vertex every frame gives a smooth rubbery wobble that
     nothing on a 1991 board could produce. Each tongue holds its drawing
     for four frames and the pop between them IS the flicker.
     ------------------------------------------------------------------- */
  var F_TONE = ['#b8380e', '#f07a1a', '#ffd062'];
  function flame(ctx, x, base, w, h, cel) {
    for (var k = 0; k < 3; k++) {
      var s = 1 - k * 0.30;
      /* each tone leans on its own beat, so the core is never a scaled
         copy of the outside and the tongue looks like it is moving air */
      var lean = ((cel + k * 5) % 7 - 3) * 0.9 * (1 - k * 0.25);
      var tip = h * s * (0.82 + ((cel + k * 3) % 5) * 0.09);
      ctx.fillStyle = F_TONE[k];
      ctx.beginPath();
      ctx.moveTo(x - w * s, base);
      ctx.lineTo(x - w * s * 0.62 + lean * 0.4, base - tip * 0.44);
      ctx.lineTo(x + lean, base - tip);
      ctx.lineTo(x + w * s * 0.66 + lean * 0.5, base - tip * 0.38);
      ctx.lineTo(x + w * s, base);
      ctx.closePath();
      ctx.fill();
    }
  }

  /* ---------------------------------------------------------------------
     Metal, and the three other materials in the room.

     Metal wants the biggest value range of anything in a kitchen: a
     near-black base, the body colour, a lit face, and one hard specular
     blip that is nearly white. Enamel gets two tones and a soft rim.
     Pottery gets two tones and NO blip — that missing highlight is the
     whole of what tells copper from a glazed crock at this size.
     ------------------------------------------------------------------- */
  function hangPan(ctx, x, y, r, col, kind) {
    var dark = K.darker(col, 0.62), mid = K.darker(col, 0.24), lit = K.lighter(col, 0.34);
    ctx.save();
    if (kind === 0) {                             /* saucepan, deep */
      ctx.fillStyle = dark;                       /* the whole body, in shadow */
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x - r * 0.86, y + r * 1.34);
      ctx.quadraticCurveTo(x, y + r * 1.9, x + r * 0.86, y + r * 1.34);
      ctx.lineTo(x + r, y);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = mid;                        /* the lit two-thirds */
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x - r * 0.86, y + r * 1.3);
      ctx.quadraticCurveTo(x - r * 0.2, y + r * 1.72, x + r * 0.2, y + r * 1.5);
      ctx.lineTo(x + r * 0.34, y);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = lit;                        /* the specular strip */
      ctx.fillRect(x - r * 0.82, y + 1, Math.max(1, r * 0.3), r * 1.15);
      ctx.fillStyle = '#fff0d2';                  /* and the blip on it */
      ctx.fillRect(x - r * 0.82, y + 2, Math.max(1, r * 0.3), Math.max(1, r * 0.3));
      ctx.fillStyle = '#1b1512';                  /* the open mouth */
      ctx.fillRect(x - r - 1, y - 1.5, r * 2 + 2, 2.5);
      ctx.fillStyle = K.lighter(col, 0.5);
      ctx.fillRect(x - r - 1, y - 1.5, r * 2 + 2, 1);
      ctx.fillStyle = '#2e2620';                  /* handle, out to one side */
      ctx.fillRect(x + r, y + 1, r * 1.5, 2);
    } else if (kind === 1) {                      /* frying pan, shallow */
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.ellipse(x, y + r * 0.5, r, r * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = mid;
      ctx.beginPath(); ctx.ellipse(x - r * 0.16, y + r * 0.34, r * 0.82, r * 0.56, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = lit;
      ctx.beginPath(); ctx.ellipse(x - r * 0.42, y + r * 0.16, r * 0.3, r * 0.2, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2e2620';
      ctx.fillRect(x + r * 0.7, y + r * 0.3, r * 1.7, 2);
    } else {                                      /* colander, holes and all */
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.fill();
      ctx.fillStyle = mid;
      ctx.beginPath(); ctx.arc(x - r * 0.15, y - 1, r * 0.84, Math.PI, 0); ctx.fill();
      ctx.fillStyle = lit;
      ctx.fillRect(x - r * 0.74, y - r * 0.66, Math.max(1, r * 0.26), r * 0.5);
      ctx.fillStyle = 'rgba(18,14,10,.85)';
      for (var h = 0; h < 4; h++) {
        ctx.fillRect(x - r * 0.6 + h * r * 0.4, y - r * 0.45 - (h % 2) * 2, 1.4, 1.4);
      }
      ctx.fillStyle = '#1b1512';
      ctx.fillRect(x - r - 1, y - 1, r * 2 + 2, 2);
      ctx.fillStyle = K.lighter(col, 0.5);
      ctx.fillRect(x - r - 1, y - 1, r * 2 + 2, 1);
    }
    ctx.restore();
  }

  /* ---------------------------------------------------------------------
     The cat curled in the basket at the foot of the range, and the same cat
     sitting bolt upright when the pot goes over.

     Drawn in the same ginger as the basket to begin with, which is to say
     not drawn at all: at fifteen pixels across, a tan cat in a tan basket
     is one tan lump. The basket is dark wicker now and the cat is light,
     and the fire is close enough on its left to put a hard warm edge down
     that side.
     ------------------------------------------------------------------- */
  function basketCat(ctx, x, y, t, alarm, s, heat) {
    var breathe = Math.sin(t * 0.045) * 0.7;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s || 1, s || 1);
    ctx.fillStyle = '#4a3418';                            /* the basket, behind */
    ctx.beginPath(); ctx.ellipse(0, -4, 15, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    if (alarm > 0.2) {
      var up = alarm * 9;
      ctx.fillStyle = '#e8b877';
      ctx.beginPath(); ctx.ellipse(0, -8 - up * 0.4, 6, 8 + up * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(1, -17 - up, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();                                    /* ears back */
      ctx.moveTo(-3, -20 - up); ctx.lineTo(-7, -23 - up); ctx.lineTo(-2, -22.5 - up);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4, -20 - up); ctx.lineTo(7, -24 - up); ctx.lineTo(5, -22.5 - up);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c98a45';                          /* the shadow side */
      ctx.beginPath(); ctx.ellipse(3.4, -8 - up * 0.4, 2.6, 7.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1e1814';                          /* eyes wide */
      ctx.beginPath(); ctx.arc(-0.6, -17.5 - up, 1.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(3.2, -17.5 - up, 1.3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#e8b877';                          /* curled, breathing */
      ctx.beginPath(); ctx.ellipse(0, -10 + breathe, 11, 6 + breathe * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-7, -11, 4.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c98a45';                          /* tail, and the far
                                                             side of the back */
      ctx.beginPath(); ctx.ellipse(6, -11, 5, 2.4, -0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(1, -7.4 + breathe * 0.4, 9, 2.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2a1e';                          /* shut eye */
      ctx.fillRect(-9.4, -12, 3, 1);
    }
    ctx.fillStyle = '#6b4c24';                            /* the front of the
                                                             basket, over it */
    ctx.beginPath(); ctx.ellipse(0, -2, 15, 5, 0, Math.PI, 0, true); ctx.fill();
    ctx.fillStyle = '#8a6534';
    ctx.fillRect(-15, -6.6, 30, 1.4);
    ctx.strokeStyle = 'rgba(28,18,8,.7)'; ctx.lineWidth = 1;
    for (var b = -12; b <= 12; b += 5) {
      ctx.beginPath(); ctx.moveTo(b, -6.5); ctx.lineTo(b, -1); ctx.stroke();
    }
    /* The firelight down the side facing the range. A hard rim, not a
       wash: the fire is two feet away and it is the brightest thing in
       the room. */
    ctx.fillStyle = 'rgba(255,176,84,' + Math.min(0.92, 0.6 * (heat || 1)).toFixed(2) + ')';
    ctx.beginPath();
    ctx.moveTo(-15, -3); ctx.lineTo(-12.6, -7.4);
    ctx.lineTo(-12.6, -1.4); ctx.lineTo(-15, -1);
    ctx.closePath(); ctx.fill();
    if (alarm <= 0.2) {
      ctx.beginPath();
      ctx.ellipse(-9.4, -12.6, 2.6, 3, 0.3, Math.PI * 0.55, Math.PI * 1.45); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------------------------------------------------------------------
     THE CAT ON THE MANTEL, washing.

     Fifteen seconds sat on the warm shelf over the range, then it licks a
     paw and drags it over one ear, three times, and settles again.

     It is lit FROM BELOW, which is the reason it is up there rather than
     anywhere else: the fire is directly under it, so its underside is the
     lit face and its back is in shadow. Nothing else in the room is lit
     that way round and it is the cheapest bit of drama on the stage.
     ------------------------------------------------------------------- */
  function mantelCat(ctx, x, y, t, heat) {
    var c = ph(t, WASH, 260);
    var lick = win(c, 0.80, 0.95);
    var breathe = Math.sin(t * 0.04) * 0.5;
    var back = '#6b4520', belly = '#e0a458';
    ctx.save();
    ctx.translate(x, y);

    /* tail, curled round the feet */
    ctx.strokeStyle = back; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(4.5, -2);
    ctx.quadraticCurveTo(-9, -1 + K.sway(t, 0.03, 1.2, 2), -8.5, -7);
    ctx.stroke();

    /* body — shadow first, then the lit underside laid over it with a
       hard edge, which is `celFill`'s recipe done by hand */
    ctx.fillStyle = back;
    ctx.beginPath(); ctx.ellipse(0, -8 + breathe, 6.6, 9.4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = belly;
    ctx.beginPath(); ctx.ellipse(-0.6, -6 + breathe, 5.6, 6.8, 0, 0, Math.PI * 2); ctx.fill();

    /* head. It tips down towards the paw during a lick and the drop is
       stepped, not eased — three held positions, one per lick. */
    var lickN = lick >= 0 ? Math.floor(lick * 3) : -1;
    var lickK = lick >= 0 ? (lick * 3) % 1 : 0;
    var tip = lick >= 0 ? Math.sin(lickK * Math.PI) : 0;
    var hx = -1 + tip * 1.6, hy = -19 + tip * 3.4;
    ctx.fillStyle = back;
    ctx.beginPath(); ctx.arc(hx, hy, 5.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();                                       /* ears */
    ctx.moveTo(hx - 4.4, hy + 2.6); ctx.lineTo(hx - 5.2, hy + 8.4); ctx.lineTo(hx - 0.8, hy + 4.6);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + 1.4, hy + 4.8); ctx.lineTo(hx + 4.6, hy + 8.6); ctx.lineTo(hx + 4.8, hy + 2.6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = belly;                                 /* muzzle, lit */
    ctx.beginPath(); ctx.ellipse(hx - 2.6, hy - 1.6, 3.4, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a1d12';
    ctx.fillRect(hx - 4.2, hy - 0.2, 2.6, 1);              /* the shut eye */

    /* the paw. Down and tucked, or up at the mouth and then over the ear. */
    ctx.fillStyle = belly;
    if (lick < 0) {
      ctx.beginPath(); ctx.ellipse(-3.6, -1.6, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      /* over the ear on the second and third pass — the first is a lick,
         the rest are the wipe, which is what a cat actually does */
      var over = lickN > 0 ? Math.sin(lickK * Math.PI) : 0;
      var pxx = hx - 3.4 - over * 1.6, pyy = hy - 3.6 + over * 9;
      ctx.beginPath(); ctx.ellipse(pxx, pyy, 2.6, 2.2, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = belly; ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-3.2, -3.4); ctx.quadraticCurveTo(-4.6, pyy + 3, pxx, pyy);
      ctx.stroke();
    }
    /* the fire's own edge, straight up the underside */
    ctx.fillStyle = 'rgba(255,186,96,' + Math.min(0.9, 0.52 * (heat || 1)).toFixed(2) + ')';
    ctx.beginPath(); ctx.ellipse(-0.6, -2.4, 5.4, 2, 0, Math.PI, 0, true); ctx.fill();
    ctx.restore();
  }

  /* ---------------------------------------------------------------------
     THE LOAF THIEF — the long one, once every seventeen seconds.

     A cat comes up over the far edge of the table: ears, then eyes, then a
     freeze with the whole head showing while it works out whether anybody
     is watching. Then it slides along the table towards the loaf, plants a
     paw on it, and drops out of sight with the loaf in its mouth. The
     board is empty for three seconds afterwards, which is the joke.

     The freeze is the whole thing. A cat that walked smoothly up to the
     bread and took it would be a moving decoration; the pause is what
     makes it read as a decision, and it is where somebody watching starts
     to grin.

     Returns null when nothing is happening, so the caller pays nothing for
     it fourteen seconds out of seventeen.
     ------------------------------------------------------------------- */
  function thief(t) {
    var c = ph(t, THIEF, 40);
    var rise = win(c, 0.52, 0.585);       /* ears and eyes over the edge   */
    var hold = win(c, 0.585, 0.70);       /* the freeze                    */
    var creep = win(c, 0.70, 0.79);       /* along the table               */
    var grab = win(c, 0.79, 0.845);       /* paw on it, then the mouth     */
    var gone = win(c, 0.845, 0.90);       /* down the far side with it     */
    if (rise >= 0) return { up: rise, slide: 0, phase: 0, loaf: 1 };
    if (hold >= 0) return { up: 1, slide: 0, phase: 1, loaf: 1 };
    if (creep >= 0) {
      /* four held steps, not a slide: nothing in this game tweens and a
         cat crossing a table in a smooth ramp is the most obvious tell */
      return { up: 1, slide: Math.floor(creep * 4 + 0.5) / 4, phase: 2, loaf: 1 };
    }
    if (grab >= 0) return { up: 1, slide: 1, phase: 3, loaf: 1, bite: grab };
    if (gone >= 0) return { up: 1 - gone, slide: 1, phase: 4, loaf: 0, bite: 1 };
    return { up: 0, slide: 0, phase: -1, loaf: c < 0.90 ? 1 : 0 };
  }

  /* The thief itself. A dark cat against the window, so it is a silhouette
     with one cold rim down the lit side — the only figure in the room lit
     by the sky rather than by the fire. */
  function thiefCat(ctx, x, y, s) {
    if (s.up <= 0) return;
    var up = s.up * 22;                              /* how far over the edge */
    var lean = s.phase === 2 ? 2.2 : s.phase >= 3 ? 4.5 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#2a2630';
    /* shoulders, only as much of them as has cleared the table */
    ctx.beginPath();
    ctx.ellipse(-3 - lean * 0.3, -up * 0.30, 7.5, Math.max(0.6, up * 0.34), 0, 0, Math.PI * 2);
    ctx.fill();
    var hx = 3 + lean, hy = -up * 0.68;
    ctx.beginPath(); ctx.arc(hx, hy, 5.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();                                  /* ears, flat and wide */
    ctx.moveTo(hx - 4.6, hy - 2.4); ctx.lineTo(hx - 5.6, hy - 8.4); ctx.lineTo(hx - 0.6, hy - 4.6);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx + 1.2, hy - 4.8); ctx.lineTo(hx + 4.8, hy - 8.6); ctx.lineTo(hx + 4.9, hy - 2.4);
    ctx.closePath(); ctx.fill();
    if (s.phase >= 2) {                               /* the reaching paw */
      ctx.beginPath();
      ctx.ellipse(hx + 6 + (s.bite || 0) * 3, -1.6, 3.2, 2.2, -0.3, 0, Math.PI * 2); ctx.fill();
    }
    if (s.up > 0.7) {                                 /* the eyes, and they
                                                         are the whole gag */
      ctx.fillStyle = '#e8d46a';
      ctx.beginPath(); ctx.ellipse(hx - 1.6, hy + 0.6, 1.5, 1.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx + 2.6, hy + 0.6, 1.5, 1.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1510';
      ctx.fillRect(hx - 2.1, hy - 0.4, 1, 2);
      ctx.fillRect(hx + 2.1, hy - 0.4, 1, 2);
    }
    /* the loaf, once it is in the mouth */
    if (s.phase === 4) {
      ctx.fillStyle = '#c98d4a';
      ctx.beginPath(); ctx.ellipse(hx + 6, hy + 1, 7, 4.4, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e2b06a';
      ctx.beginPath(); ctx.ellipse(hx + 5, hy - 0.4, 5, 2.6, 0.2, 0, Math.PI * 2); ctx.fill();
    }
    /* the cold rim off the window — this cat is the one thing in the room
       the fire does not reach */
    ctx.fillStyle = 'rgba(176,198,232,.55)';
    ctx.beginPath();
    ctx.ellipse(hx - 3.4, hy + 0.4, 2, 4.4, 0.35, Math.PI * 0.45, Math.PI * 1.5); ctx.fill();
    ctx.restore();
  }

  /* A mouse along the skirting. Ten seconds apart, gone in two — one of the
     things to find rather than one of the things to look at. */
  function mouse(ctx, camX, t) {
    var c = ph(t, MOUSE, 130);
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
      var fi = fire(t);
      var kt = kettle(t);
      var th = thief(t);
      var cel = Math.floor(t / 4);          /* the held-drawing clock */

      /* The room, dark oak. Everything that follows is either warm light or
         something standing in front of it. */
      K.sky(ctx, [[0, '#33241a'], [0.5, '#452f1f'], [1, '#56391f']], 0, FLOOR_Y);

      /* --- the wall behind everything: tongue-and-groove, no two boards the
             same shade, and a plate rail across it ------------------------ */
      K.layer(ctx, camX, 0.10, function () {
        K.repeatX(camX, 0, 13, function (x, i) {
          ctx.fillStyle = 'rgba(18,10,4,' + K.vary(i, 130, 0.02, 0.22).toFixed(3) + ')';
          ctx.fillRect(x, 0, 13, FLOOR_Y);
          ctx.fillStyle = 'rgba(255,214,150,.045)';
          ctx.fillRect(x, 0, 1, FLOOR_Y);
        });
        K.mass(ctx, -10, 40, W + 20, 5, '#4e3722', { top: 2, side: 0, foot: false, edge: false });
      });

      /* =================================================================
         THE WINDOW — the bright landmark, and the cold half of the room.

         Pinned to the screen with a hair of drift, because a landmark that
         scrolls away is not a landmark. It is 160 wide and 120 tall in a
         384x224 frame: a third of the picture.
         ================================================================= */
      var wx = 202 - camX * 0.03;
      K.layer(ctx, camX, 0.16, function () {
        var gx0 = wx - 70, gx1 = wx + 70, gy0 = 20, gy1 = 122;

        /* the reveal — a deep splay, so the wall has thickness. Cold: it
           faces the sky, and it is the first thing that says which half of
           the room this is. */
        K.mass(ctx, wx - 82, 12, 164, 118, '#46433f', { top: 4, side: 8, foot: false });
        ctx.fillStyle = 'rgba(120,150,190,.16)';
        ctx.fillRect(wx - 82, 12, 164, 4);

        ctx.save();
        ctx.beginPath(); ctx.rect(gx0, gy0, 140, 102); ctx.clip();

        /* THE EVENING ITSELF.

           A window that is all one pale peach is a lamp, not a view — the
           first pass was exactly that and the hills inside it vanished.
           Dusk violet at the top down through to the sun's own band gives
           the glass its own light-to-dark run, so what is in front of it
           reads as silhouette rather than as more of the same colour.

           The top is colder than it was. It is the only genuinely cool
           thing in the picture and it has to hold its end of the contrast
           against a lit range on the other side of the frame. */
        var sg = ctx.createLinearGradient(0, gy0, 0, gy1);
        sg.addColorStop(0, '#3c3a72');
        sg.addColorStop(0.26, '#6e4f80');
        sg.addColorStop(0.50, '#c47a63');
        sg.addColorStop(0.70, '#f5ab5e');
        sg.addColorStop(0.86, '#ffdc92');
        sg.addColorStop(1, '#b8563a');
        ctx.fillStyle = sg;
        ctx.fillRect(gx0, gy0, 140, 102);

        /* the sun, low and nearly down.
           Both of these were at the left of the glass, which is precisely
           where fighter one's head is: the windmill turned for a week
           behind a cat and nobody ever saw it. The gap between two
           fighters in a neutral stance is the middle of the window, so
           that is where the two things worth seeing now live. */
        var sunX = wx + 14, sunY = 92;
        K.glow(ctx, sunX, sunY, 34, 'rgba(255,222,150,.95)', 0.62);
        ctx.fillStyle = '#fff4d2';
        ctx.beginPath(); ctx.arc(sunX, sunY, 10, 0, Math.PI * 2); ctx.fill();

        /* Two hazed hill bands. Darker than they were: at mid-purple they
           were the same value as the room and the whole view read as one
           mauve smear. Nearly-silhouette hills give the sun something to
           be bright against, which is the only job they have. */
        ctx.fillStyle = '#6e3550';
        ctx.beginPath();
        ctx.moveTo(gx0, gy1);
        for (var hx = 0; hx <= 140; hx += 7) {
          ctx.lineTo(gx0 + hx, 84 - Math.sin(hx * 0.035) * 7 - Math.sin(hx * 0.11) * 2.5);
        }
        ctx.lineTo(gx1, gy1); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#4e2338'; ctx.lineWidth = 1.4;   /* hedgerows */
        for (var hg = 0; hg < 3; hg++) {
          ctx.beginPath();
          ctx.moveTo(gx0 + 12 + hg * 46, 96);
          ctx.quadraticCurveTo(gx0 + 30 + hg * 46, 90, gx0 + 26 + hg * 46, 82);
          ctx.stroke();
        }
        ctx.fillStyle = '#33182a';
        ctx.beginPath();
        ctx.moveTo(gx0, gy1);
        for (var hx2 = 0; hx2 <= 140; hx2 += 7) {
          ctx.lineTo(gx0 + hx2, 98 - Math.sin(hx2 * 0.05 + 2) * 6 - Math.sin(hx2 * 0.14) * 2);
        }
        ctx.lineTo(gx1, gy1); ctx.closePath(); ctx.fill();

        /* SCALE CONTRAST — the whole point of the window. A windmill the
           size of a fingernail, a mile off, framed by a window frame the
           size of a door. It turns; it is the slowest loop in the room.

           It was eleven pixels of stick and read as a broken umbrella. It
           is taller now, the tower actually tapers, the cap has a finial,
           and each sail is a LATTICE — two rails with bars across — rather
           than a single stroke. A sail drawn as one line at this size is a
           scratch on the glass. */
        var mx = wx - 24, my = 80;
        ctx.fillStyle = '#2a172a';
        ctx.beginPath();
        ctx.moveTo(mx - 5.5, my + 16); ctx.lineTo(mx - 2.6, my - 15);
        ctx.lineTo(mx + 2.6, my - 15); ctx.lineTo(mx + 5.5, my + 16);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();                                    /* the cap */
        ctx.moveTo(mx - 4, my - 14); ctx.lineTo(mx, my - 21);
        ctx.lineTo(mx + 4, my - 14); ctx.closePath(); ctx.fill();
        ctx.fillRect(mx - 0.5, my - 24, 1, 3);              /* the finial */
        var a0 = t * 0.012, hub = my - 15;
        for (var sl = 0; sl < 4; sl++) {
          var a = a0 + sl * Math.PI / 2;
          var ca = Math.cos(a), sa = Math.sin(a);
          ctx.save();
          ctx.translate(mx, hub);
          ctx.rotate(a);
          ctx.fillStyle = '#2a172a';
          ctx.fillRect(1, -2.2, 15, 1);                     /* the two rails */
          ctx.fillRect(1, 1.2, 15, 1);
          for (var bar = 0; bar < 4; bar++) {
            ctx.fillRect(3 + bar * 3.4, -2.2, 1, 4.4);      /* and the bars */
          }
          ctx.restore();
          if (sl === 0) { ca = ca; sa = sa; }
        }
        ctx.fillStyle = '#2a172a';
        ctx.beginPath(); ctx.arc(mx, hub, 2, 0, Math.PI * 2); ctx.fill();

        /* a barn and a silo beside it, smaller still — the far end of the
           scale run that starts with the range hood at the left edge */
        ctx.fillRect(mx + 30, my + 6, 13, 9);
        ctx.beginPath();
        ctx.moveTo(mx + 29, my + 6); ctx.lineTo(mx + 36, my + 1); ctx.lineTo(mx + 43, my + 6);
        ctx.closePath(); ctx.fill();
        ctx.fillRect(mx + 45, my, 4.5, 15);
        ctx.beginPath();
        ctx.moveTo(mx + 44.4, my); ctx.lineTo(mx + 47.2, my - 3.4);
        ctx.lineTo(mx + 50, my); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#f5c06a';                          /* one lit window
                                                               in the barn */
        ctx.fillRect(mx + 34, my + 9, 3, 3);

        /* Poplars along the lane. Five, not seven, and thin: they were fat
           enough to read as bushes and they crowded the windmill out of
           its own sky. Anything within sixteen pixels of the tower is
           dropped outright. */
        for (var pl = 0; pl < 5; pl++) {
          var px = gx0 + 14 + pl * 27 + K.vary(pl, 141, -6, 6);
          if (Math.abs(px - mx) < 17) continue;
          ctx.fillStyle = pl > 2 ? '#2e1a26' : '#24141e';
          ctx.beginPath();
          ctx.ellipse(px, 93 - K.vary(pl, 142, 2, 7), K.vary(pl, 143, 1.8, 2.8),
                      K.vary(pl, 144, 8, 15), 0, 0, Math.PI * 2);
          ctx.fill();
        }

        /* rooks going home across the glass, on a slow loop */
        for (var bd = 0; bd < 4; bd++) {
          var bx = gx0 - 20 + ((t * 0.22 + bd * 46) % 190);
          K.bird(ctx, bx, 44 + Math.sin(t * 0.02 + bd) * 5 + bd * 5, 1.1,
                 t, bd * 2, 'rgba(48,26,36,.8)');
        }

        /* the glass itself: a wedge of reflected room across the top panes.
           Cheap, and it is the difference between a window and a hole. */
        ctx.fillStyle = 'rgba(255,244,214,.09)';
        ctx.beginPath();
        ctx.moveTo(gx0, gy0); ctx.lineTo(gx0 + 74, gy0);
        ctx.lineTo(gx0, gy0 + 62); ctx.closePath(); ctx.fill();
        ctx.restore();

        /* the sashes — six panes, the meeting rail thickest */
        ctx.fillStyle = '#37342f';
        ctx.fillRect(gx0 + 45, gy0, 4, 102);
        ctx.fillRect(gx0 + 91, gy0, 4, 102);
        ctx.fillRect(gx0, 66, 140, 6);
        ctx.fillStyle = 'rgba(214,232,255,.30)';   /* the sky catching the bars */
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
        K.mass(ctx, wx - 88, 122, 176, 9, '#8f8d84', { top: 4, side: 6 });
        for (var c = 0; c < 6; c++) {
          var sc = K.vary(c, 180, 0.72, 1.06);
          var cxx = wx - 62 + c * 25 + K.vary(c, 181, -4, 4);
          var cph = K.hash(c, 182) * 6.28;
          var hop = (mood || 0) > 0.5
            ? Math.max(0, Math.sin(t * 0.2 + cph)) * 5 * (mood || 0) : 0;
          var bob = Math.sin(t * 0.035 + cph) * 0.9 + hop;
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
          ctx.quadraticCurveTo(-12 * sc, K.sway(t, 0.06, 3, cph), -11 * sc, 8 * sc);
          ctx.stroke();
          ctx.restore();
        }
      });

      /* --- the sink under the window, the dish rack, and the tap --------
             Cold. Enamel and galvanised iron under a blue sky, two feet
             from a lit range: this is the far end of the temperature run
             and if it goes warm the whole contrast collapses.            */
      var dp = drip(t);
      K.layer(ctx, camX, 0.20, function () {
        K.mass(ctx, wx - 44, 132, 88, 24, '#7e8894', { top: 3, side: 7 });
        ctx.fillStyle = 'rgba(24,32,44,.45)';
        ctx.fillRect(wx - 38, 136, 76, 5);
        ctx.fillStyle = 'rgba(186,214,240,.35)';           /* water in it */
        ctx.fillRect(wx - 36, 137, 72, 3);
        ctx.strokeStyle = '#aeb8c2'; ctx.lineWidth = 2.4;   /* the tap */
        ctx.beginPath();
        ctx.moveTo(wx + 26, 132); ctx.lineTo(wx + 26, 122);
        ctx.quadraticCurveTo(wx + 26, 117, wx + 16, 118);
        ctx.stroke();
        ctx.fillStyle = '#e8f2ff';                          /* the one blip */
        ctx.fillRect(wx + 25, 122, 1, 8);

        /* THE DRIP. Three and a bit seconds, and it is the smallest thing
           on the stage — but a kitchen where nothing at all moves for
           eleven seconds between the pot and the kettle is a photograph. */
        if (dp.swell >= 0) {
          var sr = 0.8 + dp.swell * 1.5;
          ctx.fillStyle = '#cfe4fa';
          ctx.beginPath(); ctx.ellipse(wx + 15, 120 + sr * 0.5, sr * 0.8, sr, 0, 0, Math.PI * 2); ctx.fill();
        } else if (dp.fall >= 0) {
          var fy = 120 + dp.fall * dp.fall * 16;
          ctx.fillStyle = '#cfe4fa';
          ctx.beginPath(); ctx.ellipse(wx + 15, fy, 1.1, 2 + dp.fall * 1.4, 0, 0, Math.PI * 2); ctx.fill();
        } else if (dp.ring >= 0) {
          ctx.strokeStyle = 'rgba(214,236,255,' + (1 - dp.ring).toFixed(2) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(wx + 15, 138, 2 + dp.ring * 7, 1 + dp.ring * 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        /* Draining, beside the sink. Four narrow upright ellipses were
           meant to be plates on edge and came out as a row of white fangs
           under the cats on the sill — at this size a plate has to be
           round, or it is not a plate. Enamel: two tones and a soft rim,
           no specular blip. That missing blip is what stops them reading
           as more metal. */
        for (var d = 0; d < 3; d++) {
          var pdx = wx - 34 + d * 13;
          ctx.fillStyle = '#6f7b88';
          ctx.beginPath(); ctx.arc(pdx, 130, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#c2cedc';
          ctx.beginPath(); ctx.arc(pdx - 1, 129, 5.4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#98a4b0';                          /* a jug beside them */
        ctx.fillRect(wx + 4, 120, 10, 12);
        ctx.beginPath(); ctx.ellipse(wx + 9, 120, 5, 2.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d2dceb';
        ctx.fillRect(wx + 4, 120, 1.6, 12);
      });

      /* --- the mid ground: the scrubbed table, with the day's work on it -

             No crowd on it. Six spectators were tried here and every one
             was either cut off at the chest by the table edge or hidden by
             the dresser; they are on the window sill now.

             The loaf lives here, and so does whoever is after it.        */
      K.layer(ctx, camX, 0.30, function () {
        var tx = 296 - camX * 0.09;
        ctx.fillStyle = 'rgba(30,18,8,.45)';                 /* legs, in shadow */
        ctx.fillRect(tx - 92, 152, 7, FLOOR_Y - 152);
        ctx.fillRect(tx + 82, 152, 7, FLOOR_Y - 152);
        K.mass(ctx, tx - 100, 144, 196, 8, '#8a6238', { top: 5, side: 7 });

        /* the board, the loaf, and a bowl. The board sits at the LEFT end
           of the table on purpose: that is the gap between two fighters in
           a neutral stance, and it is the one strip of mid-ground that is
           reliably not behind somebody's shoulder. */
        var bdx = tx - 64;
        K.mass(ctx, bdx - 16, 136, 34, 8, '#c2a06a', { top: 3, side: 4, foot: false });
        if (th.loaf) {
          var tip = th.bite ? th.bite * 0.4 : 0;
          ctx.save();
          ctx.translate(bdx + 2, 136);
          ctx.rotate(-tip);
          ctx.fillStyle = '#c98d4a';
          ctx.beginPath(); ctx.ellipse(0, 0, 13, 8, 0, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#e2b06a';
          ctx.beginPath(); ctx.ellipse(-3, -2, 9, 5, 0, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#8f5a26';                         /* the slashes */
          ctx.fillRect(-6, -6, 1.4, 4); ctx.fillRect(0, -7, 1.4, 5);
          ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(226,196,140,.35)';           /* crumbs, and a
                                                                clean board */
          ctx.fillRect(bdx - 6, 133, 2, 1.4);
          ctx.fillRect(bdx + 4, 134, 1.6, 1.2);
        }
        ctx.fillStyle = '#c8cdd4';
        ctx.beginPath(); ctx.ellipse(tx + 30, 144, 14, 7, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#9aa2ac';
        ctx.beginPath(); ctx.ellipse(tx + 30, 143, 14, 3, 0, 0, Math.PI * 2); ctx.fill();

        /* THE THIEF, up over the far edge. Seventeen seconds apart; see
           `thief()` for the beats. */
        thiefCat(ctx, bdx - 32 + th.slide * 26, 139, th);
      });

      /* =================================================================
         THE RANGE — the huge close thing at the left edge, and the warm
         half of the room.

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
        ctx.fillStyle = 'rgba(18,10,6,.40)';          /* sixty years of soot */
        ctx.beginPath();
        ctx.moveTo(rx - 34, 34); ctx.lineTo(rx + 34, 34);
        ctx.lineTo(rx + 20, -26); ctx.lineTo(rx - 20, -26); ctx.closePath(); ctx.fill();
        /* The fire, up the inside of the breast. It is the only light in
           the room that reaches the ceiling and it moves with the flames,
           so the top-left corner is never a dead brown block. */
        ctx.fillStyle = 'rgba(255,132,44,' + (0.10 * fi.heat).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(rx - 30, 34); ctx.lineTo(rx + 30, 34);
        ctx.lineTo(rx + 15, -26); ctx.lineTo(rx - 15, -26); ctx.closePath(); ctx.fill();
        K.mass(ctx, rx - 82, 34, 164, 8, '#8a6a44', { top: 4, side: 7 });   /* the lip */

        /* THE RECESS the range stands in. Dark, and the whole reason the
           steam off the pot can be seen at all — against the old
           light-brown wall it was a pale plume on a pale ground. */
        ctx.fillStyle = '#1e150e';
        ctx.fillRect(rx - 72, 42, 144, 52);
        ctx.fillStyle = 'rgba(255,140,50,' + (0.11 * fi.heat).toFixed(3) + ')';
        ctx.fillRect(rx - 72, 62, 144, 32);
        /* implements on hooks under the lip — a kitchen tells you what
           happens in it by what is left hanging where it is used */
        for (var u = 0; u < 5; u++) {
          var ux = rx - 56 + u * 26 + K.vary(u, 166, -3, 3);
          var ul = K.vary(u, 167, 12, 22);
          ctx.strokeStyle = '#6e6e78'; ctx.lineWidth = 1.6;
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
            ctx.fillStyle = '#2e2e36';
            ctx.beginPath(); ctx.arc(ux, 43 + ul + 3.5, 2, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = 'rgba(255,190,110,.5)';     /* the fire on the metal */
          ctx.fillRect(ux - 0.8, 43 + ul, 1, 5);
        }
        /* what stands on the lip: the clock, and four crocks */
        ctx.fillStyle = '#3f2f20';
        ctx.beginPath(); ctx.arc(rx + 44, 24, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e8dcc0';
        ctx.beginPath(); ctx.arc(rx + 44, 24, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3f2f20'; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(rx + 44, 24);
        ctx.lineTo(rx + 44 + Math.cos(t * 0.004 - 1) * 4, 24 + Math.sin(t * 0.004 - 1) * 4);
        ctx.moveTo(rx + 44, 24); ctx.lineTo(rx + 44, 20);
        ctx.stroke();
        for (var j = 0; j < 4; j++) {
          /* Pottery: two tones, matte, and NO highlight. Set beside the
             copper on the rail it is what tells you one is metal. */
          K.mass(ctx, rx - 70 + j * 15, 22, 10, 12,
                 K.pick(j, 164, ['#b5763a', '#8a9c56', '#a8524e', '#6e8ab0']),
                 { top: 2, side: 2 });
        }

        /* THE CAT ON THE MANTEL. Washing, every fifteen seconds, lit from
           underneath by the fire — the only figure in the game with the
           light coming up at it. */
        mantelCat(ctx, rx + 12, 34, t, fi.heat);

        /* the cast-iron body */
        K.mass(ctx, rx - 60, 92, 120, FLOOR_Y - 92, '#34343e', { top: 5, side: 10 });
        ctx.fillStyle = '#4c4c56';                      /* the hotplate lids */
        ctx.fillRect(rx - 54, 90, 108, 4);
        ctx.fillStyle = '#7a7a86';
        ctx.fillRect(rx - 54, 89, 108, 1.4);

        /* =============================================================
           THE FIRE. Rebuilt 10 Sep 2026.

           It was a translucent orange rectangle with five alpha triangles
           standing in it and a sixty-pixel grey bloom laid over the range.
           Three things were wrong with that and each is a separate lesson:

           - A FIRE HAS TO BE OPAQUE. Every tone here is a flat fill. An
             alpha triangle over a dark box gives a muddy brown triangle,
             which is why the old flames read as smoke.
           - A FIRE IS THE HARDEST-EDGED THING IN THE PICTURE, not the
             softest. `K.glow` at radius 62 over the iron produced a pale
             grey disc — a lens flare, not a light. It is radius 34 now and
             nearly twice the strength, so the rings read as rings.
           - AND IT IS STEPPED. The flames hold each drawing for four
             frames. A sine on a vertex every frame is a rubber tongue; the
             pop between held cels is a flame.
           ============================================================= */
        var fbx = rx - 46, fby = 106, fbw = 64, fbh = 46;
        K.mass(ctx, fbx - 5, fby - 5, fbw + 10, fbh + 10, '#2a2a33', { top: 0, side: 5, foot: false });
        ctx.fillStyle = '#120a08';                      /* the back of it */
        ctx.fillRect(fbx, fby, fbw, fbh);

        /* the bed of embers: eleven blocks, three tones, each on its own
           slow beat so the bed breathes rather than pulsing as one */
        for (var eb = 0; eb < 11; eb++) {
          var lev = (0.5 + 0.5 * Math.sin(t * 0.055 + eb * 1.9)) * fi.heat;
          ctx.fillStyle = lev > 0.86 ? '#ffd06a' : lev > 0.52 ? '#ee6a18' : '#8a2a0e';
          ctx.fillRect(fbx + 2 + eb * 5.5, 142 + K.vary(eb, 220, 0, 2.4), 5, 6);
        }
        /* two logs, dark on top and blazing where they meet the bed */
        ctx.fillStyle = '#2e1c12';
        ctx.fillRect(fbx + 6, 136 + fi.drop, 48, 7);
        ctx.fillRect(fbx + 14, 130 + fi.drop * 1.6, 34, 6);
        ctx.fillStyle = '#ff9633';
        ctx.fillRect(fbx + 6, 142 + fi.drop, 48, 1.6);
        ctx.fillRect(fbx + 14, 135 + fi.drop * 1.6, 34, 1.2);

        /* the flames */
        for (var f2 = 0; f2 < 5; f2++) {
          var fh = (13 + K.vary(f2, 165, 0, 8)) * fi.heat
                 + ((cel + f2 * 3) % 4) * 2.5;
          flame(ctx, fbx + 8 + f2 * 12, 143 + fi.drop, 6.5, fh, cel + f2 * 2);
        }
        /* the grate, in front of the fire and cut out of it — the bars are
           what say the light on the floor came from here */
        ctx.fillStyle = '#1c1c22';
        for (var gb = 0; gb < 4; gb++) ctx.fillRect(fbx + 8 + gb * 16, 138, 3, fby + fbh - 138);
        ctx.fillRect(fbx, fby + fbh - 4, fbw, 4);
        ctx.fillStyle = 'rgba(255,170,80,.55)';         /* the bars catch it */
        for (var gb2 = 0; gb2 < 4; gb2++) ctx.fillRect(fbx + 8 + gb2 * 16, 138, 1, 12);

        /* the door, hinged open against the left of the opening */
        ctx.fillStyle = '#2a2a33';
        ctx.fillRect(fbx - 12, fby - 2, 9, fbh + 4);
        ctx.fillStyle = '#43434e';
        ctx.fillRect(fbx - 12, fby - 2, 2, fbh + 4);
        ctx.fillStyle = 'rgba(255,166,74,.65)';         /* lit on the inside */
        ctx.fillRect(fbx - 3, fby - 2, 1.6, fbh + 4);

        K.glow(ctx, rx - 14, 128, 34, 'rgba(255,150,54,.95)', Math.min(0.9, 0.44 * fi.heat));

        /* the oven below, and the brass rail with a towel over it */
        ctx.fillStyle = '#26262e';
        ctx.fillRect(rx + 24, 108, 32, 44);
        ctx.fillStyle = 'rgba(255,150,60,' + (0.18 * fi.heat).toFixed(3) + ')';
        ctx.fillRect(rx + 27, 111, 26, 38);
        ctx.fillStyle = '#8a8a96';                      /* the oven handle */
        ctx.fillRect(rx + 26, 118, 28, 2.4);
        ctx.fillStyle = '#d8d8e2';
        ctx.fillRect(rx + 26, 118, 28, 1);
        ctx.strokeStyle = '#b08a3e'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(rx - 56, 102); ctx.lineTo(rx + 56, 102); ctx.stroke();
        ctx.strokeStyle = '#e8c878'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(rx - 56, 101); ctx.lineTo(rx + 56, 101); ctx.stroke();
        ctx.fillStyle = '#c9553e';
        ctx.fillRect(rx + 36, 102, 14, 20 + Math.sin(t * 0.02) * 1.5);
        ctx.fillStyle = '#e07a5c';
        ctx.fillRect(rx + 36, 102, 3, 20 + Math.sin(t * 0.02) * 1.5);

        /* --- THE POT. Simmering for six seconds, over for one. --- */
        var pot = rx - 22;
        ctx.fillStyle = '#3a3c44';                      /* body, in shadow */
        ctx.beginPath(); ctx.ellipse(pot, 82, 21, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#5c5e68';
        ctx.beginPath(); ctx.ellipse(pot - 3, 80.5, 17, 10.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#9aa0ae';                      /* one hard blip: iron
                                                           is metal too, just
                                                           a duller one */
        ctx.beginPath(); ctx.ellipse(pot - 11, 77, 3.4, 2, -0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,160,70,.5)';          /* the fire under it */
        ctx.beginPath(); ctx.ellipse(pot, 90, 17, 4, 0, Math.PI, 0, true); ctx.fill();
        if (b.over > 0.05) {
          ctx.fillStyle = 'rgba(248,242,220,' + (0.85 * b.over).toFixed(2) + ')';
          ctx.beginPath();
          ctx.moveTo(pot - 18, 76); ctx.lineTo(pot - 21, 92); ctx.lineTo(pot - 13, 92);
          ctx.lineTo(pot - 11, 76); ctx.closePath(); ctx.fill();
          ctx.beginPath();
          ctx.ellipse(pot - 16, 92, 12 * b.over, 3, 0, 0, Math.PI * 2); ctx.fill();
        }
        var lidHop = b.rattle * (2 + Math.abs(Math.sin(t * 0.9)) * 5);
        var tilt = b.over * 0.7;
        ctx.save();
        ctx.translate(pot + 2, 70 - lidHop);
        ctx.rotate(-tilt);
        ctx.fillStyle = '#70747e';
        ctx.beginPath(); ctx.ellipse(0, 0, 20, 5.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a4aab6';
        ctx.beginPath(); ctx.ellipse(-2, -1.4, 16, 3.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e2e8f2';
        ctx.fillRect(-13, -3.4, 8, 1.4);
        ctx.fillStyle = '#4a4c54';
        ctx.beginPath(); ctx.arc(0, -5, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        K.plume(ctx, pot, 68 - lidHop, t, {
          w: 12, rise: b.over > 0.1 ? 74 : 42, size: b.over > 0.1 ? 8 : 4.5,
          count: b.over > 0.1 ? 9 : 5, drift: 12,
          alpha: 0.34 + b.over * 0.40, speed: 0.014 + b.over * 0.02
        });

        /* --- THE KETTLE. Eleven seconds, then it goes. --------------
               Enamel: flat body, one hard rim highlight, no blip. The jet
               is opaque white with a hard edge, because steam under
               pressure is a SHAPE — the soft plume above is the pot only
               simmering, and the two should not look alike. */
        var kx = rx + 36, ky = 80;
        var rock = kt > 0 ? ((cel % 2) ? 0.05 : -0.05) * kt : 0;
        ctx.save();
        ctx.translate(kx, ky);
        ctx.rotate(rock);
        ctx.fillStyle = '#7a2f34';
        ctx.beginPath(); ctx.ellipse(0, 0, 12, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a8464c';
        ctx.beginPath(); ctx.ellipse(-2.4, -1.6, 9.4, 8.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e08a86';                        /* the enamel rim */
        ctx.beginPath(); ctx.ellipse(-6, -5, 3.4, 2.2, -0.6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#5e2226'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(0, -8 - kt * 1.6, 9, Math.PI, 0); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(11, -4); ctx.lineTo(18, -9); ctx.stroke();
        ctx.fillStyle = '#a8464c';                        /* the lid */
        ctx.fillRect(-4, -12 - kt * 2, 8, 3);
        ctx.restore();
        if (kt > 0.02) {
          /* the jet: a hard wedge out of the spout, then three flat-alpha
             puffs breaking off the end of it */
          ctx.save();
          ctx.globalAlpha = Math.min(1, kt * 1.2);
          ctx.fillStyle = '#f2eee2';
          ctx.beginPath();
          ctx.moveTo(kx + 18, ky - 9);
          ctx.lineTo(kx + 27 + kt * 5, ky - 20 - kt * 5);
          ctx.lineTo(kx + 33 + kt * 5, ky - 16 - kt * 4);
          ctx.lineTo(kx + 21, ky - 6);
          ctx.closePath(); ctx.fill();
          for (var pf = 0; pf < 3; pf++) {
            var pk = ((t * 0.05 + pf / 3) % 1);
            ctx.globalAlpha = Math.min(1, kt * 1.2) * (1 - pk) * 0.9;
            ctx.beginPath();
            ctx.arc(kx + 31 + pk * 20, ky - 20 - pk * 22, 3 + pk * 6, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      });

      /* =================================================================
         THE DRESSER — the huge close thing at the right edge. Dark, so the
         picture is dark-bright-dark across, with an oil lamp in it for the
         third warm source.
         ================================================================= */
      K.layer(ctx, camX, 0.42, function () {
        var dx = 352 - camX * 0.11;
        K.mass(ctx, dx - 62, -14, 130, H + 28, '#3a2a1a', { top: 0, side: 12, foot: false });
        ctx.fillStyle = '#1e1509';
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
            ctx.fillStyle = K.pick(r * 4 + pp, 170, ['#7c7263', '#6a6155', '#847a67']);
            ctx.beginPath(); ctx.arc(ppx, sy - 9, pr, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = K.pick(r * 4 + pp, 173, ['#a89c85', '#988d78', '#b2a691']);
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

        /* THE OIL LAMP.

           It was a pale trapezoid inside a fifty-pixel bloom and read as a
           smudge on the bottom shelf. A lamp is a black base, a bright
           flame, and a glass chimney with ONE hard vertical highlight down
           it; the light it throws is the four rings and nothing else. */
        var lg = 0.84 + 0.16 * Math.sin(t * 0.07 + 1.4) + 0.05 * Math.sin(t * 0.23);
        K.glow(ctx, dx - 30, 104, 26, 'rgba(255,196,96,.95)', 0.46 * lg);
        ctx.fillStyle = '#2e2318';                        /* the reservoir */
        ctx.beginPath();
        ctx.moveTo(dx - 37, 114); ctx.lineTo(dx - 23, 114);
        ctx.lineTo(dx - 25, 106); ctx.lineTo(dx - 35, 106); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8a6a3a';
        ctx.fillRect(dx - 36, 106, 2, 8);
        ctx.fillStyle = 'rgba(226,214,190,.30)';          /* the chimney */
        ctx.beginPath();
        ctx.moveTo(dx - 35, 105); ctx.lineTo(dx - 25, 105);
        ctx.lineTo(dx - 27, 92); ctx.lineTo(dx - 33, 92); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,246,224,.55)';
        ctx.fillRect(dx - 34.5, 93, 1.4, 12);
        ctx.fillStyle = '#ffe9a8';                        /* the flame */
        ctx.beginPath(); ctx.ellipse(dx - 30, 102, 2.4, 5 * lg, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fffbe8';
        ctx.beginPath(); ctx.ellipse(dx - 30, 103, 1.2, 2.6 * lg, 0, 0, Math.PI * 2); ctx.fill();

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
        /* a stack of pancheons against the foot of it */
        for (var pn = 0; pn < 3; pn++) {
          var pw = 13 - pn * 1.5, py = 168 - pn * 7;
          ctx.fillStyle = ['#8a5a3a', '#9c6b44', '#7a4e32'][pn];
          ctx.beginPath(); ctx.ellipse(dx - 8, py, pw, 5, 0, Math.PI, 0); ctx.fill();
          ctx.fillStyle = 'rgba(255,214,150,.18)';   /* the rim, or they stack
                                                        up as one brown lump */
          ctx.fillRect(dx - 8 - pw, py - 5.5, pw * 2, 1.4);
        }
      });

      /* --- the light, laid over everything it falls on ------------------- */
      /* Narrow, and half the strength it started at: a shaft wide enough to
         cover the middle of the frame is not a shaft, it is a filter over
         the fight. */
      K.lightShaft(ctx, wx - 2, 84, 150, 'rgba(255,206,132,.5)', 0.13, 24, FLOOR_Y + 24);

      /* --- the floor: boards, and both lights printed on them ------------ */
      K.grain(ctx, camX, 58, ['#42290f', '#7e5628'], 0.12);

      /* THE FIRELIGHT ON THE BOARDS.

         The single biggest thing that was missing. A fire in an open box
         throws a hard wedge of light out across the floor in front of it,
         with the grate bars printed on it — and until it did, the fire was
         a patch of orange paint on the left rather than the thing lighting
         the room. Three flat bands, not a ramp: `K.glow` gave up its
         gradient for stepped rings for exactly this reason, and a smooth
         pool on the floor next to a banded glow would give the game away. */
      (function () {
        var m = rx - 14;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var BANDS = [[0.155, 0, 0], [0.105, 13, 22], [0.06, 26, 46]];
        for (var i = 0; i < BANDS.length; i++) {
          var a = BANDS[i][0] * fi.heat, inl = BANDS[i][1], inr = BANDS[i][2];
          ctx.globalAlpha = Math.max(0, Math.min(1, a));
          ctx.fillStyle = 'rgba(255,158,64,.95)';
          ctx.beginPath();
          ctx.moveTo(m - 40 + inl, FLOOR_Y);
          ctx.lineTo(m + 34 - inl, FLOOR_Y);
          ctx.lineTo(m + 76 - inr, H);
          ctx.lineTo(m - 96 + inr, H);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
        /* the grate bars, printed across it */
        ctx.save();
        ctx.globalAlpha = 0.20;
        ctx.fillStyle = '#2a1608';
        for (var g = 0; g < 4; g++) {
          var bx = m - 34 + g * 17;
          ctx.beginPath();
          ctx.moveTo(bx, FLOOR_Y); ctx.lineTo(bx + 3, FLOOR_Y);
          ctx.lineTo(bx + (bx - m) * 0.55 + 5, H); ctx.lineTo(bx + (bx - m) * 0.55, H);
          ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      })();

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
      basketCat(ctx, rx - 32, FLOOR_Y + 20, t, b.over, 1.5, fi.heat);
      mouse(ctx, camX, t);

      /* Embers off the fire. Drawn here rather than through Particles:
         that system works in world space and wraps over a span, and what
         this wants is sparks tied to one firebox that moves with the
         range.

         Nine of them all the time, and thirty more for a second when a log
         gives way — which is the only moment in the room that touches the
         ceiling. */
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
      if (fi.burst > 0) {
        var bk = 1 - fi.burst;                    /* 0 at the crack, 1 at the top */
        for (var sp = 0; sp < 30; sp++) {
          var spd = 0.6 + K.hash(sp, 230) * 0.8;
          var rise = bk * spd;
          if (rise > 1) continue;
          ctx.globalAlpha = Math.max(0, fi.burst) * (1 - rise * 0.7);
          ctx.fillStyle = sp % 4 ? 'rgba(255,160,64,.95)' : 'rgba(255,244,200,.95)';
          var sxx = rx - 30 + K.hash(sp, 231) * 40
                  + Math.sin(rise * 6 + sp) * 9 * rise;
          var syy = 140 - rise * 150;
          var sr = 1 + K.hash(sp, 232) * 1.6;
          ctx.fillRect(sxx, syy, sr, sr * 2.2);     /* a streak, not a dot —
                                                       a spark is moving */
        }
      }
      ctx.restore();
      this.flour.update();
      this.flour.draw(ctx, camX, t);
    },

    drawFore: function (ctx, camX, t) {
      /* The pan rail, close enough to be cut off by the top of the frame.
         Six pans of three kinds at three lengths, not eleven circles.
         Copper: the widest value range in the room, near-black to nearly
         white, because that range is the whole of what says metal. */
      K.layer(ctx, camX, 1.25, function () {
        K.mass(ctx, -10, 4, W + 20, 7, '#5c4128', { top: 3, side: 0, foot: false, edge: false });
        K.repeatX(camX, 0, 62, function (x, i) {
          if (K.chance(i, 136, 0.14)) return;
          var hang = K.vary(i, 137, 12, 34);
          var sw = K.sway(t, 0.018, 2.2, i);
          ctx.strokeStyle = '#2e2620'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(x, 11); ctx.lineTo(x + sw, 11 + hang); ctx.stroke();
          hangPan(ctx, x + sw, 11 + hang, K.vary(i, 138, 7, 12),
                  K.pick(i, 139, ['#b87a30', '#8d939c', '#9c4046', '#cf9440']),
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
          ctx.fillStyle = K.pick(o, 192, ['#8f5a1e', '#a86e28', '#7a4a18']);
          ctx.beginPath(); ctx.ellipse(ox2, oy, orr, orr * 1.1, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#c78a3c';
          ctx.beginPath(); ctx.ellipse(ox2 - orr * 0.3, oy - orr * 0.2, orr * 0.55, orr * 0.75, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(255,232,180,.35)';
          ctx.beginPath(); ctx.ellipse(ox2 - orr * 0.45, oy - orr * 0.4, orr * 0.22, orr * 0.4, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#6b4a18';
          ctx.fillRect(ox2 - 1, oy - orr * 1.5, 2, orr * 0.6);
        }
      });

      K.nearLip(ctx, 14, 0.40);
      K.vignette(ctx, 0.34);
    }
  };
})();
