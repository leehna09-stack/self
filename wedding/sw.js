/* 웨딩 앱 서비스워커 — 설치 가능 조건을 채우고, 인터넷이 없어도 앱이 열리게 한다.
   화면 파일은 "네트워크 우선"이라 새 버전을 올리면 다음 접속에서 바로 바뀌고, 오프라인일 때만 저장해 둔 파일을 쓴다. */
const VER = 'wedding-v4';
const CORE = [
  './', 'index.html', 'roadmap.html', 'hall.js', 'hall.css', 'theme.js', 'theme.css', 'brand.css', 'palette.js', 'tabbar.js', 'tabbar.css', 'roadmap.js', 'roadmap.css', 'install.js',
  'fonts.css', 'fonts/WeddingSans-Regular.woff2', 'fonts/WeddingSans-Bold.woff2',
  'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const isFont = u => /\.woff2?$/.test(u.pathname);
async function networkFirst(req) {
  const cache = await caches.open(VER);
  try {
    const res = await Promise.race([fetch(req), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 4000))]);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await cache.match('index.html') : undefined) || Response.error();
  }
}
async function cacheFirst(req) {
  const cache = await caches.open(VER), hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req); if (res.ok) cache.put(req, res.clone()); return res;
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;     // 카카오·지도 검색 등 외부 요청은 건드리지 않는다
  e.respondWith(isFont(url) ? cacheFirst(req) : networkFirst(req));
});
