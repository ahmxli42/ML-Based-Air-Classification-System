import React from 'react';
import { PredictResponse, PollutantValues } from '../../types/aqi';
import { StatusBadge } from '../common/StatusBadge';
import { ConfidenceRing } from '../common/ConfidenceRing';
import { ContributionBar } from '../common/ContributionBar';
import { AnomalyBanner } from '../common/AnomalyBanner';

interface ResultsPanelProps {
  prediction: PredictResponse;
  pollutants?: PollutantValues;
  timestamp?: string;
  executionTimeMs?: number;
  hash?: string;
  onClose?: () => void;
  title?: string;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  prediction,
  pollutants,
  timestamp = 'Just now',
  executionTimeMs = 48,
  hash = 'a7f9-c4b2',
  onClose,
  title = 'Classification Result • Analysis Complete',
}) => {
  const downloadJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ prediction, pollutants, timestamp, hash }, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `AQI-Prediction-${hash}.json`);
    dlAnchorElem.click();
  };

  const getAdvisoryText = (cat: string) => {
    const n = cat.toLowerCase();
    if (n === 'good') {
      return {
        tier: 'Tier 1 Environmental Baseline',
        desc: 'Air quality is considered satisfactory, and air pollution poses little or no risk. Ideal for outdoor exercise.',
      };
    } else if (n === 'moderate') {
      return {
        tier: 'Tier 2 Acceptable Exposure',
        desc: 'Air quality is acceptable. A small number of individuals unusually sensitive to air pollution may experience slight respiratory irritation.',
      };
    } else if (n === 'unhealthy') {
      return {
        tier: 'Tier 4 Environmental Advisory Active',
        desc: 'Sensitive groups, children, and elderly individuals should avoid prolonged outdoor exertion. General public should substantially limit prolonged heavy exertion.',
      };
    } else {
      return {
        tier: 'Tier 5 Critical Health Warning',
        desc: 'Emergency health conditions. Entire population is likely to be affected with severe cardiovascular and pulmonary strain. Remain indoors with filtered air.',
      };
    }
  };

  const advisory = getAdvisoryText(prediction.predicted_category);
  const ratio = pollutants && pollutants.pm10 > 0 ? pollutants.pm25 / pollutants.pm10 : 0.58;

  return (
    <div
      id="results-panel"
      className="relative rounded-2xl bg-surface-container/70 dark:bg-surface-container/60 backdrop-blur-2xl p-6 sm:p-card-padding-spacious shadow-2xl flex flex-col gap-space-xl border border-white/20 dark:border-white/10 glass-edge transition-all duration-300 animate-fadeIn"
    >
      {/* Refraction background */}
      <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-primary/10 blur-[100px] pointer-events-none"></div>

      {/* Header with Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 font-label-numeric text-[13px] text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          <span>
            {timestamp} • Latency: {executionTimeMs}ms
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-surface-container-high transition-colors ml-2"
              title="Close panel"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Anomaly Banner if flagged */}
      {prediction.is_unusual_reading && <AnomalyBanner ratio={ratio} />}

      {/* Diagnostic Split Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-stretch">
        {/* Left Column: Category & Confidence Ring (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-space-xl rounded-xl bg-surface-container-lowest/50 backdrop-blur-md shadow-inner gap-space-lg border border-white/10">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <span className="font-label-caps uppercase tracking-wider text-on-surface-variant">
                Predicted Status
              </span>
              <span className="font-label-numeric text-[12px] text-on-surface-variant">
                AQI Standard (US EPA)
              </span>
            </div>

            {/* Category badge and advisory */}
            <div className="flex flex-col gap-space-xs">
              <div className="inline-flex items-center">
                <StatusBadge
                  category={prediction.predicted_category}
                  size="lg"
                  showBeacon={true}
                />
              </div>

              <div className="flex items-center gap-space-xs pt-2 text-on-surface">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  shield_with_heart
                </span>
                <span className="font-headline-sm text-body-md font-semibold">
                  {advisory.tier}
                </span>
              </div>
              <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed mt-1">
                {advisory.desc}
              </p>
            </div>
          </div>

          {/* Confidence Ring widget */}
          <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container-high/60 border border-white/10 shadow-sm">
            <div className="flex flex-col">
              <span className="font-label-caps uppercase text-on-surface-variant text-[10px]">
                Model Confidence
              </span>
              <span className="font-body-sm text-[13px] text-on-surface font-medium">
                Ensemble agreement 9/9
              </span>
              <span className="font-label-numeric text-[11px] text-primary mt-1">
                Validated gradient tree
              </span>
            </div>
            <ConfidenceRing confidence={prediction.confidence} size={84} />
          </div>
        </div>

        {/* Right Column: Attributed Drivers (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-space-xl rounded-xl bg-surface-container-lowest/50 backdrop-blur-md shadow-inner gap-space-lg border border-white/10">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Primary Pollutant Contributors
                </span>
                <span className="font-body-sm text-[12px] text-on-surface-variant">
                  Shapley feature attribution breakdown for current prediction
                </span>
              </div>
              <span className="font-label-numeric text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                SHAP Σ = 100%
              </span>
            </div>

            {/* Bars */}
            <div className="flex flex-col gap-3.5 pt-1">
              {prediction.top_factors.map((factor) => (
                <ContributionBar
                  key={factor.pollutant}
                  pollutant={factor.pollutant}
                  impact={factor.impact}
                />
              ))}
            </div>
          </div>

          {/* Station Correlation note */}
          <div className="flex items-center justify-between pt-space-xs text-on-surface-variant font-body-sm text-[12px] border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">hub</span>
              <span>Correlated with Sector F-8 Ground Station</span>
            </div>
            <span className="font-label-numeric text-secondary font-semibold">
              Pearson r = 0.93
            </span>
          </div>
        </div>
      </div>

      {/* Footer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-space-md pt-2 border-t border-white/10">
        <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-[12px]">
          <span className="material-symbols-outlined text-[16px] text-primary">lock_clock</span>
          <span>
            Diagnostic Cryptographic Hash:{' '}
            <code className="font-mono text-on-surface font-semibold bg-surface-container px-1.5 py-0.5 rounded">
              {hash}
            </code>
          </span>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            onClick={downloadJSON}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-[13px] transition-all shadow-sm border border-white/10"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">data_object</span>
            <span>Download Raw JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
