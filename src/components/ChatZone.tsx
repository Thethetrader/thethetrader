import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  MoreVertical,
  Smile,
  Paperclip,
  Mic,
  Reply,
  Copy,
  Edit3,
  Trash2,
  Forward,
  Star,
  Info,
  Pin,
  Heart,
  Search,
  X,
  Image as ImageIcon,
  File,
  Download,
  Upload,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  sendMessage as supabaseSendMessage,
  getMessages as supabaseGetMessages,
  subscribeToMessages as supabaseSubscribeToMessages,
  addReaction as supabaseAddReaction,
  removeReaction as supabaseRemoveReaction,
  getCurrentUser,
  getUserProfile,
  isUserAdmin,
  supabase
} from '../lib/supabase';

// Types d'interface
interface ChatZoneProps {
  onUnreadCountChange?: (channel: string, count: number) => void;
  isActive?: boolean;
  channelId?: string;
  className?: string;
  theme?: 'light' | 'dark';
}

interface ContextMenuState {
  x: number;
  y: number;
  messageId: string;
}

interface LocalMessage {
  id: string;
  text: string;
  sender: string;
  senderName: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
  reactions: Record<string, string[]>;
  pinned: boolean;
  edited: boolean;
  replyTo?: LocalMessage;
  attachments?: Array<{id: string, filename: string, type: string}>;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  initials: string;
  status?: 'online' | 'offline';
}

