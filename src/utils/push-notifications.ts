// Système de notifications push pour les signaux de trading
interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
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
    return permission === 'granted';
  } catch (error) {
    console.error('❌ Erreur demande permission notifications:', error);
    return false;
  }
};

// Envoyer une notification locale
export const sendLocalNotification = (notification: PushNotificationData): void => {
  console.log('📱 Vérification notifications...');
  console.log('📱 Notification dans window:', 'Notification' in window);
  console.log('📱 Permission actuelle:', Notification.permission);
  
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
      requireInteraction: true, // La notification reste visible
      silent: false
    });

    // Gérer les clics sur la notification
    notif.onclick = (event) => {
      event.preventDefault();
      notif.close();
      
      // Focus sur la fenêtre/onglet
      window.focus();
      
      // Naviguer vers le canal du signal si nécessaire
      if (notification.data?.channelId) {
        // Émettre un événement pour changer de canal
        window.dispatchEvent(new CustomEvent('signalNotificationClicked', {
          detail: { channelId: notification.data.channelId }
        }));
      }
    };

    // Auto-fermeture après 10 secondes
    setTimeout(() => {
      notif.close();
    }, 10000);

    console.log('📱 Notification envoyée:', notification.title);
  } catch (error) {
    console.error('❌ Erreur envoi notification:', error);
  }
};

// Notification pour un nouveau signal
export const notifyNewSignal = (signal: any): void => {
  console.log('📱 Tentative d\'envoi notification nouveau signal:', signal);
  
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
    },
 
  };

  sendLocalNotification(notification);
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
    },

  };

  sendLocalNotification(notification);
};

// Initialiser le système de notifications
export const initializeNotifications = async (): Promise<void> => {
  console.log('🚀 Initialisation du système de notifications...');
  
  // Demander la permission
  const hasPermission = await requestNotificationPermission();
  
  if (hasPermission) {
    console.log('✅ Notifications activées');
    
    // Écouter les clics sur les notifications
    window.addEventListener('signalNotificationClicked', (event: any) => {
      const { channelId } = event.detail;
      console.log('📱 Notification cliquée, canal:', channelId);
      
      // Émettre un événement pour changer de canal
      window.dispatchEvent(new CustomEvent('navigateToChannel', {
        detail: { channelId }
      }));
    });
  } else {
    console.log('❌ Notifications non autorisées');
  }
};

// Fonction utilitaire pour vérifier si les notifications sont disponibles
export const areNotificationsAvailable = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
}; 