# farmhouse-app — two commits that could not be pushed

These patches belong to **FarmhouseGetaways/farmhouse-app**, not to this repo.
They are parked here so they are not lost.

## Why they are here

The Claude GitHub App can *read* `farmhouse-app` but not write to it. `git push`
returns `403`, and so does creating a branch through the API:

    POST /repos/FarmhouseGetaways/farmhouse-app/git/refs
    403 Resource not accessible by integration

The app is installed on `farmhousegetaways` with write access, but on
`farmhouse-app` it is read-only. So the work was committed locally on a
throwaway container with nowhere to push. These patches are that work, in a
form that survives.

## Fixing the access

github.com/settings/installations → **Claude** → give it **Read and write**
access to `farmhouse-app`. Once that is done a future session can push
normally, and this folder should be deleted.

## Applying them

Verified 7 Aug 2026: both apply cleanly to `main` at `c958941`, and the test
suite passes afterwards (10 tests).

    git clone https://github.com/FarmhouseGetaways/farmhouse-app.git
    cd farmhouse-app
    git checkout -b claude/emailoctopus-integration-rlu3cx
    git am /path/to/farmhouse-app-patches/*.patch
    node --test netlify/functions/_lib/*.test.mjs
    git push -u origin claude/emailoctopus-integration-rlu3cx

`git am` keeps the original commit messages and authorship, so the history
lands exactly as it was written.

## What the two commits do

**0001 — Add an email signup to the More screen, feeding EmailOctopus.**
Adds a signup form to `more.html`, the styling for it in `css/app.css`, the
submit handling in `js/app.js`, and a `netlify/functions/subscribe.mjs` endpoint
that posts the contact to EmailOctopus. Brings in the shared
`_lib/emailoctopus.mjs` client and its tests — the same client the website uses,
so tag handling cannot drift between the two. Also adds `tools/build.py`, a
`.gitignore`, and setup notes.

**0002 — Correct the brand tags, and start the welcome automation.**
Fixes the tag values to the three agreed brands — `farmhousegetaways`,
`minibarnmarket`, `farmstandtv` — and triggers the matching welcome automation
on signup.

Unlike the website, the app posts to its own function directly rather than going
through Netlify Forms, because the app has no Netlify form to hook into. It
reaches the same list and uses the same tags.

## It needs the same environment variables

`EMAILOCTOPUS_API_KEY` and `EMAILOCTOPUS_LIST_ID`, set on whichever Netlify site
serves the app. Without them the endpoint returns a clean error and the form
tells the visitor to try again later — it does not fail silently.
