# Farmhouse Getaways — website

Static site. No build step, no dependencies, no npm. Plain HTML and one CSS file.
That is deliberate: it deploys instantly, it cannot break from a dependency
update, and it scores near-perfect on speed and SEO out of the box.

## Files

| File | What it is |
|---|---|
| `index.html` | Homepage |
| `red-barn-ranch.html` | Property page — includes Lodgify booking slot |
| `mountain-retreat.html` | Property page — includes Lodgify booking slot |
| `wedding-groups.html` | Weddings and retreats, with the inquiry form |
| `our-story.html` | Cory and Carissa |
| `ramona.html` | The region |
| `thanks.html` | Where the group inquiry form lands |
| `thanks-list.html` | Where the farmstand-map signup lands |
| `edit.html` | Edit mode — change any text on the site, visually |
| `404.html` | Not-found page |
| `css/site.css` | All styling, one file |
| `netlify.toml` | Netlify config and cache headers |

## Deploy

The site deploys from this repo:
`github.com/FarmhouseGetaways/farmhousegetaways`.

Netlify is already connected to it. `netlify.toml` sets `publish = "."` with no
build command, so the files ship exactly as they are in the repo.

**Every commit to `main` triggers a Netlify build.** Depending on your Netlify
settings you may still need to click **Publish** on the deploy.

### The one rule: never drag files onto Netlify

Do not drag a folder or zip onto the Netlify drop area, and do not upload files
through the Netlify UI. A dragged deploy bypasses the repo entirely, so the live
site and `main` drift apart — and the next commit silently reverts whatever was
dropped.

That is not hypothetical. It is exactly how this version (D16) was lost: D16 was
dragged onto Netlify, then an older snapshot was committed to the repo, and the
commit overwrote it. Recovering it meant digging up the original zip by hand.

The repo is the source of truth. Changes go in as commits, or they don't go in.

## Before it goes live

- [ ] **Make the Ramona Farmstand Map file.** Both signup forms promise it by
      name. Until it exists, every signup is a promise you cannot keep.
- [ ] **Connect an email tool** (Klaviyo, Mailchimp) behind the `newsletter`
      form so the map sends itself. Netlify Forms alone just emails you the
      address — it will not deliver anything to the subscriber.
- [ ] Turn on form notifications in Netlify → Forms so inquiries reach your inbox
- [ ] Check every number on the boards against reality
- [ ] Delete the **STAGING** block in `netlify.toml` and restore `robots.txt`
- [ ] Point the domain only after all of the above

## Changing the words yourself

See **PUBLISHING.md**. Short version: go to `/edit.html`, click any text and type
over it, hit Save, then tell Claude Code to apply the file and publish.

## If the site looks broken after an update

Almost always a stale stylesheet — your browser holding on to the old design
file. Tell Claude; there is a script that fixes it properly rather than asking
you to clear your cache.

## The hero

Six photos fade into each other on a 42-second loop. Phones and anyone who has
asked their computer to reduce motion see the first one, held still.

To change which photos appear, ask Claude — the shots are graded first and the
headline contrast is re-checked against each one.

## Photos

Drop them in `/images/`. Resize first: landscape ~1600px wide, JPEG q78–84,
progressive, under 300 KB. Filenames lowercase with hyphens, no spaces.
Every `<img>` needs `alt`, `width`, `height`, `loading="lazy"` and
`decoding="async"`.

## Forms

Two Netlify forms. Nothing to install — Netlify detects the
`data-netlify="true"` attribute on deploy. Submissions appear under
**Forms** in the Netlify dashboard. Set up email notifications there.
A honeypot field catches most spam.

| Form name | Where | Lands on |
|---|---|---|
| `group-inquiry` | `wedding-groups.html` | `thanks.html` |
| `newsletter` | the map band on index/ramona/our-story, plus the footer strip on every page | `thanks-list.html` |

Every `newsletter` submission carries a hidden `source` field telling you which
placement it came from (`home-band`, `footer-rbr`, and so on). That is your only
conversion attribution — keep it when editing.
