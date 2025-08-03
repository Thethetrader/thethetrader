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
  }>>([]);
  const [chatMessage, setChatMessage] = useState('');
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    // Ajouter le signal à la liste
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
    <div className="bg-gray-900 text-white p-4 md:p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 border-b border-gray-600 pb-4 gap-4 md:gap-0">
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold text-white">Trading Calendar</h1>
          <p className="text-sm text-gray-400 mt-1">Track your daily trading performance</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium">P&L</button>
            <button className="px-4 py-2 bg-gray-700 text-gray-300 text-sm hover:bg-gray-600">Win Rate</button>
          </div>
          
          <div className="flex items-center gap-3 text-white">
            <button className="p-2 hover:bg-gray-700 rounded-lg text-lg font-bold">‹</button>
            <span className="px-4 text-lg font-semibold min-w-[120px] text-center">January 2025</span>
            <button className="p-2 hover:bg-gray-700 rounded-lg text-lg font-bold">›</button>
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
            {Array.from({ length: 35 }, (_, i) => {
              const day = i + 1;
              const isToday = day === 15;
              
              // Données de trading simulées
              const tradingDays = {
                2: { pnl: '+$1,240', color: 'bg-green-500/60 border-green-400/50 text-white' },
                3: { pnl: '-$320', color: 'bg-red-500/60 border-red-400/50 text-white' },
                6: { pnl: '+$890', color: 'bg-green-500/60 border-green-400/50 text-white' },
                7: { pnl: '+$2,150', color: 'bg-green-500/60 border-green-400/50 text-white' },
                8: { pnl: '-$540', color: 'bg-red-500/60 border-red-400/50 text-white' },
                9: { pnl: '+$670', color: 'bg-green-500/60 border-green-400/50 text-white' },
                10: { pnl: '+$1,180', color: 'bg-green-500/60 border-green-400/50 text-white' },
                13: { pnl: '-$230', color: 'bg-red-500/60 border-red-400/50 text-white' },
                14: { pnl: '+$1,920', color: 'bg-green-500/60 border-green-400/50 text-white' },
                15: { pnl: '+$840', color: 'bg-green-500/60 border-green-400/50 text-white' },
                16: { pnl: '+$450', color: 'bg-green-500/60 border-green-400/50 text-white' },
                17: { pnl: '-$710', color: 'bg-red-500/60 border-red-400/50 text-white' },
                20: { pnl: '+$1,650', color: 'bg-green-500/60 border-green-400/50 text-white' },
                21: { pnl: '+$380', color: 'bg-green-500/60 border-green-400/50 text-white' },
                22: { pnl: '-$190', color: 'bg-red-500/60 border-red-400/50 text-white' },
                23: { pnl: '+$2,100', color: 'bg-green-500/60 border-green-400/50 text-white' },
                24: { pnl: '+$920', color: 'bg-green-500/60 border-green-400/50 text-white' },
                27: { pnl: '+$560', color: 'bg-green-500/60 border-green-400/50 text-white' },
                28: { pnl: '-$430', color: 'bg-red-500/60 border-red-400/50 text-white' },
                29: { pnl: '+$1,340', color: 'bg-green-500/60 border-green-400/50 text-white' },
                30: { pnl: '+$780', color: 'bg-green-500/60 border-green-400/50 text-white' }
              };
              
              if (day > 31) return <div key={i}></div>;
              
              const dayData = tradingDays[day];
              
              return (
                <div key={i} className={`
                    border-2 rounded-lg h-16 md:h-24 p-1 md:p-2 cursor-pointer transition-all hover:shadow-md
                    ${dayData ? dayData.color : 'bg-gray-700 border-gray-600 text-gray-400'}
                    ${isToday ? 'ring-2 ring-blue-400' : ''}
                  `}>
                  <div className="flex flex-col h-full justify-between">
                    <div className="text-xs md:text-sm font-semibold">{day}</div>
                    {dayData && (
                      <div className="text-xs font-bold text-center hidden md:block">
                        {dayData.pnl}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Légende */}
          <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/60 border border-green-400/50 rounded"></div>
              <span className="text-sm text-gray-300">Profitable Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/60 border border-red-400/50 rounded"></div>
              <span className="text-sm text-gray-300">Loss Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-700 border border-gray-600 rounded"></div>
              <span className="text-sm text-gray-300">No Trading</span>
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
            <div className="bg-blue-600/20 border-blue-500/30 rounded-lg p-4 border">
              <div className="text-sm text-blue-300 mb-1">Total Signaux</div>
              <div className="text-2xl font-bold text-blue-200">{signals.length}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Aujourd'hui</div>
                <div className="text-lg font-bold text-blue-400">{signals.filter(s => new Date(s.timestamp).getDate() === new Date().getDate()).length}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Ce mois</div>
                <div className="text-lg font-bold text-white">{signals.filter(s => new Date(s.timestamp).getMonth() === new Date().getMonth()).length}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Avg Win</div>
                <div className="text-lg font-bold text-green-300">+$1,205</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Avg Loss</div>
                <div className="text-lg font-bold text-red-300">-$445</div>
              </div>
            </div>
          </div>

          {/* Résumé hebdomadaire */}
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-4">Weekly Breakdown</h4>
            <div className="space-y-3">
              {[
                { week: 'Week 1', pnl: '+$2,340', trades: '12 trades', winRate: '75%' },
                { week: 'Week 2', pnl: '+$4,180', trades: '18 trades', winRate: '78%' },
                { week: 'Week 3', pnl: '+$3,920', trades: '22 trades', winRate: '68%' },
                { week: 'Week 4', pnl: '+$5,040', trades: '25 trades', winRate: '76%' },
                { week: 'Week 5', pnl: 'Current week', trades: '12 trades', winRate: '83%' }
              ].map((week, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-sm font-medium text-white">{week.week}</div>
                    <div className={`text-sm font-bold ${week.pnl.startsWith('+') ? 'text-green-300' : 'text-gray-400'}`}>
                      {week.pnl}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{week.trades}</span>
                    <span>{week.winRate} win rate</span>
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
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
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
              <button onClick={() => {setSelectedChannel({id: 'fondamentaux', name: 'fondamentaux'}); setView('signals');}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'fondamentaux' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📚 Fondamentaux</button>
              <button onClick={() => {setSelectedChannel({id: 'letsgooo-model', name: 'letsgooo-model'}); setView('signals');}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'letsgooo-model' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>🚀 Letsgooo-model</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">SIGNAUX</h3>
            <div className="space-y-1">
              <button onClick={() => {setSelectedChannel({id: 'crypto', name: 'crypto'}); setView('signals');}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'crypto' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>🪙 Crypto</button>
              <button onClick={() => {setSelectedChannel({id: 'futur', name: 'futur'}); setView('signals');}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'futur' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📈 Futur</button>
              <button onClick={() => {setSelectedChannel({id: 'forex', name: 'forex'}); setView('signals');}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'forex' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>💱 Forex</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">TRADING HUB</h3>
            <div className="space-y-1">
              <button onClick={() => {setSelectedChannel({id: 'livestream', name: 'livestream'}); setView('signals');}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'livestream' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📺 Livestream</button>
              <button onClick={() => {setSelectedChannel({id: 'general-chat', name: 'general-chat'}); setView('signals');}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'general-chat' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>💬 General-chat</button>
              <button onClick={() => {setSelectedChannel({id: 'profit-loss', name: 'profit-loss'}); setView('signals');}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'profit-loss' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>💰 Profit-loss</button>
              <button onClick={() => setView('calendar')} className={`w-full text-left px-3 py-2 rounded text-sm ${view === 'calendar' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📅 Calendrier</button>
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2">Statistiques</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Win Rate:</span>
                <span className="text-green-400">78%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Signaux actifs:</span>
                <span className="text-blue-400">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Navigation - Fixed */}
        <div className="md:hidden bg-gray-800 border-b border-gray-700 p-4 fixed top-0 left-0 right-0 z-20" style={{ height: '80px' }}>
          {mobileView === 'channels' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">
                  TT
                </div>
                <div>
                  <p className="text-sm font-medium">TheTheTrader</p>
                  <p className="text-xs text-gray-400">En ligne</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
              {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id) && (
                <button onClick={handleCreateSignal} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">+ Signal</button>
              )}
            </div>
          )}
        </div>

        {/* Mobile Content Container with Slide Animation */}
        <div className="md:hidden relative flex-1 overflow-hidden" style={{ paddingTop: '80px' }}>
          {/* Channels List - Slides from left */}
          <div 
            className={`absolute inset-0 bg-gray-800 transform transition-transform duration-300 ease-in-out ${
              mobileView === 'channels' ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="p-4 space-y-6 h-full overflow-y-auto" style={{ paddingTop: '20px' }}>
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

              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3">Statistiques</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="text-green-400">78%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Signaux actifs:</span>
                    <span className="text-blue-400">3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area - Slides from right */}
          <div 
            className={`absolute inset-0 transform transition-transform duration-300 ease-in-out ${
              mobileView === 'content' ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {view === 'calendar' ? (
              getTradingCalendar()
            ) : (
              <div className="p-4 md:p-6 space-y-4 w-full h-full overflow-y-auto">

                {/* Affichage des signaux */}
                {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id) ? (
                  <div className="space-y-4">
                    {signals.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-sm">Aucun signal pour le moment</div>
                        <div className="text-gray-500 text-xs mt-1">Créez votre premier signal avec le bouton "+"</div>
                      </div>
                    ) : (
                      signals.map((signal) => (
                        <div key={signal.id} className="flex items-start gap-3">
                          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-white">TheTheTrader</span>
                              <span className="text-xs text-gray-400">{signal.timestamp}</span>
                            </div>

                            <div className="bg-transparent rounded-lg p-4">
                              <div className="space-y-2">
                                <div className="bg-gray-600 rounded-lg p-3 inline-block">
                                  <div className="flex items-center gap-2">
                                    <span className={signal.type === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                                      {signal.type === 'BUY' ? '📈' : '📉'}
                                    </span>
                                    <span className="font-semibold text-white text-base">
                                      Signal {signal.type} {signal.symbol}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="bg-gray-600 rounded-lg p-3 inline-block">
                                  <div className="space-y-1 text-sm">
                                    {signal.entry !== 'N/A' && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400">🔹</span>
                                        <span className="text-white">Entrée : {signal.entry}</span>
                                      </div>
                                    )}
                                    {signal.takeProfit !== 'N/A' && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400">🔹</span>
                                        <span className="text-white">Take Profit : {signal.takeProfit}</span>
                                      </div>
                                    )}
                                    {signal.stopLoss !== 'N/A' && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-blue-400">🔹</span>
                                        <span className="text-white">Stop Loss : {signal.stopLoss}</span>
                                      </div>
                                    )}
                                    {signal.description && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-yellow-400">📝</span>
                                        <span className="text-white">{signal.description}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {signal.image && (
                              <div className="mt-2">
                                <img 
                                  src={URL.createObjectURL(signal.image)} 
                                  alt="Signal screenshot"
                                  className="max-w-2xl rounded-lg border border-gray-600"
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-2 flex-wrap mt-2">
                              <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">🔥 0</button>
                              <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">💎 0</button>
                              <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">🚀 0</button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                                ) : ['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id) ? (
                  <div className="flex flex-col h-full">
                    {/* Messages de chat */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                      {(chatMessages[selectedChannel.id] || []).length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-gray-400 text-sm">Aucun message pour le moment</div>
                          <div className="text-gray-500 text-xs mt-1">Commencez la conversation !</div>
                        </div>
                      ) : (
                        (chatMessages[selectedChannel.id] || []).map((message) => (
                          <div key={message.id} className="flex items-start gap-3">
                            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-white">{message.author}</span>
                                <span className="text-xs text-gray-400">{message.timestamp}</span>
                              </div>
                              <div className="bg-gray-700 rounded-lg p-3 hover:shadow-lg hover:shadow-gray-900/50 transition-shadow duration-200">
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
            <div className="p-4 md:p-6 space-y-4 w-full">
              {/* Bouton + Signal pour les canaux de signaux */}
              {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id) && (
                <div className="flex justify-end mb-4">
                  <button onClick={handleCreateSignal} className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm">+ Signal</button>
                </div>
              )}

              {/* Affichage des signaux */}
              {view === 'signals' && !['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id) ? (
                <div className="space-y-4">
                  {signals.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-sm">Aucun signal pour le moment</div>
                      <div className="text-gray-500 text-xs mt-1">Créez votre premier signal avec le bouton "+"</div>
                    </div>
                  ) : (
                    signals.map((signal) => (
                      <div key={signal.id} className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">TheTheTrader</span>
                            <span className="text-xs text-gray-400">{signal.timestamp}</span>
                          </div>

                          <div className="bg-transparent rounded-lg p-4">
                            <div className="space-y-2">
                              <div className="bg-gray-600 rounded-lg p-3 inline-block">
                                <div className="flex items-center gap-2">
                                  <span className={signal.type === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                                    {signal.type === 'BUY' ? '📈' : '📉'}
                                  </span>
                                  <span className="font-semibold text-white text-base">
                                    Signal {signal.type} {signal.symbol}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="bg-gray-600 rounded-lg p-3 inline-block">
                                <div className="space-y-1 text-sm">
                                  {signal.entry !== 'N/A' && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-400">🔹</span>
                                      <span className="text-white">Entrée : {signal.entry}</span>
                                    </div>
                                  )}
                                  {signal.takeProfit !== 'N/A' && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-400">🔹</span>
                                      <span className="text-white">Take Profit : {signal.takeProfit}</span>
                                    </div>
                                  )}
                                  {signal.stopLoss !== 'N/A' && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-400">🔹</span>
                                      <span className="text-white">Stop Loss : {signal.stopLoss}</span>
                                    </div>
                                  )}
                                  {signal.description && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-yellow-400">📝</span>
                                      <span className="text-white">{signal.description}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {signal.image && (
                            <div className="mt-2">
                              <img 
                                src={URL.createObjectURL(signal.image)} 
                                alt="Signal screenshot"
                                className="max-w-2xl rounded-lg border border-gray-600"
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">🔥 0</button>
                            <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">💎 0</button>
                            <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">🚀 0</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : ['fondamentaux', 'letsgooo-model', 'general-chat', 'profit-loss'].includes(selectedChannel.id) ? (
                <div className="flex flex-col h-full">
                  {/* Messages de chat */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                    {(chatMessages[selectedChannel.id] || []).length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 text-sm">Aucun message pour le moment</div>
                        <div className="text-gray-500 text-xs mt-1">Commencez la conversation !</div>
                      </div>
                    ) : (
                      (chatMessages[selectedChannel.id] || []).map((message) => (
                        <div key={message.id} className="flex items-start gap-3">
                          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white">{message.author}</span>
                              <span className="text-xs text-gray-400">{message.timestamp}</span>
                            </div>
                            <div className="bg-gray-700 rounded-lg p-3 hover:shadow-lg hover:shadow-gray-900/50 transition-shadow duration-200">
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
                  <div className="border-t border-gray-700 p-4 fixed bottom-0 left-0 right-0 bg-gray-800 z-10 md:left-64">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">📋 Coller données TradingView</label>
                  <textarea
                    placeholder="Collez vos données ici : NQ1! 22950 23004 22896"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    rows={2}
                    value={pasteArea}
                    onChange={(e) => {
                      const text = e.target.value;
                      setPasteArea(text);
                      
                      // Si le texte contient des données, parser
                      if (text.length > 10) {
                        if (parseSignalData(text)) {
                          // Vider après succès
                          setTimeout(() => setPasteArea(''), 500);
                        }
                      }
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-1">Format: Symbole Prix_entrée Take_profit Stop_loss</p>
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
                