import React, { useState } from 'react';

const TradingCalendar = () => {
  // Calendar data exactly matching the image
  const calendarDays = [
    // Week 1: J(1) V(2) S(3) D(4)
    { date: 1, status: 'win' },
    { date: 2, status: 'win' },
    { date: 3, status: 'loss' },
    { date: 4, status: 'win' },
    
    // Week 2: L(5) M(6) M(7) J(8) V(9) S(10) D(11)
    { date: 5, status: 'be' },
    { date: 6, status: 'win' },
    { date: 7, status: 'win' },
    { date: 8, status: 'win' },
    { date: 9, status: 'loss' },
    { date: 10, status: 'win' },
    { date: 11, status: 'win' },
    
    // Week 3: L(12) M(13) M(14) J(15) V(16) S(17) D(18)
    { date: 12, status: 'be' },
    { date: 13, status: 'win' },
    { date: 14, status: 'win' },
    { date: 15, status: 'win' },
    { date: 16, status: 'loss' },
    { date: 17, status: 'win' },
    { date: 18, status: 'win' },
    
    // Week 4: L(19) M(20) M(21) J(22) V(23) S(24) D(25)
    { date: 19, status: 'win' },
    { date: 20, status: 'be' },
    { date: 21, status: 'win' },
    { date: 22, status: 'win' },
    { date: 23, status: 'loss' },
    { date: 24, status: 'win' },
    { date: 25, status: 'win' },
    
    // Week 5: L(26) M(27) M(28) J(29) V(30) S(31)
    { date: 26, status: 'win' },
    { date: 27, status: 'win' },
    { date: 28, status: 'be' },
    { date: 29, status: 'win' },
    { date: 30, status: 'win' },
    { date: 31, status: 'win' }
  ];

  const getDayStyle = (day: { date: number; status: string }) => {
    const baseStyle = "h-12 rounded flex items-center justify-center text-white font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity";
    
    switch (day.status) {
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

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto border border-gray-600">
      {/* Header avec avatar et titre */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          T
        </div>
        <div className="flex-1">
          <div className="text-white font-semibold">TheTheTrader</div>
          <div className="text-gray-400 text-sm">00:00:01</div>
        </div>
      </div>

      {/* Titre principal */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-purple-400 mb-2">
          Calendrier des performances trading - Janvier 2025
        </h2>
      </div>

      {/* Calendrier */}
      <div className="bg-gray-700 rounded-lg p-4">
        {/* Header du calendrier */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold text-lg">Janvier 2025</h3>
          <div className="text-gray-300 text-sm">
            Win Rate: 78.2% • Total: +47.8%
          </div>
        </div>

        {/* Jours de la semaine */}
        <div className="grid grid-cols-7 gap-2 mb-3">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(day => (
            <div key={day} className="text-center text-gray-400 text-sm font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {/* Espaces vides pour commencer le mois (janvier 2025 commence un mercredi) */}
          <div></div>
          <div></div>
          
          {/* Les jours du mois */}
          {calendarDays.map((day) => (
            <div
              key={day.date}
              className={getDayStyle(day)}
            >
              {day.date}
            </div>
          ))}
        </div>

        {/* Légende */}
        <div className="flex items-center justify-center gap-6 text-sm">
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
    </div>
  );
};

export default TradingCalendar; 