const ChatZone: React.FC<ChatZoneProps> = ({
  onUnreadCountChange,
  isActive: parentIsActive = true,
  channelId = 'chatzone',
  className = '',
  theme = 'light'
}) => {
  // États principaux
  const [message, setMessage] = useState<string>('');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<LocalMessage | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState<boolean>(false);
  const [draggedOver, setDraggedOver] = useState<boolean>(false);

  // États pour les interactions tactiles
  const [touchTimeout, setTouchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [longPressActive, setLongPressActive] = useState<string | null>(null);

  // Refs
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // États locaux
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string>('admin');
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({
    'admin': {
      id: 'admin',
      name: 'Admin',
      email: 'admin@local.com',
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=4ade80',
      initials: 'AD',
      status: 'online'
    },
    'user': {
      id: 'user',
      name: 'Utilisateur',
      email: 'user@local.com',
      avatar: 'https://ui-avatars.com/api/?name=Utilisateur&background=3b82f6',
      initials: 'US',
      status: 'online'
    }
  });
  const [typingUsers, setTypingUsers] = useState<Array<{id: string, name: string}>>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploads, setUploads] = useState<Record<string, any>>({});

  // États Supabase
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [supabaseProfile, setSupabaseProfile] = useState<any>(null);
  const [isSupabaseAdmin, setIsSupabaseAdmin] = useState(false);
  const [currentChannelId, setCurrentChannelId] = useState<string>('');
  const [supabaseMessages, setSupabaseMessages] = useState<any[]>([]);

  // Émojis disponibles
  const emojis = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '👏', '🙏', '🔥', '💯', '✨', '🎉', '🚀', '💪'];

  // Fonctions utilitaires locales
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const validateMessage = (content: string) => {
    return content.trim().length > 0 && content.trim().length <= 1000;
  };

  const sanitizeMessage = (content: string) => {
    return content.trim();
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (userId: string) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-yellow-500'];
    return colors[userId.length % colors.length];
  };

  const isCurrentUser = (senderId: string) => {
    return senderId === currentUserId;
  };

  const handleTyping = () => {
    // Simulation de frappe locale
    console.log('Utilisateur en train d\'écrire...');
  };

  const uploadMultipleFiles = async (files: File[], userId: string) => {
    console.log('Upload local simulé pour:', files.length, 'fichiers');
    setIsUploading(true);

    // Simulation d'upload
    setTimeout(() => {
      setIsUploading(false);
      console.log('Upload terminé');
    }, 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  // ======= INTÉGRATION SUPABASE =======

  // Initialisation Supabase au démarrage
  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        console.log('🔄 Initialisation Supabase ChatZone...');

        // Charger l'utilisateur actuel
        const user = await getCurrentUser();
        if (user) {
          setSupabaseUser(user);
          console.log('✅ Utilisateur Supabase chargé:', user.email);

          // Charger le profil utilisateur
          const { data: profile } = await getUserProfile(user.id);
          if (profile) {
            setSupabaseProfile(profile);
            // Mettre à jour l'ID utilisateur local avec le vrai ID Supabase
            setCurrentUserId(user.id);

            // Mettre à jour les profils locaux avec les données Supabase
            setUserProfiles(prev => ({
              ...prev,
              [user.id]: {
                id: user.id,
                name: profile.name || user.email || 'Utilisateur',
                email: user.email || '',
                avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || user.email || 'User')}&background=random`,
                initials: getUserInitials(profile.name || user.email || 'User'),
                status: 'online'
              }
            }));
            console.log('✅ Profil utilisateur chargé:', profile);
          }

          // Vérifier si admin
          const adminStatus = await isUserAdmin(user.id);
          setIsSupabaseAdmin(adminStatus);
          console.log('👑 Status admin:', adminStatus);
        } else {
          console.log('❌ Aucun utilisateur Supabase connecté');
        }

        // Récupérer l'ID du canal "chatzone"
        const { data: channelData } = await supabase
          .from('chat_channels')
          .select('id')
          .eq('name', 'chatzone')
          .single();

        if (channelData) {
          setCurrentChannelId(channelData.id);
          console.log('✅ Canal trouvé:', channelData.id);

          // Charger les messages existants
          const { data: messagesData } = await supabaseGetMessages(channelData.id);
          if (messagesData) {
            // Convertir les messages Supabase au format local
            const convertedMessages = messagesData.map((msg: any) => ({
              id: msg.id,
              text: msg.content,
              sender: msg.author_id,
              senderName: msg.author?.name || msg.author?.email || 'Utilisateur',
              time: formatMessageTime(new Date(msg.created_at)),
              status: 'delivered',
              reactions: {},
              pinned: msg.pinned || false,
              edited: msg.is_edited || false
            }));

            setMessages(convertedMessages);
            console.log('✅ Messages chargés:', convertedMessages.length);
          }
        }

      } catch (error) {
        console.error('❌ Erreur initialisation Supabase:', error);
      } finally {
        // Terminer le chargement dans tous les cas
        setLoading(false);
        console.log('✅ Initialisation ChatZone terminée');
      }
    };

    initializeSupabase();
  }, []);

  // S'abonner aux nouveaux messages en temps réel
  useEffect(() => {
    if (!currentChannelId) return;

    console.log('🔔 Mise en place abonnement temps réel pour canal:', currentChannelId);

    const subscription = supabaseSubscribeToMessages(currentChannelId, (newMessage: any) => {
      console.log('📨 Nouveau message reçu:', newMessage);

      // Convertir au format local
      const convertedMessage = {
        id: newMessage.id,
        text: newMessage.content,
        sender: newMessage.author_id,
        senderName: newMessage.author?.name || newMessage.author?.email || 'Utilisateur',
        time: formatMessageTime(new Date(newMessage.created_at)),
        status: 'delivered',
        reactions: {},
        pinned: newMessage.pinned || false,
        edited: newMessage.is_edited || false
      };

      setMessages(prev => [...prev, convertedMessage]);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log('🔕 Désabonnement temps réel');
      }
    };
  }, [currentChannelId]);

  const sendChatMessage = async (content: string, replyToId?: string) => {
    if (!supabaseUser || !currentChannelId) {
      console.warn('❌ Impossible d\'envoyer: utilisateur ou canal manquant');
      // Fallback au mode local si Supabase n'est pas disponible
      const newMessage: LocalMessage = {
        id: `msg-${Date.now()}`,
        text: content,
        sender: currentUserId,
        senderName: userProfiles[currentUserId]?.name || 'Utilisateur',
        time: formatMessageTime(new Date()),
        status: 'sent',
        reactions: {},
        pinned: false,
        edited: false,
        replyTo: replyToId ? messages.find(m => m.id === replyToId) : undefined
      };
      setMessages(prev => [...prev, newMessage]);
      console.log('✅ Message envoyé localement (fallback)');
      return;
    }

    try {
      console.log('📤 Envoi message vers Supabase...', { content, channelId: currentChannelId });

      const { data, error } = await supabaseSendMessage(currentChannelId, content);

      if (error) {
        console.error('❌ Erreur envoi message Supabase:', error);
        // Fallback mode local en cas d'erreur
        const newMessage: LocalMessage = {
          id: `msg-${Date.now()}-fallback`,
          text: content,
          sender: currentUserId,
          senderName: userProfiles[currentUserId]?.name || 'Utilisateur',
          time: formatMessageTime(new Date()),
          status: 'sent',
          reactions: {},
          pinned: false,
          edited: false,
          replyTo: replyToId ? messages.find(m => m.id === replyToId) : undefined
        };
        setMessages(prev => [...prev, newMessage]);
        console.log('✅ Message envoyé en mode local (erreur Supabase)');
      } else {
        console.log('✅ Message envoyé via Supabase:', data);
        // Le message sera ajouté automatiquement via l'abonnement temps réel
      }
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      // Fallback mode local
      const newMessage: LocalMessage = {
        id: `msg-${Date.now()}-error`,
        text: content,
        sender: currentUserId,
        senderName: userProfiles[currentUserId]?.name || 'Utilisateur',
        time: formatMessageTime(new Date()),
        status: 'sent',
        reactions: {},
        pinned: false,
        edited: false,
        replyTo: replyToId ? messages.find(m => m.id === replyToId) : undefined
      };
      setMessages(prev => [...prev, newMessage]);
      console.log('✅ Message envoyé en mode local (exception)');
    }
  };

  const updateMessage = async (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, text: newContent, edited: true }
        : msg
    ));
    console.log('✅ Message modifié localement');
  };

  const deleteMessage = async (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    console.log('✅ Message supprimé localement');
  };

  const addReaction = async (messageId: string, emoji: string) => {
    if (!supabaseUser) {
      console.warn('❌ Utilisateur non connecté pour les réactions');
      return;
    }

    try {
      // Vérifier si la réaction existe déjà
      const message = messages.find(m => m.id === messageId);
      const hasReaction = message?.reactions?.[emoji]?.includes(currentUserId);

      if (hasReaction) {
        // Supprimer la réaction
        const { error } = await supabaseRemoveReaction(messageId, emoji);
        if (error) {
          console.error('❌ Erreur suppression réaction:', error);
          return;
        }
        console.log('✅ Réaction supprimée via Supabase');
      } else {
        // Ajouter la réaction
        const { error } = await supabaseAddReaction(messageId, emoji);
        if (error) {
          console.error('❌ Erreur ajout réaction:', error);
          return;
        }
        console.log('✅ Réaction ajoutée via Supabase');
      }

      // Mettre à jour localement en attendant la synchronisation
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const newReactions = { ...msg.reactions };
          if (newReactions[emoji]) {
            if (newReactions[emoji].includes(currentUserId)) {
              newReactions[emoji] = newReactions[emoji].filter(u => u !== currentUserId);
              if (newReactions[emoji].length === 0) {
                delete newReactions[emoji];
              }
            } else {
              newReactions[emoji].push(currentUserId);
            }
          } else {
            newReactions[emoji] = [currentUserId];
          }
          return { ...msg, reactions: newReactions };
        }
        return msg;
      }));

    } catch (error) {
      console.error('❌ Erreur gestion réaction:', error);
    }
  };

  // Messages filtrés pour la recherche
  const filteredMessages = searchQuery
    ? messages.filter(msg =>
        msg.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Grouper les messages pour l'affichage
  const groupedMessages = React.useMemo(() => {
    const messagesToShow = filteredMessages;

    return messagesToShow.map((msg, index) => {
      const prevMsg = messagesToShow[index - 1];
      const shouldShowProfile = !prevMsg ||
        prevMsg.sender !== msg.sender ||
        (Date.now() - new Date(`2024-01-01 ${prevMsg.time}`).getTime()) > 300000;

      return { ...msg, showProfile: shouldShowProfile };
    });
  }, [filteredMessages]);

  // Scroll automatique
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, searchQuery]);

  // Initialisation locale supprimée - remplacée par l'initialisation Supabase

  // Gestion des clics extérieurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
        setShowEmojiPicker(null);
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Envoi de message
  const handleSendMessage = useCallback(async () => {
    if (!message.trim()) return;

    const content = sanitizeMessage(message);
    if (!validateMessage(content)) return;

    try {
      if (editingMessage) {
        await updateMessage(editingMessage, content);
        setEditingMessage(null);
      } else {
        await sendChatMessage(content, replyingTo?.id);
        setReplyingTo(null);
      }
      setMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  }, [message, editingMessage, replyingTo, updateMessage, sendChatMessage]);

  // Gestion des touches
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Gestion des interactions avec les messages
  const handleMessageClick = useCallback((e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId
    });
  }, []);

  // Gestion du drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDraggedOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && currentUserId) {
      try {
        await uploadMultipleFiles(files, currentUserId);
      } catch (error) {
        console.error('Erreur upload:', error);
      }
    }
  }, [currentUserId]);

  // Actions du menu contextuel
  const handleMenuAction = useCallback(async (action: string, messageId: string) => {
    const targetMessage = messages.find(msg => msg.id === messageId);
    if (!targetMessage) return;

    try {
      switch (action) {
        case 'reply':
          setReplyingTo(targetMessage);
          break;
        case 'edit':
          if (isCurrentUser(targetMessage.sender)) {
            setEditingMessage(messageId);
            setMessage(targetMessage.text);
          }
          break;
        case 'copy':
          await navigator.clipboard.writeText(targetMessage.text);
          break;
        case 'delete':
          if (isCurrentUser(targetMessage.sender)) {
            await deleteMessage(messageId);
          }
          break;
        case 'star':
          // TODO: Implémenter les favoris
          break;
        case 'forward':
          // TODO: Implémenter le transfert
          break;
        case 'info':
          const user = userProfiles[targetMessage.sender];
          alert(`Envoyé par: ${user?.name}\nÀ: ${targetMessage.time}\nStatut: ${targetMessage.status}`);
          break;
      }
    } catch (error) {
      console.error('Erreur action menu:', error);
    }

    setContextMenu(null);
  }, [messages, userProfiles]);

  // Gestion du changement de saisie
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    handleTyping();
  }, [handleTyping]);

  // Marquer comme lu quand le salon devient actif
  useEffect(() => {
    if (parentIsActive) {
      markAsRead();
    }
  }, [parentIsActive, markAsRead]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
        <div className="text-center">
          <p className="text-red-500 mb-4">Erreur de connexion</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Overlay pour drag & drop */}
      <AnimatePresence>
        {draggedOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-blue-500 bg-opacity-20 z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <div className="text-center">
                <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-700">Déposez vos fichiers ici</p>
                <p className="text-sm text-gray-500">Images, documents et autres fichiers supportés</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header du chat */}
      <motion.div
        className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-green-600 text-white'} p-4 shadow-md`}
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-green-500 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face"
                alt="Chat de groupe"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const nextElement = target.nextElementSibling as HTMLElement;
                  if (nextElement) nextElement.style.display = 'flex';
                }}
              />
              <span className="text-white font-semibold hidden">CS</span>

              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.div>
              )}
            </div>

            <div>
              <h2 className="font-semibold">Chat Support Client</h2>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-green-100'}`}>
                {unreadCount > 0
                  ? `${unreadCount} nouveau${unreadCount > 1 ? 'x' : ''} message${unreadCount > 1 ? 's' : ''}`
                  : `${Object.keys(userProfiles).length} utilisateur${Object.keys(userProfiles).length > 1 ? 's' : ''} en ligne`}
              </p>
            </div>

            {/* Indicateur des utilisateurs en train d'écrire */}
            <AnimatePresence>
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-green-100'} italic`}
                >
                  {typingUsers.length === 1
                    ? `${typingUsers[0].name} écrit...`
                    : `${typingUsers.length} personnes écrivent...`}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-green-700'} transition-colors`}
              title="Rechercher"
            >
              <Search size={18} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-green-700'} transition-colors`}
              title="Actualiser"
            >
              🔄
            </motion.button>
          </div>
        </div>

        {/* Barre de recherche */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 overflow-hidden"
            >
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher dans les messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/40"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X size={16} />
                </motion.button>
              </div>

              {searchQuery && filteredMessages.length > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-white/80 mt-2"
                >
                  {filteredMessages.length} résultat{filteredMessages.length > 1 ? 's' : ''} trouvé{filteredMessages.length > 1 ? 's' : ''}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Zone des messages */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}
      >
        <motion.div
          className="space-y-4 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="popLayout">
            {groupedMessages.map((msg) => {
              const isCurrentUserMsg = isCurrentUser(msg.sender);
              const userProfile = userProfiles[msg.sender];

              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Indicateur message épinglé */}
                  {msg.pinned && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center mb-2"
                    >
                      <span className={`${theme === 'dark' ? 'bg-yellow-600 text-yellow-100' : 'bg-yellow-200 text-yellow-800'} px-3 py-1 rounded-full text-xs flex items-center justify-center w-fit mx-auto`}>
                        <Pin size={12} className="mr-1" />
                        Message épinglé
                      </span>
                    </motion.div>
                  )}

                  <div className={`flex ${isCurrentUserMsg ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start max-w-xl lg:max-w-2xl ${
                      isCurrentUserMsg ? 'flex-row-reverse' : 'space-x-3'
                    }`}>
                      {/* Avatar */}
                      {msg.showProfile && !isCurrentUserMsg && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                        >
                          <img
                            src={userProfile?.avatar}
                            alt={userProfile?.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const nextElement = target.nextElementSibling as HTMLElement;
                              if (nextElement) nextElement.style.display = 'flex';
                            }}
                          />
                          <div className={`w-full h-full ${getAvatarColor(msg.sender)} text-white text-xs font-semibold flex items-center justify-center hidden`}>
                            {userProfile?.initials}
                          </div>
                        </motion.div>
                      )}

                      {/* Espacement pour les messages groupés */}
                      {!msg.showProfile && !isCurrentUserMsg && (
                        <div className="w-8 h-8 flex-shrink-0"></div>
                      )}

                      {/* Bulle de message */}
                      <div className="relative group">
                        {/* Nom de l'utilisateur */}
                        {msg.showProfile && !isCurrentUserMsg && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1 ml-2 font-medium`}
                          >
                            {userProfile?.name}
                            {userProfile?.status === 'online' && (
                              <span className="ml-2 w-2 h-2 bg-green-400 rounded-full inline-block"></span>
                            )}
                          </motion.p>
                        )}

                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className={`px-4 py-3 rounded-2xl shadow-sm relative cursor-pointer transition-all hover:shadow-md select-none ${
                            isCurrentUserMsg
                              ? theme === 'dark'
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-green-500 text-white rounded-br-md'
                              : theme === 'dark'
                                ? 'bg-gray-700 text-gray-100 border border-gray-600 rounded-bl-md'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                          } ${msg.pinned ? 'ring-2 ring-yellow-300' : ''} ${
                            longPressActive === msg.id ? 'scale-95 shadow-xl' : ''
                          }`}
                          onClick={(e) => handleMessageClick(e, msg.id)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            handleMessageClick(e, msg.id);
                          }}
                        >
                          {/* Réponse à un message */}
                          {msg.replyTo && (
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`mb-2 p-2 rounded border-l-4 ${
                                isCurrentUserMsg
                                  ? theme === 'dark'
                                    ? 'bg-blue-700 border-blue-300 text-blue-100'
                                    : 'bg-green-600 border-green-300 text-green-100'
                                  : theme === 'dark'
                                    ? 'bg-gray-600 border-gray-400 text-gray-300'
                                    : 'bg-gray-100 border-gray-400 text-gray-600'
                              }`}
                            >
                              <p className="text-xs opacity-75">
                                Réponse à {userProfiles[msg.replyTo.sender]?.name}
                              </p>
                              <p className="text-xs truncate">
                                {msg.replyTo.text}
                              </p>
                            </motion.div>
                          )}

                          {/* Contenu du message */}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>

                          {/* Pièces jointes */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <motion.div
                              className="mt-3 space-y-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              {msg.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-black/10 rounded-lg">
                                  {attachment.type === 'image' ? (
                                    <ImageIcon size={16} />
                                  ) : (
                                    <File size={16} />
                                  )}
                                  <span className="text-xs truncate flex-1">{attachment.filename}</span>
                                  <button className="hover:bg-black/10 p-1 rounded">
                                    <Download size={14} />
                                  </button>
                                </div>
                              ))}
                            </motion.div>
                          )}

                          {/* Informations du message */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-1">
                              {msg.edited && (
                                <span className={`text-xs opacity-75 ${
                                  isCurrentUserMsg
                                    ? theme === 'dark' ? 'text-blue-100' : 'text-green-100'
                                    : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  modifié
                                </span>
                              )}
                              <p className={`text-xs ${
                                isCurrentUserMsg
                                  ? theme === 'dark' ? 'text-blue-100' : 'text-green-100'
                                  : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {msg.time}
                              </p>
                            </div>

                            {isCurrentUserMsg && (
                              <span className={`text-xs ${
                                msg.status === 'read' ? 'text-blue-400' : 'text-gray-400'
                              }`}>
                                {msg.status === 'sent' && '✓'}
                                {msg.status === 'delivered' && '✓✓'}
                                {msg.status === 'read' && '✓✓'}
                              </span>
                            )}
                          </div>
                        </motion.div>

                        {/* Réactions */}
                        <AnimatePresence>
                          {Object.keys(msg.reactions).length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className={`flex flex-wrap gap-1 mt-1 ${
                                isCurrentUserMsg ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {Object.entries(msg.reactions).map(([emoji, users]) => (
                                <motion.button
                                  key={emoji}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' : 'bg-gray-100 hover:bg-gray-200 border-gray-200'} rounded-full px-2 py-1 text-xs flex items-center space-x-1 cursor-pointer shadow-sm border`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addReaction(msg.id, emoji);
                                  }}
                                >
                                  <span>{emoji}</span>
                                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                                    {users.length}
                                  </span>
                                </motion.button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Actions rapides au survol */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 0 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          className={`absolute top-0 ${isCurrentUserMsg ? '-left-16' : '-right-16'} group-hover:opacity-100 transition-opacity`}
                        >
                          <div className="flex space-x-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="bg-gray-700 text-white p-1 rounded-full hover:bg-gray-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowEmojiPicker(msg.id);
                              }}
                            >
                              <Heart size={12} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="bg-gray-700 text-white p-1 rounded-full hover:bg-gray-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo(msg);
                              }}
                            >
                              <Reply size={12} />
                            </motion.button>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Indicateur de chargement */}
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg p-4 shadow-lg flex items-center space-x-3`}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                  Envoi en cours...
                </span>
              </div>
            </motion.div>
          )}

          {/* Élément invisible pour le scroll */}
          <div ref={messagesEndRef} />
        </motion.div>
      </div>

      {/* Indicateur de réponse */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`${theme === 'dark' ? 'bg-gray-700 border-blue-500' : 'bg-gray-200 border-green-500'} border-l-4 p-3 mx-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Réponse à {userProfiles[replyingTo.sender]?.name}
                </p>
                <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {replyingTo.text}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setReplyingTo(null)}
                className={`${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}
              >
                <X size={20} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone de saisie */}
      <motion.div
        className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-6 shadow-lg`}
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-end space-x-4 max-w-4xl mx-auto">
          {/* Boutons d'actions */}
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEmojiPicker(showEmojiPicker ? null : 'input')}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-400 hover:text-green-500 hover:bg-gray-100'} transition-colors`}
            >
              <Smile size={20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className={`p-2 rounded-lg ${theme === 'dark' ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-400 hover:text-green-500 hover:bg-gray-100'} transition-colors`}
            >
              <Paperclip size={20} />
            </motion.button>
          </div>

          {/* Zone de saisie */}
          <div className="flex-1 relative">
            <textarea
              placeholder={
                editingMessage ? "Modifier le message..." :
                replyingTo ? `Répondre à ${userProfiles[replyingTo.sender]?.name}...` :
                "Tapez votre message..."
              }
              className={`w-full px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 transition-all resize-none ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                  : 'bg-gray-50 border border-gray-300 text-black placeholder-gray-500 focus:ring-green-500 focus:border-transparent'
              }`}
              rows={1}
              value={message}
              onChange={handleMessageChange}
              onKeyPress={handleKeyPress}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />

            {/* Menu des pièces jointes */}
            <AnimatePresence>
              {showAttachmentMenu && (
                <motion.div
                  ref={contextMenuRef}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className={`absolute bottom-full left-0 mb-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-lg shadow-lg border py-2 z-50`}
                >
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowAttachmentMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700'} flex items-center space-x-2`}
                  >
                    <ImageIcon size={16} />
                    <span>Image</span>
                  </button>
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowAttachmentMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700'} flex items-center space-x-2`}
                  >
                    <File size={16} />
                    <span>Document</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bouton d'envoi */}
          <div className="flex space-x-2">
            {message.trim() ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={isUploading}
                className={`p-3 rounded-full transition-colors disabled:opacity-50 ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <Send size={20} />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-full ${theme === 'dark' ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700' : 'text-gray-400 hover:text-green-500 hover:bg-gray-100'} transition-colors`}
              >
                <Mic size={20} />
              </motion.button>
            )}
          </div>
        </div>

        {/* Mode édition */}
        <AnimatePresence>
          {editingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-3 flex items-center justify-between text-sm"
            >
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                Mode modification
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditingMessage(null);
                  setMessage('');
                }}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                Annuler
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicateurs d'upload */}
        <AnimatePresence>
          {Object.keys(uploads).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-3 space-y-2"
            >
              {Object.values(uploads).map((upload) => (
                <motion.div
                  key={upload.fileName}
                  className={`flex items-center space-x-3 p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>
                        {upload.fileName}
                      </span>
                      <span className={`text-xs ${
                        upload.status === 'completed' ? 'text-green-500' :
                        upload.status === 'error' ? 'text-red-500' :
                        'text-blue-500'
                      }`}>
                        {upload.status === 'completed' ? '✓' :
                         upload.status === 'error' ? '✗' :
                         `${upload.progress}%`}
                      </span>
                    </div>
                    {upload.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full transition-all duration-200"
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                    )}
                    {upload.error && (
                      <p className="text-xs text-red-500 mt-1">{upload.error}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={async (e) => {
          if (e.target.files && currentUserId) {
            try {
              await uploadMultipleFiles(Array.from(e.target.files), currentUserId);
            } catch (error) {
              console.error('Erreur upload:', error);
            }
          }
        }}
        className="hidden"
      />

      {/* Menu contextuel */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`fixed ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} rounded-lg shadow-xl border py-2 z-50`}
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleMenuAction('reply', contextMenu.messageId)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700'} flex items-center space-x-2`}
            >
              <Reply size={16} />
              <span>Répondre</span>
            </button>

            {messages.find(m => m.id === contextMenu.messageId && isCurrentUser(m.sender)) && (
              <button
                onClick={() => handleMenuAction('edit', contextMenu.messageId)}
                className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700'} flex items-center space-x-2`}
              >
                <Edit3 size={16} />
                <span>Modifier</span>
              </button>
            )}

            <button
              onClick={() => handleMenuAction('copy', contextMenu.messageId)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700'} flex items-center space-x-2`}
            >
              <Copy size={16} />
              <span>Copier</span>
            </button>

            <button
              onClick={() => handleMenuAction('info', contextMenu.messageId)}
              className={`w-full px-4 py-2 text-left hover:bg-gray-100 ${theme === 'dark' ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700'} flex items-center space-x-2`}
            >
              <Info size={16} />
              <span>Informations</span>
            </button>

            <hr className={`my-2 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`} />

            <button
              onClick={() => handleMenuAction('delete', contextMenu.messageId)}
              className={`w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2 ${theme === 'dark' ? 'hover:bg-red-900/20' : ''}`}
            >
              <Trash2 size={16} />
              <span>Supprimer</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sélecteur d'émojis */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} rounded-lg shadow-xl border p-3 z-50`}
            style={{
              left: contextMenu?.x || 20,
              top: showEmojiPicker === 'input' ? 'auto' : (contextMenu?.y || 0) - 80,
              bottom: showEmojiPicker === 'input' ? 120 : 'auto'
            }}
          >
            <div className="grid grid-cols-5 gap-2 max-w-xs">
              {emojis.map(emoji => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (showEmojiPicker === 'input') {
                      setMessage(prev => prev + emoji);
                    } else {
                      addReaction(showEmojiPicker, emoji);
                    }
                    setShowEmojiPicker(null);
                  }}
                  className={`p-2 rounded text-xl hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : ''} transition-colors`}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ChatZone;