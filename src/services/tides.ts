/**
 * Service de marées — api-maree.fr (données SHOM/IFREMER, clé API gratuite)
 * Docs : https://api-maree.fr/
 */

import dayjs from 'dayjs';
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

export interface TideExtremum {
  time: string;
  height: number;
  kind: 'high' | 'low';
}

/**
 * Pleines et basses mers (extrema locaux) détectés dans la série de hauteurs.
 * Détecte un changement de tendance plutôt qu'un simple "plus grand que ses voisins" :
 * au sommet d'une marée, l'API renvoie souvent deux points consécutifs à la même
 * hauteur (plateau d'arrondi), ce qui fait échouer une comparaison stricte cur > next.
 */
export function findTideExtrema(points: TidePoint[]): TideExtremum[] {
  const extrema: TideExtremum[] = [];
  let trend = 0; // -1 descend, 1 monte, 0 indéterminé (plateau initial)
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].height - points[i - 1].height;
    if (diff === 0) continue; // plateau : on garde la tendance en cours
    const dir = diff > 0 ? 1 : -1;
    if (trend !== 0 && dir !== trend) {
      extrema.push({ time: points[i - 1].time, height: points[i - 1].height, kind: trend === 1 ? 'high' : 'low' });
    }
    trend = dir;
  }
  return extrema;
}

/** Regroupe les pleines/basses mers par jour (clé YYYY-MM-DD) */
export function groupTideExtremaByDay(points: TidePoint[]): Record<string, TideExtremum[]> {
  const grouped: Record<string, TideExtremum[]> = {};
  findTideExtrema(points).forEach(e => {
    const key = dayjs(e.time).format('YYYY-MM-DD');
    (grouped[key] ??= []).push(e);
  });
  return grouped;
}

function toLocalIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
