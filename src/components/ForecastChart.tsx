import { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import type { MarineConditions, SurfSpot } from '../types/surf';
import { calculateSurfScore } from '../services/surfScore';

interface Props {
  conditions: MarineConditions;
  spot: SurfSpot;
}

type View = 'waves' | 'wind' | 'score';

function safeNum(v: number | null | undefined, fallback = 0): number {
  return v ?? fallback;
}

interface ChartPoint {
  label: string;
  waveHeight: number;
  swellHeight: number;
  swellPeriod: number;
  windSpeed: number;
  windGusts: number;
  score: number;
}

function buildChartData(conditions: MarineConditions, spot: SurfSpot): ChartPoint[] {
  const now = dayjs();

  return conditions.time
    .map((t, i) => {
      const waveHeight  = safeNum(conditions.waveHeight[i]);
      const swellPeriod = safeNum(conditions.swellWavePeriod[i]) || safeNum(conditions.wavePeriod[i]);
      const windSpeed   = safeNum(conditions.windSpeed[i]);
      const windDir     = safeNum(conditions.windDirection[i]);
      const swellDir    = safeNum(conditions.swellWaveDirection[i]) || safeNum(conditions.waveDirection[i]);

      return {
        time: t,
        label: dayjs(t).format('ddd HH:mm'),
        waveHeight,
        swellHeight: safeNum(conditions.swellWaveHeight[i]),
        swellPeriod,
        windSpeed,
        windGusts: safeNum(conditions.windGusts[i]),
        score: calculateSurfScore(waveHeight, swellPeriod, windSpeed, windDir, swellDir, spot, safeNum(conditions.swellWaveHeight[i])).total,
      };
    })
    .filter(d => dayjs(d.time).isAfter(now.subtract(1, 'hour')))
    .filter((_, i) => i % 3 === 0) // un point toutes les 3h
    .slice(0, 40); // ~5 jours
}

// Tooltip personnalisé (thème clair)
function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs shadow-lg">
      <p className="text-gray-600 font-semibold mb-1.5">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </p>
      ))}
    </div>
  );
}

export function ForecastChart({ conditions, spot }: Props) {
  const [view, setView] = useState<View>('waves');
  const data = buildChartData(conditions, spot);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-800 font-bold text-base sm:text-lg">Prévisions 5 jours</h2>
        <div className="flex gap-1.5">
          {(['waves', 'wind', 'score'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors active:scale-95 ${
                view === v
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500 active:bg-gray-200'
              }`}
            >
              {v === 'waves' ? '🌊' : v === 'wind' ? '💨' : '🏄'}
              <span className="hidden sm:inline ml-1">{v === 'waves' ? 'Vagues' : v === 'wind' ? 'Vent' : 'Score'}</span>
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickLine={false}
            interval={7}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ color: '#6b7280', fontSize: 12 }} />

          {view === 'waves' && (
            <>
              <YAxis yAxisId="h" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} unit="m" domain={[0, 'auto']} />
              <YAxis yAxisId="p" orientation="right" tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} unit="s" />
              <Area yAxisId="h" type="monotone" dataKey="waveHeight"  name="Hm0 (m)"    fill="#0ea5e920" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              <Area yAxisId="h" type="monotone" dataKey="swellHeight" name="Houle (m)"  fill="#6366f120" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line yAxisId="p" type="monotone" dataKey="swellPeriod" name="Période (s)" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </>
          )}

          {view === 'wind' && (
            <>
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} unit="km/h" />
              <Area type="monotone" dataKey="windSpeed"  name="Vent (km/h)"    fill="#f59e0b30" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="windGusts"  name="Rafales (km/h)" fill="#ef444430" stroke="#ef4444" strokeWidth={2} dot={false} />
            </>
          )}

          {view === 'score' && (
            <>
              <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} tickLine={false} domain={[0, 100]} />
              <Area type="monotone" dataKey="score" name="Score surf (/100)" fill="#10b98130" stroke="#10b981" strokeWidth={2} dot={false} />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
