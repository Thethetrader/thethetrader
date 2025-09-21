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

// Export par défaut du client Supabase
export default supabase;




