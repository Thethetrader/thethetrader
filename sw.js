// Service Worker pour TheTheTrader PWA
// Gère les notifications push en arrière-plan

const CACHE_NAME = 'thethetrader-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/index.css',
  '/src/main.tsx',
  '/logo.png'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installé');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activé');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la réponse du cache si disponible
        if (response) {
          return response;
        }
        // Sinon, faire la requête réseau
        return fetch(event.request);
      }
    )
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('📱 Notification push reçue:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('📱 Données notification:', data);
    
    const options = {
      body: data.body || 'Nouvelle notification TheTheTrader',
      icon: data.icon || '/logo.png',
      badge: data.badge || '/logo.png',
      tag: data.tag || 'thethetrader-notification',
      data: data.data || {},
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Voir',
          icon: '/logo.png'
        },
        {
          action: 'close',
          title: 'Fermer',
          icon: '/logo.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'TheTheTrader', options)
    );
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('📱 Notification cliquée:', event);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    // Ouvrir l'app ou naviguer vers le canal spécifique
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Si l'app est déjà ouverte, la focus
        for (const client of clientList) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Sinon, ouvrir l'app
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Gestion des messages du composant principal
self.addEventListener('message', (event) => {
  console.log('📱 Message reçu du composant:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 