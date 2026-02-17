'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/contexts/VaultContext';
import VaultControls from '@/components/VaultControls';
import Link from 'next/link';

export default function VaultPage() {
  const { isConnected, accountId, disconnect } = useWallet();
  const { vaultId } = useVault();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) router.push('/');
  }, [isConnected, router]);

  if (!isConnected) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--ink)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 12px' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--cyan)" strokeWidth="1.5"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p style={{ color: 'var(--dim)', fontSize: 13 }}>Redirecting...</p>
        </div>
      </div>
    );
  }

  const displayAccount = accountId && accountId.length > 36
    ? `${accountId.slice(0, 12)}…${accountId.slice(-8)}`
    : accountId;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ──────────────────────────────────── */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div className="logo-mark" style={{ width: 30, height: 30, borderRadius: 7 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
                  fill="rgba(7,8,15,0.8)" stroke="rgba(7,8,15,0.8)" strokeWidth="0.5"/>
                <path d="M9 12l2 2 4-4" stroke="#07080f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--heading)' }}>
              BlindFold
            </span>
          </Link>

          <div style={{ width: 1, height: 20, background: 'var(--border-hi)' }} />

          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Vault Controls
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/chat" className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: 11 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Chat
          </Link>
          <button onClick={disconnect} className="btn btn-danger" style={{ padding: '7px 14px', fontSize: 11 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Disconnect
          </button>
        </div>
      </header>

      {/* ── Page Body ───────────────────────────────── */}
      <div style={{ flex: 1, padding: '40px 24px 60px', maxWidth: 860, margin: '0 auto', width: '100%' }}>

        {/* Page heading */}
        <div className="animate-fade-up" style={{ marginBottom: 32 }}>
          <p className="label" style={{ marginBottom: 10, letterSpacing: '0.18em' }}>Encrypted Storage</p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 900,
            color: 'var(--heading)',
            lineHeight: 1.1,
            marginBottom: 12,
          }}>
            Vault Controls
          </h1>
          <p style={{ color: 'var(--dim)', fontSize: 14, lineHeight: 1.65, maxWidth: 560 }}>
            Manage your encrypted data vault. All data is protected with AES-256-GCM,
            keys managed exclusively inside Shade TEEs on Phala Cloud.
          </p>
        </div>

        {/* Privacy guarantee banner */}
        <div
          className="animate-fade-up animate-delay-100"
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '14px 18px',
            background: 'var(--cyan-faint)',
            border: '1px solid var(--cyan-dim)',
            borderLeft: '3px solid var(--cyan)',
            borderRadius: 'var(--r-md)',
            marginBottom: 28,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 2 }}>
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--cyan)', marginBottom: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
              DATA PRIVACY GUARANTEE
            </p>
            <p style={{ fontSize: 12, color: 'var(--dim)', lineHeight: 1.6 }}>
              Your portfolio and chat history are encrypted client-side before storage.
              Only you can decrypt this data. Vault operations are logged on the NEAR blockchain
              for transparency — the encrypted content remains completely private.
            </p>
          </div>
        </div>

        {/* Vault Controls component */}
        <div className="animate-fade-up animate-delay-200">
          <VaultControls />
        </div>

        {/* Account details */}
        <div
          className="card animate-fade-up animate-delay-300"
          style={{ padding: '20px 24px', marginTop: 24 }}
        >
          <p className="label" style={{ marginBottom: 14 }}>Account Details</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="data-row">
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>ACCOUNT ID</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--body)' }}>{displayAccount}</span>
            </div>
            {vaultId && (
              <div className="data-row">
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>VAULT ID</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--body)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {vaultId}
                </span>
              </div>
            )}
            <div className="data-row">
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>ENCRYPTION</span>
              <span className="badge badge-success">AES-256-GCM</span>
            </div>
            <div className="data-row">
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>KEY MANAGEMENT</span>
              <span className="badge badge-cyan">Shade TEE · Phala Cloud</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
