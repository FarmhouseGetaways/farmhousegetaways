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
 * Two rules, and the second is the one that matters:
 *
 *   the shell        cache first, refreshed quietly in the background
 *   /api/*           never cached, in either direction. One of those requests
 *                    carries a password and the others are the live record
 *                    and the signed-in account's own schedule.
 *
 * BUMP `VERSION` WHENEVER THE FILE LIST BELOW CHANGES. Without it a phone
 * that already installed the app keeps serving yesterday's copy for ever.
 */

const VERSION = "workouts-v30";

const SHELL = [
  "./",
  "index.html",
  "css/workout.css",
  "js/app.js",
  "js/store.js",
  "js/account.js",
  "js/insights.js",
  "js/library.js",
  "js/exercise-library.js",
  "js/workout-library.js",
  "js/assignments.js",
  "js/catalog.js",
  "js/media.js",
  "js/push.js",
  "manifest.webmanifest",
  "icons/favicon.svg?v=cw2",
  "icons/icon-192.png?v=cw2",
  "icons/icon-512.png?v=cw2",
  "icons/apple-touch-icon.png?v=cw2",
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

  /* The code itself — the page, the scripts, the stylesheet — is fetched fresh
     when there is a network, and served from the cache when there is not.

     It used to be the other way round: the cached copy was served immediately
     and a fresh one quietly stored for next time. That is the right trade for
     a finished app and the wrong one for an app being changed hourly, because
     it means every phone is always exactly one version behind — a fix would be
     deployed, verified live, and still not be what the person was looking at.
     That cost an evening of chasing a bug that had already been fixed.

     Offline is unaffected: no network simply means the cache answers, which is
     what it was always going to do. */
  const isCode = req.mode === "navigate" || /\.(js|css|webmanifest)$/.test(url.pathname);

  if (isCode) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match("index.html"))),
    );
    return;
  }

  // Everything else — icons, uploaded pictures: the cached copy now, a fresh
  // one for next time. These are content-addressed or never change.
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
