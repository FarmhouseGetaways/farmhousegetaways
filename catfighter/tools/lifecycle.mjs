/* Verify the game actually stops making noise when it is not the thing on
 * screen — "I closed the game but I can still hear it in the background"
 * was a real bug, and the only honest way to know it stays fixed is to
 * drive a real page through the same events a browser fires and check what
 * audio.js is actually doing, not assume it from reading the code.
 *
 *     node tools/lifecycle.mjs
 *
 * `document.hidden` and `visibilitychange` can be simulated in a script but
 * not truly forced by a test harness from outside the page, so this drives
 * them from the inside: `Object.defineProperty(document, 'hidden', ...)`
 * plus a dispatched event, which is exactly what main.js's own listener
 * reacts to and is indistinguishable from the real thing as far as that
 * listener can tell.
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
  const g = window.CF.game;
  CF.Audio.init();
  g.startMatch(CF.ROSTER[0], CF.ROSTER[1], 0, 'versus');
  for (let i = 0; i < 100; i++) g.step();   // clear the intro, into real play
  const timeAtStart = g.timeLeft;

  const results = { start: { scene: g.scene, roundState: g.roundState, musicOn: CF.Audio.isMusicOn() } };

  const setHidden = (v) => {
    Object.defineProperty(document, 'hidden', { value: v, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  };

  /* An announcer line in flight when the tab is hidden must not crash and
     must not be heard late — this is exactly how "closed the game, still
     hear it" was reproduced: a setTimeout callback reaching into an
     AudioContext that visibilitychange had already suspended or, worse,
     that a later pagehide had already closed to null. */
  g.p2.health = 0;
  g.endRound(g.p1, 'ko');          // schedules sayKO ~330ms out
  setHidden(true);
  await new Promise(r => setTimeout(r, 20));
  results.hidden = { musicOn: CF.Audio.isMusicOn(), paused: g.paused };

  for (let i = 0; i < 60; i++) g.step();     // the round must not progress
  results.timeFrozen = (g.timeLeft === timeAtStart);

  await new Promise(r => setTimeout(r, 400)); // let the pending sayKO fire, hidden
  results.survivedPendingAnnouncer = true;    // reached this line without pageerror

  setHidden(false);
  await new Promise(r => setTimeout(r, 20));
  results.visible = { musicOn: CF.Audio.isMusicOn(), paused: g.paused };

  window.dispatchEvent(new Event('pagehide'));
  await new Promise(r => setTimeout(r, 20));
  results.pagehide = { musicOn: CF.Audio.isMusicOn() };

  /* the same crash risk again, on the far side of a full shutdown */
  CF.Audio.speakKO();
  results.survivedSpeakAfterShutdown = true;

  return results;
});

await browser.close();

let bad = 0;
function check(label, cond) {
  console.log((cond ? 'OK  ' : 'FAIL') + '  ' + label);
  if (!cond) bad++;
}

if (errs.length) {
  console.error('PAGE ERRORS (this is the crash the fix exists to prevent):');
  for (const e of errs) console.error('  ' + e);
  process.exit(1);
}

check('music was playing mid-round', out.start.musicOn === true);
check('hiding the tab silences music immediately', out.hidden.musicOn === false);
check('hiding the tab auto-pauses the fight', out.hidden.paused === true);
check('the round timer does not advance while hidden and paused', out.timeFrozen === true);
check('a pending announcer line does not crash while hidden', out.survivedPendingAnnouncer === true);
check('coming back resumes the stage music', out.visible.musicOn === true);
check('coming back leaves the match paused for the player to resume', out.visible.paused === true);
check('pagehide silences music outright', out.pagehide.musicOn === false);
check('speaking after a full shutdown is a safe no-op, not a crash', out.survivedSpeakAfterShutdown === true);

if (bad) { console.error(`\n${bad} check(s) failed`); process.exit(1); }
console.log('\nthe game stays quiet once it is not the thing on screen');
