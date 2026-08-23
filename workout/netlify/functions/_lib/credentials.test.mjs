/**
 * node --test workout/netlify/functions/_lib/*.test.mjs
 *
 * Password hashing and email validation, tested directly. The store-backed
 * parts of the account system (_lib/users.mjs's createUser, findByEmail,
 * sessions) go untested here for the same reason _lib/auth.mjs's admin
 * equivalents are: they need a live Blobs store, which this suite
 * deliberately runs without.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { hashPassword, verifyPassword, passwordStrongEnough, validEmail, normaliseEmail } from "./credentials.mjs";

test("a password verifies against its own hash", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
});

test("a different password does not verify", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("wrong password entirely", hash), false);
});

test("two hashes of the same password are not equal — the salt is random", async () => {
  const a = await hashPassword("same password");
  const b = await hashPassword("same password");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("same password", a), true);
  assert.equal(await verifyPassword("same password", b), true);
});

test("verifyPassword refuses nonsense instead of throwing", async () => {
  assert.equal(await verifyPassword("anything", ""), false);
  assert.equal(await verifyPassword("anything", null), false);
  assert.equal(await verifyPassword("anything", "not-a-hash-at-all"), false);
  assert.equal(await verifyPassword("anything", "zz:zz"), false);       // hex-shaped check, not hex
});

test("password strength is at least eight characters", () => {
  assert.equal(passwordStrongEnough("short7"), false);
  assert.equal(passwordStrongEnough("exactly8"), true);
  assert.equal(passwordStrongEnough(""), false);
  assert.equal(passwordStrongEnough(undefined), false);
});

test("email validation accepts an ordinary address", () => {
  assert.equal(validEmail("carissa@example.com"), true);
});

test("email validation rejects what is not an address", () => {
  assert.equal(validEmail(""), false);
  assert.equal(validEmail("not an email"), false);
  assert.equal(validEmail("missing-at-sign.com"), false);
  assert.equal(validEmail("two@@signs.com"), false);
  assert.equal(validEmail("a".repeat(201) + "@example.com"), false);   // the length cap
});

test("email is normalised before it is ever compared or stored", () => {
  assert.equal(normaliseEmail("  Carissa@Example.COM  "), "carissa@example.com");
});
