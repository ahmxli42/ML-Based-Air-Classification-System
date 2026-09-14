import React from 'react';
import { StationTelemetry } from '../../services/weatherApi';

interface IslamabadHeroCardProps {
  data: StationTelemetry;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const IslamabadHeroCard: React.FC<IslamabadHeroCardProps> = ({
  data,
}) => {
  return (
    <div className="relative w-full rounded-2xl bg-surface-container/60 dark:bg-surface-container/40 backdrop-blur-2xl p-6 sm:p-[36px] shadow-xl overflow-hidden glass-edge border border-white/20 dark:border-white/10">
      {/* Localized Atmospheric Aura Glows */}
      <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-error-container/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-primary/10 blur-[110px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col gap-space-xl">
        {/* Top Tier: Location & Meteorological Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          {/* Location details */}
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high/80 flex items-center justify-center text-primary shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[28px]">location_on</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">
                  {data.city}, {data.country}
                </span>
                <span className="font-label-caps text-[10px] uppercase px-2.5 py-0.5 rounded-full bg-surface-bright/70 text-on-surface-variant font-medium">
                  {data.urbanType}
                </span>
                {data.isRealLiveFeed && (
                  <span className="inline-flex items-center gap-1 font-label-caps text-[10px] uppercase px-2 py-0.5 rounded-full bg-secondary/20 text-secondary font-semibold border border-secondary/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    {data.feedSource}
                  </span>
                )}
              </div>
              <span className="font-label-numeric text-[13px] text-on-surface-variant tracking-normal mt-0.5">
                Lat {data.coordinates.lat}° N, Lon {data.coordinates.lon}° E • Elevation {data.coordinates.elevation}m
              </span>
            </div>
          </div>

          {/* Meteorological Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface-container-lowest/60 p-2 rounded-xl backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <span className="material-symbols-outlined text-tertiary text-[20px]">thermostat</span>
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Temp</span>
                <span className="font-label-numeric text-body-sm text-on-surface font-semibold">
                  {data.weather.temp}°C
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">humidity_percentage</span>
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Humidity</span>
                <span className="font-label-numeric text-body-sm text-on-surface font-semibold">
                  {data.weather.humidity}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5">
              <span className="material-symbols-outlined text-secondary text-[20px]">air</span>
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Wind</span>
                <span className="font-label-numeric text-body-sm text-on-surface font-semibold">
                  {data.weather.windSpeed} km/h {data.weather.windDirection}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5">
              <span className="material-symbols-outlined text-tertiary text-[20px]">speed</span>
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] uppercase text-on-surface-variant">Barometer</span>
                <span className="font-label-numeric text-body-sm text-on-surface font-semibold">
                  {data.weather.pressure} hPa
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero AQI Scalar Display & Clinical Assessment */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-space-xl py-space-sm">
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-space-lg">
            <div className="flex items-baseline gap-space-xs">
              <span className="font-label-numeric text-[68px] sm:text-[84px] leading-none font-bold text-on-surface tracking-tight drop-shadow-md">
                {data.aqi}
              </span>
              <div className="flex flex-col ml-space-xxs">
                <span className="font-label-caps text-label-caps uppercase text-on-surface-variant tracking-wider font-semibold">
                  AQI Index
                </span>
                <span className="font-label-numeric text-[12px] text-on-surface-variant/70">
                  US EPA Standard
                </span>
              </div>
            </div>

            {/* Severity Pill */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-error-container/40 text-error border border-error/30 backdrop-blur-md shadow-[0_0_24px_rgba(147,0,10,0.35)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error"></span>
              </span>
              <span className="font-label-caps text-[12px] uppercase font-bold tracking-wider">
                {data.category}
              </span>
              <span className="font-label-numeric text-[12px] text-on-surface-variant">
                {data.categoryBand}
              </span>
            </div>
          </div>

          {/* Descriptive Clinical Assessment */}
          <div className="max-w-xl p-space-md rounded-xl bg-surface-container-lowest/60 backdrop-blur-lg border border-white/10">
            <div className="flex items-start gap-space-sm">
              <span className="material-symbols-outlined text-error text-[22px] shrink-0 mt-0.5">
                warning
              </span>
              <p className="font-body-md text-body-sm text-on-surface leading-relaxed">
                Current particulate concentration exceeds WHO guideline threshold by{' '}
                <strong className="text-error font-semibold">{data.guidelineExceedRatio}x</strong>.
                Sensitive groups should avoid prolonged outdoor exertion; general population should curtail heavy cardiovascular activity outdoors.
              </p>
            </div>
          </div>
        </div>

        {/* 6 Key Atmospheric Pollutant Stat Chips */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-space-md pt-space-xs">
          {/* PM2.5 */}
          <div className="flex flex-col p- space-md p-4 rounded-xl bg-surface-container-lowest/70 backdrop-blur-md transition-all duration-200 hover:bg-surface-container-high/70 shadow-sm border border-white/10">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-caps uppercase text-on-surface-variant">PM2.5</span>
              <span className="w-2 h-2 rounded-full bg-error shadow-[0_0_8px_rgba(255,180,171,0.6)]"></span>
            </div>
            <span className="font-label-numeric text-headline-sm font-semibold text-on-surface">
              {data.pollutants.pm25}
            </span>
            <span className="font-body-sm text-[12px] text-on-surface-variant/70">µg/m³</span>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
              <span className="font-label-caps uppercase text-error">Unhealthy</span>
              <span className="font-label-numeric">Lim 35.4</span>
            </div>
          </div>

          {/* PM10 */}
          <div className="flex flex-col p-4 rounded-xl bg-surface-container-lowest/70 backdrop-blur-md transition-all duration-200 hover:bg-surface-container-high/70 shadow-sm border border-white/10">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-caps uppercase text-on-surface-variant">PM10</span>
              <span className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_8px_rgba(37,164,117,0.6)]"></span>
            </div>
            <span className="font-label-numeric text-headline-sm font-semibold text-on-surface">
              {data.pollutants.pm10}
            </span>
            <span className="font-body-sm text-[12px] text-on-surface-variant/70">µg/m³</span>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
              <span className="font-label-caps uppercase text-secondary">Moderate</span>
              <span className="font-label-numeric">Lim 154</span>
            </div>
          </div>

          {/* SO2 */}
          <div className="flex flex-col p-4 rounded-xl bg-surface-container-lowest/70 backdrop-blur-md transition-all duration-200 hover:bg-surface-container-high/70 shadow-sm border border-white/10">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-caps uppercase text-on-surface-variant">SO₂</span>
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(66,222,195,0.6)]"></span>
            </div>
            <span className="font-label-numeric text-headline-sm font-semibold text-on-surface">
              {data.pollutants.so2}
            </span>
            <span className="font-body-sm text-[12px] text-on-surface-variant/70">ppb</span>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
              <span className="font-label-caps uppercase text-primary">Good</span>
              <span className="font-label-numeric">Lim 75</span>
            </div>
          </div>

          {/* NO2 */}
          <div className="flex flex-col p-4 rounded-xl bg-surface-container-lowest/70 backdrop-blur-md transition-all duration-200 hover:bg-surface-container-high/70 shadow-sm border border-white/10">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-caps uppercase text-on-surface-variant">NO₂</span>
              <span className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_8px_rgba(37,164,117,0.6)]"></span>
            </div>
            <span className="font-label-numeric text-headline-sm font-semibold text-on-surface">
              {data.pollutants.no2}
            </span>
            <span className="font-body-sm text-[12px] text-on-surface-variant/70">ppb</span>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
              <span className="font-label-caps uppercase text-secondary">Moderate</span>
              <span className="font-label-numeric">Lim 53</span>
            </div>
          </div>

          {/* CO */}
          <div className="flex flex-col p-4 rounded-xl bg-surface-container-lowest/70 backdrop-blur-md transition-all duration-200 hover:bg-surface-container-high/70 shadow-sm border border-white/10">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-caps uppercase text-on-surface-variant">CO</span>
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(66,222,195,0.6)]"></span>
            </div>
            <span className="font-label-numeric text-headline-sm font-semibold text-on-surface">
              {data.pollutants.co}
            </span>
            <span className="font-body-sm text-[12px] text-on-surface-variant/70">ppm</span>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
              <span className="font-label-caps uppercase text-primary">Good</span>
              <span className="font-label-numeric">Lim 9.0</span>
            </div>
          </div>

          {/* O3 */}
          <div className="flex flex-col p-4 rounded-xl bg-surface-container-lowest/70 backdrop-blur-md transition-all duration-200 hover:bg-surface-container-high/70 shadow-sm border border-white/10">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-caps uppercase text-on-surface-variant">O₃</span>
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(66,222,195,0.6)]"></span>
            </div>
            <span className="font-label-numeric text-headline-sm font-semibold text-on-surface">
              {data.pollutants.o3}
            </span>
            <span className="font-body-sm text-[12px] text-on-surface-variant/70">ppb</span>
            <div className="mt-space-sm pt-space-xs flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
              <span className="font-label-caps uppercase text-primary">Good</span>
              <span className="font-label-numeric">Lim 70</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
