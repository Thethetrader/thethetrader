import React, { useState, useEffect } from 'react';
import './index.css';
import TradingPlatformShell from './components/generated/TradingPlatformShell';
import { useNotifications } from './hooks/use-notifications';
import { usePWA } from './hooks/use-pwa';

// FORCE DEPLOYMENT: 2025-01-13 04:25:00 - FIX OLD CONTENT

// Types
interface User {
  id: string;
  email: string;
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [activeChannel, setActiveChannel] = useState('crypto-signaux');
  
  // Hook pour les notifications
  const { permission, requestPermission, sendTestNotification } = useNotifications();
  
  // Hook pour détecter PWA
  const { isPWA } = usePWA();
  
  // Empêcher le scroll en PWA
  useEffect(() => {
    if (isPWA) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isPWA]);

  // Précharger l'image pour éviter le clignotement
  useEffect(() => {
    const img = new Image();
    img.src = '/images/tradingview-chart.png';
  }, []);

  const channelData: Record<string, any> = {
    'crypto-signaux': {
      title: '#crypto-signaux',
      messages: [
        { 
          id: 1, 
          user: 'TheTheTrader', 
          time: '02:03:22', 
          type: 'signal', 
          status: 'ACTIVE',
          content: {
            title: '🟢 Signal BUY BTCUSD Futures – 1 min',
            details: [
              { icon: '🔹', label: 'Entrée', value: '103474.00 USD' },
              { icon: '🔹', label: 'Stop Loss', value: '102862.00 USD' },
              { icon: '🔹', label: 'Take Profit', value: '104626.00 USD' },
              { icon: '🎯', label: 'Ratio R:R', value: '≈ 1.88' }
            ],
            reactions: [
              { emoji: '🔥', count: 12 },
              { emoji: '💎', count: 8 },
              { emoji: '🚀', count: 15 }
            ]
          }
        },
        { 
          id: 2, 
          user: 'TheTheTrader', 
          time: '02:06:33', 
          type: 'update', 
          content: 'Signal précédent: Objectif 1 atteint ! 🎯\n\n+1.2% en 3 minutes - félicitations à tous les membres qui ont suivi 🔥', 
          reactions: [
            { emoji: '🎉', count: 24 },
            { emoji: '💰', count: 18 },
            { emoji: '🚀', count: 12 }
          ]
        },
        { 
          id: 3, 
          user: 'TheTheTrader', 
          time: '02:15:45', 
          type: 'signal', 
          status: 'ACTIVE',
          content: {
            title: '🔴 Signal SELL ETHUSD Futures – 5 min',
            details: [
              { icon: '🔹', label: 'Entrée', value: '2845.50 USD' },
              { icon: '🔹', label: 'Stop Loss', value: '2875.20 USD' },
              { icon: '🔹', label: 'Take Profit', value: '2815.80 USD' },
              { icon: '🎯', label: 'Ratio R:R', value: '≈ 1.65' }
            ],
            reactions: [
              { emoji: '⚡', count: 9 },
              { emoji: '📉', count: 6 },
              { emoji: '💎', count: 11 }
            ]
          }
        }
      ]
    },
    'forex-signaux': {
      title: '#forex-signaux',
      messages: [
        { 
          id: 1, 
          user: 'TheTheTrader', 
          time: '01:45:12', 
          type: 'signal', 
          status: 'ACTIVE',
          content: {
            title: '🟢 Signal BUY EURUSD – 15 min',
            details: [
              { icon: '🔹', label: 'Entrée', value: '1.0845 EUR' },
              { icon: '🔹', label: 'Stop Loss', value: '1.0820 EUR' },
              { icon: '🔹', label: 'Take Profit', value: '1.0895 EUR' },
              { icon: '🎯', label: 'Ratio R:R', value: '≈ 2.00' }
            ],
            reactions: [
              { emoji: '💶', count: 15 },
              { emoji: '🚀', count: 9 }
            ]
          }
        },
        { 
          id: 2, 
          user: 'TheTheTrader', 
          time: '01:52:30', 
          type: 'update', 
          content: '✅ Signal GBPUSD fermé en profit +45 pips\n📈 Excellent momentum sur les paires EUR today', 
          reactions: [
            { emoji: '💸', count: 21 },
            { emoji: '🎯', count: 12 }
          ]
        },
        { 
          id: 3, 
          user: 'TheTheTrader', 
          time: '02:10:15', 
          type: 'signal', 
          status: 'ACTIVE',
          content: {
            title: '🔴 Signal SELL USDJPY – 30 min',
            details: [
              { icon: '🔹', label: 'Entrée', value: '148.25 JPY' },
              { icon: '🔹', label: 'Stop Loss', value: '148.85 JPY' },
              { icon: '🔹', label: 'Take Profit', value: '147.45 JPY' },
              { icon: '🎯', label: 'Ratio R:R', value: '≈ 1.75' }
            ],
            reactions: [
              { emoji: '🇯🇵', count: 8 },
              { emoji: '📉', count: 12 },
              { emoji: '💎', count: 6 }
            ]
          }
        }
      ]
    },
    'futures-signaux': {
      title: '#futures-signaux',
      messages: [
        { 
          id: 1, 
          user: 'TheTheTrader', 
          time: '01:30:45', 
          type: 'signal', 
          status: 'ACTIVE',
          content: {
            title: '🟡 Signal BUY GOLD Futures – 1H',
            details: [
              { icon: '🔹', label: 'Entrée', value: '2045.50 USD' },
              { icon: '🔹', label: 'Stop Loss', value: '2038.20 USD' },
              { icon: '🔹', label: 'Take Profit', value: '2058.80 USD' },
              { icon: '🎯', label: 'Ratio R:R', value: '≈ 1.85' }
            ],
            reactions: [
              { emoji: '🥇', count: 18 },
              { emoji: '📈', count: 11 }
            ]
          }
        },
        { 
          id: 2, 
          user: 'TheTheTrader', 
          time: '02:05:20', 
          type: 'signal', 
          status: 'ACTIVE',
          content: {
            title: '🟢 Signal BUY SP500 Futures – 4H',
            details: [
              { icon: '🔹', label: 'Entrée', value: '4850.25 USD' },
              { icon: '🔹', label: 'Stop Loss', value: '4835.80 USD' },
              { icon: '🔹', label: 'Take Profit', value: '4880.50 USD' },
              { icon: '🎯', label: 'Ratio R:R', value: '≈ 2.10' }
            ],
            reactions: [
              { emoji: '📊', count: 14 },
              { emoji: '🚀', count: 9 },
              { emoji: '💎', count: 7 }
            ]
          }
        }
      ]
    },
    'education': {
      title: '#education',
      messages: [
        { 
          id: 1, 
          user: 'TheTheTrader', 
          time: '09:00:00', 
          type: 'message', 
          content: '📚 Cours du jour: Les bases du Money Management\n\n🎯 Règle #1: Ne jamais risquer plus de 2% par trade\n💰 Règle #2: Toujours définir votre SL avant d\'entrer', 
          reactions: [
            { emoji: '📖', count: 45 },
            { emoji: '💡', count: 32 },
            { emoji: '🎓', count: 28 }
          ]
        },
        { 
          id: 2, 
          user: 'TheTheTrader', 
          time: '09:15:30', 
          type: 'message', 
          content: '📊 Exercice pratique: Calculez votre position size\n\nCompte: 10,000€\nRisque max: 2%\nDistance SL: 50 pips\n\nQuelle lot size utilisez-vous? 🤔', 
          reactions: [
            { emoji: '🧮', count: 23 },
            { emoji: '🤔', count: 15 }
          ]
        },
        { 
          id: 3, 
          user: 'TheTheTrader', 
          time: '10:30:00', 
          type: 'message', 
          content: '📈 Analyse technique: Les 3 niveaux clés\n\n🔹 Support: Zone où le prix rebondit\n🔹 Résistance: Zone où le prix recule\n🔹 Breakout: Rupture d\'un niveau\n\nQuel niveau surveillez-vous aujourd\'hui? 📊', 
          reactions: [
            { emoji: '📊', count: 31 },
            { emoji: '🎯', count: 18 },
            { emoji: '💡', count: 12 }
          ]
        }
             ]
     },
    'calendar': {
      title: '📅 Calendrier',
      messages: [
        { 
          id: 1, 
          user: 'TheTheTrader', 
          time: '08:00:00', 
          type: 'calendar', 
          content: '📊 Performance Trading - Janvier 2025',
          calendarData: {
            stats: {
              winRate: '78',
              totalPnL: '+2,450€',
              totalTrades: 28,
              bestDay: '+156€',
              worstDay: '-89€'
            },
            days: [
              { date: 1, trades: 2, pnl: '+45€', status: 'win' },
              { date: 2, trades: 1, pnl: '+12€', status: 'win' },
              { date: 3, trades: 3, pnl: '-23€', status: 'loss' },
              { date: 4, trades: 0, pnl: '0€', status: 'none' },
              { date: 5, trades: 0, pnl: '0€', status: 'none' },
              { date: 6, trades: 2, pnl: '+67€', status: 'win' },
              { date: 7, trades: 1, pnl: '0€', status: 'be' },
              { date: 8, trades: 2, pnl: '+89€', status: 'win' },
              { date: 9, trades: 3, pnl: '+156€', status: 'win' },
              { date: 10, trades: 1, pnl: '-45€', status: 'loss' },
              { date: 11, trades: 0, pnl: '0€', status: 'none' },
              { date: 12, trades: 0, pnl: '0€', status: 'none' },
              { date: 13, trades: 2, pnl: '+34€', status: 'win' },
              { date: 14, trades: 1, pnl: '0€', status: 'be' },
              { date: 15, trades: 2, pnl: '+78€', status: 'win' }
            ]
          },
          reactions: [
            { emoji: '📈', count: 34 },
            { emoji: '💰', count: 28 },
            { emoji: '🔥', count: 19 }
          ]
        }
      ]
    }
   };

