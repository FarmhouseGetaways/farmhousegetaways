# CC follow-on — the other two brand sites

Run this AFTER Task 7 in the first prompt came back `"ready": true`.
It uses the same API key and the same list. Nothing new to create in EmailOctopus.

Why this exists: minibarnmarket.com and farmstand.tv are separate Netlify
projects. Environment variables do not carry across projects. Without this the
two brand sites never reach the list, even though the Farmhouse site does.

---

## TASK A — tell me how these two sites are deployed

I cannot see this and it changes what we do next.

1. Open https://app.netlify.com/projects/minibarnmarket/configuration/deploys
2. Under **Build settings**, tell me exactly what it says for
   **Repository** — a GitHub URL, or "No repository" / a manual-deploy note.
3. Do the same for
   https://app.netlify.com/projects/farmstandtv/configuration/deploys

Report both before doing anything else. If either says it is linked to a Git
repository, tell me the URL and STOP — the plan changes.

## TASK B — set the variables on Mini Barn Market

https://app.netlify.com/projects/minibarnmarket/configuration/env

Add, same value for all deploy contexts:

    EMAILOCTOPUS_API_KEY   the same key from the first prompt   (mark secret)
    EMAILOCTOPUS_LIST_ID   the same list id from the first prompt
    EMAILOCTOPUS_BRAND     minibarnmarket
    ADMIN_PASSWORD         RamonaBarn-2026-Map-Check

`EMAILOCTOPUS_BRAND` is what tags these signups as Mini Barn Market rather than
Farmhouse. Spelling matters — all lowercase, one word.

## TASK C — set the variables on Farmstand.TV

https://app.netlify.com/projects/farmstandtv/configuration/env

Same four, with one difference:

    EMAILOCTOPUS_API_KEY   the same key                          (mark secret)
    EMAILOCTOPUS_LIST_ID   the same list id
    EMAILOCTOPUS_BRAND     farmstandtv
    ADMIN_PASSWORD         RamonaBarn-2026-Map-Check

## TASK D — check whether the forms are live yet

Open each of these and tell me whether you can see an email signup form on the
page:

- https://minibarnmarket.com  (should be above the "Stay a while" section)
- https://farmstand.tv        (should be between "Get your stand on the map"
                               and "Come and stay while you are here")

**Expect them to be MISSING.** The forms are written and committed but those
sites have not been redeployed yet. Just confirm what you see — do not try to
add them.

Then check both of these and tell me the exact response:

- https://minibarnmarket.com/api/emailoctopus?key=RamonaBarn-2026-Map-Check
- https://farmstand.tv/api/emailoctopus?key=RamonaBarn-2026-Map-Check

A 404 here is expected too, for the same reason. Report it and stop.

---

Report A, B, C and D back and I will take it from there.
