const CACHE_NAME = 'company-search-v1';
const ASSETS = [
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// התקנת ה-Service Worker ושמירת הקבצים הבסיסיים ב-Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// הפעלת ה-Service Worker וניקוי קאש ישן
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// אסטרטגיית Fetch: מנסה קודם רשת עבור ה-API, ואם נכשל (Offline) מציג את מעטפת האפליקציה מהקאש
self.addEventListener('fetch', event => {
  // אם מדובר בקריאת API, אל תשמור אותה בקאש הסטטי (כי המידע דינמי)
  if (event.request.url.includes('data.gov.il')) {
    event.respondWith(fetch(event.request).catch(() => {
      return new Response(JSON.stringify({ error: "offline", result: { records: [] } }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }));
  } else {
    // עבור קבצי האפליקציה (HTML/CSS/JS/Icons) - תציג מהקאש לטובת מהירות
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});