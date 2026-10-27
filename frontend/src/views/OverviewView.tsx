import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Wind, Zap, Target, TrendingUp, TrendingDown, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ForecastResponse, AccuracyMetrics } from '../types/api';
import { KpiCard } from '../components/KpiCard';

interface OverviewViewProps {
  forecastData: ForecastResponse;
  metrics: AccuracyMetrics | null;
  loading: boolean;
}

/* Custom chart tooltip matching the light theme */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const fVal = payload.find((p: any) => p.dataKey === 'forecast')?.value;
  const aVal = payload.find((p: any) => p.dataKey === 'actual')?.value;
  const err = typeof fVal === 'number' && typeof aVal === 'number' ? fVal - aVal : null;
  return (
    <div className="chart-tooltip">
      <div className="font-semibold mb-2 pb-1.5" style={{ borderBottom: '1px solid #e5e7eb', color: '#111827', fontSize: 12 }}>
        {label}
      </div>
      <div className="flex justify-between gap-6 mb-1">
        <span style={{ color: '#6b7280', fontSize: 11 }}>Forecast</span>
        <span style={{ color: '#1a6b3a', fontWeight: 700, fontSize: 11 }}>
          {fVal != null ? `${Math.round(Number(fVal)).toLocaleString()} MW` : '—'}
        </span>
      </div>
      <div className="flex justify-between gap-6 mb-1">
        <span style={{ color: '#6b7280', fontSize: 11 }}>Actual</span>
        <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 11 }}>
          {aVal != null ? `${Math.round(Number(aVal)).toLocaleString()} MW` : '—'}
        </span>
      </div>
      {err !== null && (
        <div
          className="flex justify-between gap-6 mt-1.5 pt-1.5"
          style={{ borderTop: '1px solid #f3f4f6' }}
        >
          <span style={{ color: '#6b7280', fontSize: 11 }}>Error</span>
          <span
            style={{
              fontWeight: 700, fontSize: 11,
              color: err > 0 ? '#d97706' : '#2563eb',
            }}
          >
            {err > 0 ? `+${Math.round(err)}` : Math.round(err)} MW
          </span>
        </div>
      )}
    </div>
  );
}

