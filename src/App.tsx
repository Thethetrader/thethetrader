import React, { useState, useEffect } from 'react';
import './index.css';
import TradingPlatformShell from './components/generated/TradingPlatformShell';

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
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [activeChannel, setActiveChannel] = useState('crypto-signaux');
  
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
        }
      ]
    },
    'formation': {
      title: '#formation',
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
        }
             ]
     },
    'calendrier': {
      title: '📅 calendrier',
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

  // Animation conversation progressive avec CSS
  useEffect(() => {
    setVisibleMessages(0);
    currentMessages.forEach((_, index) => {
      setTimeout(() => {
        setVisibleMessages(index + 1);
      }, index * 200); // 200ms entre chaque message
    });
  }, [currentMessages, activeChannel]);

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
        
        {/* Petit logo déconnexion en bas à gauche */}
        <button 
          onClick={handleLogout}
          className="fixed bottom-4 left-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all duration-200 shadow-lg z-50"
          title="Retour accueil"
        >
          🏠
        </button>
      </div>
    );
  }



  // Landing Page
  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen w-full">
      {/* Header */}
      <nav className="flex items-center justify-between p-6 relative z-50">
        <div className="text-2xl font-bold text-white">
          TheTheTrader
        </div>
                  <div className="hidden md:flex space-x-8">
            <a href="#services" className="text-gray-300 hover:text-white transition-all duration-200">Services</a>
            <a href="#about" className="text-gray-300 hover:text-white transition-all duration-200">À propos</a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-all duration-200">Contact</a>
          </div>
        <button 
          onClick={() => setShowAuthModal(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90"
        >
          Se connecter
        </button>
      </nav>



      {/* Hero Section */}
      <div className="text-center pt-20 pb-0 px-6">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
          Smart Model,<br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Smarter Signal
          </span>
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Un setup, des signaux expliqués, un journal de performance. Rejoins la communauté et trade en confiance.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <button 
            onClick={() => setShowAuthModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90"
          >
            Commencer maintenant
          </button>
          <button className="border border-gray-400 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-80">
            Voir la démo
          </button>
        </div>

        {/* Barre de défilement - 2x plus grosse sur toute la largeur */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 overflow-hidden relative mb-10">
          <div className="whitespace-nowrap animate-scroll">
            <span className="text-4xl font-bold mx-16">EASY SETUP EASY TRADING</span>
            <span className="text-4xl font-bold mx-16">EASY SETUP EASY TRADING</span>
            <span className="text-4xl font-bold mx-16">EASY SETUP EASY TRADING</span>
            <span className="text-4xl font-bold mx-16">EASY SETUP EASY TRADING</span>
            <span className="text-4xl font-bold mx-16">EASY SETUP EASY TRADING</span>
            <span className="text-4xl font-bold mx-16">EASY SETUP EASY TRADING</span>
            <span className="text-4xl font-bold mx-16">EASY SETUP EASY TRADING</span>
            <span className="text-4xl font-bold mx-16">EASY SETUP EASY TRADING</span>
          </div>
        </div>

        {/* Aperçu de la plateforme */}
        <div className="max-w-7xl mx-auto mb-10">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600/50 backdrop-blur-sm">
            {/* Mockup de l'interface */}
            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl">
              {/* Header du salon */}
              <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
                <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">TT</div>
                  <span className="text-white font-semibold">TheTheTrader</span>
                  <span className="text-gray-400 text-sm">En ligne</span>
                </div>
                <div className="text-blue-400 font-semibold">{channelData[activeChannel]?.title || '#crypto-signaux'}</div>
                <div className="bg-blue-600 px-4 py-2 rounded text-white text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 cursor-pointer">+ Nouveau Signal</div>
              </div>
              
              {/* Zone principale */}
              <div className="flex h-[750px]">
                {/* Sidebar */}
                <div className="w-60 bg-gray-800 p-4 border-r border-gray-700">
                  <div className="text-gray-400 text-xs font-semibold mb-3"># SALONS</div>
                  <div className="space-y-2">
                    <div 
                      className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                        activeChannel === 'crypto-signaux' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                      onClick={() => setActiveChannel('crypto-signaux')}
                    >
                      # crypto-signaux
                    </div>
                    <div 
                      className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                        activeChannel === 'forex-signaux' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                      onClick={() => setActiveChannel('forex-signaux')}
                    >
                      # forex-signaux
                    </div>
                    <div 
                      className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                        activeChannel === 'futures-signaux' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                      onClick={() => setActiveChannel('futures-signaux')}
                    >
                      # futures-signaux
                    </div>
                  </div>
                  
                  <div className="text-gray-400 text-xs font-semibold mb-3 mt-6">EDUCATION</div>
                  <div className="space-y-2">
                    <div 
                      className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                        activeChannel === 'formation' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                      onClick={() => setActiveChannel('formation')}
                    >
                      # formation
                    </div>
                  </div>

                  <div className="text-gray-400 text-xs font-semibold mb-3 mt-6">PERFORMANCE</div>
                  <div className="space-y-2">
                    <div 
                      className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                        activeChannel === 'calendrier' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                      onClick={() => setActiveChannel('calendrier')}
                    >
                      📅 calendrier
                    </div>
                  </div>

                  
                  <div className="bg-gray-700 p-3 rounded mt-6">
                    <div className="text-white text-sm font-semibold mb-2">Statistiques</div>
                    <div className="text-green-400 text-sm">Win Rate: 78%</div>
                    <div className="text-blue-400 text-sm">Signaux actifs: 3</div>
                  </div>
                </div>
                
                {/* Zone des messages/signaux */}
                <div className="flex-1 flex flex-col p-4 bg-gray-900">
                  <div className="space-y-4 mb-4 flex-1 overflow-y-auto pr-2">
                    {currentMessages.map((message: any, index: number) => (
                      <div 
                        key={message.id}
                        className={`bg-gray-800 rounded-lg transition-all duration-500 ${
                          typeof message.content === 'string' ? 'p-3' : 'p-4'
                        } ${
                          index < visibleMessages 
                            ? 'opacity-100 transform translate-y-0' 
                            : 'opacity-0 transform translate-y-4'
                        }`}
                        style={{
                          borderLeft: message.type === 'signal' ? '4px solid #10b981' : 
                                    message.type === 'update' ? '4px solid #3b82f6' : '4px solid #6b7280'
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            message.user === 'TheTheTrader' ? 'bg-blue-600' : 'bg-gray-600'
                          }`}>
                            {message.user.charAt(0)}
                          </div>
                          <span className="text-white font-semibold text-sm">{message.user}</span>
                          <span className="text-gray-400 text-xs">{message.time}</span>
                          {message.status && (
                            <span className="bg-green-600 px-2 py-1 rounded text-xs text-white">
                              {message.status}
                            </span>
                          )}
                        </div>
                        <div className={`text-sm ${
                          message.type === 'signal' ? 'text-green-400 font-semibold' :
                          message.type === 'update' ? 'text-blue-400 font-semibold' :
                          message.type === 'calendar' ? 'text-purple-400 font-semibold' :
                          'text-gray-300'
                        }`}>
                          {message.type === 'calendar' ? (
                            <div>
                              <div className="font-bold mb-4 text-purple-400">{message.content}</div>
                              
                              {/* Grille du calendrier */}
                              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="text-white font-semibold">Janvier 2025</h4>
                                  <div className="text-xs text-gray-400">
                                    Win Rate: {message.calendarData?.stats.winRate}% • Total: {message.calendarData?.stats.totalPnL}
                                  </div>
                                </div>
                                
                                {/* Jours de la semaine */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
                                    <div key={day} className="text-center text-xs font-medium text-gray-400 p-1">
                                      {day}
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Grille des jours */}
                                <div className="grid grid-cols-7 gap-1">
                                  {/* Espaces vides pour commencer le mois */}
                                  <div></div><div></div><div></div>
                                  
                                  {message.calendarData?.days.map((day: any) => (
                                    <div
                                      key={day.date}
                                      className={`relative p-2 text-xs rounded text-center cursor-pointer transition-all hover:scale-105 ${
                                        day.status === 'win' ? 'bg-green-500 text-white' :
                                        day.status === 'loss' ? 'bg-red-500 text-white' :
                                        day.status === 'be' ? 'bg-yellow-500 text-black' :
                                        'bg-gray-600 text-gray-300'
                                      }`}
                                      title={`${day.trades} trades • ${day.pnl}`}
                                    >
                                      {day.date}
                                      {day.trades > 0 && (
                                        <div className="absolute top-0 right-0 w-1 h-1 bg-white rounded-full opacity-60"></div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Légende */}
                                <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                                    <span className="text-gray-300">Win</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                                    <span className="text-gray-300">BE</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                                    <span className="text-gray-300">Loss</span>
                                  </div>
                                </div>
                                
                                {/* Stats du mois */}
                                <div className="mt-4 pt-4 border-t border-gray-600">
                                  <div className="grid grid-cols-3 gap-4 text-xs text-center">
                                    <div>
                                      <div className="text-gray-400">Total Trades</div>
                                      <div className="text-white font-semibold">{message.calendarData?.stats.totalTrades}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-400">Meilleur Jour</div>
                                      <div className="text-green-400 font-semibold">{message.calendarData?.stats.bestDay}</div>
                                    </div>
                                    <div>
                                      <div className="text-gray-400">Pire Jour</div>
                                      <div className="text-red-400 font-semibold">{message.calendarData?.stats.worstDay}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Réactions emoji */}
                              {message.reactions && (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                  {message.reactions.map((reaction, idx) => (
                                    <div key={idx} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full text-sm flex items-center gap-1 cursor-pointer transition-colors">
                                      <span>{reaction.emoji}</span>
                                      <span className="text-gray-300">{reaction.count}</span>
                                    </div>
                                  ))}
                                  <div className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-full text-sm text-gray-400 cursor-pointer transition-colors">
                                    ➕
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : typeof message.content === 'string' ? (
                            <div>
                              <div className="whitespace-pre-line">{message.content}</div>
                              {/* Réactions emoji pour messages texte */}
                              {message.reactions && (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                  {message.reactions.map((reaction, idx) => (
                                    <div key={idx} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full text-sm flex items-center gap-1 cursor-pointer transition-colors">
                                      <span>{reaction.emoji}</span>
                                      <span className="text-gray-300">{reaction.count}</span>
                                    </div>
                                  ))}
                                  <div className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-full text-sm text-gray-400 cursor-pointer transition-colors">
                                    ➕
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="font-bold mb-3 text-green-400">{message.content.title}</div>
                              
                              {/* Graphique simulé */}
                                                              <div className="bg-gray-700 rounded-lg p-3 mb-3 border border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-400">TradingView Chart</span>
                                  <span className="text-xs text-green-400">• LIVE</span>
                                </div>
                                <div className="h-32 rounded border border-gray-600 bg-gray-800 p-4 flex items-center justify-center">
                                  {/* Ta vraie capture TradingView */}
                                  <img 
                                    src="/images/tradingview-chart.png"
                                    alt="TradingView Chart BTCUSD"
                                    className="max-h-full w-auto object-contain"
                                  />
                                </div>
                                <div className="text-xs text-gray-400 mt-2 text-center">
                                  📈 Analyse technique confirmée • Cassure de résistance
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                {message.content.details.map((detail, idx) => (
                                  <div key={idx} className="text-gray-300">
                                    {detail.icon} {detail.label}: <span className="text-white">{detail.value}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2 mt-4">
                                <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-medium text-white transition-colors duration-200">Win</button>
                                <button className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm font-medium text-white transition-colors duration-200">BE</button>
                                <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-medium text-white transition-colors duration-200">Loss</button>
                              </div>
                              
                              {/* Réactions emoji */}
                              {message.content.reactions && (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                  {message.content.reactions.map((reaction, idx) => (
                                    <div key={idx} className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-full text-sm flex items-center gap-1 cursor-pointer transition-colors">
                                      <span>{reaction.emoji}</span>
                                      <span className="text-gray-300">{reaction.count}</span>
                                    </div>
                                  ))}
                                  <div className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded-full text-sm text-gray-400 cursor-pointer transition-colors">
                                    ➕
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  

                </div>
              </div>
            </div>
            

          </div>
        </div>
      </div>



      {/* Section Comparaison */}
      <div className="pt-10 pb-20 px-6 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Comparez notre approche <span className="text-blue-400">simplifiée</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 relative min-h-[500px]">
          {/* Autres Plateformes */}
          <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 transition-all duration-300 hover:bg-gray-800/70 hover:border-red-500/50 relative" style={{animation: 'slideInLeft 0.6s ease-out both'}}>
            <h3 className="text-2xl font-bold text-white mb-4">Autres Plateformes</h3>
            <p className="text-red-400 text-xl font-bold mb-6">≈ € cher et complexe</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-red-400">❌</span>
                <span className="text-gray-300">Interface complexe</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-400">❌</span>
                <span className="text-gray-300">Trop de fonctions inutiles</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-400">❌</span>
                <span className="text-gray-300">Pas de suivi discipliné</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-400">❌</span>
                <span className="text-gray-300">Configuration compliquée</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-400">❌</span>
                <span className="text-gray-300">Abonnements élevés</span>
              </div>
            </div>
          </div>

          {/* TheTheTrader - Recommandé */}
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 rounded-xl border-2 border-blue-500 relative shadow-2xl shadow-blue-500/30 hover:shadow-blue-500 transition-shadow duration-300" style={{animation: 'slideInUp 0.6s ease-out 0.2s both'}}>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold">RECOMMANDÉ</span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">TheTheTrader</h3>
            <p className="text-green-400 text-3xl font-bold mb-2">€29.99<span className="text-lg">/mois</span></p>
            <p className="text-green-300 text-sm mb-6">Moins qu'un café par jour - facturation annuelle !</p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <span className="text-green-400">✅</span>
                <span className="text-white">Signaux en temps réel</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400">✅</span>
                <span className="text-white">Suivi des performances automatique</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400">✅</span>
                <span className="text-white">Formation trading incluse</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400">✅</span>
                <span className="text-white">Interface intuitive française</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400">✅</span>
                <span className="text-white">Support prioritaire</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400">✅</span>
                <span className="text-white">Prix abordable</span>
              </div>
            </div>

            <button 
              onClick={() => setShowAuthModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:opacity-90"
            >
              Essai Gratuit →
            </button>
          </div>

          {/* Trading Manuel */}
          <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700 transition-all duration-300 hover:bg-gray-800/70 hover:border-yellow-500/50 relative" style={{animation: 'slideInRight 0.6s ease-out 0.4s both'}}>
            <h3 className="text-2xl font-bold text-white mb-4">Trading Manuel</h3>
            <p className="text-gray-400 text-xl font-bold mb-6">Gratuit mais limité</p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-red-400">❌</span>
                <span className="text-gray-300">Aucune analyse automatique</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-400">❌</span>
                <span className="text-gray-300">Pas de signaux</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-400">❌</span>
                <span className="text-gray-300">Erreurs fréquentes</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-400">❌</span>
                <span className="text-gray-300">Pas de formation</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-400">❌</span>
                <span className="text-gray-300">Chronophage</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Reviews Clients */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Témoignages */}
          <div className="space-y-8 mb-16">
            {/* Témoignage 1 */}
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 shadow-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">M</span>
                </div>
                <div className="flex-1">
                  <blockquote className="text-lg text-gray-200 mb-4 italic">
                    "Setup ultra simple en 2 minutes, signaux clairs sans analyse compliquée. Enfin une plateforme qui me permet de trader sans me prendre la tête avec 1000 indicateurs."
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs">TT</span>
                    </div>
                    <span className="text-gray-400 font-medium">— Marc Dubois, Trader Indépendant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Témoignage 2 */}
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
              <blockquote className="text-lg text-gray-200 mb-4 italic">
                "J'ai connecté mon courtier en 30 secondes. Pas de configuration complexe, juste des signaux simples à suivre. Mon trading n'a jamais été aussi zen et efficace."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs">€</span>
                </div>
                <span className="text-gray-400 font-medium">— Sophie Martin, Analyste Forex</span>
              </div>
            </div>

            {/* Témoignage 3 */}
            <div className="bg-gray-800/30 rounded-2xl p-6 border border-gray-700">
              <blockquote className="text-lg text-gray-200 mb-4 italic">
                "Fini les plateformes complexes avec 50 onglets. Ici tout est clair : un signal, une action, un résultat. Le trading redevient simple comme il devrait l'être."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs">₿</span>
                </div>
                <span className="text-gray-400 font-medium">— Alex Bourgeois, Trader Crypto</span>
              </div>
            </div>
          </div>

          {/* Bouton d'action */}
          <div className="text-center mb-16">
            <button 
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90"
            >
              Essai Gratuit
            </button>
          </div>


        </div>
      </div>

      {/* Petit bonhomme trader style Discord 3D */}
      <div className="relative -mb-1">
        <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative animate-pulse" style={{animationDuration: '3s'}}>
            {/* Ombre du bonhomme assis - 1.5x plus grande */}
            <div className="absolute top-28 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-black/20 rounded-full blur-sm"></div>
            
            {/* Corps principal style Discord - 1.5x plus gros */}
            <div className="relative">
              {/* Tête 3D - 1.5x plus grosse */}
              <div className="w-21 h-21 relative mx-auto mb-3">
                {/* Base de la tête */}
                <div className="w-21 h-21 bg-gradient-to-br from-purple-300 via-purple-400 to-purple-600 rounded-full relative shadow-lg">
                  {/* Reflet 3D */}
                  <div className="absolute top-3 left-4 w-6 h-6 bg-white/30 rounded-full blur-sm"></div>
                  
                  {/* Yeux style Discord */}
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex gap-3">
                    <div className="w-3 h-4 bg-white rounded-full relative">
                      <div className="absolute top-1.5 left-1 w-1.5 h-1.5 bg-black rounded-full animate-ping"></div>
                    </div>
                    <div className="w-3 h-4 bg-white rounded-full relative">
                      <div className="absolute top-1.5 left-1 w-1.5 h-1.5 bg-black rounded-full animate-ping" style={{animationDelay: '0.3s'}}></div>
                    </div>
                  </div>
                  
                  {/* Bouche souriante */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-6 h-3 border-b-3 border-white rounded-full"></div>
                </div>
              </div>
              
              {/* Corps hoodie style Discord - 1.5x plus gros */}
              <div className="w-24 h-30 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 rounded-3xl relative mx-auto shadow-xl">
                {/* Reflet 3D sur le hoodie */}
                <div className="absolute top-3 left-3 w-9 h-12 bg-white/20 rounded-2xl blur-sm"></div>
                
                {/* Logo de trading sur le hoodie */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-9 h-9 bg-white/90 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">📈</span>
                </div>
                
                {/* Cordon du hoodie */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                </div>
                
                {/* Bras animés */}
                <div className="absolute top-6 -left-4 w-12 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transform rotate-12 animate-pulse shadow-md"></div>
                <div className="absolute top-6 -right-4 w-12 h-5 bg-gradient-to-l from-blue-500 to-blue-600 rounded-full transform -rotate-12 animate-pulse shadow-md" style={{animationDelay: '0.2s'}}></div>
                
                {/* Pocket */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-6 border border-blue-800/30 rounded-xl"></div>
              </div>
              
              {/* Jambes croisées style Discord - position assise */}
              <div className="relative mt-2">
                {/* Jambe gauche (arrière) */}
                <div className="absolute left-2 top-0 w-5 h-10 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-full shadow-md transform rotate-45 origin-top"></div>
                {/* Pied gauche */}
                <div className="absolute left-8 top-8 w-6 h-3 bg-gray-800 rounded-full shadow-sm transform -rotate-12"></div>
                
                {/* Jambe droite (devant) - croisée par-dessus */}
                <div className="absolute right-2 top-1 w-5 h-10 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-full shadow-md transform -rotate-45 origin-top z-10"></div>
                {/* Pied droit */}
                <div className="absolute right-8 top-8 w-6 h-3 bg-gray-800 rounded-full shadow-sm transform rotate-12"></div>
                
                {/* Espace pour les jambes croisées */}
                <div className="h-12 w-full"></div>
              </div>
            </div>
            
            {/* Écrans d'ordinateur style Discord 3D - ENCORE PLUS GROS (1.5x) */}
            {/* Écran gauche */}
            <div className="absolute -left-24 top-1 transform rotate-12 animate-pulse" style={{animationDelay: '0.3s'}}>
              {/* Support/pied */}
              <div className="w-24 h-4 bg-gradient-to-r from-gray-700 to-gray-900 rounded-full mx-auto mb-3 shadow-md"></div>
              
              {/* Écran principal */}
              <div className="w-30 h-21 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-2xl border-4 border-gray-600 shadow-2xl relative">
                {/* Reflet 3D sur l'écran */}
                <div className="absolute top-3 left-3 w-9 h-6 bg-white/15 rounded blur-sm"></div>
                
                {/* Bordure intérieure brillante */}
                <div className="absolute inset-2 border border-gray-500/40 rounded-xl"></div>
                
                {/* Contenu de l'écran - graphiques trading */}
                <div className="absolute inset-4 bg-black rounded-xl">
                  {/* Lignes de trading vertes */}
                  <div className="w-full h-1.5 bg-green-400 mt-3 rounded animate-pulse"></div>
                  <div className="w-3/4 h-1.5 bg-red-400 mt-2 rounded animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  <div className="w-2/3 h-1.5 bg-yellow-400 mt-2 rounded animate-pulse" style={{animationDelay: '0.6s'}}></div>
                  <div className="w-5/6 h-1.5 bg-orange-400 mt-2 rounded animate-pulse" style={{animationDelay: '0.8s'}}></div>
                  
                  {/* Indicateur de profit */}
                  <div className="absolute bottom-2 right-2 text-green-400 text-base animate-ping">+89%</div>
                </div>
                
                {/* Voyant de fonctionnement */}
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              </div>
            </div>
            
            {/* Écran droite */}
            <div className="absolute -right-24 top-1 transform -rotate-12 animate-pulse" style={{animationDelay: '0.5s'}}>
              {/* Support/pied */}
              <div className="w-24 h-4 bg-gradient-to-l from-gray-700 to-gray-900 rounded-full mx-auto mb-3 shadow-md"></div>
              
              {/* Écran principal */}
              <div className="w-30 h-21 bg-gradient-to-bl from-gray-800 via-gray-900 to-black rounded-2xl border-4 border-gray-600 shadow-2xl relative">
                {/* Reflet 3D sur l'écran */}
                <div className="absolute top-3 right-3 w-9 h-6 bg-white/15 rounded blur-sm"></div>
                
                {/* Bordure intérieure brillante */}
                <div className="absolute inset-2 border border-gray-500/40 rounded-xl"></div>
                
                {/* Contenu de l'écran - graphiques crypto */}
                <div className="absolute inset-4 bg-black rounded-xl">
                  {/* Lignes de crypto bleues */}
                  <div className="w-full h-1.5 bg-blue-400 mt-3 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-4/5 h-1.5 bg-purple-400 mt-2 rounded animate-pulse" style={{animationDelay: '0.7s'}}></div>
                  <div className="w-3/5 h-1.5 bg-cyan-400 mt-2 rounded animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="w-5/6 h-1.5 bg-pink-400 mt-2 rounded animate-pulse" style={{animationDelay: '0.9s'}}></div>
                  
                  {/* Indicateur de profit */}
                  <div className="absolute bottom-2 left-2 text-blue-400 text-base animate-ping" style={{animationDelay: '0.1s'}}>₿ +127%</div>
                </div>
                
                {/* Voyant de fonctionnement */}
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
            
            {/* Particules d'argent volantes style Discord - Plus grosses et lentes */}
            <div className="absolute -top-8 left-12 text-green-400 text-3xl animate-bounce filter drop-shadow-lg" style={{animationDelay: '1s', animationDuration: '4s'}}>💎</div>
            <div className="absolute -top-6 -left-10 text-yellow-400 text-3xl animate-bounce filter drop-shadow-lg" style={{animationDelay: '2s', animationDuration: '5s'}}>🚀</div>
            <div className="absolute top-3 left-14 text-green-400 text-2xl animate-bounce filter drop-shadow-lg" style={{animationDelay: '3s', animationDuration: '4.5s'}}>💰</div>
            <div className="absolute -top-4 right-8 text-blue-400 text-2xl animate-bounce filter drop-shadow-lg" style={{animationDelay: '1.5s', animationDuration: '3.5s'}}>📈</div>
            <div className="absolute top-6 -right-6 text-purple-400 text-xl animate-bounce filter drop-shadow-lg" style={{animationDelay: '2.5s', animationDuration: '4s'}}>🎯</div>
            
            {/* Étincelles autour - Plus lentes */}
            <div className="absolute top-0 right-4 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{animationDelay: '2s', animationDuration: '3s'}}></div>
            <div className="absolute top-8 -left-2 w-2 h-2 bg-purple-300 rounded-full animate-ping" style={{animationDelay: '3s', animationDuration: '4s'}}></div>
            <div className="absolute bottom-4 right-2 w-2 h-2 bg-blue-300 rounded-full animate-ping" style={{animationDelay: '1.5s', animationDuration: '3.5s'}}></div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-6 mt-0">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Logo et sélecteur de langue - comme Discord */}
            <div className="md:col-span-1">
              {/* Logo TT stylisé */}
              <div className="w-16 h-16 mb-6">
                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                  <span className="text-purple-900 text-2xl font-bold">TT</span>
                </div>
              </div>
              
              {/* Sélecteur de langue */}
              <div className="mb-8">
                <label className="block text-gray-300 text-sm mb-2">Language</label>
                <select className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 w-full focus:outline-none focus:border-purple-500">
                  <option>Français</option>
                  <option>English</option>
                  <option>Español</option>
                </select>
              </div>

              {/* Réseaux sociaux */}
              <div className="flex space-x-4">
                <div className="w-6 h-6 text-gray-300 hover:text-white cursor-pointer transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"/></svg>
                </div>
                <div className="w-6 h-6 text-gray-300 hover:text-white cursor-pointer transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.74.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/></svg>
                </div>
                <div className="w-6 h-6 text-gray-300 hover:text-white cursor-pointer transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </div>
                <div className="w-6 h-6 text-gray-300 hover:text-white cursor-pointer transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </div>
                <div className="w-6 h-6 text-gray-300 hover:text-white cursor-pointer transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                </div>
              </div>
            </div>

            {/* Colonnes de liens - style Discord */}
            {/* Produit */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Produit</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Signaux</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Analytics</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Formation</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">App Directory</a>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Company</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">About</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Jobs</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Brand</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Newsroom</a>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Resources</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">College</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Support</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Safety</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Blog</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Feedback</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">StreamKit</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Creators</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Community</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Official 3rd Party Merch</a>
              </div>
            </div>

            {/* Policies */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Policies</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Terms</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Privacy</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Cookie Settings</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Guidelines</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Acknowledgements</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Licenses</a>
                <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Company Information</a>
              </div>
            </div>
          </div>

          {/* Ligne de séparation et nom du site */}
          <div className="border-t border-purple-700/50 mt-16 pt-8">
            <div className="text-center">
              <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tight">
                TheTheTrader
              </h1>
            </div>
          </div>
        </div>
      </footer>

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