import type { SurfScore } from '../services/surfScore';

interface Props {
  score: SurfScore;
  size?: 'sm' | 'md' | 'lg';
}

export function SurfScoreBadge({ score, size = 'md' }: Props) {
  const ring = size === 'lg' ? 'w-28 h-28 text-5xl border-4' :
               size === 'md' ? 'w-20 h-20 text-3xl border-4' :
                               'w-14 h-14 text-xl border-2';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Cercle score */}
      <div
        className={`${ring} rounded-full flex items-center justify-center font-bold shadow-lg`}
        style={{
          borderColor:     score.color,
          color:           score.color,
          backgroundColor: score.bgColor,
        }}
      >
        {score.total}
      </div>

      {/* Label */}
      <span
        className={`font-semibold ${size === 'lg' ? 'text-base' : 'text-sm'}`}
        style={{ color: score.color }}
      >
        {score.emoji} {score.label}
      </span>

      {/* Détail des sous-scores (md et lg seulement) */}
      {size !== 'sm' && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-slate-400 mt-0.5">
          <span>Hauteur: {score.heightScore}/35</span>
          <span>Période: {score.periodScore}/25</span>
          <span>Vent: {score.windScore}/20</span>
          <span>Direction: {score.directionScore}/10</span>
          <span className="col-span-2">Propreté: {score.cleannessScore}/10</span>
        </div>
      )}
    </div>
  );
}
