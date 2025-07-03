
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("walkie-cache").then(cache => {
      return cache.addAll(["/frontend/index.html", "/frontend/app.js"]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
