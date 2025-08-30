# Configuration Discord Webhook

## 🎯 Objectif
Configurer les notifications Discord pour le système de livestream.

## 📋 Étapes de configuration

### 1. Créer un webhook Discord
1. Ouvrez votre serveur Discord
2. Allez dans **Paramètres du serveur** > **Intégrations** > **Webhooks**
3. Cliquez sur **Nouveau Webhook**
4. Nommez-le "TheTheTrader Stream Bot"
5. Choisissez le canal où envoyer les notifications
6. Copiez l'URL du webhook

### 2. Configurer l'application
1. Créez un fichier `.env.local` à la racine du projet
2. Ajoutez cette ligne :
```
VITE_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/VOTRE_URL_ICI
```

### 3. Test
1. Redémarrez le serveur de développement
2. Connectez-vous en tant qu'admin
3. Cliquez sur "Lancer Stream" dans la sidebar
4. Vérifiez que la notification apparaît sur Discord

## 🚀 Fonctionnalités

### Notifications automatiques :
- **Stream lancé** : Notification @everyone avec embed rouge
- **Stream arrêté** : Notification discrète avec embed gris  
- **Utilisateur rejoint** : Notification avec embed vert

### Format des messages :
- **Embeds Discord** avec couleurs et champs
- **Timestamp** automatique
- **Avatar et nom** du bot personnalisés
- **Ping @everyone** pour le début de stream

## 🔧 Personnalisation

Vous pouvez modifier les messages dans `src/utils/discord-webhook.ts` :
- Couleurs des embeds
- Contenu des messages
- Avatar du bot
- Rôles à mentionner