import React, { useState, useRef, useEffect } from 'react';
import { Send, MoreVertical, Smile, Paperclip, Mic, Reply, Copy, Edit3, Trash2, Forward, Star, Info, Pin, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ChatZone = ({ onUnreadCountChange, isActive: parentIsActive }) => {
  const [message, setMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0); // Messages non lus au départ
  const [isActive, setIsActive] = useState(true); // Salon actif par défaut
  
  const [lastReadMessageIndex, setLastReadMessageIndex] = useState(1); // Index du dernier message lu
  const [touchTimeout, setTouchTimeout] = useState(null); // Pour gérer le press long
  const [longPressActive, setLongPressActive] = useState(null); // Pour l'effet visuel
  const contextMenuRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Cache des profils utilisateurs locaux
  const [userProfiles, setUserProfiles] = useState({
    'admin': {
      id: 'admin',
      name: 'Admin',
      email: 'admin@local.com',
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=4ade80',
      initials: 'AD'
    },
    'user': {
      id: 'user',
      name: 'Utilisateur',
      email: 'user@local.com',
      avatar: 'https://ui-avatars.com/api/?name=Utilisateur&background=3b82f6',
      initials: 'US'
    }
  });

  // Fonction pour obtenir un profil utilisateur local
  const getUserProfile = (userId, userName) => {
    if (userProfiles[userId]) {
      return userProfiles[userId];
    }

    // Créer un profil local
    const profile = {
      id: userId,
      name: userName || 'Utilisateur',
      email: `${userId}@local.com`,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'U')}&background=random`,
      initials: userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'
    };

    // Mettre à jour le cache
    setUserProfiles(prev => ({
      ...prev,
      [userId]: profile
    }));

    return profile;
  };

  const [messages, setMessages] = useState([]);

  const emojis = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '👏', '🙏', '🔥'];

  // Utilisateur connecté local
  const [currentUserId, setCurrentUserId] = useState('admin');
  const [currentUserName, setCurrentUserName] = useState('Admin');
  const currentUser = userProfiles['admin'];

  // Channel cible
  const CHANNEL_ID = 'chatzone';

  // Mapper un auteur vers son vrai ID
  const mapAuthorToProfileId = (authorId) => {
    return authorId || 'unknown';
  };

  // Déterminer si c'est l'utilisateur actuel (version locale)
  const isCurrentUser = (senderId) => {

    // Simple comparaison locale
    const isOwn = senderId === currentUserId;
    return isOwn;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setContextMenu(null);
        setShowEmojiPicker(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Charger l'utilisateur courant (mode local)
  useEffect(() => {
    // Vérifier si on est en mode admin (localStorage)
    const adminAuth = localStorage.getItem('adminAuthenticated');
    const isAdmin = adminAuth === 'true';

    if (isAdmin) {
      setCurrentUserId('admin');
      setCurrentUserName('Admin');
    } else {
      setCurrentUserId('user');
      setCurrentUserName('Utilisateur');
    }
  }, []);

  // Messages locaux d'exemple
  useEffect(() => {
    if (!currentUserId) return;

    // Charger les messages depuis Supabase uniquement
    setMessages([]);
    setLastReadMessageIndex(0);
  }, [currentUserId]);

  // Scroll automatique vers le bas
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll automatique quand les messages changent
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Marquer les messages comme lus quand le salon est actif
  useEffect(() => {
    if (parentIsActive) {
      setLastReadMessageIndex(messages.length - 1);
    }
  }, [messages.length, parentIsActive]);

  // Réinitialiser le compteur quand le salon devient actif
  useEffect(() => {
    if (parentIsActive) {
      setUnreadCount(0);
    }
  }, [parentIsActive]);

  // Notifier le parent du changement de messages non lus
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange('chatzone', unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  // Détecter l'activité utilisateur pour marquer comme lu
  useEffect(() => {
    const handleUserActivity = () => {
      if (unreadCount > 0) {
        setIsActive(true);
        setLastReadMessageIndex(messages.length - 1); // Marquer tous les messages actuels comme lus
        setUnreadCount(0);
      }
    };

    // Marquer comme lu lors du scroll ou du focus
    const chatContainer = document.querySelector('.flex-1.overflow-y-auto');
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleUserActivity);
      window.addEventListener('focus', handleUserActivity);
      window.addEventListener('click', handleUserActivity);
      
      return () => {
        chatContainer.removeEventListener('scroll', handleUserActivity);
        window.removeEventListener('focus', handleUserActivity);
        window.removeEventListener('click', handleUserActivity);
      };
    }
  }, [unreadCount, messages.length]);

  const sendMessage = async () => {
    if (message.trim()) {
      if (editingMessage) {
        // Modifier le message
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessage 
            ? { ...msg, text: message, edited: true }
            : msg
        ));
        setEditingMessage(null);
      } else {
        // Nouveau message
        const newMessage = {
          id: Date.now(),
          text: message,
          sender: currentUserId || '00000000-0000-0000-0000-000000000001', // Utiliser l'ID admin fixe
          senderName: currentUserName || 'Admin',
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          status: "sent",
          reactions: {},
          pinned: false,
          edited: false,
          replyTo: replyingTo
        };

        // Envoi Supabase
        try {

          // Récupérer l'ID du canal ChatZone
          const { data: channelData } = await supabase
            .from('chat_channels')
            .select('id')
            .eq('name', 'chatzone')
            .single();

          if (!channelData) {
            return;
          }

          // Envoyer via Supabase
          const { data, error } = await supabase
            .from('chat_messages')
            .insert({
              channel_id: channelData.id,
              user_id: currentUserId,
              user_name: currentUserName || 'Admin',
              message: message,
              message_type: 'text',
              status: 'sent'
            });

          if (error) {
          } else {
            // Ajouter le message localement pour affichage immédiat
            setMessages(prev => [...prev, newMessage]);
          }
        } catch (error) {
        }
        
        setReplyingTo(null);
      }
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleMessageClick = (e, messageId) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId: messageId
    });
  };

  // Gestion du press long pour mobile
  const handleTouchStart = (e, messageId) => {
    setLongPressActive(messageId); // Effet visuel
    
    const timeout = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({
        x: touch.clientX,
        y: touch.clientY,
        messageId: messageId
      });
      setLongPressActive(null); // Arrêter l'effet visuel
      // Vibration tactile pour indiquer le press long
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms pour déclencher le press long
    
    setTouchTimeout(timeout);
  };

  const handleTouchEnd = () => {
    if (touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
    setLongPressActive(null); // Arrêter l'effet visuel
  };

  const handleTouchMove = () => {
    if (touchTimeout) {
      clearTimeout(touchTimeout);
      setTouchTimeout(null);
    }
    setLongPressActive(null); // Arrêter l'effet visuel
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'text-gray-400';
      case 'delivered': return 'text-gray-400';
      case 'read': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const handleMenuAction = (action, messageId) => {
    const targetMessage = messages.find(msg => msg.id === messageId);
    
    switch (action) {
      case 'reply':
        setReplyingTo(targetMessage);
        break;
      case 'edit':
        if (targetMessage?.sender === currentUserId) {
          setEditingMessage(messageId);
          setMessage(targetMessage.text);
        }
        break;
      case 'delete':
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        break;
      case 'copy':
        navigator.clipboard.writeText(targetMessage?.text);
        break;
      case 'forward':
        alert('Fonctionnalité de transfert - À implémenter');
        break;
      case 'pin':
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, pinned: !msg.pinned } : msg
        ));
        break;
      case 'info':
        const user = userProfiles[targetMessage?.sender];
        alert(`Info du message:\nEnvoyé par: ${user?.name}\nÀ: ${targetMessage?.time}\nStatut: ${targetMessage?.status}`);
        break;
      case 'star':
        alert('Message ajouté aux favoris');
        break;
    }
    setContextMenu(null);
  };

  const addReaction = (messageId, emoji) => {
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
    setShowEmojiPicker(null);
  };

  const getRepliedMessage = (replyToId) => {
    return messages.find(msg => msg.id === replyToId);
  };

  // Grouper les messages par heure pour éviter la répétition des noms
  const groupedMessages = messages.reduce((acc, msg, index) => {
    const prevMsg = messages[index - 1];
    const shouldShowProfile = !prevMsg || 
      prevMsg.sender !== msg.sender || 
      (new Date(`2024-01-01 ${msg.time}`) - new Date(`2024-01-01 ${prevMsg.time}`) > 300000); // 5 minutes
    
    acc.push({ ...msg, showProfile: shouldShowProfile });
    return acc;
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Chat Header */}
      <div className="bg-green-600 text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-green-500 flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face" 
              alt="Chat de groupe"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <span className="text-white font-semibold hidden">CG</span>
            
            {/* Pastille de messages non lus */}
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
          <div>
            <h2 className="font-semibold">Chat Support Client</h2>
            <p className="text-sm text-green-100">
              {unreadCount > 0 ? `${unreadCount} nouveau${unreadCount > 1 ? 'x' : ''} message${unreadCount > 1 ? 's' : ''}` : '3 utilisateurs en ligne'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => window.location.reload()}
            className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-sm transition-colors"
            title="Actualiser les messages"
          >
            🔄
          </button>
          <MoreVertical size={20} className="cursor-pointer hover:bg-green-700 rounded p-1 transition-colors" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-green-50 to-gray-50">
        <div className="space-y-4 px-4">
          {groupedMessages.map((msg) => {
            const isCurrentUserMsg = isCurrentUser(msg.sender);
            const userProfile = userProfiles[msg.sender];
            
            return (
              <div key={msg.id}>
                {/* Message épinglé indicator */}
                {msg.pinned && (
                  <div className="text-center mb-2">
                    <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-xs flex items-center justify-center w-fit mx-auto">
                      <Pin size={12} className="mr-1" />
                      Message épinglé
                    </span>
                  </div>
                )}
                
                <div className={`flex ${isCurrentUserMsg ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start max-w-2xl ${
                    isCurrentUserMsg ? 'flex-row-reverse' : 'space-x-3'
                  }`}>
                    {/* Avatar seulement pour les autres utilisateurs et espacement conditionnel */}
                    {msg.showProfile && !isCurrentUserMsg && (
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-400 flex-shrink-0">
                        <img 
                          src={userProfile?.avatar} 
                          alt={userProfile?.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full bg-blue-500 text-white text-xs font-semibold flex items-center justify-center hidden">
                          {userProfile?.initials}
                        </div>
                      </div>
                    )}
                    
                    {/* Espacement pour les messages sans avatar des autres utilisateurs */}
                    {!msg.showProfile && !isCurrentUserMsg && (
                      <div className="w-8 h-8 flex-shrink-0"></div>
                    )}

                    {/* Message Bubble */}
                    <div className="relative group">
                      {/* Nom de l'utilisateur */}
                      {msg.showProfile && !isCurrentUserMsg && (
                        <p className="text-xs text-gray-600 mb-1 ml-2 font-medium">
                          {userProfile?.name}
                        </p>
                      )}

                      <div
                        className={`px-4 py-3 rounded-2xl shadow-sm relative cursor-pointer transition-all hover:shadow-md select-none ${
                          isCurrentUserMsg
                            ? 'bg-green-500 text-white rounded-br-md'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                        } ${msg.pinned ? 'ring-2 ring-yellow-300' : ''} ${
                          longPressActive === msg.id ? 'scale-95 shadow-xl' : ''
                        }`}
                        onClick={(e) => handleMessageClick(e, msg.id)}
                        onTouchStart={(e) => handleTouchStart(e, msg.id)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleMessageClick(e, msg.id);
                        }}
                        style={{ 
                          WebkitUserSelect: 'none',
                          WebkitTouchCallout: 'none',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        {/* Reply indicator */}
                        {msg.replyTo && (
                          <div className={`mb-2 p-2 rounded border-l-4 ${
                            isCurrentUserMsg 
                              ? 'bg-green-600 border-green-300 text-green-100'
                              : 'bg-gray-100 border-gray-400 text-gray-600'
                          }`}>
                            <p className="text-xs opacity-75">
                              Réponse à {userProfiles[getRepliedMessage(msg.replyTo?.id)?.sender]?.name}
                            </p>
                            <p className="text-xs truncate">
                              {getRepliedMessage(msg.replyTo?.id)?.text}
                            </p>
                          </div>
                        )}

                        {/* Message text */}
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        
                        {/* Message info */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-1">
                            {msg.edited && (
                              <span className={`text-xs opacity-75 ${
                                isCurrentUserMsg ? 'text-green-100' : 'text-gray-500'
                              }`}>
                                modifié
                              </span>
                            )}
                            <p className={`text-xs ${
                              isCurrentUserMsg ? 'text-green-100' : 'text-gray-500'
                            }`}>
                              {msg.time}
                            </p>
                          </div>
                          
                          {isCurrentUserMsg && (
                            <span className={`text-xs ${getStatusColor(msg.status)}`}>
                              {getStatusIcon(msg.status)}
                            </span>
                          )}
                        </div>

                        </div>

                        {/* Reactions sous la bulle */}
                        {Object.keys(msg.reactions).length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${
                            isCurrentUserMsg ? 'justify-end' : 'justify-start'
                          }`}>
                            {Object.entries(msg.reactions).map(([emoji, users]) => (
                              <span
                                key={emoji}
                                className="bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 text-xs flex items-center space-x-1 cursor-pointer shadow-sm border border-gray-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addReaction(msg.id, emoji);
                                }}
                              >
                                <span>{emoji}</span>
                                <span className="text-gray-600">{users.length}</span>
                              </span>
                            ))}
                          </div>
                        )}

                      {/* Quick actions on hover */}
                      <div className={`absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isCurrentUserMsg ? '-left-16' : '-right-16'
                      }`}>
                        <div className="flex space-x-1">
                          <button
                            className="bg-gray-700 text-white p-1 rounded-full hover:bg-gray-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEmojiPicker(msg.id);
                            }}
                          >
                            <Heart size={12} />
                          </button>
                          <button
                            className="bg-gray-700 text-white p-1 rounded-full hover:bg-gray-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyingTo(msg);
                            }}
                          >
                            <Reply size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* Element invisible pour le scroll automatique */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="bg-gray-200 border-l-4 border-green-500 p-3 mx-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Réponse à {userProfiles[replyingTo.sender]?.name}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {replyingTo.text}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-6 shadow-lg">
        <div className="flex items-center space-x-4">
          <Smile size={24} className="text-gray-400 cursor-pointer hover:text-green-500 transition-colors" />
          <Paperclip size={24} className="text-gray-400 cursor-pointer hover:text-green-500 transition-colors" />
          
          <div className="flex-1 relative">
            <textarea
              placeholder={editingMessage ? "Modifier le message..." : replyingTo ? `Répondre à ${userProfiles[replyingTo.sender]?.name}...` : "Tapez votre message..."}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none text-black"
              rows="1"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          
          {message.trim() ? (
            <button
              onClick={sendMessage}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors"
            >
              <Send size={20} />
            </button>
          ) : (
            <Mic size={24} className="text-gray-400 cursor-pointer hover:text-green-500 transition-colors" />
          )}
        </div>
        
        {editingMessage && (
          <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
            <span>Mode modification</span>
            <button
              onClick={() => {
                setEditingMessage(null);
                setMessage('');
              }}
              className="text-red-500 hover:text-red-700"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleMenuAction('reply', contextMenu.messageId)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-black"
          >
            <Reply size={16} />
            <span>Répondre</span>
          </button>
          
          {messages.find(m => m.id === contextMenu.messageId)?.sender === currentUserId && (
            <button
              onClick={() => handleMenuAction('edit', contextMenu.messageId)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-black"
            >
              <Edit3 size={16} />
              <span>Modifier</span>
            </button>
          )}
          
          <button
            onClick={() => handleMenuAction('copy', contextMenu.messageId)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-black"
          >
            <Copy size={16} />
            <span>Copier</span>
          </button>
          
          <button
            onClick={() => handleMenuAction('forward', contextMenu.messageId)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-black"
          >
            <Forward size={16} />
            <span>Transférer</span>
          </button>
          
          <button
            onClick={() => handleMenuAction('star', contextMenu.messageId)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-black"
          >
            <Star size={16} />
            <span>Ajouter aux favoris</span>
          </button>
          
          <button
            onClick={() => handleMenuAction('pin', contextMenu.messageId)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-black"
          >
            <Pin size={16} />
            <span>{messages.find(m => m.id === contextMenu.messageId)?.pinned ? 'Désépingler' : 'Épingler'}</span>
          </button>
          
          <button
            onClick={() => handleMenuAction('info', contextMenu.messageId)}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-black"
          >
            <Info size={16} />
            <span>Info message</span>
          </button>
          
          <hr className="my-2" />
          
          <button
            onClick={() => handleMenuAction('delete', contextMenu.messageId)}
            className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Supprimer</span>
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50"
          style={{ 
            left: contextMenu?.x || 0, 
            top: (contextMenu?.y || 0) - 60 
          }}
        >
          <div className="flex space-x-2">
            {emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => addReaction(showEmojiPicker, emoji)}
                className="hover:bg-gray-100 p-2 rounded text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatZone;
