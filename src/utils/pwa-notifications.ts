// Système de notifications PWA avec Service Worker
// Fonctionne même écran verrouillé !

const VAPID_PUBLIC_KEY = 'BEIssdg3GOVbVBkfT1S3frXjB7iRvPEzWS0IvQ5KQTiP9GYu3NHvn4NQ5XOKGO1JXNI8OK5CwCcUoxqe35t_3bU';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Convertit une clé VAPID publique en Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Enregistre le Service Worker
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker non supporté');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ Service Worker enregistré:', registration);
    return registration;
  } catch (error) {
    console.error('❌ Erreur Service Worker:', error);
    return null;
  }
};

/**
 * Demande l'autorisation pour les notifications
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Notifications non supportées');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

/**
 * Souscrit aux notifications Push
 */
export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    const pushSubscription: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
        auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
      }
    };

    console.log('✅ Souscription Push:', pushSubscription);
    
    // TODO: Envoyer subscription au serveur pour sauvegarder
    await saveSubscriptionToServer(pushSubscription);
    
    return pushSubscription;
  } catch (error) {
    console.error('❌ Erreur souscription Push:', error);
    return null;
  }
};

/**
 * Sauvegarde la souscription sur le serveur
 */
const saveSubscriptionToServer = async (subscription: PushSubscription): Promise<void> => {
  try {
    // TODO: Implémenter l'endpoint serveur pour sauvegarder les souscriptions
    console.log('💾 Sauvegarde subscription (à implémenter):', subscription);
    
    // Pour l'instant, on sauvegarde localement
    localStorage.setItem('pushSubscription', JSON.stringify(subscription));
  } catch (error) {
    console.error('❌ Erreur sauvegarde subscription:', error);
  }
};

/**
 * Initialise le système de notifications PWA complet
 */
export const initializePWANotifications = async (): Promise<boolean> => {
  console.log('🚀 Initialisation notifications PWA...');
  
  // 1. Enregistrer Service Worker
  const registration = await registerServiceWorker();
  if (!registration) {
    console.error('❌ Impossible d\'enregistrer le Service Worker');
    return false;
  }

  // 2. Demander autorisation notifications
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.error('❌ Autorisation notifications refusée');
    return false;
  }

  // 3. Souscrire aux notifications Push
  const subscription = await subscribeToPush();
  if (!subscription) {
    console.error('❌ Impossible de souscrire aux notifications Push');
    return false;
  }

  console.log('✅ Notifications PWA initialisées - Fonctionne écran verrouillé !');
  return true;
};

/**
 * Envoie une notification de test
 */
export const sendTestNotification = async (): Promise<void> => {
  if (!('serviceWorker' in navigator) || Notification.permission !== 'granted') {
    console.warn('Notifications non disponibles');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const options: NotificationOptions = {
      body: 'Cette notification fonctionne même écran verrouillé !',
      icon: '/favicon.png',
      badge: '/favicon.png',
      tag: 'test-notification',
      requireInteraction: true, // Reste visible jusqu'à interaction
      actions: [
        {
          action: 'open',
          title: 'Ouvrir l\'app'
        }
      ]
    };
    
    await registration.showNotification('🎯 Test PWA Notification', options);
    
    console.log('✅ Notification test envoyée');
  } catch (error) {
    console.error('❌ Erreur notification test:', error);
  }
};

/**
 * Vérifie si les notifications PWA sont supportées et activées
 */
export const isPWANotificationsEnabled = (): boolean => {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Notification.permission === 'granted'
  );
};