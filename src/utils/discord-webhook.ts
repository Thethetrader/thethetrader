// Configuration webhook Discord pour notifications livestream

// URL webhook Discord (à configurer dans les variables d'environnement)
const DISCORD_WEBHOOK_URL = process.env.VITE_DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1411378932183203890/knr0qdmj9psYNiKO6bylp9_U2jE-B4iUgO7XE79ct_96bk53qUFuHy_dxAf2jlQESnGO';

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  timestamp: string;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
}

interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

/**
 * Envoie une notification Discord via webhook
 */
export const sendDiscordNotification = async (message: DiscordMessage): Promise<boolean> => {
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Erreur webhook Discord:', response.statusText);
      return false;
    }

    console.log('✅ Notification Discord envoyée');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du webhook Discord:', error);
    return false;
  }
};

/**
 * Notification de démarrage de stream
 */
export const notifyStreamStarted = async (): Promise<boolean> => {
  const embed: DiscordEmbed = {
    title: '🔴 Stream Trading EN DIRECT !',
    description: 'Une nouvelle session de trading en direct vient de commencer !',
    color: 0xFF0000, // Rouge
    timestamp: new Date().toISOString(),
    fields: [
      {
        name: '📺 Statut',
        value: 'EN DIRECT',
        inline: true,
      },
      {
        name: '⏰ Heure',
        value: new Date().toLocaleTimeString('fr-FR'),
        inline: true,
      },
      {
        name: '🚀 Action',
        value: 'Rejoignez le stream maintenant !',
        inline: false,
      },
    ],
  };

  return await sendDiscordNotification({
    content: '@everyone 🔥 **STREAM LIVE** 🔥',
    embeds: [embed],
    username: 'TheTheTrader Bot',
    avatar_url: 'https://i.imgur.com/4M34hi2.png', // Logo du bot
  });
};

/**
 * Notification d'arrêt de stream
 */
export const notifyStreamEnded = async (): Promise<boolean> => {
  const embed: DiscordEmbed = {
    title: '⏹️ Stream Terminé',
    description: 'La session de trading en direct est terminée.',
    color: 0x808080, // Gris
    timestamp: new Date().toISOString(),
    fields: [
      {
        name: '📺 Statut',
        value: 'HORS LIGNE',
        inline: true,
      },
      {
        name: '⏰ Fin',
        value: new Date().toLocaleTimeString('fr-FR'),
        inline: true,
      },
    ],
  };

  return await sendDiscordNotification({
    embeds: [embed],
    username: 'TheTheTrader Bot',
    avatar_url: 'https://i.imgur.com/4M34hi2.png',
  });
};

/**
 * Notification qu'un utilisateur rejoint le stream
 */
export const notifyUserJoined = async (username: string = 'Utilisateur'): Promise<boolean> => {
  const embed: DiscordEmbed = {
    title: '👥 Nouveau Spectateur',
    description: `${username} vient de rejoindre le stream !`,
    color: 0x00FF00, // Vert
    timestamp: new Date().toISOString(),
    fields: [
      {
        name: '🚀 Spectateur',
        value: username,
        inline: true,
      },
      {
        name: '⏰ Heure',
        value: new Date().toLocaleTimeString('fr-FR'),
        inline: true,
      },
    ],
  };

  return await sendDiscordNotification({
    embeds: [embed],
    username: 'TheTheTrader Bot',
    avatar_url: 'https://i.imgur.com/4M34hi2.png',
  });
};