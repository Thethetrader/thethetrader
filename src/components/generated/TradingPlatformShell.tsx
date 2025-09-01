import React, { useState, useEffect, useRef } from 'react';
import { getMessages, getSignals, subscribeToMessages, addMessage, uploadImage, addSignal, subscribeToSignals, updateMessageReactions, getMessageReactions, subscribeToMessageReactions, Signal } from '../../utils/firebase-setup';
import { createClient } from '@supabase/supabase-js';
import { initializeNotifications, notifyNewSignal, notifySignalClosed, areNotificationsAvailable, requestNotificationPermission, sendLocalNotification } from '../../utils/push-notifications';

import { syncProfileImage, getProfileImage, initializeProfile } from '../../utils/profile-manager';
import { useStatsSync } from '../../hooks/useStatsSync';
import { useCalendarSync } from '../../hooks/useCalendarSync';

// Configuration Supabase
const supabaseUrl = 'https://bamwcozzfshuozsfmjah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbXdjb3p6ZnNodW96c2ZtamFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDM0ODcsImV4cCI6MjA2NTY3OTQ4N30.NWSUKoYLl0oGS-dXf4jhtmLRiSuBSk-0lV3NRHJLvrs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TradingPlatformShell() {
  // Hook pour les stats en temps réel synchronisées avec l'admin
  const { stats, allSignalsForStats: realTimeSignals, getWeeklyBreakdown: getCalendarWeeklyBreakdown, getTodaySignals: getCalendarTodaySignals, getThisMonthSignals: getCalendarThisMonthSignals } = useStatsSync();
  
  // Hook pour la synchronisation du calendrier
  const { calendarStats, getMonthlyStats: getCalendarMonthlyStats, getWeeklyBreakdown: getCalendarWeeklyBreakdownFromHook } = useCalendarSync();
  
  // Charger les réactions depuis localStorage au montage du composant
  useEffect(() => {
    const savedReactions = localStorage.getItem('messageReactions');
    if (savedReactions) {
      try {
        setMessageReactions(JSON.parse(savedReactions));
      } catch (error) {
        console.error('Erreur lors du chargement des réactions:', error);
      }
    }
  }, []);
  
  // Vérifier session Supabase au chargement
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ 
          id: session.user.id, 
          email: session.user.email || '' 
        });
      }
    });

    // Écouter les changements d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ 
          id: session.user.id, 
          email: session.user.email || '' 
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  
  // État pour éviter les envois multiples
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  // État pour éviter les clics multiples sur le calendrier
  const [isCalendarClicking, setIsCalendarClicking] = useState(false);
  
  // État pour les réactions aux messages (côté utilisateur)
  const [messageReactions, setMessageReactions] = useState<{[messageId: string]: {fire: number, users: string[]}}>({});
  
  // État pour l'utilisateur connecté
  const [user, setUser] = useState<{id: string, email: string} | null>(null);
  
  const [selectedChannel, setSelectedChannel] = useState({ id: 'general-chat', name: 'general-chat' });
  const [view, setView] = useState<'signals' | 'calendar'>('signals');
  const [mobileView, setMobileView] = useState<'channels' | 'content'>('channels');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{[channelId: string]: Array<{id: string, text: string, user: string, timestamp: string, file?: File}>}>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showTradesModal, setShowTradesModal] = useState(false);
  const [showSignalsModal, setShowSignalsModal] = useState(false);
  const [selectedTradesDate, setSelectedTradesDate] = useState<Date | null>(null);
  const [selectedSignalsDate, setSelectedSignalsDate] = useState<Date | null>(null);
  const [pasteArea, setPasteArea] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showWeekSignalsModal, setShowWeekSignalsModal] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<{[channelId: string]: number}>({});
  const [lastChannelOpenTime, setLastChannelOpenTime] = useState<{[channelId: string]: number}>({});
  const [signals, setSignals] = useState<Array<{
    id: string;
    type: string;
    symbol: string;
    timeframe: string;
    entry: string;
    takeProfit: string;
    stopLoss: string;
    description: string;
    image: File | null;
    timestamp: string;
    status: 'ACTIVE' | 'WIN' | 'LOSS' | 'BE';
    channel_id: string;
    reactions?: string[];
    pnl?: string;
    closeMessage?: string;
  }>>([]);

  // Fonction pour charger les messages depuis Firebase (max 20)
  const loadMessages = async (channelId: string) => {
    try {
      const messages = await getMessages(channelId);
      // Limiter à 20 messages pour les salons de chat (plus récents en bas) et inverser l'ordre pour les autres
      const limitedMessages = ['general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss'].includes(channelId) ? messages.slice(-20) : messages.reverse();
      const formattedMessages = limitedMessages.map(msg => ({
        id: msg.id || '',
        text: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        author: msg.author,
        author_avatar: msg.author_avatar, // CONSERVER l'avatar de l'auteur !
        attachment: undefined,
        attachment_data: msg.attachment_data // CONSERVER les photos !
      }));
      
      setMessages(prev => ({
        ...prev,
        [channelId]: formattedMessages.map(msg => ({
          id: msg.id,
          text: msg.text,
          user: msg.author,
          author: msg.author, // CONSERVER le nom de l'auteur !
          author_avatar: msg.author_avatar, // CONSERVER l'avatar de l'auteur !
          timestamp: msg.timestamp,
          attachment_data: msg.attachment_data // CONSERVER les photos !
        }))
      }));
      
      console.log(`✅ Messages chargés pour ${channelId}:`, formattedMessages.length);
      
      // Scroll vers le bas après chargement des messages (sauf pour calendrier et journal perso)
      if (!['calendrier', 'trading-journal', 'forex-signaux', 'crypto-signaux', 'futures-signaux'].includes(channelId)) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
    }
  };
  
  // Charger les réactions des messages depuis Firebase et s'abonner aux changements
  useEffect(() => {
    const loadAndSubscribeToReactions = async () => {
      try {
        // Charger les réactions existantes pour tous les messages
        const allMessages = Object.values(messages).flat();
        const reactionsPromises = allMessages.map(async (message) => {
          const reactions = await getMessageReactions(message.id);
          if (reactions) {
            return { messageId: message.id, reactions };
          }
          return null;
        });
        
        const reactionsResults = await Promise.all(reactionsPromises);
        const newReactions: {[messageId: string]: {fire: number, users: string[]}} = {};
        
        reactionsResults.forEach((result) => {
          if (result) {
            newReactions[result.messageId] = result.reactions;
          }
        });
        
        setMessageReactions(newReactions);
        console.log('✅ Réactions messages chargées depuis Firebase:', Object.keys(newReactions).length);
        
        // S'abonner aux changements de réactions pour tous les messages
        const subscriptions = allMessages.map((message) => {
          return subscribeToMessageReactions(message.id, (reactions) => {
            if (reactions) {
              setMessageReactions(prev => ({
                ...prev,
                [message.id]: reactions
              }));
            }
          });
        });
        
        // Nettoyer les abonnements
        return () => {
          subscriptions.forEach(subscription => {
            if (subscription && typeof subscription === 'function') {
              subscription();
            }
          });
        };
        
      } catch (error) {
        console.error('❌ Erreur chargement réactions messages Firebase:', error);
      }
    };
    
    if (Object.keys(messages).length > 0) {
      loadAndSubscribeToReactions();
    }
  }, [messages]);

  // Fonction pour charger les signaux depuis Firebase (optimisé - max 3)
  const loadSignals = async (channelId: string) => {
    try {
      console.log('🚀 Début chargement signaux utilisateur pour:', channelId);
      const signals = await getSignals(channelId, 3); // Limite à 3 signaux
      console.log('🔍 Signaux bruts utilisateur:', signals);
      const formattedSignals = signals.map(signal => ({
        id: signal.id || '',
        type: signal.type,
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        entry: signal.entry?.toString() || 'N/A',
        takeProfit: signal.takeProfit?.toString() || 'N/A',
        stopLoss: signal.stopLoss?.toString() || 'N/A',
        description: signal.description || '',
        image: null,
        timestamp: new Date(signal.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: signal.status || 'ACTIVE' as const,
        channel_id: signal.channel_id,
        reactions: [],
        pnl: signal.pnl,
        closeMessage: signal.closeMessage
      }));
      
      setSignals(formattedSignals.reverse());
      console.log(`✅ Signaux chargés pour ${channelId}:`, formattedSignals.length);
      console.log('🔍 Signaux formatés utilisateur:', formattedSignals);
      console.log('🎯 État signals utilisateur après setSignals:', formattedSignals);
      
      // Envoyer des notifications pour les nouveaux signaux
      if (formattedSignals.length > 0) {
        // Notifier le signal le plus récent
        const latestSignal = formattedSignals[0];
        notifyNewSignal(latestSignal);
      }
      
      // Scroll automatique après chargement des signaux (sauf pour calendrier et journal perso)
      if (!['calendrier', 'trading-journal', 'forex-signaux', 'crypto-signaux', 'futures-signaux'].includes(channelId)) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      console.error('❌ Erreur chargement signaux:', error);
    }
  };

  // Initialiser l'app avec Firebase
  useEffect(() => {
    const initApp = async () => {
      await loadMessages(selectedChannel.id);
      await loadSignals(selectedChannel.id);
      
      // Initialiser les notifications push
      await initializeNotifications();
    };
    initApp();
  }, []);

  // Subscription globale pour tous les canaux
  useEffect(() => {
    const channels = ['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss'];
    
    const subscriptions = channels.map(channelId => {
      return subscribeToMessages(channelId, (newMessage) => {
        console.log(`🔄 Nouveau message reçu dans ${channelId}:`, newMessage);
        
        // Compter les nouveaux messages seulement si on n'est pas dans ce canal
        if (selectedChannel.id !== channelId) {
          console.log(`📊 Incrementing unread count for ${channelId}`);
          setUnreadMessages(prev => ({
            ...prev,
            [channelId]: (prev[channelId] || 0) + 1
          }));
        }
      });
    });

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [selectedChannel.id]);

  // Charger les données quand on change de canal
  useEffect(() => {
    console.log('🔄 Changement de canal utilisateur:', selectedChannel.id);
    loadMessages(selectedChannel.id);
    loadSignals(selectedChannel.id);
    
    // Subscription aux signaux temps réel pour les réactions et notifications
    const signalSubscription = subscribeToSignals(selectedChannel.id, (updatedSignal) => {
      console.log('🔄 Signal mis à jour reçu:', updatedSignal);
      
      // Mettre à jour les signaux avec les nouvelles réactions
      setSignals(prev => prev.map(signal => 
        signal.id === updatedSignal.id ? { ...signal, reactions: updatedSignal.reactions || [] } : signal
      ));
      
      // Envoyer une notification pour les signaux fermés (WIN/LOSS/BE)
      if (updatedSignal.status !== 'ACTIVE' && (updatedSignal as any).closeMessage) {
        notifySignalClosed(updatedSignal);
      }
    });

    // Subscription aux nouveaux signaux temps réel
    const newSignalSubscription = subscribeToSignals(selectedChannel.id, (newSignal) => {
      console.log('🆕 Nouveau signal reçu utilisateur:', newSignal);
      
      const formattedSignal = {
        id: newSignal.id || '',
        type: newSignal.type,
        symbol: newSignal.symbol,
        timeframe: newSignal.timeframe,
        entry: newSignal.entry?.toString() || 'N/A',
        takeProfit: newSignal.takeProfit?.toString() || 'N/A',
        stopLoss: newSignal.stopLoss?.toString() || 'N/A',
        description: newSignal.description || '',
        image: null,
        timestamp: new Date(newSignal.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: newSignal.status || 'ACTIVE' as const,
        channel_id: newSignal.channel_id,
        reactions: [],
        pnl: newSignal.pnl,
        closeMessage: newSignal.closeMessage
      };
      
      // Ajouter le nouveau signal à la fin (même logique que les messages)
      setSignals(prev => {
        const currentChannelSignals = prev.filter(signal => signal.channel_id === selectedChannel.id);
        const otherChannelSignals = prev.filter(signal => signal.channel_id !== selectedChannel.id);
        
        return [
          ...otherChannelSignals,
          ...currentChannelSignals,
          formattedSignal
        ];
      });
      
      // Notifier le nouveau signal
      notifyNewSignal(formattedSignal);
      
      // Scroll automatique (sauf pour calendrier et journal perso)
      if (!['calendrier', 'trading-journal', 'forex-signaux', 'crypto-signaux', 'futures-signaux'].includes(selectedChannel.id)) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    });
    
    // Subscription aux messages temps réel pour le canal actuel
    const subscription = subscribeToMessages(selectedChannel.id, (newMessage) => {
      console.log('🔄 Nouveau message reçu utilisateur:', newMessage);
      
      const formattedMessage = {
        id: newMessage.id || '',
        text: newMessage.content,
        timestamp: new Date(newMessage.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        author: newMessage.author,
        author_avatar: newMessage.author_avatar,
        attachment: newMessage.attachment_data ? {
          type: newMessage.attachment_type || 'image/jpeg',
          name: newMessage.attachment_name || 'image.jpg'
        } : undefined,
        attachment_data: newMessage.attachment_data
      };
      
      setMessages(prev => {
        const currentMessages = prev[selectedChannel.id] || [];
        const newMessage = {
          id: formattedMessage.id,
          text: formattedMessage.text,
          user: formattedMessage.author,
          author: formattedMessage.author,
          author_avatar: formattedMessage.author_avatar,
          timestamp: formattedMessage.timestamp,
          attachment_data: formattedMessage.attachment_data
        };
        
        // Pour les canaux de chat, ajouter à la fin (messages récents en bas)
        // Pour les autres canaux, ajouter au début (messages récents en haut)
        if (['general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss'].includes(selectedChannel.id)) {
          return {
            ...prev,
            [selectedChannel.id]: [...currentMessages, newMessage]
          };
        } else {
          return {
            ...prev,
            [selectedChannel.id]: [newMessage, ...currentMessages]
          };
        }
      });
      
      // Compter les nouveaux messages seulement si on n'est pas dans le canal actuel
      // (car on va voir le message immédiatement)
      // Cette logique sera gérée par la subscription globale
      
      // Scroll vers le bas pour voir le nouveau message (sauf pour calendrier et journal perso)
      if (!['calendrier', 'trading-journal', 'forex-signaux', 'crypto-signaux', 'futures-signaux'].includes(selectedChannel.id)) {
        setTimeout(() => {
          scrollToBottom();
        }, 5);
      }
    });

    return () => {
      subscription.unsubscribe();
      signalSubscription.unsubscribe();
      newSignalSubscription.unsubscribe();
    };
  }, [selectedChannel.id]);
  const [chatMessage, setChatMessage] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Initialiser le profil utilisateur au chargement
  useEffect(() => {
    const initProfile = async () => {
      console.log('🔄 Initialisation profil utilisateur...');
      console.log('📱 PWA Mode:', window.matchMedia('(display-mode: standalone)').matches);
      console.log('🌐 User Agent:', navigator.userAgent.includes('Mobile') ? 'MOBILE' : 'DESKTOP');
      
      const image = await initializeProfile('user');
      if (image) {
        setProfileImage(image);
        console.log('✅ Photo de profil utilisateur chargée');
      } else {
        console.log('❌ Aucune photo de profil utilisateur trouvée');
      }
    };
    
    initProfile();
  }, []);

  // Subscription globale pour compter les messages non lus
  useEffect(() => {
    const allChannels = ['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss', 'trading-journal'];
    
    const subscriptions = allChannels.map(channelId => {
      return subscribeToMessages(channelId, (newMessage) => {
        // Vérifier si le message est plus récent que la dernière ouverture du salon
        const lastOpenTime = lastChannelOpenTime[channelId] || 0;
        const messageTime = typeof newMessage.timestamp === 'number' ? newMessage.timestamp : Date.now();
        
        // Si le salon n'a jamais été ouvert, compter tous les messages
        // Sinon, compter seulement les messages plus récents que la dernière ouverture
        if (lastOpenTime === 0 || messageTime > lastOpenTime) {
          // Ne pas compter si on est actuellement dans ce salon
          if (selectedChannel.id !== channelId) {
            setUnreadMessages(prev => ({
              ...prev,
              [channelId]: (prev[channelId] || 0) + 1
            }));
            console.log(`📊 Unread message added to ${channelId}: ${newMessage.content}`);
          }
        }
      });
    });

    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [selectedChannel.id, lastChannelOpenTime]);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [viewerCount, setViewerCount] = useState(0);

  // États pour le journal de trading personnalisé
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    // Récupérer selectedDate depuis localStorage
    const saved = localStorage.getItem('selectedDate');
    return saved ? new Date(saved) : null;
  });
  
  // Sauvegarder selectedDate dans localStorage
  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem('selectedDate', selectedDate.toISOString());
    } else {
      localStorage.removeItem('selectedDate');
    }
  }, [selectedDate]);
  
  // Fonction pour changer de canal et réinitialiser selectedDate si nécessaire
  const handleChannelChange = (channelId: string, channelName: string) => {
    // Réinitialiser selectedDate si on quitte le Trading Journal
    if (selectedChannel.id === 'trading-journal' && channelId !== 'trading-journal') {
      setSelectedDate(null);
    }
    
    setSelectedChannel({id: channelId, name: channelName});
    setView('signals');
    
    // Enregistrer le timestamp d'ouverture du salon
    setLastChannelOpenTime(prev => ({
      ...prev,
      [channelId]: Date.now()
    }));
    
    // Réinitialiser les messages non lus pour ce canal
    setUnreadMessages(prev => ({
      ...prev,
      [channelId]: 0
    }));
    
    console.log(`📊 Channel opened: ${channelId} at ${new Date().toLocaleTimeString()}`);
    
    // Scroll intelligent : bas pour les canaux de chat, pas de scroll pour signaux/calendrier/trading journal
    setTimeout(() => {
      if (['general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss'].includes(channelId)) {
        scrollToBottom();
      } else if (!['calendrier', 'trading-journal', 'forex-signaux', 'crypto-signaux', 'futures-signaux'].includes(channelId)) {
        scrollToTop();
      }
      // Pas de scroll pour signaux, calendrier et trading journal
    }, 200);
  };
  const [personalTrades, setPersonalTrades] = useState<Array<{
    id: string;
    date: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    entry: string;
    exit: string;
    stopLoss: string;
    pnl: string;
    status: 'WIN' | 'LOSS' | 'BE';
    notes: string;
    image1: File | null;
    image2: File | null;
    timestamp: string;
  }>>(() => {
    // Charger les trades depuis localStorage
    const saved = localStorage.getItem('personalTrades');
    const existingTrades = saved ? JSON.parse(saved) : [];
    
    // Ajouter quelques trades de test pour debug
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    
    const testTrades = [
      {
        id: 'test-today',
        date: today.toISOString().split('T')[0],
        symbol: 'BTCUSD',
        type: 'BUY' as const,
        entry: '45000',
        exit: '46000',
        stopLoss: '44000',
        pnl: '1000',
        status: 'WIN' as const,
        notes: 'Trade WIN aujourd\'hui',
        image1: null,
        image2: null,
        timestamp: today.toISOString()
      },
      {
        id: 'test-yesterday',
        date: yesterday.toISOString().split('T')[0],
        symbol: 'EURUSD',
        type: 'SELL' as const,
        entry: '1.0850',
        exit: '1.0800',
        stopLoss: '1.0900',
        pnl: '500',
        status: 'WIN' as const,
        notes: 'Trade WIN hier',
        image1: null,
        image2: null,
        timestamp: yesterday.toISOString()
      },
      {
        id: 'test-lastweek',
        date: lastWeek.toISOString().split('T')[0],
        symbol: 'GBPUSD',
        type: 'BUY' as const,
        entry: '1.2500',
        exit: '1.2400',
        stopLoss: '1.2450',
        pnl: '-300',
        status: 'LOSS' as const,
        notes: 'Trade LOSS la semaine dernière',
        image1: null,
        image2: null,
        timestamp: lastWeek.toISOString()
      }
    ];
    
    // Ajouter les trades de test seulement s'ils n'existent pas déjà
    testTrades.forEach(testTrade => {
      const exists = existingTrades.some((trade: any) => trade.id === testTrade.id);
      if (!exists) {
        existingTrades.push(testTrade);
      }
    });
    
    return existingTrades;
  });

  const [tradeData, setTradeData] = useState({
    symbol: '',
    type: 'BUY' as 'BUY' | 'SELL',
    entry: '',
    exit: '',
    stopLoss: '',
    pnl: '',
    status: 'WIN' as 'WIN' | 'LOSS' | 'BE',
    notes: '',
    image1: null as File | null,
    image2: null as File | null
  });
  
  // Sauvegarder automatiquement les trades dans localStorage
  useEffect(() => {
    localStorage.setItem('personalTrades', JSON.stringify(personalTrades));
  }, [personalTrades]);

  // Debug: Afficher les trades au chargement
  useEffect(() => {
    console.log('🔥 DEBUG TRADES:', personalTrades);
    console.log('🔥 Nombre de trades:', personalTrades.length);
    console.log('🔥 Channel actuel:', selectedChannel.id);
    console.log('🔥 View actuel:', view);
  }, [personalTrades, selectedChannel.id, view]);

  // Debug: Afficher les messages non lus
  useEffect(() => {
    console.log('📊 Unread messages state:', unreadMessages);
  }, [unreadMessages]);

  const [signalData, setSignalData] = useState({
    type: 'BUY',
    symbol: '',
    timeframe: '',
    entry: '',
    takeProfit: '',
    stopLoss: '',
    description: '',
    image: null as File | null
  });
  
  // États pour le copier-coller TradingView
  const [debugMode, setDebugMode] = useState(false);
  const [pasteDebug, setPasteDebug] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isPasteActive, setIsPasteActive] = useState(false);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fonction utilitaire pour créer une note d'ajout
  const createNoteAddition = (extracted: Record<string, any>) => {
    const parts = [];
    if (extracted.symbol) parts.push(`Symbol: ${extracted.symbol}`);
    if (extracted.tradeType) parts.push(`Type: ${extracted.tradeType.toUpperCase()}`);
    if (extracted.entryPrice) parts.push(`Entry: ${extracted.entryPrice}`);
    if (extracted.exitPrice) parts.push(`Exit: ${extracted.exitPrice}`);
    if (extracted.stopLoss) parts.push(`SL: ${extracted.stopLoss}`);
    if (extracted.rr) parts.push(`R:R: ${extracted.rr}`);
    if (extracted.session) parts.push(`Session: ${extracted.session}`);
    if (extracted.tradeDuration) parts.push(`Duration: ${extracted.tradeDuration}`);
    
    return `[Auto-extracted] ${parts.join(' | ')}`;
  };

  // Fonction utilitaire pour mettre à jour les données du formulaire
  const updateFormData = (updates: Partial<typeof signalData>) => {
    setSignalData(prev => ({ ...prev, ...updates }));
  };

  // FIXED: Completely rewritten TradingView paste handler to match Google Apps Script logic
  const handleTradingViewPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedHtml = e.clipboardData.getData('text/html') || '';
    const pastedText = e.clipboardData.getData('text') || '';
    
    // Debug info
    if (debugMode) {
      setPasteDebug(`HTML: ${pastedHtml.slice(0, 300)}...\nText: ${pastedText.slice(0, 300)}...`);
    }
    
    // Store extracted data
    const extracted: Record<string, any> = {};
    let found = false;
    
    // Check if we have TradingView data
    if (pastedHtml.includes('data-tradingview-clip')) {
      try {
        // Extract the TradingView JSON data
        const regex = /data-tradingview-clip="([^"]+)"/;
        const match = pastedHtml.match(regex);
        
        if (match && match[1]) {
          // Replace HTML entities in the JSON string
          const jsonString = match[1].replace(/&(?:quot|#34);/g, '"');
          const data = JSON.parse(jsonString);
          
          if (debugMode) {
            setPasteDebug(JSON.stringify(data, null, 2));
          }
          
          // Extract source and points - similar to Google Apps Script
          const source = data.sources?.[0]?.source;
          const points = source?.points;
          const state = source?.state;
          const stopLevel = state?.stopLevel;
          const profitLevel = state?.profitLevel;
          
          if (points && points.length >= 2) {
            found = true;
            
            // Get ticker symbol and clean it
            let symbolFull = state?.symbol || "";
            let ticker = symbolFull.split(":")[1] || symbolFull;
            // Clean common futures symbols
            if (ticker.startsWith("NQ1")) ticker = "NQ";
            else if (ticker.startsWith("ES1")) ticker = "ES";
            else if (ticker.startsWith("MNQ")) ticker = "MNQ";
            
            extracted.symbol = ticker;
            
            // Determine trade type from the tool
            const type = source?.type;
            if (type === "LineToolRiskRewardLong" || /long/i.test(type)) {
              extracted.tradeType = 'buy';
              extracted.outcome = 'WIN'; // Default to WIN
            } else if (type === "LineToolRiskRewardShort" || /short/i.test(type)) {
              extracted.tradeType = 'sell';
              extracted.outcome = 'WIN'; // Default to WIN
            }
            
            // Extract price information
            const entryPrice = points[0]?.price;
            if (entryPrice !== undefined) {
              extracted.entryPrice = entryPrice.toString();
            }
            
            // For exit price, use the last point
            if (points.length > 1) {
              const exitPrice = points[points.length - 1]?.price;
              if (exitPrice !== undefined) {
                extracted.exitPrice = exitPrice.toString();
              }
            }
            
            // Calculate Risk:Reward ratio if available
            if (stopLevel !== undefined && profitLevel !== undefined) {
              const rrRatio = Math.round((profitLevel / stopLevel) * 100) / 100;
              extracted.rr = rrRatio.toString();
              
              // Calculate Stop Loss based on entry price and stopLevel
              if (entryPrice !== undefined) {
                let slPrice;
                if (extracted.tradeType === 'buy') {
                  // For Long trades
                  const stopDistance = stopLevel / 4; // Similar to Google Script
                  slPrice = entryPrice - stopDistance;
                } else {
                  // For Short trades
                  const stopDistance = stopLevel / 4;
                  slPrice = entryPrice + stopDistance;
                }
                extracted.stopLoss = slPrice.toString();
              }
            }
            
            // Extract timestamps for entry/exit if available
            if (points[0]?.time_t) {
              const entryTimestamp = points[0].time_t;
              const entryDate = new Date(entryTimestamp * 1000);
              
              // Format entry time for the form
              const entryTimeStr = entryDate.toTimeString().split(' ')[0].slice(0, 5);
              extracted.entryTime = entryTimeStr;
              
              // If we have exit timestamp
              if (points.length > 1 && points[1]?.time_t) {
                const exitTimestamp = points[1].time_t;
                const exitDate = new Date(exitTimestamp * 1000);
                const exitTimeStr = exitDate.toTimeString().split(' ')[0].slice(0, 5);
                extracted.exitTime = exitTimeStr;
                
                // Calculate trade duration
                const durationMs = (exitTimestamp - entryTimestamp) * 1000;
                const durationMin = Math.round(durationMs / 60000);
                
                if (durationMin < 60) {
                  extracted.tradeDuration = `${durationMin}m`;
                } else {
                  const hours = Math.floor(durationMin / 60);
                  const mins = durationMin % 60;
                  extracted.tradeDuration = `${hours}h ${mins}m`;
                }
              }
            }
            
            // Try to determine session based on entry time
            if (points[0]?.time_t) {
              const entryDate = new Date(points[0].time_t * 1000);
              let entryHour = entryDate.getUTCHours() - 4; // EST offset
              if (entryHour < 0) entryHour += 24;
              
              let session = "";
              if (entryHour >= 0 && entryHour < 3) session = "Asian Session";
              else if (entryHour >= 3 && entryHour < 8) session = "London";
              else if (entryHour >= 8 && entryHour < 12) session = "London/NY Overlap";
              else if (entryHour >= 12 && entryHour < 17) session = "New York PM";
              
              if (session) {
                extracted.session = session;
              }
            }
          }
        }
      } catch (err) {
        console.error("Error parsing TradingView data:", err);
        if (debugMode) {
          setPasteDebug(`Error parsing: ${err instanceof Error 
            ? err.message 
            : (typeof err === 'symbol' ? err.toString() : String(err))}`);
        }
      }
    }
    
    // Fallback to plain-text parsing if we didn't find structured data
    if (!found) {
      if (/long/i.test(pastedText)) {
        extracted.tradeType = 'buy';
        extracted.outcome = 'WIN';
        found = true;
      } else if (/short/i.test(pastedText)) {
        extracted.tradeType = 'sell';
        extracted.outcome = 'WIN';
        found = true;
      }
      
      // Try to extract symbol
      const sym = pastedText.match(/\b([A-Z]{1,6}\d*(?:USD|BTC|ETH|EUR)?)\b/);
      if (sym) {
        extracted.symbol = sym[1];
        found = true;
      }
      
      // Try to extract numbers as prices
      const nums = pastedText.match(/\b\d+(\.\d+)?\b/g) || [];
      if (nums.length >= 2) {
        extracted.entryPrice = nums[0];
        extracted.exitPrice = nums[1];
        if (nums.length >= 3) {
          extracted.rr = nums[2];
        }
        found = true;
      }
    }
    
    // Apply extracted data to the form
    if (found) {
      // First update the basic fields
      updateFormData({
        type: extracted.tradeType === 'buy' ? 'BUY' : 'SELL',
        symbol: extracted.symbol || signalData.symbol,
        entry: extracted.entryPrice || signalData.entry,
        takeProfit: extracted.exitPrice || signalData.takeProfit,
        stopLoss: extracted.stopLoss || signalData.stopLoss,
      });
      
      // Add extracted info to description
      if (Object.keys(extracted).length > 0) {
        const noteAddition = createNoteAddition(extracted);
        updateFormData({
          description: signalData.description ? `${signalData.description}\n\n${noteAddition}` : noteAddition
        });
      }
      
      setError('');
    } else {
      // If nothing parsed, just dump the raw text into description
      updateFormData({
        description: `Pasted text:\n${pastedText}\n\n${signalData.description || ''}`
      });
      setError('Could not extract structured trade data; added raw text to description.');
    }
    
    setIsPasteActive(false);
  };

  // Fonctions pour la navigation du calendrier
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const getMonthName = (date: Date) => {
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    return months[date.getMonth()];
  };

  // Fonctions pour calculer les statistiques réelles
  const parsePnL = (pnlString: string): number => {
    if (!pnlString) return 0;
    const cleanStr = pnlString.replace(/[^\d.-]/g, '');
    return parseFloat(cleanStr) || 0;
  };

  // Fonction pour récupérer TOUS les signaux depuis Firebase (indépendant du fil)
  const [allSignalsForStats, setAllSignalsForStats] = useState<Array<{
    id: string;
    type: string;
    symbol: string;
    timeframe: string;
    entry: string;
    takeProfit: string;
    stopLoss: string;
    description: string;
    image: any;
    timestamp: string;
    originalTimestamp: number;
    status: 'ACTIVE' | 'WIN' | 'LOSS' | 'BE';
    channel_id: string;
    reactions?: string[];
    pnl?: string;
    closeMessage?: string;
  }>>([]);

  // Charger TOUS les signaux pour les statistiques et le calendrier
  useEffect(() => {
    const loadAllSignalsForStats = async () => {
      try {
        console.log('📊 Chargement de TOUS les signaux pour statistiques et calendrier...');
        
        // Charger les signaux de tous les canaux individuellement
                  const channels = ['fondamentaux', 'letsgooo-model'];
        let allSignals: any[] = [];
        
        for (const channelId of channels) {
          try {
            console.log(`🔍 Chargement signaux pour ${channelId}...`);
            const channelSignals = await getSignals(channelId, 100); // 100 signaux par canal
            if (channelSignals && channelSignals.length > 0) {
              allSignals = [...allSignals, ...channelSignals];
              console.log(`✅ ${channelSignals.length} signaux chargés pour ${channelId}`);
            }
          } catch (error) {
            console.error(`❌ Erreur chargement signaux pour ${channelId}:`, error);
          }
        }
        
        if (allSignals.length > 0) {
          // Formater les signaux pour correspondre au type attendu
          const formattedSignals = allSignals.map(signal => ({
            id: signal.id || '',
            type: signal.type,
            symbol: signal.symbol,
            timeframe: signal.timeframe,
            entry: signal.entry?.toString() || 'N/A',
            takeProfit: signal.takeProfit?.toString() || 'N/A',
            stopLoss: signal.stopLoss?.toString() || 'N/A',
            description: signal.description || '',
            image: null,
            timestamp: new Date(signal.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            originalTimestamp: signal.timestamp || Date.now(),
            status: signal.status || 'ACTIVE' as const,
            channel_id: signal.channel_id,
            reactions: signal.reactions || [],
            pnl: signal.pnl,
            closeMessage: signal.closeMessage
          }));
          
          setAllSignalsForStats(formattedSignals);
          console.log(`✅ ${formattedSignals.length} signaux formatés chargés pour statistiques au total`);
          console.log('📊 Signaux par canal:', channels.map(ch => ({
            channel: ch,
            count: formattedSignals.filter(s => s.channel_id === ch).length
          })));
        } else {
          console.log('⚠️ Aucun signal trouvé pour les statistiques');
        }
      } catch (error) {
        console.error('❌ Erreur chargement signaux pour statistiques:', error);
      }
    };

    loadAllSignalsForStats();
  }, []);

  // Fonctions pour calculer les statistiques du jour et mois courant (utilisant realTimeSignals de Firebase)
  const getTodaySignalsForMonth = (): number => {
    const todaySignals = realTimeSignals.filter(signal => {
      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
      const today = new Date(currentDate);
      return signalDate.getDate() === today.getDate() && 
             signalDate.getMonth() === today.getMonth() && 
             signalDate.getFullYear() === today.getFullYear();
    });
    return todaySignals.length;
  };

  const getThisMonthSignalsForMonth = (): number => {
    const monthSignals = realTimeSignals.filter(signal => {
      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
      return signalDate.getMonth() === currentDate.getMonth() && 
             signalDate.getFullYear() === currentDate.getFullYear();
    });
    return monthSignals.length;
  };

  // Fonctions pour calculer les statistiques du mois courant (utilisant realTimeSignals de Firebase)
  const calculateTotalPnLForMonth = (): number => {
    const monthSignals = realTimeSignals.filter(signal => {
      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
      return signalDate.getMonth() === currentDate.getMonth() && 
             signalDate.getFullYear() === currentDate.getFullYear();
    });
    
    return monthSignals.reduce((total, signal) => {
      if (signal.pnl) {
        return total + parsePnL(signal.pnl);
      }
      return total;
    }, 0);
  };

  const calculateWinRateForMonth = (): number => {
    const monthSignals = realTimeSignals.filter(signal => {
      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
      return signalDate.getMonth() === currentDate.getMonth() && 
             signalDate.getFullYear() === currentDate.getFullYear();
    });
    
    if (monthSignals.length === 0) return 0;
    const wins = monthSignals.filter(s => s.status === 'WIN').length;
    return Math.round((wins / monthSignals.length) * 100);
  };

  const calculateAvgWinForMonth = (): number => {
    const monthSignals = realTimeSignals.filter(signal => {
      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
      return signalDate.getMonth() === currentDate.getMonth() && 
             signalDate.getFullYear() === currentDate.getFullYear();
    });
    
    const winSignals = monthSignals.filter(s => s.status === 'WIN');
    if (winSignals.length === 0) return 0;
    const totalWinPnL = winSignals.reduce((total, signal) => {
      if (signal.pnl) {
        return total + parsePnL(signal.pnl);
      }
      return total;
    }, 0);
    return Math.round(totalWinPnL / winSignals.length);
  };

  const calculateAvgLossForMonth = (): number => {
    const monthSignals = realTimeSignals.filter(signal => {
      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
      return signalDate.getMonth() === currentDate.getMonth() && 
             signalDate.getFullYear() === currentDate.getFullYear();
    });
    
    const lossSignals = monthSignals.filter(s => s.status === 'LOSS');
    if (lossSignals.length === 0) return 0;
    const totalLossPnL = lossSignals.reduce((total, signal) => {
      if (signal.pnl) {
        return total + Math.abs(parsePnL(signal.pnl));
      }
      return total;
    }, 0);
    return Math.round(totalLossPnL / lossSignals.length);
  };

  // Fonction pour calculer le Weekly Breakdown dynamique (même pattern que Avg Win)
  const getWeeklyBreakdownForMonth = () => {
    const monthSignals = realTimeSignals.filter(signal => {
      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
      return signalDate.getMonth() === currentDate.getMonth() && 
             signalDate.getFullYear() === currentDate.getFullYear();
    });

    // Créer 5 semaines pour le mois courant
    const weeks = [];
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const today = new Date();
    
    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const weekStart = new Date(startOfMonth);
      weekStart.setDate(1 + (weekNum - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Filtrer les signaux de cette semaine
      const weekSignals = monthSignals.filter(signal => {
        const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
        return signalDate >= weekStart && signalDate <= weekEnd;
      });
      
      const wins = weekSignals.filter(s => s.status === 'WIN').length;
      const losses = weekSignals.filter(s => s.status === 'LOSS').length;
      const pnl = weekSignals.reduce((total, signal) => {
        if (signal.pnl) {
          return total + parsePnL(signal.pnl);
        }
        return total;
      }, 0);
      
      // Vérifier si c'est la semaine courante
      const isCurrentWeek = today >= weekStart && today <= weekEnd;
      
      weeks.push({
        week: `Week ${weekNum}`,
        weekNum,
        trades: weekSignals.length,
        wins,
        losses,
        pnl: Math.round(pnl),
        isCurrentWeek
      });
    }
    
    return weeks;
  };

  // Stats synchronisées en temps réel avec l'admin (plus besoin de calculer)
  const calculateTotalPnL = (): number => stats.totalPnL;
  const calculateWinRate = (): number => stats.winRate;
  const calculateAvgWin = (): number => stats.avgWin;
  const calculateAvgLoss = (): number => stats.avgLoss;

  const getTodaySignals = () => {
    const today = new Date();
    return signals.filter(s => {
      const signalDate = new Date(s.timestamp);
      return signalDate.getDate() === today.getDate() &&
             signalDate.getMonth() === today.getMonth() &&
             signalDate.getFullYear() === today.getFullYear();
    });
  };

  const getThisMonthSignals = () => {
    const today = new Date();
    return signals.filter(s => {
      const signalDate = new Date(s.timestamp);
      return signalDate.getMonth() === today.getMonth() &&
             signalDate.getFullYear() === today.getFullYear();
    });
  };

  // Fonctions pour les statistiques des trades personnels
  const calculateTotalPnLTrades = (): number => {
    return personalTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0);
  };

  const calculateWinRateTrades = (): number => {
    if (personalTrades.length === 0) return 0;
    const wins = personalTrades.filter(t => t.status === 'WIN').length;
    return Math.round((wins / personalTrades.length) * 100);
  };

  const calculateAvgWinTrades = (): number => {
    const winTrades = personalTrades.filter(t => t.status === 'WIN');
    if (winTrades.length === 0) return 0;
    const totalWinPnL = winTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0);
    return Math.round(totalWinPnL / winTrades.length);
  };

  const calculateAvgLossTrades = (): number => {
    const lossTrades = personalTrades.filter(t => t.status === 'LOSS');
    if (lossTrades.length === 0) return 0;
    const totalLossPnL = lossTrades.reduce((total, trade) => total + Math.abs(parsePnL(trade.pnl)), 0);
    return Math.round(totalLossPnL / lossTrades.length);
  };

  const getTodayTrades = () => {
    const today = new Date().toISOString().split('T')[0];
    return personalTrades.filter(t => t.date === today);
  };

  const getThisMonthTrades = () => {
    const today = new Date();
    return personalTrades.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === today.getMonth() &&
             tradeDate.getFullYear() === today.getFullYear();
    });
  };

  const calculateRiskReward = (entry: string, takeProfit: string, stopLoss: string): string => {
    const entryNum = parseFloat(entry);
    const tpNum = parseFloat(takeProfit);
    const slNum = parseFloat(stopLoss);
    
    if (isNaN(entryNum) || isNaN(tpNum) || isNaN(slNum)) return 'N/A';
    
    const risk = Math.abs(entryNum - slNum);
    const reward = Math.abs(tpNum - entryNum);
    
    if (risk === 0) return 'N/A';
    
    return (reward / risk).toFixed(2);
  };

  const getWeeklyBreakdown = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Créer 5 semaines du mois en cours
    const weeks = [];
    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const weekStart = new Date(currentYear, currentMonth, (weekNum - 1) * 7 + 1);
      const weekEnd = new Date(currentYear, currentMonth, weekNum * 7);
      
      const weekSignals = signals.filter(s => {
        const signalDate = new Date(s.timestamp);
        return signalDate >= weekStart && 
               signalDate <= weekEnd &&
               signalDate.getMonth() === currentMonth &&
               signalDate.getFullYear() === currentYear;
      });
      
      const closedSignals = weekSignals.filter(s => s.status !== 'ACTIVE');
      const weekPnL = closedSignals.reduce((total, signal) => total + parsePnL(signal.pnl || '0'), 0);
      const wins = closedSignals.filter(s => s.status === 'WIN').length;
      const losses = closedSignals.filter(s => s.status === 'LOSS').length;
      
      // Vérifier si c'est la semaine actuelle
      const todayWeek = Math.ceil(today.getDate() / 7);
      const isCurrentWeek = weekNum === todayWeek;
      
      weeks.push({
        week: `Week ${weekNum}`,
        trades: weekSignals.length,
        pnl: weekPnL,
        wins,
        losses,
        isCurrentWeek
      });
    }
    
    return weeks;
  };

  const getWeeklyBreakdownTrades = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Créer 5 semaines du mois en cours
    const weeks = [];
    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const weekStart = new Date(currentYear, currentMonth, (weekNum - 1) * 7 + 1);
      const weekEnd = new Date(currentYear, currentMonth, weekNum * 7);
      
      const weekTrades = personalTrades.filter(t => {
        const tradeDate = new Date(t.date);
        return tradeDate >= weekStart && 
               tradeDate <= weekEnd &&
               tradeDate.getMonth() === currentMonth &&
               tradeDate.getFullYear() === currentYear;
      });
      
      const weekPnL = weekTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0);
      const wins = weekTrades.filter(t => t.status === 'WIN').length;
      const losses = weekTrades.filter(t => t.status === 'LOSS').length;
      
      // Vérifier si c'est la semaine actuelle
      const todayWeek = Math.ceil(today.getDate() / 7);
      const isCurrentWeek = weekNum === todayWeek;
      
      weeks.push({
        week: `Week ${weekNum}`,
        trades: weekTrades.length,
        pnl: weekPnL,
        wins,
        losses,
        isCurrentWeek
      });
    }
    
    return weeks;
  };

  // Fonction pour ajouter une réaction flamme à un message (côté utilisateur)
  const handleAddReaction = async (messageId: string) => {
    try {
      console.log('🔥 handleAddReaction called:', { messageId });
      
      // Vérifier que messageId est valide
      if (!messageId) {
        console.error('❌ messageId invalide:', messageId);
        return;
      }
      
      const currentUser = user?.email || 'Anonymous';
      console.log('👤 Utilisateur actuel:', currentUser);
      
      // Mettre à jour localement d'abord
      setMessageReactions(prev => {
        if (!prev || typeof prev !== 'object') {
          console.error('❌ messageReactions n\'est pas un objet:', prev);
          return prev;
        }
        
        const current = prev[messageId] || { fire: 0, users: [] };
        const userIndex = Array.isArray(current.users) ? current.users.indexOf(currentUser) : -1;
        
        if (userIndex === -1) {
          // Ajouter la réaction
          console.log('➕ Ajouter réaction pour:', messageId);
          return {
            ...prev,
            [messageId]: {
              fire: (current.fire || 0) + 1,
              users: [...(current.users || []), currentUser]
            }
          };
        } else {
          // Retirer la réaction
          console.log('➖ Retirer réaction pour:', messageId);
          return {
            ...prev,
            [messageId]: {
              fire: Math.max(0, (current.fire || 0) - 1),
              users: (current.users || []).filter((_, index) => index !== userIndex)
            }
          };
        }
      });
      
      // Sauvegarder dans Firebase
      const current = messageReactions[messageId] || { fire: 0, users: [] };
      const userIndex = Array.isArray(current.users) ? current.users.indexOf(currentUser) : -1;
      
      let newReactions;
      if (userIndex === -1) {
        newReactions = {
          fire: (current.fire || 0) + 1,
          users: [...(current.users || []), currentUser]
        };
      } else {
        newReactions = {
          fire: Math.max(0, (current.fire || 0) - 1),
          users: (current.users || []).filter((_, index) => index !== userIndex)
        };
      }
      
      console.log('💾 Sauvegarde Firebase:', { messageId, newReactions });
      await updateMessageReactions(messageId, newReactions);
      console.log('✅ Réaction message synchronisée:', messageId, newReactions);
      
    } catch (error) {
      console.error('❌ Erreur réaction message:', error);
              console.error('Erreur lors de l\'ajout de la réaction');
    }
  };

  // Fonction handleReaction supprimée - les réactions sont désactivées côté utilisateur

  const scrollToTop = () => {
    // Pour les salons de chat, scroller dans le conteneur de messages
          if (messagesContainerRef.current && ['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss'].includes(selectedChannel.id)) {
      messagesContainerRef.current.scrollTop = 0;
    } else {
      // Pour les autres vues, scroller la page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    // Scroller vers le bas pour voir les messages les plus récents
    console.log('🔄 Scrolling to bottom user...', {
      hasRef: !!messagesContainerRef.current,
      channelId: selectedChannel.id
    });
    
    // Méthode 1: Avec la référence
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
    
    // Méthode 2: Avec sélecteur CSS comme backup
    const scrollContainer = document.querySelector('.overflow-y-auto.overflow-x-hidden.p-4.space-y-4.pb-32');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      console.log('✅ Scroll with CSS selector worked');
    }
    
    // Méthode 3: Forcer avec tous les conteneurs possibles
    const allContainers = document.querySelectorAll('[class*="overflow-y-auto"]');
    allContainers.forEach((container, index) => {
      container.scrollTop = container.scrollHeight;
      console.log(`📜 Scrolled container ${index}`);
    });
    
    // Méthode 4: Multiple tentatives avec délais
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 50);
    
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 200);
    
    console.log('✅ Scroll to bottom user completed');
  };

  const handleLogout = () => {
    // Garder la photo de profil même après déconnexion
    const profileImageBackup = localStorage.getItem('userProfileImage');
    // Nettoyer le localStorage
    localStorage.clear();
    if (profileImageBackup) {
      localStorage.setItem('userProfileImage', profileImageBackup);
    }
    // Rediriger vers la landing page
    window.location.href = '/';
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('📁 USER File selected:', file ? file.name : 'NO FILE');
    if (file && file.type.startsWith('image/')) {
      console.log('🖼️ USER Processing image...');
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        console.log('💾 USER Syncing to localStorage AND Supabase...');
        
        // Mettre à jour l'état immédiatement
        setProfileImage(base64Image);
        
        // Synchroniser avec localStorage et Supabase
        const result = await syncProfileImage('user', base64Image);
        if (result.success) {
          console.log('✅ USER Profile image synchronized across all devices!');
        } else {
          console.error('❌ USER Sync failed:', result.error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartStream = () => {
    if (!streamTitle.trim()) {
      console.warn('Veuillez entrer un titre pour votre stream');
      return;
    }
    setIsLiveStreaming(true);
    setViewerCount(Math.floor(Math.random() * 50) + 10); // Simuler des viewers
  };

  const handleStopStream = () => {
    setIsLiveStreaming(false);
    setViewerCount(0);
  };

  const handleShareScreen = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(stream => {
          console.log('Stream obtenu:', stream);
          
          // Créer un élément vidéo simple
          const video = document.createElement('video');
          video.className = 'w-full h-full object-contain';
          video.autoplay = true;
          video.muted = true;
          video.playsInline = true;
          video.srcObject = stream;
          
          // Trouver spécifiquement les conteneurs de 
          const Containers = document.querySelectorAll('.bg-gray-900 .bg-black.flex.items-center.justify-center');
          console.log('Conteneurs  trouvés:', Containers.length);
          
          if (Containers.length === 0) {
            // Fallback: chercher tous les conteneurs noirs
            const allContainers = document.querySelectorAll('.bg-black.flex.items-center.justify-center');
            console.log('Tous les conteneurs trouvés:', allContainers.length);
            
            allContainers.forEach((container, index) => {
              console.log(`Remplacer conteneur ${index}`);
              container.innerHTML = '';
              const videoClone = video.cloneNode(true) as HTMLVideoElement;
              container.appendChild(videoClone);
              
              // Lancer la lecture pour chaque clone
              videoClone.play().then(() => {
                console.log(`Vidéo ${index} en cours de lecture`);
              }).catch(err => {
                console.error(`Erreur lecture vidéo ${index}:`, err);
              });
            });
          } else {
            // Utiliser les conteneurs de  spécifiques
            Containers.forEach((container, index) => {
              console.log(`Remplacer conteneur  ${index}`);
              container.innerHTML = '';
              const videoClone = video.cloneNode(true) as HTMLVideoElement;
              container.appendChild(videoClone);
              
              // Lancer la lecture pour chaque clone
              videoClone.play().then(() => {
                console.log(`Vidéo  ${index} en cours de lecture`);
              }).catch(err => {
                console.error(`Erreur lecture vidéo  ${index}:`, err);
              });
            });
          }
          
          // Mettre à jour l'état
          setIsLiveStreaming(true);
          setViewerCount(15);
        })
        .catch(err => {
          console.error('Erreur partage d\'écran:', err);
          console.error('Erreur lors du partage d\'écran:', err.message);
        });
    } else {
      console.error('Partage d\'écran non supporté sur ce navigateur');
    }
  };

  // Fonction handleSignalStatus supprimée - seul admin peut changer le statut des signaux

  // Scroll automatique vers le bas quand de nouveaux messages arrivent, quand on change de canal, ou quand les signaux changent
  // Mais PAS pour le calendrier et trading journal
  useEffect(() => {
    // Exclure le calendrier et trading journal du scroll automatique
    if (!['calendrier', 'trading-journal'].includes(selectedChannel.id)) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [messages, selectedChannel.id, signals]);

  const channels = [

    { id: 'general-chat-2', name: 'general-chat-2', emoji: '📊', fullName: 'Indices' },
    { id: 'general-chat-3', name: 'general-chat-3', emoji: '🪙', fullName: 'Crypto' },
    { id: 'general-chat-4', name: 'general-chat-4', emoji: '💱', fullName: 'Forex' },


    { id: 'fondamentaux', name: 'fondamentaux', emoji: '📚', fullName: 'Fondamentaux' },
    { id: 'letsgooo-model', name: 'letsgooo-model', emoji: '🚀', fullName: 'Letsgooo model' },

    { id: 'general-chat', name: 'general-chat', emoji: '💬', fullName: 'Général chat' },
    { id: 'profit-loss', name: 'profit-loss', emoji: '💰', fullName: 'Profit loss' },
    { id: 'calendrier', name: 'calendrier', emoji: '📅', fullName: 'Journal Signaux' },
    { id: 'trading-journal', name: 'trading-journal', emoji: '📊', fullName: 'Journal Perso' }
  ];

  // Fonction supprimée - seul admin peut créer des signaux

  // Fonctions pour le journal de trading personnalisé
  const handleAddTrade = () => {
    setShowTradeModal(true);
  };

  const handleTradeSubmit = () => {
    if (!tradeData.symbol || !tradeData.entry || !tradeData.exit || !tradeData.pnl) {
      console.warn('Veuillez remplir les champs obligatoires (Symbol, Entry, Exit, PnL)');
      return;
    }

    // Utiliser la date locale pour éviter le décalage UTC
    const getDateString = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const newTrade = {
      id: Date.now().toString(),
      date: selectedDate ? getDateString(selectedDate) : getDateString(new Date()),
      symbol: tradeData.symbol,
      type: tradeData.type,
      entry: tradeData.entry,
      exit: tradeData.exit,
      stopLoss: tradeData.stopLoss,
      pnl: tradeData.pnl,
      status: tradeData.status,
      notes: tradeData.notes,
      image1: tradeData.image1,
      image2: tradeData.image2,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setPersonalTrades(prev => [newTrade, ...prev]);
    
    // Reset form
    setTradeData({
      symbol: '',
      type: 'BUY',
      entry: '',
      exit: '',
      stopLoss: '',
      pnl: '',
      status: 'WIN',
      notes: '',
      image1: null,
      image2: null
    });
    setShowTradeModal(false);
    console.log('Trade ajouté avec succès !');
  };

  const handleTradingViewPasteTrade = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedHtml = e.clipboardData.getData('text/html') || '';
    const pastedText = e.clipboardData.getData('text') || '';
    
    console.log('Pasted HTML:', pastedHtml);
    console.log('Pasted Text:', pastedText);
    
    // Store extracted data
    const extracted: Record<string, any> = {};
    let found = false;
    
    // Check if we have TradingView data
    if (pastedHtml.includes('data-tradingview-clip')) {
      try {
        // Extract the TradingView JSON data
        const regex = /data-tradingview-clip="([^"]+)"/;
        const match = pastedHtml.match(regex);
        
        if (match && match[1]) {
          // Replace HTML entities in the JSON string
          const jsonString = match[1].replace(/&(?:quot|#34);/g, '"');
          const data = JSON.parse(jsonString);
          
          console.log('TradingView data:', data);
          
          // Extract source and points - similar to Google Apps Script
          const source = data.sources?.[0]?.source;
          const points = source?.points;
          const state = source?.state;
          const stopLevel = state?.stopLevel;
          const profitLevel = state?.profitLevel;
          
          if (points && points.length >= 2) {
            found = true;
            
            // Get ticker symbol and clean it
            let symbolFull = state?.symbol || "";
            let ticker = symbolFull.split(":")[1] || symbolFull;
            // Clean common futures symbols
            if (ticker.startsWith("NQ1")) ticker = "NQ";
            else if (ticker.startsWith("ES1")) ticker = "ES";
            else if (ticker.startsWith("MNQ")) ticker = "MNQ";
            
            extracted.symbol = ticker;
            
            // Determine trade type from the tool
            const type = source?.type;
            if (type === "LineToolRiskRewardLong" || /long/i.test(type)) {
              extracted.tradeType = 'buy';
            } else if (type === "LineToolRiskRewardShort" || /short/i.test(type)) {
              extracted.tradeType = 'sell';
            }
            
            // Extract price information
            const entryPrice = points[0]?.price;
            if (entryPrice !== undefined) {
              extracted.entryPrice = entryPrice.toString();
            }
            
            // For exit price, use the last point
            if (points.length > 1) {
              const exitPrice = points[points.length - 1]?.price;
              if (exitPrice !== undefined) {
                extracted.exitPrice = exitPrice.toString();
              }
            }
            
            // Calculate Risk:Reward ratio if available
            if (stopLevel !== undefined && profitLevel !== undefined) {
              const rrRatio = Math.round((profitLevel / stopLevel) * 100) / 100;
              extracted.rr = rrRatio.toString();
              
              // Calculate Stop Loss based on entry price and stopLevel
              if (entryPrice !== undefined) {
                let slPrice;
                if (extracted.tradeType === 'buy') {
                  // For Long trades
                  const stopDistance = stopLevel / 4;
                  slPrice = entryPrice - stopDistance;
                } else {
                  // For Short trades
                  const stopDistance = stopLevel / 4;
                  slPrice = entryPrice + stopDistance;
                }
                extracted.stopLoss = slPrice.toString();
              }
            }
          }
        }
      } catch (error) {
        console.error('Error parsing TradingView data:', error);
      }
    }
    
    // Fallback to text parsing if no TradingView data found
    if (!found) {
      const symbolMatch = pastedText.match(/([A-Z]{3,6})/);
      const typeMatch = pastedText.match(/(BUY|SELL|LONG|SHORT)/i);
      const numbers = pastedText.match(/\d+(?:\.\d+)?/g);
      
      if (symbolMatch) extracted.symbol = symbolMatch[1];
      if (typeMatch) extracted.tradeType = typeMatch[1].toLowerCase();
      if (numbers && numbers.length >= 1) extracted.entryPrice = numbers[0];
      if (numbers && numbers.length >= 2) extracted.exitPrice = numbers[1];
      if (numbers && numbers.length >= 3) extracted.stopLoss = numbers[2];
    }
    
    // Mise à jour du formulaire
    if (extracted.symbol) setTradeData(prev => ({ ...prev, symbol: extracted.symbol }));
    if (extracted.tradeType) setTradeData(prev => ({ ...prev, type: extracted.tradeType === 'buy' || extracted.tradeType === 'long' ? 'BUY' : 'SELL' }));
    if (extracted.entryPrice) setTradeData(prev => ({ ...prev, entry: extracted.entryPrice }));
    if (extracted.exitPrice) setTradeData(prev => ({ ...prev, exit: extracted.exitPrice }));
    if (extracted.stopLoss) setTradeData(prev => ({ ...prev, stopLoss: extracted.stopLoss }));
    
    // Show success message
    if (found || Object.keys(extracted).length > 0) {
      console.log(`✅ Données importées - Symbole: ${extracted.symbol}, Entrée: ${extracted.entryPrice}, Sortie: ${extracted.exitPrice}, Stop Loss: ${extracted.stopLoss}`);
    } else {
      console.warn('❌ Aucune donnée détectée. Essayez de coller depuis TradingView (Risk/Reward tool)');
    }
  };

  const getTradesForDate = (date: Date) => {
    try {
      // Utiliser la date locale au lieu de UTC pour éviter le décalage
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      console.log('Recherche trades pour date:', dateStr);
      console.log('Tous les trades:', personalTrades);
      
      if (!Array.isArray(personalTrades)) {
        console.error('personalTrades n\'est pas un tableau:', personalTrades);
        return [];
      }
      
      const filteredTrades = personalTrades.filter(trade => {
        if (!trade || !trade.date) {
          console.log('Trade invalide:', trade);
          return false;
        }
        return trade.date === dateStr;
      });
      console.log('Trades filtrés:', filteredTrades);
      return filteredTrades;
    } catch (error) {
      console.error('Erreur dans getTradesForDate:', error);
      return [];
    }
  };

  const getSignalsForDate = (date: Date) => {
    // Utiliser realTimeSignals directement (avec les images complètes)
    const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const signalsForDate = realTimeSignals.filter(signal => {
      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
      const signalDateOnly = new Date(signalDate.getFullYear(), signalDate.getMonth(), signalDate.getDate());
      
      return signalDateOnly.getTime() === targetDate.getTime();
    });
    
    console.log(`🔍 [CALENDAR] Signaux trouvés pour ${targetDate.toDateString()}:`, signalsForDate.length);
    signalsForDate.forEach(signal => {
      console.log(`🔍 [CALENDAR] Signal avec image:`, {
        id: signal.id,
        symbol: signal.symbol,
        hasImage: !!signal.image,
        hasAttachment: !!signal.attachment_data,
        image: signal.image,
        attachment_data: signal.attachment_data
      });
    });
    
    return signalsForDate;
  };

  // Fonction pour récupérer les signaux d'une semaine spécifique
  const getSignalsForWeek = (weekNum: number): any[] => {
    const weeklyData = getCalendarWeeklyBreakdownFromHook();
    const weekData = weeklyData.find(week => week.weekNum === weekNum);
    return weekData?.signals || [];
  };

  const handleSignalSubmit = async () => {
    // Validation minimale - juste besoin d'au moins un champ rempli
    if (!signalData.symbol && !signalData.entry && !signalData.takeProfit && !signalData.stopLoss && !signalData.description) {
      console.warn('Veuillez remplir au moins un champ pour créer le signal');
      return;
    }

    try {
      // Préparer les données pour Firebase
      const signalForFirebase = {
        channel_id: selectedChannel.id,
        type: signalData.type as 'BUY' | 'SELL',
        symbol: signalData.symbol || 'N/A',
        timeframe: signalData.timeframe || '1 min',
        entry: signalData.entry || '0',
        takeProfit: signalData.takeProfit || '0',
        stopLoss: signalData.stopLoss || '0',
        description: signalData.description || '',
        author: 'TheTheTrader',
        image: signalData.image,
        status: 'ACTIVE' as const
      };

      // Sauvegarder en Firebase
      const savedSignal = await addSignal(signalForFirebase);
      
      if (savedSignal) {
        console.log('✅ Signal sauvé en Firebase:', savedSignal);
        console.log('Signal créé et sauvé en base ! ✅');
      } else {
        console.error('❌ Erreur sauvegarde signal');
        console.error('Erreur lors de la sauvegarde du signal');
        return;
      }
    } catch (error) {
      console.error('❌ Erreur création signal:', error);
      console.error('Erreur lors de la création du signal');
      return;
    }
    
    // Reset form et fermer modal
    setSignalData({
      type: 'BUY',
      symbol: '',
      timeframe: '',
      entry: '',
      takeProfit: '',
      stopLoss: '',
      description: '',
      image: null
    });
    // Modal supprimée
  };

  const handleSendMessage = async () => {
    // Protection contre les envois multiples
    if (isSendingMessage) {
      console.log('⚠️ Message déjà en cours d\'envoi, ignoré');
      return;
    }
    
    if (chatMessage.trim()) {
      setIsSendingMessage(true); // Bloquer les envois multiples
      console.log('🚀 Début envoi message côté:', window.matchMedia('(display-mode: standalone)').matches ? 'PWA' : 'Desktop');
      console.log('📝 Message à envoyer:', chatMessage);
      console.log('📺 Canal sélectionné:', selectedChannel.id);
      console.log('📊 Messages actuels avant envoi:', messages[selectedChannel.id]?.length || 0);
      
      try {
        // Créer le message local pour référence
        const localMessage = {
          id: `local-${Date.now()}`,
          text: chatMessage,
          user: 'TheTheTrader',
          author: 'TheTheTrader',
          author_avatar: profileImage || undefined,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          attachment_data: undefined
        };

        console.log('📱 Message local créé (pas encore affiché):', localMessage);

        // Envoyer vers Firebase avec avatar utilisateur
        const messageData = {
          channel_id: selectedChannel.id,
          content: chatMessage,
          author: 'TheTheTrader',
          author_type: 'user' as const,
          author_avatar: profileImage || undefined // Photo de profil utilisateur
        };

        console.log('📤 Envoi vers Firebase:', messageData);
        const savedMessage = await addMessage(messageData);

        if (savedMessage) {
          console.log('✅ Message envoyé à Firebase:', savedMessage);
          // Le message sera automatiquement ajouté via la subscription Firebase
          // Pas besoin de manipulation manuelle des messages
          

        } else {
          console.error('❌ Erreur envoi message Firebase');
          // En cas d'erreur, on peut ajouter le message local
          setMessages(prev => {
            const currentChannelMessages = prev[selectedChannel.id] || [];
            return {
              ...prev,
              [selectedChannel.id]: [...currentChannelMessages, localMessage]
            };
          });
        }
      } catch (error) {
        console.error('💥 ERREUR envoi message:', error);
        // En cas d'erreur, garder le message local
        console.log('💾 Message local conservé en cas d\'erreur');
      }

      // Ne pas vider le champ de message immédiatement
      // setChatMessage('');
      
      // Scroll automatique après envoi
      setTimeout(() => {
        scrollToBottom();
      }, 50);
      
      // Vider le champ de message
      setChatMessage('');
    }
    
    // Réactiver l'envoi (même en cas d'erreur)
    setIsSendingMessage(false);
  };

                                    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0];
                  if (file) {
                      // Upload image vers Firebase Storage
                      const imageURL = await uploadImage(file);
                      
                      try {
                        // Envoyer à Firebase avec l'URL de l'image
                        const messageData = {
                          channel_id: selectedChannel.id,
                          content: '',
                      author: 'TheTheTrader',
                          author_type: 'user' as const,
                          author_avatar: profileImage || undefined,
                          attachment_data: imageURL,
                          attachment_type: file.type,
                          attachment_name: file.name
                        };
                          
                          console.log('📤 Message data envoyé utilisateur:', messageData);
                          const savedMessage = await addMessage(messageData);
                          console.log('✅ Message sauvegardé utilisateur:', savedMessage);
                          
                                                  if (savedMessage) {
                          console.log('✅ Image envoyée utilisateur à Firebase:', savedMessage);
                          // La subscription temps réel ajoutera le message automatiquement
                        } else {
                          console.error('❌ Erreur envoi image utilisateur Firebase');
                        }
                      } catch (error) {
                        console.error('💥 ERREUR upload image utilisateur:', error);
                      }
                      
                    // Reset the input
                    event.target.value = '';
                      
                      // Scroll automatique après upload
                      setTimeout(() => {
                        scrollToBottom();
                      }, 50);
                  }
                };

  const parseSignalData = (text: string) => {
    // Chercher tous les nombres
    const numbers = text.match(/\d+(?:\.\d+)?/g);
    
    // Chercher le symbole - patterns plus spécifiques
    let symbol = '';
    
    // Pattern 1: Symboles avec ! (NQ1!, ES!, etc.)
    const futuresMatch = text.match(/([A-Z]{1,3}\d*!)/);
    if (futuresMatch) {
      symbol = futuresMatch[1];
    } else {
      // Pattern 2: Symboles crypto/forex (BTCUSD, EURUSD, etc.)
      const forexMatch = text.match(/([A-Z]{6,8})/);
      if (forexMatch) {
        symbol = forexMatch[1];
      } else {
        // Pattern 3: Symboles simples (BTC, ETH, etc.)
        const cryptoMatch = text.match(/\b([A-Z]{3,4})\b/);
        if (cryptoMatch && !['LONG', 'SHORT', 'BUY', 'SELL'].includes(cryptoMatch[1])) {
          symbol = cryptoMatch[1];
        }
      }
    }
    
    // Déterminer le type basé sur le texte
    let type = 'BUY';
    if (text.toUpperCase().includes('SELL') || text.toUpperCase().includes('SHORT')) {
      type = 'SELL';
    } else if (text.toUpperCase().includes('BUY') || text.toUpperCase().includes('LONG')) {
      type = 'BUY';
    }
    
    // Si on a au moins 1 nombre, on peut commencer à remplir
    if (numbers && numbers.length >= 1) {
      const newData = {
        symbol: symbol || 'UNKNOWN',
        entry: numbers[0] || '',
        takeProfit: numbers[1] || '', 
        stopLoss: numbers[2] || '',
        type: type
      };
      

      
      setSignalData(prev => ({
        ...prev,
        ...newData
      }));
      
      if (numbers.length >= 3) {
        console.log(`✅ Données importées - Symbole: ${newData.symbol}, Entrée: ${newData.entry}, TP: ${newData.takeProfit}, SL: ${newData.stopLoss}`);
      } else {
        console.warn(`⚠️ Données partielles importées - Symbole: ${newData.symbol}, Entrée: ${newData.entry}. Complétez les champs manquants`);
      }
      
      return true;
    }
    
    console.warn('❌ Aucun nombre détecté. Exemple : "NQ1! 22950 23004 22896"');
    return false;
  };

  const getTradingCalendar = () => {
    console.log('🔥 getTradingCalendar appelé pour channel:', selectedChannel.id);
    console.log('🔥 personalTrades dans calendrier:', personalTrades.length);
    return (
    <div className="bg-gray-900 text-white p-2 md:p-4 h-full overflow-y-auto" style={{ paddingTop: selectedChannel.id === 'trading-journal' ? '60px' : '20px' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 border-b border-gray-600 pb-4 gap-4 md:gap-0">
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-white">
            {selectedChannel.id === 'trading-journal' ? 'Mon Journal Perso' : 'Journal des Signaux'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {selectedChannel.id === 'trading-journal' ? 'Journal tous tes trades' : 'Suivi des performances des signaux'}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-white">
            <button 
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-700 rounded-lg text-lg font-bold"
            >
              ‹
            </button>
            <span className="px-4 text-lg font-semibold min-w-[120px] text-center">
              {getMonthName(currentDate)} {currentDate.getFullYear()}
            </span>
            <button 
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-700 rounded-lg text-lg font-bold"
            >
              ›
            </button>
          </div>
          {selectedChannel.id === 'trading-journal' && (
            <button 
              onClick={handleAddTrade}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Ajouter Trade
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Calendrier principal */}
        <div className="flex-1 w-full">
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-4 w-full">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <div key={day} className="text-center text-gray-400 font-semibold py-3 text-sm uppercase tracking-wide">
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 w-full" key={`calendar-${selectedChannel.id}-${personalTrades.length}-${currentDate.getMonth()}-${currentDate.getFullYear()}`}>
            {(() => {
              const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
              const daysInMonth = lastDayOfMonth.getDate();
              const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = dimanche, 1 = lundi, etc.
              
              // Ajuster pour que lundi soit 0
              const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
              
              const totalCells = Math.ceil((adjustedFirstDay + daysInMonth) / 7) * 7;
              
              return Array.from({ length: totalCells }, (_, i) => {
                const dayNumber = i - adjustedFirstDay + 1;
                const today = new Date();
                const isToday = dayNumber === today.getDate() && 
                               currentDate.getMonth() === today.getMonth() && 
                               currentDate.getFullYear() === today.getFullYear();
                
                // Celles vides au début
                if (dayNumber < 1) {
                  return <div key={i} className="border-2 rounded-lg h-16 md:h-24 p-1 md:p-2 bg-gray-800 border-gray-700" style={{minHeight: '64px'}}></div>;
                }
                
                // Celles vides à la fin
                if (dayNumber > daysInMonth) {
                  return <div key={i} className="border-2 rounded-lg h-16 md:h-24 p-1 md:p-2 bg-gray-800 border-gray-700" style={{minHeight: '64px'}}></div>;
                }
              
                              // Vérifier s'il y a des trades personnels ou des signaux pour ce jour
                const dayTrades = selectedChannel.id === 'trading-journal' ? 
                  personalTrades.filter(trade => {
                    const tradeDate = new Date(trade.date);
                    return tradeDate.getDate() === dayNumber && 
                           tradeDate.getMonth() === currentDate.getMonth() && 
                           tradeDate.getFullYear() === currentDate.getFullYear();
                  }) : [];

                const daySignals = selectedChannel.id !== 'trading-journal' ? 
                  realTimeSignals.filter(signal => {
                    // Utiliser le timestamp original pour déterminer la vraie date
                    const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
                    
                    // Si la date est invalide, ignorer ce signal
                    if (isNaN(signalDate.getTime())) {
                      return false;
                    }
                    
                    const isMatch = signalDate.getDate() === dayNumber && 
                                  signalDate.getMonth() === currentDate.getMonth() && 
                                  signalDate.getFullYear() === currentDate.getFullYear();
                    
                    return isMatch;
                  }) : [];

                // Déterminer la couleur selon les trades ou signaux
                let bgColor = 'bg-gray-700 border-gray-600 text-gray-400'; // No trade par défaut
                let tradeCount = 0;

                if (selectedChannel.id === 'trading-journal') {
                  // Logique pour les trades personnels
                  if (dayTrades.length > 0) {
                    tradeCount = dayTrades.length;
                    
                    // Déterminer la couleur selon les statuts des trades
                    const hasWin = dayTrades.some(t => t.status === 'WIN');
                    const hasLoss = dayTrades.some(t => t.status === 'LOSS');
                    const hasBE = dayTrades.some(t => t.status === 'BE');
                    
                    if (hasWin && !hasLoss) {
                      bgColor = 'bg-green-500/60 border-green-400/50 text-white'; // WIN
                    } else if (hasLoss && !hasWin) {
                      bgColor = 'bg-red-500/60 border-red-400/50 text-white'; // LOSS
                    } else if (hasBE || (hasWin && hasLoss)) {
                      bgColor = 'bg-blue-500/60 border-blue-400/50 text-white'; // BE ou mixte
                    }
                  }
                } else {
                  // Logique pour les signaux (calendrier normal) - basée sur PnL
                  if (daySignals.length > 0) {
                    tradeCount = daySignals.length;
                    
                    // Calculer le PnL total pour ce jour
                    const totalPnL = daySignals.reduce((total, signal) => {
                      if (signal.pnl) {
                        return total + parsePnL(signal.pnl);
                      }
                      return total;
                    }, 0);
                    
                    // Déterminer la couleur selon le PnL total
                    if (totalPnL > 0) {
                      bgColor = 'bg-green-400/40 border-green-300/30 text-white'; // PnL positif - vert plus pale
                    } else if (totalPnL < 0) {
                      bgColor = 'bg-red-500/60 border-red-400/50 text-white'; // PnL négatif
                    } else {
                      bgColor = 'bg-blue-500/60 border-blue-400/50 text-white'; // PnL = 0
                    }
                  }
                }
              
              return (
                  <div 
                    key={i} 
                    onClick={(e) => {
                      try {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                        
                        if (selectedChannel.id === 'trading-journal') {
                          setSelectedDate(clickedDate);
                          
                          // Ouvrir le popup des trades si il y en a
                          const tradesForDate = getTradesForDate(clickedDate);
                          console.log('Clic sur jour:', dayNumber, 'Trades trouvés:', tradesForDate.length);
                          
                          if (tradesForDate.length > 0) {
                            console.log('Trades trouvés, ouverture modal...');
                            setSelectedTradesDate(clickedDate);
                            setShowTradesModal(true);
                          }
                        } else {
                          // Ouvrir le popup des signaux si il y en a
                          const signalsForDate = getSignalsForDate(clickedDate);
                          if (signalsForDate.length > 0) {
                            setSelectedSignalsDate(clickedDate);
                            setShowSignalsModal(true);
                          }
                        }
                      } catch (error) {
                        console.error('Erreur lors du clic sur le jour:', error);
                        console.error('Erreur lors du clic sur le jour:', error);
                      }
                    }}
                    className={`
                    border-2 rounded-lg h-16 md:h-24 p-1 md:p-2 cursor-pointer transition-all hover:shadow-md
                      ${bgColor}
                    ${isToday ? 'ring-2 ring-blue-400' : ''}
                      ${selectedChannel.id === 'trading-journal' && selectedDate && 
                        selectedDate.getDate() === dayNumber && 
                        selectedDate.getMonth() === currentDate.getMonth() && 
                        selectedDate.getFullYear() === currentDate.getFullYear() 
                        ? 'ring-2 ring-purple-400' : ''}
                  `}
                    style={{minHeight: '64px'}}>
                  <div className="flex flex-col h-full justify-between">
                      <div className="text-xs md:text-sm font-semibold">{dayNumber}</div>
                      {tradeCount > 0 && (
                      <div className="text-xs font-bold text-center hidden md:block">
                          {tradeCount} {selectedChannel.id === 'trading-journal' ? 'trade' : 'signal'}{tradeCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
              });
            })()}
            </div>

          {/* Légende */}
          <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-gray-600">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500/60 border border-green-400/50 rounded"></div>
              <span className="text-xs text-gray-300">WIN</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500/60 border border-red-400/50 rounded"></div>
              <span className="text-xs text-gray-300">LOSS</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500/60 border border-blue-400/50 rounded"></div>
              <span className="text-xs text-gray-300">BREAK</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-700 border border-gray-600 rounded"></div>
              <span className="text-xs text-gray-300">NO TRADE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-blue-400 rounded"></div>
              <span className="text-xs text-gray-300">Today</span>
            </div>
          </div>
        </div>

        {/* Panneau des statistiques */}
        <div className="w-full lg:w-80 bg-gray-800 rounded-xl p-4 md:p-6">
          <h3 className="text-lg font-bold text-white mb-6">
            {selectedChannel.id === 'trading-journal' ? 'Mon Journal Perso' : 'Statistiques Signaux'}
          </h3>
          
          {/* Métriques principales */}
          <div className="space-y-4 mb-8">
            {/* P&L Total */}
            <div className={`border rounded-lg p-4 border ${
              (selectedChannel.id === 'trading-journal' ? calculateTotalPnLTrades() : calculateTotalPnLForMonth()) >= 0 
                ? 'bg-green-600/20 border-green-500/30' 
                : 'bg-red-600/20 border-red-500/30'
            }`}>
              <div className={`text-sm mb-1 ${
                (selectedChannel.id === 'trading-journal' ? calculateTotalPnLTrades() : calculateTotalPnLForMonth()) >= 0 ? 'text-green-300' : 'text-red-300'
              }`}>P&L Total</div>
              <div className={`text-2xl font-bold ${
                (selectedChannel.id === 'trading-journal' ? calculateTotalPnLTrades() : calculateTotalPnLForMonth()) >= 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {(selectedChannel.id === 'trading-journal' ? calculateTotalPnLTrades() : calculateTotalPnLForMonth()) >= 0 ? '+' : ''}${selectedChannel.id === 'trading-journal' ? calculateTotalPnLTrades() : calculateTotalPnLForMonth()}
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-blue-600/20 border-blue-500/30 rounded-lg p-4 border">
              <div className="text-sm text-blue-300 mb-1">Win Rate</div>
              <div className="text-2xl font-bold text-blue-200">
                {selectedChannel.id === 'trading-journal' ? calculateWinRateTrades() : calculateWinRateForMonth()}%
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Aujourd'hui</div>
                <div className="text-lg font-bold text-blue-400">
                  {selectedChannel.id === 'trading-journal' ? getTodayTrades().length : getTodaySignalsForMonth()}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Ce mois</div>
                <div className="text-lg font-bold text-white">
                  {selectedChannel.id === 'trading-journal' ? getThisMonthTrades().length : getThisMonthSignalsForMonth()}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Avg Win</div>
                <div className="text-lg font-bold text-green-400">
                  {selectedChannel.id === 'trading-journal' ? 
                    (calculateAvgWinTrades() > 0 ? `+$${calculateAvgWinTrades()}` : '-') :
                    (getCalendarMonthlyStats(currentDate).avgWin > 0 ? `+$${getCalendarMonthlyStats(currentDate).avgWin}` : '-')
                  }
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Avg Loss</div>
                <div className="text-lg font-bold text-red-400">
                  {selectedChannel.id === 'trading-journal' ? 
                    (calculateAvgLossTrades() > 0 ? `-$${calculateAvgLossTrades()}` : '-') :
                    (getCalendarMonthlyStats(currentDate).avgLoss > 0 ? `-$${getCalendarMonthlyStats(currentDate).avgLoss}` : '-')
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Résumé hebdomadaire */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4">Weekly Breakdown</h4>
            <div className="space-y-2">
              {(selectedChannel.id === 'trading-journal' ? getWeeklyBreakdownTrades() : getWeeklyBreakdownForMonth()).map((weekData, index) => (
                <div 
                  key={index} 
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-600/50 transition-colors ${
                    weekData.isCurrentWeek 
                      ? 'bg-blue-600/20 border-blue-500/30' 
                      : 'bg-gray-700/50 border-gray-600'
                  }`}
                  onClick={() => {
                    setSelectedWeek(weekData.weekNum);
                    setShowWeekSignalsModal(true);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-medium ${
                      weekData.isCurrentWeek ? 'text-blue-300' : 'text-gray-300'
                    }`}>
                      {weekData.week}
                    </div>
                    <div className="text-xs text-gray-400">
                      {weekData.trades} trade{weekData.trades !== 1 ? 's' : ''}
                  </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(weekData.wins > 0 || weekData.losses > 0) ? (
                      <div className="flex items-center gap-1">
                        {weekData.wins > 0 && (
                          <div className="text-sm bg-green-500 text-white px-3 py-1 rounded-lg font-bold shadow-lg">
                            {weekData.wins}W
                          </div>
                        )}
                        {weekData.losses > 0 && (
                          <div className="text-sm bg-red-500 text-white px-3 py-1 rounded-lg font-bold shadow-lg">
                            {weekData.losses}L
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 px-3 py-1">
                        -
                      </div>
                    )}
                    <div className={`text-xs ${
                      weekData.pnl > 0 ? 'text-green-400' : 
                      weekData.pnl < 0 ? 'text-red-400' : 'text-gray-500'
                    }`}>
                      {weekData.pnl !== 0 ? `${weekData.pnl > 0 ? '+' : ''}$${weekData.pnl}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Espace supplémentaire en bas pour éviter que la dernière ligne soit cachée */}
          <div className="h-24 md:h-32"></div>
        </div>
      </div>
    </div>
  );
  };



  return (
    <div className="h-screen w-full bg-gray-900 text-white overflow-hidden flex" style={{ paddingTop: '0px' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-56 bg-gray-800 flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                onChange={handleProfileImageChange}
                className="hidden"
                accept="image/*"
              />
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  'TT'
                )}
            </div>
            </label>
            <div className="flex-1">
              <p className="text-sm font-medium">TheTheTrader</p>
              <p className="text-xs text-gray-400">En ligne</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ÉDUCATION</h3>
            <div className="space-y-1">
              <button onClick={() => handleChannelChange('fondamentaux', 'fondamentaux')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'fondamentaux' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📚 Fondamentaux</button>
              <button onClick={() => handleChannelChange('letsgooo-model', 'letsgooo-model')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'letsgooo-model' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>🚀 Letsgooo-model</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">SIGNAUX</h3>
            <div className="space-y-1">
              {channels.filter(c => ['general-chat-2', 'general-chat-3', 'general-chat-4'].includes(c.id)).map(channel => (
                <button 
                  key={channel.id}
                  onClick={() => handleChannelChange(channel.id, channel.name)} 
                  className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === channel.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                >
                  {channel.emoji} {channel.fullName}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">TRADING HUB</h3>
            <div className="space-y-1">

              <button onClick={() => handleChannelChange('general-chat', 'general-chat')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'general-chat' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>💬 General-chat</button>

              <button onClick={() => handleChannelChange('profit-loss', 'profit-loss')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'profit-loss' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>💰 Profit-loss</button>
              <button onClick={() => handleChannelChange('calendrier', 'calendrier')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'calendrier' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📅 Journal Signaux</button>
              <button onClick={() => handleChannelChange('trading-journal', 'trading-journal')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'trading-journal' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📊 Journal Perso</button>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2">Statistiques</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Win Rate:</span>
                <span className="text-blue-400">{calculateWinRate()}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Trades:</span>
                <span className="text-purple-400">{realTimeSignals.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Signaux actifs:</span>
                <span className="text-yellow-400">{realTimeSignals.filter(s => s.status === 'ACTIVE').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">P&L Total:</span>
                <span className={calculateTotalPnL() >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {calculateTotalPnL() >= 0 ? '+' : ''}${calculateTotalPnL()}
                </span>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Navigation - Fixed */}
        <div className="md:hidden bg-gray-800 border-b border-gray-700 p-3 fixed top-0 left-0 right-0 z-30" style={{ height: '60px' }}>
          {mobileView === 'channels' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    onChange={handleProfileImageChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      'TT'
                    )}
                </div>
                </label>
                <div>
                  <p className="text-sm font-medium">TheTheTrader</p>
                </div>
              </div>
              <button onClick={handleLogout} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setMobileView('channels')}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">
                  {view === 'calendar' ? '📅 Journal Signaux' : 
                   channels.find(c => c.id === selectedChannel.id)?.fullName || selectedChannel.name}
                </span>
              </button>

            </div>
          )}
        </div>

        {/* Mobile Content Container with Slide Animation */}
        <div className="md:hidden relative flex-1 overflow-hidden" style={{ paddingTop: '60px' }}>
          {/* Channels List - Slides from left */}
          <div 
            className={`absolute inset-0 bg-gray-800 transform transition-transform duration-300 ease-in-out z-10 ${
              mobileView === 'channels' ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
                        <div className="p-4 space-y-6 h-full overflow-y-auto" style={{ paddingTop: '80px' }}>
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">ÉDUCATION</h3>
                <div className="space-y-2">
                  {channels.filter(c => ['fondamentaux', 'letsgooo-model'].includes(c.id)).map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        handleChannelChange(channel.id, channel.name);
                        setMobileView('content');
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{channel.emoji}</span>
                        <div>
                          <p className="font-medium text-white">{channel.fullName}</p>
                          <p className="text-sm text-gray-400">Contenu éducatif</p>
                        </div>
                      </div>

                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">SIGNAUX</h3>
                <div className="space-y-2">
                  {channels.filter(c => ['general-chat-2', 'general-chat-3', 'general-chat-4'].includes(c.id)).map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        handleChannelChange(channel.id, channel.name);
                        setMobileView('content');
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{channel.emoji}</span>
                        <div>
                          <p className="font-medium text-white">{channel.fullName}</p>
                          <p className="text-sm text-gray-400">Canal de signaux</p>
                        </div>
                      </div>

                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">TRADING HUB</h3>
                <div className="space-y-2">
                  {channels.filter(c => ['', 'general-chat', 'profit-loss'].includes(c.id)).map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => {
                        handleChannelChange(channel.id, channel.name);
                        setMobileView('content');
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{channel.emoji}</span>
                        <div>
                          <p className="font-medium text-white">{channel.fullName}</p>
                          <p className="text-sm text-gray-400">Hub de trading</p>
                        </div>
                      </div>

                    </button>
                  ))}
                  
                  <button
                    onClick={() => {
                      handleChannelChange('calendrier', 'calendrier');
                      setMobileView('content');
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📅</span>
                      <div>
                        <p className="font-medium text-white">Journal Signaux</p>
                        <p className="text-sm text-gray-400">Suivi des performances</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleChannelChange('trading-journal', 'trading-journal');
                      setMobileView('content');
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📊</span>
                      <div>
                        <p className="font-medium text-white">Journal Perso</p>
                        <p className="text-sm text-gray-400">Journal personnel</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3">Statistiques</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="text-blue-400">{calculateWinRateForMonth()}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Signaux actifs:</span>
                    <span className="text-yellow-400">{realTimeSignals.filter(s => s.status === 'ACTIVE').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">P&L Total:</span>
                    <span className={calculateTotalPnLForMonth() >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {calculateTotalPnLForMonth() >= 0 ? '+' : ''}${calculateTotalPnLForMonth()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Trades:</span>
                    <span className="text-purple-400">{realTimeSignals.length}</span>
                  </div>
                </div>
                <div className="text-xs text-green-500 text-center mt-2">🔄 Stats synchronisées</div>
              </div>
            </div>
          </div>

          {/* Content Area - Slides from right */}
          <div 
            className={`absolute inset-0 bg-gray-900 transform transition-transform duration-300 ease-in-out z-10 ${
              mobileView === 'content' ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {(view === 'calendar' || selectedChannel.id === 'trading-journal' || selectedChannel.id === 'calendrier') ? (
              <div className="bg-gray-900 text-white p-4 md:p-6 h-full overflow-y-auto overflow-x-hidden" style={{ paddingTop: '0px' }}>
                {/* Header avec bouton Ajouter Trade pour Trading Journal - Desktop seulement */}
                {selectedChannel.id === 'trading-journal' && (
                  <div className="hidden md:flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white">Mon Journal Perso</h1>
                      <p className="text-sm text-gray-400 mt-1">Journal tous tes trades</p>
                    </div>
                    <button 
                      onClick={handleAddTrade}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      + Ajouter Trade
                    </button>
                  </div>
                )}
                
                  {/* Header pour le calendrier normal */}
                {(view === 'calendar' || selectedChannel.id === 'calendrier') && selectedChannel.id !== 'trading-journal' && (
                  <div className="flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white">Journal des Signaux</h1>
                      <p className="text-sm text-gray-400 mt-1">Suivi des performances des signaux</p>
                    </div>
                  </div>
                )}
                
                {/* Affichage du calendrier */}
                {(selectedChannel.id === 'calendrier' || selectedChannel.id === 'trading-journal') && getTradingCalendar()}
                
                {/* Affichage des trades pour la date sélectionnée - SEULEMENT pour Trading Journal */}
                {(() => {
                  console.log('Vérification affichage trades:', {
                    channel: selectedChannel.id,
                    selectedDate: selectedDate,
                    shouldShow: selectedChannel.id === 'trading-journal' && selectedDate,
                    tradesCount: selectedDate ? getTradesForDate(selectedDate).length : 0
                  });
                  return selectedChannel.id === 'trading-journal' && selectedDate;
                })() && (
                  <div className="mt-8 border-t border-gray-600 pt-6">
                    <h3 className="text-lg font-bold text-white mb-4">
                      Trades du {selectedDate.toLocaleDateString('fr-FR')}
                    </h3>
                    {getTradesForDate(selectedDate).length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        Aucun trade pour cette date
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getTradesForDate(selectedDate).map((trade) => (
                          <div key={trade.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                  trade.status === 'WIN' ? 'bg-green-500 text-white' :
                                  trade.status === 'LOSS' ? 'bg-red-500 text-white' :
                                  'bg-blue-500 text-white'
                                }`}>
                                  {trade.status}
                                </span>
                                <span className="text-white font-semibold">{trade.symbol}</span>
                                <span className="text-gray-400">{trade.type}</span>
                              </div>
                              <span className={`text-lg font-bold ${
                                parseFloat(trade.pnl) >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {parseFloat(trade.pnl) >= 0 ? '+' : ''}{trade.pnl}$
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Entry:</span>
                                <span className="text-white ml-2">{trade.entry}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Exit:</span>
                                <span className="text-white ml-2">{trade.exit}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Stop Loss:</span>
                                <span className="text-white ml-2">{trade.stopLoss || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Time:</span>
                                <span className="text-white ml-2">{trade.timestamp}</span>
                              </div>
                            </div>
                            
                            {trade.notes && (
                              <div className="mt-3 pt-3 border-t border-gray-600">
                                <span className="text-gray-400 text-sm">Notes:</span>
                                <p className="text-white text-sm mt-1">{trade.notes}</p>
                              </div>
                            )}
                            
                            {(trade.image1 || trade.image2) && (
                              <div className="mt-3 pt-3 border-t border-gray-600">
                                <span className="text-gray-400 text-sm">Images:</span>
                                <div className="flex gap-2 mt-2">
                                  {trade.image1 && (
                                    <img 
                                      src={URL.createObjectURL(trade.image1)} 
                                      alt="Trade screenshot 1"
                                      className="w-20 h-20 object-cover rounded border border-gray-600"
                                    />
                                  )}
                                  {trade.image2 && (
                                    <img 
                                      src={URL.createObjectURL(trade.image2)} 
                                      alt="Trade screenshot 2"
                                      className="w-20 h-20 object-cover rounded border border-gray-600"
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-4 w-full h-full overflow-y-auto" style={{ paddingTop: '80px', paddingBottom: '100px' }}>



                {/* Affichage du calendrier pour le canal calendrier */}
                {view === 'signals' && selectedChannel.id === 'calendrier' ? (
                  getTradingCalendar()
                ) : null}
                
                {/* Affichage des signaux */}
                {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss', '', 'calendrier'].includes(selectedChannel.id) ? (
                  <div className="space-y-4">
                    {/* Bouton Voir plus fixe en haut */}
                    <div className="flex justify-center pt-2 sticky top-0 bg-gray-900 p-2 rounded z-10">
                      <button
                        onClick={async () => {
                          try {
                            const currentSignals = signals.filter(s => s.channel_id === selectedChannel.id);
                            if (currentSignals.length > 0) {
                              // Trouver le timestamp du signal le plus ancien
                              const oldestSignal = currentSignals[currentSignals.length - 1]; // Le dernier dans l'ordre chronologique
                              const beforeTimestamp = new Date(oldestSignal.timestamp).getTime();
                              
                              console.log('🔍 Chargement de signaux plus anciens avant:', beforeTimestamp);
                              
                              // Charger 10 signaux plus anciens
                              const more = await getSignals(selectedChannel.id, 10, beforeTimestamp);
                              
                              if (more && more.length > 0) {
                                const formatted = more.map(signal => ({
                                  id: signal.id || '',
                                  type: signal.type,
                                  symbol: signal.symbol,
                                  timeframe: signal.timeframe,
                                  entry: signal.entry?.toString() || 'N/A',
                                  takeProfit: signal.takeProfit?.toString() || 'N/A',
                                  stopLoss: signal.stopLoss?.toString() || 'N/A',
                                  description: signal.description || '',
                                  image: null,
                                  timestamp: new Date(signal.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                  status: signal.status || 'ACTIVE' as const,
                                  channel_id: signal.channel_id,
                                  reactions: signal.reactions || [],
                                  pnl: signal.pnl,
                                  closeMessage: signal.closeMessage
                                }));
                                
                                // Filtrer les doublons avant d'ajouter
                                const existingIds = new Set(currentSignals.map(s => s.id));
                                const newSignals = formatted.filter(s => !existingIds.has(s.id));
                                
                                if (newSignals.length > 0) {
                                  setSignals(prev => [...prev, ...newSignals]);
                                  console.log(`✅ ${newSignals.length} nouveaux signaux ajoutés`);
                                } else {
                                  console.log('ℹ️ Aucun nouveau signal à ajouter');
                                }
                              } else {
                                console.log('ℹ️ Aucun signal plus ancien trouvé');
                              }
                            }
                          } catch (error) {
                            console.error('❌ Erreur lors du chargement de signaux supplémentaires:', error);
                          }
                        }}
                        className="px-4 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        Voir plus (+10)
                      </button>
                    </div>
                    {signals.filter(signal => signal.channel_id === selectedChannel.id).length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-sm">Aucun signal pour le moment</div>
                        <div className="text-gray-500 text-xs mt-1">Créez votre premier signal avec le bouton "+"</div>
                      </div>
                    ) : (
                      signals.filter(signal => signal.channel_id === selectedChannel.id).map((signal) => (
                        <div key={signal.id} className="flex items-start gap-3">
                          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                            {profileImage ? (
                              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              'TT'
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-white">TheTheTrader</span>
                              <span className="text-xs text-gray-400">{signal.timestamp}</span>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-w-2xl md:max-w-2xl max-w-full">
                              <div className="space-y-3">
                                {/* Header avec titre et indicateur */}
                                  <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${signal.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                  <h3 className="font-bold text-white text-lg">
                                    Signal {signal.type} {signal.symbol} – {signal.timeframe}
                                  </h3>
                                </div>
                                
                                {/* Détails du signal */}
                                <div className="space-y-2">
                                    {signal.entry !== 'N/A' && (
                                      <div className="flex items-center gap-2">
                                      <span className="text-blue-400 text-sm">🔹</span>
                                      <span className="text-white">Entrée : {signal.entry} USD</span>
                                      </div>
                                    )}
                                    {signal.stopLoss !== 'N/A' && (
                                      <div className="flex items-center gap-2">
                                      <span className="text-blue-400 text-sm">🔹</span>
                                      <span className="text-white">Stop Loss : {signal.stopLoss} USD</span>
                                      </div>
                                    )}
                                  {signal.takeProfit !== 'N/A' && (
                                      <div className="flex items-center gap-2">
                                      <span className="text-blue-400 text-sm">🔹</span>
                                      <span className="text-white">Take Profit : {signal.takeProfit} USD</span>
                                      </div>
                                    )}
                                  </div>
                                
                                {/* Ratio R:R */}
                                {signal.entry !== 'N/A' && signal.takeProfit !== 'N/A' && signal.stopLoss !== 'N/A' && (
                                  <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                    <span className="text-red-400 text-sm">🎯</span>
                                    <span className="text-white text-sm">
                                      Ratio R:R : ≈ {calculateRiskReward(signal.entry, signal.takeProfit, signal.stopLoss)}
                                    </span>
                                </div>
                                )}

                                {/* Message de fermeture */}
                                {signal.closeMessage && (
                                  <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                    <span className="text-yellow-400 text-sm">🔒</span>
                                    <span className="text-yellow-400 text-sm font-medium">
                                      {signal.closeMessage}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {signal.image && (
                              <div className="mt-2">
                                <img 
                                  src={URL.createObjectURL(signal.image)} 
                                  alt="Signal screenshot"
                                  className="max-w-full md:max-w-2xl rounded-lg border border-gray-600"
                                />
                              </div>
                            )}

                            {/* Boutons de statut supprimés - seul admin peut changer WIN/LOSS/BE */}


                          </div>
                        </div>
                      ))
                    )}
                  </div>
                                ) : false ? (
                  <div className="flex flex-col h-full">
                    {/* Interface Livestream */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
                      {/* Zone de stream */}
                      <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
                        {!isLiveStreaming ? (
                          <div className="h-full flex flex-col items-center justify-center p-8">
                            <div className="text-center space-y-4">
                              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                              <h2 className="text-xl font-bold text-white">Aucun stream en cours</h2>
                              <p className="text-gray-400">Commencez votre session de trading en direct</p>
                              
                              {/* Formulaire de démarrage */}
                              <div className="space-y-3 max-w-md mx-auto">
                                <input
                                  type="text"
                                  placeholder="Titre du stream (ex: Session TradingView - EURUSD)"
                                  value={streamTitle}
                                  onChange={(e) => setStreamTitle(e.target.value)}
                                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  placeholder="Description (optionnel)"
                                  value={streamDescription}
                                  onChange={(e) => setStreamDescription(e.target.value)}
                                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleStartStream}
                                    className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-medium"
                                  >
                                    🎥 Démarrer Stream
                                  </button>
                                  <button
                                    onClick={handleShareScreen}
                                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                                  >
                                    📺 Partager Écran
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col">
                            {/* Header du stream */}
                            <div className="bg-gray-800 p-4 border-b border-gray-700">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-bold text-white">{streamTitle}</h3>
                                  <p className="text-sm text-gray-400">{streamDescription}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 text-red-400">
                                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">EN DIRECT</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                    <span className="text-sm">{viewerCount} spectateurs</span>
                                  </div>
                                  <button
                                    onClick={handleStopStream}
                                    className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm text-white"
                                  >
                                    Arrêter
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Zone de vidéo */}
                            <div className="flex-1 bg-black flex items-center justify-center">
                              <div className="text-center text-gray-400">
                                <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                                  </svg>
                                </div>
                                <p className="text-sm">Stream en cours...</p>
                                <p className="text-xs mt-1">Partagez votre écran TradingView</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Chat live */}
                      <div className="w-full lg:w-80 bg-gray-800 rounded-lg flex flex-col">
                        <div className="p-4 border-b border-gray-700">
                          <h3 className="font-semibold text-white">💬 Chat Live</h3>
                          <p className="text-xs text-gray-400">{viewerCount} spectateurs en ligne</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {(messages[''] || []).length === 0 ? (
                        <div className="text-center py-8">
                              <div className="text-gray-400 text-sm">Aucun message</div>
                              <div className="text-gray-500 text-xs mt-1">Soyez le premier à commenter !</div>
                        </div>
                      ) : (
                            (messages[''] || []).map((message) => (
                              <div key={message.id} className="flex items-start gap-2">
                                <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-xs overflow-hidden">
                                  {message.author === 'TheTheTrader' && profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                  ) : (
                                    'T'
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white text-sm">{message.author}</span>
                                    <span className="text-xs text-gray-400">{message.timestamp}</span>
                                  </div>
                                  <div className="bg-gray-700 rounded-lg p-2">
                                    <p className="text-white text-sm">{message.text}</p>
                                  </div>
                                  
                                  {/* Bouton de réaction flamme */}
                                  <div className="mt-2 flex justify-start">
                                    <button
                                      onClick={() => handleAddReaction(message.id)}
                                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                        (messageReactions[message.id]?.users || []).includes(user?.email || 'Anonymous')
                                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                                      }`}
                                    >
                                      🔥
                                      <span className="text-xs">
                                        {messageReactions[message.id]?.fire || 0}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        {/* Barre de message pour le chat live */}
                        <div className="p-4 border-t border-gray-700">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder="Commenter le stream..."
                              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <button
                              onClick={handleSendMessage}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white text-sm"
                            >
                              Envoyer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : ['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss'].includes(selectedChannel.id) ? (
                  <div className="flex flex-col h-full">
                    {/* Messages de chat */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
                      {/* Cours Scalping pour le salon Fondamentaux */}
                      {selectedChannel.id === 'fondamentaux' && (
                        <div className="bg-gray-800 rounded-lg p-6 mb-6">
                          <div className="text-center mb-8 p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
                            <div className="flex justify-center mb-0">
                  <img 
                    src="/logo-removebg-preview.png" 
                    alt="Trading pour les nuls" 
                    className="h-48 w-auto object-cover"
                    style={{ clipPath: 'inset(10% 5% 15% 5%)' }}

                  />
                </div>
                            <p className="text-xl opacity-90 -mt-3">Guide complet des concepts fondamentaux et stratégies avancées</p>
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
                      
                      {(messages[selectedChannel.id] || []).length > 0 && (
                        (messages[selectedChannel.id] || []).map((message) => (
                          <div key={message.id} className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                              {message.author_avatar ? (
                                <img src={message.author_avatar} alt="Profile" className="w-full h-full object-cover" />
                              ) : message.author === 'Admin' ? (
                                'A'
                              ) : (
                                'TT'
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-white">{message.author}</span>
                                <span className="text-xs text-gray-400">{message.timestamp}</span>
                              </div>
                              <div className="bg-gray-700 rounded-lg p-3 hover:shadow-lg hover:shadow-gray-900/50 transition-shadow duration-200 max-w-full break-words">
                                {message.text && (
                                  <p className="text-white">
                                    {message.text.replace(/\[SIGNAL_ID:[^\]]+\]/g, '')}
                                  </p>
                                )}
                                
                                {/* Boutons WIN/LOSS/BE pour les messages de signal (lecture seule côté utilisateur) */}
                                {message.text.includes('[SIGNAL_ID:') && (() => {
                                  // Extraire l'ID du signal pour vérifier son statut
                                  const signalIdMatch = message.text.match(/\[SIGNAL_ID:([^\]]+)\]/);
                                  const signalId = signalIdMatch ? signalIdMatch[1] : '';
                                  const currentSignal = signals.find(s => s.id === signalId);
                                  const isClosed = currentSignal && ['WIN', 'LOSS', 'BE'].includes(currentSignal.status);
                                  
                                  return (
                                    <div className="mt-3 pt-3 border-t border-gray-600">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Résultat du signal:</span>
                                        <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                          isClosed && currentSignal?.status === 'WIN'
                                            ? 'bg-green-500 text-white border-2 border-green-400 shadow-lg' // Bouton WIN actif
                                            : isClosed && currentSignal?.status === 'LOSS'
                                            ? 'bg-red-500 text-white border-2 border-red-400 shadow-lg' // Bouton LOSS actif
                                            : isClosed && currentSignal?.status === 'BE'
                                            ? 'bg-blue-500 text-white border-2 border-blue-400 shadow-lg' // Bouton BE actif
                                            : 'bg-gray-500/30 text-gray-400 border border-gray-500/30' // Bouton neutre
                                        }`}>
                                          {isClosed && currentSignal?.status === 'WIN' ? '🟢 WIN' :
                                           isClosed && currentSignal?.status === 'LOSS' ? '🔴 LOSS' :
                                           isClosed && currentSignal?.status === 'BE' ? '🔵 BE' : '⏳ EN ATTENTE'}
                                        </div>
                                      </div>
                                      {isClosed && (
                                        <div className="mt-2 text-xs text-gray-400">
                                          Signal fermé avec {currentSignal?.pnl ? `P&L: ${currentSignal.pnl}` : 'aucun P&L'}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                                
                                {message.attachment_data && (
                                  <div className="mt-2">
                                    <div className="relative">
                                      <img 
                                        src={message.attachment_data} 
                                        alt="Attachment"
                                        className="mt-2 w-full h-48 md:h-64 object-cover rounded-lg border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setSelectedImage(message.attachment_data)}
                                      />
                                      <div className="text-xs text-gray-400 mt-1">Cliquez pour agrandir</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Bouton de réaction flamme */}
                              <div className="mt-2 flex justify-start">
                                <button
                                  onClick={() => handleAddReaction(message.id)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                    (messageReactions[message.id]?.users || []).includes(user?.email || 'Anonymous')
                                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                                  }`}
                                >
                                  🔥
                                  <span className="text-xs">
                                    {messageReactions[message.id]?.fire || 0}
                                  </span>
                                </button>
                              </div>

                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Barre de message */}
                    <div className="border-t border-gray-700 p-4 fixed bottom-0 left-0 right-0 bg-gray-800 z-30 md:left-64">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Tapez votre message..."
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            onChange={handleFileUpload}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx"
                          />
                          <span className="bg-gray-600 hover:bg-gray-500 p-2 rounded-lg text-gray-300 hover:text-white">
                            📎
                          </span>
                        </label>
                        <button
                          onClick={handleSendMessage}
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : false ? (
                  <div className="flex flex-col h-full">
                    {/* Interface Livestream Desktop */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
                      {/* Zone de stream */}
                      <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
                        {!isLiveStreaming ? (
                          <div className="h-full flex flex-col items-center justify-center p-8">
                            <div className="text-center space-y-4">
                              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                              <h2 className="text-xl font-bold text-white">Aucun stream en cours</h2>
                              <p className="text-gray-400">Commencez votre session de trading en direct</p>
                              
                              {/* Formulaire de démarrage */}
                              <div className="space-y-3 max-w-md mx-auto">
                                <input
                                  type="text"
                                  placeholder="Titre du stream (ex: Session TradingView - EURUSD)"
                                  value={streamTitle}
                                  onChange={(e) => setStreamTitle(e.target.value)}
                                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                />
                                <textarea
                                  placeholder="Description (optionnel)"
                                  value={streamDescription}
                                  onChange={(e) => setStreamDescription(e.target.value)}
                                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleStartStream}
                                    className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-medium"
                                  >
                                    🎥 Démarrer Stream
                                  </button>
                                  <button
                                    onClick={handleShareScreen}
                                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                                  >
                                    📺 Partager Écran
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex flex-col">
                            {/* Header du stream */}
                            <div className="bg-gray-800 p-4 border-b border-gray-700">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg font-bold text-white">{streamTitle}</h3>
                                  <p className="text-sm text-gray-400">{streamDescription}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 text-red-400">
                                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">EN DIRECT</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                    <span className="text-sm">{viewerCount} spectateurs</span>
                                  </div>
                                  <button
                                    onClick={handleStopStream}
                                    className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm text-white"
                                  >
                                    Arrêter
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Zone de vidéo */}
                            <div className="flex-1 bg-black flex items-center justify-center">
                              <div className="text-center text-gray-400">
                                <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                                  </svg>
                                </div>
                                <p className="text-sm">Stream en cours...</p>
                                <p className="text-xs mt-1">Partagez votre écran TradingView</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Chat live */}
                      <div className="w-full lg:w-80 bg-gray-800 rounded-lg flex flex-col">
                        <div className="p-4 border-b border-gray-700">
                          <h3 className="font-semibold text-white">💬 Chat Live</h3>
                          <p className="text-xs text-gray-400">{viewerCount} spectateurs en ligne</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                          {(messages[''] || []).length === 0 ? (
                            <div className="text-center py-8">
                              <div className="text-gray-400 text-sm">Aucun message</div>
                              <div className="text-gray-500 text-xs mt-1">Soyez le premier à commenter !</div>
                            </div>
                          ) : (
                            (messages[''] || []).map((message) => (
                              <div key={message.id} className="flex items-start gap-2">
                                <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-xs overflow-hidden">
                                  {message.author === 'TheTheTrader' && profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                  ) : (
                                    'T'
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white text-sm">{message.author}</span>
                                    <span className="text-xs text-gray-400">{message.timestamp}</span>
                                  </div>
                                  <div className="bg-gray-700 rounded-lg p-2">
                                    <p className="text-white text-sm">{message.text}</p>
                                  </div>
                                </div>
                                
                                {/* Bouton de réaction flamme pour les messages (en dehors du conteneur gris) */}
                                <div className="mt-2 flex justify-start">
                                  <button
                                    onClick={() => handleAddReaction(message.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                      (messageReactions[message.id]?.users || []).includes(user?.email || 'Anonymous')
                                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                                    }`}
                                  >
                                    🔥
                                    <span className="text-xs">
                                      {messageReactions[message.id]?.fire || 0}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        {/* Barre de message pour le chat live */}
                        <div className="p-4 border-t border-gray-700">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={chatMessage}
                              onChange={(e) => setChatMessage(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                              placeholder="Commenter le stream..."
                              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <button
                              onClick={handleSendMessage}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white text-sm"
                            >
                              Envoyer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Content Area */}
        <div className="hidden md:block flex-1 overflow-y-auto overflow-x-hidden">
          {(view === 'calendar' || selectedChannel.id === 'trading-journal') ? (
            getTradingCalendar()
          ) : (
            <div className="p-4 md:p-6 space-y-4 w-full" style={{ paddingTop: '80px' }}>
              {/* Bouton + Signal supprimé - seul admin peut créer des signaux */}

              {/* Affichage du calendrier pour le canal calendrier */}
              {view === 'signals' && selectedChannel.id === 'calendrier' ? (
                getTradingCalendar()
              ) : null}
              
              {/* Affichage des signaux */}
                              {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss', '', 'calendrier'].includes(selectedChannel.id) ? (
                <div className="space-y-4">
                  {signals.filter(signal => signal.channel_id === selectedChannel.id).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-sm">Aucun signal pour le moment</div>
                      <div className="text-gray-500 text-xs mt-1">Créez votre premier signal avec le bouton "+"</div>
                    </div>
                  ) : (
                    signals.filter(signal => signal.channel_id === selectedChannel.id).map((signal) => (
                      <div key={signal.id} className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                          {profileImage ? (
                            <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            'TT'
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">TheTheTrader</span>
                            <span className="text-xs text-gray-400">{signal.timestamp}</span>
                          </div>

                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-w-full md:max-w-2xl">
                            <div className="space-y-3">
                              {/* Header avec titre et indicateur */}
                                <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${signal.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                <h3 className="font-bold text-white text-lg">
                                  Signal {signal.type} {signal.symbol} – {signal.timeframe}
                                </h3>
                              </div>
                              
                              {/* Détails du signal */}
                              <div className="space-y-2">
                                  {signal.entry !== 'N/A' && (
                                    <div className="flex items-center gap-2">
                                    <span className="text-blue-400 text-sm">🔹</span>
                                    <span className="text-white">Entrée : {signal.entry} USD</span>
                                    </div>
                                  )}
                                  {signal.stopLoss !== 'N/A' && (
                                    <div className="flex items-center gap-2">
                                    <span className="text-blue-400 text-sm">🔹</span>
                                    <span className="text-white">Stop Loss : {signal.stopLoss} USD</span>
                                    </div>
                                  )}
                                {signal.takeProfit !== 'N/A' && (
                                    <div className="flex items-center gap-2">
                                    <span className="text-blue-400 text-sm">🔹</span>
                                    <span className="text-white">Take Profit : {signal.takeProfit} USD</span>
                                    </div>
                                  )}
                                </div>
                              
                              {/* Ratio R:R */}
                              {signal.entry !== 'N/A' && signal.takeProfit !== 'N/A' && signal.stopLoss !== 'N/A' && (
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                  <span className="text-red-400 text-sm">🎯</span>
                                  <span className="text-white text-sm">
                                    Ratio R:R : ≈ {calculateRiskReward(signal.entry, signal.takeProfit, signal.stopLoss)}
                                  </span>
                              </div>
                              )}

                              {/* Message de fermeture */}
                              {signal.closeMessage && (
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                                  <span className="text-yellow-400 text-sm">🔒</span>
                                  <span className="text-yellow-400 text-sm font-medium">
                                    {signal.closeMessage}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {signal.image && (
                            <div className="mt-2">
                              <img 
                                src={URL.createObjectURL(signal.image)} 
                                alt="Signal screenshot"
                                className="max-w-full md:max-w-2xl rounded-lg border border-gray-600"
                              />
                            </div>
                          )}

                          {/* Boutons de statut supprimés - seul admin peut changer WIN/LOSS/BE */}


                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : false ? (
                <div className="flex flex-col h-full">
                  {/* Interface Livestream Desktop */}
                  <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
                    {/* Zone de stream */}
                    <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
                      {!isLiveStreaming ? (
                        <div className="h-full flex flex-col items-center justify-center p-8">
                          <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white">Aucun stream en cours</h2>
                            <p className="text-gray-400">Commencez votre session de trading en direct</p>
                            
                            {/* Formulaire de démarrage */}
                            <div className="space-y-3 max-w-md mx-auto">
                              <input
                                type="text"
                                placeholder="Titre du stream (ex: Session TradingView - EURUSD)"
                                value={streamTitle}
                                onChange={(e) => setStreamTitle(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                              />
                              <textarea
                                placeholder="Description (optionnel)"
                                value={streamDescription}
                                onChange={(e) => setStreamDescription(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleStartStream}
                                  className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white font-medium"
                                >
                                  🎥 Démarrer Stream
                                </button>
                                <button
                                  onClick={handleShareScreen}
                                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                                >
                                  📺 Partager Écran
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col">
                          {/* Header du stream */}
                          <div className="bg-gray-800 p-4 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-bold text-white">{streamTitle}</h3>
                                <p className="text-sm text-gray-400">{streamDescription}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-red-400">
                                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                                  <span className="text-sm font-medium">EN DIRECT</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                  </svg>
                                  <span className="text-sm">{viewerCount} spectateurs</span>
                                </div>
                                <button
                                  onClick={handleStopStream}
                                  className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm text-white"
                                >
                                  Arrêter
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {/* Zone de vidéo */}
                          <div className="flex-1 bg-black flex items-center justify-center">
                            <div className="text-center text-gray-400">
                              <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                                </svg>
                              </div>
                              <p className="text-sm">Stream en cours...</p>
                              <p className="text-xs mt-1">Partagez votre écran TradingView</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Chat live */}
                    <div className="w-full lg:w-80 bg-gray-800 rounded-lg flex flex-col">
                      <div className="p-4 border-b border-gray-700">
                        <h3 className="font-semibold text-white">💬 Chat Live</h3>
                        <p className="text-xs text-gray-400">{viewerCount} spectateurs en ligne</p>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {(messages[''] || []).length === 0 ? (
                      <div className="text-center py-8">
                            <div className="text-gray-400 text-sm">Aucun message</div>
                            <div className="text-gray-500 text-xs mt-1">Soyez le premier à commenter !</div>
                      </div>
                    ) : (
                          (messages[''] || []).map((message) => (
                            <div key={message.id} className="flex items-start gap-2">
                              <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-xs overflow-hidden">
                                {message.author_avatar ? (
                                  <img src={message.author_avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : message.author === 'Admin' ? (
                                  'A'
                                ) : (
                                  'T'
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-white text-sm">{message.author}</span>
                                  <span className="text-xs text-gray-400">{message.timestamp}</span>
                                </div>
                                <div className="bg-gray-700 rounded-lg p-2">
                                  <p className="text-white text-sm">{message.text}</p>
                                  
                                  {/* Bouton de réaction flamme pour les messages */}
                                  <div className="mt-2 pt-2 border-t border-gray-600">
                                    <button
                                      onClick={() => handleAddReaction(message.id)}
                                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                        (messageReactions[message.id]?.users || []).includes(user?.email || 'Anonymous')
                                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                                          : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                                      }`}
                                    >
                                      🔥
                                      <span className="text-xs">
                                        {messageReactions[message.id]?.fire || 0}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Barre de message pour le chat live */}
                      <div className="p-4 border-t border-gray-700">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Commenter le stream..."
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                          />
                          <button
                            onClick={handleSendMessage}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white text-sm"
                          >
                            Envoyer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : ['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss'].includes(selectedChannel.id) ? (
                <div className="flex flex-col h-full">
                  {/* Messages de chat */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
                    {/* Bouton Voir plus pour les salons de chat */}
                    {['general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss'].includes(selectedChannel.id) && (messages[selectedChannel.id] || []).length >= 20 && (
                      <div className="flex justify-center pt-2 sticky top-0 bg-gray-900 p-2 rounded z-10">
                        <button
                          onClick={async () => {
                            const more = await getMessages(selectedChannel.id);
                            // Pour les canaux de chat, garder l'ordre chronologique (plus récents en bas)
                            // Pour les autres canaux, inverser l'ordre
                            const orderedMessages = ['general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss'].includes(selectedChannel.id) ? more : more.reverse();
                            
                            const formatted = orderedMessages.map(msg => ({
                              id: msg.id || '',
                              text: msg.content,
                              timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                              author: msg.author,
                              author_avatar: msg.author_avatar,
                              attachment: undefined,
                              attachment_data: msg.attachment_data
                            }));
                            
                            setMessages(prev => ({
                              ...prev,
                              [selectedChannel.id]: formatted.map(msg => ({
                                id: msg.id,
                                text: msg.text,
                                user: msg.author,
                                author: msg.author,
                                author_avatar: msg.author_avatar,
                                timestamp: msg.timestamp,
                                attachment_data: msg.attachment_data
                              }))
                            }));
                          }}
                          className="px-4 py-2 text-sm rounded bg-gray-700 hover:bg-gray-600 text-white"
                        >
                          Voir plus de messages
                        </button>
                      </div>
                    )}
                    {(messages[selectedChannel.id] || []).length > 0 && (
                      (messages[selectedChannel.id] || []).map((message) => (
                        <div key={message.id} className="flex items-start gap-3">
                          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                            {message.author_avatar ? (
                              <img src={message.author_avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : message.author === 'Admin' ? (
                              'A'
                            ) : (
                              'TT'
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{message.author}</span>
                              <span className="text-xs text-gray-400">{message.timestamp}</span>
                            </div>
                            <div className="bg-gray-700 rounded-lg p-3 hover:shadow-lg hover:shadow-gray-900/50 transition-shadow duration-200 max-w-full break-words">
                                {message.text && (
                                  <p className="text-white">
                                    {message.text.replace(/\[SIGNAL_ID:[^\]]+\]/g, '')}
                                  </p>
                                )}
                                
                                {message.attachment_data && (
                                  <div className="mt-2">
                                    <div className="relative">
                                      <img 
                                        src={message.attachment_data} 
                                        alt="Attachment"
                                        className="mt-2 w-full h-48 md:h-64 object-cover rounded-lg border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setSelectedImage(message.attachment_data)}
                                      />
                                      <div className="text-xs text-gray-400 mt-1">Cliquez pour agrandir</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Bouton de réaction flamme */}
                              <div className="mt-2 flex justify-start">
                                <button
                                  onClick={() => handleAddReaction(message.id)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                                    (messageReactions[message.id]?.users || []).includes(user?.email || 'Anonymous')
                                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'
                                  }`}
                                >
                                  🔥
                                  <span className="text-xs">
                                    {messageReactions[message.id]?.fire || 0}
                                  </span>
                                </button>
                              </div>

                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Barre de message */}
                  <div className="border-t border-gray-700 p-4 fixed bottom-0 left-0 right-0 bg-gray-800 z-10 md:left-64 md:right-0">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Tapez votre message..."
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      />
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          onChange={handleFileUpload}
                          className="hidden"
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        <span className="bg-gray-600 hover:bg-gray-500 p-2 rounded-lg text-gray-300 hover:text-white">
                          📎
                        </span>
                      </label>
                      <button
                        onClick={handleSendMessage}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Modal de création de signal */}
      {/* Modal de signal supprimée - seul admin peut créer des signaux */}

      {/* Modal pour ajouter un trade */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Ajouter un trade</h2>
                <button 
                  onClick={() => setShowTradeModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Zone de collage TradingView */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">📋 Coller données TradingView</label>
                  <div
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 min-h-[80px] flex items-center justify-center cursor-pointer"
                    onPaste={handleTradingViewPasteTrade}
                    onDrop={(e) => {
                      e.preventDefault();
                      const text = e.dataTransfer.getData('text');
                      if (text) {
                        const fakeEvent = {
                          preventDefault: () => {},
                          clipboardData: {
                            getData: (type: string) => {
                              if (type === 'text/html') return '';
                              if (type === 'text') return text;
                              return '';
                            }
                          }
                        } as React.ClipboardEvent<HTMLDivElement>;
                        handleTradingViewPasteTrade(fakeEvent);
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div className="text-center">
                      <div className="text-gray-400 mb-1">📋 Cliquez ici et collez (Ctrl+V)</div>
                      <div className="text-xs text-gray-500">ou glissez-déposez du texte</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Collez directement depuis TradingView</p>
                </div>

                {/* Type de trade */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTradeData({...tradeData, type: 'BUY'})}
                      className={`px-3 py-2 rounded text-sm ${tradeData.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      📈 BUY
                    </button>
                    <button
                      onClick={() => setTradeData({...tradeData, type: 'SELL'})}
                      className={`px-3 py-2 rounded text-sm ${tradeData.type === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      📉 SELL
                    </button>
                  </div>
                </div>

                {/* Symbol */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Symbole *</label>
                  <input
                    type="text"
                    value={tradeData.symbol}
                    onChange={(e) => setTradeData({...tradeData, symbol: e.target.value})}
                    placeholder="BTC, ETH, NQ1!, etc."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Entry */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prix d'entrée *</label>
                  <input
                    type="text"
                    value={tradeData.entry}
                    onChange={(e) => setTradeData({...tradeData, entry: e.target.value})}
                    placeholder="45000"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Exit */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prix de sortie *</label>
                  <input
                    type="text"
                    value={tradeData.exit}
                    onChange={(e) => setTradeData({...tradeData, exit: e.target.value})}
                    placeholder="46000"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Stop Loss */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss</label>
                  <input
                    type="text"
                    value={tradeData.stopLoss}
                    onChange={(e) => setTradeData({...tradeData, stopLoss: e.target.value})}
                    placeholder="44000"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* PnL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">P&L *</label>
                  <input
                    type="text"
                    value={tradeData.pnl}
                    onChange={(e) => setTradeData({...tradeData, pnl: e.target.value})}
                    placeholder="+500 ou -200"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Résultat</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTradeData({...tradeData, status: 'WIN'})}
                      className={`px-3 py-2 rounded text-sm ${tradeData.status === 'WIN' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      ✅ WIN
                    </button>
                    <button
                      onClick={() => setTradeData({...tradeData, status: 'LOSS'})}
                      className={`px-3 py-2 rounded text-sm ${tradeData.status === 'LOSS' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      ❌ LOSS
                    </button>
                    <button
                      onClick={() => setTradeData({...tradeData, status: 'BE'})}
                      className={`px-3 py-2 rounded text-sm ${tradeData.status === 'BE' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      ⚖️ BE
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={tradeData.notes}
                    onChange={(e) => setTradeData({...tradeData, notes: e.target.value})}
                    placeholder="Notes sur le trade..."
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>
                
                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Image 1</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setTradeData({...tradeData, image1: file});
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Image 2</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setTradeData({...tradeData, image2: file});
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
               
                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowTradeModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleTradeSubmit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
                  >
                    Ajouter le trade
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des Trades */}
      {showTradesModal && selectedTradesDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  Trades du {selectedTradesDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
                <button
                  onClick={() => setShowTradesModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {getTradesForDate(selectedTradesDate).map((trade) => (
                  <div key={trade.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          trade.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {trade.type}
                        </span>
                        <span className="text-lg font-bold text-white">{trade.symbol}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${
                          (trade.pnl && parseFloat(trade.pnl) >= 0) ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {(trade.pnl && parseFloat(trade.pnl) >= 0) ? '+' : ''}{trade.pnl || '0'}$
                        </span>
                        <button
                          onClick={() => {
                            setPersonalTrades(prev => prev.filter(t => t.id !== trade.id));
                            setShowTradesModal(false);
                          }}
                          className="text-red-400 hover:text-red-300 text-xl font-bold"
                          title="Supprimer ce trade"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <span className="text-sm text-gray-400">Entry:</span>
                        <span className="text-white ml-2">{trade.entry}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Exit:</span>
                        <span className="text-white ml-2">{trade.exit}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Stop Loss:</span>
                        <span className="text-white ml-2">{trade.stopLoss}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          trade.status === 'WIN' ? 'bg-green-600 text-white' :
                          trade.status === 'LOSS' ? 'bg-red-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {trade.status}
                        </span>
                      </div>
                    </div>

                    {trade.notes && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-400">Notes:</span>
                        <p className="text-white mt-1">{trade.notes}</p>
                      </div>
                    )}

                    {/* Images */}
                    {(trade.image1 || trade.image2) && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-400">Images:</span>
                        <div className="flex gap-2 mt-2">
                          {trade.image1 && (
                            <div className="relative">
                              <img 
                                src={trade.image1 instanceof File ? URL.createObjectURL(trade.image1) : trade.image1} 
                                alt="Trade image 1" 
                                className="w-20 h-20 object-cover rounded border border-gray-600"
                              />
                            </div>
                          )}
                          {trade.image2 && (
                            <div className="relative">
                              <img 
                                src={trade.image2 instanceof File ? URL.createObjectURL(trade.image2) : trade.image2} 
                                alt="Trade image 2" 
                                className="w-20 h-20 object-cover rounded border border-gray-600"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Ajouté le {trade.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-600">
                <button
                  onClick={() => setShowTradesModal(false)}
                  className="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal des Signaux */}
      {showSignalsModal && selectedSignalsDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {selectedChannel.id === 'trading-journal' ? 'Trades du' : 'Signaux du'} {selectedSignalsDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h2>
                <button
                  onClick={() => setShowSignalsModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {(selectedChannel.id === 'trading-journal' ? 
                  getTradesForDate(selectedSignalsDate).length > 0 : 
                  getSignalsForDate(selectedSignalsDate).length > 0) ? (
                  (() => {
                    const signals = selectedChannel.id === 'trading-journal' ? 
                      getTradesForDate(selectedSignalsDate) : 
                      getSignalsForDate(selectedSignalsDate);
                    console.log('🔍 [POPUP] Données reçues dans le popup:', signals);
                    signals.forEach(signal => {
                      console.log('🔍 [POPUP] Signal individuel COMPLET:', {
                        id: signal.id,
                        symbol: signal.symbol,
                        image: signal.image,
                        attachment_data: signal.attachment_data,
                        attachment_type: signal.attachment_type,
                        attachment_name: signal.attachment_name,
                        status: signal.status,
                        timestamp: signal.timestamp,
                        ALL_KEYS: Object.keys(signal)
                      });
                    });
                    
                    return signals.map((signal) => (
                      <div key={signal.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              signal.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {signal.type}
                            </span>
                            <span className="text-lg font-bold text-white">{signal.symbol}</span>
                            <span className="text-sm text-gray-400">{signal.timeframe}</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            signal.status === 'WIN' ? 'bg-green-600 text-white' :
                            signal.status === 'LOSS' ? 'bg-red-600 text-white' :
                            signal.status === 'BE' ? 'bg-blue-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {signal.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <span className="text-sm text-gray-400">Entry:</span>
                            <span className="text-white ml-2">{signal.entry}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-400">Take Profit:</span>
                            <span className="text-white ml-2">{signal.takeProfit}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-400">Stop Loss:</span>
                            <span className="text-white ml-2">{signal.stopLoss}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-400">PnL:</span>
                            <span className={`ml-2 font-bold ${
                              signal.pnl && signal.pnl.includes('-') ? 'text-red-400' : 'text-green-400'
                            }`}>
                              {signal.pnl || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Affichage des images */}
                        {(signal.image || signal.attachment_data) && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-400">Images:</span>
                            <div className="flex gap-2 mt-2">
                              {signal.image && (
                                <img 
                                  src={typeof signal.image === 'string' ? signal.image : URL.createObjectURL(signal.image)}
                                  alt="Signal image"
                                  className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                  onClick={() => setSelectedImage(typeof signal.image === 'string' ? signal.image : URL.createObjectURL(signal.image))}
                                />
                              )}
                              {signal.attachment_data && (
                                <img 
                                  src={signal.attachment_data}
                                  alt="Signal attachment"
                                  className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                  onClick={() => setSelectedImage(signal.attachment_data)}
                                />
                              )}
                            </div>
                          </div>
                        )}


                      </div>
                    ));
                  })()
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-lg mb-2">📅</div>
                    <div className="text-gray-300 text-lg font-medium">
                      {selectedChannel.id === 'trading-journal' ? 'Aucun trade pour ce jour' : 'Aucun signal pour ce jour'}
                    </div>
                    <div className="text-gray-500 text-sm mt-1">
                      {selectedChannel.id === 'trading-journal' ? 
                        'Ajoute tes trades avec le bouton "+" pour les voir ici' : 
                        'Les signaux apparaîtront ici quand ils seront créés'}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-600">
                <button
                  onClick={() => setShowSignalsModal(false)}
                  className="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Semaine */}
      {showWeekSignalsModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Signaux de la Semaine {selectedWeek}
                </h2>
                <button
                  onClick={() => setShowWeekSignalsModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {getSignalsForWeek(selectedWeek).length > 0 ? (
                  getSignalsForWeek(selectedWeek).map((signal) => (
                    <div key={signal.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            signal.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {signal.type}
                          </span>
                          <span className="text-lg font-bold text-white">{signal.symbol}</span>
                          <span className="text-sm text-gray-400">{signal.timeframe}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          signal.status === 'WIN' ? 'bg-green-600 text-white' :
                          signal.status === 'LOSS' ? 'bg-red-600 text-white' :
                          signal.status === 'BE' ? 'bg-blue-600 text-white' :
                          'bg-yellow-600 text-white'
                        }`}>
                          {signal.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-sm text-gray-400">Entry:</span>
                          <span className="text-white ml-2">{signal.entry}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Take Profit:</span>
                          <span className="text-white ml-2">{signal.takeProfit}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Stop Loss:</span>
                          <span className="text-white ml-2">{signal.stopLoss}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">PnL:</span>
                          <span className={`ml-2 font-bold ${
                            signal.pnl && signal.pnl.includes('-') ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {signal.pnl || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Affichage des images */}
                      {(signal.image || signal.attachment_data) && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-400">Images:</span>
                          <div className="flex gap-2 mt-2">
                            {signal.image && (
                              <img 
                                src={typeof signal.image === 'string' ? signal.image : URL.createObjectURL(signal.image)}
                                alt="Signal image"
                                className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                onClick={() => setSelectedImage(typeof signal.image === 'string' ? signal.image : URL.createObjectURL(signal.image))}
                              />
                            )}
                            {signal.attachment_data && (
                              <img 
                                src={signal.attachment_data}
                                alt="Signal attachment"
                                className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                onClick={() => setSelectedImage(signal.attachment_data)}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-lg mb-2">📅</div>
                    <div className="text-gray-300 text-lg font-medium">Aucun signal pour cette semaine</div>
                    <div className="text-gray-500 text-sm mt-1">Les signaux apparaîtront ici quand ils seront créés</div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-600">
                <button
                  onClick={() => setShowWeekSignalsModal(false)}
                  className="w-full bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup Image */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="Image agrandie"
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
                