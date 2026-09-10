import React, { createContext, useContext, useState } from 'react';
import { HistoryRecord, PollutantValues, TopFactor } from '../types/aqi';

interface HistoryContextType {
  records: HistoryRecord[];
  selectedRecord: HistoryRecord | null;
  setSelectedRecord: (record: HistoryRecord | null) => void;
  addRecord: (data: {
    stationName?: string;
    nodeId?: string;
    coordinates?: string;
    locationTag?: string;
    pollutants: PollutantValues;
    predicted_category: string;
    confidence: number;
    top_factors: TopFactor[];
    is_unusual_reading: boolean;
  }) => HistoryRecord;
}

const INITIAL_RECORDS: HistoryRecord[] = [
  {
    id: '#AQ-9421',
    timestamp: 'Oct 24, 2024 • 14:15 PST',
    isoTimestamp: '2024-10-24T14:15:00',
    stationName: 'Islamabad Sector H-8',
    nodeId: 'ISB-H8-409',
    locationTag: 'Urban Stationary Node • ID 883',
    coordinates: 'Lat 33.6844° N, Lon 73.0479° E',
    pollutants: { pm25: 88.4, pm10: 142.1, so2: 14.8, no2: 38.2, co: 1.2, o3: 42.0 },
    predicted_category: 'Unhealthy',
    confidence: 0.984,
    top_factors: [
      { pollutant: 'PM2.5', impact: 52 },
      { pollutant: 'NO2', impact: 28 },
      { pollutant: 'PM10', impact: 14 },
      { pollutant: 'Other', impact: 6 },
    ],
    is_unusual_reading: false,
    anomalyFlag: 'Nominal',
    executionTimeMs: 48,
    hash: 'a7f9-c4b2',
  },
  {
    id: '#AQ-9420',
    timestamp: 'Oct 24, 2024 • 11:30 PST',
    isoTimestamp: '2024-10-24T11:30:00',
    stationName: 'Margalla Foothills Station',
    nodeId: 'ISB-MF-102',
    locationTag: 'High-Altitude Sensor • Node 102',
    coordinates: 'Lat 33.7432° N, Lon 73.0612° E',
    pollutants: { pm25: 42.1, pm10: 68.0, so2: 12.0, no2: 18.5, co: 0.9, o3: 36.4 },
    predicted_category: 'Moderate',
    confidence: 0.941,
    top_factors: [
      { pollutant: 'PM10', impact: 44 },
      { pollutant: 'PM2.5', impact: 32 },
      { pollutant: 'O3', impact: 16 },
      { pollutant: 'Other', impact: 8 },
    ],
    is_unusual_reading: false,
    anomalyFlag: 'Nominal',
    executionTimeMs: 39,
    hash: '3e1b-f89a',
  },
  {
    id: '#AQ-9419',
    timestamp: 'Oct 24, 2024 • 08:45 PST',
    isoTimestamp: '2024-10-24T08:45:00',
    stationName: 'D-12 Background Station',
    nodeId: 'ISB-D12-045',
    locationTag: 'Residential Perimeter • Node 045',
    coordinates: 'Lat 33.7123° N, Lon 72.9814° E',
    pollutants: { pm25: 18.4, pm10: 32.0, so2: 8.5, no2: 14.2, co: 0.5, o3: 28.0 },
    predicted_category: 'Good',
    confidence: 0.992,
    top_factors: [
      { pollutant: 'PM10', impact: 38 },
      { pollutant: 'O3', impact: 30 },
      { pollutant: 'PM2.5', impact: 20 },
      { pollutant: 'Other', impact: 12 },
    ],
    is_unusual_reading: false,
    anomalyFlag: 'Nominal',
    executionTimeMs: 42,
    hash: '9a4c-55f1',
  },
  {
    id: '#AQ-9418',
    timestamp: 'Oct 23, 2024 • 21:10 PST',
    isoTimestamp: '2024-10-23T21:10:00',
    stationName: 'Rawalpindi Murree Road',
    nodeId: 'RWP-MR-301',
    locationTag: 'Heavy Transit Corridor • Node 301',
    coordinates: 'Lat 33.6007° N, Lon 73.0679° E',
    pollutants: { pm25: 146.2, pm10: 210.5, so2: 24.0, no2: 72.4, co: 3.8, o3: 15.0 },
    predicted_category: 'Severe',
    confidence: 0.996,
    top_factors: [
      { pollutant: 'PM2.5', impact: 61 },
      { pollutant: 'NO2', impact: 23 },
      { pollutant: 'PM10', impact: 12 },
      { pollutant: 'Other', impact: 4 },
    ],
    is_unusual_reading: false,
    anomalyFlag: 'Nominal',
    executionTimeMs: 51,
    hash: 'b28d-19e4',
  },
  {
    id: '#AQ-9417',
    timestamp: 'Oct 23, 2024 • 17:50 PST',
    isoTimestamp: '2024-10-23T17:50:00',
    stationName: 'I-9 Industrial Zone',
    nodeId: 'ISB-I9-605',
    locationTag: 'Industrial Perimeter • Node 605',
    coordinates: 'Lat 33.6612° N, Lon 73.0543° E',
    pollutants: { pm25: 110.8, pm10: 184.2, so2: 44.0, no2: 48.0, co: 2.1, o3: 31.0 },
    predicted_category: 'Unhealthy',
    confidence: 0.962,
    top_factors: [
      { pollutant: 'SO2', impact: 46 },
      { pollutant: 'PM2.5', impact: 34 },
      { pollutant: 'PM10', impact: 14 },
      { pollutant: 'Other', impact: 6 },
    ],
    is_unusual_reading: true,
    anomalyFlag: 'SO2 Spike',
    executionTimeMs: 64,
    hash: '8f92-ec71',
  },
  {
    id: '#AQ-9416',
    timestamp: 'Oct 23, 2024 • 13:20 PST',
    isoTimestamp: '2024-10-23T13:20:00',
    stationName: 'Blue Area Commercial',
    nodeId: 'ISB-BA-210',
    locationTag: 'Business District • Node 210',
    coordinates: 'Lat 33.7088° N, Lon 73.0558° E',
    pollutants: { pm25: 58.6, pm10: 92.4, so2: 16.0, no2: 52.0, co: 1.6, o3: 39.0 },
    predicted_category: 'Moderate',
    confidence: 0.928,
    top_factors: [
      { pollutant: 'NO2', impact: 42 },
      { pollutant: 'PM2.5', impact: 36 },
      { pollutant: 'PM10', impact: 15 },
      { pollutant: 'Other', impact: 7 },
    ],
    is_unusual_reading: false,
    anomalyFlag: 'Nominal',
    executionTimeMs: 44,
    hash: '66d1-ac07',
  },
];

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<HistoryRecord[]>(INITIAL_RECORDS);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(INITIAL_RECORDS[0]);

  const addRecord = (data: {
    stationName?: string;
    nodeId?: string;
    coordinates?: string;
    locationTag?: string;
    pollutants: PollutantValues;
    predicted_category: string;
    confidence: number;
    top_factors: TopFactor[];
    is_unusual_reading: boolean;
  }) => {
    const nextNum = records.length + 9422;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const newRecord: HistoryRecord = {
      id: `#AQ-${nextNum}`,
      timestamp: `${dateString} • ${timeString} PST`,
      isoTimestamp: now.toISOString(),
      stationName: data.stationName || 'Custom Telemetry Run',
      nodeId: data.nodeId || 'USER-INPUT-01',
      locationTag: data.locationTag || 'Manual Inference Sample',
      coordinates: data.coordinates || 'Lat 33.6844° N, Lon 73.0479° E',
      pollutants: data.pollutants,
      predicted_category: data.predicted_category,
      confidence: data.confidence,
      top_factors: data.top_factors,
      is_unusual_reading: data.is_unusual_reading,
      anomalyFlag: data.is_unusual_reading ? 'Atypical Ratio' : 'Nominal',
      executionTimeMs: Math.floor(Math.random() * 25) + 35,
      hash: Math.random().toString(16).substring(2, 6) + '-' + Math.random().toString(16).substring(2, 6),
    };

    setRecords((prev) => [newRecord, ...prev]);
    setSelectedRecord(newRecord);
    return newRecord;
  };

  return (
    <HistoryContext.Provider value={{ records, selectedRecord, setSelectedRecord, addRecord }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = (): HistoryContextType => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
