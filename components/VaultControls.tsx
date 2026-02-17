'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/contexts/VaultContext';
import { exportPortfolioData } from '@/lib/portfolio';

interface VaultFile {
  cid: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

export default function VaultControls() {
  const { portfolio, accountId } = useWallet();
  const { vaultId, isInitialized, portfolioCID, chatCIDs } = useVault();
  const [inspecting, setInspecting] = useState(false);
  const [vaultData, setVaultData] = useState<any>(null);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedCid, setCopiedCid] = useState<string | null>(null);

  const handleInspect = async () => {
    if (!vaultId || !accountId) return;
    setInspecting(true);
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, action: 'inspect', vaultId }),
      });
      const data = await response.json();
      if (data.success) {
        setVaultData(data.data);
        setFiles(data.data.files || []);
      }
    } catch (error) {
      console.error('Error inspecting vault:', error);
    } finally {
      setInspecting(false);
    }
  };

  const handleExport = () => {
    if (!portfolio) return;
    const data = exportPortfolioData(portfolio);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blindfold-export-${accountId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!vaultId || !accountId) return;
    setDeleting(true);
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, action: 'delete', vaultId }),
      });
      const data = await response.json();
      if (data.success) {
        window.location.href = '/';
      } else {
        console.error(data.error || 'Failed to delete vault');
        setDeleteConfirm(false);
      }
    } catch (error: any) {
      console.error(error.message || 'Failed to delete vault');
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const copyCid = (cid: string) => {
    navigator.clipboard.writeText(cid).then(() => {
      setCopiedCid(cid);
      setTimeout(() => setCopiedCid(null), 2000);
    });
  };

  if (!isInitialized) {
    return (
      <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--muted)" strokeWidth="1.5"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Vault not initialized</p>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, opacity: 0.6 }}>
          Set up NOVA to create your vault
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Vault Information ─────────────────────── */}
      <div className="card-glow" style={{ padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: 32, right: 32, height: 1,
          background: 'linear-gradient(90deg, transparent, var(--cyan-dim), transparent)',
          opacity: 0.5,
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--cyan-faint)',
            border: '1px solid var(--cyan-dim)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--cyan)" strokeWidth="1.5"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16, fontWeight: 700, color: 'var(--heading)',
          }}>
            Vault Information
          </span>
          <div className="badge badge-success" style={{ marginLeft: 'auto', fontSize: 9 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            Active
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Vault ID */}
          <div className="data-row">
            <span className="label">Vault ID</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: '60%' }}>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dim)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {vaultId}
              </span>
              <button
                onClick={() => copyCid(vaultId!)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: copiedCid === vaultId ? 'var(--success)' : 'var(--muted)',
                  padding: 2, borderRadius: 3, flexShrink: 0, display: 'flex',
                  transition: 'color 0.15s',
                }}
                title="Copy vault ID"
              >
                {copiedCid === vaultId ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Portfolio CID */}
          {portfolioCID && (
            <div className="data-row">
              <span className="label">Portfolio CID</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: '60%' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {portfolioCID}
                </span>
                <button
                  onClick={() => copyCid(portfolioCID)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: copiedCid === portfolioCID ? 'var(--success)' : 'var(--muted)',
                    padding: 2, borderRadius: 3, flexShrink: 0, display: 'flex',
                    transition: 'color 0.15s',
                  }}
                  title="Copy CID"
                >
                  {copiedCid === portfolioCID ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Chat CIDs */}
          {chatCIDs && chatCIDs.length > 0 && (
            <div className="data-row" style={{ alignItems: 'flex-start', paddingTop: 10, paddingBottom: 10 }}>
              <span className="label" style={{ paddingTop: 2 }}>Chat History ({chatCIDs.length})</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '60%' }}>
                {chatCIDs.map((cid, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dim)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {cid}
                    </span>
                    <button
                      onClick={() => copyCid(cid)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: copiedCid === cid ? 'var(--success)' : 'var(--muted)',
                        padding: 2, borderRadius: 3, flexShrink: 0, display: 'flex',
                        transition: 'color 0.15s',
                      }}
                    >
                      {copiedCid === cid ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                          <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div style={{ paddingTop: 14, marginTop: 4, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
              Vault active · AES-256-GCM encrypted
            </span>
          </div>
        </div>
      </div>

      {/* ── Vault Actions ─────────────────────────── */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <p className="label" style={{ marginBottom: 14 }}>Actions</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Inspect */}
          <button
            onClick={handleInspect}
            disabled={inspecting}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              cursor: inspecting ? 'not-allowed' : 'pointer',
              opacity: inspecting ? 0.6 : 1,
              transition: 'border-color 0.15s, background 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              if (!inspecting) {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hi)';
                (e.currentTarget as HTMLElement).style.background = 'var(--elevated)';
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
            }}
          >
            <div style={{
              width: 32, height: 32, flexShrink: 0,
              background: 'var(--elevated)',
              border: '1px solid var(--border-hi)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {inspecting ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle cx="12" cy="12" r="10" stroke="var(--dim)" strokeWidth="2" strokeOpacity="0.2"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="var(--dim)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="var(--dim)" strokeWidth="1.5"/>
                  <path d="M21 21l-4.35-4.35" stroke="var(--dim)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--heading)', marginBottom: 2 }}>
                {inspecting ? 'Inspecting…' : 'Inspect Vault Data'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>View all files stored in vault</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--muted)', flexShrink: 0 }}>
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              cursor: 'pointer',
              transition: 'border-color 0.15s, background 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--cyan-dim)';
              (e.currentTarget as HTMLElement).style.background = 'var(--cyan-faint)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
            }}
          >
            <div style={{
              width: 32, height: 32, flexShrink: 0,
              background: 'var(--cyan-faint)',
              border: '1px solid var(--cyan-dim)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--heading)', marginBottom: 2 }}>
                Export Portfolio &amp; Chat History
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>Download decrypted JSON file</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--muted)', flexShrink: 0 }}>
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Delete */}
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '13px 16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,77,109,0.4)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,109,0.04)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
              }}
            >
              <div style={{
                width: 32, height: 32, flexShrink: 0,
                background: 'rgba(255,77,109,0.08)',
                border: '1px solid rgba(255,77,109,0.3)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="var(--critical)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--critical)', marginBottom: 2 }}>
                  Delete Vault
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>Permanently remove all data</p>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--muted)', flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            /* Delete confirmation */
            <div
              className="animate-fade-in"
              style={{
                padding: '14px 16px',
                background: 'rgba(255,77,109,0.06)',
                border: '1px solid rgba(255,77,109,0.3)',
                borderRadius: 'var(--r-md)',
              }}
            >
              <p style={{ fontSize: 12, color: 'var(--critical)', marginBottom: 12, lineHeight: 1.55 }}>
                This will permanently delete your vault and all encrypted data. This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="btn btn-ghost"
                  style={{ flex: 1, padding: '8px 12px', fontSize: 11 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{
                    flex: 1, padding: '8px 12px',
                    background: 'rgba(255,77,109,0.12)',
                    border: '1px solid var(--critical)',
                    borderRadius: 'var(--r-md)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11, fontWeight: 500,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: 'var(--critical)',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  {deleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Vault Contents (after inspect) ────────── */}
      {vaultData && (
        <div className="card animate-fade-in" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p className="label">Vault Contents</p>
            {vaultData.filesCount !== undefined && (
              <span className="badge badge-cyan">{vaultData.filesCount} files</span>
            )}
          </div>

          {files.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {files.map((file, index) => (
                <div
                  key={index}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{
                          width: 22, height: 22, flexShrink: 0,
                          background: 'var(--elevated)',
                          border: '1px solid var(--border-hi)',
                          borderRadius: 5,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="var(--muted)" strokeWidth="1.5" strokeLinejoin="round"/>
                            <path d="M14 2v6h6" stroke="var(--muted)" strokeWidth="1.5" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.filename}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          maxWidth: 360,
                        }}>
                          {file.cid}
                        </span>
                        <button
                          onClick={() => copyCid(file.cid)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: copiedCid === file.cid ? 'var(--success)' : 'var(--muted)',
                            padding: 2, flexShrink: 0, display: 'flex',
                            transition: 'color 0.15s',
                          }}
                        >
                          {copiedCid === file.cid ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          )}
                        </button>
                      </div>

                      {file.uploadedAt && (
                        <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                          {new Date(file.uploadedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    {file.size && (
                      <span className="badge badge-gold" style={{ flexShrink: 0, fontSize: 9 }}>
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: 44, height: 44,
                background: 'var(--elevated)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="var(--muted)" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>No files found in vault</p>
              <p style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.6, marginTop: 4 }}>
                File listing may not be available in current NOVA SDK version
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Privacy Notice ────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 16px',
        background: 'rgba(0,229,160,0.04)',
        border: '1px solid rgba(0,229,160,0.2)',
        borderRadius: 'var(--r-md)',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }}>
          <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', marginBottom: 3, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
            PRIVACY GUARANTEED
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
            All data encrypted with AES-256-GCM before upload. Keys managed in Shade TEE on Phala Cloud.
            Only you can decrypt this data.
          </p>
        </div>
      </div>
    </div>
  );
}
