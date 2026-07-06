import type { SurfSpot } from '../types/surf';

// ---------------------------------------------------------------------------
// Utilitaires géométriques
// ---------------------------------------------------------------------------

/** Différence angulaire absolue entre deux angles (0-180°) */
export function angleDifference(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Convertit des degrés en label cardinal (16 directions) */
export function directionLabel(degrees: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  const idx = Math.round(((degrees % 360) + 360) / 22.5) % 16;
  return dirs[idx];
}

// ---------------------------------------------------------------------------
// Sous-scores (chaque score a un plafond documenté)
// ---------------------------------------------------------------------------

/** Score hauteur : 0–35 pts
 *  Idéal 1.5–2.5 m, pénalité en dessous et au-dessus
 */
export function scoreWaveHeight(hm0: number): number {
  if (hm0 < 0.3)  return 0;
  if (hm0 < 0.5)  return Math.round((hm0 - 0.3) / 0.2 * 10);
  if (hm0 < 1.0)  return Math.round(10 + (hm0 - 0.5) / 0.5 * 15);
  if (hm0 < 1.5)  return Math.round(25 + (hm0 - 1.0) / 0.5 * 7);
  if (hm0 < 2.5)  return 35;
  if (hm0 < 3.5)  return Math.round(35 - (hm0 - 2.5) / 1.0 * 14);
  if (hm0 < 5.0)  return Math.round(21 - (hm0 - 3.5) / 1.5 * 14);
  return 5;
}

/** Score période pic : 0–25 pts
 *  >15s = longue période = swell d'océan = qualité maximale
 */
export function scoreWavePeriod(tp: number): number {
  if (tp < 5)   return 0;
  if (tp < 7)   return Math.round((tp - 5) / 2 * 5);
  if (tp < 10)  return Math.round(5 + (tp - 7) / 3 * 10);
  if (tp < 12)  return Math.round(15 + (tp - 10) / 2 * 5);
  if (tp < 15)  return Math.round(20 + (tp - 12) / 3 * 5);
  return 25;
}

/** Score vent : 0–20 pts — tient compte de la direction par rapport au spot
 *  windSpeedKmh : vitesse en km/h
 */
export function scoreWind(windSpeedKmh: number, windDir: number, spot: SurfSpot): number {
  const diff = angleDifference(windDir, spot.optimalWindDirection);

  // Base selon orientation vent/spot
  let base: number;
  if (diff < 60)       base = 20;  // offshore ✓
  else if (diff < 120) base = 12;  // cross-shore
  else                 base = 5;   // onshore ✗

  // Pénalité progressive pour vent fort (calibrée en km/h, ~0.243 = 0.45/1.852)
  const penalty = Math.min(base, windSpeedKmh * 0.243);
  return Math.max(0, Math.round(base - penalty));
}

/** Score direction houle : 0–10 pts */
export function scoreSwellDirection(swellDir: number, spot: SurfSpot): number {
  const diff = angleDifference(swellDir, spot.optimalSwellDirection);
  if (diff < spot.optimalSwellWindow / 3)   return 10;
  if (diff < spot.optimalSwellWindow / 2)   return 8;
  if (diff < spot.optimalSwellWindow)       return 5;
  if (diff < spot.optimalSwellWindow * 1.5) return 2;
  return 0;
}

/** Score propreté : 0–10 pts
 *  Ratio houle primaire / hauteur totale.
 *  Plus le swell domine par rapport au clapot (wind waves), meilleures sont les faces.
 */
export function scoreCleanliness(swellHeight: number, totalHeight: number): number {
  if (totalHeight < 0.1) return 5; // données insuffisantes
  const ratio = Math.min(1, swellHeight / totalHeight);
  if (ratio >= 0.90) return 10;
  if (ratio >= 0.75) return Math.round(8 + (ratio - 0.75) / 0.15 * 2);
  if (ratio >= 0.60) return Math.round(5 + (ratio - 0.60) / 0.15 * 3);
  if (ratio >= 0.45) return Math.round(2 + (ratio - 0.45) / 0.15 * 3);
  if (ratio >= 0.25) return Math.round((ratio - 0.25) / 0.20 * 2);
  return 0;
}

// ---------------------------------------------------------------------------
// Score global
// ---------------------------------------------------------------------------

export interface SurfScore {
  total: number;
  heightScore: number;
  periodScore: number;
  windScore: number;
  directionScore: number;
  cleannessScore: number;
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
}

export function calculateSurfScore(
  waveHeight: number,
  wavePeriod: number,
  windSpeedKmh: number,
  windDirection: number,
  swellDirection: number,
  spot: SurfSpot,
  /** Hauteur de la houle primaire (m) — permet de calculer la propreté */
  swellHeight?: number,
): SurfScore {
  const heightScore    = scoreWaveHeight(waveHeight);
  const periodScore    = scoreWavePeriod(wavePeriod);
  const windScore      = scoreWind(windSpeedKmh, windDirection, spot);
  const directionScore = scoreSwellDirection(swellDirection, spot);
  const cleannessScore = swellHeight != null
    ? scoreCleanliness(swellHeight, waveHeight)
    : 5; // valeur neutre si non fournie

  const total = Math.min(100, heightScore + periodScore + windScore + directionScore + cleannessScore);

  let label: string;
  let color: string;
  let bgColor: string;
  let emoji: string;

  if (total >= 80) {
    label = 'Épique';    color = '#10b981'; bgColor = '#10b98120'; emoji = '🔥';
  } else if (total >= 65) {
    label = 'Excellent'; color = '#22c55e'; bgColor = '#22c55e20'; emoji = '✅';
  } else if (total >= 50) {
    label = 'Bon';       color = '#84cc16'; bgColor = '#84cc1620'; emoji = '👍';
  } else if (total >= 35) {
    label = 'Passable';  color = '#f59e0b'; bgColor = '#f59e0b20'; emoji = '⚠️';
  } else if (total >= 18) {
    label = 'Médiocre';  color = '#ef4444'; bgColor = '#ef444420'; emoji = '👎';
  } else {
    label = 'Nul/Plat';  color = '#6b7280'; bgColor = '#6b728020'; emoji = '😴';
  }

  return { total, heightScore, periodScore, windScore, directionScore, cleannessScore, label, color, bgColor, emoji };
}
