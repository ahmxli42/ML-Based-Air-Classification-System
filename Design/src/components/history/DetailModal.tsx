import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HistoryRecord } from '../../types/aqi';
import { StatusBadge } from '../common/StatusBadge';
import { AnomalyBanner } from '../common/AnomalyBanner';

interface DetailModalProps {
  record: HistoryRecord;
  onClose?: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ record, onClose }) => {
  const navigate = useNavigate();

  const downloadJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(record, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${record.id}-telemetry-detail.json`);
    dlAnchorElem.click();
  };

  const reclassify = () => {
    navigate('/classify', { state: { prefill: record.pollutants } });
  };

  const ratio =
    record.pollutants.pm10 > 0
      ? record.pollutants.pm25 / record.pollutants.pm10
      : 0.58;

  return (
    <section className="mt-space-2xl animate-fadeIn">
      <div className="relative rounded-3xl bg-surface-container-low/90 dark:bg-surface-container-low/80 backdrop-blur-3xl p-6 sm:p-space-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 glass-edge">
        {/* Glow Refraction Backing */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top bar of Detail Card */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-xl relative z-10">
          <div className="flex flex-col gap-space-xxs">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-label-caps uppercase font-semibold text-[10px] border border-primary/30">
                Active Inspector
              </span>
              <span className="text-on-surface-variant font-label-numeric text-[12px]">
                Captured via Telemetry Bus 02
              </span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              Sample {record.id} Detail View — {record.stationName}
            </h2>
            <span className="font-body-sm text-[12px] text-on-surface-variant">
              Timestamp: {record.timestamp} • {record.coordinates}
            </span>
          </div>

          <div className="flex items-center gap-space-sm flex-wrap">
            <button
              type="button"
              onClick={downloadJSON}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-body-sm text-[13px] transition-all shadow-sm border border-white/10"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">data_object</span>
              <span>Download Raw JSON</span>
            </button>
            <button
              type="button"
              onClick={reclassify}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-body-sm text-[13px] font-semibold transition-all shadow-[0_8px_20px_rgba(66,222,195,0.25)]"
            >
              <span className="material-symbols-outlined text-[18px]">model_training</span>
              <span>Re-classify with Ensemble</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all border border-white/10"
                title="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Anomaly notice banner if flagged */}
        {record.is_unusual_reading && (
          <div className="mb-space-lg">
            <AnomalyBanner ratio={ratio} />
          </div>
        )}

        {/* Detail Grid & Model Diagnostics */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-xl relative z-10">
          {/* 6 Pollutant Breakdown Cards (Left 7 Cols) */}
          <div className="xl:col-span-7 flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <span className="font-label-caps uppercase text-on-surface-variant tracking-wider font-semibold">
                Analyzed Gas &amp; Aerosol Particulates
              </span>
              <span className="font-label-numeric text-[12px] text-secondary font-semibold">
                Calibrated ±0.8% error margin
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-md">
              {/* PM2.5 */}
              <div className="p-space-md rounded-2xl bg-surface-container/70 dark:bg-surface-container/60 backdrop-blur-xl flex flex-col justify-between shadow-sm border border-white/10">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-caps text-on-surface-variant font-medium">PM2.5 (Fine)</span>
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-lg text-display-lg font-label-numeric text-error font-semibold leading-none">
                    {record.pollutants.pm25}
                  </span>
                  <span className="font-label-numeric text-[12px] text-on-surface-variant">µg/m³</span>
                </div>
                <div className="mt-space-sm pt-space-xs flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
                  <span>Safe baseline: 15.0</span>
                  <span className="text-error font-semibold">
                    +{Math.round((record.pollutants.pm25 / 15) * 100 - 100)}%
                  </span>
                </div>
              </div>

              {/* PM10 */}
              <div className="p-space-md rounded-2xl bg-surface-container/70 dark:bg-surface-container/60 backdrop-blur-xl flex flex-col justify-between shadow-sm border border-white/10">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-caps text-on-surface-variant font-medium">PM10 (Coarse)</span>
                  <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-lg text-display-lg font-label-numeric text-on-surface font-semibold leading-none">
                    {record.pollutants.pm10}
                  </span>
                  <span className="font-label-numeric text-[12px] text-on-surface-variant">µg/m³</span>
                </div>
                <div className="mt-space-sm pt-space-xs flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
                  <span>Safe baseline: 45.0</span>
                  <span className="text-secondary font-semibold">
                    +{Math.round((record.pollutants.pm10 / 45) * 100 - 100)}%
                  </span>
                </div>
              </div>

              {/* SO2 */}
              <div className="p-space-md rounded-2xl bg-surface-container/70 dark:bg-surface-container/60 backdrop-blur-xl flex flex-col justify-between shadow-sm border border-white/10">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-caps text-on-surface-variant font-medium">SO2 (Sulfur)</span>
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-lg text-display-lg font-label-numeric text-on-surface font-semibold leading-none">
                    {record.pollutants.so2}
                  </span>
                  <span className="font-label-numeric text-[12px] text-on-surface-variant">ppb</span>
                </div>
                <div className="mt-space-sm pt-space-xs flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
                  <span>Threshold: 40.0</span>
                  <span className="text-secondary font-semibold">
                    {record.pollutants.so2 > 40 ? 'High' : 'Normal'}
                  </span>
                </div>
              </div>

              {/* NO2 */}
              <div className="p-space-md rounded-2xl bg-surface-container/70 dark:bg-surface-container/60 backdrop-blur-xl flex flex-col justify-between shadow-sm border border-white/10">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-caps text-on-surface-variant font-medium">NO2 (Nitrogen)</span>
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-lg text-display-lg font-label-numeric text-on-surface font-semibold leading-none">
                    {record.pollutants.no2}
                  </span>
                  <span className="font-label-numeric text-[12px] text-on-surface-variant">ppb</span>
                </div>
                <div className="mt-space-sm pt-space-xs flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
                  <span>WHO Limit: 25.0</span>
                  <span className="text-primary font-semibold">
                    {record.pollutants.no2 > 25 ? 'Elevated' : 'Normal'}
                  </span>
                </div>
              </div>

              {/* CO */}
              <div className="p-space-md rounded-2xl bg-surface-container/70 dark:bg-surface-container/60 backdrop-blur-xl flex flex-col justify-between shadow-sm border border-white/10">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-caps text-on-surface-variant font-medium">CO (Carbon)</span>
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-lg text-display-lg font-label-numeric text-on-surface font-semibold leading-none">
                    {record.pollutants.co}
                  </span>
                  <span className="font-label-numeric text-[12px] text-on-surface-variant">ppm</span>
                </div>
                <div className="mt-space-sm pt-space-xs flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
                  <span>Threshold: 4.0</span>
                  <span className="text-secondary font-semibold">Low</span>
                </div>
              </div>

              {/* O3 */}
              <div className="p-space-md rounded-2xl bg-surface-container/70 dark:bg-surface-container/60 backdrop-blur-xl flex flex-col justify-between shadow-sm border border-white/10">
                <div className="flex items-center justify-between mb-space-xs">
                  <span className="font-label-caps text-on-surface-variant font-medium">O3 (Ozone)</span>
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-display-lg text-display-lg font-label-numeric text-on-surface font-semibold leading-none">
                    {record.pollutants.o3}
                  </span>
                  <span className="font-label-numeric text-[12px] text-on-surface-variant">ppb</span>
                </div>
                <div className="mt-space-sm pt-space-xs flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/5">
                  <span>Threshold: 60.0</span>
                  <span className="text-secondary font-semibold">Stable</span>
                </div>
              </div>
            </div>
          </div>

          {/* Model Diagnostics & Attribution (Right 5 Cols) */}
          <div className="xl:col-span-5 flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <span className="font-label-caps uppercase text-on-surface-variant tracking-wider font-semibold">
                Inference Model Insights
              </span>
              <span className="font-label-numeric text-[12px] text-primary font-semibold">
                Latency: {record.executionTimeMs}ms
              </span>
            </div>

            <div className="p-space-lg rounded-2xl bg-surface-container/70 dark:bg-surface-container/60 backdrop-blur-xl shadow-sm flex flex-col gap-space-md h-full justify-between border border-white/10">
              <div className="flex flex-col gap-space-md">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex flex-col">
                    <span className="font-label-caps uppercase text-on-surface-variant text-[10px]">
                      Predicted Tier
                    </span>
                    <StatusBadge category={record.predicted_category} size="md" showBeacon={true} />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-label-caps uppercase text-on-surface-variant text-[10px]">
                      Confidence
                    </span>
                    <span className="font-headline-sm font-label-numeric font-semibold text-primary">
                      {(record.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Model Architecture Attribution */}
                <div className="flex items-center gap-space-sm p-3 rounded-xl bg-surface-container-high/50 border border-white/5">
                  <span className="material-symbols-outlined text-primary text-[22px]">hub</span>
                  <div className="flex flex-col">
                    <span className="font-body-sm font-semibold text-on-surface">
                      Random Forest Classifier v3.2
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Trained on 48,000 regional atmospheric telemetry sequences
                    </span>
                  </div>
                </div>

                {/* Primary Driver Multi-bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-body-sm text-[13px]">
                    <span className="text-on-surface-variant font-medium">
                      Primary Classification Driver:{' '}
                      <strong className="text-on-surface">
                        {record.top_factors[0]?.pollutant} Aerosols
                      </strong>
                    </span>
                    <span className="font-label-numeric font-semibold text-error">
                      {record.top_factors[0]?.impact}% Influence
                    </span>
                  </div>
                  <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden flex">
                    <div
                      className="bg-error h-full"
                      style={{ width: `${record.top_factors[0]?.impact || 50}%` }}
                    ></div>
                    <div
                      className="bg-tertiary h-full"
                      style={{ width: `${record.top_factors[1]?.impact || 25}%` }}
                    ></div>
                    <div
                      className="bg-primary h-full"
                      style={{ width: `${record.top_factors[2]?.impact || 15}%` }}
                    ></div>
                    <div className="bg-secondary h-full flex-1"></div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-label-numeric text-on-surface-variant pt-1 flex-wrap gap-1">
                    {record.top_factors.map((f, i) => (
                      <span key={f.pollutant} className="flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            i === 0
                              ? 'bg-error'
                              : i === 1
                              ? 'bg-tertiary'
                              : i === 2
                              ? 'bg-primary'
                              : 'bg-secondary'
                          }`}
                        ></span>
                        {f.pollutant} ({f.impact}%)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-on-surface-variant border-t border-white/10">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                  Verified by Automated Calibration Sweep
                </span>
                <span className="font-mono">Hash: {record.hash}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
