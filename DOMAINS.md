# Pointing the brand domains at their Netlify sites

All of these domains are registered at Directnic (registrar of record: DNC
Holdings, Inc.). Directnic publishes **no API** — only a web control panel — so
the registrar side is always browser work and cannot be scripted, or driven
from a Claude Code session, which runs in a cloud container with no link to the
owner's browser.

Verify any of them with:

    node tools/domain-check.mjs                       # the Farmstand domains
    node tools/domain-check.mjs minibarnmarket.com minibarnmarket.netlify.app "Mini Barn Market"

It exits non-zero until every hostname genuinely serves the site over HTTPS.

---

## Farmstand.TV — farmstand.tv and farmstandtv.com

Status as of 19 Aug 2026: **done.** Both domains serve the Netlify site over
HTTPS with a valid certificate. Route A below is what was used — DNS stayed at
Directnic, records point at Netlify.

Live configuration:

| Hostname | Record | Value | Result |
|---|---|---|---|
| `farmstand.tv` | A | `75.2.60.5` | serves the site (primary) |
| `www.farmstand.tv` | CNAME | `farmstandtv.netlify.app` | 301 to `farmstand.tv` |
| `farmstandtv.com` | A | `75.2.60.5` | serves the site |
| `www.farmstandtv.com` | CNAME | `farmstandtv.netlify.app` | serves the site |

The certificate is issued to `farmstand.tv` with the other three as SANs.

Two things worth knowing. **The old A records had a 24-hour TTL**, so for a few
hours after the change some resolvers still handed out Directnic's parking IP
while others had the new one. That is cache expiry, not a fault, and the
checker tolerates it. And **`farmstandtv.com` serves the site directly rather
than redirecting to `farmstand.tv`** — both domains answer with identical
content. If that matters for search, set the redirect in Netlify's domain
settings rather than in DNS.

## What was wrong before

Both domains resolved to `104.143.9.210` / `.211` — Directnic's free URL
forwarding boxes — and 301'd every hostname to `https://rockstarsites.wixsite.com/farmstandtv`,
the old Wix site. Nothing reached the Netlify site at all.

Worse, URL forwarding is HTTP-only. Port 443 had no certificate, so
`https://farmstand.tv` failed outright. Since browsers now try HTTPS first for
typed domains, most visitors simply got an error. Directnic confirmed this is a
limitation of the free forwarding tool, not a misconfiguration.

A trap worth remembering: deleting the forwarding is not enough. The A records
it installed stay behind and start serving a **Directnic parking page**, which
looks even more broken than the old redirect. Those records must be deleted,
not just added alongside. A `www` host briefly carried both an A record and a
CNAME, which is invalid — a CNAME cannot coexist with other records on the same
name, and the A record wins, so the CNAME did nothing.

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

    node tools/domain-check.mjs

Checks nameserver delegation, the A/CNAME records, that HTTPS serves a real
response on all four hostnames, that each lands on the site or redirects to the
primary, and that the old forwarding IPs are gone. It accepts either route.
Exits non-zero until everything passes. DNS changes can take up to 24 hours,
though a records-only change at Directnic is usually minutes.

---

## Mini Barn Market — minibarnmarket.com

Status as of 19 Aug 2026: **not done.** The Netlify site
`minibarnmarket.netlify.app` is live and healthy, but the domain does not reach
it — `https://minibarnmarket.com` serves a Wix **"ConnectYourDomain Error"**
page, so the domain is broken right now, not merely mispointed.

The difference from Farmstand: **this domain's nameservers are at Wix**
(`ns6.wixdns.net`, `ns7.wixdns.net`), not Directnic. Its DNS zone lives at Wix
and cannot be edited from Directnic's DNS manager while that is true.

Because the nameservers have to change either way, the cheaper route here is to
delegate straight to **Netlify DNS** — one change at Directnic instead of a
nameserver change followed by building a zone by hand. Netlify then serves the
apex directly and creates the records itself.

Checked before recommending it: `minibarnmarket.com` has **no MX and no TXT
records** on either public resolver, at the apex or at `_dmarc` and `mail`, so
no email or domain verification can break by moving the nameservers.

One thing to watch: the domain carries a `clientUpdateProhibited` registry lock.
Directnic's own panel normally still allows a nameserver change, but if the form
refuses, the domain has to be unlocked there first.
