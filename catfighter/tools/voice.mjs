/* Render the announcer offline and MEASURE it.
 *
 *     node tools/voice.mjs
 *
 * Nobody working on this game can hear it. A synthesised vowel is only the
 * vowel it was meant to be if its formants land where they were aimed, so
 * this renders the word through an OfflineAudioContext, walks an envelope
 * over it to find the voiced stretches, and runs a Goertzel sweep over each
 * one to find where the spectral peaks actually are. If F1 and F2 come back
 * near the table in audio.js, the vowel is that vowel.
 */
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXE = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
             '/opt/pw-browsers/chromium/chrome'].find(existsSync);

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto('file://' + join(ROOT, 'index.html'), { waitUntil: 'load' });
await page.waitForTimeout(400);

/* Every callout, and the vowels each one is aiming at. A diphthong is
   listed by the vowel it FINISHES on, because that is what the measurement
   window at the end of the syllable will see. */
const WORDS = [
  { call: 'speakPerfect', name: 'PERFECT',
    at: [['PER', 0.075, 0.16, 'er'], ['FECT', 0.375, 0.10, 'eh']] },
  { call: 'speakKO', name: 'K.O.',
    at: [['KAY', 0.150, 0.08, 'ee'], ['OH', 0.330, 0.20, 'oh']] },
  { call: 'speakFight', name: 'FIGHT',
    at: [['FIGH', 0.075, 0.08, 'ah'], ['-T', 0.150, 0.07, 'ee']] }
];

const out = await page.evaluate(async (WORDS) => {
  const SR = 48000, LEN = Math.floor(SR * 1.0);
  const results = [];
  for (const w of WORDS) {
    const r = await one(w);
    results.push(r);
  }
  return { results, vowels: CF.Audio.VOWEL };

  async function one(w) {
  const off = new OfflineAudioContext(1, LEN, SR);
  /* audio.js builds its context from window.AudioContext on first use, so
     handing it the offline one is enough to capture the whole graph. Each
     word needs a fresh module state, which `__resetForTest` gives us — see
     the note in audio.js. */
  window.AudioContext = function () { return off; };
  window.webkitAudioContext = window.AudioContext;
  CF.Audio.__resetForTest();
  CF.Audio.init();
  CF.Audio[w.call]();
  const buf = await off.startRendering();
  const d = Array.from(buf.getChannelData(0));

  /* RMS envelope, 5ms windows */
  const win = Math.floor(SR * 0.005);
  const env = [];
  for (let i = 0; i + win < d.length; i += win) {
    let s = 0;
    for (let k = 0; k < win; k++) s += d[i + k] * d[i + k];
    env.push({ t: i / SR, rms: Math.sqrt(s / win) });
  }

  /* Goertzel magnitude at one frequency over a slice */
  function mag(from, n, f) {
    const w = 2 * Math.PI * f / SR, c = 2 * Math.cos(w);
    let s0 = 0, s1 = 0, s2 = 0;
    for (let i = 0; i < n; i++) {
      s0 = d[from + i] + c * s1 - s2;
      s2 = s1; s1 = s0;
    }
    return Math.sqrt(s1 * s1 + s2 * s2 - c * s1 * s2) / n;
  }

  /* the spectrum of a slice, and its strongest peaks under 3kHz */
  function peaks(tSec, durSec) {
    const from = Math.floor(tSec * SR), n = Math.floor(durSec * SR);
    const spec = [];
    for (let f = 200; f <= 3000; f += 20) spec.push([f, mag(from, n, f)]);
    const found = [];
    for (let i = 2; i < spec.length - 2; i++) {
      if (spec[i][1] > spec[i - 1][1] && spec[i][1] > spec[i + 1][1] &&
          spec[i][1] > spec[i - 2][1] && spec[i][1] > spec[i + 2][1]) {
        found.push({ f: spec[i][0], m: spec[i][1] });
      }
    }
    found.sort((a, b) => b.m - a.m);
    return found.slice(0, 6);
  }

  const peak = Math.max(...env.map(e => e.rms));
  const voiced = env.filter(e => e.rms > peak * 0.25).map(e => +e.t.toFixed(3));
  return {
    name: w.name, peak,
    span: voiced.length ? [voiced[0], voiced[voiced.length - 1]] : null,
    syllables: w.at.map(([label, t, dur, vowel]) => ({
      label, vowel, peaks: peaks(t, dur)
    }))
  };
  }
}, WORDS);
await browser.close();
if (errs.length) { console.error('page errors:', errs); process.exit(1); }

const near = (got, want, tol) => Math.abs(got - want) <= tol;
let bad = 0;
for (const r of out.results) {
  console.log(`\n== ${r.name} ==`);
  console.log('  peak amplitude:', r.peak.toFixed(4),
              r.peak < 0.005 ? '  *** SILENT ***' : '');
  if (r.peak < 0.005) { bad++; continue; }
  console.log('  voiced', r.span ? `${r.span[0]}s .. ${r.span[1]}s` : 'never');
  for (const sy of r.syllables) {
    const want = out.vowels[sy.vowel];
    const f1 = sy.peaks.find(p => near(p.f, want[0], 170));
    const f2 = sy.peaks.find(p => near(p.f, want[1], 320));
    console.log(`  ${sy.label.padEnd(5)} aimed F1=${String(want[0]).padStart(4)} ` +
                `F2=${String(want[1]).padStart(4)}   ` +
                `F1 ${f1 ? 'OK ' + f1.f : 'MISSING'}   F2 ${f2 ? 'OK ' + f2.f : 'MISSING'}`);
    if (!f1 || !f2) bad++;
  }
}
if (bad) { console.error(`\n${bad} formant(s) did not land where they were aimed`); process.exit(1); }
console.log('\nevery callout is audible and says the vowels it meant to');
