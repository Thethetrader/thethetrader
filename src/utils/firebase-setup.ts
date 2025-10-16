import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, query, orderByChild, limitToLast, serverTimestamp, update, get, equalTo, endBefore, set, remove } from 'firebase/database';
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

export interface MessageReaction {
  fire: number;
  users: string[];
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
  image?: any;
  timestamp: string;
  status: 'ACTIVE' | 'WIN' | 'LOSS' | 'BE';
  channel_id: string;
  reactions?: string[];
  pnl?: string;
  closeMessage?: string;
  referenceNumber?: string;
  attachment_data?: string;
  attachment_type?: string;
  attachment_name?: string;
  closure_image?: string;
  closure_image_type?: string;
  closure_image_name?: string;
}

export interface PersonalTrade {
  id?: string;
  date: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entry: string;
  exit: string;
  stopLoss: string;
  pnl: string;
  status: 'WIN' | 'LOSS' | 'BE';
  lossReason?: string;
  notes: string;
  image1?: string; // base64
  image2?: string; // base64
  timestamp: string;
  created_at?: string;
  user_id?: string;
  account?: string; // Nom du compte de trading
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
export const getMessages = async (channelId: string, limit: number = 50): Promise<Message[]> => {
  try {
    console.log(`🔍 Chargement de ${limit} messages pour ${channelId}...`);
    const startTime = performance.now();
    
    const messagesRef = ref(database, 'messages');
    // Filtrage côté serveur + limite (plus rapide)
    const q = query(messagesRef, orderByChild('channel_id'), equalTo(channelId), limitToLast(limit));

    const snapshot = await get(q);
    const messages: Message[] = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        messages.push({ id: childSnapshot.key, ...data });
      });
    }

    // Trier par timestamp croissant pour l'affichage
    messages.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    
    const endTime = performance.now();
    console.log(`✅ ${messages.length} messages chargés pour ${channelId} en ${Math.round(endTime - startTime)}ms`);
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

// Upload d'images en base64 (temporaire - Firebase Storage désactivé)
export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    console.log('🚀 Conversion image en base64:', file.name, 'Taille:', file.size);
    
    // Utiliser base64 directement (Firebase Storage désactivé temporairement)
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        console.log('✅ Image convertie en base64');
        resolve(base64Image);
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('💥 ERREUR conversion base64:', error);
    return null;
  }
};

