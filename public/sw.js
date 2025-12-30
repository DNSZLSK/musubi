const CACHE_NAME = 'musubi-v1';
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
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});