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

const out = await page.evaluate(async () => {
  const SR = 48000, LEN = Math.floor(SR * 1.0);
  const off = new OfflineAudioContext(1, LEN, SR);
  /* audio.js builds its context from window.AudioContext on first use, so
     handing it the offline one is enough to capture the whole graph. */
  window.AudioContext = function () { return off; };
  window.webkitAudioContext = window.AudioContext;
  CF.Audio.init();
  CF.Audio.speakPerfect();
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
  return {
    peak,
    voiced: env.filter(e => e.rms > peak * 0.25).map(e => +e.t.toFixed(3)),
    per:  peaks(0.075, 0.16),   /* inside the long first syllable */
    fect: peaks(0.375, 0.10),   /* inside the short second syllable */
    vowels: CF.Audio.VOWEL
  };
});
await browser.close();
if (errs.length) { console.error('page errors:', errs); process.exit(1); }

const near = (got, want, tol) => Math.abs(got - want) <= tol;
console.log('peak amplitude:', out.peak.toFixed(4));
if (out.peak < 0.005) { console.error('THE VOICE IS SILENT'); process.exit(1); }

const span = out.voiced.length ? `${out.voiced[0]}s .. ${out.voiced[out.voiced.length - 1]}s` : 'none';
console.log('voiced from', span);

for (const [name, want] of [['PER', out.vowels.er], ['FECT', out.vowels.eh]]) {
  const got = (name === 'PER' ? out.per : out.fect);
  console.log(`\n${name}: aimed F1=${want[0]} F2=${want[1]}`);
  console.log('  peaks found:', got.map(p => `${p.f}Hz`).join(', '));
  const f1 = got.find(p => near(p.f, want[0], 160));
  const f2 = got.find(p => near(p.f, want[1], 300));
  console.log('  F1', f1 ? `OK (${f1.f}Hz)` : 'NOT FOUND');
  console.log('  F2', f2 ? `OK (${f2.f}Hz)` : 'NOT FOUND');
}
