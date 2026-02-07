/**
 * usePerformance Hook
 * Fetches performance metrics and equity curve data
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchJson } from '../api';

export interface PerformanceSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number | string;
  sharpeRatio: number;
}

export interface EquityPoint {
  id: number;
  timestamp: number;
  equity: number;
  cash: number;
  margin_used: number;
}

export interface PerformanceData {
  period: string;
  summary: PerformanceSummary;
  equityCurve: EquityPoint[];
  timestamp: number;
}

interface UsePerformanceOptions {
  refreshInterval?: number;
  enabled?: boolean;
  period?: 'day' | 'week' | 'month' | 'year' | 'all';
}

export function usePerformance(options: UsePerformanceOptions = {}) {
  const {
    refreshInterval = 60000, // Refresh every minute
    enabled = true,
    period = 'all',
  } = options;

  const [data, setData] = useState<PerformanceData | null>(null);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPerformance = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch performance summary
      const perfUrl = new URL('/api/performance', window.location.origin);
      perfUrl.searchParams.set('period', period);

      const perfData = await fetchJson<PerformanceData>(perfUrl.toString());
      setData(perfData);

      // Fetch equity curve separately for full history
      // Note: Equity curve is optional - dashboard remains functional without it
      try {
        const equityData = await fetchJson<{ equityCurve: EquityPoint[] }>('/api/performance/equity-curve?limit=1000');
        setEquityCurve(equityData.equityCurve);
      } catch {
        // Equity curve is optional - don't fail if it's not available
        console.warn('Equity curve not available');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [enabled, period]);

  useEffect(() => {
    fetchPerformance();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchPerformance, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchPerformance, refreshInterval]);

  return {
    data,
    equityCurve,
    loading,
    error,
    refetch: fetchPerformance,
  };
}

/**
 * Hook for just equity curve data
 */
interface UseEquityCurveOptions {
  refreshInterval?: number;
  enabled?: boolean;
  limit?: number;
}

export function useEquityCurve(options: UseEquityCurveOptions = {}) {
  const { refreshInterval = 0, enabled = true, limit = 1000 } = options;

  const [data, setData] = useState<EquityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEquityCurve = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/performance/equity-curve', window.location.origin);
      url.searchParams.set('limit', limit.toString());

      const result = await fetchJson<{ equityCurve: EquityPoint[] }>(url.toString());
      setData(result.equityCurve);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [enabled, limit]);

  useEffect(() => {
    fetchEquityCurve();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchEquityCurve, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchEquityCurve, refreshInterval]);

  return { data, loading, error, refetch: fetchEquityCurve };
}
