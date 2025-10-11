import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, ChatMessage, MessageReaction, MessageAttachment, formatMessageTime, validateMessage, sanitizeMessage, extractMentions, extractUrls } from '../lib/supabase';

// Types pour le hook
export interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  typingUsers: string[];
  isTyping: boolean;
  uploadProgress: { [key: string]: number };
}

export interface ChatActions {
  sendMessage: (content: string, attachments?: File[]) => Promise<{ success: boolean; error?: string; messageId?: string }>;
  editMessage: (messageId: string, newContent: string) => Promise<{ success: boolean; error?: string }>;
  deleteMessage: (messageId: string) => Promise<{ success: boolean; error?: string }>;
  addReaction: (messageId: string, emoji: string) => Promise<{ success: boolean; error?: string }>;
  removeReaction: (messageId: string, emoji: string) => Promise<{ success: boolean; error?: string }>;
  uploadFile: (file: File, messageId?: string) => Promise<{ success: boolean; error?: string; url?: string }>;
  startTyping: () => void;
  stopTyping: () => void;
  loadMoreMessages: () => Promise<void>;
  clearError: () => void;
}

export interface ChatOptions {
  channelId: string;
  limit?: number;
  autoScroll?: boolean;
  enableTyping?: boolean;
  enableReactions?: boolean;
  enableMentions?: boolean;
}

