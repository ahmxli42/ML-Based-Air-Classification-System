import React from 'react';

interface StatusBadgeProps {
  category: string;
  size?: 'sm' | 'md' | 'lg';
  band?: string;
  showBeacon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  category,
  size = 'md',
  band,
  showBeacon = true,
}) => {
  const normCategory = category.toLowerCase().trim();

  // Color mappings for Dark & Light modes
  let dotColor = 'bg-primary';
  let badgeClasses =
    'bg-primary/20 text-primary border border-primary/40 shadow-[0_0_16px_rgba(66,222,195,0.25)]';

  if (normCategory === 'good') {
    dotColor = 'bg-secondary';
    badgeClasses =
      'bg-secondary/15 text-secondary border border-secondary/40 shadow-[0_0_16px_rgba(104,219,169,0.2)] dark:bg-secondary/15 dark:text-secondary light:bg-emerald-100 light:text-emerald-700 light:border-emerald-300';
  } else if (normCategory === 'moderate') {
    dotColor = 'bg-amber-500';
    badgeClasses =
      'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-[0_0_16px_rgba(245,158,11,0.2)] dark:text-amber-400 light:bg-amber-100 light:text-amber-700 light:border-amber-300';
  } else if (normCategory === 'unhealthy') {
    dotColor = 'bg-error';
    badgeClasses =
      'bg-error-container/40 text-error border border-error/40 shadow-[0_0_24px_rgba(147,0,10,0.35)] dark:bg-error-container/40 dark:text-error light:bg-red-100 light:text-red-700 light:border-red-300';
  } else if (normCategory === 'severe' || normCategory === 'hazardous') {
    dotColor = 'bg-red-600';
    badgeClasses =
      'bg-red-950/60 text-red-400 border border-red-600/50 shadow-[0_0_24px_rgba(239,68,68,0.4)] dark:text-red-400 light:bg-red-200 light:text-red-900 light:border-red-400';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-5 py-2.5 text-headline-sm'
      : 'px-3.5 py-1.5 text-body-sm';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full font-label-caps uppercase font-bold tracking-wider backdrop-blur-md transition-all ${sizeClasses} ${badgeClasses}`}
    >
      {showBeacon && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
          ></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
        </span>
      )}
      <span>{category}</span>
      {band && (
        <span className="font-label-numeric opacity-80 normal-case font-normal text-[11px] ml-1">
          {band}
        </span>
      )}
    </div>
  );
};
