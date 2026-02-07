'use client';

import { useWallet } from '@/contexts/WalletContext';
import { calculateAllocation } from '@/lib/portfolio';

export default function PortfolioSidebar() {
  const { portfolio, accountId } = useWallet();

  if (!portfolio) {
    return (
      <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Portfolio</h2>
        <p className="text-sm text-gray-500">Connect wallet to view portfolio</p>
      </div>
    );
  }

  const allocation = calculateAllocation(portfolio.holdings);
  const totalValue = portfolio.holdings.reduce(
    (sum, h) => sum + (h.valueUSD || 0),
    0
  );

  return (
    <div className="w-80 border-l border-gray-200 p-6 bg-gray-50 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-2">Portfolio</h2>
      <p className="text-xs text-gray-500 mb-4 break-all">{accountId}</p>

      {totalValue > 0 && (
        <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="text-2xl font-bold text-gray-900">
            ${totalValue.toFixed(2)}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Holdings</h3>
        {portfolio.holdings.map((holding, index) => (
          <div
            key={index}
            className="p-3 bg-white rounded-lg border border-gray-200"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-semibold text-gray-900">{holding.token}</span>
              {allocation[holding.token] && (
                <span className="text-xs text-gray-500">
                  {allocation[holding.token].toFixed(1)}%
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">{holding.balance}</div>
            {holding.valueUSD && (
              <div className="text-xs text-gray-500 mt-1">
                ${holding.valueUSD.toFixed(2)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Last updated: {new Date(portfolio.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
