import React from 'react';

interface ContributionBarProps {
  pollutant: string;
  impact: number; // e.g. 52
  label?: string;
  color?: string;
}

const POLLUTANT_METADATA: Record<
  string,
  { label: string; colorClass: string; barColor: string }
> = {
  'PM2.5': {
    label: 'High Density Fine Particulates',
    colorClass: 'bg-error',
    barColor: 'bg-error',
  },
  PM25: {
    label: 'High Density Fine Particulates',
    colorClass: 'bg-error',
    barColor: 'bg-error',
  },
  NO2: {
    label: 'Combustion / Vehicular Byproduct',
    colorClass: 'bg-primary-container',
    barColor: 'bg-primary-container',
  },
  PM10: {
    label: 'Coarse Inhalable Particulates',
    colorClass: 'bg-tertiary-container',
    barColor: 'bg-tertiary-container',
  },
  SO2: {
    label: 'Sulfur Compound Emissions',
    colorClass: 'bg-amber-500',
    barColor: 'bg-amber-500',
  },
  CO: {
    label: 'Carbon Monoxide Incomplete Combustion',
    colorClass: 'bg-cyan-500',
    barColor: 'bg-cyan-500',
  },
  O3: {
    label: 'Photochemical Ground Smog',
    colorClass: 'bg-secondary',
    barColor: 'bg-secondary',
  },
  Other: {
    label: 'Trace Ambient Baseline',
    colorClass: 'bg-secondary',
    barColor: 'bg-secondary',
  },
};

export const ContributionBar: React.FC<ContributionBarProps> = ({
  pollutant,
  impact,
  label,
  color,
}) => {
  const meta = POLLUTANT_METADATA[pollutant] || {
    label: label || 'Atmospheric Variable',
    colorClass: color || 'bg-primary',
    barColor: color || 'bg-primary',
  };

  const displayLabel = label || meta.label;
  const barClass = color || meta.barColor;
  const dotClass = color || meta.colorClass;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-body-sm">
        <span className="text-on-surface font-medium flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded ${dotClass}`}></span>
          <span>{pollutant}</span>
          <span className="text-on-surface-variant font-normal text-[12px] hidden sm:inline">
            ({displayLabel})
          </span>
        </span>
        <span className="font-label-numeric font-semibold text-on-surface">
          {Math.round(impact)}% Impact
        </span>
      </div>
      <div className="w-full h-3 rounded-full bg-surface-container-highest/80 overflow-hidden">
        <div
          className={`h-full ${barClass} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(Math.max(impact, 2), 100)}%` }}
        ></div>
      </div>
    </div>
  );
};
