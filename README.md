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

1. Create a repo at `github.com/FarmhouseGetaways/farmhousegetaways-site`
2. Upload these files to it
3. At netlify.com, sign in with GitHub, "Add new site" → "Import an existing project" → pick the repo
4. Leave the build command empty. Publish directory: `.`
5. Deploy

Every push to the repo redeploys the site automatically.

## Before it goes live

- [ ] Replace the photo frames with real photos (each frame says what to shoot)
- [ ] Paste the Lodgify **booking box** code into both property pages — search the
      files for `LODGIFY BOOKING BOX GOES HERE`. Use the booking box, not the
      search bar; the search bar sends guests off-site.
- [ ] Confirm Mountain Retreat's real sleeping capacity — currently written as 10
- [ ] Check every number on the boards against reality
- [ ] Turn on form notifications in Netlify → Forms so inquiries reach your inbox
- [ ] Point the domain only after all of the above

## Photos

Drop them in `/images/` and swap each `<div class="frame">…</div>` for an
`<img>`. Every frame contains a note describing exactly what the shot should be.

## Forms

`events.html` uses Netlify Forms. Nothing to install — Netlify detects the
`data-netlify="true"` attribute on deploy. Submissions appear under
**Forms** in the Netlify dashboard. Set up email notifications there.
A honeypot field catches most spam.
