/**
 * Service de marées — api-maree.fr (données SHOM/IFREMER, clé API gratuite)
 * Docs : https://api-maree.fr/
 */

import type { TidePoint } from '../components/TideChart';

const TIDE_BASE = 'https://api-maree.fr/water-levels';
const API_KEY = import.meta.env.VITE_TIDE_API_KEY as string | undefined;

interface WaterLevelsResponse {
  data: { time: string; height: number }[];
}

export async function fetchTideLevels(site: string, days = 3): Promise<TidePoint[]> {
  if (!API_KEY) throw new Error('Clé api-maree.fr manquante (VITE_TIDE_API_KEY)');

  const from = new Date();
  from.setMinutes(0, 0, 0);
  const to = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    site,
    from:  toLocalIso(from),
    to:    toLocalIso(to),
    step:  '20',
    tz:    'Europe/Paris',
    key:   API_KEY,
  });

  const res = await fetch(`${TIDE_BASE}?${params}`);
  if (!res.ok) throw new Error(`api-maree.fr: ${res.status} ${res.statusText}`);

  const json = await res.json() as WaterLevelsResponse;
  return json.data.map(d => ({ time: d.time, height: d.height }));
}

function toLocalIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
