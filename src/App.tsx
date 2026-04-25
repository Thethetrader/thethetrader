import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import './index.css';
import { LandingPage } from './components/landing/LandingPage';
import { supabase } from './lib/supabase';
import { useNotifications } from './hooks/use-notifications';
import { usePWA } from './hooks/use-pwa';
import { redirectToCheckout } from './utils/stripe';

// Lazy-load everything that's not needed on the landing page
const TradingPlatformShell = lazy(() => import('./components/generated/TradingPlatformShell'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const AdminInterface = lazy(() => import('./components/AdminInterface'));
const UserChat = lazy(() => import('./components/UserChat'));
const ProfitLoss = lazy(() => import('./components/ProfitLoss'));
const LivestreamPage = lazy(() => import('./components/LivestreamPage'));
const UserLivestreamPage = lazy(() => import('./components/UserLivestreamPage'));
const PreviewCalendar = lazy(() => import('./components/PreviewCalendar'));
const ArticlePage = lazy(() => import('./components/landing/ArticlePage').then(m => ({ default: m.ArticlePage })));
const FaqPage = lazy(() => import('./components/pages/FaqPage').then(m => ({ default: m.FaqPage })));
const ContactPage = lazy(() => import('./components/pages/ContactPage').then(m => ({ default: m.ContactPage })));
const MentionsLegalesPage = lazy(() => import('./components/pages/MentionsLegalesPage').then(m => ({ default: m.MentionsLegalesPage })));
const ConfidentialitePage = lazy(() => import('./components/pages/ConfidentialitePage').then(m => ({ default: m.ConfidentialitePage })));
const CgvPage = lazy(() => import('./components/pages/CgvPage').then(m => ({ default: m.CgvPage })));
const ReserverPage = lazy(() => import('./components/pages/ReserverPage').then(m => ({ default: m.ReserverPage })));

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
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [paymentType, setPaymentType] = useState<'monthly' | 'yearly'>('monthly');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showInstallPopup, setShowInstallPopup] = useState(false);
  const [ugcSoundOn, setUgcSoundOn] = useState(false);
  const [ugc2SoundOn, setUgc2SoundOn] = useState(false);
  const [ugc1Fallback, setUgc1Fallback] = useState(false);
  const [ugc2Fallback, setUgc2Fallback] = useState(false);
  const ugc1VideoRef = useRef<HTMLVideoElement>(null);
  const ugc2VideoRef = useRef<HTMLVideoElement>(null);
  const isMobileUgc = typeof navigator !== 'undefined' && /iPhone|iPad|Android|webOS|Mobile/i.test(navigator.userAgent);

  // Lancer la lecture des vidéos UGC sur mobile (autoplay souvent ignoré)
  useEffect(() => {
    if (currentPage !== 'home') return;
    const t = setTimeout(() => {
      ugc1VideoRef.current?.play().catch(() => {});
      ugc2VideoRef.current?.play().catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [currentPage]);

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 150; // Hauteur du header fixe + espace pour voir le numéro
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      window.location.hash = sectionId;
    }
  };

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
        overflow-x: clip;
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
      @keyframes shimmer {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
      @keyframes beam {
        0% {
          transform: translateX(-100%) skewX(-15deg);
        }
        100% {
          transform: translateX(200%) skewX(-15deg);
        }
      }
      @keyframes neonRotate {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
      @keyframes neonGlow {
        0%, 100% {
          opacity: 0.6;
          filter: blur(8px);
        }
        50% {
          opacity: 1;
          filter: blur(12px);
        }
      }
      @keyframes videoLightRotate {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    };
  }, []);

  
  // Exposer setCurrentPage globalement pour debug
  useEffect(() => {
    (window as any).setCurrentPage = setCurrentPage;
    (window as any).getCurrentPage = () => currentPage;
  }, [currentPage]);

  // Gérer le scroll vers pricing au chargement de la page si hash présent
  useEffect(() => {
    if (window.location.hash === '#pricing') {
      // Attendre que la page soit chargée
      setTimeout(() => {
        if (currentPage === 'home') {
          handleScrollToSection('pricing');
        } else {
          // Si on n'est pas sur home, rediriger vers home puis scroller
          setCurrentPage('home');
          setTimeout(() => {
            handleScrollToSection('pricing');
          }, 100);
        }
      }, 300);
    }
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

  // Détecter le retour après paiement Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const sessionId = urlParams.get('session_id');
    const reset = urlParams.get('reset');

    if (success === 'true' && sessionId) {
      const setupPassword = urlParams.get('setup_password');
      if (setupPassword === 'true') {
        // Récupérer l'email depuis la session Stripe
        fetch(`/.netlify/functions/get-checkout-email?session_id=${sessionId}`)
          .then(res => res.json())
          .then(data => {
            if (data.email) {
              setSetupPasswordEmail(data.email);
              setShowResetPasswordModal(true);
            } else {
              alert('✅ Paiement réussi ! Votre compte est en cours de création.');
            }
          })
          .catch(error => {
            console.error('Erreur récupération email:', error);
            alert('✅ Paiement réussi ! Votre compte est en cours de création.');
          });
      } else {
        alert('✅ Paiement réussi ! Votre compte est en cours de création.');
      }
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (canceled === 'true') {
      alert('❌ Paiement annulé.');
      // Nettoyer l'URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (reset === 'true') {
      // Vérifier si on a un hash de réinitialisation dans l'URL
      const hash = window.location.hash;
      if (hash.includes('access_token') || hash.includes('type=recovery')) {
        // Ouvrir le modal de réinitialisation
        setShowResetPasswordModal(true);
      }
      // Nettoyer l'URL mais garder le hash pour Supabase
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
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
  // Vue mobile (écran étroit) = même contenu court que PWA pour la section 1
  const [isNarrowView, setIsNarrowView] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = () => setIsNarrowView(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const isPWAOrMobile = isPWA || isNarrowView;
  
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

  const handleForgotPassword = async () => {
    if (!email) {
      alert('Veuillez entrer votre email pour réinitialiser votre mot de passe.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?reset=true`,
      });
      if (error) {
        alert('Erreur: ' + error.message);
      } else {
        alert('Un email de réinitialisation a été envoyé à ' + email);
      }
    } catch (error: any) {
      alert('Erreur lors de l\'envoi de l\'email: ' + error.message);
    }
  };

  const [setupPasswordEmail, setSetupPasswordEmail] = useState('');

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      alert('Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    try {
      // Vérifier si on a une session (utilisateur connecté via le hash de réinitialisation)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Utilisateur déjà authentifié (via hash de réinitialisation)
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) {
          alert('Erreur: ' + error.message);
        } else {
          alert('✅ Mot de passe créé avec succès ! Vous êtes maintenant connecté.');
          setShowResetPasswordModal(false);
          setNewPassword('');
          setConfirmPassword('');
          // Recharger pour mettre à jour l'état utilisateur
          window.location.reload();
        }
      } else if (setupPasswordEmail) {
        // Pas de session - l'utilisateur vient du paiement
        // Utiliser la fonction Netlify pour créer le mot de passe
        const response = await fetch('/.netlify/functions/setup-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: setupPasswordEmail, password: newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert('Erreur: ' + (data.error || 'Erreur lors de la création du mot de passe'));
          return;
        }

        // Mot de passe créé, maintenant connecter l'utilisateur
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: setupPasswordEmail,
          password: newPassword,
        });

        if (loginError) {
          alert('Mot de passe créé ! Veuillez vous connecter avec votre email et votre nouveau mot de passe.');
          setShowResetPasswordModal(false);
          setShowAuthModal(true);
        } else {
          alert('✅ Mot de passe créé avec succès ! Vous êtes maintenant connecté.');
          setUser({ id: loginData.user.id, email: loginData.user.email || setupPasswordEmail });
          setShowResetPasswordModal(false);
          setNewPassword('');
          setConfirmPassword('');
          setSetupPasswordEmail('');
        }
      } else {
        alert('Email non trouvé. Veuillez utiliser "Mot de passe oublié" depuis la page de connexion.');
        setShowResetPasswordModal(false);
        setShowAuthModal(true);
      }
    } catch (error: any) {
      alert('Erreur lors de la création du mot de passe: ' + error.message);
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
                  <p><strong>Email :</strong> contacttpln@gmail.com</p>
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
                  <p><strong>Email prioritaire :</strong> contacttpln@gmail.com</p>
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
                  <p>contacttpln@gmail.com</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-3">🛠️ Support technique</h4>
                  <p>contacttpln@gmail.com</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-3">📈 Partenariats</h4>
                  <p>contacttpln@gmail.com</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-3">⚖️ Questions légales</h4>
                  <p>contacttpln@gmail.com</p>
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
          <Suspense fallback={<div />}><LivestreamPage /></Suspense>
        ) : (
          <Suspense fallback={<div />}><UserLivestreamPage /></Suspense>
        )
      }
    };

    if (currentPage === 'home' || !pages[currentPage]) return null;

    const page = pages[currentPage];
    return (
      <div className={`min-h-screen bg-[#0F1115] ${isPWA && currentPage === 'home' && !user ? 'pwa-landing-no-scroll' : isPWA && user ? 'pwa-connected-scroll' : ''}`}>
        {/* Header with back button */}
        <nav className="flex items-center justify-between p-4 sm:p-6 relative z-50 border-b border-[#222836]">
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
      return <Suspense fallback={<div />}><AdminInterface /></Suspense>;
    } else {
      return <Suspense fallback={<div />}><AdminLogin onLogin={(adminData) => {
        console.log('✅ Admin connecté dans App.tsx:', adminData.user.email);
        localStorage.setItem('adminAuthenticated', 'true');
        localStorage.setItem('adminUser', JSON.stringify(adminData.user));
        setCurrentPage('temp');
        setTimeout(() => setCurrentPage('admin'), 100);
      }} /></Suspense>;
    }
  }

  // Si utilisateur connecté, afficher ton salon complet
  if (user) {
    return (
      <div className="relative">
        {/* Ton salon complet */}
        <Suspense fallback={<div />}><TradingPlatformShell /></Suspense>
        
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
                
  // Articles TPLN
  const articleMatch = window.location.pathname.match(/^\/articles\/([^/]+)\/?$/);
  if (articleMatch) return <Suspense fallback={<div />}><ArticlePage slug={articleMatch[1]} /></Suspense>;

  // Pages statiques
  const p = window.location.pathname.replace(/\/$/, "");
  if (p === "/faq") return <Suspense fallback={<div />}><FaqPage /></Suspense>;
  if (p === "/contact") return <Suspense fallback={<div />}><ContactPage onOpenAuth={() => setShowAuthModal(true)} /></Suspense>;
  if (p === "/reserver") return <Suspense fallback={<div />}><ReserverPage onOpenAuth={() => setShowAuthModal(true)} /></Suspense>;
  if (p === "/mentions-legales") return <Suspense fallback={<div />}><MentionsLegalesPage /></Suspense>;
  if (p === "/confidentialite") return <Suspense fallback={<div />}><ConfidentialitePage /></Suspense>;
  if (p === "/CGV" || p === "/cgv") return <Suspense fallback={<div />}><CgvPage /></Suspense>;

  // Si on est sur une page légale, l'afficher
  if (currentPage !== 'home') {
    return renderLegalPage();
  }

  // Nouvelle landing page Alti pour visiteurs non connectés (hors PWA)
  if (currentPage === 'home' && !user && !isPWA) {
    return (
      <>
        <LandingPage onOpenAuth={() => setShowAuthModal(true)} />
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
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:text-blue-800 text-left w-full"
                >
                  Mot de passe oublié ?
                </button>
                <button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white py-3 rounded-[14px] font-medium transition-all duration-200"
                >
                  Se connecter
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0F1115] ${isPWA && currentPage === 'home' && !user ? 'pwa-landing-no-scroll' : isPWA && user ? 'pwa-connected-scroll' : ''}`} data-pwa={isPWA ? "true" : undefined}>
      {/* Navigation - Masquée en PWA */}
      {!isPWA && (
        <nav className="app-fixed-header relative flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3 z-50 bg-[#0F1115] border-b border-[#222836] h-16" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center h-full flex-shrink-0">
            <img 
              src="/logo-removebg-preview.png" 
              alt="Trading pour les nuls" 
              width={126}
              height={84}
              className="h-12 sm:h-12 md:h-14 w-auto object-contain"

            />
          </div>
          
          {/* Menu Desktop - centré dans le header */}
          <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 space-x-8 items-center">
            <button onClick={() => handleScrollToSection('services')} className="text-[#AAB3C2] hover:text-[#F2F4F8] transition-all duration-200 flex items-center h-full font-medium text-lg tracking-wide">Services</button>
            <button onClick={() => handleScrollToSection('about-thethetrader')} className="text-[#AAB3C2] hover:text-[#F2F4F8] transition-all duration-200 flex items-center h-full font-medium text-lg tracking-wide">À propos</button>
            <button onClick={() => handleScrollToSection('section-app')} className="text-[#AAB3C2] hover:text-[#F2F4F8] transition-all duration-200 flex items-center h-full font-medium text-lg tracking-wide">La plateforme</button>
            <button onClick={() => handleScrollToSection('pricing')} className="text-[#AAB3C2] hover:text-[#F2F4F8] transition-all duration-200 flex items-center h-full font-medium text-lg tracking-wide">Prix</button>
          </div>
          
          {/* Bouton Hamburger Mobile */}
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          <div className="hidden md:flex items-center space-x-3 h-full">
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowInstallPopup(true);
              }}
              className="bg-[#141821] hover:bg-[#171C26] border border-[#222836] text-[#F2F4F8] px-4 py-2 sm:px-6 sm:py-3 rounded-[14px] font-medium transition-all duration-200 text-sm sm:text-base flex items-center gap-2"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
                </svg>
              </span>
              <span className="hidden sm:inline">Télécharger l'app</span>
              <span className="sm:hidden">App</span>
            </button>
            <button 
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-[14px] font-medium transition-all duration-200 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">Se connecter</span>
              <span className="sm:hidden">Login</span>
            </button>
          </div>
        </nav>
      )}
      
      {/* Menu Mobile Dropdown */}
      {!isPWA && showMobileMenu && (
        <div className="fixed top-16 left-0 right-0 bg-[#141821] border-b border-[#222836] z-40 md:hidden max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col px-4 py-3 space-y-0.5">
            <button 
              onClick={() => {
                setShowMobileMenu(false);
                handleScrollToSection('pricing');
              }}
              className="text-[#AAB3C2] hover:text-[#F2F4F8] transition-all duration-200 py-1.5 text-base font-medium text-left"
            >
              Services
            </button>
            <button 
              onClick={() => {
                setShowMobileMenu(false);
                handleScrollToSection('section-app');
              }}
              className="text-[#AAB3C2] hover:text-[#F2F4F8] transition-all duration-200 py-1.5 text-base font-medium text-left"
            >
              La plateforme
            </button>
            <button 
              onClick={() => {
                setShowMobileMenu(false);
                handleScrollToSection('about-thethetrader');
              }}
              className="text-[#AAB3C2] hover:text-[#F2F4F8] transition-all duration-200 py-1.5 text-base font-medium text-left"
            >
              À propos
            </button>
            <button 
              onClick={() => {
                setShowMobileMenu(false);
                handleScrollToSection('pricing');
              }}
              className="text-[#AAB3C2] hover:text-[#F2F4F8] transition-all duration-200 py-1.5 text-base font-medium text-left"
            >
              Tarifs
            </button>
            <button 
              onClick={() => {
                setShowMobileMenu(false);
                handleScrollToSection('pricing');
              }}
              className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white px-4 py-2 rounded-[14px] font-medium text-base transition-all duration-200 mt-2"
            >
              Rejoindre TPLN
            </button>
            <div className="pt-2 mt-2 border-t border-[#222836] flex flex-col gap-2">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setShowMobileMenu(false);
                  setShowInstallPopup(true);
                }}
                className="bg-[#141821] hover:bg-[#171C26] border border-[#222836] text-[#F2F4F8] px-4 py-2 rounded-[14px] font-medium transition-all duration-200 text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
                </svg>
                Télécharger l'app
              </button>
              <button 
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowAuthModal(true);
                }}
                className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white px-4 py-2 rounded-[14px] font-medium transition-all duration-200 text-center text-sm"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup d'installation PWA */}
      {showInstallPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#141821] rounded-[16px] p-8 max-w-md w-full border border-[#222836] shadow-[0_6px_18px_rgba(0,0,0,0.25)]">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-[#F2F4F8]" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>📱 Installer l'app</h3>
              <button 
                onClick={() => setShowInstallPopup(false)}
                className="text-[#7F8AA1] hover:text-[#F2F4F8] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Instructions iOS */}
              <div className="bg-[#141821] rounded-[12px] p-4 border border-[#222836]">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>
                  <span>🍎</span> Sur iPhone/iPad
                </h4>
                <ol className="space-y-2 text-[#AAB3C2] text-sm">
                  <li className="flex gap-2">
                    <span className="font-bold bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent">1.</span>
                    <span>Appuie sur le bouton <strong>Partager</strong> 📤 (en bas de Safari)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent">2.</span>
                    <span>Sélectionne <strong>"Sur l'écran d'accueil"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent">3.</span>
                    <span>Confirme en appuyant sur <strong>"Ajouter"</strong></span>
                  </li>
                </ol>
              </div>

              {/* Instructions Android */}
              <div className="bg-[#141821] rounded-[12px] p-4 border border-[#222836]">
                <h4 className="text-lg font-semibold text-[#13C26B] mb-3 flex items-center gap-2" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>
                  <span>🤖</span> Sur Android
                </h4>
                <ol className="space-y-2 text-[#AAB3C2] text-sm">
                  <li className="flex gap-2">
                    <span className="font-bold text-[#13C26B]">1.</span>
                    <span>Appuie sur le menu <strong>⋮</strong> (en haut à droite)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-[#13C26B]">2.</span>
                    <span>Sélectionne <strong>"Ajouter à l'écran d'accueil"</strong> ou <strong>"Installer l'application"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-[#13C26B]">3.</span>
                    <span>Confirme l'installation</span>
                  </li>
                </ol>
              </div>

              {/* Instructions Desktop */}
              <div className="bg-[#141821] rounded-[12px] p-4 border border-[#222836]">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2 bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>
                  <span>💻</span> Sur ordinateur
                </h4>
                <ol className="space-y-2 text-[#AAB3C2] text-sm">
                  <li className="flex gap-2">
                    <span className="font-bold bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent">1.</span>
                    <span>Clique sur l'icône <strong>⊕</strong> ou <strong>🔽</strong> dans la barre d'adresse</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent">2.</span>
                    <span>Sélectionne <strong>"Installer TPLN"</strong></span>
                  </li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowInstallPopup(false)}
              className="mt-6 w-full bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white py-3 rounded-[14px] font-medium transition-all duration-200"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}

      {/* Version PWA - Page scrollable quand connecté */}
      {isPWA ? (
        <div className={`w-screen ${user ? 'min-h-screen' : 'h-screen overflow-hidden flex items-center justify-center'} bg-[#0F1115]`}>
          {/* Hero Section - Centré verticalement quand pas connecté, scrollable quand connecté */}
          <div className={`text-center ${user ? 'pt-20 pb-8' : 'w-full'} px-4 sm:px-6 max-w-full`}>
            <div className="mb-0 flex justify-center hover:scale-105 transition-transform duration-300">
              <img 
                src="/logo-removebg-preview.png" 
                alt="Trading pour les nuls" 
                width={252}
                height={168}
                className="h-64 sm:h-80 w-auto object-cover"
                style={{ clipPath: 'inset(10% 5% 15% 5%)' }}

              />
            </div>
            <p className="text-lg sm:text-2xl text-[#AAB3C2] mb-6 sm:mb-8 max-w-4xl mx-auto px-2 -mt-8" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400 }}>
              Un setup très simple, des signaux expliqués, un journal de performance. Rejoins la communauté et trade en confiance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-6 sm:mb-8 px-4">
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white px-8 sm:px-10 py-4 sm:py-5 rounded-[14px] text-lg sm:text-xl font-medium transition-all duration-200 w-full sm:w-auto"
              >
                Se connecter
              </button>
            </div>


            
            
            {/* Lien Twitter */}
            <div className="text-center mt-6">
              <a 
                href="https://x.com/thethetrader" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 justify-center bg-[#141821] hover:bg-[#171C26] text-[#F2F4F8] px-3 py-2 rounded-[12px] font-medium transition-all duration-200 border border-[#222836] text-xs"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Suivez @thethetrader</span>
              </a>
            </div>
          </div>
          {/* Contenu complet quand connecté */}
          {user && (
            <>
              {/* Hero Section complète */}
              <div className={`text-center pt-28 sm:pt-40 pb-0 px-4 sm:px-6 ${isPWA ? 'w-full max-w-full box-border' : ''}`}>
                <h1 className="font-bold mb-6 sm:mb-8 leading-tight" style={{ fontSize: 'clamp(1.6rem, 8vw, 4.5rem)', fontFamily: 'Sora, sans-serif', fontWeight: 700, lineHeight: 1.1 }}>
                  <span className="text-[#F2F4F8]">Trader avec précision.</span>
                  <br />
                  <span className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent">
                    Sans bruit. <span style={{ whiteSpace: 'nowrap' }}>Sans hasard.</span>
                  </span>
                </h1>
                <p className={`hero-intro-p text-lg sm:text-xl text-[#AAB3C2] mb-8 sm:mb-12 max-w-4xl leading-relaxed ${isPWA ? 'pwa-hero-left' : 'mx-auto text-center'}`} style={{ ...(isPWA ? {} : { transform: 'translateX(calc(35% + 5mm))' }), fontFamily: 'Inter, sans-serif', fontWeight: 400, lineHeight: 1.6 }}>
                  TPLN est un cadre précis d'exécution.<br />
                  <br />
                  Tu maîtrises la structure.<br />
                  Tu observes une discipline appliquée en temps réel.<br />
                  Ta performance devient mesurable.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mt-6 mb-8">
                  <button 
                    onClick={() => handleScrollToSection('pricing')}
                    className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white px-8 py-4 rounded-[14px] font-medium text-lg transition-all duration-200"
                  >
                    Commencer Maintenant
                  </button>
                </div>
                <div className="max-w-md mx-auto mt-6 text-center">
                  <p className="text-[#AAB3C2] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    TPLN — Un système structuré pour exécuter avec clarté.
                  </p>
                </div>

              </div>

              {/* Section Apprentissage (cible du clic Formation en PWA) */}
              <div id="section-formation" className="py-16 sm:py-24 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="font-bold mb-6 text-center leading-tight" style={{ fontSize: isPWA ? 'clamp(1.75rem, 10vw, 4rem)' : 'clamp(1.25rem, 6vw, 3.25rem)' }}>
                      <span className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent">
                        UN CADRE CLAIR
                      </span>
                    </h2>
                    <p className="section-intro-p text-gray-400 text-lg max-w-2xl mx-auto mb-8 text-center" style={isPWA ? undefined : { transform: 'translateX(calc(39% + 5mm))' }}>
                      TPLN repose sur une structure définie. Chaque décision suit des critères stricts.
                      <br />
                      <br />
                      Les opportunités sont validées par une checklist binaire. Si les conditions sont réunies, le trade est exécuté. Sinon, il est rejeté.
                      <br />
                      <br />
                      Pas d'improvisation. La constance dépend du cadre.
                    </p>
                  </div>

                  {/* Plans de prix - Mobile Optimized */}
                  <div id="pricing" className="max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6">

                    {/* Encadré 100 premiers - couleurs site (violet/bleu/rose) */}
                    <div className="max-w-2xl mx-auto mb-6 sm:mb-8 rounded-[16px] border border-[#222836] bg-[#141821] px-5 py-3.5 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                        <span className="text-[#F2F4F8] font-medium text-base sm:text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>Offre réservée aux</span>
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-0.5 rounded-[12px] bg-[#2E6BFF] text-white font-bold text-lg" style={{ fontVariantNumeric: 'tabular-nums' }}>100</span>
                        <span className="text-[#F2F4F8] font-medium text-base sm:text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>premiers utilisateurs</span>
                      </div>
                    </div>
                    
                    {/* Payment Type Selector */}
                    <div className="flex justify-center mb-8">
                      <div className="bg-[#141821] border border-[#222836] p-1 rounded-[12px] flex">
                        <button 
                          onClick={() => handlePaymentTypeChange('monthly')}
                          className={`px-6 py-3 rounded-[12px] font-medium transition-all duration-200 ${
                            paymentType === 'monthly' 
                              ? 'bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] text-white' 
                              : 'text-[#AAB3C2] hover:text-[#F2F4F8]'
                          }`}
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                        >
                          Payer mensuellement
                        </button>
                        <button 
                          onClick={() => handlePaymentTypeChange('yearly')}
                          className={`px-6 py-3 rounded-[12px] font-medium transition-all duration-200 ${
                            paymentType === 'yearly' 
                              ? 'bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] text-white'
                              : 'text-[#AAB3C2] hover:text-[#F2F4F8]'
                          }`}
                          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                        >
                          Payer annuellement
                        </button>
                      </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className={`grid md:grid-cols-[0.8fr_0.9fr_1.1fr] gap-6 sm:gap-8 items-stretch transition-all duration-400 ease-out ${isTransitioning ? 'opacity-0 scale-75 rotate-3 blur-md translate-y-20 transform-gpu perspective-1000' : 'opacity-100 scale-100 rotate-0 blur-0 translate-y-0 transform-gpu perspective-1000'}`} style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
                      
                      {/* Journal Pro Plan */}
                      <div className={`bg-[#141821] rounded-[16px] p-6 sm:p-8 relative border border-[#222836] transition-all duration-200 flex flex-col h-full hover:bg-[#171C26] hover:border-[#2A2F3F]`} style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>
                        <h3 className="text-xl font-bold text-[#F2F4F8] mb-3 h-8 flex items-center" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>JOURNAL PRO</h3>
                        <div className={`text-4xl font-bold text-[#F2F4F8] mb-6 transition-all duration-200 flex flex-col`} style={{ height: '80px', justifyContent: 'flex-start', fontVariantNumeric: 'tabular-nums' }}>
                          <div className="h-auto">
                            <span className="text-2xl align-top text-[#AAB3C2]">€</span>
                            {paymentType === 'monthly' ? '29' : '26'}
                            <span className="text-lg text-[#7F8AA1] font-normal"> / mois</span>
                          </div>
                          {paymentType === 'yearly' && (
                            <div className="text-[#AAB3C2] text-sm font-normal mt-2">Facturé 312€ / an</div>
                          )}
                          </div>
                        <ul className="text-[#AAB3C2] text-base space-y-4 mb-8 text-left flex-grow" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Journal professionnel multi-comptes</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Comptes illimités</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Analyse avancée</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Comparaison de comptes</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#EF4444] font-bold text-lg">✗</span>
                            <span className="font-medium text-[#F2F4F8]">Méthode TPLN</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#EF4444] font-bold text-lg">✗</span>
                            <span className="font-medium text-[#F2F4F8]">Exécutions partagées</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#EF4444] font-bold text-lg">✗</span>
                            <span className="font-medium text-[#F2F4F8]">Live</span>
                          </li>
                        </ul>
                        <div className="mt-auto flex flex-col" style={{ minHeight: '100px' }}>
                          <button 
                            onClick={async () => {
                              try {
                                console.log('🖱️ Clic sur bouton Journal Pro');
                                await redirectToCheckout('journal', paymentType);
                              } catch (error: any) {
                                console.error('Erreur:', error);
                                alert(`Erreur: ${error?.message || 'Erreur lors de l\'ouverture du paiement'}`);
                              }
                            }}
                            className="w-full bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white py-3 px-6 rounded-[14px] font-medium transition-all duration-200 h-12 flex items-center justify-center"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                          >
                            Accéder au Journal Pro
                          </button>
                        </div>
                      </div>
                      
                      {/* Basic Plan - Méthode */}
                      <div className={`bg-[#141821] rounded-[16px] p-6 sm:p-8 relative border border-[#222836] transition-all duration-200 flex flex-col h-full hover:bg-[#171C26] hover:border-[#2A2F3F]`} style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#2E6BFF] text-white px-4 py-1 rounded-[12px] text-xs font-medium md:hidden">
                          {paymentType === 'yearly' ? '💎 ÉCONOMISE 50€' : ''}
                        </div>
                        <h3 className="text-xl font-bold text-[#F2F4F8] mb-2 h-8 flex items-center" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>MÉTHODE TPLN</h3>
                        <p className="text-[#AAB3C2] text-sm mb-3 italic">👉 Apprends en solo</p>
                        <div className={`text-4xl font-bold text-[#F2F4F8] mb-6 transition-all duration-200 flex flex-col`} style={{ height: '80px', justifyContent: 'flex-start', fontVariantNumeric: 'tabular-nums' }}>
                          <div className="h-auto">
                            <span className="text-2xl align-top text-[#AAB3C2]">€</span>
                            {paymentType === 'monthly' ? '49' : '44'}
                            <span className="text-lg text-[#7F8AA1] font-normal"> / mois</span>
                          </div>
                          {paymentType === 'yearly' && (
                            <div className="text-[#AAB3C2] text-sm font-normal mt-2">Facturé 528€ / an</div>
                          )}
                          </div>
                        <ul className="text-[#AAB3C2] text-base space-y-4 mb-8 text-left flex-grow" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Formation TPLN complète</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Journal (1 compte inclus)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Structure + gestion du risque</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Exécution disciplinée</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#EF4444] font-bold text-lg">✗</span>
                            <span className="font-medium text-[#F2F4F8]">Pas de live</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#EF4444] font-bold text-lg">✗</span>
                            <span className="font-medium text-[#F2F4F8]">Pas d'opportunités en temps réel</span>
                          </li>
                        </ul>
                        <div className="mt-auto flex flex-col" style={{ minHeight: '100px' }}>
                          <button 
                            onClick={async () => {
                              try {
                                console.log('🖱️ Clic sur bouton Basic');
                                await redirectToCheckout('basic', paymentType);
                              } catch (error: any) {
                                console.error('Erreur Stripe:', error);
                                alert(`Erreur: ${error?.message || 'Erreur lors de l\'ouverture du paiement'}`);
                              }
                            }}
                            className="w-full bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white py-3 px-6 rounded-[14px] font-medium transition-all duration-200 h-12 flex items-center justify-center"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                          >
                            Je m'abonne
                          </button>
                        </div>
                      </div>

                      {/* Premium Plan - L'environnement complet TPLN */}
                      <div className={`bg-[#141821] rounded-[16px] p-6 sm:p-8 relative border border-[#2E6BFF] transition-all duration-200 flex flex-col h-full hover:bg-[#171C26] hover:border-[#2558D6]`} style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#2E6BFF] text-white px-4 py-1 rounded-[12px] text-xs font-medium">
                          ⭐ RECOMMANDÉ
                        </div>
                        <h3 className="text-xl font-bold mb-2 h-8 flex items-center bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent uppercase" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>L'environnement complet TPLN</h3>
                        <p className="text-[#AAB3C2] text-sm mb-3 italic">👉 Méthode + Exécution + Transparence totale</p>
                        <div className={`text-4xl font-bold text-[#F2F4F8] mb-6 transition-all duration-200 flex flex-col`} style={{ height: '100px', justifyContent: 'flex-start', fontVariantNumeric: 'tabular-nums' }}>
                          <div className="h-auto">
                            <span className="text-2xl align-top text-[#AAB3C2]">€</span>
                            {paymentType === 'monthly' ? '79' : '57,5'}
                            <span className="text-lg text-[#7F8AA1] font-normal"> / mois</span>
                          </div>
                          {paymentType === 'yearly' && (
                            <div className="text-[#AAB3C2] text-sm font-normal mt-2">Facturé 690€ / an</div>
                          )}
                          </div>
                        <div className="text-[#7F8AA1] text-sm mb-4 h-[20px] flex items-center">
                          {paymentType === 'yearly' ? '' : <>&nbsp;</>}
                          </div>
                        <ul className="text-[#AAB3C2] text-base space-y-4 mb-8 text-left flex-grow" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Accès intégral à la méthode TPLN</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Exécution live 5j / semaine</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Opportunités validées et expliquées en direct</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Notification immédiate via l'app</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Journal professionnel multi-comptes</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#13C26B] font-bold text-lg">✓</span>
                            <span className="font-medium text-[#F2F4F8]">Accès direct au fondateur</span>
                          </li>
                        </ul>
                        <div className="mt-auto flex flex-col" style={{ minHeight: '100px' }}>
                          <button 
                            onClick={async () => {
                              try {
                                console.log('🖱️ Clic sur bouton Premium');
                                await redirectToCheckout('premium', paymentType);
                              } catch (error: any) {
                                console.error('Erreur Stripe:', error);
                                alert(`Erreur: ${error?.message || 'Erreur lors de l\'ouverture du paiement'}`);
                              }
                            }}
                            className="w-full bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white py-3 px-6 rounded-[14px] font-medium transition-all duration-200 h-12 flex items-center justify-center"
                            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500 }}
                          >
                            Rejoindre l'environnement TPLN
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
          <div className="text-center pt-28 sm:pt-40 pb-0 px-4 sm:px-6">
            <h1 className="font-bold mb-6 sm:mb-8 leading-tight" style={{ fontSize: 'clamp(1.6rem, 8vw, 4.5rem)' }}>
              <span className="text-white">Trader avec précision.</span>
              <br />
              <span className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent">
                Sans bruit. <span style={{ whiteSpace: 'nowrap' }}>Sans hasard.</span>
              </span>
            </h1>
            <p className={`hero-intro-p text-lg sm:text-xl text-gray-400 mb-8 sm:mb-12 max-w-4xl leading-relaxed ${isPWA ? 'pwa-hero-left' : 'mx-auto text-center'}`} style={isPWA ? undefined : { transform: 'translateX(calc(35% + 5mm))' }}>
              TPLN est un cadre précis d'exécution.<br />
              <br />
              Tu maîtrises la structure.<br />
              Tu observes une discipline appliquée en temps réel.<br />
              Ta performance devient mesurable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mt-6 mb-8">
              <button 
                onClick={() => handleScrollToSection('pricing')}
                className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white px-8 py-4 rounded-[14px] font-medium text-lg transition-all duration-200"
              >
                Commencer Maintenant
              </button>
            </div>
            <div className="max-w-md mx-auto mt-6 text-center">
              <p className="text-[#AAB3C2] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                TPLN — Un système structuré pour exécuter avec clarté.
              </p>
            </div>

            {/* Nos Services - Navigation Horizontale */}
            <div id="services" className="w-full mb-10 sm:mb-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-20">
              </div>

              {/* Sections des services - Déplacées vers le haut */}
              <div className="w-screen -mx-4 sm:mx-0 sm:w-full mt-8">
                {selectedService === 'Formation' && (
                  <div className="bg-[rgba(46,107,255,0.12)] rounded-[16px] p-8 m-4 border border-[#222836]">
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
                  <div className="bg-[rgba(46,107,255,0.12)] rounded-[16px] p-8 m-4 border border-[#222836]">
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
                  <div className="bg-[rgba(46,107,255,0.12)] rounded-[16px] p-8 m-4 border border-[#222836]">
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

            {/* À propos - Mobile Optimized (hidden) */}
            <div className="max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6 hidden flex justify-center">
              <div className="w-full max-w-2xl bg-gray-800/50 p-4 sm:p-5 rounded-xl border border-gray-600/50 backdrop-blur-sm">
                <h2 className="text-2xl sm:text-3xl font-bold text-white text-left mb-4">
                    À propos de TheTheTrader
                  </h2>
                <div className="text-gray-300 text-sm sm:text-base leading-snug space-y-1.5 text-left mb-4">
                  <p>Trader depuis 3 ans. Des milliers d'heures d'écran.</p>
                  <p>
                    J'ai testé les indicateurs. Les stratégies miracles. Les systèmes compliqués.
                  </p>
                  <p>Rien ne fonctionne durablement sans structure.</p>
                  <p>
                    TPLN n'est pas né d'une promesse. Il est né d'un constat : la constance vient du cadre.
                  </p>
                  <p>Aujourd'hui je partage :</p>
                  <ul className="list-none space-y-0.5 pl-0 text-sm">
                    <li>• Une méthode claire</li>
                    <li>• Une exécution expliquée</li>
                    <li>• Un environnement structuré</li>
                    <li>• Un suivi réel de performance</li>
                  </ul>
                  <p>
                    Pas de marketing agressif. Pas de promesses irréalistes. Uniquement du travail structuré.
                    </p>
                  </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <a 
                      href="https://x.com/thethetrader" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="X @thethetrader"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#222836] hover:bg-[#2A2F3F] text-[#AAB3C2] hover:text-white transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                    <a 
                      href="https://www.instagram.com/tradingpourlesnuls_/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Instagram @tradingpourlesnuls_"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#222836] hover:bg-[#2A2F3F] text-[#AAB3C2] hover:text-white transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                    <a 
                      href="https://www.tiktok.com/@tradingpourlesnuls_?_t=ZN-90uWKmkvqoI&_r=1" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="TikTok @tradingpourlesnuls_"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#222836] hover:bg-[#2A2F3F] text-[#AAB3C2] hover:text-white transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                    </a>
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
                <div className="bg-[#141821] rounded-[16px] p-6 sm:p-8 text-center border border-[#222836] hover:bg-[#171C26] hover:border-[#2A2F3F] transition-all duration-200 cursor-pointer group" style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>
                  <div className="text-4xl text-[#2E6BFF] mb-4 transition-transform duration-200">⚡</div>
                  <div className="text-xl font-bold text-[#F2F4F8] mb-2 transition-colors duration-200" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>Simplicité</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Approche simple et efficace. Pas de jargon compliqué, juste des résultats concrets.</div>
                </div>

                {/* Carte 2 */}
                <div className="bg-[#141821] rounded-[16px] p-6 sm:p-8 text-center border border-[#222836] hover:bg-[#171C26] hover:border-[#2A2F3F] transition-all duration-200 cursor-pointer group" style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>
                  <div className="text-4xl text-[#2E6BFF] mb-4 transition-transform duration-200">🎯</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">Résultats</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Signaux précis et formation qui transforme les débutants en traders confirmés.</div>
                </div>

                {/* Carte 3 */}
                <div className="bg-[#141821] rounded-[16px] p-6 sm:p-8 text-center border border-[#222836] hover:bg-[#171C26] hover:border-[#2A2F3F] transition-all duration-200 cursor-pointer group" style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>
                  <div className="text-4xl text-[#2E6BFF] mb-4 transition-transform duration-200">🤝</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">Communauté</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Rejoignez une communauté active de traders qui partagent et s'entraident.</div>
                </div>

                {/* Carte 4 - Journal de Trading */}
                <div className="bg-[#141821] rounded-[16px] p-6 sm:p-8 text-center border border-[#222836] hover:bg-[#171C26] hover:border-[#2A2F3F] transition-all duration-200 cursor-pointer group" style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>
                  <div className="text-4xl text-[#2E6BFF] mb-4 transition-transform duration-200">📔</div>
                  <div className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors duration-300">Journal Personnel</div>
                  <div className="text-gray-300 text-sm sm:text-base group-hover:text-gray-200 transition-colors duration-300">Chacun a son propre journal de trading pour suivre ses trades et analyser ses performances.</div>
                </div>
              </div>
              
              {/* Section 1 - Le problème */}
              <div id="section-methode-tpln" className="mt-16 sm:mt-20">
                <div className="relative">
                  <div className="absolute -top-16 -left-16 text-9xl font-bold text-[#2E6BFF]/20 select-none" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                    1
                  </div>
                  <div className="text-center mb-8">
                    <h2 className="font-bold mb-8 text-center leading-tight bg-clip-text text-transparent" style={{ fontSize: isPWA ? 'clamp(1.75rem, 10vw, 4rem)' : 'clamp(1.25rem, 6vw, 3.25rem)', backgroundImage: 'linear-gradient(to right, #2E6BFF 0%, #6B9AFF 35%, #E8EDF5 70%, #FFFFFF 100%)' }}>
                      Le problème
                    </h2>
                  </div>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-10 max-w-6xl mx-auto mb-8">
                    <div className={`max-w-[480px] lg:flex-shrink-0 ${isPWAOrMobile ? 'text-center mx-auto w-full' : 'text-left'}`}>
                      <p className={`text-white font-bold leading-tight ${isPWAOrMobile ? 'mb-3' : 'mb-6'}`} style={{ fontFamily: 'Inter, sans-serif', fontSize: isPWA ? 'clamp(1.75rem, 10vw, 4rem)' : 'clamp(1.25rem, 6vw, 3.25rem)' }}>
                        Le trading est devenu flou.
                      </p>
                      <div className={`text-[#AAB3C2] text-lg ${isPWAOrMobile ? 'leading-tight space-y-0.5' : 'leading-[1.6]'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
                        <p className={isPWAOrMobile ? 'mb-0.5' : 'mb-2'}>Indicateurs partout.</p>
                        <p className={isPWAOrMobile ? 'mb-0.5' : 'mb-2'}>Stratégies qui changent.</p>
                        <p className={isPWAOrMobile ? 'mb-0' : 'mb-4'}>Aucune structure claire.</p>
                        {!isPWAOrMobile && (
                          <>
                            <p className="mb-4">TPLN simplifie tout.</p>
                            <p className="mb-1">Un modèle.</p>
                            <p className="mb-1">Des règles précises.</p>
                            <p className="mb-0">Une exécution disciplinée.</p>
                          </>
                        )}
                  </div>
                      {isPWAOrMobile && (
                        <>
                          <p className="text-white font-bold leading-tight mb-3 mt-6 whitespace-nowrap" style={{ fontFamily: 'Inter, sans-serif', fontSize: isPWA ? 'clamp(1.75rem, 10vw, 4rem)' : 'clamp(1.25rem, 6vw, 3.25rem)' }}>
                            Pourquoi la majorité stagne ?
                          </p>
                          <div className="text-[#AAB3C2] text-lg leading-tight space-y-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <p className="mb-0.5">Pas de cadre</p>
                            <p className="mb-0.5">Pas de constance</p>
                            <p className="mb-0.5">Pas de mesure</p>
                            <p className="mb-0">Trop d'improvisation</p>
                    </div>
                          <p className="text-white font-bold leading-tight mb-3 mt-6" style={{ fontFamily: 'Inter, sans-serif', fontSize: isPWA ? 'clamp(1.75rem, 10vw, 4rem)' : 'clamp(1.25rem, 6vw, 3.25rem)' }}>
                            TPLN remet de la structure.
                          </p>
                          <p className="text-[#AAB3C2] text-base leading-tight mb-3 -mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                            Là où les autres improvisent
                          </p>
                          <div className="text-[#AAB3C2] text-lg leading-tight space-y-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <p className="mb-0.5">Un modèle simple.</p>
                            <p className="mb-0.5">Des règles précises.</p>
                            <p className="mb-0.5">Une exécution disciplinée.</p>
                            <p className="mb-0">Un système mesurable.</p>
                    </div>
                          <button
                            type="button"
                            onClick={() => handleScrollToSection('pricing')}
                            className="mt-6 w-full sm:w-auto bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white px-6 py-3 rounded-[14px] font-medium text-base transition-all duration-200"
                          >
                            Structurer mon exécution
                          </button>
                        </>
                      )}
                  </div>
                    {!isPWAOrMobile && (
                    <div className="lg:flex-1 lg:min-w-0 flex justify-center">
                  <div className="mb-0 w-full max-w-lg">
                    <div className="bg-[#141821] border border-[#222836] rounded-[16px] p-8 hover:border-[#2E6BFF]/50 hover:shadow-[0_12px_32px_rgba(46,107,255,0.2)] transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#2E6BFF] to-transparent"></div>
                      <h3 className="text-[#F2F4F8] text-xl font-semibold mb-6 text-left" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>
                        Pourquoi la majorité stagne :
                      </h3>
                      <ul className="space-y-3.5">
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                          <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Ils exécutent sans cadre</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                          <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Ils changent de stratégie chaque semaine</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                          <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Ils ne mesurent rien</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                          <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Ils confondent activité et performance</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                          <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Ils n'ont aucune structure reproductible</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                    </div>
                    )}
                  </div>
              </div>
            </div>

              {/* Section 2 - Signaux */}
              <div id="section-signaux" className="mt-16 sm:mt-20">
                <div className="relative">
                  {/* Numéro 2 en haut à gauche */}
                  <div className="absolute -top-16 -left-16 text-9xl font-bold text-[#2E6BFF]/20 select-none" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                    2
                  </div>
                  
                  {/* Titre principal */}
                  <div className="text-center mb-8">
                    <h2 className="font-bold mb-6 text-center leading-tight" style={{ fontSize: isPWA ? 'clamp(1.75rem, 10vw, 4rem)' : 'clamp(1.25rem, 6vw, 3.25rem)' }}>
                      <span className="text-white">Journal TPLN</span>
                      <br />
                      <span className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent">
                        Structure. Discipline. Clarté.
                      </span>
                    </h2>
                    {/* Premium Fintech Feature Block */}
                    <div className="max-w-[1100px] mx-auto mb-16 sm:mb-20">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
                        {/* Left: Intro Text */}
                        <div className="max-w-[480px]">
                          <h3 className="text-[#F2F4F8] text-4xl sm:text-5xl font-bold mb-6 leading-[1.1]" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                            Mesure ta performance réelle.
                          </h3>
                          <div className="text-[#AAB3C2] text-lg leading-[1.5]" style={{ fontFamily: 'Inter, sans-serif' }}>
                            <p className="mb-3">
                              Il mesure la qualité de tes décisions,<br />
                              pas seulement le résultat.
                            </p>
                            <p className="mb-3 text-lg font-bold text-[#F2F4F8]">
                              Un amateur espère.<br />
                              Un trader discipliné mesure.
                            </p>
                            <div className="space-y-1 mt-1">
                              <p>Ce que tu répètes.</p>
                              <p>Ce que tu dois corriger.</p>
                              <p>Ce qui te fait réellement progresser</p>
                            </div>
                          </div>
                  </div>

                        {/* Right: Feature Grid - 2 columns, 3 rows - PWA: plus carré (max-width + 2 cols) */}
                        <div className={`grid gap-5 ${isPWA ? 'grid-cols-2 max-w-[200px] mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
                          {/* Performance chiffrée */}
                          <div 
                            className={`bg-[#141821] border border-[#222836] rounded-[16px] p-5 hover:border-[#2E6BFF]/40 hover:shadow-[0_8px_24px_rgba(46,107,255,0.15)] transition-all duration-200 relative overflow-hidden ${isPWA ? 'w-full aspect-square min-h-0 flex flex-col justify-center' : ''}`}
                            style={{ animation: 'fadeIn 0.6s ease-out' }}
                          >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#2E6BFF] to-transparent"></div>
                            <div className="w-10 h-10 rounded-[12px] bg-[rgba(46,107,255,0.15)] flex items-center justify-center mb-4">
                              <svg className="w-5 h-5 text-[#2E6BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                  </div>
                            <h4 className="text-[#F2F4F8] text-lg font-semibold mb-2" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>Performance chiffrée</h4>
                            <p className="text-[#AAB3C2] text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>Métriques précises de tes résultats</p>
              </div>

                          {/* Discipline par session */}
                          <div 
                            className={`bg-[#141821] border border-[#222836] rounded-[16px] p-5 hover:border-[#2E6BFF]/40 hover:shadow-[0_8px_24px_rgba(46,107,255,0.15)] transition-all duration-200 relative overflow-hidden ${isPWA ? 'w-full aspect-square min-h-0 flex flex-col justify-center' : ''}`}
                            style={{ animation: 'fadeIn 0.7s ease-out' }}
                          >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#2E6BFF] to-transparent"></div>
                            <div className="w-10 h-10 rounded-[12px] bg-[rgba(46,107,255,0.15)] flex items-center justify-center mb-4">
                              <svg className="w-5 h-5 text-[#2E6BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h4 className="text-[#F2F4F8] text-lg font-semibold mb-2" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>Discipline par session</h4>
                            <p className="text-[#AAB3C2] text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>Mesure ta rigueur réelle, pas ton ressenti.</p>
                  </div>
                  
                          {/* Erreurs comportementales */}
                          <div 
                            className={`bg-[#141821] border border-[#222836] rounded-[16px] p-5 hover:border-[#2E6BFF]/40 hover:shadow-[0_8px_24px_rgba(46,107,255,0.15)] transition-all duration-200 relative overflow-hidden ${isPWA ? 'w-full aspect-square min-h-0 flex flex-col justify-center' : ''}`}
                            style={{ animation: 'fadeIn 0.8s ease-out' }}
                          >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#2E6BFF] to-transparent"></div>
                            <div className="w-10 h-10 rounded-[12px] bg-[rgba(46,107,255,0.15)] flex items-center justify-center mb-4">
                              <svg className="w-5 h-5 text-[#2E6BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                    </div>
                            <h4 className="text-[#F2F4F8] text-lg font-semibold mb-2" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>Erreurs comportementales</h4>
                            <p className="text-[#AAB3C2] text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>Détecte les schémas qui sabotent ta performance.</p>
                  </div>

                          {/* Drawdown maximum */}
                          <div 
                            className={`bg-[#141821] border border-[#222836] rounded-[16px] p-5 hover:border-[#2E6BFF]/40 hover:shadow-[0_8px_24px_rgba(46,107,255,0.15)] transition-all duration-200 relative overflow-hidden ${isPWA ? 'w-full aspect-square min-h-0 flex flex-col justify-center' : ''}`}
                            style={{ animation: 'fadeIn 0.9s ease-out' }}
                          >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#2E6BFF] to-transparent"></div>
                            <div className="w-10 h-10 rounded-[12px] bg-[rgba(46,107,255,0.15)] flex items-center justify-center mb-4">
                              <svg className="w-5 h-5 text-[#2E6BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                </div>
                            <h4 className="text-[#F2F4F8] text-lg font-semibold mb-2" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>Drawdown maîtrisé</h4>
                            <p className="text-[#AAB3C2] text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>Contrôle ton risque. Protège ton capital.</p>
                              </div>

                          {/* Win rate & profit factor */}
                          <div 
                            className={`bg-[#141821] border border-[#222836] rounded-[16px] p-5 hover:border-[#2E6BFF]/40 hover:shadow-[0_8px_24px_rgba(46,107,255,0.15)] transition-all duration-200 relative overflow-hidden ${isPWA ? 'w-full aspect-square min-h-0 flex flex-col justify-center' : ''}`}
                            style={{ animation: 'fadeIn 1s ease-out' }}
                          >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#2E6BFF] to-transparent"></div>
                            <div className="w-10 h-10 rounded-[12px] bg-[rgba(46,107,255,0.15)] flex items-center justify-center mb-4">
                              <svg className="w-5 h-5 text-[#2E6BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h4 className="text-[#F2F4F8] text-lg font-semibold mb-2" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>Performance mesurée</h4>
                            <p className="text-[#AAB3C2] text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>Win rate, profit factor, rentabilité réelle.</p>
                      </div>

                          {/* Qualité d'exécution */}
                          <div
                            className={`bg-[#141821] border border-[#222836] rounded-[16px] p-5 hover:border-[#2E6BFF]/40 hover:shadow-[0_8px_24px_rgba(46,107,255,0.15)] transition-all duration-200 relative overflow-hidden ${isPWA ? 'w-full aspect-square min-h-0 flex flex-col justify-center' : ''}`}
                            style={{ animation: 'fadeIn 1.1s ease-out' }}
                          >
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#2E6BFF] to-transparent"></div>
                            <div className="w-10 h-10 rounded-[12px] bg-[rgba(46,107,255,0.15)] flex items-center justify-center mb-4">
                              <svg className="w-5 h-5 text-[#2E6BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                            <h4 className="text-[#F2F4F8] text-lg font-semibold mb-2" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>Qualité d'exécution</h4>
                            <p className="text-[#AAB3C2] text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>Précision de tes entrées et sorties</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                  {/* Image journal2 */}
                  <div className="max-w-6xl mx-auto rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl p-0">
                    <img 
                      src="/journal2.webp" 
                      alt="Journal TPLN"
                      className="w-full rounded-lg"
                      loading="lazy"
                    />
                  </div>
                  <div className="max-w-6xl mx-auto mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => handleScrollToSection('pricing')}
                      className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white px-6 py-3 rounded-[14px] font-medium text-base transition-all duration-200"
                    >
                      Accéder au journal
                    </button>
                  </div>
                              </div>
                            </div>

              {/* Section 3 - La méthode TPLN */}
              <div id="section-live" className="mt-16 sm:mt-20">
                <div className="relative">
                  <div className="absolute -top-16 -left-16 text-9xl font-bold text-[#2E6BFF]/20 select-none" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                    3
                          </div>
                  
                  {/* Titre principal */}
                  <div className="text-center mb-8">
                    <h2 className="font-bold mb-8 text-center leading-tight bg-clip-text text-transparent" style={{ fontSize: isPWA ? 'clamp(1.75rem, 10vw, 4rem)' : 'clamp(1.25rem, 6vw, 3.25rem)', backgroundImage: 'linear-gradient(to right, #2E6BFF 0%, #6B9AFF 35%, #E8EDF5 70%, #FFFFFF 100%)' }}>
                      La méthode TPLN
                    </h2>
                        </div>

                  {/* Texte à gauche, cadre à droite */}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-10 max-w-6xl mx-auto mb-8">
                    <div className={`max-w-[480px] lg:flex-shrink-0 ${isPWAOrMobile ? 'text-center mx-auto' : 'text-left'}`}>
                      {isPWAOrMobile ? (
                        <p className="text-[#AAB3C2] text-lg leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Une lecture structurée du marché. Cohérente à chaque échelle. Exécutée avec précision.
                        </p>
                      ) : (
                        <>
                        <p className="text-white font-bold leading-tight mb-6" style={{ fontFamily: 'Inter, sans-serif', fontSize: isPWA ? 'clamp(1.75rem, 10vw, 4rem)' : 'clamp(1.25rem, 6vw, 3.25rem)' }}>
                          Un modèle clair. Reproductible. Maîtrisé.
                        </p>
                        <div className="text-[#AAB3C2] text-base leading-[1.6]" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <p className="mb-2">TPLN repose sur un cadre simple à comprendre, mais précis dans son exécution.</p>
                          <p className="mb-4">Pas d'indicateurs inutiles.<br />Pas de complexité artificielle.</p>
                          <p className="mb-4">Un modèle structuré que tu peux appliquer avec constance.</p>
                          <p className="mb-1">Tu comprends la logique.</p>
                          <p className="mb-1">Tu sais quoi valider.</p>
                          <p className="mb-0">Tu sais quand exécuter.</p>
                        </div>
                        </>
                      )}
                    </div>
                    <div className="lg:flex-1 lg:min-w-0 flex flex-col items-center gap-6">
                      <img src="/trademethode.webp" alt="Méthode TPLN" className="w-full max-w-lg rounded-[16px] object-cover" />
                  {/* Cadre formation - Inclus dans l'abonnement */}
                  <div className="mb-0 w-full max-w-lg">
                    <div className="bg-[#141821] border border-[#222836] rounded-[16px] p-8 hover:border-[#2E6BFF]/50 hover:shadow-[0_12px_32px_rgba(46,107,255,0.2)] transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#2E6BFF] to-transparent"></div>
                      
                      <h3 className="text-[#F2F4F8] text-xl font-semibold mb-6 text-left" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>
                        Inclus dans l'abonnement :
                      </h3>
                      
                      <ul className="space-y-3.5">
                        {isPWAOrMobile ? (
                          <>
                            <li className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                              <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Le modèle TPLN complet</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                              <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Une checklist d'exécution structurée</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                              <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Une gestion du risque disciplinée</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                              <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Un journal professionnel de performance</span>
                            </li>
                          </>
                        ) : (
                          <>
                            <li className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                              <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Formation complète au modèle TPLN</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                              <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Checklist de validation détaillée</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                              <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Gestion du risque structurée</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                              <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Journal de performance intégré</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                              <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Analyse des erreurs et discipline</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                              <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Suivi win rate, profit factor, drawdown</span>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4 - Exécution en direct */}
              <div id="section-live-2b" className="mt-16 sm:mt-20">
                <div className="relative">
                  <div className="absolute -top-16 -left-16 text-9xl font-bold text-[#2E6BFF]/20 select-none" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                    4
                  </div>
                  <div className="text-center mb-8">
                    <h2 className="font-bold mb-6 text-center leading-tight" style={{ fontSize: isPWA ? 'clamp(1.75rem, 10vw, 4rem)' : 'clamp(1.25rem, 6vw, 3.25rem)' }}>
                      <span className="text-white">Exécution quotidienne en direct.</span>
                      <br />
                      <span className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent">
                        TPLN
                      </span>
                    </h2>
                    <p className="text-gray-400 text-lg mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Voir le modèle appliqué change tout.<br /><br />Sessions live 5 jours par semaine.<br />Opportunités détaillées en temps réel.<br />Notification immédiate via l'application.<br />Transparence totale grâce au journal des performances partagées.</p>
                  </div>
                  <div className="max-w-2xl mx-auto mb-8">
                    <div className="bg-[#141821] border border-[#222836] rounded-[16px] p-8 hover:border-[#2E6BFF]/50 hover:shadow-[0_12px_32px_rgba(46,107,255,0.2)] transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#2E6BFF] to-transparent"></div>
                      <h3 className="text-[#F2F4F8] text-xl font-semibold mb-6 text-left" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>
                        Inclus dans le plan
                      </h3>
                      <ul className="space-y-3.5">
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                          <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Sessions live 5 jours / semaine</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                          <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Opportunités validées et expliquées</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                          <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Notification instantanée via l'application</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-[#6B7280] flex-shrink-0 mt-1.5"></div>
                          <span className="text-white text-base leading-relaxed text-left" style={{ fontFamily: 'Inter, sans-serif' }}>Journal public des performances partagées</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="max-w-6xl mx-auto mb-4 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl p-0">
                    <video className="w-full rounded-lg" autoPlay loop muted playsInline preload="auto" controls={false}>
                      <source src="/TPLN2.mp4" type="video/mp4" />
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  </div>
                  <div className="max-w-2xl mx-auto mb-6 text-center">
                    <button
                      type="button"
                      onClick={() => handleScrollToSection('pricing')}
                      className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white px-6 py-3 rounded-[14px] font-medium text-base transition-all duration-200"
                    >
                      Accéder aux sessions live
                    </button>
                  </div>
              </div>
              </div>

              {/* Section 5 - App */}
              <div id="section-app" className="mt-16 sm:mt-20">
                <div className="relative">
                  <div className="absolute -top-16 -left-16 text-9xl font-bold text-[#2E6BFF]/20 select-none" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                    5
                  </div>
                  
                  {/* Titre principal */}
                  <div className="text-center mb-8 sm:mb-2">
                    <h2 className="font-bold mb-3 text-center leading-tight" style={{ fontSize: isPWA ? 'clamp(1.75rem, 10vw, 4rem)' : 'clamp(1.25rem, 6vw, 3.25rem)' }}>
                      <span className="text-white">Application mobile</span>
                      <br />
                      <span className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent">
                        TPLN
                      </span>
                    </h2>
                    <p className="text-gray-400 text-lg mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>L'application TPLN centralise tout.<br />Exécution, live, journal, historique.<br />Un seul environnement.<br />Sans dispersion.</p>
                  </div>

                  {/* Liste des fonctionnalités */}
                  <div className="max-w-6xl mx-auto mb-8 mt-8 sm:mt-12">
                    <div className={`flex flex-col gap-8 ${isPWA ? 'items-start' : 'items-center'}`}>
                      {/* iPhone centré */}
                      <div className="w-full flex justify-center">
                        <div className="w-full sm:max-w-lg lg:max-w-xl xl:max-w-2xl relative">
                      {/* Cadre iPhone avec photo */}
                      <div className="relative">
                        {/* Photo du cadre iPhone */}
                        <img 
                          src="/FOndiphone.png" 
                          alt="Application TPLN sur iPhone - Fondamentaux"
                          width={1024}
                          height={1024}
                          loading="lazy"
                              className={`w-full h-auto ${isPWA ? 'scale-[3]' : 'scale-95 sm:scale-110 lg:scale-125'}`}
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
                              className={`absolute left-1/2 transform -translate-x-1/2 w-[56%] aspect-[9/16] rounded-[3.25rem] rounded-t-[3.75rem] sm:rounded-[5.25rem] sm:rounded-t-[6rem] scale-100 sm:scale-100 ${isPWA && !user ? 'top-1.5' : '-top-1'} sm:-top-1`}
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

                  {/* Ligne de séparation */}
                  <div className="max-w-6xl mx-auto border-t border-[#222836]"></div>
                </div>
              </div>
            </div>

            {/* À propos - Mobile Optimized */}
            <div id="about-thethetrader" className="max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6 flex justify-center">
              <div className="w-full max-w-2xl bg-gray-800/50 p-4 sm:p-5 rounded-xl border border-gray-600/50 backdrop-blur-sm">
                <h2 className="text-2xl sm:text-3xl font-bold text-white text-left mb-4">
                  À propos de TheTheTrader
                </h2>
                <div className="text-gray-300 text-sm sm:text-base leading-snug space-y-1.5 text-left mb-4">
                  <p>Trader depuis 3 ans. Des milliers d'heures d'écran.</p>
                  <p>
                    J'ai testé les indicateurs. Les stratégies miracles. Les systèmes compliqués.
                  </p>
                  <p>Rien ne fonctionne durablement sans structure.</p>
                  <p>
                    TPLN n'est pas né d'une promesse. Il est né d'un constat : la constance vient du cadre.
                  </p>
                  <p>Aujourd'hui je partage :</p>
                  <ul className="list-none space-y-0.5 pl-0 text-sm">
                    <li>• Une méthode claire</li>
                    <li>• Une exécution expliquée</li>
                    <li>• Un environnement structuré</li>
                    <li>• Un suivi réel de performance</li>
                  </ul>
                  <p>
                    Pas de marketing agressif. Pas de promesses irréalistes. Uniquement du travail structuré.
                    </p>
                  </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <a 
                      href="https://x.com/thethetrader" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="X @thethetrader"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#222836] hover:bg-[#2A2F3F] text-[#AAB3C2] hover:text-white transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </a>
                    <a 
                      href="https://www.instagram.com/tradingpourlesnuls_/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Instagram @tradingpourlesnuls_"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#222836] hover:bg-[#2A2F3F] text-[#AAB3C2] hover:text-white transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                    <a 
                      href="https://www.tiktok.com/@tradingpourlesnuls_?_t=ZN-90uWKmkvqoI&_r=1" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="TikTok @tradingpourlesnuls_"
                      className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#222836] hover:bg-[#2A2F3F] text-[#AAB3C2] hover:text-white transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                    </a>
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
                    <div className="bg-[rgba(46,107,255,0.12)] rounded-[12px] p-3 border border-[#222836]">
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
                                    alt="Graphique TradingView - Exemple de signal"
                                    loading="lazy" 
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
                                    alt="Graphique TradingView - Exemple de signal"
                                    loading="lazy" 
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
                                    alt="Graphique TradingView - Exemple de signal"
                                    loading="lazy" 
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
                                    alt="Graphique TradingView - Exemple de signal"
                                    loading="lazy" 
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
                                    alt="Graphique TradingView - Exemple de signal"
                                    loading="lazy" 
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
                                    alt="Graphique TradingView - Exemple de signal"
                                    loading="lazy" 
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
                                <span className="bg-[#2E6BFF] text-white px-2 py-1 rounded-[12px] text-xs font-bold" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>COURS</span>
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
                          <Suspense fallback={<div />}><UserChat channelId="chatzone" /></Suspense>
                        )}

                        {/* Vue Profit Loss */}
                        {mobileActiveChannel === 'profit-loss' && (
                          <Suspense fallback={<div />}><ProfitLoss channelId="profit-loss" currentUserId="user" /></Suspense>
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

                              <img src="/signal.png" alt="Exemple de signal trading TPLN" className="w-full h-72 object-contain rounded mb-3" loading="lazy" />
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

                              <img src="/signal.png" alt="Exemple de signal trading TPLN" className="w-full h-72 object-contain rounded mb-3" loading="lazy" />
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

                              <img src="/signal.png" alt="Exemple de signal trading TPLN" className="w-full h-72 object-contain rounded mb-3" loading="lazy" />
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

                              <img src="/signal.png" alt="Exemple de signal trading TPLN" className="w-full h-72 object-contain rounded mb-3" loading="lazy" />
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

                              <img src="/signal.png" alt="Exemple de signal trading TPLN" className="w-full h-72 object-contain rounded mb-3" loading="lazy" />
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

                              <img src="/signal.png" alt="Exemple de signal trading TPLN" className="w-full h-72 object-contain rounded mb-3" loading="lazy" />
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

                              <img src="/signal.png" alt="Exemple de signal trading TPLN" className="w-full h-72 object-contain rounded mb-3" loading="lazy" />
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

                              <img src="/signal.png" alt="Exemple de signal trading TPLN" className="w-full h-72 object-contain rounded mb-3" loading="lazy" />
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

                              <img src="/signal.png" alt="Exemple de signal trading TPLN" className="w-full h-72 object-contain rounded mb-3" loading="lazy" />
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

                              <img src="/signal.png" alt="Exemple de signal trading TPLN" className="w-full h-72 object-contain rounded mb-3" loading="lazy" />
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

                              <img src="/signal.png" alt="Exemple de signal trading TPLN" className="w-full h-72 object-contain rounded mb-3" loading="lazy" />
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

                              <img src="/signal.png" alt="Exemple de signal trading TPLN" className="w-full h-72 object-contain rounded mb-3" loading="lazy" />
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
                            <div className="text-center mb-8 p-8 bg-[#2E6BFF] rounded-[16px] text-white">
                              <div className="flex justify-center mb-4">
                  <img 
                    src="/logo-removebg-preview.png" 
                    alt="Trading pour les nuls" 
                    width={126}
                    height={84}
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
                                    <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>🧱 ORDER BLOCK (OB)</h3>
                                    <p className="mb-2">Un Order Block représente la dernière bougie haussière (ou baissière) avant un mouvement impulsif majeur dans la direction opposée.</p>
                                    <div className="text-sm text-blue-300">
                                      → Ces zones deviennent des repères de liquidité<br/>
                                      → Souvent retestées par le prix<br/>
                                      → Offrent des points d'entrée à fort potentiel
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gray-700 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>⚡📉📈 FVG – Fair Value Gap</h3>
                                    <p className="mb-2">Un FVG est une zone de déséquilibre créée lors d'un mouvement rapide et violent du marché 🚀.</p>
                                    <div className="text-sm text-blue-300">
                                      → Le prix revient fréquemment combler ces gaps<br/>
                                      → Zones intéressantes pour entrer ou sortir d'une position
                                    </div>
                                  </div>
                                  
                                  <div className="bg-gray-700 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>🦄 Unicorn</h3>
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
                                <div className="w-8 h-8 bg-[#2E6BFF] rounded-full flex items-center justify-center text-sm text-white" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>S</div>
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
                            <Suspense fallback={<div />}><PreviewCalendar /></Suspense>

                            
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
                                  {isPWAOrMobile ? 'trade' : 'Ajouter un Trade'}
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
                className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white px-10 sm:px-12 py-5 sm:py-6 rounded-[14px] text-xl sm:text-2xl font-medium transition-all duration-200"
              >
                Commencer Maintenant
              </button>
            </div>

            {/* Section Ce qu'ils en pensent - Vidéos UGC côte à côte */}
            <div className="max-w-7xl mx-auto mb-10 px-4 sm:px-6">
              <h2 className="text-4xl sm:text-5xl font-bold text-white text-center mb-6 sm:mb-8">
                Ce qu'ils en pensent
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch max-w-4xl mx-auto">
                <div className="relative flex-1 min-w-0 rounded-xl overflow-visible" style={{ padding: '4px' }}>
                  {/* Faisceau lumineux qui tourne autour */}
                  <div className="absolute -inset-[4px] rounded-xl" style={{
                    background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 340deg, rgba(255,255,255,1) 350deg, rgba(255,255,255,1) 360deg)',
                    animation: 'videoLightRotate 3s linear infinite',
                    zIndex: 0,
                    pointerEvents: 'none',
                    filter: 'blur(2px)'
                  }}></div>
                  <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gray-900 z-10" style={{
                    boxShadow: '0 0 20px rgba(255,255,255,0.3), inset 0 0 20px rgba(255,255,255,0.1)'
                  }}>
                    <video
                      ref={ugc1VideoRef}
                      className="w-full aspect-video object-cover"
                      src={isMobileUgc && !ugc1Fallback ? '/ugc1-mobile.mp4' : '/UGC%20HD.MOV'}
                      autoPlay
                      playsInline
                      loop
                      muted={!ugcSoundOn}
                      preload="auto"
                      onLoadedData={(e) => { e.currentTarget.play().catch(() => {}); }}
                      onError={() => { if (isMobileUgc) setUgc1Fallback(true); }}
                    />
                    <button
                      type="button"
                      onClick={() => setUgcSoundOn((on) => !on)}
                      className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors z-20"
                      title={ugcSoundOn ? 'Couper le son' : 'Activer le son'}
                      aria-label={ugcSoundOn ? 'Couper le son' : 'Activer le son'}
                    >
                      {ugcSoundOn ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="relative flex-1 min-w-0 rounded-xl overflow-visible" style={{ padding: '4px' }}>
                  {/* Faisceau lumineux qui tourne autour */}
                  <div className="absolute -inset-[4px] rounded-xl" style={{
                    background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 340deg, rgba(255,255,255,1) 350deg, rgba(255,255,255,1) 360deg)',
                    animation: 'videoLightRotate 3s linear infinite',
                    zIndex: 0,
                    pointerEvents: 'none',
                    filter: 'blur(2px)'
                  }}></div>
                  <div className="relative rounded-xl overflow-hidden shadow-2xl bg-gray-900 z-10" style={{
                    boxShadow: '0 0 20px rgba(255,255,255,0.3), inset 0 0 20px rgba(255,255,255,0.1)'
                  }}>
                    <video
                      ref={ugc2VideoRef}
                      className="w-full aspect-video object-cover"
                      src={isMobileUgc && !ugc2Fallback ? '/ugc2-mobile.mp4' : '/UGC%202%20HD.MOV'}
                      autoPlay
                      playsInline
                      loop
                      muted={!ugc2SoundOn}
                      preload="auto"
                      onLoadedData={(e) => { e.currentTarget.play().catch(() => {}); }}
                      onError={() => { if (isMobileUgc) setUgc2Fallback(true); }}
                    />
                    <button
                      type="button"
                      onClick={() => setUgc2SoundOn((on) => !on)}
                      className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors z-20"
                      title={ugc2SoundOn ? 'Couper le son' : 'Activer le son'}
                      aria-label={ugc2SoundOn ? 'Couper le son' : 'Activer le son'}
                    >
                      {ugc2SoundOn ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Plans de prix - Mobile Optimized */}
            <div id="pricing" className="max-w-7xl mx-auto mb-6 sm:mb-10 px-4 sm:px-6">
              <h2 className="text-5xl md:text-7xl font-bold text-center mb-8 sm:mb-12 bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                Les services de TPLN
              </h2>

              {/* Pour traders disciplinés - au-dessus des prix */}
              <div className="max-w-2xl mx-auto mb-10">
                <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                  <span className="text-white">Pour traders</span>
                  <br />
                  <span className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent">disciplinés.</span>
                </h3>
                <p className="text-white text-base sm:text-lg mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
                  TPLN s'adresse aux traders qui privilégient :
                </p>
                <div className="space-y-2 mb-6 pl-0 sm:pl-4">
                  <p className="text-white text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>La précision</p>
                  <p className="text-white text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>La structure</p>
                  <p className="text-white text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>La constance</p>
                  <p className="text-white text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>La responsabilité</p>
                </div>
                <p className="text-white text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Il ne s'adresse pas à ceux qui recherchent des promesses rapides.
                </p>
              </div>

              {/* Encadré 100 premiers - couleurs site (violet/bleu/rose) */}
              <div className="max-w-2xl mx-auto mb-6 sm:mb-8 rounded-[16px] border border-[#222836] bg-[#141821] px-5 py-3.5 text-center">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                  <span className="text-[#F2F4F8] font-semibold text-base sm:text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>Offre réservée aux</span>
                  <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-0.5 rounded-[12px] bg-[#2E6BFF] text-white font-bold text-lg" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>100</span>
                  <span className="text-[#F2F4F8] font-semibold text-base sm:text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>premiers utilisateurs</span>
                </div>
              </div>
              
              {/* Payment Type Selector */}
              <div className="flex justify-center mb-8">
                <div className="bg-gray-800 p-1 rounded-lg flex">
                  <button 
                    onClick={() => handlePaymentTypeChange('monthly')}
                    className={`px-6 py-3 rounded-[14px] font-medium transition-all duration-200 ${
                      paymentType === 'monthly' 
                        ? 'bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] text-white' 
                        : 'text-[#AAB3C2] bg-[#141821] border border-[#222836]'
                    }`}
                  >
                    Payer mensuellement
                  </button>
                  <button 
                    onClick={() => handlePaymentTypeChange('yearly')}
                    className={`px-6 py-3 rounded-[14px] font-medium transition-all duration-200 ${
                      paymentType === 'yearly' 
                        ? 'bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] text-white' 
                        : 'text-[#AAB3C2] bg-[#141821] border border-[#222836]'
                    }`}
                  >
                    Payer annuellement
                  </button>
                </div>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr_0.8fr] gap-8 md:gap-0 max-w-6xl mx-auto transition-all duration-400 ease-out ${isTransitioning ? 'opacity-0 scale-75 rotate-3 blur-md translate-y-20 transform-gpu perspective-1000' : 'opacity-100 scale-100 rotate-0 blur-0 translate-y-0 transform-gpu perspective-1000'}`} style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}>
                {/* Plan Pro - L'environnement complet TPLN */}
                <div 
                  className={`bg-[#141821] p-8 sm:p-12 rounded-[16px] md:rounded-l-[16px] md:rounded-r-none border-2 border-[#2E6BFF] relative flex flex-col justify-between transition-all duration-200 ${
                    isTransitioning 
                      ? 'border-blue-600 shadow-[0_0_40px_rgba(59,130,246,0.5)] scale-105' 
                      : 'hover:border-[#2558D6] hover:bg-[#171C26]'
                  }`}
                >
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#2E6BFF] text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                    ⭐ RECOMMANDÉ
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent uppercase" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>L'environnement complet TPLN</h3>
                    <p className="text-gray-400 text-sm mb-3 italic">👉 Méthode + Exécution + Transparence totale</p>
                    <div className={`text-4xl font-bold text-white mb-6 transition-all duration-500 ${isTransitioning ? 'scale-110' : 'scale-100'}`}>
                      <span className="text-2xl align-top text-gray-300">€</span>
                      {paymentType === 'monthly' ? '79' : '57,5'}
                      <span className="text-lg text-gray-400 font-normal"> / mois</span>
                      {paymentType === 'yearly' && (
                        <div className="text-gray-300 text-sm font-normal mt-2">
                          Facturé 690€ / an
                        </div>
                      )}
                      </div>
                                          <ul className="text-gray-300 text-base space-y-4 mb-8 text-left">
                        <li className="flex items-center gap-2">
                          <span className="text-green-400 font-bold text-lg">✓</span>
                          <span className="font-semibold text-white">Accès intégral à la méthode TPLN</span>
                        </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400 font-bold text-lg">✓</span>
                        <span className="font-semibold text-white">Exécution live 5j / semaine</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400 font-bold text-lg">✓</span>
                        <span className="font-semibold text-white">Opportunités validées et expliquées en direct</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400 font-bold text-lg">✓</span>
                        <span className="font-semibold text-white">Notification immédiate via l'app</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400 font-bold text-lg">✓</span>
                        <span className="font-semibold text-white">Journal professionnel multi-comptes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400 font-bold text-lg">✓</span>
                        <span className="font-semibold text-white">Accès direct au fondateur</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        console.log('🖱️ Clic sur bouton Premium (mobile)');
                        await redirectToCheckout('premium', paymentType);
                      } catch (error: any) {
                        console.error('Erreur Stripe:', error);
                        alert(`Erreur: ${error?.message || 'Erreur lors de l\'ouverture du paiement'}`);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white py-4 px-6 rounded-[14px] font-medium text-lg transition-all duration-200"
                  >
                    Rejoindre l'environnement TPLN
                  </button>
                  
                </div>

                {/* Plan Starter - Méthode */}
                <div className={`bg-[#141821] px-8 py-6 sm:px-12 sm:py-8 rounded-[16px] md:rounded-none border border-[#222836] flex flex-col transition-all duration-200 ${
                  isTransitioning 
                    ? 'border-[#2E6BFF] scale-105' 
                    : 'hover:border-[#2A2F3F] hover:bg-[#171C26]'
                }`}>
                  <div className="text-center">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#2E6BFF] text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg md:hidden" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                      {paymentType === 'yearly' ? '💎 ÉCONOMISE 50€' : ''}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">MÉTHODE TPLN</h3>
                    <p className="text-gray-400 text-sm mb-3 italic">👉 Apprends en solo</p>
                    <div className={`text-4xl font-bold text-white mb-6 transition-all duration-500 ${isTransitioning ? 'scale-110' : 'scale-100'}`}>
                      <span className="text-2xl align-top text-gray-300">€</span>
                      {paymentType === 'monthly' ? '49' : '44'}
                      <span className="text-lg text-gray-400 font-normal"> / mois</span>
                      {paymentType === 'yearly' && (
                        <div className="text-gray-300 text-sm font-normal mt-2">
                          Facturé 528€ / an
                        </div>
                      )}
                      </div>
                                          <ul className="text-gray-300 text-base space-y-4 mb-8 text-left">
                        <li className="flex items-center gap-2">
                          <span className="text-green-400 font-bold text-lg">✓</span>
                          <span className="font-semibold text-white">Formation TPLN complète</span>
                        </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400 font-bold text-lg">✓</span>
                        <span className="font-semibold text-white">Journal (1 compte inclus)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400 font-bold text-lg">✓</span>
                        <span className="font-semibold text-white">Structure + gestion du risque</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400 font-bold text-lg">✓</span>
                        <span className="font-semibold text-white">Exécution disciplinée</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400 font-bold text-lg">✗</span>
                        <span className="font-semibold text-white">Pas de live</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400 font-bold text-lg">✗</span>
                        <span className="font-semibold text-white">Pas d'opportunités en temps réel</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        console.log('🖱️ Clic sur bouton Basic (mobile)');
                        await redirectToCheckout('basic', paymentType);
                      } catch (error: any) {
                        console.error('Erreur Stripe:', error);
                        alert(`Erreur: ${error?.message || 'Erreur lors de l\'ouverture du paiement'}`);
                      }
                    }}
                    className={`w-full border border-[#222836] bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white py-4 px-6 rounded-[14px] font-medium text-lg transition-all duration-200 ${
                      isTransitioning 
                        ? 'scale-105' 
                        : ''
                    }`}
                  >
                    Je m'abonne
                  </button>
                  
                </div>

                {/* Plan Journal Pro */}
                <div className={`bg-[#141821] px-8 py-6 sm:px-12 sm:py-8 rounded-[16px] md:rounded-r-[16px] md:rounded-l-none border border-[#222836] flex flex-col transition-all duration-200 ${
                  isTransitioning 
                    ? 'border-[#2E6BFF] scale-105' 
                    : 'hover:border-[#2A2F3F] hover:bg-[#171C26]'
                }`} style={{ boxShadow: '0 6px 18px rgba(0,0,0,0.25)' }}>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-3">JOURNAL PRO</h3>
                    <div className={`text-4xl font-bold text-white mb-6 transition-all duration-500 ${isTransitioning ? 'scale-110' : 'scale-100'}`}>
                      <span className="text-2xl align-top text-gray-300">€</span>
                      {paymentType === 'monthly' ? '29' : '26'}
                      <span className="text-lg text-gray-400 font-normal"> / mois</span>
                      {paymentType === 'yearly' && (
                        <div className="text-gray-300 text-sm font-normal mt-2">
                          Facturé 312€ / an
                        </div>
                      )}
                      </div>
                    <ul className="text-gray-300 text-base space-y-4 mb-8 text-left">
                      <li className="flex items-center gap-2">
                        <span className="text-green-400 font-bold text-lg">✓</span>
                        <span className="font-semibold text-white">Journal professionnel multi-comptes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400 font-bold text-lg">✓</span>
                        <span className="font-semibold text-white">Comptes illimités</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400 font-bold text-lg">✓</span>
                        <span className="font-semibold text-white">Analyse avancée</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400 font-bold text-lg">✓</span>
                        <span className="font-semibold text-white">Comparaison de comptes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400 font-bold text-lg">✗</span>
                        <span className="font-semibold text-white">Méthode TPLN</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400 font-bold text-lg">✗</span>
                        <span className="font-semibold text-white">Exécutions partagées</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-red-400 font-bold text-lg">✗</span>
                        <span className="font-semibold text-white">Live</span>
                      </li>
                    </ul>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        console.log('🖱️ Clic sur bouton Journal Pro (mobile)');
                        await redirectToCheckout('journal', paymentType);
                      } catch (error: any) {
                        console.error('Erreur:', error);
                        alert(`Erreur: ${error?.message || 'Erreur lors de l\'ouverture du paiement'}`);
                      }
                    }}
                    className={`w-full border border-[#222836] bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white py-4 px-6 rounded-[14px] font-medium text-lg transition-all duration-200 ${
                      isTransitioning 
                        ? 'scale-105' 
                        : ''
                    }`}
                  >
                    Accéder au Journal Pro
                  </button>
                  
                </div>
              </div>
            </div>

              <h2 className="font-bold text-center mb-8 sm:mb-12 mt-16 sm:mt-20 bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] bg-clip-text text-transparent" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700 }}>
                <span className="text-3xl md:text-5xl">Accompagnement</span>{' '}
                <span className="text-5xl md:text-7xl">1:1</span>
              </h2>

              <div className="max-w-2xl mx-auto mb-12 px-4 sm:px-6">
                <div className="bg-[#141821] border border-[#222836] rounded-[40px] p-8 hover:border-[#2E6BFF]/50 hover:shadow-[0_12px_32px_rgba(46,107,255,0.2)] transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#2E6BFF] to-transparent"></div>
                  <p className="text-[#AAB3C2] text-lg leading-relaxed mb-6 text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Pour les traders qui veulent structurer et optimiser leur exécution.
                  </p>
                  <ul className="text-white text-base space-y-3 text-left max-w-md list-disc list-inside" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <li>Audit complet de ton journal</li>
                    <li>Analyse de ta prise de décision</li>
                    <li>Identification des biais récurrents</li>
                    <li>Plan d'optimisation personnalisé</li>
                  </ul>
                </div>
                <div className="text-center mt-8">
                <div className="border-t border-[#222836] my-6 max-w-xs mx-auto" aria-hidden="true"></div>
                <p className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>250€ / session (1h)</p>
                <p className="text-[#AAB3C2] text-sm mb-4">Places limitées.</p>
                <p className="text-[#AAB3C2] text-sm mb-6">Accès sur demande.</p>
                <a
                  href="mailto:contact@thethetrader.com?subject=Réserver%20une%20session%201:1"
                  className="inline-block bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white px-6 py-3 rounded-[14px] font-medium text-base transition-all duration-200"
                >
                  Réserver une session
                </a>
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
                                        <button className="bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white px-6 py-3 rounded-[14px] font-medium transition-all duration-200" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600 }}>
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
            <footer className="bg-[#0F1115] py-12 sm:py-20 px-4 sm:px-6 mt-0">
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
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.自己喜欢H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        @thethetrader
                      </a>
                      <a 
                        href="https://www.instagram.com/_tradingpourlesnuls/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        @tradingpourlesnuls_
                      </a>
                      <a 
                        href="https://www.tiktok.com/@tradingpourlesnuls_?_t=ZN-90uWKmkvqoI&_r=1" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        @tradingpourlesnuls_
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
                <div className="border-t border-[#222836] mt-16 pt-8">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <img 
                        src="/logo-removebg-preview.png" 
                        alt="Trading pour les nuls" 
                        width={320}
                        height={213}
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
                onClick={handleForgotPassword}
                className="text-sm text-blue-600 hover:text-blue-800 text-left w-full"
              >
                Mot de passe oublié ?
              </button>
              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white py-3 rounded-[14px] font-medium transition-all duration-200"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de création/réinitialisation de mot de passe */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Créer votre mot de passe</h2>
              <button 
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {setupPasswordEmail && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Email:</strong> {setupPasswordEmail}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-gray-700 mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="••••••••"
                />
              </div>
              <button
                onClick={handleResetPassword}
                className="w-full bg-gradient-to-r from-[#2E6BFF] to-[#F2F4F8] hover:from-[#2558D6] hover:to-[#E5E9F0] text-white py-3 rounded-[14px] font-medium transition-all duration-200"
              >
                Définir le mot de passe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;// Force rebuild Fri Aug  8 01:13:24 CEST 2025