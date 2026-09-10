/* ==========================================================================
   Super Cat Fighter 6 — audio

   Everything is synthesised at runtime. No .wav files means nothing to load,
   nothing to licence, and a build that stays small enough to email.
   ========================================================================== */
(function () {
  var ctx = null, master = null, musicGain = null, sfxGain = null;
  var enabled = true, musicOn = true;
  var musicTimer = null, musicStep = 0;
  /* Set only by `suspend`/`resume`/`shutdown` below — deliberately NOT the
     same thing as `ctx.state`. An `OfflineAudioContext`, which the offline
     measurement in tools/voice.mjs hands in, spends its whole life in
     'suspended' right up until rendering starts; testing `ctx.state` here
     would silence the announcer during that measurement and nowhere else,
     which is the kind of bug that looks like the tool is broken rather than
     like what it actually is. This flag means one thing only: the page
     asked audio to stop because it is not the thing on screen right now. */
  var suspended = false;

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

  /* ---- the announcer ------------------------------------------------------

     There is not a single recorded sample in this game and there is not
     going to be one: it ships as a single HTML file that runs from a file://
     URL, and one voice clip would be larger than everything else in it put
     together. So the announcer is SYNTHESISED, the same as the punches.

     Speech, reduced to the part that matters here: a voiced sound is a buzz
     from the larynx shaped by resonances of the throat and mouth called
     FORMANTS. Two of them are enough to identify a vowel — F1 tracks roughly
     how open the jaw is, F2 how far forward the tongue sits. So: one
     sawtooth at the pitch of the voice through three parallel bandpass
     filters whose frequencies are automated along the word, and the vowels
     come out. Consonants are not voiced at all — they are noise bursts and
     silences, which `noise()` already makes.

     It will not be mistaken for a person, and it is not meant to be. This is
     an arcade cabinet with a speaker behind a grille; slightly robotic is
     the correct amount of robotic. */

  /* [F1, F2, F3] in Hz, for a deep voice. */
  var VOWEL = {
    er: [490, 1350, 1600],    /* the 'er' of PERFECT — F3 pulled down for the r */
    eh: [560, 1800, 2500],    /* the 'e' of 'fect' */
    oh: [500,  900, 2400],
    ah: [730, 1100, 2450],
    ee: [280, 2250, 2900]
  };

  /* `word` is a list of steps:
       ['v', vowel, dur, gain]        a voiced stretch
       ['n', freq, Q, dur, gain]      a fricative or a plosive burst
       ['s', dur]                     silence  */
  function speak(word, f0, gain) {
    /* PERFECT, K.O. and FIGHT are all spoken from a `setTimeout` fired by an
       SFX cue (see e.g. `sayKO` below), deliberately, so the announcer lands
       a beat after the hit rather than on top of it — but that means a call
       into here can arrive well after the moment that triggered it, once
       the context has been suspended or torn down entirely (the tab went to
       the background, or the page is on its way out — see main.js). Unlike
       `play()`, this does NOT resume a suspended context on the way past:
       a delayed announcer line has already missed the moment it was timed
       to land on, and there is no correct-feeling way to play it late once
       the game itself is not visibly happening any more. Silently dropped,
       same as every other sound cue that never gets the chance to fire
       while the fight is paused. */
    if (!enabled || !ctx || suspended) return;
    var t0 = ctx.currentTime, total = 0, i;
    for (i = 0; i < word.length; i++) {
      total += word[i][0] === 'v' ? word[i][2]
             : (word[i][0] === 'n' ? word[i][3] : word[i][1]);
    }

    /* The buzz, drifting DOWN across the word. A falling pitch is what makes
       a delivery declarative; a flat one sounds like a question. */
    var osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f0 * 1.06, t0);
    osc.frequency.linearRampToValueAtTime(f0 * 0.88, t0 + total);

    var out = ctx.createGain();
    out.gain.value = gain === undefined ? 0.16 : gain;
    out.connect(sfxGain);

    /* One gate in front of the filters: a voiced step opens it, so the buzz
       simply is not there during a consonant. */
    var voiceGate = ctx.createGain();
    voiceGate.gain.setValueAtTime(0.0001, t0);
    osc.connect(voiceGate);

    var bands = [];
    for (i = 0; i < 3; i++) {
      var f = ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = [7, 9, 11][i];
      f.frequency.setValueAtTime(VOWEL.ah[i], t0);
      var fg = ctx.createGain();
      fg.gain.value = [1, 0.62, 0.30][i];
      voiceGate.connect(f); f.connect(fg); fg.connect(out);
      bands.push(f);
    }

    var t = t0;
    for (i = 0; i < word.length; i++) {
      var stp = word[i];
      if (stp[0] === 'v') {
        var vw = VOWEL[stp[1]] || VOWEL.ah;
        var dur = stp[2], g = stp[3] === undefined ? 1 : stp[3];
        for (var b = 0; b < 3; b++) {
          /* Ramped, not stepped. A formant that jumps between two vowels
             clicks, and the GLIDE between them is most of what makes two
             syllables sound like one word. */
          bands[b].frequency.linearRampToValueAtTime(vw[b], t + Math.min(0.045, dur * 0.5));
        }
        voiceGate.gain.setTargetAtTime(g, t, 0.012);
        voiceGate.gain.setTargetAtTime(0.0001, t + dur - 0.012, 0.008);
        t += dur;
      } else if (stp[0] === 'n') {
        noise(stp[3], stp[1], stp[2], stp[4]);
        t += stp[3];
      } else {
        t += stp[1];
      }
    }
    osc.start(t0);
    osc.stop(t + 0.05);
  }

  /* PERFECT: the plosive, the long stressed first syllable, the fricative,
     the short second syllable, and the two stops that close it. The 'r' is
     IN the vowel rather than after it, which is how it works in the accent
     an arcade announcer has. */
  function sayPerfect() {
    speak([
      ['s', 0.010],
      ['n', 1400, 0.7, 0.022, 0.13],     /* P */
      ['v', 'er', 0.235, 1.00],          /* PER — stressed, long */
      ['n', 5200, 0.6, 0.085, 0.055],    /* F */
      ['v', 'eh', 0.135, 0.85],          /* FE */
      ['s', 0.022],
      ['n', 1900, 1.1, 0.030, 0.100],    /* C */
      ['s', 0.030],
      ['n', 3600, 1.3, 0.032, 0.085]     /* T */
    ], 112, 0.62);   /* measured: at 0.20 the announcer sat under the fanfare
                        and could not be made out — see tools/voice.mjs */
  }

  /* K.O. — two letters, said as 'kay oh'. The 'ay' is a DIPHTHONG: it
     starts as one vowel and finishes as another, which this synth gets for
     free because consecutive voiced steps ramp between their formants
     rather than jumping. Said lower and slower than PERFECT; it is the more
     final of the two. */
  function sayKO() {
    speak([
      ['n', 1900, 1.0, 0.026, 0.12],     /* K */
      ['v', 'eh', 0.085, 1.00],          /* -ay, opening... */
      ['v', 'ee', 0.150, 0.95],          /*      ...and closing */
      ['s', 0.045],
      ['v', 'oh', 0.260, 1.00]           /* -O, held */
    ], 104, 0.66);
  }

  /* FIGHT. The fricative, the wide-to-narrow diphthong, and the stop. */
  function sayFight() {
    speak([
      ['n', 5000, 0.6, 0.070, 0.055],    /* F */
      ['v', 'ah', 0.105, 1.00],          /* -igh, opening... */
      ['v', 'ee', 0.130, 0.90],          /*        ...and closing */
      ['s', 0.028],
      ['n', 3600, 1.3, 0.030, 0.090]     /* T */
    ], 118, 0.62);
  }

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
      /* the announcer, after the room has stopped ringing */
      setTimeout(sayKO, 330);
    },
    /* PERFECT. The K.O. is a hit and a room ringing; this is the opposite —
       an upward fanfare, because the round was won cleanly and the sound
       should feel like a reward rather than an impact. Same synthesised
       announcer family as everything else: square leads over a sine body, no
       samples anywhere in this game. */
    perfect: function () {
      tone('square', 660, 660, 0.10, 0.15);
      tone('square', 880, 880, 0.10, 0.14, null, 0.09);
      tone('square', 1320, 1320, 0.26, 0.15, null, 0.18);
      tone('sine', 330, 330, 0.30, 0.10, null, 0.02);
      tone('sine', 440, 660, 0.42, 0.09, null, 0.18);
      /* a little air under it so it does not sound like a menu beep */
      noise(0.30, 2600, 1.4, 0.07);
      /* and the announcer over the top, a beat later, so the fanfare
         announces HIM rather than the two of them fighting for the moment */
      setTimeout(sayPerfect, 160);
    },
    dizzy: function () {
      tone('sine', 760, 320, 0.4, 0.13);
      tone('sine', 980, 430, 0.4, 0.09);
      tone('triangle', 520, 240, 0.45, 0.07);
    },
    /* The round starting. The meow is the cat; the announcer is the cabinet. */
    fight: function () {
      tone('square', 520, 780, 0.10, 0.13);
      SFX.meow();
      setTimeout(sayFight, 120);
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

  /* ---- leaving --------------------------------------------------------

     `startMusic` runs on a plain `setInterval`, deliberately — a stage
     theme has to keep time whether or not a frame gets drawn, so it is not
     tied to requestAnimationFrame or to the game's own pause. That is
     correct while the game is being played and wrong the moment it is not:
     an interval keeps firing forever until something clears it, with no
     regard for whether the page is on screen, in a background tab, or
     sitting hidden inside an artifact panel that was closed without the
     iframe itself being destroyed. "I closed the game but I can still hear
     it" is exactly that — the page never got told to stop.

     `suspend` silences everything immediately, including sound already in
     flight, by suspending the shared AudioContext itself rather than
     hunting down every live oscillator; a suspended context processes
     nothing. `stopMusic` on top of it stops new notes being scheduled at
     all, so there is nothing queued to resume into. `shutdown` is the same
     thing plus closing the context outright, for the moment the page is
     actually going away — a suspended context can still be resumed by
     mistake, a closed one cannot produce sound again until the game
     creates a new one, via `init()`, next time it actually needs to. */
  function suspend() {
    suspended = true;
    stopMusic();
    if (ctx && ctx.state === 'running') { try { ctx.suspend(); } catch (e) {} }
  }
  function resume() {
    suspended = false;
    if (ctx && ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
  }
  function shutdown() {
    suspended = true;
    stopMusic();
    if (ctx) { try { ctx.close(); } catch (e) {} ctx = null; master = null; sfxGain = null; musicGain = null; }
  }

  CF.Audio = {
    init: init, play: play,
    /* The announcer, exposed so it can be MEASURED. Nobody working on this
       game can hear it — the only honest way to know a synthesised vowel is
       the vowel it was meant to be is to render it offline and look at where
       the formant peaks actually landed. `tools/voice.mjs` does exactly
       that. It is also the hook for any future callout. */
    speak: speak, VOWEL: VOWEL,
    /* Drops the audio context so a measuring harness can hand us a fresh
       OfflineAudioContext per word. Nothing in the game calls this. */
    __resetForTest: function () { ctx = null; master = null; sfxGain = null; musicGain = null; },
    speakPerfect: sayPerfect, speakKO: sayKO, speakFight: sayFight,
    startMusic: startMusic, stopMusic: stopMusic, toggleMusic: toggleMusic, setKey: setKey,
    toggleSfx: toggleSfx, setVolume: setVolume,
    suspend: suspend, resume: resume, shutdown: shutdown,
    isMusicOn: function () { return !!musicTimer; },
    isSfxOn: function () { return enabled; }
  };
})();
