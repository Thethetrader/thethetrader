import React, { useState, useEffect } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from 'stream-chat-react';
// CSS OBLIGATOIRE - Version v2
import 'stream-chat-react/css/v2/index.css';
import { useStreamChat } from '../hooks/useStreamChat';

export default function StreamChatComponent({ user }) {
  const { streamClient, isConnected, loading, error } = useStreamChat(user);
  const [activeChannel, setActiveChannel] = useState(null);

  // Créer le canal par défaut quand le client est connecté
  useEffect(() => {
    if (streamClient && !activeChannel) {
      console.log('🔄 Création du canal par défaut...');
      
      // Créer le canal avec la syntaxe correcte
      const channel = streamClient.channel('messaging', 'general', {
        name: '💬 Salon Général',
        members: [streamClient.userID]
      });
      
      setActiveChannel(channel);
      console.log('✅ Canal créé:', channel.id);
    }
  }, [streamClient, activeChannel]);

  // États de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg border">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Connexion au chat...</p>
          <p className="text-sm text-gray-500 mt-1">Initialisation GetStream</p>
        </div>
      </div>
    );
  }

  // Gestion des erreurs
  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg border">
        <div className="text-center text-red-600">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-lg font-semibold mb-2">❌ Erreur de connexion</p>
          <p className="text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Vérification de la connexion
  if (!isConnected || !streamClient || !activeChannel) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg border">
        <div className="text-center text-gray-600">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-semibold mb-2">🔌 Impossible de se connecter</p>
          <p className="text-sm">Vérifiez votre connexion et vos identifiants</p>
        </div>
      </div>
    );
  }

  // Interface de chat fonctionnelle
  return (
    <div className="h-96 bg-white rounded-lg border overflow-hidden">
      <Chat client={streamClient}>
        <Channel channel={activeChannel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}