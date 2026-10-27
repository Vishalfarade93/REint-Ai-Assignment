import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, BookOpen, Layers, CheckCircle2, ExternalLink } from 'lucide-react';
import { MetadataResponse } from '../types/api';
import { fetchMetadata } from '../services/api';

const sections = [
  {
    id: 'selection',
    icon: ShieldCheck,
    iconColor: '#1a6b3a',
    iconBg:    '#f0faf4',
    label:     'FORECAST SELECTION',
    title:     'Historical Forecast Selection & Look-Ahead Prevention',
    subtitle:  'Reconstructing the trader\'s information set at Day-Ahead Gate Closure',
  },
  {
    id: 'granularity',
    icon: Layers,
    iconColor: '#2563eb',
    iconBg:    '#eff6ff',
    label:     'DATA ALIGNMENT',
    title:     'Granularity Alignment & Settlement Mapping',
    subtitle:  'Hourly WINDFOR forecasts vs Half-Hourly FUELHH actuals',
  },
  {
    id: 'metrics',
    icon: BookOpen,
    iconColor: '#d97706',
    iconBg:    '#fffbeb',
    label:     'ACCURACY DEFINITIONS',
    title:     'Mathematical Accuracy Metric Definitions',
    subtitle:  'Computed strictly over valid matched interval pairs',
  },
];

