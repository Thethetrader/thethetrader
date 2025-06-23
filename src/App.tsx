import React, { useState, useEffect } from 'react';
import './index.css';
import TradingPlatformShell from './components/generated/TradingPlatformShell';
import TradingCalendar from './components/TradingCalendar';

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
  const [showCalendar, setShowCalendar] = useState(false);
  
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
       title: '#calendrier',
       messages: [
         { 
           id: 1, 
           user: 'TheTheTrader', 
           time: '00:00:01', 
           type: 'calendar', 
           content: 'Calendrier des performances trading - Janvier 2025', 
           calendarData: {
             days: [
               { date: 1, status: 'win', trades: 3, pnl: '+2.4%' },
               { date: 2, status: 'win', trades: 2, pnl: '+1.8%' },
               { date: 3, status: 'loss', trades: 1, pnl: '-0.5%' },
               { date: 4, status: 'win', trades: 4, pnl: '+3.2%' },
               { date: 5, status: 'be', trades: 2, pnl: '±0.0%' },
               { date: 6, status: 'win', trades: 3, pnl: '+2.1%' },
               { date: 7, status: 'win', trades: 2, pnl: '+1.6%' },
               { date: 8, status: 'win', trades: 5, pnl: '+4.2%' },
               { date: 9, status: 'loss', trades: 2, pnl: '-1.1%' },
               { date: 10, status: 'win', trades: 3, pnl: '+2.8%' },
               { date: 11, status: 'win', trades: 1, pnl: '+0.9%' },
               { date: 12, status: 'be', trades: 3, pnl: '±0.1%' },
               { date: 13, status: 'win', trades: 4, pnl: '+3.5%' },
               { date: 14, status: 'win', trades: 2, pnl: '+1.7%' },
               { date: 15, status: 'win', trades: 3, pnl: '+2.3%' },
               { date: 16, status: 'loss', trades: 1, pnl: '-0.8%' },
               { date: 17, status: 'win', trades: 4, pnl: '+3.1%' },
               { date: 18, status: 'win', trades: 2, pnl: '+1.4%' },
               { date: 19, status: 'win', trades: 3, pnl: '+2.6%' },
               { date: 20, status: 'be', trades: 2, pnl: '±0.0%' },
               { date: 21, status: 'win', trades: 5, pnl: '+4.8%' },
               { date: 22, status: 'win', trades: 3, pnl: '+2.2%' },
               { date: 23, status: 'loss', trades: 2, pnl: '-1.3%' },
               { date: 24, status: 'win', trades: 4, pnl: '+3.4%' },
               { date: 25, status: 'win', trades: 1, pnl: '+0.7%' },
               { date: 26, status: 'win', trades: 3, pnl: '+2.9%' },
               { date: 27, status: 'win', trades: 2, pnl: '+1.5%' },
               { date: 28, status: 'be', trades: 3, pnl: '±0.2%' },
               { date: 29, status: 'win', trades: 4, pnl: '+3.7%' },
               { date: 30, status: 'win', trades: 2, pnl: '+1.9%' },
               { date: 31, status: 'win', trades: 3, pnl: '+2.5%' }
             ],
             stats: {
               totalTrades: 89,
               winRate: 78.2,
               totalPnL: '+47.8%',
               bestDay: '+4.8%',
               worstDay: '-1.3%'
             }
           },
           reactions: [
             { emoji: '📊', count: 34 },
             { emoji: '🔥', count: 28 },
             { emoji: '💎', count: 19 }
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
      }, index * 500); // 500ms entre chaque message
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

  // Calendar Page
  if (showCalendar) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen w-full">
        {/* Header */}
        <nav className="flex items-center justify-between p-6 relative z-50">
          <div className="text-2xl font-bold text-white">
            TheTheTrader
          </div>
          <div className="hidden md:flex space-x-8">
            <button onClick={() => setShowCalendar(false)} className="text-gray-300 hover:text-white transition-all duration-200">Accueil</button>
            <button onClick={() => setShowCalendar(true)} className="text-blue-400 hover:text-white transition-all duration-200">Calendrier</button>
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

        {/* Calendar Content */}
        <div className="pt-10 px-6 flex justify-center">
          <TradingCalendar />
        </div>
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
          <button onClick={() => setShowCalendar(false)} className="text-gray-300 hover:text-white transition-all duration-200">Accueil</button>
          <button onClick={() => setShowCalendar(true)} className="text-gray-300 hover:text-white transition-all duration-200">Calendrier</button>
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
                  
                  <div className="text-gray-400 text-xs font-semibold mb-3 mt-6">CALENDRIER</div>
                  <div className="space-y-2">
                    <div 
                      className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                        activeChannel === 'calendrier' ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                      onClick={() => setActiveChannel('calendrier')}
                    >
                      # calendrier
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

      {/* Footer */}
      <footer className="bg-gray-900 py-16 px-6 mt-0">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo et description */}
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">TheTheTrader</h3>
              <p className="text-gray-400 mb-4">
                Plateforme de trading simplifiée pour maximiser vos profits avec des signaux en temps réel.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                  <span className="text-white text-sm">📧</span>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                  <span className="text-white text-sm">📱</span>
                </div>
              </div>
            </div>

            {/* Produit */}
            <div>
              <h4 className="text-white font-semibold mb-4">PRODUIT</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Signaux Trading</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Analytics</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Formation</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Prix</a>
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">SUPPORT</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Contact</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">FAQ</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Documentation</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Discord Community</a>
              </div>
            </div>

            {/* Légal */}
            <div>
              <h4 className="text-white font-semibold mb-4">LÉGAL</h4>
              <div className="space-y-3">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Politique de confidentialité</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Conditions d'utilisation</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Mentions légales</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">Avertissement risques</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2025 TheTheTrader. Tous droits réservés.
            </div>
            <div className="text-gray-400 text-sm mt-4 md:mt-0">
              contact@thethetrader.com
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