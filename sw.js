const CACHE_NAME = 'company-search-v4'; // החלפת השם תנקה את כל גרסאות העבר

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // גורם ל-SW החדש להשתלט מיד ללא המתנה
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('מנקה קאש ישן:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // הפעלה מיידית של ה-SW על כל הטאבים הפתוחים
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // נתוני ה-API תמיד יימשכו מהרשת בזמן אמת
  if (requestUrl.hostname.includes('data.gov.il')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(JSON.stringify({ result: { records: [] } }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  } else {
    // קבצי האפליקציה ייטענו מהקאש למהירות מקסימלית
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          return cachedResponse || fetch(event.request);
        })
    );
  }
});
