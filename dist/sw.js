const CACHE_NAME = 'thethetrader-v5-fix-notifications';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  let notificationData;
  let title = 'TheTheTrader - Nouveau Signal';
  let body = 'Nouveau signal disponible !';
  
  // Parser les données de la notification
  if (event.data) {
    try {
      notificationData = event.data.json();
      console.log('📱 SW: Données notification reçues:', notificationData);
      
      // Si Firebase envoie une notification avec le champ notification
      if (notificationData.notification) {
        title = notificationData.notification.title || title;
        body = notificationData.notification.body || body;
      }
      // Sinon utiliser les données directement
      else if (notificationData.data) {
        const data = notificationData.data;
        body = `${data.signalType || ''} ${data.symbol || ''} - Nouveau signal`;
      }
    } catch (error) {
      console.error('❌ SW: Erreur parsing notification:', error);
      body = event.data.text();
    }
  }
  
  const options = {
    body: body,
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    data: notificationData?.data || {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Voir le signal',
        icon: '/favicon.png'
      },
      {
        action: 'close',
        title: 'Fermer',
        icon: '/favicon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 