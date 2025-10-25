import React, { useState, useEffect } from 'react';
import './index.css';
import TradingPlatformShell from './components/generated/TradingPlatformShell';
import AdminLogin from './components/AdminLogin';
import AdminInterface from './components/AdminInterface';
import UserChat from './components/UserChat';
import ProfitLoss from './components/ProfitLoss';
import LivestreamPage from './components/LivestreamPage';
import UserLivestreamPage from './components/UserLivestreamPage';
import PreviewCalendar from './components/PreviewCalendar';
import { supabase } from './lib/supabase';


import { useNotifications } from './hooks/use-notifications';
import { usePWA } from './hooks/use-pwa';

// FORCE DEPLOYMENT: 2025-01-13 04:25:00 - FIX OLD CONTENT

// Types
interface User {
  id: string;
  email: string;
}

// Déclaration pour le prompt d'installation PWA
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [paymentType, setPaymentType] = useState<'monthly' | 'yearly'>('monthly');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fonction pour changer le type de paiement avec animation
  const handlePaymentTypeChange = (newType: 'monthly' | 'yearly') => {
    if (newType === paymentType) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      setPaymentType(newType);
    }, 250);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
  };

  // Ajouter CSS pour le scroll mobile
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      body, html {
        overflow-x: hidden;
        max-width: 100vw;
      }
      .pwa-landing-no-scroll {
        overflow: hidden !important;
        height: 100vh !important;
        max-height: 100vh !important;
        position: fixed !important;
        width: 100% !important;
        top: 0 !important;
        left: 0 !important;
        touch-action: none !important;
      }
      .pwa-connected-scroll {
        overflow-y: auto !important;
        overflow-x: hidden !important;
        min-height: 100vh !important;
        position: relative !important;
        width: 100% !important;
        touch-action: pan-y !important;
        -webkit-overflow-scrolling: touch !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  
  // Exposer setCurrentPage globalement pour debug
  useEffect(() => {
    (window as any).setCurrentPage = setCurrentPage;
    (window as any).getCurrentPage = () => currentPage;
  }, [currentPage]);

  // Détecter URL admin et vérifier persistance
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setCurrentPage('admin');
      console.log('🔍 Admin auth check:', localStorage.getItem('adminAuthenticated'));
    }
  }, []);

  // Détecter les changements d'URL avec hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1); // Enlever le #
      if (hash === 'livestream') {
        setCurrentPage('livestream');
      }
    };

    // Vérifier le hash au chargement
    handleHashChange();

    // Écouter les changements de hash
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);


  // Changer manifeste selon la page
  useEffect(() => {
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      if (currentPage === 'admin') {
        manifestLink.href = '/manifest-admin.json';
      } else {
        manifestLink.href = '/manifest.json';
      }
    }
  }, [currentPage]);





  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeChannel, setActiveChannel] = useState('crypto');
  const [previewChannel, setPreviewChannel] = useState('crypto');
  const [selectedService, setSelectedService] = useState('journal');

  // Fonction pour faire défiler vers une section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Temporairement permettre le scroll
      document.body.style.overflow = 'auto';
      element.scrollIntoView({ behavior: 'smooth' });
      // Remettre le scroll bloqué après un délai
      setTimeout(() => {
        if (isPWA && currentPage === 'home' && !user) {
          document.body.style.overflow = 'hidden';
        }
      }, 1000);
    }
  };

  // Fonction pour obtenir l'image du service
  const getServiceImage = (service: string) => {
    const images = {
      'signaux': '/signaux.png',
      'formation': '/formation.png',
      'journal': '/journaux.png',
      'live': '/live.png',
      'app': '/app.png',
      'analytics': '/analytics.png',
      'chat': '/signal.png' // Image par défaut pour chat
    };
    return images[service as keyof typeof images] || '/signal.png';
  };

  // Fonction pour obtenir l'image PWA du service
  const getServicePwaImage = (service: string) => {
    const pwaImages: { [key: string]: string } = {
      'signaux': '/pwa signaux.png',
      'formation': '/pwa app.png', // Utilise l'image PWA app pour formation
      'journal': '/pwa journal.png',
      'live': '/pwa live.png',
      'app': '/pwa app.png',
      'analytics': '/pwa analytics.png',
      'chat': '/pwa.png' // Pas d'image PWA spécifique
    };
    return pwaImages[service] || '/pwa.png';
  };
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

    'chatzone': [],
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
  
  // Empêcher le scroll en PWA seulement quand on est connecté (dans l'app)
  useEffect(() => {
    if (isPWA && user) {
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
  }, [isPWA, user]);


  // Précharger l'image pour éviter le clignotement
  useEffect(() => {
    const img = new Image();
    img.src = '/images/tradingview-chart.png';
  }, []);

  // Capturer le prompt d'installation PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
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

    'chatzone': {
      title: '#chatzone',
      messages: []
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



  const handleLogin = async () => {
    if (email && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (error) {
          console.error('Erreur de connexion:', error.message);
          alert('Identifiants incorrects. Veuillez vérifier votre email et mot de passe.');
          return;
        }
        if (data.user) {
          console.log('Connexion réussie:', data.user.email);
          setUser({ id: data.user.id, email: data.user.email || email });
          setShowAuthModal(false);
        }
      } catch (error) {
        console.error('Erreur de connexion:', error);
        alert('Erreur de connexion. Veuillez réessayer.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setEmail('');
      setPassword('');
      setCurrentPage('home');
      console.log('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  // Function to render legal pages
  const renderLegalPage = () => {
    const pages: Record<string, { title: string; content: React.ReactElement }> = {
      'mentions-legales': {
        title: 'Mentions légales',
        content: (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Mentions légales</h2>
            <div className="space-y-4 text-gray-300">
              <p><strong>Dénomination sociale :</strong> TheTheTrader</p>
              <p><strong>Activité :</strong> Plateforme éducative de trading et signaux financiers</p>
              <p><strong>Hébergeur :</strong> Netlify, Inc. - 2325 3rd Street, Suite 296, San Francisco, CA 94107</p>
              <p><strong>Directeur de publication :</strong> TheTheTrader</p>
              <p className="text-sm text-gray-400">Dernière mise à jour : Janvier 2025</p>
            </div>
          </div>
        )
      },
      'politique-confidentialite': {
        title: 'Politique de confidentialité',
        content: (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Politique de confidentialité</h2>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-lg font-semibold text-white">Collecte des données</h3>
              <p>Nous collectons uniquement les données nécessaires au fonctionnement de notre service : adresse email pour la création de compte.</p>
              
              <h3 className="text-lg font-semibold text-white">Utilisation des données</h3>
              <p>Vos données sont utilisées pour vous fournir l'accès à nos signaux de trading et contenus éducatifs.</p>
              
              <h3 className="text-lg font-semibold text-white">Protection des données</h3>
              <p>Nous mettons en place toutes les mesures techniques et organisationnelles pour protéger vos données personnelles.</p>
              
              <p className="text-sm text-gray-400">Conformément au RGPD. Dernière mise à jour : Janvier 2025</p>
            </div>
          </div>
        )
      },
      'conditions-utilisation': {
        title: 'Conditions d\'utilisation',
        content: (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Conditions d'utilisation</h2>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-lg font-semibold text-white">Acceptation des conditions</h3>
              <p>En utilisant TheTheTrader, vous acceptez ces conditions d'utilisation.</p>
              
              <h3 className="text-lg font-semibold text-white">Services fournis</h3>
              <p>Nous fournissons des signaux de trading, du contenu éducatif et des outils d'analyse à des fins informatives uniquement.</p>
              
              <h3 className="text-lg font-semibold text-white">Responsabilités</h3>
              <p>Vous êtes seul responsable de vos décisions de trading. Nos services ne constituent pas des conseils financiers personnalisés.</p>
              
              <h3 className="text-lg font-semibold text-white">Limitation de responsabilité</h3>
              <p>TheTheTrader ne peut être tenu responsable des pertes financières résultant de l'utilisation de nos services.</p>
              
              <p className="text-sm text-gray-400">Dernière mise à jour : Janvier 2025</p>
            </div>
          </div>
        )
      },
      'avertissement-risques': {
        title: 'Avertissement sur les risques',
        content: (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Avertissement sur les risques</h2>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-red-400 text-xl flex-shrink-0 mt-1">⚠️</div>
                <div className="space-y-4 text-gray-300">
                  <p><strong className="text-red-400">RISQUE ÉLEVÉ DE PERTE EN CAPITAL</strong></p>
                  <p>Le trading de produits financiers comporte un risque élevé de perte en capital. Vous pourriez perdre tout ou partie de votre investissement initial.</p>
                  <p><strong>Les performances passées ne garantissent pas les résultats futurs.</strong> Les signaux et analyses présentés sur cette plateforme ne constituent pas des conseils en investissement personnalisés.</p>
                  <p><strong>Ne tradez qu'avec des fonds que vous pouvez vous permettre de perdre.</strong></p>
                  <p>Les produits dérivés (CFD, Forex, Futures) sont particulièrement risqués en raison de l'effet de levier.</p>
                  <p><strong>Consultez un conseiller financier professionnel</strong> avant toute décision d'investissement importante.</p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      'conflits-interets': {
        title: 'Conflits d\'intérêts',
        content: (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Conflits d'intérêts</h2>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-lg font-semibold text-white">Transparence</h3>
              <p>TheTheTrader s'engage à une transparence totale concernant les potentiels conflits d'intérêts.</p>
              
              <h3 className="text-lg font-semibold text-white">Partenariats</h3>
              <p>Nous pouvons recevoir des commissions de la part de brokers partenaires. Ces partenariats n'influencent pas nos analyses.</p>
              
              <h3 className="text-lg font-semibold text-white">Positions personnelles</h3>
              <p>Nos analystes peuvent détenir des positions sur les instruments analysés. Cela sera mentionné le cas échéant.</p>
              
              <p className="text-sm text-gray-400">Dernière mise à jour : Janvier 2025</p>
            </div>
          </div>
        )
      },
      'cookies-traceurs': {
        title: 'Cookies et traceurs',
        content: (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Cookies et traceurs</h2>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-lg font-semibold text-white">Utilisation des cookies</h3>
              <p>Nous utilisons des cookies pour améliorer votre expérience utilisateur et analyser l'utilisation de notre site.</p>
              
              <h3 className="text-lg font-semibold text-white">Types de cookies</h3>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Cookies techniques :</strong> Nécessaires au fonctionnement du site</li>
                <li><strong>Cookies analytiques :</strong> Pour comprendre l'utilisation du site</li>
                <li><strong>Cookies de préférences :</strong> Pour mémoriser vos choix</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-white">Gestion des cookies</h3>
              <p>Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.</p>
              
              <p className="text-sm text-gray-400">Dernière mise à jour : Janvier 2025</p>
            </div>
          </div>
        )
      },
      'support-client': {
        title: 'Support client',
        content: (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Support client</h2>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-lg font-semibold text-white">Comment nous contacter</h3>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="space-y-3">
                  <p><strong>Email :</strong> support@tradingpourlesnuls.com</p>
                  <p><strong>Heures d'ouverture :</strong> Lundi - Vendredi, 9h00 - 18h00 (CET)</p>
                  <p><strong>Temps de réponse moyen :</strong> 24-48 heures</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white">Questions fréquentes</h3>
              <div className="space-y-3">
                <div className="bg-gray-800 rounded-lg p-4">
                  <p><strong>Q: Comment accéder aux signaux ?</strong></p>
                  <p>R: Créez un compte et connectez-vous pour accéder à tous nos signaux en temps réel.</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p><strong>Q: Les signaux sont-ils gratuits ?</strong></p>
                  <p>R: Oui, notre service est actuellement gratuit pour tous les utilisateurs inscrits.</p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      'signalement-incident': {
        title: 'Signalement d\'incident',
        content: (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Signalement d'incident</h2>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-lg font-semibold text-white">Signaler un problème</h3>
              <p>Si vous rencontrez un problème technique ou souhaitez signaler un incident, contactez-nous immédiatement.</p>
              
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6">
                <h4 className="text-yellow-400 font-semibold mb-3">🚨 Signalement d'urgence</h4>
                <div className="space-y-2">
                  <p><strong>Email prioritaire :</strong> incident@tradingpourlesnuls.com</p>
                  <p><strong>Objet :</strong> [URGENT] - Description du problème</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white">Types d'incidents à signaler</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Problèmes de sécurité</li>
                <li>Bugs critiques de la plateforme</li>
                <li>Erreurs dans les signaux</li>
                <li>Problèmes d'accès au compte</li>
              </ul>
            </div>
          </div>
        )
      },
      'nous-contacter': {
        title: 'Nous contacter',
        content: (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Nous contacter</h2>
            <div className="space-y-4 text-gray-300">
              <h3 className="text-lg font-semibold text-white">Informations de contact</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-3">📧 Contact général</h4>
                  <p>contact@tradingpourlesnuls.com</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-3">🛠️ Support technique</h4>
                  <p>support@tradingpourlesnuls.com</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-3">📈 Partenariats</h4>
                  <p>business@tradingpourlesnuls.com</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-3">⚖️ Questions légales</h4>
                  <p>legal@tradingpourlesnuls.com</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white">Horaires d'ouverture</h3>
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="space-y-2">
                  <p><strong>Lundi - Vendredi :</strong> 9h00 - 18h00 (CET)</p>
                  <p><strong>Week-end :</strong> Fermé</p>
                  <p><strong>Jours fériés :</strong> Fermé</p>
                </div>
              </div>
            </div>
          </div>
        )
      },
      'livestream': {
        title: 'Livestream Trading',
        content: user ? (
          <LivestreamPage />
        ) : (
          <UserLivestreamPage />
        )
      }
    };

    if (currentPage === 'home' || !pages[currentPage]) return null;

    const page = pages[currentPage];
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${isPWA && currentPage === 'home' && !user ? 'pwa-landing-no-scroll' : isPWA && user ? 'pwa-connected-scroll' : ''}`}>
        {/* Header with back button */}
        <nav className="flex items-center justify-between p-4 sm:p-6 relative z-50 border-b border-purple-700/50">
          <button 
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {page.title}
          </div>
          <div className="w-20"></div>
        </nav>

        {/* Page content */}
        <div className="max-w-4xl mx-auto p-6 sm:p-8">
          {page.content}
        </div>
      </div>
    );
  };



  // Vérifier accès admin AVANT la vérification user
  if (currentPage === 'admin') {
    const isAdminAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';

    if (isAdminAuthenticated) {
      return <AdminInterface />;
    } else {
      return <AdminLogin onLogin={(adminData) => {
        console.log('✅ Admin connecté dans App.tsx:', adminData.user.email);
        // Marquer comme admin authentifié
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('adminUser', JSON.stringify(adminData.user));
        // Recharger la page admin
        setCurrentPage('temp');
        setTimeout(() => setCurrentPage('admin'), 100);
      }} />;
    }
  }

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
                
  // Si on est sur une page légale, l'afficher
  if (currentPage !== 'home') {
    return renderLegalPage();
  }



  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 ${isPWA && currentPage === 'home' && !user ? 'pwa-landing-no-scroll' : isPWA && user ? 'pwa-connected-scroll' : ''}`}>
      {/* Navigation - Masquée en PWA */}
      {!isPWA && (
        <nav className="flex items-center justify-between p-4 sm:p-6 relative z-50">
          <div className="flex items-center">
            <img 
              src="/logo-removebg-preview.png" 
              alt="Trading pour les nuls" 
              className="h-12 sm:h-16 md:h-40 w-auto"

            />
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#services" className="text-gray-300 hover:text-white transition-all duration-200">Services</a>
            <a href="#about-thethetrader" className="text-gray-300 hover:text-white transition-all duration-200">À propos</a>
            <a href="#interface" className="text-gray-300 hover:text-white transition-all duration-200">La plateforme</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-all duration-200">Prix</a>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={(e) => {
                e.preventDefault();
                // Déclencher l'installation PWA
                if ('serviceWorker' in navigator) {
                  // Montrer les instructions d'installation PWA pour iOS
                  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    console.log('Pour installer l\'app: Appuyez sur le bouton Partager 📤, puis "Sur l\'écran d\'accueil"');
                  } else {
                    // Pour autres navigateurs, essayer le prompt d'installation
                    if (window.deferredPrompt) {
                      window.deferredPrompt.prompt();
                    } else {
                      console.log('Utilisez le menu de votre navigateur pour "Ajouter à l\'écran d\'accueil" ou "Installer l\'application"');
                    }
                  }
                }
              }}
              className="bg-black/80 border-2 border-gray-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold hover:bg-black/90 hover:border-white transition-all duration-300 text-sm sm:text-base flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L3 7l9 5 9-5-9-5zM3 17l9 5 9-5M3 12l9 5 9-5"/>
              </svg>
              <span className="hidden sm:inline">Télécharger l'app</span>
              <span className="sm:hidden">App</span>
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

      {/* Version PWA - Page scrollable quand connecté */}
      {isPWA ? (
        <div className={`w-screen ${user ? 'min-h-screen' : 'h-screen overflow-hidden flex items-center justify-center'} bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`}>
          {/* Hero Section - Centré verticalement quand pas connecté, scrollable quand connecté */}
          <div className={`text-center ${user ? 'pt-20 pb-8' : 'w-full'} px-4 sm:px-6 max-w-full`}>
            <div className="mb-0 flex justify-center hover:scale-105 transition-transform duration-300">
              <img 
                src="/logo-removebg-preview.png" 
                alt="Trading pour les nuls" 
                className="h-64 sm:h-80 w-auto object-cover"
                style={{ clipPath: 'inset(10% 5% 15% 5%)' }}

              />
            </div>
            <p className="text-lg sm:text-2xl text-gray-300 mb-6 sm:mb-8 max-w-4xl mx-auto px-2 -mt-8">
              Un setup très simple, des signaux expliqués, un journal de performance. Rejoins la communauté et trade en confiance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-6 sm:mb-8 px-4">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-lg text-lg sm:text-xl font-semibold hover:opacity-90 w-full sm:w-auto"
              >
                Se connecter
              </button>
            </div>


            
            {/* Barre de défilement - Sous le bouton */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 sm:py-4 overflow-hidden relative w-full max-w-full rounded-lg mx-auto">
              <div className="whitespace-nowrap animate-scroll">
                <span className="text-lg sm:text-3xl font-bold mx-6 sm:mx-24">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-6 sm:mx-24">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-6 sm:mx-24">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-6 sm:mx-24">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-6 sm:mx-24">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-6 sm:mx-24">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-6 sm:mx-24">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-6 sm:mx-24">EASY SETUP EASY SCALPING</span>
              </div>
            </div>
            
            {/* Lien Twitter */}
            <div className="text-center mt-6">
              <a 
                href="https://x.com/thethetrader" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Suivez @thethetrader
              </a>
            </div>
          </div>
          
          {/* Contenu complet quand connecté */}
          {user && (
            <>
              {/* Hero Section complète */}
              <div className="text-center pt-20 sm:pt-32 pb-0 px-4 sm:px-6">
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8">
                  <span className="text-white">Ne t'abonne pas si tu ne veux pas</span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    vraiment apprendre à trader.
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-400 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
                  Tu n'as pas besoin d'être un expert pour trader efficacement. Tu as juste besoin de la bonne méthode — simple, directe, et conçue pour t'apprendre à penser comme un pro.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8">
                  <div className="flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-lg">
                    <span className="text-green-200">✓</span>
                    <span className="font-semibold">3j Garantie Satisfait</span>
                  </div>
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Commencer Maintenant
                  </button>
                </div>

                {/* Barre de défilement - Full Width */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 sm:py-10 overflow-hidden relative mb-10 sm:mb-16 w-full">
                  <div className="whitespace-nowrap animate-scroll">
                    <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                    <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                    <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                    <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                    <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                    <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                    <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                    <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                  </div>
                </div>
              </div>

              {/* Section Apprentissage */}
              <div className="py-16 sm:py-24 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-8">
                    <div className="text-sm font-semibold text-purple-400 mb-4 tracking-wider">
                      APPRENTISSAGE
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6">
                      <span className="text-white">Adoptez mon approche</span>
                      <br />
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        précise
                      </span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
                      Découvre ma méthode de scalping : analyse graphique pure, zéro indicateurs, zéro blabla. 
                      Un setup précis qui se répète sans fin pour des trades rapides et efficaces.
                    </p>
                  </div>

                  {/* Plans de prix - Mobile Optimized */}
                  <div id="pricing" className="max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6">
                    <h2 className="text-5xl md:text-7xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                      Les services de TPLN
                    </h2>
                    
                    {/* Payment Type Selector */}
                    <div className="flex justify-center mb-8">
                      <div className="bg-gray-800 p-1 rounded-lg flex">
                        <button 
                          onClick={() => handlePaymentTypeChange('monthly')}
                          className={`px-6 py-3 rounded-lg font-medium ${
                            paymentType === 'monthly' 
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                              : 'text-gray-400'
                          }`}
                        >
                          Payer mensuellement
                        </button>
                        <button 
                          onClick={() => handlePaymentTypeChange('yearly')}
                          className={`px-6 py-3 rounded-lg font-medium ${
                            paymentType === 'yearly' 
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                              : 'text-gray-400'
                          }`}
                        >
                          Payer annuellement
                        </button>
                      </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className={`grid md:grid-cols-[0.9fr_1.1fr] gap-6 sm:gap-8 transition-all duration-400 ease-out ${isTransitioning ? 'opacity-0 scale-75 rotate-3 blur-md translate-y-20 transform-gpu perspective-1000' : 'opacity-100 scale-100 rotate-0 blur-0 translate-y-0 transform-gpu perspective-1000'}`} style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
                      
                      {/* Basic Plan */}
                      <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 sm:p-8 relative border-2 transition-all duration-500 ${isTransitioning ? 'border-purple-500 shadow-[0_0_30px_rgba(147,51,234,0.3)] scale-105 rotate-y-3 brightness-110 backdrop-blur-sm' : 'border-gray-700 hover:border-purple-500 hover:shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:scale-105 hover:rotate-y-3 hover:brightness-110 hover:backdrop-blur-sm'} transform-gpu`}>
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse md:hidden">
                          {paymentType === 'yearly' ? '💎 ÉCONOMISE 50€' : ''}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">BASIC</h3>
                        <div className={`text-4xl font-bold text-white mb-6 transition-all duration-500 ${isTransitioning ? 'scale-110' : 'scale-100'}`}>
                          <span className="text-2xl align-top text-gray-300">€</span>
                          {paymentType === 'monthly' ? '39' : '34,83'}
                          <span className="text-lg text-gray-400 font-normal"> / mois</span>
                          {paymentType === 'yearly' && (
                            <div className="text-gray-300 text-sm font-normal mt-2">
                              Facturé 418€ / an
                            </div>
                          )}
                          <div className="text-yellow-400 text-sm font-semibold mt-2 bg-yellow-400/10 px-3 py-1 rounded-full">
                            🎉 Première semaine à 4€ seulement !
                          </div>
                        </div>
                        {paymentType === 'yearly' && (
                          <div className="text-gray-400 text-sm mb-4">Best for beginner traders</div>
                        )}
                        <ul className="text-gray-300 text-base space-y-4 mb-8 text-left">
                          <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span>Formation Setup</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span>Signaux standard</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span>Journal de trading 1 compte</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span>Statistiques de base</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span>Live streams (1/semaine)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-red-400">✗</span>
                            <span>Accès prioritaire aux nouveaux setups</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-gray-300">Standard</span>
                            <span>Support standard</span>
                          </li>
                        </ul>
                        <button 
                          onClick={() => setShowAuthModal(true)}
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          Commencer
                        </button>
                        <div className="text-center mt-4">
                          <button className="text-gray-400 hover:text-white text-sm underline">
                            Voir le détail complet
                          </button>
                        </div>
                      </div>

                      {/* Premium Plan */}
                      <div className={`bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-6 sm:p-8 relative border-2 transition-all duration-500 ${isTransitioning ? 'border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.5)] scale-105 rotate-y-6 brightness-110 backdrop-blur-sm' : 'border-purple-500 hover:border-blue-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:scale-105 hover:rotate-y-6 hover:brightness-110 hover:backdrop-blur-sm'} transform-gpu`}>
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse md:hidden">
                          {paymentType === 'yearly' ? '💎 ÉCONOMISE 100€' : '⭐ RECOMMANDÉ'}
                        </div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-3">PREMIUM</h3>
                        <div className={`text-4xl font-bold text-white mb-6 transition-all duration-500 ${isTransitioning ? 'scale-110' : 'scale-100'}`}>
                          <span className="text-2xl align-top text-gray-300">€</span>
                          {paymentType === 'monthly' ? '79' : '57,5'}
                          <span className="text-lg text-gray-400 font-normal"> / mois</span>
                          {paymentType === 'yearly' && (
                            <div className="text-gray-300 text-sm font-normal mt-2">
                              Facturé 690€ / an
                            </div>
                          )}
                          <div className="text-yellow-400 text-sm font-semibold mt-2 bg-yellow-400/10 px-3 py-1 rounded-full">
                            🎉 Première semaine à 4€ seulement !
                          </div>
                        </div>
                        {paymentType === 'yearly' && (
                          <div className="text-gray-400 text-sm mb-4">Best for advanced traders</div>
                        )}
                        <ul className="text-gray-300 text-base space-y-4 mb-8 text-left">
                          <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span>Formation Setup</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span>Signaux en temps réel détaillés</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span>Journal de trading multi-comptes</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span>Statistiques avancées par setup</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span>Live streams (5 jours/semaine)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span>Accès prioritaire aux nouveaux setups</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-green-400">✓</span>
                            <span>Support prioritaire et contact direct</span>
                          </li>
                        </ul>
                        <button 
                          onClick={() => setShowAuthModal(true)}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          Commencer
                        </button>
                        <div className="text-center mt-4">
                          <button className="text-gray-400 hover:text-white text-sm underline">
                            Voir le détail complet
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Hero Section - Mobile Optimized */}
          <div className="text-center pt-20 sm:pt-32 pb-0 px-4 sm:px-6">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8">
              <span className="text-white">Ne t'abonne pas si tu ne veux pas</span>
              <br />
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                vraiment apprendre à trader.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed">
              Tu n'as pas besoin d'être un expert pour trader efficacement. Tu as juste besoin de la bonne méthode — simple, directe, et conçue pour t'apprendre à penser comme un pro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8">
              <div className="flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-lg">
                <span className="text-green-200">✓</span>
                <span className="font-semibold">3j Garantie Satisfait</span>
              </div>
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Commencer Maintenant
              </button>
            </div>

            {/* Barre de défilement - Full Width */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 sm:py-10 overflow-hidden relative mb-10 sm:mb-16 w-full">
              <div className="whitespace-nowrap animate-scroll">
                <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
                <span className="text-lg sm:text-3xl font-bold mx-4 sm:mx-16">EASY SETUP EASY SCALPING</span>
              </div>
            </div>



            {/* Nos Services - Navigation Horizontale */}
            <div id="services" className="w-full mb-10 sm:mb-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-20">
                <h2 className="text-4xl sm:text-5xl font-bold text-center">
                  <div className="text-white">Les services</div>
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                    de TPLN
                  </span>
              </h2>
                </div>

              {/* Barre de navigation horizontale - Full width sur mobile */}
              <div className="w-screen bg-white/5 backdrop-blur-sm border-y border-white/10 -mx-4 sm:mx-0 sm:w-full overflow-hidden">
                <div className="flex items-center justify-between px-0 sm:px-4 py-6 w-full">
                  {/* Flèche gauche - Masquée sur mobile */}
                  <button className="hidden sm:block text-gray-400 hover:text-white transition-colors p-2 flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Services avec icônes - Scroll horizontal sur mobile */}
                  <div 
                    className="flex items-center gap-6 sm:gap-8 overflow-x-auto sm:overflow-x-visible scrollbar-hide w-full sm:w-auto px-4 sm:px-0"
                    style={{
                      WebkitOverflowScrolling: 'touch',
                      overflowX: 'auto',
                      display: 'flex',
                      flexWrap: 'nowrap'
                    }}
                  >
                    {/* Formation */}
                    <div 
                      className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                      onClick={() => {
                        setSelectedService('formation');
                        scrollToSection('section-formation');
                      }}
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-colors ${
                        selectedService === 'formation' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-blue-600'
                      }`}>
                        <svg className="w-6 h-6 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <span className={`text-xs sm:text-base transition-colors ${
                        selectedService === 'formation' ? 'text-white font-medium' : 'text-gray-400 group-hover:text-white'
                      }`}>Formation</span>
                </div>

                    {/* Signaux */}
                    <div 
                      className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                      onClick={() => {
                        setSelectedService('signaux');
                        scrollToSection('section-signaux');
                      }}
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-colors ${
                        selectedService === 'signaux' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-purple-600'
                      }`}>
                        <svg className="w-6 h-6 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <span className={`text-xs sm:text-base transition-colors ${
                        selectedService === 'signaux' ? 'text-white font-medium' : 'text-gray-400 group-hover:text-white'
                      }`}>Signaux</span>
                </div>

                    {/* Journal */}
                    <div 
                      className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                      onClick={() => {
                        setSelectedService('journal');
                        scrollToSection('section-journal');
                      }}
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-colors ${
                        selectedService === 'journal' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-purple-700'
                      }`}>
                        <svg className="w-6 h-6 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className={`text-xs sm:text-base transition-colors ${
                        selectedService === 'journal' ? 'text-white font-medium' : 'text-gray-400 group-hover:text-white'
                      }`}>Journal</span>
                </div>

                    {/* Live Trading */}
                    <div 
                      className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                      onClick={() => {
                        setSelectedService('live');
                        scrollToSection('section-live');
                      }}
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-colors ${
                        selectedService === 'live' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-red-600'
                      }`}>
                        <svg className="w-6 h-6 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                </div>
                      <span className={`text-xs sm:text-base transition-colors ${
                        selectedService === 'live' ? 'text-white font-medium' : 'text-gray-400 group-hover:text-white'
                      }`}>Live</span>
              </div>

                    {/* App Mobile */}
                    <div 
                      className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                      onClick={() => {
                        setSelectedService('app');
                        scrollToSection('section-app');
                      }}
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-colors ${
                        selectedService === 'app' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-green-600'
                      }`}>
                        <svg className="w-6 h-6 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className={`text-xs sm:text-base transition-colors ${
                        selectedService === 'app' ? 'text-white font-medium' : 'text-gray-400 group-hover:text-white'
                      }`}>App</span>
                    </div>

                    {/* Analytics */}
                    <div 
                      className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                      onClick={() => {
                        setSelectedService('analytics');
                        scrollToSection('section-app');
                      }}
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-colors ${
                        selectedService === 'analytics' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-indigo-600'
                      }`}>
                        <svg className="w-6 h-6 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className={`text-xs sm:text-base transition-colors ${
                        selectedService === 'analytics' ? 'text-white font-medium' : 'text-gray-400 group-hover:text-white'
                      }`}>Analytics</span>
                    </div>

                    {/* Chat */}
                    <div 
                      className="flex flex-col items-center cursor-pointer group flex-shrink-0"
                      onClick={() => {
                        setSelectedService('chat');
                        scrollToSection('section-app');
                      }}
                      style={{ scrollSnapAlign: 'start' }}
                    >
                      <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-colors ${
                        selectedService === 'chat' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-yellow-600'
                      }`}>
                        <svg className="w-6 h-6 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <span className={`text-xs sm:text-base transition-colors ${
                        selectedService === 'chat' ? 'text-white font-medium' : 'text-gray-400 group-hover:text-white'
                      }`}>Chat</span>
                    </div>

                    {/* Duplication 1 - Visible uniquement sur mobile */}
                    <div className="sm:hidden contents">
                      {/* Formation */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('formation');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'formation' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-blue-600'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'formation' ? 'text-white font-medium' : 'text-gray-400'}`}>Formation</span>
                      </div>
                      {/* Signaux */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('signaux');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'signaux' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-purple-600'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'signaux' ? 'text-white font-medium' : 'text-gray-400'}`}>Signaux</span>
                      </div>
                      {/* Journal */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('journal');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'journal' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-purple-700'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'journal' ? 'text-white font-medium' : 'text-gray-400'}`}>Journal</span>
                      </div>
                      {/* Live */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('live');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'live' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-red-600'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'live' ? 'text-white font-medium' : 'text-gray-400'}`}>Live</span>
                      </div>
                      {/* App */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('app');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'app' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-green-600'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'app' ? 'text-white font-medium' : 'text-gray-400'}`}>App</span>
                      </div>
                      {/* Analytics */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('analytics');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'analytics' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-indigo-600'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'analytics' ? 'text-white font-medium' : 'text-gray-400'}`}>Analytics</span>
                      </div>
                      {/* Chat */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('chat');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'chat' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-yellow-600'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'chat' ? 'text-white font-medium' : 'text-gray-400'}`}>Chat</span>
                      </div>
                    </div>

                    {/* Duplication 2 - Visible uniquement sur mobile */}
                    <div className="sm:hidden contents">
                      {/* Formation */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('formation');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'formation' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-blue-600'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'formation' ? 'text-white font-medium' : 'text-gray-400'}`}>Formation</span>
                      </div>
                      {/* Signaux */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('signaux');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'signaux' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-purple-600'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'signaux' ? 'text-white font-medium' : 'text-gray-400'}`}>Signaux</span>
                      </div>
                      {/* Journal */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('journal');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'journal' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-purple-700'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'journal' ? 'text-white font-medium' : 'text-gray-400'}`}>Journal</span>
                      </div>
                      {/* Live */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('live');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'live' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-red-600'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'live' ? 'text-white font-medium' : 'text-gray-400'}`}>Live</span>
                      </div>
                      {/* App */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('app');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'app' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-green-600'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'app' ? 'text-white font-medium' : 'text-gray-400'}`}>App</span>
                      </div>
                      {/* Analytics */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('analytics');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'analytics' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-indigo-600'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'analytics' ? 'text-white font-medium' : 'text-gray-400'}`}>Analytics</span>
                      </div>
                      {/* Chat */}
                      <div className="flex flex-col items-center cursor-pointer group flex-shrink-0" onClick={() => {
                        setSelectedService('chat');
                        scrollToSection('services');
                      }}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-colors ${selectedService === 'chat' ? 'bg-purple-600' : 'bg-gray-700 group-hover:bg-yellow-600'}`}>
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <span className={`text-xs transition-colors ${selectedService === 'chat' ? 'text-white font-medium' : 'text-gray-400'}`}>Chat</span>
                      </div>
                    </div>
                  </div>

                  {/* Flèche droite - Masquée sur mobile */}
                  <button className="hidden sm:block text-gray-400 hover:text-white transition-colors p-2 flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Sections des services - Déplacées vers le haut */}
              <div className="w-screen -mx-4 sm:mx-0 sm:w-full mt-8">
                {selectedService === 'Formation' && (
                  <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl p-8 m-4">
                    <h3 className="text-2xl font-bold text-white mb-4">Formation</h3>
                    <p className="text-gray-300 mb-6">Apprenez les fondamentaux du trading avec nos cours structurés et progressifs.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">1. Fondamentaux</h4>
                        <p className="text-gray-300 text-sm">Les bases essentielles pour comprendre les marchés financiers.</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">2. Stratégies</h4>
                        <p className="text-gray-300 text-sm">Des stratégies éprouvées pour trader efficacement.</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedService === 'Signaux' && (
                  <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl p-8 m-4">
                    <h3 className="text-2xl font-bold text-white mb-4">Signaux</h3>
                    <p className="text-gray-300 mb-6">Recevez des signaux de trading en temps réel avec nos analyses techniques.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Crypto</h4>
                        <p className="text-gray-300 text-sm">Signaux pour les principales cryptomonnaies.</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Forex</h4>
                        <p className="text-gray-300 text-sm">Signaux pour les paires de devises majeures.</p>
                      </div>
                    </div>
                  </div>
                )}


                {selectedService === 'Live' && (
                  <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-8 m-4">
                    <h3 className="text-2xl font-bold text-white mb-4">Live</h3>
                    <p className="text-gray-300 mb-6">Participez à nos sessions de trading en direct avec nos experts.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Sessions quotidiennes</h4>
                        <p className="text-gray-300 text-sm">Analyse de marché en temps réel.</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Q&A en direct</h4>
                        <p className="text-gray-300 text-sm">Posez vos questions aux experts.</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedService === 'App' && (
                  <div className="bg-gradient-to-r from-indigo-900/20 to-cyan-900/20 rounded-xl p-8 m-4">
                    <h3 className="text-2xl font-bold text-white mb-4">App</h3>
                    <p className="text-gray-300 mb-6">Accédez à tous nos services depuis votre smartphone.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Trading mobile</h4>
                        <p className="text-gray-300 text-sm">Tradez en déplacement avec notre app.</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Notifications</h4>
                        <p className="text-gray-300 text-sm">Recevez des alertes en temps réel.</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedService === 'Analytics' && (
                  <div className="bg-gradient-to-r from-teal-900/20 to-green-900/20 rounded-xl p-8 m-4">
                    <h3 className="text-2xl font-bold text-white mb-4">Analytics</h3>
                    <p className="text-gray-300 mb-6">Analysez les données de marché avec nos outils avancés.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Graphiques avancés</h4>
                        <p className="text-gray-300 text-sm">Outils d'analyse technique professionnels.</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Indicateurs</h4>
                        <p className="text-gray-300 text-sm">Plus de 100 indicateurs techniques.</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedService === 'Chat' && (
                  <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 rounded-xl p-8 m-4">
                    <h3 className="text-2xl font-bold text-white mb-4">Chat</h3>
                    <p className="text-gray-300 mb-6">Communiquez avec la communauté de traders.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Communauté</h4>
                        <p className="text-gray-300 text-sm">Échangez avec d'autres traders.</p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-2">Support</h4>
                        <p className="text-gray-300 text-sm">Obtenez de l'aide de nos experts.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>


            </div>

            {/* À propos - Mobile Optimized */}
            <div id="about-thethetrader" className="max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6 hidden">
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
                    <a 
                      href="https://x.com/thethetrader" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Suivez @thethetrader
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Avantages clés - Mobile Optimized */}
            <div className="max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6">
                              <h2 className="text-4xl sm:text-5xl font-bold text-white text-center mb-8 sm:mb-12 hidden">
                  Pourquoi choisir TheTheTrader ?
                </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 hidden">
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
              
              {/* Section 1 - Formation */}
              <div id="section-formation" className="mt-16 sm:mt-20">
                <div className="relative">
                  {/* Numéro 1 en haut à gauche */}
                  <div className="absolute -top-16 -left-16 text-9xl font-bold bg-gradient-to-br from-purple-400/40 to-purple-600/40 bg-clip-text text-transparent select-none">
                    1
                  </div>
                  
                  {/* Titre principal */}
                  <div className="text-center mb-8">
                    <div className="text-sm font-semibold text-purple-400 mb-4 tracking-wider">
                      APPRENTISSAGE
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6">
                      <span className="text-white">Adoptez mon approche</span>
                      <br />
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        précise
                      </span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
                      Découvre ma méthode de scalping : analyse graphique pure, zéro indicateurs, zéro blabla. 
                      Un setup précis qui se répète sans fin pour des trades rapides et efficaces.
                    </p>
                  </div>

                  {/* Image Model */}
                  <div className="max-w-6xl mx-auto mb-12 relative">
                    <img 
                      src="/model.png" 
                      alt="Model de trading" 
                      className="w-full rounded-xl shadow-2xl"
                    />
                    {/* Image Model2 en bas à droite format iPhone */}
                    <img 
                      src="/model2.png" 
                      alt="Model iPhone" 
                      className="absolute bottom-4 right-8 sm:right-12 w-16 sm:w-48 rounded-2xl shadow-2xl"
                      style={{ aspectRatio: '9/19.5' }}
                    />
                  </div>

              </div>
            </div>

              {/* Section 2 - Signaux */}
              <div id="section-signaux" className="mt-16 sm:mt-20">
                <div className="relative">
                  {/* Numéro 2 en haut à gauche */}
                  <div className="absolute -top-16 -left-16 text-9xl font-bold bg-gradient-to-br from-purple-400/40 to-purple-600/40 bg-clip-text text-transparent select-none">
                    2
                  </div>
                  
                  {/* Titre principal */}
                  <div className="text-center mb-8">
                    <div className="text-sm font-semibold text-purple-400 mb-4 tracking-wider">
                      SIGNAUX
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6">
                      <span className="text-white">Reçois mes signaux</span>
                      <br />
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        en temps réel
                      </span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
                      Reçois des signaux Forex, Crypto, Indices avec des charts annotés pour assimiler mon modèle étape par étape. Le but : ta maîtrise du marché.
                    </p>
                  </div>

                  {/* Vidéo complète */}
                  <div className="max-w-6xl mx-auto">
                    <video 
                      className="w-full rounded-xl shadow-2xl"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      controls={false}
                    >
                      <source src="/videodemo copie.mp4" type="video/mp4" />
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  </div>
                </div>
              </div>

              {/* Section 3 - Journal */}
              <div id="section-journal" className="mt-16 sm:mt-20">
                <div className="relative">
                  {/* Numéro 3 en haut à gauche */}
                  <div className="absolute -top-16 -left-16 text-9xl font-bold bg-gradient-to-br from-purple-400/40 to-purple-600/40 bg-clip-text text-transparent select-none">
                    3
                  </div>
                  
                  {/* Titre principal */}
                  <div className="text-center mb-8">
                    <div className="text-sm font-semibold text-purple-400 mb-4 tracking-wider">
                      JOURNAL
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6">
                      <span className="text-white">Journal de</span>
                      <br />
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        trading
                      </span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
                      Un journal complet et personnalisable pour suivre vos signaux, gérer plusieurs comptes, et analyser vos performances avec précision. Suivez vos statistiques, étudiez vos stop loss et transformez chaque trade — gagnant comme perdant — en véritable source d'apprentissage.
                    </p>
                  </div>

                  {/* Interface d'analyse des performances */}
                  <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                      
                      {/* Panneau 1 - Vos statistiques */}
                      <div className="group relative bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-blue-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-purple-500/30 backdrop-blur-sm hover:border-purple-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-white text-center">Analysez vos statistiques</h3>
                          </div>
                          <p className="text-gray-300 mb-4 sm:mb-6 text-xs sm:text-sm leading-relaxed min-h-[48px] text-center">Visualisez vos performances avec plus de 50 rapports détaillés pour comprendre vos résultats.</p>
                          
                          {/* Image cadre 1 */}
                          <div className="bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl overflow-hidden shadow-xl border border-white/20">
                            <img 
                              src="/cadre1.jpg" 
                              alt="Journal statistiques" 
                              className="w-full h-[400px] sm:h-[500px] object-cover object-top"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Panneau 2 - Comportements de trading */}
                      <div className="group relative bg-gradient-to-br from-blue-900/30 via-blue-800/20 to-indigo-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-blue-500/30 backdrop-blur-sm hover:border-blue-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                              </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-white text-center">Comprenez vos erreurs</h3>
                          </div>
                          <p className="text-gray-300 mb-4 sm:mb-6 text-xs sm:text-sm leading-relaxed min-h-[48px] text-center">Identifiez vos points faibles en analysant vos pertes pour améliorer votre gestion du risque.</p>
                          
                          {/* Image cadre 2 */}
                          <div className="bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl overflow-hidden shadow-xl border border-white/20">
                            <img 
                              src="/cadre2.jpg" 
                              alt="Journal comportements" 
                              className="w-full h-[400px] sm:h-[500px] object-cover object-[center_20%]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Panneau 3 - Résumé des performances */}
                      <div className="group relative bg-gradient-to-br from-emerald-900/30 via-emerald-800/20 to-teal-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-emerald-500/30 backdrop-blur-sm hover:border-emerald-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-teal-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                              </svg>
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-white text-center">Suivez votre progression</h3>
                          </div>
                          <p className="text-gray-300 mb-4 sm:mb-6 text-xs sm:text-sm leading-relaxed min-h-[48px] text-center">Obtenez une vue d'ensemble de vos performances mensuelles pour mesurer votre évolution.</p>
                          
                          {/* Image cadre 3 */}
                          <div className="bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl overflow-hidden shadow-xl border border-white/20">
                            <img 
                              src="/cadre3.jpg" 
                              alt="Journal résumé" 
                              className="w-full h-[400px] sm:h-[500px] object-cover object-[center_10%]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4 - Live */}
              <div id="section-live" className="mt-16 sm:mt-20">
                <div className="relative">
                  {/* Numéro 4 en haut à gauche */}
                  <div className="absolute -top-16 -left-16 text-9xl font-bold bg-gradient-to-br from-purple-400/40 to-purple-600/40 bg-clip-text text-transparent select-none">
                    4
                  </div>
                  
                  {/* Titre principal */}
                  <div className="text-center mb-8">
                    <div className="text-sm font-semibold text-purple-400 mb-4 tracking-wider">
                      LIVE
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6">
                      <span className="text-white">Session de live</span>
                      <br />
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        trading
                      </span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
                      Rejoins mes sessions de trading, apprends en direct avec mes annotations et pose tes questions.
                    </p>
                  </div>

                  {/* Vidéo complète */}
                  <div className="max-w-6xl mx-auto">
                    <video 
                      className="w-full rounded-xl shadow-2xl"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      controls={false}
                    >
                      <source src="/videolive copie.mp4" type="video/mp4" />
                      <source src="/videolive.mov" type="video/quicktime" />
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  </div>
                </div>
              </div>

              {/* Section 5 - App */}
              <div id="section-app" className="mt-16 sm:mt-20">
                <div className="relative">
                  {/* Numéro 5 en haut à gauche */}
                  <div className="absolute -top-16 -left-16 text-9xl font-bold bg-gradient-to-br from-purple-400/40 to-purple-600/40 bg-clip-text text-transparent select-none">
                    5
                  </div>
                  
                  {/* Titre principal */}
                  <div className="text-center mb-8 sm:mb-2">
                    <div className="text-sm font-semibold text-purple-400 mb-2 tracking-wider">
                      APP
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold mb-3">
                      <span className="text-white">Application</span>
                      <br />
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                        mobile
                      </span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-2">
                      Installe l'app et reçois des notifications instantanées pour chaque signal. 
                      Accède au livestream, consulte tes journaux personnels. 
                      TPLN est 100% responsive, partout avec toi.
                    </p>
                  </div>

                  {/* Vidéo complète */}
                  <div className="w-full sm:max-w-3xl mx-auto py-0 sm:py-0">
                    <div className="relative w-full sm:max-w-none">
                      {/* Cadre iPhone avec photo */}
                      <div className="relative">
                        {/* Photo du cadre iPhone */}
                        <img 
                          src="/FOndiphone.png" 
                          alt="Cadre iPhone" 
                          className="w-full h-auto scale-125 sm:scale-100"
                          style={{
                            display: 'block',
                            maxWidth: '100%',
                            height: 'auto'
                          }}
                          onError={(e) => {
                            e.currentTarget.src = '/faceiphone.png';
                          }}
                        />
                        
                        {/* Vidéo superposée */}
                        <video 
                          className={`absolute left-1/2 transform -translate-x-1/2 w-[44%] aspect-[9/16] rounded-[2rem] sm:rounded-[4rem] scale-125 sm:scale-100 ${isPWA && !user ? 'top-1.5' : 'top-9'} sm:top-20`}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                          controls={false}
                        >
                          <source src="/videoapp copie.mp4" type="video/mp4" />
                          <source src="/videoapp.mov" type="video/quicktime" />
                          Votre navigateur ne supporte pas la lecture de vidéos.
                        </video>
                      </div>
                    </div>
                  </div>
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
                    <a 
                      href="https://x.com/thethetrader" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Suivez @thethetrader
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Avantages clés - Mobile Optimized */}
            <div className="max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6">
              <h2 className="text-4xl sm:text-5xl font-bold text-center mb-8 sm:mb-12">
                <div className="text-white">
                  Pourquoi choisir
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                  TPLN ?
                </div>
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
            </div>

            {/* Interface Mobile après Connexion - Mobile uniquement - SUPPRIMÉ */}
            <div className="block md:hidden max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6" style={{display: 'none'}}>
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

                            mobileActiveChannel === 'chatzone' ? '💬 ChatZone' :
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
                    
                    {/* Aperçu Statistiques */}
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg p-3 border border-blue-500/30">
                      <h3 className="text-white font-bold text-sm mb-2">📊 Aperçu Rapide</h3>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-green-400 font-bold">+$3,285</div>
                          <div className="text-gray-400">P&L Total</div>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-blue-400 font-bold">74%</div>
                          <div className="text-gray-400">Win Rate</div>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-white font-bold">23</div>
                          <div className="text-gray-400">Ce mois</div>
                        </div>
                        <div className="bg-gray-800/50 rounded p-2">
                          <div className="text-yellow-400 font-bold">5</div>
                          <div className="text-gray-400">Signaux actifs</div>
                        </div>
                      </div>
                    </div>
                    
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
                        <div 
                          className="bg-slate-700 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-600 transition-colors"
                          onClick={() => {
                            setMobileActiveChannel('formation');
                            setShowMobileChannel(true);
                          }}
                        >
                          <div className="text-xl">🎓</div>
                          <div>
                            <div className="text-white font-medium text-sm">Formation</div>
                            <div className="text-gray-400 text-xs">Cours complet "scalping"</div>
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
                            setMobileActiveChannel('chatzone');
                            setShowMobileChannel(true);
                          }}
                        >
                          <div className="text-xl">💬</div>
                          <div>
                            <div className="text-white font-medium text-sm">ChatZone</div>
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
                      <div className="flex-1 p-3 space-y-3 overflow-y-auto" style={{paddingTop: '100px', paddingBottom: '80px'}}>
                        
                        {/* Vue Crypto */}
                        {mobileActiveChannel === 'crypto' && (
                          <>
                            {/* Signal BTC */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-white">TheTheTrader</span>
                                  <span className="text-xs text-gray-400">22:30</span>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                  <div className="space-y-3">
                                    {/* Header avec titre et indicateur */}
                                <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <h3 className="font-bold text-white text-xs">
                                        Signal BUY BTC – 1 min
                                      </h3>
                                </div>
                                    
                                    {/* Détails du signal */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white text-xs">Entrée : 45000 USD</span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white text-xs">SL : 44000 USD</span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white text-xs">TP : 46000 USD</span>
                              </div>
                                    </div>
                                    
                                    {/* Ratio R:R */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                      <span className="text-red-400 text-sm">🎯</span>
                                      <span className="text-white text-xs">
                                        Ratio R:R : ≈ 1:1
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Image du signal */}
                                <div className="mt-2">
                                  <img 
                                    src="/images/tradingview-chart.png" 
                                    alt="Signal screenshot" 
                                    className="w-full rounded-lg border border-gray-600"
                                  />
                                </div>

                                {/* Boutons de statut */}
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-green-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ✅ WIN
                                  </button>
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-red-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ❌ LOSS
                                  </button>
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-blue-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ⚖️ BE
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Signal ETH */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-white">TheTheTrader</span>
                                  <span className="text-xs text-gray-400">22:35</span>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                  <div className="space-y-3">
                                    {/* Header avec titre et indicateur */}
                                <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <h3 className="font-bold text-white text-xs">
                                        Signal SELL ETH – 5 min
                                      </h3>
                                </div>
                                    
                                    {/* Détails du signal */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">Entrée : 2800 USD</span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">SL : 2850 USD</span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">TP : 2750 USD</span>
                                      </div>
                                    </div>
                                    
                                    {/* Ratio R:R */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                      <span className="text-red-400 text-sm">🎯</span>
                                      <span className="text-white text-xs">
                                        Ratio R:R : ≈ 1:1
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Image du signal */}
                                <div className="mt-2">
                                  <img 
                                    src="/images/tradingview-chart.png" 
                                    alt="Signal screenshot" 
                                    className="w-full rounded-lg border border-gray-600"
                                  />
                                </div>

                                {/* Boutons de statut */}
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-green-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ✅ WIN
                                  </button>
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-red-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ❌ LOSS
                                  </button>
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-blue-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ⚖️ BE
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Vue Futur */}
                        {mobileActiveChannel === 'futur' && (
                          <>
                            {/* Signal NAS100 */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-white">TheTheTrader</span>
                                  <span className="text-xs text-gray-400">14:20</span>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                  <div className="space-y-3">
                                    {/* Header avec titre et indicateur */}
                                <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <h3 className="font-bold text-white text-xs">
                                        Signal SELL NAS100 Futures – 1H
                                      </h3>
                                </div>
                                    
                                    {/* Détails du signal */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">Entrée : 15800 USD</span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">SL : 15900 USD</span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">TP : 15650 USD</span>
                              </div>
                            </div>

                                    {/* Ratio R:R */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                      <span className="text-red-400 text-sm">🎯</span>
                                      <span className="text-white text-xs">
                                        Ratio R:R : ≈ 1.5:1
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Image du signal */}
                                <div className="mt-2">
                                  <img 
                                    src="/images/tradingview-chart.png" 
                                    alt="Signal screenshot" 
                                    className="w-full rounded-lg border border-gray-600"
                                  />
                                </div>

                                {/* Boutons de statut */}
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500 text-white shadow-lg shadow-green-500/20 transition-all duration-200 flex items-center gap-1">
                                    ✅ WIN
                                  </button>
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-red-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ❌ LOSS
                                  </button>
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-blue-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ⚖️ BE
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Signal SPX500 */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-white">TheTheTrader</span>
                                  <span className="text-xs text-gray-400">16:45</span>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                  <div className="space-y-3">
                                    {/* Header avec titre et indicateur */}
                                <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <h3 className="font-bold text-white text-xs">
                                        Signal BUY SPX500 Futures – 4H
                                      </h3>
                                </div>
                                    
                                    {/* Détails du signal */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">Entrée : 4450 USD</span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">SL : 4400 USD</span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">TP : 4520 USD</span>
                                      </div>
                                    </div>
                                    
                                    {/* Ratio R:R */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                      <span className="text-red-400 text-sm">🎯</span>
                                      <span className="text-white text-xs">
                                        Ratio R:R : ≈ 1.4:1
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Image du signal */}
                                <div className="mt-2">
                                  <img 
                                    src="/images/tradingview-chart.png" 
                                    alt="Signal screenshot" 
                                    className="w-full rounded-lg border border-gray-600"
                                  />
                                </div>

                                {/* Boutons de statut */}
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-green-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ✅ WIN
                                  </button>
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-red-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ❌ LOSS
                                  </button>
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-blue-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ⚖️ BE
                                  </button>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Vue Forex */}
                        {mobileActiveChannel === 'forex' && (
                          <>
                            {/* Signal EURUSD */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-white">TheTheTrader</span>
                                  <span className="text-xs text-gray-400">09:15</span>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                  <div className="space-y-3">
                                    {/* Header avec titre et indicateur */}
                                <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <h3 className="font-bold text-white text-xs">
                                        Signal BUY EURUSD – 1H
                                      </h3>
                                </div>
                                    
                                    {/* Détails du signal */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">Entrée : 1.0850 USD</span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">SL : 1.0800 USD</span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">TP : 1.0920 USD</span>
                              </div>
                            </div>

                                    {/* Ratio R:R */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                      <span className="text-red-400 text-sm">🎯</span>
                                      <span className="text-white text-xs">
                                        Ratio R:R : ≈ 1.4:1
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Image du signal */}
                                <div className="mt-2">
                                  <img 
                                    src="/images/tradingview-chart.png" 
                                    alt="Signal screenshot" 
                                    className="w-full rounded-lg border border-gray-600"
                                  />
                                </div>

                                {/* Boutons de statut */}
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500 text-white shadow-lg shadow-green-500/20 transition-all duration-200 flex items-center gap-1">
                                    ✅ WIN
                                  </button>
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-red-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ❌ LOSS
                                  </button>
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-blue-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ⚖️ BE
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Signal GBPJPY */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-white">TheTheTrader</span>
                                  <span className="text-xs text-gray-400">11:30</span>
                                </div>

                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                  <div className="space-y-3">
                                    {/* Header avec titre et indicateur */}
                                <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <h3 className="font-bold text-white text-xs">
                                        Signal SELL GBPJPY – 30m
                                      </h3>
                                </div>
                                    
                                    {/* Détails du signal */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">Entrée : 185.50 USD</span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">SL : 186.00 USD</span>
                              </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400 text-sm">🔹</span>
                                        <span className="text-white">TP : 184.80 USD</span>
                                      </div>
                                    </div>
                                    
                                    {/* Ratio R:R */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                      <span className="text-red-400 text-sm">🎯</span>
                                      <span className="text-white text-xs">
                                        Ratio R:R : ≈ 1.4:1
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Image du signal */}
                                <div className="mt-2">
                                  <img 
                                    src="/images/tradingview-chart.png" 
                                    alt="Signal screenshot" 
                                    className="w-full rounded-lg border border-gray-600"
                                  />
                                </div>

                                {/* Boutons de statut */}
                                <div className="flex items-center gap-2 flex-wrap mt-2">
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-green-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ✅ WIN
                                  </button>
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-red-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ❌ LOSS
                                  </button>
                                  <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-600 hover:bg-blue-500 text-gray-300 hover:text-white transition-all duration-200 flex items-center gap-1">
                                    ⚖️ BE
                                  </button>
                                </div>
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

                        {/* Vue Formation */}
                        {mobileActiveChannel === 'formation' && (
                          <div className="overflow-x-hidden max-w-full min-w-0">
                            <div className="space-y-4 overflow-x-hidden">
                              <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 overflow-x-hidden">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">COURS COMPLET</span>
                                  <span className="text-white font-bold text-sm">🎓 Formation Scalping</span>
                                </div>
                                <div className="text-blue-300 text-xs mb-2">
                                  📚 Guide complet | 🎯 Setup A+ | ⚡ CRT & AMD | 🦄 Concepts avancés
                                </div>
                                <div className="text-gray-300 text-xs mb-3">
                                  Formation complète aux concepts fondamentaux et stratégies avancées de "scalping" trading.
                                </div>
                                <div className="text-center">
                                  <button className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-medium hover:bg-blue-700 transition-colors">
                                    📖 Accéder au cours complet
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}



                        {/* Vue ChatZone */}
                        {mobileActiveChannel === 'chatzone' && (
                          <UserChat channelId="chatzone" />
                        )}

                        {/* Vue Profit Loss */}
                        {mobileActiveChannel === 'profit-loss' && (
                          <ProfitLoss channelId="profit-loss" currentUserId="user" />
                        )}

                        {/* Vue Journal Signaux (Calendar) */}
                        {mobileActiveChannel === 'calendar' && (
                          <>
                            {/* Calendrier économique mobile */}
                            <div className="bg-gray-700 rounded-lg p-3 overflow-x-hidden">
                              <h3 className="text-white font-bold text-sm mb-3">Calendrier Économique</h3>
                              <div className="grid grid-cols-7 gap-1 text-xs min-w-0 max-w-full">
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
                            {/* Stats Trading Journal - En haut pour visibilité */}
                            <div className="bg-gray-700 rounded-lg p-3 mb-3">
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

                            {/* Calendrier trading mobile */}
                            <div className="bg-gray-700 rounded-lg p-3 overflow-x-hidden">
                              <h3 className="text-white font-bold text-sm mb-3">Calendrier Trading</h3>
                              <div className="grid grid-cols-7 gap-1 text-xs min-w-0 max-w-full">
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


                          </>
                        )}

                      </div>
                      </div>
                      
                  </div>
                </div>
              </div>
            </div>

            {/* Interface Desktop - Desktop uniquement - SUPPRIMÉ */}
            <div id="interface" className="hidden md:block max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6" style={{display: 'none'}}>
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
                              className={`w-full text-left px-3 py-2 rounded text-sm ${previewChannel === 'chatzone' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                              onClick={() => setPreviewChannel('chatzone')}
                            >
                              💬 ChatZone
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
    
                             previewChannel === 'chatzone' ? '💬 ChatZone' : 
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
                                  <span>SL : 44000 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>TP : 46000 USD</span>
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
                                  <span>SL : 2850 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>TP : 2750 USD</span>
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
                                  <span>SL : 93.80 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>TP : 98.20 USD</span>
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
                                  <span>SL : 0.495 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>TP : 0.475 USD</span>
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
                                  <span>SL : 16950 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>TP : 16700 USD</span>
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
                                  <span>SL : 4650 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>TP : 4850 USD</span>
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
                                  <span>SL : 2038.20 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>TP : 2058.80 USD</span>
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
                                  <span>SL : 79.80 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>TP : 77.20 USD</span>
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
                                  <span>SL : 1.0825 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>TP : 1.0890 USD</span>
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
                                  <span>SL : 190.00 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>TP : 188.80 USD</span>
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
                                  <span>SL : 147.85 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>TP : 148.85 USD</span>
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
                                  <span>SL : 0.6680 USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span>TP : 0.6620 USD</span>
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

                        {/* Vue Fondamentaux - Cours Scalping complet */}
                        {previewChannel === 'fondamentaux' && (
                          <div className="bg-gray-800 rounded-lg p-6 mb-6">
                            <div className="text-center mb-8 p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
                              <div className="flex justify-center mb-4">
                  <img 
                    src="/logo-removebg-preview.png" 
                    alt="Trading pour les nuls" 
                    className="h-12 w-auto"
                    style={{
                      filter: 'drop-shadow(0 0 0 transparent)',
                      mixBlendMode: 'screen'
                    }}
                  />
                </div>
                              <p className="text-xl opacity-90">Guide complet des concepts fondamentaux et stratégies avancées</p>
                            </div>
                            
                            <div className="space-y-6 text-gray-300">
                              <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4">
                                <p className="text-yellow-200"><strong>📖 Avertissement :</strong> Ce guide présente un ensemble de concepts appris et expérimentés sur les marchés financiers. Il ne s'agit pas d'inventions originales, mais d'un setup personnel basé sur l'observation et l'expérience pratique.</p>
                              </div>
                              
                              <div>
                                <h2 className="text-2xl font-bold text-blue-400 mb-4 border-l-4 border-blue-400 pl-4">1. 📚 Introduction</h2>
                                <p>Ce document vous présente les fondamentaux essentiels pour comprendre comment les charts évoluent et ce qui influence leurs mouvements. L'objectif est de construire une base solide avant d'aborder les stratégies avancées.</p>
                              </div>
                              
                              <div>
                                <h2 className="text-2xl font-bold text-blue-400 mb-4 border-l-4 border-blue-400 pl-4">2. 🧠 Fondamentaux des Charts</h2>
                                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                                  <h3 className="text-lg font-semibold text-green-400 mb-2">📈 Qu'est-ce qu'une Chart ?</h3>
                                  <p className="mb-3">Une chart (ou graphique) est une représentation visuelle du prix d'un actif financier dans le temps (Bitcoin, or, actions, etc.).</p>
                                  <div className="bg-gray-600 rounded p-3">
                                    <h4 className="font-semibold text-blue-300 mb-2">Elle permet de :</h4>
                                    <ul className="space-y-1 text-sm">
                                      <li>→ Voir comment le prix évolue</li>
                                      <li>→ Trouver des points d'entrée/sortie</li>
                                      <li>→ Comprendre le comportement du marché</li>
                                    </ul>
                                  </div>
                                </div>
                                
                                <div className="bg-gray-700 rounded-lg p-4">
                                  <h3 className="text-lg font-semibold text-green-400 mb-2">🕯️ Comprendre les Bougies</h3>
                                  <p className="mb-3">Chaque bougie montre l'évolution du prix sur une période donnée (1 min, 1h, 1 jour, etc.)</p>
                                  <div className="bg-gray-600 rounded p-3">
                                    <h4 className="font-semibold text-blue-300 mb-2">Composition d'une bougie :</h4>
                                    <ul className="space-y-1 text-sm">
                                      <li>→ <strong>Le corps (body) :</strong> différence entre ouverture et clôture</li>
                                      <li>→ <strong>Les mèches (wicks) :</strong> les plus hauts et plus bas atteints</li>
                                      <li>→ <strong>Couleur :</strong> verte/blanche si clôture &gt; ouverture, rouge/noire si clôture &lt; ouverture</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h2 className="text-2xl font-bold text-blue-400 mb-4 border-l-4 border-blue-400 pl-4">3. 🧠 Mouvement des Prix (Modèle AMD)</h2>
                                <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4 mb-4">
                                  <p><strong>🚗💨 Analogie :</strong> Le prix, c'est comme un voyage de A à B. Pour avancer, il a besoin de liquidité, comme une voiture a besoin d'essence.</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold mb-2">1️⃣</div>
                                    <div className="font-semibold mb-2">Accumulation</div>
                                    <p className="text-sm">Le prix se prépare 🛑⛽</p>
                                  </div>
                                  <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold mb-2">2️⃣</div>
                                    <div className="font-semibold mb-2">Manipulation</div>
                                    <p className="text-sm">Il piège les traders 🎯🪤</p>
                                  </div>
                                  <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold mb-2">3️⃣</div>
                                    <div className="font-semibold mb-2">Distribution</div>
                                    <p className="text-sm">Le vrai mouvement 🚀📈</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h2 className="text-2xl font-bold text-blue-400 mb-4 border-l-4 border-blue-400 pl-4">4. 📈 Support et Résistance</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 text-center">
                                    <strong className="text-green-300">🔹 Support</strong><br/>
                                    <span className="text-sm">Zone où le prix rebondit vers le haut 🔼</span>
                                  </div>
                                  <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4 text-center">
                                    <strong className="text-red-300">🔹 Résistance</strong><br/>
                                    <span className="text-sm">Zone où le prix bloque et redescend 🔽</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h2 className="text-2xl font-bold text-blue-400 mb-4 border-l-4 border-blue-400 pl-4">5. 🔬 Concepts Avancés</h2>
                                <div className="space-y-4">
                                  <div className="bg-gray-700 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-purple-400 mb-2">🧱 ORDER BLOCK (OB)</h3>
                                    <p className="mb-2">Un Order Block représente la dernière bougie haussière (ou baissière) avant un mouvement impulsif majeur dans la direction opposée.</p>
                                    <div className="text-sm text-blue-300">
                                      → Ces zones deviennent des repères de liquidité<br/>
                                      → Souvent retestées par le prix<br/>
                                      → Offrent des points d'entrée à fort potentiel
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gray-700 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-purple-400 mb-2">⚡📉📈 FVG – Fair Value Gap</h3>
                                    <p className="mb-2">Un FVG est une zone de déséquilibre créée lors d'un mouvement rapide et violent du marché 🚀.</p>
                                    <div className="text-sm text-blue-300">
                                      → Le prix revient fréquemment combler ces gaps<br/>
                                      → Zones intéressantes pour entrer ou sortir d'une position
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gray-700 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-purple-400 mb-2">🦄 Unicorn</h3>
                                    <p className="mb-2">C'est un setup formé par l'association d'un Breaker (BRKR) ⚡ et d'un Fair Value Gap (FVG) 📉.</p>
                                    <div className="text-sm text-blue-300">
                                      → Zone à forte probabilité de réaction du prix<br/>
                                      → Rassemble deux zones institutionnelles clés<br/>
                                      → Point d'entrée ou de prise de profit idéal
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h2 className="text-2xl font-bold text-blue-400 mb-4 border-l-4 border-blue-400 pl-4">6. 🕵️ CRT – Candle Range Theory</h2>
                                <p className="mb-4">La Candle Range Theory (CRT) est une méthode d'analyse basée sur 3 bougies consécutives.</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold mb-2">1️⃣</div>
                                    <div className="font-semibold mb-2">La Range</div>
                                    <p className="text-sm">Bougie avec grand corps<br/>Zone de stagnation</p>
                                  </div>
                                  <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold mb-2">2️⃣</div>
                                    <div className="font-semibold mb-2">Manipulation</div>
                                    <p className="text-sm">Va chercher la liquidité<br/>Piège les traders</p>
                                  </div>
                                  <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold mb-2">3️⃣</div>
                                    <div className="font-semibold mb-2">Distribution</div>
                                    <p className="text-sm">Bougie directionnelle<br/>Zone d'entrée</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h2 className="text-2xl font-bold text-blue-400 mb-4 border-l-4 border-blue-400 pl-4">7. 📌 Le Setup "A+"</h2>
                                <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4 mb-4">
                                  <h3 className="font-semibold mb-2">PRINCIPE DU MODÈLE</h3>
                                  <p className="mb-2">Le principe du modèle, c'est de prendre position après la phase de manipulation ⏸️, sur la timeframe basse (LTF) du contexte défini sur la timeframe haute (HTF) 📊.</p>
                                  <p>🎯 Cela permet d'éviter les pièges des faux breakouts 🚫 et de s'aligner avec la vraie direction du mouvement ➡️.</p>
                                </div>
                              </div>
                              
                              <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4">
                                <h4 className="font-semibold mb-2">⚠️ Avertissement Légal</h4>
                                <p className="text-sm">Ce document est fourni à des fins éducatives uniquement. Le trading comporte des risques significatifs de perte financière. Il est essentiel de bien comprendre les risques avant de trader et ne jamais risquer plus que ce que vous pouvez vous permettre de perdre.</p>
                              </div>
                            </div>
                          </div>
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

                        {/* Vue ChatZone - Discussions */}
                        {previewChannel === 'chatzone' && (
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
                            {/* Calendrier Trading Journal - Vrai calendrier */}
                            <PreviewCalendar />

                            
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

                              {/* Analyse des Pertes */}
                              <div className="bg-gray-800 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-base font-bold text-white">📊 Analyse des Pertes</h4>
                                  <button className="text-gray-400 hover:text-white text-sm">
                                    ⚙️
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-sm">Mauvais point d'entrée</span>
                                    <span className="text-red-400 font-bold">8</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-sm">Stop-loss trop serré</span>
                                    <span className="text-red-400 font-bold">5</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-sm">Impact de news/événements</span>
                                    <span className="text-red-400 font-bold">3</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-sm">Erreur psychologique</span>
                                    <span className="text-red-400 font-bold">2</span>
                                  </div>
                                </div>
                              </div>

                              {/* Bouton d'ajout de trade */}
                              <div className="bg-gray-800 rounded-lg p-4">
                                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2">
                                  <span className="text-xl">+</span>
                                  Ajouter un Trade
                                </button>
                                <p className="text-gray-400 text-xs mt-2 text-center">
                                  Ajoutez vos trades avec analyse des raisons de perte
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Zone de saisie - seulement pour chatzone et profit-loss */}
                      {(previewChannel === 'chatzone' || previewChannel === 'profit-loss') && (
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

            {/* Bouton Se connecter après Aperçu de la plateforme */}
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
                Se connecter
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

                {/* Avis 2 - Qualité app mobile */}
                <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-xl p-6 sm:p-8 text-center shadow-lg border border-purple-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 hover:border-blue-400 transition-all duration-300 transform cursor-pointer group">
                  <div className="text-2xl text-yellow-400 mb-4 group-hover:scale-110 transition-transform duration-300">⭐⭐⭐⭐⭐</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">iOSTrader</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">L'app iOS est parfaite ! Notifications instantanées pour les signaux, interface fluide. Je ne rate plus jamais un live !</div>
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
              <h2 className="text-5xl md:text-7xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Les services de TPLN
              </h2>
              
              {/* Payment Type Selector */}
              <div className="flex justify-center mb-8">
                <div className="bg-gray-800 p-1 rounded-lg flex">
                  <button 
                    onClick={() => handlePaymentTypeChange('monthly')}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      paymentType === 'monthly' 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                        : 'text-gray-400'
                    }`}
                  >
                    Payer mensuellement
                  </button>
                  <button 
                    onClick={() => handlePaymentTypeChange('yearly')}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      paymentType === 'yearly' 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                        : 'text-gray-400'
                    }`}
                  >
                    Payer annuellement
                  </button>
                </div>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8 md:gap-0 max-w-6xl mx-auto transition-all duration-400 ease-out ${isTransitioning ? 'opacity-0 scale-75 rotate-3 blur-md translate-y-20 transform-gpu perspective-1000' : 'opacity-100 scale-100 rotate-0 blur-0 translate-y-0 transform-gpu perspective-1000'}`} style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
                {/* Plan Starter */}
                <div className={`bg-gradient-to-br from-purple-600/20 to-blue-600/20 px-8 py-6 sm:px-12 sm:py-8 rounded-xl md:rounded-l-xl md:rounded-r-none border-2 backdrop-blur-sm flex flex-col transition-all duration-500 ease-out transform-gpu ${
                  isTransitioning 
                    ? 'border-purple-600 shadow-[0_0_30px_rgba(168,85,247,0.6)] scale-105 rotate-y-6 brightness-110' 
                    : 'border-purple-500/50 hover:border-purple-400 hover:from-purple-600/30 hover:to-blue-600/30 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]'
                }`}>
                  <div className="text-center">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse md:hidden">
                      {paymentType === 'yearly' ? '💎 ÉCONOMISE 50€' : '⭐ RECOMMANDÉ'}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">BASIC</h3>
                    <div className={`text-4xl font-bold text-white mb-6 transition-all duration-500 ${isTransitioning ? 'scale-110' : 'scale-100'}`}>
                      <span className="text-2xl align-top text-gray-300">€</span>
                      {paymentType === 'monthly' ? '39' : '34,83'}
                      <span className="text-lg text-gray-400 font-normal"> / mois</span>
                      {paymentType === 'yearly' && (
                        <div className="text-gray-300 text-sm font-normal mt-2">
                          Facturé 418€ / an
                        </div>
                      )}
                      <div className="text-yellow-400 text-sm font-semibold mt-2 bg-yellow-400/10 px-3 py-1 rounded-full">
                        🎉 Première semaine à 4€ seulement !
                      </div>
                    </div>
                    {paymentType === 'yearly' && (
                      <div className="text-gray-400 text-sm mb-4">Best for beginner traders</div>
                    )}
                                          <ul className="text-gray-300 text-base space-y-4 mb-8 text-left">
                        <li className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Formation Setup</span>
                        </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Signaux (standard)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Journal de trading (1 compte)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Statistiques (de base)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>Live streams (1/semaine)</span>
                      </li>
                      
                      <li className="flex items-center gap-2">
                        <span className="text-red-400">✗</span>
                        <span>Accès prioritaire aux nouveaux setups</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-gray-300">Standard</span>
                        <span>Support standard</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    className={`w-full border-2 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-500 ease-out transform-gpu ${
                      isTransitioning 
                        ? 'border-purple-600 bg-purple-600/30 shadow-[0_0_30px_rgba(168,85,247,0.8)] scale-110' 
                        : 'border-purple-500 bg-transparent hover:scale-110 hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:bg-purple-500/20 hover:border-purple-400'
                    }`}
                  >
                    Commencer
                  </button>
                  
                  {/* Voir le détail complet */}
                  <div className="text-center mt-4">
                    <button className="text-purple-400 hover:text-purple-300 transition-colors duration-300 text-sm font-medium flex items-center justify-center gap-2 mx-auto">
                      Voir le détail complet
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Plan Pro */}
                <div 
                  className={`bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 sm:p-12 rounded-xl md:rounded-r-xl md:rounded-l-none border-2 relative flex flex-col justify-between transition-all duration-500 ease-out transform-gpu ${
                    isTransitioning 
                      ? 'border-blue-600 shadow-[0_0_40px_rgba(59,130,246,0.5)] scale-105 rotate-y-6 brightness-110' 
                      : 'border-blue-500/50 backdrop-blur-sm hover:border-blue-400 hover:from-blue-600/30 hover:to-purple-600/30 hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]'
                  }`}
                >
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse md:hidden">
                    {paymentType === 'yearly' ? '💎 ÉCONOMISE 100€' : '⭐ RECOMMANDÉ'}
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-3">PREMIUM</h3>
                    <div className={`text-4xl font-bold text-white mb-6 transition-all duration-500 ${isTransitioning ? 'scale-110' : 'scale-100'}`}>
                      <span className="text-2xl align-top text-gray-300">€</span>
                      {paymentType === 'monthly' ? '79' : '57,5'}
                      <span className="text-lg text-gray-400 font-normal"> / mois</span>
                      {paymentType === 'yearly' && (
                        <div className="text-gray-300 text-sm font-normal mt-2">
                          Facturé 690€ / an
                        </div>
                      )}
                      <div className="text-yellow-400 text-sm font-semibold mt-2 bg-yellow-400/10 px-3 py-1 rounded-full">
                        🎉 Première semaine à 4€ seulement !
                      </div>
                    </div>
                    {paymentType === 'yearly' && (
                      <div className="text-gray-400 text-sm mb-4">Best for advanced traders</div>
                    )}
                                          <ul className="text-gray-300 text-base space-y-4 mb-8 text-left">
                        <li className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span>Formation Setup</span>
                        </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Signaux en temps réel détaillés</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Journal de trading multi-comptes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Statistiques avancées par setup</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Live streams (5 jours/semaine)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Accès prioritaire aux nouveaux setups</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>Support prioritaire et contact direct</span>
                      </li>
                    </ul>
                  </div>
                  <button className={`w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-[length:200%_100%] animate-gradient text-white py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/40 ${isTransitioning ? 'animate-pulse' : ''}`}>
                    Commencer
                  </button>
                  
                  {/* Voir le détail complet */}
                  <div className="text-center mt-4">
                    <button className="text-blue-400 hover:text-blue-300 transition-colors duration-300 text-sm font-medium flex items-center justify-center gap-2 mx-auto">
                      Voir le détail complet
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
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
                            activeChannel === 'chatzone' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                          }`}
                          onClick={() => setActiveChannel('chatzone')}
                        >
                          💬 ChatZone
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
                                activeChannel === 'chatzone' ? 'text-white bg-blue-600' : 'text-gray-300 bg-gray-700 hover:text-white hover:bg-gray-600'
                              }`}
                              onClick={() => setActiveChannel('chatzone')}
                            >
                              💬 ChatZone
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
                                          Se connecter
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

                      {/* Zone de saisie - seulement pour chatzone et profit-loss */}
                      {(previewChannel === 'chatzone' || previewChannel === 'profit-loss') && (
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
                      <button onClick={() => setCurrentPage('mentions-legales')} className="block text-gray-300 hover:text-white transition-colors text-sm text-left">Mentions légales</button>
                      <button onClick={() => setCurrentPage('politique-confidentialite')} className="block text-gray-300 hover:text-white transition-colors text-sm text-left">Politique de confidentialité</button>
                      <button onClick={() => setCurrentPage('conditions-utilisation')} className="block text-gray-300 hover:text-white transition-colors text-sm text-left">Conditions d'utilisation</button>
                    </div>
                  </div>

                  {/* Risques et Conformité */}
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Conformité</h4>
                    <div className="space-y-3">
                      <button onClick={() => setCurrentPage('avertissement-risques')} className="block text-gray-300 hover:text-white transition-colors text-sm text-left">Avertissement sur les risques</button>
                      <button onClick={() => setCurrentPage('conflits-interets')} className="block text-gray-300 hover:text-white transition-colors text-sm text-left">Conflits d'intérêts</button>
                      <button onClick={() => setCurrentPage('cookies-traceurs')} className="block text-gray-300 hover:text-white transition-colors text-sm text-left">Cookies et traceurs</button>
                    </div>
                  </div>

                  {/* Contact et Support */}
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Contact</h4>
                    <div className="space-y-3">
                      <button onClick={() => setCurrentPage('support-client')} className="block text-gray-300 hover:text-white transition-colors text-sm text-left">Support client</button>
                      <button onClick={() => setCurrentPage('signalement-incident')} className="block text-gray-300 hover:text-white transition-colors text-sm text-left">Signalement d'incident</button>
                      <button onClick={() => setCurrentPage('nous-contacter')} className="block text-gray-300 hover:text-white transition-colors text-sm text-left">Nous contacter</button>
                    </div>
                  </div>

                  {/* Services */}
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Services</h4>
                    <div className="space-y-3">
                      <button onClick={() => setCurrentPage('livestream')} className="block text-gray-300 hover:text-white transition-colors text-sm text-left">Livestream Trading</button>
                    </div>
                  </div>

                  {/* Réseaux Sociaux */}
                  <div>
                    <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wide">Suivez-nous</h4>
                    <div className="space-y-3">
                      <a 
                        href="https://x.com/thethetrader" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        @thethetrader
                      </a>
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
                    <div className="flex justify-center mb-4">
                      <img 
                        src="/logo-removebg-preview.png" 
                        alt="Trading pour les nuls" 
                        className="h-20 md:h-64 lg:h-80 w-auto"

                      />
                    </div>
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
