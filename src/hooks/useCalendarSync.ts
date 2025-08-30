import { useState, useEffect } from 'react';
import { getSignals } from '../utils/firebase-setup';

interface CalendarSignal {
  id: string;
  type: string;
  symbol: string;
  timeframe: string;
  entry: string;
  takeProfit: string;
  stopLoss: string;
  description: string;
  timestamp: string;
  status: 'ACTIVE' | 'WIN' | 'LOSS' | 'BE';
  channel_id: string;
  pnl?: string;
  closeMessage?: string;
  image?: any;
  attachment_data?: string;
  attachment_type?: string;
  attachment_name?: string;
}

interface CalendarStats {
  dailyData: { [date: string]: { signals: CalendarSignal[]; pnl: number; trades: number } };
  totalPnL: number;
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

export function useCalendarSync() {
  const [calendarStats, setCalendarStats] = useState<CalendarStats>({
    dailyData: {},
    totalPnL: 0,
    totalTrades: 0,
    winRate: 0,
    avgWin: 0,
    avgLoss: 0
  });

  // Charger tous les signaux depuis Firebase
  const loadCalendarData = async () => {
    try {
      console.log('📅 [CALENDAR-SYNC] Chargement des données du calendrier...');
      
      const channels = ['fondamentaux', 'letsgooo-model', 'livestream', 'general-chat-2', 'general-chat-3', 'general-chat-4'];
      let allSignals: any[] = [];
      
      for (const channelId of channels) {
        try {
          const channelSignals = await getSignals(channelId, 100);
          if (channelSignals && channelSignals.length > 0) {
            allSignals = [...allSignals, ...channelSignals];
          }
        } catch (error) {
          console.error(`❌ [CALENDAR-SYNC] Erreur chargement signaux pour ${channelId}:`, error);
        }
      }
      
              if (allSignals.length > 0) {
          console.log('🔍 [CALENDAR-SYNC] Signaux bruts reçus:', allSignals);
          
          const formattedSignals: CalendarSignal[] = allSignals.map(signal => {
            console.log('🔍 [CALENDAR-SYNC] Signal individuel COMPLET:', {
              id: signal.id,
              symbol: signal.symbol,
              image: signal.image,
              attachment_data: signal.attachment_data,
              attachment_type: signal.attachment_type,
              attachment_name: signal.attachment_name,
              status: signal.status,
              timestamp: signal.timestamp,
              ALL_KEYS: Object.keys(signal)
            });
            
            return {
              id: signal.id || '',
              type: signal.type,
              symbol: signal.symbol,
              timeframe: signal.timeframe,
              entry: signal.entry?.toString() || 'N/A',
              takeProfit: signal.takeProfit?.toString() || 'N/A',
              stopLoss: signal.stopLoss?.toString() || 'N/A',
              description: signal.description || '',
              timestamp: signal.timestamp || Date.now(),
              status: signal.status || 'ACTIVE' as const,
              channel_id: signal.channel_id,
              pnl: signal.pnl,
              closeMessage: signal.closeMessage,
              image: signal.image,
              attachment_data: signal.attachment_data,
              attachment_type: signal.attachment_type,
              attachment_name: signal.attachment_name
            };
          });
        
        // Organiser par date
        const dailyData: { [date: string]: { signals: CalendarSignal[]; pnl: number; trades: number } } = {};
        
        formattedSignals.forEach(signal => {
          const signalDate = new Date(signal.timestamp);
          // Éviter le décalage de timezone en utilisant la date locale
          const dateKey = `${signalDate.getFullYear()}-${String(signalDate.getMonth() + 1).padStart(2, '0')}-${String(signalDate.getDate()).padStart(2, '0')}`;
          
          if (!dailyData[dateKey]) {
            dailyData[dateKey] = { signals: [], pnl: 0, trades: 0 };
          }
          
          dailyData[dateKey].signals.push(signal);
          dailyData[dateKey].trades++;
          
          // Calculer le PnL pour ce signal
          if (signal.pnl && signal.status !== 'ACTIVE') {
            const cleanPnL = signal.pnl.replace(/[$,]/g, '').trim();
            const num = Number(cleanPnL);
            if (!isNaN(num)) {
              dailyData[dateKey].pnl += num;
            }
          }
        });
        
        // Calculer les stats globales
        const closedSignals = formattedSignals.filter(s => s.status !== 'ACTIVE');
        const totalPnL = closedSignals.reduce((total, signal) => {
          if (!signal.pnl) return total;
          const cleanPnL = signal.pnl.replace(/[$,]/g, '').trim();
          const num = Number(cleanPnL);
          return total + (isNaN(num) ? 0 : num);
        }, 0);
        
        const totalTrades = closedSignals.length;
        const winRate = totalTrades > 0 
          ? Math.round((closedSignals.filter(s => s.status === 'WIN').length / totalTrades) * 100)
          : 0;
        
        const winSignals = closedSignals.filter(s => s.status === 'WIN' && s.pnl);
        const lossSignals = closedSignals.filter(s => s.status === 'LOSS' && s.pnl);
        
        const avgWin = winSignals.length > 0
          ? Math.round(winSignals.reduce((total, signal) => {
              const cleanPnL = signal.pnl!.replace(/[$,]/g, '').trim();
              const num = Number(cleanPnL);
              return total + (isNaN(num) ? 0 : num);
            }, 0) / winSignals.length)
          : 0;
        
        const avgLoss = lossSignals.length > 0
          ? Math.round(lossSignals.reduce((total, signal) => {
              const cleanPnL = signal.pnl!.replace(/[$,]/g, '').trim();
              const num = Number(cleanPnL);
              return total + Math.abs(isNaN(num) ? 0 : num);
            }, 0) / lossSignals.length)
          : 0;
        
        setCalendarStats({
          dailyData,
          totalPnL: Math.round(totalPnL),
          totalTrades,
          winRate,
          avgWin,
          avgLoss
        });
        
        console.log(`✅ [CALENDAR-SYNC] ${formattedSignals.length} signaux organisés par date`);
      }
    } catch (error) {
      console.error('❌ [CALENDAR-SYNC] Erreur synchronisation:', error);
    }
  };

  // Fonction pour obtenir les stats d'un mois spécifique
  const getMonthlyStats = (date: Date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    
    let monthPnL = 0;
    let monthTrades = 0;
    let monthWins = 0;
    let monthLosses = 0;
    
    Object.entries(calendarStats.dailyData).forEach(([dateKey, dayData]) => {
      const dayDate = new Date(dateKey);
      if (dayDate.getMonth() === month && dayDate.getFullYear() === year) {
        monthPnL += dayData.pnl;
        monthTrades += dayData.trades;
        monthWins += dayData.signals.filter(s => s.status === 'WIN').length;
        monthLosses += dayData.signals.filter(s => s.status === 'LOSS').length;
      }
    });
    
    const monthWinRate = monthTrades > 0 ? Math.round((monthWins / monthTrades) * 100) : 0;
    
    return {
      totalPnL: monthPnL,
      totalTrades: monthTrades,
      winRate: monthWinRate,
      avgWin: monthWins > 0 ? Math.round(monthPnL / monthWins) : 0,
      avgLoss: monthLosses > 0 ? Math.round(Math.abs(monthPnL) / monthLosses) : 0
    };
  };

  // Fonction pour obtenir le breakdown hebdomadaire d'un mois spécifique
  const getWeeklyBreakdown = (targetDate?: Date) => {
    const date = targetDate || new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    const weeks = [];
    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const weekStart = new Date(year, month, (weekNum - 1) * 7 + 1);
      const weekEnd = new Date(year, month, weekNum * 7);
      
      let weekSignals = 0;
      let weekPnL = 0;
      let weekWins = 0;
      let weekLosses = 0;
      
      Object.entries(calendarStats.dailyData).forEach(([dateKey, dayData]) => {
        const dayDate = new Date(dateKey);
        if (dayDate >= weekStart && dayDate <= weekEnd && 
            dayDate.getMonth() === month && dayDate.getFullYear() === year) {
          weekSignals += dayData.trades;
          weekPnL += dayData.pnl;
          weekWins += dayData.signals.filter(s => s.status === 'WIN').length;
          weekLosses += dayData.signals.filter(s => s.status === 'LOSS').length;
        }
      });
      
      // Vérifier si c'est la semaine actuelle
      const today = new Date();
      const todayWeek = Math.ceil(today.getDate() / 7);
      const isCurrentWeek = weekNum === todayWeek && today.getMonth() === month && today.getFullYear() === year;
      
      // Récupérer tous les signaux de cette semaine
      const weekSignalsList: any[] = [];
      Object.entries(calendarStats.dailyData).forEach(([dateKey, dayData]) => {
        const dayDate = new Date(dateKey);
        if (dayDate >= weekStart && dayDate <= weekEnd && 
            dayDate.getMonth() === month && dayDate.getFullYear() === year) {
          weekSignalsList.push(...dayData.signals);
        }
      });

      weeks.push({
        week: `Week ${weekNum}`,
        weekNum: weekNum,
        trades: weekSignals,
        pnl: weekPnL,
        wins: weekWins,
        losses: weekLosses,
        isCurrentWeek,
        signals: weekSignalsList
      });
    }
    
    return weeks;
  };

  // Charger les données au montage et toutes les 30 secondes
  useEffect(() => {
    loadCalendarData();
    
    const interval = setInterval(loadCalendarData, 30000); // 30 secondes
    
    return () => clearInterval(interval);
  }, []);

  return {
    calendarStats,
    getMonthlyStats,
    getWeeklyBreakdown,
    refreshCalendar: loadCalendarData
  };
} 