import React, { useState } from 'react';

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Identifiants spéciaux admin
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('adminAuthenticated', 'true');
      onLogin();
    } else {
      alert('Identifiants incorrects');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-white text-2xl font-bold mb-6 text-center">
          🔐 Accès Admin
        </h2>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          />
          
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500"
          />
          
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}