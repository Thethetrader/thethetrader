import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Détecter si l'app est installée comme PWA
    const checkPWA = () => {
      // Vérifier si l'app est en mode standalone (PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // Vérifier si l'app est ouverte depuis l'écran d'accueil (iOS)
      const isFromHomeScreen = (window.navigator as any).standalone === true;
      
      // Vérifier si l'app est en mode fullscreen
      const isFullscreen = document.fullscreenElement !== null;
      
      setIsPWA(isStandalone || isFromHomeScreen || isFullscreen);
    };

    checkPWA();

    // Écouter les changements de mode d'affichage
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWA);

    return () => {
      mediaQuery.removeEventListener('change', checkPWA);
    };
  }, []);

  return { isPWA };
}; 