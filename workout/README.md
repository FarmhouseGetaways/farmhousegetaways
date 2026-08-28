# Carissa's workout tracker

An installable web app: a personal weekly schedule for each of up to five
people, a video for every exercise, a big button for finishing a set, and a
record of everything ever done.

**It is its own site, not part of the Farmhouse Getaways website.** The folder
lives in this repository, but the root `netlify.toml` deliberately 404s
`/workout/*` on farmhousegetaways.com — this is deployed as a separate Netlify
site pointed at the same repository with the base directory set to `workout`.
See *Deploying*, below.

Plain HTML, CSS and JavaScript modules, with small Netlify functions behind
them. No framework and no build step; the one dependency, `@netlify/blobs`, is
used by the functions and never reaches the browser.

    cd workout && python3 -m http.server 8099
    # then http://127.0.0.1:8099/

Opened that way there is no server, so nobody can sign in and the app shows
"sign in to see your week" — a schedule is personal now, and there is no
public one to fall back to. Signed in with a server reachable, that person's
own last-synced schedule is what's cached in this browser and served from
there when there is no signal — the same thing that happens to a phone in a
gym with no bars, and worth seeing once an account has actually signed in
here at least once.

## What it does

**The week.** Seven day cards, each showing what has been assigned to the
signed-in account that day — nothing, one workout, or several, each with its
own time. Today's is the big one at the top: one card if there is one workout,
a stack of them if there is more than one, each with a button that starts it.
A day with nothing assigned reads as a rest day rather than as an empty card.

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

**Editing, in admin mode.** There is no pencil any more and nothing on the
week or day screen is editable in place. Building the week is three
repositories and an assignment screen, all reached from Settings → Edit the
week, and every change on them saves the moment it is made — see *Exercises,
workouts and schedules*, below.

**Signed in as admin, the background tints red** — a deliberate, unmissable
difference on every screen, not just the admin ones, so there is never a
moment of wondering which mode is active.

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

## Exercises, workouts and schedules — the whole week, rebuilt 28 Aug 2026

The week used to be one shared plan: seven days, each with its own exercises
typed straight into it. It no longer is. The owner asked for the ability to
build a workout once and assign it to whichever of her (up to five) people
needed it, on whichever day, at whichever time — multiple workouts on the
same day allowed — so the whole thing is now three linked repositories
instead of one shared document:

1. **The exercise pool** (`/api/exercise-library`) — every exercise that
   exists, full stop: name, video, picture, sets, reps, rest, effort, notes.
   This is the ONLY place any of those fields is ever set. Settings → Edit
   the week (admin) → Exercise pool lists them all, each with Edit (a sheet
   with every field, image upload and "from the library"/paste-a-link video,
   same as before) and Remove.
2. **The workout library** (`/api/workout-library`) — a named, reusable
   workout: a title, a picture, a description, and an ORDERED LIST OF
   EXERCISE IDS from the pool above — never a copy of the exercises
   themselves. Settings → Edit the week (admin) → Workouts is the roster;
   opening one shows its exercises with move-up/down/remove and a "From the
   pool" picker to add more, plus an "Edit details" sheet for the title,
   picture, description and an optional minutes override. Not tied to any
   day — the same workout can be assigned to any number of people on any
   number of days.
3. **Assignments** (`/api/assignments`) — which workout(s) one account does
   on a given weekday, each at its own time. Stored on the account itself
   (`assignments` in `_lib/users.mjs`, mirroring how a reminder override
   already worked), not in a store of its own. Settings → Edit the week
   (admin) → Assign workouts: pick a person, see their whole week — every
   day, what's on it and at what time, with an Add and a Remove for each —
   matching the owner's own description of the flow exactly: "select a
   user, then a day, then a workout(s), assigned to a specific time."

**Referencing, not copying, is what makes an edit reach everywhere it is
used.** Because a workout stores exercise IDS and an assignment stores a
workout ID — never a frozen copy of the fields — editing an exercise in the
pool changes it in every workout that uses it, immediately, for everyone it
is assigned to. This was explicit: "if I want to add an exercise to a
workout and the exercise doesn't exist, I must first go to the repository,
create the exercise, and then it will be available when I go back to
finishing the creation of my workout." Sets, reps, rest and effort are part
of that same fixed definition — not a per-workout override — so the same
exercise looks identical everywhere it appears; a different rep scheme for
the same movement is a second pool entry.

**A "day" is still a repeating weekday, Monday through Sunday, the same
every week — not a dated calendar.** Simpler, and it's what the app already
was; assignments just moved from being shared by everyone to being personal
to whoever they're assigned to.

