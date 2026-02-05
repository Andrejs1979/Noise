import React, { useState, useEffect } from 'react';

interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
}

export default function PositionsTable() {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await fetch('/api/positions');
        const data = await response.json();
        setPositions(data.positions || []);
      } catch (error) {
        console.error('Failed to fetch positions:', error);
      }
    };

    fetchPositions();
    const interval = setInterval(fetchPositions, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Open Positions</h2>
      {positions.length === 0 ? (
        <div className="text-gray-500">No open positions</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Side</th>
                <th className="pb-2">Quantity</th>
                <th className="pb-2">Entry</th>
                <th className="pb-2">Current</th>
                <th className="pb-2 text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const pnlClass = pos.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400';
                const sideClass = pos.side === 'LONG' ? 'text-blue-400' : 'text-orange-400';
                return (
                  <tr key={pos.id} className="border-b border-gray-700">
                    <td className="py-2 font-medium">{pos.symbol}</td>
                    <td className={`py-2 ${sideClass}`}>{pos.side}</td>
                    <td className="py-2">{pos.quantity}</td>
                    <td className="py-2">${pos.entryPrice.toFixed(2)}</td>
                    <td className="py-2">${pos.currentPrice.toFixed(2)}</td>
                    <td className={`py-2 text-right font-medium ${pnlClass}`}>
                      {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
