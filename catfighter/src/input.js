/* ==========================================================================
   Cat Fighter II — input

   Directions use arcade numpad notation, always stored ABSOLUTE (7 = up-left
   on the screen). Motions are authored facing RIGHT and mirrored at read time,
   which is how every real fighting game does it — a quarter-circle-forward is
   the same motion whichever way your cat happens to be looking.

        7 8 9
        4 5 6      5 = neutral
        1 2 3
   ========================================================================== */
(function () {
  var BUTTONS = ['LP', 'MP', 'HP', 'LK', 'MK', 'HK'];

  /* ---- Key bindings ------------------------------------------------------
     Six-button arcade layout, punches on the top row, kicks below:
          LP MP HP
          LK MK HK
     Edit these to taste — nothing else reads raw key codes.                */
  var KEYS = {
    p1: {
      up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'],
      LP: ['KeyU'], MP: ['KeyI'], HP: ['KeyO'],
      LK: ['KeyJ'], MK: ['KeyK'], HK: ['KeyL'],
      start: ['Enter', 'Space']
    },
    p2: {
      up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'],
      LP: ['Numpad7', 'Digit7'], MP: ['Numpad8', 'Digit8'], HP: ['Numpad9', 'Digit9'],
      LK: ['Numpad4', 'Digit4'], MK: ['Numpad5', 'Digit5'], HK: ['Numpad6', 'Digit6'],
      start: ['NumpadEnter', 'ShiftRight']
    }
  };

  /* Standard-gamepad button indices for a six-button fightpad. */
  var PAD_BUTTONS = { LP: 2, MP: 3, HP: 5, LK: 0, MK: 1, HK: 7, start: 9 };
  var PAD_DEADZONE = 0.4;

  var down = Object.create(null);   // physical keys currently held
  var latch = Object.create(null);  // keys pressed since the port last looked

  /* A key tapped and released between two logical frames would otherwise be
     invisible. The latch guarantees every press is seen exactly once, which
     matters for a game where a missed jab is a lost round. */
  window.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    down[e.code] = true;
    latch[e.code] = true;
    // Stop the browser scrolling the page out from under the fight.
    if (e.code.indexOf('Arrow') === 0 || e.code === 'Space' || e.code === 'Tab') e.preventDefault();
  });
  window.addEventListener('keyup', function (e) { down[e.code] = false; });
  window.addEventListener('blur', function () {
    down = Object.create(null);
    latch = Object.create(null);
  });

  function anyDown(codes) {
    for (var i = 0; i < codes.length; i++) if (down[codes[i]] || latch[codes[i]]) return true;
    return false;
  }
  function clearLatch(codes) {
    for (var i = 0; i < codes.length; i++) latch[codes[i]] = false;
  }

  /* ---- Per-player input port -------------------------------------------- */
  function Port(which) {
    this.which = which;            // 'p1' | 'p2'
    this.padIndex = which === 'p1' ? 0 : 1;
    this.dir = 5;
    this.held = {};                // button -> bool
    this.pressed = {};             // button -> true on the frame it went down
    this.released = {};
    this.history = [];             // newest last: {dir, mask, frame}
    this.frame = 0;
    this.chargeBack = 0;           // frames spent holding back-ish
    this.chargeDown = 0;           // frames spent holding down-ish
    this.consumed = 0;             // frame index up to which motions are spent
    for (var i = 0; i < BUTTONS.length; i++) this.held[BUTTONS[i]] = false;
  }

  Port.BUTTONS = BUTTONS;

  Port.prototype.pad = function () {
    var pads = navigator.getGamepads ? navigator.getGamepads() : [];
    var p = pads && pads[this.padIndex];
    return (p && p.connected) ? p : null;
  };

  Port.prototype.padConnected = function () { return !!this.pad(); };

  /* Read the physical keyboard/pad for this port. */
  Port.prototype.readHardware = function () {
    var k = KEYS[this.which], p = this.pad();
    var up = anyDown(k.up), dn = anyDown(k.down),
        lf = anyDown(k.left), rt = anyDown(k.right);

    if (p) {
      var ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      if (ax < -PAD_DEADZONE) lf = true;
      if (ax > PAD_DEADZONE) rt = true;
      if (ay < -PAD_DEADZONE) up = true;
      if (ay > PAD_DEADZONE) dn = true;
      if (p.buttons[12] && p.buttons[12].pressed) up = true;
      if (p.buttons[13] && p.buttons[13].pressed) dn = true;
      if (p.buttons[14] && p.buttons[14].pressed) lf = true;
      if (p.buttons[15] && p.buttons[15].pressed) rt = true;
    }

    if (lf && rt) { lf = rt = false; }   // SOCD: opposing directions cancel
    if (up && dn) { dn = false; }        // up wins, as on a real stick

    var col = lf ? 0 : (rt ? 2 : 1);
    var row = dn ? 0 : (up ? 2 : 1);

    var btn = {};
    for (var i = 0; i < BUTTONS.length; i++) {
      var b = BUTTONS[i];
      var now = anyDown(k[b]);
      if (p) {
        var pb = p.buttons[PAD_BUTTONS[b]];
        if (pb && (pb.pressed || pb.value > 0.5)) now = true;
      }
      btn[b] = now;
    }
    var start = anyDown(k.start) ||
                !!(p && p.buttons[PAD_BUTTONS.start] && p.buttons[PAD_BUTTONS.start].pressed);
    return { dir: 1 + col + row * 3, btn: btn, start: start };
  };

  /* Fold one frame of input — from hardware or from the CPU — into the port's
     state, history and charge timers. Everything downstream reads only this. */
  Port.prototype.apply = function (dir, btn, start) {
    this.dir = dir;

    var mask = 0;
    for (var i = 0; i < BUTTONS.length; i++) {
      var b = BUTTONS[i], now = !!btn[b];
      this.pressed[b] = now && !this.held[b];
      this.released[b] = !now && this.held[b];
      this.held[b] = now;
      if (now) mask |= (1 << i);
    }

    this.startPressed = !!start && !this._startHeld;
    this._startHeld = !!start;

    /* Charge timers. Holding down-back charges both at once, as it should. */
    if (dir === 1 || dir === 4 || dir === 7) this.chargeBack++; else this.chargeBack = 0;
    if (dir === 1 || dir === 2 || dir === 3) this.chargeDown++; else this.chargeDown = 0;
    if (this.chargeBack > 0) { this._heldBack = this.chargeBack; this._backGrace = 8; }
    else if (this._backGrace > 0) { this._backGrace--; if (!this._backGrace) this._heldBack = 0; }
    if (this.chargeDown > 0) { this._heldDown = this.chargeDown; this._downGrace = 8; }
    else if (this._downGrace > 0) { this._downGrace--; if (!this._downGrace) this._heldDown = 0; }

    this.frame++;
    this.history.push({ dir: dir, mask: mask, frame: this.frame });
    if (this.history.length > 120) this.history.shift();
  };

  /* Sample hardware once per logical frame, then release the latches this
     port consumed so the next frame sees a fresh press. */
  Port.prototype.poll = function () {
    var h = this.readHardware();
    this.apply(h.dir, h.btn, h.start);
    var k = KEYS[this.which], i;
    for (i = 0; i < BUTTONS.length; i++) clearLatch(k[BUTTONS[i]]);
    clearLatch(k.start);
    clearLatch(k.up); clearLatch(k.down); clearLatch(k.left); clearLatch(k.right);
  };

  /* Mirror an absolute direction into "facing right" space. */
  function rel(dir, facing) {
    if (facing >= 0) return dir;
    var m = { 1: 3, 2: 2, 3: 1, 4: 6, 5: 5, 6: 4, 7: 9, 8: 8, 9: 7 };
    return m[dir];
  }

  Port.prototype.relDir = function (facing) { return rel(this.dir, facing); };

  /* Compressed list of the distinct directions pressed inside `window` frames,
     newest last, already mirrored for facing. */
  Port.prototype.recentDirs = function (window, facing) {
    var out = [], h = this.history, cut = this.frame - window;
    for (var i = 0; i < h.length; i++) {
      if (h[i].frame <= cut) continue;
      var d = rel(h[i].dir, facing);
      if (!out.length || out[out.length - 1].d !== d) out.push({ d: d, frame: h[i].frame });
    }
    return out;
  };

  /* Does the recent direction history contain this sequence, in order,
     ending recently enough to count? Extra directions between the required
     ones are tolerated (that leniency is what makes a dragon punch feel fair);
     the whole sequence must complete inside `window` frames. */
  Port.prototype.hasSequence = function (seq, window, facing, tail) {
    var dirs = this.recentDirs(window, facing);
    var si = 0, startFrame = -1;
    for (var i = 0; i < dirs.length; i++) {
      if (dirs[i].d === seq[si]) {
        if (si === 0) startFrame = dirs[i].frame;
        si++;
        if (si === seq.length) {
          // must have finished within `tail` frames of now
          if (this.frame - dirs[i].frame <= (tail || 6)) return true;
          si = 0; startFrame = -1; i = i; // keep scanning for a later match
        }
      }
    }
    return false;
  };

  /* Named motions. Windows are generous on purpose — this is a game two
     people play on a sofa, not a tournament qualifier. */
  var MOTIONS = {
    qcf:  { seq: [2, 3, 6], win: 16 },
    qcb:  { seq: [2, 1, 4], win: 16 },
    dp:   { seq: [6, 2, 3], win: 18 },
    rdp:  { seq: [4, 2, 1], win: 18 },
    hcf:  { seq: [4, 1, 2, 3, 6], win: 26 },
    hcb:  { seq: [6, 3, 2, 1, 4], win: 26 },
    dd:   { seq: [2, 5, 2], win: 18 },
    qcfx2:{ seq: [2, 3, 6, 2, 3, 6], win: 32 },
    p360: { seq: [6, 2, 4, 8], win: 30 },
    downup: { seq: [2, 8], win: 14 }
  };

  Port.prototype.motion = function (name, facing) {
    var m = MOTIONS[name];
    if (!m) return false;
    return this.hasSequence(m.seq, m.win, facing, 8);
  };

  /* Charge specials: hold back (or down) for `frames`, then the opposite. */
  Port.prototype.chargeBF = function (facing, frames) {
    var need = frames || 42;
    var d = rel(this.dir, facing);
    var forwardNow = (d === 6 || d === 3 || d === 9);
    return forwardNow && (this._heldBack || 0) >= need && this.chargeBack === 0;
  };

  Port.prototype.chargeDU = function (facing, frames) {
    var need = frames || 42;
    var d = rel(this.dir, facing);
    var upNow = (d === 7 || d === 8 || d === 9);
    if (!upNow) return false;
    return (this._heldDown || 0) >= need && this.chargeDown === 0;
  };

  /* Double tap in a direction, for dashes. */
  Port.prototype.doubleTap = function (want, facing, window) {
    var dirs = this.recentDirs(window || 14, facing);
    var taps = 0;
    for (var i = dirs.length - 1; i >= 0; i--) {
      if (dirs[i].d === want) taps++;
      else if (dirs[i].d !== 5) return false;   // any other direction breaks it
      if (taps >= 2) return true;
    }
    return false;
  };

  /* Wipe motion history — called after a special fires so one quarter-circle
     cannot pay for two fireballs. */
  Port.prototype.flushMotion = function () {
    this.history.length = 0;
    this._heldBack = 0; this._heldDown = 0;
    this.chargeBack = 0; this.chargeDown = 0;
  };

  Port.prototype.anyPressed = function () {
    for (var i = 0; i < BUTTONS.length; i++) if (this.pressed[BUTTONS[i]]) return true;
    return this.startPressed;
  };

  CF.Input = { Port: Port, BUTTONS: BUTTONS, KEYS: KEYS, PAD_BUTTONS: PAD_BUTTONS };
})();

/* ---- appended: button-mash detection for electricity / flurry specials ---- */
(function () {
  var Port = CF.Input.Port, BUTTONS = CF.Input.BUTTONS;
  Port.prototype.mashCount = function (buttons, window) {
    var h = this.history, cut = this.frame - (window || 22), n = 0, prev = 0;
    var mask = 0;
    for (var i = 0; i < buttons.length; i++) mask |= (1 << BUTTONS.indexOf(buttons[i]));
    for (var k = 0; k < h.length; k++) {
      if (h[k].frame <= cut) { prev = h[k].mask & mask; continue; }
      var now = h[k].mask & mask;
      if (now && !prev) n++;
      prev = now;
    }
    return n;
  };
})();
