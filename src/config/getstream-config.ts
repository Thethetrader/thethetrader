import { StreamChat } from 'stream-chat';

// Configuration GetStream
export const getStreamConfig = {
  apiKey: 'apk7cmaduwd3',
  secret: '5c6jpud3n7h7nv9sjjg926v47q3wspbfajv56n25pddsqkbtszr7t86gygjg34k2',
};

// Initialiser le client GetStream
export const streamClient = StreamChat.getInstance(getStreamConfig.apiKey);

// Fonction pour générer un token utilisateur
export const generateUserToken = async (userId: string, userName: string) => {
  try {
    // En production, cette fonction devrait être appelée côté serveur
    // Pour le développement, on utilise le secret directement
    const response = await fetch('http://localhost:3001/api/generate-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userName,
        secret: getStreamConfig.secret,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Erreur génération token');
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Erreur génération token GetStream:', error);
    // Fallback pour développement - utiliser un token temporaire
    return null;
  }
};

// Fonction pour connecter un utilisateur
export const connectUser = async (userId: string, userName: string, userRole: string = 'user') => {
  try {
    const token = await generateUserToken(userId, userName);
    
    if (token) {
      await streamClient.connectUser(
        {
          id: userId,
          name: userName,
          role: userRole,
        },
        token
      );
      return true;
    } else {
      // Mode développement sans token
      console.log('Mode développement GetStream - pas de token');
      return false;
    }
  } catch (error) {
    console.error('Erreur connexion GetStream:', error);
    return false;
  }
};

// Fonction pour créer ou récupérer un channel
export const getChannel = async (channelType: string, channelId: string) => {
  try {
    const channel = streamClient.channel(channelType, channelId, {
      name: `Salon ${channelId}`,
      members: [streamClient.userID || 'admin'],
    });
    
    await channel.watch();
    return channel;
  } catch (error) {
    console.error('Erreur création channel GetStream:', error);
    return null;
  }
};
