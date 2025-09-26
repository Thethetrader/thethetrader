import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  MoreVertical,
  Smile,
  Heart,
  Search,
  X,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  sendMessage,
  getMessages,
  subscribeToMessages,
  addReaction,
  removeReaction,
  getCurrentUser,
  getUserProfile,
  isUserAdmin,
  supabase
} from '../lib/supabase';

// Types d'interface
interface ChatZoneSupabaseProps {
  channelId?: string;
  onUnreadCountChange?: (channel: string, count: number) => void;
  isActive?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
}

interface SupabaseMessage {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
  reactions?: Array<{
    reaction: string;
    user_id: string;
  }>;
  pinned?: boolean;
  is_edited?: boolean;
}

export default function ChatZoneSupabase({
  channelId = 'chatzone',
  onUnreadCountChange,
  isActive = true,
  className = '',
  theme = 'dark'
}: ChatZoneSupabaseProps) {
  // États
  const [messages, setMessages] = useState<SupabaseMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Emojis disponibles
  const emojis = ['❤️', '👍', '👎', '😊', '😢', '😮', '😡', '🎉', '🔥', '💯'];

  // Charger l'utilisateur actuel
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);

          // Charger le profil utilisateur
          const { data: profile } = await getUserProfile(user.id);
          setUserProfile(profile);

          // Vérifier si admin
          const adminStatus = await isUserAdmin(user.id);
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('❌ Erreur chargement utilisateur:', error);
      }
    };

    loadCurrentUser();
  }, []);

  // Charger les messages
  const loadMessages = useCallback(async () => {
    if (!channelId) return;

    setIsLoading(true);
    try {
      // Récupérer l'ID du canal "chatzone" depuis la base
      const { data: channelData } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('name', channelId)
        .single();

      if (channelData) {
        const { data: messagesData } = await getMessages(channelData.id);
        setMessages(messagesData || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [channelId]);

  // Charger messages au démarrage
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // S'abonner aux nouveaux messages
  useEffect(() => {
    if (!channelId) return;

    let subscription: any;

    const setupSubscription = async () => {
      try {
        // Récupérer l'ID du canal
        const { data: channelData } = await supabase
          .from('chat_channels')
          .select('id')
          .eq('name', channelId)
          .single();

        if (channelData) {
          subscription = subscribeToMessages(channelData.id, (newMessage: SupabaseMessage) => {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
          });
        }
      } catch (error) {
        console.error('❌ Erreur subscription messages:', error);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [channelId]);

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      // Récupérer l'ID du canal
      const { data: channelData } = await supabase
        .from('chat_channels')
        .select('id')
        .eq('name', channelId)
        .single();

      if (channelData) {
        const { data, error } = await sendMessage(channelData.id, newMessage.trim());

        if (error) {
          console.error('❌ Erreur envoi message:', error);
          return;
        }

        // Message ajouté via subscription en temps réel
        setNewMessage('');
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
    }
  };

  // Ajouter/retirer réaction
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;

    try {
      // Vérifier si l'utilisateur a déjà cette réaction
      const message = messages.find(m => m.id === messageId);
      const hasReaction = message?.reactions?.some(r =>
        r.user_id === currentUser.id && r.reaction === emoji
      );

      if (hasReaction) {
        await removeReaction(messageId, emoji);
      } else {
        await addReaction(messageId, emoji);
      }

      // Recharger les messages pour voir les réactions mises à jour
      await loadMessages();
    } catch (error) {
      console.error('❌ Erreur gestion réaction:', error);
    }
  };

  // Gérer Entrée pour envoyer
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Formater l'heure
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Grouper réactions par emoji
  const groupReactions = (reactions: Array<{reaction: string, user_id: string}> = []) => {
    const grouped: Record<string, string[]> = {};
    reactions.forEach(r => {
      if (!grouped[r.reaction]) grouped[r.reaction] = [];
      grouped[r.reaction].push(r.user_id);
    });
    return grouped;
  };

  return (
    <div className={`flex flex-col h-full ${className} ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">💬 Chat {channelId}</h3>
            <p className="text-sm text-gray-400">
              {currentUser ? `Connecté en tant que ${userProfile?.name || currentUser.email}` : 'Non connecté'}
              {isAdmin && ' • Admin'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Search size={20} />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center text-gray-400">Chargement des messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400">Aucun message encore. Soyez le premier à écrire !</div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => {
              const reactions = groupReactions(message.reactions);
              const isOwnMessage = currentUser && message.author_id === currentUser.id;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group"
                >
                  <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {message.author?.name?.charAt(0) || message.author?.email?.charAt(0) || '?'}
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 max-w-xs sm:max-w-md ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
                      {/* Header */}
                      <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                        <span className="font-semibold text-sm">
                          {message.author?.name || message.author?.email}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(message.created_at)}
                        </span>
                        {message.is_edited && (
                          <span className="text-xs text-gray-500">(modifié)</span>
                        )}
                      </div>

                      {/* Message */}
                      <div className={`p-3 rounded-2xl ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : theme === 'dark'
                            ? 'bg-gray-700'
                            : 'bg-gray-100'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {/* Réactions */}
                      {Object.keys(reactions).length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {Object.entries(reactions).map(([emoji, userIds]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(message.id, emoji)}
                              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 transition-colors ${
                                userIds.includes(currentUser?.id)
                                  ? 'bg-blue-600 text-white'
                                  : theme === 'dark'
                                    ? 'bg-gray-700 hover:bg-gray-600'
                                    : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                            >
                              {emoji} {userIds.length}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="relative">
                        <button
                          onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? false : message.id)}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Smile size={16} />
                        </button>

                        {/* Picker d'emoji */}
                        {showEmojiPicker === message.id && (
                          <div className="absolute right-0 mt-1 p-2 bg-gray-800 rounded-lg shadow-lg z-10 flex gap-1">
                            {emojis.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => {
                                  handleReaction(message.id, emoji);
                                  setShowEmojiPicker(false);
                                }}
                                className="hover:bg-gray-700 p-1 rounded transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {currentUser ? (
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Écrire dans ${channelId}...`}
              className={`flex-1 px-4 py-2 rounded-lg border-none outline-none ${
                theme === 'dark'
                  ? 'bg-gray-700 text-white placeholder-gray-400'
                  : 'bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className={`p-4 border-t text-center ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <p className="text-gray-400">Vous devez être connecté pour écrire un message</p>
        </div>
      )}
    </div>
  );
}