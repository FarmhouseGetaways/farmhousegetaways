# Brand kits — Mini Barn Market and Farmstand.TV

Two complete, ready-to-deploy sites parked here **temporarily**. They are not
part of the Farmhouse Getaways site and nothing here is served on the web —
`netlify.toml` 404s `/brand-kits/*`.

## Why they are sitting in this repo

They each need their own GitHub repo, and the Claude GitHub App cannot create
repositories — it returns `403 Resource not accessible by integration`. Rather
than leave the work on a disposable container that gets wiped, it is committed
here so it survives until the repos exist.

**This is a holding pen, not a home.** Move them out and delete this folder.

## Moving one out into its own repo

Create an empty repo on GitHub named `minibarnmarket` (no README, no
.gitignore), then:

    git clone https://github.com/FarmhouseGetaways/farmhousegetaways.git tmp
    cd tmp/brand-kits/minibarnmarket
    git init && git add -A
    git commit -m "Mini Barn Market — site and EmailOctopus signup"
    git branch -M main
    git remote add origin https://github.com/FarmhouseGetaways/minibarnmarket.git
    git push -u origin main

Same for `farmstandtv`. Then delete `brand-kits/` from this repo and remove the
`/brand-kits/*` redirect from `netlify.toml`.

## What each kit contains

| Path | What it is |
|---|---|
| `index.html` | The site |
| `css/site.css` | All styling, one file |
| `images/` | Only the images that page references |
| `netlify.toml` | Publish config, function directory, security headers |
| `netlify/functions/` | The EmailOctopus sync — same code as the main site |
| `emails/` | The welcome email, ready to paste into EmailOctopus |
| `tools/eo-provision.mjs` | One-command list setup and live tagging check |
| `SIGNUP-SNIPPET.html` | The signup form, if you want it on another page |

The function code is deliberately identical across all three sites. The only
difference is the `EMAILOCTOPUS_BRAND` environment variable, which sets the tag
the contact is filed under — `minibarnmarket` or `farmstandtv`. Each kit
defaults to its own brand, so the variable only matters if you want to override
it.

All three sites feed **one** EmailOctopus list and are told apart by tag.

Tests are plain Node, no npm:

    node --test netlify/functions/_lib/*.test.mjs

15 tests per kit. Run them after any change under `_lib/`.

## Known gap — the logos

Four referenced logo files were never made and are not in this repo:

- Mini Barn Market: `logo-fill.png`, `logo-red.png`, `logo-tan.png`
- Farmstand.TV: `logo.png`

Each page renders fine without them — the browser shows the `alt` text — but
they should be dropped into `images/` before either site goes public.

## Setting one live, once its repo exists

1. Netlify → **Add new site** → **Import from Git** → pick the repo.
2. No build command. Publish directory `.`.
3. Environment variables: `EMAILOCTOPUS_API_KEY`, `EMAILOCTOPUS_LIST_ID`,
   `ADMIN_PASSWORD` — the same values as the Farmhouse Getaways site, since all
   three share one list.
4. Deploy, then open `/api/emailoctopus?key=ADMIN_PASSWORD&selftest=1` and check
   it reports `"ready": true`.
