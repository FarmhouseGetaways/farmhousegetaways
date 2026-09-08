/**
 * GET /api/kpi[?days=28]  with  Authorization: Bearer <Google ID token>
 *
 * The numbers behind the 100K Stay "Rule #9" micro-goals, in one place:
 * becoming a lead, viewing a property, and starting the booking process.
 * The site already fires all three (generate_lead, page_view, begin_checkout);
 * this reads them back out of GA4 so nobody has to learn the GA4 UI to answer
 * "did the ads work this week?".
 *
 * WHY A SERVICE ACCOUNT AND NOT AN API KEY. The GA4 Data API has no API-key
 * mode — it is OAuth only. A service account is the one credential that works
 * with no human at a browser, which is what a scheduled read needs. It holds
 * Viewer on the property and nothing else, so the worst a leaked key can do is
 * read numbers that are already ours.
 *
 * WHY THE JWT IS SIGNED BY HAND. This repo has no package.json, so functions
 * get Node built-ins and nothing else. googleapis would drag in a dependency
 * tree for what is thirty lines of crypto: sign a claim set with the service
 * account's private key, trade it for an access token, use the token. Node's
 * createSign does RS256 natively.
 *
 * THE PER-PROPERTY SPLIT DEPENDS ON GA4 ADMIN, NOT ON THIS FILE. `property`
 * and `source` are custom dimensions registered in GA4 on 7 Sep 2026. GA4 does
 * not backfill custom dimensions, so figures before that date have no split and
 * come back as "(not set)" — that is correct, not a bug. Registering a new
 * event parameter here without also registering it in GA4 Admin gets you an
 * empty column and a confusing afternoon.
 *
 * META IS OPTIONAL ON PURPOSE. No Meta campaign has run yet. Rather than block
 * the whole page on a credential that has nothing to report, the Meta half
 * reports itself as not-connected and the GA4 half still renders. Set
 * META_ACCESS_TOKEN and META_AD_ACCOUNT_ID and it fills in with no code change.
 *
 * GOOGLE SIGN-IN, NOT A SHARED PASSWORD. Cory, 8 Sep 2026: "Google SSO
 * required only", with farmhousegetaways@gmail.com as master. A password in a
 * query string is one screenshot away from being public and there is no way to
 * tell who used it; a Google identity is per-person and revocable. The browser
 * gets an ID token from Google and sends it here; this file asks GOOGLE whether
 * the token is real rather than trusting anything the page claims.
 *
 * Three things must hold, all checked server-side:
 *   1. Google says the token is valid (asked directly, never just decoded).
 *   2. It was issued for OUR client id — a valid token minted for some other
 *      site is not a key to this one.
 *   3. The verified email is the allow-listed one, and Google marked it
 *      verified.
 *
 * It FAILS CLOSED: with GOOGLE_CLIENT_ID or ADMIN_EMAIL unset, nobody gets in.
 */
import { createSign } from "node:crypto";

const json = (obj, status = 200) =>
  Response.json(obj, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Verify a Google ID token by asking Google, then check it was minted for us
 * and belongs to the one account allowed in. Returns the email, or null.
 */
async function verifiedEmail(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const allowed = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!clientId || !allowed || !idToken) return null;

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!res.ok) return null;
  const t = await res.json().catch(() => null);
  if (!t) return null;

  // `aud` is the whole point: a token for another site must not open this one.
  if (t.aud !== clientId) return null;
  if (String(t.email_verified) !== "true") return null;
  if ((t.email || "").trim().toLowerCase() !== allowed) return null;
  if (Number(t.exp) * 1000 < Date.now()) return null;
  return t.email;
}

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function serviceAccount() {
  const raw = process.env.GA4_SA_KEY_B64;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw.trim(), "base64").toString("utf8"));
  } catch {
    return null;
  }
}

/** Service-account JWT -> OAuth access token, scoped read-only. */
async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = b64url(signer.sign(sa.private_key));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) {
    throw new Error(body.error_description || body.error || `token exchange failed (${res.status})`);
  }
  return body.access_token;
}

async function runReport(token, propertyId, report) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(report),
    }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || `GA4 report failed (${res.status})`);
  return body;
}

/** GA4 returns rows as positional arrays; give them names. */
function rows(report) {
  return (report.rows || []).map((r) => ({
    keys: (r.dimensionValues || []).map((d) => d.value),
    value: Number((r.metricValues || [])[0]?.value || 0),
  }));
}

