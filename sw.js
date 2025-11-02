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
