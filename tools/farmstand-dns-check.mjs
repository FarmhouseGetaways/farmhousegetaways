#!/usr/bin/env node
// Checks the full chain for the Farmstand.TV domains: nameservers, A/CNAME
// records, HTTPS certificate, and where each hostname actually lands.
//
//     node tools/farmstand-dns-check.mjs
//
// No credentials, no npm. Resolves over DNS-over-HTTPS because the container
// has no working `dig`.

const TARGET = 'farmstandtv.netlify.app';
const PRIMARY = 'farmstand.tv';
const HOSTS = ['farmstand.tv', 'www.farmstand.tv', 'farmstandtv.com', 'www.farmstandtv.com'];
const NETLIFY_APEX_IPS = ['75.2.60.5', '99.83.231.61'];

async function doh(name, type) {
  const r = await fetch(`https://dns.google/resolve?name=${name}&type=${type}`);
  const j = await r.json();
  return (j.Answer || []).map((a) => a.data);
}

async function head(url) {
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'manual' });
    return { status: r.status, location: r.headers.get('location') || '' };
  } catch (e) {
    return { error: e.cause?.code || e.message };
  }
}

const ok = (b) => (b ? 'ok  ' : 'FAIL');
let failures = 0;
const note = (pass, msg) => {
  if (!pass) failures++;
  console.log(`  [${ok(pass)}] ${msg}`);
};

console.log(`\nFarmstand.TV domain check  ->  ${TARGET}\n${'='.repeat(52)}`);

// Either route is a pass: nameservers delegated to Netlify DNS, or the
// records left at the registrar pointing at Netlify's load balancer.
const delegated = {};
for (const domain of [PRIMARY, 'farmstandtv.com']) {
  const ns = await doh(domain, 'NS');
  delegated[domain] = ns.some((n) => n.includes('nsone.net'));
  console.log(`\n${domain}  nameservers`);
  ns.forEach((n) => console.log(`     ${n}`));
  console.log(`     -> ${delegated[domain] ? 'Netlify DNS' : 'registrar DNS (external route)'}`);
}

console.log(`\nRecords and live responses`);
for (const h of HOSTS) {
  const [a, cname] = await Promise.all([doh(h, 'A'), doh(h, 'CNAME')]);
  const https = await head(`https://${h}/`);
  const http = await head(`http://${h}/`);
  console.log(`\n  ${h}`);
  console.log(`     A      ${a.join(', ') || '-'}`);
  console.log(`     CNAME  ${cname.join(', ') || '-'}`);
  console.log(`     http   ${http.error || http.status + ' ' + http.location}`);
  console.log(`     https  ${https.error || https.status + ' ' + https.location}`);

  const httpsWorks = !https.error && https.status < 500;
  note(httpsWorks, 'HTTPS serves a real response (valid certificate)');
  const landsRight =
    httpsWorks && (https.status === 200 || (https.location || '').includes(PRIMARY));
  note(landsRight, `lands on the Netlify site or redirects to ${PRIMARY}`);
  const forwardingGone = !a.some((ip) => ip.startsWith('104.143.9.'));
  note(forwardingGone, 'Directnic URL forwarding is gone');

  const apex = !h.startsWith('www.');
  const pointsAtNetlify = apex
    ? a.some((ip) => NETLIFY_APEX_IPS.includes(ip))
    : cname.some((c) => c.includes('netlify.app') || c.includes('netlifyglobalcdn'));
  const registrarRoute = !delegated[h.replace(/^www\./, '')];
  if (registrarRoute) {
    note(
      pointsAtNetlify,
      apex ? `A record points at ${NETLIFY_APEX_IPS[0]}` : 'CNAME points at Netlify'
    );
  }
}

console.log(
  `\n${'='.repeat(52)}\n${failures === 0 ? 'ALL CHECKS PASSED - the domains are live.' : failures + ' check(s) still failing.'}\n`
);
process.exit(failures === 0 ? 0 : 1);
