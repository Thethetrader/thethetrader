const CACHE_NAME = 'thethetrader-v2';
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

// Gestion des notifications push PWA - Fonctionne écran verrouillé !
self.addEventListener('push', (event) => {
  console.log('📬 Notification Push reçue:', event);
  
  let notificationData = {
    title: 'TheTheTrader',
    body: 'Nouveau signal disponible !',
    icon: '/favicon.png',
    badge: '/favicon.png'
  };

  // Parse les données si elles existent
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error('Erreur parsing notification data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200], // Vibration plus forte
    data: {
      dateOfArrival: Date.now(),
      url: notificationData.url || '/',
      type: notificationData.type || 'signal'
    },
    requireInteraction: true, // Reste visible jusqu'à interaction
    tag: notificationData.tag || 'thethetrader-notification',
    actions: [
      {
        action: 'open',
        title: '🚀 Ouvrir l\'app',
        icon: '/favicon.png'
      },
      {
        action: 'close',
        title: '❌ Fermer',
        icon: '/favicon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('TheTheTrader - Nouveau Signal', options)
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