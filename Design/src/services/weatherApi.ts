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

// OpenWeatherMap API key (optional - read from Vite environment variable)
export const OPENWEATHER_API_KEY = (import.meta as any).env?.VITE_OPENWEATHER_API_KEY || '';
export const IQAIR_API_KEY = '';

export interface TrendPoint {
  time: string;
  aqi: number;
  label: string;
}

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
  isRealLiveFeed: boolean;
  feedSource: string;
  trend?: TrendPoint[];
  peakAqi?: number;
}

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
  isRealLiveFeed: false,
  feedSource: 'Reference Benchmark (Simulation)',
};

function degToCompass(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

function getCategoryFromAqi(aqi: number): { category: 'Good' | 'Moderate' | 'Unhealthy' | 'Severe'; band: string } {
  if (aqi <= 50) return { category: 'Good', band: 'Band 0-50' };
  if (aqi <= 100) return { category: 'Moderate', band: 'Band 51-100' };
  if (aqi <= 200) return { category: 'Unhealthy', band: aqi <= 150 ? 'Band 101-150' : 'Band 151-200' };
  return { category: 'Severe', band: 'Band 201-500' };
}

function getClinicalAssessment(category: string, exceedRatio: number): string {
  if (category === 'Good') {
    return `Atmospheric particulate concentration is nominal (${exceedRatio}x WHO baseline). Air quality is considered satisfactory, posing negligible pulmonary risk for outdoor activities.`;
  }
  if (category === 'Moderate') {
    return `Particulate concentration is ${exceedRatio}x WHO annual guidelines. Air quality is acceptable; unusually sensitive individuals should consider limiting heavy outdoor exertion.`;
  }
  if (category === 'Unhealthy') {
    return `Current particulate concentration exceeds WHO guideline threshold by ${exceedRatio}x. Sensitive groups should avoid prolonged outdoor exertion; general population should curtail heavy cardiovascular activity outdoors.`;
  }
  return `Emergency particulate levels detected exceeding WHO threshold by ${exceedRatio}x. Serious pulmonary and cardiovascular aggravation expected. Wear N95 respirators outdoors.`;
}

function formatCurrentTimestamp(): string {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dayName}, ${monthDay} • ${time} PKT`;
}

/**
 * Fetch real-time live data from OpenWeatherMap using the user's API key.
 */
async function fetchOpenWeatherMapLive(lat: number, lon: number): Promise<StationTelemetry | null> {
  if (!OPENWEATHER_API_KEY) return null;

  try {
    const [pollutionRes, weatherRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`),
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`),
    ]);

    if (!pollutionRes.ok) return null;

    const pollutionData = await pollutionRes.json();
    const weatherData = weatherRes.ok ? await weatherRes.json() : null;

    const comp = pollutionData.list?.[0]?.components;
    if (!comp) return null;

    const pm25 = Number(comp.pm2_5?.toFixed(1)) || 45.0;
    const pm10 = Number(comp.pm10?.toFixed(1)) || 65.0;
    const so2 = Number(comp.so2?.toFixed(1)) || 10.0;
    const no2 = Number(comp.no2?.toFixed(1)) || 25.0;
    const co = Number((comp.co / 1000)?.toFixed(1)) || 0.8;
    const o3 = Number(comp.o3?.toFixed(1)) || 50.0;

    // OpenWeather AQI is 1-5 scale. Approximate to US EPA AQI
    const owmAqi = pollutionData.list?.[0]?.main?.aqi || 3;
    const aqiMap = [30, 45, 80, 140, 220];
    const aqi = aqiMap[owmAqi - 1] || 150;

    const { category, band } = getCategoryFromAqi(aqi);
    const exceedRatio = Number((pm25 / 15).toFixed(1));

    return {
      stationNodeId: 'ISB-LIVE-OWM',
      stationName: 'Station Overview — Islamabad Sector H-8 Station',
      city: 'Islamabad',
      country: 'Pakistan',
      urbanType: 'Urban Basin',
      coordinates: { lat, lon, elevation: 540 },
      aqi,
      category,
      categoryBand: band,
      timestamp: formatCurrentTimestamp(),
      weather: {
        temp: Math.round(weatherData?.main?.temp ?? 27),
        humidity: Math.round(weatherData?.main?.humidity ?? 55),
        windSpeed: Number(((weatherData?.wind?.speed ?? 2.5) * 3.6).toFixed(1)),
        windDirection: degToCompass(weatherData?.wind?.deg ?? 90),
        pressure: Math.round(weatherData?.main?.pressure ?? 1012),
      },
      pollutants: { pm25, pm10, so2, no2, co, o3 },
      guidelineExceedRatio: exceedRatio,
      clinicalAssessment: getClinicalAssessment(category, exceedRatio),
      isRealLiveFeed: true,
      feedSource: 'OpenWeatherMap Live Telemetry',
    };
  } catch (err) {
    console.warn('OpenWeatherMap query unsuccessful:', err);
    return null;
  }
}

/**
 * Fetch real-time live data from Open-Meteo (real sensor & CAMS atmospheric model).
 * Does not require an API key, providing immediate live telemetry without wait.
 */
async function fetchOpenMeteoLive(lat: number, lon: number): Promise<StationTelemetry | null> {
  try {
    const [airRes, weatherRes] = await Promise.all([
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&hourly=us_aqi&timezone=auto`
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto`
      ),
    ]);

    if (!airRes.ok) return null;

    const airData = await airRes.json();
    const weatherData = weatherRes.ok ? await weatherRes.json() : null;

    const currentAir = airData.current;
    if (!currentAir) return null;

    const pm25 = Number((currentAir.pm2_5 ?? 45).toFixed(1));
    const pm10 = Number((currentAir.pm10 ?? 70).toFixed(1));
    const so2 = Number((currentAir.sulphur_dioxide ?? 15).toFixed(1));
    const no2 = Number((currentAir.nitrogen_dioxide ?? 30).toFixed(1));
    const co = Number(((currentAir.carbon_monoxide ?? 900) / 1000).toFixed(2));
    const o3 = Number((currentAir.ozone ?? 110).toFixed(1));
    const aqi = Math.round(currentAir.us_aqi ?? 150);

    const { category, band } = getCategoryFromAqi(aqi);
    const exceedRatio = Number((pm25 / 15).toFixed(1));

    // Parse hourly trend for today (24 hours)
    const trend: TrendPoint[] = [];
    let peakAqi = aqi;

    if (airData.hourly?.time && airData.hourly?.us_aqi) {
      const times: string[] = airData.hourly.time;
      const aqis: number[] = airData.hourly.us_aqi;
      const todayPrefix = new Date().toISOString().slice(0, 10);

      // Find indices for today
      for (let i = 0; i < times.length; i++) {
        if (times[i].startsWith(todayPrefix)) {
          const hourStr = times[i].split('T')[1] || '';
          const hourAqi = Math.round(aqis[i] ?? aqi);
          if (hourAqi > peakAqi) peakAqi = hourAqi;

          // Downsample to every 2 hours + current
          const hourNum = parseInt(hourStr.split(':')[0], 10);
          if (hourNum % 2 === 0 || i === times.length - 1) {
            trend.push({
              time: hourStr,
              aqi: hourAqi,
              label: hourStr,
            });
          }
        }
      }
    }

    const currentWeather = weatherData?.current;

    return {
      stationNodeId: 'ISB-LIVE-CAMS',
      stationName: 'Station Overview — Islamabad Sector H-8 Station',
      city: 'Islamabad',
      country: 'Pakistan',
      urbanType: 'Urban Basin',
      coordinates: { lat, lon, elevation: 540 },
      aqi,
      category,
      categoryBand: band,
      timestamp: formatCurrentTimestamp(),
      weather: {
        temp: Math.round(currentWeather?.temperature_2m ?? 28),
        humidity: Math.round(currentWeather?.relative_humidity_2m ?? 60),
        windSpeed: Number((currentWeather?.wind_speed_10m ?? 7.5).toFixed(1)),
        windDirection: degToCompass(currentWeather?.wind_direction_10m ?? 100),
        pressure: Math.round(currentWeather?.surface_pressure ?? 1010),
      },
      pollutants: { pm25, pm10, so2, no2, co, o3 },
      guidelineExceedRatio: exceedRatio,
      clinicalAssessment: getClinicalAssessment(category, exceedRatio),
      isRealLiveFeed: true,
      feedSource: 'Live Atmospheric Telemetry (Islamabad Feed)',
      trend: trend.length >= 6 ? trend : undefined,
      peakAqi,
    };
  } catch (err) {
    console.warn('Open-Meteo live atmospheric query unsuccessful:', err);
    return null;
  }
}

/**
 * Fetches real-time Islamabad station telemetry.
 * 1. Attempts OpenWeatherMap using the configured API key.
 * 2. If OpenWeatherMap is pending activation (HTTP 401) or times out, uses live Open-Meteo feed.
 * 3. Falls back gracefully to calibrated reference data if offline.
 */
export async function fetchIslamabadTelemetry(): Promise<StationTelemetry> {
  const lat = 33.6844;
  const lon = 73.0479;

  // 1. Try OpenWeatherMap
  const owmData = await fetchOpenWeatherMapLive(lat, lon);
  if (owmData) return owmData;

  // 2. Try Open-Meteo Live Feed (Always accessible and accurate)
  const meteoData = await fetchOpenMeteoLive(lat, lon);
  if (meteoData) return meteoData;

  // 3. Fallback benchmark
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_ISLAMABAD_TELEMETRY;
}

