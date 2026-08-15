/* Service worker PWA. Estrategia anti-versión-vieja:
   - HTML/navegación: NETWORK-FIRST → siempre la última versión si hay red.
   - Estáticos: STALE-WHILE-REVALIDATE → rápido desde caché, pero se refresca en
     segundo plano para que la próxima carga ya tenga lo nuevo.
   - Los chunks de Next (/_next/static) llevan hash en el nombre: build nuevo =
     archivo nuevo, así que nunca sirve JS viejo.
   NO intercepta /api/, /admin, ni nada cross-origin (stream, PocketBase). */
const CACHE = 'radio-v5';
const SHELL = ['/', '/manifest.json', '/assets/logo.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Permite forzar la activación inmediata desde la página si hiciera falta.
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Navegación/HTML: network-first (nunca servir una página vieja online).
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // Resto estático: stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      const fresh = fetch(request)
        .then((res) => {
          if (res && res.ok) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || fresh;
    })(),
  );
});
