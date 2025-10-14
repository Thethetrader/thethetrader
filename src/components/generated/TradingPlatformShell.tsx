import React, { useState, useEffect, useRef } from 'react';
import { getMessages, getSignals, subscribeToMessages, addMessage, uploadImage, addSignal, subscribeToSignals, updateMessageReactions, getMessageReactions, subscribeToMessageReactions, Signal, syncUserId } from '../../utils/firebase-setup';
import { addPersonalTrade, getPersonalTrades, deletePersonalTrade, PersonalTrade, listenToPersonalTrades } from '../../lib/supabase';
import ProfitLoss from '../ProfitLoss';
import { createClient } from '@supabase/supabase-js';
import { initializeNotifications, notifyNewSignal, notifySignalClosed, areNotificationsAvailable, requestNotificationPermission, sendLocalNotification } from '../../utils/push-notifications';

import { syncProfileImage, getProfileImage, initializeProfile } from '../../utils/profile-manager';
import { updateUserProfile, getUserProfile, getUserProfileByType } from '../../lib/supabase';
import { useStatsSync } from '../../hooks/useStatsSync';
import { useCalendarSync } from '../../hooks/useCalendarSync';
import RumbleTalk from '../RumbleTalk';

// Configuration Supabase
const supabaseUrl = 'https://bamwcozzfshuozsfmjah.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhbXdjb3p6ZnNodW96c2ZtamFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDM0ODcsImV4cCI6MjA2NTY3OTQ4N30.NWSUKoYLl0oGS-dXf4jhtmLRiSuBSk-0lV3NRHJLvrs';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TradingPlatformShell() {
  console.log('🚀 TradingPlatformShell chargé !');
  
  // Hook pour les stats en temps réel synchronisées avec l'admin
  const { stats, allSignalsForStats: realTimeSignals, getWeeklyBreakdown: getCalendarWeeklyBreakdown, getTodaySignals: getCalendarTodaySignals, getThisMonthSignals: getCalendarThisMonthSignals } = useStatsSync();
  
  // Hook pour la synchronisation du calendrier
  const { calendarStats, getMonthlyStats: getCalendarMonthlyStats, getWeeklyBreakdown: getCalendarWeeklyBreakdownFromHook } = useCalendarSync();
  
  // Définition des channels
  const channels = [
    { id: 'fondamentaux', name: 'fondamentaux', emoji: '📚', fullName: 'Fondamentaux' },
    { id: 'letsgooo-model', name: 'letsgooo-model', emoji: '🚀', fullName: 'Letsgooo-model' },
    { id: 'general-chat-2', name: 'general-chat-2', emoji: '📈', fullName: 'Indices' },
    { id: 'general-chat-3', name: 'general-chat-3', emoji: '🪙', fullName: 'Crypto' },
    { id: 'general-chat-4', name: 'general-chat-4', emoji: '💱', fullName: 'Forex' },
    { id: 'video', name: 'video', emoji: '📺', fullName: 'Livestream' },
    { id: 'journal', name: 'journal', emoji: '📓', fullName: 'Journal Perso' },
    { id: 'trading-journal', name: 'trading-journal', emoji: '📓', fullName: 'Journal Perso' },
    { id: 'calendrier', name: 'calendrier', emoji: '📅', fullName: 'Journal Signaux' }
  ];
  
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
        
            // Notifications désactivées sur PWA
            console.log('🔇 Notifications désactivées sur PWA');
      }
    });

    // Écouter les changements d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Nettoyer les anciennes données si c'est un nouvel utilisateur
        if (event === 'SIGNED_IN') {
          console.log('🔄 Nouvel utilisateur connecté, nettoyage des données...');
          setCurrentUsername('');
          setSupabaseProfile(null);
          setMessages({});
          setMessageReactions({});
          
        // Notifications désactivées sur PWA
        console.log('🔇 Notifications désactivées sur PWA après connexion');
          
          // Nettoyer les anciennes clés localStorage des autres utilisateurs
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('userUsername_') && !key.endsWith(`_${session.user.id}`)) {
              localStorage.removeItem(key);
              console.log('🧹 Ancienne clé localStorage supprimée:', key);
            }
          });
        }
        
        setUser({ 
          id: session.user.id, 
          email: session.user.email || '' 
        });
      } else {
        setUser(null);
        // Nettoyer les états quand l'utilisateur se déconnecte
        setCurrentUsername('');
        setSupabaseProfile(null);
        setMessages({});
        setMessageReactions({});
        console.log('🧹 États utilisateur nettoyés après déconnexion');
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
  
  // Système de notifications pour les messages non lus
  const [lastReadTimes, setLastReadTimes] = useState({});

  // État pour les messages non lus par salon
  const [unreadCounts, setUnreadCounts] = useState<{[channelId: string]: number}>({});

  // Fonction callback pour recevoir les changements de messages non lus
  const handleUnreadCountChange = (channelId: string, count: number) => {
    console.log('📊 TradingPlatformShell: Received unread count for', channelId, ':', count);
    setUnreadCounts(prev => ({
      ...prev,
      [channelId]: count
    }));
  };

  const [selectedChannel, setSelectedChannel] = useState({ id: 'general-chat', name: 'general-chat' });

  const [view, setView] = useState<'signals' | 'calendar'>('signals');
  const [mobileView, setMobileView] = useState<'channels' | 'content'>('channels');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{[channelId: string]: Array<{id: string, text: string, user: string, timestamp: string, file?: File}>}>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Charger Tawk.to au montage de TradingPlatformShell
  useEffect(() => {
    console.log('💬 Chargement Tawk.to pour utilisateur...');
    
    // Vérifier si déjà chargé
    if (document.getElementById('tawkto-user-script')) {
      console.log('⚠️ Tawk.to déjà chargé');
      return;
    }

    // Initialiser Tawk_API
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    // Créer le script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://embed.tawk.to/68ec2d91af8498194f4f9fc1/1j7d940jh';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    script.id = 'tawkto-user-script';
    
    script.onload = () => {
      console.log('✅ Tawk.to chargé pour utilisateur');
    };
    
    script.onerror = () => {
      console.error('❌ Erreur chargement Tawk.to');
    };

    document.head.appendChild(script);
    
    return () => {
      // Cleanup si besoin
      const scriptElement = document.getElementById('tawkto-user-script');
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, []);

  // Charger les comptes depuis localStorage
  useEffect(() => {
    const savedAccounts = localStorage.getItem('tradingAccounts');
    if (savedAccounts) {
      const accounts = JSON.parse(savedAccounts);
      setTradingAccounts(accounts);
      setSelectedAccount(accounts[0] || 'Compte Principal');
    }
  }, []);

  // Sauvegarder les comptes dans localStorage
  const saveAccounts = (accounts: string[]) => {
    localStorage.setItem('tradingAccounts', JSON.stringify(accounts));
    setTradingAccounts(accounts);
  };

  // Ajouter un nouveau compte
  const handleAddAccount = () => {
    if (newAccountName.trim() && !tradingAccounts.includes(newAccountName.trim())) {
      const updatedAccounts = [...tradingAccounts, newAccountName.trim()];
      saveAccounts(updatedAccounts);
      setSelectedAccount(newAccountName.trim());
      setNewAccountName('');
      setShowAddAccountModal(false);
    }
  };

  // Changer de compte
  const handleAccountChange = (account: string) => {
    setSelectedAccount(account);
  };

  // Supprimer un compte
  const handleDeleteAccount = (accountToDelete: string) => {
    if (accountToDelete === 'Compte Principal') return; // Ne pas supprimer le compte principal
    
    const updatedAccounts = tradingAccounts.filter(account => account !== accountToDelete);
    saveAccounts(updatedAccounts);
    
    if (selectedAccount === accountToDelete) {
      setSelectedAccount(updatedAccounts[0] || 'Compte Principal');
    }
  };
  const [showTradesModal, setShowTradesModal] = useState(false);
  const [showSignalsModal, setShowSignalsModal] = useState(false);
  const [selectedTradesDate, setSelectedTradesDate] = useState<Date | null>(null);
  const [selectedSignalsDate, setSelectedSignalsDate] = useState<Date | null>(null);
  const [pasteArea, setPasteArea] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // État pour TOUS les signaux (calendrier)
  const [allSignalsForStats, setAllSignalsForStats] = useState<Array<any>>([]);
  
  // Charger TOUS les signaux pour le calendrier
  useEffect(() => {
    const loadAllSignalsForCalendar = async () => {
      try {
        console.log('📊 [USER] Chargement de TOUS les signaux pour calendrier...');
        
        const channels = ['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4'];
        let allSignals: any[] = [];
        
        for (const channelId of channels) {
          try {
            const signals = await getSignals(channelId, 999); // Charger beaucoup de signaux
            allSignals = [...allSignals, ...signals];
          } catch (error) {
            console.error(`❌ [USER] Erreur chargement ${channelId}:`, error);
          }
        }
        
        if (allSignals.length > 0) {
          const formattedSignals = allSignals.map(signal => ({
            id: signal.id || '',
            type: signal.type,
            symbol: signal.symbol,
            timeframe: signal.timeframe,
            entry: signal.entry?.toString() || 'N/A',
            takeProfit: signal.takeProfit?.toString() || 'N/A',
            stopLoss: signal.stopLoss?.toString() || 'N/A',
            description: signal.description || '',
            image: signal.image || signal.attachment_data,
            attachment_data: signal.attachment_data || signal.image,
            attachment_type: signal.attachment_type,
            attachment_name: signal.attachment_name,
            closure_image: signal.closure_image,
            closure_image_type: signal.closure_image_type,
            closure_image_name: signal.closure_image_name,
            timestamp: new Date(signal.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            originalTimestamp: signal.timestamp || Date.now(),
            status: signal.status || 'ACTIVE' as const,
            channel_id: signal.channel_id,
            reactions: signal.reactions || [],
            pnl: signal.pnl,
            closeMessage: signal.closeMessage
          }));
          
          setAllSignalsForStats(formattedSignals);
          console.log(`✅ [USER] ${formattedSignals.length} signaux chargés pour calendrier`);
        }
      } catch (error) {
        console.error('❌ [USER] Erreur chargement signaux calendrier:', error);
      }
    };
    
    loadAllSignalsForCalendar();
  }, [selectedChannel.id]);
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
    image: string | null;
    timestamp: string;
    status: 'ACTIVE' | 'WIN' | 'LOSS' | 'BE';
    channel_id: string;
    reactions?: string[];
    pnl?: string;
    closeMessage?: string;
  }>>([]);


  // Fonction pour charger les messages depuis Firebase
  const loadMessages = async (channelId: string, keepPosition: boolean = false) => {
    try {
      // Charger TOUS les messages (999999 = illimité)
      const messages = await getMessages(channelId, 999999);
      const isChatChannel = ['general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss', 'video'].includes(channelId);
      
      // Afficher TOUS les messages directement sans limite
      const limitedMessages = isChatChannel ? messages : messages.reverse();
      
      const formattedMessages = limitedMessages.map(msg => ({
        id: msg.id || '',
        text: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()).toLocaleString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        author: msg.author,
        author_avatar: msg.author_avatar,
        attachment: undefined,
        attachment_data: msg.attachment_data
      }));
      
      setMessages(prev => ({
        ...prev,
        [channelId]: formattedMessages.map(msg => ({
          id: msg.id,
          text: msg.text,
          user: msg.author,
          author: msg.author,
          author_avatar: msg.author_avatar,
          timestamp: msg.timestamp,
          attachment_data: msg.attachment_data
        }))
      }));
      
      console.log(`✅ Messages chargés pour ${channelId}:`, formattedMessages.length, '/', messages.length);
      
      // Scroll vers le bas après chargement des messages (sauf si on garde la position)
      if (!keepPosition && !['calendrier', 'trading-journal', 'forex-signaux', 'crypto-signaux', 'futures-signaux'].includes(channelId)) {
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
      const signals = await getSignals(channelId, 3); // Limite à 3 signaux
      const formattedSignals = signals.map(signal => ({
        id: signal.id || '',
        type: signal.type,
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        entry: signal.entry?.toString() || 'N/A',
        takeProfit: signal.takeProfit?.toString() || 'N/A',
        stopLoss: signal.stopLoss?.toString() || 'N/A',
        description: signal.description || '',
        image: signal.image || signal.attachment_data,
        attachment_data: signal.attachment_data || signal.image,
        attachment_type: signal.attachment_type,
        attachment_name: signal.attachment_name,
        closure_image: signal.closure_image,
        closure_image_type: signal.closure_image_type,
        closure_image_name: signal.closure_image_name,
        timestamp: new Date(signal.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: signal.status || 'ACTIVE' as const,
        channel_id: signal.channel_id,
        reactions: [],
        pnl: signal.pnl,
        closeMessage: signal.closeMessage
      }));
      
      setSignals(formattedSignals.reverse());
      
      // Ne pas envoyer de notifications lors du chargement initial
      // Les notifications seront envoyées seulement pour les nouveaux signaux en temps réel
      
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

  // Subscription globale pour tous les canaux (ne se recrée pas à chaque changement de canal)
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
  }, []); // Supprimer selectedChannel.id de la dépendance

  // Charger les données quand on change de canal
  useEffect(() => {
    console.log('🔄 Changement de canal utilisateur:', selectedChannel.id);
    
    // Ne pas charger messages/signaux pour les canaux spéciaux
    const isSpecialChannel = ['calendrier', 'trading-journal', 'journal', 'video', 'trading-hub'].includes(selectedChannel.id);
    
    if (!isSpecialChannel) {
      loadMessages(selectedChannel.id);
      loadSignals(selectedChannel.id);
    }
    
    // Subscription aux signaux temps réel pour les réactions et notifications
    const signalSubscription = subscribeToSignals(selectedChannel.id, (updatedSignal) => {
      console.log('🔄 Signal mis à jour reçu:', updatedSignal);
      
      // Mettre à jour les signaux avec les nouvelles réactions
      setSignals(prev => prev.map(signal => 
        signal.id === updatedSignal.id ? { ...signal, reactions: updatedSignal.reactions || [] } : signal
      ));
      
      // Envoyer une notification pour les signaux fermés (WIN/LOSS/BE) seulement si c'est un vrai changement
      if (updatedSignal.status !== 'ACTIVE' && (updatedSignal as any).closeMessage) {
        // Vérifier si c'est un changement récent (moins de 5 secondes) pour éviter les notifications en batch
        const now = Date.now();
        const signalTime = new Date(updatedSignal.timestamp).getTime();
        if (now - signalTime < 5000) {
        notifySignalClosed(updatedSignal);
        }
      }
    });

    // Subscription aux nouveaux signaux temps réel
    const newSignalSubscription = subscribeToSignals(selectedChannel.id, (signal) => {
      console.log('🆕 Nouveau signal reçu utilisateur:', signal);
      
      const formattedSignal = {
        id: signal.id || '',
        type: signal.type,
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        entry: signal.entry?.toString() || 'N/A',
        takeProfit: signal.takeProfit?.toString() || 'N/A',
        stopLoss: signal.stopLoss?.toString() || 'N/A',
        description: signal.description || '',
        image: signal.image || signal.attachment_data,
        attachment_data: signal.attachment_data || signal.image,
        attachment_type: signal.attachment_type,
        attachment_name: signal.attachment_name,
        closure_image: signal.closure_image,
        closure_image_type: signal.closure_image_type,
        closure_image_name: signal.closure_image_name,
        timestamp: new Date(signal.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: signal.status || 'ACTIVE' as const,
        channel_id: signal.channel_id,
        reactions: [],
        pnl: signal.pnl,
        closeMessage: signal.closeMessage
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
      
      // Notifier le nouveau signal seulement s'il est vraiment récent (moins de 10 secondes)
      const now = Date.now();
      const signalTime = new Date(signal.timestamp).getTime();
      if (now - signalTime < 10000) {
      notifyNewSignal(formattedSignal);
      }
      
      // Scroll automatique (sauf pour calendrier et journal perso)
      if (!['calendrier', 'trading-journal', 'forex-signaux', 'crypto-signaux', 'futures-signaux'].includes(selectedChannel.id)) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    });
    
    // Les messages temps réel sont gérés par les subscriptions globales

    return () => {
      signalSubscription.unsubscribe();
      signalSubscription.unsubscribe();
    };
  }, [selectedChannel.id]);
  const [chatMessage, setChatMessage] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // États pour l'édition du nom d'utilisateur
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [supabaseProfile, setSupabaseProfile] = useState<any>(null);
  
  // État pour le toggle des notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('notificationsDisabled') !== 'true';
  });

  // Fonction pour toggle les notifications
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Activer les notifications
      console.log('🔔 Activation des notifications...');
      localStorage.removeItem('notificationsDisabled');
      
      try {
        await initializeNotifications();
        setNotificationsEnabled(true);
        console.log('✅ Notifications activées');
      } catch (error) {
        console.error('❌ Erreur activation notifications:', error);
        alert('Impossible d\'activer les notifications. Vérifiez les permissions de votre navigateur.');
      }
    } else {
      // Désactiver les notifications
      console.log('🔕 Désactivation des notifications...');
      
      try {
        // Supprimer tous les tokens FCM
        const { getMessaging, deleteToken } = await import('firebase/messaging');
        const { database } = await import('../../utils/firebase-setup');
        const { ref, remove, get } = await import('firebase/database');
        
        // Récupérer le token FCM actuel du navigateur
        try {
          const messaging = getMessaging();
          const currentToken = await (messaging as any).getToken();
          
          if (currentToken) {
            console.log('🗑️ Suppression token FCM...');
            
            // Supprimer de Firebase Database
            const tokenKey = currentToken.replace(/[.#$[\]]/g, '_');
            const tokenRef = ref(database, `fcm_tokens/${tokenKey}`);
            await remove(tokenRef);
            
            // Supprimer du navigateur
            await deleteToken(messaging);
            console.log('✅ Token FCM supprimé');
          }
        } catch (error) {
          console.log('⚠️ Erreur suppression token:', error);
        }
        
        localStorage.setItem('notificationsDisabled', 'true');
        setNotificationsEnabled(false);
        console.log('✅ Notifications désactivées');
      } catch (error) {
        console.error('❌ Erreur désactivation notifications:', error);
      }
    }
  };

  // Fonctions pour l'édition du nom d'utilisateur
  const handleUsernameEdit = async () => {
    if (usernameInput.trim()) {
      try {
        // Vérifier si l'utilisateur est connecté
        if (!user) {
          console.error('❌ Utilisateur non connecté');
          // Mode dégradé : sauvegarder en localStorage avec ID générique
          localStorage.setItem('userUsername', usernameInput.trim());
          setCurrentUsername(usernameInput.trim());
          console.log('✅ Username sauvegardé en localStorage:', usernameInput.trim());
        } else {
          const { data, error } = await updateUserProfile(usernameInput.trim(), undefined, 'user');
        if (!error && data) {
          setCurrentUsername(usernameInput.trim());
          setSupabaseProfile(prev => prev ? { ...prev, name: usernameInput.trim() } : prev);
          console.log('✅ Username updated successfully in Supabase:', usernameInput.trim());
        } else {
          console.error('❌ Error updating username in Supabase:', error);
            // Mode dégradé : sauvegarder en localStorage avec ID utilisateur
            localStorage.setItem(`userUsername_${user.id}`, usernameInput.trim());
            setCurrentUsername(usernameInput.trim());
            console.log('✅ Username sauvegardé en localStorage (fallback):', usernameInput.trim());
          }
        }
      } catch (error) {
        console.error('❌ Error updating username:', error);
        // Mode dégradé : sauvegarder en localStorage avec ID utilisateur si disponible
        if (user) {
          localStorage.setItem(`userUsername_${user.id}`, usernameInput.trim());
        } else {
          localStorage.setItem('userUsername', usernameInput.trim());
        }
        setCurrentUsername(usernameInput.trim());
        console.log('✅ Username sauvegardé en localStorage (fallback):', usernameInput.trim());
      }
      setIsEditingUsername(false);
      setUsernameInput('');
    }
  };

  const handleUsernameCancel = () => {
    setIsEditingUsername(false);
    setUsernameInput('');
  };

  // Charger le profil utilisateur une seule fois au démarrage
  useEffect(() => {
    const initializeSupabaseUser = async () => {
      try {
        const userSess = supabase.auth.getUser();
        const session = await supabase.auth.getSession();
        
        if (session.data.session?.user) {
          console.log('✅ Session utilisateur trouvée:', session.data.session.user.email);
        }
      } catch (error) {
        console.error('❌ Pas de session Supabase:', error);
      }
    };

    initializeSupabaseUser();
  }, []);

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

      // Charger le nom d'utilisateur (Supabase d'abord, puis localStorage)
      if (user) {
        console.log('👤 Utilisateur connecté:', user.id, user.email);
        try {
          const { data: profile } = await getUserProfileByType('user');
          console.log('📦 Profil récupéré de Supabase:', profile);
          if (profile?.name) {
            setSupabaseProfile(profile);
            setCurrentUsername(profile.name);
            // Charger aussi l'avatar depuis le profil Supabase
            if (profile.avatar_url && !image) {
              setProfileImage(profile.avatar_url);
              localStorage.setItem('userProfileImage', profile.avatar_url);
              console.log('✅ Avatar chargé depuis profil Supabase');
            }
            console.log('✅ Profil utilisateur chargé depuis Supabase:', profile);
          } else {
            // Profil n'existe pas, créer un profil par défaut avec l'email
            console.log('⚠️ Pas de profil trouvé, création du profil par défaut...');
            const defaultName = user.email?.split('@')[0] || 'Utilisateur';
            
            // Créer le profil dans Supabase
            const { data: newProfile } = await updateUserProfile(defaultName, undefined, 'user');
            
            if (newProfile) {
              setSupabaseProfile(newProfile);
              setCurrentUsername(defaultName);
              console.log('✅ Nouveau profil créé dans Supabase:', newProfile);
            } else {
              // Fallback localStorage avec ID utilisateur
              const localUsername = localStorage.getItem(`userUsername_${user.id}`);
              if (localUsername) {
                setCurrentUsername(localUsername);
                console.log('✅ Username chargé depuis localStorage:', localUsername);
              } else {
                setCurrentUsername(defaultName);
                console.log('✅ Username défini depuis email:', defaultName);
              }
            }
          }
        } catch (error) {
          console.error('❌ Erreur lors du chargement du profil Supabase:', error);
          // Mode dégradé : localStorage avec ID utilisateur
          const localUsername = localStorage.getItem(`userUsername_${user.id}`);
          if (localUsername) {
            setCurrentUsername(localUsername);
            console.log('✅ Username chargé depuis localStorage (fallback):', localUsername);
          } else {
          setCurrentUsername(user.email || 'Utilisateur');
            console.log('✅ Username défini depuis email (fallback):', user.email);
          }
        }
      } else {
        // Pas connecté : utiliser localStorage
        const localUsername = localStorage.getItem('userUsername');
        if (localUsername) {
          setCurrentUsername(localUsername);
          console.log('✅ Username chargé depuis localStorage (pas connecté):', localUsername);
        } else {
          setCurrentUsername('Utilisateur');
          console.log('✅ Username par défaut (pas connecté)');
        }
      }
    };
    
    initProfile();
  }, [user]);

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

  // Initialiser les dernières heures de lecture depuis localStorage
  useEffect(() => {
    const channels = ['crypto', 'forex', 'indices', 'fondamentaux', 'letsgooo-model'];
    const lastReads = {};
    
    channels.forEach(channelId => {
      const lastRead = localStorage.getItem(`lastRead_${channelId}`);
      if (lastRead) {
        lastReads[channelId] = lastRead;
      }
    });
    
    setLastReadTimes(lastReads);
  }, []);

  
  // Fonction pour mettre à jour les heures de dernière lecture
  const updateLastReadTime = (channelId: string) => {
    const now = new Date().toISOString();
    setLastReadTimes(prev => ({
      ...prev,
      [channelId]: now
    }));
    // Sauvegarder dans localStorage
    localStorage.setItem(`lastRead_${channelId}`, now);
  };


  // Fonction pour changer de canal et réinitialiser selectedDate si nécessaire
  const handleChannelChange = (channelId: string, channelName: string) => {
    console.log('🔄 handleChannelChange appelé:', { channelId, channelName });
    
    // Réinitialiser le flag de scroll pour permettre un nouveau scroll
    setIsScrolling(false);
    
    // Marquer le canal comme lu quand l'utilisateur l'ouvre
    updateLastReadTime(channelId);
    
    // Réinitialiser selectedDate si on quitte le Trading Journal
    if (selectedChannel.id === 'trading-journal' && channelId !== 'trading-journal') {
      setSelectedDate(null);
    }
    
    setSelectedChannel({id: channelId, name: channelName});
    setView('signals');
    
    console.log('✅ selectedChannel mis à jour:', { id: channelId, name: channelName });
    
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
      if (['general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss', 'video'].includes(channelId)) {
        scrollToBottom();
      } else if (!['calendrier', 'trading-journal', 'forex-signaux', 'crypto-signaux', 'futures-signaux'].includes(channelId)) {
        scrollToTop();
      }
      // Pas de scroll pour signaux, calendrier et trading journal
    }, 200);
  };
  const [personalTrades, setPersonalTrades] = useState<PersonalTrade[]>([]);

  // État pour les comptes multiples
  const [tradingAccounts, setTradingAccounts] = useState<string[]>(['Compte Principal']);
  const [selectedAccount, setSelectedAccount] = useState<string>('Compte Principal');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

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
  
  // Synchroniser l'ID utilisateur au démarrage de l'application
  useEffect(() => {
    const syncUser = async () => {
      const userId = await syncUserId();
      console.log('🔄 ID utilisateur synchronisé au démarrage PWA:', userId);
    };
    syncUser();
  }, []); // Une seule fois au démarrage

  // Synchronisation temps réel des trades personnels
  useEffect(() => {
    // Forcer l'initialisation de l'ID utilisateur
    localStorage.setItem('user_id', 'user_unified');
    console.log('🔄 ID utilisateur forcé dans PWA:', localStorage.getItem('user_id'));
    
    console.log('👂 Démarrage synchronisation temps réel trades [PWA]...');
    
    // Démarrer l'écoute temps réel
    const unsubscribe = listenToPersonalTrades(
      (trades) => {
        console.log('🔄 Mise à jour trades reçue [PWA]:', trades.length);
        setPersonalTrades(trades);
      },
      (error) => {
        console.error('❌ Erreur synchronisation temps réel [PWA]:', error);
      }
    );
    
    // Nettoyer l'écoute au démontage du composant
    return () => {
      console.log('🛑 Arrêt synchronisation temps réel [PWA]');
      unsubscribe();
    };
  }, []); // Une seule fois au démarrage

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
            image: signal.image || signal.attachment_data,
        attachment_data: signal.attachment_data || signal.image,
        attachment_type: signal.attachment_type,
        attachment_name: signal.attachment_name,
        closure_image: signal.closure_image,
        closure_image_type: signal.closure_image_type,
        closure_image_name: signal.closure_image_name,
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

  // États pour forcer la mise à jour des stats
  const [statsUpdateTrigger, setStatsUpdateTrigger] = useState(0);

  // Forcer la mise à jour des stats quand le compte ou les trades changent
  useEffect(() => {
    console.log('🔄 Trigger stats update - Account:', selectedAccount, 'Trades:', personalTrades.length);
    setStatsUpdateTrigger(prev => prev + 1);
  }, [selectedAccount, personalTrades]);

  // Fonctions pour les statistiques des trades personnels (filtrées par compte)
  const getTradesForSelectedAccount = () => {
    const filtered = personalTrades.filter(trade => 
      (trade.account || 'Compte Principal') === selectedAccount
    );
    console.log('🔍 DEBUG getTradesForSelectedAccount:', {
      selectedAccount,
      totalTrades: personalTrades.length,
      filteredTrades: filtered.length,
      allTrades: personalTrades.map(t => ({ symbol: t.symbol, account: t.account || 'Compte Principal' }))
    });
    return filtered;
  };

  const calculateTotalPnLTrades = (): number => {
    return getTradesForSelectedAccount().reduce((total, trade) => total + parsePnL(trade.pnl), 0);
  };

  const calculateWinRateTrades = (): number => {
    const accountTrades = getTradesForSelectedAccount();
    if (accountTrades.length === 0) return 0;
    const wins = accountTrades.filter(t => t.status === 'WIN').length;
    return Math.round((wins / accountTrades.length) * 100);
  };


  const calculateAvgWinTrades = (): number => {
    const accountTrades = getTradesForSelectedAccount();
    const winTrades = accountTrades.filter(t => t.status === 'WIN');
    if (winTrades.length === 0) return 0;
    const totalWinPnL = winTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0);
    return Math.round(totalWinPnL / winTrades.length);
  };

  const calculateAvgLossTrades = (): number => {
    const accountTrades = getTradesForSelectedAccount();
    const lossTrades = accountTrades.filter(t => t.status === 'LOSS');
    if (lossTrades.length === 0) return 0;
    const totalLossPnL = lossTrades.reduce((total, trade) => total + Math.abs(parsePnL(trade.pnl)), 0);
    return Math.round(totalLossPnL / lossTrades.length);
  };

  const getTodayTrades = () => {
    const today = new Date().toISOString().split('T')[0];
    return getTradesForSelectedAccount().filter(t => t.date === today);
  };

  const getThisMonthTrades = () => {
    const today = new Date();
    return getTradesForSelectedAccount().filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === today.getMonth() &&
             tradeDate.getFullYear() === today.getFullYear();
    });
  };

  // Fonctions pour calculer les stats du mois affiché dans le calendrier (trades personnels)
  const getTradesForMonth = (date: Date) => {
    return getTradesForSelectedAccount().filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === date.getMonth() &&
             tradeDate.getFullYear() === date.getFullYear();
    });
  };

  const calculateTotalPnLTradesForMonth = (): number => {
    const monthTrades = getTradesForMonth(currentDate);
    return monthTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0);
  };

  const calculateWinRateTradesForMonth = (): number => {
    const monthTrades = getTradesForMonth(currentDate);
    if (monthTrades.length === 0) return 0;
    const wins = monthTrades.filter(t => t.status === 'WIN').length;
    return Math.round((wins / monthTrades.length) * 100);
  };

  const calculateAvgWinTradesForMonth = (): number => {
    const monthTrades = getTradesForMonth(currentDate);
    const winTrades = monthTrades.filter(t => t.status === 'WIN');
    if (winTrades.length === 0) return 0;
    const totalWinPnL = winTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0);
    return Math.round(totalWinPnL / winTrades.length);
  };

  const calculateAvgLossTradesForMonth = (): number => {
    const monthTrades = getTradesForMonth(currentDate);
    const lossTrades = monthTrades.filter(t => t.status === 'LOSS');
    if (lossTrades.length === 0) return 0;
    const totalLossPnL = lossTrades.reduce((total, trade) => total + Math.abs(parsePnL(trade.pnl)), 0);
    return Math.round(totalLossPnL / lossTrades.length);
  };

  const getTodayTradesForMonth = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const monthTrades = getTradesForMonth(currentDate);
    
    // Si c'est le mois actuel, retourner les trades d'aujourd'hui
    if (currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()) {
      return monthTrades.filter(t => t.date === todayStr);
    }
    
    // Sinon retourner 0 car ce n'est pas le mois actuel
    return [];
  };

  const getThisMonthTradesForMonth = () => {
    return getTradesForMonth(currentDate);
  };

  const getWeeklyBreakdownTradesForMonth = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    // Créer 4 semaines du mois affiché
    const weeks = [];
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
      const weekStart = new Date(year, month, (weekNum - 1) * 7 + 1);
      const weekEnd = new Date(year, month, weekNum * 7);
      
      const weekTrades = personalTrades.filter(t => {
        const tradeDate = new Date(t.date);
        return tradeDate >= weekStart && 
               tradeDate <= weekEnd &&
               tradeDate.getMonth() === month &&
               tradeDate.getFullYear() === year;
      });
      
      const weekPnL = weekTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0);
      const wins = weekTrades.filter(t => t.status === 'WIN').length;
      const losses = weekTrades.filter(t => t.status === 'LOSS').length;
      
      // Vérifier si c'est la semaine actuelle (seulement si c'est le mois actuel)
      const today = new Date();
      const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
      const todayWeek = Math.ceil(today.getDate() / 7);
      const isCurrentWeek = isCurrentMonth && weekNum === todayWeek;
      
      weeks.push({
        week: `Week ${weekNum}`,
        weekNum: weekNum,
        trades: weekTrades.length,
        pnl: weekPnL,
        wins,
        losses,
        isCurrentWeek
      });
    }
    
    return weeks;
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
        weekNum: weekNum,
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
      
      console.log('💾 Sauvegarde Firebase:', { messageId, newReactions, currentUser });
      await updateMessageReactions(messageId, newReactions);
      console.log('✅ Réaction message synchronisée:', messageId, newReactions, 'par utilisateur:', currentUser);
      
    } catch (error) {
      console.error('❌ Erreur réaction message:', error);
              console.error('Erreur lors de l\'ajout de la réaction');
    }
  };

  // Fonction handleReaction supprimée - les réactions sont désactivées côté utilisateur

  const scrollToTop = () => {
    // Pour les salons de chat, scroller dans le conteneur de messages
          if (messagesContainerRef.current && ['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss', 'video'].includes(selectedChannel.id)) {
      messagesContainerRef.current.scrollTop = 0;
    } else {
      // Pour les autres vues, scroller la page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // État pour éviter les scrolls multiples
  const [isScrolling, setIsScrolling] = useState(false);

  const scrollToBottom = () => {
    // Éviter les scrolls multiples
    if (isScrolling) {
      console.log('⏸️ Scroll déjà en cours, ignoré');
      return;
    }
    
    setIsScrolling(true);
    
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
    
    // Réinitialiser le flag après un délai
    setTimeout(() => {
      setIsScrolling(false);
      console.log('✅ Scroll to bottom user completed');
    }, 300);
  };

  const handleLogout = async () => {
    console.log('🚪 Déconnexion utilisateur en cours...');
    
    try {
      // SOLUTION RADICALE: Supprimer TOUS les tokens FCM
      try {
        console.log('🔔 🔴 SUPPRESSION COMPLÈTE DE TOUS LES TOKENS FCM...');
        const { getMessaging, deleteToken } = await import('firebase/messaging');
        const { ref, remove, get } = await import('firebase/database');
        const { database } = await import('../../utils/firebase-setup');
        
        // 0. DÉSACTIVER DÉFINITIVEMENT LES NOTIFICATIONS POUR CET UTILISATEUR
        localStorage.setItem('notificationsDisabled', 'true');
        console.log('🔴 FLAG notificationsDisabled activé - empêche réinitialisation automatique');
        
        // 1. Supprimer le token du localStorage
        const storedToken = localStorage.getItem('fcmToken');
        if (storedToken) {
          console.log('🗑️ Token FCM trouvé dans localStorage:', storedToken.substring(0, 20) + '...');
          localStorage.removeItem('fcmToken');
          console.log('✅ Token FCM supprimé de localStorage');
        }
        
        // 2. Récupérer et supprimer le token FCM actuel du navigateur
        try {
          const messaging = getMessaging();
          const currentToken = await (messaging as any).getToken();
          
          if (currentToken) {
            console.log('🗑️ Token FCM actuel du navigateur:', currentToken.substring(0, 20) + '...');
            
            // Supprimer de Firebase Database
            const tokenKey = currentToken.replace(/[.#$[\]]/g, '_');
            const tokenRef = ref(database, `fcm_tokens/${tokenKey}`);
            await remove(tokenRef);
            console.log('✅ Token supprimé de Firebase Database');
            
            // Supprimer du navigateur
            await deleteToken(messaging);
            console.log('✅ Token supprimé du navigateur');
          }
        } catch (error) {
          console.log('⚠️ Erreur récupération token actuel (normal si déjà supprimé):', error.message);
        }
        
        // 3. SUPPRIMER TOUS LES TOKENS DE FIREBASE DATABASE (approche radicale)
        try {
          console.log('🔔 🔴 SUPPRESSION DE TOUS LES TOKENS DANS FIREBASE...');
          const fcmTokensRef = ref(database, 'fcm_tokens');
          const snapshot = await get(fcmTokensRef);
          
          if (snapshot.exists()) {
            const tokensData = snapshot.val();
            console.log('📊 Nombre total de tokens trouvés:', Object.keys(tokensData).length);
            
            // Supprimer TOUS les tokens (solution radicale pour mobile)
            for (const tokenKey of Object.keys(tokensData)) {
              console.log('🗑️ Suppression token:', tokenKey.substring(0, 20) + '...');
              await remove(ref(database, `fcm_tokens/${tokenKey}`));
            }
            console.log('✅ ✅ ✅ TOUS LES TOKENS SUPPRIMÉS DE FIREBASE');
          } else {
            console.log('⚠️ Aucun token trouvé dans Firebase Database');
          }
        } catch (error) {
          console.error('❌ Erreur suppression totale des tokens:', error);
        }
        
        // 4. Désinscrire TOUS les service workers
        try {
          if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log('📊 Nombre de service workers trouvés:', registrations.length);
            
            for (const registration of registrations) {
              console.log('🗑️ Désinscription service worker:', registration.scope);
              await registration.unregister();
            }
            console.log('✅ Tous les service workers désinscrits');
          }
        } catch (error) {
          console.error('❌ Erreur désinscription service workers:', error);
        }
        
        console.log('✅ ✅ ✅ NETTOYAGE COMPLET DES NOTIFICATIONS TERMINÉ');
        
      } catch (error) {
        console.error('❌ Erreur suppression notifications:', error);
      }
      
      // Déconnexion Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Erreur déconnexion Supabase:', error);
      } else {
        console.log('✅ Déconnexion Supabase réussie');
      }
      
      // Nettoyage complet du localStorage (sauf les photos de profil)
      const keysToRemove = [
        'signals', 'chat_messages', 'trading_stats', 'user_session',
        'userUsername', 'adminUsername', 'messageReactions', 'lastReadTimes',
        'userProfiles', 'supabaseProfile'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🧹 Supprimé: ${key}`);
      });
      
      // Nettoyer les clés localStorage spécifiques à l'utilisateur actuel
      if (user) {
        const userSpecificKey = `userUsername_${user.id}`;
        localStorage.removeItem(userSpecificKey);
        console.log(`🧹 Supprimé clé utilisateur spécifique: ${userSpecificKey}`);
      }
      
      console.log('🧹 Nettoyage localStorage terminé');
      
      // Forcer un rechargement complet de la page (hard reload)
      console.log('🔄 Rechargement complet de la page...');
      window.location.replace('/');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // En cas d'erreur, forcer quand même le rechargement
      window.location.replace('/');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
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
        
        // Aussi sauvegarder dans le profil utilisateur
        await updateUserProfile(currentUsername || undefined, base64Image, 'user');
        console.log('✅ Avatar sauvegardé dans le profil utilisateur');
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

  // Fonction supprimée - seul admin peut créer des signaux

  // Fonctions pour le journal de trading personnalisé
  const handleAddTrade = () => {
    setShowTradeModal(true);
  };

  const handleTradeSubmit = async () => {
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
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      account: selectedAccount
    };
    
    console.log('🔍 DEBUG Adding trade:', newTrade);
    console.log('🔍 DEBUG Selected account:', selectedAccount);

    // Sauvegarder dans Firebase
    const savedTrade = await addPersonalTrade(newTrade as any);
    
    if (savedTrade) {
      // Ajouter à la liste locale
      setPersonalTrades(prev => [savedTrade, ...prev]);
      
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
      console.log('✅ Trade ajouté avec succès dans Firebase !');
    } else {
      console.error('❌ Erreur lors de la sauvegarde du trade');
    }
  };

  // FIXED: Completely rewritten TradingView paste handler to match Google Apps Script logic
  const handleTradingViewPasteTrade = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedHtml = e.clipboardData.getData('text/html') || '';
    const pastedText = e.clipboardData.getData('text') || '';
    
    console.log('📋 Paste detected - HTML:', pastedHtml.slice(0, 300));
    console.log('📋 Paste detected - Text:', pastedText.slice(0, 300));
    
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
          
          console.log('📊 TradingView data parsed:', data);
          
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
              extracted.tradeType = 'BUY';
              extracted.outcome = 'WIN'; // Default to WIN
            } else if (type === "LineToolRiskRewardShort" || /short/i.test(type)) {
              extracted.tradeType = 'SELL';
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
                if (extracted.tradeType === 'BUY') {
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
            
            // Calculate PNL if we have entry and exit
            if (extracted.entryPrice && extracted.exitPrice) {
              const entry = parseFloat(extracted.entryPrice);
              const exit = parseFloat(extracted.exitPrice);
              let pnl = 0;
              
              if (extracted.tradeType === 'BUY') {
                pnl = exit - entry;
              } else {
                pnl = entry - exit;
              }
              
              extracted.pnl = pnl.toString();
            }
          }
        }
      } catch (err) {
        console.error("❌ Error parsing TradingView data:", err);
      }
    }
    
    // Fallback to plain-text parsing if we didn't find structured data
    if (!found) {
      if (/long/i.test(pastedText)) {
        extracted.tradeType = 'BUY';
        extracted.outcome = 'WIN';
        found = true;
      } else if (/short/i.test(pastedText)) {
        extracted.tradeType = 'SELL';
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
          extracted.stopLoss = nums[2];
        }
        found = true;
      }
    }
    
    // Apply extracted data to the form
    if (found) {
      console.log('✅ Données extraites:', extracted);
      
      // Update form data with extracted values
    if (extracted.symbol) setTradeData(prev => ({ ...prev, symbol: extracted.symbol }));
      if (extracted.tradeType) setTradeData(prev => ({ ...prev, type: extracted.tradeType }));
      if (extracted.outcome) setTradeData(prev => ({ ...prev, status: extracted.outcome }));
    if (extracted.entryPrice) setTradeData(prev => ({ ...prev, entry: extracted.entryPrice }));
    if (extracted.exitPrice) setTradeData(prev => ({ ...prev, exit: extracted.exitPrice }));
    if (extracted.stopLoss) setTradeData(prev => ({ ...prev, stopLoss: extracted.stopLoss }));
      if (extracted.pnl) setTradeData(prev => ({ ...prev, pnl: extracted.pnl }));
      
      // Add extracted info to notes
      if (Object.keys(extracted).length > 0) {
        const noteAddition = `Importé depuis TradingView:\n${JSON.stringify(extracted, null, 2)}`;
        setTradeData(prev => ({ 
          ...prev, 
          notes: prev.notes ? `${prev.notes}\n\n${noteAddition}` : noteAddition 
        }));
      }
    } else {
      // If nothing parsed, just dump the raw text into notes
      setTradeData(prev => ({ 
        ...prev, 
        notes: `Pasted text:\n${pastedText}\n\n${prev.notes || ''}` 
      }));
      console.warn('⚠️ Could not extract structured trade data; added raw text to notes.');
    }
  };

  const getTradesForDate = (date: Date) => {
    try {
      // Utiliser la date locale au lieu de UTC pour éviter le décalage
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      console.log('Recherche trades pour date:', dateStr, 'Compte:', selectedAccount);
      
      // Utiliser les trades du compte sélectionné au lieu de tous les trades
      const accountTrades = getTradesForSelectedAccount();
      console.log('Trades du compte:', accountTrades);
      
      if (!Array.isArray(accountTrades)) {
        console.error('accountTrades n\'est pas un tableau:', accountTrades);
        return [];
      }
      
      const filteredTrades = accountTrades.filter(trade => {
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

  const getTradesForWeek = (weekNum: number) => {
    try {
      // Utiliser les trades du compte sélectionné
      const accountTrades = getTradesForSelectedAccount();
      
      if (!Array.isArray(accountTrades)) {
        console.error('accountTrades n\'est pas un tableau:', accountTrades);
        return [];
      }

      console.log('🔍 DEBUG getTradesForWeek - Trades du compte:', accountTrades);
      console.log('🔍 DEBUG getTradesForWeek - Semaine demandée:', weekNum);

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Premier jour du mois
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = dimanche, 1 = lundi, etc.
      
      // Calculer le premier lundi du calendrier (peut être dans le mois précédent)
      const calendarStart = new Date(firstDayOfMonth);
      const daysToMonday = firstDayOfWeek === 0 ? -6 : -(firstDayOfWeek - 1);
      calendarStart.setDate(calendarStart.getDate() + daysToMonday);
      
      // Calculer les dates de la semaine demandée (7 jours par semaine)
      const weekStart = new Date(calendarStart);
      weekStart.setDate(calendarStart.getDate() + (weekNum - 1) * 7);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999); // Fin de journée
      
      console.log(`🔍 Recherche trades pour semaine ${weekNum}:`, weekStart.toDateString(), 'à', weekEnd.toDateString());
      console.log(`🔍 Dates des trades:`, accountTrades.map(t => t.date));
      
      const filteredTrades = accountTrades.filter(trade => {
        if (!trade || !trade.date) {
          console.log('🔍 Trade invalide:', trade);
          return false;
        }
        
        const tradeDate = new Date(trade.date);
        tradeDate.setHours(0, 0, 0, 0); // Début de journée pour comparaison
        
        const weekStartCompare = new Date(weekStart);
        weekStartCompare.setHours(0, 0, 0, 0);
        
        const isInWeek = tradeDate >= weekStartCompare && tradeDate <= weekEnd;
        console.log(`🔍 Trade ${trade.date} (${tradeDate.toDateString()}) dans semaine ${weekNum}?`, isInWeek);
        return isInWeek;
      });
      
      console.log(`✅ Trades trouvés pour semaine ${weekNum}:`, filteredTrades.length);
      return filteredTrades;
    } catch (error) {
      console.error('❌ Erreur dans getTradesForWeek:', error);
      return [];
    }
  };

  const getSignalsForDate = (date: Date) => {
    // Utiliser allSignalsForStats (comme admin)
    return allSignalsForStats.filter(signal => {
      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
      
      if (isNaN(signalDate.getTime())) {
        return false;
      }
      
      return signalDate.getDate() === date.getDate() && 
             signalDate.getMonth() === date.getMonth() && 
             signalDate.getFullYear() === date.getFullYear();
    });
  };

  // Fonction pour récupérer les signaux d'une semaine spécifique
  const getSignalsForWeek = (weekNum: number): any[] => {
    // Utiliser allSignalsForStats directement (comme getSignalsForDate)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const calendarStart = new Date(firstDayOfMonth);
    const daysToMonday = firstDayOfWeek === 0 ? -6 : -(firstDayOfWeek - 1);
    calendarStart.setDate(calendarStart.getDate() + daysToMonday);
    
    const weekStart = new Date(calendarStart);
    weekStart.setDate(calendarStart.getDate() + (weekNum - 1) * 7);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return allSignalsForStats.filter(signal => {
      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
      
      if (isNaN(signalDate.getTime())) {
        return false;
      }
      
      return signalDate >= weekStart && signalDate <= weekEnd;
    });
  };

  const handleSignalSubmit = async () => {
    // Validation minimale - juste besoin d'au moins un champ rempli
    if (!signalData.symbol && !signalData.entry && !signalData.takeProfit && !signalData.stopLoss && !signalData.description) {
      console.warn('Veuillez remplir au moins un champ pour créer le signal');
      return;
    }

    try {
      // Upload image vers Firebase Storage si présente
      let attachmentData = null;
      let attachmentType = null;
      let attachmentName = null;
      console.log('📸 signalData.image existe?', !!signalData.image);
      if (signalData.image) {
        console.log('📸 Upload image vers Firebase Storage...');
        attachmentData = await uploadImage(signalData.image);
        attachmentType = signalData.image.type;
        attachmentName = signalData.image.name;
        console.log('✅ Image uploadée, URL:', attachmentData);
      }
      
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
        attachment_data: attachmentData,
        attachment_type: attachmentType,
        attachment_name: attachmentName,
        status: 'ACTIVE' as const
      };
      
      console.log('📤 Envoi à Firebase avec attachment:', !!signalForFirebase.attachment_data);

      // Sauvegarder en Firebase
      const savedSignal = await addSignal(signalForFirebase);
      console.log('💾 Signal sauvegardé:', savedSignal);
      
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
          user: currentUsername || 'Utilisateur',
          author: currentUsername || 'Utilisateur',
          author_avatar: profileImage || undefined,
          timestamp: new Date().toLocaleString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          attachment_data: undefined
        };

        console.log('📱 Message local créé (pas encore affiché):', localMessage);

        // Envoyer vers Firebase avec avatar utilisateur
        const messageData = {
          channel_id: selectedChannel.id,
          content: chatMessage,
          author: currentUsername || 'Utilisateur',
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
                      author: currentUsername || 'Utilisateur',
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
    const isJournalPerso = selectedChannel.id === 'journal' || selectedChannel.id === 'trading-journal';
    const isMobile = window.innerWidth < 768;
    return (
    <div className="bg-gray-900 text-white p-2 md:p-4 h-full overflow-y-auto" style={{ paddingTop: (isMobile && isJournalPerso) ? '80px' : '0px', marginTop: (isMobile && !isJournalPerso) ? '-9px' : '0px' }}>
      {/* Header */}
      <div className={`flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 pb-4 gap-4 md:gap-0 ${isMobile && !isJournalPerso ? '' : 'border-b border-gray-600'}`}>
        <div className="hidden md:flex md:items-center md:gap-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? 'Mon Journal Perso' : 'Journal des Signaux'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? 'Journal tous tes trades' : 'Suivi des performances des signaux'}
            </p>
          </div>
          
          {/* Sélecteur de compte - DESKTOP */}
          {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') && (
            <div className="flex items-center gap-2">
              <select
                value={selectedAccount}
                onChange={(e) => handleAccountChange(e.target.value)}
                className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {tradingAccounts.map((account) => (
                  <option key={account} value={account}>
                    {account}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setShowAddAccountModal(true)}
                className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
              >
                + Ajouter compte
              </button>
            </div>
          )}
        </div>
        
        <div className={`flex items-center ${(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? 'gap-4' : ''}`}>
          <div className="flex items-center gap-3 text-white">
            <button 
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-700 rounded-lg text-lg font-bold"
            >
              ‹
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold">{getMonthName(currentDate)}</div>
              <div className="text-sm text-gray-400">{currentDate.getFullYear()}</div>
            </div>
            <button 
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-700 rounded-lg text-lg font-bold"
            >
              ›
            </button>
          </div>
          {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') && (
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
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 w-full" key={`calendar-${selectedChannel.id}-${selectedAccount}-${personalTrades.length}-${currentDate.getMonth()}-${currentDate.getFullYear()}`}>
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
                const dayTrades = (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? 
                  getTradesForSelectedAccount().filter(trade => {
                    const tradeDate = new Date(trade.date);
                    return tradeDate.getDate() === dayNumber && 
                           tradeDate.getMonth() === currentDate.getMonth() && 
                           tradeDate.getFullYear() === currentDate.getFullYear();
                  }) : [];

                const daySignals = (selectedChannel.id !== 'trading-journal' && selectedChannel.id !== 'journal') ? 
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

                if (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') {
                  // Logique pour les trades personnels - basée sur PnL total
                  if (dayTrades.length > 0) {
                    tradeCount = dayTrades.length;
                    
                    // Calculer le PnL total pour ce jour
                    const totalPnL = dayTrades.reduce((total, trade) => {
                      if (trade.pnl) {
                        return total + parsePnL(trade.pnl);
                      }
                      return total;
                    }, 0);
                    
                    // Déterminer la couleur selon le PnL total
                    if (totalPnL > 0) {
                      bgColor = 'bg-green-400/40 border-green-300/30 text-white'; // PnL positif - vert plus pale
                    } else if (totalPnL < 0) {
                      bgColor = 'bg-red-500/60 border-red-400/50 text-white'; // PnL négatif
                    } else {
                      bgColor = 'bg-blue-500/60 border-blue-400/50 text-white'; // PnL = 0 (BE)
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
                        
                        if (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') {
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
                      {(() => {
                        let totalPnL = 0;
                        let tradeCount = 0;
                        if (selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') {
                          // Pour les trades personnels
                          const dayTrades = personalTrades.filter(trade => {
                            const tradeDate = new Date(trade.date);
                            return tradeDate.getDate() === dayNumber && 
                                   tradeDate.getMonth() === currentDate.getMonth() && 
                                   tradeDate.getFullYear() === currentDate.getFullYear();
                          });
                          tradeCount = dayTrades.length;
                          totalPnL = dayTrades.reduce((total, trade) => {
                            if (trade.pnl) {
                              return total + parsePnL(trade.pnl);
                            }
                            return total;
                          }, 0);
                        } else {
                          // Pour les signaux - utiliser allSignalsForStats qui contient TOUS les signaux
                          const daySignals = allSignalsForStats.filter(signal => {
                            const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
                            return signalDate.getDate() === dayNumber && 
                                   signalDate.getMonth() === currentDate.getMonth() && 
                                   signalDate.getFullYear() === currentDate.getFullYear();
                          });
                          tradeCount = daySignals.length;
                          totalPnL = daySignals.reduce((total, signal) => {
                            if (signal.pnl) {
                              return total + parsePnL(signal.pnl);
                            }
                            return total;
                          }, 0);
                        }
                        return (
                          <div className="flex flex-col items-center space-y-1">
                            {totalPnL !== 0 && (
                              <div className="text-xs font-bold text-center hidden md:block">
                                ${totalPnL.toFixed(0)}
                              </div>
                            )}
                            {tradeCount > 0 && (
                              <div className="text-xs font-bold text-right self-end">
                                {tradeCount}
                              </div>
                            )}
                          </div>
                        );
                      })()}
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
        <div className="w-full lg:w-80 bg-gray-800 rounded-xl p-4 md:p-6" key={`stats-${selectedAccount}-${currentDate.getMonth()}-${currentDate.getFullYear()}-${statsUpdateTrigger}`}>
          <h3 className="text-lg font-bold text-white mb-6">
            {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? 'Mon Journal Perso' : 'Statistiques Signaux'}
          </h3>
          
          {/* Métriques principales */}
          <div className="space-y-4 mb-8">
            {/* P&L Total */}
            <div className={`border rounded-lg p-4 border ${
              ((selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? calculateTotalPnLTradesForMonth() : calculateTotalPnLForMonth()) >= 0 
                ? 'bg-green-600/20 border-green-500/30' 
                : 'bg-red-600/20 border-red-500/30'
            }`}>
              <div className={`text-sm mb-1 ${
                ((selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? calculateTotalPnLTradesForMonth() : calculateTotalPnLForMonth()) >= 0 ? 'text-green-300' : 'text-red-300'
              }`}>P&L Total</div>
              <div className={`text-2xl font-bold ${
                ((selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? calculateTotalPnLTradesForMonth() : calculateTotalPnLForMonth()) >= 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {((selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? calculateTotalPnLTradesForMonth() : calculateTotalPnLForMonth()) >= 0 ? '+' : ''}${(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? calculateTotalPnLTradesForMonth() : calculateTotalPnLForMonth()}
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-blue-600/20 border-blue-500/30 rounded-lg p-4 border">
              <div className="text-sm text-blue-300 mb-1">Win Rate</div>
              <div className="text-2xl font-bold text-blue-200">
                {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? calculateWinRateTradesForMonth() : calculateWinRateForMonth()}%
              </div>
            </div>

            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Aujourd'hui</div>
                <div className="text-lg font-bold text-blue-400">
                  {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? getTodayTradesForMonth().length : getTodaySignalsForMonth()}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Ce mois</div>
                <div className="text-lg font-bold text-white">
                  {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? getThisMonthTradesForMonth().length : getThisMonthSignalsForMonth()}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Avg Win</div>
                <div className="text-lg font-bold text-green-400">
                  {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? 
                    (calculateAvgWinTradesForMonth() > 0 ? `+$${calculateAvgWinTradesForMonth()}` : '-') :
                    (getCalendarMonthlyStats(currentDate).avgWin > 0 ? `+$${getCalendarMonthlyStats(currentDate).avgWin}` : '-')
                  }
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Avg Loss</div>
                <div className="text-lg font-bold text-red-400">
                  {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? 
                    (calculateAvgLossTradesForMonth() > 0 ? `-$${calculateAvgLossTradesForMonth()}` : '-') :
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
              {((selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? getWeeklyBreakdownTradesForMonth() : getWeeklyBreakdownForMonth()).map((weekData, index) => (
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
      <div className="hidden md:flex w-56 min-w-56 flex-shrink-0 bg-gray-800 flex-col">
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
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-sm font-medium">{isEditingUsername ? (
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 w-24"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUsernameEdit();
                        } else if (e.key === 'Escape') {
                          handleUsernameCancel();
                        }
                      }}
                    />
                  ) : (
                    currentUsername || 'Utilisateur'
                  )}</p>
              <p className="text-xs text-gray-400">En ligne</p>
            </div>
                {!isEditingUsername && (
                  <button
                    onClick={() => {
                      setUsernameInput(currentUsername || '');
                      setIsEditingUsername(true);
                    }}
                    className="text-xs text-gray-400 hover:text-white px-1 py-0.5 rounded hover:bg-gray-700 flex items-center"
                    title="Modifier le nom"
                  >
                    ✏️
                  </button>
                )}
                {isEditingUsername && (
                  <div className="flex gap-1">
                    <button
                      onClick={handleUsernameEdit}
                      className="text-xs bg-green-600 hover:bg-green-700 px-2 py-0.5 rounded text-white"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleUsernameCancel}
                      className="text-xs bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded text-white"
                    >
                      ✗
                    </button>
                  </div>
                )}
              </div>
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

              <button onClick={() => handleChannelChange('calendrier', 'calendrier')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'calendrier' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📅 Journal Signaux</button>
              <button onClick={() => handleChannelChange('journal', 'journal')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'journal' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📓 Journal Perso</button>
              <button onClick={() => handleChannelChange('video', 'video')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'video' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📺 Livestream</button>
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

          {/* Bouton Toggle Notifications */}
          <button
            onClick={handleToggleNotifications}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-sm ${
              notificationsEnabled
                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 hover:border-green-500/50'
                : 'bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 border border-gray-600/30 hover:border-gray-600/50'
            }`}
          >
            {notificationsEnabled ? '🔔 Notifications ON' : '🔕 Notifications OFF'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Navigation - Fixed */}
        <div className={`md:hidden bg-gray-800 p-3 fixed top-0 left-0 right-0 z-30 ${selectedChannel.id === 'calendrier' || selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal' ? '' : 'border-b border-gray-700'}`} style={{ height: '60px' }}>
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
                <div className="flex-1">
                  {isEditingUsername ? (
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        className="text-sm bg-transparent border border-blue-400 rounded px-1 py-0.5 text-white placeholder-gray-400 focus:outline-none focus:border-blue-300"
                        placeholder="Nouveau nom..."
                        autoFocus
                        onKeyPress={(e) => e.key === 'Enter' && handleUsernameEdit()}
                        onKeyDown={(e) => e.key === 'Escape' && handleUsernameCancel()}
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={handleUsernameEdit}
                          className="text-xs bg-green-600 hover:bg-green-700 px-2 py-0.5 rounded text-white"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleUsernameCancel}
                          className="text-xs bg-red-600 hover:bg-red-700 px-2 py-0.5 rounded text-white"
                        >
                          ✗
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-sm font-medium">{currentUsername || 'Utilisateur'}</p>
                      </div>
                      <button
                        onClick={() => {
                          setUsernameInput(currentUsername || '');
                          setIsEditingUsername(true);
                        }}
                        className="text-xs text-gray-400 hover:text-white px-1 py-0.5 rounded hover:bg-gray-700 flex items-center"
                        title="Modifier le nom"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleNotifications}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    notificationsEnabled
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {notificationsEnabled ? '🔔' : '🔕'}
                </button>
                <button onClick={handleLogout} className="text-gray-400 hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </button>
              </div>
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
                  {channels.filter(c => ['video', 'trading-hub'].includes(c.id)).map(channel => (
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
            {(view === 'calendar' || selectedChannel.id === 'trading-journal' || selectedChannel.id === 'calendrier' || selectedChannel.id === 'video' || selectedChannel.id === 'journal') ? (
              <div className="bg-gray-900 text-white p-4 md:p-6 h-full overflow-y-auto overflow-x-hidden" style={{ paddingTop: '0px' }}>
                {/* Header avec sélecteur de compte et bouton Ajouter Trade pour Trading Journal */}
                {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? (
                  <div className="mb-4 md:mb-6 border-b border-gray-600 pb-4">
                    <div className="space-y-4">
                      {/* Titre */}
                      <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white">Mon Journal Perso</h1>
                        <p className="text-sm text-gray-400 mt-1">Journal tous tes trades</p>
                      </div>
                      
                      {/* Sélecteur de compte et boutons */}
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedAccount}
                            onChange={(e) => handleAccountChange(e.target.value)}
                            className="bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                          >
                            {tradingAccounts.map((account) => (
                              <option key={account} value={account}>
                                {account}
                              </option>
                            ))}
                          </select>
                          
                          <button
                            onClick={() => setShowAddAccountModal(true)}
                            className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                          >
                            + Ajouter compte
                          </button>
                        </div>
                        
                        <button 
                          onClick={handleAddTrade}
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
                        >
                          + Ajouter Trade
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
                
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
                {(selectedChannel.id === 'calendrier' || selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') && getTradingCalendar()}
                
                {/* Interface Livestream pour mobile */}
                {selectedChannel.id === 'video' && (
                  <div className="flex flex-col h-full bg-gray-900">
                    <div className="text-center space-y-4 w-full max-w-[95vw] mx-auto p-4 pt-16">
                      <h1 className="text-3xl font-bold text-white mb-2">Livestream</h1>
                      <p className="text-gray-400">Attache ta ceinture cousin</p>
                      
                      {/* Iframe 100ms */}
                      <div className="w-full relative" id="video-container">
                        <button
                          onClick={() => {
                            const container = document.getElementById('video-container');
                            if (container) {
                              // Vérifier si on est déjà en plein écran
                              const isFullscreen = document.fullscreenElement || 
                                                   (document as any).webkitFullscreenElement || 
                                                   (document as any).mozFullScreenElement || 
                                                   (document as any).msFullscreenElement;
                              
                              if (isFullscreen) {
                                // Quitter le plein écran
                                if (document.exitFullscreen) {
                                  document.exitFullscreen();
                                } else if ((document as any).webkitExitFullscreen) {
                                  (document as any).webkitExitFullscreen();
                                } else if ((document as any).mozCancelFullScreen) {
                                  (document as any).mozCancelFullScreen();
                                } else if ((document as any).msExitFullscreen) {
                                  (document as any).msExitFullscreen();
                                }
                              } else {
                                // Entrer en plein écran
                                if (container.requestFullscreen) {
                                  container.requestFullscreen();
                                } else if ((container as any).webkitRequestFullscreen) {
                                  (container as any).webkitRequestFullscreen();
                                } else if ((container as any).mozRequestFullScreen) {
                                  (container as any).mozRequestFullScreen();
                                } else if ((container as any).msRequestFullscreen) {
                                  (container as any).msRequestFullscreen();
                                }
                              }
                            }
                          }}
                          className="absolute top-4 right-4 z-10 text-white text-4xl font-bold hover:text-gray-300 transition-colors bg-black bg-opacity-50 px-2 py-1 rounded"
                          title="Plein écran"
                        >
                          ⤢
                        </button>
                        <iframe
                          src="https://tote-livestream-033.app.100ms.live/streaming/meeting/hzs-ukns-nts"
                          width="100%"
                          height="500px"
                          style={{ border: 'none', borderRadius: '8px' }}
                          allow="camera; microphone; display-capture; fullscreen"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  </div>
                )}
                
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
                                      src={trade.image1} 
                                      alt="Trade screenshot 1"
                                      className="w-20 h-20 object-cover rounded border border-gray-600"
                                    />
                                  )}
                                  {trade.image2 && (
                                    <img 
                                      src={trade.image2} 
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
                {view === 'signals' && (selectedChannel.id === 'calendrier' || selectedChannel.id === 'journal') ? (
                  getTradingCalendar()
                ) : null}
                
                {/* Affichage des signaux */}
                {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss', 'video', '', 'calendrier', 'journal'].includes(selectedChannel.id) ? (
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
                                  image: signal.image || signal.attachment_data,
        attachment_data: signal.attachment_data || signal.image,
        attachment_type: signal.attachment_type,
        attachment_name: signal.attachment_name,
        closure_image: signal.closure_image,
        closure_image_type: signal.closure_image_type,
        closure_image_name: signal.closure_image_name,
                                  timestamp: new Date(signal.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                                  status: signal.status || 'ACTIVE' as const,
                                  channel_id: signal.channel_id,
                                  reactions: signal.reactions || [],
                                  pnl: signal.pnl,
                                  closeMessage: signal.closeMessage
                                }));
                                
                                // Filtrer les doublons avant d'ajouter
                                const existingIds = new Set(currentSignals.map(s => s.id));
                                const signals = formatted.filter(s => !existingIds.has(s.id));
                                
                                if (signals.length > 0) {
                                  setSignals(prev => [...prev, ...signals]);
                                  console.log(`✅ ${signals.length} nouveaux signaux ajoutés`);
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
                                  src={signal.image} 
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
                                  {message.author === currentUsername && profileImage ? (
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
                ) : ['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4'].includes(selectedChannel.id) ? (
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
                      
                      
                      {(messages[selectedChannel.id] || []).length > 0 && 
                        (messages[selectedChannel.id] || []).map((message, index) => {
                          // Vérifier si c'est un nouveau jour par rapport au message précédent
                          let messageDate: Date;
                          
                          // Gérer différents formats de timestamp
                          if (typeof message.timestamp === 'string') {
                            messageDate = new Date(message.timestamp);
                          } else if (typeof message.timestamp === 'number') {
                            // Si c'est un timestamp Firebase (millisecondes)
                            messageDate = new Date(message.timestamp);
                          } else {
                            // Fallback: utiliser la date actuelle
                            messageDate = new Date();
                          }
                          
                          // Vérifier si la date est valide
                          if (isNaN(messageDate.getTime())) {
                            messageDate = new Date(); // Fallback si date invalide
                          }
                          
                          const currentMessageDate = messageDate.toDateString();
                          const previousMessage = index > 0 ? messages[selectedChannel.id][index - 1] : null;
                          let previousMessageDate = null;
                          
                          if (previousMessage) {
                            let prevDate: Date;
                            if (typeof previousMessage.timestamp === 'string') {
                              prevDate = new Date(previousMessage.timestamp);
                            } else if (typeof previousMessage.timestamp === 'number') {
                              prevDate = new Date(previousMessage.timestamp);
                            } else {
                              prevDate = new Date();
                            }
                            
                            if (!isNaN(prevDate.getTime())) {
                              previousMessageDate = prevDate.toDateString();
                            }
                          }
                          
                          const showDateSeparator = index > 0 && previousMessageDate && currentMessageDate !== previousMessageDate;
                          
                          // Formater la date pour l'affichage
                          const today = new Date();
                          const yesterday = new Date(today);
                          yesterday.setDate(yesterday.getDate() - 1);
                          
                          let dayLabel = '';
                          if (messageDate.toDateString() === today.toDateString()) {
                            dayLabel = 'Aujourd\'hui';
                          } else if (messageDate.toDateString() === yesterday.toDateString()) {
                            dayLabel = 'Hier';
                          } else {
                            dayLabel = messageDate.toLocaleDateString('fr-FR', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long' 
                            });
                          }

                          return (
                            <div key={message.id}>
                              {/* Message */}
                              <div className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                              {message.author_avatar ? (
                                <img src={message.author_avatar} alt="Profile" className="w-full h-full object-cover" />
                              ) : message.author === 'Admin' ? (
                                'A'
                              ) : message.author === currentUsername ? (
                                currentUsername.charAt(0).toUpperCase()
                              ) : (
                                'U'
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-white">{message.author}</span>
                                <span className="text-xs text-gray-400">{message.timestamp}</span>
                              </div>
                              <div 
                                className="bg-gray-700 rounded-lg p-3 hover:shadow-lg hover:shadow-gray-900/50 transition-shadow duration-200 max-w-full break-words"
                                data-signal-id={message.text.includes('[SIGNAL_ID:') ? message.text.match(/\[SIGNAL_ID:([^\]]+)\]/)?.[1] : undefined}
                              >
                                <div className="text-white">
                                  {message.text.includes('[SIGNAL_ID:') ? (
                                    <>
                                      {message.text.split('[SIGNAL_ID:')[0]}
                                      <span className="text-gray-700 text-xs">[SIGNAL_ID:{message.text.split('[SIGNAL_ID:')[1].split(']')[0]}]</span>
                                      {message.text.split(']').slice(1).join(']')}
                                      
                                      {/* Flèche cliquable pour les messages de fermeture */}
                                      {(() => {
                                        const isClosureMessage = message.text.includes('SIGNAL FERMÉ');
                                        console.log('🔍 Debug flèche USER - message.text:', message.text);
                                        console.log('🔍 Debug flèche USER - isClosureMessage:', isClosureMessage);
                                        if (isClosureMessage) {
                                          console.log('✅ Flèche USER devrait apparaître !');
                                        }
                                        return isClosureMessage;
                                      })() && (
                                        <span 
                                          className="ml-2 text-blue-400 hover:text-blue-300 cursor-pointer text-2xl transition-colors inline-block bg-blue-500/20 px-2 py-1 rounded-lg hover:bg-blue-500/30"
                                          onClick={() => {
                                            const signalIdMatch = message.text.match(/\[SIGNAL_ID:([^\]]+)\]/);
                                            const signalId = signalIdMatch ? signalIdMatch[1] : '';
                                            console.log('🔍 Debug flèche USER - signalId extrait:', signalId);
                                            console.log('🔍 Debug flèche USER - message.text:', message.text);
                                            
                                            const originalMessage = document.querySelector(`[data-signal-id="${signalId}"]`);
                                            console.log('🔍 Debug flèche USER - élément trouvé:', originalMessage);
                                            console.log('🔍 Debug flèche USER - sélecteur utilisé:', `[data-signal-id="${signalId}"]`);
                                            
                                            // Chercher tous les éléments avec data-signal-id
                                            const allSignalElements = document.querySelectorAll('[data-signal-id]');
                                            console.log('🔍 Debug flèche USER - tous les éléments signal:', allSignalElements);
                                            
                                            if (originalMessage && (originalMessage as HTMLElement).offsetParent !== null) {
                                              console.log('🔍 Debug flèche USER - scroll vers élément:', originalMessage);
                                              console.log('🔍 Debug flèche USER - élément visible:', (originalMessage as HTMLElement).offsetParent !== null);
                                              console.log('🔍 Debug flèche USER - élément dans viewport:', originalMessage.getBoundingClientRect());
                                              
                                              // Forcer le scroll vers le haut de la page d'abord
                                              window.scrollTo({ top: 0, behavior: 'smooth' });
                                              
                                              setTimeout(() => {
                                                originalMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                originalMessage.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-100', 'bg-yellow-400/20');
                                                setTimeout(() => {
                                                  originalMessage.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-100', 'bg-yellow-400/20');
                                                }, 5000);
                                              }, 500);
                                              
                                              console.log('✅ Navigation USER vers le signal original réussie');
                                            } else {
                                              console.log('❌ Signal original USER non trouvé');
                                              console.log('🔍 Debug flèche USER - recherche alternative...');
                                              
                                              // Recherche simple par contenu dans toute la page
                                              const allDivs = document.querySelectorAll('div');
                                              let foundMessage = null;
                                              
                                              for (let div of allDivs) {
                                                if (div.textContent && div.textContent.includes(signalId) && div.classList.contains('bg-gray-700')) {
                                                  foundMessage = div;
                                                  console.log('🔍 Debug flèche USER - message trouvé par contenu:', foundMessage);
                                                  break;
                                                }
                                              }
                                              
                                              if (foundMessage) {
                                                // Scroll direct vers le message trouvé
                                                foundMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                foundMessage.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-100', 'bg-yellow-400/20');
                                                setTimeout(() => {
                                                  foundMessage.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-100', 'bg-yellow-400/20');
                                                }, 5000);
                                                console.log('✅ Navigation USER réussie par contenu');
                                              } else {
                                                console.log('❌ Aucun message trouvé avec ce signalId dans toute la page');
                                              }
                                            }
                                          }}
                                          title="Aller au signal original"
                                        >
                                          ⬆️
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    message.text
                                  )}
                                </div>
                                
                                {/* Boutons WIN/LOSS/BE pour les messages de signal (pas pour les messages de fermeture) */}
                                {message.text.includes('[SIGNAL_ID:') && !message.text.includes('SIGNAL FERMÉ') && (() => {
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
                                          <span 
                                            className="cursor-pointer text-blue-400 hover:text-blue-300 underline"
                                            onClick={() => {
                                              // Trouver le message original du signal
                                              const originalMessage = document.querySelector(`[data-signal-id="${signalId}"]`);
                                              if (originalMessage && (originalMessage as HTMLElement).offsetParent !== null) {
                                                originalMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                // Surligner temporairement
                                                originalMessage.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-50');
                                                setTimeout(() => {
                                                  originalMessage.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-50');
                                                }, 3000);
                                              }
                                            }}
                                          >
                                            Signal {currentSignal?.id || ''} fermé avec {currentSignal?.pnl ? `P&L: ${currentSignal.pnl}` : 'aucun P&L'}
                                          </span>
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
                                        className="mt-2 max-w-xs md:max-w-3xl max-h-40 md:max-h-96 object-contain rounded-lg border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
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
                            </div>
                          );
                        })
                      }
                      <div ref={messagesEndRef} />
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
                                  {message.author === currentUsername && profileImage ? (
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
              {view === 'signals' && (selectedChannel.id === 'calendrier' || selectedChannel.id === 'journal') ? (
                getTradingCalendar()
              ) : null}
              
              {/* Affichage des signaux */}
                              {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss', 'video', 'trading-hub', '', 'calendrier', 'journal'].includes(selectedChannel.id) ? (
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
                                src={signal.image} 
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
                              ) : message.author === currentUsername ? (
                                currentUsername.charAt(0).toUpperCase()
                                ) : (
                                'U'
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
              ) : selectedChannel.id === 'profit-loss' ? (
                <ProfitLoss />
              ) : selectedChannel.id === 'video' ? (
                <div className="flex flex-col h-full bg-gray-900">
                  {/* Interface Video avec Sidebar Visible */}
                  <div className="flex-1 flex flex-col gap-4 p-2">
                    {/* Zone de stream */}
                    <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
                      <div className="h-full flex flex-col items-center justify-center p-4 pt-16">
                        <div className="text-center space-y-4 w-full max-w-[95vw] mx-auto">
                          <h1 className="text-3xl font-bold text-white mb-2">Livestream</h1>
                          <p className="text-gray-400">Attache ta ceinture cousin</p>
                          
                          {/* Iframe 100ms */}
                          <div className="w-full relative">
                            <button
                              onClick={() => {
                                const iframe = document.querySelector('iframe[src*="100ms.live"]') as HTMLIFrameElement;
                                if (iframe && iframe.requestFullscreen) {
                                  iframe.requestFullscreen();
                                }
                              }}
                              className="absolute top-4 right-4 z-10 text-white text-4xl font-bold hover:text-gray-300 transition-colors"
                            >
                              ⤢
                            </button>
                            <iframe
                              src="https://tote-livestream-033.app.100ms.live/streaming/meeting/hzs-ukns-nts"
                              width="100%"
                              height="1700px"
                              style={{ border: 'none', borderRadius: '8px' }}
                              allow="camera; microphone; display-capture; fullscreen"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedChannel.id === 'trading-hub' ? (
                <div className="flex flex-col h-full bg-gray-900">
                  {/* Trading Hub - RumbleTalk */}
                  <div className="flex-1 flex flex-col p-4">
                    <div className="text-center mb-4">
                      <h1 className="text-3xl font-bold text-white mb-2">💬 Trading Hub</h1>
                      <p className="text-gray-400">Discute avec la communauté en temps réel</p>
                    </div>
                    
                    {/* RumbleTalk Chat */}
                    <div className="flex-1 flex items-center justify-center">
                      <RumbleTalk />
                    </div>
                  </div>
                </div>
              ) : selectedChannel.id === 'video' ? (
                <div className="flex flex-col h-full bg-gray-900">
                  {/* Interface Livestream avec Sidebar Visible */}
                  <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
                    {/* Zone de stream */}
                    <div className="flex-1 bg-gray-900 rounded-lg overflow-hidden">
                      <div className="h-full flex flex-col items-center justify-center p-8">
                        <div className="text-center space-y-4">
                          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                          <h2 className="text-xl font-bold text-white">Livestream Trading</h2>
                          <p className="text-gray-400">Session de trading en direct</p>
                          
                          {/* Iframe 100ms */}
                          <div className="w-full max-w-7xl relative">
                            <button
                              onClick={() => {
                                const iframe = document.querySelector('iframe[src*="100ms.live"]') as HTMLIFrameElement;
                                if (iframe && iframe.requestFullscreen) {
                                  iframe.requestFullscreen();
                                }
                              }}
                              className="absolute top-4 right-4 z-10 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              📺 Plein écran
                            </button>
                            <iframe
                              src="https://admintrading.app.100ms.live/meeting/kor-inbw-yiz"
                              width="100%"
                              height="1200px"
                              style={{ border: 'none', borderRadius: '8px' }}
                              allow="camera; microphone; display-capture; fullscreen"
                              allowFullScreen
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Chat live */}
                    <div className="w-full lg:w-80 bg-gray-800 rounded-lg flex flex-col">
                      <div className="p-4 border-b border-gray-700">
                        <h3 className="font-semibold text-white">💬 Chat Live</h3>
                        <p className="text-xs text-gray-400">Commentaires en direct</p>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {(messages['video'] || []).length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-sm">Aucun message</div>
                            <div className="text-gray-500 text-xs mt-1">Soyez le premier à commenter !</div>
                          </div>
                        ) : (
                          (messages['video'] || []).map((message) => (
                            <div key={message.id} className="flex items-start gap-2">
                              <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">T</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-white text-sm">{message.author}</span>
                                  <span className="text-xs text-gray-400">{message.timestamp}</span>
                                </div>
                                <div className="bg-gray-700 rounded-lg p-2">
                                  <p className="text-white text-sm">{message.text}</p>
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
              ) : ['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4'].includes(selectedChannel.id) ? (
                <div className="flex flex-col h-full">
                  {/* Messages de chat */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
                    {(messages[selectedChannel.id] || []).length > 0 && 
                      (messages[selectedChannel.id] || []).map((message, index) => {
                        // Vérifier si c'est un nouveau jour par rapport au message précédent
                        let messageDate: Date;
                        
                        // Gérer différents formats de timestamp
                        if (typeof message.timestamp === 'string') {
                          messageDate = new Date(message.timestamp);
                        } else if (typeof message.timestamp === 'number') {
                          // Si c'est un timestamp Firebase (millisecondes)
                          messageDate = new Date(message.timestamp);
                        } else {
                          // Fallback: utiliser la date actuelle
                          messageDate = new Date();
                        }
                        
                        // Vérifier si la date est valide
                        if (isNaN(messageDate.getTime())) {
                          messageDate = new Date(); // Fallback si date invalide
                        }
                        
                        const currentMessageDate = messageDate.toDateString();
                        const previousMessage = index > 0 ? messages[selectedChannel.id][index - 1] : null;
                        let previousMessageDate = null;
                        
                        if (previousMessage) {
                          let prevDate: Date;
                          if (typeof previousMessage.timestamp === 'string') {
                            prevDate = new Date(previousMessage.timestamp);
                          } else if (typeof previousMessage.timestamp === 'number') {
                            prevDate = new Date(previousMessage.timestamp);
                          } else {
                            prevDate = new Date();
                          }
                          
                          if (!isNaN(prevDate.getTime())) {
                            previousMessageDate = prevDate.toDateString();
                          }
                        }
                        
                        const showDateSeparator = index > 0 && previousMessageDate && currentMessageDate !== previousMessageDate;
                        
                        // Formater la date pour l'affichage
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        
                        let dayLabel = '';
                        if (messageDate.toDateString() === today.toDateString()) {
                          dayLabel = 'Aujourd\'hui';
                        } else if (messageDate.toDateString() === yesterday.toDateString()) {
                          dayLabel = 'Hier';
                        } else {
                          dayLabel = messageDate.toLocaleDateString('fr-FR', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          });
                        }

                        return (
                          <div key={message.id}>
                            {/* Message */}
                            <div className="flex items-start gap-3">
                          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                            {message.author_avatar ? (
                              <img src={message.author_avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : message.author === 'Admin' ? (
                              'A'
                            ) : message.author === currentUsername ? (
                                currentUsername.charAt(0).toUpperCase()
                            ) : (
                                'U'
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{message.author}</span>
                              <span className="text-xs text-gray-400">{message.timestamp}</span>
                            </div>
                            <div className="bg-gray-700 rounded-lg p-3 hover:shadow-lg hover:shadow-gray-900/50 transition-shadow duration-200 max-w-full break-words">
                                <div className="text-white">
                                  {message.text.includes('[SIGNAL_ID:') ? (
                                    <>
                                      {message.text.split('[SIGNAL_ID:')[0]}
                                      <span className="text-gray-700 text-xs">[SIGNAL_ID:{message.text.split('[SIGNAL_ID:')[1].split(']')[0]}]</span>
                                      {message.text.split(']').slice(1).join(']')}
                                      
                                      {/* Flèche cliquable pour les messages de fermeture */}
                                      {(() => {
                                        const isClosureMessage = message.text.includes('SIGNAL FERMÉ');
                                        console.log('🔍 Debug flèche USER - message.text:', message.text);
                                        console.log('🔍 Debug flèche USER - isClosureMessage:', isClosureMessage);
                                        if (isClosureMessage) {
                                          console.log('✅ Flèche USER devrait apparaître !');
                                        }
                                        return isClosureMessage;
                                      })() && (
                                        <span 
                                          className="ml-2 text-blue-400 hover:text-blue-300 cursor-pointer text-2xl transition-colors inline-block bg-blue-500/20 px-2 py-1 rounded-lg hover:bg-blue-500/30"
                                          onClick={() => {
                                            const signalIdMatch = message.text.match(/\[SIGNAL_ID:([^\]]+)\]/);
                                            const signalId = signalIdMatch ? signalIdMatch[1] : '';
                                            console.log('🔍 Debug flèche USER - signalId extrait:', signalId);
                                            console.log('🔍 Debug flèche USER - message.text:', message.text);
                                            
                                            const originalMessage = document.querySelector(`[data-signal-id="${signalId}"]`);
                                            console.log('🔍 Debug flèche USER - élément trouvé:', originalMessage);
                                            console.log('🔍 Debug flèche USER - sélecteur utilisé:', `[data-signal-id="${signalId}"]`);
                                            
                                            // Chercher tous les éléments avec data-signal-id
                                            const allSignalElements = document.querySelectorAll('[data-signal-id]');
                                            console.log('🔍 Debug flèche USER - tous les éléments signal:', allSignalElements);
                                            
                                            if (originalMessage && (originalMessage as HTMLElement).offsetParent !== null) {
                                              console.log('🔍 Debug flèche USER - scroll vers élément:', originalMessage);
                                              console.log('🔍 Debug flèche USER - élément visible:', (originalMessage as HTMLElement).offsetParent !== null);
                                              console.log('🔍 Debug flèche USER - élément dans viewport:', originalMessage.getBoundingClientRect());
                                              
                                              // Forcer le scroll vers le haut de la page d'abord
                                              window.scrollTo({ top: 0, behavior: 'smooth' });
                                              
                                              setTimeout(() => {
                                                originalMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                originalMessage.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-100', 'bg-yellow-400/20');
                                                setTimeout(() => {
                                                  originalMessage.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-100', 'bg-yellow-400/20');
                                                }, 5000);
                                              }, 500);
                                              
                                              console.log('✅ Navigation USER vers le signal original réussie');
                                            } else {
                                              console.log('❌ Signal original USER non trouvé');
                                              console.log('🔍 Debug flèche USER - recherche alternative...');
                                              
                                              // Recherche simple par contenu dans toute la page
                                              const allDivs = document.querySelectorAll('div');
                                              let foundMessage = null;
                                              
                                              for (let div of allDivs) {
                                                if (div.textContent && div.textContent.includes(signalId) && div.classList.contains('bg-gray-700')) {
                                                  foundMessage = div;
                                                  console.log('🔍 Debug flèche USER - message trouvé par contenu:', foundMessage);
                                                  break;
                                                }
                                              }
                                              
                                              if (foundMessage) {
                                                // Scroll direct vers le message trouvé
                                                foundMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                foundMessage.classList.add('ring-4', 'ring-yellow-400', 'ring-opacity-100', 'bg-yellow-400/20');
                                                setTimeout(() => {
                                                  foundMessage.classList.remove('ring-4', 'ring-yellow-400', 'ring-opacity-100', 'bg-yellow-400/20');
                                                }, 5000);
                                                console.log('✅ Navigation USER réussie par contenu');
                                              } else {
                                                console.log('❌ Aucun message trouvé avec ce signalId dans toute la page');
                                              }
                                            }
                                          }}
                                          title="Aller au signal original"
                                        >
                                          ⬆️
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    message.text
                                  )}
                                </div>
                                
                                {/* Boutons WIN/LOSS/BE pour les messages de signal (pas pour les messages de fermeture) */}
                                {message.text.includes('[SIGNAL_ID:') && !message.text.includes('SIGNAL FERMÉ') && (() => {
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
                                          <span 
                                            className="cursor-pointer text-blue-400 hover:text-blue-300 underline"
                                            onClick={() => {
                                              // Trouver le message original du signal
                                              const originalMessage = document.querySelector(`[data-signal-id="${signalId}"]`);
                                              if (originalMessage && (originalMessage as HTMLElement).offsetParent !== null) {
                                                originalMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                // Surligner temporairement
                                                originalMessage.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-50');
                                                setTimeout(() => {
                                                  originalMessage.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-50');
                                                }, 3000);
                                              }
                                            }}
                                          >
                                            Signal {currentSignal?.id || ''} fermé avec {currentSignal?.pnl ? `P&L: ${currentSignal.pnl}` : 'aucun P&L'}
                                          </span>
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
                                        className="mt-2 max-w-xs md:max-w-3xl max-h-40 md:max-h-96 object-contain rounded-lg border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
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
                          </div>
                        );
                        })
                      }
                      <div ref={messagesEndRef} />
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
                  ></textarea>
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
                        <div className="mt-2 space-y-3 flex flex-col items-center">
                          {trade.image1 && (
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-500">📸 Image 1:</span>
                              <div className="mt-1">
                                <img 
                                  src={trade.image1 instanceof File ? URL.createObjectURL(trade.image1) : trade.image1} 
                                  alt="Trade image 1" 
                                  className="w-96 h-96 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-600"
                                  onClick={() => setSelectedImage(trade.image1 instanceof File ? URL.createObjectURL(trade.image1) : trade.image1)}
                                />
                              </div>
                            </div>
                          )}
                          {trade.image2 && (
                            <div className="flex flex-col items-center">
                              <span className="text-xs text-gray-500">📸 Image 2:</span>
                              <div className="mt-1">
                                <img 
                                  src={trade.image2 instanceof File ? URL.createObjectURL(trade.image2) : trade.image2} 
                                  alt="Trade image 2" 
                                  className="w-96 h-96 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-600"
                                  onClick={() => setSelectedImage(trade.image2 instanceof File ? URL.createObjectURL(trade.image2) : trade.image2)}
                                />
                              </div>
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
                    console.log('🔍 [POPUP USER] Données reçues dans le popup:', signals);
                    signals.forEach(signal => {
                      console.log('🔍 [POPUP USER] Signal individuel COMPLET:', {
                        id: signal.id,
                        symbol: signal.symbol,
                        image: signal.image,
                        attachment_data: signal.attachment_data,
                        attachment_type: signal.attachment_type,
                        attachment_name: signal.attachment_name,
                        closure_image: signal.closure_image,
                        closure_image_type: signal.closure_image_type,
                        closure_image_name: signal.closure_image_name,
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
                        {(signal.image || signal.attachment_data || signal.closure_image) && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-400">Images:</span>
                            <div className="mt-2 space-y-3 flex flex-col items-center">
                              {(signal.image || signal.attachment_data) && (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500">📸 Image de création:</span>
                                  <div className="mt-1">
                                    <img 
                                      src={signal.image || signal.attachment_data}
                                      alt="Signal image"
                                      className="w-96 h-96 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-600"
                                      onClick={() => setSelectedImage(signal.image || signal.attachment_data)}
                                    />
                                  </div>
                                </div>
                              )}
                              {signal.closure_image && (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500">📸 Image de fermeture:</span>
                                  <div className="mt-1">
                                    <img 
                                      src={signal.closure_image}
                                      alt="Signal closure image"
                                      className="w-96 h-96 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-600"
                                      onClick={() => setSelectedImage(signal.closure_image)}
                                    />
                                  </div>
                                </div>
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
                  {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? 'Trades de la Semaine' : 'Signaux de la Semaine'} {selectedWeek}
                </h2>
                <button
                  onClick={() => setShowWeekSignalsModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {(selectedChannel.id === 'trading-journal' || selectedChannel.id === 'journal') ? (
                  // Affichage des trades pour le journal perso
                  getTradesForWeek(selectedWeek).length > 0 ? (
                    getTradesForWeek(selectedWeek).map((trade) => (
                      <div key={trade.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              trade.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}>
                              {trade.type}
                            </span>
                            <span className="text-lg font-bold text-white">{trade.symbol}</span>
                            <span className="text-sm text-gray-400">{trade.date}</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            trade.status === 'WIN' ? 'bg-green-600 text-white' :
                            trade.status === 'LOSS' ? 'bg-red-600 text-white' :
                            trade.status === 'BE' ? 'bg-blue-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {trade.status}
                          </span>
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
                            <span className="text-sm text-gray-400">PnL:</span>
                            <span className={`ml-2 font-bold ${
                              trade.pnl && trade.pnl.includes('-') ? 'text-red-400' : 'text-green-400'
                            }`}>
                              {trade.pnl || 'N/A'}
                            </span>
                          </div>
                        </div>

                        {trade.notes && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-400">Notes:</span>
                            <p className="text-white mt-1">{trade.notes}</p>
                          </div>
                        )}

                        {/* Affichage des images */}
                        {(trade.image1 || trade.image2) && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-400">Images:</span>
                            <div className="flex gap-2 mt-2">
                              {trade.image1 && (
                                <img 
                                  src={trade.image1}
                                  alt="Trade image 1"
                                  className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                  onClick={() => setSelectedImage(trade.image1)}
                                />
                              )}
                              {trade.image2 && (
                                <img 
                                  src={trade.image2}
                                  alt="Trade image 2"
                                  className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                  onClick={() => setSelectedImage(trade.image2)}
                                />
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>Créé le {trade.timestamp}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-lg mb-2">📊</div>
                      <div className="text-gray-300 text-lg font-medium">Aucun trade pour cette semaine</div>
                      <div className="text-gray-500 text-sm mt-1">Tes trades apparaîtront ici quand tu les ajouteras</div>
                    </div>
                  )
                ) : (
                  // Affichage des signaux pour les autres canaux
                  getSignalsForWeek(selectedWeek).length > 0 ? (
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
                        {(signal.image || signal.attachment_data || signal.closure_image) && (
                          <div className="mb-3">
                            <span className="text-sm text-gray-400">Images:</span>
                            <div className="mt-2 space-y-3 flex flex-col items-center">
                              {(signal.image || signal.attachment_data) && (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500">📸 Image de création:</span>
                                  <div className="mt-1">
                                    <img 
                                      src={signal.image || signal.attachment_data}
                                      alt="Signal image"
                                      className="w-96 h-96 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-600"
                                      onClick={() => setSelectedImage(signal.image || signal.attachment_data)}
                                    />
                                  </div>
                                </div>
                              )}
                              {signal.closure_image && (
                                <div className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500">📸 Image de fermeture:</span>
                                  <div className="mt-1">
                                    <img 
                                      src={signal.closure_image}
                                      alt="Signal closure image"
                                      className="w-96 h-96 object-cover rounded cursor-pointer hover:opacity-80 border border-gray-600"
                                      onClick={() => setSelectedImage(signal.closure_image)}
                                    />
                                  </div>
                                </div>
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
                  )
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

      {/* Modal pour ajouter un nouveau compte */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-white mb-4">Ajouter un nouveau compte</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Nom du compte</label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="Ex: Compte Demo, Compte Live..."
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddAccount()}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleAddAccount}
                className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white font-medium"
              >
                Ajouter
              </button>
              <button
                onClick={() => {
                  setShowAddAccountModal(false);
                  setNewAccountName('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg text-white font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
                