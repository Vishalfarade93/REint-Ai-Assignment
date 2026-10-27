import { ForecastResponse, AccuracyResponse, MetadataResponse, IntervalRecord } from '../types/api';

function getBaseUrl(): string {
  let env = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (!env) {
    // If running in browser and on a deployed domain, default to current origin + /api
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${window.location.origin}/api`;
    }
    return 'http://localhost:8000/api';
  }
  // Remove trailing slashes
  return env.replace(/\/+$/, '');
}

const API_BASE_URL = getBaseUrl();

export async function fetchForecast(
  date: string,
  cutoff: string = '10:00',
  granularity: 'hourly' | 'half_hourly' = 'hourly'
): Promise<ForecastResponse> {
  const url = `${API_BASE_URL}/forecast?date=${encodeURIComponent(date)}&cutoff=${encodeURIComponent(cutoff)}&granularity=${granularity}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch forecast: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAccuracy(
  startDate: string,
  endDate: string,
  cutoff: string = '10:00',
  granularity: 'hourly' | 'half_hourly' = 'hourly'
): Promise<AccuracyResponse> {
  const url = `${API_BASE_URL}/accuracy?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&cutoff=${encodeURIComponent(cutoff)}&granularity=${granularity}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch accuracy metrics: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchObservations(
  date: string,
  cutoff: string = '10:00',
  granularity: 'hourly' | 'half_hourly' = 'hourly'
): Promise<IntervalRecord[]> {
  const url = `${API_BASE_URL}/observations?date=${encodeURIComponent(date)}&cutoff=${encodeURIComponent(cutoff)}&granularity=${granularity}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch observations: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchMetadata(): Promise<MetadataResponse> {
  const url = `${API_BASE_URL}/metadata`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch metadata: ${res.statusText}`);
  }
  return res.json();
}

export function getExportCsvUrl(
  date?: string,
  startDate?: string,
  endDate?: string,
  cutoff: string = '10:00',
  granularity: 'hourly' | 'half_hourly' = 'hourly'
): string {
  if (date) {
    return `${API_BASE_URL}/export/csv?date=${encodeURIComponent(date)}&cutoff=${encodeURIComponent(cutoff)}&granularity=${granularity}`;
  }
  return `${API_BASE_URL}/export/csv?start_date=${encodeURIComponent(startDate || '')}&end_date=${encodeURIComponent(endDate || '')}&cutoff=${encodeURIComponent(cutoff)}&granularity=${granularity}`;
}
