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
  console.log('⚠️ Firebase Messaging non supporté dans ce navigateur');
}

// Demander la permission pour les notifications
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('❌ Ce navigateur ne supporte pas les notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Permission de notifications déjà accordée');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('❌ Permission de notifications refusée');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('📱 Permission notifications:', permission);
    
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
      console.log('✅ Service Worker enregistré:', registration);
      
              // Demander le token FCM
        const token = await getToken(messaging, {
          vapidKey: 'BKATJNvQG6Ix5oelm4oKxaskNzNk9uTcXqrwRr8wBalBJZDvcGGZdG2KxeLbM8hfCWtlmHxpu_yXiNzMdiD-bP0',
          serviceWorkerRegistration: registration
        });
      
      if (token) {
        console.log('✅ Token FCM obtenu:', token);
        // Ici tu peux envoyer le token à ton serveur pour l'associer à l'utilisateur
        localStorage.setItem('fcmToken', token);
        return token;
      } else {
        console.log('❌ Aucun token FCM disponible');
        return null;
      }
    } else {
      console.log('❌ Service Worker non supporté');
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur obtention token FCM:', error);
    return null;
  }
};

// Envoyer une notification locale (fallback)
export const sendLocalNotification = (notification: PushNotificationData): void => {
  console.log('📱 Envoi notification locale...');
  
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('❌ Notifications non disponibles');
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

    console.log('📱 Notification locale envoyée:', notification.title);
  } catch (error) {
    console.error('❌ Erreur envoi notification locale:', error);
  }
};

// Notification pour un nouveau signal
export const notifyNewSignal = (signal: any): void => {
  console.log('📱 Notification nouveau signal:', signal);
  
  const notification: PushNotificationData = {
    title: `🚀 Nouveau Signal ${signal.type} ${signal.symbol}`,
    body: `Entrée: ${signal.entry} | TP: ${signal.takeProfit} | SL: ${signal.stopLoss}`,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `signal-${signal.id}`,
    data: {
      signalId: signal.id,
      channelId: signal.channel_id,
      type: 'new_signal'
    }
  };

  // Essayer d'envoyer une notification push, sinon fallback local
  if (messaging) {
    console.log('📱 Tentative notification push...');
    // Envoyer la notification locale comme fallback immédiat
    sendLocalNotification(notification);
  } else {
    console.log('📱 Fallback notification locale');
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
    console.log('📱 Tentative notification push signal fermé...');
    // Ici tu peux envoyer une notification push via ton serveur
  } else {
    console.log('📱 Fallback notification locale signal fermé');
    sendLocalNotification(notification);
  }
};

// Initialiser le système de notifications
export const initializeNotifications = async (): Promise<void> => {
  console.log('🚀 Initialisation du système de notifications push...');
  
  try {
    // Demander la permission
    const hasPermission = await requestNotificationPermission();
    
    if (hasPermission) {
      console.log('✅ Notifications activées');
      
      // Écouter les messages FCM quand l'app est ouverte
      onMessage(messaging, (payload) => {
        console.log('📱 Message FCM reçu:', payload);
        
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
        console.log('📱 Notification cliquée, canal:', channelId);
        
        window.dispatchEvent(new CustomEvent('navigateToChannel', {
          detail: { channelId }
        }));
      });
    } else {
      console.log('❌ Notifications non autorisées');
    }
  } catch (error) {
    console.error('❌ Erreur initialisation notifications:', error);
  }
};

// Fonction utilitaire pour vérifier si les notifications sont disponibles
export const areNotificationsAvailable = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
}; 