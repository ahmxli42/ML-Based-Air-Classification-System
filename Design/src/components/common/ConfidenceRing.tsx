import React from 'react';

interface ConfidenceRingProps {
  confidence: number; // 0 to 1
  size?: number; // default 96 (w-24 h-24)
}

export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({
  confidence,
  size = 96,
}) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const clampedConfidence = Math.min(Math.max(confidence, 0), 1);
  const strokeDashoffset = circumference * (1 - clampedConfidence);
  const percentage = (clampedConfidence * 100).toFixed(1);

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        className="transform -rotate-90"
        style={{ width: size, height: size }}
        viewBox="0 0 100 100"
      >
        {/* Track */}
        <circle
          className="text-surface-container-highest dark:text-surface-container-highest/60 opacity-60"
          cx="50"
          cy="50"
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
        />
        {/* Fill */}
        <circle
          className="text-primary transition-all duration-1000 ease-out"
          cx="50"
          cy="50"
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-label-numeric font-bold text-headline-sm sm:text-headline-md leading-none text-on-surface">
          {percentage}%
        </span>
        <span className="font-label-caps text-[9px] uppercase tracking-tighter text-primary mt-0.5">
          Certainty
        </span>
      </div>
    </div>
  );
};
