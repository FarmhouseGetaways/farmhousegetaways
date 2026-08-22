/**
 * The offline shell.
 *
 * The point of this file is a garage with no signal. Everything the app is
 * made of — the page, the stylesheet, the three scripts, the icons — is
 * precached, so an installed copy opens instantly and works whether or not
 * there is a network. The plan and the history are already in localStorage by
 * then, so a whole workout can be done and logged with the phone in aeroplane
 * mode; it goes up to the server on its own the next time there is a signal.
 *
 * Three rules, and the second and third are the ones that matter:
 *
 *   the shell        cache first, refreshed quietly in the background
 *   data/*.json      network first — a stale plan would hide a change made
 *                    this morning, and the cached copy is only the fallback
 *   /api/*           never cached, in either direction. One of those requests
 *                    carries a password and the others are the live record.
 *
 * BUMP `VERSION` WHENEVER THE FILE LIST BELOW CHANGES. Without it a phone
 * that already installed the app keeps serving yesterday's copy for ever.
 */

const VERSION = "workouts-v12";

const SHELL = [
  "./",
  "index.html",
  "css/workout.css",
  "js/app.js",
  "js/store.js",
  "js/catalog.js",
  "js/media.js",
  "js/push.js",
  "manifest.webmanifest",
  "icons/favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION)
      // addAll fails the whole install if any one file 404s, which would leave
      // the app with no offline copy at all. Added one at a time instead, so a
      // missing icon costs an icon rather than the entire cache.
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // videos and fonts go to the network
  if (url.pathname.startsWith("/api/")) return;        // never cached, never served from cache

  // The plan: fresh if we can get it, cached if we cannot.
  if (url.pathname.includes("/data/")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req)),
    );
    return;
  }

  // Everything else: the cached copy now, a fresh one for next time.
  event.respondWith(
    caches.match(req).then((hit) => {
      const live = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || live;
    }),
  );
});

/* ==========================================================================
   Reminders

   This is the half of a push notification that runs when the app is not
   open — which is the whole point of one. The server decides WHETHER to send
   (see netlify/functions/_lib/remind.mjs); this decides what it looks like on
   the lock screen and what happens when it is pressed.
   ========================================================================== */

self.addEventListener("push", (event) => {
  /* The payload is JSON we send ourselves, but a push service is allowed to
     deliver an empty one — and a push event that shows no notification is a
     permission violation in Chrome that eventually revokes the subscription.
     So there is always a fallback, however odd the delivery. */
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = {}; }

  event.waitUntil(self.registration.showNotification(d.title || "Workout today", {
    body: d.body || "There is a workout waiting.",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    // Same tag replaces rather than stacks, so two hours of the sweep can
    // never leave two identical nudges on the lock screen.
    tag: d.tag || "workout",
    renotify: true,
    requireInteraction: false,
    actions: [
      { action: "start", title: "Start it" },
      { action: "later", title: "Later today" },
    ],
    data: { url: d.url || "/" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  /* "Later today" opens the hour picker rather than snoozing by a fixed
     amount. A fixed snooze is a guess; the picker is her saying when. */
  const target = event.action === "later" ? "/#/remind" : (event.notification.data?.url || "/");

  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // Reuse a window that is already open — being handed a second copy of the
    // app is disorienting, and the first one may have a workout in progress.
    for (const client of all) {
      if (client.url.includes(self.registration.scope)) {
        await client.focus();
        client.postMessage({ type: "navigate", to: target });
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
