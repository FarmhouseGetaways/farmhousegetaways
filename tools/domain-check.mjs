#!/usr/bin/env node
// Checks the full chain for a domain pointed at a Netlify site: DNS records,
// HTTPS certificate, which server answers, and what each hostname serves.
//
//     node tools/domain-check.mjs                       # the Farmstand domains
//     node tools/domain-check.mjs minibarnmarket.com minibarnmarket.netlify.app "Mini Barn Market"
//
// With arguments: <primary-domain> <netlify-subdomain> [expected title text].
// Every extra domain that should also serve the site can follow as further
// arguments, and www is checked for each.
//
// No credentials, no npm. Two things this has to work around:
//
//   * A stale cache on one public resolver reads as a failure for hours after
//     a correct change, so every lookup asks two and takes the union.
//   * Node's fetch() ignores HTTPS_PROXY in this container and returns 503 for
//     everything, so the live probes shell out to curl instead.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

const argv = process.argv.slice(2);
const PRIMARY = argv[0] || 'farmstand.tv';
const NETLIFY_SUBDOMAIN = argv[1] || 'farmstandtv.netlify.app';
const TARGET_TITLE = argv[2] || 'Farmstand.TV';
// Any further arguments are additional domains that should serve the same site.
const EXTRA = argv.length > 3 ? argv.slice(3) : argv.length ? [] : ['farmstandtv.com'];
const DOMAINS = [PRIMARY, ...EXTRA];
const HOSTS = DOMAINS.flatMap((d) => [d, `www.${d}`]);
const NETLIFY_APEX_IPS = ['75.2.60.5', '99.83.231.61'];
const FORWARDING_IPS = ['104.143.9.210', '104.143.9.211'];

const RESOLVERS = [
  (n, t) => `https://dns.google/resolve?name=${n}&type=${t}`,
  (n, t) => `https://cloudflare-dns.com/dns-query?name=${n}&type=${t}`,
];

async function curl(args) {
  try {
    const { stdout } = await run('curl', ['-sS', '-m', '25', ...args], { maxBuffer: 8 << 20 });
    return stdout;
  } catch {
    return '';
  }
}

async function doh(name, type) {
  const seen = new Set();
  for (const url of RESOLVERS) {
    const body = await curl(['-H', 'accept: application/dns-json', url(name, type)]);
    try {
      for (const a of JSON.parse(body).Answer || []) seen.add(a.data);
    } catch {
      /* resolver unreachable - the other one still counts */
    }
  }
  return [...seen];
}

// Retried, because while an old record is still cached anywhere in the chain
// a probe can land on the registrar's parking IP, which serves no certificate
// and fails the connection outright. One good answer proves the config.
async function probe(url, attempts = 4) {
  let out = '';
  for (let i = 0; i < attempts && !out.trim(); i++) {
    out = await curl(['-o', '/dev/null', '-D', '-', url]);
  }
  const lines = out.split('\n').filter((l) => !/^HTTP\/1.1 200 Connection Established/.test(l));
  const status = (lines.find((l) => /^HTTP\//.test(l)) || '').trim().split(' ')[1] || '';
  const get = (h) =>
    (lines.find((l) => l.toLowerCase().startsWith(h)) || '').split(':').slice(1).join(':').trim();
  return { status, location: get('location'), server: get('server') };
}

let failures = 0;
const note = (pass, msg) => {
  if (!pass) failures++;
  console.log(`  [${pass ? 'ok  ' : 'FAIL'}] ${msg}`);
};

console.log(`\nDomain check: ${DOMAINS.join(', ')}  ->  ${NETLIFY_SUBDOMAIN}\n${'='.repeat(56)}`);

const delegated = {};
for (const domain of DOMAINS) {
  const ns = await doh(domain, 'NS');
  delegated[domain] = ns.some((n) => n.includes('nsone.net'));
  console.log(`\n${domain}  ->  ${delegated[domain] ? 'Netlify DNS' : 'registrar DNS'}`);
}

for (const h of HOSTS) {
  const [a, cname] = await Promise.all([doh(h, 'A'), doh(h, 'CNAME')]);
  const https = await probe(`https://${h}/`);
  let body = '';
  for (let i = 0; i < 4 && !body; i++) body = await curl(['-L', `https://${h}/`]);

  console.log(`\n  ${h}`);
  console.log(`     A      ${a.filter((v) => /^\d/.test(v)).join(', ') || '-'}`);
  console.log(`     CNAME  ${cname.join(', ') || '-'}`);
  console.log(`     https  ${https.status} ${https.location} (server: ${https.server || '?'})`);

  // The live answer is the ground truth. DNS may still show old cached records
  // for hours after the change without anything actually being wrong.
  note(/^(2|3)/.test(https.status), 'HTTPS serves a real response (valid certificate)');
  note(/netlify/i.test(https.server), `answered by Netlify, not the registrar`);

  const servesSite = body.includes(TARGET_TITLE);
  const redirectsToPrimary = (https.location || '').includes(PRIMARY);
  note(servesSite || redirectsToPrimary, `serves the site or redirects to ${PRIMARY}`);

  const registrarRoute = !delegated[h.replace(/^www\./, '')];
  if (registrarRoute) {
    const pointsAtNetlify = h.startsWith('www.')
      ? cname.some((c) => c.includes(NETLIFY_SUBDOMAIN) || c.includes('netlify.app'))
      : a.some((ip) => NETLIFY_APEX_IPS.includes(ip));
    note(pointsAtNetlify, h.startsWith('www.') ? 'CNAME points at Netlify' : 'A record points at Netlify');
  }

  const stale = a.some((ip) => FORWARDING_IPS.includes(ip));
  if (stale) console.log(`     note: a resolver still caches the old forwarding IP; expires on its own`);
}

console.log(
  `\n${'='.repeat(56)}\n${failures === 0 ? 'ALL CHECKS PASSED - live on Netlify over HTTPS.' : failures + ' check(s) failing.'}\n`
);
process.exit(failures === 0 ? 0 : 1);
