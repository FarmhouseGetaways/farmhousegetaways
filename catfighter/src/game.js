/* ==========================================================================
   Cat Fighter II — game loop, scenes and match logic

   Fixed 60Hz logical timestep with an accumulator, so the fight runs at the
   same speed on a 60Hz laptop and a 144Hz monitor. Rendering interpolates
   nothing on purpose — a fighting game should show you exactly the frame the
   simulation is on.
   ========================================================================== */
(function () {
  var U = CF.util, S = CF.STAGE, HUD = CF.HUD;
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
    this.menuItems = ['ARCADE', 'VERSUS', 'TRAINING', 'CONTROLS', 'OPTIONS'];
    this.optIndex = 0;
    this.select = { cursor: [0, 3], locked: [false, false], stage: 0 };
    this.arcade = { step: 0, order: [] };
    this.ghost = [0, 0];
    this.announce = null;
    this.announceT = 0;
    this.slowmo = 0;
  }

  /* ---- public hooks used by fighters ------------------------------------- */
  Game.prototype.hitstop = function (n) {
    if (this.p1) this.p1.hitstop = Math.max(this.p1.hitstop, n);
    if (this.p2) this.p2.hitstop = Math.max(this.p2.hitstop, n);
  };
  Game.prototype.shake = function (n) { this.shakeAmt = Math.max(this.shakeAmt, n); };
  Game.prototype.say = function (str, frames, size, color) {
    this.announce = { str: str, size: size || 34, color: color || '#ffe07a' };
    this.announceT = frames || 70;
  };

  /* ---- match set-up ------------------------------------------------------ */
  Game.prototype.startMatch = function (c1, c2, stageIdx, mode) {
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
    for (var i = 0; i < this.ports.length; i++) this.ports[i].poll();
    if (this.announceT > 0) this.announceT--;
    if (this.shakeAmt > 0) this.shakeAmt *= 0.86;
    if (this.shakeAmt < 0.15) this.shakeAmt = 0;

    switch (this.scene) {
      case 'title':    this.stepTitle(); break;
      case 'select':   this.stepSelect(); break;
      case 'fight':    this.stepFight(); break;
      case 'controls': if (this.anyStart()) { this.scene = 'title'; CF.Audio.play('select'); } break;
      case 'options':  this.stepOptions(); break;
      case 'result':   this.stepResult(); break;
    }
  };

  Game.prototype.anyStart = function () {
    return this.ports[0].startPressed || this.ports[1].startPressed ||
           this.ports[0].pressed.LP || this.ports[1].pressed.LP;
  };

  /* ---- title ------------------------------------------------------------- */
  Game.prototype.stepTitle = function () {
    var p = this.ports[0];
    var d = p.dir;
    if (this._navCool > 0) this._navCool--;
    if (!this._navCool) {
      if (d === 8) { this.menuIndex = (this.menuIndex + this.menuItems.length - 1) % this.menuItems.length; this._navCool = 10; CF.Audio.play('cursor'); }
      if (d === 2) { this.menuIndex = (this.menuIndex + 1) % this.menuItems.length; this._navCool = 10; CF.Audio.play('cursor'); }
    }
    if (this.anyStart()) {
      CF.Audio.init(); CF.Audio.play('select');
      var pick = this.menuItems[this.menuIndex];
      if (pick === 'CONTROLS') { this.scene = 'controls'; }
      else if (pick === 'OPTIONS') { this.scene = 'options'; this.optIndex = 0; }
      else {
        this.settings.mode = pick.toLowerCase();
        this.scene = 'select';
        this.select.locked = [false, false];
        this.select.cursor = [0, 3];
        this.select.stage = (Math.random() * CF.Stages.length) | 0;
      }
    }
  };

  /* ---- options ----------------------------------------------------------- */
  Game.prototype.optionRows = function () {
    var s = this.settings;
    return [
      { label: 'DIFFICULTY', value: CF.AI_LEVELS[s.difficulty].name,
        inc: function () { s.difficulty = Math.min(5, s.difficulty + 1); },
        dec: function () { s.difficulty = Math.max(1, s.difficulty - 1); } },
      { label: 'ROUNDS TO WIN', value: String(s.rounds),
        inc: function () { s.rounds = Math.min(3, s.rounds + 1); },
        dec: function () { s.rounds = Math.max(1, s.rounds - 1); } },
      { label: 'ROUND TIME', value: s.roundTime >= 999 ? 'INFINITE' : String(s.roundTime),
        inc: function () { s.roundTime = s.roundTime >= 99 ? 999 : s.roundTime + 10; },
        dec: function () { s.roundTime = s.roundTime >= 999 ? 99 : Math.max(30, s.roundTime - 10); } },
      { label: 'MUSIC', value: CF.Audio.isMusicOn() ? 'ON' : 'OFF',
        inc: function () { CF.Audio.toggleMusic(); }, dec: function () { CF.Audio.toggleMusic(); } },
      { label: 'SOUND FX', value: CF.Audio.isSfxOn() ? 'ON' : 'OFF',
        inc: function () { CF.Audio.toggleSfx(); }, dec: function () { CF.Audio.toggleSfx(); } },
      { label: 'SHOW HITBOXES', value: s.showBoxes ? 'ON' : 'OFF',
        inc: function () { s.showBoxes = !s.showBoxes; }, dec: function () { s.showBoxes = !s.showBoxes; } },
      { label: 'BACK', value: '', inc: function () {}, dec: function () {} }
    ];
  };

  Game.prototype.stepOptions = function () {
    var p = this.ports[0], rows = this.optionRows();
    if (this._navCool > 0) this._navCool--;
    if (!this._navCool) {
      if (p.dir === 8) { this.optIndex = (this.optIndex + rows.length - 1) % rows.length; this._navCool = 10; CF.Audio.play('cursor'); }
      if (p.dir === 2) { this.optIndex = (this.optIndex + 1) % rows.length; this._navCool = 10; CF.Audio.play('cursor'); }
      if (p.dir === 6) { rows[this.optIndex].inc(); this._navCool = 12; CF.Audio.play('cursor'); }
      if (p.dir === 4) { rows[this.optIndex].dec(); this._navCool = 12; CF.Audio.play('cursor'); }
    }
    if (this.anyStart()) {
      CF.Audio.play('select');
      if (rows[this.optIndex].label === 'BACK') this.scene = 'title';
      else rows[this.optIndex].inc();
    }
  };

  /* ---- character select --------------------------------------------------- */
  Game.prototype.stepSelect = function () {
    var self = this;
    var players = this.settings.mode === 'versus' ? 2 : 1;
    if (this._navCool > 0) this._navCool--;

    for (var i = 0; i < 2; i++) {
      if (i >= players) continue;
      var p = this.ports[i];
      if (this.select.locked[i]) continue;
      if (!this._navCool) {
        var c = this.select.cursor[i], moved = false;
        if (p.dir === 4) { c = (c + 5) % 6; moved = true; }
        if (p.dir === 6) { c = (c + 1) % 6; moved = true; }
        if (p.dir === 8) { c = (c + 3) % 6; moved = true; }
        if (p.dir === 2) { c = (c + 3) % 6; moved = true; }
        if (moved) { this.select.cursor[i] = c; this._navCool = 10; CF.Audio.play('cursor'); }
      }
      if (p.startPressed || p.pressed.LP || p.pressed.MP || p.pressed.HP) {
        this.select.locked[i] = true;
        CF.Audio.play('select');
        CF.Audio.play('meow');
      }
    }

    if (players === 1 && this.select.locked[0]) {
      /* arcade: build a ladder of the other five, in a fixed order */
      var mine = this.select.cursor[0];
      if (this.settings.mode === 'arcade') {
        this.arcade.order = [];
        for (var k = 1; k <= 5; k++) this.arcade.order.push((mine + k) % 6);
        this.arcade.step = 0;
        this.startMatch(CF.ROSTER[mine], CF.ROSTER[this.arcade.order[0]],
                        this.select.stage, 'arcade');
      } else {
        this.startMatch(CF.ROSTER[mine], CF.ROSTER[(mine + 1) % 6],
                        this.select.stage, 'training');
      }
      return;
    }
    if (players === 2 && this.select.locked[0] && this.select.locked[1]) {
      this.startMatch(CF.ROSTER[this.select.cursor[0]], CF.ROSTER[this.select.cursor[1]],
                      this.select.stage, 'versus');
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
      if (this.ports[0].pressed.HK) { this.paused = false; this.scene = 'title'; CF.Audio.stopMusic(); }
      return;
    }

    this.roundTimer++;

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
      } else {
        atk.meter = Math.min(atk.maxMeter, atk.meter + (m.meterOnHit || m.meterGain || 8));
        var heavy = data.damage >= 30;
        var stop = m.kind === 'super' ? 12 : (heavy ? 9 : (data.damage >= 20 ? 7 : 5));
        this.hitstop(stop);
        this.shake(heavy ? 5 : 2.5);
        this.fx.push({ kind: 'impact', x: mid, y: fxY, t: 0, big: heavy,
                       color: m.kind === 'super' ? '#ffd166' : '#fff2c4' });
        if (m.fx === 'spark') this.fx.push({ kind: 'spark', x: def.x, y: 70, t: 0 });
        if (result === 'counter') {
          this.fx.push({ kind: 'text', x: mid, y: 96, t: 0, str: 'COUNTER', size: 13, color: '#ff8a4a' });
          CF.Audio.play('counter');
        } else {
          CF.Audio.play(m.kind === 'super' ? 'superhit' : (m.sfx || (heavy ? 'heavy' : 'med')));
        }
        if (result === 'ko') { this.shake(12); this.slowmo = 60; }
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
        knockdown: p.super ? 'soft' : false, fxY: p.y
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
          this.resultKind = 'clear';
          this.resultTimer = 400;
          CF.Audio.stopMusic();
          return;
        }
        /* next opponent, health restored, meter kept */
        var meter = this.p1.meter;
        var next = CF.ROSTER[this.arcade.order[this.arcade.step]];
        var stage = (this.select.stage + this.arcade.step) % CF.Stages.length;
        this.startMatch(this.p1.chr, next, stage, 'arcade');
        this.p1.meter = Math.min(this.p1.maxMeter, meter);
        return;
      }
      this.scene = 'result';
      this.resultKind = (this.matchWinner === 'draw') ? 'draw' : 'win';
      this.resultTimer = 340;
      CF.Audio.stopMusic();
      return;
    }
    this.round++;
    this.resetRound(false);
  };

  Game.prototype.stepResult = function () {
    this.resultTimer--;
    if (this.resultTimer <= 0 || this.anyStart()) {
      this.scene = 'title';
      this.menuIndex = 0;
      CF.Audio.stopMusic();
    }
  };

  /* ======================================================================
     RENDERING
     ====================================================================== */

  Game.prototype.render = function () {
    var ctx = this.ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, W, H);

    switch (this.scene) {
      case 'title':    this.drawTitle(ctx); break;
      case 'select':   this.drawSelect(ctx); break;
      case 'controls': this.drawControls(ctx); break;
      case 'options':  this.drawOptions(ctx); break;
      case 'fight':    this.drawFight(ctx); break;
      case 'result':   this.drawResult(ctx); break;
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
    ctx.translate(W / 2, 74);
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

    HUD.outlineText(ctx, 'CAT FIGHTER', W / 2, 62, 40, '#ffe07a', '#2a0e18');
    HUD.outlineText(ctx, 'II', W / 2, 92, 30, '#ff7a4a', '#2a0e18');
    HUD.text(ctx, 'THE FARMHOUSE WARRIORS', W / 2, 106, 9, '#ffd9b0', 'center', 700, 2.2);

    for (var m = 0; m < this.menuItems.length; m++) {
      var sel = m === this.menuIndex;
      var y = 132 + m * 15;
      if (sel) {
        ctx.fillStyle = 'rgba(255,224,122,.16)';
        ctx.fillRect(W / 2 - 66, y - 10, 132, 14);
      }
      HUD.text(ctx, this.menuItems[m], W / 2, y, sel ? 12 : 11,
               sel ? '#ffe07a' : 'rgba(255,240,220,.62)', 'center', sel ? 800 : 700, 1.4);
      if (sel) {
        HUD.text(ctx, '▶', W / 2 - 74 + Math.sin(t * 0.14) * 2, y, 10, '#ffe07a', 'center');
      }
    }

    HUD.text(ctx, 'P1  W A S D  •  U I O / J K L        ENTER TO CHOOSE',
             W / 2, H - 8, 7.5, 'rgba(255,240,220,.55)', 'center', 700, 0.7);
  };

  /* ---- select ------------------------------------------------------------- */
  Game.prototype.drawSelect = function (ctx) {
    var t = this.t;
    ctx.fillStyle = '#20182c'; ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(W / 2, 90, 10, W / 2, 90, 240);
    g.addColorStop(0, 'rgba(120,70,140,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    HUD.text(ctx, 'SELECT YOUR CAT', W / 2, 18, 13, '#ffe07a', 'center', 800, 2);

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
    /* If a real photograph of this cat has been dropped into assets/cats/,
       show it beside the fighter. Absent, the card just closes up. */
    var photoW = 0;
    if (CF.Photos && CF.Photos.has(sel.id)) {
      CF.Photos.drawCircle(ctx, sel.id, 96, by + 26, 19);
      photoW = 44;
    }
    HUD.text(ctx, sel.displayName, 86 + photoW, by + 16, 15, '#ffe07a', 'left', 800, 1.4);
    HUD.text(ctx, sel.subtitle, 86 + photoW, by + 27, 9, '#ffb8a0', 'left', 700, 1);
    var lines = sel.blurb.split('\n');
    for (var L = 0; L < lines.length; L++) {
      HUD.text(ctx, lines[L], 86, by + 39 + L * 9, 7.6, 'rgba(255,240,220,.78)', 'left', 600, 0.3);
    }
    /* difficulty pips */
    HUD.text(ctx, 'DIFFICULTY', W - 96, by + 16, 7, 'rgba(255,240,220,.6)', 'left', 700, 0.6);
    for (var d = 0; d < 3; d++) {
      ctx.fillStyle = d < sel.difficulty ? '#ffd24a' : 'rgba(255,255,255,.18)';
      ctx.fillRect(W - 96 + d * 11, by + 20, 8, 4);
    }
    HUD.text(ctx, 'STAGE: ' + CF.Stages[this.select.stage].name, W - 96, by + 38, 7,
             'rgba(255,240,220,.6)', 'left', 700, 0.4);
    HUD.text(ctx, this.settings.mode.toUpperCase() + ' MODE', W - 96, by + 50, 7.5,
             '#8fd6ff', 'left', 800, 0.6);
  };

  /* ---- controls ----------------------------------------------------------- */
  Game.prototype.drawControls = function (ctx) {
    ctx.fillStyle = '#1a1424'; ctx.fillRect(0, 0, W, H);
    HUD.text(ctx, 'CONTROLS', W / 2, 20, 14, '#ffe07a', 'center', 800, 2);

    var rows = [
      ['', 'PLAYER 1', 'PLAYER 2'],
      ['MOVE', 'W A S D', 'ARROW KEYS'],
      ['LIGHT / MED / HEAVY PUNCH', 'U  I  O', 'NUM 7 8 9'],
      ['LIGHT / MED / HEAVY KICK', 'J  K  L', 'NUM 4 5 6'],
      ['THROW', 'LP + LK', 'LP + LK'],
      ['PAUSE', 'ENTER', '—']
    ];
    for (var i = 0; i < rows.length; i++) {
      var y = 42 + i * 13;
      var head = i === 0;
      HUD.text(ctx, rows[i][0], 18, y, head ? 8 : 8.5, head ? '#ffb8a0' : 'rgba(255,240,220,.8)', 'left', head ? 800 : 600, 0.4);
      HUD.text(ctx, rows[i][1], 210, y, 8.5, head ? '#8fd6ff' : '#ffe9b8', 'center', head ? 800 : 700, 0.4);
      HUD.text(ctx, rows[i][2], 310, y, 8.5, head ? '#ff9db0' : '#ffe9b8', 'center', head ? 800 : 700, 0.4);
    }

    HUD.text(ctx, 'MOTIONS  (shown facing right)', 18, 128, 8, '#ffb8a0', 'left', 800, 0.8);
    var mo = [
      'FIREBALL      down, down-forward, forward + punch',
      'UPPERCUT      forward, down, down-forward + punch',
      'SPIN KICK     down, down-back, back + kick',
      'CHARGE        hold back 40f, then forward + button',
      'FLASH KICK    hold down 40f, then up + kick',
      'SUPER         two fireball motions + button (full meter)'
    ];
    for (var m = 0; m < mo.length; m++) {
      HUD.text(ctx, mo[m], 18, 141 + m * 10, 7.4, 'rgba(255,240,220,.75)', 'left', 600, 0.2);
    }
    HUD.text(ctx, 'A GAMEPAD WORKS TOO — PLUG IT IN AND IT IS FOUND AUTOMATICALLY',
             W / 2, H - 16, 7, 'rgba(255,240,220,.5)', 'center', 700, 0.6);
    HUD.text(ctx, 'PRESS ENTER TO GO BACK', W / 2, H - 6, 7.5, '#ffe07a', 'center', 800, 1);
  };

  /* ---- options ------------------------------------------------------------ */
  Game.prototype.drawOptions = function (ctx) {
    ctx.fillStyle = '#1a1424'; ctx.fillRect(0, 0, W, H);
    HUD.text(ctx, 'OPTIONS', W / 2, 26, 14, '#ffe07a', 'center', 800, 2);
    var rows = this.optionRows();
    for (var i = 0; i < rows.length; i++) {
      var y = 56 + i * 18, sel = i === this.optIndex;
      if (sel) { ctx.fillStyle = 'rgba(255,224,122,.14)'; ctx.fillRect(50, y - 11, W - 100, 16); }
      HUD.text(ctx, rows[i].label, 62, y, 10, sel ? '#ffe07a' : 'rgba(255,240,220,.7)', 'left', sel ? 800 : 600, 0.8);
      HUD.text(ctx, rows[i].value, W - 62, y, 10, sel ? '#8fd6ff' : 'rgba(255,240,220,.7)', 'right', sel ? 800 : 600, 0.8);
    }
    HUD.text(ctx, 'LEFT / RIGHT TO CHANGE   •   ENTER TO CONFIRM',
             W / 2, H - 10, 7.5, 'rgba(255,240,220,.55)', 'center', 700, 0.8);
  };

  /* ---- the fight ---------------------------------------------------------- */
  Game.prototype.drawFight = function (ctx) {
    var camX = this.camX;
    var sx = (Math.random() - 0.5) * this.shakeAmt;
    var sy = (Math.random() - 0.5) * this.shakeAmt;

    ctx.save();
    ctx.translate(sx, sy);
    this.stage.draw(ctx, camX, this.t);

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
      var opts = { eyes: ff.eyeState() };
      if (ff.flash > 2) opts.flash = 'white';
      if (ff.state === 'move' && ff.move && ff.move.kind === 'super' && ff.superFreeze > 0) {
        opts.flash = (this.t % 4 < 2) ? 'white' : null;
      }
      drawFighterAt(ctx, ff.chr, ff.currentPose(), ff.x - camX, FLOOR_Y - ff.y, 1, ff.facing, opts);
    }

    for (var p = 0; p < this.projectiles.length; p++) {
      HUD.drawProjectile(ctx, this.projectiles[p], camX, this.t);
    }

    HUD.drawFx(ctx, this.fx, camX);

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
      HUD.text(ctx, 'ENTER TO RESUME   •   L TO QUIT TO TITLE',
               W / 2, H / 2 + 14, 8, 'rgba(255,240,220,.75)', 'center', 700, 0.8);
    }
  };

  Game.prototype.drawBoxes = function (ctx, camX) {
    var fs = [this.p1, this.p2];
    ctx.save();
    ctx.lineWidth = 1;
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
  Game.prototype.drawResult = function (ctx) {
    ctx.fillStyle = '#180f22'; ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(W / 2, 100, 10, W / 2, 100, 220);
    g.addColorStop(0, 'rgba(200,140,60,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    var champ = (this.resultKind === 'clear') ? this.p1 :
                (this.matchWinner === 'draw' ? this.p1 : this.matchWinner);

    drawFighterAt(ctx, champ.chr,
      CF.Anim.sample([{ at: 0, p: CF.Pose.stand }, { at: 30, p: CF.Pose.winPose }],
                     Math.min(30, this.t % 200)),
      W / 2, FLOOR_Y + 26, 1.25, 1, { eyes: 'normal' });

    if (this.resultKind === 'clear') {
      HUD.outlineText(ctx, 'ARCADE CLEAR', W / 2, 40, 26, '#ffe07a', '#2a0e18');
      HUD.text(ctx, champ.chr.displayName + ' IS THE CHAMPION OF THE FARMHOUSE',
               W / 2, 56, 9, '#ffd9b0', 'center', 700, 1);
    } else if (this.resultKind === 'draw') {
      HUD.outlineText(ctx, 'DRAW GAME', W / 2, 44, 26, '#ffd166', '#2a0e18');
    } else {
      HUD.outlineText(ctx, 'WINNER', W / 2, 38, 24, '#ffe07a', '#2a0e18');
      HUD.outlineText(ctx, champ.chr.displayName, W / 2, 60, 20, '#fff', '#2a0e18');
    }
    if (CF.Photos && CF.Photos.has(champ.chr.id)) {
      CF.Photos.drawCircle(ctx, champ.chr.id, W - 52, 56, 30);
    }
    HUD.text(ctx, 'PRESS ENTER', W / 2, H - 10, 9,
             this.t % 60 < 36 ? '#ffe07a' : 'rgba(255,224,122,.25)', 'center', 800, 1.4);
  };

  CF.Game = Game;
})();
