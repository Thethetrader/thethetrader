import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, query, orderByChild, limitToLast, serverTimestamp, update, get, equalTo, endBefore } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseConfig } from '../config/firebase-config';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app, firebaseConfig.databaseURL);
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
  closeMessage?: string;
}

// Ajouter un message à Firebase
export const addMessage = async (message: Omit<Message, 'id' | 'timestamp'>): Promise<Message | null> => {
  try {
    // Nettoyer le message en supprimant les propriétés undefined
    const cleanMessage = Object.fromEntries(
      Object.entries(message).filter(([_, value]) => value !== undefined)
    );
    
    console.log('🧹 Message nettoyé avant envoi Firebase:', cleanMessage);
    
    const messagesRef = ref(database, 'messages');
    const newMessageRef = push(messagesRef, {
      ...cleanMessage,
      timestamp: serverTimestamp()
    });
    
    return {
      id: newMessageRef.key || '',
      content: cleanMessage.content,
      author: cleanMessage.author,
      author_type: cleanMessage.author_type as 'admin' | 'user',
      author_avatar: cleanMessage.author_avatar,
      timestamp: new Date().toISOString(),
      channel_id: cleanMessage.channel_id,
      attachment_data: cleanMessage.attachment_data,
      attachment_type: cleanMessage.attachment_type,
      attachment_name: cleanMessage.attachment_name
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
    // Filtrage côté serveur + limite (plus rapide)
    const q = query(messagesRef, orderByChild('channel_id'), equalTo(channelId), limitToLast(50));

    const snapshot = await get(q);
    const messages: Message[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        messages.push({ id: childSnapshot.key, ...data });
      });
    }

    // Trier par timestamp croissant pour l’affichage
    messages.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    console.log(`✅ Messages chargés depuis Firebase pour ${channelId}:`, messages.length);
    return messages;
  } catch (error) {
    console.error('Erreur récupération messages Firebase:', error);
    return [];
  }
};

// Subscription temps réel pour les messages
export const subscribeToMessages = (channelId: string, callback: (message: Message) => void) => {
  const messagesRef = ref(database, 'messages');
  const q = query(messagesRef, orderByChild('channel_id'), equalTo(channelId), limitToLast(3));

  // Garder une trace des messages déjà traités
  const processedMessages = new Set<string>();

  const unsubscribe = onValue(q, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      const messageId = childSnapshot.key as string;
      if (!processedMessages.has(messageId)) {
        processedMessages.add(messageId);
        callback({ id: messageId, ...data });
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

// Cache local pour éviter de recharger les mêmes données
const signalsCache = new Map<string, { data: Signal[], timestamp: number }>();
const CACHE_DURATION = 30000; // 30 secondes

export const getSignals = async (channelId?: string, limit: number = 3, beforeTimestamp?: number): Promise<Signal[]> => {
  try {
    console.log('🚀 getSignals appelé avec channelId:', channelId, 'limit:', limit, 'beforeTimestamp:', beforeTimestamp);
    const signalsRef = ref(database, 'signals');

    let queryConstraints = [];
    if (channelId && channelId !== 'all') {
      queryConstraints.push(orderByChild('channel_id'), equalTo(channelId));
    }

    // Si on a un timestamp de référence, charger seulement les signaux plus anciens
    if (beforeTimestamp) {
      // Pour charger les signaux plus anciens, on utilise endBefore avec le timestamp
      const timestampQuery = query(signalsRef, ...queryConstraints, orderByChild('timestamp'), endBefore(beforeTimestamp), limitToLast(limit));
      const snapshot = await get(timestampQuery);
      const signals: Signal[] = [];

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          signals.push({ id: childSnapshot.key, ...data });
        });
      }

      // Plus anciens en premier (chronologique)
      signals.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      console.log(`✅ Signaux chargés (avant ${beforeTimestamp}):`, signals.length);
      return signals;
    } else {
      // Premier chargement : récupérer les derniers signaux
      const filteredQuery = channelId && channelId !== 'all'
        ? query(signalsRef, ...queryConstraints, limitToLast(limit))
        : query(signalsRef, limitToLast(limit));

      const snapshot = await get(filteredQuery);
      const signals: Signal[] = [];

      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          signals.push({ id: childSnapshot.key, ...data });
        });
      }

      // Plus anciens en premier (chronologique)
      signals.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      console.log(`✅ Signaux chargés (filtrés):`, signals.length);
      return signals;
    }
  } catch (error) {
    console.error('❌ Erreur récupération signaux Firebase:', error);
    return [];
  }
};

// Subscription temps réel pour les signaux (même logique que les messages)
export const subscribeToSignals = (channelId: string, callback: (signal: Signal) => void) => {
  const signalsRef = ref(database, 'signals');
  const q = query(signalsRef, orderByChild('channel_id'), equalTo(channelId), limitToLast(3));

  // Garder une trace des signaux déjà traités
  const processedSignals = new Set<string>();

  const unsubscribe = onValue(q, (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      const signalId = childSnapshot.key as string;
      if (!processedSignals.has(signalId)) {
        processedSignals.add(signalId);
        callback({ id: signalId, ...data });
      }
    });
  });

  return { unsubscribe };
};

export const updateSignalStatus = async (signalId: string, status: 'WIN' | 'LOSS' | 'BE' | 'ACTIVE', pnl?: string): Promise<boolean> => {
  try {
    const signalRef = ref(database, `signals/${signalId}`);
    await update(signalRef, { status, pnl });
    return true;
  } catch (error) {
    console.error('Erreur mise à jour signal Firebase:', error);
    return false;
  }
};

export const updateSignalReactions = async (signalId: string, reactions: string[]): Promise<boolean> => {
  try {
    const signalRef = ref(database, `signals/${signalId}`);
    await update(signalRef, { reactions });
    return true;
  } catch (error) {
    console.error('Erreur mise à jour réactions Firebase:', error);
    return false;
  }
};

// Export du client Firebase pour utilisation directe
export { database, storage }; 