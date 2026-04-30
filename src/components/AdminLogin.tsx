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
      const { data, error: authError } = await signInAdmin(email, password);
      if (authError) {
        if (authError.message === 'Accès administrateur refusé') {
          setError('Accès refusé. Seuls les administrateurs peuvent se connecter ici.');
        } else {
          setError(authError.message || 'Email ou mot de passe incorrect.');
        }
        return;
      }
      if (data?.user) {
        onLogin(data);
      } else {
        setError('Erreur de connexion inattendue');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion. Veuillez réessayer.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl border border-gray-100">
        {/* Logo + titre */}
        <div className="flex flex-col items-center px-8 pt-8 pb-2">
          <img src="/faviconsansfond.webp" alt="TPLN" className="h-36 w-auto object-contain mb-2" />
          <h2 className="text-xl font-bold text-gray-900 mb-1">Connexion</h2>
          <p className="text-sm text-gray-400 mb-4">Espace administrateur</p>
        </div>

        {/* Formulaire */}
        <div className="px-8 pb-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2 text-sm">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isLoading && handleLogin()}
              disabled={isLoading}
              placeholder="votre@email.com"
              autoComplete="email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 text-sm">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isLoading && handleLogin()}
              disabled={isLoading}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-900 disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-3 rounded-[14px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #c9a84c, #a07830)', boxShadow: '0 4px 16px rgba(201,168,76,0.3)' }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connexion…
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
