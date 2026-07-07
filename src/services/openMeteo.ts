/**
 * Service Open-Meteo Marine
 * Docs : https://open-meteo.com/en/docs/marine-weather-api
 *
 * Aucune clé API requise, couverture mondiale, mise à jour toutes les heures.
 * Combine le modèle de vagues ERA5/GFS et les prévisions atmosphériques.
 */

import type { MarineConditions } from '../types/surf';

const MARINE_BASE  = 'https://marine-api.open-meteo.com/v1/marine';
const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';

export async function fetchMarineConditions(lat: number, lng: number): Promise<MarineConditions> {
  const marineParams = new URLSearchParams({
    latitude:  lat.toString(),
    longitude: lng.toString(),
    hourly: [
      'wave_height',
      'wave_direction',
      'wave_period',
      'swell_wave_height',
      'swell_wave_direction',
      'swell_wave_period',
      'wind_wave_height',
      'wind_wave_direction',
      'wind_wave_period',
      'sea_surface_temperature',
    ].join(','),
    timezone:      'Europe/Paris',
    forecast_days: '7',
  });

  const weatherParams = new URLSearchParams({
    latitude:        lat.toString(),
    longitude:       lng.toString(),
    hourly:          'wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    wind_speed_unit: 'kmh',
    timezone:        'Europe/Paris',
    forecast_days:   '7',
  });

  const [marineRes, weatherRes] = await Promise.all([
    fetch(`${MARINE_BASE}?${marineParams}`),
    fetch(`${WEATHER_BASE}?${weatherParams}`),
  ]);

  if (!marineRes.ok)  throw new Error(`Marine API: ${marineRes.status} ${marineRes.statusText}`);
  if (!weatherRes.ok) throw new Error(`Weather API: ${weatherRes.status} ${weatherRes.statusText}`);

  const marine  = await marineRes.json() as OpenMeteoMarineResponse;
  const weather = await weatherRes.json() as OpenMeteoWeatherResponse;

  return {
    time:              marine.hourly.time,
    waveHeight:        marine.hourly.wave_height,
    wavePeriod:        marine.hourly.wave_period,
    waveDirection:     marine.hourly.wave_direction,
    swellWaveHeight:   marine.hourly.swell_wave_height,
    swellWavePeriod:   marine.hourly.swell_wave_period,
    swellWaveDirection: marine.hourly.swell_wave_direction,
    windWaveHeight:    marine.hourly.wind_wave_height,
    windSpeed:         weather.hourly.wind_speed_10m,
    windDirection:     weather.hourly.wind_direction_10m,
    windGusts:         weather.hourly.wind_gusts_10m,
    seaSurfaceTemperature: marine.hourly.sea_surface_temperature,
  };
}

// ---------------------------------------------------------------------------
// Types internes (réponses JSON brutes de l'API)
// ---------------------------------------------------------------------------

interface OpenMeteoMarineResponse {
  hourly: {
    time:                  string[];
    wave_height:           (number | null)[];
    wave_direction:        (number | null)[];
    wave_period:           (number | null)[];
    swell_wave_height:     (number | null)[];
    swell_wave_direction:  (number | null)[];
    swell_wave_period:     (number | null)[];
    wind_wave_height:      (number | null)[];
    wind_wave_direction:   (number | null)[];
    wind_wave_period:      (number | null)[];
    sea_surface_temperature: (number | null)[];
  };
}

interface OpenMeteoWeatherResponse {
  hourly: {
    time:               string[];
    wind_speed_10m:     (number | null)[];
    wind_direction_10m: (number | null)[];
    wind_gusts_10m:     (number | null)[];
  };
}
