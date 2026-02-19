import React, { useState } from 'react';
import { signInAdmin } from '../lib/supabase';

interface AdminLoginProps {
  onLogin: (userData: any) => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Tentative de connexion admin:', email);

      // Appel direct sans timeout complexe - Supabase gère déjà les timeouts
      const { data, error: authError } = await signInAdmin(email, password);

      if (authError) {
        console.error('❌ Erreur authentification admin:', authError.message);
        if (authError.message === 'Connexion expirée. Vérifiez le réseau ou réessayez.') {
          setError('Connexion trop lente. Vérifiez votre connexion internet et réessayez.');
        } else if (authError.message === 'Accès administrateur refusé') {
          setError('Accès refusé. Seuls les administrateurs peuvent se connecter ici.');
        } else {
          setError(authError.message || 'Email ou mot de passe incorrect.');
        }
        return;
      }

      if (data?.user) {
        console.log('✅ Connexion admin réussie:', data.user.email);
        onLogin(data);
      } else {
        setError('Erreur de connexion inattendue');
      }
    } catch (error) {
      console.error('❌ Erreur connexion admin:', error);
      const msg = error instanceof Error ? error.message : 'Erreur de connexion. Veuillez réessayer.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-white text-2xl font-bold mb-6 text-center">
          🔐 Accès Admin
        </h2>

        {error && (
          <div className="bg-red-600 text-white p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email administrateur"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="w-full p-3 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 disabled:opacity-50"
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="w-full p-3 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 disabled:opacity-50"
            autoComplete="current-password"
          />

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-400 text-xs">
            🔒 Authentification Supabase sécurisée
          </p>
        </div>
      </div>
    </div>
  );
}