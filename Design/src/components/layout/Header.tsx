import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

export const Header: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = now.toLocaleDateString('en-US', { weekday: 'long' });
      const monthDay = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      setTimeStr(`${day}, ${monthDay} • ${time}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 left-[72px] right-0 h-16 sm:h-20 bg-surface-container-lowest/70 dark:bg-surface-container-lowest/50 backdrop-blur-2xl glass-edge border-b border-white/20 dark:border-white/10 z-40 px-space-md sm:px-space-2xl flex items-center justify-between transition-all">
      {/* Title block */}
      <div className="flex items-center gap-space-md">
        <div className="flex flex-col">
          <span className="font-headline-sm text-[16px] sm:text-headline-sm text-on-surface tracking-tight font-semibold leading-tight">
            Air Quality Classification System
          </span>
          <span className="font-label-caps text-secondary text-[10px] hidden sm:block">
            Real-Time Atmospheric Telemetry &amp; Inference
          </span>
        </div>
      </div>

      {/* Right controls: Live indicator, Light/Dark toggle, Profile */}
      <div className="flex items-center gap-space-sm sm:gap-space-lg">
        {/* Live timestamp chip */}
        <div className="hidden lg:flex items-center gap-space-sm px-space-md py-1.5 rounded-full bg-surface-container-low/70 border border-white/10 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          <span className="font-label-numeric text-[13px] text-on-surface-variant">
            {timeStr || 'Connecting live clock...'}
          </span>
          <span className="mx-1 text-outline-variant">|</span>
          <span className="font-label-caps text-[10px] uppercase text-secondary font-semibold tracking-wide">
            Live Data Feed
          </span>
        </div>

        {/* Light / Dark Mode Toggle Switch (Sun/Moon Pill) */}
        <div className="flex items-center bg-surface-container/70 dark:bg-surface-container-high/60 rounded-full p-1 border border-white/20 dark:border-white/10 shadow-sm backdrop-blur-md">
          <button
            type="button"
            onClick={() => isDark && toggleTheme()}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
              !isDark
                ? 'bg-primary text-white shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Switch to Light Mode"
            aria-label="Light Mode"
          >
            <span className="material-symbols-outlined text-[18px]">light_mode</span>
          </button>
          <button
            type="button"
            onClick={() => !isDark && toggleTheme()}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
              isDark
                ? 'bg-primary-container text-on-primary shadow-md'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            title="Switch to Dark Mode"
            aria-label="Dark Mode"
          >
            <span className="material-symbols-outlined text-[18px]">dark_mode</span>
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-space-sm p-1 sm:pr-space-md rounded-full bg-surface-container/60 hover:bg-surface-container-high/60 border border-white/20 dark:border-white/10 backdrop-blur-xl transition-all cursor-pointer shadow-sm">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs ring-1 ring-white/30 overflow-hidden">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface-container-lowest"></span>
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="font-body-sm text-[13px] font-semibold text-on-surface leading-tight">
              Dr. Anya Sharma
            </span>
            <span className="font-label-caps text-[10px] text-on-surface-variant leading-none">
              Lead Atmospheric Scientist
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
