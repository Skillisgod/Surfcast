import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { SurfSpot } from '../types/surf';
import { fetchTideLevels } from '../services/tides';
import { TideChart, getNowStatus } from './TideChart';
import type { TidePoint } from './TideChart';

interface Props {
  spot: SurfSpot;
}

export function TideCard({ spot }: Props) {
  const [points, setPoints]   = useState<TidePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(false);

  useEffect(() => {
    setPoints([]);
    setError(false);
    if (!spot.tideSite) return;

    let cancelled = false;
    setLoading(true);
    fetchTideLevels(spot.tideSite)
      .then(data => { if (!cancelled) setPoints(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [spot.tideSite]);

  if (!spot.tideSite) return null;

  const now = points.length > 0 ? getNowStatus(points) : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {now && (
        <div className="px-4 sm:px-5 pt-4">
          <span className={`flex items-center gap-1 text-sm font-semibold ${now.rising ? 'text-emerald-500' : 'text-rose-500'}`}>
            {now.rising ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            {now.rising ? 'Marée montante' : 'Marée descendante'}
          </span>
        </div>
      )}

      <div className="px-2 pb-2 pt-1">
        {loading && <p className="px-3 py-10 text-center text-gray-400 text-sm">Chargement…</p>}
        {error && <p className="px-3 py-10 text-center text-gray-400 text-sm italic">Marées indisponibles</p>}
        {!loading && !error && points.length > 0 && <TideChart points={points} />}
      </div>
    </div>
  );
}
