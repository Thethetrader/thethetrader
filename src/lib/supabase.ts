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

// ====== CHAT FUNCTIONS ======

/**
 * Envoie un message dans un canal
 */
export const sendMessage = async (channelId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text') => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        content,
        channel_id: channelId,
        author_id: user.id,
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




