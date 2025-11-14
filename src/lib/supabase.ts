import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Types pour les messages de chat
export interface ChatMessage {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  channel_id: string;
  created_at: string;
  updated_at?: string;
  message_type: MessageType;
  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  reply_to_id?: string;
  is_edited?: boolean;
  is_deleted?: boolean;
}

export interface MessageAttachment {
  id: string;
  url: string;
  filename: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

export type MessageType = 'text' | 'image' | 'file' | 'system' | 'announcement';

// Types pour les channels
export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  type: ChannelType;
  server_id?: string;
  created_by: string;
  created_at: string;
  updated_at?: string;
  is_private: boolean;
  member_count?: number;
  last_message?: ChatMessage;
}

export type ChannelType = 'text' | 'voice' | 'announcement' | 'private';

// Types pour les serveurs
export interface ChatServer {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  banner_url?: string;
  owner_id: string;
  created_at: string;
  updated_at?: string;
  member_count: number;
  channel_count: number;
}

// Types pour les utilisateurs
export interface ChatUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  status: UserStatus;
  last_seen: string;
  created_at: string;
  updated_at?: string;
  preferences?: UserPreferences;
}

export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  sound_enabled: boolean;
  language: string;
}

// Configuration du client Supabase
export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);

// Constantes pour les types de messages
export const MESSAGE_TYPES = {
  TEXT: 'text' as MessageType,
  IMAGE: 'image' as MessageType,
  FILE: 'file' as MessageType,
  SYSTEM: 'system' as MessageType,
  ANNOUNCEMENT: 'announcement' as MessageType,
} as const;

// Constantes pour les types de channels
export const CHANNEL_TYPES = {
  TEXT: 'text' as ChannelType,
  VOICE: 'voice' as ChannelType,
  ANNOUNCEMENT: 'announcement' as ChannelType,
  PRIVATE: 'private' as ChannelType,
} as const;

// Constantes pour les statuts utilisateur
export const USER_STATUS = {
  ONLINE: 'online' as UserStatus,
  AWAY: 'away' as UserStatus,
  BUSY: 'busy' as UserStatus,
  OFFLINE: 'offline' as UserStatus,
} as const;

// Fonctions utilitaires de base

/**
 * Vérifie si l'utilisateur est connecté
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};

/**
 * Obtient l'utilisateur actuel
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

/**
 * Obtient la session actuelle
 */
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

/**
 * Connexion avec email et mot de passe
 */
export const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

/**
 * Inscription avec email et mot de passe
 */
export const signUpWithPassword = async (email: string, password: string, metadata?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  if (error) throw error;
  return data;
};

/**
 * Déconnexion
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Connexion avec Google
 */
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  if (error) throw error;
  return data;
};

/**
 * Upload d'un fichier vers Supabase Storage
 */
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean }
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, options);
  
  if (error) throw error;
  return data;
};

/**
 * Obtient l'URL publique d'un fichier
 */
export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

/**
 * Supprime un fichier du storage
 */
export const deleteFile = async (bucket: string, paths: string[]) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove(paths);
  
  if (error) throw error;
  return data;
};

/**
 * Fonction utilitaire pour formater les dates
 */
