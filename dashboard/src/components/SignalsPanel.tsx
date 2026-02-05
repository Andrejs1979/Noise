import React, { useState, useEffect } from 'react';

interface Signal {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  strength: number;
  entryPrice: number;
  stopLoss: number;
  source: string;
  timestamp: number;
}

export default function SignalsPanel() {
  const [signals, setSignals] = useState<Signal[]>([]);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch('/api/signals/active');
        const data = await response.json();
        setSignals(data.signals || []);
      } catch (error) {
        console.error('Failed to fetch signals:', error);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Active Signals</h2>
      {signals.length === 0 ? (
        <div className="text-gray-500">No active signals</div>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => {
            const directionClass = signal.direction === 'LONG' ? 'text-green-400' : 'text-red-400';
            return (
              <div key={signal.id} className="bg-gray-700 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{signal.symbol}</span>
                  <span className={`text-xs px-2 py-1 rounded ${directionClass}`}>
                    {signal.direction}
                  </span>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Entry: ${signal.entryPrice.toFixed(2)}</div>
                  <div>Stop: ${signal.stopLoss.toFixed(2)}</div>
                  <div>Strength: {(signal.strength * 100).toFixed(0)}%</div>
                  <div className="text-gray-500">{signal.source}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
