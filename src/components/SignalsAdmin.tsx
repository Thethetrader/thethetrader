import React, { useState, useEffect, useRef } from 'react';

export default function SignalsAdmin() {
  const [selectedChannel, setSelectedChannel] = useState({ id: 'crypto', name: 'crypto' });
  const [view, setView] = useState<'signals' | 'calendar'>('signals');
  const [mobileView, setMobileView] = useState<'channels' | 'content'>('channels');
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{[channelId: string]: Array<{id: string, text: string, author: string, timestamp: string, attachment?: File}>}>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [personalTrades, setPersonalTrades] = useState<Array<{
    id: string;
    symbol: string;
    type: string;
    entry: string;
    exit: string;
    stopLoss?: string;
    pnl: string;
    status: 'WIN' | 'LOSS' | 'BE';
    date: string;
    timestamp: string;
    notes?: string;
    image1?: File;
    image2?: File;
  }>>([]);
  const [signals, setSignals] = useState<Array<{
    id: string;
    channel_id: string;
    type: string;
    symbol: string;
    timeframe: string;
    entry: string;
    stopLoss: string;
    takeProfit: string;
    status: 'ACTIVE' | 'WIN' | 'LOSS' | 'BE';
    timestamp: string;
    image?: File;
    pnl?: string;
  }>>([
    {
      id: '1',
      channel_id: 'crypto',
      type: 'LONG',
      symbol: 'BTC',
      timeframe: '1H',
      entry: '45000',
      stopLoss: '44000',
      takeProfit: '47000',
      status: 'ACTIVE',
      timestamp: '14:30'
    },
    {
      id: '2',
      channel_id: 'forex',
      type: 'SHORT',
      symbol: 'EURUSD',
      timeframe: '4H',
      entry: '1.0850',
      stopLoss: '1.0900',
      takeProfit: '1.0750',
      status: 'WIN',
      timestamp: '12:15',
      pnl: '+$320'
    }
  ]);

  const channels = [
    { id: 'crypto', name: 'crypto', emoji: '🪙', fullName: 'Crypto' },
    { id: 'futur', name: 'futur', emoji: '📈', fullName: 'Futur' },
    { id: 'forex', name: 'forex', emoji: '💱', fullName: 'Forex' },
    { id: 'fondamentaux', name: 'fondamentaux', emoji: '📚', fullName: 'Fondamentaux' },
    { id: 'letsgooo-model', name: 'letsgooo-model', emoji: '🚀', fullName: 'Letsgooo model' },
    { id: 'livestream', name: 'livestream', emoji: '📺', fullName: 'Livestream' },
    { id: 'general-chat', name: 'general-chat', emoji: '💬', fullName: 'Général chat' },
    { id: 'profit-loss', name: 'profit-loss', emoji: '💰', fullName: 'Profit loss' },
    { id: 'user-management', name: 'user-management', emoji: '👥', fullName: 'Gestion Utilisateurs' },
    { id: 'calendrier', name: 'calendrier', emoji: '📅', fullName: 'Calendrier' },
    { id: 'trading-journal', name: 'trading-journal', emoji: '📊', fullName: 'Trading Journal' }
  ];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleChannelChange = (channelId: string, channelName: string) => {
    // Réinitialiser selectedDate si on quitte le Trading Journal
    if (selectedChannel.id === 'trading-journal' && channelId !== 'trading-journal') {
      setSelectedDate(null);
    }
    
    setSelectedChannel({id: channelId, name: channelName});
    setView('signals');
    scrollToTop();
  };

  const scrollToTop = () => {
    if (messagesContainerRef.current && ['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id)) {
      messagesContainerRef.current.scrollTop = 0;
    }
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
      event.target.value = '';
      
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 50);
    }
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

  const handleSignalStatus = (signalId: string, newStatus: 'WIN' | 'LOSS' | 'BE' | 'ACTIVE') => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return;

    if (signal.status === newStatus) {
      setSignals(prev => prev.map(s => 
        s.id === signalId ? { ...s, status: 'ACTIVE', pnl: undefined } : s
      ));
    } else if (newStatus === 'ACTIVE') {
      setSignals(prev => prev.map(s => 
        s.id === signalId ? { ...s, status: 'ACTIVE', pnl: undefined } : s
      ));
    } else {
      const pnl = prompt(`Entrez le P&L final pour ce signal (ex: +$150 ou -$50):`);
      if (pnl !== null) {
        setSignals(prev => prev.map(s => 
          s.id === signalId ? { ...s, status: newStatus, pnl } : s
        ));
      }
    }
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

  // Fonctions pour calculer les statistiques
  const parsePnL = (pnlString: string): number => {
    if (!pnlString) return 0;
    const cleanStr = pnlString.replace(/[^\d.-]/g, '');
    return parseFloat(cleanStr) || 0;
  };

  const calculateTotalPnL = (): number => {
    return signals.reduce((total, signal) => {
      if (signal.pnl) {
        return total + parsePnL(signal.pnl);
      }
      return total;
    }, 0);
  };

  const calculateWinRate = (): number => {
    const finishedSignals = signals.filter(s => ['WIN', 'LOSS', 'BE'].includes(s.status));
    if (finishedSignals.length === 0) return 0;
    const wins = finishedSignals.filter(s => s.status === 'WIN').length;
    return Math.round((wins / finishedSignals.length) * 100);
  };

  const calculateTotalPnLTrades = (): number => {
    return personalTrades.reduce((total, trade) => {
      return total + parsePnL(trade.pnl);
    }, 0);
  };

  const calculateWinRateTrades = (): number => {
    const finishedTrades = personalTrades.filter(t => ['WIN', 'LOSS', 'BE'].includes(t.status));
    if (finishedTrades.length === 0) return 0;
    const wins = finishedTrades.filter(t => t.status === 'WIN').length;
    return Math.round((wins / finishedTrades.length) * 100);
  };

  const getTodaySignals = () => {
    const today = new Date();
    return signals.filter(signal => {
      const signalDate = new Date();
      return signalDate.getDate() === today.getDate() && 
             signalDate.getMonth() === today.getMonth() && 
             signalDate.getFullYear() === today.getFullYear();
    });
  };

  const getThisMonthSignals = () => {
    const today = new Date();
    return signals.filter(signal => {
      const signalDate = new Date();
      return signalDate.getMonth() === today.getMonth() && 
             signalDate.getFullYear() === today.getFullYear();
    });
  };

  const getTodayTrades = () => {
    const today = new Date();
    return personalTrades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate.getDate() === today.getDate() && 
             tradeDate.getMonth() === today.getMonth() && 
             tradeDate.getFullYear() === today.getFullYear();
    });
  };

  const getThisMonthTrades = () => {
    const today = new Date();
    return personalTrades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate.getMonth() === today.getMonth() && 
             tradeDate.getFullYear() === today.getFullYear();
    });
  };

  const calculateAvgWin = (): number => {
    const winSignals = signals.filter(s => s.status === 'WIN' && s.pnl);
    if (winSignals.length === 0) return 0;
    const total = winSignals.reduce((sum, signal) => sum + parsePnL(signal.pnl!), 0);
    return Math.round(total / winSignals.length);
  };

  const calculateAvgLoss = (): number => {
    const lossSignals = signals.filter(s => s.status === 'LOSS' && s.pnl);
    if (lossSignals.length === 0) return 0;
    const total = lossSignals.reduce((sum, signal) => sum + Math.abs(parsePnL(signal.pnl!)), 0);
    return Math.round(total / lossSignals.length);
  };

  const calculateAvgWinTrades = (): number => {
    const winTrades = personalTrades.filter(t => t.status === 'WIN');
    if (winTrades.length === 0) return 0;
    const total = winTrades.reduce((sum, trade) => sum + parsePnL(trade.pnl), 0);
    return Math.round(total / winTrades.length);
  };

  const calculateAvgLossTrades = (): number => {
    const lossTrades = personalTrades.filter(t => t.status === 'LOSS');
    if (lossTrades.length === 0) return 0;
    const total = lossTrades.reduce((sum, trade) => sum + Math.abs(parsePnL(trade.pnl)), 0);
    return Math.round(total / lossTrades.length);
  };

  const getWeeklyBreakdown = () => {
    // Logique simple pour l'exemple
    return [
      { week: 'Week 1', trades: 5, wins: 3, losses: 2, pnl: 150, isCurrentWeek: true },
      { week: 'Week 2', trades: 3, wins: 2, losses: 1, pnl: 75, isCurrentWeek: false },
    ];
  };

  const getWeeklyBreakdownTrades = () => {
    // Logique simple pour l'exemple
    return [
      { week: 'Week 1', trades: 3, wins: 2, losses: 1, pnl: 100, isCurrentWeek: true },
      { week: 'Week 2', trades: 2, wins: 1, losses: 1, pnl: 25, isCurrentWeek: false },
    ];
  };

  const getTradesForDate = (date: Date) => {
    return personalTrades.filter(trade => {
      const tradeDate = new Date(trade.date);
      return tradeDate.getDate() === date.getDate() && 
             tradeDate.getMonth() === date.getMonth() && 
             tradeDate.getFullYear() === date.getFullYear();
    });
  };

  const getSignalsForDate = (date: Date) => {
    return signals.filter(signal => {
      const signalDate = new Date();
      return signalDate.getDate() === date.getDate() && 
             signalDate.getMonth() === date.getMonth() && 
             signalDate.getFullYear() === date.getFullYear();
    });
  };

  const handleAddTrade = () => {
    console.log('Add trade functionality');
  };

  const getTradingCalendar = () => (
    <div className="bg-gray-900 text-white p-4 md:p-6 h-full overflow-y-auto overflow-x-hidden" style={{ paddingTop: '80px' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 border-b border-gray-600 pb-4 gap-4 md:gap-0">
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-white">Calendrier des Signaux</h1>
          <p className="text-sm text-gray-400 mt-1">Suivi des performances des signaux</p>
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
                        } else {
                          // Ouvrir le popup des signaux si il y en a
                          const signalsForDate = getSignalsForDate(clickedDate);
                          console.log('Clic sur jour:', dayNumber, 'Signaux trouvés:', signalsForDate.length);
                        }
                      } catch (error) {
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
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Mobile Navigation */}
      <div className="md:hidden flex flex-col h-full w-full">
        {/* Mobile Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-removebg-preview.png" 
              alt="Trading pour les nuls" 
              className="h-8 w-auto object-cover"
              style={{ clipPath: 'inset(10% 5% 15% 5%)' }}
            />
            <div className="text-white font-bold text-sm">TheTheTrader</div>
          </div>
          <button
            onClick={() => setMobileView(mobileView === 'channels' ? 'content' : 'channels')}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg"
          >
            {mobileView === 'channels' ? '📱' : '📋'}
          </button>
        </div>

        {/* Mobile Channels List */}
        <div className={`flex-1 bg-gray-900 transform transition-transform duration-300 ease-in-out ${
          mobileView === 'channels' ? 'translate-x-0' : '-translate-x-full'
        } absolute inset-0 z-20`}>
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

            {/* Gestion Utilisateurs sous les stats */}
            <button
              onClick={() => {
                handleChannelChange('user-management', 'user-management');
                setMobileView('content');
              }}
              className="w-full text-left px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">👥</span>
                <div>
                  <p className="font-medium text-white">Gestion Utilisateurs</p>
                  <p className="text-sm text-gray-400">Admin interface</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Content */}
        <div className={`absolute inset-0 bg-gray-900 transform transition-transform duration-300 ease-in-out z-10 ${
          mobileView === 'content' ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {(view === 'calendar' || selectedChannel.id === 'trading-journal') ? (
            getTradingCalendar()
          ) : (
            <div className="p-4 md:p-6 space-y-4 w-full h-full overflow-y-auto" style={{ paddingTop: '80px', paddingBottom: '100px' }}>
            {/* Gestion des utilisateurs */}
            {selectedChannel.id === 'user-management' ? (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    👥 Gestion des Utilisateurs
                  </h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="text-lg font-bold text-blue-400">0</div>
                      <div className="text-sm text-gray-400">Utilisateurs actifs</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="text-lg font-bold text-green-400">0</div>
                      <div className="text-sm text-gray-400">Nouveaux aujourd'hui</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="text-lg font-bold text-yellow-400">0</div>
                      <div className="text-sm text-gray-400">En ligne</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <div className="text-lg font-bold text-purple-400">0</div>
                      <div className="text-sm text-gray-400">Abonnés premium</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mb-6">
                    <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">
                      + Ajouter utilisateur
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm">
                      📊 Voir statistiques
                    </button>
                    <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm">
                      📧 Envoyer message
                    </button>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="font-medium text-white mb-3">Utilisateurs récents</h3>
                    <div className="text-center py-8 text-gray-400">
                      <p>Aucun utilisateur pour le moment</p>
                      <p className="text-sm mt-1">Les nouveaux utilisateurs apparaîtront ici</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
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
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${signal.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                  <h3 className="font-bold text-white text-lg">
                                    Signal {signal.type} {signal.symbol} {selectedChannel.id === 'futur' ? 'Futures' : ''} – {signal.timeframe}
                                  </h3>
                                </div>
                                
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
                ) : ['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id) ? (
                  <div className="flex flex-col h-full">
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
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
                              <p className="text-yellow-200"><strong>📖 Avertissement :</strong> Ce guide présente un ensemble de concepts appris et expérimentés sur les marchés financiers.</p>
                            </div>
                            
                            <div>
                              <h2 className="text-2xl font-bold text-blue-400 mb-4 border-l-4 border-blue-400 pl-4">1. 📚 Introduction</h2>
                              <p>Ce document vous présente les fondamentaux essentiels pour comprendre comment les charts évoluent.</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(chatMessages[selectedChannel.id] || []).length > 0 && (
                        (chatMessages[selectedChannel.id] || []).map((message) => (
                          <div key={message.id} className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-white">{message.author}</span>
                                <span className="text-xs text-gray-400">{message.timestamp}</span>
                              </div>
                              <div className="bg-gray-700 rounded-lg p-3 max-w-full break-words">
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
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>Canal en développement</p>
                    <p className="text-sm mt-1">Fonctionnalités à venir...</p>
                  </div>
                )}
              </>
            )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-56 bg-gray-800 flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm overflow-hidden">
              TT
            </div>
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

          {/* Gestion Utilisateurs sous les stats */}
          <div>
            <button 
              onClick={() => handleChannelChange('user-management', 'user-management')} 
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                selectedChannel.id === 'user-management' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              👥 Gestion Utilisateurs
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Content */}
      <div className="hidden md:block flex-1 p-6">
        {/* Calendrier et Trading Journal */}
        {(view === 'calendar' || selectedChannel.id === 'trading-journal') ? (
          getTradingCalendar()
        ) : selectedChannel.id === 'user-management' ? (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                👥 Gestion des Utilisateurs
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-lg font-bold text-blue-400">0</div>
                  <div className="text-sm text-gray-400">Utilisateurs actifs</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-lg font-bold text-green-400">0</div>
                  <div className="text-sm text-gray-400">Nouveaux aujourd'hui</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-lg font-bold text-yellow-400">0</div>
                  <div className="text-sm text-gray-400">En ligne</div>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">0</div>
                  <div className="text-sm text-gray-400">Abonnés premium</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-6">
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm">
                  + Ajouter utilisateur
                </button>
                <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm">
                  📊 Voir statistiques
                </button>
                <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm">
                  📧 Envoyer message
                </button>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-medium text-white mb-3">Utilisateurs récents</h3>
                <div className="text-center py-8 text-gray-400">
                  <p>Aucun utilisateur pour le moment</p>
                  <p className="text-sm mt-1">Les nouveaux utilisateurs apparaîtront ici</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${signal.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                              <h3 className="font-bold text-white text-lg">
                                Signal {signal.type} {signal.symbol} {selectedChannel.id === 'futur' ? 'Futures' : ''} – {signal.timeframe}
                              </h3>
                            </div>
                            
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
            ) : ['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id) ? (
              <div className="flex flex-col h-full">
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-32">
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
                          <p className="text-yellow-200"><strong>📖 Avertissement :</strong> Ce guide présente un ensemble de concepts appris et expérimentés sur les marchés financiers.</p>
                        </div>
                        
                        <div>
                          <h2 className="text-2xl font-bold text-blue-400 mb-4 border-l-4 border-blue-400 pl-4">1. 📚 Introduction</h2>
                          <p>Ce document vous présente les fondamentaux essentiels pour comprendre comment les charts évoluent.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(chatMessages[selectedChannel.id] || []).length > 0 && (
                    (chatMessages[selectedChannel.id] || []).map((message) => (
                      <div key={message.id} className="flex items-start gap-3">
                        <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white">{message.author}</span>
                            <span className="text-xs text-gray-400">{message.timestamp}</span>
                          </div>
                          <div className="bg-gray-700 rounded-lg p-3 max-w-full break-words">
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
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Canal en développement</p>
                <p className="text-sm mt-1">Fonctionnalités à venir...</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bouton déconnexion admin */}
      <button 
        onClick={() => {
          localStorage.removeItem('adminAuthenticated');
          window.location.href = '/';
        }}
        className="hidden md:block fixed bottom-4 left-4 bg-red-600/80 text-white p-3 rounded-full hover:bg-red-500/80 transition-all duration-200 shadow-lg z-50 backdrop-blur-sm"
        title="Déconnexion admin"
      >
        🏠
      </button>
    </div>
  );
}