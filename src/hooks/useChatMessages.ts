import { useState, useEffect, useCallback, useRef } from 'react';
import supabaseClient, { ChatMessage, getCurrentUser } from '../lib/supabase';

export interface LocalMessage {
  id: string;
  text: string;
  sender: string;
  senderName: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
  reactions: { [emoji: string]: string[] };
  pinned: boolean;
  edited: boolean;
  replyTo?: LocalMessage;
  showProfile: boolean;
  attachments?: MessageAttachment[];
  isDeleted?: boolean;
  createdAt: string;
}

export interface MessageAttachment {
  id: string;
  url: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  type: 'image' | 'file' | 'audio';
}

export interface UseChatMessagesOptions {
  channelId: string;
  onNewMessage?: (message: LocalMessage) => void;
  onUnreadCountChange?: (count: number) => void;
  isActive?: boolean;
  messageLimit?: number;
}

export const useChatMessages = ({
  channelId,
  onNewMessage,
  onUnreadCountChange,
  isActive = true,
  messageLimit = 100
}: UseChatMessagesOptions) => {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: any }>({});
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const subscriptionRef = useRef<any>(null);
  const lastMessageTimeRef = useRef<string>('');
  const isLoadingRef = useRef(false);

  // Cache pour éviter les requêtes répétées
  const profileCache = useRef<{ [key: string]: any }>({});

  // Initialiser l'utilisateur actuel
  useEffect(() => {
    const initUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUserId(user.id);
        } else {
          // Mode admin
          const adminAuth = localStorage.getItem('adminAuthenticated');
          if (adminAuth === 'true') {
            setCurrentUserId('00000000-0000-0000-0000-000000000001');
          }
        }
      } catch (err) {
        console.error('Erreur initialisation utilisateur:', err);
        // Fallback admin
        const adminAuth = localStorage.getItem('adminAuthenticated');
        if (adminAuth === 'true') {
          setCurrentUserId('00000000-0000-0000-0000-000000000001');
        }
      }
    };

    initUser();
  }, []);

  // Récupérer le profil utilisateur avec cache
  const getUserProfile = useCallback(async (userId: string, userName?: string) => {
    if (profileCache.current[userId]) {
      return profileCache.current[userId];
    }

    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('avatar_url, full_name, email, status, last_seen')
        .eq('id', userId)
        .single();

      const profile = {
        id: userId,
        name: data?.full_name || userName || 'Utilisateur',
        email: data?.email || '',
        avatar: data?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'U')}&background=random&color=fff`,
        status: data?.status || 'offline',
        lastSeen: data?.last_seen,
        initials: (data?.full_name || userName || 'U')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      };

      profileCache.current[userId] = profile;
      setUserProfiles(prev => ({ ...prev, [userId]: profile }));

      return profile;
    } catch (err) {
      console.error('Erreur récupération profil:', err);
      const fallbackProfile = {
        id: userId,
        name: userName || 'Utilisateur',
        email: '',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'U')}&background=random&color=fff`,
        status: 'offline',
        initials: (userName || 'U').substring(0, 2).toUpperCase()
      };

      profileCache.current[userId] = fallbackProfile;
      setUserProfiles(prev => ({ ...prev, [userId]: fallbackProfile }));

      return fallbackProfile;
    }
  }, []);

  // Convertir un message Supabase en LocalMessage
  const convertToLocalMessage = useCallback(async (msg: ChatMessage): Promise<LocalMessage> => {
    const senderId = msg.author_id;
    const isAdminMessage = senderId === '00000000-0000-0000-0000-000000000001' ||
                         senderId === '11111111-1111-1111-1111-111111111111' ||
                         msg.author_name === 'Admin';

    const displayName = isAdminMessage ? 'Admin' : msg.author_name;
    await getUserProfile(senderId, displayName);

    return {
      id: msg.id,
      text: msg.content,
      sender: senderId,
      senderName: displayName,
      time: new Date(msg.created_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      status: 'read' as const,
      reactions: {},
      pinned: false,
      edited: !!msg.is_edited,
      showProfile: true,
      attachments: msg.attachments || [],
      isDeleted: !!msg.is_deleted,
      createdAt: msg.created_at
    };
  }, [getUserProfile]);

  // Charger les messages initiaux
  const loadMessages = useCallback(async (before?: string) => {
    if (isLoadingRef.current || !currentUserId) return [];

    isLoadingRef.current = true;
    setError(null);

    try {
      let query = supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(messageLimit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        setHasMore(false);
        return [];
      }

      const convertedMessages = await Promise.all(
        data.reverse().map(msg => convertToLocalMessage(msg))
      );

      if (data.length < messageLimit) {
        setHasMore(false);
      }

      return convertedMessages;
    } catch (err) {
      console.error('Erreur chargement messages:', err);
      setError('Erreur lors du chargement des messages');
      return [];
    } finally {
      isLoadingRef.current = false;
    }
  }, [channelId, currentUserId, messageLimit, convertToLocalMessage]);

  // Charger plus de messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    const oldestMessage = messages[0];
    const olderMessages = await loadMessages(oldestMessage.createdAt);

    if (olderMessages.length > 0) {
      setMessages(prev => [...olderMessages, ...prev]);
    }

    setLoadingMore(false);
  }, [messages, hasMore, loadingMore, loadMessages]);

  // Initialiser les messages
  useEffect(() => {
    if (!currentUserId) return;

    const initMessages = async () => {
      setLoading(true);
      const initialMessages = await loadMessages();
      setMessages(initialMessages);

      if (initialMessages.length > 0) {
        lastMessageTimeRef.current = initialMessages[initialMessages.length - 1].createdAt;
      }

      setLoading(false);
    };

    initMessages();
  }, [currentUserId, channelId, loadMessages]);

  // Abonnement temps réel aux messages
  useEffect(() => {
    if (!currentUserId) return;

    // Nettoyer l'abonnement précédent
    if (subscriptionRef.current) {
      supabaseClient.removeChannel(subscriptionRef.current);
    }

    subscriptionRef.current = supabaseClient
      .channel(`chat-${channelId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          try {
            const newMsg = payload.new as ChatMessage;

            // Éviter les doublons
            setMessages(prev => {
              if (prev.find(msg => msg.id === newMsg.id)) {
                return prev;
              }

              // Convertir et ajouter le nouveau message
              convertToLocalMessage(newMsg).then(localMessage => {
                setMessages(current => {
                  if (current.find(msg => msg.id === localMessage.id)) {
                    return current;
                  }

                  const newMessages = [...current, localMessage];

                  // Notifier du nouveau message
                  onNewMessage?.(localMessage);

                  // Gérer les messages non lus
                  if (!isActive && localMessage.sender !== currentUserId) {
                    setUnreadCount(prev => {
                      const newCount = prev + 1;
                      onUnreadCountChange?.(newCount);
                      return newCount;
                    });
                  }

                  return newMessages;
                });
              });

              return prev;
            });
          } catch (err) {
            console.error('Erreur traitement nouveau message:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        async (payload) => {
          try {
            const updatedMsg = payload.new as ChatMessage;
            const localMessage = await convertToLocalMessage(updatedMsg);

            setMessages(prev =>
              prev.map(msg => msg.id === localMessage.id ? localMessage : msg)
            );
          } catch (err) {
            console.error('Erreur mise à jour message:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          const deletedId = payload.old.id;
          setMessages(prev => prev.filter(msg => msg.id !== deletedId));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIPTION_ERROR') {
          setError('Erreur de connexion temps réel');
        }
      });

    return () => {
      if (subscriptionRef.current) {
        supabaseClient.removeChannel(subscriptionRef.current);
      }
    };
  }, [channelId, currentUserId, isActive, onNewMessage, onUnreadCountChange, convertToLocalMessage]);

  // Envoyer un message
  const sendMessage = useCallback(async (
    content: string,
    replyToId?: string,
    attachments?: MessageAttachment[]
  ) => {
    if (!content.trim() || !currentUserId) {
      throw new Error('Contenu manquant ou utilisateur non connecté');
    }

    try {
      const adminAuth = localStorage.getItem('adminAuthenticated');
      const isAdmin = adminAuth === 'true';

      const finalUserId = isAdmin ? '11111111-1111-1111-1111-111111111111' : currentUserId;
      const finalUserName = isAdmin ? 'Admin' : 'Utilisateur';

      const { data, error } = await supabaseClient
        .from('chat_messages')
        .insert({
          content: content.trim(),
          author_id: finalUserId,
          author_name: finalUserName,
          channel_id: channelId,
          message_type: 'text' as const,
          reply_to_id: replyToId || null,
          attachments: attachments || []
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Erreur envoi message:', err);
      throw err;
    }
  }, [currentUserId, channelId]);

  // Modifier un message
  const updateMessage = useCallback(async (messageId: string, content: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabaseClient
        .from('chat_messages')
        .update({
          content: content.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('author_id', currentUserId);

      if (error) throw error;
    } catch (err) {
      console.error('Erreur modification message:', err);
      throw err;
    }
  }, [currentUserId]);

  // Supprimer un message
  const deleteMessage = useCallback(async (messageId: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabaseClient
        .from('chat_messages')
        .update({ is_deleted: true })
        .eq('id', messageId)
        .eq('author_id', currentUserId);

      if (error) throw error;
    } catch (err) {
      console.error('Erreur suppression message:', err);
      throw err;
    }
  }, [currentUserId]);

  // Ajouter une réaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!currentUserId) return;

    try {
      const { error } = await supabaseClient
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          emoji,
          user_id: currentUserId,
          user_name: userProfiles[currentUserId]?.name || 'Utilisateur'
        });

      if (error) throw error;

      // Mise à jour locale optimiste
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const newReactions = { ...msg.reactions };
          if (newReactions[emoji]?.includes(currentUserId)) {
            newReactions[emoji] = newReactions[emoji].filter(id => id !== currentUserId);
            if (newReactions[emoji].length === 0) {
              delete newReactions[emoji];
            }
          } else {
            newReactions[emoji] = [...(newReactions[emoji] || []), currentUserId];
          }
          return { ...msg, reactions: newReactions };
        }
        return msg;
      }));
    } catch (err) {
      console.error('Erreur ajout réaction:', err);
      throw err;
    }
  }, [currentUserId, userProfiles]);

  // Marquer les messages comme lus
  const markAsRead = useCallback(() => {
    if (isActive) {
      setUnreadCount(0);
      onUnreadCountChange?.(0);
    }
  }, [isActive, onUnreadCountChange]);

  // Rechercher dans les messages
  const searchMessages = useCallback((query: string) => {
    if (!query.trim()) return messages;

    return messages.filter(msg =>
      msg.text.toLowerCase().includes(query.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(query.toLowerCase())
    );
  }, [messages]);

  // Nettoyer à la destruction
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabaseClient.removeChannel(subscriptionRef.current);
      }
    };
  }, []);

  return {
    messages,
    loading,
    error,
    unreadCount,
    currentUserId,
    userProfiles,
    hasMore,
    loadingMore,
    sendMessage,
    updateMessage,
    deleteMessage,
    addReaction,
    markAsRead,
    searchMessages,
    loadMoreMessages,
    isCurrentUser: useCallback((senderId: string) => {

      // Vérification admin
      if (senderId === '00000000-0000-0000-0000-000000000001' ||
          senderId === '11111111-1111-1111-1111-111111111111') {
        const adminAuth = localStorage.getItem('adminAuthenticated');
        const isAdmin = adminAuth === 'true';
        return isAdmin;
      }

      // Vérification utilisateur normal
      const isCurrentUserMsg = senderId === currentUserId && !!currentUserId;
      return isCurrentUserMsg;
    }, [currentUserId])
  };
};