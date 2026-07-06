import dayjs from 'dayjs';
import type { MarineConditions, SurfSpot } from '../types/surf';
import { calculateSurfScore, directionLabel } from '../services/surfScore';

interface Props {
  conditions: MarineConditions;
  spot: SurfSpot;
}

interface DaySummary {
  date: string;
  label: string;
  maxWaveHeight: number;
  avgPeriod: number;
  dominantDir: number;
  avgWindSpeed: number;
  bestScore: number;
  bestScoreTime: string;
}

function safeNum(v: number | null | undefined, fallback = 0): number {
  return v ?? fallback;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 65) return 'text-green-400';
  if (score >= 50) return 'text-lime-400';
  if (score >= 35) return 'text-yellow-400';
  if (score >= 18) return 'text-red-400';
  return 'text-slate-500';
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function buildDailySummaries(conditions: MarineConditions, spot: SurfSpot): DaySummary[] {
  const now = dayjs();
  const grouped: Record<string, number[]> = {};

  conditions.time.forEach((t, i) => {
    const d = dayjs(t);
    if (!d.isAfter(now.subtract(1, 'hour'))) return;
    const key = d.format('YYYY-MM-DD');
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(i);
  });

  return Object.entries(grouped)
    .slice(0, 7)
    .map(([date, indices]) => {
      const heights = indices.map(i => safeNum(conditions.waveHeight[i]));
      const periods = indices.map(i =>
        safeNum(conditions.swellWavePeriod[i]) || safeNum(conditions.wavePeriod[i]),
      );
      const dirs = indices.map(i =>
        safeNum(conditions.swellWaveDirection[i]) || safeNum(conditions.waveDirection[i]),
      );
      const winds = indices.map(i => safeNum(conditions.windSpeed[i]));
      const windDirs = indices.map(i => safeNum(conditions.windDirection[i]));

      const scores = indices.map((_i, k) =>
        calculateSurfScore(heights[k], periods[k], winds[k], windDirs[k], dirs[k], spot).total,
      );

      const bestK   = scores.indexOf(Math.max(...scores));
      const bestIdx = indices[bestK];

      return {
        date,
        label:         dayjs(date).format('ddd DD/MM'),
        maxWaveHeight: Math.max(...heights),
        avgPeriod:     avg(periods),
        dominantDir:   dirs[Math.floor(dirs.length / 2)],
        avgWindSpeed:  avg(winds),
        bestScore:     scores[bestK] ?? 0,
        bestScoreTime: dayjs(conditions.time[bestIdx]).format('HH:mm'),
      };
    });
}

export function ForecastTable({ conditions, spot }: Props) {
  const summaries = buildDailySummaries(conditions, spot);

  return (
    <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl overflow-x-auto">
      <h2 className="text-white font-bold text-lg mb-4">Tableau des prévisions</h2>
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
            <th className="text-left pb-3 pr-4">Jour</th>
            <th className="text-center pb-3">Hm0 max</th>
            <th className="text-center pb-3">Tp moy.</th>
            <th className="text-center pb-3">Dir. houle</th>
            <th className="text-center pb-3">Vent moy.</th>
            <th className="text-center pb-3">Meilleur score</th>
            <th className="text-center pb-3">Meilleure heure</th>
          </tr>
        </thead>
        <tbody>
          {summaries.map(day => (
            <tr
              key={day.date}
              className="border-b border-slate-700/40 hover:bg-slate-700/30 transition-colors"
            >
              <td className="py-3 pr-4 text-white font-medium">{day.label}</td>
              <td className="py-3 text-center text-cyan-400 font-semibold">{day.maxWaveHeight.toFixed(1)} m</td>
              <td className="py-3 text-center text-blue-400">{day.avgPeriod.toFixed(0)} s</td>
              <td className="py-3 text-center text-indigo-400">{directionLabel(day.dominantDir)}</td>
              <td className="py-3 text-center text-yellow-400">{day.avgWindSpeed.toFixed(0)} km/h</td>
              <td className={`py-3 text-center font-bold ${scoreColor(day.bestScore)}`}>
                {day.bestScore}/100
              </td>
              <td className="py-3 text-center text-slate-400">{day.bestScoreTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