export const MethodologyView: React.FC = () => {
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  useEffect(() => { fetchMetadata().then(setMetadata).catch(() => {}); }, []);

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Page header */}
      <div>
        <p className="section-label mb-1">TECHNICAL TRANSPARENCY</p>
        <h1 className="text-2xl font-black leading-tight" style={{ color: '#111827' }}>
          Methodology &amp; Data Governance
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
          Full algorithmic transparency into how historical wind forecasts were selected, matched to actuals, and evaluated without look-ahead bias.
        </p>
      </div>

      {/* 1. Selection Algorithm */}
      <div className="card animate-fade-in" style={{ padding: '28px 32px' }}>
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: '#f0faf4', border: '1px solid #b8eacf' }}
          >
            <ShieldCheck className="w-4.5 h-4.5" style={{ color: '#1a6b3a', width: 18, height: 18 }} />
          </div>
          <div>
            <p className="section-label mb-0.5">FORECAST SELECTION</p>
            <h2 className="text-base font-bold" style={{ color: '#111827' }}>
              Historical Forecast Selection &amp; Look-Ahead Prevention
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: '#6b7280' }}>
              Reconstructing the trader's information set at Day-Ahead Gate Closure
            </p>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed mb-4" style={{ color: '#374151' }}>
          A wind forecast record has two distinct timestamps:{' '}
          <code
            className="px-1.5 py-0.5 rounded text-[11px]"
            style={{ background: '#f0faf4', color: '#1a6b3a', fontFamily: 'JetBrains Mono, monospace' }}
          >
            startTime
          </code>
          {' '}(when the electricity will be generated) and{' '}
          <code
            className="px-1.5 py-0.5 rounded text-[11px]"
            style={{ background: '#fffbeb', color: '#d97706', fontFamily: 'JetBrains Mono, monospace' }}
          >
            publishTime
          </code>
          {' '}(when the forecast model output became accessible to the market).
        </p>

        {/* Algorithm block */}
        <div
          className="p-5 rounded-lg mb-4 font-mono text-[12px]"
          style={{ background: '#f8faf9', border: '1px solid #e5e7eb' }}
        >
          <p className="font-bold mb-3" style={{ color: '#1a6b3a', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
            // Formal Historical Selection Algorithm
          </p>
          <p style={{ color: '#374151' }}>For target delivery date D and cutoff time C on D-1:</p>
          <p className="pl-4 mt-1.5" style={{ color: '#1a6b3a' }}>1. CutoffTimestamp = (D − 1 day) at C UTC</p>
          <p className="pl-4 mt-1" style={{ color: '#1a6b3a' }}>2. For each delivery interval T on date D:</p>
          <p className="pl-8 mt-0.5" style={{ color: '#374151' }}>
            Candidates = {'{'} F | F.startTime == T AND F.publishTime {'<='} CutoffTimestamp {'}'}
          </p>
          <p className="pl-8 mt-0.5" style={{ color: '#d97706' }}>
            SelectedForecast(T) = argmax_publishTime(Candidates)
          </p>
          <p className="pl-4 mt-1.5" style={{ color: '#dc2626' }}>
            3. Exclude any forecast where F.publishTime {'>'} CutoffTimestamp
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg p-4" style={{ background: '#f8faf9', border: '1px solid #e5e7eb' }}>
            <p className="text-[12px] font-bold mb-2" style={{ color: '#111827' }}>
              UK Day-Ahead Market Gate Closure
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: '#374151' }}>
              Wholesale day-ahead power auctions (EPEX SPOT GB Day-Ahead) close between 09:20 and 12:00 UK time on D-1. The benchmark cutoff is set to{' '}
              <strong style={{ color: '#1a6b3a' }}>10:00 UTC on D-1</strong>, selecting the 09:30 UTC publication run.
            </p>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#f8faf9', border: '1px solid #e5e7eb' }}>
            <p className="text-[12px] font-bold mb-2" style={{ color: '#111827' }}>
              Look-Ahead Bias Elimination
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: '#374151' }}>
              Selecting a forecast published later in the afternoon or during intraday trading would distort historical performance because that information was physically unavailable when the purchasing commitment was made.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Granularity */}
      <div className="card animate-fade-in" style={{ padding: '28px 32px' }}>
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            <Layers style={{ color: '#2563eb', width: 18, height: 18 }} />
          </div>
          <div>
            <p className="section-label mb-0.5" style={{ color: '#2563eb' }}>DATA ALIGNMENT</p>
            <h2 className="text-base font-bold" style={{ color: '#111827' }}>
              Granularity Alignment &amp; Settlement Mapping
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: '#6b7280' }}>
              Hourly WINDFOR forecasts vs Half-Hourly FUELHH actuals
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg p-5" style={{ background: '#f0faf4', border: '1px solid #b8eacf' }}>
            <p className="text-[11px] font-bold mb-1" style={{ color: '#1a6b3a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Hourly Mode — 24 Intervals
            </p>
            <p className="text-[12px] leading-relaxed mb-3" style={{ color: '#374151' }}>
              Direct 1-to-1 match with native WINDFOR intervals. Actual wind generation is the arithmetic mean of the two half-hour settlement periods:
            </p>
            <div
              className="px-3 py-2 rounded text-[12px] font-bold"
              style={{ background: '#fff', fontFamily: 'JetBrains Mono, monospace', color: '#1a6b3a' }}
            >
              Actual_Hour = (SP₂ₖ₋₁ + SP₂ₖ) / 2
            </div>
          </div>
          <div className="rounded-lg p-5" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <p className="text-[11px] font-bold mb-1" style={{ color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Half-Hourly Mode — 48 Periods
            </p>
            <p className="text-[12px] leading-relaxed mb-3" style={{ color: '#374151' }}>
              Direct alignment with 48 official Elexon settlement periods. The hourly forecast rate is applied to both constituent half-hour intervals:
            </p>
            <div
              className="px-3 py-2 rounded text-[12px] font-bold"
              style={{ background: '#fff', fontFamily: 'JetBrains Mono, monospace', color: '#2563eb' }}
            >
              Forecast_SP₂ₖ₋₁ = Forecast_SP₂ₖ = Forecast_Hour
            </div>
          </div>
        </div>
      </div>

      {/* 3. Metric Definitions */}
      <div className="card animate-fade-in" style={{ padding: '28px 32px' }}>
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
          >
            <BookOpen style={{ color: '#d97706', width: 18, height: 18 }} />
          </div>
          <div>
            <p className="section-label mb-0.5" style={{ color: '#d97706' }}>ACCURACY DEFINITIONS</p>
            <h2 className="text-base font-bold" style={{ color: '#111827' }}>
              Mathematical Accuracy Metric Definitions
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: '#6b7280' }}>
              Computed strictly over valid matched interval pairs (N observations)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {[
            {
              name:    'Forecast Error (Signed)',
              formula: 'eₜ = Forecastₜ − Actualₜ',
              note:    'Positive: Overforecast. Negative: Underforecast.',
              color:   '#374151',
            },
            {
              name:    'Mean Absolute Error (MAE)',
              formula: 'MAE = (1/N) · Σ |eₜ|',
              note:    'Average magnitude of errors — primary decision metric.',
              color:   '#1a6b3a',
            },
            {
              name:    'Root Mean Squared Error (RMSE)',
              formula: 'RMSE = √((1/N) · Σ eₜ²)',
              note:    'Quadratic weighting penalizes large outlier errors more severely.',
              color:   '#d97706',
            },
            {
              name:    'Forecast Bias (Mean Error)',
              formula: 'Bias = (1/N) · Σ eₜ',
              note:    'Systemic over- or under-prediction across the sample.',
              color:   '#2563eb',
            },
          ].map((m) => (
            <div
              key={m.name}
              className="rounded-lg p-4"
              style={{ background: '#f8faf9', border: '1px solid #e5e7eb' }}
            >
              <p className="text-[11px] font-semibold mb-2" style={{ color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {m.name}
              </p>
              <p
                className="text-[14px] font-bold mb-2"
                style={{ color: m.color, fontFamily: 'JetBrains Mono, monospace' }}
              >
                {m.formula}
              </p>
              <p className="text-[11px]" style={{ color: '#9ca3af' }}>{m.note}</p>
            </div>
          ))}
        </div>

        <div
          className="p-4 rounded-lg text-[12px]"
          style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}
        >
          <strong>Note on MAPE:</strong> Mean Absolute Percentage Error is calculated only on observations where actual generation exceeds zero. When actual wind generation is near zero on calm days, percentage errors become artificially large. MAE and RMSE in MW are the authoritative procurement decision metrics.
        </div>
      </div>

      {/* 4. Data Sources */}
      {metadata && (
        <div className="card animate-fade-in" style={{ padding: '28px 32px' }}>
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: '#f8faf9', border: '1px solid #e5e7eb' }}
            >
              <Database style={{ color: '#374151', width: 18, height: 18 }} />
            </div>
            <div>
              <p className="section-label mb-0.5">DATA SOURCES</p>
              <h2 className="text-base font-bold" style={{ color: '#111827' }}>
                Live Data Sources &amp; Verification Status
              </h2>
              <p className="text-[12px] mt-0.5" style={{ color: '#6b7280' }}>
                Connected to Elexon BMRS Open Insights API
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {metadata.data_sources.map((src, i) => (
              <div key={i} className="rounded-lg p-4" style={{ background: '#f8faf9', border: '1px solid #e5e7eb' }}>
                <p className="text-[13px] font-bold mb-1" style={{ color: '#1a6b3a' }}>{src.name}</p>
                <p className="text-[12px] mb-2" style={{ color: '#374151' }}>{src.purpose}</p>
                <p
                  className="text-[10px] truncate"
                  style={{ color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {src.endpoint}
                </p>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between px-4 py-3 rounded-lg"
            style={{ background: '#f0faf4', border: '1px solid #b8eacf' }}
          >
            <span className="text-[12px]" style={{ color: '#374151' }}>Supported Historical Period:</span>
            <span className="text-[12px] font-bold" style={{ color: '#1a6b3a' }}>
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />
              {metadata.supported_period.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
