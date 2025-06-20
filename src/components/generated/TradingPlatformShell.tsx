"use client";
import { useState } from "react";

interface Signal {
  id: string;
  type: 'BUY' | 'SELL';
  pair: string;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  description: string;
  status: 'ACTIVE' | 'WIN' | 'LOSS' | 'BE';
  timestamp: string;
  channelId: string;
  images?: string[];
}

interface Message {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  channelId: string;
  images?: string[];
  reactions?: { [emoji: string]: number };
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  url: string;
}

export default function TradingPlatformShell() {
  const [selectedChannel, setSelectedChannel] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedChannel');
      return saved ? JSON.parse(saved) : {
        id: "forex",
        name: "forex-signaux",
        type: "forex"
      };
    }
    return {
      id: "forex",
      name: "forex-signaux",
      type: "forex"
    };
  });
  
  const [view, setView] = useState<'signals' | 'calendar'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentView');
      return saved ? JSON.parse(saved) : 'signals';
    }
    return 'signals';
  });
  const [signalsByChannel, setSignalsByChannel] = useState<{ [key: string]: Signal[] }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tradingSignals');
      return saved ? JSON.parse(saved) : {
        forex: [],
        crypto: [],
        futures: [],
        education: [],
        profitloss: []
      };
    }
    return {
      forex: [],
      crypto: [],
      futures: [],
      education: [],
      profitloss: []
    };
  });

  const [messagesByChannel, setMessagesByChannel] = useState<{ [key: string]: Message[] }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tradingMessages');
      return saved ? JSON.parse(saved) : {
        annonce: [],
        introduction: [],
        profitloss: [],
        generalchat: []
      };
    }
    return {
      annonce: [],
      introduction: [],
      profitloss: [],
      generalchat: []
    };
  });

  const [documents, setDocuments] = useState<Document[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tradingDocuments');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [signalImages, setSignalImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    type: 'BUY' as 'BUY' | 'SELL',
    pair: '',
    entry: '',
    takeProfit: '',
    stopLoss: '',
    description: ''
  });

  const currentSignals = signalsByChannel[selectedChannel.id] || [];
  const currentMessages = messagesByChannel[selectedChannel.id] || [];

  const channels = [
    { id: "annonce", name: "annonce", type: "annonce" },
    { id: "introduction", name: "introduction", type: "introduction" },
    { id: "forex", name: "forex-signaux", type: "forex" },
    { id: "crypto", name: "crypto-signaux", type: "crypto" },
    { id: "futures", name: "futures-signaux", type: "futures" },
    { id: "education", name: "one model for life", type: "education" },
    { id: "profitloss", name: "profit-loss", type: "profitloss" },
    { id: "generalchat", name: "general-chat", type: "generalchat" }
  ];

  const getSignalsForDay = (day: number) => {
    const today = new Date();
    const targetDate = new Date(today.getFullYear(), today.getMonth(), day);
    return currentSignals.filter(signal => {
      const signalDate = new Date(signal.timestamp);
      return signalDate.toDateString() === targetDate.toDateString();
    });
  };

  const getDayPerformance = (day: number) => {
    const daySignals = getSignalsForDay(day);
    const wins = daySignals.filter(s => s.status === 'WIN').length;
    const losses = daySignals.filter(s => s.status === 'LOSS').length;
    const active = daySignals.filter(s => s.status === 'ACTIVE').length;
    const total = daySignals.length;
    
    if (total === 0) return { color: '', total: 0, wins, losses, active };
    
    if (wins > losses) return { color: 'bg-green-500/30 border-green-500', total, wins, losses, active };
    if (losses > wins) return { color: 'bg-red-500/30 border-red-500', total, wins, losses, active };
    if (wins === losses && total > 0) return { color: 'bg-yellow-500/30 border-yellow-500', total, wins, losses, active };
    return { color: 'bg-blue-500/20 border-blue-500', total, wins, losses, active };
  };

  const getWinRate = () => {
    const signals = currentSignals.filter(s => s.status !== 'ACTIVE');
    if (signals.length === 0) return 0;
    const wins = signals.filter(s => s.status === 'WIN').length;
    return Math.round((wins / signals.length) * 100);
  };

  const addReaction = (messageId: string, emoji: string) => {
    const updatedMessages = {
      ...messagesByChannel,
      [selectedChannel.id]: (messagesByChannel[selectedChannel.id] || []).map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...msg.reactions };
          reactions[emoji] = (reactions[emoji] || 0) + 1;
          return { ...msg, reactions };
        }
        return msg;
      })
    };

    setMessagesByChannel(updatedMessages);
    localStorage.setItem('tradingMessages', JSON.stringify(updatedMessages));
  };

  const handleCreateMessage = () => {
    if (!newMessage.trim() && selectedImages.length === 0) return;

    const imageUrls = selectedImages.map(file => URL.createObjectURL(file));

    const message: Message = {
      id: `msg-${Date.now()}`,
      author: 'Trader Pro',
      content: newMessage,
      timestamp: new Date().toISOString(),
      channelId: selectedChannel.id,
      images: imageUrls.length > 0 ? imageUrls : undefined,
      reactions: {}
    };

    const updatedMessages = {
      ...messagesByChannel,
      [selectedChannel.id]: [...(messagesByChannel[selectedChannel.id] || []), message]
    };

    setMessagesByChannel(updatedMessages);
    localStorage.setItem('tradingMessages', JSON.stringify(updatedMessages));

    setNewMessage('');
    setSelectedImages([]);
    setMessageModalOpen(false);
  };

  const handleChannelSelect = (channel: any) => {
    setSelectedChannel(channel);
    localStorage.setItem('selectedChannel', JSON.stringify(channel));
    setView('signals');
    localStorage.setItem('currentView', JSON.stringify('signals'));
  };

  const handleCreateSignal = () => {
    if (!formData.pair || !formData.entry) return;

    const imageUrls = signalImages.map(file => URL.createObjectURL(file));

    const newSignal: Signal = {
      id: `signal-${Date.now()}`,
      type: formData.type,
      pair: formData.pair.toUpperCase(),
      entryPrice: parseFloat(formData.entry),
      takeProfit: parseFloat(formData.takeProfit),
      stopLoss: parseFloat(formData.stopLoss),
      description: formData.description,
      status: 'ACTIVE',
      timestamp: new Date().toISOString(),
      channelId: selectedChannel.id,
      images: imageUrls.length > 0 ? imageUrls : undefined
    };

    const updatedSignals = {
      ...signalsByChannel,
      [selectedChannel.id]: [...(signalsByChannel[selectedChannel.id] || []), newSignal]
    };

    setSignalsByChannel(updatedSignals);
    localStorage.setItem('tradingSignals', JSON.stringify(updatedSignals));

    setFormData({
      type: 'BUY',
      pair: '',
      entry: '',
      takeProfit: '',
      stopLoss: '',
      description: ''
    });
    setSignalImages([]);
    setModalOpen(false);
  };

  const updateSignalStatus = (signalId: string, newStatus: 'WIN' | 'LOSS' | 'BE') => {
    const updatedSignals = {
      ...signalsByChannel,
      [selectedChannel.id]: signalsByChannel[selectedChannel.id].map(signal => {
        if (signal.id === signalId) {
          if (signal.status === newStatus) {
            return { ...signal, status: 'ACTIVE' as const };
          }
          return { ...signal, status: newStatus };
        }
        return signal;
      })
    };

    setSignalsByChannel(updatedSignals);
    localStorage.setItem('tradingSignals', JSON.stringify(updatedSignals));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newDocuments: Document[] = [];

    Array.from(files).forEach(file => {
      const newDocument: Document = {
        id: `doc-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date().toISOString(),
        url: URL.createObjectURL(file)
      };

      newDocuments.push(newDocument);
    });

    const updatedDocuments = [...documents, ...newDocuments];
    setDocuments(updatedDocuments);
    localStorage.setItem('tradingDocuments', JSON.stringify(updatedDocuments));

    setUploadModalOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('text') || type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📋';
    return '📁';
  };

  return (
    <div className="h-screen w-full bg-gray-900 text-white overflow-hidden flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col">
        {/* User Profile */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
              TR
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Trader Pro</p>
              <p className="text-xs text-gray-400">En ligne</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => {
              setView('signals');
              localStorage.setItem('currentView', JSON.stringify('signals'));
            }}
            className={`flex-1 p-2 text-sm ${view === 'signals' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
          >
            # Salons
          </button>
          <button
            onClick={() => {
              setView('calendar');
              localStorage.setItem('currentView', JSON.stringify('calendar'));
            }}
            className={`flex-1 p-2 text-sm ${view === 'calendar' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
          >
            📅 Calendrier
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {view === 'signals' ? (
            <div className="p-4 space-y-4">
              {/* Salon Principale */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Salon Principale
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleChannelSelect(channels[0])}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                      selectedChannel.id === 'annonce'
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    📢 annonce
                    <span className="ml-auto text-xs bg-gray-600 px-1 rounded">
                      {(messagesByChannel['annonce'] || []).length}
                    </span>
                  </button>
                  <button
                    onClick={() => handleChannelSelect(channels[1])}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                      selectedChannel.id === 'introduction'
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    📋 introduction
                    <span className="ml-auto text-xs bg-gray-600 px-1 rounded">
                      {(messagesByChannel['introduction'] || []).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Education Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Éducation
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleChannelSelect(channels[5])}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                      selectedChannel.id === 'education'
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    📚 one model for life
                    <span className="ml-auto text-xs bg-gray-600 px-1 rounded">
                      {documents.length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Trading Channels */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Trading Channels
                </h3>
                <div className="space-y-1">
                  {channels.slice(2, 5).map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelSelect(channel)}
                      className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                        selectedChannel.id === channel.id
                          ? "bg-gray-700 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      # {channel.name}
                      <span className="ml-auto text-xs bg-gray-600 px-1 rounded">
                        {(signalsByChannel[channel.id] || []).filter(s => s.status === 'ACTIVE').length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* General Chat Section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  General Chat
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleChannelSelect(channels[6])}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                      selectedChannel.id === 'profitloss'
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    🔑 profit-loss
                    <span className="ml-auto text-xs bg-gray-600 px-1 rounded">
                      {(messagesByChannel['profitloss'] || []).length}
                    </span>
                  </button>
                  <button
                    onClick={() => handleChannelSelect(channels[7])}
                    className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 ${
                      selectedChannel.id === 'generalchat'
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    💬 general-chat
                    <span className="ml-auto text-xs bg-gray-600 px-1 rounded">
                      {(messagesByChannel['generalchat'] || []).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Statistics */}
              <div className="bg-gray-700 rounded-lg p-3">
                <h4 className="text-sm font-medium mb-2">Statistiques</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="text-green-400">{getWinRate()}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Signaux actifs:</span>
                    <span>{currentSignals.filter(s => s.status === 'ACTIVE').length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total:</span>
                    <span>{currentSignals.length}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Calendrier simple
            <div className="p-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-center">Juin 2025</h3>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-400 p-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
                    const performance = getDayPerformance(day);
                    const isToday = day === 12;

                    return (
                      <div
                        key={day}
                        className={`aspect-square flex flex-col items-center justify-center text-xs rounded cursor-pointer border transition-all ${
                          isToday ? 'border-blue-400 bg-blue-500/20' : 
                          performance.total > 0 ? performance.color : 'border-transparent hover:bg-gray-600'
                        }`}
                      >
                        <span className="font-medium">{day}</span>
                        {performance.total > 0 && (
                          <>
                            <div className="flex gap-1 mt-1">
                              {performance.wins > 0 && <div className="w-1 h-1 bg-green-400 rounded-full"></div>}
                              {performance.losses > 0 && <div className="w-1 h-1 bg-red-400 rounded-full"></div>}
                              {performance.active > 0 && <div className="w-1 h-1 bg-blue-400 rounded-full"></div>}
                            </div>
                            <span className="text-xs text-gray-300">{performance.total}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">{currentSignals.length}</div>
                      <div className="text-xs text-gray-400">Signaux</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">{getWinRate()}%</div>
                      <div className="text-xs text-gray-400">Win Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 bg-gray-700 border-b border-gray-600 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">
              {selectedChannel.id === 'education' ? '📚' : 
               selectedChannel.id === 'profitloss' ? '🔑' : 
               selectedChannel.id === 'generalchat' ? '💬' : 
               selectedChannel.id === 'introduction' ? '📋' : 
               selectedChannel.id === 'annonce' ? '📢' : '#'}{selectedChannel.name}
            </span>
            {selectedChannel.id !== 'education' && (
              <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                Win Rate: {getWinRate()}%
              </span>
            )}
          </div>
          
          {view === 'signals' && selectedChannel.id !== 'education' && selectedChannel.id !== 'profitloss' && selectedChannel.id !== 'generalchat' && selectedChannel.id !== 'introduction' && selectedChannel.id !== 'annonce' && (
            <button 
              onClick={() => setModalOpen(true)} 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
            >
              + Nouveau Signal
            </button>
          )}

          {view === 'signals' && selectedChannel.id === 'education' && (
            <button 
              onClick={() => setUploadModalOpen(true)} 
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
            >
              📎 Importer Document
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {view === 'calendar' ? (
            // Calendrier style tradingsimplifiedjournal
            <div className="h-full bg-[#1a1d23] p-8">
              <div className="max-w-7xl mx-auto h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        setView('signals');
                        localStorage.setItem('currentView', JSON.stringify('signals'));
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      ← Retour aux signaux
                    </button>
                    <h1 className="text-2xl font-bold">
                      Trading <span className="text-gray-500">Calendar</span>
                    </h1>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button className="text-gray-400 hover:text-white">
                        <span className="text-lg">←</span>
                      </button>
                      <span className="text-white font-medium min-w-[100px] text-center">juin 2025</span>
                      <button className="text-gray-400 hover:text-white">
                        <span className="text-lg">→</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-8 h-full">
                  {/* Calendrier principal */}
                  <div className="flex-1">
                    {/* Jours de la semaine */}
                    <div className="grid grid-cols-7 gap-4 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-gray-400 font-medium py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Grille calendrier */}
                    <div className="grid grid-cols-7 gap-4">
                      {Array.from({ length: 35 }, (_, i) => {
                        const day = i - 6;
                        const isCurrentMonth = day > 0 && day <= 30;
                        const performance = isCurrentMonth ? getDayPerformance(day) : { color: '', total: 0, wins: 0, losses: 0, active: 0 };
                        const isToday = day === 12 && isCurrentMonth;
                        
                        let bgColor = 'bg-[#2a2d35]';
                        let borderColor = 'border-transparent';
                        
                        if (performance.total > 0 && isCurrentMonth) {
                          const winRate = (performance.wins / (performance.wins + performance.losses)) * 100;
                          if (winRate >= 70) {
                            bgColor = 'bg-green-500';
                            borderColor = 'border-green-500';
                          } else if (winRate >= 50) {
                            bgColor = 'bg-yellow-500';
                            borderColor = 'border-yellow-500';
                          } else if (winRate > 0) {
                            bgColor = 'bg-red-500';
                            borderColor = 'border-red-500';
                          }
                        }
                        
                        if (isToday) {
                          borderColor = 'border-blue-400';
                        }

                        return (
                          <div
                            key={i}
                            className={`aspect-square rounded-lg ${bgColor} ${borderColor} border-2 p-3 cursor-pointer hover:opacity-80 transition-all flex flex-col ${
                              !isCurrentMonth ? 'opacity-30' : ''
                            }`}
                          >
                            <div className="text-white font-medium text-lg">
                              {isCurrentMonth ? day : ''}
                            </div>
                            {performance.total > 0 && isCurrentMonth && (
                              <div className="mt-auto">
                                <div className="text-white text-xs opacity-90">
                                  {Math.round((performance.wins / (performance.wins + performance.losses)) * 100) || 0}% followed
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Légende */}
                    <div className="flex items-center justify-center gap-6 mt-8">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-400 text-sm">≥70% Plan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-gray-400 text-sm">50-69% Plan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-gray-400 text-sm">&lt;50% Plan</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-[#2a2d35] rounded-full"></div>
                        <span className="text-gray-400 text-sm">No Trades</span>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar droite avec stats */}
                  <div className="w-64 space-y-4">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2 text-gray-400 text-sm mb-4">
                        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                        <span>Weekly</span>
                      </div>
                    </div>

                    {[
                      { trades: 3, ratio: '2/3', plan: 67, wl: '2/1' },
                      { trades: 4, ratio: '3/4', plan: 75, wl: '1/1' },
                      { trades: 0, ratio: '0/0', plan: 0, wl: '0/0' },
                      { trades: 0, ratio: '0/0', plan: 0, wl: '0/0' }
                    ].map((week, index) => (
                      <div key={index} className={`rounded-lg p-4 ${week.trades > 0 ? 'bg-[#4a5568]' : 'bg-[#2a2d35]'}`}>
                        <div className="text-white font-medium mb-1">{week.trades} trades</div>
                        <div className="text-gray-400 text-sm mb-2">⚪ {week.ratio}</div>
                        <div className="text-white font-medium mb-1">{week.plan}% plan</div>
                        <div className="text-gray-400 text-sm">W/L: {week.wl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (selectedChannel.id === 'profitloss' || selectedChannel.id === 'generalchat' || selectedChannel.id === 'introduction' || selectedChannel.id === 'annonce') ? (
            // Section Profit Loss Chat
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6">
                {currentMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="bg-gray-700 rounded-full p-6 mb-4">
                      <span className="text-4xl">💬</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      Bienvenue dans {selectedChannel.id === 'profitloss' ? '🔑 profit-loss' : 
                                    selectedChannel.id === 'generalchat' ? '💬 general-chat' :
                                    selectedChannel.id === 'introduction' ? '📋 introduction' :
                                    '📢 annonce'} !
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md">
                      {selectedChannel.id === 'profitloss' 
                        ? 'Partagez vos analyses P&L, vos résultats et discutez avec la communauté !'
                        : selectedChannel.id === 'generalchat'
                        ? 'Salon de discussion générale pour échanger sur tous les sujets !'
                        : selectedChannel.id === 'introduction'
                        ? 'Salon principal pour les présentations et annonces importantes !'
                        : 'Consultez les annonces officielles et réagissez avec des emojis !'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {currentMessages.map((message) => (
                      <div key={message.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="h-8 w-8 bg-purple-500 rounded-full flex items-center justify-center text-sm">
                            {message.author.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{message.author}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-11">
                          {message.content && (
                            <p className="text-gray-200 mb-3">{message.content}</p>
                          )}
                          
                          {message.images && message.images.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {message.images.map((img, index) => (
                                <img 
                                  key={index}
                                  src={img} 
                                  alt="Upload"
                                  className="rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-80"
                                  onClick={() => window.open(img, '_blank')}
                                />
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">
                            {message.reactions && Object.entries(message.reactions).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(message.id, emoji)}
                                className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                              >
                                {emoji} {count}
                              </button>
                            ))}
                            
                            <div className="flex gap-1">
                              {['👍', '❤️', '😂', '🔥', '💯'].map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => addReaction(message.id, emoji)}
                                  className="hover:bg-gray-600 p-1 rounded text-sm opacity-60 hover:opacity-100"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Barre de message fixe en bas */}
              {selectedChannel.id !== 'annonce' && (
                <div className="border-t border-gray-600 p-4 bg-gray-800">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <textarea
                          placeholder={`Écrivez votre message dans ${selectedChannel.id === 'profitloss' ? '#profit-loss' : 
                                       selectedChannel.id === 'generalchat' ? '#general-chat' : 
                                       selectedChannel.id === 'introduction' ? '#introduction' : '#annonce'}...`}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (newMessage.trim() || selectedImages.length > 0) {
                                handleCreateMessage();
                              }
                            }
                          }}
                          className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 resize-none min-h-[44px] max-h-32"
                          rows={1}
                        />
                        {selectedImages.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedImages.map((file, index) => (
                              <div key={index} className="bg-gray-600 px-2 py-1 rounded text-sm flex items-center gap-2">
                                🖼️ {file.name.slice(0, 20)}...
                                <button
                                  onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              setSelectedImages(prev => [...prev, ...Array.from(e.target.files!)]);
                            }
                          }}
                          className="hidden"
                          id="chat-file-upload"
                        />
                        <label 
                          htmlFor="chat-file-upload"
                          className="bg-gray-600 hover:bg-gray-500 p-2 rounded-lg cursor-pointer transition-colors"
                          title="Ajouter des images"
                        >
                          📎
                        </label>
                        
                        <button
                          onClick={() => {
                            if (newMessage.trim() || selectedImages.length > 0) {
                              handleCreateMessage();
                            }
                          }}
                          disabled={!newMessage.trim() && selectedImages.length === 0}
                          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
                          title="Envoyer (Entrée)"
                        >
                          ➤
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Message pour salon annonce */}
              {selectedChannel.id === 'annonce' && (
                <div className="border-t border-gray-600 p-4 bg-gray-800">
                  <div className="max-w-4xl mx-auto text-center">
                    <p className="text-gray-400 text-sm">
                      📢 Seul l'administrateur peut publier des annonces. Vous pouvez réagir avec des emojis aux messages.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : selectedChannel.id === 'education' ? (
            // Section Education
            <>
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="bg-gray-700 rounded-full p-6 mb-4">
                    <span className="text-4xl">📚</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Centre d'Éducation Trading
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    Importez vos documents éducatifs : PDFs, vidéos, guides, analyses pour améliorer vos compétences !
                  </p>
                  <button 
                    onClick={() => setUploadModalOpen(true)} 
                    className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded"
                  >
                    📎 Importer le premier document
                  </button>
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-6">
                  <div className="space-y-4 max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6">📚 Documents Éducatifs ({documents.length})</h2>
                    
                    {documents.map((doc) => (
                      <div key={doc.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl">{getFileIcon(doc.type)}</div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{doc.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                              <span>Taille: {formatFileSize(doc.size)}</span>
                              <span>•</span>
                              <span>Importé: {new Date(doc.uploadDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => window.open(doc.url, '_blank')}
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                              >
                                👀 Ouvrir
                              </button>
                              <button 
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = doc.url;
                                  link.download = doc.name;
                                  link.click();
                                }}
                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                              >
                                ⬇️ Télécharger
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Feed de signaux
            <>
              {currentSignals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="bg-gray-700 rounded-full p-6 mb-4">
                    <span className="text-4xl">📈</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Bienvenue dans #{selectedChannel.name} !
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md">
                    Aucun signal pour le moment. Créez votre premier signal pour commencer à trader !
                  </p>
                  <button 
                    onClick={() => setModalOpen(true)} 
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded"
                  >
                    Créer le premier signal
                  </button>
                </div>
              ) : (
                <div className="h-full overflow-y-auto p-6">
                  <div className="space-y-4 max-w-4xl mx-auto">
                    {currentSignals.map((signal) => (
                      <div key={signal.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">
                            TR
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">Trader Pro</span>
                              <span className="text-xs text-gray-400">
                                {new Date(signal.timestamp).toLocaleTimeString()}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                signal.status === 'WIN' ? 'bg-green-600' : 
                                signal.status === 'LOSS' ? 'bg-red-600' : 
                                signal.status === 'BE' ? 'bg-yellow-600' : 'bg-gray-600'
                              }`}>
                                {signal.status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="ml-11 space-y-3">
                          <div className="bg-gray-600 rounded-lg p-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className={`${signal.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                                  {signal.type === 'BUY' ? '✅' : '❌'}
                                </span>
                                <span className="font-semibold text-white">
                                  Signal {signal.type} {signal.pair} Futures – 1 min
                                </span>
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span className="text-white">Entrée : {signal.entryPrice.toFixed(2)} USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span className="text-white">Stop Loss : {signal.stopLoss.toFixed(2)} USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span className="text-white">Take Profit : {signal.takeProfit.toFixed(2)} USD</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-500">🎯</span>
                                  <span className="text-white">
                                    Ratio R:R ≈ {((Math.abs(signal.takeProfit - signal.entryPrice)) / (Math.abs(signal.entryPrice - signal.stopLoss))).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {signal.description && (
                              <div className="mt-3 pt-3 border-t border-gray-500">
                                <p className="text-sm text-gray-300">{signal.description}</p>
                              </div>
                            )}
                          </div>

                          {signal.images && signal.images.length > 0 && (
                            <div className="flex justify-center mt-4">
                              <div className={`${signal.images.length === 1 ? 'w-full max-w-2xl' : 'grid grid-cols-2 gap-3 w-full max-w-xl'}`}>
                                {signal.images.map((img, index) => (
                                  <img 
                                    key={index}
                                    src={img} 
                                    alt="Signal"
                                    className={`rounded-lg object-cover cursor-pointer hover:opacity-80 shadow-lg ${
                                      signal.images!.length === 1 ? 'max-h-80 w-full' : 'max-h-56'
                                    }`}
                                    onClick={() => window.open(img, '_blank')}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {signal.status === 'ACTIVE' && (
                              <>
                                <button
                                  onClick={() => updateSignalStatus(signal.id, 'WIN')}
                                  className="px-3 py-1 text-sm border border-green-400 text-green-400 rounded hover:bg-green-400/10"
                                >
                                  Win
                                </button>
                                <button
                                  onClick={() => updateSignalStatus(signal.id, 'BE')}
                                  className="px-3 py-1 text-sm border border-yellow-400 text-yellow-400 rounded hover:bg-yellow-400/10"
                                >
                                  BE
                                </button>
                                <button
                                  onClick={() => updateSignalStatus(signal.id, 'LOSS')}
                                  className="px-3 py-1 text-sm border border-red-400 text-red-400 rounded hover:bg-red-400/10"
                                >
                                  Loss
                                </button>
                              </>
                            )}
                            
                            {signal.status !== 'ACTIVE' && (
                              <button
                                onClick={() => {
                                  const updatedSignals = {
                                    ...signalsByChannel,
                                    [selectedChannel.id]: signalsByChannel[selectedChannel.id].map(s => 
                                      s.id === signal.id ? { ...s, status: 'ACTIVE' as const } : s
                                    )
                                  };
                                  setSignalsByChannel(updatedSignals);
                                  localStorage.setItem('tradingSignals', JSON.stringify(updatedSignals));
                                }}
                                className="px-3 py-1 text-sm border border-blue-400 text-blue-400 rounded hover:bg-blue-400/10"
                              >
                                Réactiver
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal Message */}
      {messageModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">💬 Nouveau Message</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Message</label>
                <textarea
                  placeholder="Écrivez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Images (optionnel)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedImages(Array.from(e.target.files));
                    }
                  }}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                />
                {selectedImages.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">{selectedImages.length} image(s) sélectionnée(s)</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={handleCreateMessage} 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 p-2 rounded"
                >
                  Envoyer le message
                </button>
                <button 
                  onClick={() => {
                    setMessageModalOpen(false);
                    setNewMessage('');
                    setSelectedImages([]);
                  }}
                  className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Signal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Créer un nouveau signal</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type de signal</label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'BUY' | 'SELL'})}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Paire</label>
                <input
                  type="text"
                  placeholder="Ex: EURUSD, BTCUSD"
                  value={formData.pair}
                  onChange={(e) => setFormData({...formData, pair: e.target.value})}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Entry</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={formData.entry}
                    onChange={(e) => setFormData({...formData, entry: e.target.value})}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Take Profit</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={formData.takeProfit}
                    onChange={(e) => setFormData({...formData, takeProfit: e.target.value})}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stop Loss</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={formData.stopLoss}
                    onChange={(e) => setFormData({...formData, stopLoss: e.target.value})}
                    className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description (optionnel)</label>
                <textarea
                  placeholder="Analyse, raisons du trade..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Images (max 2, optionnel)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      const files = Array.from(e.target.files).slice(0, 2);
                      setSignalImages(files);
                    }
                  }}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                />
                {signalImages.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {signalImages.map((file, index) => (
                      <div key={index} className="bg-gray-600 px-2 py-1 rounded text-sm flex items-center gap-2">
                        🖼️ {file.name.slice(0, 15)}...
                        <button
                          onClick={() => setSignalImages(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={handleCreateSignal} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 p-2 rounded"
                >
                  Publier le signal
                </button>
                <button 
                  onClick={() => {
                    setModalOpen(false);
                    setSignalImages([]);
                  }}
                  className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload Document */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">📎 Importer des Documents</h2>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">📁</div>
                <p className="text-gray-400 mb-4">
                  Glissez vos fichiers ici ou cliquez pour sélectionner
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label 
                  htmlFor="file-upload"
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded cursor-pointer inline-block"
                >
                  Choisir des fichiers
                </label>
              </div>

              <div className="text-xs text-gray-400">
                <p className="mb-2">Formats supportés :</p>
                <div className="grid grid-cols-2 gap-1">
                  <span>📄 PDF, DOC, DOCX</span>
                  <span>📊 XLS, XLSX</span>
                  <span>📋 PPT, PPTX</span>
                  <span>🖼️ JPG, PNG, GIF</span>
                  <span>🎥 MP4, MOV, AVI</span>
                  <span>📝 TXT</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 rounded hover:bg-gray-700"
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
                