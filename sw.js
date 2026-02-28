const CACHE = "expense-pwa-v10";
const FILES = [
  "/",
  "/index.html",
  "/app.css?v=10",
  "/app.js?v=10",
  "/manifest.json",
];

self.addEventListener("install", (evt) => {
  evt.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    (async () => {
      // Delete old caches
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Cache busting strategy - always fetch versioned files from network
self.addEventListener("fetch", (evt) => {
  const request = evt.request;
  const url = new URL(request.url);

  // For versioned files, always fetch from network
  if (
    url.pathname.includes("app.css?v=") ||
    url.pathname.includes("app.js?v=")
  ) {
    evt.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the new version
          const responseClone = response.clone();
          caches.open(CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        }),
    );
    return;
  }

  // For other files, use cache-first strategy
  evt.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request).then((fetchResponse) => {
          // Cache successful fetches
          const responseClone = fetchResponse.clone();
          caches.open(CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return fetchResponse;
        })
      );
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlFromData =
    (event.notification &&
      event.notification.data &&
      event.notification.data.url) ||
    "#expiry";
  const targetURL = new URL(urlFromData, self.location.origin).href;
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin) {
          try {
            await client.focus();
            if ("navigate" in client) {
              await client.navigate(targetURL);
            }
          } catch (_) {}
          return;
        }
      }
      try {
        await self.clients.openWindow(targetURL);
      } catch (_) {}
    })(),
  );
});
