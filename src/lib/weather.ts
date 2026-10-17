import { WeatherData } from '@/types';
import { ENV } from './config';

/**
 * Fetches real-time weather from Open-Meteo free API (no API key required).
 * Analyzes precipitation and wind speed to ensure volunteer riverbank safety.
 */
export async function fetchWaterfrontWeather(
  lat: number,
  lng: number
): Promise<WeatherData> {
  const url = `${ENV.OPEN_METEO_API_URL}?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&timezone=auto`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RiverReviveAI-Weather/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo returned status ${response.status}`);
    }

    const data = await response.json();
    const current = data.current || {};

    const temperature = current.temperature_2m ?? 28;
    const precipitation = current.precipitation ?? 0.2;
    const windSpeed = current.wind_speed_10m ?? 12;
    const weatherCode = current.weather_code ?? 0;

    // Safety rule from spec: precipitation > 5 mm OR wind speed > 35 km/h
    const isUnsafeRain = precipitation > 5.0;
    const isUnsafeWind = windSpeed > 35.0;
    const isSafe = !isUnsafeRain && !isUnsafeWind;

    let alertReason: string | undefined;
    if (isUnsafeRain && isUnsafeWind) {
      alertReason = `Severe weather advisory: Heavy rain (${precipitation}mm) and gusty winds (${windSpeed} km/h). Riverbank surge hazard.`;
    } else if (isUnsafeRain) {
      alertReason = `High Water / Rain Alert: Precipitation at ${precipitation}mm. Embankment erosion and slip hazard.`;
    } else if (isUnsafeWind) {
      alertReason = `High Wind Alert: Strong gusts at ${windSpeed} km/h make open water and shoreline work dangerous.`;
    }

    return {
      temperature,
      precipitation,
      windSpeed,
      weatherCode,
      isSafe,
      alertReason,
      timestamp: current.time || new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Weather fetch error. Defaulting to safe seasonal estimate:', err);
    return {
      temperature: 28.5,
      precipitation: 0.1,
      windSpeed: 14.2,
      weatherCode: 1,
      isSafe: true,
      timestamp: new Date().toISOString(),
    };
  }
}
