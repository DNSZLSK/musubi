const CACHE_NAME = 'musubi-2025-12-31T11-59-28';
const urlsToCache = [
    '/musubi/',
    '/musubi/index.html',
    '/musubi/Music/Music1.mp3',
    '/musubi/Music/Music2.mp3',
    '/musubi/Music/Music3.mp3',
    '/musubi/Music/Music4.mp3',
    '/musubi/Music/Music5.mp3',
    '/musubi/Music/beepMenuChoice.mp3'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Network first pour les assets JS/CSS, cache first pour le reste
    if (event.request.url.includes('/assets/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then((response) => response || fetch(event.request))
        );
    }
});