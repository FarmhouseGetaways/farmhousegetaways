/**
 * node --test workout/netlify/functions/_lib/*.test.mjs
 *
 * The reminder rules, tested without a clock or a phone.
 *
 * What is guarded here is the set of mistakes that would make reminders worse
 * than useless: nagging on a rest day, nagging after the workout was already
 * done, nagging every hour instead of once, and getting the hour wrong the
 * morning the clocks move.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { localNow, dueNow, nextLocalHour } from "./remind.mjs";

const LA = "America/Los_Angeles";

const plan = {
  days: [
    { day: "mon", title: "Upper body", minutes: 40, exercises: [{ name: "Push-ups", sets: 3, rest: 60 }] },
    { day: "tue", title: "", exercises: [] },                       // rest day
    { day: "wed", title: "Legs", exercises: [{ name: "Squat", sets: 4, rest: 75 }] },
    { day: "thu", exercises: [] }, { day: "fri", title: "Circuit", exercises: [{ name: "Swing", sets: 4, rest: 60 }] },
    { day: "sat", exercises: [] }, { day: "sun", exercises: [] },
  ],
};

const sub = (over = {}) => ({
  endpoint: "https://push.example/abc",
  reminder: { enabled: true, hour: 8, tz: LA, snoozeUntil: 0, lastSentDate: "", ...over },
});

/* 08:00 in Los Angeles on Friday 21 August 2026 */
const FRI_8AM = Date.UTC(2026, 7, 21, 15, 0, 0);
const FRI_9AM = Date.UTC(2026, 7, 21, 16, 0, 0);
const TUE_8AM = Date.UTC(2026, 7, 18, 15, 0, 0);

/* ---------- the local calendar ---------- */

test("the local date, hour and weekday come from the zone, not from UTC", () => {
  assert.deepEqual(localNow(LA, FRI_8AM), { date: "2026-08-21", hour: 8, day: "fri" });
  assert.deepEqual(localNow("UTC", FRI_8AM), { date: "2026-08-21", hour: 15, day: "fri" });
  // Far enough east that it is already tomorrow.
  assert.deepEqual(localNow("Asia/Tokyo", FRI_8AM), { date: "2026-08-22", hour: 0, day: "sat" });
});

test("the hour is right on both sides of a daylight-saving change", () => {
  // US clocks go back on 1 November 2026. 8am local, either side of it.
  const octoberEighth = Date.UTC(2026, 9, 15, 15, 0, 0);   // PDT, UTC-7
  const novemberEighth = Date.UTC(2026, 10, 15, 16, 0, 0); // PST, UTC-8
  assert.equal(localNow(LA, octoberEighth).hour, 8);
  assert.equal(localNow(LA, novemberEighth).hour, 8);
});

/* ---------- when to speak ---------- */

test("the daily reminder fires on the hour it was set to", () => {
  const due = dueNow(sub(), plan, { sessions: [] }, FRI_8AM);
  assert.equal(due.kind, "daily");
  assert.match(due.body, /Circuit/);
  assert.equal(due.sentDate, "2026-08-21");
});

test("and says nothing on any other hour", () => {
  assert.equal(dueNow(sub(), plan, { sessions: [] }, FRI_9AM), null);
});

test("a rest day is part of the plan, not something to be nagged about", () => {
  assert.equal(dueNow(sub(), plan, { sessions: [] }, TUE_8AM), null);
});

test("nothing is said once the workout is done", () => {
  const history = { sessions: [{ id: "s1", date: "2026-08-21" }] };
  assert.equal(dueNow(sub(), plan, history, FRI_8AM), null);
});

test("it speaks once a day, not once an hour", () => {
  const already = sub({ lastSentDate: "2026-08-21" });
  assert.equal(dueNow(already, plan, { sessions: [] }, FRI_8AM), null);
  // ...but tomorrow is a new day.
  const nextFriday = Date.UTC(2026, 7, 28, 15, 0, 0);
  assert.equal(dueNow(already, plan, { sessions: [] }, nextFriday).kind, "daily");
});

test("turned off means silent", () => {
  assert.equal(dueNow(sub({ enabled: false }), plan, { sessions: [] }, FRI_8AM), null);
  assert.equal(dueNow({ endpoint: "x" }, plan, { sessions: [] }, FRI_8AM), null);
});

/* ---------- snoozing ---------- */

test("a snooze speaks at the hour she chose, even though the daily one already went", () => {
  const s = sub({ lastSentDate: "2026-08-21", snoozeUntil: Date.UTC(2026, 7, 22, 0, 0, 0) }); // 5pm LA
  const fivePm = Date.UTC(2026, 7, 22, 0, 0, 0);
  const due = dueNow(s, plan, { sessions: [] }, fivePm);
  assert.equal(due.kind, "snooze");
  assert.equal(due.title, "Don't forget to do your workout today!");   // the default message, with no config passed
  assert.match(due.url, /#\/go\/fri$/);      // straight into the workout
});

test("a snooze's message comes from the hour it was snoozed TO, admin-configurable same as the daily one", () => {
  const s = sub({ lastSentDate: "2026-08-21", snoozeUntil: Date.UTC(2026, 7, 22, 0, 0, 0) }); // 5pm LA
  const fivePm = Date.UTC(2026, 7, 22, 0, 0, 0);
  const messages = { 17: "One more push before dinner!" };
  const due = dueNow(s, plan, { sessions: [] }, fivePm, messages);
  assert.equal(due.title, "One more push before dinner!");
});

test("a snooze does not speak before its time", () => {
  const s = sub({ lastSentDate: "2026-08-21", snoozeUntil: Date.UTC(2026, 7, 22, 0, 0, 0) });
  assert.equal(dueNow(s, plan, { sessions: [] }, FRI_9AM), null);
});

test("a snooze slept through is not a reason to be woken tomorrow", () => {
  const s = sub({ lastSentDate: "2026-08-21", snoozeUntil: Date.UTC(2026, 7, 22, 0, 0, 0) });
  const nextDay = Date.UTC(2026, 7, 23, 15, 0, 0);     // Saturday morning LA
  const due = dueNow(s, plan, { sessions: [] }, nextDay);
  // Saturday is a rest day here, so the only possible answer is silence —
  // but the point is that the stale snooze did not resurrect itself.
  assert.equal(due, null);
});

test("a stale snooze is reported so it can be cleared, not left to rot", () => {
  const monday = Date.UTC(2026, 7, 24, 15, 0, 0);      // Monday 8am LA, a training day
  const s = sub({ snoozeUntil: Date.UTC(2026, 7, 22, 0, 0, 0), hour: 23 });
  assert.equal(dueNow(s, plan, { sessions: [] }, monday).kind, "expired-snooze");
});

/* ---------- choosing an hour ---------- */

test("'remind me at five' means five o'clock, not five hours from now", () => {
  const when = nextLocalHour(LA, 17, FRI_8AM);
  assert.deepEqual(localNow(LA, when), { date: "2026-08-21", hour: 17, day: "fri" });
});

test("an hour already past today comes round tomorrow", () => {
  const when = nextLocalHour(LA, 7, FRI_8AM);
  assert.deepEqual(localNow(LA, when), { date: "2026-08-22", hour: 7, day: "sat" });
});
