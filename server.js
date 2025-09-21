const express = require('express');
const cors = require('cors');
const { StreamChat } = require('stream-chat');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuration GetStream
const API_KEY = 'wzt9bzcb6z9q';
const API_SECRET = 'z5qmahxqz26jfs569h6w255dugmqndvvgrtdk8y9wmqfqgmfvu59yp8c4qrv4aab';

// Initialiser le client Stream Chat
const serverClient = StreamChat.getInstance(API_KEY, API_SECRET);

// Route pour générer un token
app.get('/get-token', (req, res) => {
  try {
    const { user } = req.query;
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Paramètre user requis' 
      });
    }
    
    // Générer le token pour l'utilisateur
    const token = serverClient.createToken(user);
    
    console.log(`✅ Token généré pour l'utilisateur: ${user}`);
    
    res.json({ token });
    
  } catch (error) {
    console.error('❌ Erreur génération token:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du token' 
    });
  }
});

// Route de test
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Serveur Stream Chat Token actif',
    apiKey: API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Démarrer le serveur
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur Stream Chat Token démarré sur le port ${PORT}`);
  console.log(`📡 API Key: ${API_KEY}`);
  console.log(`🔗 Test: http://localhost:${PORT}/test`);
  console.log(`🎫 Token: http://localhost:${PORT}/get-token?user=toto`);
});