const CACHE = 'mtm-shell-v1';
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          '/offline.html',
          '/brand/logo-light.png',
          '/brand/icon.svg',
        ]),
      ),
  );
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith('mtm-shell-') && key !== CACHE)
              .map((key) => caches.delete(key)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/.netlify') ||
    url.pathname.startsWith('/preview')
  )
    return;
  if (request.mode === 'navigate')
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html')),
    );
  else if (url.pathname.startsWith('/brand/'))
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    );
});
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {}
  const title = data.title || 'A little more curiosity';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'Your next read is waiting.',
      icon: '/brand/logo-light.png',
      badge: '/brand/logo-light.png',
      tag: data.tag || 'mtm-reading',
      data: {
        url:
          typeof data.url === 'string' && data.url.startsWith('/articles/')
            ? data.url
            : '/',
      },
    }),
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const destination = new URL(
    event.notification.data?.url || '/',
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (clients) => {
        const existing = clients.find((client) => client.url === destination);
        if (existing) return existing.focus();
        return self.clients.openWindow(destination);
      }),
  );
});
