import React from 'react';
import dayjs from 'dayjs';
import { Star } from 'lucide-react';
import type { MarineConditions, SurfSpot } from '../types/surf';
import { calculateSurfScore, directionLabel } from '../services/surfScore';
import type { SurfScore } from '../services/surfScore';

interface Props {
  conditions: MarineConditions;
  spot: SurfSpot;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function safeNum(v: number | null | undefined, fallback = 0): number {
  return v ?? fallback;
}

function currentIndex(times: string[]): number {
  const now = dayjs();
  const idx = times.findIndex(t => dayjs(t).isAfter(now)) - 1;
  return Math.max(0, idx);
}

/** Tinte de fond très subtile selon le score */
function scoreTint(s: SurfScore): string {
  if (s.total >= 80) return 'from-emerald-50 to-white';
  if (s.total >= 65) return 'from-green-50 to-white';
  if (s.total >= 50) return 'from-lime-50 to-white';
  if (s.total >= 35) return 'from-amber-50 to-white';
  if (s.total >= 18) return 'from-red-50 to-white';
  return 'from-gray-50 to-white';
}

/** Couleur du texte score (thème clair) */
function scoreTextClass(s: SurfScore): string {
  if (s.total >= 80) return 'text-emerald-600';
  if (s.total >= 65) return 'text-green-600';
  if (s.total >= 50) return 'text-lime-600';
  if (s.total >= 35) return 'text-amber-500';
  if (s.total >= 18) return 'text-red-500';
  return 'text-gray-400';
}

/** Flèche directionnelle */
function DirArrow({ degrees }: { degrees: number }) {
  return (
    <span
      style={{ display: 'inline-block', transform: `rotate(${degrees + 180}deg)` }}
      aria-hidden="true"
    >↑</span>
  );
}

interface CellProps {
  label: string;
  value: string;
  unit?: string;
  sub?: React.ReactNode;
  color: string;
}

function MetricCell({ label, value, unit, sub, color }: CellProps) {
  return (
    <div className="bg-white p-3 sm:p-4">
      <p className="text-gray-400 text-[10px] uppercase tracking-wider leading-none mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold leading-none ${color}`}>
        {value}
        {unit && <span className="text-sm sm:text-base font-normal text-gray-400 ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-gray-400 text-xs mt-1 leading-tight">{sub}</p>}
    </div>
  );
}

export function CurrentConditions({ conditions, spot, isFavorite, onToggleFavorite }: Props) {
  const idx = currentIndex(conditions.time);

  const waveHeight  = safeNum(conditions.waveHeight[idx]);
  const wavePeriod  = safeNum(conditions.wavePeriod[idx]);
  const waveDir     = safeNum(conditions.waveDirection[idx]);
  const swellHeight = safeNum(conditions.swellWaveHeight[idx]);
  const swellPeriod = safeNum(conditions.swellWavePeriod[idx]);
  const swellDir    = safeNum(conditions.swellWaveDirection[idx], waveDir);
  const windSpeed   = safeNum(conditions.windSpeed[idx]);
  const windDir     = safeNum(conditions.windDirection[idx]);
  const windGusts   = safeNum(conditions.windGusts[idx]);
  const seaTemp     = safeNum(conditions.seaSurfaceTemperature[idx]);

  const period    = swellPeriod || wavePeriod;
  const direction = swellDir || waveDir;
  const score = calculateSurfScore(waveHeight, period, windSpeed, windDir, direction, spot, swellHeight);

  const textCls = scoreTextClass(score);

  return (
    <div className={`rounded-2xl shadow-sm border border-gray-100 overflow-hidden bg-gradient-to-b ${scoreTint(score)}`}>

      {/* ── Bloc score ── */}
      <div className="px-4 sm:px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">

          {/* Grand score */}
          <div>
            <div className="flex items-baseline gap-1">
              <span className={`text-7xl font-black leading-none tabular-nums ${textCls}`}>
                {score.total}
              </span>
              <span className="text-gray-300 text-2xl font-light self-end mb-1">/100</span>
            </div>
            <p className={`text-lg font-bold mt-1 ${textCls}`}>
              {score.label}
            </p>
          </div>

          {/* Infos spot */}
          <div className="text-right pt-1">
            <div className="flex items-center justify-end gap-1.5">
              <p className="text-gray-800 font-bold text-base leading-tight">{spot.name}</p>
              <button
                onClick={onToggleFavorite}
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                className="p-0.5 -m-0.5 active:scale-90 transition-transform"
              >
                <Star className={`w-[18px] h-[18px] ${isFavorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
              </button>
            </div>
            <p className="text-gray-500 text-sm">{spot.location}</p>
            <p className="text-gray-400 text-xs mt-1.5">
              {dayjs(conditions.time[idx]).format('ddd DD/MM · HH:mm')}
            </p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-4">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score.total}%`, backgroundColor: score.color }}
            />
          </div>
          {/* Détail sous-scores */}
          <div className="flex gap-3 mt-2 text-xs text-gray-400 flex-wrap">
            <span>Haut. <b className="text-gray-600">{score.heightScore}</b>/35</span>
            <span>Pér. <b className="text-gray-600">{score.periodScore}</b>/25</span>
            <span>Vent <b className="text-gray-600">{score.windScore}</b>/20</span>
            <span>Dir. <b className="text-gray-600">{score.directionScore}</b>/10</span>
            <span>Prop. <b className="text-gray-600">{score.cleannessScore}</b>/10</span>
          </div>
        </div>
      </div>

      {/* ── Grille métriques (gap-px = lignes grises) ── */}
      <div className="grid grid-cols-3 gap-px bg-gray-100">
        <MetricCell
          label="Hm0"
          value={waveHeight.toFixed(1)}
          unit="m"
          sub={`Hmax ~${(waveHeight * 1.6).toFixed(1)} m`}
          color="text-sky-600"
        />
        <MetricCell
          label="Période"
          value={period.toFixed(0)}
          unit="s"
          sub={`Swell ${swellHeight.toFixed(1)} m`}
          color="text-blue-600"
        />
        <MetricCell
          label="Dir. houle"
          value={directionLabel(direction)}
          sub={<><DirArrow degrees={direction} /> {direction.toFixed(0)}°</>}
          color="text-violet-600"
        />
        <MetricCell
          label="Vent"
          value={windSpeed.toFixed(0)}
          unit="km/h"
          sub={`Rafales ${windGusts.toFixed(0)} km/h`}
          color="text-amber-500"
        />
        <MetricCell
          label="Dir. vent"
          value={directionLabel(windDir)}
          sub={<><DirArrow degrees={windDir} /> {windDir.toFixed(0)}°</>}
          color="text-orange-500"
        />
        <MetricCell
          label="Temp. mer"
          value={seaTemp.toFixed(1)}
          unit="°C"
          color="text-teal-600"
        />
      </div>
    </div>
  );
}
