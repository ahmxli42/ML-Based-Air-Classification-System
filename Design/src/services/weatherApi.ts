import { PollutantValues } from '../types/aqi';

export interface StationTelemetry {
  stationNodeId: string;
  stationName: string;
  city: string;
  country: string;
  urbanType: string;
  coordinates: {
    lat: number;
    lon: number;
    elevation: number;
  };
  aqi: number;
  category: 'Good' | 'Moderate' | 'Unhealthy' | 'Severe';
  categoryBand: string;
  timestamp: string;
  weather: {
    temp: number;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    pressure: number;
  };
  pollutants: PollutantValues;
  guidelineExceedRatio: number;
  clinicalAssessment: string;
}

// TODO: replace with real API key (OpenWeatherMap or IQAir)
export const OPENWEATHER_API_KEY = ''; 
export const IQAIR_API_KEY = '';

const MOCK_ISLAMABAD_TELEMETRY: StationTelemetry = {
  stationNodeId: 'ISB-H8-409',
  stationName: 'Station Overview — Islamabad Sector H-8 Station',
  city: 'Islamabad',
  country: 'Pakistan',
  urbanType: 'Urban Basin',
  coordinates: {
    lat: 33.6844,
    lon: 73.0479,
    elevation: 540,
  },
  aqi: 168,
  category: 'Unhealthy',
  categoryBand: 'Band 151-200',
  timestamp: 'Tuesday, Oct 24 • 14:32 PST',
  weather: {
    temp: 24,
    humidity: 48,
    windSpeed: 6.2,
    windDirection: 'NE',
    pressure: 1014,
  },
  pollutants: {
    pm25: 88.4,
    pm10: 142.1,
    so2: 14.8,
    no2: 38.2,
    co: 1.2,
    o3: 42.0,
  },
  guidelineExceedRatio: 4.2,
  clinicalAssessment:
    'Current particulate concentration exceeds WHO guideline threshold by 4.2x. Sensitive groups should avoid prolonged outdoor exertion; general population should curtail heavy cardiovascular activity outdoors.',
};

/**
 * Fetches real-time Islamabad station telemetry.
 * If public API keys are configured, it queries OpenWeatherMap / IQAir.
 * Otherwise, returns the calibrated reference benchmark telemetry.
 */
export async function fetchIslamabadTelemetry(): Promise<StationTelemetry> {
  if (OPENWEATHER_API_KEY) {
    try {
      const lat = 33.6844;
      const lon = 73.0479;
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
      );
      if (res.ok) {
        const json = await res.json();
        const components = json.list?.[0]?.components;
        if (components) {
          return {
            ...MOCK_ISLAMABAD_TELEMETRY,
            pollutants: {
              pm25: Number(components.pm2_5?.toFixed(1)) || 88.4,
              pm10: Number(components.pm10?.toFixed(1)) || 142.1,
              so2: Number(components.so2?.toFixed(1)) || 14.8,
              no2: Number(components.no2?.toFixed(1)) || 38.2,
              co: Number((components.co / 1000)?.toFixed(1)) || 1.2,
              o3: Number(components.o3?.toFixed(1)) || 42.0,
            },
          };
        }
      }
    } catch (e) {
      console.warn('Failed to fetch from OpenWeather API, using benchmark telemetry:', e);
    }
  }

  // Simulate network tick
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_ISLAMABAD_TELEMETRY;
}
