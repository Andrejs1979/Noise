import React, { useState, useEffect } from 'react';
import AccountSummary from './components/AccountSummary';
import PositionsTable from './components/PositionsTable';
import RiskMetrics from './components/RiskMetrics';
import SignalsPanel from './components/SignalsPanel';

interface SystemStatus {
  status: string;
  circuitBreaker: boolean;
  positions: number;
  lastUpdate: number;
}

function App() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading NOISE Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-green-400">NOISE</h1>
          <span className="text-sm text-gray-400">Algorithmic Trading Engine</span>
          <div className="flex items-center gap-4">
            <span className={`px-2 py-1 rounded text-xs ${status?.circuitBreaker ? 'bg-red-500' : 'bg-green-500'}`}>
              {status?.circuitBreaker ? 'CIRCUIT BREAKER' : 'SYSTEM NORMAL'}
            </span>
            <span className="text-xs text-gray-500">
              {status?.environment === 'production' ? 'PROD' : 'DEV'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Summary */}
          <div className="lg:col-span-2">
            <AccountSummary />
          </div>

          {/* Risk Metrics */}
          <div>
            <RiskMetrics />
          </div>

          {/* Positions */}
          <div className="lg:col-span-2">
            <PositionsTable />
          </div>

          {/* Active Signals */}
          <div>
            <SignalsPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
