import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';

export default function StreamChatDebug({ user }) {
  const [status, setStatus] = useState('Initialisation...');
  const [client, setClient] = useState(null);

  useEffect(() => {
    if (user) {
      initStream();
    }
  }, [user]);

  const initStream = async () => {
    try {
      setStatus('Création client...');
      const streamClient = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY || 'apk7cmaduwd3');
      
      setStatus('Génération token...');
      const response = await fetch('http://localhost:3001/api/stream-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      const { token } = await response.json();
      
      setStatus('Connexion utilisateur...');
      await streamClient.connectUser({
        id: user.id,
        name: user.email || 'User'
      }, token);
      
      setStatus('✅ CONNECTÉ !');
      setClient(streamClient);
      
    } catch (error) {
      setStatus('❌ ERREUR: ' + error.message);
      console.error('Erreur détaillée:', error);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h3>🔍 Debug GetStream</h3>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>User:</strong> {user ? user.email : 'Aucun'}</p>
      <p><strong>Client:</strong> {client ? 'Créé' : 'Null'}</p>
      {client && <p className="text-green-600">🎉 GetStream fonctionne !</p>}
    </div>
  );
}
