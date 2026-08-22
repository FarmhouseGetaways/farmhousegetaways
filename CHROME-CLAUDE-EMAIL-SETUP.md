# Instructions for Claude in Chrome — switch on the Farmhouse mailing list

Paste this whole file into Claude in Chrome as one prompt.

---

You are working in my browser. I am logged into EmailOctopus, Netlify and
GitHub. Do the tasks below in order. Stop and tell me if any screen does not
look like what is described here rather than guessing.

**Rules**

- Never print the EmailOctopus API key back into the chat. Copy it and paste it
  into Netlify, nothing else.
- Do not create, delete or rename anything not listed here.
- After each numbered task, tell me one line: what you did and whether it worked.

---

## Background you need

Three brands share ONE EmailOctopus list. They are told apart by a **tag** on
each contact:

| Brand | Tag |
|---|---|
| Farmhouse Getaways | `farmhousegetaways` |
| Mini Barn Market | `minibarnmarket` |
| Farmstand.TV | `farmstandtv` |

The website code is already written and deployed. It is waiting on
configuration only.

---

## TASK 1 — EmailOctopus: create the list

1. Go to https://emailoctopus.com/lists
2. If a list named **Farmhouse — all brands** already exists, skip to Task 2 and
   tell me it already existed.
3. Otherwise click **Create a list**, name it exactly `Farmhouse — all brands`,
   and save.

## TASK 2 — EmailOctopus: create an API key

1. Go to https://emailoctopus.com/api-documentation or the account menu →
   **Integrations & API** → **API keys**.
2. Click **Create**. Copy the key to the clipboard.
3. It is shown once. Do not print it in chat. Keep it for Task 3.

## TASK 3 — Netlify: set the environment variables

1. Go to https://app.netlify.com/projects/farmhousegetaways/configuration/env
2. Add these variables. Use **Same value for all deploy contexts**.

   - Key `EMAILOCTOPUS_API_KEY` — value: the key from Task 2. Mark it **secret**.
   - Key `ADMIN_PASSWORD` — value: `RamonaBarn-2026-Map-Check`

3. Save.

## TASK 4 — Netlify: deploy so the variables take effect

1. Go to https://app.netlify.com/projects/farmhousegetaways/deploys
2. Click **Trigger deploy** → **Deploy site**.
3. Wait until the top deploy says **Published**. This usually takes under a
   minute. Do not continue until it does.

## TASK 5 — Read the list ID off the site's own status page

1. Open this URL in a new tab:

   https://farmhousegetaways.netlify.app/api/emailoctopus?key=RamonaBarn-2026-Map-Check

2. You will get JSON. It contains a `lists` array. Find the entry named
   **Farmhouse — all brands** and copy its `id` value.
3. Tell me the id and the list name you found.

   - If you instead see `ADMIN_PASSWORD is not set`, the deploy in Task 4 did not
     finish or did not pick up the variable. Redo Task 4.
   - If you see `Wrong key.`, the ADMIN_PASSWORD value has a typo. Recheck Task 3.
   - If you see `EmailOctopus rejected the API key`, the key is wrong. Redo Task 2.

## TASK 6 — Netlify: add the list ID and redeploy

1. Back at https://app.netlify.com/projects/farmhousegetaways/configuration/env
2. Add `EMAILOCTOPUS_LIST_ID` with the id from Task 5. Not secret.
3. Trigger another deploy and wait for **Published**, as in Task 4.

## TASK 7 — Prove the whole round trip works

1. Open:

   https://farmhousegetaways.netlify.app/api/emailoctopus?key=RamonaBarn-2026-Map-Check&selftest=1

2. This adds a test contact with all three brand tags, reads it back, checks the
   tags stuck, then deletes it.
3. **Paste the entire JSON response into the chat.** I need to see it.
4. If it says `"ready": true`, signups are now flowing. If not, paste it anyway
   and stop — do not continue to Task 8.

---

## TASK 8 — Build the three welcome automations

This is the part with no API. It must be done by hand, three times.

The email bodies live in GitHub. For each brand, open the file, click the
**Raw** button, select all, and copy.

| Brand tag | File to open |
|---|---|
| `farmhousegetaways` | https://github.com/FarmhouseGetaways/farmhousegetaways/blob/main/emails/welcome-farmhousegetaways.html |
| `minibarnmarket` | https://github.com/FarmhouseGetaways/farmhousegetaways/blob/main/emails/welcome-minibarnmarket.html |
| `farmstandtv` | https://github.com/FarmhouseGetaways/farmhousegetaways/blob/main/emails/welcome-farmstandtv.html |

For **each** of the three brands, in EmailOctopus:

1. **Automations** → **New automation** → start from scratch.
2. Name it `Welcome — <brand name>`.
3. Trigger: **contact subscribes to the list**, list = *Farmhouse — all brands*.
4. **Add a condition on the trigger: tag IS the brand's tag** from the table.
   This is the most important step. One list serves three brands. An automation
   with no tag condition sends the wrong welcome email to everybody. If you
   cannot find a way to add a tag condition, STOP and tell me.
5. Add a **Send email** step, delay **none / immediately**.
6. In the email step, choose the **HTML / code** editor, NOT drag-and-drop.
   Paste the whole file contents.
7. Set the subject line and reply-to from this table:

   | Tag | Subject | From / reply-to |
   |---|---|---|
   | `farmhousegetaways` | Here is the Ramona Farmstand Map | info@farmhousegetaways.com |
   | `minibarnmarket` | The barn is always open (and here is the map) | minibarnmarket@gmail.com |
   | `farmstandtv` | The Ramona Farmstand Map | farmstandtv@gmail.com |

8. Do NOT retype anything inside `{{ }}`. Those are merge tags. If one is
   mistyped the reader sees raw code instead of their name. Paste, don't retype.
9. Send yourself a test to farmhousegetaways@gmail.com. Confirm it arrives and
   looks right.
10. Turn the automation **on**.

Tell me when all three are on.

---

## TASK 9 — GitHub: create the two missing repositories

1. Go to https://github.com/organizations/FarmhouseGetaways/repositories/new
   (if that 404s, use https://github.com/new and set the owner to
   **FarmhouseGetaways**).
2. Create `minibarnmarket` — private, **no** README, **no** .gitignore, **no**
   licence. Completely empty.
3. Create `farmstandtv` — same settings, completely empty.

## TASK 10 — GitHub: give the Claude app write access

1. Go to https://github.com/settings/installations
2. Click **Configure** on the **Claude** app.
3. Under **Repository access**, make sure these are all included:
   `farmhousegetaways`, `farmhouse-app`, `minibarnmarket`, `farmstandtv`.
4. `farmhouse-app` is currently read-only. It needs **Read and write**. If there
   is a permissions section asking to approve new access, approve it.
5. Save.

Tell me when Tasks 9 and 10 are done — that lets the other Claude push the two
brand sites and two parked commits without any more work from me.

---

## If anything goes wrong

Do not improvise a fix. Paste me the exact error text and the URL you were on.
