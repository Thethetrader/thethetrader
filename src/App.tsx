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
  const [activeChannel, setActiveChannel] = useState('crypto');
  const [previewChannel, setPreviewChannel] = useState('crypto');
  const [mobileActiveChannel, setMobileActiveChannel] = useState(null);
  const [showMobileChannel, setShowMobileChannel] = useState(false);
  
  // Données des signaux pour chaque salon mobile (identiques à l'app)
  const [mobileSignalsData, setMobileSignalsData] = useState({
    'fondamentaux': [
      {
        type: 'FORMATION',
        symbol: 'ANALYSE',
        entry: 'Module 1: Bases du trading',
        takeProfit: 'Support/Résistance',
        stopLoss: 'Théorie + pratique',
        rr: 'Éducation',
        status: 'ACTIVE',
        pnl: ''
      },
      {
        type: 'FORMATION',
        symbol: 'STRATÉGIE',
        entry: 'Module 2: Stratégies avancées',
        takeProfit: 'Risk Management',
        stopLoss: 'Psychologie trading',
        rr: 'Formation',
        status: 'ACTIVE',
        pnl: ''
      }
    ],
    'letsgooo-model': [
      {
        type: 'MODÈLE',
        symbol: 'SETUP',
        entry: 'Configuration modèle pro',
        takeProfit: 'Validation setup',
        stopLoss: 'Optimisation paramètres',
        rr: 'Pro',
        status: 'WIN',
        pnl: '+$850'
      },
      {
        type: 'MODÈLE',
        symbol: 'BACKTEST',
        entry: 'Résultats backtest',
        takeProfit: 'Performance validée',
        stopLoss: 'Analyse historique',
        rr: 'Modèle',
        status: 'ACTIVE',
        pnl: ''
      }
    ],
    crypto: [],
    futur: [],
    forex: [],
    livestream: [],
    'general-chat': [],
    'profit-loss': [],
    'calendar': [],
    'trading-journal': []
  });

  // Fonction pour mettre à jour le statut des signaux
  const updateMobileSignalStatus = (channel: string, signalIndex: number, newStatus: string) => {
    setMobileSignalsData(prev => ({
      ...prev,
      [channel]: prev[channel].map((signal, index) => {
        if (index === signalIndex) {
          let pnl = '';
          if (newStatus === 'WIN') pnl = '+$' + (Math.random() * 500 + 100).toFixed(0);
          if (newStatus === 'LOSS') pnl = '-$' + (Math.random() * 300 + 50).toFixed(0);
          if (newStatus === 'BE') pnl = '$0';
          
          return { ...signal, status: newStatus, pnl };
        }
        return signal;
      })
    }));
  };

  const [animatedNumbers, setAnimatedNumbers] = useState({
    beginners: 0,
    analyses: 0,
    generated: 0
  });
  
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

  // Animation des chiffres
  useEffect(() => {
    const targets = {
      beginners: 1000,
      analyses: 300,
      generated: 50000
    };

    const duration = 2000; // 2 secondes
    const steps = 60;
    const stepDuration = duration / steps;

    const animate = () => {
      let currentStep = 0;
      
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        
        setAnimatedNumbers({
          beginners: Math.floor(targets.beginners * progress),
          analyses: Math.floor(targets.analyses * progress),
          generated: Math.floor(targets.generated * progress)
        });

        if (currentStep >= steps) {
          clearInterval(interval);
          // S'assurer que les valeurs finales sont exactes
          setAnimatedNumbers(targets);
        }
      }, stepDuration);
    };

    // Démarrer l'animation après un délai
    const timer = setTimeout(animate, 500);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const channelData: Record<string, any> = {
    'fondamentaux': {
      title: '#fondamentaux',
      messages: [
        { 
          id: 1, 
          user: 'TheTheTrader', 
          time: '09:15:30', 
          type: 'formation', 
          content: {
            title: '📚 Module 1: Les bases du trading',
            image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
            description: 'Introduction complète aux marchés financiers',
            duration: '45 min',
            progress: '100%',
            topics: ['Types de marchés', 'Ordres de base', 'Gestion du risque']
          }
        },
        { 
          id: 2, 
          user: 'TheTheTrader', 
          time: '10:30:45', 
          type: 'formation', 
          content: {
            title: '📊 Module 2: Analyse technique',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
            description: 'Maîtrisez les indicateurs techniques',
            duration: '1h20',
            progress: '75%',
            topics: ['Support/Résistance', 'Indicateurs', 'Patterns']
          }
        },
        { 
          id: 3, 
          user: 'TheTheTrader', 
          time: '11:45:20', 
          type: 'formation', 
          content: {
            title: '🎯 Module 3: Psychologie du trader',
            image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop',
            description: 'Développez votre mindset de trader',
            duration: '55 min',
            progress: '60%',
            topics: ['Gestion émotionnelle', 'Discipline', 'Patience']
          }
        }
      ]
    },
    'letsgooo-model': {
      title: '#letsgooo-model',
      messages: [
        { 
          id: 1, 
          user: 'TheTheTrader', 
          time: '14:20:15', 
          type: 'formation', 
          content: {
            title: '🚀 Stratégie Letsgooo - Partie 1',
            image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
            description: 'Découvrez notre stratégie exclusive',
            duration: '1h30',
            progress: '100%',
            topics: ['Setup d\'entrée', 'Timing parfait', 'Gestion']
          }
        },
        { 
          id: 2, 
          user: 'TheTheTrader', 
          time: '15:45:30', 
          type: 'formation', 
          content: {
            title: '⚡ Letsgooo - Applications pratiques',
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
            description: 'Exemples concrets en temps réel',
            duration: '2h15',
            progress: '80%',
            topics: ['Cas d\'étude', 'Backtesting', 'Optimisation']
          }
        }
      ]
    },
    'crypto': {
      title: '#crypto',
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
    'forex': {
      title: '#forex',
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
    'futur': {
      title: '#futur',
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
      title: '📅 Journal Signaux',
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
    },
    'livestream': {
      title: '#livestream',
      messages: [
        { 
          id: 1, 
          user: 'TheTheTrader', 
          time: '14:30:00', 
          type: 'message', 
          content: '📺 Live Trading en cours !\n\n🎯 Session: Analyse technique en direct\n⏰ Durée: 2h\n👥 Participants: 156\n\n💬 Posez vos questions dans le chat !', 
          reactions: [
            { emoji: '📺', count: 45 },
            { emoji: '🎯', count: 32 }
          ]
        },
        { 
          id: 2, 
          user: 'TheTheTrader', 
          time: '14:45:30', 
          type: 'message', 
          content: '📊 Signal en direct: BUY BTCUSD\n\n🔹 Entrée: 103,200\n🔹 Stop: 102,800\n🔹 Target: 103,800\n\n🎯 Suivez en direct !', 
          reactions: [
            { emoji: '🔥', count: 28 },
            { emoji: '🚀', count: 19 }
          ]
        }
      ]
    },
    'general-chat': {
      title: '#general-chat',
      messages: [
        { 
          id: 1, 
          user: 'Trader_Pro', 
          time: '13:20:15', 
          type: 'message', 
          content: 'Salut tout le monde ! 👋\n\nQuelqu\'un a des questions sur le module de formation ?', 
          reactions: [
            { emoji: '👋', count: 8 },
            { emoji: '💬', count: 5 }
          ]
        },
        { 
          id: 2, 
          user: 'Crypto_Lover', 
          time: '13:25:42', 
          type: 'message', 
          content: 'Oui ! J\'ai un doute sur la gestion du risque...\n\nComment calculer la taille de position ?', 
          reactions: [
            { emoji: '🤔', count: 3 },
            { emoji: '📚', count: 7 }
          ]
        },
        { 
          id: 3, 
          user: 'TheTheTrader', 
          time: '13:30:00', 
          type: 'message', 
          content: 'Excellente question ! 📚\n\nRègle simple: Risque max 1-2% par trade\n\nExemple: Compte 10k€ → Risque max 100-200€\n\nJe prépare un guide détaillé !', 
          reactions: [
            { emoji: '📚', count: 15 },
            { emoji: '💡', count: 12 }
          ]
        }
      ]
    },
    'profit-loss': {
      title: '#profit-loss',
      messages: [
        { 
          id: 1, 
          user: 'Crypto_Trader_23', 
          time: '08:00:00', 
          type: 'message', 
          content: '📊 Mes résultats de la semaine:\n\n💰 P&L Total: +$847\n📈 Win Rate: 85.7%\n🎯 Meilleur trade: +$156 (BTC)\n📉 Pire trade: -$45 (ETH)\n\n🔥 Première semaine positive !', 
          reactions: [
            { emoji: '💰', count: 25 },
            { emoji: '🔥', count: 18 }
          ]
        },
        { 
          id: 2, 
          user: 'Forex_Master', 
          time: '09:15:30', 
          type: 'message', 
          content: '📈 Mes stats détaillées:\n\n• Trades gagnants: 12/15\n• Trades perdants: 3/15\n• Ratio moyen: 1.8:1\n• Drawdown max: 2.1%\n\n🎯 Objectif: Maintenir >80% win rate', 
          reactions: [
            { emoji: '📈', count: 22 },
            { emoji: '🎯', count: 15 }
          ]
        },
        { 
          id: 3, 
          user: 'Futures_Pro', 
          time: '10:30:45', 
          type: 'message', 
          content: '💎 Résultats exceptionnels cette semaine:\n\n💰 P&L: +$2,156\n📈 Win Rate: 92.3%\n🎯 15 trades gagnants sur 16\n📉 Seulement 1 trade perdant\n\n🚀 La stratégie Letsgooo fonctionne parfaitement !', 
          reactions: [
            { emoji: '💎', count: 38 },
            { emoji: '🚀', count: 29 }
          ]
        },
        { 
          id: 4, 
          user: 'Beginner_Trader', 
          time: '11:45:20', 
          type: 'message', 
          content: '📚 Mes premiers résultats:\n\n💰 P&L: +$89\n📈 Win Rate: 75%\n🎯 3 trades gagnants sur 4\n📉 1 trade perdant: -$23\n\n💡 Merci pour la formation, ça marche !', 
          reactions: [
            { emoji: '📚', count: 12 },
            { emoji: '💡', count: 8 }
          ]
        },
        { 
          id: 5, 
          user: 'Scalping_King', 
          time: '12:20:15', 
          type: 'message', 
          content: '⚡ Session de scalping réussie:\n\n💰 P&L: +$456\n📈 Win Rate: 88.9%\n🎯 8 trades gagnants sur 9\n⏱️ Session de 2h\n\n🔥 Le scalping avec les signaux crypto est incroyable !', 
          reactions: [
            { emoji: '⚡', count: 31 },
            { emoji: '🔥', count: 24 }
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
            <a href="#about-thethetrader" className="text-gray-300 hover:text-white transition-all duration-200">À propos</a>
            <a href="#interface" className="text-gray-300 hover:text-white transition-all duration-200">La plateforme</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-all duration-200">Prix</a>
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
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <span className="group-hover:text-blue-300 transition-colors duration-300">Le trading</span><br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300 transition-all duration-300">
                pour les nuls
              </span>
            </h1>
            <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
              Un setup très simple, des signaux expliqués, un journal de performance. Rejoins la communauté et trade en confiance.
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
          <div className="text-center pt-20 sm:pt-32 pb-0 px-4 sm:px-6">
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-bold text-white mb-8 sm:mb-12 leading-tight hover:scale-105 transition-transform duration-300 cursor-pointer group">
              <span className="group-hover:text-blue-300 transition-colors duration-300">Le trading</span><br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300 transition-all duration-300">
                pour les nuls
              </span>
            </h1>
            <p className="text-xl sm:text-3xl text-gray-300 mb-10 sm:mb-12 max-w-4xl mx-auto px-2">
              Un setup très simple, des signaux expliqués, un journal de performance. Rejoins la communauté et trade en confiance.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center mb-12 sm:mb-28 px-4">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 sm:px-12 py-5 sm:py-6 rounded-lg text-xl sm:text-2xl font-semibold hover:opacity-90 w-full sm:w-auto"
              >
                Commencer maintenant
              </button>
            </div>

            {/* Barre de défilement - Full Width */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 sm:py-10 overflow-hidden relative mb-10 sm:mb-16 w-screen -mx-4 sm:-mx-6">
              <div className="whitespace-nowrap animate-scroll">
                <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
                <span className="text-sm sm:text-2xl font-bold mx-4 sm:mx-16">EASY SETUP EASY TRADING</span>
              </div>
            </div>

            {/* Nos Services - Mobile Optimized */}
            <div id="services" className="max-w-7xl mx-auto mb-10 sm:mb-16 px-4 sm:px-6">
              <h2 className="text-4xl sm:text-5xl font-bold text-white text-center mb-12 sm:mb-20">
                Les Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12">
                {/* Service 1 */}
                <div className="bg-gray-800/50 p-6 sm:p-8 rounded-xl border border-gray-600/50 backdrop-blur-sm hover:bg-gray-800/70 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 hover:border-purple-500/50 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300">📊</div>
                  <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-purple-400 transition-colors duration-300">Signaux de Trading</h3>
                  <p className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">
                    Recevez des signaux de trading précis avec des points d'entrée, de sortie et de stop-loss clairement définis.
                  </p>
                </div>

                {/* Service 2 */}
                <div className="bg-gray-800/50 p-6 sm:p-8 rounded-xl border border-gray-600/50 backdrop-blur-sm hover:bg-gray-800/70 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 hover:border-blue-500/50 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300">📚</div>
                  <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-blue-400 transition-colors duration-300">Formation Complète</h3>
                  <p className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">
                    Apprenez les bases du trading avec nos cours structurés et nos stratégies éprouvées. Apprentissage de mon setup ultra simple.
                  </p>
                </div>

                {/* Service 3 */}
                <div className="bg-gray-800/50 p-6 sm:p-8 rounded-xl border border-gray-600/50 backdrop-blur-sm hover:bg-gray-800/70 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 hover:border-green-500/50 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300">📈</div>
                  <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-green-400 transition-colors duration-300">Suivi Performance</h3>
                  <p className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">
                    Suivez vos performances avec notre calendrier de trading et nos analyses détaillées. Journal de trading personnalisé pour optimiser votre stratégie.
                  </p>
                </div>

                {/* Service 4 - Live Trading */}
                <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 p-6 sm:p-8 rounded-xl border border-red-500/50 backdrop-blur-sm hover:from-red-600/30 hover:to-orange-600/30 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/25 hover:border-red-400 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-6xl mb-8 group-hover:scale-110 transition-transform duration-300">🎥</div>
                  <h3 className="text-3xl font-bold text-white mb-6 group-hover:text-red-400 transition-colors duration-300">Live Trading</h3>
                  <p className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">
                    Regardez nos sessions de trading en direct 3 fois par semaine et apprenez en temps réel.
                  </p>
                </div>
              </div>
            </div>

            {/* À propos - Mobile Optimized */}
            <div id="about-thethetrader" className="max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6">
              <div className="bg-gray-800/50 p-6 sm:p-8 rounded-xl border border-gray-600/50 backdrop-blur-sm">
                                                    <h2 className="text-4xl sm:text-5xl font-bold text-white text-center mb-6 sm:mb-8">
                    À propos de TheTheTrader
                  </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                      Trader depuis 3 ans, j'ai développé une approche simple, rapide et efficace. J'ai compris qu'on a tendance à trop compliquer le marché, alors qu'en réalité, il suffit de le simplifier pour mieux le maîtriser. Mon setup va à l'essentiel : lecture claire, exécution rapide, résultats concrets.
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl mb-4">🚀</div>
                    <p className="text-gray-300 text-sm sm:text-base">
                      Plus de 1000+ membres actifs
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Avantages clés - Mobile Optimized */}
            <div className="max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6">
                              <h2 className="text-4xl sm:text-5xl font-bold text-white text-center mb-8 sm:mb-12">
                  Pourquoi choisir TheTheTrader ?
                </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {/* Carte 1 */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 sm:p-8 text-center shadow-lg border border-purple-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 hover:border-purple-400 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-4xl text-purple-600 mb-4 group-hover:scale-110 transition-transform duration-300">⚡</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors duration-300">Simplicité</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Approche simple et efficace. Pas de jargon compliqué, juste des résultats concrets.</div>
                </div>

                {/* Carte 2 */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 sm:p-8 text-center shadow-lg border border-purple-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 hover:border-blue-400 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-4xl text-purple-600 mb-4 group-hover:scale-110 transition-transform duration-300">🎯</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">Résultats</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Signaux précis et formation qui transforme les débutants en traders confirmés.</div>
                </div>

                {/* Carte 3 */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 sm:p-8 text-center shadow-lg border border-purple-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 hover:border-green-400 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-4xl text-purple-600 mb-4 group-hover:scale-110 transition-transform duration-300">🤝</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">Communauté</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Rejoignez une communauté active de traders qui partagent et s'entraident.</div>
                </div>

                {/* Carte 4 - Journal de Trading */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 sm:p-8 text-center shadow-lg border border-purple-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25 hover:border-yellow-400 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-4xl text-purple-600 mb-4 group-hover:scale-110 transition-transform duration-300">📔</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors duration-300">Journal Personnel</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Chacun a son propre journal de trading pour suivre ses trades et analyser ses performances.</div>
                </div>
              </div>
              
              {/* Bouton Commencer maintenant après Pourquoi choisir */}
              <div className="text-center mt-8">
                <button 
                  onClick={() => {
                    const pricingSection = document.getElementById('pricing');
                    if (pricingSection) {
                      pricingSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 sm:px-12 py-5 sm:py-6 rounded-lg text-xl sm:text-2xl font-semibold hover:opacity-90"
                >
                  Commencer maintenant
                </button>
              </div>
            </div>

            {/* Interface Mobile après Connexion - Mobile uniquement */}
            <div className="block md:hidden max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6">
              <h2 className="text-4xl sm:text-5xl font-bold text-white text-center mb-8 sm:mb-12">
                Aperçu de la plateforme
              </h2>
              
              {/* Version Mobile - Liste des salons */}
              <div className="bg-gray-800/50 rounded-xl border border-gray-600/50 backdrop-blur-sm p-4">
                <div className="bg-gray-900 rounded-lg overflow-hidden relative" style={{height: '700px'}}>
                  {/* Header mobile avec profil */}
                  <div className="bg-slate-700 p-3 border-b border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {showMobileChannel && (
                          <button 
                            onClick={() => setShowMobileChannel(false)}
                            className="text-gray-400 hover:text-white"
                          >
                            ←
                          </button>
                        )}
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">TT</div>
                        <span className="text-white font-medium">
                          {showMobileChannel ? (
                            mobileActiveChannel === 'fondamentaux' ? '📚 Fondamentaux' :
                            mobileActiveChannel === 'letsgooo-model' ? '🚀 Letsgooo model' :
                            mobileActiveChannel === 'crypto' ? '🪙 Crypto' :
                            mobileActiveChannel === 'futur' ? '📈 Futur' :
                            mobileActiveChannel === 'forex' ? '💱 Forex' :
                            mobileActiveChannel === 'livestream' ? '📺 Livestream' :
                            mobileActiveChannel === 'general-chat' ? '💬 General-chat' :
                            mobileActiveChannel === 'profit-loss' ? '💰 Profit-loss' :
                            mobileActiveChannel === 'calendar' ? '📅 Journal Signaux' :
                            mobileActiveChannel === 'trading-journal' ? '📊 Journal Perso' : 'TheTheTrader'
                          ) : 'TheTheTrader'}
                        </span>
                      </div>
                      <div className="text-gray-400">🏠</div>
                    </div>
                  </div>
                  
                  {/* Liste des salons - Slide out vers la gauche */}
                  <div className={`absolute inset-0 top-12 p-4 space-y-4 overflow-y-auto bg-gray-900 transition-transform duration-300 ${showMobileChannel ? '-translate-x-full' : 'translate-x-0'}`} style={{height: '640px'}}>
                    
                    {/* Section Education */}
                    <div>
                      <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3 font-medium">EDUCATION</h3>
                      <div className="space-y-2">
                        <div 
                          className="bg-slate-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            setMobileActiveChannel('fondamentaux');
                            setShowMobileChannel(true);
                          }}
                        >
                          <div className="text-xl">📚</div>
                          <div>
                            <div className="text-white font-medium text-sm">Fondamentaux</div>
                            <div className="text-gray-400 text-xs">Contenu éducatif</div>
                          </div>
                        </div>
                        <div 
                          className="bg-slate-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            setMobileActiveChannel('letsgooo-model');
                            setShowMobileChannel(true);
                          }}
                        >
                          <div className="text-xl">🚀</div>
                          <div>
                            <div className="text-white font-medium text-sm">Letsgooo model</div>
                            <div className="text-gray-400 text-xs">Contenu éducatif</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Signaux */}
                    <div>
                      <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3 font-medium">SIGNAUX</h3>
                      <div className="space-y-2">
                        <div 
                          className="bg-slate-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            setMobileActiveChannel('crypto');
                            setShowMobileChannel(true);
                          }}
                        >
                          <div className="text-xl">🪙</div>
                          <div>
                            <div className="text-white font-medium text-sm">Crypto</div>
                            <div className="text-gray-400 text-xs">Canal de signaux</div>
                          </div>
                        </div>
                        <div 
                          className="bg-slate-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            setMobileActiveChannel('futur');
                            setShowMobileChannel(true);
                          }}
                        >
                          <div className="text-xl">📈</div>
                          <div>
                            <div className="text-white font-medium text-sm">Futur</div>
                            <div className="text-gray-400 text-xs">Canal de signaux</div>
                          </div>
                        </div>
                        <div 
                          className="bg-slate-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            setMobileActiveChannel('forex');
                            setShowMobileChannel(true);
                          }}
                        >
                          <div className="text-xl">💱</div>
                          <div>
                            <div className="text-white font-medium text-sm">Forex</div>
                            <div className="text-gray-400 text-xs">Canal de signaux</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Trading Hub */}
                    <div>
                      <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3 font-medium">TRADING HUB</h3>
                      <div className="space-y-2">
                        <div 
                          className="bg-slate-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            setMobileActiveChannel('livestream');
                            setShowMobileChannel(true);
                          }}
                        >
                          <div className="text-xl">📺</div>
                          <div>
                            <div className="text-white font-medium text-sm">Livestream</div>
                            <div className="text-gray-400 text-xs">Hub de trading</div>
                          </div>
                        </div>
                        <div 
                          className="bg-slate-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            setMobileActiveChannel('general-chat');
                            setShowMobileChannel(true);
                          }}
                        >
                          <div className="text-xl">💬</div>
                          <div>
                            <div className="text-white font-medium text-sm">General-chat</div>
                            <div className="text-gray-400 text-xs">Discussion générale</div>
                          </div>
                        </div>
                        <div 
                          className="bg-slate-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            setMobileActiveChannel('profit-loss');
                            setShowMobileChannel(true);
                          }}
                        >
                          <div className="text-xl">💰</div>
                          <div>
                            <div className="text-white font-medium text-sm">Profit-loss</div>
                            <div className="text-gray-400 text-xs">Partage P&L</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section Journaux */}
                    <div>
                      <h3 className="text-gray-400 text-xs uppercase tracking-wide mb-3 font-medium">JOURNAUX</h3>
                      <div className="space-y-2">
                        <div 
                          className="bg-slate-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            setMobileActiveChannel('calendar');
                            setShowMobileChannel(true);
                          }}
                        >
                          <div className="text-xl">📅</div>
                          <div>
                            <div className="text-white font-medium text-sm">Journal Signaux</div>
                            <div className="text-gray-400 text-xs">Calendrier économique</div>
                          </div>
                        </div>
                        <div 
                          className="bg-slate-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            setMobileActiveChannel('trading-journal');
                            setShowMobileChannel(true);
                          }}
                        >
                          <div className="text-xl">📊</div>
                          <div>
                            <div className="text-white font-medium text-sm">Journal Perso</div>
                            <div className="text-gray-400 text-xs">Trading personnel</div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                  
                  {/* Vue Canal - Slide in depuis la droite */}
                  <div className={`absolute inset-0 top-12 bg-gray-900 transition-transform duration-300 ${showMobileChannel ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="h-full flex flex-col">
                      {/* Contenu du canal */}
                      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                        
                        {/* Vue Crypto */}
                        {mobileActiveChannel === 'crypto' && (
                          <>
                            {/* Signal BTC */}
                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">BUY</span>
                                  <span className="text-white font-bold text-sm">BTCUSD</span>
                                  <span className="text-gray-400 text-xs">15m</span>
                                </div>
                                <span className="text-green-400 font-bold text-sm">+$1,250</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-2">
                                <div>Entry: 45000</div>
                                <div>TP: 46000</div>
                                <div>SL: 44000</div>
                                <div>R:R: 2.0</div>
                              </div>
                              <div className="text-gray-400 text-xs mb-2">
                                Signal crypto fort avec breakout confirmé.
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400">⚡ 24</span>
                                <span className="text-gray-400">🔥 18</span>
                              </div>
                            </div>

                            {/* Signal ETH */}
                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">SELL</span>
                                  <span className="text-white font-bold text-sm">ETHUSD</span>
                                  <span className="text-gray-400 text-xs">5m</span>
                                </div>
                                <span className="text-yellow-400 font-bold text-sm">En cours</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-2">
                                <div>Entry: 2800</div>
                                <div>TP: 2750</div>
                                <div>SL: 2850</div>
                                <div>R:R: 1.75</div>
                              </div>
                              <div className="text-gray-400 text-xs mb-2">
                                Signal de correction sur ETH.
                              </div>
                            </div>
                          </>
                        )}

                        {/* Vue Futur */}
                        {mobileActiveChannel === 'futur' && (
                          <>
                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">SELL</span>
                                  <span className="text-white font-bold text-sm">NAS100</span>
                                  <span className="text-gray-400 text-xs">1H</span>
                                </div>
                                <span className="text-green-400 font-bold text-sm">+$890</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-2">
                                <div>Entry: 15800</div>
                                <div>TP: 15650</div>
                                <div>SL: 15900</div>
                                <div>R:R: 1.5</div>
                              </div>
                              <div className="text-gray-400 text-xs mb-2">
                                Signal baissier sur NAS100. Rejet de la résistance majeure.
                              </div>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">BUY</span>
                                  <span className="text-white font-bold text-sm">SPX500</span>
                                  <span className="text-gray-400 text-xs">4H</span>
                                </div>
                                <span className="text-yellow-400 font-bold text-sm">En cours</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-2">
                                <div>Entry: 4450</div>
                                <div>TP: 4520</div>
                                <div>SL: 4400</div>
                                <div>R:R: 1.4</div>
                              </div>
                              <div className="text-gray-400 text-xs mb-2">
                                Rebond technique sur SPX500.
                              </div>
                            </div>
                          </>
                        )}

                        {/* Vue Forex */}
                        {mobileActiveChannel === 'forex' && (
                          <>
                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">BUY</span>
                                  <span className="text-white font-bold text-sm">EURUSD</span>
                                  <span className="text-gray-400 text-xs">1H</span>
                                </div>
                                <span className="text-green-400 font-bold text-sm">+$540</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-2">
                                <div>Entry: 1.0850</div>
                                <div>TP: 1.0920</div>
                                <div>SL: 1.0800</div>
                                <div>R:R: 1.4</div>
                              </div>
                              <div className="text-gray-400 text-xs mb-2">
                                Signal haussier EUR/USD. Breakout confirmé.
                              </div>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">SELL</span>
                                  <span className="text-white font-bold text-sm">GBPJPY</span>
                                  <span className="text-gray-400 text-xs">30m</span>
                                </div>
                                <span className="text-yellow-400 font-bold text-sm">En cours</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-2">
                                <div>Entry: 185.50</div>
                                <div>TP: 184.80</div>
                                <div>SL: 186.00</div>
                                <div>R:R: 1.4</div>
                              </div>
                              <div className="text-gray-400 text-xs mb-2">
                                Signal baissier GBP/JPY.
                              </div>
                            </div>
                          </>
                        )}

                        {/* Vue Fondamentaux */}
                        {mobileActiveChannel === 'fondamentaux' && (
                          <>
                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">COURS</span>
                                <span className="text-white font-bold text-sm">Les bases du trading</span>
                              </div>
                              <div className="text-gray-400 text-xs mb-2">
                                📚 Durée: 2h30 | 🎯 Niveau: Débutant
                              </div>
                              <div className="text-gray-300 text-xs mb-2">
                                Apprenez les fondamentaux du trading et l'analyse technique.
                              </div>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">COURS</span>
                                <span className="text-white font-bold text-sm">Psychologie du trader</span>
                              </div>
                              <div className="text-gray-400 text-xs mb-2">
                                📚 Durée: 1h45 | 🎯 Niveau: Intermédiaire
                              </div>
                              <div className="text-gray-300 text-xs mb-2">
                                Maîtrisez vos émotions et développez un mental gagnant.
                              </div>
                            </div>
                          </>
                        )}

                        {/* Vue Letsgooo Model */}
                        {mobileActiveChannel === 'letsgooo-model' && (
                          <>
                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold">PREMIUM</span>
                                <span className="text-white font-bold text-sm">Stratégie Letsgooo</span>
                              </div>
                              <div className="text-gray-400 text-xs mb-2">
                                🚀 Performance: +89% | 📈 Win Rate: 76%
                              </div>
                              <div className="text-gray-300 text-xs mb-2">
                                Formation avancée sur la stratégie exclusive Letsgooo model.
                              </div>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">LIVE</span>
                                <span className="text-white font-bold text-sm">Backtesting avancé</span>
                              </div>
                              <div className="text-gray-400 text-xs mb-2">
                                🎯 Résultats: +156% | 📊 Sharpe: 2.4
                              </div>
                              <div className="text-gray-300 text-xs mb-2">
                                Techniques de backtesting et optimisation de stratégies.
                              </div>
                            </div>
                          </>
                        )}

                        {/* Vue Livestream */}
                        {mobileActiveChannel === 'livestream' && (
                          <>
                            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-red-400 font-bold text-sm">LIVE - Session Trading</span>
                              </div>
                              <div className="text-gray-300 text-xs mb-2">
                                🎥 En direct maintenant | 👥 124 viewers
                              </div>
                              <div className="text-gray-400 text-xs">
                                Analyse des marchés et signaux en temps réel.
                              </div>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">M</div>
                                <span className="text-white font-medium text-xs">Member_Pro</span>
                                <span className="text-gray-400 text-xs">14:23</span>
                              </div>
                              <p className="text-gray-300 text-xs">
                                Excellent setup sur EURUSD ! 🔥
                              </p>
                            </div>
                          </>
                        )}

                        {/* Vue General Chat */}
                        {mobileActiveChannel === 'general-chat' && (
                          <>
                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs text-white">A</div>
                                <span className="text-white font-medium text-xs">AlexTrader</span>
                                <span className="text-gray-400 text-xs">15:42</span>
                              </div>
                              <p className="text-gray-300 text-xs mb-1">
                                Salut la team ! Quelqu'un a des infos sur les NFP de demain ? 🤔
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400">💬 3</span>
                                <span className="text-gray-400">👍 8</span>
                              </div>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">S</div>
                                <span className="text-white font-medium text-xs">Sarah_FX</span>
                                <span className="text-gray-400 text-xs">15:45</span>
                              </div>
                              <p className="text-gray-300 text-xs mb-1">
                                @AlexTrader Prévu à 14h30 demain ! Normalement impact fort sur USD 📈
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400">👍 12</span>
                                <span className="text-gray-400">🙏 4</span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Vue Profit Loss */}
                        {mobileActiveChannel === 'profit-loss' && (
                          <>
                            <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs text-white">J</div>
                                <span className="text-white font-medium text-xs">JulienPro</span>
                                <span className="text-green-400 font-bold text-sm">+$2,340</span>
                              </div>
                              <div className="text-gray-300 text-xs mb-2">
                                💰 Trade GBPUSD fermé ! Entry: 1.2650 | Exit: 1.2720
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400">🔥 18</span>
                                <span className="text-gray-400">💎 22</span>
                              </div>
                            </div>

                            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">M</div>
                                <span className="text-white font-medium text-xs">MaxTrading</span>
                                <span className="text-red-400 font-bold text-sm">-$180</span>
                              </div>
                              <div className="text-gray-300 text-xs mb-2">
                                📉 Stop Loss touché sur BTCUSD. Pas grave, on continue !
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400">💪 9</span>
                                <span className="text-gray-400">🙏 5</span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Vue Journal Signaux (Calendar) */}
                        {mobileActiveChannel === 'calendar' && (
                          <>
                            {/* Calendrier économique mobile */}
                            <div className="bg-gray-700 rounded-lg p-3">
                              <h3 className="text-white font-bold text-sm mb-3">Calendrier Économique</h3>
                              <div className="grid grid-cols-7 gap-1 text-xs">
                                {/* Headers des jours */}
                                <div className="text-gray-400 text-center p-1">L</div>
                                <div className="text-gray-400 text-center p-1">M</div>
                                <div className="text-gray-400 text-center p-1">M</div>
                                <div className="text-gray-400 text-center p-1">J</div>
                                <div className="text-gray-400 text-center p-1">V</div>
                                <div className="text-gray-400 text-center p-1">S</div>
                                <div className="text-gray-400 text-center p-1">D</div>
                                
                                {/* Jours du calendrier */}
                                <div className="text-gray-500 text-center p-1">26</div>
                                <div className="text-gray-500 text-center p-1">27</div>
                                <div className="text-gray-500 text-center p-1">28</div>
                                <div className="text-gray-500 text-center p-1">29</div>
                                <div className="text-gray-500 text-center p-1">30</div>
                                <div className="text-white text-center p-1">1</div>
                                <div className="text-white text-center p-1">2</div>
                                
                                <div className="bg-red-600 text-white text-center p-1 rounded">3</div>
                                <div className="text-white text-center p-1">4</div>
                                <div className="bg-yellow-600 text-white text-center p-1 rounded">5</div>
                                <div className="text-white text-center p-1">6</div>
                                <div className="text-white text-center p-1">7</div>
                                <div className="text-white text-center p-1">8</div>
                                <div className="text-white text-center p-1">9</div>
                                
                                <div className="text-white text-center p-1">10</div>
                                <div className="text-white text-center p-1">11</div>
                                <div className="bg-green-600 text-white text-center p-1 rounded">12</div>
                                <div className="text-white text-center p-1">13</div>
                                <div className="text-white text-center p-1">14</div>
                                <div className="bg-red-600 text-white text-center p-1 rounded">15</div>
                                <div className="text-white text-center p-1">16</div>
                              </div>
                              
                              {/* Légende */}
                              <div className="flex justify-center gap-3 mt-3 text-xs">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-600 rounded"></div>
                                  <span className="text-white">WIN</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-red-600 rounded"></div>
                                  <span className="text-white">LOSS</span>
                                </div>
                              </div>
                            </div>

                            {/* Stats Calendar */}
                            <div className="bg-gray-700 rounded-lg p-3">
                              <h3 className="text-white font-bold text-sm mb-3">Statistiques Signaux</h3>
                              
                              <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3 mb-2">
                                <div className="text-green-300 text-xs mb-1">P&L Total</div>
                                <div className="text-lg font-bold text-white">+$2,485</div>
                              </div>

                              <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 mb-3">
                                <div className="text-blue-300 text-xs mb-1">Win Rate</div>
                                <div className="text-lg font-bold text-white">89%</div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-gray-600/50 rounded p-2">
                                  <div className="text-gray-400 mb-1">Aujourd'hui</div>
                                  <div className="text-orange-400 font-bold">4</div>
                                </div>
                                <div className="bg-gray-600/50 rounded p-2">
                                  <div className="text-gray-400 mb-1">Ce mois</div>
                                  <div className="text-white font-bold">31</div>
                                </div>
                                <div className="bg-gray-600/50 rounded p-2">
                                  <div className="text-gray-400 mb-1">Avg Impact</div>
                                  <div className="text-green-400 font-bold">+59 pips</div>
                                </div>
                                <div className="bg-gray-600/50 rounded p-2">
                                  <div className="text-gray-400 mb-1">Max Impact</div>
                                  <div className="text-yellow-400 font-bold">+240 pips</div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Vue Journal Perso (Trading Journal) */}
                        {mobileActiveChannel === 'trading-journal' && (
                          <>
                            {/* Calendrier trading mobile */}
                            <div className="bg-gray-700 rounded-lg p-3">
                              <h3 className="text-white font-bold text-sm mb-3">Trading Journal</h3>
                              <div className="grid grid-cols-7 gap-1 text-xs">
                                {/* Headers des jours */}
                                <div className="text-gray-400 text-center p-1">L</div>
                                <div className="text-gray-400 text-center p-1">M</div>
                                <div className="text-gray-400 text-center p-1">M</div>
                                <div className="text-gray-400 text-center p-1">J</div>
                                <div className="text-gray-400 text-center p-1">V</div>
                                <div className="text-gray-400 text-center p-1">S</div>
                                <div className="text-gray-400 text-center p-1">D</div>
                                
                                {/* Jours du calendrier */}
                                <div className="text-gray-500 text-center p-1">26</div>
                                <div className="text-gray-500 text-center p-1">27</div>
                                <div className="text-gray-500 text-center p-1">28</div>
                                <div className="text-gray-500 text-center p-1">29</div>
                                <div className="text-gray-500 text-center p-1">30</div>
                                <div className="text-white text-center p-1">1</div>
                                <div className="bg-green-600 text-white text-center p-1 rounded">2</div>
                                
                                <div className="text-white text-center p-1">3</div>
                                <div className="text-white text-center p-1">4</div>
                                <div className="bg-red-600 text-white text-center p-1 rounded">5</div>
                                <div className="text-white text-center p-1">6</div>
                                <div className="text-white text-center p-1">7</div>
                                <div className="bg-green-600 text-white text-center p-1 rounded">8</div>
                                <div className="text-white text-center p-1">9</div>
                                
                                <div className="text-white text-center p-1">10</div>
                                <div className="bg-blue-600 text-white text-center p-1 rounded">11</div>
                                <div className="text-white text-center p-1">12</div>
                                <div className="text-white text-center p-1">13</div>
                                <div className="bg-green-600 text-white text-center p-1 rounded">14</div>
                                <div className="text-white text-center p-1">15</div>
                                <div className="text-white text-center p-1">16</div>
                              </div>
                              
                              {/* Légende */}
                              <div className="flex justify-center gap-3 mt-3 text-xs">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-600 rounded"></div>
                                  <span className="text-white">WIN</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-red-600 rounded"></div>
                                  <span className="text-white">LOSS</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-600 rounded"></div>
                                  <span className="text-white">BE</span>
                                </div>
                              </div>
                            </div>

                            {/* Stats Trading Journal */}
                            <div className="bg-gray-700 rounded-lg p-3">
                              <h3 className="text-white font-bold text-sm mb-3">Statistiques Trades</h3>
                              
                              <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3 mb-2">
                                <div className="text-green-300 text-xs mb-1">P&L Total</div>
                                <div className="text-lg font-bold text-white">+$3,285</div>
                              </div>

                              <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3 mb-3">
                                <div className="text-blue-300 text-xs mb-1">Win Rate</div>
                                <div className="text-lg font-bold text-white">74%</div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-gray-600/50 rounded p-2">
                                  <div className="text-gray-400 mb-1">Aujourd'hui</div>
                                  <div className="text-blue-400 font-bold">2</div>
                                </div>
                                <div className="bg-gray-600/50 rounded p-2">
                                  <div className="text-gray-400 mb-1">Ce mois</div>
                                  <div className="text-white font-bold">23</div>
                                </div>
                                <div className="bg-gray-600/50 rounded p-2">
                                  <div className="text-gray-400 mb-1">Avg Win</div>
                                  <div className="text-green-400 font-bold">+$195</div>
                                </div>
                                <div className="bg-gray-600/50 rounded p-2">
                                  <div className="text-gray-400 mb-1">Avg Loss</div>
                                  <div className="text-red-400 font-bold">-$85</div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                      </div>
                      
                      {/* Zone de saisie en bas - seulement pour general-chat et profit-loss */}
                      {(mobileActiveChannel === 'general-chat' || mobileActiveChannel === 'profit-loss') && (
                        <div className="border-t border-gray-700 p-3">
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              placeholder="Tapez votre message..."
                              className="flex-1 bg-gray-700 text-white text-xs px-3 py-2 rounded border-none outline-none"
                            />
                            <button className="bg-blue-600 text-white px-3 py-2 rounded text-xs">
                              Envoyer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interface Desktop - Desktop uniquement */}
            <div id="interface" className="hidden md:block max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6">
              <h2 className="text-4xl sm:text-5xl font-bold text-white text-center mb-8 sm:mb-12">
                Aperçu de la plateforme
              </h2>
              <div className="flex justify-center">
                <div className="bg-gray-800/50 p-6 sm:p-8 rounded-xl border border-gray-600/50 backdrop-blur-sm w-full max-w-6xl">
                  {/* Mockup Desktop Interface */}
                  <div className="bg-gray-900 rounded-lg p-0 mx-auto h-screen max-h-[900px] flex" style={{width: '100%'}}>
                    
                    {/* Sidebar Desktop */}
                    <div className="w-56 bg-gray-800 flex flex-col">
                      <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm text-white">TT</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">TheTheTrader</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ÉDUCATION</h3>
                          <div className="space-y-1">
                                                            <button 
                                  className={`w-full text-left px-3 py-2 rounded text-sm ${previewChannel === 'fondamentaux' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                  onClick={() => setPreviewChannel('fondamentaux')}
                                >
                                  📚 Fondamentaux
                                </button>
                                <button 
                                  className={`w-full text-left px-3 py-2 rounded text-sm ${previewChannel === 'letsgooo-model' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                  onClick={() => setPreviewChannel('letsgooo-model')}
                                >
                                  🚀 Letsgooo-model
                                </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">SIGNAUX</h3>
                          <div className="space-y-1">
                                                            <button 
                                  className={`w-full text-left px-3 py-2 rounded text-sm ${previewChannel === 'crypto' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                  onClick={() => setPreviewChannel('crypto')}
                                >
                                  🪙 Crypto
                                </button>
                                <button 
                                  className={`w-full text-left px-3 py-2 rounded text-sm ${previewChannel === 'futur' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                  onClick={() => setPreviewChannel('futur')}
                                >
                                  📈 Futur
                                </button>
                                <button 
                                  className={`w-full text-left px-3 py-2 rounded text-sm ${previewChannel === 'forex' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                  onClick={() => setPreviewChannel('forex')}
                                >
                                  💱 Forex
                                </button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">TRADING HUB</h3>
                          <div className="space-y-1">
                            <button 
                              className={`w-full text-left px-3 py-2 rounded text-sm ${previewChannel === 'livestream' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                              onClick={() => setPreviewChannel('livestream')}
                            >
                              📺 Livestream
                            </button>
                            <button 
                              className={`w-full text-left px-3 py-2 rounded text-sm ${previewChannel === 'general-chat' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                              onClick={() => setPreviewChannel('general-chat')}
                            >
                              💬 General-chat
                            </button>
                            <button 
                              className={`w-full text-left px-3 py-2 rounded text-sm ${previewChannel === 'profit-loss' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                              onClick={() => setPreviewChannel('profit-loss')}
                            >
                              💰 Profit-loss
                            </button>
                                                            <button 
                                  className={`w-full text-left px-3 py-2 rounded text-sm ${previewChannel === 'calendar' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                  onClick={() => setPreviewChannel('calendar')}
                                >
                                  📅 Journal Signaux
                                </button>
                                <button 
                                  className={`w-full text-left px-3 py-2 rounded text-sm ${previewChannel === 'trading-journal' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                                  onClick={() => setPreviewChannel('trading-journal')}
                                >
                                  📊 Journal Perso
                                </button>
                          </div>
                        </div>

                        <div className="bg-gray-700 rounded-lg p-3">
                          <h4 className="text-sm font-medium mb-2 text-white">Statistiques</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Win Rate:</span>
                              <span className="text-blue-400">75%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Signaux actifs:</span>
                              <span className="text-yellow-400">3</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">P&L Total:</span>
                              <span className="text-green-400">+$2,480</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Zone principale */}
                    <div className="flex-1 flex flex-col bg-gray-900">
                      {/* Header de la zone principale */}
                      <div className="p-4 border-b border-gray-700">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-white">
                            {previewChannel === 'crypto' ? '# crypto' : 
                             previewChannel === 'futur' ? '# futur' : 
                             previewChannel === 'forex' ? '# forex' : 
                             previewChannel === 'fondamentaux' ? '📚 Fondamentaux' : 
                             previewChannel === 'letsgooo-model' ? '🚀 Letsgooo-model' : 
                             previewChannel === 'livestream' ? '📺 Livestream' : 
                             previewChannel === 'general-chat' ? '💬 General-chat' : 
                             previewChannel === 'profit-loss' ? '💰 Profit-loss' : 
                             previewChannel === 'calendar' ? '📅 Journal Signaux' : 
                             previewChannel === 'trading-journal' ? '📊 Journal Perso' : '# crypto'}
                          </h2>
                          <span className="text-green-400 text-sm flex items-center gap-1">
                            🟢 Live
                          </span>
                        </div>
                      </div>

                      {/* Zone de contenu principale */}
                      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                        
                        {/* Vue Crypto - Signaux */}
                        {previewChannel === 'crypto' && (
                          <>
                            {/* Signal BTC */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-white font-bold text-lg">Signal BUY BTCUSD – 15m</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 45000 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 44000 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 46000 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 2.0</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">⚡ 24</span>
                                <span className="text-gray-400 text-xs">🔥 18</span>
                                <span className="text-gray-400 text-xs">💎 31</span>
                              </div>
                            </div>

                            {/* Signal ETH */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-white font-bold text-lg">Signal SELL ETHUSD – 5m</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 2800 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 2850 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 2750 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 1.75</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">⚡ 16</span>
                                <span className="text-gray-400 text-xs">📉 12</span>
                                <span className="text-gray-400 text-xs">💎 8</span>
                              </div>
                            </div>

                            {/* Signal SOL */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-white font-bold text-lg">Signal BUY SOLUSD – 15m</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 95.50 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 93.80 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 98.20 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 1.8</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">🔥 42</span>
                                <span className="text-gray-400 text-xs">🚀 28</span>
                                <span className="text-gray-400 text-xs">💎 15</span>
                              </div>
                            </div>

                            {/* Signal ADA */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-white font-bold text-lg">Signal SELL ADAUSD – 1H</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 0.485 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 0.495 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 0.475 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 1.5</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">📉 23</span>
                                <span className="text-gray-400 text-xs">🔻 18</span>
                                <span className="text-gray-400 text-xs">💎 9</span>
                              </div>
                            </div>

                            {/* Message de chat */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">TT</div>
                                <span className="text-white font-medium text-sm">TheTheTrader</span>
                                <span className="text-gray-400 text-xs">22:45</span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                📈 Excellente session aujourd'hui ! BTC breakout confirmé, on surveille la zone 46k pour la suite.
                              </p>
                            </div>
                          </>
                        )}

                        {/* Vue Futur - Signaux indices */}
                        {previewChannel === 'futur' && (
                          <>
                            {/* Signal NAS100 */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-white font-bold text-lg">Signal SELL NAS100 – 1H</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 16850 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 16950 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 16700 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 1.5</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">📉 31</span>
                                <span className="text-gray-400 text-xs">🔻 22</span>
                                <span className="text-gray-400 text-xs">🎯 15</span>
                              </div>
                            </div>

                            {/* Signal SPX500 */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-white font-bold text-lg">Signal BUY SPX500 – 4H</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 4720 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 4650 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 4850 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 1.85</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">📈 28</span>
                                <span className="text-gray-400 text-xs">🚀 19</span>
                                <span className="text-gray-400 text-xs">💪 12</span>
                              </div>
                            </div>

                            {/* Signal GOLD */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-white font-bold text-lg">Signal BUY GOLD – 4H</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 2045.50 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 2038.20 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 2058.80 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 1.85</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">🥇 38</span>
                                <span className="text-gray-400 text-xs">📈 25</span>
                                <span className="text-gray-400 text-xs">💎 12</span>
                              </div>
                            </div>

                            {/* Signal OIL */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-white font-bold text-lg">Signal SELL OIL – 1H</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 78.50 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 79.80 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 77.20 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 1.4</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">🛢️ 19</span>
                                <span className="text-gray-400 text-xs">📉 14</span>
                                <span className="text-gray-400 text-xs">💎 7</span>
                              </div>
                            </div>

                            {/* Message de chat */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">TT</div>
                                <span className="text-white font-medium text-sm">TheTheTrader</span>
                                <span className="text-gray-400 text-xs">21:30</span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                📊 Les indices US montrent une belle dynamique. NAS100 en profit, SPX500 en cours !
                              </p>
                            </div>
                          </>
                        )}

                        {/* Vue Livestream */}
                        {previewChannel === 'livestream' && (
                          <>
                            {/* Statut Live */}
                            <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-red-400 font-bold text-lg">LIVE - Session Trading</span>
                              </div>
                              <div className="text-gray-300 text-sm mb-3">
                                🎥 En direct maintenant | 👥 156 viewers | ⏰ Durée: 1h23
                              </div>
                              <div className="text-gray-400 text-sm">
                                Analyse des marchés et signaux en temps réel. Posez vos questions dans le chat !
                              </div>
                            </div>

                            {/* Signal en direct */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-white font-bold text-lg">Signal BUY BTCUSD – LIVE</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 103,200 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 102,800 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 103,800 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 1.5</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">🔥 45</span>
                                <span className="text-gray-400 text-xs">🚀 32</span>
                                <span className="text-gray-400 text-xs">💎 28</span>
                              </div>
                            </div>

                            {/* Messages du chat live */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs text-white">M</div>
                                <span className="text-white font-medium text-sm">Member_Pro</span>
                                <span className="text-gray-400 text-xs">14:23</span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                Excellent setup sur BTC ! 🔥
                              </p>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">S</div>
                                <span className="text-white font-medium text-sm">Sarah_FX</span>
                                <span className="text-gray-400 text-xs">14:25</span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                @TheTheTrader Quelle est la prochaine zone à surveiller ?
                              </p>
                            </div>

                            {/* Messages de TheTheTrader */}
                            <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">TT</div>
                                <span className="text-white font-medium text-sm">TheTheTrader</span>
                                <span className="text-gray-400 text-xs">14:30</span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                📺 STREAM dans 10 min - NY PM session ! 🚀
                              </p>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs text-white">A</div>
                                <span className="text-white font-medium text-sm">AlexTrader</span>
                                <span className="text-gray-400 text-xs">14:32</span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                Prêt pour le stream ! 🎯
                              </p>
                            </div>

                            <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">TT</div>
                                <span className="text-white font-medium text-sm">TheTheTrader</span>
                                <span className="text-gray-400 text-xs">14:35</span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                ⏰ 5 min avant le stream - Préparez vos questions ! 💬
                              </p>
                            </div>

                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center text-xs text-white">L</div>
                                <span className="text-white font-medium text-sm">Lisa_FX</span>
                                <span className="text-gray-400 text-xs">14:37</span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                J'ai une question sur EURUSD ! 📈
                              </p>
                            </div>

                            <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">TT</div>
                                <span className="text-white font-medium text-sm">TheTheTrader</span>
                                <span className="text-gray-400 text-xs">14:38</span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                🎥 STREAM LIVE dans 2 min - NY PM session ! Préparez-vous ! 🔥
                              </p>
                            </div>
                          </>
                        )}

                        {/* Vue Forex - Signaux devises */}
                        {previewChannel === 'forex' && (
                          <>
                            {/* Signal EURUSD */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-white font-bold text-lg">Signal BUY EURUSD – 30m</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 1.0850 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 1.0825 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 1.0890 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 1.6</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">💶 42</span>
                                <span className="text-gray-400 text-xs">📊 28</span>
                                <span className="text-gray-400 text-xs">🎯 33</span>
                              </div>
                            </div>

                            {/* Signal GBPJPY */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-white font-bold text-lg">Signal SELL GBPJPY – 15m</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 189.50 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 190.00 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 188.80 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 1.4</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">🇬🇧 24</span>
                                <span className="text-gray-400 text-xs">🇯🇵 18</span>
                                <span className="text-gray-400 text-xs">📉 14</span>
                              </div>
                            </div>

                            {/* Signal USDJPY */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-white font-bold text-lg">Signal BUY USDJPY – 1H</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 148.25 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 147.85 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 148.85 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 1.7</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">🇯🇵 34</span>
                                <span className="text-gray-400 text-xs">📈 22</span>
                                <span className="text-gray-400 text-xs">💎 16</span>
                              </div>
                            </div>

                            {/* Signal AUDUSD */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="text-white font-bold text-lg">Signal SELL AUDUSD – 30m</span>
                              </div>
                              <div className="space-y-2 text-sm text-gray-300 mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Entrée : 0.6650 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Stop Loss : 0.6680 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>Take Profit : 0.6620 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-400">🎯</span>
                                  <span>Ratio R:R : ≈ 1.5</span>
                                </div>
                              </div>

                              <img src="/signal.png" alt="Signal Chart" className="w-full h-72 object-contain rounded mb-3" />
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">🇦🇺 19</span>
                                <span className="text-gray-400 text-xs">📉 15</span>
                                <span className="text-gray-400 text-xs">💎 8</span>
                              </div>
                            </div>

                            {/* Message de chat */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">TT</div>
                                <span className="text-white font-medium text-sm">TheTheTrader</span>
                                <span className="text-gray-400 text-xs">20:15</span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                💱 Session forex active ! EUR/USD en profit, on surveille GBP/JPY de près.
                              </p>
                            </div>
                          </>
                        )}

                        {/* Vue Fondamentaux - Cours de base */}
                        {previewChannel === 'fondamentaux' && (
                          <>
                            {/* Cours 1 - Bases du trading */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold">COURS</span>
                                  <span className="text-white font-bold text-lg">Les bases du trading</span>
                                  <span className="text-gray-400 text-sm">Débutant</span>
                                </div>
                                <span className="text-blue-400 font-bold">45 min</span>
                              </div>
                              <div className="text-gray-400 text-sm mb-4">
                                Apprenez les concepts fondamentaux du trading : marchés financiers, analyse technique et gestion des risques. Ce cours couvre les bases essentielles pour débuter.
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm text-gray-300 mb-3">
                                <div>📊 Analyse technique</div>
                                <div>💰 Gestion du capital</div>
                                <div>🎯 Stratégies de base</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">👥 1,247 étudiants</span>
                                <span className="text-gray-400 text-xs">⭐ 4.8/5</span>
                                <span className="text-gray-400 text-xs">📝 12 modules</span>
                              </div>
                            </div>

                            {/* Cours 2 - Psychologie */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="bg-purple-600 text-white px-3 py-1 rounded text-sm font-bold">COURS</span>
                                  <span className="text-white font-bold text-lg">Psychologie du trader</span>
                                  <span className="text-gray-400 text-sm">Intermédiaire</span>
                                </div>
                                <span className="text-purple-400 font-bold">32 min</span>
                              </div>
                              <div className="text-gray-400 text-sm mb-4">
                                Maîtrisez vos émotions et développez la mentalité gagnante. Gestion du stress, discipline et contrôle de soi sont les clés du succès.
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm text-gray-300 mb-3">
                                <div>🧠 Mindset</div>
                                <div>😌 Gestion stress</div>
                                <div>🎯 Discipline</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">👥 892 étudiants</span>
                                <span className="text-gray-400 text-xs">⭐ 4.9/5</span>
                                <span className="text-gray-400 text-xs">📝 8 modules</span>
                              </div>
                            </div>

                            {/* Message de chat */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">TT</div>
                                <span className="text-white font-medium text-sm">TheTheTrader</span>
                                <span className="text-gray-400 text-xs">19:00</span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                📚 N'oubliez pas que la formation est la base de tout ! Commencez par les fondamentaux avant de trader.
                              </p>
                            </div>
                          </>
                        )}

                        {/* Vue Letsgooo-model - Cours avancés */}
                        {previewChannel === 'letsgooo-model' && (
                          <>
                            {/* Cours 1 - Stratégie avancée */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="bg-orange-600 text-white px-3 py-1 rounded text-sm font-bold">PREMIUM</span>
                                  <span className="text-white font-bold text-lg">Stratégie Letsgooo</span>
                                  <span className="text-gray-400 text-sm">Expert</span>
                                </div>
                                <span className="text-orange-400 font-bold">2h 15min</span>
                              </div>
                              <div className="text-gray-400 text-sm mb-4">
                                La stratégie exclusive TheTheTrader ! Système complet de trading avec backtests, règles précises et gestion du risque optimisée.
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm text-gray-300 mb-3">
                                <div>🚀 Win Rate 85%</div>
                                <div>📈 R:R 1:3</div>
                                <div>⚡ Signaux rapides</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">👥 156 étudiants</span>
                                <span className="text-gray-400 text-xs">⭐ 5.0/5</span>
                                <span className="text-gray-400 text-xs">🔒 Accès VIP</span>
                              </div>
                            </div>

                            {/* Cours 2 - Backtesting */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">LIVE</span>
                                  <span className="text-white font-bold text-lg">Backtesting avancé</span>
                                  <span className="text-gray-400 text-sm">Expert</span>
                                </div>
                                <span className="text-green-400 font-bold">1h 30min</span>
                              </div>
                              <div className="text-gray-400 text-sm mb-4">
                                Maîtrisez l'art du backtesting ! Testez vos stratégies sur données historiques et optimisez vos performances avec des outils professionnels.
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm text-gray-300 mb-3">
                                <div>📊 TradingView</div>
                                <div>🔍 Analyse data</div>
                                <div>⚙️ Optimisation</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">👥 203 étudiants</span>
                                <span className="text-gray-400 text-xs">⭐ 4.7/5</span>
                                <span className="text-gray-400 text-xs">🎥 Session live</span>
                              </div>
                            </div>

                            {/* Message de chat */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">TT</div>
                                <span className="text-white font-medium text-sm">TheTheTrader</span>
                                <span className="text-gray-400 text-xs">18:45</span>
                              </div>
                              <p className="text-gray-300 text-sm">
                                🚀 Session live backtesting demain à 20h ! On teste la stratégie Letsgooo sur 2 ans de données.
                              </p>
                            </div>
                          </>
                        )}

                        {/* Vue General-chat - Discussions */}
                        {previewChannel === 'general-chat' && (
                          <>
                            {/* Message 1 */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm text-white">M</div>
                                <div>
                                  <span className="text-white font-medium text-sm">Mike_Trader</span>
                                  <span className="text-gray-400 text-xs ml-2">Il y a 5 min</span>
                                </div>
                              </div>
                              <p className="text-gray-300 text-sm">
                                Salut la team ! Quelqu'un a des infos sur l'ouverture de Londres demain ? 🇬🇧
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-gray-400 text-xs">👍 3</span>
                                <span className="text-gray-400 text-xs">💬 Répondre</span>
                              </div>
                            </div>

                            {/* Message 2 */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm text-white">S</div>
                                <div>
                                  <span className="text-white font-medium text-sm">Sarah_FX</span>
                                  <span className="text-gray-400 text-xs ml-2">Il y a 8 min</span>
                                </div>
                              </div>
                              <p className="text-gray-300 text-sm">
                                Les NFP de vendredi étaient 🔥 ! Qui a pris le trade sur EUR/USD ?
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-gray-400 text-xs">🚀 5</span>
                                <span className="text-gray-400 text-xs">💶 2</span>
                                <span className="text-gray-400 text-xs">💬 Répondre</span>
                              </div>
                            </div>

                            {/* Message 3 */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm text-white">A</div>
                                <div>
                                  <span className="text-white font-medium text-sm">Alex_Crypto</span>
                                  <span className="text-gray-400 text-xs ml-2">Il y a 12 min</span>
                                </div>
                              </div>
                              <p className="text-gray-300 text-sm">
                                BTC qui teste les 45k encore... Cette fois c'est la bonne ? 📈
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-gray-400 text-xs">⚡ 8</span>
                                <span className="text-gray-400 text-xs">🎯 4</span>
                                <span className="text-gray-400 text-xs">💬 Répondre</span>
                              </div>
                            </div>

                            {/* Message de chat TheTheTrader */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm text-white">TT</div>
                                <div>
                                  <span className="text-white font-medium text-sm">TheTheTrader</span>
                                  <span className="text-yellow-400 text-xs ml-2">👑 ADMIN</span>
                                  <span className="text-gray-400 text-xs ml-2">Il y a 15 min</span>
                                </div>
                              </div>
                              <p className="text-gray-300 text-sm">
                                💬 N'hésitez pas à partager vos analyses et poser vos questions ! La communauté est là pour s'entraider 🚀
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-gray-400 text-xs">❤️ 15</span>
                                <span className="text-gray-400 text-xs">🔥 8</span>
                                <span className="text-gray-400 text-xs">💬 Répondre</span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Vue Profit-loss - Partage de PnL */}
                        {previewChannel === 'profit-loss' && (
                          <>
                            {/* PnL 1 - Gros gain */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-sm text-white">J</div>
                                <div>
                                  <span className="text-white font-medium text-sm">Jordan_Pro</span>
                                  <span className="text-gray-400 text-xs ml-2">Il y a 2h</span>
                                </div>
                              </div>
                              <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-3 mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-bold text-lg">EURUSD</span>
                                  <span className="text-green-400 font-bold text-xl">+$2,450</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                                  <div>Entry: 1.0832</div>
                                  <div>Exit: 1.0891</div>
                                  <div>Risk: $500</div>
                                  <div>R:R: 4.9</div>
                                </div>
                              </div>
                              <p className="text-gray-300 text-sm mb-2">
                                🔥 Excellent trade sur EUR/USD ! Merci TT pour l'analyse, signal parfait ! 🚀
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">🔥 12</span>
                                <span className="text-gray-400 text-xs">💰 8</span>
                                <span className="text-gray-400 text-xs">🎯 6</span>
                              </div>
                            </div>

                            {/* PnL 2 - Trade moyen */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm text-white">L</div>
                                <div>
                                  <span className="text-white font-medium text-sm">Lisa_Scalp</span>
                                  <span className="text-gray-400 text-xs ml-2">Il y a 4h</span>
                                </div>
                              </div>
                              <div className="bg-green-600/20 border border-green-600/50 rounded-lg p-3 mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-bold text-lg">BTCUSD</span>
                                  <span className="text-green-400 font-bold text-xl">+$680</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                                  <div>Entry: 44,890</div>
                                  <div>Exit: 45,120</div>
                                  <div>Risk: $300</div>
                                  <div>R:R: 2.3</div>
                                </div>
                              </div>
                              <p className="text-gray-300 text-sm mb-2">
                                ⚡ Scalp rapide sur BTC ! 15 minutes de trade, clean !
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">⚡ 7</span>
                                <span className="text-gray-400 text-xs">💎 4</span>
                                <span className="text-gray-400 text-xs">🎯 3</span>
                              </div>
                            </div>

                            {/* PnL 3 - Perte (pour le réalisme) */}
                            <div className="bg-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-sm text-white">M</div>
                                <div>
                                  <span className="text-white font-medium text-sm">Max_Learning</span>
                                  <span className="text-gray-400 text-xs ml-2">Il y a 6h</span>
                                </div>
                              </div>
                              <div className="bg-red-600/20 border border-red-600/50 rounded-lg p-3 mb-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-bold text-lg">GBPJPY</span>
                                  <span className="text-red-400 font-bold text-xl">-$180</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
                                  <div>Entry: 189.45</div>
                                  <div>Exit: 189.09</div>
                                  <div>Risk: $180</div>
                                  <div>SL hit</div>
                                </div>
                              </div>
                              <p className="text-gray-300 text-sm mb-2">
                                💪 SL hit mais respecté ! On continue, le trading c'est ça aussi 📚
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-xs">💪 5</span>
                                <span className="text-gray-400 text-xs">📚 3</span>
                                <span className="text-gray-400 text-xs">🎯 2</span>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Vue Calendrier - Signaux économiques */}
                        {previewChannel === 'calendar' && (
                          <div className="space-y-4">
                            {/* Calendrier économique - Style original */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
                              <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Calendrier Économique - Décembre 2024</h2>
                              </div>

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
                                {(() => {
                                  const economicDays = [
                                    { date: 1, hasEvent: false },
                                    { date: 2, hasEvent: false },
                                    { date: 3, hasEvent: true, impact: 'high' },
                                    { date: 4, hasEvent: true, impact: 'high' },
                                    { date: 5, hasEvent: false },
                                    { date: 6, hasEvent: true, impact: 'medium' },
                                    { date: 7, hasEvent: false },
                                    { date: 8, hasEvent: false },
                                    { date: 9, hasEvent: false },
                                    { date: 10, hasEvent: true, impact: 'low' },
                                    { date: 11, hasEvent: true, impact: 'medium' },
                                    { date: 12, hasEvent: false },
                                    { date: 13, hasEvent: true, impact: 'high' },
                                    { date: 14, hasEvent: false },
                                    { date: 15, hasEvent: false },
                                    { date: 16, hasEvent: false },
                                    { date: 17, hasEvent: true, impact: 'medium' },
                                    { date: 18, hasEvent: true, impact: 'high' },
                                    { date: 19, hasEvent: false },
                                    { date: 20, hasEvent: true, impact: 'low' },
                                    { date: 21, hasEvent: false },
                                    { date: 22, hasEvent: false },
                                    { date: 23, hasEvent: false },
                                    { date: 24, hasEvent: false },
                                    { date: 25, hasEvent: false },
                                    { date: 26, hasEvent: false },
                                    { date: 27, hasEvent: true, impact: 'medium' },
                                    { date: 28, hasEvent: false },
                                    { date: 29, hasEvent: false },
                                    { date: 30, hasEvent: false },
                                    { date: 31, hasEvent: false }
                                  ];

                                  const getDayStyle = (day: { date: number; hasEvent: boolean; impact?: string }) => {
                                    const baseStyle = "h-12 rounded flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity";
                                    
                                    if (!day.hasEvent) {
                                      return `${baseStyle} bg-gray-700`;
                                    }

                                    switch (day.impact) {
                                      case 'high':
                                        return `${baseStyle} bg-red-600`;
                                      case 'medium':
                                        return `${baseStyle} bg-yellow-600 text-black`;
                                      case 'low':
                                        return `${baseStyle} bg-green-600`;
                                      default:
                                        return `${baseStyle} bg-gray-700`;
                                    }
                                  };

                                  return economicDays.map((day) => (
                                    <div
                                      key={day.date}
                                      className={getDayStyle(day)}
                                    >
                                      {day.date}
                                    </div>
                                  ));
                                })()}
                              </div>

                              {/* Légende */}
                              <div className="flex items-center justify-center gap-6 text-sm mt-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                                  <span className="text-white">WIN</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                                  <span className="text-white">LOSS</span>
                                </div>
                              </div>
                            </div>
                            {/* Statistiques Calendrier - Simple P&L et WR */}
                            <div className="bg-gray-800 rounded-lg p-6">
                              <h3 className="text-xl font-bold text-white mb-6">Statistiques Signaux</h3>
                              
                              {/* P&L Total - Grande carte verte comme Trading Journal */}
                              <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-6 mb-4">
                                <div className="text-green-300 text-sm mb-2">P&L Total</div>
                                <div className="text-4xl font-bold text-white">+$2,485</div>
                              </div>

                              {/* Win Rate - Grande carte bleue comme Trading Journal */}
                              <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-6">
                                <div className="text-blue-300 text-sm mb-2">Win Rate</div>
                                <div className="text-4xl font-bold text-white">89%</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Vue Trading Journal */}
                        {previewChannel === 'trading-journal' && (
                          <div className="space-y-4">
                            {/* Calendrier Trading Journal - Code original */}
                            <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
                              <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Trading Journal - Décembre 2024</h2>
                              </div>

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
                                {(() => {
                                  const calendarDays = [
                                    { date: 1, status: 'win' },
                                    { date: 2, status: 'win' },
                                    { date: 3, status: 'loss' },
                                    { date: 4, status: 'win' },
                                    { date: 5, status: 'be' },
                                    { date: 6, status: 'win' },
                                    { date: 7, status: 'win' },
                                    { date: 8, status: 'win' },
                                    { date: 9, status: 'loss' },
                                    { date: 10, status: 'win' },
                                    { date: 11, status: 'win' },
                                    { date: 12, status: 'be' },
                                    { date: 13, status: 'win' },
                                    { date: 14, status: 'win' },
                                    { date: 15, status: 'win' },
                                    { date: 16, status: 'loss' },
                                    { date: 17, status: 'win' },
                                    { date: 18, status: 'win' },
                                    { date: 19, status: 'win' },
                                    { date: 20, status: 'be' },
                                    { date: 21, status: 'win' },
                                    { date: 22, status: 'win' },
                                    { date: 23, status: 'loss' },
                                    { date: 24, status: 'win' },
                                    { date: 25, status: 'win' },
                                    { date: 26, status: 'win' },
                                    { date: 27, status: 'win' },
                                    { date: 28, status: 'be' },
                                    { date: 29, status: 'win' },
                                    { date: 30, status: 'win' },
                                    { date: 31, status: 'win' }
                                  ];

                                  const getDayStyle = (day: { date: number; status: string }) => {
                                    const baseStyle = "h-12 rounded flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity";
                                    
                                    switch (day.status) {
                                      case 'win':
                                        return `${baseStyle} bg-green-500`;
                                      case 'be':
                                        return `${baseStyle} bg-yellow-500 text-black`;
                                      case 'loss':
                                        return `${baseStyle} bg-red-500`;
                                      default:
                                        return `${baseStyle} bg-gray-700`;
                                    }
                                  };

                                  return calendarDays.map((day) => (
                                    <div
                                      key={day.date}
                                      className={getDayStyle(day)}
                                    >
                                      {day.date}
                                    </div>
                                  ));
                                })()}
                              </div>

                              {/* Légende */}
                              <div className="flex items-center justify-center gap-6 text-sm mt-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                                  <span className="text-white">Win</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                                  <span className="text-white">BE</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                                  <span className="text-white">Loss</span>
                                </div>
                              </div>
                            </div>

                            
                            {/* Statistiques Trading Journal - Format exact */}
                            <div className="bg-gray-800 rounded-lg p-6">
                              <h3 className="text-xl font-bold text-white mb-6">Statistiques Trades</h3>
                              
                              {/* P&L Total - Grande carte verte */}
                              <div className="bg-green-600/20 border border-green-500/30 rounded-xl p-6 mb-4">
                                <div className="text-green-300 text-sm mb-2">P&L Total</div>
                                <div className="text-4xl font-bold text-white">+$3,285</div>
                              </div>

                              {/* Win Rate - Grande carte bleue */}
                              <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-6 mb-6">
                                <div className="text-blue-300 text-sm mb-2">Win Rate</div>
                                <div className="text-4xl font-bold text-white">74%</div>
                              </div>

                              {/* Grid 2x2 - Statistiques détaillées */}
                              <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                  <div className="text-gray-400 text-sm mb-2">Aujourd'hui</div>
                                  <div className="text-2xl font-bold text-blue-400">2</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                  <div className="text-gray-400 text-sm mb-2">Ce mois</div>
                                  <div className="text-2xl font-bold text-white">23</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                  <div className="text-gray-400 text-sm mb-2">Avg Win</div>
                                  <div className="text-2xl font-bold text-green-400">+$195</div>
                                </div>
                                <div className="bg-gray-700/50 rounded-lg p-4">
                                  <div className="text-gray-400 text-sm mb-2">Avg Loss</div>
                                  <div className="text-2xl font-bold text-red-400">-$85</div>
                                </div>
                              </div>

                              {/* Weekly Breakdown */}
                              <div>
                                <h4 className="text-lg font-bold text-white mb-4">Weekly Breakdown</h4>
                                <div className="space-y-3">
                                  <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 flex justify-between items-center">
                                    <div>
                                      <div className="text-white font-medium">Week 1</div>
                                      <div className="text-gray-400 text-sm">6 trades</div>
                                    </div>
                                    <div className="text-green-400 text-xl font-bold">+$840</div>
                                  </div>
                                  <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 flex justify-between items-center">
                                    <div>
                                      <div className="text-white font-medium">Week 2</div>
                                      <div className="text-gray-400 text-sm">5 trades</div>
                                    </div>
                                    <div className="text-green-400 text-xl font-bold">+$1,120</div>
                                  </div>
                                  <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 flex justify-between items-center">
                                    <div>
                                      <div className="text-white font-medium">Week 3</div>
                                      <div className="text-gray-400 text-sm">7 trades</div>
                                    </div>
                                    <div className="text-red-400 text-xl font-bold">-$275</div>
                                  </div>
                                  <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 flex justify-between items-center">
                                    <div>
                                      <div className="text-white font-medium">Week 4</div>
                                      <div className="text-gray-400 text-sm">5 trades</div>
                                    </div>
                                    <div className="text-green-400 text-xl font-bold">+$1,600</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Zone de saisie - seulement pour general-chat et profit-loss */}
                      {(previewChannel === 'general-chat' || previewChannel === 'profit-loss') && (
                        <div className="p-4 border-t border-gray-700">
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Tapez votre message..."
                              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm placeholder-gray-400"
                            />
                            <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700">
                              Envoyer
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton Commencer maintenant après Aperçu de la plateforme */}
            <div className="text-center mt-8 mb-12">
              <button 
                onClick={() => {
                  const pricingSection = document.getElementById('pricing');
                  if (pricingSection) {
                    pricingSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 sm:px-12 py-5 sm:py-6 rounded-lg text-xl sm:text-2xl font-semibold hover:opacity-90"
              >
                Commencer maintenant
              </button>
            </div>

            {/* Section Avis Clients */}
            <div className="max-w-7xl mx-auto mb-10 px-4 sm:px-6">
              <h2 className="text-4xl sm:text-5xl font-bold text-white text-center mb-4">
                Ce qu'ils en pensent
              </h2>
              <div className="flex items-center justify-center gap-2 mb-8 sm:mb-12">
                <img src="https://cdn.trustpilot.net/brand-assets/4.1.0/logo-white.svg" alt="Trustpilot" className="h-8" />
                <span className="text-gray-300 text-lg">Vérifié par Trustpilot</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Avis 1 - Simplicité interface */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 sm:p-8 text-center shadow-lg border border-purple-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 hover:border-purple-400 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-2xl text-yellow-400 mb-4 group-hover:scale-110 transition-transform duration-300">⭐⭐⭐⭐⭐</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors duration-300">CryptoWolf</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Interface ultra simple ! Tout est à portée de main, pas besoin d'être expert pour s'y retrouver.</div>
                </div>

                {/* Avis 2 - Journal discipline */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 sm:p-8 text-center shadow-lg border border-purple-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 hover:border-blue-400 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-2xl text-yellow-400 mb-4 group-hover:scale-110 transition-transform duration-300">⭐⭐⭐⭐⭐</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">ScalpingQueen</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Le journal m'a donné la discipline qui me manquait. Je suis mes trades et j'analyse mes erreurs maintenant !</div>
                </div>

                {/* Avis 3 - Qualité explications live */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 sm:p-8 text-center shadow-lg border border-purple-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 hover:border-green-400 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-2xl text-yellow-400 mb-4 group-hover:scale-110 transition-transform duration-300">⭐⭐⭐⭐⭐</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">ForexMaster</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Les lives sont incroyables ! TheThe explique tout clairement, même les concepts complexes deviennent simples.</div>
                </div>

                {/* Avis 4 - Proximité avec TheThe */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 sm:p-8 text-center shadow-lg border border-purple-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 hover:border-purple-400 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-2xl text-yellow-400 mb-4 group-hover:scale-110 transition-transform duration-300">⭐⭐⭐⭐⭐</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors duration-300">TraderPro23</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">J'apprécie vraiment la proximité avec TheThe. Il répond à nos questions et nous guide personnellement.</div>
                </div>

                {/* Avis 5 - Simplicité setup */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 sm:p-8 text-center shadow-lg border border-purple-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 hover:border-blue-400 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-2xl text-yellow-400 mb-4 group-hover:scale-110 transition-transform duration-300">⭐⭐⭐⭐⭐</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">PipHunter</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Setup ultra simple ! En 5 minutes j'étais connecté et je recevais déjà les signaux. Parfait pour débuter.</div>
                </div>

                {/* Avis 6 - Bénéfices globaux */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 sm:p-8 text-center shadow-lg border border-purple-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 hover:border-green-400 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-2xl text-yellow-400 mb-4 group-hover:scale-110 transition-transform duration-300">⭐⭐⭐⭐⭐</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">BullRunner</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Grâce à TheThe, j'ai enfin une approche structurée du trading. Interface claire, explications parfaites !</div>
                </div>
              </div>
            </div>

            {/* Plans de prix - Mobile Optimized */}
            <div id="pricing" className="max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6">
              <h2 className="text-4xl sm:text-5xl font-bold text-white text-center mb-8 sm:mb-12">
                Choisissez votre plan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 max-w-6xl mx-auto">
                {/* Plan Starter */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 p-8 sm:p-12 rounded-xl border border-purple-500/50 backdrop-blur-sm hover:from-purple-600/30 hover:to-blue-600/30 transition-all duration-300 min-h-[600px]">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-3">Starter</h3>
                    <div className="text-4xl font-bold text-blue-400 mb-6">15€<span className="text-sm text-gray-400">/mois</span></div>
                    <div className="text-green-400 text-sm mb-4">🎯 Parfait pour débuter</div>
                                          <ul className="text-gray-300 text-base space-y-4 mb-8 text-left">
                        <li className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Tous les signaux (Crypto, Forex, Futures)</span>
                        </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Formation complète (10h de vidéos)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Accès au chat communautaire</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Calendrier de performance</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>Live Trading</span>
                      </li>
                      
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>Support prioritaire</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>Journal de trading personnalisé</span>
                      </li>
                    </ul>
                    <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors">
                      Commencer maintenant
                    </button>
                  </div>
                </div>

                {/* Plan Pro */}
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 sm:p-12 rounded-xl border border-blue-500/50 backdrop-blur-sm hover:from-blue-600/30 hover:to-purple-600/30 transition-all duration-300 relative min-h-[600px]">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    RECOMMANDÉ
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-3">Pro</h3>
                    <div className="text-4xl font-bold text-blue-400 mb-6">25€<span className="text-sm text-gray-400">/mois</span></div>
                    <div className="text-green-400 text-sm mb-4">🚀 Pour trader comme un pro</div>
                                          <ul className="text-gray-300 text-base space-y-4 mb-8 text-left">
                        <li className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Tous les signaux (Crypto, Forex, Futures)</span>
                        </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Formation complète + stratégies avancées</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Live Trading en direct (3x/semaine)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Calendrier avancé avec analytics</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Support prioritaire 24/7</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Signaux exclusifs VIP</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Journal de trading personnalisé</span>
                      </li>

                    </ul>
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors">
                      Devenir Pro
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Aperçu de la plateforme - Mobile Optimized - SUPPRIMÉ */}
            <div className="max-w-7xl mx-auto mb-6 sm:mb-10 px-2 sm:px-4" style={{display: 'none'}}>
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
                            activeChannel === 'fondamentaux' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('fondamentaux')}
                        >
                          📚 Fondamentaux
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[100px] ${
                            activeChannel === 'letsgooo-model' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('letsgooo-model')}
                        >
                          🚀 Letsgooo-model
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[90px] ${
                            activeChannel === 'crypto' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('crypto')}
                        >
                          🪙 Crypto
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[90px] ${
                            activeChannel === 'futur' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('futur')}
                        >
                          📈 Futur
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[90px] ${
                            activeChannel === 'forex' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('forex')}
                        >
                          💱 Forex
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[100px] ${
                            activeChannel === 'livestream' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('livestream')}
                        >
                          📺 Livestream
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[100px] ${
                            activeChannel === 'general-chat' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('general-chat')}
                        >
                          💬 General-chat
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[100px] ${
                            activeChannel === 'profit-loss' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('profit-loss')}
                        >
                          💰 Profit-loss
                        </div>
                        <div 
                          className={`px-4 py-3 rounded-lg cursor-pointer transition-colors whitespace-nowrap text-sm font-medium min-w-[100px] ${
                            activeChannel === 'calendar' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('calendar')}
                        >
                          📅 Journal Signaux
                        </div>
                      </div>

                      {/* Desktop: Vertical sidebar */}
                      <div className="hidden sm:block space-y-2">
                        {/* ÉDUCATION */}
                        <div className="mb-4">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">ÉDUCATION</h3>
                          <div className="space-y-1">
                            <div 
                              className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                                activeChannel === 'fondamentaux' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                              }`}
                              onClick={() => setActiveChannel('fondamentaux')}
                            >
                              📚 Fondamentaux
                            </div>
                            <div 
                              className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                                activeChannel === 'letsgooo-model' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                              }`}
                              onClick={() => setActiveChannel('letsgooo-model')}
                            >
                              🚀 Letsgooo-model
                            </div>
                          </div>
                        </div>

                        {/* SIGNAUX */}
                        <div className="mb-4">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">SIGNAUX</h3>
                          <div className="space-y-1">
                            <div 
                              className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                                activeChannel === 'crypto' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                              }`}
                              onClick={() => setActiveChannel('crypto')}
                            >
                              🪙 Crypto
                            </div>
                            <div 
                              className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                                activeChannel === 'futur' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                              }`}
                              onClick={() => setActiveChannel('futur')}
                            >
                              📈 Futur
                            </div>
                            <div 
                              className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                                activeChannel === 'forex' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                              }`}
                              onClick={() => setActiveChannel('forex')}
                            >
                              💱 Forex
                            </div>
                          </div>
                        </div>

                        {/* TRADING HUB */}
                        <div className="mb-4">
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">TRADING HUB</h3>
                          <div className="space-y-1">
                            <div 
                              className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                                activeChannel === 'livestream' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                              }`}
                              onClick={() => setActiveChannel('livestream')}
                            >
                              📺 Livestream
                            </div>
                            <div 
                              className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                                activeChannel === 'general-chat' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                              }`}
                              onClick={() => setActiveChannel('general-chat')}
                            >
                              💬 General-chat
                            </div>
                            <div 
                              className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                                activeChannel === 'profit-loss' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                              }`}
                              onClick={() => setActiveChannel('profit-loss')}
                            >
                              💰 Profit-loss
                            </div>
                            <div 
                              className={`px-4 py-3 rounded-lg cursor-pointer transition-colors text-sm font-medium ${
                                activeChannel === 'calendar' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                              }`}
                              onClick={() => setActiveChannel('calendar')}
                            >
                              📅 Journal Signaux
                            </div>
                          </div>
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
                                ) : message.type === 'formation' ? (
                                  <div className="bg-gray-700 rounded-lg p-6">
                                    <div className="flex flex-col lg:flex-row gap-6">
                                      {/* Image de formation */}
                                      <div className="lg:w-1/3">
                                        <img 
                                          src={message.content.image} 
                                          alt={message.content.title}
                                          className="w-full h-48 lg:h-64 object-cover rounded-lg shadow-lg"
                                        />
                                      </div>
                                      
                                      {/* Contenu de formation */}
                                      <div className="lg:w-2/3">
                                        <h3 className="text-xl font-bold text-white mb-3">{message.content.title}</h3>
                                        <p className="text-gray-300 mb-4">{message.content.description}</p>
                                        
                                        {/* Métadonnées */}
                                        <div className="flex items-center gap-4 mb-4 text-sm">
                                          <span className="text-blue-400">⏱️ {message.content.duration}</span>
                                          <span className="text-green-400">📊 {message.content.progress}</span>
                                        </div>
                                        
                                        {/* Topics */}
                                        <div className="mb-4">
                                          <h4 className="text-white font-semibold mb-2">Contenu:</h4>
                                          <ul className="space-y-1">
                                            {message.content.topics.map((topic: string, idx: number) => (
                                              <li key={idx} className="flex items-center gap-2 text-gray-300">
                                                <span className="text-blue-400">•</span>
                                                <span>{topic}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                        
                                        {/* Bouton d'action */}
                                        <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
                                          Commencer la formation
                                        </button>
                                      </div>
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

                      {/* Zone de saisie - seulement pour general-chat et profit-loss */}
                      {(previewChannel === 'general-chat' || previewChannel === 'profit-loss') && (
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
                      )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                  {/* Légal - Éléments essentiels */}
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Informations Légales</h4>
                    <div className="space-y-3">
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Mentions légales</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Politique de confidentialité</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Conditions d'utilisation</a>
                    </div>
                  </div>

                  {/* Risques et Conformité */}
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Conformité</h4>
                    <div className="space-y-3">
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Avertissement sur les risques</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Conflits d'intérêts</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Cookies et traceurs</a>
                    </div>
                  </div>

                  {/* Contact et Support */}
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Contact</h4>
                    <div className="space-y-3">
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Support client</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Signalement d'incident</a>
                      <a href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">Nous contacter</a>
                    </div>
                  </div>
                </div>

                {/* Avertissement sur les risques */}
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mt-12 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="text-red-400 text-xl flex-shrink-0 mt-1">⚠️</div>
                    <div>
                      <h4 className="text-red-400 font-bold text-lg mb-3">Avertissement sur les risques</h4>
                      <div className="text-gray-300 text-sm leading-relaxed space-y-2">
                        <p><strong>Le trading comporte des risques importants de perte en capital.</strong> Vous pourriez perdre tout ou partie de votre investissement initial.</p>
                        <p><strong>Les performances passées ne garantissent pas les résultats futurs.</strong> Les signaux et analyses présentés ne constituent pas des conseils en investissement personnalisés.</p>
                        <p><strong>Tradez uniquement avec des fonds que vous pouvez vous permettre de perdre.</strong> TheTheTrader ne saurait être tenu responsable des pertes encourues suite à l'utilisation de nos services.</p>
                        <p className="text-xs text-gray-400 mt-4">Ce service est destiné à des fins éducatives et d'information. Consultez un conseiller financier professionnel avant toute décision d'investissement.</p>
                      </div>
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

export default App;// Force rebuild Fri Aug  8 01:13:24 CEST 2025
