import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ClassifyPage } from './pages/ClassifyPage';
import { HistoryPage } from './pages/HistoryPage';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-x-hidden transition-colors duration-300">
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[640px] h-[640px] rounded-full bg-primary/10 blur-[130px]"></div>
        <div className="absolute top-1/3 -right-24 w-[580px] h-[580px] rounded-full bg-tertiary/10 blur-[140px]"></div>
        <div className="absolute -bottom-32 left-1/4 w-[720px] h-[720px] rounded-full bg-secondary-container/10 blur-[160px]"></div>
      </div>

      {/* Expandable Hover-Rail Sidebar */}
      <Sidebar />

      {/* App Shell Content */}
      <div className="pl-[72px] relative z-10 min-h-screen flex flex-col">
        <Header />

        <main className="w-full pt-20 sm:pt-24 px-4 sm:px-space-2xl pb-space-3xl flex-1 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/classify" element={<ClassifyPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
