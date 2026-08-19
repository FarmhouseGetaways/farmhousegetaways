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

Delegate both domains to Netlify DNS. Netlify then serves the apex directly,
issues and auto-renews certificates for all four hostnames, and handles the
redirects to the primary domain.

Neither domain has any MX or TXT records, so **no email or verification records
can break** by moving the nameservers. That is what makes the clean option safe.

`farmstand.tv` is the primary domain; `www.farmstand.tv`, `farmstandtv.com` and
`www.farmstandtv.com` are aliases that redirect to it.

## The two halves

**Netlify — automatable.** Sets the primary domain and aliases, creates a DNS
zone per registrable domain, and prints the nameservers:

    NETLIFY_TOKEN=nfp_xxx node tools/farmstand-netlify-domains.mjs

Idempotent. A personal access token comes from Netlify → User settings →
Applications → Personal access tokens. Delete it afterwards; it is only needed
for this one run.

**Directnic — by hand.** Directnic publishes no API, so this part is browser
work and cannot be scripted or driven from a Claude Code session. For each
domain: turn **off** URL forwarding, then replace the nameservers
(`ns0`–`ns3.directnic.com`) with the four the script printed for that domain.
The two domains may get different nameserver sets — do not mix them up.

## Verifying

    node tools/farmstand-dns-check.mjs

Checks nameserver delegation, the A/CNAME records, that HTTPS serves a real
response on all four hostnames, that each lands on the site or redirects to the
primary, and that the old forwarding IPs are gone. Exits non-zero until
everything passes. Nameserver changes can take up to 24 hours.

## Do not use the external-DNS route unless forced

Keeping DNS at Directnic and adding `A @ 75.2.60.5` plus `CNAME www` works, but
the apex then misses Netlify's direct CDN routing, and every future record is a
manual edit at a registrar with no API. Only worth it if delegation is refused.