export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return diffInMinutes < 1 ? 'À l\'instant' : `Il y a ${diffInMinutes}min`;
  } else if (diffInHours < 24) {
    return `Il y a ${Math.floor(diffInHours)}h`;
  } else {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

/**
 * Fonction utilitaire pour valider les messages
 */
export const validateMessage = (content: string, maxLength: number = 2000): boolean => {
  if (!content || content.trim().length === 0) return false;
  if (content.length > maxLength) return false;
  return true;
};

/**
 * Fonction utilitaire pour nettoyer le contenu des messages
 */
export const sanitizeMessage = (content: string): string => {
  // Supprime les balises HTML dangereuses
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

/**
 * Fonction utilitaire pour extraire les mentions d'un message
 */
export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Supprime les doublons
};

/**
 * Fonction utilitaire pour extraire les URLs d'un message
 */
export const extractUrls = (content: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls: string[] = [];
  let match;
  
  while ((match = urlRegex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
};

/**
 * Fonction utilitaire pour formater les réactions
 */
export const formatReactions = (reactions: MessageReaction[]): Record<string, number> => {
  return reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Fonction utilitaire pour obtenir l'initiales d'un utilisateur
 */
export const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Fonction utilitaire pour obtenir la couleur d'avatar basée sur l'ID utilisateur
 */
export const getAvatarColor = (userId: string): string => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  return colors[hash % colors.length];
};

// ====== ADMIN MANAGEMENT ======

/**
 * Vérifie si l'utilisateur actuel est admin
 */
export const isUserAdmin = async (userId?: string): Promise<boolean> => {
  try {
    const userIdToCheck = userId || (await getCurrentUser())?.id;
    if (!userIdToCheck) return false;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userIdToCheck)
      .single();

    if (error) {
      console.error('Erreur vérification admin:', error);
      return false;
    }

    return data?.role === 'admin';
  } catch (error) {
    console.error('Erreur vérification admin:', error);
    return false;
  }
};

/**
 * Connexion admin avec email et mot de passe
 */
export const signInAdmin = async (email: string, password: string) => {
  try {
    // Connexion Supabase standard
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Aucun utilisateur retourné');

    // Vérification du rôle admin
    const isAdmin = await isUserAdmin(authData.user.id);
    if (!isAdmin) {
      // Déconnexion immédiate si pas admin
      await supabase.auth.signOut();
      throw new Error('Accès administrateur refusé');
    }

    return { data: authData, error: null };
  } catch (error) {
    console.error('Erreur connexion admin:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erreur de connexion admin')
    };
  }
};

/**
 * Crée un profil admin pour un utilisateur
 */
export const createAdminUser = async (email: string, password: string, metadata?: any) => {
  try {
    // Inscription Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { ...metadata, role: 'admin' }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Erreur création utilisateur');

    // Création du profil admin dans la table user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        role: 'admin',
        name: metadata?.name || 'Admin',
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Erreur création profil admin:', profileError);
    }

    return { data: authData, error: null };
  } catch (error) {
    console.error('Erreur création admin:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erreur création admin')
    };
  }
};

/**
 * Met à jour le rôle d'un utilisateur
 */
export const updateUserRole = async (userId: string, role: 'admin' | 'user') => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        role: role,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur mise à jour rôle:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erreur mise à jour rôle')
    };
  }
};

/**
 * Obtient les informations du profil utilisateur
 */
export const getUserProfile = async (userId?: string) => {
  try {
    const userIdToGet = userId || (await getCurrentUser())?.id;
    if (!userIdToGet) throw new Error('Aucun utilisateur connecté');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userIdToGet)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erreur récupération profil')
    };
  }
};

/**
 * Récupère le profil utilisateur selon le type
 */
export const getUserProfileByType = async (userType: 'user' | 'admin') => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');

    console.log('🔍 getUserProfileByType - Recherche profil pour:', {
      userId: user.id,
      userEmail: user.email,
      userType: userType
    });

    // Utiliser l'ID réel de l'utilisateur Supabase
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    console.log('📊 Résultat de la requête Supabase:', {
      data: data,
      error: error,
      errorCode: error?.code
    });

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    
    // Retourner les données avec la structure attendue
    return { data, error: null };
  } catch (error) {
    console.error('❌ Erreur getUserProfileByType:', error);
    return { data: null, error };
  }
};

/**
 * Met à jour le profil utilisateur avec le vrai nom
 */
export const updateUserProfile = async (name: string, avatarUrl?: string, userType: 'user' | 'admin' = 'user') => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');

    console.log('🔄 updateUserProfile appelé:', {
      userId: user.id,
      userEmail: user.email,
      name: name,
      avatarUrl: avatarUrl,
      userType: userType
    });

    // Utiliser l'ID réel de l'utilisateur Supabase
    const profileData: any = {
      id: user.id,
      name: name,
      email: user.email,
      updated_at: new Date().toISOString()
    };

    // Ajouter l'avatar seulement s'il est fourni
    if (avatarUrl !== undefined) {
      profileData.avatar_url = avatarUrl;
    }

    console.log('📝 Données à envoyer à Supabase:', profileData);

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(profileData)
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Profil mis à jour dans Supabase:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erreur mise à jour profil')
    };
  }
};

// ====== CHAT FUNCTIONS ======

/**
 * Envoie un message dans un canal
 */
