import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PollutantValues, PredictResponse } from '../types/aqi';
import { PollutantInput } from '../components/classify/PollutantInput';
import { ResultsPanel } from '../components/classify/ResultsPanel';
import { predictAirQuality } from '../services/api';
import { useHistory } from '../context/HistoryContext';

const DEFAULT_INPUTS: PollutantValues = {
  pm25: 92.5,
  pm10: 158.0,
  so2: 28.4,
  no2: 64.2,
  co: 2.4,
  o3: 48.0,
};

const PRESETS: Record<string, { name: string; values: PollutantValues; dotColor: string }> = {
  winter: {
    name: 'Islamabad Winter Inversion',
    dotColor: 'bg-error',
    values: { pm25: 92.5, pm10: 158.0, so2: 28.4, no2: 64.2, co: 2.4, o3: 48.0 },
  },
  margalla: {
    name: 'Margalla Baseline',
    dotColor: 'bg-secondary',
    values: { pm25: 18.0, pm10: 32.0, so2: 8.0, no2: 12.0, co: 0.6, o3: 35.0 },
  },
  traffic: {
    name: 'Heavy Traffic Corridor',
    dotColor: 'bg-primary',
    values: { pm25: 110.0, pm10: 180.0, so2: 32.0, no2: 78.0, co: 4.2, o3: 22.0 },
  },
};

