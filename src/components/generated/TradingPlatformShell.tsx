import React, { useState } from 'react';

export default function TradingPlatformShell() {
  const [selectedChannel, setSelectedChannel] = useState({ id: 'crypto-signaux', name: 'crypto-signaux' });
  const [view, setView] = useState<'signals' | 'calendar'>('signals');

  return (
    <div className="h-screen w-full bg-gray-900 text-white overflow-hidden flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col">
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



        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* # SALONS */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                # SALONS
              </h3>
              <div className="space-y-1">
                <button 
                  onClick={() => setView('signals')}
                  className="w-full text-left px-3 py-2 rounded text-sm bg-gray-700 text-white flex items-center gap-2"
                >
                  # crypto-signaux
                </button>
                <button 
                  onClick={() => setView('signals')}
                  className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  # forex-signaux
                </button>
                <button 
                  onClick={() => setView('signals')}
                  className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  # futures-signaux
                </button>
              </div>
            </div>

            {/* EDUCATION */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                EDUCATION
              </h3>
              <div className="space-y-1">
                <button 
                  onClick={() => setView('signals')}
                  className="w-full text-left px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  # formation
                </button>
              </div>
            </div>

            {/* PERFORMANCE */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                PERFORMANCE
              </h3>
              <div className="space-y-1">
                <button 
                  onClick={() => setView('calendar')}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${view === 'calendar' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                >
                  📅 calendrier
                </button>
              </div>
            </div>

            {/* Statistiques */}
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
      </div>

      {/* Main Content */}
              <div className="flex-1 flex flex-col">
          <div className="h-16 bg-gray-700 border-b border-gray-600 flex items-center justify-between px-6">
            <span className="text-lg font-semibold">
              {view === 'calendar' ? '📅 Calendrier' : '#crypto-signaux'}
            </span>
            {view === 'signals' && (
              <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm">
                + Nouveau Signal
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {view === 'calendar' ? (
              // Vue Calendrier
              <div className="h-full bg-[#1a1d23] p-8">
                <div className="max-w-7xl mx-auto h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setView('signals')}
                        className="text-gray-400 hover:text-white"
                      >
                        ← Retour aux signaux
                      </button>
                      <h1 className="text-2xl font-bold">
                        Trading <span className="text-gray-500">Calendar</span>
                      </h1>
                    </div>
                  </div>

                  <div className="flex gap-8 h-full">
                    <div className="flex-1">
                      <div className="grid grid-cols-7 gap-4 mb-4">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-gray-400 font-medium py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-4">
                        {Array.from({ length: 35 }, (_, i) => {
                          const day = i - 6;
                          const isCurrentMonth = day > 0 && day <= 30;
                          const isToday = day === 12 && isCurrentMonth;
                          
                          // Performance simulée
                          const hasPerformance = day === 10 || day === 12 || day === 15 || day === 18;
                          let bgColor = 'bg-[#2a2d35]';
                          
                          if (hasPerformance && isCurrentMonth) {
                            if (day === 10 || day === 15) bgColor = 'bg-green-500';
                            else if (day === 12) bgColor = 'bg-yellow-500';
                            else bgColor = 'bg-red-500';
                          }
                          
                          let borderColor = 'border-transparent';
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
                              {hasPerformance && isCurrentMonth && (
                                <div className="mt-auto">
                                  <div className="text-white text-xs opacity-90">
                                    {day === 10 ? '85% followed' : 
                                     day === 12 ? '65% followed' : 
                                     day === 15 ? '92% followed' : '45% followed'}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-center gap-6 mt-8">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-gray-400 text-sm">Excellent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-gray-400 text-sm">Correct</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-gray-400 text-sm">Difficile</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-64 space-y-4">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-2 text-gray-400 text-sm mb-4">
                          <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                          <span>Weekly</span>
                        </div>
                      </div>

                      {[
                        { trades: 3, ratio: '2/3', wl: '2/1' },
                        { trades: 4, ratio: '3/4', wl: '1/1' },
                        { trades: 0, ratio: '0/0', wl: '0/0' },
                        { trades: 0, ratio: '0/0', wl: '0/0' }
                      ].map((week, index) => (
                        <div key={index} className={`rounded-lg p-4 ${week.trades > 0 ? 'bg-[#4a5568]' : 'bg-[#2a2d35]'}`}>
                          <div className="text-white font-medium mb-1">{week.trades} trades</div>
                          <div className="text-gray-400 text-sm mb-2">⚪ {week.ratio}</div>
                          <div className="text-gray-400 text-sm">W/L: {week.wl}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Vue Signaux
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* Signal Example */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">
                    T
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">TheTheTrader</span>
                      <span className="text-xs text-gray-400">02:06:33</span>
                    </div>
                  </div>
                </div>

                <div className="ml-11 space-y-3">
                  <div className="bg-gray-600 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✅</span>
                        <span className="font-semibold text-white">
                          Signal BUY BTCUSD Futures – 1 min
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">🔹</span>
                          <span className="text-white">Entrée : 103474.00 USD</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">🔹</span>
                          <span className="text-white">Take Profit : 104626.00 USD</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-400">🔹</span>
                          <span className="text-white">Stop Loss : 102862.00 USD</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-500">🎯</span>
                          <span className="text-white">Ratio R:R ≈ 1.88</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-500">
                      <p className="text-sm text-gray-300">💎 Analyse technique confirmée • Cassure de résistance</p>
                    </div>
                  </div>

                  {/* TradingView Chart */}
                  <div className="flex justify-center mt-4">
                    <div className="w-full max-w-2xl">
                      <img 
                        src="/images/tradingview-chart.png" 
                        alt="TradingView Chart"
                        className="rounded-lg object-cover w-full shadow-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-sm border border-green-400 text-green-400 rounded hover:bg-green-400/10">
                      Win
                    </button>
                    <button className="px-3 py-1 text-sm border border-yellow-400 text-yellow-400 rounded hover:bg-yellow-400/10">
                      BE
                    </button>
                    <button className="px-3 py-1 text-sm border border-red-400 text-red-400 rounded hover:bg-red-400/10">
                      Loss
                    </button>
                  </div>

                  {/* Reactions */}
                  <div className="flex items-center gap-2">
                    <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      🔥 12
                    </button>
                    <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      💎 8
                    </button>
                    <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      🚀 15
                    </button>
                  </div>
                </div>
              </div>

              {/* Second Signal */}
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">
                    T
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">TheTheTrader</span>
                      <span className="text-xs text-gray-400">02:06:33</span>
                    </div>
                  </div>
                </div>

                <div className="ml-11 space-y-3">
                  <p className="text-blue-400">Signal précédent: Objectif 1 atteint ! 🎯</p>
                  <p className="text-gray-300">+1.2% en 3 minutes - félicitations à tous les membres qui ont suivi 🔥</p>
                  
                  <div className="flex items-center gap-2">
                    <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      🔥 24
                    </button>
                    <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      💰 18
                    </button>
                    <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      🚀 12
                    </button>
                  </div>
                                 </div>
               </div>
               </div>
             )}
           </div>
         </div>
       </div>
     );
   }
