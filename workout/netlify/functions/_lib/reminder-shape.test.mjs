/**
 * node --test workout/netlify/functions/_lib/*.test.mjs
 *
 * The admin reminder schedule's arithmetic: which hour and message actually
 * apply, with no Blobs store involved.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { normaliseConfig, effectiveFor, messageFor, clampHour, DEFAULT_MESSAGE, DEFAULT_HOUR } from "./reminder-shape.mjs";

test("a fresh config defaults to 8am, enabled, every hour using the default message", () => {
  const cfg = normaliseConfig(null);
  assert.equal(cfg.default.enabled, true);
  assert.equal(cfg.default.hour, DEFAULT_HOUR);
  assert.equal(Object.keys(cfg.messages).length, 24);
  for (let h = 0; h < 24; h++) assert.equal(messageFor(cfg.messages, h), DEFAULT_MESSAGE);
});

test("an account with no override follows the site default", () => {
  const cfg = normaliseConfig({ default: { enabled: true, hour: 6 } });
  assert.deepEqual(effectiveFor(cfg, null), { enabled: true, hour: 6 });
  assert.deepEqual(effectiveFor(cfg, undefined), { enabled: true, hour: 6 });
});

test("an account's own override beats the site default", () => {
  const cfg = normaliseConfig({ default: { enabled: true, hour: 8 } });
  assert.deepEqual(effectiveFor(cfg, { enabled: true, hour: 20 }), { enabled: true, hour: 20 });
});

test("an override can turn reminders off for one account while the default stays on", () => {
  const cfg = normaliseConfig({ default: { enabled: true, hour: 8 } });
  assert.deepEqual(effectiveFor(cfg, { enabled: false, hour: 8 }), { enabled: false, hour: 8 });
});

test("a custom message for one hour does not touch any other hour", () => {
  const cfg = normaliseConfig({ messages: { 6: "Rise and grind!" } });
  assert.equal(messageFor(cfg.messages, 6), "Rise and grind!");
  assert.equal(messageFor(cfg.messages, 7), DEFAULT_MESSAGE);
  assert.equal(messageFor(cfg.messages, 20), DEFAULT_MESSAGE);
});

test("a blank or whitespace-only custom message falls back to the default, not an empty notification", () => {
  const cfg = normaliseConfig({ messages: { 9: "   " } });
  assert.equal(messageFor(cfg.messages, 9), DEFAULT_MESSAGE);
});

test("hour is clamped into range, never out of bounds", () => {
  assert.equal(clampHour(30, 8), 23);
  assert.equal(clampHour(-5, 8), 0);
  assert.equal(clampHour("not a number", 8), 8);
  assert.equal(clampHour(14.6, 8), 15);
});

test("messages are capped in length rather than allowed to grow without bound", () => {
  const cfg = normaliseConfig({ messages: { 8: "x".repeat(500) } });
  assert.equal(cfg.messages[8].length, 200);
});
