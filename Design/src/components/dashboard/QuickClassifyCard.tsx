import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface QuickClassifyCardProps {
  onSelectPreset?: (presetName: string) => void;
}

export const QuickClassifyCard: React.FC<QuickClassifyCardProps> = () => {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const presets = [
    {
      name: 'Urban Smog Preset',
      aqi: 178,
      pm25: '88.4 µg/m³',
      icon: 'cloud',
      iconColor: 'text-error',
      presetId: 'winter',
    },
    {
      name: 'Industrial Baseline',
      aqi: 132,
      pm25: '54.2 µg/m³',
      icon: 'factory',
      iconColor: 'text-secondary',
      presetId: 'traffic',
    },
    {
      name: 'Clean Atmosphere Reference',
      aqi: 38,
      pm25: '9.8 µg/m³',
      icon: 'nature',
      iconColor: 'text-primary',
      presetId: 'margalla',
    },
  ];

  const handleSelect = (preset: typeof presets[0]) => {
    setToastMessage(`Loaded preset: ${preset.name} (Target ${preset.aqi} AQI)`);
    setTimeout(() => {
      setToastMessage(null);
      navigate('/classify', { state: { preset: preset.presetId } });
    }, 600);
  };

  return (
    <div className="flex flex-col justify-between p-6 sm:p-[28px] rounded-2xl bg-surface-container/60 dark:bg-surface-container/40 backdrop-blur-xl shadow-lg relative overflow-hidden glass-edge border border-white/20 dark:border-white/10 group hover:bg-surface-container/50 transition-all duration-300">
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-secondary text-[22px]">batch_prediction</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Quick Classify
            </span>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(104,219,169,0.6)]"></span>
        </div>

        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-space-md">
          Input raw sensor telemetry or select calibrated benchmark presets for immediate multi-point ML categorization.
        </p>

        {/* Preset list */}
        <div className="flex flex-col gap-2 mb-space-lg">
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleSelect(preset)}
              className="w-full flex items-center justify-between px-space-md py-2.5 rounded-xl bg-surface-container-lowest/70 hover:bg-surface-container-high/80 text-left transition-all duration-150 group/btn border border-white/10"
            >
              <div className="flex items-center gap-space-xs">
                <span className={`material-symbols-outlined text-[18px] ${preset.iconColor}`}>
                  {preset.icon}
                </span>
                <div className="flex flex-col">
                  <span className="font-body-sm text-[13px] text-on-surface font-medium">
                    {preset.name}
                  </span>
                  <span className="font-label-numeric text-[11px] text-on-surface-variant">
                    Target: {preset.aqi} AQI • PM2.5: {preset.pm25}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover/btn:translate-x-1 transition-transform">
                chevron_right
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Launch CTA */}
      <button
        type="button"
        onClick={() => navigate('/classify')}
        className="w-full flex items-center justify-center gap-space-sm h-11 px-space-md rounded-xl bg-gradient-to-r from-primary-container to-secondary-container hover:opacity-95 text-on-primary font-medium shadow-md hover:shadow-primary/25 transition-all duration-200 mt-2"
      >
        <span className="font-body-md text-body-sm font-semibold">Launch Custom Classifier</span>
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute bottom-4 left-4 right-4 z-50 p-2.5 rounded-xl bg-surface-container-highest text-on-surface shadow-2xl border border-primary/40 flex items-center gap-2 backdrop-blur-xl animate-bounce">
          <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
          <span className="font-body-sm text-[12px]">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
