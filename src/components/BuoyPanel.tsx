import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import type { BuoyMeasurement } from '../types/surf';
import { fetchCandhisData } from '../services/candhis';
import { CANDHIS_STATIONS } from '../data/spots';

interface Props {
  defaultStation?: string;
}

export function BuoyPanel({ defaultStation = '02911' }: Props) {
  const [selectedStation, setSelectedStation] = useState(defaultStation);
  const [data, setData]       = useState<BuoyMeasurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    const station = CANDHIS_STATIONS[selectedStation];
    if (!station) return;

    setLoading(true);
    setError(null);

    fetchCandhisData(selectedStation, station.name)
      .then(setData)
      .catch(err => setError(String(err?.message ?? err)))
      .finally(() => setLoading(false));
  }, [selectedStation]);

  const latest = data[0];

  return (
    <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h2 className="text-white font-bold text-lg">Données bouée (CANDHIS)</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Mesures in situ — Réseau CANDHIS / CEREMA
          </p>
        </div>
        <select
          value={selectedStation}
          onChange={e => setSelectedStation(e.target.value)}
          className="bg-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-cyan-500"
        >
          {Object.entries(CANDHIS_STATIONS).map(([id, s]) => (
            <option key={id} value={id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Spinner */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Erreur — probablement CORS en prod */}
      {!loading && error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-sm">
          <p className="text-red-300 font-semibold mb-1">⚠️ Données bouée indisponibles</p>
          <p className="text-red-400/80 text-xs mb-3">
            {error}
          </p>
          <p className="text-slate-400 text-xs">
            <strong className="text-slate-300">En développement :</strong> le proxy Vite doit être actif (<code>npm run dev</code>).<br />
            <strong className="text-slate-300">En production :</strong> configurez un reverse proxy nginx vers{' '}
            <code className="text-cyan-400">https://candhis.cerema.fr</code>.
          </p>
        </div>
      )}

      {/* Données OK — mesure la plus récente */}
      {!loading && !error && latest && (
        <>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
            {[
              { label: 'Hm0',  value: `${latest.hm0.toFixed(2)} m`,  color: 'text-cyan-400'   },
              { label: 'Hmax', value: `${latest.hmax.toFixed(2)} m`, color: 'text-blue-400'   },
              { label: 'Tm01', value: `${latest.tm01.toFixed(1)} s`, color: 'text-indigo-400' },
              { label: 'Tm02', value: `${latest.tm02.toFixed(1)} s`, color: 'text-violet-400' },
              { label: 'Tp',   value: `${latest.tp.toFixed(1)} s`,   color: 'text-purple-400' },
              { label: 'Dir',  value: `${latest.dir.toFixed(0)}°`,   color: 'text-pink-400'   },
            ].map(m => (
              <div key={m.label} className="bg-slate-700 rounded-xl p-3 text-center">
                <p className="text-slate-400 text-xs mb-1">{m.label}</p>
                <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          <p className="text-slate-500 text-xs mb-4">
            Dernière mesure : {dayjs(latest.time).format('DD/MM/YYYY HH:mm')} UTC
          </p>

          {/* Historique des 10 dernières mesures */}
          {data.length > 1 && (
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Historique récent</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-400 min-w-[340px]">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-500 text-left">
                      <th className="py-2 pr-4">Date / Heure</th>
                      <th className="py-2 text-center">Hm0</th>
                      <th className="py-2 text-center">Tp</th>
                      <th className="py-2 text-center">Dir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 10).map((d, i) => (
                      <tr key={i} className="border-b border-slate-700/40">
                        <td className="py-1.5 pr-4">{dayjs(d.time).format('DD/MM HH:mm')}</td>
                        <td className="py-1.5 text-center text-cyan-400">{d.hm0.toFixed(2)} m</td>
                        <td className="py-1.5 text-center text-blue-400">{d.tp.toFixed(1)} s</td>
                        <td className="py-1.5 text-center text-indigo-400">{d.dir.toFixed(0)}°</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !error && !latest && (
        <p className="text-slate-500 text-sm text-center py-6">
          Aucune donnée disponible pour cette bouée.
        </p>
      )}
    </div>
  );
}
