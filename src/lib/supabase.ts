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
  status: 'WIN' | 'LOSS' | 'BE' | 'BREAKEVEN';
  lossReason?: string;
  lossReasons?: string[];
  notes?: string;
  image1?: string | null;
  image2?: string | null;
  timestamp?: string;
  created_at?: string;
  updated_at?: string;
  account?: string; // Nom du compte de trading
  session?: string; // Session: 18h, Open Asian, London, NY AM, NY PM
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
      status: trade.status === 'BE' ? 'BREAKEVEN' : trade.status,
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
    if (trade.session) {
      tradeData.session = trade.session;
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
      pnl: data.pnl.toString(),
      status: (data.status === 'BREAKEVEN' ? 'BE' : data.status) as 'WIN' | 'LOSS' | 'BREAKEVEN'
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
export const getPersonalTrades = async (limit: number = 50): Promise<PersonalTrade[]> => {
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

    console.log('✅ Trades personnels récupérés:', data?.length ?? 0);

    const trades: PersonalTrade[] = (data ?? []).map((trade: any) => {
      let lossReasons: string[] | undefined;
      if (trade.loss_reasons != null && trade.loss_reasons !== '') {
        try {
          lossReasons = JSON.parse(trade.loss_reasons);
        } catch {
          lossReasons = undefined;
        }
      }
      return {
        id: trade.id,
        user_id: trade.user_id,
        date: trade.date,
        symbol: trade.symbol,
        type: trade.type,
        entry: trade.entry != null ? String(trade.entry) : '',
        exit: trade.exit != null ? String(trade.exit) : '',
        stopLoss: trade.stop_loss != null ? String(trade.stop_loss) : undefined,
        pnl: trade.pnl != null ? String(trade.pnl) : '',
        status: (trade.status === 'BREAKEVEN' ? 'BE' : trade.status) as 'WIN' | 'LOSS' | 'BREAKEVEN',
        lossReason: trade.loss_reason || undefined,
        lossReasons,
        notes: trade.notes || undefined,
        image1: trade.image1 || undefined,
        image2: trade.image2 || undefined,
        timestamp: trade.timestamp || undefined,
        account: trade.account || 'Compte Principal',
        session: trade.session || undefined,
        created_at: trade.created_at,
        updated_at: trade.updated_at
      };
    });

    return trades;
  } catch (error) {
    console.error('❌ Erreur récupération trades personnels Supabase:', error);
    return [];
  }
};

/**
 * Récupérer un trade par ID (avec images, pour détail / édition)
 */
