# The emails

Three welcome emails, one per brand. Each delivers the Ramona Farmstand Map and
sends once, automatically, the moment somebody signs up.

| File | Goes to | Subject line |
|---|---|---|
| `welcome-farmhousegetaways.html` | tag `farmhousegetaways` | Here is the Ramona Farmstand Map |
| `welcome-minibarnmarket.html` | tag `minibarnmarket` | The barn is always open (and here is the map) |
| `welcome-farmstandtv.html` | tag `farmstandtv` | The Ramona Farmstand Map |

Each is in its own brand's colours, taken from that site's stylesheet. Every
link and image in them has been checked against the live sites.

## The one thing the API cannot do

EmailOctopus's API can add contacts, tag them, and **start** an automation. It
cannot **create** one. Campaigns are read-only over the API, and automations
have exactly one write endpoint. So the three automations below have to be
built by hand, once, in the browser. After that they run themselves.

## Building each one — about five minutes each

Do this three times, once per brand.

1. EmailOctopus → **Automations** → **New automation** → start from scratch.
2. Name it after the brand: `Welcome — Mini Barn Market`.
3. **Trigger:** contact subscribes to the list.
   * **Add a condition on the tag** — tag *is* `minibarnmarket`. This matters.
     One list serves all three brands, so an automation with no tag condition
     sends the Farmhouse welcome to Mini Barn Market signups.
   * If your plan will not let you put a condition on the trigger, do it the
     other way instead — see *Naming the automation explicitly* below.
4. Add a **Send email** step. No delay: they asked for the map, so the map
   should arrive while they are still looking at the thanks page.
5. In the email step choose the **HTML** editor, not the drag-and-drop one, and
   paste the whole matching file.
6. Set the subject from the table above. The preheader is in a comment at the
   top of each file.
7. **From name / reply-to:** the brand's own address — `minibarnmarket@gmail.com`,
   `farmstandtv@gmail.com`, `info@farmhousegetaways.com`. A reply should land
   somewhere someone reads.
8. Send yourself a test. Check it in Gmail on a phone and, if you can, Outlook.
9. Turn it on.

### Do not retype the merge tags

EmailOctopus treats double-curly-brace and brace-percent pairs as merge syntax.
A typo does not degrade into plain text — it fails to render and the reader
sees the raw tag. The four used here are all standard:

    {{FirstName|default("there")}}   first name, or a fallback if we never got one
    {{UnsubscribeURL}}               required, and EmailOctopus will not send without it
    {{SenderInfo}}                   your physical address, also required
    {{WebVersionURL}}                view in browser

`{{FirstName}}` is empty for most footer signups — those forms only ask for an
address — which is exactly why every one of them has a `default(…)`.

## Naming the automation explicitly

If tag conditions on the trigger are awkward, the code can start the right
automation itself instead. Open the automation, copy its id from the browser
address bar, and set it in **that site's** Netlify environment variables:

    EMAILOCTOPUS_AUTOMATION_ID = the id

`submission-created.mjs` then calls the automation directly after adding the
contact. Leave the variable unset and it stays out of the way and lets the
list-join trigger do the work. Both routes are fine; do not use both at once or
the welcome goes twice.

A contact already in the automation comes back `409`, which the code treats as
success — that is what stops a second signup re-sending the map.

## The recurring email

The welcome is automatic. A regular send is not, and should not be — there is
nothing to schedule until there is something to say.

When there is, it is EmailOctopus → **Campaigns** → **New campaign** → pick the
list → **filter by tag**, and this is where the tags earn their keep:

| Who you want | Filter |
|---|---|
| Everyone | no filter |
| Just the barn's customers | tag `minibarnmarket` |
| Just people who want to stay | tag `farmhousegetaways` |
| People weighing up Red Barn Ranch | tags `farmhousegetaways` **and** `red-barn-ranch` |
| People who came from one specific form | `source-footer-home`, `source-farmstand-map-page`, … |
| Wedding and group leads who opted in | tags `group-inquiry` and `lead` |

Campaigns can be scheduled for a date and time at the point of sending. There
is no recurring-campaign feature — a monthly send is a campaign you write and
schedule each month, which is the honest way round for a "what is ripe right
now" email.

**One or two a month.** Every signup form on all three sites promises exactly
that in writing, directly under the button.

## Editing these files later

They are plain HTML, and deliberately old-fashioned — tables, inline styles, no
`<style>` block, no flexbox. Outlook on Windows renders with Word's engine and
Gmail strips `<head>` styles, so anything modern falls apart in the two clients
most of this list reads mail in. Every dark cell also carries a `bgcolor`
attribute as well as a CSS background, because Outlook ignores the CSS one.

Editing here does **not** change what EmailOctopus sends. These files are the
source of truth for the wording; EmailOctopus holds its own copy. Change one,
paste it in again.

### An empty merge pair anywhere kills the whole email

EmailOctopus parses merge syntax across the entire document, **HTML comments
included**. An empty pair — two braces with nothing between them — is invalid,
and the server refuses the whole email with:

    This email has a syntax error, so we can't show a preview.

The editor preview still renders perfectly, which is what makes this hard to
spot: it only fails server-side, on the Preview & test screen, and "Send as
test" greys out.

All three files used to carry a comment explaining the merge-tag rule *by
quoting the delimiters*, which is precisely the thing that breaks it. Fixed
22 Aug 2026. **Describe merge syntax in words. Never by example, not even in a
comment.**