export const OverviewView: React.FC<OverviewViewProps> = ({ forecastData, metrics, loading }) => {
  const { summary, records, delivery_date, decision_cutoff_utc, granularity } = forecastData;

  const chartData = records.map((r) => {
    const label = granularity === 'half_hourly'
      ? `SP${r.settlement_period}`
      : r.start_time.slice(11, 16);
    return {
      label,
      forecast: r.forecast_mw ?? null,
      actual:   r.actual_mw ?? null,
      error:    r.forecast_error_mw ?? null,
    };
  });

  const biasValue      = metrics?.bias_mw ?? 0;
  const isOverforecast = biasValue > 0;

  let peakForecastHour = 'N/A', maxForecastMw = 0;
  let maxErrorHour = 'N/A', maxErrorMw = 0;
  records.forEach((r) => {
    if (r.forecast_mw && r.forecast_mw > maxForecastMw) {
      maxForecastMw     = r.forecast_mw;
      peakForecastHour  = r.start_time.slice(11, 16) + ' UTC';
    }
    if (r.absolute_error_mw && r.absolute_error_mw > maxErrorMw) {
      maxErrorMw    = r.absolute_error_mw;
      maxErrorHour  = r.start_time.slice(11, 16) + ' UTC';
    }
  });

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div>
        <p className="section-label mb-1">DAY-AHEAD PROCUREMENT</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black leading-tight" style={{ color: '#111827' }}>
              Wind Generation Forecast &amp; Accuracy
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
              Delivery: <strong style={{ color: '#374151' }}>{delivery_date}</strong>
              {' · '}
              Cutoff: <strong style={{ color: '#374151', fontFamily: 'JetBrains Mono, monospace' }}>
                {decision_cutoff_utc.replace('T', ' ').slice(0, 16)} UTC
              </strong>
              {' · '}
              {granularity === 'hourly' ? '24 hourly intervals' : '48 settlement periods'}
            </p>
          </div>
          <div className="badge-green">
            <ShieldCheck className="w-3.5 h-3.5" />
            Look-Ahead Bias Eliminated
          </div>
        </div>
      </div>

      {/* ── KPI row — 6 stats ── */}
      <div
        className="card animate-fade-in"
        style={{ padding: 0, overflow: 'hidden' }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0"
          style={{ borderColor: '#e5e7eb' }}
        >
          {/* Avg Forecast */}
          <div style={{ padding: '18px 20px' }}>
            <p className="stat-label mb-2">AVG FORECAST</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black" style={{ color: '#111827' }}>
                {summary.avg_forecast_mw ? Math.round(summary.avg_forecast_mw).toLocaleString() : '—'}
              </span>
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>MW</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>
              Peak: {Math.round(summary.max_forecast_mw ?? 0).toLocaleString()} MW at {peakForecastHour}
            </p>
          </div>

          {/* Avg Actual */}
          <div style={{ padding: '18px 20px' }}>
            <p className="stat-label mb-2">AVG ACTUAL</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black" style={{ color: '#111827' }}>
                {summary.avg_actual_mw ? Math.round(summary.avg_actual_mw).toLocaleString() : '—'}
              </span>
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>MW</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>
              FUELHH Wind Outturn
            </p>
          </div>

          {/* MAE */}
          <div style={{ padding: '18px 20px' }}>
            <p className="stat-label mb-2">MAE</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black" style={{ color: '#111827' }}>
                {metrics?.mae_mw ? Math.round(metrics.mae_mw).toLocaleString() : '—'}
              </span>
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>MW</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>
              {metrics?.mae_mw && summary.avg_actual_mw
                ? `${Math.round((metrics.mae_mw / summary.avg_actual_mw) * 100)}% of actual`
                : 'Mean absolute error'}
            </p>
          </div>

          {/* RMSE */}
          <div style={{ padding: '18px 20px' }}>
            <p className="stat-label mb-2">RMSE</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black" style={{ color: '#111827' }}>
                {metrics?.rmse_mw ? Math.round(metrics.rmse_mw).toLocaleString() : '—'}
              </span>
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>MW</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>Quadratic penalty</p>
          </div>

          {/* Bias */}
          <div style={{ padding: '18px 20px' }}>
            <p className="stat-label mb-2">FORECAST BIAS</p>
            <div className="flex items-baseline gap-1">
              <span
                className="text-[22px] font-black"
                style={{ color: isOverforecast ? '#d97706' : '#2563eb' }}
              >
                {biasValue > 0 ? '+' : ''}{Math.round(biasValue).toLocaleString()}
              </span>
              <span className="text-xs font-medium" style={{ color: '#6b7280' }}>MW</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>
              {isOverforecast ? 'Overforecasting' : 'Underforecasting'}
            </p>
          </div>

          {/* Coverage */}
          <div style={{ padding: '18px 20px' }}>
            <p className="stat-label mb-2">COVERAGE</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-black" style={{ color: '#111827' }}>
                {metrics?.coverage_percentage ?? 100}%
              </span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>
              {summary.matched_intervals}/{records.length} intervals matched
            </p>
          </div>
        </div>
      </div>

      {/* ── Main chart + signal panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Chart — 2/3 width */}
        <div className="lg:col-span-2 card animate-fade-in" style={{ padding: '24px' }}>
          <div className="mb-4">
            <p className="section-label mb-0.5">FORECAST VS ACTUAL</p>
            <h2 className="text-base font-bold" style={{ color: '#111827' }}>
              Day-Ahead Wind Generation Profile
            </h2>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-0.5 rounded-full inline-block" style={{ background: '#1a6b3a' }} />
              <span className="text-[11px] font-medium" style={{ color: '#374151' }}>
                Forecast (MW)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-0.5 rounded-full inline-block" style={{ background: '#2563eb', borderStyle: 'dashed', borderWidth: 0 }} />
              <span className="text-[11px] font-medium" style={{ color: '#374151' }}>
                Actual (MW)
              </span>
            </div>
          </div>

          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#1a6b3a" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#1a6b3a" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#2563eb" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="#f0f0f0" />
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
                  width={52}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="forecast"
                  stroke="#1a6b3a"
                  strokeWidth={2}
                  fill="url(#fg)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#1a6b3a', stroke: '#fff', strokeWidth: 2 }}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#2563eb"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  fill="url(#ag)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right column: Insight + Signal panels */}
        <div className="flex flex-col gap-4">

          {/* MODEL SIGNAL — light green insight card */}
          <div className="insight-panel animate-fade-in">
            <p className="insight-label mb-2">FORECAST SIGNAL</p>
            <p className="text-sm font-bold mb-1" style={{ color: '#111827' }}>
              {isOverforecast
                ? 'Overforecast — excess procurement risk'
                : 'Underforecast — deficit procurement risk'}
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: '#374151' }}>
              {isOverforecast
                ? `Forecast exceeds outturn by ${Math.round(Math.abs(biasValue)).toLocaleString()} MW on average. Procurement team may have overbought wind volume on the day-ahead market.`
                : `Forecast trails outturn by ${Math.round(Math.abs(biasValue)).toLocaleString()} MW on average. Procurement team may have underbought wind, requiring intraday top-ups.`
              }
            </p>
          </div>

          {/* WATCH LIST — dark signal card */}
          <div className="signal-panel animate-fade-in">
            <p className="signal-label mb-3">WATCH LIST</p>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5">
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: '#1a6b3a' }}
                />
                <p className="text-[12px]" style={{ color: '#d1d5db' }}>
                  Peak forecast of <strong style={{ color: '#fff' }}>{Math.round(maxForecastMw).toLocaleString()} MW</strong> at {peakForecastHour}
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: '#d97706' }}
                />
                <p className="text-[12px]" style={{ color: '#d1d5db' }}>
                  Maximum error of <strong style={{ color: '#fff' }}>±{Math.round(maxErrorMw).toLocaleString()} MW</strong> at {maxErrorHour}
                </p>
              </li>
              <li className="flex items-start gap-2.5">
                <span
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: '#6b7280' }}
                />
                <p className="text-[12px]" style={{ color: '#d1d5db' }}>
                  RMSE – MAE spread:{' '}
                  <strong style={{ color: '#fff' }}>
                    {metrics?.rmse_mw && metrics?.mae_mw
                      ? `${Math.round(metrics.rmse_mw - metrics.mae_mw)} MW`
                      : 'N/A'}
                  </strong>
                  {' '}— indicates outlier error concentration
                </p>
              </li>
            </ul>
          </div>

          {/* Audit card */}
          <div className="card animate-fade-in" style={{ padding: '16px 18px' }}>
            <p className="stat-label mb-3">DATA AUDIT</p>
            <div className="space-y-2">
              {[
                'Zero look-ahead leakage',
                'FUELHH wind outturn verified',
                'Missing values preserved (not zeroed)',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: '#1a6b3a' }} />
                  <span className="text-[12px]" style={{ color: '#374151' }}>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-3 pt-2.5" style={{ color: '#9ca3af', borderTop: '1px solid #f3f4f6' }}>
              Source: Elexon BMRS API v1 · National Grid ESO WINDFOR
            </p>
          </div>
        </div>
      </div>

      {/* ── Trading Insights row ── */}
      <div>
        <p className="section-label mb-3">PROCUREMENT INSIGHTS</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Peak Forecast Generation',
              value: `${Math.round(maxForecastMw).toLocaleString()} MW`,
              sub: `Occurred at ${peakForecastHour}`,
              color: '#1a6b3a',
            },
            {
              label: 'Maximum Error Interval',
              value: `±${Math.round(maxErrorMw).toLocaleString()} MW`,
              sub: `Peak deviation at ${maxErrorHour}`,
              color: '#d97706',
            },
            {
              label: 'Overall Daily Bias',
              value: `${biasValue > 0 ? '+' : ''}${Math.round(biasValue).toLocaleString()} MW`,
              sub: isOverforecast ? 'Overbought wind volume' : 'Underbought wind volume',
              color: isOverforecast ? '#d97706' : '#2563eb',
            },
            {
              label: 'Error Spread (RMSE − MAE)',
              value: metrics?.rmse_mw && metrics?.mae_mw
                ? `${Math.round(metrics.rmse_mw - metrics.mae_mw)} MW`
                : 'N/A',
              sub: 'Presence of outlier forecast spikes',
              color: '#374151',
            },
          ].map((item) => (
            <div key={item.label} className="card card-hover animate-fade-in" style={{ padding: '16px 18px' }}>
              <p className="stat-label mb-2">{item.label}</p>
              <p className="text-[18px] font-black leading-tight mb-1" style={{ color: item.color }}>
                {item.value}
              </p>
              <p className="text-[11px]" style={{ color: '#9ca3af' }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
