import React, { useState, useEffect } from 'react';

interface RiskState {
  dailyPnl: number;
  dailyPnlPercent: number;
  consecutiveLosses: number;
  circuit_breaker_triggered: boolean;
}

export default function RiskMetrics() {
  const [risk, setRisk] = useState<RiskState | null>(null);

  useEffect(() => {
    const fetchRisk = async () => {
      try {
        const response = await fetch('/api/risk/state');
        const data = await response.json();
        setRisk(data);
      } catch (error) {
        console.error('Failed to fetch risk state:', error);
      }
    };

    fetchRisk();
    const interval = setInterval(fetchRisk, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!risk) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Risk Metrics</h2>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const pnlClass = risk.dailyPnl >= 0 ? 'text-green-400' : 'text-red-400';
  const circuitBreakerClass = risk.circuit_breaker_triggered ? 'text-red-400' : 'text-green-400';

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Risk Metrics</h2>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Daily P&L</span>
          <span className={pnlClass}>
            {risk.dailyPnl >= 0 ? '+' : ''}${risk.dailyPnl.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Daily %</span>
          <span className={pnlClass}>
            {risk.dailyPnlPercent.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Consecutive Losses</span>
          <span className={risk.consecutiveLosses > 2 ? 'text-red-400' : 'text-white'}>
            {risk.consecutiveLosses}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Circuit Breaker</span>
          <span className={circuitBreakerClass}>
            {risk.circuit_breaker_triggered ? 'TRIGGERED' : 'OFF'}
          </span>
        </div>
        {risk.circuit_breaker_triggered && (
          <button
            onClick={async () => {
              await fetch('/api/risk/reset-circuit-breaker', { method: 'POST' });
              window.location.reload();
            }}
            className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm"
          >
            Reset Circuit Breaker
          </button>
        )}
      </div>
    </div>
  );
}
