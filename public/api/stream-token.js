import { serverClient } from '../../src/lib/stream.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    const token = serverClient.createToken(userId);
    res.status(200).json({ token });
  } catch (error) {
    console.error('Erreur génération token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
}
