// Hook pour obtenir un token GetStream depuis l'API
import { useState, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:3001';

export const useStreamToken = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getToken = useCallback(async (userId) => {
    if (!userId) {
      setError('User ID requis');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/stream-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        return data.token;
      } else {
        throw new Error(data.error || 'Token non généré');
      }
    } catch (err) {
      console.error('❌ Erreur obtention token:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stream-token/test`);
      const data = await response.json();
      return true;
    } catch (err) {
      console.error('❌ Test API GetStream échoué:', err);
      return false;
    }
  }, []);

  return {
    getToken,
    testConnection,
    loading,
    error,
  };
};
