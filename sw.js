const CACHE = 'expense-pwa-v2';
const FILES = [
  '/',
  '/index.html',
  '/app.css',
  '/app.js',
  '/manifest.json'
];
self.addEventListener('install', (evt)=>{
  evt.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', (evt)=>{
  evt.waitUntil(
    (async () => {
      // Delete old caches
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});
self.addEventListener('fetch', (evt)=>{
  evt.respondWith(caches.match(evt.request).then(r=>r||fetch(evt.request)));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlFromData = (event.notification && event.notification.data && event.notification.data.url) || '#expiry';
  const targetURL = new URL(urlFromData, self.location.origin).href;
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of allClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin) {
          try {
            await client.focus();
            if ('navigate' in client) {
              await client.navigate(targetURL);
            }
          } catch (_) {}
          return;
        }
      }
      try {
        await self.clients.openWindow(targetURL);
      } catch (_) {}
    })()
  );
});
