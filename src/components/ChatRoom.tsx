import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Users, 
  LogOut, 
  MoreVertical, 
  Settings, 
  Search,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  Send,
  MessageCircle,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useChat } from '../hooks/useChat';
import Message from './Message';
import MessageInput from './MessageInput';
import { ChatMessage } from '../lib/supabase';

interface ChatRoomProps {
  channelId: string;
  channelName?: string;
  onSignOut?: () => void;
  onChannelSettings?: () => void;
  onUserProfile?: () => void;
  className?: string;
}

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy';
  lastSeen?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({
  channelId,
  channelName = 'Chat Général',
  onSignOut,
  onChannelSettings,
  onUserProfile,
  className = '',
}) => {
  const { user, signOut } = useAuth();
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Configuration du hook useChat
  const {
    messages,
    loading,
    error,
    typingUsers,
    uploadProgress,
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
  } = useChat({
    channelId,
    limit: 50,
    autoScroll: true,
    enableTyping: true,
    enableReactions: true,
    enableMentions: true,
  });

  // Scroll automatique vers le bas
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Effet pour scroll automatique
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Gestion de la frappe
  useEffect(() => {
    if (isTyping) {
      startTyping();
    } else {
      stopTyping();
    }
  }, [isTyping, startTyping, stopTyping]);

  // Gestion du timeout de frappe
  useEffect(() => {
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping]);

  // Simuler des utilisateurs en ligne (à remplacer par de vraies données)
  useEffect(() => {
    const mockUsers: OnlineUser[] = [
      {
        id: '1',
        name: 'Alice Martin',
        status: 'online',
      },
      {
        id: '2',
        name: 'Bob Dupont',
        status: 'away',
        lastSeen: 'Il y a 5 min',
      },
      {
        id: '3',
        name: 'Claire Dubois',
        status: 'online',
      },
    ];
    setOnlineUsers(mockUsers);
  }, []);

  // Gestion de l'envoi de message
  const handleSendMessage = useCallback(async (content: string, attachments?: File[]) => {
    try {
      await sendMessage(content, attachments);
      setReplyToMessage(null);
      setIsTyping(false);
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  }, [sendMessage]);

  // Gestion de la réponse à un message
  const handleReply = useCallback((message: ChatMessage) => {
    setReplyToMessage(message);
  }, []);

  // Gestion de l'annulation de réponse
  const handleCancelReply = useCallback(() => {
    setReplyToMessage(null);
  }, []);

  // Gestion de l'édition de message
  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      await editMessage(messageId, newContent);
    } catch (error) {
      console.error('Erreur édition message:', error);
    }
  }, [editMessage]);

  // Gestion de la suppression de message
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error('Erreur suppression message:', error);
    }
  }, [deleteMessage]);

  // Gestion des réactions
  const handleAddReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error('Erreur ajout réaction:', error);
    }
  }, [addReaction]);

  const handleRemoveReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await removeReaction(messageId, emoji);
    } catch (error) {
      console.error('Erreur suppression réaction:', error);
    }
  }, [removeReaction]);

  // Gestion de la déconnexion
  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      onSignOut?.();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  }, [signOut, onSignOut]);

  // Rendu du header
  const renderHeader = () => (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">
            {channelName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">{channelName}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{onlineUsers.filter(u => u.status === 'online').length} en ligne</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Bouton utilisateurs en ligne */}
        <button
          onClick={() => setShowOnlineUsers(!showOnlineUsers)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Utilisateurs en ligne"
        >
          <Users className="h-5 w-5" />
        </button>

        {/* Bouton appels */}
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Appel vocal">
          <Phone className="h-5 w-5" />
        </button>

        {/* Bouton vidéo */}
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Appel vidéo">
          <Video className="h-5 w-5" />
        </button>

        {/* Menu utilisateur */}
        <div className="relative">
          <button
            onClick={onUserProfile}
            className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-400 transition-colors"
            title="Profil utilisateur"
          >
            <span className="text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </button>
        </div>

        {/* Menu options */}
        <div className="relative">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Options">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  // Rendu des utilisateurs en ligne
  const renderOnlineUsers = () => {
    if (!showOnlineUsers) return null;

    return (
      <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10 w-64">
        <h3 className="font-medium text-gray-900 mb-3">Utilisateurs en ligne</h3>
        <div className="space-y-2">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  user.status === 'online' ? 'bg-green-500' :
                  user.status === 'away' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.status === 'online' ? 'En ligne' :
                   user.status === 'away' ? 'Absent' : 'Occupé'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Rendu des messages
  const renderMessages = () => {
    if (loading && messages.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Chargement des messages...</p>
          </div>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun message pour le moment
            </h3>
            <p className="text-gray-500 mb-4">
              Soyez le premier à écrire dans ce salon de chat !
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Paperclip className="h-4 w-4" />
                <span>Joindre des fichiers</span>
              </div>
              <div className="flex items-center gap-1">
                <Smile className="h-4 w-4" />
                <span>Ajouter des réactions</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((message, index) => {
          const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;
          const showTimestamp = index === messages.length - 1 || 
            new Date(messages[index + 1].created_at).getTime() - new Date(message.created_at).getTime() > 300000; // 5 minutes

          return (
            <Message
              key={message.id}
              message={message}
              currentUserId={user?.id}
              currentUserRole={user?.role || 'user'}
              onReply={handleReply}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onReact={handleAddReaction}
              onRemoveReaction={handleRemoveReaction}
              showAvatar={showAvatar}
              showTimestamp={showTimestamp}
            />
          );
        })}
        
        {/* Indicateur de frappe */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-500 p-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span>
              {typingUsers.length === 1 ? 'Quelqu\'un tape...' : `${typingUsers.length} personnes tapent...`}
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    );
  };

  // Rendu du footer avec statut de connexion
  const renderFooter = () => (
    <div className="flex items-center justify-between p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span>{isConnected ? 'Connecté' : 'Déconnecté'}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>{messages.length} messages</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-3 w-3" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
      {/* Header */}
      {renderHeader()}

      {/* Utilisateurs en ligne */}
      {renderOnlineUsers()}

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 flex flex-col min-h-0">
        {renderMessages()}
      </div>

      {/* Input de message */}
      <MessageInput
        onSendMessage={handleSendMessage}
        replyToMessage={replyToMessage ? {
          id: replyToMessage.id,
          content: replyToMessage.content,
          senderName: replyToMessage.sender?.name || 'Utilisateur',
        } : undefined}
        onCancelReply={handleCancelReply}
        placeholder="Tapez votre message..."
        disabled={!isConnected}
        isLoading={loading}
      />

      {/* Footer */}
      {renderFooter()}
    </div>
  );
};

export default ChatRoom;