**Nothing about an old shared week carried over.** Every account starts
blank; the admin builds each person's schedule by hand from the
repositories above. There is also no more public, signed-out plan — the
week is personal now, so **a visitor has to sign in before seeing
anything**, and `data/plan.json` (the old committed floor under a public
plan) is gone along with it. What is still true: everything works with no
server at all — see *What it does*, above — it's just that the fallback is
now that account's own last-synced schedule, cached per account in this
browser, rather than a static committed file.

**Resolving happens on the server, not the client.** `/api/assignments`
(self-service, for the signed-in account's own schedule; admin-only with
`?user=<id>` for anyone else's) joins that account's raw assignments against
the workout and exercise pools and hands back the whole thing ready to
render or play — `resolveAssignments` in `_lib/data.mjs`, pure and tested.
A regular account can never reach the raw `/api/exercise-library` or
`/api/workout-library` endpoints (both stay admin-only, same as before) —
only the resolved shape their own assignments produce.

    node --test workout/netlify/functions/_lib/data.test.mjs

## Accounts — up to five, for the beta

**Signing in and editing are two unrelated locks**, on purpose. An account —
email and password, or Google — is a real person's own, and it is what their
training record is attached to and what makes it sync between their phone and
their iPad. It has nothing to do with editing the week.

**Create one, sign in, or reset a forgotten password** from the **Sign In**
button a signed-out visitor sees on the week screen (a small "Create an
account" link sits under it, deliberately less prominent — signing in is
what almost everyone here is doing), or `/#/login` directly. Five accounts,
while this stays a small beta rather than something built out with real
multi-tenant infrastructure — invoices, roles, self-service account
deletion — before it is known whether any of that is needed. Raising the
number later is a one-line change in `_lib/users.mjs`.

**Signed in, Settings → Change password** sets a new one without needing an
email round trip — the current password proves it is really her, the same as
any account settings screen. Changing it signs every other device out, on
purpose: a stolen or forgotten-about session should not survive a password
change. A Google-only account has no password to change and Settings says so
rather than offering a form that would only fail.

**Admin gets a read-only roster, not a management screen.** Settings → Edit
the week (admin) → *Who has an account* lists everyone who has signed up —
email, name, Google or password, when they joined, when they last signed in,
and how many workouts they have logged — so the operator can tell at a
glance whether the beta is full and who is actually using it. It cannot
change or remove anyone; for five people, "ask them to email you" covers the
rare case that needs it, and it is not worth a delete button that could be
mis-tapped.

**Admin is a property of the account, not a separate password — see the next
section.** `corydzbinski@gmail.com` signing in already IS signing in as
admin; there is nothing further to unlock.

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

**Each account's own record, and nobody else's — admin included.** The old,
single shared record from before accounts existed was
copied once into whoever created the very first account, so nothing already
logged was lost; every account after that starts with a clean training log of
its own. See the storage table below for exactly who can read what.

## Editing — admin screens, not the week itself

Rebuilt 28 Aug 2026, alongside the repositories described above. There used
to be a pencil that turned whatever page you were looking at into an
in-place editor, with a draft of the whole week and a save bar. There is no
longer anything to edit in place: an exercise's fields, a workout's
exercises, and who a workout is assigned to are each their own screen,
reached from Settings, and every change on them saves the moment it is
made — no draft, nothing to publish separately.

**The lock is the account itself, changed again on 28 Aug 2026.** The admin
password and its long-press gesture are gone from the app's own UI. Admin is
now a short, explicit list of email addresses — `_lib/admin-emails.mjs`,
`corydzbinski@gmail.com` only today — checked against whoever is signed in.
Sign in as one of those addresses and the app already knows; sign in as
anyone else, or nobody, and no admin control is ever shown at all, not even
as a locked or greyed-out one. Asked for by the owner directly: *"for an
admin, let's designate certain emails to be admins automatically."*

The old `WORKOUT_PASSWORD`-and-gesture path still works underneath — every
admin-only endpoint accepts either proof, see `_lib/users.mjs`'s
`isAdminRequest` — because `WORKOUT_PASSWORD` still signs every session
token on the site (see `_lib/auth.mjs`'s `sessionSeed`) and cannot be
retired on that account. It is simply not reachable from the UI any more:
there is no long-press and no `/#/admin` password prompt — that URL now
just turns admin view on for whoever is already allowed one, or does
nothing.

**An admin's default view is their own week, same as anyone else's — they
are a person doing workouts too.** What is new is a toggle at the top of the
page, next to History and Settings, shown ONLY to a signed-in admin account:
press **Admin view** to switch to the repositories and the roster, **My
view** to switch back. It is a view preference, not a second lock — the
account sign-in already is one — so it needs no password of its own and is
simply remembered in this browser's `localStorage`.

**In admin view, the background tints red** on every screen, not just the
admin ones — an unmissable answer to "which mode am I in", carried over
unchanged from the old design.

Switch to admin view — or press **Settings → Edit the week (admin)** once
already there — for every admin screen:

- **Exercise pool** — every exercise, with Edit (a sheet: name, picture,
  video, sets, reps, rest, effort, notes) and Remove.
- **Workouts** — every saved workout; open one to see its exercises
  (move-up/down/remove, and "From the pool" to add more) and its own
  details (title, picture, description, an optional minutes override).
- **Assign workouts** — pick a person, see their whole week, add or remove
  a workout on any day at any time.
- **Video library**, **Reminder schedule**, **Who has an account** —
  unchanged from before.

Saving writes to the store and is live on every device on their next load. No
committing, no deploy.

## Pictures and videos — two different things

An exercise's Edit sheet, on the Exercise pool screen, has two halves for its
media, because they do two different jobs.

**The picture** is what it looks like: the thumbnail in the exercise list, and
what the stage shows before anything plays. It is there the moment the screen
paints.

**The video** is what plays when she starts that exercise.

They are independent. An exercise can have a picture and no video, which is
often all a familiar movement needs. It can have a video and no picture. Or it
can have both, which is the best of it — the picture is the video's poster, so
the stage shows the movement rather than a black rectangle while it loads.

**A workout has a picture too**, and no video: a workout is not a movement.
Settings → Edit the week (admin) → Workouts → open one → Edit details. It
shows on the week board, at the top of the day, and on today's card.

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

**Settings → Edit the week (admin) → Video library** is its own screen —
every saved link at once, with Edit and Remove, rather than only being
reachable from inside one exercise's media sheet. Editing a saved link's
name or url here updates the library entry itself; it does not reach back
into exercises that already copied the old url in — picking from the
library copies the link at that moment, it is not a live reference.

### The exercise pool — the ONLY place an exercise is created or edited

Added 27 Aug 2026 as a place to build workouts from instead of retyping the
same exercise each time it recurred. Rebuilt 28 Aug 2026 into what it is
now: not a convenience alongside day-by-day editing, but the sole place an
exercise's fields exist at all. **Settings → Edit the week (admin) →
Exercise pool** is the roster — every saved exercise with its sets/reps/rest
and effort at a glance, **+ New exercise**, and Edit/Remove on each. Edit
opens the same full sheet a new exercise gets: name, picture, video (paste a
link or pick "From the library"), sets, reps, rest, effort, notes.

**A workout references an exercise by id, never a copy of its fields** — see
*Exercises, workouts and schedules*, above. That is what makes an edit here
reach every workout that uses it, immediately: build the exercise once, and
"From the pool" on a workout's own screen is how it gets used, as many times
as it is needed, in as many workouts as it is needed in. Removing a pool
entry does not touch a workout it is already part of — a workout's own list
of exercise ids simply stops resolving that one, shown as "removed from the
pool" rather than crashing.

Admin only — viewing and picking are both gated the same way the video
library is, since this is part of building the week, not something a
signed-in account needs.

Server-side it is `/api/exercise-library`, and both add and update run
through the exact same `normaliseExercise` every exercise is validated
through — an edit can never carry something a brand new exercise would have
been refused. Capped at 300.

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

**"Today" is that account's own assignments now, resolved server-side each
sweep** — `_lib/tick.mjs` fetches the workout and exercise pools once per
sweep, then that device's own account (cached per account within the sweep,
so two devices signed into the same one do not fetch it twice) and works out
which weekday "today" is in that device's own zone before asking `dueNow` in
`_lib/remind.mjs` whether to speak. Two or more workouts on the same day say
how many and name them, rather than picking one to feature; the link always
opens the day (`/#/day/<weekday>`), never a specific workout, since there
may be more than one waiting.

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
| **This account's own schedule** (`/api/assignments`) | that account, signed in — or admin, for anyone's | admin only — assigning a workout is the admin's job |
| **An account's own record** (`/api/history`) | that account, signed in | that account, signed in |
| **Accounts** (email, name, a password hash — never the password itself) | admin, sanitised — email, name, join date, nothing that could sign in as them | signing up, or Google, once; a signed-in account can change its own password |
| **Reminder schedule & messages** | admin | admin |
| **The video library** | admin | admin |
| **The exercise pool** | admin | admin |
| **The workout library** | admin | admin |

Two separate locks, two separate cookies: admin — see *Editing*, above, for
what that means since 28 Aug 2026 — gates every repository and every
schedule; an account gates one person's own record — and reading their own
schedule — and nothing else, not another account's record or schedule, and
no write access to any of it. Being an admin does not let anyone read a
training record; being signed into an account does not let anyone edit
anything.

There is no committed floor under the schedule the way `data/plan.json` used
to be — a schedule is personal, so there is nothing safe to show a phone
that has never signed in. Signed in at least once, this browser caches that
account's own last-synced schedule, which is what a gym with no signal
falls back to.

**How admin works, since 28 Aug 2026.** Every admin-only endpoint calls
`isAdminRequest` (`_lib/users.mjs`), which is true for either of two proofs:
signed in with an account whose email is in `_lib/admin-emails.mjs`, or —
kept only because `WORKOUT_PASSWORD` cannot be retired outright, see
*Editing* above — the old admin-password session cookie, which nothing in
the app's own UI sets any more. Either way what actually authorises a write
is a server-side check, so a visitor editing the page in dev tools changes
what *they* see and nothing else. `WORKOUT_PASSWORD` itself is still
compared on the server if the old `/api/auth` path is ever used directly;
ten wrong guesses from one address inside fifteen minutes and that address
waits, same as always.

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

       WORKOUT_PASSWORD = any long random string

   Nothing in the app's own UI asks for this directly any more — see
   *Editing*, above — but everything else, accounts included, needs it set
   to work at all (it signs every session token on the site) and fails
   closed without it. Who is actually admin is a separate, short list of
   email addresses in `netlify/functions/_lib/admin-emails.mjs`, edited and
   deployed like any other code change. Everything below is optional:

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

## Branding — the "CW" mark, and the orange, added 28 Aug 2026

The owner asked for a real logo ("let's use 'CW' for Carissa's Workout"), that
same mark on the iPhone home-screen icon, and "a proper splash, with anything I
may be forgetting a splash page needs." Then, once the mark existed, asked to
recolor the whole app to match it rather than keep the old blush pink next to
a new orange mark.

**The mark is a vector trace of the owner's own artwork, not a hand-drawn
guess.** The owner supplied a reference logo (an orange swoosh "C" over a
white angular "W") only as a 494×284 PNG pasted into chat — genuinely the
best resolution they had. A first attempt redrew it freehand and got the
proportions wrong (reported back as "wrong shape overall"). The fix was to
stop guessing: `potrace` traced the actual reference PNG's pixels directly
— the orange and white regions separated by color threshold into two masks,
each traced to a clean vector path, then cropped to their shared bounding
box — so `icons/favicon.svg`'s paths are the real logo's outline, not an
approximation of it. Every icon and splash size is rendered from that one
SVG through Playwright/Chromium (`omitBackground: true` for a transparent
master) and composited onto the ink background with Pillow. Regenerate
every size from `icons/favicon.svg` if the mark ever needs to change — do
not hand-edit any of the PNGs in `icons/`, and if the source artwork
changes, retrace it with `potrace` rather than redrawing by eye.

**The accent color is now `#FB3800`**, sampled directly from the reference
logo's orange rather than eyeballed, replacing the old blush pink
(`#E79AA6`/`#C4707F`) everywhere — the `--blush`/`--blush-2` custom properties
in `css/workout.css` keep their names (renaming them would have touched many
call sites for no behavioural gain) but now hold orange. That covers the
`:root` variables, 17 places that hardcoded the old pink as `rgba(...)` for
opacity effects rather than referencing the variable, and the lighter hover
tint (`#F0AAB5` → `#FC6033`). Sage green (`--sage`, "done/complete") was left
alone — it is still the right semantic contrast against orange-as-primary.

**The icon set**: `icons/icon-192.png`, `icons/icon-512.png`,
`icons/apple-touch-icon.png` (180×180), and `icons/maskable-512.png` (mark
kept inside the safe ~80% circle so a round or squircle mask never clips it).
`manifest.webmanifest` and `index.html`'s `<link rel="apple-touch-icon">`
already pointed at these filenames, so no reference needed to change — only
the pixels underneath them did, which is why `sw.js`'s `VERSION` had to bump
(`workouts-v22`): the shell precache otherwise keeps serving an already-
installed phone the old pink icon file for ever.

**The splash**: `#boot-splash` in `index.html` is an inline SVG of the mark,
shown full-viewport over the ink background from the very first paint,
CSS-animated with a slow pulse (`@keyframes boot-pulse`, respecting
`prefers-reduced-motion`), and faded out by `hideBootSplash()` in `js/app.js`
once the first real screen has rendered — called from inside the `ready.then`
block, after `render()`, so it never disappears onto a still-loading screen.
A `<noscript>` rule hides it outright if JavaScript never runs, so it can
never permanently cover the "needs JavaScript" notice.

iOS shows nothing of its own between the home-screen tap and first paint
unless told what to — that is what the six `apple-touch-startup-image` links
in `index.html`'s `<head>` are for, one per exact `device-width`/
`device-height`/`-webkit-device-pixel-ratio`/`orientation` combination Safari
matches on (it does not scale a close-enough image; an unlisted device just
gets a plain ink screen for that first instant instead of the branded one).
The PNGs themselves live in `icons/` alongside the app icons.

**The sign-in gate lost its explanatory copy and gained real buttons.** Per
feedback that the first draft ("Your week is on your account now...") "sounds
dumb," the signed-out `renderWeek()` screen is now a plain "Sign in to see
your week" heading with a one-line description and two ordinary buttons —
**Sign In** and **Create Account** — rather than one combined button trying to
explain the account model. The header's signed-out subtitle was also dropped
(it read "Carissa / sign in", which repeated the buttons right below it).

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
    js/store.js               the schedule and the record: load, save, sync, the numbers
    js/account.js             talking to /api/account and the admin endpoints
    js/media.js               shrinking a picture and sending it
    js/library.js             the video library: list, add, update, remove — admin only
    js/exercise-library.js    the exercise pool: list, add, update, remove — admin only
    js/workout-library.js     the workout library: list, add, update, remove — admin only
    js/assignments.js         a schedule: my own, or (admin) anyone's — read; admin-only to write
    js/push.js                asking to be reminded, and what to do if it cannot
    js/app.js                 the screens, the admin editors, and the one click handler
    icons/                    app icons, generated from icons/favicon.svg
    manifest.webmanifest      makes it installable
    sw.js                     the offline cache — bump VERSION when the file list changes
    netlify.toml              this folder's own site config
    package.json              one dependency: @netlify/blobs, for the functions

    netlify/functions/auth.mjs       the ADMIN password: signing in, out, the lockout
    netlify/functions/account.mjs    accounts: sign up, sign in, Google, reset, change password
    netlify/functions/admin-people.mjs   admin-only: the account roster, read-only
    netlify/functions/admin-reminders.mjs   admin-only: the schedule, the messages, per-person overrides
    netlify/functions/video-library.mjs     admin-only: saved videos — list, add, update, remove
    netlify/functions/exercise-library.mjs  admin-only: saved exercises — list, add, update, remove
    netlify/functions/workout-library.mjs   admin-only: saved workouts — list, add, update, remove
    netlify/functions/assignments.mjs   a schedule: self-service to read your own; admin for anyone's, and every write
    netlify/functions/history.mjs    an account's own record: that account only, to read or write
    netlify/functions/media.mjs      pictures: public to read, password to add — no video, see above
    netlify/functions/reminders.mjs  which device wants nudging, and when — an account, signed in
    netlify/functions/reminder-tick.mjs  the hourly sweep, run by Netlify itself
    netlify/functions/_lib/remind.mjs         whether a nudge is owed, and what it says — pure, and tested
    netlify/functions/_lib/reminder-shape.mjs the admin schedule's arithmetic — pure, and tested
    netlify/functions/_lib/reminder-config.mjs  the schedule's store, and pushing it onto devices
    netlify/functions/_lib/push.mjs          sending one, and pruning dead devices
    netlify/functions/_lib/tick.mjs          the sweep itself, resolving each account's own schedule
    netlify/functions/_lib/auth.mjs          the admin password, its cookie, the stores, the shared session seed
    netlify/functions/_lib/users.mjs         the account store, its sessions, password resets, its assignments
    netlify/functions/_lib/credentials.mjs   password hashing and email validation — pure, and tested
    netlify/functions/_lib/google.mjs        verifying a Google sign-in — pure claim checks, and tested
    netlify/functions/_lib/mail.mjs          sending the reset-link email, via Resend
    netlify/functions/_lib/data.mjs          the shape of every repository and the record, and every clamp

Run the tests after touching anything under `_lib/`, or `js/catalog.js` /
`js/insights.js`:

    node --test workout/netlify/functions/_lib/*.test.mjs workout/js/*.test.js

Plain Node, nothing to install.
