const express = require('express');
const cors = require('cors');
const { StreamChat } = require('stream-chat');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration GetStream
const API_KEY = 'wzt9bzcb6z9q';
const API_SECRET = 'z5qmahxqz26jfs569h6w255dugmqndvvgrtdk8y9wmqfqgmfvu59yp8c4qrv4aab';

// Créer le client serveur GetStream
const serverClient = StreamChat.getInstance(API_KEY, API_SECRET);

// Endpoint pour générer un token
app.get('/get-token', (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }
    
    // Générer le token avec le vrai secret (côté serveur)
    const token = serverClient.createToken(userId);
    
    console.log(`✅ Token généré pour utilisateur: ${userId}`);
    
    res.json({ 
      token,
      userId,
      apiKey: API_KEY
    });
    
  } catch (error) {
    console.error('❌ Erreur génération token:', error);
    res.status(500).json({ error: 'Erreur génération token' });
  }
});

// Endpoint de test
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Serveur GetStream Token actif',
    apiKey: API_KEY,
    status: 'OK'
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur GetStream Token démarré sur le port ${PORT}`);
  console.log(`📡 API Key: ${API_KEY}`);
  console.log(`🔗 Test: http://localhost:${PORT}/test`);
  console.log(`🎫 Token: http://localhost:${PORT}/get-token?userId=toto`);
});
