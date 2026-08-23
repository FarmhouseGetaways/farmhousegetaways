/**
 * node --test workout/js/*.test.js
 *
 * The arithmetic behind the insights panel, tested against a hand-built
 * record rather than anything logged for real, so the answers are known in
 * advance.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { computeInsights } from "./insights.js";

const session = (over = {}) => ({
  id: "s_" + Math.random().toString(36).slice(2),
  day: "mon", title: "Workout", date: "2026-08-10",
  startedAt: "2026-08-10T08:00:00Z", finishedAt: "2026-08-10T08:30:00Z",
  elapsedSec: 1800, activeSec: 1200, setsPlanned: 9, setsDone: 9,
  calories: 200, weightLb: 150, complete: true, notes: "",
  exercises: [{ id: "ex_1", name: "Squat", effort: "strength", reps: "10", setsPlanned: 3, setsDone: 3, activeSec: 400 }],
  ...over,
});

test("no sessions is a clean empty state, not a crash", () => {
  const i = computeInsights([]);
  assert.equal(i.empty, true);
  assert.equal(i.totalWorkouts, 0);
  assert.deepEqual(i.badges, []);
});

test("totals add up across sessions", () => {
  const sessions = [
    session({ date: "2026-08-10", setsDone: 9, calories: 200 }),
    session({ date: "2026-08-11", setsDone: 6, calories: 150 }),
  ];
  const i = computeInsights(sessions, new Date("2026-08-12T12:00:00"));
  assert.equal(i.totalWorkouts, 2);
  assert.equal(i.totalSets, 15);
  assert.equal(i.totalCalories, 350);
});

test("the favorite exercise is the one that shows up in the most workouts, not the most sets of it", () => {
  const sessions = [
    session({ date: "2026-08-03", exercises: [{ name: "Squat" }, { name: "Push-up" }] }),
    session({ date: "2026-08-04", exercises: [{ name: "Squat" }] }),
    // Deadlift appears once but with a huge set count inside that one workout —
    // still loses, because "favorite" means "shows up most often", not heaviest day.
    session({ date: "2026-08-05", exercises: [{ name: "Deadlift" }], setsDone: 40 }),
  ];
  const i = computeInsights(sessions, new Date("2026-08-06T12:00:00"));
  assert.equal(i.favorite.name, "Squat");
  assert.equal(i.favorite.count, 2);
});

test("best day of week counts by weekday across all logged dates", () => {
  const sessions = [
    session({ date: "2026-08-03" }),  // Monday
    session({ date: "2026-08-10" }),  // Monday
    session({ date: "2026-08-05" }),  // Wednesday
  ];
  const i = computeInsights(sessions, new Date("2026-08-12T12:00:00"));
  assert.equal(i.bestDay.day, "mon");
  assert.equal(i.bestDay.count, 2);
});

test("longest streak ever finds the best run, even if it is not the current one", () => {
  const sessions = [
    session({ date: "2026-07-01" }), session({ date: "2026-07-02" }),
    session({ date: "2026-07-03" }), session({ date: "2026-07-04" }),   // a 4-day run, long over
    session({ date: "2026-08-10" }), session({ date: "2026-08-11" }),   // a shorter, current run
  ];
  const i = computeInsights(sessions, new Date("2026-08-12T12:00:00"));
  assert.equal(i.longestStreak, 4);
});

test("this week and last week are counted separately, and trend is the difference", () => {
  // 2026-08-12 is a Wednesday; that week's Monday is 2026-08-10.
  const sessions = [
    session({ date: "2026-08-10" }), session({ date: "2026-08-11" }),   // this week: 2
    session({ date: "2026-08-03" }),                                     // last week: 1
  ];
  const i = computeInsights(sessions, new Date("2026-08-12T12:00:00"));
  assert.equal(i.thisWeekCount, 2);
  assert.equal(i.lastWeekCount, 1);
  assert.equal(i.trend, 1);
});

test("a workout dated today counts in this week, not last", () => {
  const sessions = [session({ date: "2026-08-10" })];   // the Monday itself
  const i = computeInsights(sessions, new Date("2026-08-10T09:00:00"));
  assert.equal(i.thisWeekCount, 1);
  assert.equal(i.lastWeekCount, 0);
});

test("consistency is out of the days elapsed so far, not a fixed 30", () => {
  // Only 3 calendar days have happened (Aug 1, 2, 3), and 2 of them have a workout.
  const sessions = [session({ date: "2026-08-01" }), session({ date: "2026-08-02" })];
  const i = computeInsights(sessions, new Date("2026-08-03T09:00:00"));
  assert.equal(i.consistency30, 67);       // 2 of 3 days, rounded
});

test("the longest workout, the biggest burn and the most sets can each be a different session", () => {
  const sessions = [
    session({ date: "2026-08-01", elapsedSec: 3600, calories: 100, setsDone: 5 }),   // longest
    session({ date: "2026-08-02", elapsedSec: 1200, calories: 500, setsDone: 8 }),   // biggest burn
    session({ date: "2026-08-03", elapsedSec: 1800, calories: 200, setsDone: 20 }),  // most sets
  ];
  const i = computeInsights(sessions, new Date("2026-08-04T12:00:00"));
  assert.equal(i.longestWorkout.date, "2026-08-01");
  assert.equal(i.biggestBurn.date, "2026-08-02");
  assert.equal(i.mostSets.date, "2026-08-03");
});

test("badges appear only once actually earned, and stack up in order", () => {
  const sessions = Array.from({ length: 5 }, (_, n) =>
    session({ date: `2026-08-0${n + 1}`, calories: 100 }));
  const i = computeInsights(sessions, new Date("2026-08-06T12:00:00"));
  const labels = i.badges.map((b) => b.label);
  assert.ok(labels.includes("First workout logged"));
  assert.ok(labels.includes("5 workouts"));
  assert.ok(!labels.includes("10 workouts"));       // not yet earned
});

test("a single session earns the first-workout badge and nothing streak-related past one day", () => {
  const i = computeInsights([session({ date: "2026-08-01" })], new Date("2026-08-01T12:00:00"));
  assert.equal(i.longestStreak, 1);
  const labels = i.badges.map((b) => b.label);
  assert.ok(labels.includes("First workout logged"));
  assert.ok(!labels.includes("3 days in a row"));
});