// Hook principal useChat
export const useChat = (options: ChatOptions): ChatState & ChatActions => {
  const { channelId, limit = 50, autoScroll = true, enableTyping = true, enableReactions = true, enableMentions = true } = options;
  
  const [state, setState] = useState<ChatState>({
    messages: [],
    loading: true,
    error: null,
    typingUsers: [],
    isTyping: false,
    uploadProgress: {},
  });

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fonction pour mettre à jour l'état
  const updateState = useCallback((updates: Partial<ChatState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Fonction pour gérer les erreurs
  const handleError = useCallback((error: Error | string) => {
    const errorMessage = typeof error === 'string' 
      ? error 
      : error.message || 'Une erreur inattendue s\'est produite';
    
    updateState({ error: errorMessage, loading: false });
    console.error('Chat Error:', error);
  }, [updateState]);

  // Fonction pour faire défiler vers le bas
  const scrollToBottom = useCallback(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  // Fonction pour charger les messages
  const loadMessages = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:chat_users!chat_messages_sender_id_fkey(*),
          parent_message:chat_messages!chat_messages_replied_to_message_id_fkey(*),
          attachments(*),
          reactions(*)
        `)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      updateState({ 
        messages: data || [], 
        loading: false, 
        error: null 
      });

      // Faire défiler vers le bas après le chargement
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      handleError(error as Error);
    }
  }, [channelId, limit, updateState, handleError, scrollToBottom]);

  // Fonction pour charger plus de messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (state.messages.length === 0) return;

    try {
      const oldestMessage = state.messages[0];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:chat_users!chat_messages_sender_id_fkey(*),
          parent_message:chat_messages!chat_messages_replied_to_message_id_fkey(*),
          attachments(*),
          reactions(*)
        `)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .lt('created_at', oldestMessage.created_at)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      if (data && data.length > 0) {
        updateState({ 
          messages: [...data, ...state.messages]
        });
      }
    } catch (error) {
      handleError(error as Error);
    }
  }, [channelId, limit, state.messages, updateState, handleError]);

  // Fonction pour envoyer un message
  const sendMessage = useCallback(async (content: string, attachments?: File[]) => {
    try {
      if (!validateMessage(content)) {
        throw new Error('Le message ne peut pas être vide');
      }

      const sanitizedContent = sanitizeMessage(content);
      const mentions = enableMentions ? extractMentions(content) : [];
      const urls = extractUrls(content);

      // Créer le message
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelId,
          content: sanitizedContent,
          message_type: 'text',
          mentions,
          urls,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Upload des fichiers si présents
      if (attachments && attachments.length > 0) {
        for (const file of attachments) {
          await uploadFile(file, messageData.id);
        }
      }

      // Mettre à jour le statut de frappe
      if (enableTyping) {
        stopTyping();
      }

      return { success: true, messageId: messageData.id };
    } catch (error) {
      const errorMessage = (error as Error).message;
      handleError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [channelId, enableTyping, enableMentions, updateState, handleError]);

  // Fonction pour modifier un message
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      if (!validateMessage(newContent)) {
        throw new Error('Le message ne peut pas être vide');
      }

      const sanitizedContent = sanitizeMessage(newContent);
      const mentions = enableMentions ? extractMentions(newContent) : [];
      const urls = extractUrls(newContent);

      const { error } = await supabase
        .from('chat_messages')
        .update({
          content: sanitizedContent,
          mentions,
          urls,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const errorMessage = (error as Error).message;
      handleError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [enableMentions, handleError]);

  // Fonction pour supprimer un message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const errorMessage = (error as Error).message;
      handleError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [handleError]);

  // Fonction pour ajouter une réaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      if (!enableReactions) {
        throw new Error('Les réactions ne sont pas activées');
      }

      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          emoji,
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const errorMessage = (error as Error).message;
      handleError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [enableReactions, handleError]);

  // Fonction pour supprimer une réaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      if (!enableReactions) {
        throw new Error('Les réactions ne sont pas activées');
      }

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('emoji', emoji);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const errorMessage = (error as Error).message;
      handleError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [enableReactions, handleError]);

  // Fonction pour uploader un fichier
  const uploadFile = useCallback(async (file: File, messageId?: string) => {
    try {
      const filePath = `chat/${channelId}/${Date.now()}-${file.name}`;
      
      // Mettre à jour le progrès d'upload
      updateState(prev => ({
        uploadProgress: { ...prev.uploadProgress, [file.name]: 0 }
      }));

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100;
            updateState(prev => ({
              uploadProgress: { ...prev.uploadProgress, [file.name]: percentage }
            }));
          }
        });

      if (error) throw error;

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      // Créer l'enregistrement d'attachement
      if (messageId) {
        const { error: attachmentError } = await supabase
          .from('message_attachments')
          .insert({
            message_id: messageId,
            file_url: urlData.publicUrl,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          });

        if (attachmentError) throw attachmentError;
      }

      // Nettoyer le progrès d'upload
      updateState(prev => {
        const newProgress = { ...prev.uploadProgress };
        delete newProgress[file.name];
        return { uploadProgress: newProgress };
      });

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      const errorMessage = (error as Error).message;
      handleError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [channelId, updateState, handleError]);

  // Fonction pour démarrer la frappe
  const startTyping = useCallback(() => {
    if (!enableTyping) return;

    // Envoyer l'événement de frappe
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: supabase.auth.getUser()?.then(u => u.data.user?.id) },
      });
    }

    // Mettre à jour l'état local
    updateState({ isTyping: true });

    // Arrêter la frappe après 3 secondes d'inactivité
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [enableTyping, updateState]);

  // Fonction pour arrêter la frappe
  const stopTyping = useCallback(() => {
    if (!enableTyping) return;

    // Envoyer l'événement d'arrêt de frappe
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { user_id: supabase.auth.getUser()?.then(u => u.data.user?.id) },
      });
    }

    // Mettre à jour l'état local
    updateState({ isTyping: false });

    // Nettoyer le timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [enableTyping, updateState]);

  // Fonction pour effacer les erreurs
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Effet pour charger les messages au montage
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Effet pour configurer l'abonnement temps réel
  useEffect(() => {
    if (!channelId) return;

    // Créer le canal temps réel
    const channel = supabase.channel(`chat:${channelId}`, {
      config: {
        presence: {
          key: 'user_id',
        },
      },
    });

    // Écouter les nouveaux messages
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        
        // Récupérer le message complet avec relations
        supabase
          .from('chat_messages')
          .select(`
            *,
            sender:chat_users!chat_messages_sender_id_fkey(*),
            parent_message:chat_messages!chat_messages_replied_to_message_id_fkey(*),
            attachments(*),
            reactions(*)
          `)
          .eq('id', payload.new.id)
          .single()
          .then(({ data, error }) => {
            if (error) {
              console.error('Erreur récupération message:', error);
              return;
            }

            if (data) {
              updateState(prev => ({
                messages: [...prev.messages, data]
              }));
              
              // Faire défiler vers le bas
              setTimeout(scrollToBottom, 100);
            }
          });
      }
    );

    // Écouter les modifications de messages
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        
        updateState(prev => ({
          messages: prev.messages.map(msg => 
            msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
          )
        }));
      }
    );

    // Écouter les suppressions de messages
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`,
      },
      (payload) => {
        if (payload.new.is_deleted) {
          
          updateState(prev => ({
            messages: prev.messages.filter(msg => msg.id !== payload.new.id)
          }));
        }
      }
    );

    // Écouter les événements de frappe
    if (enableTyping) {
      channel.on('broadcast', { event: 'typing' }, (payload) => {
        const userId = payload.payload.user_id;
        if (userId) {
          updateState(prev => ({
            typingUsers: [...new Set([...prev.typingUsers, userId])]
          }));
        }
      });

      channel.on('broadcast', { event: 'stop_typing' }, (payload) => {
        const userId = payload.payload.user_id;
        if (userId) {
          updateState(prev => ({
            typingUsers: prev.typingUsers.filter(id => id !== userId)
          }));
        }
      });
    }

    // S'abonner au canal
    channel.subscribe((status) => {
    });

    channelRef.current = channel;

    // Nettoyage
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [channelId, enableTyping, updateState, scrollToBottom]);

  return {
    // État
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    typingUsers: state.typingUsers,
    isTyping: state.isTyping,
    uploadProgress: state.uploadProgress,
    
    // Actions
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    uploadFile,
    startTyping,
    stopTyping,
    loadMoreMessages,
    clearError,
  };
};

// Hook pour récupérer les messages d'un canal spécifique
export const useChannelMessages = (channelId: string, limit = 50) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('chat_messages')
          .select(`
            *,
            sender:chat_users!chat_messages_sender_id_fkey(*),
            parent_message:chat_messages!chat_messages_replied_to_message_id_fkey(*),
            attachments(*),
            reactions(*)
          `)
          .eq('channel_id', channelId)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true })
          .limit(limit);

        if (error) throw error;

        setMessages(data || []);
      } catch (error) {
        setError((error as Error).message);
        console.error('Error fetching channel messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      fetchMessages();
    }
  }, [channelId, limit]);

  return { messages, loading, error };
};

// Hook pour gérer les réactions
export const useMessageReactions = (messageId: string) => {
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('message_reactions')
          .select('*')
          .eq('message_id', messageId);

        if (error) throw error;

        setReactions(data || []);
      } catch (error) {
        setError((error as Error).message);
        console.error('Error fetching message reactions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (messageId) {
      fetchReactions();
    }
  }, [messageId]);

  return { reactions, loading, error };
};

export default useChat;




