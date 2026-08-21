/* ==========================================================================
   Super Cat Fighter 6 — game loop, scenes and match logic

   Fixed 60Hz logical timestep with an accumulator, so the fight runs at the
   same speed on a 60Hz laptop and a 144Hz monitor. Rendering interpolates
   nothing on purpose — a fighting game should show you exactly the frame the
   simulation is on.
   ========================================================================== */
(function () {
  var U = CF.util, S = CF.STAGE, HUD = CF.HUD, K = CF.StageKit;
  var W = S.W, H = S.H, FLOOR_Y = S.FLOOR_Y;

  var WALL_L = -380, WALL_R = 380;
  var EDGE = 26;
  var START_GAP = 110;

  function Game(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scene = 'title';
    this.t = 0;
    this.acc = 0;
    this.last = 0;
    this.shakeAmt = 0;
    this.camX = -W / 2;
    this.projectiles = [];
    this.fx = [];
    this.paused = false;

    this.ports = [new CF.Input.Port('p1'), new CF.Input.Port('p2')];

    this.settings = {
      mode: 'arcade',           // arcade | versus | training
      difficulty: 3,
      rounds: 2,                // rounds to win
      roundTime: 99,
      showBoxes: false
    };

    this.menuIndex = 0;
    this.menuItems = ['ARCADE', 'VERSUS', 'TRAINING', 'ROSTER', 'CONTROLS', 'OPTIONS'];
    this.optIndex = 0;
    this.select = { cursor: [0, 3], locked: [false, false], stage: 0, phase: 'chars' };
    /* the character card: browsed from the title, and shown once when you
       lock a cat in */
    this.roster = { cat: 0, pick: 0 };
    this.reveal = { t: 0, chr: null };
    this.arcade = { step: 0, order: [], pending: null };
    this.resultPick = 0;
    this.ghost = [0, 0];
    this.announce = null;
    this.announceT = 0;
    this.slowmo = 0;
    this.crowdMood = 0;
    /* set on the blow that ends a match — see the KO handler */
    this.finish = null;

    /* Set by main.js from real pointer events, in game coordinates. Menus are
       clickable so the game is usable the instant it is pressed, without
       waiting for the page to have keyboard focus. */
    this.pointer = { x: -99, y: -99, clicked: false, seen: false, moved: false };
  }

  /* ---- public hooks used by fighters ------------------------------------- */
  Game.prototype.hitstop = function (n) {
    if (this.p1) this.p1.hitstop = Math.max(this.p1.hitstop, n);
    if (this.p2) this.p2.hitstop = Math.max(this.p2.hitstop, n);
  };
  Game.prototype.shake = function (n) { this.shakeAmt = Math.max(this.shakeAmt, n); };

  /* Stir the crowd. Big hits, supers, knockdowns and a nearly-dead fighter all
     get the spectators on their feet; it settles back down between exchanges. */
  Game.prototype.excite = function (n) {
    this.crowdMood = U.clamp(this.crowdMood + n, 0, 1);
  };
  Game.prototype.say = function (str, frames, size, color) {
    this.announce = { str: str, size: size || 34, color: color || '#ffe07a' };
    this.announceT = frames || 70;
  };

  /* ---- match set-up ------------------------------------------------------ */
  Game.prototype.startMatch = function (c1, c2, stageIdx, mode) {
    this.finish = null;
    this.slowmo = 0;
    if (CF.Audio.setKey) CF.Audio.setKey([0, 5, 3, -2, 7, -4][(stageIdx | 0) % 6]);
    var m = mode || this.settings.mode;
    this.settings.mode = m;

    var p1port = this.ports[0];
    var p2port = (m === 'versus') ? this.ports[1] : new CF.VirtualPort();

    this.p1 = new CF.Fighter(c1, 0, p1port, this.fx);
    this.p2 = new CF.Fighter(c2, 1, p2port, this.fx);
    this.p1.other = this.p2;
    this.p2.other = this.p1;

    this.ai = (m === 'versus') ? null : new CF.AI(this.p2, this.settings.difficulty);
    if (m === 'training' && this.ai) this.ai.setLevel(1);
    this.trainingDummy = (m === 'training');

    if (m === 'arcade' && !this.arcade.order.length) {
      var mine = CF.ROSTER.indexOf(c1);
      this.arcade.order = [];
      for (var q = 1; q <= 5; q++) this.arcade.order.push((mine + q) % CF.ROSTER.length);
      this.arcade.step = 0;
    }

    this.stage = CF.Stages[stageIdx % CF.Stages.length];
    this.round = 1;
    this.p1.roundWins = 0;
    this.p2.roundWins = 0;
    this.matchOver = false;
    this.resetRound(true);
    this.scene = 'fight';
    CF.Audio.startMusic();
  };

  Game.prototype.resetRound = function (first) {
    this.finish = null;
    this.slowmo = 0;
    var p1 = this.p1, p2 = this.p2;
    p1.x = -START_GAP; p2.x = START_GAP;
    [p1, p2].forEach(function (f) {
      f.y = 0; f.vx = 0; f.vy = 0; f.grounded = true;
      f.health = f.maxHealth; f.stun = 0; f.comboCount = 0;
      f.hitstop = 0; f.superFreeze = 0;
      f.hitstunTimer = 0; f.blockstunTimer = 0; f.knockdownTimer = 0; f.dizzyTimer = 0;
      f.move = null; f.moveFrame = 0;
      f.setState('intro');
      f.inputBuf.length = 0;
      f.port.flushMotion();
      if (!first) f.meter = Math.min(f.maxMeter, f.meter);   // meter carries over
    });
    p1.facing = 1; p2.facing = -1;
    this.ghost = [p1.maxHealth, p2.maxHealth];
    this.projectiles.length = 0;
    this.fx.length = 0;
    this.timeLeft = this.settings.roundTime;
    this.roundState = 'intro';
    this.roundTimer = 0;
    this.camX = -W / 2;
    this.say('ROUND ' + this.round, 60, 30);
    CF.Audio.play('round');
  };

  /* ---- the logical frame ------------------------------------------------- */
  Game.prototype.step = function () {
    this.t++;

    /* Slow motion, and it is real: the simulation simply does not advance on
       two frames in three. The finishing blow of a match is the moment the
       whole round was for, and at full speed you miss it. */
    if (this.slowmo > 0) {
      this.slowmo--;
      if (this.finish) this.finish.t++;
      if (this.slowmo % 3) return;
    }

    for (var i = 0; i < this.ports.length; i++) this.ports[i].poll();
    if (this.announceT > 0) this.announceT--;
    if (this.shakeAmt > 0) this.shakeAmt *= 0.86;
    if (this.shakeAmt < 0.15) this.shakeAmt = 0;

    switch (this.scene) {
      case 'title':    this.stepTitle(); break;
      case 'select':   this.stepSelect(); break;
      case 'fight':    this.stepFight(); break;
      case 'roster':   this.stepRoster(); break;
      case 'reveal':   this.stepReveal(); break;
      case 'controls': this.stepControls(); break;
      case 'options':  this.stepOptions(); break;
      case 'result':   this.stepResult(); break;
    }

    /* a click, and a movement, are consumed by whichever screen was showing */
    this.pointer.clicked = false;
    this.pointer.moved = false;
  };

  /* Did this frame's click land inside the rect? */
  Game.prototype.hit = function (r) {
    var p = this.pointer;
    return p.clicked && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  };
  /* Hover only counts on a frame the mouse actually moved. A pointer left
     resting on a menu item must not keep dragging the cursor back while
     somebody is playing with the keyboard or a pad. */
  Game.prototype.hover = function (r) {
    var p = this.pointer;
    return p.moved && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  };

  /* Is the pointer sitting on this rect right now? Used for drawing only. */
  Game.prototype.over = function (r) {
    var p = this.pointer;
    return p.seen && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  };

  /* Rects shared between drawing and hit-testing, so the two can never drift
     apart — a menu item you can see but not click is worse than no mouse
     support at all. */
  /* The menu is laid out to fit however many items it has, from the bottom of
     the logo down to the hint line. Six items at the old fixed spacing ran
     OPTIONS straight through the keyboard hint. */
  Game.prototype.titleRects = function () {
    var n = this.menuItems.length;
    var top = 120, bottom = H - 26;
    var step = Math.min(15, Math.floor((bottom - top) / n));
    var out = [];
    for (var m = 0; m < n; m++) {
      out.push({ x: W / 2 - 68, y: top + m * step, w: 136, h: step, i: m });
    }
    return out;
  };

  Game.prototype.selectRects = function () {
    var cw = 52, ch = 46, gapX = 8, gapY = 8;
    var ox = W / 2 - (3 * cw + 2 * gapX) / 2, oy = 30;
    var out = [];
    for (var i = 0; i < 6; i++) {
      out.push({ x: ox + (i % 3) * (cw + gapX), y: oy + ((i / 3) | 0) * (ch + gapY),
                 w: cw, h: ch, i: i });
    }
    return out;
  };

  Game.prototype.stageRects = function () {
    var pw = 250, ph = 146, px = (W - pw) / 2, py = 28;
    return {
      prev: { x: px - 30, y: py, w: 30, h: ph },
      next: { x: px + pw, y: py, w: 30, h: ph },
      go:   { x: px, y: py, w: pw, h: ph },
      back: { x: 0, y: H - 14, w: W, h: 14 }
    };
  };

  /* Rows are packed tighter than they were, to leave a strip at the bottom for
     the description of whichever one is highlighted. */
  Game.prototype.optionRects = function (n) {
    var top = 38, step = 15, out = [];
    for (var i = 0; i < n; i++) out.push({ x: 50, y: top + i * step, w: W - 100, h: step - 1, i: i });
    return out;
  };

  /* Every clickable rect on the screen right now. Used to show a hand cursor,
     so mouse support is discoverable rather than a secret. */
  Game.prototype.clickTargets = function () {
    if (this.scene === 'title') return this.titleRects();
    if (this.scene === 'options') return this.optionRects(this.optionRows().length);
    if (this.scene === 'select') {
      if (this.select.phase === 'stage') {
        var s = this.stageRects();
        return [s.prev, s.next, s.go, s.back];
      }
      return this.selectRects().concat([this.selectBackRect()]);
    }
    if (this.scene === 'roster') {
      var rr = this.rosterRects();
      return [rr.prev, rr.next, rr.back].concat(rr.rows);
    }
    if (this.scene === 'result' && this.resultKind === 'advance' && this.arcade.pending) {
      var rs = this.resultRects();
      return [rs.go, rs.quit];
    }
    if (this.scene === 'controls' || this.scene === 'result' || this.scene === 'reveal') {
      return [{ x: 0, y: 0, w: W, h: H }];
    }
    return [];
  };

  Game.prototype.anyStart = function () {
    return this.ports[0].confirmPressed() || this.ports[1].confirmPressed();
  };

  /* ---- title ------------------------------------------------------------- */
  Game.prototype.stepTitle = function () {
    var p = this.ports[0];
    var n = this.menuItems.length;
    if (p.menuDir([8, 7, 9])) { this.menuIndex = (this.menuIndex + n - 1) % n; CF.Audio.play('cursor'); }
    if (p.menuDir([2, 1, 3])) { this.menuIndex = (this.menuIndex + 1) % n; CF.Audio.play('cursor'); }
    /* a click picks the item under it outright */
    var tr = this.titleRects(), clicked = -1;
    for (var t = 0; t < tr.length; t++) {
      if (this.hover(tr[t])) this.menuIndex = tr[t].i;
      if (this.hit(tr[t])) clicked = tr[t].i;
    }
    if (clicked >= 0) this.menuIndex = clicked;

    if (this.anyStart() || clicked >= 0) {
      CF.Audio.init(); CF.Audio.play('select');
      var pick = this.menuItems[this.menuIndex];
      if (pick === 'ROSTER') { this.scene = 'roster'; this.roster.pick = 0; this._navCool = 10; }
      else if (pick === 'CONTROLS') { this.scene = 'controls'; }
      else if (pick === 'OPTIONS') { this.scene = 'options'; this.optIndex = 0; }
      else {
        this.settings.mode = pick.toLowerCase();
        this.scene = 'select';
        this.select.locked = [false, false];
        this.select.cursor = [0, 3];
        this.select.phase = 'chars';
        this.select.stage = (Math.random() * CF.Stages.length) | 0;
      }
    }
  };

  Game.prototype.stepControls = function () {
    var p = this.ports[0];
    if (this._navCool > 0) this._navCool--;
    if (!this._navCool) {
      if (p.dir === 6 || p.dir === 4) {
        this.ctrlPage = this.ctrlPage ? 0 : 1;
        this._navCool = 12;
        CF.Audio.play('cursor');
      }
    }
    if (this.anyStart() || this.pointer.clicked) { this.scene = 'title'; CF.Audio.play('select'); }
  };

  /* ---- options ----------------------------------------------------------- */
  /* Every row says what it does. A settings screen that only names a thing and
     shows its value makes the player guess, and half of these change how the
     game plays rather than how it looks. */
  var PIXEL_NAMES = { 1: 'CHUNKY', 2: 'FINE', 3: 'SHARPEST' };

  Game.prototype.pixelSize = function () {
    return (CF.Screen && CF.Screen.getPixel) ? CF.Screen.getPixel() : (this.pixelScale || 2);
  };
  Game.prototype.setPixelSize = function (n) {
    n = Math.max(1, Math.min(3, n));
    if (CF.Screen && CF.Screen.setPixel) CF.Screen.setPixel(n);
    this.pixelScale = n;
  };

  Game.prototype.optionRows = function () {
    var s = this.settings, g = this;
    var simple = CF.Input.getScheme() === 'simple';
    return [
      { label: 'PIXEL SIZE', value: PIXEL_NAMES[this.pixelSize()] || 'FINE',
        desc: 'How big one game pixel is on your screen. CHUNKY is the arcade board exactly; FINE draws at twice that, which keeps the hard pixel edge but gives the art more room. SHARPEST is finer again.',
        inc: function () { g.setPixelSize(g.pixelSize() + 1); },
        dec: function () { g.setPixelSize(g.pixelSize() - 1); } },
      { label: 'CONTROLS', value: CF.Input.schemeDef().label,
        desc: simple
          ? 'Four buttons and two triggers. Specials come out on a pair of buttons pressed together — no motion inputs at all.'
          : 'The arcade layout: three punches over three kicks, with quarter-circles, dragon punches and charge moves.',
        inc: function () { CF.Input.setScheme(CF.Input.getScheme() === 'simple' ? 'classic' : 'simple'); },
        dec: function () { CF.Input.setScheme(CF.Input.getScheme() === 'simple' ? 'classic' : 'simple'); } },
      { label: 'DIFFICULTY', value: CF.AI_LEVELS[s.difficulty].name,
        desc: 'How hard the computer plays. It presses the same buttons you do and gets no advantages — harder just means it waits less and reacts sooner.',
        inc: function () { s.difficulty = Math.min(5, s.difficulty + 1); },
        dec: function () { s.difficulty = Math.max(1, s.difficulty - 1); } },
      { label: 'ROUNDS TO WIN', value: String(s.rounds),
        desc: 'How many rounds it takes to win a match. Two is the arcade standard; one makes for a quick game.',
        inc: function () { s.rounds = Math.min(3, s.rounds + 1); },
        dec: function () { s.rounds = Math.max(1, s.rounds - 1); } },
      { label: 'ROUND TIME', value: s.roundTime >= 999 ? 'INFINITE' : String(s.roundTime),
        desc: 'Seconds on the clock. Run it out and whoever has more health left takes the round. INFINITE turns the timer off entirely.',
        inc: function () { s.roundTime = s.roundTime >= 99 ? 999 : s.roundTime + 10; },
        dec: function () { s.roundTime = s.roundTime >= 999 ? 99 : Math.max(30, s.roundTime - 10); } },
      { label: 'MUSIC', value: CF.Audio.isMusicOn() ? 'ON' : 'OFF',
        desc: 'The tune under the fight. Every note is generated as it plays — there is no music file anywhere in the game.',
        inc: function () { CF.Audio.toggleMusic(); }, dec: function () { CF.Audio.toggleMusic(); } },
      { label: 'SOUND FX', value: CF.Audio.isSfxOn() ? 'ON' : 'OFF',
        desc: 'Hits, blocks, meows and the announcer. Also synthesised rather than recorded.',
        inc: function () { CF.Audio.toggleSfx(); }, dec: function () { CF.Audio.toggleSfx(); } },
      { label: 'SHOW HITBOXES', value: s.showBoxes ? 'ON' : 'OFF',
        desc: 'Draws the boxes the game actually fights with: blue is where you can be hit, red is what your attack reaches, white is where you stand. For working out why something missed.',
        inc: function () { s.showBoxes = !s.showBoxes; }, dec: function () { s.showBoxes = !s.showBoxes; } },
      { label: 'BACK', value: '',
        desc: 'Return to the title screen. Everything here is kept for this session.',
        inc: function () {}, dec: function () {} }
    ];
  };

  Game.prototype.stepOptions = function () {
    var p = this.ports[0], rows = this.optionRows();
    if (this._navCool > 0) this._navCool--;

    var orr = this.optionRects(rows.length);
    for (var oi = 0; oi < orr.length; oi++) {
      if (this.hover(orr[oi])) this.optIndex = orr[oi].i;
      if (this.hit(orr[oi])) {
        this.optIndex = orr[oi].i;
        CF.Audio.play('select');
        if (rows[oi].label === 'BACK') { this.scene = 'title'; return; }
        rows[oi].inc();
        return;
      }
    }
    if (p.menuDir([8, 7, 9])) { this.optIndex = (this.optIndex + rows.length - 1) % rows.length; CF.Audio.play('cursor'); }
    if (p.menuDir([2, 1, 3])) { this.optIndex = (this.optIndex + 1) % rows.length; CF.Audio.play('cursor'); }
    if (p.menuDir([6, 9, 3])) { rows[this.optIndex].inc(); CF.Audio.play('cursor'); }
    if (p.menuDir([4, 7, 1])) { rows[this.optIndex].dec(); CF.Audio.play('cursor'); }
    if (this.anyStart()) {
      CF.Audio.play('select');
      if (rows[this.optIndex].label === 'BACK') this.scene = 'title';
      else rows[this.optIndex].inc();
    }
  };

  /* ---- the character card -------------------------------------------------

     Two ways in. ROSTER on the title screen is the one you can sit and read:
     every cat, every special, and the buttons that bring it out on whichever
     control scheme is switched on. The other is the beat after you lock a cat
     in, which is the same card with the reading matter taken off it.       */

  Game.prototype.rosterRects = function () {
    var rows = CF.Card.moveRows(CF.ROSTER[this.roster.cat]);
    var nx = W * 0.45, ry = 84, step = 25;
    var out = { prev: { x: 0, y: 60, w: 26, h: 104 },
                next: { x: W - 26, y: 60, w: 26, h: 104 },
                back: { x: 0, y: H - 14, w: W, h: 14 },
                rows: [] };
    for (var i = 0; i < rows.length; i++) {
      out.rows.push({ x: nx - 7, y: ry + i * step - 11, w: W - nx - 3, h: step - 3, i: i });
    }
    return out;
  };

  Game.prototype.stepRoster = function () {
    var p = this.ports[0], n = CF.ROSTER.length;
    if (this._navCool > 0) this._navCool--;
    var r = this.rosterRects();

    for (var i = 0; i < r.rows.length; i++) {
      if (this.hover(r.rows[i])) this.roster.pick = r.rows[i].i;
      if (this.hit(r.rows[i])) this.roster.pick = r.rows[i].i;
    }
    if (this.hit(r.prev)) { this.roster.cat = (this.roster.cat + n - 1) % n; this.roster.pick = 0; CF.Audio.play('cursor'); }
    else if (this.hit(r.next)) { this.roster.cat = (this.roster.cat + 1) % n; this.roster.pick = 0; CF.Audio.play('cursor'); }
    else if (this.hit(r.back)) { this.scene = 'title'; CF.Audio.play('cursor'); return; }

    if (p.menuDir([4])) { this.roster.cat = (this.roster.cat + n - 1) % n; this.roster.pick = 0; CF.Audio.play('cursor'); }
    if (p.menuDir([6])) { this.roster.cat = (this.roster.cat + 1) % n; this.roster.pick = 0; CF.Audio.play('cursor'); }
    if (p.menuDir([8])) { this.roster.pick = (this.roster.pick + 2) % 3; CF.Audio.play('cursor'); }
    if (p.menuDir([2])) { this.roster.pick = (this.roster.pick + 1) % 3; CF.Audio.play('cursor'); }
    if (!this._navCool && (p.cancelPressed() || p.confirmPressed())) {
      this.scene = 'title'; this._navCool = 12; CF.Audio.play('cursor');
    }
  };

  Game.prototype.drawRoster = function (ctx) {
    var chr = CF.ROSTER[this.roster.cat];
    CF.Card.draw(ctx, chr, { t: this.t, intro: 1, detail: true, pick: this.roster.pick });

    /* the arrows, drawn where rosterRects says they are */
    var r = this.rosterRects(), t = this.t;
    [[r.prev, -1], [r.next, 1]].forEach(function (a) {
      var rect = a[0], dir = a[1];
      var mx = rect.x + rect.w / 2 + Math.sin(t * 0.12) * dir * 1.5;
      var my = rect.y + rect.h / 2;
      ctx.fillStyle = 'rgba(255,224,122,.75)';
      ctx.beginPath();
      ctx.moveTo(mx + dir * 5, my);
      ctx.lineTo(mx - dir * 4, my - 7);
      ctx.lineTo(mx - dir * 4, my + 7);
      ctx.closePath();
      ctx.fill();
    });
    HUD.text(ctx, (this.roster.cat + 1) + ' / ' + CF.ROSTER.length, W / 2, 10, 7,
             'rgba(255,240,220,.55)', 'center', 700, 1);
    HUD.text(ctx, 'LEFT AND RIGHT FOR ANOTHER CAT   ·   UP AND DOWN FOR A MOVE   ·   BACK TO LEAVE',
             W / 2, H - 4, 6.4, 'rgba(255,240,220,.5)', 'center', 700, 0.4);
  };

  Game.prototype.stepReveal = function () {
    this.reveal.t++;
    var done = this.reveal.t > 26 && (this.anyStart() || this.ports[0].cancelPressed() ||
                                      this.pointer.clicked);
    if (done || this.reveal.t > 190) {
      this.scene = 'select';
      this.select.phase = 'stage';
      this._navCool = 14;
    }
  };

  Game.prototype.drawReveal = function (ctx) {
    CF.Card.draw(ctx, this.reveal.chr || CF.ROSTER[0], {
      t: this.t, intro: Math.min(1, this.reveal.t / 26), detail: false,
      prompt: 'PRESS ANYTHING TO GO ON'
    });
  };

  /* ---- character select ---------------------------------------------------

     Two phases: pick your cat, then pick where the fight happens. The stage
     is worth a screen of its own — there are six of them and they are the
     part of the game that moves.                                          */

  Game.prototype.stepSelect = function () {
    var players = this.settings.mode === 'versus' ? 2 : 1;
    if (this._navCool > 0) this._navCool--;

    if (this.select.phase === 'stage') { this.stepStageSelect(); return; }

    /* The mouse drives whoever has not locked in yet, so one person with one
       mouse can still set up a versus match. Worked out before the loop, or
       locking P1 would hand P2 the same click on the same frame. */
    var mouseSlot = -1;
    if (!this.select.locked[0]) mouseSlot = 0;
    else if (players > 1 && !this.select.locked[1]) mouseSlot = 1;

    for (var i = 0; i < 2; i++) {
      if (i >= players) continue;
      var p = this.ports[i];
      if (this.select.locked[i]) continue;
      var c = this.select.cursor[i], moved = false;
      if (p.menuDir([4])) { c = (c + 5) % 6; moved = true; }
      if (p.menuDir([6])) { c = (c + 1) % 6; moved = true; }
      if (p.menuDir([8])) { c = (c + 3) % 6; moved = true; }
      if (p.menuDir([2])) { c = (c + 3) % 6; moved = true; }
      if (moved) { this.select.cursor[i] = c; CF.Audio.play('cursor'); }
      var clickedCat = -1;
      if (i === mouseSlot) {
        var sr = this.selectRects();
        for (var c2 = 0; c2 < sr.length; c2++) {
          if (this.hover(sr[c2])) this.select.cursor[i] = sr[c2].i;
          if (this.hit(sr[c2])) clickedCat = sr[c2].i;
        }
        if (clickedCat >= 0) this.select.cursor[i] = clickedCat;
      }

      if (p.confirmPressed() || clickedCat >= 0) {
        this.select.locked[i] = true;
        CF.Audio.play('select');
        CF.Audio.play('meow');
      }
    }

    /* Back out. In versus this un-locks whoever locked in last, so one player
       changing their mind does not throw the other's pick away; with nobody
       locked there is nothing left to undo and it goes to the title. Getting
       stuck on this screen with no way home was the first thing the owner
       hit with a pad in hand. */
    if (!this._navCool && (this.ports[0].cancelPressed() ||
                           (players > 1 && this.ports[1].cancelPressed()) ||
                           this.hit(this.selectBackRect()))) {
      this._navCool = 12;
      CF.Audio.play('cursor');
      if (this.select.locked[1]) { this.select.locked[1] = false; return; }
      if (this.select.locked[0]) { this.select.locked[0] = false; return; }
      this.scene = 'title';
      this.menuIndex = 0;
      return;
    }

    var ready = this.select.locked[0] && (players === 1 || this.select.locked[1]);
    if (ready) {
      this.select.phase = 'stage';
      this._navCool = 14;
      /* One cat picked, one card. In versus there are two picks and showing
         one of them would be a strange thing to do, so it is skipped. */
      if (this.settings.mode !== 'versus') {
        this.reveal.chr = CF.ROSTER[this.select.cursor[0]];
        this.reveal.t = 0;
        this.scene = 'reveal';
        CF.Audio.play('select');
      }
    }
  };

  /* The BACK strip on the cat screen. Same shape and place as the one on the
     stage screen, so the way out is in the same spot on both. */
  Game.prototype.selectBackRect = function () {
    return { x: 4, y: 4, w: 44, h: 13 };
  };

  /* index === CF.Stages.length means "surprise me" */
  Game.prototype.stepStageSelect = function () {
    var p = this.ports[0], n = CF.Stages.length + 1;

    var sr = this.stageRects();
    if (this.hit(sr.prev)) { this.select.stage = (this.select.stage + n - 1) % n; CF.Audio.play('cursor'); }
    else if (this.hit(sr.next)) { this.select.stage = (this.select.stage + 1) % n; CF.Audio.play('cursor'); }
    else if (this.hit(sr.back)) {
      this.select.phase = 'chars';
      this.select.locked = [false, false];
      CF.Audio.play('cursor');
      return;
    } else if (this.hit(sr.go)) {
      this.startPicked();
      return;
    }

    if (p.menuDir([4, 7, 1])) { this.select.stage = (this.select.stage + n - 1) % n; CF.Audio.play('cursor'); }
    if (p.menuDir([6, 9, 3])) { this.select.stage = (this.select.stage + 1) % n; CF.Audio.play('cursor'); }
    if (!this._navCool && p.cancelPressed()) {
      /* back out and change your cat */
      this.select.phase = 'chars';
      this.select.locked = [false, false];
      this._navCool = 12; CF.Audio.play('cursor');
      return;
    }
    if (p.confirmPressed()) this.startPicked();
  };

  Game.prototype.startPicked = function () {
    var stage = this.select.stage;
    if (stage >= CF.Stages.length) stage = (Math.random() * CF.Stages.length) | 0;
    this.select.stage = stage;
    CF.Audio.play('select');

    var mine = this.select.cursor[0];
    if (this.settings.mode === 'versus') {
      this.startMatch(CF.ROSTER[mine], CF.ROSTER[this.select.cursor[1]], stage, 'versus');
    } else if (this.settings.mode === 'arcade') {
      this.arcade.order = [];
      for (var k = 1; k <= 5; k++) this.arcade.order.push((mine + k) % 6);
      this.arcade.step = 0;
      this.startMatch(CF.ROSTER[mine], CF.ROSTER[this.arcade.order[0]], stage, 'arcade');
    } else {
      this.startMatch(CF.ROSTER[mine], CF.ROSTER[(mine + 1) % 6], stage, 'training');
    }
  };

  /* ---- the fight ---------------------------------------------------------- */
  Game.prototype.stepFight = function () {
    var p1 = this.p1, p2 = this.p2;

    if (this.ports[0].startPressed && this.roundState === 'fight') {
      this.paused = !this.paused;
      CF.Audio.play('select');
    }
    if (this.paused) {
      if (this.ports[0].cancelPressed()) { this.paused = false; this.scene = 'title'; CF.Audio.stopMusic(); }
      return;
    }

    this.roundTimer++;

    /* crowd mood settles, then gets topped up by whatever is happening */
    this.crowdMood *= 0.985;
    var lowest = Math.min(p1.health / p1.maxHealth, p2.health / p2.maxHealth);
    if (lowest < 0.25 && this.roundState === 'fight') this.excite(0.006);
    if (p1.comboCount >= 3 || p2.comboCount >= 3) this.excite(0.02);

    if (this.roundState === 'intro') {
      if (this.roundTimer === 62) { this.say('FIGHT!', 50, 40, '#ff7a4a'); CF.Audio.play('meow'); }
      if (this.roundTimer > 62) {
        this.roundState = 'fight';
        p1.setState('idle'); p2.setState('idle');
      } else {
        this.updateCamera();
        return;
      }
    }

    if (this.roundState === 'fight') {
      if (this.settings.roundTime < 999) {
        this.timeLeft -= 1 / 60;
        if (this.timeLeft <= 0) { this.timeLeft = 0; this.endRound(null, 'time'); }
      }
    }

    /* CPU thinks before its port is polled next frame */
    if (this.ai && this.roundState === 'fight') {
      if (this.trainingDummy) { /* dummy stands still and blocks nothing */ }
      else this.ai.update(this);
    }
    if (this.p2.port.virtual) this.p2.port.poll();

    p1.update(this);
    p2.update(this);

    if (this.trainingDummy && this.roundState === 'fight') {
      p1.meter = p1.maxMeter;
      p2.health = p2.maxHealth;
      if (p2.stun >= p2.stunMax) p2.stun = 0;
    }

    this.separate();
    this.clampToStage();
    this.resolveHits();
    this.updateProjectiles();
    this.updateGhostBars();
    this.updateCamera();

    if (this.roundState === 'fight') {
      if (p1.health <= 0 && p2.health <= 0) this.endRound('draw', 'ko');
      else if (p1.health <= 0) this.endRound(p2, 'ko');
      else if (p2.health <= 0) this.endRound(p1, 'ko');
    }

    if (this.roundState === 'over') {
      this.overTimer--;
      if (this.overTimer === 60 && this.winner && this.winner !== 'draw') {
        this.winner.setState('win');
        CF.Audio.play('meow');
      }
      if (this.overTimer <= 0) this.afterRound();
    }
  };

  /* Pushboxes: two cats cannot occupy the same patch of floor. */
  Game.prototype.separate = function () {
    var a = this.p1, b = this.p2;
    var ba = a.pushbox(), bb = b.pushbox();
    if (!U.rectsOverlap(ba, bb)) return;
    var overlap = Math.min(ba.x + ba.w, bb.x + bb.w) - Math.max(ba.x, bb.x);
    if (overlap <= 0) return;
    var dir = (a.x <= b.x) ? -1 : 1;
    /* the heavier cat shifts less */
    var wa = a.stats.weight, wb = b.stats.weight, tot = wa + wb;
    a.x += dir * overlap * (wb / tot) * 0.5;
    b.x -= dir * overlap * (wa / tot) * 0.5;
  };

  Game.prototype.clampToStage = function () {
    var mid = (this.p1.x + this.p2.x) / 2;
    var cam = U.clamp(mid - W / 2, WALL_L, WALL_R - W);
    var lo = Math.max(WALL_L + EDGE, cam + EDGE);
    var hi = Math.min(WALL_R - EDGE, cam + W - EDGE);
    this.p1.x = U.clamp(this.p1.x, lo, hi);
    this.p2.x = U.clamp(this.p2.x, lo, hi);
  };

  Game.prototype.updateCamera = function () {
    var mid = (this.p1.x + this.p2.x) / 2;
    var want = U.clamp(mid - W / 2, WALL_L, WALL_R - W);
    this.camX = U.lerp(this.camX, want, 0.16);
  };

  /* ---- hit detection ------------------------------------------------------ */
  Game.prototype.resolveHits = function () {
    var pair = [[this.p1, this.p2], [this.p2, this.p1]];
    for (var i = 0; i < 2; i++) {
      var atk = pair[i][0], def = pair[i][1];
      if (atk.hitstop > 0 || atk.superFreeze > 0) continue;
      var hb = atk.activeHitbox();
      if (!hb) continue;
      if (def.hasInvuln()) continue;
      if (def.state === 'ko') continue;

      var m = atk.move;
      var lvl = m.hitLevel || (m.stance === 'air' ? 'overhead' : 'mid');
      if (def.lowProfiling() && lvl !== 'low') continue;
      if (def.highInvuln() && lvl !== 'low') continue;

      var boxes = def.hurtboxes(), hitAny = false;
      for (var k = 0; k < boxes.length; k++) {
        if (U.rectsOverlap(hb, boxes[k])) { hitAny = true; break; }
      }
      if (!hitAny) continue;

      var data = atk.hitData();

      /* armour eats one hit and keeps going */
      if (def.hasArmor()) {
        def.armorUsed = true;
        def.health = Math.max(1, def.health - Math.round(data.damage * 0.4));
        def.flash = 4;
        atk.moveHits++; atk.lastHitFrame = atk.moveFrame; atk.moveConnected = true;
        this.fx.push({ kind: 'guard', x: def.x, y: 50, t: 0 });
        this.hitstop(6);
        CF.Audio.play('block');
        continue;
      }

      var result = def.takeHit(atk, data);
      atk.moveHits++;
      atk.lastHitFrame = atk.moveFrame;
      atk.moveConnected = true;

      var mid = (atk.x + def.x) / 2;
      var fxY = data.fxY;

      if (result === 'block') {
        atk.meter = Math.min(atk.maxMeter, atk.meter + Math.round((m.meterGain || 6) * 0.4));
        atk.vx = atk.facing * -1.2;
        this.hitstop(4);
        def.port.rumble(0.22, 60);
        atk.port.rumble(0.12, 45);
      } else {
        atk.meter = Math.min(atk.maxMeter, atk.meter + (m.meterOnHit || m.meterGain || 8));
        var heavy = data.damage >= 30;
        this.excite(m.kind === 'super' ? 0.7 : (heavy ? 0.28 : 0.10));
        /* the defender feels it hardest, the attacker feels the connection */
        var force = m.kind === 'super' ? 1 : (heavy ? 0.72 : (data.damage >= 20 ? 0.45 : 0.26));
        def.port.rumble(force, m.kind === 'super' ? 260 : (heavy ? 130 : 70));
        atk.port.rumble(force * 0.4, 55);
        var stop = m.kind === 'super' ? 12 : (heavy ? 9 : (data.damage >= 20 ? 7 : 5));
        this.hitstop(stop);
        this.shake(heavy ? 5 : 2.5);
        this.fx.push({ kind: 'impact', x: mid, y: fxY, t: 0, big: heavy,
                       spin: Math.random() * Math.PI,
                       color: m.kind === 'super' ? '#ffd166' : '#ff9c3a' });
        if (m.fx === 'spark') this.fx.push({ kind: 'spark', x: def.x, y: 70, t: 0 });
        if (result === 'counter') {
          var hasCounter = this.fx.some(function (e) { return e.kind === 'text' && e.str === 'COUNTER'; });
          if (!hasCounter) {
            this.fx.push({ kind: 'text', x: mid, y: 96, t: 0, str: 'COUNTER', size: 13, color: '#ff8a4a' });
          }
          CF.Audio.play('counter');
        } else {
          CF.Audio.play(m.kind === 'super' ? 'superhit' : (m.sfx || (heavy ? 'heavy' : 'med')));
        }
        if (result === 'ko') {
          /* Is this the blow that wins the match, or just the round? Only the
             one that ends it earns the camera. */
          var decisive = (atk.roundWins + 1) >= this.settings.rounds;
          this.shake(decisive ? 17 : 12);
          this.slowmo = decisive ? 170 : 46;
          this.excite(1);
          if (decisive) this.finish = { t: 0, win: atk, lose: def, at: mid };
          def.port.rumble(1, decisive ? 800 : 500);
          atk.port.rumble(0.5, 260);
        }
      }
    }
  };

  /* ---- projectiles -------------------------------------------------------- */
  Game.prototype.updateProjectiles = function () {
    var list = this.projectiles;
    for (var i = list.length - 1; i >= 0; i--) {
      var p = list[i];
      if (this.p1.hitstop > 0 && this.p2.hitstop > 0) break;   // freeze during hitstop
      p.x += p.vx;
      p.life--;
      if (p.life <= 0 || p.x < WALL_L - 60 || p.x > WALL_R + 60) { list.splice(i, 1); continue; }

      /* fireballs cancel each other, as they must */
      for (var j = list.length - 1; j >= 0; j--) {
        if (j === i) continue;
        var q = list[j];
        if (q.owner === p.owner) continue;
        if (Math.abs(q.x - p.x) < (p.w + q.w) / 2 && Math.abs(q.y - p.y) < (p.h + q.h) / 2) {
          this.fx.push({ kind: 'impact', x: (p.x + q.x) / 2, y: p.y, t: 0, big: true });
          CF.Audio.play('block');
          list.splice(Math.max(i, j), 1);
          list.splice(Math.min(i, j), 1);
          i = -1;
          break;
        }
      }
      if (i < 0) continue;
      if (!list[i]) continue;

      var def = (p.owner === 0) ? this.p2 : this.p1;
      var atk = (p.owner === 0) ? this.p1 : this.p2;
      if (def.state === 'ko' || def.hasInvuln()) continue;
      var box = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
      var boxes = def.hurtboxes(), hit = false;
      for (var b = 0; b < boxes.length; b++) if (U.rectsOverlap(box, boxes[b])) { hit = true; break; }
      if (!hit) continue;

      var res = def.takeHit(atk, {
        damage: p.damage, stun: p.stun, chip: p.chip,
        hitstun: p.hitstun, blockstun: p.blockstun,
        hitLevel: 'mid', pushback: p.pushback, blockPushback: p.blockPushback,
        knockdown: p.knockdown || (p.super ? 'soft' : false), fxY: p.y
      });
      if (res !== 'block') {
        atk.meter = Math.min(atk.maxMeter, atk.meter + 6);
        this.fx.push({ kind: 'impact', x: p.x, y: p.y, t: 0, big: !!p.super, color: p.color2 });
        this.hitstop(p.super ? 10 : 6);
        this.shake(p.super ? 5 : 2);
        CF.Audio.play(p.super ? 'superhit' : 'med');
      }
      list.splice(i, 1);
    }
  };

  /* ---- the slow yellow bar behind the red one ----------------------------- */
  Game.prototype.updateGhostBars = function () {
    var f = [this.p1, this.p2];
    for (var i = 0; i < 2; i++) {
      if (this.ghost[i] > f[i].health) {
        this.ghost[i] = Math.max(f[i].health, this.ghost[i] - 1.6);
      } else this.ghost[i] = f[i].health;
    }
  };

  /* ---- round and match flow ----------------------------------------------- */
  Game.prototype.endRound = function (winner, how) {
    if (this.roundState === 'over') return;
    this.roundState = 'over';
    this.overTimer = 170;

    if (how === 'time' && !winner) {
      var a = this.p1.health / this.p1.maxHealth, b = this.p2.health / this.p2.maxHealth;
      winner = (Math.abs(a - b) < 0.001) ? 'draw' : (a > b ? this.p1 : this.p2);
      this.say('TIME OVER', 90, 30, '#ffd166');
    } else if (winner === 'draw') {
      this.say('DOUBLE K.O.', 90, 28, '#ff7a4a');
    } else {
      this.say('K.O.', 90, 52, '#ff5b4a');
    }

    this.winner = winner;
    if (winner && winner !== 'draw') winner.roundWins++;
    else { this.p1.roundWins++; this.p2.roundWins++; }
    CF.Audio.play('ko');
  };

  Game.prototype.afterRound = function () {
    var need = this.settings.rounds;
    var p1w = this.p1.roundWins >= need, p2w = this.p2.roundWins >= need;
    if (p1w || p2w) {
      this.matchWinner = p1w && p2w ? 'draw' : (p1w ? this.p1 : this.p2);
      if (this.settings.mode === 'arcade' && p1w && !p2w) {
        this.arcade.step++;
        if (this.arcade.step >= this.arcade.order.length) {
          this.scene = 'result';
          this.resultStart = undefined;
          this.resultKind = 'clear';
          this.resultTimer = 400;
          this.arcade.pending = null;
          CF.Audio.stopMusic();
          return;
        }
        /* The ladder used to drop you straight into the next fight with no
           break at all, which reads as a bug rather than a feature. It now
           stops on the winner screen and asks: CONTINUE, or back to the
           title. Health is restored either way and meter carries over. */
        this.arcade.pending = {
          chr: this.p1.chr,
          next: CF.ROSTER[this.arcade.order[this.arcade.step]],
          stage: (this.select.stage + this.arcade.step) % CF.Stages.length,
          meter: this.p1.meter
        };
        this.scene = 'result';
        this.resultStart = undefined;
        this.resultKind = 'advance';
        this.resultTimer = 0;          /* no clock — it waits for an answer */
        this.resultPick = 0;
        CF.Audio.stopMusic();
        return;
      }
      this.scene = 'result';
      this.resultStart = undefined;
      this.resultKind = (this.matchWinner === 'draw') ? 'draw' : 'win';
      this.resultTimer = 340;
      CF.Audio.stopMusic();
      return;
    }
    this.round++;
    this.resetRound(false);
  };

  Game.prototype.stepResult = function () {
    /* Between arcade fights this is a menu, not a card that times out. */
    if (this.resultKind === 'advance' && this.arcade.pending) {
      var p = this.ports[0], r = this.resultRects();
      if (p.menuDir([4, 8])) { this.resultPick = 0; CF.Audio.play('cursor'); }
      if (p.menuDir([6, 2])) { this.resultPick = 1; CF.Audio.play('cursor'); }
      if (this.hover(r.go)) this.resultPick = 0;
      if (this.hover(r.quit)) this.resultPick = 1;

      var goOn = this.hit(r.go);
      var quit = this.hit(r.quit) || p.cancelPressed();
      if (!goOn && !quit && (p.confirmPressed() || p.startPressed)) {
        if (this.resultPick === 0) goOn = true; else quit = true;
      }
      if (goOn) {
        var pend = this.arcade.pending;
        this.arcade.pending = null;
        CF.Audio.play('select');
        this.startMatch(pend.chr, pend.next, pend.stage, 'arcade');
        this.p1.meter = Math.min(this.p1.maxMeter, pend.meter);
        return;
      }
      if (quit) {
        this.arcade.pending = null;
        this.arcade.step = 0;
        this.arcade.order = [];
        this.scene = 'title';
        this.menuIndex = 0;
        CF.Audio.play('cursor');
        CF.Audio.stopMusic();
      }
      return;
    }

    this.resultTimer--;
    if (this.resultTimer <= 0 || this.anyStart() || this.pointer.clicked ||
        this.ports[0].confirmPressed() || this.ports[0].cancelPressed()) {
      this.scene = 'title';
      this.menuIndex = 0;
      this.arcade.step = 0;
      this.arcade.order = [];
      CF.Audio.stopMusic();
    }
  };

  /* The two buttons on the between-fights screen. One function, used for
     drawing and for hit-testing — a menu drawn where the hit test cannot see
     it is a menu that does not work. */
  Game.prototype.resultRects = function () {
    return {
      go:   { x: W / 2 - 88, y: H - 30, w: 84, h: 16 },
      quit: { x: W / 2 + 4,  y: H - 30, w: 84, h: 16 }
    };
  };

  /* ======================================================================
     RENDERING
     ====================================================================== */

  Game.prototype.render = function () {
    var ctx = this.ctx;

    if (this.canvas && this.canvas.style && this.pointer.seen) {
      var tg = this.clickTargets(), onTarget = false;
      for (var q = 0; q < tg.length; q++) if (this.over(tg[q])) { onTarget = true; break; }
      var want = onTarget ? 'pointer' : 'default';
      if (this._cursorStyle !== want) { this._cursorStyle = want; this.canvas.style.cursor = want; }
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);

    switch (this.scene) {
      case 'title':    this.drawTitle(ctx); break;
      case 'select':   if (this.select.phase === 'stage') this.drawStageSelect(ctx);
                       else this.drawSelect(ctx); break;
      case 'roster':   this.drawRoster(ctx); break;
      case 'reveal':   this.drawReveal(ctx); break;
      case 'controls': this.drawControls(ctx); break;
      case 'options':  this.drawOptions(ctx); break;
      case 'fight':    this.drawFight(ctx); break;
      case 'result':   this.drawResult(ctx); break;
    }
    if (this.fps) {
      HUD.text(ctx, this.fps + ' FPS  ' + (this.deviceScale || '?') + 'x', W - 4, 8, 7,
               this.fps >= 55 ? 'rgba(150,255,150,.85)'
             : this.fps >= 30 ? 'rgba(255,220,120,.9)' : 'rgba(255,120,120,.95)',
               'right', 800, 0.4);
    }
    ctx.restore();
  };

  /* ---- a cat, drawn at an arbitrary place and size ------------------------ */
  function drawFighterAt(ctx, chr, pose, x, yBase, scale, facing, opts) {
    var j = CF.Rig.solve(pose, scale, chr.build);
    ctx.save();
    ctx.translate(x, yBase);
    ctx.scale(facing, -1);
    CF.Rig.drawCat(ctx, j, chr.palette, opts || {});
    ctx.restore();
  }
  Game.prototype.drawFighterAt = drawFighterAt;

  function shadow(ctx, x, yBase, w, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, yBase, w, w * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* ---- title -------------------------------------------------------------- */
  Game.prototype.drawTitle = function (ctx) {
    var t = this.t;
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1b1230'); g.addColorStop(0.55, '#57265a'); g.addColorStop(1, '#c05a3c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    /* sunburst */
    ctx.save();
    ctx.translate(W / 2, 68);
    for (var i = 0; i < 16; i++) {
      ctx.rotate(Math.PI / 8);
      ctx.globalAlpha = 0.06 + 0.03 * Math.sin(t * 0.03 + i);
      ctx.fillStyle = '#ffd76e';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(300, -30); ctx.lineTo(300, 30); ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    /* two cats squaring up behind the logo */
    var bob = Math.sin(t * 0.05) * 2;
    drawFighterAt(ctx, CF.ROSTER[0], CF.Anim.cycle([CF.Pose.stand, CF.Pose.standB], 22, t),
                  74, FLOOR_Y + 16 + bob, 0.92, 1, { eyes: 'angry' });
    drawFighterAt(ctx, CF.ROSTER[3], CF.Anim.cycle([CF.Pose.stand, CF.Pose.standC], 20, t + 30),
                  W - 74, FLOOR_Y + 16 - bob, 0.92, -1, { eyes: 'angry' });

    /* The logo is a lockup rather than three centred lines: SUPER over
       CAT FIGHTER 6, with the numeral set larger than the words beside it.
       Both halves are measured rather than guessed, so the whole thing stays
       centred if the name ever changes again. */
    var nameSize = 32, numSize = 40, gap = 5;
    var wName = HUD.measure(ctx, 'CAT FIGHTER', nameSize, 800, 0);
    var wNum = HUD.measure(ctx, '6', numSize, 800, 0);
    var lx = W / 2 - (wName + gap + wNum) / 2;
    HUD.outlineText(ctx, 'SUPER', W / 2, 44, 15, '#ffb347', '#2a0e18', 'center', 7);
    HUD.outlineText(ctx, 'CAT FIGHTER', lx, 78, nameSize, '#ffe07a', '#2a0e18', 'left');
    HUD.outlineText(ctx, '6', lx + wName + gap, 80, numSize, '#ff7a4a', '#2a0e18', 'left');
    HUD.text(ctx, 'THE FARMHOUSE WARRIORS', W / 2, 96, 9, '#ffd9b0', 'center', 700, 2.2);

    /* Drawn from the same rects the click lands in, so a menu item can never
       appear somewhere the hit test does not know about. */
    var tr = this.titleRects();
    for (var m = 0; m < tr.length; m++) {
      var r = tr[m], sel = m === this.menuIndex;
      var y = r.y + r.h - 3;
      if (sel) {
        ctx.fillStyle = 'rgba(255,224,122,.16)';
        ctx.fillRect(r.x + 2, r.y, r.w - 4, r.h - 1);
      }
      HUD.text(ctx, this.menuItems[m], W / 2, y, sel ? 12 : 11,
               sel ? '#ffe07a' : 'rgba(255,240,220,.62)', 'center', sel ? 800 : 700, 1.4);
      if (sel) {
        HUD.text(ctx, '▶', W / 2 - 74 + Math.sin(t * 0.14) * 2, y, 10, '#ffe07a', 'center');
      }
    }

    var hint = CF.Input.getScheme() === 'simple'
      ? 'J PUNCH   K KICK   SPACE JUMP   L BLOCK   •   TWO TOGETHER FOR A SPECIAL'
      : 'W A S D MOVE   •   U I O PUNCHES   •   J K L KICKS';
    HUD.text(ctx, hint, W / 2, H - 14, 7, 'rgba(255,240,220,.55)', 'center', 700, 0.6);
    HUD.text(ctx, 'CLICK A MENU ITEM  •  A CONTROLLER WORKS TOO — PLUG IT IN AND PRESS A BUTTON',
             W / 2, H - 5, 6.6, 'rgba(255,240,220,.38)', 'center', 700, 0.6);
  };

  /* ---- select ------------------------------------------------------------- */
  Game.prototype.drawSelect = function (ctx) {
    var t = this.t;
    ctx.fillStyle = '#20182c'; ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(W / 2, 90, 10, W / 2, 90, 240);
    g.addColorStop(0, 'rgba(120,70,140,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    HUD.text(ctx, 'SELECT YOUR CAT', W / 2, 18, 13, '#ffe07a', 'center', 800, 2);

    /* the way out, drawn exactly where selectBackRect says it is */
    var br = this.selectBackRect();
    var overBack = this.over(br);
    ctx.fillStyle = overBack ? 'rgba(255,224,122,.24)' : 'rgba(0,0,0,.42)';
    ctx.fillRect(br.x, br.y, br.w, br.h);
    ctx.strokeStyle = 'rgba(255,224,122,.45)'; ctx.lineWidth = 1;
    ctx.strokeRect(br.x + 0.5, br.y + 0.5, br.w - 1, br.h - 1);
    HUD.text(ctx, '\u25C0 BACK', br.x + br.w / 2, br.y + br.h - 4, 7,
             overBack ? '#ffe07a' : 'rgba(255,224,122,.75)', 'center', 800, 0.5);

    var cw = 52, ch = 46, gapX = 8, gapY = 8;
    var totalW = 3 * cw + 2 * gapX;
    var ox = W / 2 - totalW / 2, oy = 30;

    for (var i = 0; i < 6; i++) {
      var col = i % 3, row = (i / 3) | 0;
      var x = ox + col * (cw + gapX), y = oy + row * (ch + gapY);
      var chr = CF.ROSTER[i];
      ctx.fillStyle = 'rgba(0,0,0,.42)';
      ctx.fillRect(x, y, cw, ch);
      ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);

      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, cw, ch); ctx.clip();
      drawFighterAt(ctx, chr, CF.Anim.cycle([CF.Pose.stand, CF.Pose.standB], 26, t + i * 13),
                    x + cw / 2, y + ch - 3, 0.42, 1, {});
      ctx.restore();

      HUD.text(ctx, chr.displayName, x + cw / 2, y + ch - 3, 7, '#ffe9b8', 'center', 800, 0.4);

      for (var pl = 0; pl < (this.settings.mode === 'versus' ? 2 : 1); pl++) {
        if (this.select.cursor[pl] !== i) continue;
        var col2 = pl === 0 ? '#4ad0ff' : '#ff6b8a';
        ctx.strokeStyle = col2;
        ctx.lineWidth = this.select.locked[pl] ? 3 : 2;
        ctx.globalAlpha = this.select.locked[pl] ? 1 : (0.55 + 0.45 * Math.sin(t * 0.2));
        ctx.strokeRect(x - 1.5 - pl, y - 1.5 - pl, cw + 3 + pl * 2, ch + 3 + pl * 2);
        ctx.globalAlpha = 1;
        HUD.text(ctx, pl === 0 ? '1P' : '2P', x + (pl === 0 ? 3 : cw - 3), y + 9, 8,
                 col2, pl === 0 ? 'left' : 'right', 800);
      }
    }

    /* the highlighted cat's card */
    var sel = CF.ROSTER[this.select.cursor[0]];
    var by = oy + 2 * (ch + gapY) + 6;
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.fillRect(14, by, W - 28, H - by - 8);
    drawFighterAt(ctx, sel, CF.Anim.cycle([CF.Pose.stand, CF.Pose.standC], 24, t),
                  46, H - 12, 0.62, 1, { eyes: 'angry' });
    HUD.text(ctx, sel.displayName, 86, by + 16, 15, '#ffe07a', 'left', 800, 1.4);
    HUD.text(ctx, sel.subtitle, 86, by + 27, 9, '#ffb8a0', 'left', 700, 1);

    /* The blurb wraps inside the column so a longer one written later cannot
       run underneath the stage and difficulty readouts on the right. */
    var infoX = W - 98;
    var lines = HUD.wrapText(ctx, sel.blurb, infoX - 86 - 18, 7.5, 600);
    for (var L = 0; L < Math.min(lines.length, 4); L++) {
      HUD.text(ctx, lines[L], 86, by + 39 + L * 9, 7.6, 'rgba(255,240,220,.78)', 'left', 600, 0.3);
    }

    /* weight class — the trade the whole roster is built on */
    var cls = CF.CLASSES[sel.weightClass] || CF.CLASSES.medium;
    var clsCol = sel.weightClass === 'heavy' ? '#ff9d6a'
               : (sel.weightClass === 'light' ? '#8fe6ff' : '#c9d96a');
    HUD.text(ctx, 'WEIGHT', infoX, by + 14, 7, 'rgba(255,240,220,.6)', 'left', 700, 0.6);
    HUD.text(ctx, cls.label, infoX + 40, by + 14, 8.5, clsCol, 'left', 800, 0.8);

    /* what that costs, or buys, in plain words */
    var swing = Math.round(Math.abs(1 - cls.damageTaken) * 100);
    var toughLine = cls.damageTaken < 1 ? 'TAKES ' + swing + '% LESS DAMAGE'
                  : (cls.damageTaken > 1 ? 'TAKES ' + swing + '% MORE DAMAGE'
                  : 'NO WEAKNESS, NO EDGE');
    HUD.text(ctx, toughLine, infoX, by + 24, 6.4, 'rgba(255,240,220,.55)', 'left', 600, 0.15);

    /* difficulty pips */
    HUD.text(ctx, 'DIFFICULTY', infoX, by + 38, 7, 'rgba(255,240,220,.6)', 'left', 700, 0.6);
    for (var d = 0; d < 3; d++) {
      ctx.fillStyle = d < sel.difficulty ? '#ffd24a' : 'rgba(255,255,255,.18)';
      ctx.fillRect(infoX + d * 11, by + 42, 8, 4);
    }
    HUD.text(ctx, this.settings.mode.toUpperCase() + ' MODE', infoX, by + 56, 7.5,
             '#8fd6ff', 'left', 800, 0.6);
  };

  /* ---- stage select --------------------------------------------------------
     A live preview rather than a thumbnail: the stages are worth showing
     moving, since moving is the whole point of them.                       */

  Game.prototype.drawStageSelect = function (ctx) {
    var t = this.t, n = CF.Stages.length, pick = this.select.stage;
    var random = pick >= n;
    var stage = CF.Stages[random ? (Math.floor(t / 90) % n) : pick];

    ctx.fillStyle = '#15111f'; ctx.fillRect(0, 0, W, H);
    HUD.text(ctx, 'SELECT STAGE', W / 2, 18, 13, '#ffe07a', 'center', 800, 2);

    /* live preview */
    var pw = 250, ph = 146, px = (W - pw) / 2, py = 28;
    ctx.save();
    ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    ctx.translate(px, py);
    ctx.scale(pw / W, ph / H);
    var camX = -190 + Math.sin(t * 0.006) * 120;
    stage.drawBack(ctx, camX, t, 0.55);
    K.deepen(ctx, stage.air ? stage.air : null);
    var a = CF.ROSTER[this.select.cursor[0]];
    var b = CF.ROSTER[this.settings.mode === 'versus' ? this.select.cursor[1] : (this.select.cursor[0] + 1) % 6];
    drawFighterAt(ctx, a, CF.Anim.cycle([CF.Pose.stand, CF.Pose.standB], 22, t), 140, FLOOR_Y, 1, 1, { eyes: 'angry' });
    drawFighterAt(ctx, b, CF.Anim.cycle([CF.Pose.stand, CF.Pose.standC], 20, t + 30), 244, FLOOR_Y, 1, -1, { eyes: 'angry' });
    if (stage.drawFore) stage.drawFore(ctx, camX, t, 0.55);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,224,122,.55)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(px - 0.75, py - 0.75, pw + 1.5, ph + 1.5);

    /* arrows */
    var ax = 0.5 + 0.5 * Math.sin(t * 0.12);
    HUD.text(ctx, '◀', px - 14, py + ph / 2 + 4, 15, 'rgba(255,224,122,' + (0.45 + ax * 0.5) + ')', 'center', 800);
    HUD.text(ctx, '▶', px + pw + 14, py + ph / 2 + 4, 15, 'rgba(255,224,122,' + (0.45 + ax * 0.5) + ')', 'center', 800);

    /* name and blurb */
    HUD.text(ctx, random ? 'RANDOM' : stage.name, W / 2, 190, 13, '#ffe07a', 'center', 800, 1.6);
    HUD.text(ctx, random ? 'let the farm decide' : (stage.blurb || ''), W / 2, 200, 7.4,
             'rgba(255,240,220,.7)', 'center', 600, 0.3);

    /* position dots */
    var total = n + 1, dx = W / 2 - (total - 1) * 5;
    for (var i = 0; i < total; i++) {
      var on = (i === pick);
      ctx.fillStyle = on ? '#ffe07a' : 'rgba(255,255,255,.22)';
      ctx.beginPath(); ctx.arc(dx + i * 10, 208, on ? 2.8 : 2, 0, Math.PI * 2); ctx.fill();
    }

    HUD.text(ctx, 'LEFT / RIGHT TO CHOOSE   •   PUNCH TO FIGHT   •   KICK TO GO BACK',
             W / 2, H - 4, 7, 'rgba(255,240,220,.6)', 'center', 700, 0.6);
  };

  /* ---- controls -----------------------------------------------------------

     Two pages: what the buttons are, and what the motions are. A drawn
     controller beats a table of numbers, because the thing a player wants to
     know is "which of these do I press", and a picture answers that.       */

  function padDiagram(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    /* triggers and bumpers, behind the body */
    ctx.fillStyle = '#4a4a56';
    ctx.fillRect(-36, -31, 14, 6);
    ctx.fillRect(22, -31, 14, 6);
    ctx.fillStyle = '#3d3d48';
    ctx.fillRect(-40, -25, 21, 6);
    ctx.fillRect(19, -25, 21, 6);

    /* body */
    ctx.fillStyle = '#2b2b34';
    ctx.beginPath();
    ctx.moveTo(-46, -6);
    ctx.quadraticCurveTo(-52, 14, -38, 22);
    ctx.quadraticCurveTo(-26, 28, -18, 14);
    ctx.lineTo(18, 14);
    ctx.quadraticCurveTo(26, 28, 38, 22);
    ctx.quadraticCurveTo(52, 14, 46, -6);
    ctx.quadraticCurveTo(40, -19, 20, -19);
    ctx.lineTo(-20, -19);
    ctx.quadraticCurveTo(-40, -19, -46, -6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1; ctx.stroke();

    /* left stick */
    ctx.fillStyle = '#16161d';
    ctx.beginPath(); ctx.arc(-28, -5, 8.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#45454f';
    ctx.beginPath(); ctx.arc(-28, -5, 5.8, 0, Math.PI * 2); ctx.fill();

    /* d-pad */
    ctx.fillStyle = '#16161d';
    ctx.fillRect(-15, 2.4, 15, 5);
    ctx.fillRect(-10, -2.6, 5, 15);

    /* face buttons, in the real arrangement */
    var faces = [[28, -12, '#e0b52e', 'Y'], [20, -4, '#3f7fd9', 'X'],
                 [36, -4, '#d94a3f', 'B'], [28, 4, '#6fbf4a', 'A']];
    ctx.textAlign = 'center';
    for (var i = 0; i < faces.length; i++) {
      var f = faces[i];
      ctx.fillStyle = f[2];
      ctx.beginPath(); ctx.arc(f[0], f[1], 4.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.65)';
      ctx.font = '800 5.4px Arial';
      ctx.fillText(f[3], f[0], f[1] + 2);
    }

    /* right stick, start and back */
    ctx.fillStyle = '#16161d';
    ctx.beginPath(); ctx.arc(6, 7, 7.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#45454f';
    ctx.beginPath(); ctx.arc(6, 7, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a4a56';
    ctx.beginPath(); ctx.arc(-6, -9, 2.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, -9, 2.3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  /* The legend sits beside the picture rather than being wired to it with
     callout lines: eight lines all reaching the same corner of a small pad
     cross each other into a cobweb and stop being readable. */
  var LEGEND = {
    simple: [
      ['X',  '#3f7fd9', 'PUNCH'],
      ['B',  '#d94a3f', 'KICK'],
      ['A',  '#6fbf4a', 'JUMP'],
      ['Y',  '#e0b52e', 'BLOCK   (or LB)'],
      ['LT', '#5a5a68', 'DODGE'],
      ['RT', '#5a5a68', 'LUNGE']
    ],
    classic: [
      ['X',  '#3f7fd9', 'LIGHT PUNCH'],
      ['Y',  '#e0b52e', 'MEDIUM PUNCH'],
      ['RB', '#5a5a68', 'HEAVY PUNCH'],
      ['A',  '#6fbf4a', 'LIGHT KICK'],
      ['B',  '#d94a3f', 'MEDIUM KICK'],
      ['RT', '#5a5a68', 'HEAVY KICK'],
      ['LT', '#5a5a68', 'THROW']
    ]
  };

  var COMBOS = [
    ['PUNCH + KICK',   'SPECIAL 1'],
    ['PUNCH + BLOCK',  'SPECIAL 2'],
    ['KICK + BLOCK',   'THROW'],
    ['LT + RT',        'SUPER  (full meter)']
  ];

  var SIMPLE_NORMALS_HELP = [
    ['PUNCH',            'jab'],
    ['forward + PUNCH',  'heavy punch'],
    ['down + PUNCH',     'low punch'],
    ['up + PUNCH',       'rising claw — anti-air'],
    ['KICK',             'quick kick'],
    ['forward + KICK',   'roundhouse'],
    ['down + KICK',      'sweep — knocks down'],
    ['up + KICK',        'side kick']
  ];

  Game.prototype.drawControls = function (ctx) {
    var page = this.ctrlPage || 0;
    var simple = CF.Input.getScheme() === 'simple';
    ctx.fillStyle = '#171224'; ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(W / 2, 90, 10, W / 2, 90, 230);
    g.addColorStop(0, 'rgba(90,60,120,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    HUD.text(ctx, page === 0 ? 'CONTROLLER' : (simple ? 'MOVES' : 'MOTIONS'),
             W / 2, 17, 13, '#ffe07a', 'center', 800, 2);
    HUD.text(ctx, CF.Input.schemeDef().label + '  •  ◀ ' + (page + 1) + ' / 2 ▶',
             W / 2, 27, 7, 'rgba(255,240,220,.5)', 'center', 700, 1);

    if (page === 0) {
      padDiagram(ctx, 88, 76, 1.35);

      var rows = LEGEND[simple ? 'simple' : 'classic'];
      var lx = 168;
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i], ly = 44 + i * 12;
        ctx.fillStyle = row[1];
        ctx.beginPath(); ctx.arc(lx + 6, ly - 3, 5, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.font = '800 6px Arial'; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,.72)';
        ctx.fillText(row[0], lx + 6, ly - 1);
        ctx.restore();
        HUD.text(ctx, row[2], lx + 18, ly, 8, '#ffe9b8', 'left', 700, 0.4);
      }
      HUD.text(ctx, 'STICK OR D-PAD  —  MOVE, CROUCH, AIM', lx, 44 + rows.length * 12 + 2,
               7, 'rgba(255,240,220,.55)', 'left', 600, 0.3);

      if (simple) {
        ctx.fillStyle = 'rgba(255,224,122,.08)';
        ctx.fillRect(14, 122, W - 28, 46);
        HUD.text(ctx, 'SPECIALS — PRESS TWO TOGETHER', W / 2, 132, 8, '#ffe07a', 'center', 800, 1);
        for (var cbi = 0; cbi < COMBOS.length; cbi++) {
          var cy = 142 + cbi * 7.5;
          HUD.text(ctx, COMBOS[cbi][0], 26, cy, 7.4, '#8fd6ff', 'left', 700, 0.3);
          HUD.text(ctx, COMBOS[cbi][1], W - 26, cy, 7.4, 'rgba(255,240,220,.85)', 'right', 600, 0.2);
        }
      }

      /* live connection status */
      var names = [this.ports[0].padName(), this.ports[1].padName()];
      var any = names[0] || names[1];
      var sy = simple ? 178 : 150;
      HUD.text(ctx, any ? 'CONTROLLER DETECTED' : 'NO CONTROLLER DETECTED',
               W / 2, sy, 8, any ? '#8fe6a0' : 'rgba(255,240,220,.5)', 'center', 800, 1);
      if (any) {
        var shown = 0;
        for (var k2 = 0; k2 < 2; k2++) {
          if (!names[k2]) continue;
          HUD.text(ctx, (k2 === 0 ? '1P — ' : '2P — ') + names[k2], W / 2, sy + 9 + shown * 8, 7,
                   k2 === 0 ? '#4ad0ff' : '#ff9db0', 'center', 700, 0.6);
          shown++;
        }
      }

      if (!simple) {
        HUD.text(ctx, 'KEYBOARD', 20, 176, 7.5, '#ffb8a0', 'left', 800, 0.8);
        HUD.text(ctx, '1P', 236, 176, 7, '#8fd6ff', 'center', 800, 0.6);
        HUD.text(ctx, '2P', 320, 176, 7, '#ff9db0', 'center', 800, 0.6);
        var kb = [['MOVE', 'W A S D', 'ARROWS'],
                  ['PUNCHES', 'U  I  O', 'NUM 7 8 9'],
                  ['KICKS', 'J  K  L', 'NUM 4 5 6']];
        for (var r2 = 0; r2 < kb.length; r2++) {
          var ry2 = 186 + r2 * 8;
          HUD.text(ctx, kb[r2][0], 20, ry2, 7, 'rgba(255,240,220,.72)', 'left', 600, 0.2);
          HUD.text(ctx, kb[r2][1], 236, ry2, 7, '#ffe9b8', 'center', 700, 0.2);
          HUD.text(ctx, kb[r2][2], 320, ry2, 7, '#ffe9b8', 'center', 700, 0.2);
        }
      } else {
        HUD.text(ctx, '1P KEYBOARD   A D move · S crouch · W up · J punch · K kick · ' +
                      'SPACE jump · L block · U dodge · I lunge',
                 W / 2, 202, 6.2, 'rgba(255,240,220,.62)', 'center', 600, 0.1);
        HUD.text(ctx, '2P KEYBOARD   arrows · NUM 4 punch · 5 kick · 0 jump · 6 block · 7 dodge · 8 lunge',
                 W / 2, 211, 6.2, 'rgba(255,240,220,.45)', 'center', 600, 0.1);
      }

    } else if (simple) {
      HUD.text(ctx, 'a direction changes what the button does',
               W / 2, 39, 7.4, 'rgba(255,240,220,.55)', 'center', 600, 0.4);
      for (var m2 = 0; m2 < SIMPLE_NORMALS_HELP.length; m2++) {
        var my2 = 55 + m2 * 13;
        ctx.fillStyle = m2 % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.18)';
        ctx.fillRect(24, my2 - 9, W - 48, 12);
        HUD.text(ctx, SIMPLE_NORMALS_HELP[m2][0], 32, my2, 7.6, '#ffe07a', 'left', 800, 0.3);
        HUD.text(ctx, SIMPLE_NORMALS_HELP[m2][1], W - 32, my2, 7.4,
                 'rgba(255,240,220,.85)', 'right', 600, 0.2);
      }
      var extra = [['BLOCK', 'hold it — add down for lows'],
                   ['DODGE (LT)', 'invincible hop away'],
                   ['LUNGE (RT)', 'close in — punch or kick out of it']];
      for (var e2 = 0; e2 < extra.length; e2++) {
        var ey = 170 + e2 * 13;
        ctx.fillStyle = 'rgba(143,214,255,.07)';
        ctx.fillRect(24, ey - 9, W - 48, 12);
        HUD.text(ctx, extra[e2][0], 32, ey, 7.6, '#8fd6ff', 'left', 800, 0.3);
        HUD.text(ctx, extra[e2][1], W - 32, ey, 7.4, 'rgba(255,240,220,.85)', 'right', 600, 0.2);
      }

    } else {
      HUD.text(ctx, 'written facing right — they mirror when your cat turns around',
               W / 2, 39, 7.4, 'rgba(255,240,220,.55)', 'center', 600, 0.4);
      var mo = [
        ['FIREBALL',     'down, down-forward, forward', 'punch'],
        ['UPPERCUT',     'forward, down, down-forward', 'punch'],
        ['SPIN KICK',    'down, down-back, back', 'kick'],
        ['CHARGE SHOT',  'hold BACK 40 frames, then forward', 'button'],
        ['FLASH KICK',   'hold DOWN 40 frames, then up', 'kick'],
        ['COMMAND GRAB', 'forward, down, back, up', 'punch'],
        ['SUPER',        'two fireball motions, full meter', 'button'],
        ['DASH',         'tap forward twice', '—'],
        ['BLOCK',        'hold back, or down-back for lows', '—'],
        ['THROW',        'LT, or light punch + light kick', '—']
      ];
      for (var m = 0; m < mo.length; m++) {
        var my = 54 + m * 14;
        ctx.fillStyle = m % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.18)';
        ctx.fillRect(14, my - 9, W - 28, 13);
        HUD.text(ctx, mo[m][0], 20, my, 7.6, '#ffe07a', 'left', 800, 0.4);
        HUD.text(ctx, mo[m][1], 112, my, 7.2, 'rgba(255,240,220,.85)', 'left', 600, 0.15);
        HUD.text(ctx, mo[m][2], W - 20, my, 7.2, '#8fd6ff', 'right', 700, 0.2);
      }
    }

    HUD.text(ctx, 'LEFT / RIGHT TO TURN THE PAGE   •   ENTER TO GO BACK',
             W / 2, H - 3, 6.8, '#ffe07a', 'center', 800, 0.8);
  };

  /* ---- options ------------------------------------------------------------ */
  Game.prototype.drawOptions = function (ctx) {
    ctx.fillStyle = '#1a1424'; ctx.fillRect(0, 0, W, H);
    HUD.text(ctx, 'OPTIONS', W / 2, 22, 13, '#ffe07a', 'center', 800, 2);
    var rows = this.optionRows();
    var rr = this.optionRects(rows.length);
    for (var i = 0; i < rows.length; i++) {
      var r = rr[i], y = r.y + r.h - 4, sel = i === this.optIndex;
      if (sel) {
        ctx.fillStyle = 'rgba(255,224,122,.14)';
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.fillStyle = '#ffe07a';
        ctx.fillRect(r.x, r.y, 2, r.h);
      }
      HUD.text(ctx, rows[i].label, r.x + 12, y, 9,  sel ? '#ffe07a' : 'rgba(255,240,220,.7)', 'left', sel ? 800 : 600, 0.8);
      HUD.text(ctx, rows[i].value, r.x + r.w - 12, y, 9,  sel ? '#8fd6ff' : 'rgba(255,240,220,.7)', 'right', sel ? 800 : 600, 0.8);
    }

    /* what the highlighted row actually does */
    var pick = rows[this.optIndex];
    if (pick && pick.desc) {
      var by = H - 50;
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(50, by, W - 100, 34);
      ctx.fillStyle = '#8fd6ff';
      ctx.fillRect(50, by, 2, 34);
      var lines = HUD.wrapText(ctx, pick.desc, W - 124, 7.4, 600);
      for (var L = 0; L < Math.min(lines.length, 3); L++) {
        HUD.text(ctx, lines[L], 60, by + 11 + L * 9, 7.4, 'rgba(255,240,220,.86)', 'left', 600, 0.2);
      }
    }

    HUD.text(ctx, 'LEFT / RIGHT TO CHANGE   •   ENTER TO CONFIRM',
             W / 2, H - 6, 7.5, 'rgba(255,240,220,.55)', 'center', 700, 0.8);
  };

  /* ---- the fight ---------------------------------------------------------- */
  Game.prototype.drawFight = function (ctx) {
    var camX = this.camX;
    var sx = (Math.random() - 0.5) * this.shakeAmt;
    var sy = (Math.random() - 0.5) * this.shakeAmt;

    ctx.save();
    ctx.translate(sx, sy);

    /* On the finishing blow the camera pushes in on the winner and holds
       there while the slow motion plays out. Everything below is drawn
       through it, stage included, so it reads as a camera move rather than a
       sprite getting bigger. */
    var fin = this.finish;
    if (fin) {
      var kz = U.clamp(fin.t / 46, 0, 1);
      var zoom = 1 + 0.78 * (kz * kz * (3 - 2 * kz));
      var fx2 = fin.win.x - camX, fy2 = FLOOR_Y - 62;
      ctx.translate(fx2, fy2);
      ctx.scale(zoom, zoom);
      ctx.translate(-fx2, -fy2);
    }
    this.stage.drawBack(ctx, camX, this.t, this.crowdMood);
    /* Atmosphere, laid over the background and under the cats. A stage cannot
       forget it, and it is what stops a dark cat vanishing into a dark wall. */
    K.deepen(ctx, this.stage.air ? this.stage.air : null);

    /* shadows first so both cats cast onto the same floor */
    var fs = [this.p1, this.p2];
    for (var i = 0; i < 2; i++) {
      var f = fs[i];
      var lift = U.clamp(1 - f.y / 120, 0.35, 1);
      shadow(ctx, f.x - camX, FLOOR_Y + 1, 18 * lift, 0.3 * lift);
    }

    /* the back cat first, so the attacker reads on top */
    var order = (this.p1.y > this.p2.y) ? [this.p2, this.p1] : [this.p1, this.p2];
    for (var k = 0; k < 2; k++) {
      var ff = order[k];
      var opts = { eyes: ff.eyeState(), mouth: ff.mouthState() };
      if (ff.flash > 2) opts.flash = 'white';
      if (ff.state === 'move' && ff.move && ff.move.kind === 'super' && ff.superFreeze > 0) {
        opts.flash = (this.t % 4 < 2) ? 'white' : null;
      }
      drawFighterAt(ctx, ff.chr, ff.drawPose(), ff.x - camX, FLOOR_Y - ff.y, 1, ff.facing, opts);
    }

    for (var p = 0; p < this.projectiles.length; p++) {
      HUD.drawProjectile(ctx, this.projectiles[p], camX, this.t);
    }

    HUD.drawFx(ctx, this.fx, camX);

    /* the foreground pass — what makes the cats feel inside the place
       rather than pasted on top of a picture of it */
    if (this.stage.drawFore) this.stage.drawFore(ctx, camX, this.t, this.crowdMood);
    /* the near edge of the floor, turning away from the light as it comes
       towards you — the frame along the bottom of the picture */
    K.nearLip(ctx, 13, 0.40);

    if (this.settings.showBoxes) this.drawBoxes(ctx, camX);
    ctx.restore();

    /* ---- HUD ---- */
    HUD.bar(ctx, this.p1, 0, this.ghost[0]);
    HUD.bar(ctx, this.p2, 1, this.ghost[1]);
    HUD.meterBar(ctx, this.p1, 0);
    HUD.meterBar(ctx, this.p2, 1);
    HUD.timer(ctx, this.timeLeft);
    HUD.combo(ctx, this.p2, 0);   // damage dealt BY p1 shows on p1's side
    HUD.combo(ctx, this.p1, 1);

    if (this.settings.mode === 'arcade') {
      HUD.text(ctx, 'MATCH ' + (this.arcade.step + 1) + ' / ' + this.arcade.order.length,
               W / 2, 48, 7.5, 'rgba(255,240,220,.6)', 'center', 700, 0.8);
    }
    if (this.trainingDummy) {
      HUD.text(ctx, 'TRAINING — 2P HEALTH AND 1P METER REFILL',
               W / 2, 48, 7, 'rgba(255,240,220,.55)', 'center', 700, 0.6);
    }

    if (this.announceT > 0 && this.announce) {
      var a = this.announce;
      var k2 = U.clamp((90 - this.announceT) / 8, 0, 1);
      ctx.save();
      ctx.translate(W / 2, H / 2 - 14);
      ctx.scale(1 + (1 - k2) * 0.5, 1 + (1 - k2) * 0.5);
      ctx.globalAlpha = U.clamp(this.announceT / 18, 0, 1);
      HUD.outlineText(ctx, a.str, 0, 0, a.size, a.color, '#2a0e18', 'center');
      ctx.restore();
    }

    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.fillRect(0, 0, W, H);
      HUD.outlineText(ctx, 'PAUSED', W / 2, H / 2 - 6, 26, '#ffe07a', '#2a0e18');
      HUD.text(ctx, 'ENTER TO RESUME   •   KICK TO QUIT TO TITLE',
               W / 2, H / 2 + 14, 8, 'rgba(255,240,220,.75)', 'center', 700, 0.8);
    }
  };

  Game.prototype.drawBoxes = function (ctx, camX) {
    var fs = [this.p1, this.p2];
    ctx.save();
    ctx.lineWidth = 1;

    /* Say so. This is a debugging view, it is reachable from the options
       screen and from a key next to Escape, and boxes drawn round a cat with
       nothing explaining them look like the game has gone wrong. */
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(0, H - 11, W, 11);
    HUD.text(ctx, 'HITBOX DISPLAY IS ON  —  F1 TO HIDE, OR TURN IT OFF IN OPTIONS',
             W / 2, H - 3, 7, 'rgba(120,220,255,.95)', 'center', 800, 0.6);
    for (var i = 0; i < 2; i++) {
      var f = fs[i];
      var hb = f.hurtboxes();
      ctx.strokeStyle = 'rgba(90,200,255,.85)';
      for (var k = 0; k < hb.length; k++) {
        var b = hb[k];
        ctx.strokeRect(b.x - camX, FLOOR_Y - (b.y + b.h), b.w, b.h);
      }
      var pb = f.pushbox();
      ctx.strokeStyle = 'rgba(255,255,255,.5)';
      ctx.strokeRect(pb.x - camX, FLOOR_Y - (pb.y + pb.h), pb.w, pb.h);
      var ab = f.activeHitbox();
      if (ab) {
        ctx.fillStyle = 'rgba(255,60,60,.28)';
        ctx.strokeStyle = 'rgba(255,60,60,.95)';
        ctx.fillRect(ab.x - camX, FLOOR_Y - (ab.y + ab.h), ab.w, ab.h);
        ctx.strokeRect(ab.x - camX, FLOOR_Y - (ab.y + ab.h), ab.w, ab.h);
      }
      /* frame data readout */
      if (f.move) {
        var m = f.move;
        var phase = f.moveFrame < m.startup ? 'STARTUP'
                  : (f.moveFrame < m.startup + m.active ? 'ACTIVE' : 'RECOVERY');
        HUD.text(ctx, m.name + '  ' + phase + '  ' + f.moveFrame + '/' + (m.startup + m.active + m.recovery),
                 i === 0 ? 6 : W - 6, 108 + i * 9, 7, i === 0 ? '#8fd6ff' : '#ff9db0',
                 i === 0 ? 'left' : 'right', 700, 0.2);
      }
    }
    ctx.restore();
  };

  /* ---- result ------------------------------------------------------------- */
  /* The winner's screen. Turning rays behind the cat, the name slamming in
     from the side, and the pose held — the beat the whole match was for. */
  Game.prototype.drawResult = function (ctx) {
    var t = this.t, tt = (this.resultStart === undefined) ? 0 : (t - this.resultStart);
    if (this.resultStart === undefined) this.resultStart = t;
    var intro = U.clamp(tt / 30, 0, 1);
    var ease = 1 - Math.pow(1 - intro, 3);

    var champ = (this.resultKind === 'clear') ? this.p1 :
                (this.matchWinner === 'draw' ? this.p1 : this.matchWinner);
    var pal = champ.chr.palette;
    var accent = pal.accent || '#ffd166';

    ctx.fillStyle = '#120c1a'; ctx.fillRect(0, 0, W, H);
    var wash = ctx.createRadialGradient(W / 2, 108, 8, W / 2, 108, 230);
    wash.addColorStop(0, pal.fur2 || '#3a3040');
    wash.addColorStop(0.5, 'rgba(24,14,30,.8)');
    wash.addColorStop(1, '#120c1a');
    ctx.globalAlpha = 0.9 * ease;
    ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    /* rays, turning slowly behind them */
    ctx.save();
    ctx.translate(W / 2, 118);
    ctx.rotate(t * 0.004);
    for (var i = 0; i < 16; i++) {
      ctx.rotate(Math.PI / 8);
      ctx.globalAlpha = U.clamp((0.10 + 0.07 * Math.sin(t * 0.03 + i)) * ease, 0, 1);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(320, -26); ctx.lineTo(320, 26);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    /* the spot they are standing in */
    var spot = ctx.createRadialGradient(W / 2, FLOOR_Y + 20, 4, W / 2, FLOOR_Y + 20, 110);
    spot.addColorStop(0, 'rgba(255,246,214,.32)');
    spot.addColorStop(1, 'rgba(255,246,214,0)');
    ctx.globalAlpha = ease;
    ctx.fillStyle = spot; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    /* the champion, rising into the pose */
    var rise = (1 - ease) * 26;
    ctx.save();
    ctx.globalAlpha = ease;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.beginPath();
    ctx.ellipse(W / 2, FLOOR_Y + 30, 28, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    drawFighterAt(ctx, champ.chr,
      CF.Anim.sample([{ at: 0, p: CF.Pose.stand }, { at: 34, p: CF.Pose.winPose }],
                     Math.min(34, tt)),
      W / 2, FLOOR_Y + 30 + rise, 1.44, 1,
      { eyes: 'normal', mouth: tt > 20 && tt < 44 ? 'open' : null });
    ctx.restore();

    /* the words, arriving from the side and landing hard */
    var slam = (1 - ease) * 150;
    ctx.save();
    ctx.globalAlpha = ease;
    if (this.resultKind === 'clear') {
      HUD.outlineText(ctx, 'ARCADE CLEAR', W / 2 + slam, 34, 25, '#ffe07a', '#2a0e18');
      HUD.text(ctx, champ.chr.displayName + ' IS THE CHAMPION OF THE FARMHOUSE',
               W / 2 - slam, 50, 8.5, '#ffd9b0', 'center', 700, 1);
    } else if (this.resultKind === 'draw') {
      HUD.outlineText(ctx, 'DRAW GAME', W / 2 + slam, 42, 25, '#ffd166', '#2a0e18');
    } else if (this.resultKind === 'advance') {
      HUD.outlineText(ctx, 'WINNER', W / 2 + slam, 28, 20, '#ffe07a', '#2a0e18');
      HUD.outlineText(ctx, champ.chr.displayName, W / 2 - slam, 50, 21, '#fff', '#2a0e18');
      /* the line goes UNDER the champion, not across their ears */
      var pend2 = this.arcade.pending;
      if (pend2) {
        HUD.text(ctx, 'MATCH ' + (this.arcade.step + 1) + ' OF ' + this.arcade.order.length +
                      '   \u00B7   NEXT UP: ' + pend2.next.displayName,
                 W / 2 - slam, H - 36, 8, '#ffb8a0', 'center', 700, 1.2);
      }
    } else {
      HUD.outlineText(ctx, 'WINNER', W / 2 + slam, 28, 20, '#ffe07a', '#2a0e18');
      HUD.outlineText(ctx, champ.chr.displayName, W / 2 - slam, 50, 21, '#fff', '#2a0e18');
      HUD.text(ctx, (champ.chr.subtitle || '').toUpperCase(), W / 2 - slam, 61, 8.5,
               '#ffb8a0', 'center', 700, 1.6);
    }
    ctx.restore();

    /* letterbox, so it reads as a cut rather than a menu */
    var bar = 12 * Math.min(1, tt / 12);
    ctx.fillStyle = '#08060c';
    ctx.fillRect(0, 0, W, bar);
    ctx.fillRect(0, H - bar, W, bar);
    ctx.fillStyle = 'rgba(255,224,122,.25)';
    ctx.fillRect(0, bar - 1, W, 1);
    ctx.fillRect(0, H - bar, W, 1);

    /* the flash on arrival */
    if (tt < 10) {
      ctx.globalAlpha = Math.max(0, 1 - tt / 10) * 0.85;
      ctx.fillStyle = '#fff6e0'; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    if (this.resultKind === 'advance' && this.arcade.pending) {
      /* CONTINUE or go home. Drawn from resultRects, which is the same
         function the hit test uses. */
      var rr2 = this.resultRects(), self = this;
      ctx.globalAlpha = ease;
      [[rr2.go, 'CONTINUE', 0], [rr2.quit, 'QUIT TO TITLE', 1]].forEach(function (b2) {
        var box = b2[0], on = (self.resultPick === b2[2]) || self.over(box);
        ctx.fillStyle = on ? 'rgba(255,224,122,.26)' : 'rgba(0,0,0,.55)';
        ctx.fillRect(box.x, box.y, box.w, box.h);
        ctx.strokeStyle = on ? '#ffe07a' : 'rgba(255,224,122,.4)';
        ctx.lineWidth = on ? 1.6 : 1;
        ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);
        HUD.text(ctx, b2[1], box.x + box.w / 2, box.y + box.h - 5, 8,
                 on ? '#fff6e0' : 'rgba(255,224,122,.7)', 'center', 800, 0.6);
      });
      ctx.globalAlpha = 1;
    } else if (tt > 34) {
      HUD.text(ctx, 'PRESS ANYTHING', W / 2, H - 3, 7.5,
               t % 60 < 36 ? '#ffe07a' : 'rgba(255,224,122,.3)', 'center', 800, 1.4);
    }
  };
;

  CF.Game = Game;
})();
