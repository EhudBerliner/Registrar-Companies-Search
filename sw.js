const CACHE_NAME = 'company-search-v2';

// שימוש בנתיבים יחסיים (./) על מנת להבטיח תאימות מלאה ל-GitHub Pages
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// התקנת ה-Service Worker ושמירת נכסים סטטיים במטמון
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// אקטיבציה וניקוי גרסאות קאש ישנות
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Removing old cache store:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ניהול בקשות רשת (Fetch)
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // אסטרטגיית קריאות API למאגר הממשלתי: עוקף קאש סטטי ומבצע Network Only עם Fallback למקרה Offline
  if (requestUrl.hostname.includes('data.gov.il')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // במצב אופליין מלא, מחזירים מבנה ריק תקין על מנת שהאפליקציה לא תקרוס
          return new Response(JSON.stringify({ result: { records: [] } }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  } else {
    // אסטרטגיית נכסי אפליקציה (HTML/CSS/Manifest): Cache First לטובת מהירות טעינה מקסימלית
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          return cachedResponse || fetch(event.request);
        })
    );
  }
});
