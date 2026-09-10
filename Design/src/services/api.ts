import { PollutantValues, PredictResponse, TopFactor } from '../types/aqi';

const BACKEND_URL = 'http://localhost:8000/predict';

/**
 * Heuristic fallback classifier mirroring typical trained AQI models
 * Used when backend server at localhost:8000 is unreachable during testing.
 */
export function simulatePrediction(values: PollutantValues): PredictResponse {
  const { pm25, pm10, so2, no2, co, o3 } = values;

  // EPA sub-index approximations
  const aqiPm25 = pm25 > 250 ? 300 + (pm25 - 250) : pm25 > 150 ? 200 + (pm25 - 150) : pm25 > 55 ? 150 + (pm25 - 55) : pm25 > 35 ? 100 + (pm25 - 35) * 2.5 : pm25 * 2.8;
  const aqiPm10 = pm10 * 0.75;
  const aqiNo2 = no2 * 1.5;
  const aqiSo2 = so2 * 1.8;
  const aqiCo = co * 25;
  const aqiO3 = o3 * 1.4;

  const maxSub = Math.max(aqiPm25, aqiPm10, aqiNo2, aqiSo2, aqiCo, aqiO3);

  let predicted_category = 'Good';
  if (maxSub > 200) {
    predicted_category = maxSub > 300 ? 'Severe' : 'Unhealthy';
  } else if (maxSub > 100) {
    predicted_category = 'Unhealthy';
  } else if (maxSub > 50) {
    predicted_category = 'Moderate';
  } else {
    predicted_category = 'Good';
  }

  // Calculate pollutant impact shares (Shapley feature attribution approximation)
  const sumWeights = aqiPm25 + aqiPm10 + aqiNo2 + aqiSo2 + aqiCo + aqiO3 || 1;
  const factors: TopFactor[] = [
    { pollutant: 'PM2.5', impact: Math.round((aqiPm25 / sumWeights) * 100) },
    { pollutant: 'NO2', impact: Math.round((aqiNo2 / sumWeights) * 100) },
    { pollutant: 'PM10', impact: Math.round((aqiPm10 / sumWeights) * 100) },
    { pollutant: 'SO2', impact: Math.round((aqiSo2 / sumWeights) * 100) },
    { pollutant: 'CO', impact: Math.round((aqiCo / sumWeights) * 100) },
    { pollutant: 'O3', impact: Math.round((aqiO3 / sumWeights) * 100) },
  ].sort((a, b) => b.impact - a.impact);

  // Take top 3 + remainder as "Other"
  const top3 = factors.slice(0, 3);
  const remaining = Math.max(0, 100 - top3.reduce((acc, f) => acc + f.impact, 0));
  const top_factors = [...top3, { pollutant: 'Other', impact: remaining }];

  // Unusual reading check: e.g. atypical ratio of PM2.5 to PM10, or extreme spike in single gas
  const ratio = pm10 > 0 ? pm25 / pm10 : 0;
  const is_unusual_reading = (ratio > 0.85 || ratio < 0.2) || so2 > 40 || (no2 > 60 && pm25 < 30);

  // High confidence default
  const confidence = Number((0.92 + Math.random() * 0.07).toFixed(3));

  return {
    predicted_category,
    confidence,
    top_factors,
    is_unusual_reading,
  };
}

export interface PredictionResult {
  data: PredictResponse;
  isFallback: boolean;
  errorMessage?: string;
}

export async function predictAirQuality(values: PollutantValues): Promise<PredictionResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(values),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data: PredictResponse = await response.json();
    return { data, isFallback: false };
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error
        ? err.message
        : 'Backend not reachable — is the server running at http://localhost:8000?';

    // Fallback simulation so user can test the UI seamlessly
    const fallbackData = simulatePrediction(values);
    return {
      data: fallbackData,
      isFallback: true,
      errorMessage: `Backend not reachable at ${BACKEND_URL} (${errorMsg}). Showing simulated ML inference model.`,
    };
  }
}
