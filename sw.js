
const CACHE_NAME = 'zuma-v2';
const ASSETS = [
  './',
  './index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 使用 try-catch 风格的加载，防止单个资源失败导致 SW 挂掉
      return Promise.allSettled(ASSETS.map(url => cache.add(url)));
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // 离线兜底逻辑
        return new Response('Offline content not available');
      });
    })
  );
});