export const getPersonalTradeById = async (tradeId: string): Promise<PersonalTrade | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('personal_trades')
      .select('*')
      .eq('id', tradeId)
      .eq('user_id', user.id)
      .single();
    if (error || !data) return null;
    let lossReasons: string[] | undefined;
    if (data.loss_reasons != null && data.loss_reasons !== '') {
      try {
        lossReasons = JSON.parse(data.loss_reasons);
      } catch {
        lossReasons = undefined;
      }
    }
    return {
      id: data.id,
      user_id: data.user_id,
      date: data.date,
      symbol: data.symbol,
      type: data.type,
      entry: data.entry != null ? String(data.entry) : '',
      exit: data.exit != null ? String(data.exit) : '',
      stopLoss: data.stop_loss != null ? String(data.stop_loss) : undefined,
      pnl: data.pnl != null ? String(data.pnl) : '',
      status: (data.status === 'BREAKEVEN' ? 'BE' : data.status) as 'WIN' | 'LOSS' | 'BREAKEVEN',
      lossReason: data.loss_reason || undefined,
      lossReasons,
      notes: data.notes || undefined,
      image1: data.image1 || undefined,
      image2: data.image2 || undefined,
      timestamp: data.timestamp || undefined,
      account: data.account || 'Compte Principal',
      session: data.session || undefined,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (e) {
    console.error('❌ getPersonalTradeById:', e);
    return null;
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
 * Mettre à jour un trade personnel
 */
export const updatePersonalTrade = async (
  tradeId: string,
  updates: Partial<Omit<PersonalTrade, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<PersonalTrade | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ Utilisateur non connecté');
      return null;
    }

    const tradeData: any = {};
    if (updates.symbol != null) tradeData.symbol = updates.symbol;
    if (updates.type != null) tradeData.type = updates.type;
    if (updates.entry != null) tradeData.entry = parseFloat(updates.entry);
    if (updates.exit != null) tradeData.exit = parseFloat(updates.exit);
    if (updates.stopLoss !== undefined) tradeData.stop_loss = updates.stopLoss ? parseFloat(updates.stopLoss) : null;
    if (updates.pnl != null) tradeData.pnl = parseFloat(updates.pnl);
    if (updates.status != null) tradeData.status = updates.status === 'BE' ? 'BREAKEVEN' : updates.status;
    if (updates.lossReason !== undefined) tradeData.loss_reason = updates.lossReason || null;
    if (updates.lossReasons !== undefined) tradeData.loss_reasons = updates.lossReasons?.length ? JSON.stringify(updates.lossReasons) : null;
    if (updates.notes !== undefined) tradeData.notes = updates.notes || null;
    if (updates.session !== undefined) tradeData.session = updates.session || null;

    if (updates.image1 !== undefined) {
      if (updates.image1 && typeof updates.image1 === 'object') {
        tradeData.image1 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(updates.image1 as any);
        });
      } else {
        tradeData.image1 = updates.image1;
      }
    }
    if (updates.image2 !== undefined) {
      if (updates.image2 && typeof updates.image2 === 'object') {
        tradeData.image2 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(updates.image2 as any);
        });
      } else {
        tradeData.image2 = updates.image2;
      }
    }

    const { data, error } = await supabase
      .from('personal_trades')
      .update(tradeData)
      .eq('id', tradeId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour trade Supabase:', error);
      return null;
    }

    const savedTrade: PersonalTrade = {
      ...data,
      entry: data.entry.toString(),
      exit: data.exit.toString(),
      stopLoss: data.stop_loss ? data.stop_loss.toString() : undefined,
      pnl: data.pnl.toString(),
      status: (data.status === 'BREAKEVEN' ? 'BE' : data.status) as 'WIN' | 'LOSS' | 'BREAKEVEN'
    };
    return savedTrade;
  } catch (error) {
    console.error('❌ Erreur updatePersonalTrade Supabase:', error);
    return null;
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
  let activeChannel: ReturnType<typeof supabase.channel> | null = null;

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
    getPersonalTrades(50).then(trades => {
      onTradesChange(trades);
    });

    // S'abonner aux changements UNIQUEMENT pour cet utilisateur
    activeChannel = supabase
      .channel(`personal_trades_changes_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'personal_trades',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('🔄 Changement détecté pour user:', payload.eventType);
          // Attendre un peu pour laisser Supabase traiter l'insertion
          setTimeout(() => {
            // Recharger seulement les trades de cet utilisateur avec une limite plus élevée
            getPersonalTrades(1000).then(trades => {
              console.log('📊 Trades rechargés via écoute temps réel:', trades.length);
              onTradesChange(trades);
            }).catch(error => {
              console.error('❌ Erreur rechargement via écoute temps réel:', error);
            });
          }, 300);
        }
      )
      .subscribe();

    console.log('✅ Abonnement temps réel trades actif');
  });

  // Retourner une fonction pour se désabonner
  return () => {
    console.log('🛑 Arrêt écoute temps réel trades Supabase');
    if (activeChannel) {
      activeChannel.unsubscribe();
    }
  };
};

// Stats fin de session (4 stats psy par jour)
export interface FinSessionStatRow {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  respect_plan: string | null;
  qualite_decisions: string | null;
  gestion_erreur: string | null;
  pression: number | null;
  max_drawdown: number | null;
  session_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinSessionData {
  respectPlan: string;
  qualiteDecisions: string;
  gestionErreur: string;
  pression: number;
  maxDrawdown?: number | null;
  sessionType?: string;
}

/** Récupère toutes les stats fin de session de l'utilisateur (pour cache calendrier). Si plusieurs sessions le même jour, calcule la moyenne de la pression. */
export const getFinSessionStatsFromSupabase = async (): Promise<Record<string, FinSessionData>> => {
  try {
    const user = await getCurrentUser();
    if (!user) return {};
    const { data, error } = await supabase
      .from('fin_session_stats')
      .select('date, session_type, respect_plan, qualite_decisions, gestion_erreur, pression, max_drawdown')
      .eq('user_id', user.id);
    if (error) {
      console.error('❌ Erreur getFinSessionStats:', error);
      return {};
    }
    const record: Record<string, FinSessionData> = {};
    // Grouper par date
    const byDate: Record<string, Array<{ respect_plan: string; qualite_decisions: string; gestion_erreur: string; pression: number; max_drawdown?: number | null; session_type?: string }>> = {};
    (data || []).forEach((row: { date: string; session_type: string | null; respect_plan: string | null; qualite_decisions: string | null; gestion_erreur: string | null; pression: number | null; max_drawdown?: number | null }) => {
      if (row.date && row.respect_plan != null && row.qualite_decisions != null && row.gestion_erreur != null && row.pression != null) {
        if (!byDate[row.date]) byDate[row.date] = [];
        byDate[row.date].push({
          respect_plan: row.respect_plan,
          qualite_decisions: row.qualite_decisions,
          gestion_erreur: row.gestion_erreur,
          pression: row.pression,
          ...(row.max_drawdown != null && { max_drawdown: row.max_drawdown }),
          ...(row.session_type && { session_type: row.session_type })
        });
      }
    });
    // Calculer la moyenne si plusieurs sessions
    Object.keys(byDate).forEach(date => {
      const sessions = byDate[date];
      if (sessions.length === 1) {
        const s = sessions[0];
        record[date] = {
          respectPlan: s.respect_plan,
          qualiteDecisions: s.qualite_decisions,
          gestionErreur: s.gestion_erreur,
          pression: s.pression,
          ...(s.max_drawdown != null && { maxDrawdown: s.max_drawdown }),
          ...(s.session_type && { sessionType: s.session_type })
        };
      } else {
        // Moyenne de la pression
        const avgPression = Math.round(sessions.reduce((sum, s) => sum + s.pression, 0) / sessions.length);
        // Pour les autres, prendre le mode ou le premier
        const firstSession = sessions[0];
        record[date] = {
          respectPlan: firstSession.respect_plan,
          qualiteDecisions: firstSession.qualite_decisions,
          gestionErreur: firstSession.gestion_erreur,
          pression: avgPression,
          sessionType: `${sessions.length} sessions`
        };
      }
    });
    return record;
  } catch (e) {
    console.error('❌ getFinSessionStatsFromSupabase:', e);
    return {};
  }
};

/** Enregistre ou met à jour les stats fin de session pour une date. Retourne { ok: true } ou { ok: false, reason, message? }. */
export const upsertFinSessionStatToSupabase = async (dateStr: string, data: FinSessionData): Promise<{ ok: boolean; reason?: string; message?: string }> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.error('❌ Fin session: utilisateur non connecté (Supabase Auth)');
      return { ok: false, reason: 'non_connecte' };
    }
    const payload: Record<string, unknown> = {
      user_id: user.id,
      date: dateStr,
      session_type: data.sessionType || '18h',
      respect_plan: data.respectPlan,
      qualite_decisions: data.qualiteDecisions,
      gestion_erreur: data.gestionErreur,
      pression: data.pression,
      updated_at: new Date().toISOString()
    };
    if (data.maxDrawdown != null) payload.max_drawdown = data.maxDrawdown;
    const { error } = await supabase
      .from('fin_session_stats')
      .upsert(payload, { onConflict: 'user_id,date,session_type' });
    if (error) {
      console.error('❌ Erreur upsertFinSessionStat:', error.message, error.details);
      return { ok: false, reason: 'erreur_serveur', message: error.message };
    }
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('❌ upsertFinSessionStatToSupabase:', e);
    return { ok: false, reason: 'erreur_serveur', message: msg };
  }
};

/** Supprime les stats fin de session pour une date. */
export const deleteFinSessionStatFromSupabase = async (dateStr: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    const { error } = await supabase
      .from('fin_session_stats')
      .delete()
      .eq('user_id', user.id)
      .eq('date', dateStr);
    if (error) {
      console.error('❌ Erreur deleteFinSessionStat:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('❌ deleteFinSessionStatFromSupabase:', e);
    return false;
  }
};

// Interface pour les comptes utilisateur
export interface UserAccount {
  id: string;
  user_id: string;
  account_name: string;
  is_default: boolean;
  initial_balance?: number;
  current_balance?: number | null;
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
      console.error('❌ Détails erreur:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
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

// Récupérer l'abonnement de l'utilisateur
export const getUserSubscription = async (): Promise<{ plan_type: 'basic' | 'premium' | 'journal' | null; status: string } | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log('ℹ️ Utilisateur non connecté');
      return null;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Aucun abonnement trouvé
        console.log('ℹ️ Aucun abonnement actif trouvé');
        return null;
      }
      console.error('❌ Erreur récupération abonnement:', error);
      return null;
    }

    console.log('✅ Abonnement récupéré:', data);
    return data;
  } catch (error) {
    console.error('❌ Erreur getUserSubscription:', error);
    return null;
  }
};
