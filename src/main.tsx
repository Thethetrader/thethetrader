import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

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
              if (cacheName.includes('thethetrader-v7') || cacheName.includes('thethetrader-v6')) {
                console.log('🗑️ Suppression ancien cache:', cacheName);
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
