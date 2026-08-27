# Carissa's workout tracker

An installable web app: seven days of the week, a workout on each, a video for
every exercise, a big button for finishing a set, and a record of everything
ever done.

**It is its own site, not part of the Farmhouse Getaways website.** The folder
lives in this repository, but the root `netlify.toml` deliberately 404s
`/workout/*` on farmhousegetaways.com — this is deployed as a separate Netlify
site pointed at the same repository with the base directory set to `workout`.
See *Deploying*, below.

Plain HTML, CSS and three JavaScript modules, with three small Netlify
functions behind them. No framework and no build step; the one dependency,
`@netlify/blobs`, is used by the functions and never reaches the browser.

    cd workout && python3 -m http.server 8099
    # then http://127.0.0.1:8099/

Opened that way there is no server, so the app runs from the committed plan and
this browser — which is the same thing that happens to a phone in a gym with no
signal, and worth seeing.

## What it does

**The week.** Seven day cards. Today's is the big one at the top, with the
title, how long it should take, and a button that starts it. A day with no
exercises reads as a rest day rather than as an empty card.

**The workout.** One exercise at a time. The video plays at the top; the name,
the reps and any notes sit under it; the sets are laid out as pills — done ones
in green with the time each took, the current one in pink, the rest queued. The
only large button on the screen says **Set complete**, and it is at the bottom
where a thumb is. Press it and the rest timer takes over the screen and counts
down; when it reaches nought it beeps, buzzes, and the next set is live. When
the last set of an exercise is done the app moves to the next one by itself and
says which. When the last exercise is done the workout finishes and is logged.

She can skip an exercise, pause, or finish early. Finishing early logs what was
actually done and marks it *part done*. Finishing with nothing done logs
nothing at all — a nought in a record meant to be encouraging is worse than no
row.

**Nothing is lost.** The workout in progress is written to the browser on every
single set, so a locked phone, a dropped call, a closed tab or a flat battery
costs nothing: reopening the app offers to carry on where she left off.

**Reminders.** A push notification on the morning of a day that has a workout
in it — never on a rest day, never once it is already done, and once a day
rather than once an hour. If now is not the moment, the *Later today* button
opens a scrolling hour picker: choose five, and at five it comes back and says
it is time. See below.

**Editing, in admin mode.** The pencil in the top bar turns the page into the
editor — click a title, a name, the notes, and type. Pictures and clips go on
by pressing the square beside an exercise. See below.

**The record.** Every finished workout with its date, time, sets, per-exercise
breakdown and a calorie estimate. A day streak, a week strip, totals, and a CSV
download.