  const currentMessages = channelData[activeChannel]?.messages || [];



  const handleLogin = () => {
    if (email && password) {
      setUser({ id: '1', email });
      setShowAuthModal(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEmail('');
    setPassword('');
  };

  // Si utilisateur connecté, afficher ton salon complet
  if (user) {
    return (
      <div className="relative">
        {/* Ton salon complet */}
        <TradingPlatformShell />
        
        {/* Petit logo déconnexion en bas à gauche - Desktop seulement */}
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation - Masquée en PWA */}
      {!isPWA && (
        <nav className="flex items-center justify-between p-4 sm:p-6 relative z-50">
          <div className="text-xl sm:text-2xl font-bold text-white">
            TheTheTrader
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#services" className="text-gray-300 hover:text-white transition-all duration-200">Services</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-all duration-200">À propos</a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-all duration-200">Contact</a>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={permission === 'granted' ? sendTestNotification : requestPermission}
              className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                permission === 'granted' 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
              title={permission === 'granted' ? 'Test notification' : 'Activer notifications'}
            >
              {permission === 'granted' ? '🔔' : '🔕'}
            </button>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold hover:opacity-90 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Se connecter</span>
              <span className="sm:hidden">Login</span>
            </button>
          </div>
        </nav>
      )}

      {/* Version PWA - Page fixe sans scroll */}
      {isPWA ? (
        <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col justify-center items-center px-4 sm:px-6">
          {/* Logo en haut */}
          <div className="text-xl sm:text-2xl font-bold text-white mb-8">
            TheTheTrader
          </div>
          
          {/* Hero Section - Centré */}
          <div className="text-center flex-1 flex flex-col justify-center">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Smart Model,<br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Smarter Signal
              </span>
            </h1>
            <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Un setup, des signaux expliqués, un journal de performance. Rejoins la communauté et trade en confiance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:opacity-90 w-full sm:w-auto"
              >
                Commencer maintenant
              </button>
            </div>

            {/* Barre de défilement - Full Width */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-6 overflow-hidden relative w-screen -mx-4 sm:-mx-6">
              <div className="whitespace-nowrap animate-scroll">
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Section - Mobile Optimized */}
          <div className="text-center pt-10 sm:pt-20 pb-0 px-4 sm:px-6">
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Smart Model,<br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Smarter Signal
              </span>
            </h1>
            <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Un setup, des signaux expliqués, un journal de performance. Rejoins la communauté et trade en confiance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-20 px-4">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:opacity-90 w-full sm:w-auto"
              >
                Commencer maintenant
              </button>
            </div>

            {/* Barre de défilement - Full Width */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-6 overflow-hidden relative mb-6 sm:mb-10 w-screen -mx-4 sm:-mx-6">
              <div className="whitespace-nowrap animate-scroll">
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
              </div>
            </div>



            {/* Aperçu de la plateforme - Mobile Optimized */}
            <div className="max-w-7xl mx-auto mb-6 sm:mb-10 px-2 sm:px-4">
              <div className="bg-gray-800/50 p-2 sm:p-6 rounded-xl border border-gray-600/50 backdrop-blur-sm">
                {/* Mockup de l'interface */}
                <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
                  {/* Header du salon - Mobile Optimized */}
                  <div className="bg-gray-800 p-3 sm:p-4 flex items-center justify-between border-b border-gray-700">
                    <div className="flex items-center gap-3 sm:gap-3 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">TT</div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                        <span className="text-white font-semibold text-sm sm:text-base">TheTheTrader</span>
                        <span className="text-gray-400 text-xs sm:text-sm hidden sm:inline">En ligne</span>
                      </div>
                    </div>
                    <div className="text-blue-400 font-semibold text-sm sm:text-base text-center">{channelData[activeChannel]?.title || '#crypto-signaux'}</div>
                    <div></div>
                  </div>
                  
                  {/* Zone principale - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row h-[750px] sm:h-[750px]">
                    {/* Sidebar - Mobile: Horizontal scroll, Desktop: Vertical */}
                    <div className="w-full sm:w-60 bg-gray-800 p-3 sm:p-4 border-b sm:border-b-0 sm:border-r border-gray-700 sm:h-full overflow-x-auto sm:overflow-x-visible">
                      
                      {/* Mobile: Horizontal tabs - Section plus haute pour voir tous les salons */}
                      <div className="sm:hidden flex gap-3 mb-4 overflow-x-auto pl-2 pr-4 pt-4 pb-6">
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[100px] ${
                            activeChannel === 'crypto-signaux' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('crypto-signaux')}
                        >
                          🪙 Crypto
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[90px] ${
                            activeChannel === 'forex-signaux' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('forex-signaux')}
                        >
                          💱 Forex
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[100px] ${
                            activeChannel === 'futures-signaux' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('futures-signaux')}
                        >
                          📈 Futures
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[100px] ${
                            activeChannel === 'education' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('education')}
                        >
                          📚 Education
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[100px] ${
                            activeChannel === 'calendar' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('calendar')}
                        >
                          📅 Calendrier
                        </div>
                      </div>

                      {/* Desktop: Vertical sidebar */}
                      <div className="hidden sm:block space-y-2">
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                            activeChannel === 'crypto-signaux' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('crypto-signaux')}
                        >
                          🪙 Crypto Signaux
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                            activeChannel === 'forex-signaux' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('forex-signaux')}
                        >
                          💱 Forex Signaux
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                            activeChannel === 'futures-signaux' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('futures-signaux')}
                        >
                          📈 Futures Signaux
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                            activeChannel === 'education' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('education')}
                        >
                          📚 Education
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                            activeChannel === 'calendar' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('calendar')}
                        >
                          📅 Calendrier
                        </div>
                      </div>
                    </div>

                    {/* Zone de contenu principale */}
                    <div className="flex-1 bg-gray-900 flex flex-col">
                      {/* Zone de messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {channelData[activeChannel]?.messages?.map((message: any, index: number) => (
                          <div key={index} className="bg-gray-800 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">TT</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-white font-semibold">{message.user}</span>
                                  <span className="text-gray-400 text-sm">{message.time}</span>
                                </div>
                                {message.type === 'signal' ? (
                                  <div className="bg-gray-700 rounded-lg p-3">
                                    <div className="text-white font-semibold mb-2">{message.content.title}</div>
                                    <div className="space-y-1">
                                      {message.content.details.map((detail: any, idx: number) => (
                                        <div key={idx} className="text-gray-300 text-sm">
                                          {detail.icon} {detail.label}: {detail.value}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                      {message.content.reactions.map((reaction: any, idx: number) => (
                                        <button key={idx} className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-sm text-white">
                                          {reaction.emoji} {reaction.count}
                                        </button>
                                      ))}
                                    </div>


                                    


                                  </div>
                                ) : message.type === 'calendar' ? (
                                  <div className="bg-gray-700 rounded-lg p-6">
                                    <div className="text-white font-semibold mb-6 text-lg">{message.content}</div>
                                    
                                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                                      {/* Calendrier principal */}
                                      <div className="flex-1">
                                        {/* Jours de la semaine */}
                                        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4">
                                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                            <div key={day} className="text-center text-gray-400 font-semibold py-3 text-sm uppercase tracking-wide">
                                              {day.substring(0, 3)}
                                            </div>
                                          ))}
                                        </div>

                                        {/* Grille du calendrier */}
                                        <div className="grid grid-cols-7 gap-1 md:gap-2">
                                          {message.calendarData.days.map((day: any, idx: number) => (
                                            <div 
                                              key={idx} 
                                              className={`border-2 rounded-lg h-16 md:h-24 p-1 md:p-2 cursor-pointer transition-all hover:shadow-md ${
                                                day.status === 'win' ? 'bg-green-500/60 border-green-400/50 text-white' :
                                                day.status === 'loss' ? 'bg-red-500/60 border-red-400/50 text-white' :
                                                day.status === 'be' ? 'bg-blue-500/60 border-blue-400/50 text-white' :
                                                'bg-gray-700 border-gray-600 text-gray-400'
                                              }`}
                                            >
                                              <div className="flex flex-col h-full justify-between">
                                                <div className="text-xs md:text-sm font-semibold">{day.date}</div>
                                                {day.trades > 0 && (
                                                  <div className="text-xs font-bold text-center hidden md:block">
                                                    {day.trades} signal{day.trades > 1 ? 's' : ''}
                                                  </div>
                                                )}
                                                <div className="text-xs font-bold">{day.pnl}</div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {/* Légende */}
                                        <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-600">
                                          <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-green-500/60 border border-green-400/50 rounded"></div>
                                            <span className="text-sm text-gray-300">WIN</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-red-500/60 border border-red-400/50 rounded"></div>
                                            <span className="text-sm text-gray-300">LOSS</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-blue-500/60 border border-blue-400/50 rounded"></div>
                                            <span className="text-sm text-gray-300">BREAK EVEN</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-gray-700 border border-gray-600 rounded"></div>
                                            <span className="text-sm text-gray-300">NO TRADE</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Panneau des statistiques */}
                                      <div className="w-full lg:w-80 bg-gray-800 rounded-xl p-4 md:p-6">
                                        <h3 className="text-lg font-bold text-white mb-6">Statistiques Signaux</h3>
                                        
                                        {/* Métriques principales */}
                                        <div className="space-y-4 mb-8">
                                          {/* P&L Total */}
                                          <div className="bg-green-600/20 border-green-500/30 border rounded-lg p-4">
                                            <div className="text-sm text-green-300 mb-1">P&L Total</div>
                                            <div className="text-2xl font-bold text-green-200">{message.calendarData.stats.totalPnL}</div>
                                          </div>

                                          {/* Win Rate */}
                                          <div className="bg-blue-600/20 border-blue-500/30 rounded-lg p-4 border">
                                            <div className="text-sm text-blue-300 mb-1">Win Rate</div>
                                            <div className="text-2xl font-bold text-blue-200">{message.calendarData.stats.winRate}%</div>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                                              <div className="text-xs text-gray-400 mb-1">Aujourd'hui</div>
                                              <div className="text-lg font-bold text-blue-400">3</div>
                                            </div>
                                            <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                                              <div className="text-xs text-gray-400 mb-1">Ce mois</div>
                                              <div className="text-lg font-bold text-white">{message.calendarData.stats.totalTrades}</div>
                                            </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                                              <div className="text-xs text-gray-400 mb-1">Avg Win</div>
                                              <div className="text-lg font-bold text-green-400">+$89</div>
                                            </div>
                                            <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                                              <div className="text-xs text-gray-400 mb-1">Avg Loss</div>
                                              <div className="text-lg font-bold text-red-400">-$34</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-gray-300 whitespace-pre-line">{message.content}</div>
                                )}
                                {message.reactions && (
                                  <div className="flex gap-2 mt-2">
                                    {message.reactions.map((reaction: any, idx: number) => (
                                      <button key={idx} className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-sm text-white">
                                        {reaction.emoji} {reaction.count}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Zone de saisie */}
                      <div className="p-4 border-t border-gray-700">
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Tapez votre message..." 
                            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                            Envoyer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* Footer - Mobile Optimized - Masqué en PWA */}
          {!isPWA && (
            <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 sm:py-20 px-4 sm:px-6 mt-0">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 sm:gap-8">
                  {/* TheTheTrader */}
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">TheTheTrader</h4>
                    <div className="space-y-3">
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">À propos</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Équipe</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Carrières</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Blog</a>
                    </div>
                  </div>

                  {/* Trading */}
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Trading</h4>
                    <div className="space-y-3">
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Signaux Crypto</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Signaux Forex</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Futures</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Calendrier</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Analytics</a>
                    </div>
                  </div>

                  {/* Formation */}
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Formation</h4>
                    <div className="space-y-3">
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Cours Débutant</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Stratégies Avancées</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Gestion des Risques</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Analyse Technique</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Support</a>
                    </div>
                  </div>

                  {/* Légal */}
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Légal</h4>
                    <div className="space-y-3">
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Conditions d'utilisation</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Politique de confidentialité</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Mentions légales</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Avertissement sur les risques</a>
                    </div>
                  </div>
                </div>

                {/* Ligne de séparation et nom du site */}
                <div className="border-t border-purple-700/50 mt-16 pt-8">
                  <div className="text-center">
                    <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
                      TheTheTrader
                    </h1>
                    <p className="text-gray-400 text-sm mt-4">© 2025 TheTheTrader. Trading avec simplicité.</p>
                  </div>
                </div>
              </div>
            </footer>
          )}
        </>
      )}

      {/* Modal d'authentification */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Connexion</h2>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="votre@email.com"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="••••••••"
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:opacity-90"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;