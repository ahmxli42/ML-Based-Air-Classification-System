export interface PollutantValues {
  pm25: number;
  pm10: number;
  so2: number;
  no2: number;
  co: number;
  o3: number;
}

export interface TopFactor {
  pollutant: string;
  impact: number; // Percentage or fraction, e.g. 52 for 52%
}

export interface PredictRequest {
  pm25: number;
  pm10: number;
  so2: number;
  no2: number;
  co: number;
  o3: number;
}

export interface PredictResponse {
  predicted_category: string; // "Good" | "Moderate" | "Unhealthy" | "Severe" | "Hazardous"
  confidence: number; // 0 to 1
  top_factors: TopFactor[];
  is_unusual_reading: boolean;
}

export interface HistoryRecord {
  id: string; // e.g. "#AQ-9421"
  timestamp: string; // e.g. "Oct 24, 2024 • 14:15 PST"
  isoTimestamp: string;
  stationName: string; // e.g. "Islamabad Sector H-8"
  nodeId: string; // e.g. "ISB-H8-409"
  locationTag?: string; // e.g. "Urban Stationary Node"
  coordinates?: string; // e.g. "Lat 33.6844° N, Lon 73.0479° E"
  pollutants: PollutantValues;
  predicted_category: string;
  confidence: number;
  top_factors: TopFactor[];
  is_unusual_reading: boolean;
  anomalyFlag?: string;
  executionTimeMs?: number;
  hash?: string;
}

export interface PresetArchetype {
  id: string;
  name: string;
  description: string;
  targetAqi: number;
  values: PollutantValues;
}
