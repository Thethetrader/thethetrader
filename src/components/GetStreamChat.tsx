import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';

interface GetStreamChatProps {
  userId: string;
  userName: string;
  userRole?: 'user' | 'admin';
  channelId?: string;
}

// Composants GetStream officiels simulés
const Chat = ({ client, children, theme }: any) => (
  <div className={`str-chat str-chat--${theme || 'light'} ${theme === 'dark' ? 'str-chat--dark' : ''}`}>
    {children}
  </div>
);

const Channel = ({ channel, children }: any) => (
  <div className="str-chat__channel">
    {children}
  </div>
);

const ChannelHeader = () => (
  <div className="str-chat__channel-header">
    <div className="str-chat__channel-header-info">
      <div className="str-chat__channel-header-title">
        <span className="str-chat__channel-header-title-text">Trading Chat</span>
      </div>
      <div className="str-chat__channel-header-subtitle">
        <span className="str-chat__channel-header-subtitle-text">Chat en direct</span>
      </div>
    </div>
    <div className="str-chat__channel-header-actions">
      <button className="str-chat__channel-header-actions-button" title="Informations du channel">
        <svg width="20" height="20" viewBox="0 0 20 20">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" fill="currentColor"/>
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" fill="currentColor"/>
        </svg>
      </button>
    </div>
  </div>
);

const MessageList = ({ messages, loading }: any) => (
  <div className="str-chat__list str-chat__message-list">
    <div className="str-chat__list-container">
      {loading ? (
        <div className="str-chat__message-list-loading">
          <div className="str-chat__spinner"></div>
        </div>
      ) : (
        <div className="str-chat__message-list-container">
          {messages.map((message: any, index: number) => (
            <div key={message.id || index} className="str-chat__message">
              <div className="str-chat__message-inner">
                <div className="str-chat__message-avatar">
                  <div className="str-chat__avatar str-chat__avatar--circle">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${message.user?.name || 'U'}&background=667eea&color=fff`}
                      alt={message.user?.name || 'User'}
                      className="str-chat__avatar-image"
                    />
                  </div>
                </div>
                <div className="str-chat__message-content">
                  <div className="str-chat__message-header">
                    <span className="str-chat__message-username">
                      {message.user?.name || message.user?.id || 'Anonyme'}
                    </span>
                    <span className="str-chat__message-timestamp">
                      {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="str-chat__message-text">
                    {message.text}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const MessageInput = ({ onSendMessage, value, onChange, placeholder }: any) => (
  <div className="str-chat__input-container">
    <div className="str-chat__input-box">
      <div className="str-chat__input-box-inner">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Écrire un message..."}
          className="str-chat__textarea"
          rows={1}
        />
        <div className="str-chat__input-box-actions">
          <button 
            onClick={onSendMessage}
            disabled={!value?.trim()}
            className="str-chat__send-button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
);

const Window = ({ children }: any) => (
  <div className="str-chat__channel-window">
    {children}
  </div>
);

export default function GetStreamChat({ 
  userId, 
  userName, 
  userRole = 'user',
  channelId = 'live-chat'
}: GetStreamChatProps) {
  
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        console.log('🚀 [GetStream] Initialisation avec composants officiels...');
        
        // Configuration
        const STREAM_API_KEY = 'apk7cmaduwd3';
        
        // Initialiser Stream Chat
        const streamClient = new StreamChat(STREAM_API_KEY);
        
        // Utiliser l'ID Supabase réel
        let currentUserId;
        let currentUserName;
        
        if (userId && userId !== 'user_1') {
          // Garder l'ID Supabase original
          currentUserId = userId;
          currentUserName = userName || userId;
        } else {
          // Pour les tests, utiliser un ID fixe
          currentUserId = 'user_' + Math.floor(Math.random() * 10000);
          currentUserName = userName || currentUserId;
        }
        
        console.log('ID utilisateur pour Stream:', currentUserId);
        console.log('Nom utilisateur pour Stream:', currentUserName);
        
        // Utiliser un token serveur pour éviter les timeouts
        try {
          const response = await fetch('http://localhost:3001/api/generate-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: currentUserId,
              userName: currentUserName,
              secret: '5c6jpud3n7h7nv9sjjg926v47q3wspbfajv56n25pddsqkbtszr7t86gygjg34k2'
            }),
          });
          
          const { token } = await response.json();
          await streamClient.connectUser(
            { id: currentUserId, name: currentUserName },
            token
          );
          console.log('Connecté avec token serveur');
        } catch (tokenError) {
          console.log('Erreur token, fallback sur setGuestUser');
          await streamClient.setGuestUser({
            id: currentUserId,
            name: currentUserName
          });
        }
        
        console.log('Connecté à Stream en tant que guest');
        setClient(streamClient);
        
        // Créer le channel simple (sans created_by pour les guests)
        const chatChannel = streamClient.channel('messaging', 'trading-chat-public');
        await chatChannel.watch();
        
        console.log('Channel rejoint avec succès');
        setChannel(chatChannel);
        
        // Charger les messages
        const state = await chatChannel.query({
          messages: { limit: 30 }
        });
        setMessages(state.messages || []);
        
        // Écouter les nouveaux messages
        chatChannel.on('message.new', (event) => {
          setMessages(prev => [...prev, event.message]);
        });
        
        setIsLoading(false);
        
      } catch (error) {
        console.error('Erreur détaillée:', error);
        setError('Erreur de connexion. Veuillez rafraîchir la page. ' + error.message);
        setIsLoading(false);
      }
    };

    initializeChat();

    return () => {
      if (client) {
        client.disconnectUser();
        console.log('🔌 [GetStream] Déconnecté');
      }
    };
  }, [userId, userName, userRole, channelId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !channel) return;
    
    try {
      await channel.sendMessage({ text: newMessage.trim() });
      setNewMessage('');
      console.log('Message envoyé');
    } catch (error) {
      console.error('Erreur envoi:', error);
    }
  };


  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-900/20 border border-red-500/30 rounded-lg">
        <div className="text-red-400 text-center p-4">
          <div className="text-xl mb-2">❌ Erreur GetStream</div>
          <div className="text-sm">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !client || !channel) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="text-blue-400 text-center">
          <div className="text-xl mb-2">🚀 Connexion GetStream...</div>
          <div className="text-sm">Initialisation des composants officiels...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Chat client={client} theme="light">
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList messages={messages} loading={isLoading} />
            <MessageInput 
            value={newMessage}
              onChange={setNewMessage}
              onSendMessage={sendMessage}
              placeholder="Écrire un message..."
            />
          </Window>
        </Channel>
      </Chat>
    </div>
  );
}