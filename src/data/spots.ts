import type { SurfSpot } from '../types/surf';

export const SURF_SPOTS: SurfSpot[] = [
  {
    id: 'hossegor',
    name: 'Hossegor',
    location: 'Landes (40)',
    lat: 43.665,
    lng: -1.435,
    optimalSwellDirection: 285, // WNW
    optimalSwellWindow: 55,
    optimalWindDirection: 100,  // Vent d'est/ESE = offshore
    description: 'Célèbre beach break, une des meilleures vagues de France. Tubes puissants.',
    candhisStation: '40802',
  },
  {
    id: 'capbreton',
    name: 'Capbreton',
    location: 'Landes (40)',
    lat: 43.643,
    lng: -1.445,
    optimalSwellDirection: 270, // W
    optimalSwellWindow: 60,
    optimalWindDirection: 90,   // Vent d'est = offshore
    description: 'Beach break protégé par le gouf de Capbreton, filtre les grosses houles.',
    candhisStation: '40802',
  },
  {
    id: 'biarritz',
    name: 'Biarritz – Grande Plage',
    location: 'Pays Basque (64)',
    lat: 43.484,
    lng: -1.558,
    optimalSwellDirection: 290,
    optimalSwellWindow: 50,
    optimalWindDirection: 110,  // SE = offshore
    description: 'Vague emblématique, idéale pour tous niveaux. Ville surf emblématique.',
    candhisStation: '02911',
  },
  {
    id: 'lacanau',
    name: 'Lacanau',
    location: 'Gironde (33)',
    lat: 45.003,
    lng: -1.200,
    optimalSwellDirection: 280,
    optimalSwellWindow: 55,
    optimalWindDirection: 90,
    description: 'Beach break classique, accueille le Lacanau Pro chaque année.',
    candhisStation: '33801',
  },
  {
    id: 'mimizan',
    name: 'Mimizan',
    location: 'Landes (40)',
    lat: 44.212,
    lng: -1.280,
    optimalSwellDirection: 285, // WNW
    optimalSwellWindow: 55,
    optimalWindDirection: 95,   // E/ESE = offshore
    description: 'Beach break landais, moins fréquenté qu\'Hossegor, qualité similaire.',
    candhisStation: '40802',
  },
  {
    id: 'quiberon',
    name: 'Quiberon',
    location: 'Morbihan (56)',
    lat: 47.484,
    lng: -3.125,
    optimalSwellDirection: 250, // WSW
    optimalSwellWindow: 65,
    optimalWindDirection: 70,   // ENE = offshore
    description: 'Bretagne sud, spot venteux et puissant, souvent fermé en gros.',
    candhisStation: '56401',
  },
  {
    id: 'seignosse',
    name: 'Seignosse – Les Bourdaines',
    location: 'Landes (40)',
    lat: 43.718,
    lng: -1.451,
    optimalSwellDirection: 285,
    optimalSwellWindow: 55,
    optimalWindDirection: 105,
    description: 'Puissant beach break entre Hossegor et Capbreton.',
    candhisStation: '40802',
  },
];

/** Bouées du réseau CANDHIS (CEREMA) */
export const CANDHIS_STATIONS: Record<string, { name: string; lat: number; lng: number }> = {
  '02911': { name: 'Bouée Biscaye (Pays Basque)',    lat: 43.68, lng: -1.50 },
  '06401': { name: 'Bouée Cap Ferret (Gironde)',     lat: 44.45, lng: -1.80 },
  '33801': { name: 'Bouée Gironde',                  lat: 45.20, lng: -1.45 },
  '40802': { name: 'Bouée Landes (Hossegor)',        lat: 43.77, lng: -1.79 },
  '56401': { name: 'Bouée Belle-Île (Morbihan)',     lat: 47.28, lng: -3.22 },
  '44601': { name: 'Bouée Noirmoutier (Vendée)',     lat: 47.17, lng: -2.90 },
  '29280': { name: 'Bouée Iroise (Finistère)',       lat: 48.40, lng: -4.90 },
};
