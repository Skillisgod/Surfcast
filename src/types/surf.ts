// Types partagés pour les données de surf

export interface SurfSpot {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  /** Direction de houle idéale (degrés, ex: 285 = WNW) */
  optimalSwellDirection: number;
  /** Tolérance angulaire autour de la direction idéale */
  optimalSwellWindow: number;
  /** Direction de vent offshore pour ce spot */
  optimalWindDirection: number;
  description: string;
  /** ID station CANDHIS la plus proche */
  candhisStation?: string;
}

export interface MarineConditions {
  time: string[];
  waveHeight: (number | null)[];
  wavePeriod: (number | null)[];
  waveDirection: (number | null)[];
  swellWaveHeight: (number | null)[];
  swellWavePeriod: (number | null)[];
  swellWaveDirection: (number | null)[];
  windWaveHeight: (number | null)[];
  windSpeed: (number | null)[];
  windDirection: (number | null)[];
  windGusts: (number | null)[];
}

export interface BuoyMeasurement {
  stationId: string;
  stationName: string;
  time: string;
  /** Hauteur significative des vagues (m) */
  hm0: number;
  /** Hauteur maximale (m) */
  hmax: number;
  /** Période moyenne (s) */
  tm01: number;
  /** Période (s) */
  tm02: number;
  /** Période pic (s) */
  tp: number;
  /** Direction de provenance (°) */
  dir: number;
}
