/* ==========================================================================
   Super Cat Fighter 6 — the fighter

   One state machine per cat. States that matter:

     idle walkF walkB crouch jump      free — will accept input
     move                              running a move's frame data
     blockstun hitstun                 locked, counting down
     knockdown wakeup dizzy thrown     locked, with their own timers
     ko win intro frozen               round bookends

   Frame data drives everything. A move is startup -> active -> recovery and
   the fighter is only actionable again when recovery ends, exactly as in the
   arcade original.
   ========================================================================== */
(function () {
  var U = CF.util, A = CF.Anim, Ps = CF.Pose;

  var GROUND = 0;
  var BUFFER = 5;              // input buffer, frames
  var THROW_RANGE = 46;
  var PUSHBOX_W = 30;

  /* ---- weight classes -----------------------------------------------------

     The trade every fighting game is built on: a heavy cat is hard to shift
     and hard to hurt but slow to get anywhere, and a light one is all over
     you until she gets caught, at which point she folds.

     These multiply what a fighter RECEIVES. What she deals is her own
     business — that lives in `mod.damage` on the character.               */
  var CLASSES = {
    light:  { damageTaken: 1.15, stunTaken: 1.14, pushed: 1.22, label: 'LIGHT' },
    medium: { damageTaken: 1.00, stunTaken: 1.00, pushed: 1.00, label: 'MEDIUM' },
    heavy:  { damageTaken: 0.86, stunTaken: 0.86, pushed: 0.80, label: 'HEAVY' }
  };

  function Fighter(chr, side, port, fxArray) {
    this.chr = chr;
    this.side = side;                       // 0 = left start, 1 = right start
    this.port = port;
    this.fx = fxArray || [];
    this.stats = chr.stats;
    this.cls = CLASSES[chr.weightClass] || CLASSES.medium;

    this.maxHealth = chr.stats.health;
    this.health = this.maxHealth;
    this.meter = 0;
    this.maxMeter = 100;
    this.stunMax = chr.stats.stunMax;
    this.stun = 0;
    this.stunDecay = 0;

    this.x = 0; this.y = GROUND;
    this.vx = 0; this.vy = 0;
    this.facing = side === 0 ? 1 : -1;
    this.grounded = true;

    this.state = 'intro';
    this.stateFrame = 0;
    this.move = null;
    this.moveFrame = 0;
    this.strength = 0;
    this.moveHits = 0;
    this.lastHitFrame = -99;
    this.moveConnected = false;
    this.canceled = false;

    this.hitstop = 0;
    this.hitstunTimer = 0;
    this.blockstunTimer = 0;
    this.knockdownTimer = 0;
    this.dizzyTimer = 0;

    this.comboCount = 0;
    this.comboDamage = 0;
    this.wasHitThisFrame = false;
    this.flash = 0;
    this.blockFlash = 0;

    this.jumpDir = 0;
    this.jumpAttackUsed = false;
    this.airDashUsed = false;
    this.teleportTo = null;
    this.airborneDash = false;
    this.armorUsed = false;
    this.blockHeld = false;
    this.pendingPairFrom = null;

    this.throwVictim = null;
    this.throwTimer = 0;
    this.thrownBy = null;

    this.roundWins = 0;
    this.walkTimer = 0;
    this.idleTimer = Math.random() * 60 | 0;
    this.inputBuf = [];   // {btn, frame}
    this.frame = 0;
  }

  /* ---- small helpers ----------------------------------------------------- */

  Fighter.prototype.opp = function () { return this.other; };

  Fighter.prototype.isFree = function () {
    return this.state === 'idle' || this.state === 'walkF' || this.state === 'walkB' ||
           this.state === 'crouch' || this.state === 'jump';
  };

  Fighter.prototype.isLocked = function () {
    return this.state === 'hitstun' || this.state === 'blockstun' ||
           this.state === 'knockdown' || this.state === 'wakeup' ||
           this.state === 'dizzy' || this.state === 'thrown' ||
           this.state === 'ko' || this.state === 'win' || this.state === 'intro';
  };

  Fighter.prototype.isAirborne = function () {
    if (!this.grounded) return true;
    if (this.airborneDash) return true;
    var m = this.move;
    if (m && m.airborne && this.moveFrame >= m.airborne[0] && this.moveFrame <= m.airborne[1]) return true;
    return false;
  };

  Fighter.prototype.hasInvuln = function () {
    var m = this.move;
    if (!m) return false;
    if (m.invuln && this.moveFrame >= m.invuln[0] && this.moveFrame <= m.invuln[1]) return true;
    return false;
  };

  Fighter.prototype.lowProfiling = function () {
    var m = this.move;
    return !!(m && m.lowProfile && this.moveFrame >= m.lowProfile[0] && this.moveFrame <= m.lowProfile[1]);
  };

  Fighter.prototype.highInvuln = function () {
    var m = this.move;
    return !!(m && m.invulnHigh && this.moveFrame >= m.invulnHigh[0] && this.moveFrame <= m.invulnHigh[1]);
  };

  Fighter.prototype.hasArmor = function () {
    var m = this.move;
    return !!(m && m.armor && !this.armorUsed &&
              this.moveFrame >= m.armor[0] && this.moveFrame <= m.armor[1]);
  };

  Fighter.prototype.moveTotal = function (m) {
    return (m.startup || 0) + (m.active || 0) + (m.recovery || 0);
  };

  Fighter.prototype.inActive = function () {
    var m = this.move;
    if (!m || m.noAttack) return false;
    return this.moveFrame >= m.startup && this.moveFrame < m.startup + m.active;
  };

  /* ---- the four-button scheme --------------------------------------------

     Two attack buttons and a direction give eight ground normals. UP is
     available as a modifier precisely because Jump moved onto a button of
     its own, and that is what buys the anti-air and the up kick.

     Specials come from pairs: punch+kick, punch+block, kick+block. The pair
     is checked BEFORE the single button, and can also override a normal that
     is still in its first few frames — so a normal fires with no input delay
     at all, and a slightly late second button still gets the special.     */

  var SIMPLE_NORMALS = {
    stand:  { P: { n: 'stLP', f: 'stHP', d: 'crMP', u: 'crHP' },
              K: { n: 'stLK', f: 'stHK', d: 'crHK', u: 'stMK' } },
    crouch: { P: { n: 'crMP', f: 'crHP', d: 'crMP', u: 'crHP' },
              K: { n: 'crMK', f: 'crHK', d: 'crHK', u: 'stMK' } },
    air:    { P: { n: 'airMP', f: 'airHP', d: 'airHP', u: 'airLP' },
              K: { n: 'airMK', f: 'airHK', d: 'airHK', u: 'airLK' } }
  };

  /* Which special a pair of buttons calls up. */
  var SIMPLE_PAIRS = [
    { a: 'P', b: 'K', what: 'special0' },
    { a: 'P', b: 'BLOCK', what: 'special1' },
    { a: 'K', b: 'BLOCK', what: 'throw' },
    { a: 'DODGE', b: 'LUNGE', what: 'super' }
  ];

  function isSimple() { return CF.Input.getScheme() === 'simple'; }

  /* ---- starting a move --------------------------------------------------- */

  Fighter.prototype.startMove = function (move, strength) {
    this.move = move;
    this.moveFrame = 0;
    this.strength = strength || 0;
    this.moveHits = 0;
    this.lastHitFrame = -99;
    this.moveConnected = false;
    this.canceled = false;
    this.armorUsed = false;
    this.state = 'move';
    this.stateFrame = 0;
    if (move.cost) this.meter = Math.max(0, this.meter - move.cost);
    if (move.freeze) this.superFreeze = move.freeze;
    if (move.kind === 'special' || move.kind === 'super') this.port.flushMotion();
    if (move.onStart) move.onStart(this, strength);
  };

  Fighter.prototype.setState = function (s) {
    this.state = s;
    this.stateFrame = 0;
    if (s !== 'move') { this.move = null; this.moveFrame = 0; }
  };

  /* ---- reading the pad --------------------------------------------------- */

  Fighter.prototype.pressedRecently = function (btn) {
    for (var i = 0; i < this.inputBuf.length; i++) {
      if (this.inputBuf[i].btn === btn && this.frame - this.inputBuf[i].frame <= BUFFER) return true;
    }
    return false;
  };

  Fighter.prototype.consumeBuffer = function () { this.inputBuf.length = 0; };

  Fighter.prototype.strengthOf = function (btn) {
    return (btn === 'LP' || btn === 'LK') ? 0 : ((btn === 'MP' || btn === 'MK') ? 1 : 2);
  };

  /* Which of a special's buttons was just pressed, or null. */
  Fighter.prototype.buttonFor = function (move) {
    var b = move.buttons || [];
    for (var i = 0; i < b.length; i++) if (this.pressedRecently(b[i])) return b[i];
    return null;
  };

  /* Does the motion for this special read as complete right now? */
  Fighter.prototype.motionOk = function (move) {
    var p = this.port;
    if (move.charge) {
      var frames = move.chargeFrames || 40;
      return move.charge === 'bf' ? p.chargeBF(this.facing, frames)
                                  : p.chargeDU(this.facing, frames);
    }
    if (move.motion === 'mash') return p.mashCount(move.buttons, 24) >= 4;
    if (move.motion === 'pp') return p.held.LP && p.held.MP;   // both-punch lariat
    if (move.motion === 'chargeSuper') {
      var fr = move.chargeFrames || 55;
      return move.charge === 'bf' ? p.chargeBF(this.facing, fr) : p.chargeDU(this.facing, fr);
    }
    return p.motion(move.motion, this.facing);
  };

  Fighter.prototype.stanceOk = function (move, stance) {
    if (!move.stance) return true;
    if (typeof move.stance === 'string') return move.stance === stance;
    return move.stance.indexOf(stance) >= 0;
  };

  /* Some motions contain others. A dragon punch — forward, down,
     down-forward — very often ends on forward as well, which also spells a
     fireball; a full circle contains both. Taking the first match in list
     order would hand you a fireball every time you asked for an uppercut,
     which is the single most irritating bug a game like this can have.

     So every motion carries a specificity, and the most specific one that
     matched wins. Higher number = harder to input by accident. */
  var MOTION_PRIORITY = {
    p360: 60, hcf: 50, hcb: 50, rdp: 45, dp: 40,
    qcfx2: 35, qcb: 30, qcf: 30, dd: 25, downup: 25,
    pp: 15, mash: 10
  };

  Fighter.prototype.motionPriority = function (m) {
    if (m.charge) return 55;              // a held charge is never accidental
    return MOTION_PRIORITY[m.motion] || 20;
  };

  /* Four-button scheme: a pair of buttons picks the move directly, with no
     motion to input. Holding forward asks for the heavy version. */
  Fighter.prototype.trySimpleSpecial = function (stance, allowSuper) {
    var p = this.port, d = p.relDir(this.facing);
    var strength = (d === 6 || d === 3 || d === 9) ? 2 : 1;

    for (var i = 0; i < SIMPLE_PAIRS.length; i++) {
      var pr = SIMPLE_PAIRS[i];
      if (!p.pairPressed(pr.a, pr.b, 4)) continue;

      var move = null;
      if (pr.what === 'super') {
        if (allowSuper === false) continue;
        var sup = this.chr.supers[0];
        if (!sup || this.meter < (sup.cost || 100)) continue;
        move = sup;
      } else if (pr.what === 'throw') {
        move = (d === 4 || d === 1 || d === 7) ? this.chr.moves.thrBack : this.chr.moves.thrForward;
        strength = 0;
      } else {
        var idx = pr.what === 'special0' ? 0 : 1;
        move = this.chr.specials[idx];
        if (move && !this.stanceOk(move, stance)) move = null;
      }
      if (!move) continue;

      p.consumePair(pr.a, pr.b);
      this.startMove(move, strength);
      this.consumeBuffer();
      return true;
    }
    return false;
  };

  /* Try to begin a super, then a special. Returns true if one started. */
  Fighter.prototype.trySpecial = function (stance, allowSuper) {
    if (isSimple()) return this.trySimpleSpecial(stance, allowSuper);
    var i, m, btn, best = null, bestPri = -1;

    if (allowSuper !== false) {
      for (i = 0; i < this.chr.supers.length; i++) {
        m = this.chr.supers[i];
        if (this.meter < (m.cost || 100)) continue;
        btn = this.buttonFor(m);
        if (!btn) continue;
        if (!this.motionOk(m)) continue;
        /* A super always beats a special — it cost a full meter to ask for. */
        this.startMove(m, this.strengthOf(btn));
        this.consumeBuffer();
        return true;
      }
    }

    for (i = 0; i < this.chr.specials.length; i++) {
      m = this.chr.specials[i];
      if (!this.stanceOk(m, stance)) continue;
      btn = this.buttonFor(m);
      if (!btn) continue;
      if (!this.motionOk(m)) continue;
      var pri = this.motionPriority(m);
      if (pri > bestPri) { bestPri = pri; best = { move: m, btn: btn }; }
    }

    if (best) {
      this.startMove(best.move, this.strengthOf(best.btn));
      this.consumeBuffer();
      return true;
    }
    return false;
  };

  Fighter.prototype.trySimpleNormal = function (stance) {
    var p = this.port, mv = this.chr.moves, d = p.relDir(this.facing);
    var table = SIMPLE_NORMALS[stance] || SIMPLE_NORMALS.stand;
    var slot = (d === 6 || d === 3 || d === 9) ? 'f'
             : ((d === 8 || d === 7 || d === 9) ? 'u'
             : ((d === 2 || d === 1 || d === 3) ? 'd' : 'n'));

    var order = ['P', 'K'];
    for (var i = 0; i < order.length; i++) {
      var b = order[i];
      if (!this.pressedRecently(b)) continue;
      var key = table[b][slot] || table[b].n;
      if (!mv[key]) continue;
      this.startMove(mv[key], 1);
      this.pendingPairFrom = b;          // a late partner can still upgrade it
      this.consumeBuffer();
      return true;
    }
    return false;
  };

  /* Normals, throws and system moves from a free state. */
  Fighter.prototype.tryNormal = function (stance) {
    if (isSimple()) return this.trySimpleNormal(stance);
    var p = this.port, mv = this.chr.moves, d = p.relDir(this.facing);
    var o = this.other;
    var dist = o ? Math.abs(o.x - this.x) : 999;

    /* Throws: LP+LK together, or toward + heavy while very close. */
    var throwTech = p.held.LP && p.held.LK && (this.pressedRecently('LP') || this.pressedRecently('LK'));
    var closeHeavy = dist < THROW_RANGE && (d === 6 || d === 4) &&
                     (this.pressedRecently('HP') || this.pressedRecently('HK'));
    if (stance === 'stand' && (throwTech || closeHeavy) && o && o.grounded && !o.isLocked()) {
      var back = (d === 4);
      this.startMove(back ? mv.thrBack : mv.thrForward, 0);
      this.consumeBuffer();
      return true;
    }

    var order = ['HP', 'HK', 'MP', 'MK', 'LP', 'LK'];
    for (var i = 0; i < order.length; i++) {
      var b = order[i];
      if (!this.pressedRecently(b)) continue;
      var key = (stance === 'crouch' ? 'cr' : stance === 'air' ? 'air' : 'st') + b;
      if (mv[key]) { this.startMove(mv[key], this.strengthOf(b)); this.consumeBuffer(); return true; }
    }
    return false;
  };

  /* ---- the frame --------------------------------------------------------- */

  Fighter.prototype.update = function (game) {
    this.frame++;
    this.wasHitThisFrame = false;

    /* buffer button presses */
    for (var i = 0; i < CF.Input.BUTTONS.length; i++) {
      var b = CF.Input.BUTTONS[i];
      if (this.port.pressed[b]) this.inputBuf.push({ btn: b, frame: this.frame });
    }
    while (this.inputBuf.length && this.frame - this.inputBuf[0].frame > BUFFER) this.inputBuf.shift();

    if (this.flash > 0) this.flash--;
    if (this.blockFlash > 0) this.blockFlash--;

    /* hitstop freezes animation and physics for both parties — it is what
       gives a heavy punch its weight. */
    if (this.hitstop > 0) { this.hitstop--; return; }
    if (this.superFreeze > 0) { this.superFreeze--; this.stateFrame++; return; }

    /* stun bleeds off when you are not being hit */
    if (this.stun > 0 && this.state !== 'hitstun' && this.state !== 'dizzy') {
      this.stunDecay++;
      if (this.stunDecay > 70) { this.stun = Math.max(0, this.stun - 0.22); }
    } else this.stunDecay = 0;

    /* meter never drains */
    this.meter = U.clamp(this.meter, 0, this.maxMeter);

    this.stateFrame++;
    this.advanceLag();
    switch (this.state) {
      case 'intro':     this.updateIntro(); break;
      case 'move':      this.updateMove(game); break;
      case 'hitstun':   this.updateHitstun(); break;
      case 'blockstun': this.updateBlockstun(); break;
      case 'knockdown': this.updateKnockdown(); break;
      case 'wakeup':    this.updateWakeup(); break;
      case 'dizzy':     this.updateDizzy(); break;
      case 'thrown':    this.updateThrown(); break;
      case 'ko':        this.updateKO(); break;
      case 'win':       break;
      default:          this.updateFree(game); break;
    }

    this.physics();
  };

  Fighter.prototype.updateIntro = function () {
    this.vx = 0;
    if (this.stateFrame > 1) this.setState('idle');
  };

  Fighter.prototype.updateKO = function () {
    this.vx *= 0.9;
  };

  /* ---- free states ------------------------------------------------------- */

  Fighter.prototype.updateFree = function (game) {
    var p = this.port, d = p.relDir(this.facing), o = this.other;

    /* face the opponent — only while grounded, as in the original */
    if (this.grounded && o) {
      var want = (o.x > this.x) ? 1 : (o.x < this.x ? -1 : this.facing);
      if (want !== this.facing) { this.facing = want; d = p.relDir(this.facing); }
    }

    if (!this.grounded) {
      /* --- airborne --- */
      this.state = 'jump';
      if (!this.jumpAttackUsed) {
        if (this.trySpecial('air', true)) { this.jumpAttackUsed = true; return; }
        if (this.tryNormal('air')) { this.jumpAttackUsed = true; return; }
      }
      if (this.stats.airDash && !this.airDashUsed && this.vy < 2 &&
          (p.doubleTap(6, this.facing, 12) || p.doubleTap(4, this.facing, 12))) {
        var fwd = p.doubleTap(6, this.facing, 12);
        this.vx = this.facing * (fwd ? 5.4 : -5.0);
        this.airDashUsed = true;
        this.fx.push({ kind: 'dust', x: this.x, y: this.y + 30, t: 0, n: 5 });
      }
      return;
    }

    /* --- grounded --- */
    var crouching = (d === 1 || d === 2 || d === 3);
    var stance = crouching ? 'crouch' : 'stand';

    if (this.trySpecial(stance, true)) return;

    if (isSimple()) {
      /* the two trigger moves, before normals so a tap of either always wins */
      if (this.pressedRecently('DODGE') && !this.port.pairPressed('DODGE', 'LUNGE', 4)) {
        this.startMove(this.chr.moves.dodge, 0); this.consumeBuffer(); return;
      }
      if (this.pressedRecently('LUNGE') && !this.port.pairPressed('DODGE', 'LUNGE', 4)) {
        this.startMove(this.chr.moves.lunge, 0); this.consumeBuffer(); return;
      }
    }

    if (this.tryNormal(stance)) return;

    if (isSimple()) {
      /* Jump is a button, so it can be pressed while holding any direction —
         which is also why UP is free to modify the attack buttons. */
      if (this.pressedRecently('JUMP')) {
        this.grounded = false;
        this.jumpAttackUsed = false;
        this.airDashUsed = false;
        this.vy = this.stats.jumpVy;
        this.jumpDir = (d === 6 || d === 3 || d === 9) ? 1 : ((d === 4 || d === 1 || d === 7) ? -1 : 0);
        this.vx = this.jumpDir * this.facing * this.stats.jumpVx;
        this.state = 'jump';
        this.consumeBuffer();
        this.fx.push({ kind: 'dust', x: this.x, y: 2, t: 0, n: 6 });
        return;
      }
      /* Block is held, not implied by walking backwards. */
      if (this.port.held.BLOCK) {
        this.state = crouching ? 'crouch' : 'idle';
        this.blockHeld = true;
        this.vx = 0;
        return;
      }
      this.blockHeld = false;
    }

    /* dashes */
    if (this.stats.hasDash && !crouching) {
      if (p.doubleTap(6, this.facing, 13)) { this.startMove(this.chr.moves.dashF, 0); p.flushMotion(); return; }
      if (p.doubleTap(4, this.facing, 13)) { this.startMove(this.chr.moves.dashB, 0); p.flushMotion(); return; }
    }

    /* jump — classic only; the simple scheme has a button for it */
    if (!isSimple() && (d === 7 || d === 8 || d === 9)) {
      this.grounded = false;
      this.jumpAttackUsed = false;
      this.airDashUsed = false;
      this.vy = this.stats.jumpVy;
      this.jumpDir = (d === 9) ? 1 : (d === 7 ? -1 : 0);
      this.vx = this.jumpDir * this.facing * this.stats.jumpVx;
      this.state = 'jump';
      this.fx.push({ kind: 'dust', x: this.x, y: 2, t: 0, n: 6 });
      return;
    }

    if (crouching) {
      this.state = 'crouch';
      this.vx = 0;
      return;
    }

    /* walking, and the block stance if there is something to block */
    if (d === 6) {
      this.state = 'walkF';
      this.vx = this.facing * this.stats.walkF;
      this.walkTimer++;
    } else if (d === 4) {
      this.state = 'walkB';
      this.vx = -this.facing * this.stats.walkB;
      this.walkTimer++;
    } else {
      this.state = 'idle';
      this.vx = 0;
      this.idleTimer++;
    }
  };

  /* ---- executing a move -------------------------------------------------- */

  Fighter.prototype.updateMove = function (game) {
    var m = this.move;
    if (!m) { this.setState('idle'); return; }

    if (m.moveSelf) m.moveSelf(this, this.moveFrame, this.strength);

    if (this.teleportTo !== null) {
      this.x = this.teleportTo;
      this.teleportTo = null;
      this.fx.push({ kind: 'poof', x: this.x, y: 40, t: 0 });
    }

    /* fire a projectile on the first active frame */
    if (m.spawn && !m.spawnMany && this.moveFrame === m.startup) {
      game.projectiles.push(m.spawn(this, this.strength));
      CF.Audio.play('fireball');
    }
    if (m.spawnMany) {
      for (var i = 0; i < m.spawnMany.length; i++) {
        if (this.moveFrame === m.spawnMany[i].at) {
          game.projectiles.push(m.spawn(this, this.strength, m.spawnMany[i].dy));
          CF.Audio.play('fireball');
        }
      }
    }

    /* throws resolve on their own active window */
    if (m.kind === 'throw' || m.isCommandThrow) this.resolveThrow(game);

    /* ground friction while attacking */
    if (this.grounded && !m.moveSelf) this.vx = U.approach(this.vx, 0, 0.5);

    /* A pair that lands a frame or two after the first button still gets the
       special: the normal is swapped out while it is still in startup, so
       nothing has come out yet and the player pays nothing for being late. */
    if (isSimple() && this.pendingPairFrom && this.moveFrame <= 3 && m.kind === 'normal') {
      var before = this.move;
      var st = m.stance === 'crouch' ? 'crouch' : (m.stance === 'air' ? 'air' : 'stand');
      if (this.trySimpleSpecial(st, true) && this.move !== before) {
        this.pendingPairFrom = null;
        return;
      }
    }
    if (this.moveFrame > 3) this.pendingPairFrom = null;

    /* cancels: a connected light or medium can be taken into a special */
    if (this.moveConnected && m.cancel && m.cancel.length && !this.canceled) {
      if (m.cancel.indexOf('super') >= 0 || m.cancel.indexOf('special') >= 0) {
        var allowSuper = m.cancel.indexOf('super') >= 0;
        var stance = m.stance === 'crouch' ? 'crouch' : 'stand';
        var before = this.move;
        if (this.trySpecial(stance, allowSuper) && this.move !== before) {
          this.canceled = true;
          return;
        }
      }
    }

    this.moveFrame++;
    var total = this.moveTotal(m);
    if (this.moveFrame >= total) {
      if (!this.grounded) { this.state = 'jump'; this.move = null; }
      else this.setState('idle');
    }
  };

  Fighter.prototype.resolveThrow = function (game) {
    var m = this.move, o = this.other;
    if (this.moveFrame !== m.startup) return;
    if (!o) return;
    var dist = Math.abs(o.x - this.x);
    var range = m.range || THROW_RANGE;
    var ok = dist <= range && o.grounded && !o.isAirborne() &&
             o.state !== 'knockdown' && o.state !== 'thrown' && o.state !== 'ko' &&
             !o.hasInvuln();
    if (!ok) {
      /* whiffed — cut straight to the longer whiff recovery */
      this.move = U.deepMerge(m, { active: 1, recovery: m.whiffRecovery || m.recovery });
      this.moveFrame = m.startup;
      CF.Audio.play('whiff');
      return;
    }
    var dmg = Array.isArray(m.damage) ? m.damage[this.strength] : m.damage;
    var stun = Array.isArray(m.stun) ? m.stun[this.strength] : m.stun;
    o.getThrown(this, dmg, stun, m.throwDir || 1);
    this.meter = Math.min(this.maxMeter, this.meter + (m.meterGain || 12));
    this.moveConnected = true;
    game.hitstop(12);
    game.shake(7);
    CF.Audio.play('throw');
    this.fx.push({ kind: 'impact', x: (this.x + o.x) / 2, y: 46, t: 0, big: true });
  };

  /* ---- reaction states --------------------------------------------------- */

  Fighter.prototype.updateHitstun = function () {
    this.hitstunTimer--;
    if (this.grounded) this.vx = U.approach(this.vx, 0, 0.36);
    if (this.hitstunTimer <= 0) {
      if (!this.grounded) { this.setState('jump'); }
      else { this.comboCount = 0; this.setState('idle'); }
    }
  };

  Fighter.prototype.updateBlockstun = function () {
    this.blockstunTimer--;
    if (this.grounded) this.vx = U.approach(this.vx, 0, 0.42);
    if (this.blockstunTimer <= 0) this.setState('idle');
  };

  Fighter.prototype.updateKnockdown = function () {
    this.knockdownTimer--;
    if (this.grounded) this.vx = U.approach(this.vx, 0, 0.5);
    if (this.knockdownTimer <= 0 && this.grounded) {
      this.comboCount = 0;
      this.setState('wakeup');
    }
  };

  Fighter.prototype.updateWakeup = function () {
    this.vx = 0;
    if (this.stateFrame >= 16) this.setState('idle');
  };

  Fighter.prototype.updateDizzy = function () {
    this.dizzyTimer--;
    this.vx = U.approach(this.vx, 0, 0.4);
    /* mashing shakes it off faster, as it should */
    if (this.port.anyPressed()) this.dizzyTimer -= 3;
    if (this.dizzyTimer <= 0) {
      this.stun = 0;
      this.comboCount = 0;
      this.setState('idle');
    }
  };

  Fighter.prototype.updateThrown = function () {
    this.throwTimer--;
    if (this.throwTimer <= 0 && this.grounded) {
      this.knockdownTimer = 26;
      this.setState('knockdown');
    }
  };

  /* ---- taking damage ----------------------------------------------------- */

  /* Damage scaling: the fifth hit of a combo is worth a lot less than the
     first, which is what stops a long juggle from being a round. */
  Fighter.prototype.scaleDamage = function (dmg) {
    var table = [1, 1, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3];
    var s = table[Math.min(this.comboCount, table.length - 1)];
    return Math.max(2, Math.round(dmg * s));
  };

  Fighter.prototype.canBlock = function (hitLevel, fromX) {
    if (!this.grounded) return false;                 // no air blocking, as per SF2
    if (this.state === 'move' || this.state === 'hitstun' ||
        this.state === 'knockdown' || this.state === 'thrown' ||
        this.state === 'dizzy' || this.state === 'wakeup') return false;
    var d = this.port.relDir(this.facing);
    var crouching = (d === 1 || d === 2 || d === 3);
    if (isSimple()) {
      /* a real block button: you can guard while walking in */
      if (!this.port.held.BLOCK) return false;
    } else {
      var holdingBack = (d === 4 || d === 1 || d === 7);
      if (!holdingBack) return false;
    }
    if (hitLevel === 'low') return crouching;
    if (hitLevel === 'overhead') return !crouching;
    return true;                                       // mid: either guard works
  };

  Fighter.prototype.takeHit = function (attacker, hit) {
    if (this.state === 'ko') return 'none';
    var blocked = this.canBlock(hit.hitLevel || 'mid', attacker ? attacker.x : this.x);

    if (blocked) {
      var chip = hit.chip || 0;
      if (chip > 0) this.health = Math.max(1, this.health - chip);   // chip never kills
      this.blockstunTimer = hit.blockstun || 10;
      this.setState('blockstun');
      this.blockstunTimer = hit.blockstun || 10;
      this.vx = -this.facing * (hit.blockPushback || 2.5) * this.cls.pushed;
      this.blockFlash = 6;
      this.meter = Math.min(this.maxMeter, this.meter + 3);
      this.fx.push({ kind: 'guard', x: this.x + this.facing * 20, y: hit.fxY || 46, t: 0 });
      CF.Audio.play('block');
      return 'block';
    }

    /* counter-hit: caught during another move's startup */
    var counter = (this.state === 'move' && this.move && this.moveFrame < this.move.startup);

    /* a heavy cat shrugs off what folds a light one */
    var dmg = this.scaleDamage(hit.damage * (counter ? 1.15 : 1) * this.cls.damageTaken);
    this.health = Math.max(0, this.health - dmg);
    this.comboCount++;
    this.comboDamage += dmg;
    this.stun += (hit.stun || 5) * (counter ? 1.3 : 1) * this.cls.stunTaken;
    this.stunDecay = 0;
    this.flash = 5;
    this.wasHitThisFrame = true;
    this.meter = Math.min(this.maxMeter, this.meter + 4);

    this.lastHitLevel = hit.hitLevel || 'mid';
    this.lastHitHeavy = (hit.damage >= 30);
    this.hitPoseAlt = Math.random() < 0.5;
    this.stunFrames = Math.max(6, hit.hitstun || 12);

    var push = (hit.pushback || 2) * this.cls.pushed;
    var kd = hit.knockdown;
    if (this.health <= 0) {
      this.setState('ko');
      this.vx = -this.facing * 4.2;
      this.vy = 6.0;
      this.grounded = false;
      CF.Audio.play('ko');
      return 'ko';
    }

    if (kd === 'hard' || kd === 'launch') {
      this.knockdownTimer = 40;
      this.setState('knockdown');
      this.vx = -this.facing * push * 1.4;
      this.vy = kd === 'launch' ? 7.0 : 5.0;
      this.grounded = false;
    } else if (kd === 'soft' && !this.grounded) {
      this.knockdownTimer = 34;
      this.setState('knockdown');
      this.vx = -this.facing * push * 1.2;
      this.vy = 4.0;
    } else if (!this.grounded) {
      this.knockdownTimer = 32;
      this.setState('knockdown');
      this.vx = -this.facing * push;
      this.vy = 3.4;
    } else if (kd === 'soft') {
      this.knockdownTimer = 34;
      this.setState('knockdown');
      this.vx = -this.facing * push * 1.2;
      this.vy = 4.6;
      this.grounded = false;
    } else {
      this.hitstunTimer = hit.hitstun || 12;
      this.setState('hitstun');
      this.hitstunTimer = hit.hitstun || 12;
      this.vx = -this.facing * push;
    }

    /* dizzy check */
    if (this.stun >= this.stunMax && this.grounded && this.state !== 'ko') {
      this.dizzyTimer = 150;
      this.setState('dizzy');
      this.dizzyTimer = 150;
      this.stun = this.stunMax;
      CF.Audio.play('dizzy');
    }

    return counter ? 'counter' : 'hit';
  };

  Fighter.prototype.getThrown = function (attacker, dmg, stun, dir) {
    this.health = Math.max(0, this.health - dmg);
    this.stun += stun || 14;
    this.comboCount = 0;
    this.flash = 6;
    this.thrownBy = attacker;
    this.facing = -attacker.facing;
    this.x = attacker.x + attacker.facing * 26;
    this.throwTimer = 22;
    this.setState('thrown');
    this.throwTimer = 22;
    this.vx = attacker.facing * dir * 5.6;
    this.vy = 6.4;
    this.grounded = false;
    if (this.health <= 0) { this.setState('ko'); CF.Audio.play('ko'); }
  };

  /* ---- physics ----------------------------------------------------------- */

  Fighter.prototype.physics = function () {
    this.x += this.vx;
    if (!this.grounded) {
      this.y += this.vy;
      this.vy -= this.stats.gravity;
      if (this.y <= GROUND) {
        this.y = GROUND;
        this.vy = 0;
        this.grounded = true;
        this.jumpAttackUsed = false;
        this.airDashUsed = false;
        this.fx.push({ kind: 'dust', x: this.x, y: 2, t: 0, n: 5 });
        CF.Audio.play('land');
        if (this.state === 'jump') { this.setState('idle'); this.landFrames = 4; }
        else if (this.state === 'hitstun') { this.knockdownTimer = 30; this.setState('knockdown'); }
        else if (this.state === 'thrown') { /* handled by updateThrown */ }
        else if (this.state === 'move' && this.move && !this.move.airborne) { /* keep going */ }
        if (this.landFrames === undefined) this.landFrames = 0;
      }
    } else {
      this.y = GROUND;
      if (this.landFrames > 0) this.landFrames--;
    }
  };

  /* ---- what to draw ------------------------------------------------------ */

  Fighter.prototype.currentPose = function () {
    var p = this.basePose();
    /* The character's own posture, on everything except an authored attack —
       those are drawn frame by frame and already say who is throwing them. */
    if (this.state === 'move') return p;
    return A.restyle(p, this.chr.stance);
  };

  Fighter.prototype.basePose = function () {
    var s = this.state, f = this.stateFrame;

    if (s === 'move' && this.move) {
      return A.sample(this.move.anim, this.moveFrame, this.move);
    }
    switch (s) {
      case 'idle':
        if (this.blockHeld) return Ps.guardHigh;
        return A.cycle([Ps.stand, Ps.standB, Ps.stand, Ps.standC], 12, this.idleTimer);
      case 'walkF':
        return A.cycle([Ps.walkF1, Ps.walkF2, Ps.walkF3, Ps.walkF4], 7, this.walkTimer);
      case 'walkB':
        return A.cycle([Ps.walkB1, Ps.walkB2, Ps.walkB3, Ps.walkB4], 8, this.walkTimer);
      case 'crouch':
        return this.blockHeld ? Ps.guardLow : Ps.crouch;
      case 'jump':
        if (this.vy > 3) return Ps.jumpRise;
        if (this.vy > -3) return Ps.jumpApex;
        return Ps.jumpFall;
      case 'blockstun':
        return this.port.relDir(this.facing) <= 3 && this.port.relDir(this.facing) >= 1
          ? Ps.guardLow : Ps.guardHigh;
      case 'hitstun': {
        /* Chosen once, when the hit lands. Rolling for it here re-rolled it
           every frame — the cat shivered between two poses, and hurtboxes()
           calls this as well, which put a coin flip inside collision. */
        var hp = this.lastHitLevel === 'low' ? Ps.hitLow
               : this.lastHitHeavy ? Ps.hitHeavy
               : (this.hitPoseAlt ? Ps.hitBody : Ps.hitHigh);
        /* snap to the recoil, hold it, then come back off it */
        var back = Math.max(4, Math.round(this.stunFrames * 0.55));
        return A.sample([{ at: 0, p: hp }, { at: back, p: hp },
                         { at: Math.max(back + 3, this.stunFrames), p: Ps.stand }], f);
      }
      case 'knockdown':
        if (!this.grounded) return Ps.launch;
        return Ps.downed;
      case 'wakeup':
        return A.sample([{ at: 0, p: Ps.downed }, { at: 16, p: Ps.stand }], f);
      case 'thrown':
        return Ps.thrown;
      case 'dizzy':
        return A.cycle([Ps.dizzy1, Ps.dizzy2], 12, f);
      case 'ko':
        return this.grounded ? Ps.koPose : Ps.launch;
      case 'win':
        return A.sample([{ at: 0, p: Ps.stand }, { at: 20, p: Ps.winPose }], f);
      case 'intro':
        return Ps.stand;
    }
    return Ps.stand;
  };

  /* The pose to DRAW, which is the pose to fight with plus a tail and a head
     that are still catching up. Advanced once a frame in update(), never in
     currentPose() — hurtboxes() calls that, and a spring that stepped every
     time it was asked would run at whatever rate the game happened to look. */
  Fighter.prototype.advanceLag = function () {
    if (!this._lag) this._lag = {};
    this._drawPose = A.settle(this._lag, this.currentPose());
  };

  Fighter.prototype.drawPose = function () {
    return this._drawPose || this.currentPose();
  };

  /* Open the mouth when the move says to — a growl should look like one —
     and when a heavy hit lands, which reads as a yowl. */
  Fighter.prototype.mouthState = function () {
    if (this.state === 'move' && this.move && this.move.mouth) {
      if (this.moveFrame >= (this.move.mouthFrom !== undefined ? this.move.mouthFrom : this.move.startup - 3)) {
        return this.move.mouth;
      }
    }
    if (this.state === 'hitstun' && this.lastHitHeavy) return 'open';
    if (this.state === 'ko' && !this.grounded) return 'open';
    return null;
  };

  Fighter.prototype.eyeState = function () {
    if (this.state === 'ko') return 'ko';
    if (this.state === 'dizzy') return 'ko';
    if (this.state === 'hitstun' || this.state === 'knockdown' || this.state === 'thrown') return 'closed';
    if (this.state === 'move' && this.move &&
        (this.move.kind === 'special' || this.move.kind === 'super')) return 'angry';
    if (this.health < this.maxHealth * 0.3) return 'angry';
    return 'normal';
  };

  /* Hurtboxes come from the drawn skeleton, so they always match the picture. */
  Fighter.prototype.hurtboxes = function () {
    var j = CF.Rig.solve(this.currentPose(), 1, this.chr.build);
    var boxes = CF.Rig.hurtboxes(j);
    var out = [];
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      out.push({
        x: this.x + (this.facing > 0 ? b.x : -(b.x + b.w)),
        y: this.y + b.y, w: b.w, h: b.h, part: b.part
      });
    }
    return out;
  };

  Fighter.prototype.activeHitbox = function () {
    if (!this.inActive()) return null;
    var m = this.move;
    var hb = m.hitbox;
    if (!hb) return null;
    if (m.multiHit) {
      if (this.moveHits >= m.multiHit) return null;
      if (this.moveFrame - this.lastHitFrame < (m.hitGap || 6)) return null;
    } else if (this.moveHits >= 1) return null;
    return {
      x: this.x + (this.facing > 0 ? hb.x : -(hb.x + hb.w)),
      y: this.y + hb.y, w: hb.w, h: hb.h
    };
  };

  Fighter.prototype.pushbox = function () {
    var w = PUSHBOX_W * (this.stats.weight > 1.2 ? 1.15 : 1);
    var h = (this.state === 'crouch' || (this.move && this.move.stance === 'crouch')) ? 46 : 86;
    if (this.state === 'knockdown' || this.state === 'ko') h = 26;
    return { x: this.x - w / 2, y: this.y, w: w, h: h };
  };

  /* The damage payload of the fighter's current active move. */
  Fighter.prototype.hitData = function () {
    var m = this.move;
    var dmg = Array.isArray(m.damage) ? m.damage[this.strength] : m.damage;
    var stun = Array.isArray(m.stun) ? m.stun[this.strength] : m.stun;
    return {
      damage: dmg || 10,
      stun: stun || 5,
      chip: m.chip || 0,
      hitstun: m.hitstun || 12,
      blockstun: m.blockstun || 9,
      hitLevel: m.hitLevel || (m.stance === 'air' ? 'overhead' : 'mid'),
      pushback: m.pushback || 2,
      blockPushback: m.blockPushback || 2.6,
      knockdown: m.knockdown || false,
      fxY: (m.hitbox ? m.hitbox.y + m.hitbox.h / 2 : 46)
    };
  };

  CF.Fighter = Fighter;
  CF.GROUND = GROUND;
  CF.SIMPLE_NORMALS = SIMPLE_NORMALS;
  CF.SIMPLE_PAIRS = SIMPLE_PAIRS;
  CF.CLASSES = CLASSES;
})();
