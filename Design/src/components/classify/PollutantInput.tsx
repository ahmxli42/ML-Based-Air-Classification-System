import React from 'react';

interface PollutantInputProps {
  id: string;
  symbol: string;
  name: string;
  unit: string;
  value: number;
  icon: string;
  subscript?: string;
  description: string;
  baseline: string;
  isAlert?: boolean;
  onChange: (val: number) => void;
}

export const PollutantInput: React.FC<PollutantInputProps> = ({
  id,
  symbol,
  name,
  unit,
  value,
  icon,
  subscript,
  description,
  baseline,
  isAlert = false,
  onChange,
}) => {
  return (
    <div
      className={`flex flex-col gap-space-xs p-space-md rounded-xl backdrop-blur-md transition-all shadow-inner border border-white/10 ${
        isAlert
          ? 'bg-error-container/20 border-error/30'
          : 'bg-surface-container-lowest/60 focus-within:bg-surface-container-lowest/90'
      }`}
    >
      {/* Top label and unit */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-1.5 cursor-pointer"
        >
          <span>
            {symbol}
            {subscript && <sub className="text-[11px]">{subscript}</sub>}
          </span>
          <span className="font-body-sm text-[12px] text-on-surface-variant font-normal">
            ({name})
          </span>
        </label>
        <span className="font-label-numeric text-[11px] px-2 py-0.5 rounded bg-surface-container-highest text-primary font-semibold">
          {unit}
        </span>
      </div>

      {/* Input row */}
      <div className="relative flex items-center mt-1">
        <input
          id={id}
          type="number"
          step="0.1"
          value={isNaN(value) ? '' : value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-transparent font-label-numeric text-headline-md text-on-surface outline-none placeholder:text-outline-variant focus:text-primary transition-colors tabular-nums font-bold"
        />
        <span className="material-symbols-outlined text-on-surface-variant/60 text-[20px] pointer-events-none">
          {icon}
        </span>
      </div>

      {/* Bottom baseline comparison */}
      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-body-sm">
        <span className="font-body-sm text-[11px] text-on-surface-variant/80 truncate">
          {description}
        </span>
        <span
          className={`font-label-numeric text-[11px] font-medium shrink-0 ml-1 ${
            isAlert ? 'text-error' : 'text-on-surface-variant'
          }`}
        >
          {baseline}
        </span>
      </div>
    </div>
  );
};
