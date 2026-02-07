/**
 * useRisk Hook
 * Fetches risk state with circuit breaker management
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchJson, api } from '../api';

export interface RiskState {
  dailyPnl: number;
  dailyPnlPercent: number;
  consecutiveLosses: number;
  circuitBreakerTriggered: boolean;
  circuitBreakerReason?: string | null;
  circuitBreakerUntil?: number | null;
  lastUpdated: number;
}

interface UseRiskOptions {
  refreshInterval?: number;
  enabled?: boolean;
}

export function useRisk(options: UseRiskOptions = {}) {
  const { refreshInterval = 30000, enabled = true } = options;

  const [data, setData] = useState<RiskState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [resetting, setResetting] = useState(false);

  const fetchRisk = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const riskData = await fetchJson<any>('/api/risk/state');
      setData({
        ...riskData,
        circuitBreakerTriggered: riskData.circuit_breaker_triggered || false,
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const resetCircuitBreaker = useCallback(async () => {
    setResetting(true);
    setError(null);

    try {
      await api.post('/api/risk/reset-circuit-breaker', {});
      // Refetch risk state after successful reset
      await fetchRisk();
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    } finally {
      setResetting(false);
    }
  }, [fetchRisk]);

  useEffect(() => {
    fetchRisk();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchRisk, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchRisk, refreshInterval]);

  return { data, loading, error, resetting, refetch: fetchRisk, resetCircuitBreaker };
}
