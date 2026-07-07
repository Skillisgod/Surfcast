import { useState, useEffect, useCallback } from 'react';
import { Waves, RefreshCw } from 'lucide-react';
import { SURF_SPOTS } from './data/spots';
import type { SurfSpot, MarineConditions } from './types/surf';
import { fetchMarineConditions } from './services/openMeteo';
import { useFavorites } from './hooks/useFavorites';
import { SpotSelector }      from './components/SpotSelector';
import { SpotSearch }        from './components/SpotSearch';
import { CurrentConditions } from './components/CurrentConditions';
import { ForecastChart }     from './components/ForecastChart';
import { ForecastDays }      from './components/ForecastDays';
import { WebcamCard }        from './components/WebcamCard';
import { TideCard }          from './components/TideCard';

export default function App() {
  const [spot, setSpot]             = useState<SurfSpot>(SURF_SPOTS[0]);
  const [conditions, setConditions] = useState<MarineConditions | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [lastFetch, setLastFetch]   = useState<Date | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const load = useCallback((s: SurfSpot) => {
    setLoading(true);
    setError(null);
    setConditions(null);
    fetchMarineConditions(s.lat, s.lng)
      .then(data => { setConditions(data); setLastFetch(new Date()); })
      .catch(err => setError(`Erreur : ${String(err instanceof Error ? err.message : err)}`))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(spot); }, [spot, load]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-sky-500 to-cyan-400 shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/25 rounded-xl flex items-center justify-center">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-white font-bold text-xl tracking-tight">SurfCast</h1>
          </div>
          <div className="flex items-center gap-3">
            {lastFetch && (
              <span className="text-sky-100 text-xs">
                {lastFetch.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => load(spot)}
              disabled={loading}
              className="p-2 rounded-xl bg-white/20 text-white active:bg-white/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
        <SpotSelector
          spots={favorites}
          selected={spot}
          onSelect={s => { setSpot(s); setSearchOpen(false); }}
          onSearchClick={() => setSearchOpen(o => !o)}
          searchActive={searchOpen}
        />

        {searchOpen && (
          <SpotSearch
            onSelect={s => { setSpot(s); setSearchOpen(false); }}
            onClose={() => setSearchOpen(false)}
          />
        )}

        {/* Chargement */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-[3px] border-sky-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">
              Chargement pour <span className="text-gray-800 font-semibold">{spot.name}</span>…
            </p>
          </div>
        )}

        {/* Erreur */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-600 font-semibold mb-3">{error}</p>
            <button
              onClick={() => load(spot)}
              className="px-5 py-2 bg-red-500 text-white rounded-xl text-sm font-medium"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Données */}
        {conditions && !loading && (
          <>
            <CurrentConditions
              conditions={conditions}
              spot={spot}
              isFavorite={isFavorite(spot.id)}
              onToggleFavorite={() => toggleFavorite(spot)}
            />
            <TideCard          spot={spot} />
            <WebcamCard        spot={spot} />
            <ForecastDays      conditions={conditions} spot={spot} />
            <ForecastChart     conditions={conditions} spot={spot} />
          </>
        )}
      </main>

      <footer className="max-w-2xl mx-auto px-4 pt-2 pb-8 text-center text-gray-400 text-xs space-y-1">
        <p>
          Données :{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-sky-500">
            Open-Meteo Marine
          </a>
          {' '}· Usage personnel uniquement
        </p>
      </footer>
    </div>
  );
}
