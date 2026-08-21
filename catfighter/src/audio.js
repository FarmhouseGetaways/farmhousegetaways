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

  function tone(type, f0, f1, dur, gain, dest) {
    var o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, ctx.currentTime);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), ctx.currentTime + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(); o.stop(ctx.currentTime + dur + 0.02);
  }

  var SFX = {
    light:    function () { noise(0.07, 1600, 1.2, 0.30); tone('square', 300, 140, 0.06, 0.08); },
    med:      function () { noise(0.11, 1100, 1.0, 0.40); tone('square', 220, 90, 0.09, 0.12); },
    heavy:    function () { noise(0.18, 700, 0.9, 0.55); tone('sawtooth', 160, 55, 0.16, 0.18); },
    whiff:    function () { noise(0.13, 2600, 3.0, 0.14); },
    block:    function () { noise(0.09, 3200, 2.4, 0.34); tone('square', 900, 600, 0.05, 0.07); },
    fireball: function () { tone('sawtooth', 180, 900, 0.26, 0.16); noise(0.24, 1400, 0.7, 0.16); },
    throwHit: function () { noise(0.22, 500, 0.7, 0.5); tone('sawtooth', 130, 45, 0.22, 0.2); },
    ko:       function () { tone('sawtooth', 420, 60, 0.75, 0.28); noise(0.5, 500, 0.6, 0.32); },
    dizzy:    function () { tone('sine', 700, 300, 0.35, 0.14); tone('sine', 900, 400, 0.35, 0.1); },
    meow:     function () { tone('sawtooth', 620, 380, 0.30, 0.14); tone('sine', 900, 520, 0.28, 0.08); },
    hiss:     function () { noise(0.34, 5200, 1.4, 0.24); },
    select:   function () { tone('square', 700, 1100, 0.07, 0.16); },
    cursor:   function () { tone('square', 480, 520, 0.04, 0.12); },
    round:    function () { tone('square', 520, 780, 0.18, 0.18); },
    counter:  function () { noise(0.16, 900, 0.8, 0.5); tone('square', 1200, 300, 0.12, 0.14); },
    superhit: function () { tone('sawtooth', 900, 120, 0.5, 0.24); noise(0.4, 800, 0.6, 0.3); }
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
     A short looping bass-and-lead figure, deliberately simple, in the spirit
     of a stage theme without pretending to be one.                          */
  var BASS = [0, 0, 7, 0, 5, 5, 3, 5];
  var LEAD = [12, 15, 19, 15, 17, 15, 12, 10, 12, 15, 19, 22, 19, 15, 12, 7];

  function hz(semi) { return 110 * Math.pow(2, semi / 12); }

  function step() {
    if (!ctx || !musicOn) return;
    var b = BASS[musicStep % BASS.length];
    tone('triangle', hz(b), hz(b), 0.22, 0.5, musicGain);
    if (musicStep % 2 === 0) noise(0.05, 5000, 2, 0.25, musicGain);
    if (musicStep % 4 === 2) noise(0.14, 260, 0.8, 0.4, musicGain);
    var l = LEAD[musicStep % LEAD.length];
    tone('square', hz(l + 12), hz(l + 12), 0.16, 0.16, musicGain);
    musicStep++;
  }

  function startMusic() {
    init();
    if (!ctx || musicTimer) return;
    musicOn = true;
    musicTimer = setInterval(step, 150);
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
    startMusic: startMusic, stopMusic: stopMusic, toggleMusic: toggleMusic,
    toggleSfx: toggleSfx, setVolume: setVolume,
    isMusicOn: function () { return !!musicTimer; },
    isSfxOn: function () { return enabled; }
  };
})();
