# Pointing farmstand.tv and farmstandtv.com at Netlify

Status as of 19 Aug 2026: **not done yet.** Both domains still sit on
Directnic's URL forwarding. Two scripts in `tools/` carry the work.

## What is wrong today

Both domains resolve to `104.143.9.210` / `.211` — Directnic's free URL
forwarding boxes — and 301 every hostname to `https://rockstarsites.wixsite.com/farmstandtv`,
the old Wix site. Nothing reaches the Netlify site at all.

Worse, URL forwarding is HTTP-only. Port 443 has no certificate, so
`https://farmstand.tv` fails outright. Since browsers now try HTTPS first for
typed domains, most visitors simply get an error. Directnic confirmed this is a
limitation of the free forwarding tool, not a misconfiguration.

## The fix

Two routes, both ending with Netlify serving all four hostnames over HTTPS with
free auto-renewing certificates. Either way `farmstand.tv` is the primary domain
and `www.farmstand.tv`, `farmstandtv.com`, `www.farmstandtv.com` redirect to it.

Neither domain has any MX or TXT records, so **no email or verification records
can break** by changing DNS.

### Route A — leave DNS at Directnic (fewest moving parts)

Every value is fixed and known in advance, so nothing has to be fetched from
Netlify first and there is no back-and-forth. In Directnic, per domain: turn
**off** URL forwarding, then add

| Type | Host | Value |
|---|---|---|
| A | `@` | `75.2.60.5` |
| CNAME | `www` | `farmstandtv.netlify.app` |

In Netlify, add both domains to the `farmstandtv` project (Domain management →
Add a domain), choosing the "already have DNS" / external option, and set
`farmstand.tv` as primary. Netlify issues certificates once the records resolve.

The cost: an apex on an A record misses Netlify's direct CDN routing, and every
future record is a manual edit at a registrar with no API. For a small
marketing site that is a fair trade for getting it working today.

### Route B — delegate to Netlify DNS (technically better)

Netlify serves the apex properly and future records are managed in one place.
The catch is that the nameservers are assigned per zone, so they must be read
out of Netlify before Directnic can be touched.

    NETLIFY_TOKEN=nfp_xxx node tools/farmstand-netlify-domains.mjs

This sets the primary domain and aliases, creates a DNS zone per registrable
domain, turns on forced HTTPS, and prints the four nameservers for each domain.
Idempotent. A token comes from Netlify → User settings → Applications →
Personal access tokens, and should be deleted after the run. The same thing can
be done by hand through Domain management → Add a domain → "Set up Netlify DNS".

Then in Directnic, per domain: turn **off** URL forwarding and replace
`ns0`–`ns3.directnic.com` with the four nameservers printed for *that* domain.
The two domains may get different sets — do not mix them up.

## Directnic is manual either way

Directnic publishes no API — only a web control panel. So the registrar side is
browser work no matter which route is taken, and cannot be scripted or driven
from a Claude Code session, which runs in a cloud container with no link to the
owner's browser.

## Verifying

    node tools/farmstand-dns-check.mjs

Checks nameserver delegation, the A/CNAME records, that HTTPS serves a real
response on all four hostnames, that each lands on the site or redirects to the
primary, and that the old forwarding IPs are gone. It accepts either route.
Exits non-zero until everything passes. DNS changes can take up to 24 hours,
though a records-only change at Directnic is usually minutes.
