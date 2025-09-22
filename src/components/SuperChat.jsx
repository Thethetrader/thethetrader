import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const SuperChat = () => {
  // States
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastReadMessageRef = useRef(null);
  
  // Auth
  const { user: currentUser, loading } = useAuth();
  
  // Channel ID (you can make this dynamic)
  const channelId = 'general';

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          message_attachments(*),
          message_reactions(*)
        `)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      
      // Mark messages as read
      if (data && data.length > 0) {
        const lastMessage = data[data.length - 1];
        await markAsRead(lastMessage.id);
        lastReadMessageRef.current = lastMessage.id;
      }
      
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [currentUser, channelId]);

  // Mark message as read
  const markAsRead = async (messageId) => {
    if (!currentUser) return;

    try {
      await supabase
        .from('message_read_status')
        .upsert({
          message_id: messageId,
          user_id: currentUser.id
        });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || uploading) return;

    const messageContent = newMessage.trim();
    console.log('🚀 Sending message:', { messageContent, currentUser, channelId });
    
    setNewMessage('');
    setIsTyping(false);
    
    // Stop typing indicator
    await stopTyping();

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          content: messageContent,
          author_id: currentUser.id,
          author_name: currentUser.user_metadata?.full_name || currentUser.email,
          author_avatar: currentUser.user_metadata?.avatar_url,
          channel_id: channelId,
          message_type: 'text',
          reply_to_id: replyingTo?.id || null
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Message sent successfully:', data);

      // Upload file if selected
      if (selectedFile) {
        await uploadFile(data.id, selectedFile);
        setSelectedFile(null);
      }

      setReplyingTo(null);
      scrollToBottom();
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
    }
  };

  // Upload file
  const uploadFile = async (messageId, file) => {
    if (!file) return;

    try {
      setUploading(true);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${messageId}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      // Save attachment record
      await supabase
        .from('message_attachments')
        .insert({
          message_id: messageId,
          url: urlData.publicUrl,
          filename: file.name,
          file_size: file.size,
          mime_type: file.type
        });

    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Auto-send message with file
      setNewMessage(`📎 ${file.name}`);
    }
  };

  // Edit message
  const editMessage = async (messageId, newContent) => {
    if (!newContent.trim()) return;

    try {
      await supabase
        .from('chat_messages')
        .update({
          content: newContent.trim(),
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('author_id', currentUser.id);

      setEditingMessage(null);
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await supabase
        .from('chat_messages')
        .update({ is_deleted: true })
        .eq('id', messageId)
        .eq('author_id', currentUser.id);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Add reaction
  const addReaction = async (messageId, emoji) => {
    try {
      await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          emoji,
          user_id: currentUser.id,
          user_name: currentUser.user_metadata?.full_name || currentUser.email
        });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Remove reaction
  const removeReaction = async (messageId, emoji) => {
    try {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('emoji', emoji)
        .eq('user_id', currentUser.id);
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  // Typing indicator
  const startTyping = async () => {
    if (!currentUser || isTyping) return;

    setIsTyping(true);
    
    try {
      await supabase
        .from('typing_status')
        .upsert({
          user_id: currentUser.id,
          user_name: currentUser.user_metadata?.full_name || currentUser.email,
          channel_id: channelId,
          is_typing: true
        });
    } catch (error) {
      console.error('Error starting typing:', error);
    }
  };

  const stopTyping = async () => {
    if (!currentUser) return;

    setIsTyping(false);
    
    try {
      await supabase
        .from('typing_status')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('channel_id', channelId);
    } catch (error) {
      console.error('Error stopping typing:', error);
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format time
  const formatTime = (dateString) => {
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

  // Get user initials
  const getUserInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get avatar color
  const getAvatarColor = (userId) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    
    const hash = userId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };

  // Format reactions
  const formatReactions = (reactions) => {
    return reactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {});
  };

  // Check if user reacted
  const hasUserReacted = (reactions, emoji) => {
    return reactions.some(reaction => 
      reaction.emoji === emoji && reaction.user_id === currentUser.id
    );
  };

  // Load initial data
  useEffect(() => {
    if (currentUser) {
      loadMessages();
    }
  }, [currentUser, loadMessages]);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;

    // Messages subscription
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => [...prev, payload.new]);
          scrollToBottom();
          
          // Mark as read if it's not from current user
          if (payload.new.author_id !== currentUser.id) {
            markAsRead(payload.new.id);
          }
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === payload.new.id ? payload.new : msg
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => 
            prev.filter(msg => msg.id !== payload.old.id)
          );
        }
      })
      .subscribe();

    // Typing subscription
    const typingSubscription = supabase
      .channel('typing')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_status',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTypingUsers(prev => {
            const filtered = prev.filter(user => user.user_id !== payload.new.user_id);
            return [...filtered, payload.new];
          });
        } else if (payload.eventType === 'DELETE') {
          setTypingUsers(prev => 
            prev.filter(user => user.user_id !== payload.old.user_id)
          );
        }
      })
      .subscribe();

    // Reactions subscription
    const reactionsSubscription = supabase
      .channel('reactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages(prev => 
            prev.map(msg => {
              if (msg.id === payload.new.message_id) {
                return {
                  ...msg,
                  message_reactions: [...(msg.message_reactions || []), payload.new]
                };
              }
              return msg;
            })
          );
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => 
            prev.map(msg => {
              if (msg.id === payload.old.message_id) {
                return {
                  ...msg,
                  message_reactions: (msg.message_reactions || []).filter(
                    reaction => reaction.id !== payload.old.id
                  )
                };
              }
              return msg;
            })
          );
        }
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      typingSubscription.unsubscribe();
      reactionsSubscription.unsubscribe();
    };
  }, [currentUser, channelId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, []);

  // Debug info
  console.log('SuperChat Debug:', { loading, currentUser });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Chargement...</h2>
          <p className="text-gray-500">Connexion au chat...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">Non connecté</h2>
          <p className="text-gray-500 mb-4">Vous devez vous connecter pour utiliser le chat.</p>
          <p className="text-xs text-gray-400 mb-2">Debug: loading={loading.toString()}, user={currentUser ? 'exists' : 'null'}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* DEBUG HEADER */}
      <div className="p-4 bg-red-500 text-white text-center font-bold">
        🚀 SUPERCHAT FONCTIONNE ! 🚀
      </div>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-semibold text-gray-800">💬 Chat Général</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-2">
            {onlineUsers.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-white ${getAvatarColor(user.id)}`}
                title={user.name}
              >
                {getUserInitials(user.name)}
              </div>
            ))}
          </div>
          <span className="text-sm text-gray-500">
            {onlineUsers.length} en ligne
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-3 group">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white ${getAvatarColor(message.author_id)}`}>
              {message.author_avatar ? (
                <img
                  src={message.author_avatar}
                  alt={message.author_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getUserInitials(message.author_name)
              )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-semibold text-gray-800">
                  {message.author_name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(message.created_at)}
                </span>
                {message.is_edited && (
                  <span className="text-xs text-gray-400">(modifié)</span>
                )}
                {message.reply_to_id && (
                  <span className="text-xs text-blue-500">↩️ Réponse</span>
                )}
              </div>

              {/* Reply Context */}
              {message.reply_to_id && (
                <div className="bg-gray-100 p-2 rounded mb-2 text-sm text-gray-600">
                  Réponse à un message
                </div>
              )}

              {/* Message Text */}
              <div className="text-gray-700 mb-2">
                {editingMessage?.id === message.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      defaultValue={message.content}
                      className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          editMessage(message.id, e.target.value);
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => setEditingMessage(null)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>

              {/* Attachments */}
              {message.message_attachments && message.message_attachments.length > 0 && (
                <div className="space-y-2 mb-2">
                  {message.message_attachments.map((attachment) => (
                    <div key={attachment.id} className="border border-gray-200 rounded p-2">
                      {attachment.mime_type.startsWith('image/') ? (
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="max-w-xs rounded cursor-pointer hover:opacity-80"
                          onClick={() => window.open(attachment.url, '_blank')}
                        />
                      ) : (
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-blue-500 hover:text-blue-700"
                        >
                          <span>📎</span>
                          <span>{attachment.filename}</span>
                          <span className="text-xs text-gray-500">
                            ({(attachment.file_size / 1024).toFixed(1)} KB)
                          </span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reactions */}
              {message.message_reactions && message.message_reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {Object.entries(formatReactions(message.message_reactions)).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        if (hasUserReacted(message.message_reactions, emoji)) {
                          removeReaction(message.id, emoji);
                        } else {
                          addReaction(message.id, emoji);
                        }
                      }}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm border ${
                        hasUserReacted(message.message_reactions, emoji)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>{emoji}</span>
                      <span>{count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => addReaction(message.id, '👍')}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  👍
                </button>
                <button
                  onClick={() => addReaction(message.id, '❤️')}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ❤️
                </button>
                <button
                  onClick={() => addReaction(message.id, '😂')}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  😂
                </button>
                <button
                  onClick={() => setReplyingTo(message)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  Répondre
                </button>
                {message.author_id === currentUser.id && (
                  <>
                    <button
                      onClick={() => setEditingMessage(message)}
                      className="text-gray-400 hover:text-gray-600 text-sm"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="text-gray-400 hover:text-red-600 text-sm"
                    >
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {typingUsers.map(user => user.user_name).join(', ')} 
              {typingUsers.length === 1 ? ' écrit...' : ' écrivent...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Context */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Répondre à <span className="font-semibold">{replyingTo.author_name}</span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="text-xs text-gray-500 truncate">
            {replyingTo.content}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-end space-x-2">
          {/* File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            ) : (
              '📎'
            )}
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                <div className="grid grid-cols-8 gap-1">
                  {['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯', '👏', '🙌'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setNewMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="p-1 hover:bg-gray-100 rounded text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            😊
          </button>

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || uploading}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperChat;
