const express = require('express');
const cors = require('cors');

// yarn add stream-chat
const { StreamChat } = require('stream-chat');

const app = express();
app.use(cors());
app.use(express.json());

// instantiate your stream client using the API key and secret
// the secret is only used server side and gives you full access to the API
// find your API keys here https://getstream.io/dashboard/
const serverClient = StreamChat.getInstance('wzt9bzcb6z9q', 'z5qmahxqz26jfs569h6w255dugmqndvvgrtdk8y9wmqfqgmfvu59yp8c4qrv4aab');

// Endpoint pour générer un token GetStream
app.post('/api/generate-token', (req, res) => {
  try {
    const { userId, userName } = req.body;
    
    if (!userId || !userName) {
      return res.status(400).json({ error: 'userId et userName requis' });
    }
    
    // generate a token for the user with id 'userId' (méthode officielle GetStream)
    const token = serverClient.createToken(userId);
    
    console.log(`✅ Token généré pour utilisateur: ${userId}`);
    
    res.json({ 
      token,
      userId,
      userName 
    });
    
  } catch (error) {
    console.error('❌ Erreur génération token:', error);
    res.status(500).json({ error: 'Erreur génération token' });
  }
});

// Endpoint de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Serveur GetStream Token actif' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Serveur GetStream Token démarré sur le port ${PORT}`);
});
