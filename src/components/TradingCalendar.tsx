"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface Signal {
  id: string;
  type: 'BUY' | 'SELL';
  pair: string;
  entryPrice: string;
  takeProfit: string;
  stopLoss: string;
  description: string;
  image?: string;
  timestamp: Date;
  status: 'ACTIVE' | 'WIN' | 'LOSS';
  pnl?: number; // Profit/Loss en pourcentage ou montant
}

interface TradingCalendarProps {
  className?: string;
  signals?: Signal[];
}

interface DayData {
  date: Date;
  signals: Signal[];
  totalTrades: number;
  wins: number;
  losses: number;
  pnl: number;
  winRate: number;
}

const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export default function TradingCalendar({ className, signals = [] }: TradingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Fonction pour obtenir les données d'un jour spécifique
  const getDayData = (date: Date): DayData => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const daySignals = signals.filter(signal => 
      signal.timestamp >= dayStart && signal.timestamp <= dayEnd
    );

    const wins = daySignals.filter(s => s.status === 'WIN').length;
    const losses = daySignals.filter(s => s.status === 'LOSS').length;
    const totalTrades = wins + losses; // Only count closed trades
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    
    // Calcul simple du PnL (vous pouvez ajuster selon votre logique)
    const pnl = daySignals.reduce((acc, signal) => {
      if (signal.status === 'WIN') return acc + (signal.pnl || 1);
      if (signal.status === 'LOSS') return acc - (signal.pnl || 1);
      return acc;
    }, 0);

    return {
      date,
      signals: daySignals,
      totalTrades,
      wins,
      losses,
      pnl,
      winRate
    };
  };

  // Générer les jours du mois
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    // 6 semaines (42 jours) pour couvrir tous les cas
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getDayColor = (dayData: DayData) => {
    if (dayData.totalTrades === 0) return 'bg-transparent';
    
    if (dayData.winRate >= 70) return 'bg-green-500';
    if (dayData.winRate >= 50) return 'bg-green-400';
    if (dayData.winRate >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatPnL = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}${pnl.toFixed(1)}%`;
  };

  return (
    <div className={cn("bg-[#2f3136] rounded-lg p-4 text-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Calendrier Trading</h3>
        </div>
        <Button
          onClick={goToToday}
          size="sm"
          className="bg-[#7289da] hover:bg-[#5b6eae] text-white"
        >
          Aujourd'hui
        </Button>
      </div>

      {/* Navigation mois */}
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={goToPreviousMonth}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h4 className="text-lg font-semibold">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>
        
        <Button
          onClick={goToNextMonth}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-xs font-medium text-white/70 p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendrier */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {calendarDays.map((date, index) => {
          const dayData = getDayData(date);
          const dayColor = getDayColor(dayData);
          
          return (
            <button
              key={index}
              onClick={() => setSelectedDay(dayData)}
              className={cn(
                "relative p-2 text-sm rounded hover:bg-white/10 transition-colors",
                !isCurrentMonth(date) && "text-white/30",
                isToday(date) && "ring-2 ring-[#7289da]",
                dayData.totalTrades > 0 && "font-semibold"
              )}
            >
              <div className="relative z-10">
                {date.getDate()}
              </div>
              
              {/* Indicateur de performance */}
              {dayData.totalTrades > 0 && (
                <div className={cn(
                  "absolute inset-0 rounded opacity-20",
                  dayColor
                )} />
              )}
              
              {/* Nombre de trades */}
              {dayData.totalTrades > 0 && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full opacity-60" />
              )}
            </button>
          );
        })}
      </div>

      {/* Légende */}
      <div className="space-y-2 text-xs text-white/70 mb-4">
        <div className="flex items-center justify-between">
          <span>Légende:</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Win Rate ≥70%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>30-69%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>&lt;30%</span>
          </div>
        </div>
      </div>

      {/* Détails du jour sélectionné */}
      {selectedDay && selectedDay.totalTrades > 0 && (
        <div className="bg-[#36393f] rounded-lg p-3">
          <h5 className="font-semibold mb-2">
            {selectedDay.date.toLocaleDateString('fr-FR')}
          </h5>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-white/70">Trades:</span>
              <span className="ml-1 font-semibold">{selectedDay.totalTrades}</span>
            </div>
            <div>
              <span className="text-white/70">Win Rate:</span>
              <span className="ml-1 font-semibold">{selectedDay.winRate.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-green-400">Wins:</span>
              <span className="ml-1 font-semibold">{selectedDay.wins}</span>
            </div>
            <div>
              <span className="text-red-400">Losses:</span>
              <span className="ml-1 font-semibold">{selectedDay.losses}</span>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-white/10">
            <span className="text-white/70 text-sm">P&L: </span>
            <span className={cn(
              "font-semibold",
              selectedDay.pnl >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {formatPnL(selectedDay.pnl)}
            </span>
          </div>

          {/* Liste des signaux du jour */}
          <div className="mt-3 space-y-1">
            <h6 className="text-xs font-medium text-white/70">Signaux:</h6>
            {selectedDay.signals.slice(0, 3).map(signal => (
              <div key={signal.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    signal.status === 'WIN' && "bg-green-400",
                    signal.status === 'LOSS' && "bg-red-400",
                    signal.status === 'ACTIVE' && "bg-blue-400"
                  )} />
                  <span>{signal.pair}</span>
                  <span className={cn(
                    "px-1 rounded text-xs",
                    signal.type === 'BUY' ? "bg-green-600" : "bg-red-600"
                  )}>
                    {signal.type}
                  </span>
                </div>
                <span className={cn(
                  "font-medium",
                  signal.status === 'WIN' && "text-green-400",
                  signal.status === 'LOSS' && "text-red-400",
                  signal.status === 'ACTIVE' && "text-white/70"
                )}>
                  {signal.status}
                </span>
              </div>
            ))}
            {selectedDay.signals.length > 3 && (
              <div className="text-xs text-white/50">
                +{selectedDay.signals.length - 3} autres...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message si aucun jour sélectionné */}
      {!selectedDay && (
        <div className="bg-[#36393f] rounded-lg p-3 text-center text-white/70 text-sm">
          Cliquez sur un jour pour voir les détails des trades
        </div>
      )}
    </div>
  );
}