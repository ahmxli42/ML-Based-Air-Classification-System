import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export const Sidebar: React.FC = () => {
  const { isDark } = useTheme();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: 'grid_view' },
    { name: 'Classify', path: '/classify', icon: 'auto_awesome' },
    { name: 'History', path: '/history', icon: 'history' },
  ];

  return (
    <aside
      className="fixed left-0 top-0 h-screen z-50 flex flex-col justify-between p-3.5 hover:p-space-lg w-[72px] hover:w-[260px] transition-all duration-300 ease-in-out group/sidebar overflow-hidden bg-surface-container-lowest/75 dark:bg-surface-container-lowest/60 backdrop-blur-2xl glass-edge border-r border-white/20 dark:border-white/10 shadow-[0_16px_36px_rgba(15,23,42,0.08)] select-none"
    >
      {/* Brand & Navigation */}
      <div className="flex flex-col gap-space-xl">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-primary/10">
            <img
              src="/logo.svg"
              alt="AeroPure Logo"
              className="w-7 h-7 object-contain drop-shadow-sm"
            />
          </div>
          <div className="flex flex-col whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
            <span className="font-headline-sm tracking-tight text-on-surface font-bold leading-tight">
              AeroPure
            </span>
            <span className="font-label-caps uppercase tracking-wider text-primary text-[10px]">
              Classification System
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-space-xs">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => {
                const base =
                  'flex items-center gap-space-md px-3.5 py-3 rounded-xl transition-all duration-200 group/nav';
                if (isActive) {
                  return isDark
                    ? `${base} bg-primary/20 text-primary border border-primary/40 shadow-[0_0_20px_rgba(66,222,195,0.25)] font-semibold`
                    : `${base} bg-primary-container text-on-primary-container shadow-md font-semibold`;
                }
                return `${base} text-on-surface-variant hover:bg-surface-container-high/60 hover:text-on-surface`;
              }}
              title={item.name}
            >
              <span className="material-symbols-outlined text-[22px] shrink-0 group-hover/nav:scale-105 transition-transform">
                {item.icon}
              </span>
              <span className="font-body-md whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
                {item.name}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Telemetry Status Widget */}
      <div className="p-3.5 rounded-xl bg-surface-container/60 dark:bg-surface-container/50 backdrop-blur-xl border border-white/10 dark:border-white/10 flex flex-col gap-space-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            <span className="font-label-caps uppercase text-on-surface-variant tracking-wider whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200 text-[10px]">
              Telemetry Feed
            </span>
          </div>
        </div>
        <div className="flex flex-col whitespace-nowrap opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
          <p className="font-label-numeric text-[13px] text-on-surface font-semibold">
            14/14 nodes active
          </p>
          <span className="font-body-sm text-[11px] text-on-surface-variant/80">
            Sync latency 32ms
          </span>
        </div>
      </div>
    </aside>
  );
};
