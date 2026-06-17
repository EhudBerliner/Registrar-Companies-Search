const CACHE_NAME = 'company-search-v6';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // כופה התקנה מיידית של ה-Service Worker החדש
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('מנקה קאש ישן לחלוטין:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // עבור ה-API הממשלתי - נסה למשוך מהרשת, החזר שגיאה ריקה במקרה אופליין
  if (requestUrl.hostname.includes('data.gov.il')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ result: { records: [] } }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // אסטרטגיית "Network First" (רשת קודם) לקבצי האפליקציה:
  // תמיד מנסה להביא את הקובץ החדש מ-GitHub. אם אין אינטרנט -> מביא מהקאש.
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // שומר את הגרסה החדשה ביותר בקאש לשימוש עתידי ללא רשת
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
