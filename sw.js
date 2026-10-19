const CACHE = 'mente-fe-v2';
const CORE = ['./', './index.html', './manifest.json'];
const CDN = ['cdn.tailwindcss.com', 'cdnjs.cloudflare.com'];

const save = (req, res) => {
  if (res.ok || res.type === 'opaque') {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(req, copy));
  }
  return res;
};

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin && !CDN.includes(url.hostname)) return;

  if (req.mode === 'navigate') {
    // Página: primero internet (siempre la última versión); sin internet, la copia guardada
    e.respondWith(
      fetch(req).then((res) => save('./index.html', res)).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Estilos, iconos y librerías: primero la copia guardada, y si no existe se descarga y se guarda
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => save(req, res)))
  );
});
