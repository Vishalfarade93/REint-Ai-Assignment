import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { IntervalRecord } from '../types/api';
import { getExportCsvUrl } from '../services/api';

interface DataExplorerViewProps {
  records: IntervalRecord[];
  selectedDate: string;
  cutoffTime: string;
  granularity: 'hourly' | 'half_hourly';
}

type SortField = 'interval_index' | 'forecast_mw' | 'actual_mw' | 'forecast_error_mw' | 'absolute_error_mw';
type SortOrder = 'asc' | 'desc';

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({
  records, selectedDate, cutoffTime, granularity,
}) => {
  const [searchTerm,   setSearchTerm]   = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'matched' | 'missing' | 'high_error'>('all');
  const [sortField,    setSortField]    = useState<SortField>('interval_index');
  const [sortOrder,    setSortOrder]    = useState<SortOrder>('asc');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [pageSize,     setPageSize]     = useState(12);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        const matchesSearch =
          r.start_time.includes(searchTerm) ||
          r.interval_index.toString().includes(searchTerm) ||
          (r.settlement_period && r.settlement_period.toString().includes(searchTerm));
        if (!matchesSearch) return false;
        if (statusFilter === 'matched')    return r.status === 'matched';
        if (statusFilter === 'missing')    return r.status !== 'matched';
        if (statusFilter === 'high_error') return (r.absolute_error_mw ?? 0) > 1000;
        return true;
      })
      .sort((a, b) => {
        let va: any = a[sortField];
        let vb: any = b[sortField];
        if (va == null) va = -999999;
        if (vb == null) vb = -999999;
        if (va < vb) return sortOrder === 'asc' ? -1 : 1;
        if (va > vb) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [records, searchTerm, statusFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginated  = useMemo(() => {
    const s = (currentPage - 1) * pageSize;
    return filteredRecords.slice(s, s + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const csvUrl = getExportCsvUrl(selectedDate, undefined, undefined, cutoffTime, granularity);

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:opacity-70 transition"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}
    >
      {label}
      <ArrowUpDown className="w-2.5 h-2.5" style={{ opacity: sortField === field ? 1 : 0.4 }} />
    </button>
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-label mb-1">ANALYTICAL DATA</p>
          <h1 className="text-2xl font-black leading-tight" style={{ color: '#111827' }}>
            Interval Data Explorer
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Inspect forecast lineage, publication times, actuals, and error calculations.
          </p>
        </div>
        <a href={csvUrl} download className="btn-primary">
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </a>
      </div>

      {/* Filter bar */}
      <div
        className="card"
        style={{ padding: '16px 20px' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Search time or interval…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{
                width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
                border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#111827',
                background: '#f8faf9', outline: 'none', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Status filter */}
          <div className="relative flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: '#9ca3af' }} />
            <select
              value={statusFilter}
              onChange={(e: any) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              style={{
                flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8,
                fontSize: 12, color: '#111827', background: '#f8faf9', outline: 'none',
                fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <option value="all">All records ({records.length})</option>
              <option value="matched">Matched only</option>
              <option value="high_error">High error ({'>'} 1,000 MW)</option>
              <option value="missing">Missing forecast / actual</option>
            </select>
          </div>

          {/* Page size */}
          <div className="flex items-center justify-end gap-3">
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              style={{
                padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 8,
                fontSize: 12, color: '#111827', background: '#f8faf9', outline: 'none',
                fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="card animate-fade-in" style={{ overflow: 'hidden' }}>
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th><SortBtn field="interval_index" label="#" /></th>
                <th>Interval (UTC)</th>
                {granularity === 'half_hourly' && <th>SP</th>}
                <th><SortBtn field="forecast_mw" label="Forecast" /></th>
                <th>Publication Run</th>
                <th><SortBtn field="actual_mw" label="Actual" /></th>
                <th><SortBtn field="forecast_error_mw" label="Error (F − A)" /></th>
                <th><SortBtn field="absolute_error_mw" label="Abs Error" /></th>
                <th>% Error</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? paginated.map((r) => {
                const err = r.forecast_error_mw;
                const isOver    = err != null && err > 0;
                const isHighErr = (r.absolute_error_mw ?? 0) > 1000;
                return (
                  <tr key={r.interval_index}>
                    <td style={{ color: '#9ca3af' }}>{r.interval_index}</td>
                    <td style={{ fontWeight: 600, color: '#374151', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                      {r.start_time.slice(11, 16)} – {r.end_time.slice(11, 16)}
                    </td>
                    {granularity === 'half_hourly' && (
                      <td style={{ color: '#6b7280' }}>SP {r.settlement_period}</td>
                    )}
                    <td style={{ fontWeight: 700, color: '#1a6b3a', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                      {r.forecast_mw != null ? `${Math.round(r.forecast_mw).toLocaleString()} MW` : '—'}
                    </td>
                    <td style={{ color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                      {r.forecast_publish_time
                        ? r.forecast_publish_time.slice(5, 16).replace('T', ' ') + ' UTC'
                        : '—'}
                    </td>
                    <td style={{ fontWeight: 700, color: '#2563eb', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                      {r.actual_mw != null ? `${Math.round(r.actual_mw).toLocaleString()} MW` : '—'}
                    </td>
                    <td style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: err != null ? (isOver ? '#d97706' : '#2563eb') : '#9ca3af' }}>
                      {err != null
                        ? (err > 0 ? `+${Math.round(err)} MW` : `${Math.round(err)} MW`)
                        : '—'}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: isHighErr ? '#dc2626' : '#374151', fontWeight: isHighErr ? 700 : 400 }}>
                      {r.absolute_error_mw != null ? `${Math.round(r.absolute_error_mw).toLocaleString()} MW` : '—'}
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6b7280' }}>
                      {r.percentage_error != null ? `${r.percentage_error.toFixed(1)}%` : '—'}
                    </td>
                    <td>
                      {r.status === 'matched' ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded"
                          style={{ background: '#f0faf4', color: '#1a6b3a', border: '1px solid #b8eacf' }}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Matched
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded"
                          style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}
                        >
                          <AlertCircle className="w-2.5 h-2.5" />
                          {r.status.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: '#9ca3af', fontSize: 13 }}>
                    No records matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid #e5e7eb', background: '#f8faf9' }}
        >
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            Showing{' '}
            <strong style={{ color: '#111827' }}>
              {filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </strong>
            {' '}–{' '}
            <strong style={{ color: '#111827' }}>
              {Math.min(currentPage * pageSize, filteredRecords.length)}
            </strong>
            {' '}of{' '}
            <strong style={{ color: '#111827' }}>{filteredRecords.length}</strong>
            {' '}records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{
                padding: '5px 8px', borderRadius: 6, border: '1px solid #e5e7eb',
                background: '#fff', cursor: 'pointer', opacity: currentPage <= 1 ? 0.3 : 1,
              }}
            >
              <ChevronLeft className="w-3.5 h-3.5" style={{ color: '#374151' }} />
            </button>
            <span style={{ fontSize: 12, color: '#374151', fontFamily: 'JetBrains Mono, monospace' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={{
                padding: '5px 8px', borderRadius: 6, border: '1px solid #e5e7eb',
                background: '#fff', cursor: 'pointer', opacity: currentPage >= totalPages ? 0.3 : 1,
              }}
            >
              <ChevronRight className="w-3.5 h-3.5" style={{ color: '#374151' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
