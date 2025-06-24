import React, { useState } from 'react';

export default function TradingPlatformShell() {
  const [selectedChannel, setSelectedChannel] = useState({ id: 'crypto-signaux', name: 'crypto-signaux' });
  const [view, setView] = useState<'signals' | 'calendar'>('signals');
  const [mobileView, setMobileView] = useState<'channels' | 'content'>('channels');

  const channels = [
    { id: 'crypto-signaux', name: 'crypto-signaux', emoji: '🪙', fullName: 'Crypto Signaux' },
    { id: 'forex-signaux', name: 'forex-signaux', emoji: '💱', fullName: 'Forex Signaux' },
    { id: 'futures-signaux', name: 'futures-signaux', emoji: '📈', fullName: 'Futures Signaux' },
    { id: 'formation', name: 'formation', emoji: '🎓', fullName: 'Formation' },
    { id: 'calendrier', name: 'calendrier', emoji: '📅', fullName: 'Trading Calendar' }
  ];

  const handleMobileChannelSelect = (channelId: string) => {
    if (channelId === 'calendrier') {
      setView('calendar');
    } else {
      setSelectedChannel({id: channelId, name: channelId});
      setView('signals');
    }
    setMobileView('content');
  };

  const getMobileChannelsList = () => (
    <div className="h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-600">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-lg font-bold">
            TT
          </div>
          <div>
            <h1 className="text-lg font-semibold">TheTheTrader</h1>
            <p className="text-sm text-gray-400">Trading Discord</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="p-4 bg-gray-800 border-b border-gray-600">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400 text-sm">🔍</span>
          </div>
          <input 
            type="text" 
            placeholder="Rechercher" 
            className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Channels list */}
      <div className="flex-1 overflow-y-auto">
        {/* Salons textuels section */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Salons textuels</span>
          </div>
          
          <div className="space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleMobileChannelSelect(channel.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <span className="text-xl">{channel.emoji}</span>
                <span className="text-gray-300 font-medium">#{channel.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Performance section */}
        <div className="p-4 border-t border-gray-700">
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-300">Performance</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Win Rate:</span>
                <span className="text-green-400 font-medium">78%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Signaux actifs:</span>
                <span className="text-blue-400 font-medium">3</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">P&L Mensuel:</span>
                <span className="text-green-400 font-medium">+$15,480</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
          <h3 className="text-lg font-bold text-white mb-6">Monthly Summary</h3>
          
          {/* Métriques principales */}
          <div className="space-y-4 mb-8">
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="text-sm text-gray-400 mb-1">Total P&L</div>
              <div className="text-2xl font-bold text-green-300">+$15,480</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                <div className="text-lg font-bold text-blue-400">73.8%</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Total Trades</div>
                <div className="text-lg font-bold text-white">89</div>
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
    <div className="h-screen w-full bg-gray-900 text-white overflow-hidden flex">
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
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"># SALONS</h3>
            <div className="space-y-1">
              <button onClick={() => {setSelectedChannel({id: 'crypto-signaux', name: 'crypto-signaux'}); setView('signals');}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'crypto-signaux' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}># crypto-signaux</button>
              <button onClick={() => {setSelectedChannel({id: 'forex-signaux', name: 'forex-signaux'}); setView('signals');}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'forex-signaux' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}># forex-signaux</button>
              <button onClick={() => {setSelectedChannel({id: 'futures-signaux', name: 'futures-signaux'}); setView('signals');}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'futures-signaux' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}># futures-signaux</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">EDUCATION</h3>
            <div className="space-y-1">
              <button onClick={() => {setSelectedChannel({id: 'formation', name: 'formation'}); setView('signals');}} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedChannel.id === 'formation' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}># formation</button>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">PERFORMANCE</h3>
            <div className="space-y-1">
              <button onClick={() => setView('calendar')} className={`w-full text-left px-3 py-2 rounded text-sm ${view === 'calendar' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>📅 calendrier</button>
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
        {/* Top Bar - Desktop */}
        <div className="hidden md:flex h-16 bg-gray-700 border-b border-gray-600 items-center justify-between px-6">
          <span className="text-lg font-semibold">{view === 'calendar' ? '📅 Calendrier' : `#${selectedChannel.name}`}</span>
          {view === 'signals' && <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm">+ Signal</button>}
        </div>

        {/* Top Bar - Mobile */}
        <div className="md:hidden h-16 bg-gray-700 border-b border-gray-600 flex items-center justify-between px-4">
          {mobileView === 'content' ? (
            <>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setMobileView('channels')}
                  className="p-2 hover:bg-gray-600 rounded-lg"
                >
                  <span className="text-white text-lg">←</span>
                </button>
                <span className="text-lg font-semibold">{view === 'calendar' ? '📅 calendrier' : `#${selectedChannel.name}`}</span>
              </div>
              {view === 'signals' && (
                <button className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm">+ Signal</button>
              )}
            </>
          ) : (
            <span className="text-lg font-semibold">TheTheTrader</span>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile: Show channels list or content based on mobileView */}
          <div className="md:hidden h-full">
            {mobileView === 'channels' ? (
              getMobileChannelsList()
            ) : (
              <div className="h-full">
                {view === 'calendar' ? (
                  getTradingCalendar()
                ) : (
                  <div className="p-4 space-y-4 w-full">
                    <div className="bg-gray-700 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-green-400 text-xl font-bold">78%</div>
                          <div className="text-gray-400 text-sm">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-400 text-xl font-bold">3</div>
                          <div className="text-gray-400 text-sm">Signaux actifs</div>
                        </div>
                      </div>
                    </div>

                    {/* Messages de discussion */}
                    <div className="space-y-4">
                      {/* Signal de trading classique */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-white">TheTheTrader</span>
                            <span className="text-xs text-gray-400">02:06:33</span>
                          </div>

                          <div className="bg-transparent rounded-lg p-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-green-400">✅</span>
                                <span className="font-semibold text-white text-sm">Signal BUY {selectedChannel.id === 'crypto-signaux' ? 'BTCUSD' : selectedChannel.id === 'forex-signaux' ? 'EURUSD' : 'ES'} - 1 min</span>
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span className="text-white">Entrée : {selectedChannel.id === 'crypto-signaux' ? '103474.00 USD' : selectedChannel.id === 'forex-signaux' ? '1.0845 EUR' : '4521.75'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span className="text-white">Take Profit : {selectedChannel.id === 'crypto-signaux' ? '104626.00 USD' : selectedChannel.id === 'forex-signaux' ? '1.0895 EUR' : '4565.25'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-400">🔹</span>
                                  <span className="text-white">Stop Loss : {selectedChannel.id === 'crypto-signaux' ? '102862.00 USD' : selectedChannel.id === 'forex-signaux' ? '1.0820 EUR' : '4485.75'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-red-500">🎯</span>
                                  <span className="text-white">Ratio R:R ≈ 2.00</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">🔥 12</button>
                            <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">💎 8</button>
                            <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">🚀 15</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop: Show content directly */}
          <div className="hidden md:block h-full">
            {view === 'calendar' ? (
              getTradingCalendar()
            ) : (
              <div className="p-4 md:p-6 space-y-4 w-full">
                <div className="hidden md:block bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-green-400 text-xl font-bold">78%</div>
                      <div className="text-gray-400 text-sm">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-blue-400 text-xl font-bold">3</div>
                      <div className="text-gray-400 text-sm">Signaux actifs</div>
                    </div>
                  </div>
                </div>

                {/* Messages de discussion */}
                <div className="space-y-4">
                  {/* Signal de trading classique */}
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-white">TheTheTrader</span>
                        <span className="text-xs text-gray-400">02:06:33</span>
                      </div>

                      <div className="bg-transparent md:bg-gray-600 rounded-lg p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-green-400">✅</span>
                            <span className="font-semibold text-white text-sm md:text-base">Signal BUY {selectedChannel.id === 'crypto-signaux' ? 'BTCUSD' : selectedChannel.id === 'forex-signaux' ? 'EURUSD' : 'ES'} - 1 min</span>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400">🔹</span>
                              <span className="text-white">Entrée : {selectedChannel.id === 'crypto-signaux' ? '103474.00 USD' : selectedChannel.id === 'forex-signaux' ? '1.0845 EUR' : '4521.75'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400">🔹</span>
                              <span className="text-white">Take Profit : {selectedChannel.id === 'crypto-signaux' ? '104626.00 USD' : selectedChannel.id === 'forex-signaux' ? '1.0895 EUR' : '4565.25'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400">🔹</span>
                              <span className="text-white">Stop Loss : {selectedChannel.id === 'crypto-signaux' ? '102862.00 USD' : selectedChannel.id === 'forex-signaux' ? '1.0820 EUR' : '4485.75'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-red-500">🎯</span>
                              <span className="text-white">Ratio R:R ≈ 2.00</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">🔥 12</button>
                        <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">💎 8</button>
                        <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">🚀 15</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
                