# Working on this site

Read this first. It is the handover between sessions.

## What this is

The Farmhouse Getaways website. A static site: plain HTML, one CSS file, no
build step, no dependencies, no npm. Ramona, California — two vacation
properties, Red Barn Ranch and Mountain Retreat, hosted by Cory and Carissa.

## How it goes live

```
edit a file  ->  commit to main  ->  push  ->  Netlify builds  ->  live (~30s)
```

Netlify is connected to this repo and builds `main` automatically. No Publish
click is needed — it self-publishes. `netlify.toml` sets `publish = "."` with no
build command, so files ship exactly as they are here.

Live at **https://farmhousegetaways.netlify.app**.

### The one rule: never drag files onto Netlify

Do not drag a folder or zip onto the Netlify drop area, and do not upload files
through the Netlify UI. A dragged deploy bypasses the repo, so the live site and
`main` drift apart — and the next commit silently reverts whatever was dropped.

This is not hypothetical. A version called D16 was dragged onto Netlify, then an
older snapshot was committed here, and the commit destroyed it. Recovering it
meant hunting down the original zip by hand. Restored 6 Aug 2026 in `1bec6a5`.

The repo is the source of truth. Changes go in as commits, or they don't go in.

## How the owner works

They talk in plain language — often dictated, so expect transcription quirks
("d sixteen" for D16, punctuation spoken aloud). They describe what they want
changed on the page; you find it, edit it, commit it, push it, confirm it is
live. They are not going to run git commands. Do that part for them.

Verify the change actually reached the live site before saying it is live —
curl the page and check for the new text. A push is not a deploy.

## The site is deliberately hidden from Google

`robots.txt` says `Disallow: /` and `netlify.toml` sends
`X-Robots-Tag: noindex, nofollow`. This is on purpose: `farmhousegetaways.com`
still points at the old WordPress site, and this one is staging until the domain
moves.

**Do not "fix" this.** Both files carry plain-English instructions for the day
the domain is pointed here. Flip them only when the owner says the domain has
moved.

## Pages

| File | What it is |
|---|---|
| `index.html` | Homepage |
| `red-barn-ranch.html` | Property — sleeps 20. Lodgify booking box |
| `mountain-retreat.html` | Property — sleeps 14. Lodgify booking box |
| `wedding-groups.html` | Weddings and groups, with inquiry form |
| `book-both.html` | Booking both houses — 34 across both |
| `ramona-farmstand-map.html` | The farmstand map, with signup |
| `our-story.html` | Cory and Carissa |
| `ramona.html` | The region |
| `thanks.html` / `thanks-list.html` | Form landing pages |
| `edit.html` | Visual editor (see below) |
| `404.html` | Not-found page |
| `css/site.css` | All styling, one file |

## Redirects — do not delete

`netlify.toml` carries 301s for the old site's indexed URLs: `/rbr`, `/mr`,
`/imm`, `/weddings`, `/map`, `/photo`, `/socialmedia`, `/blank-2`, and
`/events.html`. Google has these indexed and Farmstand.TV links to some by hand.
Removing them 404s those links the moment the domain is pointed here.

## Editing conventions

- **Line breaks in a `.lede` or `.prose` paragraph**: use `<br>`, not a second
  `<p>`. `site.css` styles `.lede br` as `display:block` with a `.95em` top
  margin precisely so a break reads as a paragraph break. This keeps hand edits
  and editor edits producing identical markup.
- **Images**: keep the `width`/`height` attributes when swapping one so the page
  does not shift while loading, and keep `loading="lazy"` below the fold.
- **Lodgify booking boxes** on the property pages are live embeds. Leave them
  alone.
- **The ticker** (the scrolling bar, `section.ticker`) holds its `<ul>` **twice**
  on every page. The second copy is `aria-hidden="true"` and exists only so the
  scroll loops seamlessly. Any change to a ticker item must be made in both
  copies or the old version keeps scrolling past every other cycle. The ticker
  appears on `index`, `book-both`, `mountain-retreat`, `wedding-groups` and
  `red-barn-ranch` — a change to one usually means a change to all five.
- **The same phrase often appears in several roles**: the ticker, a detail board
  (`<span class="k">…</span>`), and a hero tag. When the owner names one, change
  only that one and tell them where the others still are.

## Known broken

`netlify/functions/publish.mjs` — the Publish button inside `/edit.html` posts
here, and it deploys straight to Netlify using `NETLIFY_TOKEN`, which is dead
and revoked. It fails with "NETLIFY_TOKEN is not valid."

The fix, when asked for: rewrite it to commit to GitHub instead of deploying to
Netlify, so editor changes and code changes go through the same door and cannot
overwrite each other. The **Save to a file** button still works meanwhile.

## Access

The Claude GitHub App is installed on this repo with write access, so a cloud
session can push directly. If a push ever returns 403, check that the app is
still installed at github.com/settings/installations — authorizing the app is
not the same thing as installing it, and only the install grants write.
