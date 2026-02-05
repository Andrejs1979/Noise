import React, { useState, useEffect } from 'react';

interface AccountData {
  equity: number;
  cash: number;
  buyingPower: number;
  dailyPnl: number;
  dailyPnlPercent: number;
}

export default function AccountSummary() {
  const [account, setAccount] = useState<AccountData | null>(null);

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const response = await fetch('/api/account');
        const data = await response.json();
        setAccount(data);
      } catch (error) {
        console.error('Failed to fetch account:', error);
      }
    };

    fetchAccount();
    const interval = setInterval(fetchAccount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!account) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const pnlClass = account.dailyPnl >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-semibold mb-4">Account Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-gray-400 text-sm">Total Equity</div>
          <div className="text-2xl font-bold">${account.equity.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Cash</div>
          <div className="text-xl">${account.cash.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Buying Power</div>
          <div className="text-xl">${account.buyingPower.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-gray-400 text-sm">Daily P&L</div>
          <div className={`text-xl font-bold ${pnlClass}`}>
            {account.dailyPnl >= 0 ? '+' : ''}{account.dailyPnl.toFixed(2)}
            <span className="text-sm ml-1">({account.dailyPnlPercent.toFixed(2)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