// Fonctions pour les signaux
export const addSignal = async (signal: Omit<Signal, 'id' | 'timestamp'>): Promise<Signal | null> => {
  try {
    // Récupérer tous les signaux pour générer le prochain numéro de référence
    const signalsRef = ref(database, 'signals');
    const snapshot = await get(signalsRef);
    const existingSignals = snapshot.exists() ? Object.values(snapshot.val()) : [];
    const nextReferenceNumber = String(existingSignals.length + 1).padStart(3, '0');
    
    const signalsRefPush = ref(database, 'signals');
    const newSignalRef = push(signalsRefPush, {
      ...signal,
      referenceNumber: `#${nextReferenceNumber}`,
      timestamp: serverTimestamp()
    });
    
    return {
      id: newSignalRef.key,
      ...signal,
      referenceNumber: `#${nextReferenceNumber}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur ajout signal Firebase:', error);
    return null;
  }
};

// Cache local pour éviter de recharger les mêmes données
const signalsCache = new Map<string, { data: Signal[], timestamp: number }>();
const CACHE_DURATION = 5000; // 5 secondes au lieu de 30

export const getSignals = async (channelId?: string, limit: number = 3, beforeTimestamp?: number): Promise<Signal[]> => {
  try {
    console.log(`🔍 Chargement de ${limit} signaux pour ${channelId}...`);
    const startTime = performance.now();
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
      const endTime = performance.now();
      console.log(`✅ ${signals.length} signaux chargés pour ${channelId} en ${Math.round(endTime - startTime)}ms`);
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
      const endTime = performance.now();
      console.log(`✅ ${signals.length} signaux chargés pour ${channelId} en ${Math.round(endTime - startTime)}ms`);
      return signals;
    }
  } catch (error) {
    console.error('❌ Erreur récupération signaux Firebase:', error);
    return [];
  }
};

// Subscription temps réel pour les signaux (simplifié)
export const subscribeToSignals = (channelId: string, callback: (signal: Signal) => void) => {
  const signalsRef = ref(database, 'signals');
  const q = query(signalsRef, orderByChild('channel_id'), equalTo(channelId), limitToLast(3));

  const unsubscribe = onValue(q, (snapshot) => {
    console.log('🔄 Signaux temps réel reçus pour', channelId, ':', snapshot.numChildren());
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      const signalId = childSnapshot.key as string;
      callback({ id: signalId, ...data });
    });
  });

  return { unsubscribe };
};

export const updateSignalStatus = async (signalId: string, status: 'WIN' | 'LOSS' | 'BE' | 'ACTIVE', pnl?: string, closureImage?: string): Promise<boolean> => {
  try {
    const signalRef = ref(database, `signals/${signalId}`);
    const updateData: any = { status, pnl };
    if (closureImage) {
      updateData.closure_image = closureImage;
    }
    await update(signalRef, updateData);
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

// Mettre à jour les réactions d'un message
export const updateMessageReactions = async (messageId: string, reactions: MessageReaction): Promise<boolean> => {
  try {
    const messageReactionsRef = ref(database, `messageReactions/${messageId}`);
    await update(messageReactionsRef, reactions);
    console.log('✅ Réactions message mises à jour dans Firebase:', messageId, reactions);
    return true;
  } catch (error) {
    console.error('❌ Erreur mise à jour réactions message Firebase:', error);
    return false;
  }
};

// Récupérer les réactions d'un message
export const getMessageReactions = async (messageId: string): Promise<MessageReaction | null> => {
  try {
    const messageReactionsRef = ref(database, `messageReactions/${messageId}`);
    const snapshot = await get(messageReactionsRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération réactions message Firebase:', error);
    return null;
  }
};

// ===== FONCTIONS D'AUTHENTIFICATION =====

// Générer un ID utilisateur unique et synchronisé
export const generateUserId = (): string => {
  // Utiliser un ID fixe pour tous les utilisateurs - plus simple et automatique
  // Tous les utilisateurs partagent le même journal de trades
  return `user_unified`;
};

// Synchroniser l'ID utilisateur avec Supabase
export const syncUserId = async (): Promise<string> => {
  try {
    // Essayer d'obtenir l'utilisateur Supabase connecté
    const { getCurrentUser } = await import('../lib/supabase');
    const user = await getCurrentUser();
    
    if (user) {
      // Utiliser l'ID Supabase réel de l'utilisateur
      localStorage.setItem('user_id', user.id);
      console.log('🔄 ID utilisateur Supabase synchronisé:', user.id);
      return user.id;
    } else {
      // Fallback si pas connecté
      const userId = generateUserId();
      localStorage.setItem('user_id', userId);
      console.log('🔄 ID utilisateur fallback synchronisé:', userId);
      return userId;
    }
  } catch (error) {
    console.error('❌ Erreur synchronisation ID utilisateur:', error);
    // Fallback en cas d'erreur
    const userId = generateUserId();
    localStorage.setItem('user_id', userId);
    return userId;
  }
};

// Connexion utilisateur simple
export const loginUser = (email: string, pseudo: string): string => {
  // Créer un ID utilisateur basé sur l'email (plus stable)
  const emailHash = btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  const userId = `user_${emailHash}`;
  
  // Sauvegarder les infos utilisateur
  localStorage.setItem('user_id', userId);
  localStorage.setItem('user_email', email);
  localStorage.setItem('user_pseudo', pseudo);
  
  console.log('✅ Utilisateur connecté:', { userId, email, pseudo });
  return userId;
};

// Déconnexion utilisateur
export const logoutUser = () => {
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_pseudo');
  console.log('✅ Utilisateur déconnecté');
};

// Vérifier si l'utilisateur est connecté
export const isUserLoggedIn = (): boolean => {
  return !!localStorage.getItem('user_id');
};

// Obtenir les infos utilisateur
export const getUserInfo = () => {
  return {
    userId: localStorage.getItem('user_id'),
    email: localStorage.getItem('user_email'),
    pseudo: localStorage.getItem('user_pseudo')
  };
};

// ===== FONCTIONS POUR LES TRADES PERSONNELS =====

// Ajouter un trade personnel à Firebase
export const addPersonalTrade = async (trade: Omit<PersonalTrade, 'id' | 'created_at' | 'user_id'>): Promise<PersonalTrade | null> => {
  try {
    console.log('🚀 Ajout trade personnel Firebase:', trade);
    
    // Synchroniser l'ID utilisateur
    const userId = await syncUserId();
    
    // Convertir les images File en base64 si nécessaire
    let image1Base64: string | undefined;
    let image2Base64: string | undefined;
    
    if (trade.image1 && typeof trade.image1 === 'object' && (trade.image1 as any) instanceof File) {
      image1Base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(trade.image1 as unknown as Blob);
      });
    } else if (typeof trade.image1 === 'string') {
      image1Base64 = trade.image1;
    }
    
    if (trade.image2 && typeof trade.image2 === 'object' && (trade.image2 as any) instanceof File) {
      image2Base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(trade.image2 as unknown as Blob);
      });
    } else if (typeof trade.image2 === 'string') {
      image2Base64 = trade.image2;
    }
    
    const tradeData = {
      ...trade,
      image1: image1Base64 || null,
      image2: image2Base64 || null,
      user_id: userId,
      created_at: new Date().toISOString()
    };
    
    // Supprimer les propriétés undefined pour Firebase
    const cleanTradeData = Object.fromEntries(
      Object.entries(tradeData).filter(([_, value]) => value !== undefined)
    );
    
    const tradesRef = ref(database, `personal_trades/${userId}`);
    const newTradeRef = push(tradesRef);
    
    await set(newTradeRef, cleanTradeData);
    
    const savedTrade: PersonalTrade = {
      id: newTradeRef.key!,
      ...cleanTradeData
    } as PersonalTrade;
    
    console.log('✅ Trade personnel sauvegardé Firebase:', savedTrade);
    return savedTrade;
  } catch (error) {
    console.error('❌ Erreur ajout trade personnel Firebase:', error);
    return null;
  }
};

// Récupérer tous les trades personnels depuis Firebase
export const getPersonalTrades = async (limit: number = 100): Promise<PersonalTrade[]> => {
  try {
    console.log('📊 Récupération trades personnels Firebase...');
    
    // Synchroniser l'ID utilisateur
    const userId = await syncUserId();
    
    const tradesRef = ref(database, `personal_trades/${userId}`);
    const q = query(tradesRef, orderByChild('created_at'), limitToLast(limit));
    const snapshot = await get(q);
    
    console.log('🔍 Snapshot Firebase:', snapshot.exists() ? 'EXISTE' : 'VIDE');
    console.log('🔍 Données snapshot:', snapshot.val());
    
    const trades: PersonalTrade[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        console.log('📋 Trade trouvé:', childSnapshot.key, data);
        trades.push({
          id: childSnapshot.key!,
          ...data
        });
      });
    }
    
    // Trier par date de création (plus récent en premier)
    trades.sort((a, b) => new Date(b.created_at || b.timestamp).getTime() - new Date(a.created_at || a.timestamp).getTime());
    
    console.log(`✅ ${trades.length} trades personnels récupérés Firebase`);
    console.log('📋 Détail des trades:', trades);
    return trades;
  } catch (error) {
    console.error('❌ Erreur récupération trades personnels Firebase:', error);
    return [];
  }
};

// Mettre à jour un trade personnel
export const updatePersonalTrade = async (tradeId: string, updates: Partial<PersonalTrade>): Promise<boolean> => {
  try {
    console.log('🔄 Mise à jour trade personnel Firebase:', tradeId, updates);
    
    const tradeRef = ref(database, `personal_trades/${tradeId}`);
    await update(tradeRef, updates);
    
    console.log('✅ Trade personnel mis à jour Firebase');
    return true;
  } catch (error) {
    console.error('❌ Erreur mise à jour trade personnel Firebase:', error);
    return false;
  }
};

// Supprimer un message (admin only)
export const deleteMessage = async (messageId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Suppression message Firebase:', messageId);
    
    // Les messages sont stockés directement sous /messages/{messageId}
    const messageRef = ref(database, `messages/${messageId}`);
    await remove(messageRef);
    
    console.log('✅ Message supprimé Firebase');
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression message Firebase:', error);
    return false;
  }
};

// Supprimer un trade personnel
export const deletePersonalTrade = async (tradeId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Suppression trade personnel Firebase:', tradeId);
    
    const tradeRef = ref(database, `personal_trades/${tradeId}`);
    await remove(tradeRef);
    
    console.log('✅ Trade personnel supprimé Firebase');
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression trade personnel Firebase:', error);
    return false;
  }
};

// Écouter les trades personnels en temps réel
export const listenToPersonalTrades = (
  onTradesUpdate: (trades: PersonalTrade[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  let unsubscribe: (() => void) | null = null;
  
  const startListening = async () => {
    try {
      console.log('👂 Démarrage écoute temps réel trades personnels...');
      
      // Synchroniser l'ID utilisateur
      const userId = await syncUserId();
      
      const { ref, onValue } = await import('firebase/database');
      const { database } = await import('./firebase-setup');
      
      const tradesRef = ref(database, `personal_trades/${userId}`);
      
      unsubscribe = onValue(tradesRef, (snapshot) => {
        console.log('🔄 Mise à jour temps réel trades détectée');
        
        const trades: PersonalTrade[] = [];
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            trades.push({
              id: childSnapshot.key!,
              ...data
            });
          });
        }
        
        // Trier par date de création (plus récent en premier)
        trades.sort((a, b) => new Date(b.created_at || b.timestamp).getTime() - new Date(a.created_at || a.timestamp).getTime());
        
        console.log(`✅ ${trades.length} trades synchronisés en temps réel`);
        onTradesUpdate(trades);
      }, (error) => {
        console.error('❌ Erreur écoute temps réel trades:', error);
        if (onError) onError(error);
      });
      
      console.log('✅ Écoute temps réel trades démarrée');
    } catch (error) {
      console.error('❌ Erreur démarrage écoute temps réel:', error);
      if (onError) onError(error as Error);
    }
  };
  
  startListening();
  
  // Retourner fonction de nettoyage
  return () => {
    if (unsubscribe) {
      console.log('🛑 Arrêt écoute temps réel trades');
      unsubscribe();
      unsubscribe = null;
    }
  };
};

// S'abonner aux réactions d'un message
export const subscribeToMessageReactions = (messageId: string, callback: (reactions: MessageReaction | null) => void) => {
  const messageReactionsRef = ref(database, `messageReactions/${messageId}`);
  
  return onValue(messageReactionsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
};

// Export du client Firebase pour utilisation directe
export { database, storage }; 