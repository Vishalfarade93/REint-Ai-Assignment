import React from 'react';
import { Clock, Calendar, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Logo } from './Logo';
import { getExportCsvUrl } from '../services/api';

interface NavbarProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  cutoffTime: string;
  onCutoffChange: (cutoff: string) => void;
  granularity: 'hourly' | 'half_hourly';
  onGranularityChange: (g: 'hourly' | 'half_hourly') => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navTabs = [
  { id: 'overview',     label: 'Overview' },
  { id: 'forecast',     label: 'Forecast Analysis' },
  { id: 'accuracy',     label: 'Accuracy & Metrics' },
  { id: 'explorer',     label: 'Data Explorer' },
  { id: 'methodology',  label: 'Methodology' },
];

export const Navbar: React.FC<NavbarProps> = ({
  selectedDate, onDateChange,
  cutoffTime, onCutoffChange,
  granularity, onGranularityChange,
  activeTab, onTabChange,
}) => {
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const prev = d.toISOString().split('T')[0];
    if (prev >= '2026-01-01') onDateChange(prev);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    if (next <= '2026-01-31') onDateChange(next);
  };

  const csvUrl = getExportCsvUrl(selectedDate, undefined, undefined, cutoffTime, granularity);

  return (
    <header className="site-header">
      {/* ── Top bar: Logo + Controls ── */}
      <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">

        {/* Brand mark — shared Logo component */}
        <Logo size="md" />

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Date stepper */}
          <div className="control-group">
            <button
              onClick={handlePrevDay}
              disabled={selectedDate <= '2026-01-01'}
              className="p-0.5 rounded transition hover:opacity-70 disabled:opacity-30"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-3.5 h-3.5" style={{ color: '#6b7280' }} />
            </button>
            <Calendar className="w-3.5 h-3.5" style={{ color: '#1a6b3a' }} />
            <input
              type="date"
              value={selectedDate}
              min="2026-01-01"
              max="2026-01-31"
              onChange={(e) => onDateChange(e.target.value)}
              aria-label="Delivery date"
            />
            <button
              onClick={handleNextDay}
              disabled={selectedDate >= '2026-01-31'}
              className="p-0.5 rounded transition hover:opacity-70 disabled:opacity-30"
              aria-label="Next day"
            >
              <ChevronRight className="w-3.5 h-3.5" style={{ color: '#6b7280' }} />
            </button>
          </div>

          {/* Cutoff selector */}
          <div className="control-group">
            <Clock className="w-3.5 h-3.5" style={{ color: '#d97706' }} />
            <span style={{ color: '#6b7280', fontSize: 11 }}>Cutoff (D-1)</span>
            <select
              value={cutoffTime}
              onChange={(e) => onCutoffChange(e.target.value)}
              aria-label="Day-ahead cutoff time"
              style={{ fontWeight: 600, color: '#111827' }}
            >
              <option value="08:00">08:00 UTC</option>
              <option value="10:00">10:00 UTC</option>
              <option value="11:00">11:00 UTC</option>
              <option value="12:00">12:00 UTC</option>
              <option value="16:00">16:00 UTC</option>
            </select>
          </div>

          {/* Granularity toggle */}
          <div className="toggle-group">
            <button
              className={`toggle-option${granularity === 'hourly' ? ' active' : ''}`}
              onClick={() => onGranularityChange('hourly')}
              aria-pressed={granularity === 'hourly'}
            >
              Hourly
            </button>
            <button
              className={`toggle-option${granularity === 'half_hourly' ? ' active' : ''}`}
              onClick={() => onGranularityChange('half_hourly')}
              aria-pressed={granularity === 'half_hourly'}
            >
              Half-Hourly
            </button>
          </div>

          {/* CSV Export */}
          <a
            href={csvUrl}
            download
            className="btn-outline"
            aria-label="Export data as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div className="max-w-7xl mx-auto px-6" style={{ borderTop: '1px solid #f3f4f6' }}>
        <nav className="flex gap-0 overflow-x-auto" role="tablist">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
