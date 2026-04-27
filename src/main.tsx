import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Auto-reload on stale chunk errors (after a new deploy)
window.addEventListener('error', (e) => {
  const msg = e.message || '';
  if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('Importing a module script failed')) {
    if (!sessionStorage.getItem('chunk_reload')) {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
    }
  }
});
window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e.reason?.message || e.reason || '');
  if (msg.includes('Failed to fetch dynamically imported module') || msg.includes('Importing a module script failed')) {
    if (!sessionStorage.getItem('chunk_reload')) {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
    }
  }
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Force update immédiatement
        registration.update();
        
        // Vider le cache et forcer la mise à jour
        if ('caches' in window) {
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
              if (cacheName !== 'thethetrader-v15') {
                caches.delete(cacheName);
              }
            });
          });
        }
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          console.log('Service worker update found');
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nouvelle version disponible - forcer le refresh
                console.log('🔄 Nouvelle version détectée, rechargement...');
                window.location.reload();
              }
            });
          }
        });
        
        // Vérifier toutes les heures si une mise à jour est disponible
        setInterval(() => {
          registration.update();
        }, 3600000); // 1 heure
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
