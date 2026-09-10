import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';

const TREND_DATA = [
  { time: '00:00', aqi: 75, label: '00:00' },
  { time: '02:00', aqi: 82, label: '02:00' },
  { time: '04:00', aqi: 94, label: '04:00' },
  { time: '06:00', aqi: 118, label: '06:00' },
  { time: '08:00', aqi: 145, label: '08:00' },
  { time: '10:00', aqi: 156, label: '10:00' },
  { time: '12:00', aqi: 182, label: '12:00' }, // Daily Peak
  { time: '13:00', aqi: 174, label: '13:00' },
  { time: '14:32', aqi: 168, label: 'Now' },
  { time: '18:00', aqi: 142, label: '18:00' },
  { time: '21:00', aqi: 120, label: '21:00' },
  { time: '23:59', aqi: 98, label: '24:00' },
];

export const TodayTrendChart: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-col justify-between p-6 sm:p-[28px] rounded-2xl bg-surface-container/60 dark:bg-surface-container/40 backdrop-blur-xl shadow-lg relative overflow-hidden glass-edge border border-white/20 dark:border-white/10 group hover:bg-surface-container/50 transition-all duration-300">
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-[22px]">show_chart</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Today's Trend
            </span>
          </div>
          <span className="font-label-numeric text-[11px] text-on-surface-variant bg-surface-container-lowest/60 px-2.5 py-1 rounded-md border border-white/10">
            24h Telemetry
          </span>
        </div>

        {/* Peak & Trajectory info */}
        <div className="flex items-baseline justify-between mb-space-xs">
          <div className="flex items-baseline gap-space-xs">
            <span className="font-label-numeric text-display-lg text-on-surface font-semibold">
              182
            </span>
            <span className="font-label-caps uppercase text-on-surface-variant text-[11px]">
              Daily Peak
            </span>
          </div>
          <span className="font-label-numeric text-body-sm text-error font-medium flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
            +14% vs yesterday
          </span>
        </div>

        <p className="font-body-sm text-[13px] text-on-surface-variant/80 mb-space-md leading-relaxed">
          Trajectory climbed into unhealthy tier around midday due to low thermal wind dispersal and ground inversion.
        </p>

        {/* Recharts Area Chart */}
        <div className="w-full h-44 relative mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#42dec3" stopOpacity={isDark ? 0.45 : 0.35} />
                  <stop offset="60%" stopColor="#00c2a8" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#42dec3" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <YAxis
                domain={[40, 200]}
                tick={{ fill: isDark ? '#85948f' : '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: isDark ? '#85948f' : '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: isDark ? '#3c4a46' : '#cbd5e1' }}
                tickLine={false}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const val = payload[0].value;
                    return (
                      <div className="p-2.5 rounded-xl bg-surface-container-lowest/90 backdrop-blur-xl border border-white/20 shadow-xl text-on-surface font-mono text-xs">
                        <p className="font-bold text-primary">{payload[0].payload.time}</p>
                        <p className="text-on-surface">AQI: <strong className="text-on-surface">{val}</strong></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Guide threshold lines */}
              <ReferenceLine
                y={150}
                stroke={isDark ? '#ffb4ab' : '#ef4444'}
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />
              <ReferenceLine
                y={100}
                stroke={isDark ? '#3c4a46' : '#94a3b8'}
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />

              <Area
                type="monotone"
                dataKey="aqi"
                stroke="#42dec3"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#aqiTrendGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between font-label-numeric text-[11px] text-on-surface-variant/70 mt-2">
          <span>Base 40</span>
          <span className="text-amber-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 100 Mod
          </span>
          <span className="text-error flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span> 150 Unhealthy
          </span>
          <span className="text-primary font-semibold">Now (168)</span>
        </div>
      </div>
    </div>
  );
};
