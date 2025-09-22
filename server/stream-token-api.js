// API GetStream Chat - Génération de tokens JWT
const express = require('express');
const cors = require('cors');
const { StreamChat } = require('stream-chat');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration GetStream - TES CLÉS
const STREAM_API_KEY = 'apk7cmaduwd3';
const STREAM_API_SECRET = '5c6jpud3n7h7nv9sjjg926v47q3wspbfajv56n25pddsqkbtszr7t86gygjg34k2';

// Client serveur GetStream - SYNTAXE CORRECTE
const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);

// Middleware
app.use(cors());
app.use(express.json());

// Route pour générer un token utilisateur
app.post('/api/stream-token', async (req, res) => {
  try {
    const { userId, userName, userEmail } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }

    // Générer le token JWT avec la syntaxe correcte
    const token = serverClient.createToken(userId);
    
    // Créer ou mettre à jour l'utilisateur dans GetStream
    await serverClient.upsertUser({
      id: userId,
      name: userName || userEmail || 'User',
      email: userEmail || `${userId}@example.com`,
      image: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || userEmail || 'User')}&background=random`
    });

    console.log(`✅ Token généré pour l'utilisateur: ${userId}`);

    res.status(200).json({ 
      token,
      apiKey: STREAM_API_KEY,
      userId 
    });

  } catch (error) {
    console.error('❌ Erreur génération token:', error);
    res.status(500).json({ 
      error: 'Failed to generate token',
      details: error.message 
    });
  }
});

// Route de test
app.get('/api/stream-token/test', (req, res) => {
  res.status(200).json({ 
    message: '🚀 GetStream API fonctionnelle!',
    apiKey: STREAM_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    service: 'GetStream Token API',
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur GetStream API démarré sur le port ${PORT}`);
  console.log(`📡 Endpoint Token: http://localhost:${PORT}/api/stream-token`);
  console.log(`🔍 Test: http://localhost:${PORT}/api/stream-token/test`);
});

module.exports = app;