// Keep immutable assets cache-first. Pages and Next.js navigation data must be
// network-first so an expired session/redirect is never replayed after login.
// API calls are never cached — mutations go through the outbox.
const CACHE = "dodaci-v2";

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/manifest.webmanifest"
  );
}

function canCache(req, res) {
  // fetch() follows redirects. Without these checks, a 200 login page reached
  // through a redirect from /archiv would be cached under the /archiv URL.
  return res.ok && !res.redirected && res.url === req.url;
}

async function cacheResponse(cache, req, res) {
  if (canCache(req, res)) {
    await cache.put(req, res.clone());
  }
  return res;
}

async function offlineFallback(cache, req) {
  const cached = await cache.match(req);
  return (
    cached ||
    new Response("Aplikácia je offline a táto stránka ešte nie je uložená.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // always hit network for data
  if (url.pathname === "/sw.js") return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      if (isStaticAsset(url)) {
        const cached = await cache.match(req);
        if (cached) return cached;
      }

      try {
        // Protected pages and RSC navigation requests always consult the
        // server first. A cached copy is only an offline fallback.
        const response = await fetch(req);
        return await cacheResponse(cache, req, response);
      } catch {
        return offlineFallback(cache, req);
      }
    }),
  );
});