**Worth knowing — `js/insights.js`.** A total is a number; these are the
things a total cannot say on its own. How the last 30 days actually went, as
a percentage rather than a raw count. The exercise that shows up in the most
workouts — not the one with the most sets in a single big day, which would
reward one marathon session over real consistency. Which day of the week she
actually shows up. The longest run ever, which is not always the streak
counter at the top — that one only counts back from today, so a four-day
streak from a month ago would otherwise be forgotten the moment it broke.
Three personal bests — longest workout, biggest calorie burn, most sets in
one sitting — and a short, deliberately small set of milestones that only
ever appear once actually earned. All of it is pure arithmetic over the
record, no clock of its own, tested the same way the calorie maths is:

    node --test workout/js/*.test.js

**A milestone is announced once, on the workout that actually earned it** —
`newlyEarned` in `js/insights.js`, shown right on the summary screen the
moment a workout finishes, not left to be found later on the history screen.
It works by sorting the record by when each workout actually finished and
comparing insights just before that moment against just after — deliberately
not by removing the session and seeing what badge disappears, which sounds
equivalent but is not: with exactly five workouts logged, removing any one
of them drops the total below the "5 workouts" badge, so that approach would
announce the same milestone on all five, including the first one revisited a
year later. Caught by a test before it ever shipped — see
`insights.test.js`'s "does not re-announce an old milestone".

**Calories** are estimated with the standard MET equation —
`MET × 3.5 × body weight in kg ÷ 200` per minute — using the values from the
2011 Compendium of Physical Activities. What makes it better than a flat guess
is that it is fed by measured time: the app knows how long each set actually
took and how long the rests actually were, so twenty minutes and forty minutes
over the same sets do not come out the same. Working time is charged at the
exercise's own effort level, rest at a standing-about rate, and anything
unaccounted for at nothing. Set the body weight in Settings. It is stored with
each workout, so changing it does not rewrite the past. It is an estimate and
the app says so on screen.

## Accounts — up to five, for the beta

**Signing in and editing are two unrelated locks**, on purpose. An account —
email and password, or Google — is a real person's own, and it is what their
training record is attached to and what makes it sync between their phone and
their iPad. It has nothing to do with editing the week.

**Create one, sign in, or reset a forgotten password** from the **Sign in**
pill at the bottom of every screen, or `/#/login`. Five accounts, while this
stays a small beta rather than something built out with real multi-tenant
infrastructure — invoices, roles, self-service account deletion — before it
is known whether any of that is needed. Raising the number later is a
one-line change in `_lib/users.mjs`.

**Signed in, Settings → Change password** sets a new one without needing an
email round trip — the current password proves it is really her, the same as
any account settings screen. Changing it signs every other device out, on
purpose: a stolen or forgotten-about session should not survive a password
change. A Google-only account has no password to change and Settings says so
rather than offering a form that would only fail.

**Admin gets a read-only roster, not a management screen.** Settings → Edit
the week (admin only) → *Who has an account* lists everyone who has signed
up — email, name, Google or password, when they joined, when they last
signed in, and how many workouts they have logged — so the operator can tell
at a glance whether the beta is full and who is actually using it. It cannot
change or remove anyone; for five people, "ask them to email you" covers the
rare case that needs it, and it is not worth a delete button that could be
mis-tapped.

**Google is optional.** If `GOOGLE_CLIENT_ID` is set (see *Deploying*) a
"Sign in with Google" button appears on the sign-in screen; without it, it
simply does not, the same fail-quiet-until-configured pattern reminders
already use for `VAPID_PUBLIC`/`VAPID_PRIVATE`. Nothing about it needs a
Google *password* reaching this app — Google's own script hands back a signed
token, verified here against Google's public keys.

**Forgotten passwords are emailed a reset link**, if `RESEND_API_KEY` and
`RESEND_FROM` are set (see *Deploying*); without them, the site still works,
it just cannot send that email, and says so. The reply is identical whether or
not the address typed in has an account — telling the two apart would let the
box be used to find out who has signed up here.

**Each account's own record, and nobody else's — the admin password
included.** The old, single shared record from before accounts existed was
copied once into whoever created the very first account, so nothing already
logged was lost; every account after that starts with a clean training log of
its own. See the storage table below for exactly who can read what.

## Editing the week — click the thing and type

The editor is a completely separate thing from any of the above: the app's own
shared password, known to whoever is trusted to write the week, not tied to
any one account. It is behind a deliberate gesture, the same one the farmhouse
app uses for its own admin screen: **press and hold the title at the top of
any screen for three quarters of a second.** There is no button, because a
button is something you press by accident. On a laptop, `/#/admin` does the
same. Either way it asks for `WORKOUT_PASSWORD` if it has not already been
typed on this device.

It is held for the session only: closing the app locks the editor again, and
**Settings → Lock the editor** does it on the spot. Nobody wants to hand over
their phone with the week one tap from being rewritten.

Once unlocked, a pencil appears in the top bar. Press it and the page you are
already looking at becomes the editor. Nothing moves; the things you can change
simply grow a dotted underline. It works the same with a mouse as with a
finger, so the week can be written at a desk or on a phone.

- **On the week board** — the seven day names are typeable where they sit.
- **Inside a day** — the title, the description, the estimated time, and for
  every exercise: its name, the sets, the reps, the rest, the effort and the
  notes. Each exercise reads as a sentence — *5 sets of 12 · 75s rest* — with
  the numbers themselves being the controls.
- **Order and removal** — the arrows and the × on each exercise.
- **+ Add an exercise** drops a blank one in and puts the cursor in its name.
- **Make it a rest day** clears one.

Everything edits into a single draft of the whole week, so moving from Monday
to Thursday keeps the changes. The bar at the bottom counts them —
*Save — 2 days changed* — and nothing leaves the browser until it is pressed.
The arrow beside it throws the draft away.

Saving writes to the store and is live on every device on their next load. No
committing, no deploy.

## Pictures and videos — two different things

Press the square beside an exercise and the sheet has two halves, because they
do two different jobs.

**The picture** is what it looks like: the thumbnail in the day list, and what
the stage shows before anything plays. It is there the moment the screen
paints.

**The video** is what plays when she starts that exercise.

They are independent. An exercise can have a picture and no video, which is
often all a familiar movement needs. It can have a video and no picture. Or it
can have both, which is the best of it — the picture is the video's poster, so
the stage shows the movement rather than a black rectangle while it loads.

**A day has a picture too**, and no video: a workout is not a movement. Press
the square beside the title in the editor. It shows on the week board, at the
top of the day, and on today's card.

**The picture** is uploaded from the phone — shrunk in the browser first, so a
five-megabyte photo lands at two or three hundred kilobytes and looks
identical at the size this shows it. Uploads are content-addressed: the
file's name is a hash of its own bytes, so the same picture twice costs
nothing extra, and they are served from `/media/<hash>`, cached for a year.

**The video is a link, never an upload.** YouTube, Vimeo or a Google Drive
share link — the hint under the box says what it recognised before you
commit to it. There used to be a "take a clip on this phone" option too;
it is gone, on purpose, in favour of the video library below. `/api/media`
itself no longer accepts a video upload, though it still *serves* one from
before this changed, so nothing already built goes dark.

### The video library — pick one instead of pasting it every time

A saved list of name-and-link pairs, admin only, at `/api/video-library`.
Open any exercise's media sheet and "From the library" lists everything
saved so far — press one and it is set, no re-typing a YouTube link that
gets used in five different workouts.

**Turning an exercise you already built into a library entry** is the same
sheet: whatever video is currently set, "Save this video to the library"
asks for a name (defaulting to the exercise's own) and adds it — the video
does not have to be new, and nothing about the exercise it came from
changes. That is the answer to "I already built workouts before there was a
library."

Entries are validated the same way an exercise's own video field is —
`safeUrl` in `_lib/data.mjs`, http(s) only — so a saved link can never be a
scheme the app would refuse to embed anyway. Capped at 200, far more than a
home gym's worth of moves.

### The exercise pool — a whole exercise saved, not just its video

Added 27 Aug 2026, at the owner's request: a place to see every exercise
built so far and pick one to build a day from, rather than retyping the same
name, sets, reps, rest, video and notes each time a movement recurs across
the week. Admin only — viewing and picking are both gated the same way the
video library is, since this is part of building the week, not something a
signed-in account needs.

Open a day in the editor and **"From the pool"**, next to "+ Add an
exercise", lists everything saved so far — press one and it is added to that
day exactly as it was saved, with a fresh id of its own so it never collides
with the pool entry or another exercise already on the day.

**Turning an exercise you already built into a pool entry** is a button on
the exercise itself, "Save to the pool", right where "Save this video to the
library" sits for video. The whole exercise is copied — name, picture,
video, sets, reps, rest, effort and notes — and nothing about the exercise it
came from changes.

**Settings → Edit the week (admin) → Exercise pool** is the roster: every
saved exercise with its sets/reps/rest and effort at a glance, and a Remove
button. Removing one from the pool does not touch any day it is already used
on — a pool entry is copied in, not linked.

Server-side it is `/api/exercise-library`, and it reuses the exact same
`normaliseExercise` a day's own exercises are validated through — a pool
entry can never carry something the day editor itself would have refused.
Capped at 300.

## Reminders

A push notification, which means it arrives whether or not the app is open —
on a phone face down on a kitchen counter.

**The hour is the admin's decision, not the device's.** Settings → Edit the
week (admin) → Reminder schedule sets a site-wide default — on or off, and
at which hour, "Don't forget to do your workout today!" by default — and
each account can be given its own instead, or everyone can be set at once.
"Return to default schedule" clears one person's override. A person still
has to press **Remind me** on their own device and grant the browser's
permission — nothing can subscribe a phone that never opened the app — but
once it has, the hour it fires at is the admin's schedule, not a picker on
the Reminders screen, which now just shows what that schedule is.

**What it says is configurable by the hour, too.** Twenty-four fields, one
per hour of the day, each defaulting to "Don't forget to do your workout
today!" and each independently editable — a reminder at 6am can read
differently from one at 8pm. Whichever hour a person's reminder is set to,
that hour's wording is what gets sent; change it later and everyone at that
hour says the new thing from then on, with nothing to touch per person.

**Whether.** The decision is made fresh every hour, per device, and it is
mostly *no*:

| | |
|---|---|
| Nothing scheduled today | Say nothing. A rest day is part of the plan. |
| Already done today | Say nothing. She knows. |
| Already said today | Say nothing more — unless a snooze is due. |

That restraint is the whole design. A reminder that arrives on a rest day, or
an hour after the workout was finished, teaches somebody to ignore reminders —
and once they are ignored they are worse than nothing, because they are still
interrupting.

**Later today.** The notification carries two buttons: *Start it*, which opens
the workout, and *Later today*, which opens the hour picker. Choose five and it
comes back once, at five, saying it is time. A snooze only counts on the day it
was set — one slept through is not a reason to be woken tomorrow.

**Time zones.** The hour is a *local* hour and the zone is stored beside it as
an IANA name. Storing an offset instead would be a bug twice a year: an eight
o'clock reminder would become seven, or nine, the morning the clocks moved. A
fixed offset is refused even though `Intl` accepts it, for exactly that reason.

**Setting it up.** Two more environment variables, from
`npx web-push generate-vapid-keys`:

    VAPID_PUBLIC   = the public key
    VAPID_PRIVATE  = the private key

Then redeploy. Without them everything else works exactly as before and the
reminders screen says it is not switched on. `reminder-tick` then runs hourly
on Netlify's own schedule; **Send a test nudge** on the reminders screen (admin
only) runs the same sweep on the spot and prints what it did, so the chain can
be proved in a minute rather than in an hour.

On an iPhone, push only works once the app is on the home screen. The app says
so rather than failing silently.

## Where things are stored, and who can read what

Netlify Blobs belonging to this site alone. Not files in this repository —
`FarmhouseGetaways/farmhousegetaways` is **public**, and a training log is not.

| | Read | Write |
|---|---|---|
| **The week** (`/api/plan`) | anyone — it is a list of exercises, and the app has to show the week before anybody signs in | the admin password |
| **An account's own record** (`/api/history`) | that account, signed in | that account, signed in |
| **Accounts** (email, name, a password hash — never the password itself) | the admin password, sanitised — email, name, join date, nothing that could sign in as them | signing up, or Google, once; a signed-in account can change its own password |
| **Reminder schedule & messages** | the admin password | the admin password |
| **The video library** | the admin password | the admin password |
| **The exercise pool** | the admin password | the admin password |

Two separate locks, two separate cookies: the admin password gates the week
and nothing else; an account gates one person's own record and nothing
else — not another account's record, and not the week. Knowing the admin
password does not let anyone read a training record; being signed into an
account does not let anyone edit the week.

`data/plan.json` stays committed as the floor underneath the plan: if the
store has never been written, or is wiped, the app falls back to it rather
than to a blank week. It is imported by the function rather than fetched, so
there is no network call to fail silently in production.

**How the admin password works.** It lives in a Netlify environment variable
and is compared on the server. Typing it sets an `HttpOnly` session cookie —
the page's own JavaScript cannot read it, and nor can anything else that ends
up running on the page — which is a signed, expiring token, not the password
itself. Every write of the week checks that cookie server-side, so a visitor
editing the page in dev tools changes what *they* see and nothing else. Ten
wrong guesses from one address inside fifteen minutes and that address waits.

**How an account works.** A password, hashed with scrypt and a random salt per
person (`_lib/credentials.mjs`), or a Google sign-in verified against Google's
own public keys (`_lib/google.mjs`) — either way nothing this app could leak
is anyone's actual Google password. Signing in sets its own `HttpOnly` cookie,
carrying which account and which "generation" of its password; changing the
password bumps that generation, which is what actually signs every other
device out rather than just feeling like it should. The same ten-wrong-guesses
lockout applies, kept separately from the admin password's.

With `WORKOUT_PASSWORD` unset, none of this works at all — no signing in as
admin, no accounts, nothing readable but the week. **A misconfigured site is a
read-only site, never an open one.**

The app works completely with no server at all — the committed week, the
browser, and a whole workout logged offline, which goes up on its own when
there is a connection again. That fallback is not a nicety; it is the normal
state of a phone in a garage.

## Deploying

Its own Netlify site, separate from the Farmhouse Getaways one in the
repository root:

1. Netlify → **Add new site** → *Import an existing project* → this repository.
2. **Base directory:** `workout`
3. **Build command:** leave empty
4. **Publish directory:** `workout`
5. **Environment variables** → add:

       WORKOUT_PASSWORD = whatever you want to type to edit the week

   Everything else — accounts, reminders — needs this one set to work at all,
   fails closed without it, and is otherwise all optional:

   Optionally `WORKOUT_SESSION_SECRET` (any long random string). Without it the
   signing key is derived from the password, which means changing the password
   signs every device out — usually what you want anyway. It signs account
   sessions and password-reset links too, each with its own domain-separated
   key derived from this one seed — see `_lib/auth.mjs`'s `sessionSeed`.

   For push reminders, two more from `npx web-push generate-vapid-keys`:

       VAPID_PUBLIC   = the public key
       VAPID_PRIVATE  = the private key

   For emailing a password-reset link, from [resend.com](https://resend.com) —
   free at this scale, a few minutes to sign up and verify a sending domain
   (or use their sandbox address, which only delivers to the account's own
   sign-up email until a domain is verified):

       RESEND_API_KEY = the key from Resend
       RESEND_FROM    = the address it sends as, e.g. "Carissa's Workouts <no-reply@yourdomain.com>"

   Without these, accounts and sign-in still work — only "forgot your
   password" cannot send an email, and says so rather than pretending to.

   For "Sign in with Google", from a Web application OAuth client at
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials) —
   an authorized JavaScript origin of this site's URL, no client secret needed
   for this flow:

       GOOGLE_CLIENT_ID = the OAuth 2.0 client id

   Without it, the sign-in screen simply has no Google button — email and
   password still work.

6. Deploy. Then *Domain management* if it should have a name of its own.

Netlify installs `package.json` so the functions can import `@netlify/blobs`;
there is no build step for the site itself. Blobs storage needs nothing turned
on.

**A deploy must happen after setting the password.** Environment variables are
read when the functions are built, so a site deployed before the variable
existed stays read-only until it is redeployed.

### This site skips a build when the commit was not about it

Two Netlify sites watch `main` on this one repository — this one and the
Farmhouse Getaways website — so every push used to build both and cost twice
over. `netlify.toml` here now carries, in `[build]`:

    ignore = "git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF -- ."

Netlify runs that from the base directory, which is `workout`, so the bare `.`
means this folder and nothing else. **Exit 0 skips the build** — the sense is
inverted from what it looks like — so a commit that only touched the website
stops here and a commit that touched anything in `workout/` goes through. An
empty `$CACHED_COMMIT_REF` makes `git diff` error, which builds; an extra build
is the safe way to be wrong.

A skipped build appears greyed out in the Netlify deploy list. That is not a
failure, it is the line above doing its job.

## On a phone

It is installable. iPhone: Share, then **Add to Home Screen**. Android: the
menu, then **Install app**. It then opens without browser chrome, keeps the
screen awake during a workout, and works in a gym with no signal — the shell is
precached and the plan is already in the browser. A workout done offline is
logged locally and goes to the server on its own when there is a connection
again.

## What is in here

    index.html                the shell — everything else is rendered into it
    css/workout.css           all of the styling
    js/catalog.js             effort levels, the calorie maths, video links, formatting
    js/insights.js            the intelligence in the record — trends, bests, milestones
    js/store.js               the week and the record: load, save, sync, the numbers
    js/account.js             talking to /api/account and the admin endpoints
    js/media.js               shrinking a picture and sending it
    js/library.js             the video library: list, add, remove — admin only
    js/exercise-library.js    the exercise pool: list, add, remove — admin only
    js/push.js                asking to be reminded, and what to do if it cannot
    js/app.js                 the screens, the editor, and the one click handler
    data/plan.json            the committed week — the floor under the live one
    icons/                    app icons, generated from icons/favicon.svg
    manifest.webmanifest      makes it installable
    sw.js                     the offline cache — bump VERSION when the file list changes
    netlify.toml              this folder's own site config
    package.json              one dependency: @netlify/blobs, for the functions

    netlify/functions/auth.mjs       the ADMIN password: signing in, out, the lockout
    netlify/functions/account.mjs    accounts: sign up, sign in, Google, reset, change password
    netlify/functions/admin-people.mjs   admin-only: the account roster, read-only
    netlify/functions/admin-reminders.mjs   admin-only: the schedule, the messages, per-person overrides
    netlify/functions/video-library.mjs     admin-only: saved videos — list, add, remove
    netlify/functions/exercise-library.mjs  admin-only: saved exercises — list, add, remove
    netlify/functions/plan.mjs       the week: public to read, admin password to write
    netlify/functions/history.mjs    an account's own record: that account only, to read or write
    netlify/functions/media.mjs      pictures: public to read, password to add — no video, see above
    netlify/functions/reminders.mjs  which device wants nudging, and when — an account, signed in
    netlify/functions/reminder-tick.mjs  the hourly sweep, run by Netlify itself
    netlify/functions/_lib/remind.mjs         whether a nudge is owed, and what it says — pure, and tested
    netlify/functions/_lib/reminder-shape.mjs the admin schedule's arithmetic — pure, and tested
    netlify/functions/_lib/reminder-config.mjs  the schedule's store, and pushing it onto devices
    netlify/functions/_lib/push.mjs          sending one, and pruning dead devices
    netlify/functions/_lib/tick.mjs          the sweep itself, so it can also be run on demand
    netlify/functions/_lib/auth.mjs          the admin password, its cookie, the stores, the shared session seed
    netlify/functions/_lib/users.mjs         the account store, its sessions, password resets
    netlify/functions/_lib/credentials.mjs   password hashing and email validation — pure, and tested
    netlify/functions/_lib/google.mjs        verifying a Google sign-in — pure claim checks, and tested
    netlify/functions/_lib/mail.mjs          sending the reset-link email, via Resend
    netlify/functions/_lib/data.mjs          the shape of the plan and the record, and every clamp

Run the tests after touching anything under `_lib/`, or `js/catalog.js` /
`js/insights.js`:

    node --test workout/netlify/functions/_lib/*.test.mjs workout/js/*.test.js

Plain Node, nothing to install.
