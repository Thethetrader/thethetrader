import { useState, useEffect } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    // Vérifier la permission actuelle
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('Ce navigateur ne supporte pas les notifications');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  };

  const subscribeToPush = async () => {
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BEl62iUYgUivxIkv69yViEuiBIa1l9aTvkV8AGjfHXgBxGXGNzrKzJULdJDHNVpDBiGFjJSqXr6cHgDmu7QN4rE'
      });

      setSubscription(subscription);
      console.log('Abonnement push créé:', subscription);
      return subscription;
    } catch (error) {
      console.error('Erreur lors de l\'abonnement push:', error);
      return null;
    }
  };

  const sendTestNotification = async () => {
    if (permission !== 'granted') {
      console.log('Permission non accordée');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('Test TheTheTrader', {
        body: 'Ceci est un test de notification !',
        icon: '/favicon.png',
        badge: '/favicon.png'
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification:', error);
    }
  };

  return {
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    sendTestNotification
  };
}; 