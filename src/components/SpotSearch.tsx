import { useEffect, useState } from 'react';
import { Search, X, Loader2, MapPin } from 'lucide-react';
import { searchSpots, geocodeResultToSpot, findCuratedSpot } from '../services/geocoding';
import type { GeocodeResult } from '../services/geocoding';
import { SURF_SPOTS } from '../data/spots';
import type { SurfSpot } from '../types/surf';

interface Props {
  onSelect: (spot: SurfSpot) => void;
  onClose: () => void;
}

export function SpotSearch({ onSelect, onClose }: Props) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      searchSpots(query)
        .then(res => { setResults(res); setError(null); })
        .catch(() => setError('Recherche indisponible pour le moment.'))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 flex items-center gap-2 border-b border-gray-100">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Chercher un spot (ville, plage…)"
          className="flex-1 min-w-0 text-sm outline-none placeholder:text-gray-400"
        />
        {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />}
        <button onClick={onClose} className="p-1 rounded-lg text-gray-400 active:bg-gray-100 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && <p className="px-4 sm:px-5 py-3 text-sm text-red-500">{error}</p>}

      {!error && query.trim().length >= 2 && !loading && results.length === 0 && (
        <p className="px-4 sm:px-5 py-3 text-sm text-gray-400">Aucun résultat.</p>
      )}

      {results.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {results.map(r => {
            const curated = findCuratedSpot(r, SURF_SPOTS);
            return (
              <li key={r.id}>
                <button
                  onClick={() => onSelect(curated ?? geocodeResultToSpot(r))}
                  className="w-full px-4 sm:px-5 py-3 flex items-center gap-2.5 text-left active:bg-gray-50 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-sky-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-800 font-semibold text-sm truncate">{curated?.name ?? r.name}</p>
                    <p className="text-gray-400 text-xs truncate">
                      {[r.admin2, r.admin1, r.country].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
