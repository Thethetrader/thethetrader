import React, { useState, useEffect, useRef } from 'react';
import ProfitLoss from './ProfitLoss';
import ChatZone from './ChatZone';
import { addMessage, getMessages, addSignal, getSignals, updateSignalStatus, subscribeToMessages, uploadImage, updateSignalReactions, subscribeToSignals, database, updateMessageReactions, getMessageReactions, subscribeToMessageReactions, addPersonalTrade, getPersonalTrades, PersonalTrade, syncUserId, listenToPersonalTrades } from '../utils/firebase-setup';
import { initializeNotifications, notifyNewSignal, notifySignalClosed, sendLocalNotification } from '../utils/push-notifications';
import { ref, update, onValue, get } from 'firebase/database';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { syncProfileImage, getProfileImage, initializeProfile } from '../utils/profile-manager';
import { signOutAdmin } from '../utils/admin-utils';
import { updateUserProfile, getCurrentUser, getUserProfile, getUserProfileByType } from '../lib/supabase';

export default function AdminInterface() {

  const [selectedChannel, setSelectedChannel] = useState({ id: 'fondamentaux', name: 'fondamentaux' });
  const [view, setView] = useState<'signals' | 'calendar'>('signals');
  const [mobileView, setMobileView] = useState<'channels' | 'content'>('channels');
  const [showChannelsOverlay, setShowChannelsOverlay] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{[channelId: string]: Array<{id: string, text: string, user: string, timestamp: string, file?: File}>}>({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showSignalModal, setShowSignalModal] = useState(false);
  const [showTradesModal, setShowTradesModal] = useState(false);
  const [showSignalsModal, setShowSignalsModal] = useState(false);
  const [selectedTradesDate, setSelectedTradesDate] = useState<Date | null>(null);
  const [selectedSignalsDate, setSelectedSignalsDate] = useState<Date | null>(null);
  const [pasteArea, setPasteArea] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // États pour l'édition du nom d'utilisateur
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [currentUsername, setCurrentUsername] = useState('Admin');

  // État pour les réactions aux messages (côté admin)
  const [messageReactions, setMessageReactions] = useState<{[messageId: string]: {fire: number, users: string[]}}>({});

  // Charger les réactions depuis Firebase et s'abonner aux changements
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
        console.error('❌ Erreur chargement réactions messages admin Firebase:', error);
      }
    };
    
    if (Object.keys(messages).length > 0) {
      loadAndSubscribeToReactions();
    }
  }, [messages]);
  
  // S'abonner aux changements de réactions de manière globale (pour tous les messages)
  useEffect(() => {
    
    // Créer un nœud de référence pour toutes les réactions aux messages
    const messageReactionsRef = ref(database, 'messageReactions');
    
    const unsubscribe = onValue(messageReactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allReactions = snapshot.val();
        
        // Mettre à jour l'état local avec toutes les réactions
        setMessageReactions(allReactions);
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // S'abonner aux changements des signaux pour synchroniser les réactions
  useEffect(() => {
    const channels = ['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4'];
    
    const subscriptions = channels.map(channelId => {
      return subscribeToSignals(channelId, (updatedSignal) => {
        
        // Mettre à jour le signal dans l'état local
        setSignals(prev => prev.map(signal => 
          signal.id === updatedSignal.id 
            ? { ...signal, reactions: updatedSignal.reactions || [] }
            : signal
        ));
      });
    });

    return () => {
      subscriptions.forEach(subscription => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
    };
  }, []);

  // Fonction pour ajouter une réaction flamme à un message (côté admin)
  const handleAddReaction = async (messageId: string) => {
    const currentUser = 'Admin'; // Toujours Admin dans l'interface admin
    
    try {
      // Mettre à jour localement d'abord pour une réponse immédiate
      setMessageReactions(prev => {
        const current = prev[messageId] || { fire: 0, users: [] };
        const userIndex = current.users.indexOf(currentUser);
        
        if (userIndex === -1) {
          // Ajouter la réaction
          return {
            ...prev,
            [messageId]: {
              fire: current.fire + 1,
              users: [...current.users, currentUser]
            }
          };
        } else {
          // Retirer la réaction
          const newUsers = current.users.filter((_, index) => index !== userIndex);
          return {
            ...prev,
            [messageId]: {
              fire: current.fire - 1,
              users: newUsers
            }
          };
        }
      });
      
      // Sauvegarder dans Firebase
      const current = messageReactions[messageId] || { fire: 0, users: [] };
      const userIndex = current.users.indexOf(currentUser);
      
      let newReactions;
      if (userIndex === -1) {
        // Ajouter la réaction
        newReactions = {
          fire: current.fire + 1,
          users: [...current.users, currentUser]
        };
      } else {
        // Retirer la réaction
        newReactions = {
          fire: current.fire - 1,
          users: current.users.filter((_, index) => index !== userIndex)
        };
      }
      
      await updateMessageReactions(messageId, newReactions);
      
    } catch (error) {
      console.error('❌ Erreur synchronisation réaction admin Firebase:', error);
      // En cas d'erreur, revenir à l'état précédent
      setMessageReactions(prev => {
        const current = prev[messageId] || { fire: 0, users: [] };
        return {
          ...prev,
          [messageId]: current
        };
      });
    }
  };

  const [lastSeenMessages, setLastSeenMessages] = useState<{[channelId: string]: string}>({});
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

  // Fonction pour charger les messages depuis Firebase
  const loadMessages = async (channelId: string) => {
    try {
      const messages = await getMessages(channelId);
      const formattedMessages = messages.map(msg => ({
        id: msg.id || '',
        text: msg.content,
        timestamp: new Date(msg.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        author: msg.author,
        author_avatar: msg.author_avatar, // CONSERVER l'avatar de l'auteur !
        attachment: msg.attachment_data ? {
          type: msg.attachment_type || 'image/jpeg',
          name: msg.attachment_name || 'image.jpg'
        } : undefined,
        attachment_data: msg.attachment_data
      }));
      
      setChatMessages(prev => ({
        ...prev,
        [channelId]: formattedMessages
      }));
      
      
      // Scroller vers le bas après le chargement des messages
      setTimeout(() => {
        scrollToBottom();
      }, 5);
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
    }
  };

  // Subscription globale pour tous les canaux (ne se recrée pas à chaque changement de canal)
  useEffect(() => {
    const channels = ['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4'];
    
    const subscriptions = channels.map(channelId => {
      return subscribeToMessages(channelId, (newMessage) => {
        
        // Compter les nouveaux messages seulement si on n'est pas dans ce canal
        if (selectedChannel.id !== channelId) {
        }
      });
    });

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []); // Supprimer selectedChannel.id de la dépendance

  // Charger les signaux et initialiser les notifications au montage du composant
  useEffect(() => {
    loadSignals(selectedChannel.id);
    
    // Initialiser les notifications push
    initializeNotifications();
  }, []);

  // Charger les messages quand on change de canal
  useEffect(() => {
    loadMessages(selectedChannel.id);
    // Charger aussi les signaux
    loadSignals(selectedChannel.id);
    // Scroller vers le bas quand on entre dans un salon
    setTimeout(() => {
      scrollToBottom();
    }, 50);
  }, [selectedChannel.id]);





  // Les messages temps réel sont gérés par les subscriptions globales

  // Initialiser les signaux existants avec le statut ACTIVE
  useEffect(() => {
    setSignals(prevSignals => 
      prevSignals.map(signal => ({
        ...signal,
        status: signal.status || 'ACTIVE'
      }))
    );
    

  }, []);
  const [chatMessage, setChatMessage] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Initialiser le profil au chargement
  useEffect(() => {
    const initProfile = async () => {
      
      // Charger depuis localStorage directement
      const localImage = localStorage.getItem('adminProfileImage');
      if (localImage) {
        setProfileImage(localImage);
      } else {
      }

      // Charger le nom d'utilisateur admin (Supabase d'abord, puis localStorage)
      try {
        const user = await getCurrentUser();
        if (user) {
          
          const { data } = await getUserProfileByType('admin');
          
          if (data?.name) {
            setCurrentUsername(data.name);
          } else {
            // Profil n'existe pas, créer un profil par défaut
            const defaultName = 'Admin';
            
            // Créer le profil dans Supabase
            const { data: newProfile } = await updateUserProfile(defaultName, undefined, 'admin');
            
            if (newProfile) {
              setCurrentUsername(defaultName);
            } else {
              // Fallback localStorage
              const localUsername = localStorage.getItem('adminUsername');
              if (localUsername) {
                setCurrentUsername(localUsername);
              } else {
                setCurrentUsername(defaultName);
              }
            }
          }
        } else {
          const localUsername = localStorage.getItem('adminUsername');
          if (localUsername) {
            setCurrentUsername(localUsername);
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement du nom d\'utilisateur admin:', error);
        // Mode dégradé : localStorage
        const localUsername = localStorage.getItem('adminUsername');
        if (localUsername) {
          setCurrentUsername(localUsername);
        } else {
        }
      }
    };
    
    initProfile();
  }, []);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  // États pour la gestion des utilisateurs
  const [users, setUsers] = useState<Array<{
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
    status: 'active' | 'inactive';
  }>>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: ''
  });
  
  // États pour recherche et filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'email' | 'created_at' | 'last_sign_in_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [chatMessages, setChatMessages] = useState<{[channelId: string]: Array<{
    id: string;
    text: string;
    timestamp: string;
    author: string;
    author_avatar?: string;
    attachment?: any;
    attachment_data?: string;
    attachment_type?: string;
    attachment_name?: string;
  }>}>({});

  // Initialiser la base de données au chargement
  useEffect(() => {
    // initializeDatabase();
  }, []);

  // Debug: Afficher profileImage
  useEffect(() => {
  }, [profileImage]);

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
  
  // Fonction pour charger les signaux depuis Firebase
  const loadSignals = async (channelId: string) => {
    try {
      const startTime = performance.now();
      
      // Charger SEULEMENT les signaux du canal (optimisé)
      const filteredSignals = await getSignals(channelId);
      
      const endTime = performance.now();
      
      const formattedSignals = filteredSignals.map(signal => ({
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
      
      setSignals(formattedSignals.reverse());
    } catch (error) {
      console.error('❌ Erreur chargement signaux:', error);
    }
  };

  // Fonction pour changer de canal et réinitialiser selectedDate si nécessaire
  const handleChannelChange = (channelId: string, channelName: string) => {
    // Réinitialiser selectedDate si on quitte le Trading Journal
    if (selectedChannel.id === 'trading-journal' && channelId !== 'trading-journal') {
      setSelectedDate(null);
    }
    
    setSelectedChannel({id: channelId, name: channelName});
    setView('signals');
    scrollToTop();
    
    // Les signaux seront chargés automatiquement par le useEffect qui écoute selectedChannel.id
    // Pas besoin d'appeler loadSignals ici
    
    // Canal changé
    
  };
  const [personalTrades, setPersonalTrades] = useState<PersonalTrade[]>([]);

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
    };
    syncUser();
  }, []); // Une seule fois au démarrage
  
  // Synchronisation temps réel des trades personnels
  useEffect(() => {
    // Forcer l'initialisation de l'ID utilisateur
    localStorage.setItem('user_id', 'user_unified');
    
    
    // Démarrer l'écoute temps réel
    const unsubscribe = listenToPersonalTrades(
      (trades) => {
        setPersonalTrades(trades);
      },
      (error) => {
        console.error('❌ Erreur synchronisation temps réel [ADMIN]:', error);
      }
    );
    
    // Nettoyer l'écoute au démontage du composant
    return () => {
      unsubscribe();
    };
  }, []); // Une seule fois au démarrage

  // Debug: Afficher les trades au chargement
  useEffect(() => {
  }, [personalTrades]);

  // Charger les signaux au démarrage (SIMPLE ET RAPIDE)
  useEffect(() => {
    loadSignals(selectedChannel.id);
  }, [selectedChannel.id]);

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

  // Forcer la mise à jour de currentDate vers la date actuelle au chargement
  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
  }, []);

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
            
            // Calculate Risk:Reward ratio and Take Profit if available
            if (stopLevel !== undefined && profitLevel !== undefined && entryPrice !== undefined) {
              const rrRatio = Math.round((profitLevel / stopLevel) * 100) / 100;
              extracted.rr = rrRatio.toString();
              
              // Calculate Stop Loss and Take Profit based on entry price and levels
              let slPrice, tpPrice;
              if (extracted.tradeType === 'buy') {
                // For Long trades
                const stopDistance = stopLevel / 4; 
                const profitDistance = profitLevel / 4;
                slPrice = entryPrice - stopDistance;
                tpPrice = entryPrice + profitDistance;
              } else {
                // For Short trades  
                const stopDistance = stopLevel / 4;
                const profitDistance = profitLevel / 4;
                slPrice = entryPrice + stopDistance;
                tpPrice = entryPrice - profitDistance;
              }
              extracted.stopLoss = slPrice.toString();
              extracted.takeProfit = tpPrice.toString();
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
        takeProfit: extracted.takeProfit || signalData.takeProfit,
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
    image: File | null;
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
        
        // Charger les signaux de tous les canaux individuellement
        const channels = ['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4'];
        let allSignals: any[] = [];
        
        for (const channelId of channels) {
          try {
            const channelSignals = await getSignals(channelId, 100); // 100 signaux par canal
            if (channelSignals && channelSignals.length > 0) {
              allSignals = [...allSignals, ...channelSignals];
            }
          } catch (error) {
            console.error(`❌ [ADMIN] Erreur chargement signaux pour ${channelId}:`, error);
          }
        }
        
        if (allSignals.length > 0) {
          // Formater les signaux pour correspondre au type attendu
          const formattedSignals = allSignals.map(signal => {
            // Pour les signaux fermés, garder la vraie date
            // Pour les signaux actifs, utiliser HH:MM
            const isClosed = signal.status && signal.status !== 'ACTIVE';
            const timestamp = isClosed 
              ? new Date(signal.timestamp || Date.now()).toISOString() // Vraie date pour signaux fermés
              : new Date(signal.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); // HH:MM pour signaux actifs
            
            return {
              id: signal.id || '',
              type: signal.type,
              symbol: signal.symbol,
              timeframe: signal.timeframe,
              entry: signal.entry?.toString() || 'N/A',
              takeProfit: signal.takeProfit?.toString() || 'N/A',
              stopLoss: signal.stopLoss?.toString() || 'N/A',
              description: signal.description || '',
              image: signal.image,
              attachment_data: signal.attachment_data,
              attachment_type: signal.attachment_type,
              attachment_name: signal.attachment_name,
              timestamp: timestamp,
              originalTimestamp: signal.timestamp || Date.now(),
              status: signal.status || 'ACTIVE' as const,
              channel_id: signal.channel_id,
              reactions: signal.reactions || [],
              pnl: signal.pnl,
              closeMessage: signal.closeMessage
            };
          });
          
          setAllSignalsForStats(formattedSignals);
            channel: ch,
            count: formattedSignals.filter(s => s.channel_id === ch).length
          })));
        } else {
        }
      } catch (error) {
        console.error('❌ [ADMIN] Erreur chargement signaux pour statistiques:', error);
      }
    };

    loadAllSignalsForStats();
  }, [selectedChannel.id]); // Recharger quand le canal change

  // Mettre à jour allSignalsForStats en temps réel quand de nouveaux signaux arrivent
  useEffect(() => {
    if (signals.length > 0) {
      
      // Mettre à jour allSignalsForStats avec les nouveaux signaux
      setAllSignalsForStats(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newSignals = signals.filter(s => !existingIds.has(s.id));
        
        if (newSignals.length > 0) {
          
          // Formater les nouveaux signaux avec originalTimestamp et données d'attachement
          const formattedNewSignals = newSignals.map(signal => ({
            ...signal,
            originalTimestamp: signal.timestamp || Date.now(),
            attachment_data: signal.attachment_data,
            attachment_type: signal.attachment_type,
            attachment_name: signal.attachment_name
          }));
          
          return [...prev, ...formattedNewSignals];
        }
        
        return prev;
      });
    }
  }, [signals]);

  // Fonctions pour les statistiques des signaux (utilisent TOUS les signaux du mois sélectionné)
  const calculateTotalPnL = (): number => {
    const monthSignals = getThisMonthSignals();
    const filteredSignals = monthSignals.filter(s => s.pnl && s.status !== 'ACTIVE');
    const total = filteredSignals.reduce((total, signal) => total + parsePnL(signal.pnl), 0);
    return total;
  };

  const calculateWinRate = (): number => {
    const monthSignals = getThisMonthSignals();
    const closedSignals = monthSignals.filter(s => s.status !== 'ACTIVE');
    if (closedSignals.length === 0) return 0;
    const wins = closedSignals.filter(s => s.status === 'WIN').length;
    const winRate = Math.round((wins / closedSignals.length) * 100);
    return winRate;
  };

  const calculateAvgWin = (): number => {
    const monthSignals = getThisMonthSignals();
    const winSignals = monthSignals.filter(s => s.status === 'WIN' && s.pnl);
    if (winSignals.length === 0) return 0;
    const totalWinPnL = winSignals.reduce((total, signal) => total + parsePnL(signal.pnl), 0);
    const avgWin = Math.round(totalWinPnL / winSignals.length);
    return avgWin;
  };

  const calculateAvgLoss = (): number => {
    const monthSignals = getThisMonthSignals();
    const lossSignals = monthSignals.filter(s => s.status === 'LOSS' && s.pnl);
    if (lossSignals.length === 0) return 0;
    const totalLossPnL = lossSignals.reduce((total, signal) => total + Math.abs(parsePnL(signal.pnl)), 0);
    const avgLoss = Math.round(totalLossPnL / lossSignals.length);
    return avgLoss;
  };

  const getTodaySignals = () => {
    
    // Utiliser currentDate au lieu de today
    const todaySignals = allSignalsForStats.filter(s => {
      // Utiliser le timestamp original pour déterminer la vraie date
      const signalDate = new Date(s.originalTimestamp || s.timestamp);
      
      // Si la date est invalide, ignorer ce signal
      if (isNaN(signalDate.getTime())) {
        return false;
      }
      
      const isToday = signalDate.getDate() === currentDate.getDate() &&
             signalDate.getMonth() === currentDate.getMonth() &&
             signalDate.getFullYear() === currentDate.getFullYear();
      
      return isToday;
    });
    
    return todaySignals;
  };

  const getThisMonthSignals = () => {
    
    // Utiliser currentDate au lieu de today
    const monthSignals = allSignalsForStats.filter(s => {
      // Utiliser le timestamp original pour déterminer la vraie date
      const signalDate = new Date(s.originalTimestamp || s.timestamp);
      
      // Si la date est invalide, ignorer ce signal
      if (isNaN(signalDate.getTime())) {
        return false;
      }
      
      const isThisMonth = signalDate.getMonth() === currentDate.getMonth() &&
             signalDate.getFullYear() === currentDate.getFullYear();
      
      return isThisMonth;
    });
    
    return monthSignals;
  };

  // Fonctions pour les statistiques des trades personnels - DYNAMIQUES selon mois sélectionné
  const calculateTotalPnLTrades = (): number => {
    const monthTrades = personalTrades.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === currentDate.getMonth() &&
             tradeDate.getFullYear() === currentDate.getFullYear();
    });
    return monthTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0);
  };

  const calculateWinRateTrades = (): number => {
    const monthTrades = personalTrades.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === currentDate.getMonth() &&
             tradeDate.getFullYear() === currentDate.getFullYear();
    });
    if (monthTrades.length === 0) return 0;
    const wins = monthTrades.filter(t => t.status === 'WIN').length;
    return Math.round((wins / monthTrades.length) * 100);
  };

  const calculateAvgWinTrades = (): number => {
    const monthTrades = personalTrades.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === currentDate.getMonth() &&
             tradeDate.getFullYear() === currentDate.getFullYear();
    });
    const winTrades = monthTrades.filter(t => t.status === 'WIN');
    if (winTrades.length === 0) return 0;
    const totalWinPnL = winTrades.reduce((total, trade) => total + parsePnL(trade.pnl), 0);
    return Math.round(totalWinPnL / winTrades.length);
  };

  const calculateAvgLossTrades = (): number => {
    const monthTrades = personalTrades.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === currentDate.getMonth() &&
             tradeDate.getFullYear() === currentDate.getFullYear();
    });
    const lossTrades = monthTrades.filter(t => t.status === 'LOSS');
    if (lossTrades.length === 0) return 0;
    const totalLossPnL = lossTrades.reduce((total, trade) => total + Math.abs(parsePnL(trade.pnl)), 0);
    return Math.round(totalLossPnL / lossTrades.length);
  };

  const getTodayTrades = () => {
    const currentDateStr = currentDate.toISOString().split('T')[0];
    return personalTrades.filter(t => t.date === currentDateStr);
  };

  const getThisMonthTrades = () => {
    return personalTrades.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate.getMonth() === currentDate.getMonth() &&
             tradeDate.getFullYear() === currentDate.getFullYear();
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
    // Utiliser currentDate au lieu de today
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calculer le nombre de semaines nécessaires pour ce mois
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalWeeks = Math.ceil(lastDayOfMonth.getDate() / 7);
    
    
    // Créer les semaines nécessaires pour ce mois
    const weeks = [];
    for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
      const weekStart = new Date(currentYear, currentMonth, (weekNum - 1) * 7 + 1);
      const weekEnd = new Date(currentYear, currentMonth, Math.min(weekNum * 7, lastDayOfMonth.getDate()));
      
      
      const weekSignals = allSignalsForStats.filter(s => {
        // Utiliser le timestamp original pour déterminer la vraie date
        const signalDate = new Date(s.originalTimestamp || s.timestamp);
        
        // Si la date est invalide, ignorer ce signal
        if (isNaN(signalDate.getTime())) {
          return false;
        }
        
        const isInWeek = signalDate >= weekStart && 
               signalDate <= weekEnd &&
               signalDate.getMonth() === currentMonth &&
               signalDate.getFullYear() === currentYear;
        
        // Debug pour la semaine 4
        if (weekNum === 4) {
        }
        
        return isInWeek;
      });
      
      const closedSignals = weekSignals.filter(s => s.status !== 'ACTIVE');
      const weekPnL = closedSignals.reduce((total, signal) => total + parsePnL(signal.pnl || '0'), 0);
      const wins = closedSignals.filter(s => s.status === 'WIN').length;
      const losses = closedSignals.filter(s => s.status === 'LOSS').length;
      
      // Vérifier si c'est la semaine actuelle
      const todayWeek = Math.ceil(currentDate.getDate() / 7);
      const isCurrentWeek = weekNum === todayWeek;
      
      weeks.push({
        week: `Week ${weekNum}`,
        weekNum: weekNum,
        trades: weekSignals.length,
        pnl: 0, // Pas de PnL affiché
        wins,
        losses,
        isCurrentWeek
      });
    }
    
    return weeks;
  };

  const getWeeklyBreakdownTrades = () => {
    // Utiliser currentDate au lieu de today
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calculer le nombre de semaines nécessaires pour ce mois
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalWeeks = Math.ceil(lastDayOfMonth.getDate() / 7);
    
    // Créer les semaines nécessaires pour ce mois
    const weeks = [];
    for (let weekNum = 1; weekNum <= totalWeeks; weekNum++) {
      const weekStart = new Date(currentYear, currentMonth, (weekNum - 1) * 7 + 1);
      const weekEnd = new Date(currentYear, currentMonth, Math.min(weekNum * 7, lastDayOfMonth.getDate()));
      
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
      const todayWeek = Math.ceil(currentDate.getDate() / 7);
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

  const getTradesForWeek = (weekNum: number) => {
    try {
      if (!Array.isArray(personalTrades)) {
        console.error('personalTrades n\'est pas un tableau:', personalTrades);
        return [];
      }


      // Calculer les dates de début et fin de la semaine
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Premier jour du mois
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = dimanche, 1 = lundi, etc.
      
      // Calculer le début de la semaine demandée
      const weekStart = new Date(currentYear, currentMonth, 1 + (weekNum - 1) * 7 - firstDayOfWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      
      const filteredTrades = personalTrades.filter(trade => {
        if (!trade || !trade.date) {
          return false;
        }
        
        const tradeDate = new Date(trade.date);
        const isInWeek = tradeDate >= weekStart && tradeDate <= weekEnd;
        return isInWeek;
      });
      
      return filteredTrades;
    } catch (error) {
      console.error('❌ Erreur dans getTradesForWeek [ADMIN]:', error);
      return [];
    }
  };

  // Fonctions pour gérer les statuts des signaux
  const handleReaction = async (signalId: string, emoji: string) => {
    // Mettre à jour localement d'abord
    setSignals(prev => prev.map(signal => {
      if (signal.id === signalId) {
        const currentReactions = signal.reactions || [];
        const hasReaction = currentReactions.includes(emoji);
        
        if (hasReaction) {
          // Retirer la réaction
          const newReactions = currentReactions.filter(r => r !== emoji);
          // Sauvegarder dans Firebase
          updateSignalReactions(signalId, newReactions);
          return {
            ...signal,
            reactions: newReactions
          };
        } else {
          // Ajouter la réaction
          const newReactions = [...currentReactions, emoji];
          // Sauvegarder dans Firebase
          updateSignalReactions(signalId, newReactions);
          return {
            ...signal,
            reactions: newReactions
          };
        }
      }
      return signal;
    }));
  };

  const scrollToTop = () => {
    // Pour les salons de chat, scroller dans le conteneur de messages
    if (messagesContainerRef.current && ['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4'].includes(selectedChannel.id)) {
      messagesContainerRef.current.scrollTop = 0;
    } else {
      // Pour les autres vues, scroller la page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    // Scroller vers le bas pour voir les messages les plus récents
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
    }
    
    // Méthode 3: Forcer avec tous les conteneurs possibles
    const allContainers = document.querySelectorAll('[class*="overflow-y-auto"]');
    allContainers.forEach((container, index) => {
      container.scrollTop = container.scrollHeight;
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
    
  };

  const handleLogout = async () => {

    try {
      // PRÉSERVER la photo de profil admin avant déconnexion
      const adminProfileImageBackup = localStorage.getItem('adminProfileImage');

      // Déconnexion Supabase et nettoyage
      const { error } = await signOutAdmin();

      if (error) {
        console.error('❌ Erreur déconnexion admin:', error.message);
        // Continuer quand même le nettoyage local
      } else {
      }

      // Nettoyage sélectif du localStorage (préserver la photo)
      const keysToRemove = ['signals', 'chat_messages', 'trading_stats', 'user_session'];
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // GARDER la photo de profil admin - pas besoin de restaurer car elle n'a jamais été supprimée
      if (adminProfileImageBackup) {
      }

      // Rediriger vers la landing page
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // En cas d'erreur, forcer quand même la redirection
      window.location.href = '/';
    }
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        
        // Mettre à jour l'état immédiatement
        setProfileImage(base64Image);
        
        // Synchroniser avec localStorage et Supabase
        const result = await syncProfileImage('admin', base64Image);
        if (result.success) {
        } else {
          console.error('❌ ADMIN Sync failed:', result.error);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUsernameEdit = async () => {
    if (usernameInput.trim()) {
      try {
        const { data, error } = await updateUserProfile(usernameInput.trim(), undefined, 'admin');
        if (!error && data) {
          setCurrentUsername(usernameInput.trim());
        } else {
          console.error('❌ Error updating username in Supabase:', error);
          // Mode dégradé : sauvegarder en localStorage
          localStorage.setItem('adminUsername', usernameInput.trim());
          setCurrentUsername(usernameInput.trim());
        }
      } catch (error) {
        console.error('❌ Error updating username:', error);
        // Mode dégradé : sauvegarder en localStorage
        localStorage.setItem('adminUsername', usernameInput.trim());
        setCurrentUsername(usernameInput.trim());
      }
      setIsEditingUsername(false);
      setUsernameInput('');
    }
  };

  const handleUsernameCancel = () => {
    setIsEditingUsername(false);
    setUsernameInput('');
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

  const handleTestNotification = () => {
    sendLocalNotification({
      title: '🧪 Test Notification Admin',
      body: 'Ceci est un test de notification depuis l\'admin !',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: 'test-notification',
      data: { type: 'test' }
    });
  };

  const handleShareScreen = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      // Configuration haute qualité pour le partage d'écran
      navigator.mediaDevices.getDisplayMedia({ 
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30, max: 60 }
        },
        audio: true
      })
        .then(stream => {
          
          // Créer un élément vidéo haute qualité
          const video = document.createElement('video');
          video.className = 'w-full h-full object-contain';
          video.autoplay = true;
          video.muted = true;
          video.playsInline = true;
          video.srcObject = stream;
          
          // Configuration haute qualité pour la vidéo
          video.style.imageRendering = 'crisp-edges';
          video.style.imageRendering = '-webkit-optimize-contrast';
          
          // Optimiser les paramètres de qualité
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            
            // Appliquer les contraintes de qualité
            videoTrack.applyConstraints({
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 }
            }).then(() => {
                width: videoTrack.getSettings().width,
                height: videoTrack.getSettings().height,
                frameRate: videoTrack.getSettings().frameRate
              });
          }
          
          // Trouver spécifiquement les conteneurs de 
          const Containers = document.querySelectorAll('.bg-gray-900 .bg-black.flex.items-center.justify-center');
          
          if (Containers.length === 0) {
            // Fallback: chercher tous les conteneurs noirs
            const allContainers = document.querySelectorAll('.bg-black.flex.items-center.justify-center');
            
            allContainers.forEach((container, index) => {
              container.innerHTML = '';
              const videoClone = video.cloneNode(true) as HTMLVideoElement;
              container.appendChild(videoClone);
              
              // Lancer la lecture pour chaque clone
              videoClone.play().then(() => {
              }).catch(err => {
                console.error(`Erreur lecture vidéo ${index}:`, err);
              });
            });
          } else {
            // Utiliser les conteneurs de  spécifiques
            Containers.forEach((container, index) => {
              container.innerHTML = '';
              const videoClone = video.cloneNode(true) as HTMLVideoElement;
              container.appendChild(videoClone);
              
              // Lancer la lecture pour chaque clone
              videoClone.play().then(() => {
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

  const handleSignalStatus = async (signalId: string, newStatus: 'WIN' | 'LOSS' | 'BE' | 'ACTIVE') => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return;


    if (signal.status === newStatus) {
      // Si on clique sur le même statut, on remet en ACTIVE
      const updatedSignal = { ...signal, status: 'ACTIVE', pnl: undefined, closeMessage: undefined };
      
      // Mettre à jour l'état local
      setSignals(prev => prev.map(s => 
        s.id === signalId ? updatedSignal : s
      ));
      
      // Sauvegarder dans Firebase
      const firebaseSuccess = await updateSignalStatus(signalId, 'ACTIVE');
      
      // Mettre à jour allSignalsForStats pour que les stats se mettent à jour
      setAllSignalsForStats(prev => prev.map(s => 
        s.id === signalId ? { ...s, status: 'ACTIVE', pnl: undefined, closeMessage: undefined } : s
      ));
      
      
      // Les stats seront mises à jour automatiquement via allSignalsForStats
      
    } else if (newStatus === 'ACTIVE') {
      // Si on veut remettre en ACTIVE directement
      const updatedSignal = { ...signal, status: 'ACTIVE', pnl: undefined, closeMessage: undefined };
      
      // Mettre à jour l'état local
      setSignals(prev => prev.map(s => 
        s.id === signalId ? updatedSignal : s
      ));
      
      // Sauvegarder dans Firebase
      const firebaseSuccess = await updateSignalStatus(signalId, 'ACTIVE');
      
      // Mettre à jour allSignalsForStats pour que les stats se mettent à jour
      setAllSignalsForStats(prev => prev.map(s => 
        s.id === signalId ? { ...s, status: 'ACTIVE', pnl: undefined, closeMessage: undefined } : s
      ));
      
      
      // Les stats seront mises à jour automatiquement via allSignalsForStats
      
    } else {
      // Sinon on demande le P&L
      const pnl = prompt(`Entrez le P&L final pour ce signal (ex: +$150 ou -$50):`);
      if (pnl !== null) {
        // Générer la phrase de fermeture
        const statusText = newStatus === 'WIN' ? 'gagnante' : newStatus === 'LOSS' ? 'perdante' : 'break-even';
        const closeMessage = `Position ${statusText} fermée - P&L: ${pnl}`;
        
        
        const updatedSignal = { ...signal, status: newStatus, pnl, closeMessage };
        
        // Mettre à jour l'état local
        setSignals(prev => prev.map(s => 
          s.id === signalId ? updatedSignal : s
        ));
        
        // Sauvegarder dans Firebase
        const firebaseSuccess = await updateSignalStatus(signalId, newStatus, pnl);
        
        // Sauvegarder le message de fermeture dans Firebase
        const signalRef = ref(database, `signals/${signalId}`);
        await update(signalRef, { closeMessage });
        
        // Envoyer une notification pour le signal fermé
        notifySignalClosed({ ...signal, status: newStatus, pnl, closeMessage });
        
        // Créer un message de fermeture dans le chat
        const conclusionMessage = `📊 SIGNAL FERMÉ 📊\n\n` +
          `Signal ${signal.referenceNumber || ''} fermé\n` +
          `Résultat: ${newStatus === 'WIN' ? '🟢 GAGNANT' : newStatus === 'LOSS' ? '🔴 PERDANT' : '🔵 BREAK-EVEN'}\n` +
          `${newStatus !== 'BE' ? `P&L: ${pnl}` : ''}\n` +
          `[SIGNAL_ID:${signalId}]`;
        
        const messageData = {
          channel_id: 'general-chat-2',
          content: conclusionMessage,
          author: currentUsername,
          author_type: 'admin' as const,
          author_avatar: profileImage || undefined,
          timestamp: new Date().toLocaleString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };
        
        const messageRef = push(ref(database, `messages/general-chat-2`));
        await set(messageRef, messageData);
        
        // Mettre à jour allSignalsForStats pour que les stats se mettent à jour
        setAllSignalsForStats(prev => prev.map(s => 
          s.id === signalId ? { ...s, status: newStatus, pnl, closeMessage } : s
        ));
        
        
        // Les stats seront mises à jour automatiquement via allSignalsForStats
      }
    }
    
  };

  // Scroll automatique vers le bas quand de nouveaux messages arrivent ou quand on change de canal
  useEffect(() => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);
  }, [chatMessages, selectedChannel.id]);

  const channels = [
    { id: 'general-chat-2', name: 'general-chat-2', emoji: '📊', fullName: 'Indices' },
    { id: 'general-chat-3', name: 'general-chat-3', emoji: '🪙', fullName: 'Crypto' },
    { id: 'general-chat-4', name: 'general-chat-4', emoji: '💱', fullName: 'Forex' },
    { id: 'fondamentaux', name: 'fondamentaux', emoji: '📚', fullName: 'Fondamentaux' },
    { id: 'letsgooo-model', name: 'letsgooo-model', emoji: '🚀', fullName: 'Letsgooo model' },
    { id: 'livestream', name: 'livestream', emoji: '📺', fullName: 'Livestream' },

    { id: 'chatzone', name: 'chatzone', emoji: '💬', fullName: 'ChatZone' },
    { id: 'profit-loss', name: 'profit-loss', emoji: '💰', fullName: 'Profit loss' },
    { id: 'calendrier', name: 'calendrier', emoji: '📅', fullName: 'Journal Signaux' },
    { id: 'trading-journal', name: 'trading-journal', emoji: '📊', fullName: 'Journal Perso' },
    { id: 'user-management', name: 'user-management', emoji: '👥', fullName: 'Gestion Utilisateurs' }
  ];

  const handleCreateSignal = () => {
    setShowSignalModal(true);
  };

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
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

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
    } else {
      console.error('❌ Erreur lors de la sauvegarde du trade');
    }
  };

  // Fonctions pour la gestion des utilisateurs
  
  // Fonction pour filtrer et trier les utilisateurs
  const getFilteredUsers = () => {
    let filteredUsers = [...users];
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer par statut
    if (statusFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
    }
    
    // Trier
    filteredUsers.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'last_sign_in_at':
          aValue = a.last_sign_in_at ? new Date(a.last_sign_in_at) : new Date(0);
          bValue = b.last_sign_in_at ? new Date(b.last_sign_in_at) : new Date(0);
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filteredUsers;
  };
  
  // Fonction pour calculer les statistiques
  const getUserStats = () => {
    const total = users.length;
    const active = users.filter(user => user.status === 'active').length;
    const inactive = users.filter(user => user.status === 'inactive').length;
    
    // Nouveaux utilisateurs cette semaine
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newThisWeek = users.filter(user => 
      new Date(user.created_at) > oneWeekAgo
    ).length;
    
    return { total, active, inactive, newThisWeek };
  };

  const loadUsers = async () => {
    // TODO: Implement Firebase user management
    setUsers([]);
  };

  const createUser = async () => {
    // TODO: Implement Firebase user creation
    console.warn('⚠️ User creation not implemented with Firebase yet');
  };

  const deleteUser = async (userId: string) => {
    // TODO: Implement Firebase user deletion
    console.warn('⚠️ User deletion not implemented with Firebase yet');
  };

  const handleTradingViewPasteTrade = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedHtml = e.clipboardData.getData('text/html') || '';
    const pastedText = e.clipboardData.getData('text') || '';
    
    
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
      
      if (!Array.isArray(personalTrades)) {
        console.error('personalTrades n\'est pas un tableau:', personalTrades);
        return [];
      }
      
      const filteredTrades = personalTrades.filter(trade => {
        if (!trade || !trade.date) {
          return false;
        }
        return trade.date === dateStr;
      });
      return filteredTrades;
    } catch (error) {
      console.error('Erreur dans getTradesForDate:', error);
      return [];
    }
  };

  const getSignalsForDate = (date: Date) => {
    // Utiliser allSignalsForStats avec originalTimestamp pour filtrer par date
    return allSignalsForStats.filter(signal => {
      // Utiliser le timestamp original pour déterminer la vraie date
      const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
      
      // Si la date est invalide, ignorer ce signal
      if (isNaN(signalDate.getTime())) {
        return false;
      }
      
      // Vérifier si le signal correspond à la date demandée
      return signalDate.getDate() === date.getDate() && 
             signalDate.getMonth() === date.getMonth() && 
             signalDate.getFullYear() === date.getFullYear();
    });
  };

  const handleSignalSubmit = async () => {
    // Validation minimale - juste besoin d'au moins un champ rempli
    if (!signalData.symbol && !signalData.entry && !signalData.takeProfit && !signalData.stopLoss && !signalData.description) {
      console.warn('Veuillez remplir au moins un champ pour créer le signal');
      return;
    }

    // Convertir l'image en base64 si présente
    let imageBase64 = null;
    if (signalData.image) {
      imageBase64 = await uploadImage(signalData.image);
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
      author: 'Admin',
      image: imageBase64,
      status: 'ACTIVE' as const
    };
    

    // Sauvegarder en Firebase
    const savedSignal = await addSignal(signalForFirebase);
    
    if (savedSignal) {
      
      // Envoyer une notification push via Firebase Function
      try {
        const functions = getFunctions();
        const sendNotification = httpsCallable(functions, 'sendNotification');
        
        // Récupérer tous les tokens FCM depuis Firebase Database
        const tokens = [];
        try {
          const fcmTokensRef = ref(database, 'fcm_tokens');
          const snapshot = await get(fcmTokensRef);
          if (snapshot.exists()) {
            const tokensData = snapshot.val();
            Object.values(tokensData).forEach((tokenData: any) => {
              if (tokenData.token) {
                tokens.push(tokenData.token);
              }
            });
          }
        } catch (error) {
          console.error('❌ Erreur récupération tokens FCM:', error);
        }
        
        if (tokens.length > 0) {
          const result = await sendNotification({
            signal: savedSignal,
            tokens: tokens
          });
        } else {
          notifyNewSignal(savedSignal);
        }
      } catch (error) {
        console.error('❌ Erreur envoi notification push:', error);
        // Fallback vers notification locale
        notifyNewSignal(savedSignal);
      }
      
              // Si c'est un salon general-chat, envoyer aussi un message dans le chat
        if (['general-chat-2', 'general-chat-3', 'general-chat-4'].includes(selectedChannel.id)) {
        // Calculer le ratio R:R
        const entry = parseFloat(signalData.entry) || 0;
        const tp = parseFloat(signalData.takeProfit) || 0;
        const sl = parseFloat(signalData.stopLoss) || 0;
        
        let rr = 'N/A';
        if (entry > 0 && tp > 0 && sl > 0) {
          if (signalData.type === 'BUY') {
            const reward = Math.abs(tp - entry);
            const risk = Math.abs(entry - sl);
            rr = reward > 0 && risk > 0 ? (reward / risk).toFixed(2) : 'N/A';
          } else { // SELL
            const reward = Math.abs(entry - tp);
            const risk = Math.abs(sl - entry);
            rr = reward > 0 && risk > 0 ? (reward / risk).toFixed(2) : 'N/A';
          }
        }
        
        
        const signalMessage = `🚀 **${signalData.type} ${signalData.symbol || 'N/A'}** ${savedSignal.referenceNumber || ''}\n` +
          `📊 Entry: ${signalData.entry || 'N/A'} TP: ${signalData.takeProfit || 'N/A'} SL: ${signalData.stopLoss || 'N/A'}\n` +
          `🎯 R:R ≈ ${rr}\n` +
          `⏰ ${signalData.timeframe || '1 min'}\n` +
          `[SIGNAL_ID:${savedSignal.id}]`;
        
        try {
          // Convertir l'image en base64 pour la persistance
          let imageBase64: string | undefined;
          if (signalData.image) {
            const reader = new FileReader();
            imageBase64 = await new Promise((resolve) => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(signalData.image!);
            });
          }
          
          const messageData = {
            channel_id: selectedChannel.id,
            content: signalMessage,
            author: currentUsername,
            author_type: 'admin' as const,
            author_avatar: profileImage || undefined,
            attachment_data: imageBase64,
            attachment_type: signalData.image ? signalData.image.type : undefined,
            attachment_name: signalData.image ? signalData.image.name : undefined
          };
          
          await addMessage(messageData);
        } catch (error) {
          console.error('❌ Erreur envoi message signal:', error);
        }
      }
      
      // Pas d'alerte pour general-chat-2, le message apparaît directement dans le chat
      if (selectedChannel.id !== 'general-chat-2') {
      }
    } else {
      console.error('❌ Erreur sauvegarde signal');
      console.error('Erreur lors de la sauvegarde du signal');
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
    setShowSignalModal(false);
  };

  // Fonction pour gérer le statut des signaux depuis les messages
  const handleSignalStatusFromMessage = async (messageText: string, newStatus: 'WIN' | 'LOSS' | 'BE') => {
    try {
      // Extraire l'ID du signal du message
      const signalIdMatch = messageText.match(/\[SIGNAL_ID:([^\]]+)\]/);
      if (!signalIdMatch) {
        console.error('❌ ID du signal non trouvé dans le message');
        return;
      }
      
      const signalId = signalIdMatch[1];
      
      // Créer un popup personnalisé pour PnL et photo
      let pnl: string | undefined;
      let conclusionImage: File | null = null;
      
      if (newStatus !== 'BE') {
        // Créer le popup HTML
        const popup = document.createElement('div');
        popup.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        `;
        
        popup.innerHTML = `
          <div style="
            background: #1f2937;
            padding: 24px;
            border-radius: 12px;
            min-width: 400px;
            border: 1px solid #374151;
            color: white;
          ">
            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">
              📊 Fermer le signal ${newStatus === 'WIN' ? '🟢 GAGNANT' : '🔴 PERDANT'}
            </h3>
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #d1d5db;">
                P&L Final (ex: +$150 ou -$50):
              </label>
              <input 
                id="pnlInput"
                type="text" 
                placeholder="+$150"
                style="
                  width: 100%;
                  padding: 8px 12px;
                  border: 1px solid #4b5563;
                  border-radius: 6px;
                  background: #374151;
                  color: white;
                  font-size: 14px;
                "
              />
            </div>
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; color: #d1d5db;">
                📸 Photo de conclusion (optionnel):
              </label>
              <input 
                id="photoInput"
                type="file" 
                accept="image/*"
                style="
                  width: 100%;
                  padding: 8px 12px;
                  border: 1px solid #4b5563;
                  border-radius: 6px;
                  background: #374151;
                  color: white;
                  font-size: 14px;
                "
              />
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button 
                id="cancelBtn"
                style="
                  padding: 8px 16px;
                  border: 1px solid #6b7280;
                  border-radius: 6px;
                  background: #374151;
                  color: #d1d5db;
                  cursor: pointer;
                  font-size: 14px;
                "
              >
                Annuler
              </button>
              <button 
                id="confirmBtn"
                style="
                  padding: 8px 16px;
                  border: none;
                  border-radius: 6px;
                  background: #3b82f6;
                  color: white;
                  cursor: pointer;
                  font-size: 14px;
                  font-weight: 500;
                "
              >
                Confirmer
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(popup);
        
        // Gérer les événements
        const pnlInput = popup.querySelector('#pnlInput') as HTMLInputElement;
        const photoInput = popup.querySelector('#photoInput') as HTMLInputElement;
        const cancelBtn = popup.querySelector('#cancelBtn') as HTMLButtonElement;
        const confirmBtn = popup.querySelector('#confirmBtn') as HTMLButtonElement;
        
        // Attendre la réponse de l'utilisateur
        const result = await new Promise<{pnl: string, photo: File | null}>((resolve, reject) => {
          cancelBtn.onclick = () => {
            document.body.removeChild(popup);
            reject(new Error('Annulé par l\'utilisateur'));
          };
          
          confirmBtn.onclick = () => {
            const pnlValue = pnlInput.value.trim();
            if (!pnlValue) {
              console.warn('Veuillez entrer le P&L');
              return;
            }
            
            const photoValue = photoInput.files?.[0] || null;
            document.body.removeChild(popup);
            resolve({pnl: pnlValue, photo: photoValue});
          };
        });
        
        pnl = result.pnl;
        conclusionImage = result.photo;
      }
      
      // Générer la phrase de fermeture
      const statusText = newStatus === 'WIN' ? 'gagnante' : newStatus === 'LOSS' ? 'perdante' : 'break-even';
      const closeMessage = newStatus === 'BE' 
        ? `Position ${statusText} fermée - Break-even`
        : `Position ${statusText} fermée - P&L: ${pnl}`;
      
      // Mettre à jour le signal local
      const updatedSignal = { 
        id: signalId,
        status: newStatus, 
        pnl, 
        closeMessage 
      };
      
      // Mettre à jour les signaux locaux
      setSignals(prev => prev.map(s => 
        s.id === signalId ? { ...s, ...updatedSignal } : s
      ));
      
      // Mettre à jour allSignalsForStats pour les statistiques
      setAllSignalsForStats(prev => prev.map(s => 
        s.id === signalId ? { ...s, ...updatedSignal } : s
      ));
      
      // Sauvegarder dans Firebase
      const firebaseSuccess = await updateSignalStatus(signalId, newStatus, pnl);
      
      // Sauvegarder le message de fermeture dans Firebase
      const signalRef = ref(database, `signals/${signalId}`);
      await update(signalRef, { closeMessage });
      
      // Envoyer une notification pour le signal fermé
      notifySignalClosed({ ...updatedSignal, channel_id: 'general-chat-2' });
      
      // Envoyer un message de conclusion dans le chat
      
      const conclusionMessage = `📊 SIGNAL FERMÉ 📊\n\n` +
        `Signal ${updatedSignal.referenceNumber || ''} fermé\n` +
        `Résultat: ${newStatus === 'WIN' ? '🟢 GAGNANT' : newStatus === 'LOSS' ? '🔴 PERDANT' : '🔵 BREAK-EVEN'}\n` +
        `${newStatus !== 'BE' ? `P&L: ${pnl}` : ''}\n` +
        `[SIGNAL_ID:${signalId}]`;
      
      try {
        // Convertir l'image de conclusion en base64 si elle existe
        let conclusionImageBase64: string | undefined;
        if (conclusionImage) {
          const reader = new FileReader();
          conclusionImageBase64 = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(conclusionImage!);
          });
        }
        
        const messageData = {
          channel_id: 'general-chat-2',
          content: conclusionMessage,
          author: currentUsername,
          author_type: 'admin' as const,
          author_avatar: profileImage || undefined,
          attachment_data: conclusionImageBase64,
          attachment_type: conclusionImage ? conclusionImage.type : undefined,
          attachment_name: conclusionImage ? conclusionImage.name : undefined
        };
        
        await addMessage(messageData);
      } catch (error) {
        console.error('❌ Erreur envoi message conclusion:', error);
      }
      
      
    } catch (error) {
      console.error('❌ [ADMIN] Erreur handleSignalStatusFromMessage:', error);
              console.error('Erreur lors de la mise à jour du statut');
    }
  };


  const handleSendMessage = async () => {
    if (chatMessage.trim()) {
      try {
          channel: selectedChannel.id,
          content: chatMessage
        });
        
        
        // Pour les autres salons, utiliser Supabase avec avatar admin
        const messageData = {
          channel_id: selectedChannel.id,
          content: chatMessage,
          author: currentUsername,
          author_type: 'admin' as const,
          author_avatar: profileImage || undefined // Photo de profil admin
        };
        
        const savedMessage = await addMessage(messageData);
        
        if (savedMessage) {
          // La subscription temps réel ajoutera le message automatiquement
        } else {
          console.error('❌ Erreur envoi message Firebase');
        }
        
      } catch (error) {
        console.error('💥 ERREUR PWA:', error);
        
        // Mode dégradé complet : fonctionnement local
        const fallbackMessage = {
          id: Date.now().toString(),
          text: chatMessage,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          author: `${currentUsername} (Offline)`
        };
        
        setChatMessages(prev => ({
          ...prev,
          [selectedChannel.id]: [...(prev[selectedChannel.id] || []), fallbackMessage]
        }));
        
        console.warn('⚠️ Mode offline activé - message local uniquement');
      }
      
      setChatMessage('');
      
      // Scroll automatique après envoi
      setTimeout(() => {
        scrollToBottom();
      }, 10);
    }
  };

                  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    try {
                      // Convertir le fichier en base64
                                              // Upload image vers Firebase Storage
                        const imageURL = await uploadImage(file);
                        
                        // Envoyer à Firebase avec l'URL de l'image
                        const messageData = {
                          channel_id: selectedChannel.id,
                          content: '',
                          author: currentUsername,
                          author_type: 'admin' as const,
                          author_avatar: profileImage || undefined,
                          attachment_data: imageURL,
                          attachment_type: file.type,
                          attachment_name: file.name
                        };
                        
                        const savedMessage = await addMessage(messageData);
                        
                        if (savedMessage) {
                          // La subscription temps réel ajoutera le message automatiquement
                        } else {
                          console.error('❌ Erreur envoi image Firebase');
                        }
                      
                      // Reset the input
                      event.target.value = '';
                      
                      // Scroll automatique après upload
                      setTimeout(() => {
                        scrollToBottom();
                      }, 10);
                    } catch (error) {
                      console.error('💥 ERREUR upload image:', error);
                    }
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
      } else {
        console.warn(`⚠️ Données partielles importées - Symbole: ${newData.symbol}, Entrée: ${newData.entry}. Complétez les champs manquants`);
      }
      
      return true;
    }
    
    console.warn('❌ Aucun nombre détecté. Exemple : "NQ1! 22950 23004 22896"');
    return false;
  };

  const getTradingCalendar = () => {
    // Si c'est la gestion des utilisateurs, afficher l'interface dédiée
    if (selectedChannel.id === 'user-management') {
      const stats = getUserStats();
      const filteredUsers = getFilteredUsers();
      
      return (
        <div className="bg-gray-900 text-white p-2 md:p-4 h-full overflow-y-auto" style={{ paddingTop: '80px' }}>
          <div className="space-y-6">
            {/* Header avec statistiques */}
            <div className="border-b border-gray-600 pb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-red-500">🔥 NOUVEAU CODE v3.0 CHARGÉ ! 🔥</h1>
                  <p className="text-sm text-yellow-400 mt-1">SI TU VOIS CE TEXTE ROUGE/JAUNE = ÇA MARCHE !</p>
                </div>
                <button 
                  onClick={() => setShowUserModal(true)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  + Ajouter Utilisateur
                </button>
              </div>
              
              {/* Statistiques FORCÉES VISIBLES */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-600 rounded-lg p-4 border-4 border-blue-400">
                  <div className="text-2xl font-bold text-white">{stats.total || 99}</div>
                  <div className="text-sm text-white font-bold">✅ TOTAL USERS</div>
                </div>
                <div className="bg-green-600 rounded-lg p-4 border-4 border-green-400">
                  <div className="text-2xl font-bold text-white">{stats.active || 77}</div>
                  <div className="text-sm text-white font-bold">🟢 ACTIFS</div>
                </div>
                <div className="bg-red-600 rounded-lg p-4 border-4 border-red-400">
                  <div className="text-2xl font-bold text-white">{stats.inactive || 22}</div>
                  <div className="text-sm text-white font-bold">🔴 INACTIFS</div>
                </div>
                <div className="bg-purple-600 rounded-lg p-4 border-4 border-purple-400">
                  <div className="text-2xl font-bold text-white">{stats.newThisWeek || 5}</div>
                  <div className="text-sm text-white font-bold">🆕 NOUVEAUX</div>
                </div>
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Barre de recherche */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Rechercher</label>
                  <input
                    type="text"
                    placeholder="Email utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                {/* Filtre statut */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Statut</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">Tous</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                  </select>
                </div>
                
                {/* Trier par */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Trier par</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'email' | 'created_at' | 'last_sign_in_at')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="created_at">Date création</option>
                    <option value="last_sign_in_at">Dernière connexion</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                
                {/* Ordre */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Ordre</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="desc">Décroissant</option>
                    <option value="asc">Croissant</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Liste des utilisateurs */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Créé le</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Dernière connexion</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          {searchTerm || statusFilter !== 'all' ? 'Aucun utilisateur trouvé avec ces critères' : 'Aucun utilisateur pour le moment'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-700">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{user.email}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              user.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {user.status === 'active' ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 'Jamais'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                }}
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                                title="Réinitialiser mot de passe"
                              >
                                🔑
                              </button>
                              <button 
                                onClick={() => {
                                }}
                                className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-xs"
                                title={user.status === 'active' ? 'Désactiver' : 'Réactiver'}
                              >
                                {user.status === 'active' ? '🚫' : '✅'}
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDeleteUserModal(true);
                                }}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
                                title="Supprimer utilisateur"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Sinon, afficher le calendrier normal
    return (
            <div className="bg-gray-900 text-white p-2 md:p-4 h-full overflow-y-auto" style={{ paddingTop: '80px' }}>
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
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 w-full">
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
                if (selectedChannel.id === 'trading-journal' && dayNumber === 29) {
                }
                
                // Debug pour le jour 30 (calendrier normal)
                if (selectedChannel.id !== 'trading-journal' && dayNumber === 30) {
                }
                
                const dayTrades = selectedChannel.id === 'trading-journal' ? 
                  personalTrades.filter(trade => {
                    const tradeDate = new Date(trade.date);
                    
                    const isMatch = tradeDate.getDate() === dayNumber && 
                                   tradeDate.getMonth() === currentDate.getMonth() && 
                                   tradeDate.getFullYear() === currentDate.getFullYear();
                    
                    return isMatch;
                  }) : [];

                const daySignals = selectedChannel.id !== 'trading-journal' ? 
                  allSignalsForStats.filter(signal => {
                    // Utiliser le timestamp original pour déterminer la vraie date
                    const signalDate = new Date(signal.originalTimestamp || signal.timestamp);
                    
                    // Si la date est invalide, ignorer ce signal
                    if (isNaN(signalDate.getTime())) {
                      return false;
                    }
                    
                    const isMatch = signalDate.getDate() === dayNumber && 
                                  signalDate.getMonth() === currentDate.getMonth() && 
                                  signalDate.getFullYear() === currentDate.getFullYear();
                    
                    // Debug pour les jours 29 et 30
                    if (dayNumber === 29 || dayNumber === 30) {
                    }
                    
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
                    
                    // Debug pour le jour 30
                    if (dayNumber === 30) {
                      daySignals.forEach(signal => {
                      });
                    }
                    
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
                          
                          if (tradesForDate.length > 0) {
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
              (selectedChannel.id === 'trading-journal' ? calculateTotalPnLTrades() : calculateTotalPnL()) >= 0 
                ? 'bg-green-600/20 border-green-500/30' 
                : 'bg-red-600/20 border-red-500/30'
            }`}>
              <div className={`text-sm mb-1 ${
                (selectedChannel.id === 'trading-journal' ? calculateTotalPnLTrades() : calculateTotalPnL()) >= 0 ? 'text-green-300' : 'text-red-300'
              }`}>P&L Total</div>
              <div className={`text-2xl font-bold ${
                (selectedChannel.id === 'trading-journal' ? calculateTotalPnLTrades() : calculateTotalPnL()) >= 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {(selectedChannel.id === 'trading-journal' ? calculateTotalPnLTrades() : calculateTotalPnL()) >= 0 ? '+' : ''}${selectedChannel.id === 'trading-journal' ? calculateTotalPnLTrades() : calculateTotalPnL()}
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-blue-600/20 border-blue-500/30 rounded-lg p-4 border">
              <div className="text-sm text-blue-300 mb-1">Win Rate</div>
              <div className="text-2xl font-bold text-blue-200">
                {selectedChannel.id === 'trading-journal' ? calculateWinRateTrades() : calculateWinRate()}%
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Aujourd'hui</div>
                <div className="text-lg font-bold text-blue-400">
                  {selectedChannel.id === 'trading-journal' ? getTodayTrades().length : getTodaySignals().length}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Ce mois</div>
                <div className="text-lg font-bold text-white">
                  {selectedChannel.id === 'trading-journal' ? getThisMonthTrades().length : getThisMonthSignals().length}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Avg Win</div>
                <div className="text-lg font-bold text-green-400">
                  {selectedChannel.id === 'trading-journal' ? 
                    (calculateAvgWinTrades() > 0 ? `+$${calculateAvgWinTrades()}` : '-') :
                    (calculateAvgWin() > 0 ? `+$${calculateAvgWin()}` : '-')
                  }
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Avg Loss</div>
                <div className="text-lg font-bold text-red-400">
                  {selectedChannel.id === 'trading-journal' ? 
                    (calculateAvgLossTrades() > 0 ? `-$${calculateAvgLossTrades()}` : '-') :
                    (calculateAvgLoss() > 0 ? `-$${calculateAvgLoss()}` : '-')
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Résumé hebdomadaire */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4">Weekly Breakdown</h4>
            <div className="space-y-2">
              {(selectedChannel.id === 'trading-journal' ? getWeeklyBreakdownTrades() : getWeeklyBreakdown()).map((weekData, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${
                  weekData.isCurrentWeek 
                    ? 'bg-blue-600/20 border-blue-500/30' 
                    : 'bg-gray-700/50 border-gray-600'
                }`}>
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
                          <div className="text-sm bg-green-800/30 text-green-200 px-3 py-1 rounded-lg font-bold shadow-lg border border-green-600/20">
                            {weekData.wins}W
                          </div>
                        )}
                        {weekData.losses > 0 && (
                          <div className="text-sm bg-red-800/30 text-red-200 px-3 py-1 rounded-lg font-bold shadow-lg border border-red-600/20">
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
                    <p className="text-sm font-medium">{currentUsername}</p>
                    <p className="text-xs text-gray-400">En ligne</p>
                  </div>
                  <button
                    onClick={() => {
                      setUsernameInput(currentUsername);
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
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ÉDUCATION</h3>
            <div className="space-y-1">
              <button onClick={() => handleChannelChange('fondamentaux', 'fondamentaux')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'fondamentaux' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} relative`}>📚 Fondamentaux</button>
              <button onClick={() => handleChannelChange('letsgooo-model', 'letsgooo-model')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'letsgooo-model' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} relative`}>🚀 Letsgooo-model</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">SIGNAUX</h3>
            <div className="space-y-1">
              <button onClick={() => handleChannelChange('general-chat-2', 'general-chat-2')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'general-chat-2' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} relative`}>📊 Indices</button>
              <button onClick={() => handleChannelChange('general-chat-3', 'general-chat-3')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'general-chat-3' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} relative`}>🪙 Crypto</button>
              <button onClick={() => handleChannelChange('general-chat-4', 'general-chat-4')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'general-chat-4' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} relative`}>💱 Forex</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">TRADING HUB</h3>
            <div className="space-y-1">

              <button onClick={() => handleChannelChange('profit-loss', 'profit-loss')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'profit-loss' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} relative`}>💰 Profit-loss</button>
              <button onClick={() => handleChannelChange('chatzone', 'chatzone')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'chatzone' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'} relative`}>💬 Chat Zone</button>
              <button onClick={() => {
                // Réinitialiser selectedDate si on quitte le Trading Journal
                if (selectedChannel.id === 'trading-journal') {
                  setSelectedDate(null);
                }
                // Réinitialiser selectedChannel pour le calendrier
                setSelectedChannel({id: 'calendar', name: 'calendar'});
                setView('calendar');
                scrollToTop();
              }} className={`w-full text-left px-3 py-2 rounded text-sm ${view === 'calendar' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📅 Journal Signaux</button>
              <button onClick={() => handleChannelChange('trading-journal', 'trading-journal')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'trading-journal' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📊 Journal Perso</button>
              <button onClick={() => {
                // Utiliser la fonction globale pour naviguer vers livestream
                if ((window as any).setCurrentPage) {
                  (window as any).setCurrentPage('livestream');
                }
              }} className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700">📺 Livestream</button>
              <button onClick={() => {
                window.open('/trading-live.html', '_blank');
              }} className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700">🎥 Formation Live</button>
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
                <span className="text-purple-400">{allSignalsForStats.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Signaux actifs:</span>
                <span className="text-yellow-400">{allSignalsForStats.filter(s => s.status === 'ACTIVE').length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">P&L Total:</span>
                <span className={calculateTotalPnL() >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {calculateTotalPnL() >= 0 ? '+' : ''}${calculateTotalPnL()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ADMIN</h3>
            <div className="space-y-1">
              <button onClick={() => handleChannelChange('user-management', 'user-management')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'user-management' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>👥 Gestion Utilisateurs</button>
            </div>
          </div>

          {/* Bouton déconnexion en bas de la sidebar - Desktop seulement */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors"
            >
              <span className="text-lg">🏠</span>
              <span className="text-sm">Retour accueil</span>
            </button>
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
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm font-medium">{isEditingUsername ? currentUsername : currentUsername}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUsernameInput(currentUsername);
                      setIsEditingUsername(true);
                    }}
                    className="text-xs text-gray-400 hover:text-white px-1 py-0.5 rounded hover:bg-gray-700"
                    title="Modifier le nom"
                  >
                    ✏️
                  </button>
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
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">TRADING HUB</h3>
                <div className="space-y-2">
                  {channels.filter(c => ['profit-loss', 'chatzone'].includes(c.id)).map(channel => (
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
                      // Réinitialiser selectedDate si on quitte le Trading Journal
                      if (selectedChannel.id === 'trading-journal') {
                        setSelectedDate(null);
                      }
                      setView('calendar');
                      setMobileView('content');
                      scrollToTop();
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
                        <p className="text-sm text-gray-400">Journal de trading</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => {
                      handleChannelChange('livestream', 'livestream');
                      setMobileView('content');
                    }}
                    className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📺</span>
                      <div>
                        <p className="font-medium text-white">Livestream</p>
                        <p className="text-sm text-gray-400">Streaming en direct</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">ADMIN</h3>
                <div className="space-y-2">
                  {channels.filter(c => ['user-management'].includes(c.id)).map(channel => (
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
                          <p className="text-sm text-gray-400">Gestion des utilisateurs</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3">Statistiques</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="text-blue-400">{calculateWinRate()}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Signaux actifs:</span>
                    <span className="text-yellow-400">{allSignalsForStats.filter(s => s.status === 'ACTIVE').length}</span>
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

          {/* Content Area - Slides from right */}
          <div 
            className={`absolute inset-0 bg-gray-900 transform transition-transform duration-300 ease-in-out z-10 ${
              mobileView === 'content' ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {(view === 'calendar' || selectedChannel.id === 'trading-journal' || selectedChannel.id === 'user-management') ? (
              <div className="bg-gray-900 text-white p-2 md:p-4 h-full overflow-y-auto" style={{ paddingTop: '0px' }}>
                {/* Header avec bouton Ajouter Trade pour Trading Journal - Desktop seulement */}
                {selectedChannel.id === 'trading-journal' && (
                  <div className="hidden md:flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white">Mon Journal Perso</h1>
                      <p className="text-sm text-gray-400 mt-1">Journal tous tes trades</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          const trades = await getPersonalTrades();
                          setPersonalTrades(trades);
                        }}
                        className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg text-sm font-medium"
                        title="Recharger les trades depuis Firebase"
                      >
                        🔄 Recharger
                      </button>
                      <button 
                        onClick={() => {
                          const userId = localStorage.getItem('user_id');
                          navigator.clipboard.writeText(userId || '');
                          alert(`ID copié dans le presse-papier: ${userId || 'Aucun ID trouvé'}`);
                        }}
                        className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium"
                        title="Copier ton ID utilisateur"
                      >
                        📋 Copier ID
                      </button>
                      <button 
                        onClick={async () => {
                          const userId = localStorage.getItem('user_id');
                          
                          // Test direct Firebase
                          const { ref, get, query, orderByChild, limitToLast } = await import('firebase/database');
                          const { database } = await import('../utils/firebase-setup');
                          
                          try {
                            const tradesRef = ref(database, `personal_trades/${userId}`);
                            const q = query(tradesRef, orderByChild('created_at'), limitToLast(10));
                            const snapshot = await get(q);
                            
                            
                            if (snapshot.exists()) {
                              snapshot.forEach((childSnapshot) => {
                              });
                            }
                          } catch (error) {
                            console.error('❌ Erreur Firebase:', error);
                          }
                        }}
                        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-sm font-medium"
                        title="Debug Firebase"
                      >
                        🔍 Debug Firebase
                      </button>
                      <button 
                        onClick={handleAddTrade}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        + Ajouter Trade
                      </button>
                    </div>
                  </div>
                )}
                
                  {/* Header pour le calendrier normal */}
                {view === 'calendar' && selectedChannel.id !== 'trading-journal' && (
                  <div className="flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white">Journal des Signaux</h1>
                      <p className="text-sm text-gray-400 mt-1">Suivi des performances des signaux</p>
                    </div>
                  </div>
                )}
                
                {/* Gestion des utilisateurs */}
                {selectedChannel.id === 'user-management' ? (
                  <div className="space-y-6" style={{ paddingTop: '80px' }}>
                    <div className="flex justify-between items-center border-b border-gray-600 pb-4">
                      <div>
                        <h1 className="text-2xl font-bold text-white">Gestion Utilisateurs</h1>
                        <p className="text-sm text-gray-400 mt-1">Gérer tous les utilisateurs de la plateforme</p>
                      </div>
                      <button 
                        onClick={() => setShowUserModal(true)}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium"
                      >
                        + Ajouter Utilisateur
                      </button>
                    </div>

                    {/* Liste des utilisateurs */}
                    <div className="bg-gray-800 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Statut</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Créé le</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Dernière connexion</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {users.map((user) => (
                              <tr key={user.id} className="hover:bg-gray-700">
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-white">{user.email}</td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    user.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                  }`}>
                                    {user.status === 'active' ? 'Actif' : 'Inactif'}
                                  </span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 'Jamais'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                  <button 
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowDeleteUserModal(true);
                                    }}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    🗑️
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  getTradingCalendar()
                )}
                
                {/* Affichage des trades pour la date sélectionnée - SEULEMENT pour Trading Journal */}
                {(() => {
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



                {/* Affichage des signaux */}
                {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'profit-loss', 'chatzone', ''].includes(selectedChannel.id) ? (
                  <div className="space-y-4">
                    {signals.filter(signal => signal.channel_id === selectedChannel.id).length === 0 ? (
                      <div></div>
                                          ) : (
                        signals.filter(signal => signal.channel_id === selectedChannel.id).map((signal) => (
                        <div key={signal.id} className="flex items-start gap-3">
                          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                            {profileImage ? (
                              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              'A'
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-white">Admin</span>
                              <span className="text-xs text-gray-400">{signal.timestamp}</span>
                            </div>

                            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-w-2xl md:max-w-2xl max-w-full">
                              <div className="space-y-3">
                                {/* Header avec titre et indicateur */}
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${signal.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                  <h3 className="font-bold text-white text-lg">
                                    Signal {signal.type} {signal.symbol} {signal.referenceNumber || ''} – {signal.timeframe}
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

                            <div className="flex items-center gap-2 flex-wrap mt-2">
                              <button 
                                onClick={() => handleSignalStatus(signal.id, signal.status === 'WIN' ? 'ACTIVE' : 'WIN')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                                  signal.status === 'WIN' 
                                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                                    : 'bg-gray-600 hover:bg-green-500 text-gray-300 hover:text-white'
                                }`}
                              >
                                ✅ WIN
                              </button>
                              <button 
                                onClick={() => handleSignalStatus(signal.id, signal.status === 'LOSS' ? 'ACTIVE' : 'LOSS')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                                  signal.status === 'LOSS' 
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                                    : 'bg-gray-600 hover:bg-red-500 text-gray-300 hover:text-white'
                                }`}
                              >
                                ❌ LOSS
                              </button>
                              <button 
                                onClick={() => handleSignalStatus(signal.id, signal.status === 'BE' ? 'ACTIVE' : 'BE')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                                  signal.status === 'BE' 
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                    : 'bg-gray-600 hover:bg-blue-500 text-gray-300 hover:text-white'
                                }`}
                              >
                                ⚖️ BE
                              </button>
                            </div>

                            {/* Réactions emoji */}
                            <div className="flex items-center gap-2 mt-3">
                              <button 
                                onClick={() => handleReaction(signal.id, '🔥')}
                                className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                              >
                                🔥 {signal.reactions?.filter(r => r === '🔥').length || 0}
                              </button>
                              <button 
                                onClick={() => handleReaction(signal.id, '💎')}
                                className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                              >
                                💎 {signal.reactions?.filter(r => r === '💎').length || 0}
                              </button>
                              <button 
                                onClick={() => handleReaction(signal.id, '🚀')}
                                className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                              >
                                🚀 {signal.reactions?.filter(r => r === '🚀').length || 0}
                              </button>
                              <button 
                                onClick={() => handleReaction(signal.id, '👏')}
                                className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                              >
                                👏 {signal.reactions?.filter(r => r === '👏').length || 0}
                              </button>
                            </div>






                          </div>
                        </div>
                      ))
                    )}
                  </div>
                
                ) : selectedChannel.id === 'profit-loss' ? (
                  <div className="flex flex-col h-full w-full">
                    <ProfitLoss channelId="profit-loss" currentUserId="admin" />
                  </div>
                ) : selectedChannel.id === 'chatzone' ? (
                  <div className="flex flex-col h-full w-full">
                    <ChatZone onUnreadCountChange={() => {}} isActive={true} />
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
                      
                      {(chatMessages[selectedChannel.id] || []).length > 0 && (
                        (chatMessages[selectedChannel.id] || []).map((message) => (
                          <div key={message.id} className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                              {message.author_avatar ? (
                                <img src={message.author_avatar} alt="Profile" className="w-full h-full object-cover" />
                              ) : message.author === currentUsername ? (
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
                                  <div className="text-white">
                                    {message.text.includes('🎥 **Session Trading Live') ? (
                                      <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-purple-400">🎥</span>
                                          <span className="font-semibold text-purple-300">Session Trading Live - QUALITÉ HAUTE</span>
                                        </div>
                                        <div className="text-sm space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-blue-400">🔗</span>
                                            <a 
                                              href="https://admintrading.app.100ms.live/meeting/kor-inbw-yiz"
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-400 hover:text-blue-300 underline"
                                            >
                                              Rejoignez la room
                                            </a>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-green-400">⏱️</span>
                                            <span className="text-green-300">Latence: ~100ms</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-orange-400">📊</span>
                                            <span className="text-orange-300">Partage d'écran 1080p activé</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-yellow-400">🎯</span>
                                            <span className="text-yellow-300">Qualité optimisée pour le trading</span>
                                          </div>
                                        </div>
                                        <button 
                                          onClick={() => window.open('https://admintrading.app.100ms.live/meeting/kor-inbw-yiz', '_blank')}
                                          className="mt-3 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white text-sm font-medium w-full"
                                        >
                                          👆 Cliquez pour rejoindre instantanément
                                        </button>
                                      </div>
                                    ) : (
                                      <p>{message.text}</p>
                                    )}
                                  </div>
                                )}
                                {message.attachment_data && (
                                  <div className="mt-2">
                                    {true ? (
                                      <div className="relative">
                                        <img 
                                          src={message.attachment_data} 
                                          alt="Attachment"
                                          className="mt-2 max-w-xs max-h-48 rounded-lg border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => {
                                            const newWindow = window.open();
                                            newWindow!.document.write(`<img src="${message.attachment_data}" style="max-width: 100%; height: auto;" />`);
                                            newWindow!.document.title = 'Image en grand';
                                          }}
                                        />
                                        <div className="text-xs text-gray-400 mt-1">Cliquez pour agrandir</div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-blue-400">
                                        <span>📎</span>
                                        <span className="text-sm">Pièce jointe</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Réactions aux messages - HORS du cadre gris */}
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onClick={() => handleAddReaction(message.id)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                                    (messageReactions[message.id]?.users || []).includes('Admin')
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white'
                                  }`}
                                >
                                  🔥
                                  <span className="ml-1">
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
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
                          onClick={handleCreateSignal}
                          className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-white text-sm font-medium"
                        >
                          + Signal
                        </button>
                        <button
                          onClick={handleSendMessage}
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : selectedChannel.id === 'livestream' ? (
                  <div className="flex flex-col h-full bg-gray-900">
                    {/* Interface Livestream Desktop */}
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
                          {(chatMessages['livestream'] || []).length === 0 ? (
                            <div className="text-center py-8">
                              <div className="text-gray-400 text-sm">Aucun message</div>
                              <div className="text-gray-500 text-xs mt-1">Soyez le premier à commenter !</div>
                            </div>
                          ) : (
                            (chatMessages['livestream'] || []).map((message) => (
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
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
                ) : selectedChannel.id === 'chatzone' ? (
                  <div className="flex flex-col h-full w-full">
                    <ChatZone onUnreadCountChange={() => {}} isActive={true} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-sm">Bienvenue sur Admin</div>
                    <div className="text-gray-500 text-xs mt-1">Plateforme de trading en cours de développement</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Content Area */}
        <div className="hidden md:block flex-1 overflow-y-auto overflow-x-hidden">
          {(view === 'calendar' || selectedChannel.id === 'trading-journal' || selectedChannel.id === 'user-management') ? (
            getTradingCalendar()
          ) : (
            <div className="p-4 md:p-6 space-y-4 w-full" style={{ paddingTop: '80px' }}>

              {/* Affichage des signaux */}
              {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'general-chat-2', 'general-chat-3', 'general-chat-4', 'chatzone', ''].includes(selectedChannel.id) ? (
                <div className="space-y-4">
                  {signals.filter(signal => signal.channel_id === selectedChannel.id).length === 0 ? (
                    <div></div>
                  ) : (
                    signals
                      .filter(signal => signal.channel_id === selectedChannel.id)
                      .reverse()
                      .map((signal) => (
                      <div key={signal.id} className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">Admin</span>
                            <span className="text-xs text-gray-400">{signal.timestamp}</span>
                          </div>

                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-w-full md:max-w-2xl">
                            <div className="space-y-3">
                              {/* Header avec titre et indicateur */}
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${signal.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                <h3 className="font-bold text-white text-lg">
                                  Signal {signal.type} {signal.symbol} {signal.referenceNumber || ''} – {signal.timeframe}
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

                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            <button 
                              onClick={() => handleSignalStatus(signal.id, signal.status === 'WIN' ? 'ACTIVE' : 'WIN')}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                                signal.status === 'WIN' 
                                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                                  : 'bg-gray-600 hover:bg-green-500 text-gray-300 hover:text-white'
                              }`}
                            >
                              ✅ WIN
                            </button>
                            <button 
                              onClick={() => handleSignalStatus(signal.id, signal.status === 'LOSS' ? 'ACTIVE' : 'LOSS')}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                                signal.status === 'LOSS' 
                                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                                  : 'bg-gray-600 hover:bg-red-500 text-gray-300 hover:text-white'
                              }`}
                            >
                              ❌ LOSS
                            </button>
                            <button 
                              onClick={() => handleSignalStatus(signal.id, signal.status === 'BE' ? 'ACTIVE' : 'BE')}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                                signal.status === 'BE' 
                                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                                  : 'bg-gray-600 hover:bg-blue-500 text-gray-300 hover:text-white'
                              }`}
                            >
                              ⚖️ BE
                            </button>
                          </div>

                          {/* Réactions emoji */}
                          <div className="flex items-center gap-2 mt-3">
                            <button 
                              onClick={() => handleReaction(signal.id, '🔥')}
                              className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                            >
                              🔥 {signal.reactions?.filter(r => r === '🔥').length || 0}
                            </button>
                            <button 
                              onClick={() => handleReaction(signal.id, '💎')}
                              className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                            >
                              💎 {signal.reactions?.filter(r => r === '💎').length || 0}
                            </button>
                            <button 
                              onClick={() => handleReaction(signal.id, '🚀')}
                              className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                            >
                              🚀 {signal.reactions?.filter(r => r === '🚀').length || 0}
                            </button>
                            <button 
                              onClick={() => handleReaction(signal.id, '👏')}
                              className="px-3 py-1.5 rounded-full text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                            >
                              👏 {signal.reactions?.filter(r => r === '👏').length || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                </div>
              ) : selectedChannel.id === '' ? (
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
                        {(chatMessages[''] || []).length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 text-sm">Aucun message</div>
                            <div className="text-gray-500 text-xs mt-1">Soyez le premier à commenter !</div>
                          </div>
                        ) : (
                          (chatMessages[''] || []).map((message) => (
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
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
                  <div className="flex flex-col h-full w-full">
                    <ProfitLoss channelId="profit-loss" currentUserId="admin" />
                  </div>
                ) : ['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4'].includes(selectedChannel.id) ? (
                <div className="flex flex-col h-full">
                  {/* Messages de chat */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
                    {(chatMessages[selectedChannel.id] || []).length > 0 && (
                      (chatMessages[selectedChannel.id] || []).map((message) => (
                        <div key={message.id} className="flex items-start gap-3">
                          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
                            {message.author === currentUsername && profileImage ? (
                              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : message.author_avatar ? (
                              <img src={message.author_avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              'A'
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
                                        return isClosureMessage;
                                      })() && (
                                        <span 
                                          className="ml-2 text-blue-400 hover:text-blue-300 cursor-pointer text-lg transition-colors inline-block"
                                          onClick={() => {
                                            const signalIdMatch = message.text.match(/\[SIGNAL_ID:([^\]]+)\]/);
                                            const signalId = signalIdMatch ? signalIdMatch[1] : '';
                                            
                                            const originalMessage = document.querySelector(`[data-signal-id="${signalId}"]`);
                                            
                                            if (originalMessage) {
                                              originalMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                              originalMessage.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-50');
                                              setTimeout(() => {
                                                originalMessage.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-50');
                                              }, 3000);
                                            } else {
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
                                {message.attachment_data && (
                                  <div className="mt-2">
                                    {true ? (
                                      <div className="relative">
                                        <img 
                                          src={message.attachment_data} 
                                          alt="Attachment"
                                          className="mt-2 max-w-xs max-h-48 rounded-lg border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => setSelectedImage(message.attachment_data)}
                                        />
                                        <div className="text-xs text-gray-400 mt-1">Cliquez pour agrandir</div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-blue-400">
                                        <span>📎</span>
                                        <span className="text-sm">Pièce jointe</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
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
                                        <button
                                          onClick={() => handleSignalStatusFromMessage(message.text, 'WIN')}
                                          disabled={isClosed}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            isClosed && currentSignal?.status === 'WIN'
                                              ? 'bg-green-500 text-white border-2 border-green-400 shadow-lg scale-105' // Bouton WIN actif
                                              : isClosed
                                              ? 'bg-gray-500/30 text-gray-400 border border-gray-500/30 cursor-not-allowed opacity-50' // Boutons désactivés
                                              : 'bg-green-400/20 hover:bg-green-400/30 text-green-300 border border-green-400/30 hover:scale-105' // Bouton WIN normal
                                          }`}
                                        >
                                          🟢 WIN
                                        </button>
                                        <button
                                          onClick={() => handleSignalStatusFromMessage(message.text, 'LOSS')}
                                          disabled={isClosed}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            isClosed && currentSignal?.status === 'LOSS'
                                              ? 'bg-red-500 text-white border-2 border-red-400 shadow-lg scale-105' // Bouton LOSS actif
                                              : isClosed
                                              ? 'bg-gray-500/30 text-gray-400 border border-gray-500/30 cursor-not-allowed opacity-50' // Boutons désactivés
                                              : 'bg-red-400/20 hover:bg-red-400/30 text-red-300 border border-red-400/30 hover:scale-105' // Bouton LOSS normal
                                          }`}
                                        >
                                          🔴 LOSS
                                        </button>
                                        <button
                                          onClick={() => handleSignalStatusFromMessage(message.text, 'BE')}
                                          disabled={isClosed}
                                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            isClosed && currentSignal?.status === 'BE'
                                              ? 'bg-blue-500 text-white border-2 border-blue-400 shadow-lg scale-105' // Bouton BE actif
                                              : isClosed
                                              ? 'bg-gray-500/30 text-gray-400 border border-gray-500/30 cursor-not-allowed opacity-50' // Boutons désactivés
                                              : 'bg-blue-400/20 hover:bg-blue-400/30 text-blue-300 border border-blue-400/30 hover:scale-105' // Bouton BE normal
                                          }`}
                                        >
                                          🔵 BE
                                        </button>
                                      </div>
                                      {isClosed && (
                                        <div className="mt-2 text-xs text-gray-400">
                                          <span 
                                            className="cursor-pointer text-blue-400 hover:text-blue-300 underline"
                                            onClick={() => {
                                              // Trouver le message original du signal
                                              const originalMessage = document.querySelector(`[data-signal-id="${signalId}"]`);
                                              if (originalMessage) {
                                                originalMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                // Surligner temporairement
                                                originalMessage.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-50');
                                                setTimeout(() => {
                                                  originalMessage.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-50');
                                                }, 3000);
                                              }
                                            }}
                                          >
                                            Signal {currentSignal?.referenceNumber || ''} fermé avec {currentSignal?.pnl ? `P&L: ${currentSignal.pnl}` : 'aucun P&L'}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                              
                              {/* Réactions aux messages - HORS du cadre gris */}
                              <div className="mt-2 flex items-center gap-2">
                                <button
                                  onClick={() => handleAddReaction(message.id)}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                                    (messageReactions[message.id]?.users || []).includes('Admin')
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white'
                                  }`}
                                >
                                  🔥
                                  <span className="ml-1">
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
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
                        onClick={handleCreateSignal}
                        className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-white text-sm font-medium"
                      >
                        + Signal
                      </button>
                      <button
                        onClick={handleSendMessage}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              ) : selectedChannel.id === 'chatzone' ? (
                <div className="flex flex-col h-full w-full">
                  <ChatZone />
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">Bienvenue sur Admin</div>
                  <div className="text-gray-500 text-xs mt-1">Plateforme de trading en cours de développement</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de création de signal */}
      {showSignalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Créer un signal</h2>
                <button 
                  onClick={() => setShowSignalModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Zone de collage TradingView */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">📋 Coller données TradingView</label>
                    <button
                      onClick={() => setDebugMode(!debugMode)}
                      className={`text-xs px-2 py-1 rounded ${debugMode ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      {debugMode ? '🔧 Debug ON' : '🔧 Debug OFF'}
                    </button>
                  </div>
                  <div
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 min-h-[80px] flex items-center justify-center cursor-pointer"
                    onPaste={handleTradingViewPaste}
                    onDrop={(e) => {
                      e.preventDefault();
                      const text = e.dataTransfer.getData('text');
                      if (text) {
                        // Simuler un événement de collage
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
                        handleTradingViewPaste(fakeEvent);
                      }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    {isPasteActive ? (
                      <div className="text-blue-400">🔄 Traitement en cours...</div>
                    ) : (
                      <div className="text-center">
                        <div className="text-gray-400 mb-1">📋 Cliquez ici et collez (Ctrl+V)</div>
                        <div className="text-xs text-gray-500">ou glissez-déposez du texte</div>
                      </div>
                    )}
                  </div>
                  {error && (
                    <p className="text-xs text-red-400 mt-1">{error}</p>
                  )}
                  {debugMode && pasteDebug && (
                    <div className="text-xs text-gray-400 mt-1 bg-gray-900 p-2 rounded">
                      <div className="font-semibold">Debug:</div>
                      <pre className="whitespace-pre-wrap text-xs">{pasteDebug}</pre>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Collez directement depuis TradingView (Risk/Reward tool)</p>
                </div>

                {/* Type de signal */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSignalData({...signalData, type: 'BUY'})}
                      className={`px-3 py-2 rounded text-sm ${signalData.type === 'BUY' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      📈 BUY
                    </button>
                    <button
                      onClick={() => setSignalData({...signalData, type: 'SELL'})}
                      className={`px-3 py-2 rounded text-sm ${signalData.type === 'SELL' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'}`}
                    >
                      📉 SELL
                    </button>
                  </div>
                </div>

                {/* Symbol */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Symbole</label>
                  <input
                    type="text"
                    value={signalData.symbol}
                    onChange={(e) => setSignalData({...signalData, symbol: e.target.value})}
                    placeholder="BTCUSD, EURUSD, etc."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Timeframe */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
                  <input
                    type="text"
                    value={signalData.timeframe}
                    onChange={(e) => setSignalData({...signalData, timeframe: e.target.value})}
                    placeholder="1 min, 5 min, 1H, etc."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Entry */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prix d'entrée</label>
                  <input
                    type="text"
                    value={signalData.entry}
                    onChange={(e) => setSignalData({...signalData, entry: e.target.value})}
                    placeholder="103474.00 USD"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Take Profit */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit</label>
                  <input
                    type="text"
                    value={signalData.takeProfit}
                    onChange={(e) => setSignalData({...signalData, takeProfit: e.target.value})}
                    placeholder="104626.00 USD"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Stop Loss */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss</label>
                  <input
                    type="text"
                    value={signalData.stopLoss}
                    onChange={(e) => setSignalData({...signalData, stopLoss: e.target.value})}
                    placeholder="102862.00 USD"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={signalData.description}
                    onChange={(e) => setSignalData({...signalData, description: e.target.value})}
                    placeholder="Notes supplémentaires..."
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                  />
                </div>
                
                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Capture d'écran</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSignalData({...signalData, image: file});
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  />
                </div>
               
                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowSignalModal(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded text-white"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSignalSubmit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
                  >
                    Créer le signal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

              {/* Modal pour ajouter un utilisateur */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Ajouter un utilisateur</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                    placeholder="email@exemple.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
                  <input
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                    placeholder="Mot de passe"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={createUser}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation suppression */}
        {showDeleteUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-white mb-4">Confirmer la suppression</h3>
              <p className="text-gray-300 mb-6">
                Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUser.email}</strong> ?
                Cette action est irréversible.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteUserModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Annuler
                </button>
                <button
                  onClick={() => deleteUser(selectedUser.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Supprimer
                </button>
            </div>
          </div>
        </div>
      )}

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
      {showTradesModal && selectedTradesDate && getTradesForDate(selectedTradesDate).length > 0 && (
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
                  Signaux du {selectedSignalsDate.toLocaleDateString('fr-FR', { 
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
                {(() => {
                  const signalsForDate = getSignalsForDate(selectedSignalsDate);
                  signalsForDate.forEach(signal => {
                      id: signal.id,
                      symbol: signal.symbol,
                      image: signal.image,
                      attachment_data: signal.attachment_data,
                      ALL_KEYS: Object.keys(signal)
                    });
                  });
                  return signalsForDate;
                })().map((signal) => (
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
                        <span className="text-sm text-gray-400">Channel:</span>
                        <span className="text-white ml-2">
                          {channels.find(ch => ch.id === signal.channel_id)?.fullName || signal.channel_id}
                        </span>
                      </div>
                    </div>

                    {signal.pnl && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-400">P&L:</span>
                        <span className={`ml-2 font-bold ${
                          signal.pnl.includes('+') || signal.pnl.includes('GAGNANT') ? 'text-green-400' : 
                          signal.pnl.includes('-') || signal.pnl.includes('PERDANT') ? 'text-red-400' : 
                          'text-yellow-400'
                        }`}>
                          {signal.pnl}
                        </span>
                      </div>
                    )}

                    {signal.description && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-400">Description:</span>
                        <p className="text-white mt-1">{signal.description}</p>
                      </div>
                    )}

                    {signal.attachment_data && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-400">Image du signal:</span>
                        <div className="mt-2">
                          <img 
                            src={signal.attachment_data} 
                            alt="Signal screenshot"
                            className="max-w-full rounded-lg border border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedImage(signal.attachment_data)}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Créé le {signal.timestamp}</span>
                    </div>
                  </div>
                ))}
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
                
                