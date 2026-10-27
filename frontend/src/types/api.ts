export interface IntervalRecord {
  interval_index: number;
  settlement_date: string;
  start_time: string;
  end_time: string;
  settlement_period?: number | null;
  granularity: 'hourly' | 'half_hourly';
  forecast_mw?: number | null;
  forecast_publish_time?: string | null;
  actual_mw?: number | null;
  forecast_error_mw?: number | null;
  absolute_error_mw?: number | null;
  percentage_error?: number | null;
  status: 'matched' | 'missing_actual' | 'missing_forecast' | 'excluded';
  notes?: string | null;
}

export interface SummaryStatistics {
  avg_forecast_mw?: number | null;
  min_forecast_mw?: number | null;
  max_forecast_mw?: number | null;
  avg_actual_mw?: number | null;
  min_actual_mw?: number | null;
  max_actual_mw?: number | null;
  valid_forecast_intervals: number;
  valid_actual_intervals: number;
  missing_forecast_intervals: number;
  missing_actual_intervals: number;
  matched_intervals: number;
}

export interface AccuracyMetrics {
  total_intervals: number;
  matched_intervals: number;
  missing_intervals: number;
  mae_mw?: number | null;
  rmse_mw?: number | null;
  bias_mw?: number | null;
  mape_percent?: number | null;
  coverage_percentage: number;
}

export interface DailySummary {
  date: string;
  total_intervals: number;
  matched_intervals: number;
  avg_forecast_mw?: number | null;
  avg_actual_mw?: number | null;
  mae_mw?: number | null;
  rmse_mw?: number | null;
  bias_mw?: number | null;
}

export interface ForecastResponse {
  delivery_date: string;
  decision_cutoff_utc: string;
  granularity: 'hourly' | 'half_hourly';
  summary: SummaryStatistics;
  records: IntervalRecord[];
}

export interface AccuracyResponse {
  start_date: string;
  end_date: string;
  decision_cutoff_time: string;
  granularity: 'hourly' | 'half_hourly';
  metrics: AccuracyMetrics;
  daily_summaries: DailySummary[];
}

export interface MetadataResponse {
  project_name: string;
  version: string;
  data_sources: Array<{
    name: string;
    purpose: string;
    resolution: string;
    endpoint: string;
  }>;
  supported_period: {
    month: string;
    start: string;
    end: string;
    status: string;
  };
  decision_cutoff_info: {
    description: string;
    default_cutoff: string;
    market_context: string;
  };
  timezone_convention: string;
  generation_units: string;
  cache_info: {
    cache_dir: string;
    strategy: string;
  };
}
