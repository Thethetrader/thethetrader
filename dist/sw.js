const CACHE_NAME = 'thethetrader-v7-sw-manual-notifications';
const urlsToCache = [
  '/',
  '/index.html',
  '/FAVICON.png'
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
  console.log('📱 SW: Notification push reçue:', event);
  
  let title = 'TheTheTrader';
  let body = 'Nouveau signal';
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('📱 SW: Payload reçu:', payload);
      
      // Extraire le titre et le body depuis le champ notification de Firebase
      if (payload.notification) {
        title = payload.notification.title || title;
        body = payload.notification.body || body;
      }
      // Ou depuis les champs data si pas de notification
      else if (payload.data) {
        const data = payload.data;
        title = 'TPLN';
        body = `${data.signalType} ${data.symbol} - Nouveau signal`;
      }
      
      console.log('📱 SW: Affichage notification:', { title, body });
      
      const options = {
        body: body,
        icon: '/FAVICON.png',
        badge: '/FAVICON.png',
        tag: 'trading-signal',
        requireInteraction: true,
        data: payload.data || {},
        actions: [
          {
            action: 'explore',
            title: 'Voir le signal',
            icon: '/FAVICON.png'
          },
          {
            action: 'close',
            title: 'Fermer',
            icon: '/FAVICON.png'
          }
        ]
      };
      
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
      
    } catch (error) {
      console.error('❌ SW: Erreur parsing notification:', error);
    }
  }
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