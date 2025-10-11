// Système de notifications push pour les signaux de trading avec Firebase Cloud Messaging
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig } from '../config/firebase-config';

interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Vérifier si Firebase Messaging est supporté
let messaging: any = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
}

// Demander la permission pour les notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Demander le token FCM
      await requestFCMToken();
    }
    
    return permission === 'granted';
  } catch (error) {
    console.error('❌ Erreur demande permission notifications:', error);
    return false;
  }
};

// Demander le token FCM pour les notifications push
const requestFCMToken = async (): Promise<string | null> => {
  try {
    // Vérifier si le service worker est enregistré
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
              // Demander le token FCM
        const token = await getToken(messaging, {
          vapidKey: 'BKATJNvQG6Ix5oelm4oKxaskNzNk9uTcXqrwRr8wBalBJZDvcGGZdG2KxeLbM8hfCWtlmHxpu_yXiNzMdiD-bP0',
          serviceWorkerRegistration: registration
        });
      
      if (token) {
        // Ici tu peux envoyer le token à ton serveur pour l'associer à l'utilisateur
        localStorage.setItem('fcmToken', token);
        return token;
      } else {
        return null;
      }
    } else {
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur obtention token FCM:', error);
    return null;
  }
};

// Envoyer une notification locale (fallback)
export const sendLocalNotification = (notification: PushNotificationData): void => {
  
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notif = new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/logo.png',
      badge: notification.badge || '/logo.png',
      tag: notification.tag || 'trading-signal',
      data: notification.data,
      requireInteraction: true,
      silent: false
    });

    // Gérer les clics sur la notification
    notif.onclick = (event) => {
      event.preventDefault();
      notif.close();
      window.focus();
      
      if (notification.data?.channelId) {
        window.dispatchEvent(new CustomEvent('signalNotificationClicked', {
          detail: { channelId: notification.data.channelId }
        }));
      }
    };

    // Auto-fermeture après 10 secondes
    setTimeout(() => {
      notif.close();
    }, 10000);

  } catch (error) {
    console.error('❌ Erreur envoi notification locale:', error);
  }
};

// Notification pour un nouveau signal
export const notifyNewSignal = (signal: any): void => {
  
  const notification: PushNotificationData = {
    title: `Signal Trade`,
    body: `${signal.type} ${signal.symbol} - Entrée: ${signal.entry} | TP: ${signal.takeProfit} | SL: ${signal.stopLoss}`,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `signal-${signal.id}`,
    data: {
      signalId: signal.id,
      channelId: signal.channel_id,
      type: 'new_signal'
    }
  };

  // Utiliser le Service Worker pour afficher la notification
    serviceWorker: 'serviceWorker' in navigator,
    notification: 'Notification' in window,
    permission: Notification.permission
  });
  
  if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
    
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        tag: notification.tag,
        data: notification.data,
        requireInteraction: true
      });
    }).catch((error) => {
      console.error('❌ Erreur Service Worker notification:', error);
      // Fallback vers notification locale
      sendLocalNotification(notification);
    });
  } else {
    sendLocalNotification(notification);
  }
};

// Notification pour un signal fermé (WIN/LOSS/BE)
export const notifySignalClosed = (signal: any): void => {
  const statusEmoji = signal.status === 'WIN' ? '✅' : signal.status === 'LOSS' ? '❌' : '⚖️';
  const statusText = signal.status === 'WIN' ? 'GAGNANT' : signal.status === 'LOSS' ? 'PERDANT' : 'BREAK-EVEN';
  
  const notification: PushNotificationData = {
    title: `${statusEmoji} Signal ${signal.symbol} ${statusText}`,
    body: `P&L: ${signal.pnl || 'N/A'} - ${signal.closeMessage || 'Position fermée'}`,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `signal-closed-${signal.id}`,
    data: {
      signalId: signal.id,
      channelId: signal.channel_id,
      type: 'signal_closed'
    }
  };

  // Essayer d'envoyer une notification push, sinon fallback local
  if (messaging) {
    // Ici tu peux envoyer une notification push via ton serveur
  } else {
    sendLocalNotification(notification);
  }
};

// Initialiser le système de notifications
export const initializeNotifications = async (): Promise<void> => {
  
  try {
    // Demander la permission
    const hasPermission = await requestNotificationPermission();
    
    if (hasPermission) {
      
      // Enregistrer pour les notifications push
      try {
        const token = await requestFCMToken();
        if (token) {
          // Sauvegarder le token dans Firebase Database
          try {
            const { ref, set } = await import('firebase/database');
            const { database } = await import('../utils/firebase-setup');
            
            const tokenRef = ref(database, `fcm_tokens/${token.replace(/[.#$[\]]/g, '_')}`);
            
            await set(tokenRef, {
              token: token,
              timestamp: Date.now(),
              userAgent: navigator.userAgent
            });
          } catch (error) {
            console.error('❌ Erreur sauvegarde token FCM:', error);
            console.error('❌ Détails erreur:', error.message);
          }
        }
      } catch (error) {
        console.error('❌ Erreur enregistrement FCM:', error);
      }
      
      // Écouter les messages FCM quand l'app est ouverte
      onMessage(messaging, (payload) => {
        
        // Afficher la notification
        const notification = payload.notification;
        if (notification) {
          sendLocalNotification({
            title: notification.title || 'Nouvelle notification',
            body: notification.body || '',
            icon: notification.icon || '/logo.png',
            data: payload.data
          });
        }
      });
      
      // Écouter les clics sur les notifications
      window.addEventListener('signalNotificationClicked', (event: any) => {
        const { channelId } = event.detail;
        
        window.dispatchEvent(new CustomEvent('navigateToChannel', {
          detail: { channelId }
        }));
      });
    } else {
    }
  } catch (error) {
    console.error('❌ Erreur initialisation notifications:', error);
  }
};

// Fonction utilitaire pour vérifier si les notifications sont disponibles
export const areNotificationsAvailable = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
}; 