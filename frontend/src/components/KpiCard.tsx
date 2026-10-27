import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;        // small caps label e.g. "AVG FORECAST"
  value: string;        // big number e.g. "4,823"
  unit?: string;        // e.g. "MW"
  description?: string; // small text below
  icon?: LucideIcon;
  trend?: 'positive' | 'negative' | 'neutral';
  trendText?: string;
  accentColor?: string; // defaults to forest green
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  description,
  icon: Icon,
  trend,
  trendText,
  accentColor = '#1a6b3a',
}) => {
  const trendColors = {
    positive: '#16a34a',
    negative: '#dc2626',
    neutral:  '#6b7280',
  };
  const trendColor = trend ? trendColors[trend] : '#6b7280';

  return (
    <div
      className="card card-hover animate-fade-in"
      style={{ padding: '18px 20px' }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{ background: `${accentColor}14` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: accentColor }} />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span
          className="text-[26px] leading-none font-black tracking-tight"
          style={{ color: '#111827' }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium" style={{ color: '#6b7280' }}>
            {unit}
          </span>
        )}
      </div>

      {/* Description / trend */}
      {(description || trendText) && (
        <div className="flex items-center gap-2 mt-1">
          {trendText && (
            <span
              className="text-[11px] font-semibold"
              style={{ color: trendColor }}
            >
              {trendText}
            </span>
          )}
          {description && (
            <span className="text-[11px]" style={{ color: '#9ca3af' }}>
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
