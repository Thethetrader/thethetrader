import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, query, orderByChild, limitToLast, serverTimestamp, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseConfig } from '../config/firebase-config';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);

export interface Message {
  id?: string;
  content: string;
  author: string;
  author_type: 'admin' | 'user';
  author_avatar?: string;
  timestamp: string | number;
  channel_id: string;
  attachment_data?: string;
  attachment_type?: string;
  attachment_name?: string;
}

export interface Signal {
  id?: string;
  type: string;
  symbol: string;
  timeframe: string;
  entry: string;
  takeProfit: string;
  stopLoss: string;
  description: string;
  image: any;
  timestamp: string;
  status: 'ACTIVE' | 'WIN' | 'LOSS' | 'BE';
  channel_id: string;
  reactions?: string[];
  pnl?: string;
}

// Ajouter un message à Firebase
export const addMessage = async (message: Omit<Message, 'id' | 'timestamp'>): Promise<Message | null> => {
  try {
    const messagesRef = ref(database, 'messages');
    const newMessageRef = push(messagesRef, {
      ...message,
      timestamp: serverTimestamp()
    });
    
    return {
      id: newMessageRef.key,
      ...message,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur ajout message Firebase:', error);
    return null;
  }
};

// Récupérer les messages depuis Firebase
export const getMessages = async (channelId: string): Promise<Message[]> => {
  try {
    const messagesRef = ref(database, 'messages');
    const channelQuery = query(
      messagesRef,
      orderByChild('channel_id'),
      limitToLast(50)
    );
    
    return new Promise((resolve) => {
      onValue(channelQuery, (snapshot) => {
        const messages: Message[] = [];
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          if (data.channel_id === channelId) {
            messages.push({
              id: childSnapshot.key,
              ...data
            });
          }
        });
        resolve(messages);
      }, { onlyOnce: true });
    });
  } catch (error) {
    console.error('Erreur récupération messages Firebase:', error);
    return [];
  }
};

// Subscription temps réel pour les messages
export const subscribeToMessages = (channelId: string, callback: (message: Message) => void) => {
  const messagesRef = ref(database, 'messages');
  
  // Garder une trace des messages déjà traités
  const processedMessages = new Set();
  
  const unsubscribe = onValue(messagesRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data.channel_id === channelId) {
        const messageId = childSnapshot.key;
        
        // Éviter les messages déjà traités
        if (!processedMessages.has(messageId)) {
          processedMessages.add(messageId);
          
          // Appeler le callback seulement pour les nouveaux messages
          callback({
            id: messageId,
            ...data
          });
        }
      }
    });
  });
  
  return { unsubscribe };
};

// Upload d'images vers Firebase Storage
export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    console.log('🚀 Début upload image Firebase:', file.name, 'Taille:', file.size);
    
    // Convertir en base64 temporairement pour test
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        console.log('📸 Image convertie en base64');
        resolve(base64Image);
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('💥 ERREUR upload image Firebase:', error);
    return null;
  }
};

// Fonctions pour les signaux
export const addSignal = async (signal: Omit<Signal, 'id' | 'timestamp'>): Promise<Signal | null> => {
  try {
    const signalsRef = ref(database, 'signals');
    const newSignalRef = push(signalsRef, {
      ...signal,
      timestamp: serverTimestamp()
    });
    
    return {
      id: newSignalRef.key,
      ...signal,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur ajout signal Firebase:', error);
    return null;
  }
};

export const getSignals = async (channelId: string): Promise<Signal[]> => {
  try {
    const signalsRef = ref(database, 'signals');
    const channelQuery = query(
      signalsRef,
      orderByChild('channel_id'),
      limitToLast(50)
    );
    
    return new Promise((resolve) => {
      onValue(channelQuery, (snapshot) => {
        const signals: Signal[] = [];
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          if (data.channel_id === channelId) {
            signals.push({
              id: childSnapshot.key,
              ...data
            });
          }
        });
        resolve(signals);
      }, { onlyOnce: true });
    });
  } catch (error) {
    console.error('Erreur récupération signaux Firebase:', error);
    return [];
  }
};

// Subscription temps réel pour les signaux
export const subscribeToSignals = (channelId: string, callback: (signal: Signal) => void) => {
  const signalsRef = ref(database, 'signals');
  
  const unsubscribe = onValue(signalsRef, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      if (data.channel_id === channelId) {
        const signalId = childSnapshot.key;
        callback({
          id: signalId,
          ...data
        });
      }
    });
  });
  
  return { unsubscribe };
};

export const updateSignalStatus = async (signalId: string, status: 'WIN' | 'LOSS' | 'BE', pnl?: string): Promise<boolean> => {
  try {
    const signalRef = ref(database, `signals/${signalId}`);
    await update(signalRef, { status, pnl });
    return true;
  } catch (error) {
    console.error('Erreur mise à jour signal Firebase:', error);
    return false;
  }
};

// Export du client Firebase pour utilisation directe
export { database, storage }; 