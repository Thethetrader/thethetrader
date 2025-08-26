import React, { useState } from 'react'

interface AdminLoginProps {
  onLogin: () => void
}

const AdminLogin = ({ onLogin }: AdminLoginProps) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Identifiants admin (à changer selon vos préférences)
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'thethetrader2025'
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    console.log('Tentative de connexion:', { username, password })
    console.log('Identifiants attendus:', ADMIN_CREDENTIALS)

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      // Connexion réussie
      console.log('Connexion réussie!')
      localStorage.setItem('adminAuthenticated', 'true')
      onLogin()
    } else {
      console.log('Identifiants incorrects')
      setError('Identifiants incorrects')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-600 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">🔐 Accès Admin</h1>
          <p className="text-gray-400">Identifiants requis pour l'administration</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Entrez le nom d'utilisateur"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Entrez le mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-600/20 border border-red-600/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            🔑 Se connecter
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 mb-4">
            Accès réservé aux administrateurs
          </p>
          
          {/* Bouton d'installation PWA Admin */}
          <button
            onClick={() => {
              if ('serviceWorker' in navigator) {
                if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                  alert('Pour installer l\'app admin:\n1. Appuyez sur Partager 📤\n2. "Sur l\'écran d\'accueil"\n3. Confirmez');
                } else {
                  if (window.deferredPrompt) {
                    window.deferredPrompt.prompt();
                  } else {
                    alert('Utilisez le menu navigateur pour "Ajouter à l\'écran d\'accueil"');
                  }
                }
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            📱 Installer PWA Admin
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin 