// 알림 전용 서비스 워커: 서버가 보낸 푸시를 받아 폰 알림으로 보여줘요. (앱이 닫혀 있어도 동작)
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

// 설치 가능한 앱 조건을 맞추기 위한 빈 처리기예요. 아무것도 저장하지 않고 항상 인터넷에서 받아요.
self.addEventListener('fetch', function () {});

self.addEventListener('push', function (event) {
  var d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) {}
  var n = d.notification || {};
  var data = d.data || d;
  var title = data.title || n.title || '알뜰살뜰 가계부';
  var body = data.body || n.body || '새 소식이 있어요.';
  event.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'gagyebu-news',
    data: { link: data.link || './' }
  }));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = new URL((event.notification.data && event.notification.data.link) || './', self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) return list[i].focus();
    }
    return self.clients.openWindow(url);
  }));
});