export const sendMessage = async (channelId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text') => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');

    // Récupérer le profil utilisateur pour obtenir le vrai nom
    const { data: profile } = await getUserProfileByType('user');
    const authorName = profile?.name || user.email || 'Utilisateur';
    const authorAvatar = profile?.avatar_url || null;

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        content,
        channel_id: channelId,
        author_id: user.id,
        author_name: authorName,
        author_avatar: authorAvatar,
        message_type: messageType
      })
      .select(`
        *,
        author:user_profiles!author_id(id, name, email, avatar_url)
      `)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur envoi message:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erreur envoi message')
    };
  }
};

/**
 * Récupère les messages d'un canal
 */
export const getMessages = async (channelId: string, limit: number = 50) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        author:user_profiles!author_id(id, name, email, avatar_url),
        reactions:message_reactions(reaction, user_id)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data?.reverse() || [], error: null };
  } catch (error) {
    console.error('Erreur récupération messages:', error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Erreur récupération messages')
    };
  }
};

/**
 * Récupère la liste des utilisateurs actifs dans un canal
 */
export const getChannelUsers = async (channelId: string) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        user_profiles!author_id(id, name, email, avatar_url),
        created_at
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Grouper les utilisateurs uniques par leurs données de profil
    const uniqueUsers = {};
    data?.forEach(msg => {
      const user = msg.user_profiles;
      if (user && !uniqueUsers[user.id]) {
        uniqueUsers[user.id] = {
          id: user.id,
          name: user.name || user.email,
          email: user.email,
          avatar_url: user.avatar_url,
          status: 'online' // Par défaut en ligne
        };
      }
    });
    
    return { data: Object.values(uniqueUsers), error: null };
  } catch (error) {
    console.error('Erreur récupération utilisateurs canal:', error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Erreur récupération utilisateurs canal')
    };
  }
};

/**
 * S'abonne aux nouveaux messages en temps réel
 */
