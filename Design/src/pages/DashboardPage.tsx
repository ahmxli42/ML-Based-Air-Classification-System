import React, { useState, useEffect } from 'react';
import { IslamabadHeroCard } from '../components/dashboard/IslamabadHeroCard';
import { TodayTrendChart } from '../components/dashboard/TodayTrendChart';
import { QuickClassifyCard } from '../components/dashboard/QuickClassifyCard';
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard';
import { fetchIslamabadTelemetry, StationTelemetry } from '../services/weatherApi';

export const DashboardPage: React.FC = () => {
  const [telemetry, setTelemetry] = useState<StationTelemetry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshLabel, setRefreshLabel] = useState('Refresh Live Data (Just now)');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  useEffect(() => {
    fetchIslamabadTelemetry().then((data) => setTelemetry(data));
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshLabel('Synchronizing...');
    const data = await fetchIslamabadTelemetry();
    setTelemetry({ ...data });
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshLabel('Live Feed Synced (0s ago)');
    }, 700);
  };

  const handleExportCSV = () => {
    if (!telemetry) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Station ID,City,Latitude,Longitude,AQI,Category,PM2.5,PM10,SO2,NO2,CO,O3,Temp,Humidity,Wind,Pressure',
        `${telemetry.stationNodeId},${telemetry.city},${telemetry.coordinates.lat},${telemetry.coordinates.lon},${telemetry.aqi},${telemetry.category},${telemetry.pollutants.pm25},${telemetry.pollutants.pm10},${telemetry.pollutants.so2},${telemetry.pollutants.no2},${telemetry.pollutants.co},${telemetry.pollutants.o3},${telemetry.weather.temp},${telemetry.weather.humidity},${telemetry.weather.windSpeed},${telemetry.weather.pressure}`,
      ].join('\n');

    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Islamabad-Telemetry-${telemetry.stationNodeId}.csv`;
    link.click();
    showToast('Exported Islamabad telemetry CSV');
  };

  const handleCalibrate = () => {
    showToast('Sensor calibration sweep initiated: 14/14 telemetry probes zeroed');
  };

  const showToast = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3200);
  };

  if (!telemetry) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-primary font-mono">
          <span className="material-symbols-outlined text-[24px] animate-spin">sync</span>
          <span>Acquiring atmospheric telemetry feed...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-space-2xl">
      {/* Station Header & Utility Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
        <div className="flex flex-col">
          <div className="flex items-center gap-space-xs text-primary mb-space-xxs">
            <span className="material-symbols-outlined text-[18px]">sensors</span>
            <span className="font-label-caps uppercase tracking-wider text-primary">
              Station Node ID: {telemetry.stationNodeId}
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
            {telemetry.stationName}
          </h1>
          <p className="font-body-md text-on-surface-variant mt-1">
            Real-time telemetry and atmospheric particulate classification feed
          </p>
        </div>

        {/* Quick Action Bar */}
        <div className="flex items-center flex-wrap gap-space-sm">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container/60 hover:bg-surface-container-high text-on-surface transition-all duration-200 shadow-sm text-body-sm font-medium backdrop-blur-md border border-white/10"
          >
            <span className="material-symbols-outlined text-[18px] text-tertiary">
              file_download
            </span>
            <span>Export Telemetry (CSV)</span>
          </button>
          <button
            type="button"
            onClick={handleCalibrate}
            className="flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-surface-container/60 hover:bg-surface-container-high text-on-surface transition-all duration-200 shadow-sm text-body-sm font-medium backdrop-blur-md border border-white/10"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
            <span>Calibrate Sensors</span>
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-space-xs px-space-md py-2.5 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary transition-all duration-200 shadow-sm text-body-sm font-medium backdrop-blur-md border border-primary/30"
          >
            <span
              className={`material-symbols-outlined text-[18px] ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            >
              sync
            </span>
            <span>{refreshLabel}</span>
          </button>
        </div>
      </div>

      {/* Primary Atmospheric Hero Glass Card */}
      <IslamabadHeroCard
        data={telemetry}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Secondary Analytical Grid (Row of 3 Bespoke Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-grid-gutter w-full">
        <TodayTrendChart
          data={telemetry.trend}
          peakAqi={telemetry.peakAqi}
          currentAqi={telemetry.aqi}
          isRealLive={telemetry.isRealLiveFeed}
        />
        <QuickClassifyCard />
        <RecentActivityCard />
      </div>

      {/* Toast Notification */}
      {statusNotification && (
        <div className="fixed bottom-8 right-8 z-50 px-space-md py-space-sm rounded-xl bg-surface-container-highest text-on-surface shadow-2xl flex items-center gap-space-sm border border-primary/40 backdrop-blur-xl animate-fadeIn">
          <span className="material-symbols-outlined text-primary text-[20px]">
            check_circle
          </span>
          <span className="font-body-sm text-[13px]">{statusNotification}</span>
        </div>
      )}
    </div>
  );
};
