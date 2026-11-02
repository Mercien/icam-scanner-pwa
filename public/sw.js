/*
 * ICAM Scanner service worker — app-shell cache only.
 * NEVER caches /wp-json/ (API), auth, or PII. Offline scans are guarded in the UI.
 */
const CACHE = "icam-scanner-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.pathname.includes("/wp-json/") || url.pathname.includes("/api/") || url.origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => { if (res && res.status === 200) cache.put(req, res.clone()); return res; }).catch(() => cached);
      return cached || network;
    }),
  );
});
