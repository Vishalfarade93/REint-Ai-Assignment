import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { OverviewView } from './views/OverviewView';
import { ForecastView } from './views/ForecastView';
import { AccuracyView } from './views/AccuracyView';
import { DataExplorerView } from './views/DataExplorerView';
import { MethodologyView } from './views/MethodologyView';
import { ForecastResponse, AccuracyMetrics } from './types/api';
import { fetchForecast, fetchAccuracy } from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Logo } from './components/Logo';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-16');
  const [cutoffTime, setCutoffTime] = useState<string>('10:00');
  const [granularity, setGranularity] = useState<'hourly' | 'half_hourly'>('hourly');

  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [metrics, setMetrics] = useState<AccuracyMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fData, accData] = await Promise.all([
        fetchForecast(selectedDate, cutoffTime, granularity),
        fetchAccuracy(selectedDate, selectedDate, cutoffTime, granularity),
      ]);
      setForecastData(fData);
      setMetrics(accData.metrics);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to REint AI backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, cutoffTime, granularity]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#f8faf9', color: '#111827', fontFamily: 'Inter, sans-serif' }}
    >
      <Navbar
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        cutoffTime={cutoffTime}
        onCutoffChange={setCutoffTime}
        granularity={granularity}
        onGranularityChange={setGranularity}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {loading && !forecastData ? (
          /* Loading state */
          <div className="min-h-[480px] flex flex-col items-center justify-center gap-5">
            <div className="relative">
              <Logo size="lg" showWordmark={false} />
              <div className="absolute -bottom-1 -right-1">
                <RefreshCw className="w-5 h-5 animate-spin" style={{ color: '#1a6b3a' }} />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: '#111827' }}>
                Loading Forecast Data
              </p>
              <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>
                Fetching WINDFOR forecasts and FUELHH actuals from Elexon…
              </p>
            </div>
          </div>
        ) : error ? (
          /* Error state */
          <div
            className="max-w-lg mx-auto my-16 p-8 rounded-2xl text-center"
            style={{
              background: '#fff',
              border: '1px solid #fca5a5',
              boxShadow: '0 4px 16px rgba(220,38,38,0.08)',
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#fef2f2' }}
            >
              <AlertCircle className="w-6 h-6" style={{ color: '#dc2626' }} />
            </div>
            <h2 className="text-base font-bold mb-1" style={{ color: '#111827' }}>
              Connection Error
            </h2>
            <p className="text-xs mb-5" style={{ color: '#6b7280' }}>
              {error}
            </p>
            <button
              onClick={loadData}
              className="btn-primary mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          </div>
        ) : forecastData ? (
          <div className="animate-fade-in">
            {activeTab === 'overview' && (
              <OverviewView forecastData={forecastData} metrics={metrics} loading={loading} />
            )}
            {activeTab === 'forecast' && (
              <ForecastView forecastData={forecastData} />
            )}
            {activeTab === 'accuracy' && (
              <AccuracyView
                forecastData={forecastData}
                metrics={metrics}
                cutoffTime={cutoffTime}
                granularity={granularity}
              />
            )}
            {activeTab === 'explorer' && (
              <DataExplorerView
                records={forecastData.records}
                selectedDate={selectedDate}
                cutoffTime={cutoffTime}
                granularity={granularity}
              />
            )}
            {activeTab === 'methodology' && (
              <MethodologyView />
            )}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer
        className="mt-12 py-5"
        style={{
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-xs" style={{ color: '#d1d5db' }}>·</span>
            <span className="text-xs" style={{ color: '#9ca3af' }}>
              UK National Wind Generation Intelligence Platform
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: '#9ca3af' }}>
            <span>Elexon BMRS · WINDFOR &amp; FUELHH</span>
            <span style={{ color: '#d1d5db' }}>·</span>
            <span className="font-semibold" style={{ color: '#1a6b3a' }}>
              Look-Ahead Bias Eliminated
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
