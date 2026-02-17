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

const SEVERITY_CONFIG = {
  critical: {
    border: 'var(--critical)',
    bg: 'rgba(255,77,109,0.05)',
    badge: 'badge-critical',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  warning: {
    border: 'var(--warning)',
    bg: 'rgba(240,180,41,0.05)',
    badge: 'badge-warning',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  info: {
    border: 'var(--info)',
    bg: 'rgba(0,212,255,0.04)',
    badge: 'badge-cyan',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
};

export default function AlertBanner({ onSwapClick }: AlertBannerProps) {
  const { accountId } = useWallet();
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  // no loading state needed — alerts are lightweight background fetches

  useEffect(() => {
    if (accountId) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [accountId]);

  const fetchAlerts = async () => {
    if (!accountId) return;
    try {
      const res = await fetch(`/api/agents/alerts?accountId=${accountId}&unacknowledged=true`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.data.alerts || []);
      }
    } catch {}
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch('/api/agents/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, acknowledged: true }),
      });
      if (res.ok) setAlerts(alerts.filter(a => a.id !== alertId));
    } catch {}
  };

  if (!accountId || alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((alert) => {
        const cfg = SEVERITY_CONFIG[alert.severity];
        const isExpanded = expandedAlert === alert.id;

        return (
          <div
            key={alert.id}
            className="animate-fade-up"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderLeft: `3px solid ${cfg.border}`,
              borderRadius: 'var(--r-md)',
              overflow: 'hidden',
            }}
          >
            {/* ── Alert Header Row ─────────────────── */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '12px 14px',
            }}>
              <div style={{ color: cfg.border, marginTop: 1, flexShrink: 0 }}>
                {cfg.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Badge + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className={`badge ${cfg.badge}`} style={{ flexShrink: 0 }}>
                    {alert.severity}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--body)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    Risk Alert
                  </span>
                </div>

                {/* Message */}
                <p style={{ fontSize: 12, color: 'var(--heading)', lineHeight: 1.5, marginBottom: 8 }}>
                  {alert.message}
                </p>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'HHI', value: alert.hhi },
                    { label: 'Concentration', value: alert.concentration },
                    { label: 'Assets', value: alert.assetsCount },
                    { label: 'Value', value: `$${(alert.totalValue || 0).toFixed(0)}` },
                  ].map((stat, i) => (
                    <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span className="label" style={{ letterSpacing: '0.08em' }}>{stat.label}</span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--body)',
                        fontWeight: 500,
                      }}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Expand recommendations */}
                {alert.recommendations && alert.recommendations.length > 0 && (
                  <button
                    onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      marginTop: 10,
                      background: 'none', border: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: cfg.border,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <svg
                      width="10" height="10" viewBox="0 0 24 24" fill="none"
                      style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                    >
                      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {alert.recommendations.length} rebalancing recommendation{alert.recommendations.length !== 1 ? 's' : ''}
                  </button>
                )}
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                style={{
                  flexShrink: 0,
                  background: 'none', border: 'none',
                  color: 'var(--muted)', cursor: 'pointer',
                  padding: 4, borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'color 0.15s',
                }}
                title="Dismiss alert"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--dim)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* ── Recommendations Panel ───────────── */}
            {isExpanded && alert.recommendations && (
              <div style={{
                borderTop: `1px solid ${cfg.border}33`,
                padding: '10px 14px 14px',
              }}>
                <p className="label" style={{ marginBottom: 8 }}>Rebalancing Actions</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {alert.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-md)',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      {/* Action badge */}
                      <span
                        className={`badge ${rec.action === 'sell' ? 'badge-critical' : 'badge-success'}`}
                        style={{ flexShrink: 0 }}
                      >
                        {rec.action === 'sell' ? (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                            <path d="M12 20V4M5 13l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        ) : (
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                            <path d="M12 4v16M5 11l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        )}
                        {rec.action.toUpperCase()} {rec.symbol}
                      </span>

                      {/* Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: 'var(--dim)' }}>
                            {rec.currentPercentage}% → {rec.targetPercentage}%
                          </span>
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--heading)', fontWeight: 500,
                          }}>
                            ${rec.amountUSD.toFixed(2)}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, lineHeight: 1.4 }}>
                          {rec.reason}
                        </p>
                      </div>

                      {/* Execute button */}
                      {onSwapClick && (
                        <button
                          onClick={() => onSwapClick(rec)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: 10, flexShrink: 0 }}
                        >
                          Execute
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div style={{
              padding: '4px 14px 8px',
              borderTop: `1px solid ${cfg.border}22`,
            }}>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                {new Date(alert.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
