// Service Worker pour Tradingpourlesnuls PWA
// Gère les notifications push en arrière-plan

const CACHE_NAME = 'thethetrader-v7-sw-manual-notifications';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/index.css',
  '/src/main.tsx',
  '/FAVICON.png'
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
  console.log('✅ Service Worker activé - FORCE REFRESH');
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
    }).then(() => {
      // Forcer le rechargement de toutes les pages ouvertes
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'FORCE_REFRESH' });
        });
      });
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
  
  let title = 'TPLN';
  let body = 'Nouveau signal';
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('📱 Payload reçu:', payload);
      
      // Extraire le titre et le body depuis le champ notification de Firebase
      if (payload.notification) {
        title = payload.notification.title || title;
        body = payload.notification.body || body;
      }
      // Ou depuis les champs data si pas de notification
      else if (payload.data) {
        const data = payload.data;
        title = 'Signal Trade';
        body = `${data.signalType} ${data.symbol} - Nouveau signal`;
      }
      
      console.log('📱 Affichage notification:', { title, body });
      
      const options = {
        body: body,
        icon: '/FAVICON.png',
        badge: '/FAVICON.png',
        tag: 'trading-signal',
        requireInteraction: true,
        data: payload.data || {},
        actions: [
          {
            action: 'view',
            title: 'Voir',
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
      console.error('❌ Erreur parsing notification:', error);
    }
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