async function ga4(days) {
  const sa = serviceAccount();
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!sa) return { connected: false, reason: "GA4_SA_KEY_B64 is not set or is not valid base64 JSON." };
  if (!propertyId) return { connected: false, reason: "GA4_PROPERTY_ID is not set." };

  const token = await accessToken(sa);
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }];

  // One report covers every micro-goal: the event name says which goal, the
  // custom dimensions say which farmhouse and which form.
  const byEvent = await runReport(token, propertyId, {
    dateRanges,
    dimensions: [{ name: "eventName" }, { name: "customEvent:property" }, { name: "customEvent:source" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: {
          values: ["generate_lead", "begin_checkout", "date_picker_opened"],
        },
      },
    },
    limit: 200,
  });

  /* DOES THE FARM STAND ACTUALLY SEND BOOKINGS? The three brands are separate
     GA4 properties, so they cannot be added together — but the question worth
     asking is answerable from this property alone: of the people who became a
     lead or started booking HERE, which site did they arrive from. That is what
     decides whether cross-linking earns its keep, and it costs no extra access
     and no ad spend. */
  const byReferrer = await runReport(token, propertyId, {
    dateRanges,
    dimensions: [{ name: "eventName" }, { name: "sessionSource" }],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: ["generate_lead", "begin_checkout"] },
      },
    },
    limit: 200,
  });

  // "Viewing a property" is a page view of one of the two property pages.
  const byPage = await runReport(token, propertyId, {
    dateRanges,
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    limit: 200,
  });

  const events = rows(byEvent);
  const total = (name) =>
    events.filter((e) => e.keys[0] === name).reduce((sum, e) => sum + e.value, 0);

  const split = (name) => {
    const out = {};
    for (const e of events.filter((x) => x.keys[0] === name)) {
      const property = e.keys[1] && e.keys[1] !== "(not set)" ? e.keys[1] : "Unattributed";
      out[property] = (out[property] || 0) + e.value;
    }
    return out;
  };

  const bySource = {};
  for (const e of events.filter((x) => x.keys[0] === "generate_lead")) {
    const source = e.keys[2] && e.keys[2] !== "(not set)" ? e.keys[2] : "Unattributed";
    bySource[source] = (bySource[source] || 0) + e.value;
  }

  const pageViews = rows(byPage);
  const viewsFor = (needle) =>
    pageViews.filter((p) => p.keys[0].includes(needle)).reduce((sum, p) => sum + p.value, 0);

  /* Sister-site referrals, named plainly. GA4 reports a referring host, so
     "minibarnmarket.com" and "farmstand.tv" show up as sources like any other
     site. Everything else is rolled up rather than listed, because the question
     here is specifically "do the other two brands feed this one?". */
  const sisters = { "Mini Barn Market": /minibarnmarket/i, "Farmstand.TV": /farmstand/i };
  const referrals = { "Mini Barn Market": 0, "Farmstand.TV": 0, "Everything else": 0 };
  for (const r of rows(byReferrer)) {
    const src = r.keys[1] || "";
    const hit = Object.keys(sisters).find((name) => sisters[name].test(src));
    referrals[hit || "Everything else"] += r.value;
  }

  return {
    connected: true,
    referrals,
    leads: { total: total("generate_lead"), byProperty: split("generate_lead"), bySource },
    bookingStarts: { total: total("begin_checkout"), byProperty: split("begin_checkout") },
    datePickerOpens: { total: total("date_picker_opened"), byProperty: split("date_picker_opened") },
    propertyViews: {
      "Red Barn Ranch": viewsFor("red-barn-ranch"),
      "Mountain Retreat": viewsFor("mountain-retreat"),
    },
  };
}

/** Silent unless both variables are set — no Meta campaign has run yet. */
async function meta(days) {
  const token = process.env.META_ACCESS_TOKEN;
  const account = process.env.META_AD_ACCOUNT_ID;
  if (!token || !account) {
    return { connected: false, reason: "No Meta credentials set yet, so there is nothing to report." };
  }
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
  const until = new Date().toISOString().slice(0, 10);
  const url =
    `https://graph.facebook.com/v21.0/${account}/insights` +
    `?fields=campaign_name,spend,impressions,clicks,actions` +
    `&level=campaign&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}` +
    `&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { connected: false, reason: body?.error?.message || `Meta returned ${res.status}` };
  return {
    connected: true,
    campaigns: (body.data || []).map((c) => ({
      name: c.campaign_name,
      spend: Number(c.spend || 0),
      impressions: Number(c.impressions || 0),
      clicks: Number(c.clicks || 0),
    })),
  };
}

export default async (req) => {
  const url = new URL(req.url);

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.ADMIN_EMAIL) {
    return json({ error: "Google sign-in is not configured, so this page stays shut." }, 503);
  }

  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const email = await verifiedEmail(bearer);
  if (!email) return json({ error: "Sign in with the Farmhouse Getaways Google account." }, 401);

  const days = Math.min(Math.max(parseInt(url.searchParams.get("days") || "28", 10) || 28, 1), 365);

  const [ga4Result, metaResult] = await Promise.all([
    ga4(days).catch((err) => ({ connected: false, reason: String(err.message || err) })),
    meta(days).catch((err) => ({ connected: false, reason: String(err.message || err) })),
  ]);

  return json({ days, signedInAs: email, generatedAt: new Date().toISOString(), ga4: ga4Result, meta: metaResult });
};
