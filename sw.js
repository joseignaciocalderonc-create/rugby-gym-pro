// Rugby Gym Pro: guarda la app para que funcione sin internet
const CACHE = 'rugby-gym-pro-202611242348';
const FILES = ['./', './index.html', './servidor-config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;   // noticias, servidor y fuentes externas: directo a internet
  const url = new URL(req.url);
  // Animaciones: primero la copia guardada (no cambian y así gastan menos datos)
  if (url.pathname.includes('/animaciones/')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  // Resto: primero la red, pidiendo siempre la versión más nueva; sin conexión, la copia guardada
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
