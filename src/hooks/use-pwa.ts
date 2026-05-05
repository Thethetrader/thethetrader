import { useState, useEffect } from 'react';

const detectPWA = () => {
  try {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFromHomeScreen = (window.navigator as any).standalone === true || false;
    return isStandalone || isFromHomeScreen;
  } catch {
    return false;
  }
};

export const usePWA = () => {
  // Initialize synchronously to avoid a second render flash
  const [isPWA, setIsPWA] = useState(() => detectPWA());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => setIsPWA(detectPWA());
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { isPWA };
};
