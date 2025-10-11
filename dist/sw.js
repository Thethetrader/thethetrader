const CACHE_NAME = 'thethetrader-v6-firebase-notifications';
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
  console.log('📱 SW: Notification push reçue:', event);
  
  // Firebase gère automatiquement les notifications qui ont un champ "notification"
  // Le service worker ne doit rien faire - Firebase affichera la notification
  // avec le bon format défini dans la Firebase Function
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('📱 SW: Payload reçu:', payload);
      // Ne rien afficher - Firebase le fait automatiquement
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