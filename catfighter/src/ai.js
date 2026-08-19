/* ==========================================================================
   Cat Fighter II — the CPU

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
    else this.apply(this.holdDir, {}, false);
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
  VirtualPort.prototype.busy = function () { return this.script.length > 0; };

  function mirror(dir, facing) {
    if (facing >= 0) return dir;
    var m = { 1: 3, 2: 2, 3: 1, 4: 6, 5: 5, 6: 4, 7: 9, 8: 8, 9: 7 };
    return m[dir];
  }

  /* ---- difficulty ------------------------------------------------------- */
  var LEVELS = {
    1: { name: 'KITTEN',  think: 26, react: 22, blockOdds: 0.35, aggro: 0.30, aaOdds: 0.20, spOdds: 0.20, punish: 0.15 },
    2: { name: 'EASY',    think: 20, react: 17, blockOdds: 0.52, aggro: 0.42, aaOdds: 0.35, spOdds: 0.34, punish: 0.30 },
    3: { name: 'NORMAL',  think: 15, react: 13, blockOdds: 0.68, aggro: 0.55, aaOdds: 0.52, spOdds: 0.48, punish: 0.48 },
    4: { name: 'HARD',    think: 11, react: 9,  blockOdds: 0.82, aggro: 0.68, aaOdds: 0.70, spOdds: 0.62, punish: 0.66 },
    5: { name: 'BRUTAL',  think: 8,  react: 6,  blockOdds: 0.92, aggro: 0.80, aaOdds: 0.85, spOdds: 0.76, punish: 0.82 }
  };

  function AI(fighter, level) {
    this.f = fighter;
    this.port = fighter.port;
    this.level = LEVELS[level] || LEVELS[3];
    this.levelNum = level || 3;
    this.cool = 0;
    this.rnd = CF.util.rng(0x9e37 + (level || 3) * 7919);
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
    if (f.isLocked() && f.state !== 'blockstun') { p.holdDir = 5; return; }

    var dist = Math.abs(o.x - f.x);
    var face = f.facing;
    var q = function (dir, frames) { p.qDir(mirror(dir, face), frames); };
    var qb = function (dir, btn, frames) { p.qBtn(mirror(dir, face), btn, frames); };

    /* ---- 1. defend ------------------------------------------------------ */
    var threat = this.incomingThreat(game, dist);
    if (threat && this.r() < L.blockOdds) {
      var low = threat === 'low';
      p.holdDir = mirror(low ? 1 : 4, face);
      q(low ? 1 : 4, L.react + 6);
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
      if (this.r() < 0.30) { q(9, 3); q(5, 22); this.cool = 6; return; }   // jump in
      if (this.r() < L.aggro) { q(6, 16); this.cool = 3; return; }
      q(4, 10); this.cool = 3; return;
    }

    /* close range */
    if (dist < 46 && this.r() < 0.22) {
      var grab = this.pick('grab');
      if (grab) { this.doSpecial(grab, q, qb, 2); this.cool = 8; return; }
      qb(6, 'HP', 3); this.cool = 8; return;      // throw attempt
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
      this.cool = L.think;
      return;
    }

    /* nothing doing — hold guard or reposition */
    if (this.r() < 0.5) { p.holdDir = mirror(4, face); q(4, 10); }
    else q(5, 10);
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
    var r = { projectile: [], antiAir: [], rush: [], grab: [], low: [], poke: [] };
    for (var i = 0; i < sp.length; i++) {
      var m = sp[i];
      if (m.noAttack) continue;
      if (m.spawn) r.projectile.push(m);
      if (m.isCommandThrow) r.grab.push(m);
      if (m.hitLevel === 'low') r.low.push(m);
      /* rises off the ground, or is invincible on the way up */
      if ((m.invuln || m.airborne) && m.hitbox && m.hitbox.y >= 24) r.antiAir.push(m);
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
    var btn = m.buttons[Math.min(strength || 0, m.buttons.length - 1)] || m.buttons[0];
    this.inputMotion(m, q, qb, btn);
  };

  AI.prototype.doSuper = function (m, q, qb) {
    var btn = m.buttons[2] || m.buttons[0];
    this.inputMotion(m, q, qb, btn);
  };

  AI.prototype.inputMotion = function (m, q, qb, btn) {
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
