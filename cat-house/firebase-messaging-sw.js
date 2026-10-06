// 앱을 닫아도 새 소식 알림을 받는 서비스 워커 (푸시 메시지가 오면 알림을 띄움)

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

// 푸시 메시지가 도착하면 알림 표시
self.addEventListener("push", function (event) {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {};
  }
  const data = payload.data || payload;
  const title = data.title || "우리 가족 소식통";
  const options = {
    body: data.body || "새 소식이 있어요",
    icon: data.icon || undefined,
    tag: data.tag || undefined,
    data: { link: data.link || self.registration.scope }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림을 누르면 앱을 열고 그 소식으로 이동
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (let i = 0; i < list.length; i++) {
        const client = list[i];
        if (client.url.indexOf(self.registration.scope) === 0 && "navigate" in client) {
          return client.navigate(link).then(function (c) {
            return c ? c.focus() : undefined;
          });
        }
      }
      return self.clients.openWindow(link);
    })
  );
});
