const express = require('express');
const StreamChat = require('stream-chat').StreamChat;

const app = express();
const PORT = 3001;

// Configuration GetStream
const STREAM_API_KEY = 'apk7cmaduwd3';
const STREAM_API_SECRET = '5c6jpud3n7h7nv9sjjg926v47q3wspbfajv56n25pddsqkbtszr7t86gygjg34k2';

app.use(express.json());

// Endpoint pour générer un token utilisateur
app.post('/api/generate-token', async (req, res) => {
  try {
    const { userId, userName, userRole = 'user' } = req.body;
    
    if (!userId || !userName) {
      return res.status(400).json({ error: 'userId et userName requis' });
    }

    // Initialiser le client Stream côté serveur
    const serverClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);
    
    // Générer un token utilisateur
    const token = serverClient.createToken(userId);
    
    res.json({
      token,
      userId,
      userName,
      userRole
    });
    
  } catch (error) {
    console.error('Erreur génération token:', error);
    res.status(500).json({ error: 'Erreur génération token' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur token démarré sur le port ${PORT}`);
});
