import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

const SupabaseChat = () => {
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sessionLoading, setSessionLoading] = useState(true);
  const messagesEndRef = useRef(null);
  
  // Utiliser l'auth Supabase unifié
  const { user: currentUser, loading } = useAuth();
  
  // Attendre que la session soit vraiment chargée
  useEffect(() => {
    const checkSession = async () => {
      console.log("⏳ Attente de la session Supabase...");
      
      // Essayer plusieurs fois avec des délais
      const tryGetSession = async (attempt = 1) => {
        const { supabase } = await import('../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log(`🔄 Tentative ${attempt}:`, { session: !!session, user: !!session?.user });
        
        if (session?.user) {
          console.log("✅ Session trouvée après attente:", session.user.email);
          setSessionLoading(false);
        } else if (attempt < 5) {
          // Réessayer après 500ms
          setTimeout(() => tryGetSession(attempt + 1), 500);
        } else {
          console.log("❌ Aucune session trouvée après 5 tentatives");
          setSessionLoading(false);
        }
      };
      
      // Commencer après 500ms
      setTimeout(() => tryGetSession(), 500);
    };
    
    checkSession();
  }, []);
  
  // DEBUG APPROFONDI - Chat
  useEffect(() => {
    console.log("🔍 CHAT DEBUG:");
    console.log("User dans le chat:", currentUser);
    console.log("Loading dans le chat:", loading);
    
    // Vérifier directement la session
    import('../lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data, error }) => {
        console.log("Session dans le chat:", data.session);
        console.log("User de session dans le chat:", data.session?.user);
        console.log("Client Supabase:", supabase);
        console.log("Erreur session chat:", error);
      });
    });
  }, [currentUser, loading]);

  // Charger les canaux (version simple)
  useEffect(() => {
    if (currentUser) {
      // Canal par défaut
      const defaultChannel = {
        id: 1,
        slug: 'general',
        created_by: currentUser.id
      };
      
      setChannels([defaultChannel]);
      setSelectedChannel(defaultChannel);
      console.log('✅ Canal par défaut créé pour:', currentUser.id);
    }
  }, [currentUser]);

  // Messages simples (localStorage)
  useEffect(() => {
    if (!selectedChannel) return;

    const savedMessages = localStorage.getItem(`messages_${selectedChannel.id}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([]);
    }
  }, [selectedChannel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChannel || !currentUser) return;

    const newMsg = {
      id: Date.now(),
      message: newMessage.trim(),
      channel_id: selectedChannel.id,
      user_id: currentUser.id,
      inserted_at: new Date().toISOString(),
      users: {
        email: currentUser.email
      }
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    localStorage.setItem(`messages_${selectedChannel.id}`, JSON.stringify(updatedMessages));
    
    setNewMessage('');
    scrollToBottom();
  };

  const createChannel = () => {
    const channelName = prompt('Nom du canal:');
    if (!channelName || !currentUser) return;

    const newChannel = {
      id: Date.now(),
      slug: channelName.toLowerCase().replace(/\s+/g, '-'),
      created_by: currentUser.id
    };

    setChannels(prev => [...prev, newChannel]);
    setSelectedChannel(newChannel);
  };

  if (loading || sessionLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Chargement...</h2>
          <p className="text-lg">Vérification de l'authentification...</p>
          <p className="text-sm text-gray-500 mt-2">Attente de la session Supabase...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">Chargement...</h2>
          <p className="text-gray-500">Vérification de votre connexion...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">Non connecté à Supabase</h2>
          <p className="text-gray-500 mb-4">Vous devez vous connecter avec vos identifiants Supabase.</p>
          <button
            onClick={() => {
              // Rediriger vers la page principale pour se connecter
              window.location.href = '/';
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Aller à la page de connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Canaux</h2>
          <button
            onClick={createChannel}
            className="mt-2 w-full bg-blue-500 text-white py-2 px-3 rounded hover:bg-blue-600"
          >
            + Nouveau canal
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={`w-full text-left p-3 rounded mb-1 ${
                selectedChannel?.id === channel.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              # {channel.slug}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
              {currentUser.email.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">
                # {selectedChannel.slug}
              </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">
                    {message.users?.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-800">
                        {message.users?.email || 'Utilisateur'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.inserted_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">{message.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Tapez votre message..."
                  className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Envoyer
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Sélectionnez un canal pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseChat;
