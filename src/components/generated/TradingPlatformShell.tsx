import React, { useState, useEffect, useRef } from 'react';

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
  }>>([{
    id: 'test-1',
    type: 'BUY',
    symbol: 'BTC',
    timeframe: '1 min',
    entry: '45000',
    takeProfit: '46000',
    stopLoss: '44000',
    description: 'Signal de test avec boutons WIN/LOSS/BE',
    image: null,
    timestamp: '22:30',
    status: 'ACTIVE',
    channel_id: 'crypto'
  }, {
    id: 'test-2',
    type: 'SELL',
    symbol: 'ETH',
    timeframe: '5 min',
    entry: '2800',
    takeProfit: '2750',
    stopLoss: '2850',
    description: 'Signal ETH avec boutons visibles',
    image: null,
    timestamp: '22:35',
    status: 'ACTIVE',
    channel_id: 'forex',
    reactions: []
  }]);

  // Initialiser les signaux existants avec le statut ACTIVE
  useEffect(() => {
    setSignals(prevSignals => 
      prevSignals.map(signal => ({
        ...signal,
        status: signal.status || 'ACTIVE'
      }))
    );
    
    // Ajouter un signal de test si aucun signal n'existe
    if (signals.length === 0) {
      const testSignal = {
        id: 'test-1',
        type: 'BUY',
        symbol: 'BTC',
        timeframe: '1 min',
        entry: '45000',
        takeProfit: '46000',
        stopLoss: '44000',
        description: 'Signal de test',
        image: null,
        timestamp: '22:30',
        status: 'ACTIVE' as const,
        channel_id: 'crypto',
        reactions: []
      };
      setSignals([testSignal]);
    }
  }, []);
  const [chatMessage, setChatMessage] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<{[channelId: string]: Array<{
    id: string;
    text: string;
    timestamp: string;
    author: string;
    attachment?: File;
  }>}>({});
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

  const calculateTotalPnL = (): number => {
    return signals
      .filter(s => s.pnl && s.status !== 'ACTIVE')
      .reduce((total, signal) => total + parsePnL(signal.pnl), 0);
  };

  const calculateWinRate = (): number => {
    const closedSignals = signals.filter(s => s.status !== 'ACTIVE');
    if (closedSignals.length === 0) return 0;
    const wins = closedSignals.filter(s => s.status === 'WIN').length;
    return Math.round((wins / closedSignals.length) * 100);
  };

  const calculateAvgWin = (): number => {
    const winSignals = signals.filter(s => s.status === 'WIN' && s.pnl);
    if (winSignals.length === 0) return 0;
    const totalWinPnL = winSignals.reduce((total, signal) => total + parsePnL(signal.pnl), 0);
    return Math.round(totalWinPnL / winSignals.length);
  };

  const calculateAvgLoss = (): number => {
    const lossSignals = signals.filter(s => s.status === 'LOSS' && s.pnl);
    if (lossSignals.length === 0) return 0;
    const totalLossPnL = lossSignals.reduce((total, signal) => total + Math.abs(parsePnL(signal.pnl)), 0);
    return Math.round(totalLossPnL / lossSignals.length);
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

  const handleLogout = () => {
    // Nettoyer le localStorage
    localStorage.clear();
    // Rediriger vers la landing page
    window.location.href = '/';
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
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
  }, [chatMessages, selectedChannel.id]);

  const channels = [
    { id: 'crypto', name: 'crypto', emoji: '🪙', fullName: 'Crypto' },
    { id: 'futur', name: 'futur', emoji: '📈', fullName: 'Futur' },
    { id: 'forex', name: 'forex', emoji: '💱', fullName: 'Forex' },
    { id: 'fondamentaux', name: 'fondamentaux', emoji: '📚', fullName: 'Fondamentaux' },
    { id: 'letsgooo-model', name: 'letsgooo-model', emoji: '🚀', fullName: 'Letsgooo model' },
    { id: 'livestream', name: 'livestream', emoji: '📺', fullName: 'Livestream' },
    { id: 'general-chat', name: 'general-chat', emoji: '💬', fullName: 'Général chat' },
    { id: 'profit-loss', name: 'profit-loss', emoji: '💰', fullName: 'Profit loss' },
    { id: 'calendrier', name: 'calendrier', emoji: '📅', fullName: 'Calendrier' }
  ];

  const handleCreateSignal = () => {
    setShowSignalModal(true);
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

  const handleSendMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: chatMessage,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        author: 'TheTheTrader'
      };
      setChatMessages(prev => ({
        ...prev,
        [selectedChannel.id]: [...(prev[selectedChannel.id] || []), newMessage]
      }));
      setChatMessage('');
      
      // Scroll automatique après envoi
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 50);
    }
  };

                  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    const newMessage = {
                      id: Date.now().toString(),
                      text: '',
                      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                      author: 'TheTheTrader',
                      attachment: file
                    };
                    setChatMessages(prev => ({
                      ...prev,
                      [selectedChannel.id]: [...(prev[selectedChannel.id] || []), newMessage]
                    }));
                    // Reset the input
                    event.target.value = '';
                    
                    // Scroll automatique après upload
                    setTimeout(() => {
                      if (messagesContainerRef.current) {
                        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                      }
                    }, 50);
                  }
                };

  const parseSignalData = (text: string) => {
    console.log('Parsing du texte:', text);
    
    // Chercher tous les nombres
    const numbers = text.match(/\d+(?:\.\d+)?/g);
    console.log('Nombres trouvés:', numbers);
    
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
    
    console.log('Symbole trouvé:', symbol);
    
    // Déterminer le type basé sur le texte
    let type = 'BUY';
    if (text.toUpperCase().includes('SELL') || text.toUpperCase().includes('SHORT')) {
      type = 'SELL';
    } else if (text.toUpperCase().includes('BUY') || text.toUpperCase().includes('LONG')) {
      type = 'BUY';
    }
    console.log('Type détecté:', type);
    
    // Si on a au moins 1 nombre, on peut commencer à remplir
    if (numbers && numbers.length >= 1) {
      const newData = {
        symbol: symbol || 'UNKNOWN',
        entry: numbers[0] || '',
        takeProfit: numbers[1] || '', 
        stopLoss: numbers[2] || '',
        type: type
      };
      
      console.log('Données finales:', newData);
      
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
    <div className="bg-gray-900 text-white p-4 md:p-6 h-full overflow-y-auto" style={{ paddingTop: '80px' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 border-b border-gray-600 pb-4 gap-4 md:gap-0">
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-white">Trading Calendar</h1>
          <p className="text-sm text-gray-400 mt-1">Track your daily trading performance</p>
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
        </div>
      </div>

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
              
                              // Vérifier s'il y a des signaux pour ce jour
                const daySignals = signals.filter(signal => {
                  const signalDate = new Date();
                  // Pour l'instant, on utilise la date actuelle car les signaux n'ont pas de date spécifique
                  return signalDate.getDate() === dayNumber && 
                         signalDate.getMonth() === currentDate.getMonth() && 
                         signalDate.getFullYear() === currentDate.getFullYear();
                });

                // Déterminer la couleur selon les signaux
                let bgColor = 'bg-gray-700 border-gray-600 text-gray-400'; // No trade par défaut
                let signalCount = 0;

                if (daySignals.length > 0) {
                  signalCount = daySignals.length;
                  
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

                return (
                  <div key={i} className={`
                      border-2 rounded-lg h-16 md:h-24 p-1 md:p-2 cursor-pointer transition-all hover:shadow-md
                      ${bgColor}
                      ${isToday ? 'ring-2 ring-blue-400' : ''}
                    `}>
                    <div className="flex flex-col h-full justify-between">
                      <div className="text-xs md:text-sm font-semibold">{dayNumber}</div>
                      {signalCount > 0 && (
                        <div className="text-xs font-bold text-center hidden md:block">
                          {signalCount} signal{signalCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
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
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 rounded"></div>
              <span className="text-sm text-gray-300">Today</span>
            </div>
          </div>
        </div>

        {/* Panneau des statistiques */}
        <div className="w-full lg:w-80 bg-gray-800 rounded-xl p-4 md:p-6">
          <h3 className="text-lg font-bold text-white mb-6">Statistiques Signaux</h3>
          
          {/* Métriques principales */}
          <div className="space-y-4 mb-8">
            {/* P&L Total */}
            <div className={`border rounded-lg p-4 border ${
              calculateTotalPnL() >= 0 
                ? 'bg-green-600/20 border-green-500/30' 
                : 'bg-red-600/20 border-red-500/30'
            }`}>
              <div className={`text-sm mb-1 ${
                calculateTotalPnL() >= 0 ? 'text-green-300' : 'text-red-300'
              }`}>P&L Total</div>
              <div className={`text-2xl font-bold ${
                calculateTotalPnL() >= 0 ? 'text-green-200' : 'text-red-200'
              }`}>
                {calculateTotalPnL() >= 0 ? '+' : ''}${calculateTotalPnL()}
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-blue-600/20 border-blue-500/30 rounded-lg p-4 border">
              <div className="text-sm text-blue-300 mb-1">Win Rate</div>
              <div className="text-2xl font-bold text-blue-200">{calculateWinRate()}%</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Aujourd'hui</div>
                <div className="text-lg font-bold text-blue-400">{getTodaySignals().length}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Ce mois</div>
                <div className="text-lg font-bold text-white">{getThisMonthSignals().length}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Avg Win</div>
                <div className="text-lg font-bold text-green-400">
                  {calculateAvgWin() > 0 ? `+$${calculateAvgWin()}` : '-'}
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Avg Loss</div>
                <div className="text-lg font-bold text-red-400">
                  {calculateAvgLoss() > 0 ? `-$${calculateAvgLoss()}` : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Résumé hebdomadaire */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4">Weekly Breakdown</h4>
            <div className="space-y-2">
              {getWeeklyBreakdown().map((weekData, index) => (
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
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ÉDUCATION</h3>
            <div className="space-y-1">
              <button onClick={() => {setSelectedChannel({id: 'fondamentaux', name: 'fondamentaux'}); setView('signals'); scrollToTop();}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'fondamentaux' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📚 Fondamentaux</button>
              <button onClick={() => {setSelectedChannel({id: 'letsgooo-model', name: 'letsgooo-model'}); setView('signals'); scrollToTop();}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'letsgooo-model' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>🚀 Letsgooo-model</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">SIGNAUX</h3>
            <div className="space-y-1">
              <button onClick={() => {setSelectedChannel({id: 'crypto', name: 'crypto'}); setView('signals'); scrollToTop();}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'crypto' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>🪙 Crypto</button>
              <button onClick={() => {setSelectedChannel({id: 'futur', name: 'futur'}); setView('signals'); scrollToTop();}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'futur' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📈 Futur</button>
              <button onClick={() => {setSelectedChannel({id: 'forex', name: 'forex'}); setView('signals'); scrollToTop();}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'forex' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>💱 Forex</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">TRADING HUB</h3>
            <div className="space-y-1">
              <button onClick={() => {setSelectedChannel({id: 'livestream', name: 'livestream'}); setView('signals'); scrollToTop();}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'livestream' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📺 Livestream</button>
              <button onClick={() => {setSelectedChannel({id: 'general-chat', name: 'general-chat'}); setView('signals'); scrollToTop();}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'general-chat' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>💬 General-chat</button>
              <button onClick={() => {setSelectedChannel({id: 'profit-loss', name: 'profit-loss'}); setView('signals'); scrollToTop();}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'profit-loss' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>💰 Profit-loss</button>
              <button onClick={() => {setView('calendar'); scrollToTop();}} className={`w-full text-left px-3 py-2 rounded text-sm ${view === 'calendar' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📅 Calendrier</button>
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
              {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss', 'livestream'].includes(selectedChannel.id) && (
                <button onClick={handleCreateSignal} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">+ Signal</button>
              )}
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
                        setSelectedChannel({id: channel.id, name: channel.name});
                        setView('signals');
                        setMobileView('content');
                        scrollToTop();
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
                        setSelectedChannel({id: channel.id, name: channel.name});
                        setView('signals');
                        setMobileView('content');
                        scrollToTop();
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
                        setSelectedChannel({id: channel.id, name: channel.name});
                        setView('signals');
                        setMobileView('content');
                        scrollToTop();
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
            {view === 'calendar' ? (
              getTradingCalendar()
            ) : (
              <div className="p-4 md:p-6 space-y-4 w-full h-full overflow-y-auto" style={{ paddingBottom: '100px' }}>



                {/* Affichage des signaux */}
                {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss', 'livestream'].includes(selectedChannel.id) ? (
                  <div className="space-y-4">
                    {signals.filter(signal => signal.channel_id === selectedChannel.id).length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-sm">Aucun signal pour le moment</div>
                        <div className="text-gray-500 text-xs mt-1">Créez votre premier signal avec le bouton "+"</div>
                      </div>
                    ) : (
                      signals.filter(signal => signal.channel_id === selectedChannel.id).map((signal) => (
                        <div key={signal.id} className="flex items-start gap-3">
                          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
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
                ) : ['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id) ? (
                  <div className="flex flex-col h-full">
                    {/* Messages de chat */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
                      {(chatMessages[selectedChannel.id] || []).length > 0 && (
                        (chatMessages[selectedChannel.id] || []).map((message) => (
                          <div key={message.id} className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-white">{message.author}</span>
                                <span className="text-xs text-gray-400">{message.timestamp}</span>
                              </div>
                              <div className="bg-gray-700 rounded-lg p-3 hover:shadow-lg hover:shadow-gray-900/50 transition-shadow duration-200 max-w-full break-words">
                                <p className="text-white">{message.text}</p>
                                {message.attachment && (
                                  <div className="mt-2">
                                    {message.attachment.type.startsWith('image/') ? (
                                      <img 
                                        src={URL.createObjectURL(message.attachment)} 
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
        <div className="hidden md:block flex-1 overflow-y-auto">
          {view === 'calendar' ? (
            getTradingCalendar()
          ) : (
            <div className="p-4 md:p-6 space-y-4 w-full" style={{ paddingTop: '20px' }}>
              {/* Bouton + Signal pour les canaux de signaux */}
              {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss', 'livestream'].includes(selectedChannel.id) && (
                <div className="flex justify-end mb-4">
                  <button onClick={handleCreateSignal} className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm">+ Signal</button>
                </div>
              )}

              {/* Affichage des signaux */}
              {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss', 'livestream'].includes(selectedChannel.id) ? (
                <div className="space-y-4">
                  {signals.filter(signal => signal.channel_id === selectedChannel.id).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-sm">Aucun signal pour le moment</div>
                      <div className="text-gray-500 text-xs mt-1">Créez votre premier signal avec le bouton "+"</div>
                    </div>
                  ) : (
                    signals.filter(signal => signal.channel_id === selectedChannel.id).map((signal) => (
                      <div key={signal.id} className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
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
              ) : ['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id) ? (
                <div className="flex flex-col h-full">
                  {/* Messages de chat */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
                    {(chatMessages[selectedChannel.id] || []).length > 0 && (
                      (chatMessages[selectedChannel.id] || []).map((message) => (
                        <div key={message.id} className="flex items-start gap-3">
                          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{message.author}</span>
                              <span className="text-xs text-gray-400">{message.timestamp}</span>
                            </div>
                            <div className="bg-gray-700 rounded-lg p-3 hover:shadow-lg hover:shadow-gray-900/50 transition-shadow duration-200 max-w-full break-words">
                                <p className="text-white">{message.text}</p>
                                {message.attachment && (
                                  <div className="mt-2">
                                    {message.attachment.type.startsWith('image/') ? (
                                      <img 
                                        src={URL.createObjectURL(message.attachment)} 
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
    </div>
  );
}
                