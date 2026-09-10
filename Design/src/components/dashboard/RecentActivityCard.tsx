import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHistory } from '../../context/HistoryContext';
import { StatusBadge } from '../common/StatusBadge';

export const RecentActivityCard: React.FC = () => {
  const navigate = useNavigate();
  const { records, setSelectedRecord } = useHistory();

  const recent = records.slice(0, 3);

  const handleInspect = (record: typeof records[0]) => {
    setSelectedRecord(record);
    navigate('/history');
  };

  return (
    <div className="flex flex-col justify-between p-6 sm:p-[28px] rounded-2xl bg-surface-container/60 dark:bg-surface-container/40 backdrop-blur-xl shadow-lg relative overflow-hidden glass-edge border border-white/20 dark:border-white/10 group hover:bg-surface-container/50 transition-all duration-300">
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-space-md">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-tertiary text-[22px]">history</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Recent Activity
            </span>
          </div>
          <span className="font-label-caps text-[10px] uppercase text-on-surface-variant bg-surface-container-lowest/60 px-2 py-0.5 rounded border border-white/10">
            Telemetry Ingest
          </span>
        </div>

        {/* Records list */}
        <div className="flex flex-col gap-2.5">
          {recent.map((item) => (
            <div
              key={item.id}
              onClick={() => handleInspect(item)}
              className="p-3 rounded-xl bg-surface-container-lowest/60 hover:bg-surface-container-high/60 transition-all flex flex-col gap-1.5 cursor-pointer border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-numeric text-[13px] font-semibold text-on-surface">
                    {item.id}
                  </span>
                  <span className="font-body-sm text-[12px] text-on-surface-variant/80 truncate max-w-[140px]">
                    • {item.stationName}
                  </span>
                </div>
                <span className="font-label-numeric text-[11px] text-on-surface-variant">
                  {item.timestamp.split('•')[0].trim()}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <StatusBadge category={item.predicted_category} size="sm" showBeacon={false} />
                <span className="font-label-numeric text-[12px] text-on-surface-variant">
                  {(item.confidence * 100).toFixed(1)}% Confidence
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer navigation link */}
      <div className="pt-space-md mt-2 border-t border-white/10">
        <button
          type="button"
          onClick={() => navigate('/history')}
          className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-primary hover:underline transition-colors font-medium"
        >
          <span>View all {records.length} entries in History</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
