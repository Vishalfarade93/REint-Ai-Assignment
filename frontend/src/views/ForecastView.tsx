import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Wind, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { ForecastResponse } from '../types/api';

interface ForecastViewProps {
  forecastData: ForecastResponse;
}

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="font-semibold mb-1.5 pb-1.5" style={{ borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#111827' }}>
        {d.time} UTC
      </div>
      <div className="flex justify-between gap-4">
        <span style={{ color: '#6b7280', fontSize: 11 }}>Forecast</span>
        <span style={{ color: '#1a6b3a', fontWeight: 700, fontSize: 11 }}>
          {Math.round(d.forecast).toLocaleString()} MW
        </span>
      </div>
      {d.publishTime !== 'N/A' && (
        <div className="flex justify-between gap-4 mt-1" style={{ borderTop: '1px solid #f3f4f6', paddingTop: 6 }}>
          <span style={{ color: '#6b7280', fontSize: 10 }}>Published</span>
          <span style={{ color: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
            {d.publishTime}
          </span>
        </div>
      )}
    </div>
  );
}

export const ForecastView: React.FC<ForecastViewProps> = ({ forecastData }) => {
  const { delivery_date, decision_cutoff_utc, granularity, summary, records } = forecastData;

  const chartData = records.map((r) => ({
    label: granularity === 'half_hourly' ? `SP${r.settlement_period}` : r.start_time.slice(11, 16),
    time:  r.start_time.slice(11, 16),
    forecast: r.forecast_mw ?? 0,
    publishTime: r.forecast_publish_time ? r.forecast_publish_time.replace('T', ' ').slice(0, 16) : 'N/A',
  }));

  const factor         = granularity === 'hourly' ? 1.0 : 0.5;
  const validForecasts = records.filter((r) => r.forecast_mw !== null && r.forecast_mw !== undefined);
  const totalEnergyGWh = (validForecasts.reduce((acc, r) => acc + (r.forecast_mw || 0), 0) * factor) / 1000;
  const pubTimes       = Array.from(new Set(records.map((r) => r.forecast_publish_time).filter(Boolean)));
  const maxForecast    = Math.max(...chartData.map((d) => d.forecast));

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <p className="section-label mb-1">WINDFOR DATASET AUDIT</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black leading-tight" style={{ color: '#111827' }}>
              Wind Generation Forecast Reconstruction
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
              Each value represents the most recent forecast published at or before the day-ahead cutoff.
            </p>
          </div>
          <div
            className="flex items-center gap-4 px-4 py-2.5 rounded-lg"
            style={{ background: '#fff', border: '1px solid #e5e7eb' }}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: '#d97706' }} />
              <div>
                <p className="stat-label">ACTIVE CUTOFF</p>
                <p className="text-xs font-bold" style={{ color: '#111827', fontFamily: 'JetBrains Mono, monospace' }}>
                  {decision_cutoff_utc.slice(11, 16)} UTC (D-1)
                </p>
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: '#e5e7eb' }} />
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: '#1a6b3a' }} />
              <div>
                <p className="stat-label">PUBLICATION RUNS</p>
                <p className="text-xs font-bold" style={{ color: '#111827', fontFamily: 'JetBrains Mono, monospace' }}>
                  {pubTimes.length} batch(es)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderColor: '#e5e7eb' }}>
          {[
            { label: 'AVG FORECAST',  val: `${Math.round(summary.avg_forecast_mw || 0).toLocaleString()} MW` },
            { label: 'PEAK FORECAST', val: `${Math.round(summary.max_forecast_mw || 0).toLocaleString()} MW` },
            { label: 'MIN FORECAST',  val: `${Math.round(summary.min_forecast_mw || 0).toLocaleString()} MW` },
            { label: 'TOTAL ENERGY',  val: `${totalEnergyGWh.toFixed(2)} GWh` },
          ].map((s) => (
            <div key={s.label} style={{ padding: '14px 20px' }}>
              <p className="stat-label mb-1">{s.label}</p>
              <p className="text-[17px] font-black" style={{ color: '#111827' }}>{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className="card animate-fade-in" style={{ padding: '24px' }}>
        <div className="mb-4">
          <p className="section-label mb-0.5">FORECAST PROFILE</p>
          <h2 className="text-base font-bold" style={{ color: '#111827' }}>
            Hourly Wind Generation Forecast
          </h2>
        </div>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="2 4" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#d1d5db"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
              />
              <YAxis
                stroke="#d1d5db"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                tickFormatter={(v) => `${v}`}
                width={48}
              />
              <Tooltip content={<BarTooltip />} cursor={{ fill: '#f0faf4' }} />
              <Bar dataKey="forecast" radius={[3, 3, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.forecast >= maxForecast * 0.9 ? '#0f4524' : '#1a6b3a'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interval manifest table */}
      <div className="card animate-fade-in" style={{ overflow: 'hidden' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <p className="section-label mb-0.5">INTERVAL MANIFEST</p>
            <h3 className="text-sm font-bold" style={{ color: '#111827' }}>
              Eligible Forecast Records at Cutoff
            </h3>
          </div>
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded"
            style={{ background: '#f0faf4', color: '#1a6b3a', border: '1px solid #b8eacf' }}
          >
            {records.length} intervals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>#</th>
                <th>Interval (UTC)</th>
                {granularity === 'half_hourly' && <th>Settlement Period</th>}
                <th>Forecast (MW)</th>
                <th>Publication Time</th>
                <th>Cutoff Met</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const valid = r.forecast_mw !== null && r.forecast_mw !== undefined;
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
                      {valid ? `${Math.round(r.forecast_mw!).toLocaleString()} MW` : '—'}
                    </td>
                    <td style={{ color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}>
                      {r.forecast_publish_time ? r.forecast_publish_time.replace('T', ' ').slice(0, 16) : '—'}
                    </td>
                    <td>
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded"
                        style={{ background: '#f0faf4', color: '#1a6b3a', border: '1px solid #b8eacf' }}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Yes
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 600, color: valid ? '#16a34a' : '#dc2626' }}>
                        {valid ? 'Valid' : 'Missing'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
