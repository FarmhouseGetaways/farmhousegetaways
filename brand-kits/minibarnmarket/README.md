# Mini Barn Market

The website, plus the EmailOctopus signup wiring.

> ## ⚠ DO NOT CONNECT THIS REPO TO NETLIFY YET
>
> **This repo does not contain the website.** Right now it holds only the
> EmailOctopus integration. The live site at `minibarnmarket.netlify.app` was deployed by
> hand and its files are not in here.
>
> Connecting a repo to a Netlify site makes **the repo the whole truth**. The
> next build publishes exactly what is in here and deletes everything else.
> Connect it now and Mini Barn Market becomes a site with no pages.
>
> This has already happened once on this project. A version called D16 was
> dragged onto Netlify, an older snapshot was committed over it, and the
> commit destroyed it — recovering it meant hunting down the original zip.
>
> **Do the checklist below first. Then delete this box.**

## Getting the site in here

1. Find the folder these pages were built from — the one you drag onto Netlify.
2. Copy its entire contents into this repo. Every page, `css/`, `images/`,
   `downloads/`, `favicon.svg`, `robots.txt`, `404.html`, all of it.
3. Check nothing is missing against what is actually live:

   ```
   curl -sI https://minibarnmarket.netlify.app/            # each page you know about
   ```

   Open the live site and click every link in the nav and the footer. Any page
   that answers there and not from your folder is a page that will vanish.
4. Copy the Netlify UI settings into `netlify.toml` — see the warning at the
   top of that file. Redirects and headers set in the UI are **not** in the
   repo and are exactly the kind of thing that is missed.
5. Commit. Only then connect Netlify → Import from Git.
6. First deploy: **use a deploy preview or a branch deploy**, not production.
   Compare it against the live site before you let it near the real domain.

## The EmailOctopus part

Signups go to one EmailOctopus list shared by all three brands and are told
apart by tags. Contacts from this site are tagged `mini-barn-market`, plus a
`source-…` tag naming the form they came from.

One list rather than three because EmailOctopus bills per contact **per list**,
and the people who want the farmstand map are largely the same people who would
book the barn. Sending to just this brand is a tag filter, not a separate list.

### What to paste into the pages

`SIGNUP-SNIPPET.html` — built from classes this site's stylesheet already has,
so it needs no new CSS. The form name must stay `newsletter`; that is what
routes it to EmailOctopus.

### The quick way

    node tools/eo-provision.mjs

Paste your EmailOctopus API key when it asks. It finds the shared list (all
three brands use the same one), prints the exact variables to paste into
Netlify, and verifies tagging against the live API by adding a test contact,
reading it back to confirm the tags stuck, and deleting it.

That read-back is the only check that means anything — the wrong tag format is
accepted with a `200` and silently applies nothing.

### What to set in Netlify

Site configuration → Environment variables:

    EMAILOCTOPUS_API_KEY       = the key from EmailOctopus → Integrations & API
    EMAILOCTOPUS_LIST_ID       = the shared list's id
    ADMIN_PASSWORD             = something long, only guards the status page
    EMAILOCTOPUS_AUTOMATION_ID = the welcome automation's id   (optional, see below)

All three are the same values the farmhousegetaways site uses, except
`ADMIN_PASSWORD` which can differ. **No key goes in this repo, ever.**

Environment variables only reach the site on the next deploy, so trigger one.

### Check it

    https://minibarnmarket.netlify.app/api/emailoctopus?key=YOUR_ADMIN_PASSWORD

It reports what is still missing and prints every list on the account with its
id. When it says `"ready": true`, submit the form on the live site and the
address should appear on the list within seconds.

## The welcome email

`emails/welcome-minibarnmarket.html` is the auto-responder that delivers the
Ramona Farmstand Map. It is in this site's own colours and every link and image
in it has been checked against the live site.

**It has to be built once, by hand, in EmailOctopus.** The API can add contacts,
tag them and *start* an automation, but it cannot create one — campaigns are
read-only over the API. `emails/README.md` walks the whole thing; about five
minutes, then it runs itself.

The trap worth naming: one list serves all three brands, so an automation
triggered on plain "joined the list" would send **this** brand's welcome to
Farmhouse Getaways signups and vice versa. Put a tag condition of
`minibarnmarket` on the trigger. If your plan will not allow that, set
`EMAILOCTOPUS_AUTOMATION_ID` here instead and the code names the automation
explicitly. One route or the other — both at once sends the welcome twice.

## How it works

    someone submits the form
      -> Netlify saves it (it stays in the Netlify inbox the app's admin reads)
      -> Netlify checks it for spam
      -> Netlify calls netlify/functions/submission-created.mjs
      -> that adds them to EmailOctopus with tags

No EmailOctopus embed, no JavaScript in the page, no API key in front of
visitors, and the form still works with JavaScript off. If EmailOctopus is down
the submission is still saved — you would just add that one address by hand.
Failures show in Netlify → Functions → `submission-created`, prefixed
`[emailoctopus]`.

## Tests

    node --test netlify/functions/_lib/*.test.mjs

Plain Node, no npm install. They cover the two things that fail silently: tags
must reach the API as an object map (an array is accepted and ignored, leaving
every contact untagged), and inquiry forms must only subscribe someone who
actually ticked the box.

## Keeping in step

`netlify/functions/` is a copy of the same folder in the **farmhousegetaways**
repo, with one line different — the brand tag in `_lib/signup.mjs`. Three
separate Netlify sites, and none of these repos wants npm just to share one
module. Fix a bug in one, fix it in all three.
