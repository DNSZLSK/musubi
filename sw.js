const CACHE_NAME = 'musubi-2026-07-05T17-14-16';

// Coquille minimale. L'audio (lourd) est mis en cache à la volée, pour qu'un
// MP3 indisponible ne fasse jamais échouer l'installation / la mise à jour.
const CORE_ASSETS = ['/musubi/', '/musubi/index.html'];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((names) =>
                Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : null)))
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // On ne gère que le GET same-origin. L'API leaderboard (cross-origin) et les
    // POST passent directement au réseau, sans jamais être mis en cache.
    if (req.method !== 'GET') return;
    if (new URL(req.url).origin !== self.location.origin) return;

    const isHTML = req.mode === 'navigate' || req.url.endsWith('.html');

    // HTML : network-first (revalidation forcée) → toujours la dernière version.
    // Hors-ligne : on retombe sur le cache.
    if (isHTML) {
        event.respondWith(
            fetch(req, { cache: 'no-cache' })
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
                    return response;
                })
                .catch(() =>
                    caches.match(req).then((r) => r || caches.match('/musubi/index.html'))
                )
        );
        return;
    }

    // Le reste (JS/CSS hashés, images, audio) : cache-first, mis en cache à la
    // première requête. Les noms de fichiers JS/CSS changent à chaque build,
    // donc le cache-first ne sert jamais un asset périmé.
    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req).then((response) => {
                if (response && response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
                }
                return response;
            });
        })
    );
});
