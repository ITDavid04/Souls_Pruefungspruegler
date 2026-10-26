/* Service Worker: die ganze App liegt nach dem ersten Besuch auf dem Gerät und startet auch ohne Netz.
   VERSION ist eine Prüfsumme über alle Dateien, die tools/build.mjs einsetzt. Ändert sich etwas, lädt das Handy
   die neue Fassung im Hintergrund, und die Seite bietet "Neu laden" an. */
const VERSION = '/*VERSION*/';
const SHELL = 'pruegler-' + VERSION;
const PRECACHE = /*PRECACHE*/[];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('pruegler-') && k !== SHELL).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  /* Seiten: die Werkstatt hat eigene, alles andere ist die App (auch mit ?zurueck) */
  if (req.mode === 'navigate') {
    e.respondWith(caches.match(req, { cacheName: SHELL, ignoreSearch: true })
      .then(r => r || caches.match('./index.html', { cacheName: SHELL }))
      .then(r => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { cacheName: SHELL, ignoreSearch: true }).then(r => r || fetch(req)));
});
