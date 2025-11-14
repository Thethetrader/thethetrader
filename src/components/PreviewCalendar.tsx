import React, { useState } from 'react';

const PreviewCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Données de démonstration pour l'aperçu - 90% win rate pour promotion
  const previewTrades = [
    { date: '2024-12-01', result: 'win', pnl: 250 },
    { date: '2024-12-02', result: 'win', pnl: 180 },
    { date: '2024-12-03', result: 'win', pnl: 320 },
    { date: '2024-12-04', result: 'win', pnl: 190 },
    { date: '2024-12-05', result: 'win', pnl: 280 },
    { date: '2024-12-06', result: 'win', pnl: 210 },
    { date: '2024-12-07', result: 'win', pnl: 350 },
    { date: '2024-12-08', result: 'win', pnl: 160 },
    { date: '2024-12-09', result: 'loss', pnl: -120 },
    { date: '2024-12-10', result: 'win', pnl: 290 },
    { date: '2024-12-11', result: 'win', pnl: 220 },
    { date: '2024-12-12', result: 'win', pnl: 180 },
    { date: '2024-12-13', result: 'win', pnl: 310 },
    { date: '2024-12-14', result: 'win', pnl: 240 },
    { date: '2024-12-15', result: 'win', pnl: 200 },
    { date: '2024-12-16', result: 'win', pnl: 270 },
    { date: '2024-12-17', result: 'win', pnl: 190 },
    { date: '2024-12-18', result: 'win', pnl: 330 },
    { date: '2024-12-19', result: 'win', pnl: 260 },
    { date: '2024-12-20', result: 'win', pnl: 170 },
    { date: '2024-12-21', result: 'win', pnl: 300 },
    { date: '2024-12-22', result: 'win', pnl: 230 },
    { date: '2024-12-23', result: 'loss', pnl: -90 },
    { date: '2024-12-24', result: 'win', pnl: 280 },
    { date: '2024-12-25', result: 'win', pnl: 210 },
    { date: '2024-12-26', result: 'win', pnl: 340 },
    { date: '2024-12-27', result: 'win', pnl: 250 },
    { date: '2024-12-28', result: 'win', pnl: 180 },
    { date: '2024-12-29', result: 'win', pnl: 290 },
    { date: '2024-12-30', result: 'win', pnl: 220 },
    { date: '2024-12-31', result: 'win', pnl: 360 }
  ];

  const getTradeForDate = (date: number) => {
    const dateStr = `2024-12-${date.toString().padStart(2, '0')}`;
    return previewTrades.find(trade => trade.date === dateStr);
  };

  const getDayStyle = (date: number) => {
    const trade = getTradeForDate(date);
    const baseStyle = "h-12 rounded flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity";
    
    if (!trade) {
      return `${baseStyle} bg-gray-700`;
    }
    
    switch (trade.result) {
      case 'win':
        return `${baseStyle} bg-green-500`;
      case 'be':
        return `${baseStyle} bg-yellow-500 text-black`;
      case 'loss':
        return `${baseStyle} bg-red-500`;
      default:
        return `${baseStyle} bg-gray-700`;
    }
  };

  const getDaysInMonth = () => {
    return Array.from({ length: 31 }, (_, i) => i + 1);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Trading Journal - Décembre 2024</h2>
        <div className="flex gap-2">
          <button className="text-gray-400 hover:text-white">‹</button>
          <button className="text-gray-400 hover:text-white">›</button>
        </div>
      </div>

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
        {getDaysInMonth().map((date) => (
          <div
            key={date}
            className={getDayStyle(date)}
          >
            {date}
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-6 text-sm mt-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-white">Win</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-white">BE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-white">Loss</span>
        </div>
      </div>
    </div>
  );
};

export default PreviewCalendar;
