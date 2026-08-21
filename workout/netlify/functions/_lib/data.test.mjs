/**
 * node --test netlify/functions/_lib/*.test.mjs
 *
 * Plain Node, no npm, no test framework to install.
 *
 * What is guarded here is the set of things that would be quietly wrong rather
 * than loudly broken: a plan that comes back with six days, a set count of
 * nought, a merge that loses the workout done on the other phone, a video URL
 * that ends up in an iframe with a `javascript:` scheme in it.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  DAYS, emptyPlan, normalisePlan, normaliseHistory, normaliseSession,
  mergeHistory, dropSessions, normaliseSettings, safeUrl,
} from "./data.mjs";

/* ---------- the week ---------- */

test("a plan always comes back as seven days, Monday first", () => {
  const p = normalisePlan({ days: [{ day: "wed", title: "Legs" }] });
  assert.equal(p.days.length, 7);
  assert.deepEqual(p.days.map((d) => d.day), ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
  assert.equal(p.days[2].title, "Legs");
  assert.equal(p.days[0].title, "");
});

test("a plan keyed by day object, not an array, still reads", () => {
  const p = normalisePlan({ days: { sat: { title: "Long walk", minutes: 90 } } });
  assert.equal(p.days[5].title, "Long walk");
  assert.equal(p.days[5].minutes, 90);
});

test("nonsense in gives an empty week out, never a crash", () => {
  for (const junk of [null, undefined, 42, "plan", [], { days: "nope" }]) {
    const p = normalisePlan(junk);
    assert.equal(p.days.length, 7);
  }
  assert.equal(emptyPlan().days.length, DAYS.length);
});

/* ---------- exercises ---------- */

test("sets are clamped to the one-to-ten the owner asked for", () => {
  const of = (sets) => normalisePlan({ days: [{ day: "mon", exercises: [{ name: "Squat", sets }] }] }).days[0].exercises[0].sets;
  assert.equal(of(0), 1);
  assert.equal(of(-5), 1);
  assert.equal(of(11), 10);
  assert.equal(of(1000), 10);
  assert.equal(of(4), 4);
  assert.equal(of("6"), 6);
  assert.equal(of("banana"), 3);      // the default, not NaN
});

test("an exercise with no name is dropped rather than stored blank", () => {
  const day = normalisePlan({
    days: [{ day: "mon", exercises: [{ name: "Push-ups" }, { name: "   " }, { sets: 3 }, null] }],
  }).days[0];
  assert.equal(day.exercises.length, 1);
  assert.equal(day.exercises[0].name, "Push-ups");
});

test("every exercise gets an id, and a given one is kept", () => {
  const day = normalisePlan({
    days: [{ day: "mon", exercises: [{ name: "A" }, { id: "ex_keepme", name: "B" }] }],
  }).days[0];
  assert.match(day.exercises[0].id, /^ex_/);
  assert.equal(day.exercises[1].id, "ex_keepme");
  assert.notEqual(day.exercises[0].id, day.exercises[1].id);
});

test("reps stay free text — 'to failure' is a real answer", () => {
  const ex = normalisePlan({ days: [{ day: "mon", exercises: [{ name: "Plank", reps: "45 seconds" }] }] }).days[0].exercises[0];
  assert.equal(ex.reps, "45 seconds");
});

/* ---------- video links ---------- */

test("only http(s) and same-folder paths survive", () => {
  assert.equal(safeUrl("https://youtu.be/abc123"), "https://youtu.be/abc123");
  assert.equal(safeUrl("videos/squat.mp4"), "videos/squat.mp4");
  assert.equal(safeUrl("/workout/videos/squat.mp4"), "/workout/videos/squat.mp4");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("data:text/html,<script>alert(1)</script>"), "");
  assert.equal(safeUrl(""), "");
  assert.equal(safeUrl(null), "");
});

/* ---------- history ---------- */

const session = (over = {}) => ({
  id: "s_1", day: "mon", title: "Upper body", date: "2026-08-20",
  startedAt: "2026-08-20T15:00:00.000Z", finishedAt: "2026-08-20T15:40:00.000Z",
  elapsedSec: 2400, activeSec: 1500, setsPlanned: 12, setsDone: 12,
  calories: 260, weightLb: 148, complete: true,
  exercises: [{ id: "ex_1", name: "Push-ups", effort: "bodyweight", setsPlanned: 3, setsDone: 3, activeSec: 400 }],
  ...over,
});

test("a session round-trips with its numbers intact", () => {
  const s = normaliseSession(session());
  assert.equal(s.setsDone, 12);
  assert.equal(s.calories, 260);
  assert.equal(s.weightLb, 148);
  assert.equal(s.exercises[0].name, "Push-ups");
  assert.equal(s.complete, true);
});

test("a merge is a union — the other phone's workout is never lost", () => {
  const stored = normaliseHistory({ sessions: [session({ id: "s_phone" })] });
  const merged = mergeHistory(stored, { sessions: [session({ id: "s_ipad", finishedAt: "2026-08-21T16:00:00.000Z" })] });
  assert.deepEqual(merged.sessions.map((s) => s.id), ["s_ipad", "s_phone"]);   // newest first
});

test("sending the same session again corrects it rather than duplicating it", () => {
  const stored = normaliseHistory({ sessions: [session({ setsDone: 9 })] });
  const merged = mergeHistory(stored, { sessions: [session({ setsDone: 12 })] });
  assert.equal(merged.sessions.length, 1);
  assert.equal(merged.sessions[0].setsDone, 12);
});

test("settings are only replaced when they are sent", () => {
  const stored = normaliseHistory({ settings: { weightLb: 143 }, sessions: [] });
  assert.equal(mergeHistory(stored, { sessions: [] }).settings.weightLb, 143);
  assert.equal(mergeHistory(stored, { settings: { weightLb: 139 }, sessions: [] }).settings.weightLb, 139);
});

test("body weight is clamped to something a person could be", () => {
  assert.equal(normaliseSettings({ weightLb: 0 }).weightLb, 40);
  assert.equal(normaliseSettings({ weightLb: 9000 }).weightLb, 700);
  assert.equal(normaliseSettings({}).weightLb, 150);
  assert.equal(normaliseSettings({ countRest: false }).countRest, false);
  assert.equal(normaliseSettings({}).countRest, true);
});

test("deleting a session removes only that one", () => {
  const h = normaliseHistory({ sessions: [session({ id: "a" }), session({ id: "b", finishedAt: "2026-08-19T10:00:00.000Z" })] });
  const after = dropSessions(h, ["a"]);
  assert.deepEqual(after.sessions.map((s) => s.id), ["b"]);
});

test("history survives junk without throwing", () => {
  for (const junk of [null, 7, "sessions", { sessions: "no" }, { sessions: [null, 3, {}] }]) {
    const h = normaliseHistory(junk);
    assert.ok(Array.isArray(h.sessions));
  }
});
