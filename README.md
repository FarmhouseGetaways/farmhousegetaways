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
| `events.html` | Weddings and retreats, with the inquiry form |
| `our-story.html` | Cory and Carissa |
| `ramona.html` | The region |
| `thanks.html` | Where the inquiry form lands |
| `404.html` | Not-found page |
| `css/site.css` | All styling, one file |
| `netlify.toml` | Netlify config and cache headers |

## Deploy

The site is live and deploys from this repo:
`github.com/FarmhouseGetaways/farmhousegetaways`.

Netlify is already connected to it. `netlify.toml` sets `publish = "."` with no
build command, so the files ship exactly as they are in the repo.

**Every commit to `main` triggers a Netlify build.** Depending on your Netlify
settings you may still need to click **Publish** on the deploy.

### The one rule: never drag files onto Netlify

Do not drag a folder or zip onto the Netlify drop area, and do not upload files
through the Netlify UI. A dragged deploy bypasses the repo entirely, so the live
site and `main` drift apart — and the next commit silently reverts whatever was
dropped. That has cost real work more than once.

The repo is the source of truth. Changes go in as commits, or they don't go in.

## Making changes

- **Small copy edits** — edit the file on github.com and commit, or commit from a
  clone. Netlify picks it up.
- **Anything larger** — work on a branch and open a pull request, so the diff is
  reviewable before it reaches `main` and therefore the live site.

## Still open

- [ ] Confirm form notifications are on in Netlify → Forms so inquiries reach the inbox
- [ ] Check the numbers on the property boards against reality (Red Barn Ranch is
      written as sleeping twenty)

Photos and Lodgify booking boxes are done — every frame has been replaced with a
real image, and both property pages render a live `lodgify-book-now-box`.

## Photos

Live photos are in `/images/` and referenced with plain `<img>` tags. Keep the
`width`/`height` attributes when swapping an image so the page does not shift
while loading, and keep `loading="lazy"` on anything below the fold.

## Forms

`events.html` uses Netlify Forms. Nothing to install — Netlify detects the
`data-netlify="true"` attribute on deploy. Submissions appear under
**Forms** in the Netlify dashboard. Set up email notifications there.
A honeypot field catches most spam.
