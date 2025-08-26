import React, { useState, useEffect } from 'react';
import './index.css';
import SignalsAdmin from './components/SignalsAdmin';
import AdminLogin from './components/AdminLogin';

const AdminApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérifier si l'admin est déjà connecté
    const adminAuth = localStorage.getItem('adminAuthenticated') === 'true';
    setIsAuthenticated(adminAuth);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return (
      <div className="relative">
        <SignalsAdmin />
        <button 
          onClick={handleLogout} 
          className="hidden md:block fixed bottom-4 left-4 bg-gray-700/80 text-gray-300 p-2 rounded-full hover:bg-gray-600/80 hover:text-white transition-all duration-200 shadow-lg z-50 backdrop-blur-sm" 
          title="Retour accueil"
        >
          🏠
        </button>
      </div>
    );
  }

  return <AdminLogin onLogin={handleLogin} />;
};

export default AdminApp; 