import React from 'react';

interface AnomalyBannerProps {
  customMessage?: string;
  ratio?: number;
}

export const AnomalyBanner: React.FC<AnomalyBannerProps> = ({
  customMessage,
  ratio = 0.58,
}) => {
  return (
    <div className="flex items-start gap-space-md p-space-md rounded-xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-xl shadow-lg transition-all animate-fadeIn">
      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
        <span className="material-symbols-outlined text-[24px]">warning_amber</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-headline-sm text-body-lg font-semibold text-on-surface flex items-center gap-2">
          <span>Atypical Atmospheric Pattern Detected</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-label-caps text-[10px] uppercase font-bold tracking-wider">
            Flagged Reading
          </span>
        </span>
        <p className="font-body-md text-on-surface-variant text-body-sm leading-relaxed">
          {customMessage || (
            <>
              Notice: This reading looks unusual compared to typical historical patterns. The{' '}
              <strong className="text-on-surface">PM<sub>2.5</sub> to PM<sub>10</sub> ratio is {ratio.toFixed(2)}</strong>,
              indicating a potential localized vehicular exhaust or biomass spike trapped under a thermal inversion boundary layer.
            </>
          )}
        </p>
      </div>
    </div>
  );
};
