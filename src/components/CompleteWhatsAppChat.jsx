import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CompleteWhatsAppChat = ({ user, channelId = 'general' }) => {
  // Debug
  
  // États principaux
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Charger les messages
  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            id,
            email,
            user_metadata
          ),
          reactions:message_reactions (
            id,
            emoji,
            user_id,
            user:sender_id (
              email,
              user_metadata
            )
          )
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Marquer comme lu
      markAsRead();
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  // Envoyer un message
  const sendMessage = async (content, replyToId = null, attachments = []) => {
    if (!content.trim() && attachments.length === 0) return;

    try {
      const messageData = {
        content: content.trim(),
        sender_id: user.id,
        channel_id: channelId,
        reply_to: replyToId,
        attachments: attachments,
        status: 'sent'
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;
      
      // Mettre à jour le statut en temps réel
      setTimeout(() => {
        updateMessageStatus(data.id, 'delivered');
      }, 1000);

      setNewMessage('');
      setReplyingTo(null);
      
      // Vibration si supportée
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }

    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  // Mettre à jour le statut d'un message
  const updateMessageStatus = async (messageId, status) => {
    try {
      await supabase
        .from('messages')
        .update({ status })
        .eq('id', messageId);
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  // Marquer comme lu
  const markAsRead = async () => {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('channel_id', channelId)
        .neq('sender_id', user.id)
        .is('read_at', null);
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  // Gestion du typing
  const handleTyping = () => {
    setIsTyping(true);
    
    // Envoyer l'indicateur de frappe
    supabase
      .from('typing_indicators')
      .upsert({
            user_id: user.id,
        channel_id: channelId,
        is_typing: true,
        updated_at: new Date().toISOString()
      });

    // Clear timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Arrêter le typing après 3 secondes
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      supabase
        .from('typing_indicators')
        .upsert({
          user_id: user.id,
          channel_id: channelId,
          is_typing: false,
          updated_at: new Date().toISOString()
        });
    }, 3000);
  };

  // Ajouter une réaction
  const addReaction = async (messageId, emoji) => {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          emoji: emoji
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur ajout réaction:', error);
    }
  };

  // Supprimer une réaction
  const removeReaction = async (messageId) => {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur suppression réaction:', error);
    }
  };

  // Éditer un message
  const editMessage = async (messageId, newContent) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          content: newContent,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;
      setEditingMessage(null);
    } catch (error) {
      console.error('Erreur édition message:', error);
    }
  };

  // Supprimer un message
  const deleteMessage = async (messageId) => {
    if (!confirm('Supprimer ce message ?')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur suppression message:', error);
    }
  };

  // Upload de fichiers
  const handleFileUpload = async (files) => {
    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `chat-attachments/${fileName}`;

      setUploadingFiles(prev => [...prev, { name: file.name, progress: 0 }]);

      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;
      
      return {
        name: file.name,
        url: supabase.storage.from('chat-files').getPublicUrl(filePath).data.publicUrl,
        type: file.type,
        size: file.size
      };
    });

    try {
      const attachments = await Promise.all(uploadPromises);
      setUploadingFiles([]);
      return attachments;
    } catch (error) {
      console.error('Erreur upload:', error);
      setUploadingFiles([]);
      return [];
    }
  };

  // Gestion du drag & drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const attachments = await handleFileUpload(files);
      if (attachments.length > 0) {
        sendMessage('', null, attachments);
      }
    }
  };

  // Gestion des mentions
  const handleMention = (content) => {
    const mentionRegex = /@(\w+)/g;
    return content.replace(mentionRegex, (match, username) => {
      return `<span class="mention">${match}</span>`;
    });
  };

  // Formatage du timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatage de la date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  // Notifications browser
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const showNotification = (title, body, icon) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon });
    }
  };

  // Effets
  useEffect(() => {
    loadMessages();
    requestNotificationPermission();

    // Subscription temps réel pour les messages
    const messagesSubscription = supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new]);
            scrollToBottom();
            
            // Notification si pas l'expéditeur
            if (payload.new.sender_id !== user.id) {
              showNotification('Nouveau message', payload.new.content, '/favicon.png');
              setUnreadCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => 
              prev.map(msg => msg.id === payload.new.id ? payload.new : msg)
            );
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Subscription pour les indicateurs de frappe
    const typingSubscription = supabase
      .channel(`typing:${channelId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'typing_indicators', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          if (payload.new.is_typing && payload.new.user_id !== user.id) {
            setTypingUsers(prev => [...prev.filter(u => u.id !== payload.new.user_id), payload.new]);
          } else {
            setTypingUsers(prev => prev.filter(u => u.id !== payload.new.user_id));
          }
        }
      )
      .subscribe();

    // Subscription pour les utilisateurs en ligne
    const onlineSubscription = supabase
      .channel(`online:${channelId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = onlineSubscription.presenceState();
        setOnlineUsers(Object.values(state).flat());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await onlineSubscription.track({
            user_id: user.id,
            email: user.email,
            last_seen: new Date().toISOString(),
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      messagesSubscription.unsubscribe();
      typingSubscription.unsubscribe();
      onlineSubscription.unsubscribe();
    };
  }, [channelId, user.id]);

  // Auto-scroll quand nouveaux messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Gestion des touches
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(newMessage, replyingTo?.id);
    }
  };

  // Composant de réaction
  const ReactionButton = ({ messageId, emoji, count, hasReacted }) => (
          <button
      onClick={() => hasReacted ? removeReaction(messageId) : addReaction(messageId, emoji)}
      className={`px-2 py-1 rounded-full text-xs ${
        hasReacted ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
      } hover:bg-gray-200 transition-colors`}
    >
      {emoji} {count}
          </button>
  );

  // Composant de message
  const MessageBubble = ({ message }) => {
    const isOwn = message.sender_id === user.id;
    const hasReactions = message.reactions && message.reactions.length > 0;
    const userReaction = message.reactions?.find(r => r.user_id === user.id);

    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
          {/* Avatar et nom (seulement pour les autres) */}
          {!isOwn && (
            <div className="flex items-center mb-1">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2">
                {message.sender?.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-600">
                {message.sender?.user_metadata?.full_name || message.sender?.email}
              </span>
            </div>
          )}

          {/* Bulle de message */}
          <div className={`relative ${isOwn ? 'order-1' : 'order-2'}`}>
            {/* Message de réponse */}
            {message.reply_to && (
              <div className={`mb-2 p-2 rounded-lg border-l-4 ${
                isOwn ? 'bg-blue-50 border-blue-400' : 'bg-gray-50 border-gray-400'
              }`}>
                <div className="text-xs text-gray-500 mb-1">Réponse à :</div>
                <div className="text-sm truncate">
                  {messages.find(m => m.id === message.reply_to)?.content || 'Message supprimé'}
                </div>
              </div>
            )}

            {/* Contenu principal */}
            <div className={`px-4 py-2 rounded-2xl ${
              isOwn 
                ? 'bg-blue-500 text-white rounded-br-md' 
                : 'bg-gray-200 text-gray-800 rounded-bl-md'
            }`}>
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-2">
                  {message.attachments.map((attachment, idx) => (
                    <div key={idx} className="mb-2">
                      {attachment.type.startsWith('image/') ? (
                        <img 
                          src={attachment.url} 
                          alt={attachment.name}
                          className="max-w-full h-auto rounded-lg"
                />
              ) : (
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-2 bg-white bg-opacity-20 rounded-lg"
                        >
                          📎 {attachment.name}
                        </a>
              )}
            </div>
                  ))}
                </div>
              )}

              {/* Contenu du message */}
              <div 
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ 
                  __html: handleMention(message.content) 
                }}
              />

              {/* Timestamp et statut */}
              <div className={`flex items-center justify-end mt-1 text-xs ${
                isOwn ? 'text-blue-100' : 'text-gray-500'
              }`}>
                <span>{formatTime(message.created_at)}</span>
                {isOwn && (
                  <span className="ml-1">
                    {message.status === 'sent' && '✓'}
                    {message.status === 'delivered' && '✓✓'}
                    {message.status === 'read' && <span className="text-blue-300">✓✓</span>}
                  </span>
                )}
                {message.edited_at && (
                  <span className="ml-1 italic">(modifié)</span>
                )}
              </div>
          </div>

          {/* Menu 3 points */}
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1 hover:bg-gray-200 rounded-full">
              ⋮
            </button>
            </div>
          </div>

          {/* Réactions */}
          {hasReactions && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {message.reactions?.map((reaction, idx) => (
                <ReactionButton
                  key={idx}
                  messageId={message.id}
                  emoji={reaction.emoji}
                  count={reaction.count}
                  hasReacted={reaction.user_id === user.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Vérifier que l'utilisateur est bien passé
  if (!user) {
    return (
      <div className="flex flex-col h-full bg-gray-50 items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🔒 Connexion requise</h2>
          <p className="text-gray-600">Vous devez être connecté pour accéder au chat WhatsApp.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Debug Header */}
      <div className="p-2 bg-red-500 text-white text-center text-sm">
        🚀 WhatsApp Chat fonctionne ! User: {user.email || user.id}
      </div>
      
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
            {channelId.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold">Salon {channelId}</h2>
            <p className="text-sm text-green-100">
              {onlineUsers.length} utilisateur{onlineUsers.length > 1 ? 's' : ''} en ligne
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <div className="bg-red-500 text-white rounded-full px-2 py-1 text-sm font-bold">
            {unreadCount}
          </div>
        )}
      </div>

      {/* Messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-2"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {messages.map((message, index) => {
          const showDate = index === 0 || 
            formatDate(message.created_at) !== formatDate(messages[index - 1]?.created_at);
          
          return (
            <div key={message.id}>
              {showDate && (
                <div className="text-center text-gray-500 text-sm py-2">
                  {formatDate(message.created_at)}
                </div>
              )}
              <div className="group">
                <MessageBubble message={message} />
              </div>
          </div>
          );
        })}
            
            {/* Indicateur de frappe */}
        {typingUsers.length > 0 && (
              <div className="flex items-center text-gray-500 text-sm">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs mr-2">
                {typingUsers[0].user_id?.charAt(0).toUpperCase()}
                </div>
              <span>tape</span>
              <div className="flex ml-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce mx-0.5"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce mx-0.5" style={{animationDelay: '0.1s'}}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce mx-0.5" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
              </div>
            )}
            
        {/* Zone de drop pour fichiers */}
        {dragOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center text-blue-600 font-bold text-lg">
            📎 Déposez vos fichiers ici
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="bg-white border-t p-4">
        {/* Message de réponse */}
        {replyingTo && (
          <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Réponse à: {replyingTo.content}
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Upload en cours */}
        {uploadingFiles.length > 0 && (
          <div className="mb-2 text-sm text-gray-600">
            📤 Upload en cours: {uploadingFiles.map(f => f.name).join(', ')}
          </div>
        )}

        <div className="flex items-end space-x-2">
          {/* Bouton fichiers */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            📎
          </button>
          
          {/* Zone de texte */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="w-full p-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:border-blue-500"
              rows="1"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          {/* Bouton emoji */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            😊
          </button>

          {/* Bouton envoi */}
          <button
            onClick={() => sendMessage(newMessage, replyingTo?.id)}
            disabled={!newMessage.trim()}
            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ➤
          </button>
      </div>

        {/* Picker emoji */}
        {showEmojiPicker && (
          <div className="mt-2 p-2 bg-white border rounded-lg">
            <div className="flex flex-wrap gap-1">
              {['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏', '🔥', '💯'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    setNewMessage(prev => prev + emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {emoji}
                </button>
              ))}
          </div>
        </div>
      )}
          </div>

      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={(e) => {
          const files = e.target.files;
          if (files.length > 0) {
            handleFileUpload(files).then(attachments => {
              if (attachments.length > 0) {
                sendMessage('', replyingTo?.id, attachments);
              }
            });
          }
        }}
        className="hidden"
      />

      {/* Styles CSS pour les mentions */}
      <style jsx>{`
        .mention {
          background-color: #dbeafe;
          color: #1d4ed8;
          padding: 2px 4px;
          border-radius: 4px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default CompleteWhatsAppChat;