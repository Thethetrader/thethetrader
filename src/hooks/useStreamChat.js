import { useState, useEffect, useCallback } from 'react';
import { StreamChat } from 'stream-chat';

// Configuration GetStream - TES CLÉS
const STREAM_API_KEY = 'apk7cmaduwd3';

export function useStreamChat(user) {
  const [streamClient, setStreamClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fonction pour obtenir un token depuis le backend
  const getStreamToken = useCallback(async (userId, userName, userEmail) => {
    try {
      console.log('🔄 Demande de token pour:', userId);
      
      // Pour l'instant, on utilise un token de développement
      // En production, il faudrait utiliser le serveur API
      const response = await fetch('http://localhost:3001/api/stream-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userName,
          userEmail
        })
      });

      if (!response.ok) {
        // Si le serveur API n'est pas disponible, on utilise un token de développement
        console.warn('⚠️ Serveur API non disponible, utilisation du token de développement');
        return 'dev-token-' + userId;
      }

      const data = await response.json();
      console.log('✅ Token reçu:', data.token ? 'Oui' : 'Non');
      return data.token;
    } catch (error) {
      console.error('❌ Erreur récupération token:', error);
      // En cas d'erreur, on utilise un token de développement
      console.warn('⚠️ Utilisation du token de développement');
      return 'dev-token-' + userId;
    }
  }, []);

  // Fonction pour se connecter à GetStream
  const connectToStream = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Connexion GetStream pour:', user.email);

      // Obtenir le token depuis le serveur API
      const response = await fetch('http://localhost:3001/api/stream-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          userName: user.email,
          userEmail: user.email
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur API: ${response.status}`);
      }

      const { token } = await response.json();
      console.log('✅ Token reçu depuis le serveur API');

      // Créer le client GetStream - SYNTAXE CORRECTE
      const client = StreamChat.getInstance(STREAM_API_KEY);

      // Se connecter avec le token valide
      await client.connectUser({
        id: user.id,
        name: user.email,
        email: user.email,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`
      }, token);

      setStreamClient(client);
      setIsConnected(true);
      console.log('✅ Connexion GetStream réussie pour:', user.email);

    } catch (error) {
      console.error('❌ Erreur connexion GetStream:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fonction pour se déconnecter
  const disconnectFromStream = useCallback(async () => {
    try {
      if (streamClient) {
        await streamClient.disconnectUser();
        setStreamClient(null);
        setIsConnected(false);
        console.log('✅ Déconnexion GetStream réussie');
      }
    } catch (error) {
      console.error('❌ Erreur déconnexion GetStream:', error);
    }
  }, [streamClient]);

  // Effet pour gérer la connexion/déconnexion
  useEffect(() => {
    if (user) {
      connectToStream();
    } else {
      disconnectFromStream();
    }

    // Cleanup à la fermeture
    return () => {
      if (streamClient) {
        disconnectFromStream();
      }
    };
  }, [user, connectToStream, disconnectFromStream]);

  return {
    streamClient,
    isConnected,
    loading,
    error,
    connectToStream,
    disconnectFromStream
  };
}