export const ClassifyPage: React.FC = () => {
  const location = useLocation();
  const { addRecord } = useHistory();

  const [inputs, setInputs] = useState<PollutantValues>(DEFAULT_INPUTS);
  const [activePreset, setActivePreset] = useState<string>('winter');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'error'; text: string } | null>(
    null
  );

  // Check navigation state for pre-fills
  useEffect(() => {
    if (location.state) {
      if (location.state.preset && PRESETS[location.state.preset]) {
        applyPreset(location.state.preset);
      } else if (location.state.prefill) {
        setInputs(location.state.prefill);
        setActivePreset('');
      }
    }
  }, [location.state]);

  const updateField = (field: keyof PollutantValues, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
    setActivePreset('');
  };

  const applyPreset = (presetKey: string) => {
    if (PRESETS[presetKey]) {
      setInputs({ ...PRESETS[presetKey].values });
      setActivePreset(presetKey);
    }
  };

  const clearInputs = () => {
    setInputs({ pm25: 0, pm10: 0, so2: 0, no2: 0, co: 0, o3: 0 });
    setActivePreset('');
    setPrediction(null);
  };

  const resetDefaults = () => {
    setInputs(DEFAULT_INPUTS);
    setActivePreset('winter');
  };

  const handleClassify = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    const result = await predictAirQuality(inputs);
    setPrediction(result.data);

    if (result.isFallback && result.errorMessage) {
      setStatusMessage({
        type: 'error',
        text: result.errorMessage,
      });
    }

    // Append to shared telemetry history
    addRecord({
      stationName:
        activePreset && PRESETS[activePreset]
          ? PRESETS[activePreset].name
          : 'User Real-Time Classification Run',
      pollutants: { ...inputs },
      predicted_category: result.data.predicted_category,
      confidence: result.data.confidence,
      top_factors: result.data.top_factors,
      is_unusual_reading: result.data.is_unusual_reading,
    });

    setIsLoading(false);

    // Smooth scroll down to results panel
    setTimeout(() => {
      document.getElementById('results-panel')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="flex flex-col w-full gap-space-2xl">
      {/* Top Title Context Block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-space-xxs">
          <div className="flex items-center gap-space-xs text-primary">
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            <span className="font-label-caps uppercase tracking-wider">
              Predictive Inference Engine • V3.4
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
            New Classification Engine
          </h1>
          <p className="font-body-md text-on-surface-variant max-w-2xl text-[14px] leading-relaxed">
            Enter continuous multi-point telemetry to predict real-time atmospheric classification tier and isolate primary pollutant drivers using gradient-boosted spatial attribution.
          </p>
        </div>

        <div className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container/70 border border-white/10 shadow-sm backdrop-blur-md">
          <span className="material-symbols-outlined text-[18px] text-primary">memory</span>
          <span className="font-label-numeric text-[12px] text-on-surface">
            GBM-AirNet v2.18 (Weights: Oct 2024)
          </span>
        </div>
      </div>

      {/* Main Glass Form Container */}
      <div className="relative rounded-2xl bg-surface-container/60 dark:bg-surface-container/50 backdrop-blur-2xl p-6 sm:p-card-padding-spacious shadow-xl flex flex-col gap-space-xl border border-white/20 dark:border-white/10 glass-edge">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-primary/10 blur-[100px] pointer-events-none"></div>

        {/* Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-md pb-2 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-space-xs">
            <span className="font-label-caps uppercase text-on-surface-variant mr-space-xs flex items-center gap-1 text-[11px]">
              <span className="material-symbols-outlined text-[15px]">tune</span> Quick Presets
            </span>

            {Object.entries(PRESETS).map(([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyPreset(key)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-body-sm text-[12px] transition-all shadow-sm border ${
                  activePreset === key
                    ? 'bg-primary/20 text-primary border-primary/40 font-semibold'
                    : 'bg-surface-container-high/80 hover:bg-surface-container-highest text-on-surface border-white/10'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${p.dotColor}`}></span>
                {p.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={clearInputs}
            className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface font-label-caps uppercase tracking-wider text-[11px] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Clear All
          </button>
        </div>

        {/* 6 Input Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          <PollutantInput
            id="input-pm25"
            symbol="PM"
            subscript="2.5"
            name="Fine Particulates"
            unit="µg/m³"
            value={inputs.pm25}
            icon="grain"
            description="Particulate Matter ≤ 2.5 µm"
            baseline="WHO: < 15 µg/m³"
            isAlert={inputs.pm25 > 35}
            onChange={(val) => updateField('pm25', val)}
          />

          <PollutantInput
            id="input-pm10"
            symbol="PM"
            subscript="10"
            name="Inhalable Dust"
            unit="µg/m³"
            value={inputs.pm10}
            icon="filter_drama"
            description="Particulate Matter ≤ 10 µm"
            baseline="WHO: < 45 µg/m³"
            isAlert={inputs.pm10 > 150}
            onChange={(val) => updateField('pm10', val)}
          />

          <PollutantInput
            id="input-so2"
            symbol="SO"
            subscript="2"
            name="Sulfur Dioxide"
            unit="ppb"
            value={inputs.so2}
            icon="factory"
            description="Sulfur Compound Sensor"
            baseline="Baseline: 5–20 ppb"
            isAlert={inputs.so2 > 40}
            onChange={(val) => updateField('so2', val)}
          />

          <PollutantInput
            id="input-no2"
            symbol="NO"
            subscript="2"
            name="Nitrogen Dioxide"
            unit="ppb"
            value={inputs.no2}
            icon="directions_car"
            description="Combustion Byproduct"
            baseline="Limit: < 53 ppb"
            isAlert={inputs.no2 > 53}
            onChange={(val) => updateField('no2', val)}
          />

          <PollutantInput
            id="input-co"
            symbol="CO"
            name="Carbon Monoxide"
            unit="ppm"
            value={inputs.co}
            icon="local_fire_department"
            description="Incomplete Combustion"
            baseline="Limit: < 9 ppm"
            isAlert={inputs.co > 9}
            onChange={(val) => updateField('co', val)}
          />

          <PollutantInput
            id="input-o3"
            symbol="O"
            subscript="3"
            name="Ground Ozone"
            unit="ppb"
            value={inputs.o3}
            icon="wb_sunny"
            description="Photochemical Smog"
            baseline="8-hr Limit: < 70 ppb"
            isAlert={inputs.o3 > 70}
            onChange={(val) => updateField('o3', val)}
          />
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 text-on-surface-variant text-[13px]">
            <span className="material-symbols-outlined text-[18px] text-secondary">
              verified_user
            </span>
            <span>All values run through Kalman variance filter prior to scoring</span>
          </div>

          <div className="flex items-center gap-space-md w-full sm:w-auto">
            <button
              type="button"
              onClick={resetDefaults}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-surface-container-highest/60 hover:bg-surface-container-highest text-on-surface font-medium text-[13px] transition-all shadow-sm border border-white/10"
            >
              Reset to Defaults
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleClassify}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-container to-secondary-container text-on-primary font-semibold text-[14px] transition-all shadow-lg hover:shadow-primary/30 active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">
                    progress_activity
                  </span>
                  <span>Classifying Particulates...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                  <span>Run Classification Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Backend Status Notice */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-on-surface flex items-start gap-3 backdrop-blur-md">
          <span className="material-symbols-outlined text-amber-400 text-[22px] shrink-0 mt-0.5">
            cloud_off
          </span>
          <div className="flex flex-col">
            <span className="font-semibold text-[13px]">Backend Server Notice</span>
            <p className="text-[12px] text-on-surface-variant">{statusMessage.text}</p>
          </div>
        </div>
      )}

      {/* Dynamic Results Section */}
      {prediction && (
        <ResultsPanel
          prediction={prediction}
          pollutants={inputs}
          timestamp="Just now"
          executionTimeMs={42}
          onClose={() => setPrediction(null)}
        />
      )}
    </div>
  );
};
