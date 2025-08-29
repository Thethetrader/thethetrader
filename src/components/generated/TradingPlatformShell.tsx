import React, { useState, useEffect, useRef } from 'react';
import { getMessages, getSignals, subscribeToMessages, subscribeToSignals, addMessage } from '../../utils/firebase-setup';
import { syncProfileImage, getProfileImage, initializeProfile } from '../../utils/profile-manager';
import { initializeNotifications, notifyNewSignal, notifySignalClosed } from '../../utils/push-notifications';

export default function TradingPlatformShell() {
  const [selectedChannel, setSelectedChannel] = useState({ id: 'crypto', name: 'crypto' });
  const [view, setView] = useState<'signals' | 'calendar'>('signals');
  const [mobileView, setMobileView] = useState<'channels' | 'content'>('channels');
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
      
      setMessages(prev => ({
        ...prev,
        [channelId]: formattedMessages.map(msg => ({
          id: msg.id,
          text: msg.text,
          user: msg.author,
          author: msg.author, // CONSERVER le nom de l'auteur !
          author_avatar: msg.author_avatar, // CONSERVER l'avatar de l'auteur !
          timestamp: msg.timestamp
        }))
      }));
      
      console.log(`✅ Messages chargés pour ${channelId}:`, formattedMessages.length);
      console.log('📋 Messages actuels:', formattedMessages);
      
      // Scroller vers le bas après le chargement des messages
      setTimeout(() => {
        scrollToBottom();
      }, 5);
    } catch (error) {
      console.error('❌ Erreur chargement messages:', error);
    }
  };

  // Fonction pour charger les signaux depuis Firebase
  const loadSignals = async (channelId: string) => {
    try {
      console.log('🚀 DÉBUT CHARGEMENT SIGNAUX PWA pour canal:', channelId);
      const signals = await getSignals(channelId, 3); // Limiter à 3 signaux
      console.log('🔍 SIGNAUX BRUTS RÉCUPÉRÉS DEPUIS FIREBASE pour', channelId, ':', signals.map(s => ({symbol: s.symbol, type: s.type, id: s.id})));
      
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
        reactions: signal.reactions || [],
        pnl: signal.pnl,
        closeMessage: signal.closeMessage
      }));
      
      setSignals(formattedSignals);
      console.log(`✅ SIGNAUX CHARGÉS ET AFFICHÉS DANS PWA pour ${channelId}:`, formattedSignals.length);
      console.log('🔍 DÉTAIL DES SIGNAUX AFFICHÉS:', formattedSignals.map(s => ({symbol: s.symbol, type: s.type, id: s.id, timestamp: s.timestamp})));
    } catch (error) {
      console.error('❌ Erreur chargement signaux:', error);
    }
  };

  // Fonctions pour les statistiques fixes
  const getFixedStats = () => {
    return JSON.parse(localStorage.getItem('tradingStats') || JSON.stringify({
      totalPnL: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      totalTrades: 0
    }));
  };

  const updateFixedStats = (signal: any) => {
    const currentStats = getFixedStats();
    const pnlValue = parseFloat(signal.pnl?.replace(/[^\d.-]/g, '') || '0');
    
    const newStats = {
      totalPnL: currentStats.totalPnL + pnlValue,
      winRate: 0, // Sera recalculé
      avgWin: currentStats.avgWin,
      avgLoss: currentStats.avgLoss,
      totalTrades: currentStats.totalTrades + 1
    };

    const allSignals = JSON.parse(localStorage.getItem('allSignals') || '[]');
    allSignals.push(signal);
    const closedSignals = allSignals.filter((s: any) => s.status !== 'ACTIVE');
    const wins = closedSignals.filter((s: any) => s.status === 'WIN');
    const losses = closedSignals.filter((s: any) => s.status === 'LOSS');

    newStats.winRate = closedSignals.length > 0 ? Math.round((wins.length / closedSignals.length) * 100) : 0;
    
    if (wins.length > 0) {
      newStats.avgWin = Math.round(wins.reduce((total: number, s: any) => total + (parseFloat(s.pnl?.replace(/[^\d.-]/g, '') || '0')), 0) / wins.length);
    }
    
    if (losses.length > 0) {
      newStats.avgLoss = Math.round(losses.reduce((total: number, s: any) => total + Math.abs(parseFloat(s.pnl?.replace(/[^\d.-]/g, '') || '0')), 0) / losses.length);
    }

    localStorage.setItem('tradingStats', JSON.stringify(newStats));
    localStorage.setItem('allSignals', JSON.stringify(allSignals));
  };

  const calculateTotalPnL = (): number => {
    return getFixedStats().totalPnL;
  };

  const calculateWinRate = (): number => {
    return getFixedStats().winRate;
  };

  const calculateAvgWin = (): number => {
    return getFixedStats().avgWin;
  };

  const calculateAvgLoss = (): number => {
    return getFixedStats().avgLoss;
  };

  // Fonction de debug pour voir les signaux actuels
  const debugSignals = () => {
    const currentSignals = signals.filter(s => s.channel_id === selectedChannel.id);
    console.log('🔍 DEBUG - SIGNAUX ACTUELS DANS PWA pour canal', selectedChannel.id, ':');
    currentSignals.forEach((signal, index) => {
      console.log(`${index + 1}. ${signal.symbol} ${signal.type} - ID: ${signal.id} - Timestamp: ${signal.timestamp}`);
    });
    console.log(`📊 Total: ${currentSignals.length} signaux`);
    alert(`Debug: ${currentSignals.length} signaux dans le canal ${selectedChannel.id}. Regarde la console pour les détails.`);
  };

  // Initialiser l'app avec Firebase
  useEffect(() => {
    const initApp = async () => {
      // Initialiser les notifications
      await initializeNotifications();
      
      await loadMessages(selectedChannel.id);
      await loadSignals(selectedChannel.id);
    };
    initApp();
  }, []);

  // Charger les données quand on change de canal
  useEffect(() => {
    loadMessages(selectedChannel.id);
    loadSignals(selectedChannel.id);
    // Scroller vers le bas quand on entre dans un salon
    setTimeout(() => {
      scrollToBottom();
    }, 50);
  }, [selectedChannel.id]);

  // Subscription temps réel pour les messages
  useEffect(() => {
    console.log('🔄 Initialisation subscription utilisateur pour:', selectedChannel.id);
    
    const subscription = subscribeToMessages(selectedChannel.id, (newMessage) => {
      console.log('🔄 Nouveau message reçu utilisateur:', newMessage);
      
      const formattedMessage = {
        id: newMessage.id || '',
        text: newMessage.content,
        timestamp: new Date(newMessage.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        user: newMessage.author,
        author: newMessage.author,
        author_avatar: newMessage.author_avatar,
        attachment: newMessage.attachment_data ? {
          type: newMessage.attachment_type || 'image/jpeg',
          name: newMessage.attachment_name || 'image.jpg'
        } : undefined,
        attachment_data: newMessage.attachment_data
      };
      
      setMessages(prev => ({
        ...prev,
        [selectedChannel.id]: [...(prev[selectedChannel.id] || []), formattedMessage]
      }));
      
      // Scroll vers le bas pour voir le nouveau message
      setTimeout(() => {
        scrollToBottom();
      }, 5);
    });

    // Fallback: recharger les messages toutes les 2 secondes
    const interval = setInterval(() => {
      console.log('🔄 Rechargement automatique utilisateur pour:', selectedChannel.id);
      loadMessages(selectedChannel.id);
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [selectedChannel.id]);

  // Subscription temps réel pour les signaux (globale)
  useEffect(() => {
    console.log('🔄 Initialisation subscription signaux globale...');
    
    const timeoutId = setTimeout(() => {
      const signalSubscription = subscribeToSignals('all', (newSignal) => {
        console.log('🆕 NOUVEAU SIGNAL REÇU DANS PWA - Canal:', newSignal.channel_id, 'Signal:', newSignal.symbol, newSignal.type, 'ID:', newSignal.id);
        
        // Vérifier si le signal existe déjà
        const exists = signals.some(s => 
          s.id === newSignal.id ||
          (s.symbol === newSignal.symbol &&
           s.type === newSignal.type &&
           s.channel_id === newSignal.channel_id &&
           Math.abs(new Date(s.timestamp).getTime() - (typeof newSignal.timestamp === 'number' ? newSignal.timestamp : Date.now())) < 60000) // Même minute
        );

        if (!exists) {
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
            reactions: newSignal.reactions || [],
            pnl: newSignal.pnl,
            closeMessage: newSignal.closeMessage
          };
          console.log('✅ Signal ajouté à la liste (temps réel):', formattedSignal.symbol, formattedSignal.type);
          // Ajouter à la fin (les signaux sont déjà dans l'ordre chronologique)
          setSignals(prev => [...prev, formattedSignal]);
          
          // Notifier pour les nouveaux signaux
          notifyNewSignal(formattedSignal);
        } else {
          console.log('🚫 Signal déjà existant (temps réel) - ignoré:', newSignal.symbol, newSignal.type);
        }
      });

      return () => {
        signalSubscription.unsubscribe();
      };
    }, 2000); // Délai de 2 secondes pour éviter les doublons avec le chargement initial

    return () => {
      clearTimeout(timeoutId);
    };
  }, []); // Subscription globale - pas de dépendance
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
    scrollToTop();
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
    // Forcer le localStorage à être vide pour éviter les bugs
    // const saved = localStorage.getItem('personalTrades');
    // const existingTrades = saved ? JSON.parse(saved) : [];
    const existingTrades: any[] = [];
    
    // Supprimer toutes les données de test pour éviter les bugs
    // const testTradeExists = existingTrades.some((trade: any) => trade.date === '2024-08-04');
    // if (!testTradeExists) {
    //   const testTrade = {
    //     id: 'test-4-aout',
    //     date: '2024-08-04',
    //     symbol: 'BTCUSD',
    //     type: 'BUY' as const,
    //     entry: '45000',
    //     exit: '46000',
    //     stopLoss: '44000',
    //     pnl: '1000',
    //     status: 'WIN' as const,
    //     notes: 'Trade de test pour le 4 août',
    //     image1: null,
    //     image2: null,
    //     timestamp: '2024-08-04T10:30:00'
    //   };
    //   existingTrades.push(testTrade);
    // }
    
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
  
  // Désactiver la sauvegarde pour éviter les bugs
  // useEffect(() => {
  //   localStorage.setItem('personalTrades', JSON.stringify(personalTrades));
  // }, [personalTrades]);

  // Debug: Afficher les trades au chargement
  useEffect(() => {
    console.log('Trades chargés:', personalTrades);
  }, [personalTrades]);

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
    
    // Créer 4 semaines du mois en cours
    const weeks = [];
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
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
    
    // Créer 4 semaines du mois en cours
    const weeks = [];
    for (let weekNum = 1; weekNum <= 4; weekNum++) {
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

  // Fonctions pour gérer les statuts des signaux
  const handleReaction = (signalId: string, emoji: string) => {
    setSignals(prev => prev.map(signal => {
      if (signal.id === signalId) {
        const currentReactions = signal.reactions || [];
        const hasReaction = currentReactions.includes(emoji);
        
        if (hasReaction) {
          // Retirer la réaction
          return {
            ...signal,
            reactions: currentReactions.filter(r => r !== emoji)
          };
        } else {
          // Ajouter la réaction
          return {
            ...signal,
            reactions: [...currentReactions, emoji]
          };
        }
      }
      return signal;
    }));
  };

  const scrollToTop = () => {
    // Pour les salons de chat, scroller dans le conteneur de messages
    if (messagesContainerRef.current && ['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id)) {
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
      alert('Veuillez entrer un titre pour votre stream');
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
          
          // Trouver spécifiquement les conteneurs de livestream
          const livestreamContainers = document.querySelectorAll('.bg-gray-900 .bg-black.flex.items-center.justify-center');
          console.log('Conteneurs livestream trouvés:', livestreamContainers.length);
          
          if (livestreamContainers.length === 0) {
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
            // Utiliser les conteneurs de livestream spécifiques
            livestreamContainers.forEach((container, index) => {
              console.log(`Remplacer conteneur livestream ${index}`);
              container.innerHTML = '';
              const videoClone = video.cloneNode(true) as HTMLVideoElement;
              container.appendChild(videoClone);
              
              // Lancer la lecture pour chaque clone
              videoClone.play().then(() => {
                console.log(`Vidéo livestream ${index} en cours de lecture`);
              }).catch(err => {
                console.error(`Erreur lecture vidéo livestream ${index}:`, err);
              });
            });
          }
          
          // Mettre à jour l'état
          setIsLiveStreaming(true);
          setViewerCount(15);
        })
        .catch(err => {
          console.error('Erreur partage d\'écran:', err);
          alert('Erreur lors du partage d\'écran: ' + err.message);
        });
    } else {
      alert('Partage d\'écran non supporté sur ce navigateur');
    }
  };

  const handleSignalStatus = (signalId: string, newStatus: 'WIN' | 'LOSS' | 'BE' | 'ACTIVE') => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return;

    if (signal.status === newStatus) {
      // Si on clique sur le même statut, on remet en ACTIVE
      setSignals(prev => prev.map(s => 
        s.id === signalId ? { ...s, status: 'ACTIVE', pnl: undefined } : s
      ));
    } else if (newStatus === 'ACTIVE') {
      // Si on veut remettre en ACTIVE directement
      setSignals(prev => prev.map(s => 
        s.id === signalId ? { ...s, status: 'ACTIVE', pnl: undefined } : s
      ));
    } else {
      // Sinon on demande le P&L
      const pnl = prompt(`Entrez le P&L final pour ce signal (ex: +$150 ou -$50):`);
      if (pnl !== null) {
        setSignals(prev => prev.map(s => 
          s.id === signalId ? { ...s, status: newStatus, pnl } : s
        ));
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
  }, [messages, selectedChannel.id]);

  const channels = [
    { id: 'crypto', name: 'crypto', emoji: '🪙', fullName: 'Crypto' },
    { id: 'futur', name: 'futur', emoji: '📈', fullName: 'Futur' },
    { id: 'forex', name: 'forex', emoji: '💱', fullName: 'Forex' },
    { id: 'fondamentaux', name: 'fondamentaux', emoji: '📚', fullName: 'Fondamentaux' },
    { id: 'letsgooo-model', name: 'letsgooo-model', emoji: '🚀', fullName: 'Letsgooo model' },
    { id: 'livestream', name: 'livestream', emoji: '📺', fullName: 'Livestream' },
    { id: 'general-chat', name: 'general-chat', emoji: '💬', fullName: 'Général chat' },
    { id: 'profit-loss', name: 'profit-loss', emoji: '💰', fullName: 'Profit loss' },
    { id: 'calendrier', name: 'calendrier', emoji: '📅', fullName: 'Calendrier' },
    { id: 'trading-journal', name: 'trading-journal', emoji: '📊', fullName: 'Trading Journal' }
  ];

  const handleCreateSignal = () => {
    setShowSignalModal(true);
  };

  // Fonctions pour le journal de trading personnalisé
  const handleAddTrade = () => {
    setShowTradeModal(true);
  };

  const handleTradeSubmit = () => {
    if (!tradeData.symbol || !tradeData.entry || !tradeData.exit || !tradeData.pnl) {
      alert('Veuillez remplir les champs obligatoires (Symbol, Entry, Exit, PnL)');
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
    alert('Trade ajouté avec succès !');
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
      alert(`✅ Données importées !\nSymbole: ${extracted.symbol}\nEntrée: ${extracted.entryPrice}\nSortie: ${extracted.exitPrice}\nStop Loss: ${extracted.stopLoss}`);
    } else {
      alert('❌ Aucune donnée détectée. Essayez de coller depuis TradingView (Risk/Reward tool)');
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
    // Pour les signaux, on utilise une logique simple basée sur le jour actuel
    // car les signaux n'ont pas de date stockée, seulement un timestamp
    const today = new Date();
    const clickedDay = date.getDate();
    const clickedMonth = date.getMonth();
    const clickedYear = date.getFullYear();
    
    // Si c'est aujourd'hui, retourner tous les signaux
    if (clickedDay === today.getDate() && 
        clickedMonth === today.getMonth() && 
        clickedYear === today.getFullYear()) {
      return signals;
    }
    
    // Sinon, retourner un tableau vide (pas de signaux pour les autres jours)
    return [];
  };

  const handleSignalSubmit = () => {
    // Validation minimale - juste besoin d'au moins un champ rempli
    if (!signalData.symbol && !signalData.entry && !signalData.takeProfit && !signalData.stopLoss && !signalData.description) {
      alert('Veuillez remplir au moins un champ pour créer le signal');
      return;
    }

    const newSignal = {
      id: Date.now().toString(),
      type: signalData.type,
      symbol: signalData.symbol || 'N/A',
      timeframe: signalData.timeframe || '1 min',
      entry: signalData.entry || 'N/A',
      takeProfit: signalData.takeProfit || 'N/A',
      stopLoss: signalData.stopLoss || 'N/A',
      description: signalData.description || '',
      image: signalData.image,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: 'ACTIVE' as const,
      channel_id: selectedChannel.id,
      reactions: []
    };

    // Ajouter le signal à la liste (en premier)
    setSignals(prevSignals => [newSignal, ...prevSignals]);
    console.log('Nouveau signal:', newSignal);
    
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
    
    alert('Signal créé avec succès !');
  };

  const handleSendMessage = async () => {
    if (chatMessage.trim()) {
      try {
        // Envoyer vers Supabase avec avatar utilisateur
        const messageData = {
          channel_id: selectedChannel.id,
          content: chatMessage,
          author: 'TheTheTrader',
          author_type: 'user' as const,
          author_avatar: profileImage || undefined // Photo de profil utilisateur
        };

        const savedMessage = await addMessage(messageData);

        if (savedMessage) {
      const newMessage = {
            id: savedMessage.id || Date.now().toString(),
            text: savedMessage.content,
            timestamp: new Date(savedMessage.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            user: savedMessage.author,
            author: savedMessage.author, // CONSERVER le nom de l'auteur !
            author_avatar: savedMessage.author_avatar // CONSERVER l'avatar de l'auteur !
          };

          setMessages(prev => ({
            ...prev,
            [selectedChannel.id]: [...(prev[selectedChannel.id] || []), newMessage]
          }));

          console.log('✅ Message envoyé à Supabase:', savedMessage);
        } else {
          console.error('❌ Erreur envoi message Supabase');
        }
      } catch (error) {
        console.error('💥 ERREUR envoi message:', error);
      }

      setChatMessage('');
      
      // Scroll automatique après envoi
      scrollToBottom();
    }
  };

                  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    try {
                      // Convertir le fichier en base64
                      const reader = new FileReader();
                      reader.onload = async (e) => {
                        const base64Image = e.target?.result as string;
                        
                        // Envoyer à Supabase avec l'image en base64
                        const messageData = {
                          channel_id: selectedChannel.id,
                          content: `📎 Image: ${file.name}`,
                          author: 'TheTheTrader',
                          author_type: 'user' as const,
                          author_avatar: profileImage || undefined,
                          attachment_data: base64Image,
                          attachment_type: file.type,
                          attachment_name: file.name
                        };
                        
                        const savedMessage = await addMessage(messageData);
                        
                        if (savedMessage) {
                          const newMessage = {
                            id: savedMessage.id || Date.now().toString(),
                            text: savedMessage.content,
                            timestamp: new Date(savedMessage.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                            user: savedMessage.author,
                            author: savedMessage.author,
                            author_avatar: savedMessage.author_avatar,
                            attachment: savedMessage.attachment_data ? {
                              type: savedMessage.attachment_type || 'image/jpeg',
                              name: savedMessage.attachment_name || 'image.jpg'
                            } : undefined,
                            attachment_data: savedMessage.attachment_data
                          };
                          
                          setMessages(prev => ({
                            ...prev,
                            [selectedChannel.id]: [...(prev[selectedChannel.id] || []), newMessage]
                          }));
                          
                          console.log('✅ Image envoyée à Supabase:', savedMessage);
                        } else {
                          console.error('❌ Erreur envoi image Supabase');
                        }
                      };
                      reader.readAsDataURL(file);
                      
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
        alert(`✅ Données importées !\nSymbole: ${newData.symbol}\nEntrée: ${newData.entry}\nTP: ${newData.takeProfit}\nSL: ${newData.stopLoss}`);
      } else {
        alert(`⚠️ Données partielles importées !\nSymbole: ${newData.symbol}\nEntrée: ${newData.entry}\nComplétez les champs manquants`);
      }
      
      return true;
    }
    
    alert('❌ Aucun nombre détecté. Exemple : "NQ1! 22950 23004 22896"');
    return false;
  };

  const getTradingCalendar = () => (
    <div className="bg-gray-900 text-white p-4 md:p-6 h-full overflow-y-auto overflow-x-hidden" style={{ paddingTop: '80px' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 border-b border-gray-600 pb-4 gap-4 md:gap-0">
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-white">
            {selectedChannel.id === 'trading-journal' ? 'Mon Trading Journal' : 'Calendrier des Signaux'}
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

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-x-hidden">
        {/* Calendrier principal */}
        <div className="flex-1 min-w-0 max-w-full overflow-x-hidden">
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4 min-w-0 max-w-full">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <div key={day} className="text-center text-gray-400 font-semibold py-3 text-sm uppercase tracking-wide">
                {day.substring(0, 3)}
              </div>
            ))}
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 min-w-0 max-w-full overflow-x-hidden">
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
                  return <div key={i} className="border-2 rounded-lg h-16 md:h-24 p-1 md:p-2 bg-gray-800 border-gray-700"></div>;
                }
                
                // Celles vides à la fin
                if (dayNumber > daysInMonth) {
                  return <div key={i} className="border-2 rounded-lg h-16 md:h-24 p-1 md:p-2 bg-gray-800 border-gray-700"></div>;
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
                  signals.filter(signal => {
                    const signalDate = new Date();
                    // Pour l'instant, on utilise la date actuelle car les signaux n'ont pas de date spécifique
                    return signalDate.getDate() === dayNumber && 
                           signalDate.getMonth() === currentDate.getMonth() && 
                           signalDate.getFullYear() === currentDate.getFullYear();
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
                  // Logique pour les signaux (calendrier normal)
                  if (daySignals.length > 0) {
                    tradeCount = daySignals.length;
                    
                    // Déterminer la couleur selon les statuts des signaux
                    const hasWin = daySignals.some(s => s.status === 'WIN');
                    const hasLoss = daySignals.some(s => s.status === 'LOSS');
                    const hasBE = daySignals.some(s => s.status === 'BE');
                    
                    if (hasWin && !hasLoss) {
                      bgColor = 'bg-green-500/60 border-green-400/50 text-white'; // WIN
                    } else if (hasLoss && !hasWin) {
                      bgColor = 'bg-red-500/60 border-red-400/50 text-white'; // LOSS
                    } else if (hasBE || (hasWin && hasLoss)) {
                      bgColor = 'bg-blue-500/60 border-blue-400/50 text-white'; // BE ou mixte
                    } else {
                      bgColor = 'bg-yellow-500/60 border-yellow-400/50 text-white'; // ACTIVE
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
                                                  // Désactivé temporairement pour éviter les bugs
                        // if (tradesForDate.length > 0) {
                        //   console.log('Trades trouvés, ouverture modal...');
                        //   setSelectedTradesDate(clickedDate);
                        //   setShowTradesModal(true);
                        // }
                        console.log('Clic sur jour:', dayNumber, 'Trades trouvés:', tradesForDate.length);
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
                        alert('Erreur lors du clic sur le jour. Vérifiez la console.');
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
                  `}>
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
            {selectedChannel.id === 'trading-journal' ? 'Mon Trading Journal' : 'Statistiques Signaux'}
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
        </div>
      </div>
    </div>
  );

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
              <button onClick={() => handleChannelChange('crypto', 'crypto')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'crypto' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>🪙 Crypto</button>
              <button onClick={() => handleChannelChange('futur', 'futur')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'futur' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📈 Futur</button>
              <button onClick={() => handleChannelChange('forex', 'forex')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'forex' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>💱 Forex</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">TRADING HUB</h3>
            <div className="space-y-1">
              <button onClick={() => handleChannelChange('livestream', 'livestream')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'livestream' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📺 Livestream</button>
              <button onClick={() => handleChannelChange('general-chat', 'general-chat')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'general-chat' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>💬 General-chat</button>
              <button onClick={() => handleChannelChange('profit-loss', 'profit-loss')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'profit-loss' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>💰 Profit-loss</button>
              <button onClick={() => {
                // Réinitialiser selectedDate si on quitte le Trading Journal
                if (selectedChannel.id === 'trading-journal') {
                  setSelectedDate(null);
                }
                // Réinitialiser selectedChannel pour le calendrier
                setSelectedChannel({id: 'calendar', name: 'calendar'});
                setView('calendar');
                scrollToTop();
              }} className={`w-full text-left px-3 py-2 rounded text-sm ${view === 'calendar' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📅 Calendrier</button>
              <button onClick={() => handleChannelChange('trading-journal', 'trading-journal')} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'trading-journal' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📊 Trading Journal</button>
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
                <span className="text-gray-400">Signaux actifs:</span>
                <span className="text-yellow-400">{signals.filter(s => s.status === 'ACTIVE').length}</span>
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
                  {view === 'calendar' ? '📅 Calendrier' : 
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
                  {channels.filter(c => ['crypto', 'futur', 'forex'].includes(c.id)).map(channel => (
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
                  {channels.filter(c => ['livestream', 'general-chat', 'profit-loss'].includes(c.id)).map(channel => (
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
                        <p className="font-medium text-white">Calendrier</p>
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
                        <p className="font-medium text-white">Trading Journal</p>
                        <p className="text-sm text-gray-400">Journal de trading</p>
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
                    <span className="text-blue-400">{calculateWinRate()}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Signaux actifs:</span>
                    <span className="text-yellow-400">{signals.filter(s => s.status === 'ACTIVE').length}</span>
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
            {(view === 'calendar' || selectedChannel.id === 'trading-journal') ? (
              <div className="bg-gray-900 text-white p-4 md:p-6 h-full overflow-y-auto overflow-x-hidden" style={{ paddingTop: '0px' }}>
                {/* Header avec bouton Ajouter Trade pour Trading Journal - Desktop seulement */}
                {selectedChannel.id === 'trading-journal' && (
                  <div className="hidden md:flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white">Mon Trading Journal</h1>
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
                {view === 'calendar' && selectedChannel.id !== 'trading-journal' && (
                  <div className="flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white">Calendrier des Signaux</h1>
                      <p className="text-sm text-gray-400 mt-1">Suivi des performances des signaux</p>
                    </div>
                  </div>
                )}
                
                {getTradingCalendar()}
                
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



                {/* Affichage des signaux */}
                {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss', 'livestream'].includes(selectedChannel.id) ? (
                  <div className="space-y-4">
                    {/* Bouton Voir plus fixé en haut */}
                    <div className="sticky top-0 z-10 bg-gray-900 p-2 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const currentSignals = signals.filter(s => s.channel_id === selectedChannel.id);
                            if (currentSignals.length > 0) {
                              const oldestSignal = currentSignals[0];
                              const beforeTimestamp = new Date(oldestSignal.timestamp).getTime();
                              loadSignals(selectedChannel.id);
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                        >
                          📊 Voir plus
                        </button>
                        <button
                          onClick={debugSignals}
                          className="px-3 py-2 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white"
                          title="Voir les signaux actuels dans la console"
                        >
                          🔍 Debug
                        </button>
                      </div>
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
                                    Signal {signal.type} {signal.symbol} {selectedChannel.id === 'futur' ? 'Futures' : ''} – {signal.timeframe}
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






                          </div>
                        </div>
                      ))
                    )}
                  </div>
                                ) : selectedChannel.id === 'livestream' ? (
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
                          {(messages['livestream'] || []).length === 0 ? (
                        <div className="text-center py-8">
                              <div className="text-gray-400 text-sm">Aucun message</div>
                              <div className="text-gray-500 text-xs mt-1">Soyez le premier à commenter !</div>
                        </div>
                      ) : (
                            (messages['livestream'] || []).map((message) => (
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
                ) : ['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id) ? (
                  <div className="flex flex-col h-full">
                    {/* Messages de chat */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
                      {/* Bouton Voir plus pour les messages (desktop) */}
                      {['general-chat', 'profit-loss'].includes(selectedChannel.id) && (
                        <div className="sticky top-0 z-10 bg-gray-900 p-2 rounded-lg border border-gray-700 mb-4">
                          <button
                            onClick={() => {
                              const currentMessages = messages[selectedChannel.id] || [];
                              if (currentMessages.length > 0) {
                                // Charger plus de messages
                                loadMessages(selectedChannel.id);
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                          >
                            💬 Voir plus de messages
                          </button>
                        </div>
                      )}
                      
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
                      
                      {/* Bouton Voir plus pour les messages */}
                      {['general-chat', 'profit-loss'].includes(selectedChannel.id) && (
                        <div className="sticky top-0 z-10 bg-gray-900 p-2 rounded-lg border border-gray-700 mb-4">
                          <button
                            onClick={() => {
                              const currentMessages = messages[selectedChannel.id] || [];
                              if (currentMessages.length > 0) {
                                // Charger plus de messages
                                loadMessages(selectedChannel.id);
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors"
                          >
                            💬 Voir plus de messages
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
                                <p className="text-white">{message.text}</p>
                                {message.attachment_data && (
                                  <div className="mt-2">
                                    {true ? (
                                      <img 
                                        src={message.attachment_data} 
                                        alt="Attachment"
                                        className="mt-2 max-w-full rounded-lg border border-gray-600"
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2 text-blue-400">
                                        <span>📎</span>
                                        <span className="text-sm">Pièce jointe</span>
                                      </div>
                                    )}
                                  </div>
                                )}
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
                          onClick={handleSendMessage}
                          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : selectedChannel.id === 'livestream' ? (
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
                          {(messages['livestream'] || []).length === 0 ? (
                            <div className="text-center py-8">
                              <div className="text-gray-400 text-sm">Aucun message</div>
                              <div className="text-gray-500 text-xs mt-1">Soyez le premier à commenter !</div>
                            </div>
                          ) : (
                            (messages['livestream'] || []).map((message) => (
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
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-sm">Bienvenue sur TheTheTrader</div>
                    <div className="text-gray-500 text-xs mt-1">Plateforme de trading en cours de développement</div>
                  </div>
                )}
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
              {/* Bouton + Signal pour les canaux de signaux */}
              {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss', 'livestream'].includes(selectedChannel.id) && (
                <div className="flex justify-end mb-4">
                  <button onClick={handleCreateSignal} className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm">+ Signal</button>
                </div>
              )}

              {/* Affichage des signaux */}
              {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss', 'livestream'].includes(selectedChannel.id) ? (
                <div className="space-y-4">
                  {/* Bouton Voir plus fixé en haut (desktop) */}
                  <div className="sticky top-0 z-10 bg-gray-900 p-2 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const currentSignals = signals.filter(s => s.channel_id === selectedChannel.id);
                          if (currentSignals.length > 0) {
                            const oldestSignal = currentSignals[0];
                            const beforeTimestamp = new Date(oldestSignal.timestamp).getTime();
                            loadSignals(selectedChannel.id);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                      >
                        📊 Voir plus
                      </button>
                      <button
                        onClick={debugSignals}
                        className="px-3 py-2 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white"
                        title="Voir les signaux actuels dans la console"
                      >
                        🔍 Debug
                      </button>
                    </div>
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

                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-w-full md:max-w-2xl">
                            <div className="space-y-3">
                              {/* Header avec titre et indicateur */}
                                <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${signal.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                <h3 className="font-bold text-white text-lg">
                                  Signal {signal.type} {signal.symbol} {selectedChannel.id === 'futur' ? 'Futures' : ''} – {signal.timeframe}
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
              ) : selectedChannel.id === 'livestream' ? (
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
                        {(messages['livestream'] || []).length === 0 ? (
                      <div className="text-center py-8">
                            <div className="text-gray-400 text-sm">Aucun message</div>
                            <div className="text-gray-500 text-xs mt-1">Soyez le premier à commenter !</div>
                      </div>
                    ) : (
                          (messages['livestream'] || []).map((message) => (
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
              ) : ['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id) ? (
                <div className="flex flex-col h-full">
                  {/* Messages de chat */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
                    {/* Bouton Voir plus pour les messages (mobile) */}
                    {['general-chat', 'profit-loss'].includes(selectedChannel.id) && (
                      <div className="sticky top-0 z-10 bg-gray-900 p-2 rounded-lg border border-gray-700 mb-4">
                        <button
                          onClick={() => {
                            const currentMessages = messages[selectedChannel.id] || [];
                            if (currentMessages.length > 0) {
                              // Charger plus de messages
                              loadMessages(selectedChannel.id);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors w-full"
                        >
                          💬 Voir plus de messages
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
                                <p className="text-white">{message.text}</p>
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
                        onClick={handleSendMessage}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white"
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">Bienvenue sur TheTheTrader</div>
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
                {getSignalsForDate(selectedSignalsDate).map((signal) => (
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
                        <span className="text-white ml-2">{signal.channel_id}</span>
                      </div>
                    </div>

                    {signal.description && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-400">Description:</span>
                        <p className="text-white mt-1">{signal.description}</p>
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
    </div>
  );
}
                