export const subscribeToMessages = (channelId: string, callback: (message: any) => void) => {
  return supabase
    .channel(`messages:${channelId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`
      },
      async (payload) => {
        // Récupérer les détails complets du message avec l'auteur
        const { data } = await supabase
          .from('chat_messages')
          .select(`
            *,
            author:user_profiles!author_id(id, name, email, avatar_url)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) callback(data);
      }
    )
    .subscribe();
};

/**
 * Ajoute une réaction à un message
 */
export const addReaction = async (messageId: string, reaction: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('message_reactions')
      .upsert({
        message_id: messageId,
        user_id: user.id,
        reaction
      })
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur ajout réaction:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erreur ajout réaction')
    };
  }
};

/**
 * Supprime une réaction
 */
export const removeReaction = async (messageId: string, reaction: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('reaction', reaction);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Erreur suppression réaction:', error);
    return {
      error: error instanceof Error ? error : new Error('Erreur suppression réaction')
    };
  }
};

/**
 * Récupère la liste des canaux
 */
export const getChannels = async () => {
  try {
    const { data, error } = await supabase
      .from('chat_channels')
      .select('*')
      .eq('is_public', true)
      .order('created_at');

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Erreur récupération canaux:', error);
    return {
      data: [],
      error: error instanceof Error ? error : new Error('Erreur récupération canaux')
    };
  }
};

/**
 * Crée un nouveau canal
 */
export const createChannel = async (name: string, description?: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('chat_channels')
      .insert({
        name,
        description,
        created_by: user.id,
        is_public: true
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erreur création canal:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Erreur création canal')
    };
  }
};

// Export par défaut du client Supabase
export default supabase;

// ===== PERSONAL TRADES (JOURNAL DE TRADING) =====

export interface PersonalTrade {
  id: string;
  user_id: string;
  date: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entry: string;
  exit: string;
  stopLoss?: string;
  pnl: string;
  status: 'WIN' | 'LOSS' | 'BREAKEVEN';
  lossReason?: string;
  lossReasons?: string[];
  notes?: string;
  image1?: string | null;
  image2?: string | null;
  timestamp?: string;
  created_at?: string;
  updated_at?: string;
  account?: string; // Nom du compte de trading
}

/**
 * Ajouter un trade personnel dans Supabase
 */
export const addPersonalTrade = async (trade: Omit<PersonalTrade, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<PersonalTrade | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return null;
    }

    console.log('🚀 Ajout trade personnel Supabase:', trade);

    // Convertir les images File en base64 si nécessaire
    let image1Base64: string | null = null;
    let image2Base64: string | null = null;

    if (trade.image1 && typeof trade.image1 === 'object') {
      image1Base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(trade.image1 as any);
      });
    } else if (typeof trade.image1 === 'string') {
      image1Base64 = trade.image1;
    }

    if (trade.image2 && typeof trade.image2 === 'object') {
      image2Base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(trade.image2 as any);
      });
    } else if (typeof trade.image2 === 'string') {
      image2Base64 = trade.image2;
    }

    const tradeData: any = {
      user_id: user.id,
      date: trade.date,
      symbol: trade.symbol,
      type: trade.type,
      entry: parseFloat(trade.entry),
      exit: parseFloat(trade.exit),
      stop_loss: trade.stopLoss ? parseFloat(trade.stopLoss) : null,
      pnl: parseFloat(trade.pnl),
      status: trade.status,
      loss_reason: trade.lossReason || null,
      loss_reasons: trade.lossReasons ? JSON.stringify(trade.lossReasons) : null,
      notes: trade.notes || null,
      image1: image1Base64,
      image2: image2Base64,
      timestamp: trade.timestamp || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    
    // Ajouter account seulement si fourni (pour compatibilité avec migration)
    if (trade.account) {
      tradeData.account = trade.account;
    }

    const { data, error } = await supabase
      .from('personal_trades')
      .insert(tradeData)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Erreur ajout trade Supabase:', error);
      return null;
    }

    console.log('✅ Trade personnel sauvegardé Supabase:', data);
    
    // Convertir les nombres en strings pour la compatibilité avec l'interface
    const savedTrade: PersonalTrade = {
      ...data,
      entry: data.entry.toString(),
      exit: data.exit.toString(),
      stopLoss: data.stop_loss ? data.stop_loss.toString() : undefined,
      pnl: data.pnl.toString()
    };
    
    return savedTrade;
  } catch (error) {
    console.error('❌ Erreur ajout trade personnel Supabase:', error);
    return null;
  }
};

/**
 * Récupérer tous les trades personnels depuis Supabase
 */
export const getPersonalTrades = async (limit: number = 100): Promise<PersonalTrade[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return [];
    }

    console.log('📊 Récupération trades personnels Supabase...');

    const { data, error } = await supabase
      .from('personal_trades')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Erreur récupération trades Supabase:', error);
      return [];
    }

    console.log('✅ Trades personnels récupérés:', data.length);
    
    // LOG TEMPORAIRE - Afficher les 3 premiers trades bruts
    if (data.length > 0) {
      console.log('🔍 PREMIER TRADE BRUT:', JSON.stringify(data[0], null, 2));
    }

    // Convertir les nombres en strings pour la compatibilité avec l'interface
    const trades: PersonalTrade[] = data.map(trade => {
      const mappedTrade: PersonalTrade = {
        id: trade.id,
        user_id: trade.user_id,
        date: trade.date,
        symbol: trade.symbol,
        type: trade.type,
        entry: trade.entry.toString(),
        exit: trade.exit.toString(),
        stopLoss: trade.stop_loss ? trade.stop_loss.toString() : undefined,
        pnl: trade.pnl.toString(),
        status: trade.status,
        lossReason: trade.loss_reason || undefined,
        lossReasons: trade.loss_reasons ? JSON.parse(trade.loss_reasons) : undefined,
        notes: trade.notes || undefined,
        image1: trade.image1 || undefined,
        image2: trade.image2 || undefined,
        timestamp: trade.timestamp || undefined,
        account: trade.account || 'Compte Principal',
        created_at: trade.created_at,
        updated_at: trade.updated_at
      };
      return mappedTrade;
    });

    return trades;
  } catch (error) {
    console.error('❌ Erreur récupération trades personnels Supabase:', error);
    return [];
  }
};

/**
 * Supprimer un trade personnel
 */
export const deletePersonalTrade = async (tradeId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return false;
    }

    const { error } = await supabase
      .from('personal_trades')
      .delete()
      .eq('id', tradeId)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Erreur suppression trade Supabase:', error);
      return false;
    }

    console.log('✅ Trade supprimé avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression trade Supabase:', error);
    return false;
  }
};

/**
 * Écouter les changements de trades personnels en temps réel
 */
export const listenToPersonalTrades = (
  onTradesChange: (trades: PersonalTrade[]) => void,
  onError?: (error: any) => void
) => {
  let userId: string | null = null;

  // Obtenir l'ID utilisateur
  getCurrentUser().then(user => {
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      if (onError) onError(new Error('Utilisateur non connecté'));
      return;
    }

    userId = user.id;
    console.log('👂 Démarrage écoute temps réel trades Supabase pour user:', userId);

    // Charger les trades initiaux
    getPersonalTrades().then(trades => {
      onTradesChange(trades);
    });

    // S'abonner aux changements (sans filter pour éviter les problèmes)
    const channel = supabase
      .channel('personal_trades_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'personal_trades'
        },
        (payload) => {
          console.log('🔄 Changement détecté dans trades:', payload);
          // Vérifier si c'est pour notre utilisateur
          if (payload.new?.user_id === userId || payload.old?.user_id === userId) {
            console.log('✅ Changement pour notre utilisateur, rechargement...');
            // Recharger tous les trades
            getPersonalTrades().then(trades => {
              onTradesChange(trades);
            });
          }
        }
      )
      .subscribe();

    console.log('✅ Abonnement temps réel trades actif');
  });

  // Retourner une fonction pour se désabonner
  return () => {
    console.log('🛑 Arrêt écoute temps réel trades Supabase');
    supabase.channel('personal_trades_changes').unsubscribe();
  };
};

// Interface pour les comptes utilisateur
export interface UserAccount {
  id: string;
  user_id: string;
  account_name: string;
  is_default: boolean;
  initial_balance?: number;
  minimum_balance?: number;
  created_at: string;
  updated_at: string;
}

// Fonctions pour gérer les comptes utilisateur
export const getUserAccounts = async (): Promise<UserAccount[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return [];
    }

    const { data, error } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erreur récupération comptes:', error);
      return [];
    }

    console.log('✅ Comptes récupérés:', data);
    return data || [];
  } catch (error) {
    console.error('❌ Erreur getUserAccounts:', error);
    return [];
  }
};

export const addUserAccount = async (accountName: string, initialBalance?: number, minimumBalance?: number, currentBalance?: number): Promise<UserAccount | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return null;
    }

    console.log('🚀 Ajout compte utilisateur:', accountName, 'avec balance initiale:', initialBalance || 0, 'actuelle:', currentBalance, 'minimum:', minimumBalance || 0);

    const { data, error} = await supabase
      .from('user_accounts')
      .insert({
        user_id: user.id,
        account_name: accountName,
        is_default: false,
        initial_balance: initialBalance || 0,
        current_balance: currentBalance || null,
        minimum_balance: minimumBalance || 0
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur ajout compte:', error);
      return null;
    }

    console.log('✅ Compte ajouté:', data);
    return data;
  } catch (error) {
    console.error('❌ Erreur addUserAccount:', error);
    return null;
  }
};

export const deleteUserAccount = async (accountId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return false;
    }

    console.log('🗑️ Suppression compte:', accountId);

    const { error } = await supabase
      .from('user_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id);

    if (error) {
      console.error('❌ Erreur suppression compte:', error);
      return false;
    }

    console.log('✅ Compte supprimé');
    return true;
  } catch (error) {
    console.error('❌ Erreur deleteUserAccount:', error);
    return false;
  }
};

export const updateUserAccount = async (accountId: string, updates: Partial<UserAccount>): Promise<UserAccount | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return null;
    }

    console.log('✏️ Mise à jour compte:', accountId, updates);

    // Essayer d'abord de vérifier si la table existe en lisant le compte
    const { data: existingAccount, error: readError } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (readError) {
      console.error('❌ Erreur lecture compte:', readError);
      return null;
    }

    if (!existingAccount) {
      console.error('❌ Compte non trouvé');
      return null;
    }

    // Maintenant faire la mise à jour
    const { data, error } = await supabase
      .from('user_accounts')
      .update(updates)
      .eq('id', accountId)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('❌ Erreur mise à jour compte:', error);
      return null;
    }

    console.log('✅ Compte mis à jour');
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('❌ Erreur updateUserAccount:', error);
    return null;
  }
};
