import React, { useState } from 'react';

export default function TradingPlatformShell() {
  const [selectedChannel, setSelectedChannel] = useState({ id: 'crypto-signaux', name: 'crypto-signaux' });
  const [view, setView] = useState<'signals' | 'calendar'>('signals');

  const channels = [
    { id: 'crypto-signaux', name: '🪙 Crypto', emoji: '🪙' },
    { id: 'forex-signaux', name: '💱 Forex', emoji: '💱' },
    { id: 'futures-signaux', name: '📈 Futures', emoji: '📈' },
    { id: 'formation', name: '🎓 Formation', emoji: '🎓' },
    { id: 'calendrier', name: '📅 Stats', emoji: '📅' }
  ];

  return (
    <div className="h-screen w-full bg-gray-900 text-white overflow-hidden flex">
      <div className="hidden md:flex w-64 bg-gray-800 flex-col">
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

      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-gray-700 border-b border-gray-600 flex items-center justify-between px-4 md:px-6">
          <span className="text-lg font-semibold hidden md:block">{view === 'calendar' ? '📅 Calendrier' : `#${selectedChannel.name}`}</span>
          <span className="text-sm font-semibold md:hidden">TheTheTrader</span>
          {view === 'signals' && <button className="bg-blue-600 hover:bg-blue-700 px-3 py-2 md:px-4 rounded text-xs md:text-sm">+ Signal</button>}
        </div>

        <div className="md:hidden bg-gray-800 border-b border-gray-600 overflow-x-auto">
          <div className="flex space-x-3 p-4 min-w-max">
            {channels.map((channel) => (
              <button key={channel.id} onClick={() => { if (channel.id === 'calendrier') { setView('calendar'); } else { setSelectedChannel({id: channel.id, name: channel.id}); setView('signals'); } }} className={`px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap min-w-fit ${ (channel.id === 'calendrier' && view === 'calendar') || (channel.id === selectedChannel.id && view === 'signals') ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600' }`}>{channel.name}</button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {view === 'calendar' ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">📅 Calendrier de Performance</h2>
              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-300">Vue calendrier en développement...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="md:hidden bg-gray-700 rounded-lg p-4 mb-4">
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

              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-sm">T</div>
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

                  <div className="flex items-center gap-2 flex-wrap">
                    <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">🔥 12</button>
                    <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">💎 8</button>
                    <button className="bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded-full text-sm flex items-center gap-1">🚀 15</button>
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