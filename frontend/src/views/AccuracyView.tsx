import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  Cell,
} from 'recharts';
import { Target, TrendingUp, TrendingDown, Calendar, RefreshCw, AlertTriangle } from 'lucide-react';
import { ForecastResponse, AccuracyMetrics, AccuracyResponse } from '../types/api';
import { fetchAccuracy } from '../services/api';

interface AccuracyViewProps {
  forecastData: ForecastResponse;
  metrics: AccuracyMetrics | null;
  cutoffTime: string;
  granularity: 'hourly' | 'half_hourly';
}

function ErrorTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const err = d.signedError;
  return (
    <div className="chart-tooltip">
      <div className="font-semibold mb-1.5 pb-1.5" style={{ borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#111827' }}>
        {label}
      </div>
      <div className="flex justify-between gap-4 mb-1">
        <span style={{ fontSize: 11, color: '#6b7280' }}>Forecast</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1a6b3a' }}>
          {d.forecast != null ? Math.round(d.forecast).toLocaleString() + ' MW' : '—'}
        </span>
      </div>
      <div className="flex justify-between gap-4 mb-1">
        <span style={{ fontSize: 11, color: '#6b7280' }}>Actual</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb' }}>
          {d.actual != null ? Math.round(d.actual).toLocaleString() + ' MW' : '—'}
        </span>
      </div>
      <div
        className="flex justify-between gap-4 pt-1.5 mt-1.5"
        style={{ borderTop: '1px solid #f3f4f6' }}
      >
        <span style={{ fontSize: 11, color: '#6b7280' }}>Error</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: err >= 0 ? '#d97706' : '#2563eb' }}>
          {err >= 0 ? `+${Math.round(err)}` : Math.round(err)} MW
        </span>
      </div>
    </div>
  );
}

function MonthlyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="font-semibold mb-1.5 pb-1.5" style={{ borderBottom: '1px solid #e5e7eb', fontSize: 12, color: '#111827' }}>
        {d.fullDate}
      </div>
      <div className="flex justify-between gap-4 mb-1">
        <span style={{ fontSize: 11, color: '#6b7280' }}>MAE</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1a6b3a' }}>
          {Math.round(d.mae).toLocaleString()} MW
        </span>
      </div>
      <div className="flex justify-between gap-4">
        <span style={{ fontSize: 11, color: '#6b7280' }}>Bias</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: d.bias >= 0 ? '#d97706' : '#2563eb' }}>
          {d.bias >= 0 ? '+' : ''}{Math.round(d.bias)} MW
        </span>
      </div>
    </div>
  );
}

