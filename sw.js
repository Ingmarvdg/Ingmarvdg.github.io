const cacheName = 'Map-v1';
const staticAssets = [
    './',
    './index.html',
    './main.css',
    './LocationMapper.js',
    './UserMarker.js',
    './manifest.webmanifest',
];

self.addEventListener('install', async e => {
    const cache = await caches.open(cacheName);
    await cache.addAll(staticAssets);
    return self.skipWaiting();
});

self.addEventListener('activate', e=> {
    self.clients.claim();
});