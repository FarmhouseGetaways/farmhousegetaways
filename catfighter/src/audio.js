/* ==========================================================================
   Super Cat Fighter 6 — audio

   Everything is synthesised at runtime. No .wav files means nothing to load,
   nothing to licence, and a build that stays small enough to email.
   ========================================================================== */
(function () {
  var ctx = null, master = null, musicGain = null, sfxGain = null;
  var enabled = true, musicOn = true;
  var musicTimer = null, musicStep = 0;

  function init() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { enabled = false; return; }
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.85; sfxGain.connect(master);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.22; musicGain.connect(master);
  }

  function noiseBuffer(dur) {
    var n = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    return buf;
  }

  function noise(dur, freq, q, gain, dest) {
    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(dur);
    var flt = ctx.createBiquadFilter();
    flt.type = 'bandpass'; flt.frequency.value = freq; flt.Q.value = q || 1;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(flt); flt.connect(g); g.connect(dest || sfxGain);
    src.start();
  }

  /* A real attack, however short. Jumping the gain straight to full clicks,
     and a click on every punch in a fighting game is exhausting. */
  function env(g, gain, dur, attack) {
    var t0 = ctx.currentTime, a = attack === undefined ? 0.004 : attack;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }

  function tone(type, f0, f1, dur, gain, dest, attack) {
    var o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, ctx.currentTime);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), ctx.currentTime + dur);
    var g = ctx.createGain();
    env(g, gain, dur, attack);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(); o.stop(ctx.currentTime + dur + 0.02);
  }

  /* The low body of an impact — the part you feel rather than hear. */
  function thump(f0, f1, dur, gain) {
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(18, f1), ctx.currentTime + dur);
    var g = ctx.createGain();
    env(g, gain, dur, 0.002);
    o.connect(g); g.connect(sfxGain);
    o.start(); o.stop(ctx.currentTime + dur + 0.02);
  }

  /* Every hit is detuned a little. Thirty identical thwacks in a row is the
     single most tiring sound a fighting game can make. */
  function vary(v, amt) { return v * (1 + (Math.random() - 0.5) * (amt || 0.16)); }

  /* Every impact is three layers: a crack up top so it cuts through, a body
     in the middle so it has a shape, and a thump underneath so it lands. One
     noise burst on its own is a hiss, which is what these all were. */
  var SFX = {
    light: function () {
      noise(0.05, vary(2600), 1.6, 0.26);
      tone('square', vary(420), 180, 0.05, 0.10);
      thump(vary(150), 70, 0.07, 0.18);
    },
    med: function () {
      noise(0.09, vary(1500), 1.1, 0.36);
      tone('square', vary(300), 110, 0.08, 0.14);
      thump(vary(120), 48, 0.12, 0.30);
    },
    heavy: function () {
      noise(0.15, vary(900), 0.9, 0.48);
      tone('sawtooth', vary(200), 60, 0.14, 0.20);
      thump(vary(105), 34, 0.20, 0.46);
      noise(0.30, vary(240, 0.1), 0.6, 0.14);        // the room, after
    },
    whiff: function () {
      noise(0.14, vary(2400, 0.25), 2.6, 0.12);
      tone('sine', vary(900), 340, 0.12, 0.04);
    },
    block: function () {
      noise(0.07, vary(4200), 3.0, 0.30);
      tone('square', vary(1100), 700, 0.05, 0.09);
      thump(vary(180), 90, 0.06, 0.14);
    },
    fireball: function () {
      tone('sawtooth', 150, vary(1100), 0.30, 0.15);
      tone('sine', 90, vary(420), 0.30, 0.10);
      noise(0.28, 1200, 0.6, 0.15);
    },
    throwHit: function () {
      noise(0.20, vary(520), 0.7, 0.42);
      tone('sawtooth', vary(140), 40, 0.24, 0.18);
      thump(vary(95), 28, 0.26, 0.5);
    },
    ko: function () {
      /* a hit, then the room ringing */
      noise(0.20, 700, 0.8, 0.55);
      thump(120, 26, 0.40, 0.6);
      tone('sawtooth', 460, 55, 0.85, 0.24);
      tone('sine', 230, 40, 0.9, 0.16);
      noise(0.7, 380, 0.5, 0.22);
    },
    dizzy: function () {
      tone('sine', 760, 320, 0.4, 0.13);
      tone('sine', 980, 430, 0.4, 0.09);
      tone('triangle', 520, 240, 0.45, 0.07);
    },
    meow: function () {
      tone('sawtooth', vary(600, 0.2), vary(360, 0.2), 0.30, 0.13, null, 0.03);
      tone('sine', vary(880, 0.2), vary(520, 0.2), 0.28, 0.07, null, 0.03);
    },
    hiss: function () { noise(0.36, vary(5000, 0.2), 1.5, 0.22); },
    select: function () {
      tone('square', 620, 980, 0.05, 0.13);
      tone('square', 930, 1470, 0.07, 0.07);
    },
    cursor: function () { tone('square', 500, 560, 0.035, 0.10); },
    round: function () {
      tone('square', 520, 780, 0.16, 0.16);
      tone('square', 780, 1040, 0.16, 0.09);
    },
    counter: function () {
      noise(0.14, 1100, 0.9, 0.46);
      tone('square', 1400, 320, 0.13, 0.14);
      thump(130, 40, 0.18, 0.36);
    },
    superhit: function () {
      tone('sawtooth', 1000, 110, 0.5, 0.22);
      tone('sawtooth', 660, 80, 0.55, 0.16);
      thump(140, 30, 0.5, 0.55);
      noise(0.45, 850, 0.55, 0.28);
    },
    land: function () {
      noise(0.08, vary(420, 0.2), 0.9, 0.20);
      thump(vary(90), 34, 0.12, 0.24);
    },
    whoosh: function () { noise(0.16, vary(1800, 0.3), 2.2, 0.14); }
  };
  SFX['throw'] = SFX.throwHit;

  function play(name) {
    if (!enabled) return;
    init();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    var fn = SFX[name];
    if (fn) { try { fn(); } catch (e) { /* an audio glitch must never stop the fight */ } }
  }

  /* ---- music -------------------------------------------------------------

     A stage theme rather than a loop of eight notes: a walking bass, a kick
     and snare that actually keep time, hats on the off-beats, and a lead
     phrase long enough that you do not hear it come round. Driven off a
     sixteenth-note clock with a little swing, because a perfectly even grid
     is what makes chiptune sound like a placeholder.                      */

  /* semitones from the root, one per sixteenth */
  var BASS = [0, null, 0, null, 7, null, 0, 0, 5, null, 5, null, 3, null, 3, 2];
  var LEAD = [
    12, null, 15, 19, null, 15, 12, null, 17, null, 15, 12, null, 10, null, null,
    12, null, 15, 19, null, 22, 19, null, 17, 19, 17, 15, null, 12, null, null,
    10, null, 12, 15, null, 12, 10, null, 8, null, 10, 12, null, 7, null, null,
    12, 15, 19, 22, null, 24, 22, 19, 17, null, 15, null, 12, null, null, null
  ];
  var KICK  = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0];
  var SNARE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1];

  var root = 0;                       /* the key, set per stage */
  function hz(semi) { return 110 * Math.pow(2, (semi + root) / 12); }

  function drumKick() {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(42, ctx.currentTime + 0.13);
    env(g, 0.7, 0.15, 0.002);
    o.connect(g); g.connect(musicGain);
    o.start(); o.stop(ctx.currentTime + 0.17);
  }
  function drumSnare() {
    noise(0.11, 1900, 0.9, 0.42, musicGain);
    tone('triangle', 260, 170, 0.07, 0.22, musicGain, 0.002);
  }

  function step() {
    if (!ctx || !musicOn) return;
    var i = musicStep % 16;
    if (KICK[i]) drumKick();
    if (SNARE[i]) drumSnare();
    if (i % 2 === 1) noise(0.028, 8200, 2.4, 0.10, musicGain);   /* off-beat hat */

    var b = BASS[i];
    if (b !== null) tone('triangle', hz(b - 12), hz(b - 12), 0.20, 0.55, musicGain, 0.004);

    var l = LEAD[musicStep % LEAD.length];
    if (l !== null) {
      tone('square', hz(l + 12), hz(l + 12), 0.13, 0.13, musicGain, 0.004);
      tone('square', hz(l + 19), hz(l + 19), 0.10, 0.05, musicGain, 0.004);
    }
    musicStep++;
  }

  /* Each stage gets its own key, so six fights do not sound like one. */
  function setKey(n) { root = n | 0; }

  function startMusic() {
    init();
    if (!ctx || musicTimer) return;
    musicOn = true;
    musicTimer = setInterval(step, 128);
  }
  function stopMusic() {
    musicOn = false;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }
  function toggleMusic() { if (musicTimer) stopMusic(); else startMusic(); return !!musicTimer; }
  function toggleSfx() { enabled = !enabled; return enabled; }
  function setVolume(v) { init(); if (master) master.gain.value = v; }

  CF.Audio = {
    init: init, play: play,
    startMusic: startMusic, stopMusic: stopMusic, toggleMusic: toggleMusic, setKey: setKey,
    toggleSfx: toggleSfx, setVolume: setVolume,
    isMusicOn: function () { return !!musicTimer; },
    isSfxOn: function () { return enabled; }
  };
})();