export const AccuracyView: React.FC<AccuracyViewProps> = ({
  forecastData, metrics, cutoffTime, granularity,
}) => {
  const { delivery_date, records } = forecastData;

  const [monthlyAccuracy, setMonthlyAccuracy] = useState<AccuracyResponse | null>(null);
  const [loadingMonthly, setLoadingMonthly]   = useState(false);
  const [errorMonthly, setErrorMonthly]       = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoadingMonthly(true);
    setErrorMonthly(null);
    fetchAccuracy('2026-01-01', '2026-01-31', cutoffTime, granularity)
      .then((d) => { if (mounted) setMonthlyAccuracy(d); })
      .catch((e) => { if (mounted) setErrorMonthly(e.message); })
      .finally(() => { if (mounted) setLoadingMonthly(false); });
    return () => { mounted = false; };
  }, [cutoffTime, granularity]);

  const errorChartData = records.map((r) => {
    const label = granularity === 'half_hourly'
      ? `SP${r.settlement_period}`
      : r.start_time.slice(11, 16);
    return {
      label,
      forecast:    r.forecast_mw ?? null,
      actual:      r.actual_mw ?? null,
      signedError: r.forecast_error_mw ?? 0,
      absError:    r.absolute_error_mw ?? 0,
    };
  });

  const biasValue      = metrics?.bias_mw ?? 0;
  const isOverforecast = biasValue > 0;

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <p className="section-label mb-1">STATISTICAL PERFORMANCE</p>
        <h1 className="text-2xl font-black leading-tight" style={{ color: '#111827' }}>
          Accuracy &amp; Error Decomposition
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
          Delivery date: <strong style={{ color: '#374151' }}>{delivery_date}</strong>
          {' · '}Metrics computed over valid matched intervals, zero synthetic interpolation.
        </p>
      </div>

      {/* KPI strip */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderColor: '#e5e7eb' }}>
          {[
            {
              label: 'MAE',
              val: metrics?.mae_mw ? `${Math.round(metrics.mae_mw).toLocaleString()} MW` : '—',
              sub: 'Mean absolute error',
              color: '#1a6b3a',
            },
            {
              label: 'RMSE',
              val: metrics?.rmse_mw ? `${Math.round(metrics.rmse_mw).toLocaleString()} MW` : '—',
              sub: 'Quadratic-weighted error',
              color: '#374151',
            },
            {
              label: 'BIAS (MEAN ERROR)',
              val: `${biasValue > 0 ? '+' : ''}${Math.round(biasValue).toLocaleString()} MW`,
              sub: isOverforecast ? 'Net overforecasting' : 'Net underforecasting',
              color: isOverforecast ? '#d97706' : '#2563eb',
            },
            {
              label: 'MAPE',
              val: metrics?.mape_percent != null ? `${metrics.mape_percent}%` : '—',
              sub: 'Non-zero actuals only',
              color: '#374151',
            },
          ].map((s) => (
            <div key={s.label} style={{ padding: '16px 20px' }}>
              <p className="stat-label mb-1">{s.label}</p>
              <p className="text-[20px] font-black leading-tight" style={{ color: s.color }}>{s.val}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#9ca3af' }}>{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Error bar chart */}
      <div className="card animate-fade-in" style={{ padding: '24px' }}>
        <div className="mb-4">
          <p className="section-label mb-0.5">INTERVAL ERROR</p>
          <h2 className="text-base font-bold" style={{ color: '#111827' }}>
            Forecast Error by Interval (Forecast − Actual)
          </h2>
          <p className="text-[12px] mt-0.5" style={{ color: '#6b7280' }}>
            <span style={{ color: '#d97706', fontWeight: 600 }}>Positive (amber)</span>
            {' = Overforecast · '}
            <span style={{ color: '#2563eb', fontWeight: 600 }}>Negative (blue)</span>
            {' = Underforecast'}
          </p>
        </div>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={errorChartData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="2 4" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" stroke="#d1d5db" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} />
              <YAxis stroke="#d1d5db" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} tickFormatter={(v) => `${v}`} width={52} />
              <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1.5} />
              <Tooltip content={<ErrorTooltip />} cursor={{ fill: '#f9fafb' }} />
              <Bar dataKey="signedError" radius={[3, 3, 0, 0]}>
                {errorChartData.map((d, i) => (
                  <Cell key={i} fill={d.signedError >= 0 ? '#d97706' : '#2563eb'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly accuracy trend */}
      <div className="card animate-fade-in" style={{ padding: '24px' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="section-label mb-0.5">MONTHLY TREND</p>
            <h2 className="text-base font-bold" style={{ color: '#111827' }}>
              January 2026 — Daily MAE &amp; Bias
            </h2>
          </div>
          {loadingMonthly && (
            <div className="flex items-center gap-2" style={{ color: '#1a6b3a' }}>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="text-xs">Computing…</span>
            </div>
          )}
        </div>

        {/* Monthly aggregate stats */}
        {monthlyAccuracy && (
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-4 rounded-lg"
            style={{ background: '#f8faf9', border: '1px solid #e5e7eb' }}
          >
            {[
              { label: 'JAN MAE',    val: monthlyAccuracy.metrics.mae_mw ? `${Math.round(monthlyAccuracy.metrics.mae_mw).toLocaleString()} MW` : '—', color: '#1a6b3a' },
              { label: 'JAN RMSE',   val: monthlyAccuracy.metrics.rmse_mw ? `${Math.round(monthlyAccuracy.metrics.rmse_mw).toLocaleString()} MW` : '—', color: '#374151' },
              { label: 'JAN BIAS',   val: monthlyAccuracy.metrics.bias_mw ? `${monthlyAccuracy.metrics.bias_mw > 0 ? '+' : ''}${Math.round(monthlyAccuracy.metrics.bias_mw)} MW` : '—', color: '#d97706' },
              { label: 'MATCHED PTS', val: monthlyAccuracy.metrics.matched_intervals.toLocaleString(), color: '#374151' },
            ].map((s) => (
              <div key={s.label}>
                <p className="stat-label mb-1">{s.label}</p>
                <p className="text-base font-black" style={{ color: s.color }}>{s.val}</p>
              </div>
            ))}
          </div>
        )}

        {errorMonthly ? (
          <div
            className="p-4 rounded-lg text-xs"
            style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626' }}
          >
            {errorMonthly}
          </div>
        ) : monthlyAccuracy ? (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyAccuracy.daily_summaries.map((d) => ({
                  date:     d.date.slice(5),
                  fullDate: d.date,
                  mae:      d.mae_mw ?? 0,
                  bias:     d.bias_mw ?? 0,
                }))}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 4" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" stroke="#d1d5db" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} />
                <YAxis stroke="#d1d5db" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} width={48} />
                <ReferenceLine y={0} stroke="#d1d5db" strokeWidth={1} />
                <Tooltip content={<MonthlyTooltip />} cursor={{ fill: '#f9fafb' }} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                  formatter={(v) => <span style={{ color: '#374151' }}>{v}</span>}
                />
                <Bar dataKey="mae" name="MAE (MW)" fill="#1a6b3a" radius={[2, 2, 0, 0]} barSize={14} />
                <Line type="monotone" dataKey="bias" name="Bias (MW)" stroke="#d97706" strokeWidth={2} dot={{ r: 2, fill: '#d97706' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
    </div>
  );
};
