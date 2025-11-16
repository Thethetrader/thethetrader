import { useState, useEffect } from 'react';
import { getSignals } from '../utils/firebase-setup';

interface Signal {
  id: string;
  type: string;
  symbol: string;
  timeframe: string;
  entry: string;
  takeProfit: string;
  stopLoss: string;
  description: string;
  image: string | null;
  timestamp: string;
  originalTimestamp: number;
  status: 'ACTIVE' | 'WIN' | 'LOSS' | 'BE';
  channel_id: string;
  reactions?: string[];
  pnl?: string;
  closeMessage?: string;
  attachment_data?: string;
  attachment_type?: string;
  attachment_name?: string;
  loss_reason?: string;
}

interface Stats {
  totalPnL: number;
  winRate: number;
  totalTrades: number;
  avgWin: number;
  avgLoss: number;
  activeSignals: number;
}

export function useStatsSync() {
  const [allSignalsForStats, setAllSignalsForStats] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPnL: 0,
    winRate: 0,
    totalTrades: 0,
    avgWin: 0,
    avgLoss: 0,
    activeSignals: 0
  });

  // Charger tous les signaux depuis Firebase
  const loadAllSignalsForStats = async () => {
    try {
      console.log('📊 [STATS-SYNC] Chargement de TOUS les signaux pour synchronisation...');
      
      const channels = ['fondamentaux', 'letsgooo-model', 'general-chat-2', 'general-chat-3', 'general-chat-4'];
      let allSignals: any[] = [];
      
      for (const channelId of channels) {
        try {
          const channelSignals = await getSignals(channelId, 999);
          if (channelSignals && channelSignals.length > 0) {
            console.log(`🔍 [STATS-SYNC] Signaux bruts de ${channelId}:`, channelSignals);
            channelSignals.forEach(signal => {
              console.log(`🔍 [STATS-SYNC] Signal ${signal.id} de ${channelId}:`, {
                image: signal.image,
                attachment_data: signal.attachment_data,
                ALL_KEYS: Object.keys(signal)
              });
            });
            allSignals = [...allSignals, ...channelSignals];
          }
        } catch (error) {
          console.error(`❌ [STATS-SYNC] Erreur chargement signaux pour ${channelId}:`, error);
        }
      }
      
      if (allSignals.length > 0) {
        const formattedSignals = allSignals.map(signal => {
          const isClosed = signal.status && signal.status !== 'ACTIVE';
          const timestamp = isClosed 
            ? new Date(signal.timestamp || Date.now()).toISOString()
            : new Date(signal.timestamp || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          
          return {
            id: signal.id || '',
            type: signal.type,
            symbol: signal.symbol,
            timeframe: signal.timeframe,
            entry: signal.entry?.toString() || 'N/A',
            takeProfit: signal.takeProfit?.toString() || 'N/A',
            stopLoss: signal.stopLoss?.toString() || 'N/A',
            description: signal.description || '',
            image: signal.image,
            timestamp: timestamp,
            originalTimestamp: signal.timestamp || Date.now(),
            status: signal.status || 'ACTIVE' as const,
            channel_id: signal.channel_id,
            reactions: signal.reactions || [],
            pnl: signal.pnl,
            closeMessage: signal.closeMessage,
            attachment_data: signal.attachment_data,
            attachment_type: signal.attachment_type,
            attachment_name: signal.attachment_name,
            loss_reason: signal.loss_reason
          };
        });
        
        setAllSignalsForStats(formattedSignals);
        console.log(`✅ [STATS-SYNC] ${formattedSignals.length} signaux synchronisés`);
      }
    } catch (error) {
      console.error('❌ [STATS-SYNC] Erreur synchronisation:', error);
    }
  };

  // Calculer les stats en temps réel
  const calculateStats = (signals: Signal[]): Stats => {
    const closedSignals = signals.filter(s => s.status !== 'ACTIVE');
    const activeSignals = signals.filter(s => s.status === 'ACTIVE');
    
    // Fonction helper pour parser le PnL de manière sécurisée
    const parsePnLSafe = (pnl: string | undefined): number => {
      if (!pnl) return 0;
      
      // Nettoyer la chaîne (enlever $, espaces, etc.)
      const cleanPnL = pnl.replace(/[$,]/g, '').trim();
      
      // Vérifier si c'est un nombre valide
      const num = Number(cleanPnL);
      return isNaN(num) ? 0 : num;
    };
    
    const totalPnL = closedSignals
      .filter(s => s.pnl && s.pnl !== '0' && s.pnl !== '$0')
      .reduce((total, signal) => total + parsePnLSafe(signal.pnl), 0);
    
    const winRate = closedSignals.length > 0 
      ? Math.round((closedSignals.filter(s => s.status === 'WIN').length / closedSignals.length) * 100)
      : 0;
    
    const winSignals = closedSignals.filter(s => s.status === 'WIN' && s.pnl && s.pnl !== '0' && s.pnl !== '$0');
    const lossSignals = closedSignals.filter(s => s.status === 'LOSS' && s.pnl && s.pnl !== '0' && s.pnl !== '$0');
    
    const avgWin = winSignals.length > 0
      ? Math.round(winSignals.reduce((total, signal) => total + parsePnLSafe(signal.pnl), 0) / winSignals.length)
      : 0;
    
    const avgLoss = lossSignals.length > 0
      ? Math.round(lossSignals.reduce((total, signal) => total + Math.abs(parsePnLSafe(signal.pnl)), 0) / lossSignals.length)
      : 0;

    return {
      totalPnL: Math.round(totalPnL),
      winRate,
      totalTrades: closedSignals.length,
      avgWin,
      avgLoss,
      activeSignals: activeSignals.length
    };
  };

  // Mettre à jour les stats quand les signaux changent
  useEffect(() => {
    const newStats = calculateStats(allSignalsForStats);
    setStats(newStats);
  }, [allSignalsForStats]);

  // Charger les signaux au montage et toutes les 30 secondes
  useEffect(() => {
    loadAllSignalsForStats();
    
    const interval = setInterval(loadAllSignalsForStats, 30000); // 30 secondes
    
    return () => clearInterval(interval);
  }, []);

  // Fonction pour obtenir le breakdown hebdomadaire synchronisé avec l'admin
  const getWeeklyBreakdown = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay(); // 0 = dimanche, 1 = lundi, etc.
    
    // Ajuster pour que lundi soit 0
    const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
    
    // Calculer le nombre de semaines nécessaires pour ce mois
    const totalCells = Math.ceil((adjustedFirstDay + lastDayOfMonth.getDate()) / 7);
    
    // Créer les semaines nécessaires pour ce mois
    const weeks = [];
    for (let weekNum = 1; weekNum <= totalCells; weekNum++) {
      // Calculer les jours de la semaine
      const weekStartDay = (weekNum - 1) * 7 - adjustedFirstDay + 1;
      const weekEndDay = Math.min(weekNum * 7 - adjustedFirstDay, lastDayOfMonth.getDate());
      
      const weekStart = new Date(currentYear, currentMonth, weekStartDay);
      const weekEnd = new Date(currentYear, currentMonth, weekEndDay);
      
      const weekSignals = allSignalsForStats.filter(s => {
        const signalDate = new Date(s.originalTimestamp);
        return signalDate >= weekStart && 
               signalDate <= weekEnd &&
               signalDate.getMonth() === currentMonth &&
               signalDate.getFullYear() === currentYear;
      });
      
      const closedSignals = weekSignals.filter(s => s.status !== 'ACTIVE');
      const weekPnL = closedSignals.reduce((total, signal) => {
        if (!signal.pnl) return total;
        const cleanPnL = signal.pnl.replace(/[$,]/g, '').trim();
        const num = Number(cleanPnL);
        return total + (isNaN(num) ? 0 : num);
      }, 0);
      const wins = closedSignals.filter(s => s.status === 'WIN').length;
      const losses = closedSignals.filter(s => s.status === 'LOSS').length;
      
      // Vérifier si c'est la semaine actuelle
      const todayWeek = Math.ceil(today.getDate() / 7);
      const isCurrentWeek = weekNum === todayWeek;
      
      weeks.push({
        week: `Week ${weekNum}`,
        trades: weekSignals.length,
        pnl: weekPnL,
        wins,
        losses,
        isCurrentWeek
      });
    }
    
    return weeks;
  };

  // Fonctions pour "Aujourd'hui" et "Ce mois" synchronisées avec l'admin
  const getTodaySignals = () => {
    const today = new Date();
    return allSignalsForStats.filter(s => {
      const signalDate = new Date(s.originalTimestamp);
      return signalDate.getDate() === today.getDate() &&
             signalDate.getMonth() === today.getMonth() &&
             signalDate.getFullYear() === today.getFullYear();
    });
  };

  const getThisMonthSignals = () => {
    const today = new Date();
    return allSignalsForStats.filter(s => {
      const signalDate = new Date(s.originalTimestamp);
      return signalDate.getMonth() === today.getMonth() &&
             signalDate.getFullYear() === today.getFullYear();
    });
  };

  return {
    allSignalsForStats,
    stats,
    refreshStats: loadAllSignalsForStats,
    getWeeklyBreakdown,
    getTodaySignals,
    getThisMonthSignals
  };
} 