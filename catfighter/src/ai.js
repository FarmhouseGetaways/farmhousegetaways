/* ==========================================================================
   Super Cat Fighter 6 — the CPU

   The computer does not cheat. It drives a virtual pad and its inputs go
   through exactly the same motion detector a human's do, so if it throws a
   fireball it really did press down, down-forward, forward, punch. That
   keeps difficulty honest: harder just means fewer idle frames and faster
   reactions, never extra privileges.
   ========================================================================== */
(function () {
  var Port = CF.Input.Port, BUTTONS = CF.Input.BUTTONS;

  function VirtualPort() {
    Port.call(this, 'p1');
    this.virtual = true;
    this.script = [];               // queued frames: {dir, btn:{}}
    this.holdDir = 5;
    /* Buttons the CPU keeps held once its queued script runs out. Without
       this it can only block in short bursts, because releasing everything
       is exactly what happens when the queue empties. */
    this.holdBtn = {};
    this.slot = -1;                 // no hardware slot: see below
  }
  VirtualPort.prototype = Object.create(Port.prototype);
  VirtualPort.prototype.constructor = VirtualPort;

  /* A virtual port has no controller behind it. Saying so explicitly matters:
     it is constructed borrowing player one's key map, and without this the CPU
     taking a hit would buzz the human's pad as though they had been hit. */
  VirtualPort.prototype.pad = function () { return null; };
  VirtualPort.prototype.padConnected = function () { return false; };
  VirtualPort.prototype.padName = function () { return null; };
  VirtualPort.prototype.rumble = function () {};

  VirtualPort.prototype.poll = function () {
    var f = this.script.shift();
    if (f) this.apply(f.dir, f.btn || {}, false);
    else this.apply(this.holdDir, this.holdBtn, false);
  };

  /* Queue helpers. Directions here are RELATIVE (facing right); the AI
     converts to absolute before queuing. */
  VirtualPort.prototype.qDir = function (dir, frames) {
    for (var i = 0; i < (frames || 1); i++) this.script.push({ dir: dir, btn: {} });
    return this;
  };
  VirtualPort.prototype.qBtn = function (dir, btn, frames) {
    var b = {}; b[btn] = true;
    for (var i = 0; i < (frames || 2); i++) this.script.push({ dir: dir, btn: b });
    return this;
  };
  VirtualPort.prototype.clear = function () { this.script.length = 0; return this; };
  VirtualPort.prototype.release = function () { this.holdBtn = {}; return this; };
  VirtualPort.prototype.busy = function () { return this.script.length > 0; };

  function mirror(dir, facing) {
    if (facing >= 0) return dir;
    var m = { 1: 3, 2: 2, 3: 1, 4: 6, 5: 5, 6: 4, 7: 9, 8: 8, 9: 7 };
    return m[dir];
  }

  /* ---- difficulty ------------------------------------------------------- */
  /* `patience` is how long the CPU will keep somebody pinned in the corner
     before it gives the corner back, and `rest` is how long it stays away.
     Being held against the wall and hit until you die is not difficulty, it
     is the game refusing to let you play — and it is what NORMAL felt like.
     Only BRUTAL never lets go. */
  var LEVELS = {
    1: { name: 'KITTEN',  think: 32, react: 27, blockOdds: 0.20, aggro: 0.20, aaOdds: 0.12, spOdds: 0.12, punish: 0.08, patience: 18,   rest: 46 },
    2: { name: 'EASY',    think: 25, react: 21, blockOdds: 0.36, aggro: 0.32, aaOdds: 0.24, spOdds: 0.24, punish: 0.20, patience: 34,   rest: 36 },
    3: { name: 'NORMAL',  think: 19, react: 16, blockOdds: 0.52, aggro: 0.44, aaOdds: 0.38, spOdds: 0.36, punish: 0.34, patience: 58,   rest: 26 },
    4: { name: 'HARD',    think: 13, react: 11, blockOdds: 0.72, aggro: 0.60, aaOdds: 0.58, spOdds: 0.54, punish: 0.55, patience: 104,  rest: 14 },
    5: { name: 'BRUTAL',  think: 8,  react: 6,  blockOdds: 0.92, aggro: 0.80, aaOdds: 0.85, spOdds: 0.76, punish: 0.82, patience: 9999, rest: 0 }
  };

  /* `seed` is optional and exists for balance testing: the CPU is otherwise
     fully deterministic, which makes a round robin a regression check rather
     than a sample. Vary the seed and the same thirty matches become thirty
     different fights. */
  function AI(fighter, level, seed) {
    this.f = fighter;
    this.port = fighter.port;
    this.level = LEVELS[level] || LEVELS[3];
    this.levelNum = level || 3;
    this.cool = 0;
    this.pressure = 0;      // how long it has been on the attack
    this.backOff = 0;       // frames left of deliberately giving ground
    this.rnd = CF.util.rng((seed === undefined ? 0x9e37 : seed) + (level || 3) * 7919);
    this.chargeFrames = 0;
  }

  AI.prototype.setLevel = function (n) {
    this.levelNum = n;
    this.level = LEVELS[n] || LEVELS[3];
  };

  AI.prototype.r = function () { return this.rnd(); };

  AI.prototype.update = function (game) {
    var f = this.f, o = f.other, p = this.port, L = this.level;
    if (!o) return;

    if (this.cool > 0) { this.cool--; return; }
    if (p.busy()) return;
    if (p.release) p.release();     // let go of anything held from last time
    if (f.isLocked() && f.state !== 'blockstun') { p.holdDir = 5; return; }

    var dist = Math.abs(o.x - f.x);
    var face = f.facing;
    var simple = CF.Input.getScheme() === 'simple';
    /* Translate the arcade buttons the CPU's decision tree talks in into
       whatever the active scheme actually has. */
    function translate(b) {
      if (!simple) return b;
      if (b === 'LP' || b === 'MP' || b === 'HP') return 'P';
      if (b === 'LK' || b === 'MK' || b === 'HK') return 'K';
      return b;
    }
    var q = function (dir, frames) { p.qDir(mirror(dir, face), frames); };
    var qb = function (dir, btn, frames) { p.qBtn(mirror(dir, face), translate(btn), frames); };

    /* ---- 0. give the corner back ---------------------------------------

       Pressure builds while the CPU attacks and bleeds away while it does
       not. Once it has held somebody against the wall for longer than its
       patience, it walks away and lets them out. A fight you cannot get out
       of is not hard, it is broken. */
    var cornered = Math.abs(o.x) > 280;
    if (this.pressure > 0) this.pressure--;
    if (this.backOff > 0) {
      this.backOff--;
      if (dist < 150) { q(4, 10); this.cool = 4; return; }
      q(5, 8); this.cool = 4; return;
    }
    if (cornered && this.pressure > L.patience) {
      this.pressure = 0;
      this.backOff = L.rest + ((this.r() * 22) | 0);
      q(4, 12);
      this.cool = 5;
      return;
    }

    /* ---- 1. defend ------------------------------------------------------ */
    var threat = this.incomingThreat(game, dist);

    /* a cat who can simply leave sometimes should */
    if (threat && dist < 80 && this.roles().escape.length && this.r() < L.blockOdds * 0.4) {
      this.doSpecial(this.pick('escape'), q, qb, 2);
      this.cool = 6;
      return;
    }

    /* In the four-button scheme everyone has a dodge on the trigger, so the
       CPU should sometimes simply not be there. */
    if (simple && threat && dist < 90 && this.r() < L.blockOdds * 0.22) {
      var dd = { DODGE: true };
      for (var di = 0; di < 3; di++) p.script.push({ dir: mirror(5, face), btn: dd });
      this.cool = 8;
      return;
    }

    if (threat && this.r() < L.blockOdds) {
      var low = threat === 'low';
      if (simple) {
        var bo = { BLOCK: true };
        for (var bi = 0; bi < L.react + 6; bi++) {
          p.script.push({ dir: mirror(low ? 2 : 5, face), btn: bo });
        }
        p.holdDir = mirror(low ? 2 : 5, face);
        p.holdBtn = { BLOCK: true };      // keep guarding after the script ends
      } else {
        p.holdDir = mirror(low ? 1 : 4, face);
        q(low ? 1 : 4, L.react + 6);
      }
      this.cool = 2;
      return;
    }

    /* ---- 2. anti-air ---------------------------------------------------- */
    if (!o.grounded && o.vy < 3 && dist < 90 && this.r() < L.aaOdds) {
      var aa = this.pick('antiAir');
      if (aa) { this.doSpecial(aa, q, qb, 2); this.cool = 4; return; }
      qb(2, 'HP', 3); this.cool = 6; return;     // crouching heavy as backup
    }

    /* ---- 3. punish a whiff ---------------------------------------------- */
    if (o.state === 'move' && o.move && o.moveFrame > o.move.startup + o.move.active &&
        dist < 62 && this.r() < L.punish) {
      var pun = this.pick('antiAir', 'grab', 'poke');
      if (pun && this.r() < 0.6) { this.doSpecial(pun, q, qb, this.r() < 0.4 ? 2 : 1); }
      else qb(5, this.r() < 0.5 ? 'HP' : 'HK', 3);
      this.cool = 5; return;
    }

    /* ---- 4. super when the meter is full and they are close -------------- */
    if (f.meter >= 100 && dist < 100 && this.r() < L.spOdds * 0.7) {
      var sup = f.chr.supers[0];
      if (sup) { this.doSuper(sup, q, qb); this.cool = 8; return; }
    }

    /* ---- 5. offence by range -------------------------------------------- */
    if (dist > 150) {
      var proj = this.pick('projectile');
      if (proj && this.r() < L.spOdds) { this.doSpecial(proj, q, qb, (this.r() * 3) | 0); this.cool = 10; return; }
      if (this.r() < L.aggro) { q(6, 22); this.cool = 3; return; }
      q(5, 12); this.cool = 4; return;
    }

    if (dist > 74) {
      if (this.r() < L.aggro * 0.55) {
        var rush = this.pick('rush', 'low');
        if (rush && this.r() < L.spOdds * 0.8) { this.doSpecial(rush, q, qb, 2); this.cool = 10; return; }
      }
      /* a pure zoner keeps throwing from here rather than idling */
      if (!this.roles().rush.length && this.r() < L.spOdds * 0.5) {
        var mid = this.pick('projectile');
        if (mid) { this.doSpecial(mid, q, qb, 0); this.cool = 12; return; }
      }
      if (this.r() < 0.30) {                                              // jump in
        if (simple) { qb(6, 'JUMP', 2); q(6, 22); } else { q(9, 3); q(5, 22); }
        this.cool = 6; return;
      }
      if (this.r() < L.aggro) { q(6, 16); this.cool = 3; return; }
      q(4, 10); this.cool = 3; return;
    }

    /* close range */
    if (dist < 46 && this.r() < 0.22) {
      var grab = this.pick('grab');
      if (grab) { this.doSpecial(grab, q, qb, 2); this.cool = 8; return; }
      qb(6, 'HP', 3); this.pressure += 9; this.cool = 8; return;   // throw attempt
    }
    if (this.r() < L.aggro) {
      var pick = this.r();
      if (pick < 0.3) { qb(2, 'LK', 2); qb(2, 'MK', 2); }
      else if (pick < 0.55) { qb(5, 'LP', 2); qb(5, 'MP', 3); }
      else if (pick < 0.75) { qb(2, 'HK', 3); }
      else {
        var sp = this.pick('low', 'poke', 'rush');
        if (sp) this.doSpecial(sp, q, qb, 1); else qb(5, 'MK', 3);
      }
      this.pressure += 9;
      this.cool = L.think;
      return;
    }

    /* nothing doing — hold guard or reposition */
    if (this.r() < 0.5) {
      if (simple) { p.holdDir = mirror(5, face); p.holdBtn = { BLOCK: true }; q(5, 10); }
      else { p.holdDir = mirror(4, face); q(4, 10); }
    } else q(5, 10);
    this.cool = L.think;
  };

  /* Is something about to hit us? */
  AI.prototype.incomingThreat = function (game, dist) {
    var f = this.f, o = f.other;
    for (var i = 0; i < game.projectiles.length; i++) {
      var pr = game.projectiles[i];
      if (pr.owner === f.side) continue;
      var d = (pr.x - f.x) * f.facing;
      if (d > 0 && d < 130) return 'mid';
    }
    if (o.state === 'move' && o.move && !o.move.noAttack) {
      var reach = (o.move.hitbox ? o.move.hitbox.x + o.move.hitbox.w : 40) + 16;
      if (dist < reach && o.moveFrame <= o.move.startup + o.move.active) {
        return (o.move.hitLevel === 'low') ? 'low' : 'mid';
      }
    }
    if (!o.grounded && dist < 70) return 'mid';
    return null;
  };

  /* The CPU used to look its specials up by name, from a hard-coded list. That
     meant every new cat had to be added here by hand or the computer would
     simply never use her moves. It now works them out from what the moves
     actually DO, so a cat added tomorrow is understood the moment she exists. */
  AI.prototype.roles = function () {
    if (this._roles) return this._roles;
    var sp = this.f.chr.specials;
    var r = { projectile: [], antiAir: [], rush: [], grab: [], low: [], poke: [], escape: [] };
    for (var i = 0; i < sp.length; i++) {
      var m = sp[i];
      /* a move that does not hit but goes invincible is an escape, and it is
         the only thing on the roster worth pressing while being hit */
      if (m.noAttack) {
        if (m.invuln && m.moveSelf) r.escape.push(m);
        continue;
      }
      if (m.spawn) r.projectile.push(m);
      if (m.isCommandThrow) r.grab.push(m);
      if (m.hitLevel === 'low') r.low.push(m);
      /* An anti-air must be invincible AND swing upward. Being merely
         airborne is not enough — a forward-leaping overhead is in the air
         too, and using it to answer a jump-in loses every time. */
      if (m.invuln && m.hitbox && m.hitbox.y >= 28) r.antiAir.push(m);
      /* carries itself forward */
      if (m.moveSelf && !m.spawn) r.rush.push(m);
      /* anything with a hitbox is at least a poke */
      if (m.hitbox) r.poke.push(m);
    }
    this._roles = r;
    return r;
  };

  /* One special that fills the given role, or null. */
  AI.prototype.pick = function () {
    var roles = this.roles();
    for (var a = 0; a < arguments.length; a++) {
      var list = roles[arguments[a]];
      if (list && list.length) return list[(this.r() * list.length) | 0];
    }
    return null;
  };

  /* Actually input the motion, frame by frame, like a person would. */
  AI.prototype.doSpecial = function (m, q, qb, strength) {
    var btn = (m.buttons && m.buttons[Math.min(strength || 0, m.buttons.length - 1)]) ||
              (m.buttons && m.buttons[0]) || 'HP';
    this.inputMotion(m, q, qb, btn);
  };

  AI.prototype.doSuper = function (m, q, qb) {
    var btn = (m.buttons && (m.buttons[2] || m.buttons[0])) || 'HP';
    this.inputMotion(m, q, qb, btn);
  };

  /* In the four-button scheme there are no motions to input: a special is a
     pair of buttons. The CPU presses the same pair a player would. */
  AI.prototype.inputPair = function (m) {
    var f = this.f, p = this.port;
    var pair = null;
    if (m.kind === 'super') pair = ['DODGE', 'LUNGE'];
    else if (m.kind === 'throw') pair = ['K', 'BLOCK'];
    else {
      var idx = f.chr.specials.indexOf(m);
      if (idx === 0) pair = ['P', 'K'];
      else if (idx === 1) pair = ['P', 'BLOCK'];
    }
    if (!pair) return false;
    var o = {}; o[pair[0]] = true; o[pair[1]] = true;
    var dir = mirror(this.r() < 0.5 ? 6 : 5, f.facing);
    for (var i = 0; i < 3; i++) p.script.push({ dir: dir, btn: o });
    p.script.push({ dir: dir, btn: {} });
    return true;
  };

  AI.prototype.inputMotion = function (m, q, qb, btn) {
    if (CF.Input.getScheme() === 'simple' && this.inputPair(m)) return;
    if (m.charge) {
      var need = (m.chargeFrames || 40) + 6;
      if (m.charge === 'bf') { q(4, need); qb(6, btn, 3); }
      else { q(2, need); qb(8, btn, 3); }
      return;
    }
    switch (m.motion) {
      case 'qcf':  q(2, 3); q(3, 3); qb(6, btn, 3); break;
      case 'qcb':  q(2, 3); q(1, 3); qb(4, btn, 3); break;
      case 'dp':   q(6, 3); q(2, 3); qb(3, btn, 3); break;
      case 'rdp':  q(4, 3); q(2, 3); qb(1, btn, 3); break;
      case 'hcf':  q(4, 3); q(1, 2); q(2, 2); q(3, 2); qb(6, btn, 3); break;
      case 'hcb':  q(6, 3); q(3, 2); q(2, 2); q(1, 2); qb(4, btn, 3); break;
      case 'qcfx2': q(2, 2); q(3, 2); q(6, 2); q(2, 2); q(3, 2); qb(6, btn, 3); break;
      case 'p360': q(6, 2); q(2, 2); q(4, 2); qb(8, btn, 3); break;
      case 'pp':   this.port.script.push({ dir: mirror(5, this.f.facing), btn: { LP: true, MP: true } });
                   this.port.script.push({ dir: mirror(5, this.f.facing), btn: { LP: true, MP: true } });
                   break;
      case 'mash': for (var i = 0; i < 8; i++) { qb(5, btn, 1); q(5, 1); } break;
      case 'chargeSuper':
        var n = (m.chargeFrames || 55) + 6;
        if (m.charge === 'bf') { q(4, n); qb(6, btn, 3); } else { q(2, n); qb(8, btn, 3); }
        break;
      default: qb(5, btn, 3);
    }
  };

  CF.AI = AI;
  CF.VirtualPort = VirtualPort;
  CF.AI_LEVELS = LEVELS;
})();
