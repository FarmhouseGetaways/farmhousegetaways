import test from "node:test";
import assert from "node:assert/strict";
import { encode, tolerant, applyToPage, swapImage } from "./edits.mjs";

/* ---------- the bug that shipped ---------- */

test("ordinary spaces stay ordinary", () => {
  // The entity table once mapped " " to &nbsp;, so every space in an edited
  // paragraph came out non-breaking and the line would not wrap. This is the
  // guard on that: a plain sentence must survive encoding unchanged.
  assert.equal(encode("A pool table, shuffleboard, air hockey"),
                      "A pool table, shuffleboard, air hockey");
});

test("no &nbsp; is ever written", () => {
  assert.ok(!encode("one two three").includes("&nbsp;"));
});

test("non-breaking spaces from the browser are flattened", () => {
  // contenteditable inserts U+00A0 freely. Nobody means one; left in, they
  // stop the line wrapping just as the old bug did.
  assert.equal(encode("a b c"), "a b c");
});

/* ---------- entity style ---------- */

test("house entities are applied", () => {
  assert.equal(encode("Cory — and Carissa"), "Cory &mdash; and Carissa");
  assert.equal(encode("It’s ready"), "It&rsquo;s ready");
  assert.equal(encode("a 150” screen"), "a 150&rdquo; screen");
});

test("ampersands and angle brackets are escaped, and not twice", () => {
  assert.equal(encode("Cory & Carissa"), "Cory &amp; Carissa");
  assert.equal(encode("<script>"), "&lt;script&gt;");
});

test("deliberate line breaks become <br>", () => {
  assert.equal(encode("Chemical-free land.\nRed Barn Ranch."),
                      "Chemical-free land.<br>\nRed Barn Ranch.");
});

/* ---------- matching what is already on the page ---------- */

test("matches text whether the source used a character or its entity", () => {
  const html = "<p>Cory &mdash; and Carissa</p>";
  assert.match(html, new RegExp(tolerant("Cory — and Carissa")));
});

test("matches across a line break in the source", () => {
  const html = "<p>the quick\n   brown fox</p>";
  assert.match(html, new RegExp(tolerant("the quick brown fox")));
});

test("matches a page a previous publish filled with &nbsp;", () => {
  // red-barn-ranch.html was left in exactly this state on 10 Aug 2026. The
  // editor has to be able to edit its way back out.
  const html = "<p>A&nbsp;pool&nbsp;table,&nbsp;shuffleboard</p>";
  assert.match(html, new RegExp(tolerant("A pool table, shuffleboard")));
});

/* ---------- applying ---------- */

test("a change is applied in place and reported", () => {
  const html = "<p>old words here</p>";
  const r = applyToPage(html, [{ before: "old words here", after: "new words here" }]);
  assert.equal(r.html, "<p>new words here</p>");
  assert.equal(r.applied.length, 1);
  assert.equal(r.missed.length, 0);
});

test("a change that does not match is reported, not guessed at", () => {
  const html = "<p>old words here</p>";
  const r = applyToPage(html, [{ before: "words that are absent", after: "x" }]);
  assert.equal(r.html, html);
  assert.equal(r.applied.length, 0);
  assert.equal(r.missed.length, 1);
});

test("replacement text is encoded on the way in", () => {
  const r = applyToPage("<p>plain</p>", [{ before: "plain", after: "Cory & Carissa" }]);
  assert.equal(r.html, "<p>Cory &amp; Carissa</p>");
});

/* ---------- photographs ---------- */

test("a swapped photo keeps its path, gains a version stamp and new dimensions", () => {
  const html = '<img class="shot" src="/images/a.jpg" width="100" height="50" alt="x">';
  const r = swapImage(html, { src: "/images/a.jpg", width: 800, height: 600, version: 7 });
  assert.ok(r.ok);
  assert.match(r.html, /src="\/images\/a\.jpg\?v=7"/);
  assert.match(r.html, /width="800"/);
  assert.match(r.html, /height="600"/);
  assert.match(r.html, /alt="x"/);
});

test("the nth occurrence can be targeted", () => {
  const html = '<img src="/images/a.jpg" width="1" height="1">' +
               '<img src="/images/a.jpg" width="2" height="2">';
  const r = swapImage(html, { src: "/images/a.jpg", occurrence: 2, width: 9, height: 9, version: 1 });
  assert.ok(r.ok);
  assert.match(r.html, /width="1" height="1"/);      // first one untouched
  assert.match(r.html, /width="9" height="9"/);
});

test("a photo that is not on the page is reported, not invented", () => {
  const r = swapImage("<p>no images</p>", { src: "/images/missing.jpg", width: 1, height: 1, version: 1 });
  assert.equal(r.ok, false);
});
