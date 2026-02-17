'use client';

import { useWallet } from '@/contexts/WalletContext';
import { calculateAllocation } from '@/lib/portfolio';

export default function PortfolioSidebar() {
  const { portfolio, accountId } = useWallet();

  if (!portfolio || !portfolio.holdings || !Array.isArray(portfolio.holdings)) {
    return (
      <aside style={{
        width: 280,
        borderLeft: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z" stroke="var(--muted)" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Portfolio
          </span>
        </div>

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 24, textAlign: 'center',
        }}>
          <div style={{
            width: 44, height: 44,
            borderRadius: 10,
            background: 'var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 7l-9-4-9 4v10l9 4 9-4V7z" stroke="var(--muted)" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            Upload your portfolio<br />to see holdings here
          </p>
        </div>
      </aside>
    );
  }

  const allocation = calculateAllocation(portfolio.holdings);
  const totalValue = portfolio.holdings.reduce((sum, h) => sum + (h.valueUSD || 0), 0);
  const topHolding = [...portfolio.holdings].sort((a, b) => (b.valueUSD || 0) - (a.valueUSD || 0))[0];

  const displayAccount = accountId && accountId.length > 28
    ? `${accountId.slice(0, 8)}…${accountId.slice(-6)}`
    : accountId;

  return (
    <aside style={{
      width: 280,
      borderLeft: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {/* ── Header ─────────────────────────────── */}
      <div style={{
        padding: '14px 18px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z" stroke="var(--cyan)" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span className="label">Portfolio</span>
        </div>
        <span className="badge badge-success" style={{ fontSize: 9 }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
          Live
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {/* ── Account ─────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <p className="label" style={{ marginBottom: 4 }}>Connected account</p>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--dim)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {displayAccount}
          </p>
        </div>

        {/* ── Total Value ──────────────────────── */}
        {totalValue > 0 && (
          <div style={{
            background: 'var(--elevated)',
            border: '1px solid var(--border-hi)',
            borderRadius: 'var(--r-lg)',
            padding: '14px 16px',
            marginBottom: 16,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Subtle top glow */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              height: 1,
              background: 'linear-gradient(90deg, transparent, var(--cyan-dim), transparent)',
              opacity: 0.4,
            }} />
            <p className="label" style={{ marginBottom: 6 }}>Total Value</p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--heading)',
              lineHeight: 1,
            }}>
              ${totalValue >= 1000
                ? (totalValue / 1000).toFixed(1) + 'k'
                : totalValue.toFixed(2)}
            </p>
            {totalValue >= 1000 && (
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
            <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8 }}>
              {portfolio.holdings.length} asset{portfolio.holdings.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* ── Holdings ─────────────────────────── */}
        <div style={{ marginBottom: 8 }}>
          <p className="label" style={{ marginBottom: 10 }}>Holdings</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {portfolio.holdings.map((holding, index) => {
              const pct = allocation[holding.token] || 0;
              const isTop = holding === topHolding;

              return (
                <div
                  key={index}
                  style={{
                    background: 'var(--elevated)',
                    border: `1px solid ${isTop ? 'var(--border-hi)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-md)',
                    padding: '10px 12px',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      {/* Token icon placeholder */}
                      <div style={{
                        width: 22, height: 22,
                        borderRadius: 5,
                        background: isTop ? 'var(--cyan-faint)' : 'var(--border)',
                        border: `1px solid ${isTop ? 'var(--cyan-dim)' : 'var(--border-hi)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 700,
                        color: isTop ? 'var(--cyan)' : 'var(--muted)',
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                      }}>
                        {holding.token.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--heading)',
                      }}>
                        {holding.token}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: pct > 50 ? 'var(--warning)' : pct > 25 ? 'var(--gold)' : 'var(--dim)',
                    }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>

                  {/* Allocation bar */}
                  <div className="alloc-bar" style={{ marginBottom: 5 }}>
                    <div
                      className="alloc-bar-fill"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background: pct > 50
                          ? 'linear-gradient(90deg, var(--warning), rgba(240,180,41,0.6))'
                          : pct > 25
                          ? 'linear-gradient(90deg, var(--gold-dim), var(--gold))'
                          : 'linear-gradient(90deg, var(--cyan-dim), var(--cyan))',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{holding.balance}</span>
                    {holding.valueUSD && (
                      <span style={{ fontSize: 10, color: 'var(--dim)' }}>
                        ${holding.valueUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────── */}
      <div style={{
        padding: '10px 18px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="var(--muted)" strokeWidth="1.5"/>
          <path d="M12 8v4l2 2" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>
          {new Date(portfolio.lastUpdated).toLocaleDateString()}
        </span>
      </div>
    </aside>
  );
}
