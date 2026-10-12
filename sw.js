/* sw.js — Consola Total PWA Service Worker
   v2: la pagina (HTML) va primero a la red, asi los cambios llegan al tiro;
   si no hay conexion, usa la copia guardada. El resto (iconos, manifest)
   sale de la cache y se refresca por detras. */
const CACHE = "consola-total-v2";
const PRECACHE = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./logo-irc.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  // Navegacion (la pagina): red primero, cache si no hay conexion
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put("./", clone));
        }
        return res;
      }).catch(() => caches.match("./", { ignoreSearch: true }))
    );
    return;
  }

  // Resto: cache primero y se actualiza por detras
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
