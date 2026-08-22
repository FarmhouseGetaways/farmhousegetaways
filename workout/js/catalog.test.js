/**
 * node --test workout/js/*.test.js
 *
 * The arithmetic the record is built on, tested on its own.
 *
 * This module is loaded by a browser but it is pure — no DOM, no storage — so
 * it can be run here, and it should be: the calorie estimate is the number a
 * person will judge their week by, and a wrong one is worse than none.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  kcalFor, sessionCalories, metOf, effortLabel, videoSource,
  clock, duration, todayKey, dayKeyOf, REST_PER_SET_CAP,
} from "./catalog.js";

const session = (over = {}) => ({
  elapsedSec: 40 * 60,
  setsDone: 15,
  exercises: [
    { effort: "bodyweight", activeSec: 300 },
    { effort: "strength", activeSec: 400 },
    { effort: "strength", activeSec: 400 },
    { effort: "core", activeSec: 200 },
  ],
  ...over,
});

/* ---------- the MET equation itself ---------- */

test("the MET equation matches the published formula", () => {
  // 8 METs, 30 minutes, 150 lb (68.04 kg): 8 x 3.5 x 68.04 / 200 x 30
  assert.equal(Math.round(kcalFor({ met: 8, seconds: 1800, weightLb: 150 })), 286);
});

test("nothing in, nothing out", () => {
  assert.equal(kcalFor({ met: 8, seconds: 0, weightLb: 150 }), 0);
  assert.equal(kcalFor({ met: 0, seconds: 1800, weightLb: 150 }), 0);
  assert.equal(kcalFor({ met: 8, seconds: 1800, weightLb: 0 }), 0);
  assert.equal(kcalFor({ met: NaN, seconds: NaN, weightLb: NaN }), 0);
});

test("heavier means more, for the same work", () => {
  const light = sessionCalories(session(), { weightLb: 120 });
  const heavy = sessionCalories(session(), { weightLb: 200 });
  assert.ok(heavy > light, `${heavy} should exceed ${light}`);
});

/* ---------- the abandoned-phone case ---------- */

test("a phone left running overnight cannot invent a day of calories", () => {
  const honest = sessionCalories(session(), { weightLb: 150, countRest: true });
  const forgotten = sessionCalories(session({ elapsedSec: 9 * 3600 }), { weightLb: 150, countRest: true });

  // Before the cap this was 181 against 1253. The forgotten one may be a
  // little higher — it did sit there — but not by an order of magnitude.
  assert.ok(forgotten < honest * 1.6,
    `a forgotten timer logged ${forgotten} against an honest ${honest}`);
});

test("rest is credited at no more than three minutes a set", () => {
  const s = session({ elapsedSec: 24 * 3600, setsDone: 2 });
  const capped = sessionCalories(s, { weightLb: 150, countRest: true });
  const working = sessionCalories({ ...s, elapsedSec: 0 }, { weightLb: 150, countRest: true });
  const restOnly = capped - working;
  const most = kcalFor({ met: 1.8, seconds: REST_PER_SET_CAP * 2, weightLb: 150 });
  assert.ok(restOnly <= Math.ceil(most) + 1, `${restOnly} credited, ceiling is ${Math.ceil(most)}`);
});

test("a workout with no sets done credits no rest at all", () => {
  const s = session({ setsDone: 0, elapsedSec: 3 * 3600, exercises: [] });
  assert.equal(sessionCalories(s, { weightLb: 150, countRest: true }), 0);
});

test("an ordinary session is untouched by the cap", () => {
  // 40 minutes, 15 sets: the cap is 45 minutes of rest, well above the 18 real.
  assert.equal(sessionCalories(session(), { weightLb: 150, countRest: true }), 181);
});

test("turning rest off leaves only the working time", () => {
  const withRest = sessionCalories(session(), { weightLb: 150, countRest: true });
  const without = sessionCalories(session(), { weightLb: 150, countRest: false });
  assert.ok(without < withRest);
  assert.equal(without, sessionCalories(session({ elapsedSec: 0 }), { weightLb: 150, countRest: true }));
});

/* ---------- effort ---------- */

test("an unknown effort falls back rather than returning nothing", () => {
  assert.equal(metOf("not-a-real-effort"), metOf("strength"));
  assert.ok(effortLabel("not-a-real-effort"));
});

test("the bodyweight label names no particular exercise", () => {
  assert.equal(effortLabel("bodyweight"), "Bodyweight");
});

/* ---------- the rest of the vocabulary ---------- */

test("videos are recognised, and anything dangerous is not", () => {
  assert.equal(videoSource("https://youtu.be/abc123").kind, "embed");
  assert.equal(videoSource("https://vimeo.com/123456789").kind, "embed");
  assert.equal(videoSource("/media/deadbeef.mp4").kind, "file");
  assert.equal(videoSource("").kind, "none");
});

test("no scheme this app does not serve itself ever reaches the page", () => {
  // Each of these would otherwise have become a live <a href> or an iframe src.
  for (const hostile of [
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "blob:https://example.com/abc",
  ]) {
    assert.equal(videoSource(hostile).kind, "none", hostile + " should be refused");
  }
  // ...while the paths the app really uses still work.
  assert.equal(videoSource("/media/deadbeef.mp4").kind, "file");
  assert.equal(videoSource("videos/squat.mp4").kind, "file");
  assert.equal(videoSource("https://example.com/clip.mp4").kind, "file");
});

test("a YouTube embed can be told to pause", () => {
  // enablejsapi is the difference between a working Pause button and a lie.
  assert.match(videoSource("https://youtu.be/abc123").src, /enablejsapi=1/);
});

test("clocks and durations read like a person wrote them", () => {
  assert.equal(clock(0), "0:00");
  assert.equal(clock(65), "1:05");
  assert.equal(clock(3725), "1:02:05");
  assert.equal(duration(20), "under a minute");
  assert.equal(duration(30), "1 min");        // rounds up, which is what a person would say
  assert.equal(duration(2400), "40 min");
  assert.equal(duration(3900), "1 hr 5 min");
  assert.equal(duration(7200), "2 hr");
});

test("today is local, not UTC — an evening workout is not tomorrow's", () => {
  const evening = new Date(2026, 7, 21, 22, 30);
  assert.equal(todayKey(evening), "2026-08-21");
  assert.equal(dayKeyOf(new Date(2026, 7, 21)), "fri");
  assert.equal(dayKeyOf(new Date(2026, 7, 23)), "sun");   // Sunday is last, not first
});
