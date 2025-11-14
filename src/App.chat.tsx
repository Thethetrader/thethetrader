import React from 'react';
import './index.css';
import { useAuth } from './hooks/useAuth';
import Auth from './components/Auth';
import ChatRoom from './components/ChatRoom';

const App: React.FC = () => {
  const { user, loading, error } = useAuth();

  // État de chargement initial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Gestion des erreurs d'authentification
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de connexion</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  // Affichage conditionnel selon l'état d'authentification
  if (!user) {
    return <Auth />;
  }

  // Utilisateur connecté - afficher le chat
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <ChatRoom
        channelId="general"
        channelName="Chat Général"
        onSignOut={() => {
          // La déconnexion est gérée par le hook useAuth
          console.log('Déconnexion demandée');
        }}
      />
    </div>
  );
};

export default App;