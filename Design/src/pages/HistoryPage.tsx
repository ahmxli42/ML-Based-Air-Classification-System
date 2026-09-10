import React from 'react';
import { useHistory } from '../context/HistoryContext';
import { HistoryTable } from '../components/history/HistoryTable';
import { DetailModal } from '../components/history/DetailModal';

export const HistoryPage: React.FC = () => {
  const { records, selectedRecord, setSelectedRecord } = useHistory();

  const flaggedCount = records.filter((r) => r.is_unusual_reading).length;
  const meanAccuracy = (
    (records.reduce((acc, r) => acc + r.confidence, 0) / (records.length || 1)) *
    100
  ).toFixed(1);

  return (
    <div className="flex flex-col w-full gap-space-2xl">
      {/* SECTION HEADER & ARCHIVE METRICS */}
      <section className="flex flex-col gap-space-lg">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-3xl">
            <div className="flex items-center gap-space-sm mb-space-xxs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container/70 backdrop-blur-xl text-primary font-label-caps uppercase tracking-wider text-[10px] shadow-sm border border-white/10">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Inference Telemetry Archive
              </span>
              <span className="text-on-surface-variant font-label-numeric text-[12px]">
                Build v4.82-production
              </span>
            </div>
            <h1 className="font-display-lg text-headline-lg sm:text-display-lg text-on-surface tracking-tight font-semibold">
              Classification History &amp; Historical Archive
            </h1>
            <p className="font-body-md text-on-surface-variant text-[14px]">
              Historical sensor telemetry classifications, ML prediction confidence scores, and flagged atmospheric anomalies.
            </p>
          </div>

          {/* Live Quick Stats Strip */}
          <div className="flex items-center gap-space-md p-2 rounded-2xl bg-surface-container-low/60 backdrop-blur-xl shadow-lg border border-white/10">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-container/80 border border-white/5">
              <span className="material-symbols-outlined text-primary text-[22px]">database</span>
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                  Total Records
                </span>
                <span className="font-label-numeric text-[14px] text-on-surface font-semibold">
                  {records.length} Events
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-container/80 border border-white/5">
              <span className="material-symbols-outlined text-error text-[22px]">warning</span>
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                  Anomalies
                </span>
                <span className="font-label-numeric text-[14px] text-error font-semibold">
                  {flaggedCount} Flagged
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-surface-container/80 border border-white/5">
              <span className="material-symbols-outlined text-secondary text-[22px]">psychology</span>
              <div className="flex flex-col">
                <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                  Mean Confidence
                </span>
                <span className="font-label-numeric text-[14px] text-secondary font-semibold">
                  {meanAccuracy}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Table */}
      <HistoryTable
        records={records}
        selectedRecord={selectedRecord}
        onSelectRecord={setSelectedRecord}
      />

      {/* Selected Detail View Inspector */}
      {selectedRecord && (
        <DetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};
