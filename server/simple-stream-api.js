// Serveur API simple pour GetStream
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Route pour générer un token GetStream (simulation)
app.post('/api/stream-token', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Simulation d'un token (en attendant la vraie config)
    const mockToken = `mock_token_${userId}_${Date.now()}`;
    
    res.status(200).json({ 
      token: mockToken,
      userId,
      success: true 
    });
    
    console.log('✅ Token GetStream simulé pour:', userId);
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
  res.json({ 
    message: 'API GetStream Token fonctionnelle',
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur API GetStream démarré sur le port ${PORT}`);
  console.log(`📡 Endpoint: http://localhost:${PORT}/api/stream-token`);
});

module.exports = app;
