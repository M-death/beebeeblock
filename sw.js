// Bee Bee Block / ハチノスツツク — オフライン用
// 一度開いたゲームを端末に保存し、次からは電波がなくても起動できるようにする。
// ネットにつながっているときは裏で新しい版を取りに行き、次の起動から入れ替わる。
const VERSION = 'd85f';
const CACHE = 'beebeeblock-' + VERSION;
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('beebeeblock-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }       // 保存済みならすぐ出し、裏で更新
    return (await net) || cache.match('./index.html') || Response.error();
  }));
});
