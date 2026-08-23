/**
 * node --test workout/netlify/functions/_lib/*.test.mjs
 *
 * The claim checks a verified Google ID token still has to pass — tested on
 * their own, without the network call or the RSA signature check, because
 * getting one of these wrong is a security hole that only shows up once it
 * already is one: the wrong audience accepted, an expired token honoured, an
 * unverified email trusted as if it were confirmed.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { validateClaims } from "./google.mjs";

const CLIENT_ID = "123-abc.apps.googleusercontent.com";

const claims = (over = {}) => ({
  aud: CLIENT_ID,
  iss: "https://accounts.google.com",
  exp: Math.floor(Date.now() / 1000) + 3600,
  email: "carissa@example.com",
  email_verified: true,
  sub: "10987654321",
  name: "Carissa",
  ...over,
});

test("a token issued for this app, from Google, unexpired, with a verified email passes", () => {
  assert.equal(validateClaims(claims(), CLIENT_ID), null);
});

test("a token issued for a different app is refused", () => {
  assert.notEqual(validateClaims(claims({ aud: "someone-elses-client-id" }), CLIENT_ID), null);
});

test("the bare issuer, without the https:// Google also uses, is accepted", () => {
  assert.equal(validateClaims(claims({ iss: "accounts.google.com" }), CLIENT_ID), null);
});

test("a token not from Google is refused", () => {
  assert.notEqual(validateClaims(claims({ iss: "https://evil.example" }), CLIENT_ID), null);
});

test("an expired token is refused, even with everything else right", () => {
  assert.notEqual(validateClaims(claims({ exp: Math.floor(Date.now() / 1000) - 10 }), CLIENT_ID), null);
});

test("a token missing exp entirely is refused, not treated as never-expiring", () => {
  assert.notEqual(validateClaims(claims({ exp: undefined }), CLIENT_ID), null);
});

test("an unverified email is refused, however plausible it looks", () => {
  assert.notEqual(validateClaims(claims({ email_verified: false }), CLIENT_ID), null);
});

test("a token with no email at all is refused", () => {
  assert.notEqual(validateClaims(claims({ email: undefined }), CLIENT_ID), null);
});

test("a token with no subject id is refused", () => {
  assert.notEqual(validateClaims(claims({ sub: undefined }), CLIENT_ID), null);
});

test("nonsense in place of a payload is refused rather than thrown on", () => {
  assert.notEqual(validateClaims(null, CLIENT_ID), null);
  assert.notEqual(validateClaims(undefined, CLIENT_ID), null);
  assert.notEqual(validateClaims("not an object", CLIENT_ID), null);
});
