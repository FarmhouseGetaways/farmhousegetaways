#!/usr/bin/env node
/**
 * One command to set up EmailOctopus and prove it works.
 *
 *     EMAILOCTOPUS_API_KEY=xxxxx node tools/eo-provision.mjs
 *
 * or just `node tools/eo-provision.mjs` and paste the key when asked, which
 * keeps it out of your shell history.
 *
 * WHAT IT DOES
 *   1. Finds or creates the shared list.
 *   2. Prints the exact environment variables to paste into Netlify.
 *   3. Runs a real round trip against the live API — adds a test contact with
 *      all three brand tags, reads it back, checks the tags actually stuck,
 *      then deletes it.
 *
 * Step 3 is the point. Everything else in this repo is checked by unit tests
 * against a stubbed API, which proves the code sends the right request but not
 * that EmailOctopus does the right thing with it. In particular it cannot
 * prove the tag format is right — the wrong format is accepted with a 200 and
 * silently applies nothing. This script is the only thing that actually
 * catches that, because it reads the contact back and looks.
 *
 * WHAT IT CANNOT DO
 * Create the automations. The v2 API exposes lists, contacts, fields and tags;
 * campaigns are read-only, and automations have exactly one write endpoint,
 * `queue`, which starts one for a contact that already exists. There is no
 * create. The three welcome emails have to be built once in the UI —
 * emails/README.md walks it. That is a limit of the API, not an oversight.
 *
 * Plain Node, no npm, nothing installed.
 */

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const API = "https://api.emailoctopus.com";
const LIST_NAME = "Farmhouse — all brands";
const BRANDS = ["farmhousegetaways", "minibarnmarket", "farmstandtv"];

const ok = (s) => `\x1b[32m${s}\x1b[0m`;
const bad = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

let key = (process.env.EMAILOCTOPUS_API_KEY || "").trim();

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { authorization: "Bearer " + key, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let payload = null;
  if (text) { try { payload = JSON.parse(text); } catch { payload = { raw: text.slice(0, 300) }; } }
  return { status: res.status, ok: res.ok, payload };
}

function die(msg, detail) {
  console.error("\n" + bad("✗ " + msg));
  if (detail) console.error(dim("  " + detail));
  process.exit(1);
}

// ---------------------------------------------------------------------------

if (!key) {
  const rl = createInterface({ input: stdin, output: stdout });
  key = (await rl.question("EmailOctopus API key: ")).trim();
  rl.close();
}
if (!key) die("No API key given.");

console.log("\n" + bold("1. Checking the key"));
const lists = await call("GET", "/lists");
if (lists.status === 401 || lists.status === 403) {
  die("EmailOctopus rejected that key.", "Make a new one under Integrations & API → API keys.");
}
if (!lists.ok) die("Could not read your lists.", JSON.stringify(lists.payload));
console.log("   " + ok("works") + dim(`  (${(lists.payload.data || []).length} list(s) on the account)`));

// ---------------------------------------------------------------------------

console.log("\n" + bold("2. The list"));
let list = (lists.payload.data || []).find((l) => l.name === LIST_NAME);

if (list) {
  console.log(`   ${ok("found")} "${list.name}"`);
} else if ((lists.payload.data || []).length) {
  // Never silently adopt an existing list with a different name — it might be
  // somebody else's audience, and merging three brands into it is not undoable.
  console.log(`   ${dim("no list called")} "${LIST_NAME}"${dim(". Existing lists:")}`);
  for (const l of lists.payload.data) console.log(dim(`     ${l.id}  ${l.name}`));
  console.log(`   ${dim("creating a new one rather than assuming one of those is right…")}`);
}

if (!list) {
  const made = await call("POST", "/lists", { name: LIST_NAME });
  if (!made.ok) die("Could not create the list.", JSON.stringify(made.payload));
  list = made.payload;
  console.log(`   ${ok("created")} "${list.name}"`);
}

const listId = list.id;

// ---------------------------------------------------------------------------

console.log("\n" + bold("3. Round trip against the live API"));
const testEmail = `provision-check+${listId.slice(0, 8)}@farmhousegetaways.com`;

const put = await call("PUT", `/lists/${listId}/contacts`, {
  email_address: testEmail,
  status: "subscribed",
  fields: { FirstName: "Provision" },
  tags: Object.fromEntries(BRANDS.map((b) => [b, true])),
});
if (!put.ok) die("Could not add a test contact.", JSON.stringify(put.payload));
console.log("   " + ok("added") + dim("  " + testEmail));

// Read it back. This is the check that matters: a wrong tag format is accepted
// with a 200 and applies nothing, so only reading it back can tell.
const { createHash } = await import("node:crypto");
const contactId = createHash("md5").update(testEmail.toLowerCase()).digest("hex");
const got = await call("GET", `/lists/${listId}/contacts/${contactId}`);

let tagsOk = false;
if (!got.ok) {
  console.log("   " + bad("could not read the contact back") + dim("  " + JSON.stringify(got.payload)));
} else {
  const applied = got.payload.tags || [];
  const names = Array.isArray(applied) ? applied : Object.keys(applied);
  const missing = BRANDS.filter((b) => !names.includes(b));
  tagsOk = missing.length === 0;
  if (tagsOk) {
    console.log("   " + ok("tags applied") + dim("  " + names.join(", ")));
  } else {
    console.log("   " + bad("TAGS DID NOT STICK") + "  missing: " + missing.join(", "));
    console.log(dim("     This is the failure mode the code guards against — PUT needs tags as"));
    console.log(dim("     an object map, not an array. If you see this, the API contract moved."));
  }
}

// Clean up. A provisioning check must not leave a fake subscriber on a real list.
const gone = await call("DELETE", `/lists/${listId}/contacts/${contactId}`);
console.log("   " + (gone.ok || gone.status === 404 ? ok("test contact removed") : bad("could not remove the test contact — delete " + testEmail + " by hand")));

// ---------------------------------------------------------------------------

console.log("\n" + bold("4. Paste these into Netlify"));
console.log(dim("   Site configuration → Environment variables, then trigger a deploy.\n"));
console.log(`   EMAILOCTOPUS_API_KEY   = ${dim("(the key you just used)")}`);
console.log(`   EMAILOCTOPUS_LIST_ID   = ${bold(listId)}`);
console.log(`   ADMIN_PASSWORD         = ${dim("(anything long, guards the status page)")}`);
console.log(dim("\n   On the other two sites, add one more:"));
console.log(`   EMAILOCTOPUS_BRAND     = minibarnmarket   ${dim("(or farmstandtv)")}`);

console.log("\n" + bold("5. Still to do by hand — the API cannot do these"));
console.log(dim("   The three welcome automations. See emails/README.md."));
console.log(dim("   EmailOctopus has no endpoint to create an automation, only to start one."));
console.log(dim("   Put a tag condition on each trigger, or one brand gets another's email."));

console.log("\n" + (tagsOk ? ok("Ready. The list exists and tagging is verified against the live API.")
                           : bad("Finished with problems — see above.")) + "\n");
process.exit(tagsOk ? 0 : 1);
