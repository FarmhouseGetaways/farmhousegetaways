import { test } from "node:test";
import assert from "node:assert/strict";
import { isAdminEmail } from "./admin-emails.mjs";

test("the designated admin address is recognised", () => {
  assert.equal(isAdminEmail("corydzbinski@gmail.com"), true);
});

test("case and surrounding whitespace never matter", () => {
  assert.equal(isAdminEmail("CoryDzbinski@Gmail.com"), true);
  assert.equal(isAdminEmail("  corydzbinski@gmail.com  "), true);
});

test("everyone else is not an admin", () => {
  assert.equal(isAdminEmail("carissa@example.com"), false);
  assert.equal(isAdminEmail(""), false);
  assert.equal(isAdminEmail(undefined), false);
  assert.equal(isAdminEmail(null), false);
});
