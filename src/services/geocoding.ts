/**
 * Service de recherche de lieux — Open-Meteo Geocoding API
 * Docs : https://open-meteo.com/en/docs/geocoding-api
 * Aucune clé API requise.
 */

import type { SurfSpot } from '../types/surf';

const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search';

export interface GeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
  admin2?: string;
}

interface GeocodingResponse {
  results?: GeocodeResult[];
}

export async function searchSpots(query: string): Promise<GeocodeResult[]> {
  if (query.trim().length < 2) return [];

  const params = new URLSearchParams({
    name:     query.trim(),
    count:    '8',
    language: 'fr',
    format:   'json',
  });

  const res = await fetch(`${GEOCODING_BASE}?${params}`);
  if (!res.ok) throw new Error(`Geocoding API: ${res.status} ${res.statusText}`);

  const data = await res.json() as GeocodingResponse;
  return data.results ?? [];
}

function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

/** Distance approximative en km (suffisant pour repérer un même spot) */
function roughDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat1 - lat2) * 111;
  const dLng = (lng1 - lng2) * 111 * Math.cos((lat1 * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Si le résultat de recherche correspond à un spot déjà curaté (par nom ou proximité),
 * on renvoie ce spot tel quel — pour garder sa note calibrée et sa webcam déjà trouvée.
 */
export function findCuratedSpot(result: GeocodeResult, curated: SurfSpot[]): SurfSpot | undefined {
  const resultName = normalize(result.name);
  return curated.find(spot => {
    const spotName = normalize(spot.name);
    const namesMatch = spotName.startsWith(resultName) || resultName.startsWith(spotName);
    const distance = roughDistanceKm(spot.lat, spot.lng, result.latitude, result.longitude);
    // Un nom identique ne suffit pas (ex: deux villages "Lacanau" à l'autre bout de la France) :
    // il faut aussi être dans la même zone. Une proximité très forte suffit même sans nom identique.
    return (namesMatch && distance < 200) || distance < 20;
  });
}

/**
 * Valeurs par défaut appliquées à un spot personnalisé (hors liste curatée) :
 * on ne connaît pas son orientation réelle, donc la note sera approximative.
 */
export function geocodeResultToSpot(result: GeocodeResult): SurfSpot {
  return {
    id: `custom-${result.id}`,
    name: result.name,
    location: [result.admin2, result.admin1].filter(Boolean).join(', ') || result.country || '',
    lat: result.latitude,
    lng: result.longitude,
    optimalSwellDirection: 270, // Ouest — hypothèse par défaut, à défaut de donnée réelle
    optimalSwellWindow: 70,     // tolérance large car orientation du spot inconnue
    optimalWindDirection: 90,   // Est — hypothèse par défaut (offshore générique côte atlantique)
    description: 'Spot ajouté par recherche — orientation approximative, non calibrée.',
  };
}
