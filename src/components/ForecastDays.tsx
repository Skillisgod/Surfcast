import { useState } from 'react';
import dayjs from 'dayjs';
import { ChevronDown } from 'lucide-react';
import type { MarineConditions, SurfSpot } from '../types/surf';
import { calculateSurfScore } from '../services/surfScore';

interface Props {
  conditions: MarineConditions;
  spot: SurfSpot;
}

function safeNum(v: number | null | undefined, f = 0): number {
  return v ?? f;
}

function avg(arr: number[]): number {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

// ---------------------------------------------------------------------------
// Structures de données
// ---------------------------------------------------------------------------

interface HourRow {
  time: string;
  hour: string;
  waveHeight: number;
  swellPeriod: number;
  swellDir: number;
  swellHeight: number;
  windSpeed: number;
  windDir: number;
  score: number;
}

interface DaySummary {
  date: string;
  label: string;
  minWave: number;
  maxWave: number;
  avgPeriod: number;
  dominantDir: number;
  avgWind: number;
  dominantWindDir: number;
  bestScore: number;
  bestHour: string;
  hours: HourRow[];
}

function buildDays(conditions: MarineConditions, spot: SurfSpot): DaySummary[] {
  const now = dayjs();
  const grouped: Record<string, number[]> = {};

  conditions.time.forEach((t, i) => {
    const d = dayjs(t);
    if (!d.isAfter(now.subtract(1, 'hour'))) return;
    const key = d.format('YYYY-MM-DD');
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(i);
  });

  return Object.entries(grouped).slice(0, 7).map(([date, indices]) => {
    // Un point toutes les 3h pour le détail
    const threeHourly = indices.filter((_, k) => k % 3 === 0);

    const hours: HourRow[] = threeHourly.map(i => {
      const wh = safeNum(conditions.waveHeight[i]);
      const sp = safeNum(conditions.swellWavePeriod[i]) || safeNum(conditions.wavePeriod[i]);
      const sd = safeNum(conditions.swellWaveDirection[i]) || safeNum(conditions.waveDirection[i]);
      const sh = safeNum(conditions.swellWaveHeight[i]);
      const ws = safeNum(conditions.windSpeed[i]);
      const wd = safeNum(conditions.windDirection[i]);
      return {
        time: conditions.time[i],
        hour: dayjs(conditions.time[i]).format('HH:mm'),
        waveHeight: wh,
        swellPeriod: sp,
        swellDir: sd,
        swellHeight: sh,
        windSpeed: ws,
        windDir: wd,
        score: calculateSurfScore(wh, sp, ws, wd, sd, spot, sh).total,
      };
    });

    const scores  = hours.map(h => h.score);
    const bestScore = scores.length ? Math.max(...scores) : 0;
    const bestIdx   = scores.indexOf(bestScore);
    const mid = Math.floor(hours.length / 2);

    return {
      date,
      label: dayjs(date).format('ddd DD/MM'),
      minWave:         hours.length ? Math.min(...hours.map(h => h.waveHeight)) : 0,
      maxWave:         hours.length ? Math.max(...hours.map(h => h.waveHeight)) : 0,
      avgPeriod:       avg(hours.map(h => h.swellPeriod)),
      dominantDir:     hours[mid]?.swellDir ?? 0,
      avgWind:         avg(hours.map(h => h.windSpeed)),
      dominantWindDir: hours[mid]?.windDir ?? 0,
      bestScore,
      bestHour:        hours[bestIdx]?.hour ?? '--:--',
      hours,
    };
  });
}

// ---------------------------------------------------------------------------
// Helpers visuels — tout doit se lire d'un coup d'œil, sans décoder du texte
// ---------------------------------------------------------------------------

/** Flèche qui pointe où va la houle/le vent (rotation = direction + 180°) */
function DirArrow({ degrees, className }: { degrees: number; className?: string }) {
  return (
    <span
      className={className}
      style={{ display: 'inline-block', transform: `rotate(${degrees + 180}deg)` }}
      aria-hidden="true"
    >↑</span>
  );
}

function scoreBadgeClasses(s: number): string {
  if (s >= 80) return 'bg-emerald-500 text-white';
  if (s >= 65) return 'bg-green-400   text-white';
  if (s >= 50) return 'bg-lime-400    text-lime-900';
  if (s >= 35) return 'bg-amber-400   text-amber-900';
  if (s >= 18) return 'bg-red-400     text-white';
  return              'bg-gray-300    text-gray-600';
}

function scoreTextClass(s: number): string {
  if (s >= 80) return 'text-emerald-600';
  if (s >= 65) return 'text-green-600';
  if (s >= 50) return 'text-lime-600';
  if (s >= 35) return 'text-amber-500';
  if (s >= 18) return 'text-red-500';
  return 'text-gray-400';
}

/** Gros badge score, rond et coloré — c'est le point d'accroche de chaque ligne */
function ScoreBadge({ score }: { score: number }) {
  return (
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${scoreBadgeClasses(score)}`}>
      <span className="text-lg font-black leading-none">{score}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export function ForecastDays({ conditions, spot }: Props) {
  const days = buildDays(conditions, spot);
  // Aujourd'hui ouvert par défaut
  const [openDay, setOpenDay] = useState<string | null>(days[0]?.date ?? null);

  function toggle(date: string) {
    setOpenDay(prev => (prev === date ? null : date));
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* En-tête section */}
      <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-gray-100">
        <h2 className="text-gray-800 font-bold text-base sm:text-lg">Prévisions par jour</h2>
        <p className="text-gray-400 text-xs mt-0.5">Appuie sur un jour pour le détail heure par heure</p>
      </div>

      {/* Liste des jours */}
      <div className="divide-y divide-gray-100">
        {days.map(day => {
          const isOpen = openDay === day.date;

          return (
            <div key={day.date}>
              {/* ── Ligne résumé du jour — tappable ── */}
              <button
                className="w-full px-4 sm:px-5 py-3 flex items-center gap-3 active:bg-gray-50 transition-colors text-left"
                onClick={() => toggle(day.date)}
              >
                <ScoreBadge score={day.bestScore} />

                {/* Date + infos visuelles */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-bold text-sm capitalize leading-tight">
                    {day.label} <span className="text-gray-400 font-normal text-xs">⭐ {day.bestHour}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm font-semibold flex-wrap">
                    <span className="flex items-center gap-1 text-sky-600 whitespace-nowrap">
                      🌊 {day.minWave.toFixed(1)}–{day.maxWave.toFixed(1)}m
                    </span>
                    <span className="flex items-center gap-1 text-violet-600">
                      <DirArrow degrees={day.dominantDir} /> {day.avgPeriod.toFixed(0)}s
                    </span>
                    <span className="flex items-center gap-1 text-amber-500 whitespace-nowrap">
                      <DirArrow degrees={day.dominantWindDir} /> {day.avgWind.toFixed(0)}km/h
                    </span>
                  </div>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* ── Détail heures — accordion ── */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-3 sm:px-4 pb-4 pt-1 space-y-1">
                  {day.hours.map((h, k) => {
                    const isBest =
                      h.score === day.bestScore &&
                      k === day.hours.findIndex(x => x.score === day.bestScore);

                    return (
                      <div
                        key={h.time}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
                          isBest ? 'bg-sky-50 ring-1 ring-sky-200' : 'bg-gray-50'
                        }`}
                      >
                        <span className="text-gray-400 font-mono text-xs w-10 flex-shrink-0">{h.hour}</span>
                        <span className="text-sky-600 font-bold w-14 flex-shrink-0">
                          🌊 {h.waveHeight.toFixed(1)}m
                        </span>
                        <span className="text-violet-600 font-semibold w-12 flex-shrink-0">
                          <DirArrow degrees={h.swellDir} /> {h.swellPeriod.toFixed(0)}s
                        </span>
                        <span className="text-amber-500 font-semibold flex-1 truncate">
                          <DirArrow degrees={h.windDir} /> {h.windSpeed.toFixed(0)}km/h
                        </span>
                        <span className={`font-black w-6 text-right flex-shrink-0 ${scoreTextClass(h.score)}`}>
                          {h.score}
                        </span>
                        <span className="w-4 flex-shrink-0 text-center">
                          {isBest ? '⭐' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
