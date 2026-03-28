const CACHE_NAME = 'agora-cache-v1';

// Quando o aplicativo é instalado no celular, ele salva a página inicial na memória
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(['/', '/index.html']);
        })
    );
});

// Se a internet cair, ele tenta buscar na memória (Cache)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});