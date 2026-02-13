'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';

interface SwapRecommendation {
  action: 'sell' | 'buy';
  symbol: string;
  currentPercentage: number;
  targetPercentage: number;
  amountUSD: number;
  reason: string;
}

interface RiskAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  hhi: number;
  concentration: string;
  assetsCount: number;
  totalValue: number;
  recommendations?: SwapRecommendation[];
  acknowledged: boolean;
  createdAt: string;
}

interface AlertBannerProps {
  onSwapClick?: (recommendation: SwapRecommendation) => void;
}

export default function AlertBanner({ onSwapClick }: AlertBannerProps) {
  const { accountId } = useWallet();
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  useEffect(() => {
    if (accountId) {
      fetchAlerts();
      // Poll for new alerts every 30 seconds
      const interval = setInterval(fetchAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [accountId]);

  const fetchAlerts = async () => {
    if (!accountId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/agents/alerts?accountId=${accountId}&unacknowledged=true`
      );

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/agents/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, acknowledged: true }),
      });

      if (response.ok) {
        setAlerts(alerts.filter(a => a.id !== alertId));
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  if (!accountId || alerts.length === 0) {
    return null;
  }

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-500 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      default:
        return 'bg-blue-50 border-blue-500 text-blue-900';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '🚨';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border-l-4 p-4 rounded-lg ${getSeverityColors(alert.severity)} shadow-md`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getSeverityIcon(alert.severity)}</span>
                <h3 className="font-semibold text-lg uppercase">
                  {alert.severity} Risk Alert
                </h3>
              </div>

              <p className="mb-3">{alert.message}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                <div>
                  <span className="font-medium">HHI:</span> {alert.hhi}
                </div>
                <div>
                  <span className="font-medium">Concentration:</span> {alert.concentration}
                </div>
                <div>
                  <span className="font-medium">Assets:</span> {alert.assetsCount}
                </div>
                <div>
                  <span className="font-medium">Total Value:</span> ${alert.totalValue.toFixed(2)}
                </div>
              </div>

              {alert.recommendations && alert.recommendations.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                    className="text-sm font-medium underline hover:no-underline"
                  >
                    {expandedAlert === alert.id ? '▼' : '▶'} View {alert.recommendations.length} Rebalancing Recommendations
                  </button>

                  {expandedAlert === alert.id && (
                    <div className="mt-3 space-y-2">
                      {alert.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="bg-white bg-opacity-60 p-3 rounded border border-gray-300"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">
                                  {rec.action === 'sell' ? '📉' : '📈'}
                                </span>
                                <span className="font-bold uppercase">
                                  {rec.action} {rec.symbol}
                                </span>
                              </div>
                              <div className="text-sm space-y-1">
                                <div>
                                  <span className="font-medium">Current:</span> {rec.currentPercentage}%
                                  {' → '}
                                  <span className="font-medium">Target:</span> {rec.targetPercentage}%
                                </div>
                                <div>
                                  <span className="font-medium">Amount:</span> ${rec.amountUSD.toFixed(2)}
                                </div>
                                <div className="text-gray-600">{rec.reason}</div>
                              </div>
                            </div>
                            {onSwapClick && (
                              <button
                                onClick={() => onSwapClick(rec)}
                                className="ml-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                              >
                                Execute
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => acknowledgeAlert(alert.id)}
              className="ml-4 text-gray-500 hover:text-gray-700 text-xl"
              title="Dismiss alert"
            >
              ✕
            </button>
          </div>

          <div className="text-xs text-gray-600 mt-2">
            {new Date(alert.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
