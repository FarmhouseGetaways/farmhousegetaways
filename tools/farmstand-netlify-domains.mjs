#!/usr/bin/env node
// Configures the Netlify half of the Farmstand.TV domain move, over the API.
//
//     NETLIFY_TOKEN=nfp_xxx node tools/farmstand-netlify-domains.mjs
//
// Idempotent: re-running finds the existing zones instead of duplicating them.
// It sets farmstand.tv as the primary domain, adds the other three hostnames
// as aliases, creates a Netlify DNS zone for each registrable domain, and
// prints the nameservers to paste into Directnic.
//
// Plain Node, no npm. The Directnic side cannot be automated - they publish
// no API - so the nameservers this prints are entered there by hand.

const TOKEN = process.env.NETLIFY_TOKEN;
const SITE_ID = process.env.NETLIFY_SITE_ID || '46d7a509-9a9b-4307-b0a1-62dbcf8d6ad6';
const PRIMARY = 'farmstand.tv';
const ALIASES = ['www.farmstand.tv', 'farmstandtv.com', 'www.farmstandtv.com'];
const ZONES = ['farmstand.tv', 'farmstandtv.com'];

if (!TOKEN) {
  console.error('Set NETLIFY_TOKEN to a Netlify personal access token first.');
  process.exit(1);
}

async function api(path, method = 'GET', body) {
  const r = await fetch(`https://api.netlify.com/api/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await r.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${text.slice(0, 300)}`);
  return data;
}

const user = await api('/user');
console.log(`Authenticated as ${user.email}\n`);

const site = await api(`/sites/${SITE_ID}`);
console.log(`Site: ${site.name}`);
console.log(`  custom_domain now : ${site.custom_domain || '(none)'}`);
console.log(`  aliases now       : ${(site.domain_aliases || []).join(', ') || '(none)'}\n`);

const updated = await api(`/sites/${SITE_ID}`, 'PATCH', {
  custom_domain: PRIMARY,
  domain_aliases: ALIASES,
  force_ssl: true,
});
console.log(`Primary domain set to ${updated.custom_domain}`);
console.log(`Aliases set to ${(updated.domain_aliases || []).join(', ')}\n`);

const existing = await api('/dns_zones');
const results = [];

for (const name of ZONES) {
  let zone = existing.find((z) => z.name === name);
  if (zone) {
    console.log(`DNS zone for ${name} already exists (${zone.id})`);
  } else {
    zone = await api('/dns_zones', 'POST', { name, site_id: SITE_ID });
    console.log(`Created DNS zone for ${name} (${zone.id})`);
  }
  const full = await api(`/dns_zones/${zone.id}`);
  results.push({ name, servers: full.dns_servers || [] });
}

console.log(`\n${'='.repeat(60)}\nPASTE THESE INTO DIRECTNIC\n${'='.repeat(60)}`);
for (const { name, servers } of results) {
  console.log(`\n${name}  - replace its nameservers with exactly these four:`);
  servers.forEach((s) => console.log(`    ${s}`));
}
console.log(`\nAlso turn OFF URL forwarding on both domains, or it will keep`);
console.log(`hijacking requests before DNS is consulted.\n`);
