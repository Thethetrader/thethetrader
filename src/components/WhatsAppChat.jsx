import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const WhatsAppChat = ({ user, channelId = 'whatsapp-chat' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeen, setLastSeen] = useState({});
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll vers le bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Charger les messages
  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          reply_to:reply_to_id(id, content, sender_id)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      // Calculer les messages non lus
      const unread = data?.filter(msg => 
        msg.sender_id !== user.id && 
        !msg.read_by?.includes(user.id)
      ).length || 0;
      setUnreadCount(unread);
      
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  }, [channelId, user.id, scrollToBottom]);

  // Charger les utilisateurs en ligne
  const loadOnlineUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('typing_indicators')
        .select('user_id, last_seen')
        .eq('channel_id', channelId)
        .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 min

      if (error) throw error;
      
      const online = new Set();
      const seen = {};
      data?.forEach(item => {
        online.add(item.user_id);
        seen[item.user_id] = item.last_seen;
      });
      
      setOnlineUsers(online);
      setLastSeen(seen);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  }, [channelId]);

  // Envoyer un message
  const sendMessage = async (content, replyToId = null, attachment = null) => {
    if (!content.trim() && !attachment) return;

    try {
      const messageData = {
        channel_id: channelId,
        sender_id: user.id,
        content: content.trim(),
        reply_to_id: replyToId,
        attachment_url: attachment,
        read_by: [user.id],
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select(`
          *,
          reply_to:reply_to_id(id, content, sender_id)
        `)
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      setReplyTo(null);
      setEditingMessage(null);
      
      // Notifier les autres utilisateurs
      await supabase
        .from('typing_indicators')
        .upsert({
          user_id: user.id,
          channel_id: channelId,
          last_seen: new Date().toISOString()
        });

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  // Upload d'image
  const uploadImage = async (file) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `chat-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Erreur upload:', error);
      return null;
    } finally {
      setUploading(false);
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
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      const url = await uploadImage(imageFile);
      if (url) {
        await sendMessage('📷 Image', null, url);
      }
    }
  };

  // Gestion de la frappe
  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    supabase
      .from('typing_indicators')
      .upsert({
        user_id: user.id,
        channel_id: channelId,
        last_seen: new Date().toISOString()
      });

    typingTimeoutRef.current = setTimeout(() => {
      // Arrêter l'indicateur de frappe après 3 secondes
    }, 3000);
  };

  // Marquer comme lu
  const markAsRead = async (messageId) => {
    try {
      await supabase
        .from('messages')
        .update({
          read_by: supabase.sql`array_append(read_by, ${user.id})`
        })
        .eq('id', messageId)
        .neq('sender_id', user.id);
    } catch (error) {
      console.error('Erreur marquage lu:', error);
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
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent, edited_at: new Date().toISOString() }
          : msg
      ));
      setEditingMessage(null);
    } catch (error) {
      console.error('Erreur édition:', error);
    }
  };

  // Supprimer un message
  const deleteMessage = async (messageId) => {
    if (!confirm('Supprimer ce message ?')) return;

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  // Ajouter une réaction
  const addReaction = async (messageId, emoji) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const reactions = message.reactions || {};
      const userReactions = reactions[user.id] || [];
      
      if (userReactions.includes(emoji)) {
        // Retirer la réaction
        reactions[user.id] = userReactions.filter(e => e !== emoji);
      } else {
        // Ajouter la réaction
        reactions[user.id] = [...userReactions, emoji];
      }

      const { error } = await supabase
        .from('messages')
        .update({ reactions })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, reactions } : msg
      ));
    } catch (error) {
      console.error('Erreur réaction:', error);
    }
  };

  // Formater le timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Formater la dernière fois vue
  const formatLastSeen = (timestamp) => {
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diff = Math.floor((now - lastSeen) / 1000 / 60);
    
    if (diff < 1) return 'en ligne';
    if (diff < 60) return `il y a ${diff} min`;
    if (diff < 1440) return `il y a ${Math.floor(diff / 60)}h`;
    return `il y a ${Math.floor(diff / 1440)}j`;
  };

  // Rendu des réactions
  const renderReactions = (reactions) => {
    if (!reactions) return null;
    
    const allReactions = {};
    Object.values(reactions).forEach(userReactions => {
      userReactions.forEach(emoji => {
        allReactions[emoji] = (allReactions[emoji] || 0) + 1;
      });
    });

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(allReactions).map(([emoji, count]) => (
          <span key={emoji} className="text-xs bg-gray-100 rounded-full px-2 py-1">
            {emoji} {count}
          </span>
        ))}
      </div>
    );
  };

  // Rendu d'un message
  const renderMessage = (message) => {
    const isOwn = message.sender_id === user.id;
    const isRead = message.read_by?.includes(user.id);
    const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;

    return (
      <div
        key={message.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group`}
        onMouseEnter={() => !isOwn && markAsRead(message.id)}
      >
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
          {/* Réponse */}
          {message.reply_to && (
            <div className={`mb-1 p-2 bg-gray-100 rounded-lg border-l-4 ${isOwn ? 'border-blue-500' : 'border-gray-400'}`}>
              <div className="text-xs text-gray-600">
                {message.reply_to.sender_id === user.id ? 'Vous' : 'Autre'}
              </div>
              <div className="text-sm truncate">{message.reply_to.content}</div>
            </div>
          )}

          {/* Message principal */}
          <div
            className={`relative px-4 py-2 rounded-lg ${
              isOwn 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {/* Contenu */}
            <div className="break-words">
              {message.content}
            </div>

            {/* Image */}
            {message.attachment_url && (
              <div className="mt-2">
                <img 
                  src={message.attachment_url} 
                  alt="Image" 
                  className="max-w-full h-auto rounded"
                />
              </div>
            )}

            {/* Timestamp et statut */}
            <div className={`flex items-center justify-end mt-1 text-xs ${
              isOwn ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <span>{formatTime(message.created_at)}</span>
              {message.edited_at && <span className="ml-1">(modifié)</span>}
              {isOwn && (
                <span className="ml-1">
                  {isRead ? '✓✓' : '✓'}
                </span>
              )}
            </div>

            {/* Menu actions */}
            <div className={`absolute top-0 ${isOwn ? 'left-0' : 'right-0'} opacity-0 group-hover:opacity-100 transition-opacity`}>
              <div className="flex gap-1">
                {/* Réactions */}
                <div className="relative">
                  <button
                    onClick={() => addReaction(message.id, '👍')}
                    className="p-1 bg-white rounded-full shadow-lg hover:bg-gray-100"
                  >
                    👍
                  </button>
                </div>

                {/* Édition (seulement ses messages) */}
                {isOwn && (
                  <button
                    onClick={() => setEditingMessage(message)}
                    className="p-1 bg-white rounded-full shadow-lg hover:bg-gray-100"
                  >
                    ✏️
                  </button>
                )}

                {/* Suppression (seulement ses messages) */}
                {isOwn && (
                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="p-1 bg-white rounded-full shadow-lg hover:bg-gray-100"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Réactions */}
          {hasReactions && (
            <div className="mt-1">
              {renderReactions(message.reactions)}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Écouter les changements en temps réel
  useEffect(() => {
    loadMessages();
    loadOnlineUsers();

    // Écouter les nouveaux messages
    const messagesSubscription = supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          setTimeout(scrollToBottom, 100);
          
          // Notification browser
          if (payload.new.sender_id !== user.id) {
            new Notification('Nouveau message', {
              body: payload.new.content,
              icon: '/favicon.png'
            });
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        (payload) => {
          setMessages(prev => prev.map(msg => 
            msg.id === payload.new.id ? payload.new : msg
          ));
        }
      )
      .subscribe();

    // Écouter les indicateurs de frappe
    const typingSubscription = supabase
      .channel(`typing:${channelId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'typing_indicators', filter: `channel_id=eq.${channelId}` },
        () => {
          loadOnlineUsers();
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      typingSubscription.unsubscribe();
    };
  }, [channelId, user.id, loadMessages, loadOnlineUsers, scrollToBottom]);

  // Demander les permissions de notification
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Connexion requise</h2>
          <p className="text-gray-600">Vous devez être connecté pour accéder au chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-green-500 text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">WhatsApp Chat</h2>
          <div className="text-sm opacity-90">
            {onlineUsers.size} utilisateur{onlineUsers.size > 1 ? 's' : ''} en ligne
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="bg-red-500 text-white rounded-full px-2 py-1 text-sm">
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
        {messages.map(renderMessage)}
        
        {/* Indicateur de frappe */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start mb-2">
            <div className="bg-gray-200 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Ligne messages non lus */}
        {unreadCount > 0 && (
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="px-4 text-sm text-gray-500 bg-gray-100 rounded-full">
              {unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}
            </div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Zone de drag & drop */}
      {dragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-10">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="text-4xl mb-4">📷</div>
            <div className="text-lg font-semibold">Déposez votre image ici</div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t p-4">
        {/* Réponse */}
        {replyTo && (
          <div className="mb-2 p-2 bg-gray-100 rounded-lg border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-gray-600">Répondre à</div>
                <div className="text-sm truncate">{replyTo.content}</div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Édition */}
        {editingMessage && (
          <div className="mb-2 p-2 bg-blue-100 rounded-lg border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-blue-600">Édition</div>
                <div className="text-sm truncate">{editingMessage.content}</div>
              </div>
              <button
                onClick={() => setEditingMessage(null)}
                className="text-blue-500 hover:text-blue-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* Bouton image */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700"
            disabled={uploading}
          >
            {uploading ? '⏳' : '📷'}
          </button>

          {/* Input message */}
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (editingMessage) {
                  editMessage(editingMessage.id, newMessage);
                } else {
                  sendMessage(newMessage, replyTo?.id);
                }
              }
            }}
            placeholder={editingMessage ? "Modifier le message..." : "Tapez un message..."}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />

          {/* Bouton envoi */}
          <button
            onClick={() => {
              if (editingMessage) {
                editMessage(editingMessage.id, newMessage);
              } else {
                sendMessage(newMessage, replyTo?.id);
              }
            }}
            disabled={!newMessage.trim()}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ➤
          </button>
        </div>

        {/* Réactions rapides */}
        <div className="flex space-x-2 mt-2">
          {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
            <button
              key={emoji}
              onClick={() => {
                if (messages.length > 0) {
                  addReaction(messages[messages.length - 1].id, emoji);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files[0];
          if (file) {
            const url = await uploadImage(file);
            if (url) {
              await sendMessage('📷 Image', replyTo?.id, url);
            }
          }
        }}
        className="hidden"
      />
    </div>
  );
};

export default WhatsAppChat;