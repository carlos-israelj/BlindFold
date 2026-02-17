'use client';

import { useState } from 'react';

export interface PortfolioAsset {
  symbol: string;
  balance: number;
  value: number;
}

interface PortfolioFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assets: PortfolioAsset[]) => Promise<void>;
  groupId: string;
}

export default function PortfolioForm({
  isOpen,
  onClose,
  onSave,
  groupId,
}: PortfolioFormProps) {
  const [assets, setAssets] = useState<PortfolioAsset[]>([
    { symbol: '', balance: 0, value: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  if (!isOpen) return null;

  const addAsset = () => setAssets([...assets, { symbol: '', balance: 0, value: 0 }]);

  const removeAsset = (index: number) => {
    if (assets.length === 1) { setError('You must have at least one asset'); return; }
    setAssets(assets.filter((_, i) => i !== index));
  };

  const updateAsset = (index: number, field: keyof PortfolioAsset, value: string | number) => {
    const next = [...assets];
    if (field === 'symbol') {
      next[index][field] = value as string;
    } else {
      next[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    }
    setAssets(next);
    setError(null);
  };

  const totalValue = assets.reduce((sum, a) => sum + (a.value || 0), 0);

  const validate = () => {
    if (assets.some(a => !a.symbol.trim())) { setError('All assets must have a name'); return false; }
    const syms = assets.map(a => a.symbol.toLowerCase());
    const dups = syms.filter((s, i) => syms.indexOf(s) !== i);
    if (dups.length) { setError(`Duplicate asset names: ${dups.join(', ')}`); return false; }
    if (assets.some(a => a.value <= 0)) { setError('All assets must have a value greater than $0'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSave(assets);
      setAssets([{ symbol: '', balance: 0, value: 0 }]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute HHI preview
  const hhiPreview = totalValue > 0
    ? assets.reduce((sum, a) => {
        const share = (a.value || 0) / totalValue;
        return sum + share * share;
      }, 0)
    : 0;

  const hhiConcentration = hhiPreview < 0.15 ? 'Low' : hhiPreview < 0.25 ? 'Medium' : 'High';
  const hhiColor = hhiPreview < 0.15 ? 'var(--success)' : hhiPreview < 0.25 ? 'var(--warning)' : 'var(--critical)';

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(7,8,15,0.85)',
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div
        className="animate-fade-up card-glow"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--r-xl)',
        }}
      >
        {/* ── Modal Header ─────────────────────── */}
        <div style={{
          padding: '20px 24px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexShrink: 0,
          position: 'relative',
        }}>
          {/* Top accent line */}
          <div style={{
            position: 'absolute', top: 0, left: 32, right: 32, height: 1,
            background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
            opacity: 0.4,
          }} />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 30, height: 30,
                background: 'var(--cyan-faint)',
                border: '1px solid var(--cyan-dim)',
                borderRadius: 7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z" stroke="var(--cyan)" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--heading)',
              }}>
                Portfolio Assets
              </h2>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
              vault: <span style={{ color: 'var(--dim)' }}>{groupId || '—'}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--muted)', cursor: 'pointer',
              padding: 6, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => {
              const t = e.currentTarget as HTMLElement;
              t.style.color = 'var(--body)';
              t.style.background = 'var(--border)';
            }}
            onMouseLeave={e => {
              const t = e.currentTarget as HTMLElement;
              t.style.color = 'var(--muted)';
              t.style.background = 'none';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* ── Scrollable Body ───────────────────── */}
        <form
          onSubmit={handleSubmit}
          style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}
        >
          {/* Info bar */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px',
            background: 'var(--cyan-faint)',
            border: '1px solid var(--border-hi)',
            borderRadius: 'var(--r-md)',
            marginBottom: 20,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.55 }}>
              Add each asset with its current USD value. The Shade Agent will encrypt and calculate
              concentration risk (HHI) automatically.
            </p>
          </div>

          {/* Assets list */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="label">Assets ({assets.length})</span>
              <button
                type="button"
                onClick={addAsset}
                className="btn btn-ghost"
                style={{ padding: '6px 12px', fontSize: 11 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
                Add Asset
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {assets.map((asset, index) => {
                const pct = totalValue > 0 ? (asset.value / totalValue) * 100 : 0;

                return (
                  <div
                    key={index}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)',
                      padding: '12px 14px',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                      {/* Index badge */}
                      <div style={{
                        flexShrink: 0,
                        width: 26, height: 26,
                        borderRadius: 6,
                        background: 'var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 500,
                        color: 'var(--dim)',
                        fontFamily: 'var(--font-mono)',
                        alignSelf: 'flex-start',
                        marginTop: 20,
                      }}>
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      {/* Fields */}
                      <div style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.5fr 1.5fr',
                        gap: 10,
                      }}>
                        {/* Symbol */}
                        <div>
                          <p className="label" style={{ marginBottom: 5 }}>Asset</p>
                          <input
                            type="text"
                            value={asset.symbol}
                            onChange={(e) => updateAsset(index, 'symbol', e.target.value)}
                            placeholder="BTC, ETH, NEAR…"
                            className="input"
                            style={{ textTransform: 'uppercase' }}
                          />
                        </div>

                        {/* Balance */}
                        <div>
                          <p className="label" style={{ marginBottom: 5 }}>Amount</p>
                          <input
                            type="number"
                            value={asset.balance || ''}
                            onChange={(e) => updateAsset(index, 'balance', e.target.value)}
                            placeholder="0.00"
                            step="any"
                            min="0"
                            className="input"
                          />
                        </div>

                        {/* Value */}
                        <div>
                          <p className="label" style={{ marginBottom: 5 }}>USD Value</p>
                          <div style={{ position: 'relative' }}>
                            <span style={{
                              position: 'absolute', left: 10, top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: 12, color: 'var(--muted)',
                              fontFamily: 'var(--font-mono)',
                              pointerEvents: 'none',
                            }}>$</span>
                            <input
                              type="number"
                              value={asset.value || ''}
                              onChange={(e) => updateAsset(index, 'value', e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="input"
                              style={{ paddingLeft: 22 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Remove */}
                      <div style={{ alignSelf: 'flex-end', paddingBottom: 0 }}>
                        <button
                          type="button"
                          onClick={() => removeAsset(index)}
                          style={{
                            background: 'none', border: 'none',
                            color: 'var(--muted)', cursor: assets.length === 1 ? 'not-allowed' : 'pointer',
                            padding: 6, borderRadius: 4,
                            display: 'flex',
                            opacity: assets.length === 1 ? 0.3 : 1,
                            transition: 'color 0.15s',
                          }}
                          title="Remove asset"
                          onMouseEnter={e => { if (assets.length > 1) (e.currentTarget as HTMLElement).style.color = 'var(--critical)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Mini allocation preview */}
                    {asset.value > 0 && totalValue > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="alloc-bar" style={{ flex: 1 }}>
                          <div
                            className="alloc-bar-fill"
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              background: pct > 50
                                ? 'linear-gradient(90deg, var(--warning), rgba(240,180,41,0.6))'
                                : 'linear-gradient(90deg, var(--cyan-dim), var(--cyan))',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary card */}
          <div style={{
            background: 'var(--elevated)',
            border: '1px solid var(--border-hi)',
            borderRadius: 'var(--r-md)',
            padding: '14px 16px',
            marginBottom: 16,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
          }}>
            <div>
              <p className="label" style={{ marginBottom: 4 }}>Total Value</p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--heading)',
              }}>
                ${totalValue > 0 ? totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
              </p>
            </div>
            <div>
              <p className="label" style={{ marginBottom: 4 }}>Assets</p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 800,
                color: 'var(--heading)',
              }}>
                {assets.length}
              </p>
            </div>
            <div>
              <p className="label" style={{ marginBottom: 4 }}>HHI (preview)</p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 800,
                color: totalValue > 0 ? hhiColor : 'var(--muted)',
              }}>
                {totalValue > 0 ? (
                  <>{hhiPreview.toFixed(3)} <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 400 }}>{hhiConcentration}</span></>
                ) : '—'}
              </p>
            </div>
          </div>

          {/* JSON preview */}
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setShowJsonPreview(!showJsonPreview)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: 11, color: 'var(--dim)', cursor: 'pointer', padding: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--cyan)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--dim)'; }}
            >
              <svg
                width="10" height="10" viewBox="0 0 24 24" fill="none"
                style={{ transform: showJsonPreview ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Preview JSON payload
            </button>

            {showJsonPreview && (
              <pre
                className="animate-fade-in"
                style={{
                  marginTop: 8,
                  background: 'var(--ink)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  padding: '12px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--success)',
                  overflowX: 'auto',
                  lineHeight: 1.55,
                }}
              >
                {JSON.stringify({ assets }, null, 2)}
              </pre>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              className="animate-fade-in"
              style={{
                padding: '10px 14px',
                background: 'rgba(255,77,109,0.06)',
                border: '1px solid rgba(255,77,109,0.3)',
                borderRadius: 'var(--r-md)',
                color: 'var(--critical)',
                fontSize: 12,
                marginBottom: 16,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex', gap: 10,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalValue === 0}
              className="btn btn-primary"
              style={{
                flex: 2,
                opacity: (isSubmitting || totalValue === 0) ? 0.5 : 1,
                cursor: (isSubmitting || totalValue === 0) ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Encrypting & Saving…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Save to NOVA Vault
                </>
              )}
            </button>
          </div>

          {/* Footer note */}
          <p style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 10,
            color: 'var(--muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            AES-256-GCM encrypted · Keys derived in Phala TEE · Stored on IPFS
          </p>
        </form>
      </div>
    </div>
  );
}
