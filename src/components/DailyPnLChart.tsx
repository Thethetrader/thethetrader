import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

type DailyPnLPoint = {
  date: string;
  balance: number;
};

interface DailyPnLChartProps {
  data: DailyPnLPoint[];
  height?: number;
}

const formatXAxisLabel = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('fr-FR', {
    month: '2-digit',
    day: '2-digit',
  });
};

const formatBalance = (value: number) => {
  if (!Number.isFinite(value)) {
    return '0';
  }
  const rounded = Math.round(value);
  const prefix = rounded > 0 ? '+' : '';
  return `${prefix}$${rounded.toLocaleString('en-US')}`;
};

const DailyPnLChart: React.FC<DailyPnLChartProps> = ({ data, height = 220 }) => {
  const sanitizedData = useMemo(() => {
    if (!Array.isArray(data)) {
      return [];
    }
    const sorted = data
      .map((point) => ({
        date: point.date,
        balance: Number.isFinite(point.balance) ? Math.round(point.balance) : 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sorted.length === 0) {
      return [];
    }

    let startIndex = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].balance !== sorted[i - 1].balance) {
        startIndex = i;
        break;
      }
    }

    let endIndex = sorted.length - 1;
    for (let i = sorted.length - 1; i > 0; i--) {
      if (sorted[i].balance !== sorted[i - 1].balance) {
        endIndex = i;
        break;
      }
    }

    const trimmed = sorted.slice(startIndex, endIndex + 1);

    if (trimmed.length === 0) {
      return sorted.slice(-1);
    }

    const deduplicated = trimmed.filter((point, index) => {
      if (index === 0) {
        return true;
      }
      return point.balance !== trimmed[index - 1].balance;
    });

    return deduplicated.length > 0 ? deduplicated : trimmed;
  }, [data]);

  const tradeTicks = useMemo(() => {
    if (sanitizedData.length === 0) {
      return [];
    }
    const ticks: string[] = [];
    sanitizedData.forEach((point, index) => {
      if (index === 0) {
        ticks.push(point.date);
        return;
      }
      const previous = sanitizedData[index - 1];
      if (point.balance !== previous.balance) {
        ticks.push(point.date);
      }
    });
    return ticks;
  }, [sanitizedData]);

  // Déterminer si la courbe est positive ou négative (basé sur la dernière valeur)
  const isPositive = useMemo(() => {
    if (sanitizedData.length === 0) return true;
    const lastBalance = sanitizedData[sanitizedData.length - 1]?.balance || 0;
    return lastBalance >= 0;
  }, [sanitizedData]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-inner">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
            Solde du compte quotidien
          </h4>
          <p className="text-xs text-gray-400 mt-1">
            Solde cumulé jour par jour
          </p>
        </div>
        <span
          className="text-gray-400 text-sm border border-gray-600 rounded-full w-5 h-5 flex items-center justify-center"
          title="Somme cumulée du PnL jusqu'à la date affichée"
        >
          ?
        </span>
      </div>

      {sanitizedData.length === 0 ? (
        <div className="text-sm text-gray-400 text-center py-10">
          Aucune donnée disponible pour le mois en cours.
        </div>
      ) : (
        <div style={{ 
          width: isMobile ? 'calc(100% + 2rem)' : '100%',
          marginLeft: isMobile ? '-2rem' : '0',
          marginBottom: isMobile ? '-1rem' : '0',
          paddingBottom: isMobile ? '1rem' : '0'
        }}>
          <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={sanitizedData}>
            <defs>
              {/* Dégradé vert pour valeurs positives */}
              <linearGradient id="dailyPnlAreaPositive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34, 197, 94, 1)" />
                <stop offset="50%" stopColor="rgba(22, 163, 74, 0.8)" />
                <stop offset="100%" stopColor="rgba(20, 83, 45, 0.6)" />
              </linearGradient>
              {/* Dégradé rouge pour valeurs négatives */}
              <linearGradient id="dailyPnlAreaNegative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(239, 68, 68, 1)" />
                <stop offset="50%" stopColor="rgba(220, 38, 38, 0.8)" />
                <stop offset="100%" stopColor="rgba(153, 27, 27, 0.6)" />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              stroke="#475569"
              axisLine={{ stroke: '#475569' }}
              tickLine={{ stroke: '#475569' }}
              tickFormatter={formatXAxisLabel}
              interval={0}
              minTickGap={12}
              ticks={tradeTicks.length > 0 ? tradeTicks : undefined}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={{ stroke: '#475569' }}
              tickLine={{ stroke: '#475569' }}
              tickFormatter={(value) => value.toLocaleString('en-US')}
              width={60}
            />
            <Tooltip
              cursor={{ stroke: '#64748b', strokeDasharray: '4 4' }}
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                color: '#f8fafc',
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                
                const value = payload[0].value as number;
                
                // Calculer le PnL du jour en utilisant les données originales triées
                const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                
                // Normaliser les dates pour la comparaison (sans heures)
                const normalizeDate = (dateStr: string) => {
                  const d = new Date(dateStr);
                  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                };
                
                const currentDateNormalized = normalizeDate(label);
                
                // Trouver l'index du point actuel dans les données triées
                const currentIndex = sortedData.findIndex(d => {
                  return normalizeDate(d.date) === currentDateNormalized;
                });
                
                let dailyPnL = 0;
                if (currentIndex > 0) {
                  // Prendre le solde du point précédent
                  const previousBalance = sortedData[currentIndex - 1].balance || 0;
                  dailyPnL = value - previousBalance;
                } else if (currentIndex === 0) {
                  // Premier point : pas de PnL du jour (c'est la balance initiale ou le premier jour avec trades)
                  // Si c'est le premier point et qu'il y a d'autres points, on peut calculer le PnL
                  // mais pour simplifier, on met 0 car c'est le point de départ
                  dailyPnL = 0;
                } else {
                  // Point non trouvé : pas de PnL
                  dailyPnL = 0;
                }
                
                return (
                  <div style={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    padding: '12px',
                  }}>
                    <p style={{ margin: '0 0 8px 0', color: '#f8fafc', fontWeight: 'bold' }}>
                      Date : {formatXAxisLabel(label)}
                    </p>
                    <p style={{ margin: '4px 0', color: '#94a3b8' }}>
                      <span style={{ color: '#f8fafc', marginRight: '8px' }}>PnL:</span>
                      <span style={{ color: dailyPnL >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                        {formatBalance(dailyPnL)}
                      </span>
                    </p>
                    <p style={{ margin: '4px 0', color: '#94a3b8' }}>
                      <span style={{ color: '#f8fafc', marginRight: '8px' }}>Balance:</span>
                      <span style={{ color: value >= 0 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                        {formatBalance(value)}
                      </span>
                    </p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="none"
              fill={isPositive ? "url(#dailyPnlAreaPositive)" : "url(#dailyPnlAreaNegative)"}
              fillOpacity={0.5}
              baseLine={0}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#ffffff"
              strokeWidth={2}
              dot={{ r: 4, stroke: '#ffffff', strokeWidth: 2, fill: '#ffffff' }}
              activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2, fill: '#1f2937' }}
              isAnimationActive={false}
              connectNulls={false}
              z={10}
            />
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DailyPnLChart;

