import React, { useState, useMemo } from 'react';
import { HistoryRecord } from '../../types/aqi';
import { StatusBadge } from '../common/StatusBadge';

interface HistoryTableProps {
  records: HistoryRecord[];
  selectedRecord: HistoryRecord | null;
  onSelectRecord: (record: HistoryRecord) => void;
}

const ITEMS_PER_PAGE = 6;

export const HistoryTable: React.FC<HistoryTableProps> = ({
  records,
  selectedRecord,
  onSelectRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [flaggedOnly, setFlaggedOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Search
      const matchSearch =
        rec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.stationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.timestamp.toLowerCase().includes(searchQuery.toLowerCase());

      // Category
      const matchCategory =
        selectedCategory === 'all' ||
        rec.predicted_category.toLowerCase() === selectedCategory.toLowerCase();

      // Flagged
      const matchFlagged = !flaggedOnly || rec.is_unusual_reading;

      return matchSearch && matchCategory && matchFlagged;
    });
  }, [records, searchQuery, selectedCategory, flaggedOnly]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const totalFlaggedCount = useMemo(
    () => records.filter((r) => r.is_unusual_reading).length,
    [records]
  );

  const exportCSV = () => {
    const headers = [
      'Sample ID',
      'Timestamp',
      'Station',
      'PM2.5',
      'PM10',
      'SO2',
      'NO2',
      'CO',
      'O3',
      'Predicted Category',
      'Confidence',
      'Anomaly Flag',
    ];
    const rows = filteredRecords.map((r) => [
      r.id,
      r.timestamp.replace('•', '-'),
      r.stationName,
      r.pollutants.pm25,
      r.pollutants.pm10,
      r.pollutants.so2,
      r.pollutants.no2,
      r.pollutants.co,
      r.pollutants.o3,
      r.predicted_category,
      (r.confidence * 100).toFixed(1) + '%',
      r.anomalyFlag || (r.is_unusual_reading ? 'Flagged' : 'Nominal'),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `air_quality_telemetry_archive.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-space-lg w-full">
      {/* Controls & Filter Bar */}
      <div className="p-space-md rounded-2xl bg-surface-container-low/70 dark:bg-surface-container-low/60 backdrop-blur-2xl shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md border border-white/20 dark:border-white/10 glass-edge">
        {/* Search Input Well */}
        <div className="relative flex-1 min-w-[280px]">
          <span className="material-symbols-outlined absolute left-space-md top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter by sample ID, location tag, or date..."
            className="w-full bg-surface-container-lowest/80 text-on-surface placeholder:text-on-surface-variant/60 font-body-sm text-body-sm pl-11 pr-space-md py-3 rounded-xl focus:outline-none focus:bg-surface-container-lowest shadow-inner border border-white/10 transition-all"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-space-sm">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-surface-container-high/70 hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm pl-4 pr-9 py-3 rounded-xl cursor-pointer focus:outline-none transition-all border border-white/10 shadow-sm"
            >
              <option value="all">All Categories</option>
              <option value="good">Good Only</option>
              <option value="moderate">Moderate Only</option>
              <option value="unhealthy">Unhealthy Only</option>
              <option value="severe">Severe Only</option>
            </select>
            <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              expand_more
            </span>
          </div>

          {/* Anomaly Toggle Pill */}
          <button
            type="button"
            onClick={() => {
              setFlaggedOnly(!flaggedOnly);
              setCurrentPage(1);
            }}
            className={`flex items-center gap-1.5 px-space-md py-3 rounded-xl font-body-sm text-body-sm transition-all shadow-sm border ${
              flaggedOnly
                ? 'bg-error text-white border-error shadow-[0_0_16px_rgba(239,68,68,0.4)]'
                : 'bg-error/10 hover:bg-error/20 text-error border-error/20'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">shield</span>
            <span className="font-semibold">Flagged Only ({totalFlaggedCount})</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-space-xs px-space-md py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-body-sm text-body-sm font-semibold shadow-[0_8px_20px_rgba(66,222,195,0.25)] transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Telemetry Table */}
      <div className="rounded-2xl bg-surface-container-low/60 dark:bg-surface-container-low/50 backdrop-blur-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 glass-edge">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container/90 text-on-surface-variant font-label-caps uppercase tracking-wider text-[11px] border-b border-white/10">
                <th className="py-space-md px-space-lg">Sample ID &amp; Timestamp</th>
                <th className="py-space-md px-space-lg">Station / Origin</th>
                <th className="py-space-md px-space-lg">Pollutant Summary</th>
                <th className="py-space-md px-space-lg">Predicted Category</th>
                <th className="py-space-md px-space-lg">Confidence</th>
                <th className="py-space-md px-space-lg">Anomaly Flag</th>
                <th className="py-space-md px-space-lg text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-body-sm text-body-sm">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-on-surface-variant">
                    No matching classification records found.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item) => {
                  const isSelected = selectedRecord?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectRecord(item)}
                      className={`cursor-pointer transition-colors group ${
                        isSelected
                          ? 'bg-primary/15 hover:bg-primary/20'
                          : 'bg-surface-container-lowest/30 hover:bg-surface-container-high/40'
                      }`}
                    >
                      {/* ID & Timestamp */}
                      <td className="py-space-lg px-space-lg">
                        <div className="flex flex-col">
                          <span
                            className={`font-label-numeric font-semibold text-[13px] ${
                              isSelected ? 'text-primary' : 'text-on-surface'
                            }`}
                          >
                            {item.id}
                          </span>
                          <span className="font-label-numeric text-on-surface-variant text-[11px]">
                            {item.timestamp}
                          </span>
                        </div>
                      </td>

                      {/* Station */}
                      <td className="py-space-lg px-space-lg">
                        <div className="flex items-center gap-space-xs">
                          <span
                            className={`material-symbols-outlined text-[18px] ${
                              isSelected ? 'text-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            location_on
                          </span>
                          <div className="flex flex-col">
                            <span className="font-medium text-on-surface">
                              {item.stationName}
                            </span>
                            <span className="text-on-surface-variant text-[11px]">
                              {item.locationTag || item.nodeId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Pollutant Summary */}
                      <td className="py-space-lg px-space-lg">
                        <div className="flex flex-wrap gap-1.5 font-label-numeric text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-surface-container-high/80 text-on-surface border border-white/5">
                            PM2.5: <strong className="text-error">{item.pollutants.pm25}</strong>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-surface-container-high/80 text-on-surface border border-white/5">
                            PM10: {item.pollutants.pm10}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-surface-container-high/80 text-on-surface border border-white/5">
                            NO2: {item.pollutants.no2}
                          </span>
                        </div>
                      </td>

                      {/* Predicted Category */}
                      <td className="py-space-lg px-space-lg">
                        <StatusBadge category={item.predicted_category} size="sm" showBeacon={true} />
                      </td>

                      {/* Confidence Bar */}
                      <td className="py-space-lg px-space-lg">
                        <div className="flex flex-col gap-1 w-28">
                          <div className="flex justify-between font-label-numeric text-[12px] text-on-surface font-semibold">
                            <span>{(item.confidence * 100).toFixed(1)}%</span>
                            <span className="text-primary text-[10px]">High</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${item.confidence * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Anomaly Flag */}
                      <td className="py-space-lg px-space-lg">
                        {item.is_unusual_reading ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-error/20 text-error font-label-caps text-[10px] font-semibold border border-error/30">
                            <span className="material-symbols-outlined text-[13px]">warning</span>
                            <span>{item.anomalyFlag || 'Flagged'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-secondary font-label-numeric text-[12px]">
                            <span className="material-symbols-outlined text-[15px]">
                              check_circle
                            </span>
                            <span>Nominal</span>
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-space-lg px-space-lg text-right">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary font-medium text-[12px] shadow-sm">
                            <span>Selected</span>
                            <span className="material-symbols-outlined text-[15px]">
                              arrow_downward
                            </span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRecord(item);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-medium text-[12px] transition-all border border-white/10"
                          >
                            <span>Inspect</span>
                            <span className="material-symbols-outlined text-[15px]">
                              arrow_forward
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-space-lg bg-surface-container/60 dark:bg-surface-container/70 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-space-md border-t border-white/10">
          <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm text-[13px]">
            <span>
              Showing{' '}
              <strong className="text-on-surface font-label-numeric">
                {filteredRecords.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)}
              </strong>{' '}
              of <strong className="text-on-surface font-label-numeric">{filteredRecords.length}</strong>{' '}
              classification events
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-body-sm text-[12px] transition-all disabled:opacity-40 border border-white/10"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              <span>Previous</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg font-semibold font-label-numeric text-[13px] transition-all ${
                  currentPage === page
                    ? 'bg-primary text-on-primary shadow-[0_0_12px_rgba(66,222,195,0.3)]'
                    : 'bg-surface-container-high/50 hover:bg-surface-container-high text-on-surface'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface font-body-sm text-[12px] transition-all disabled:opacity-40 border border-white/10"
            >
              <span>Next</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
