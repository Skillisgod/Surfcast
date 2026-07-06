/**
 * Service données bouées CANDHIS (CEREMA)
 * https://candhis.cerema.fr
 *
 * CANDHIS est le réseau français de mesure de houle in situ.
 * Les données sont en CSV, nécessitent un proxy pour éviter les erreurs CORS.
 *
 * En développement : le proxy Vite (/api/candhis → candhis.cerema.fr) est configuré dans vite.config.ts
 * En production   : mettre en place nginx ou un reverse proxy équivalent
 */

import type { BuoyMeasurement } from '../types/surf';

/** Encode l'identifiant de campagne en base64 tel qu'attendu par l'API CANDHIS */
function encodeCampagne(stationId: string): string {
  return btoa(`campagneId=${stationId}`);
}

export async function fetchCandhisData(
  stationId: string,
  stationName: string,
): Promise<BuoyMeasurement[]> {
  const encoded = encodeCampagne(stationId);
  // En dev, Vite proxifie /api/candhis → https://candhis.cerema.fr
  const url = `/api/candhis/_public_/campagne.php?${encoded}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  return parseCandhisCsv(text, stationId, stationName);
}

// ---------------------------------------------------------------------------
// Parsing CSV CANDHIS
// Colonnes attendues : Date/Heure | Hm0 | HmaxH | Tm01 | Tm02 | Tp | Dir [| QF]
// Séparateur : point-virgule, décimale : point ou virgule
// ---------------------------------------------------------------------------

function parseFrenchFloat(s: string): number {
  return parseFloat(s.replace(',', '.').trim());
}

function parseCandhisCsv(
  csv: string,
  stationId: string,
  stationName: string,
): BuoyMeasurement[] {
  const lines = csv.trim().split(/\r?\n/);

  // Cherche la ligne d'en-tête (contient "Hm0" ou "hm0")
  const headerIdx = lines.findIndex(l => /hm0/i.test(l));
  if (headerIdx === -1) return [];

  const dataLines = lines.slice(headerIdx + 1);
  const measurements: BuoyMeasurement[] = [];

  for (const line of dataLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const cols = trimmed.split(/[;\t]/).map(c => c.trim());
    if (cols.length < 6) continue;

    const [dateStr, hm0Str, hmaxStr, tm01Str, tm02Str, tpStr, dirStr] = cols;

    const hm0  = parseFrenchFloat(hm0Str);
    const tp   = parseFrenchFloat(tpStr);
    if (isNaN(hm0) || isNaN(tp)) continue;

    measurements.push({
      stationId,
      stationName,
      time: dateStr,
      hm0,
      hmax: parseFrenchFloat(hmaxStr) || hm0 * 1.6,
      tm01: parseFrenchFloat(tm01Str) || tp * 0.75,
      tm02: parseFrenchFloat(tm02Str) || tp * 0.8,
      tp,
      dir:  parseFrenchFloat(dirStr ?? '0') || 0,
    });
  }

  // Retourne les 48 dernières mesures (les plus récentes en premier)
  return measurements.reverse().slice(0, 48);
}
