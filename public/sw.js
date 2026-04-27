// Service Worker pour Tradingpourlesnuls PWA
// Gère les notifications push en arrière-plan

const CACHE_NAME = 'thethetrader-v15';
const urlsToCache = [
  '/FAVICON.png',
  '/manifest.json'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // take over immediately, don't wait for old SW to die
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activé - FORCE REFRESH');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames.map((cacheName) => cacheName !== CACHE_NAME && caches.delete(cacheName))
      ))
      .then(() => self.clients.claim()) // take control of all open pages immediately
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach(client => client.postMessage({ type: 'FORCE_REFRESH' })))
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  // Laisser passer toutes les requêtes non-GET (POST, PUT...) pour éviter les erreurs
  if (event.request.method !== 'GET') {
    return;
  }

  // Ne jamais intercepter les requêtes cross-origin (Supabase, Google, etc.)
  // Ça évite des erreurs "FetchEvent.respondWith" et limite l'egress/cache inutile.
  try {
    const reqUrl = new URL(event.request.url);
    if (reqUrl.origin !== self.location.origin) {
      return;
    }
  } catch {
    // Si l'URL est invalide, laisser passer
    return;
  }

  // Ne pas cacher les fichiers JS et CSS pour forcer la mise à jour
  if (event.request.url.includes('/assets/') && (event.request.url.includes('.js') || event.request.url.includes('.css'))) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Network-first for HTML (never serve stale index.html)
  const url = event.request.url;
  const isHtml = url.endsWith('/') || url.includes('index.html') || !url.includes('.');
  if (isHtml) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  let title = 'TPLN';
  let body = 'Nouveau signal';
  
  if (event.data) {
    try {
      const payload = event.data.json();
      
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
      
      // Options minimales pour garantir la compatibilité mobile
      const options = {
        body: body,
        icon: '/FAVICON.png',
        badge: '/FAVICON.png',
        tag: 'trading-signal',
        data: payload.data || {}
      };
      
      event.waitUntil(
        self.registration.showNotification(title, options)
          .catch((error) => {
            // Essayer avec des options encore plus simples en cas d'erreur
            const minimalOptions = {
              body: body,
              icon: '/FAVICON.png'
            };
            return self.registration.showNotification(title, minimalOptions);
          })
          .catch((error2) => {
            console.error('❌ Erreur affichage notification:', error2);
          })
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
