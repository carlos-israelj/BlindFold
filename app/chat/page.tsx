'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/contexts/VaultContext';
import ChatInterface from '@/components/ChatInterface';
import PortfolioSidebar from '@/components/PortfolioSidebar';
import NovaSetupBanner from '@/components/NovaSetupBanner';
import PortfolioForm, { PortfolioAsset } from '@/components/PortfolioForm';
import AlertBanner from '@/components/AlertBanner';
import SwapModal from '@/components/SwapModal';
import Link from 'next/link';

interface SwapRecommendation {
  action: 'sell' | 'buy';
  symbol: string;
  currentPercentage: number;
  targetPercentage: number;
  amountUSD: number;
  reason: string;
}

export default function ChatPage() {
  const { isConnected, accountId, disconnect } = useWallet();
  const { vaultId } = useVault();
  const router = useRouter();
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedSwapRecommendation, setSelectedSwapRecommendation] = useState<SwapRecommendation | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) router.push('/');
  }, [isConnected, router]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSavePortfolio = async (assets: PortfolioAsset[]) => {
    const response = await fetch('/api/vault/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, groupId: vaultId, assets }),
    });
    const data = await response.json();
    if (data.success) {
      setShowPortfolioForm(false);
      showToast(`Portfolio updated · CID: ${data.cid?.slice(0, 16)}…`);
    } else {
      throw new Error(data.error || 'Failed to save portfolio');
    }
  };

  const handleSwapClick = (recommendation: SwapRecommendation) => {
    setSelectedSwapRecommendation(recommendation);
    setShowSwapModal(true);
  };

  if (!isConnected) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--ink)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--cyan)" strokeWidth="1.5"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ color: 'var(--dim)', fontSize: 13 }}>Redirecting...</p>
        </div>
      </div>
    );
  }

  // Truncate account ID for display
  const displayAccount = accountId && accountId.length > 32
    ? `${accountId.slice(0, 10)}…${accountId.slice(-6)}`
    : accountId;

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--ink)',
      overflow: 'hidden',
    }}>
      {/* ── Nova Setup Banner ─────────────────────── */}
      <NovaSetupBanner />

      {/* ── Portfolio Form Modal ───────────────────── */}
      <PortfolioForm
        isOpen={showPortfolioForm}
        onClose={() => setShowPortfolioForm(false)}
        onSave={handleSavePortfolio}
        groupId={vaultId || ''}
      />

      {/* ── Header ────────────────────────────────── */}
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Left: Logo + Account */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo.png" alt="BlindFold" style={{ width: 30, height: 30, borderRadius: 7, objectFit: 'contain' }} />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--heading)',
            }}>
              BlindFold
            </span>
          </Link>

          <div style={{
            width: 1, height: 20,
            background: 'var(--border-hi)',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="status-dot status-dot-online" />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--dim)',
              maxWidth: 200,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {displayAccount}
            </span>
          </div>

          {vaultId && (
            <div className="badge badge-cyan" style={{ fontSize: 9 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Vault Active
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {vaultId && (
            <button
              onClick={() => setShowPortfolioForm(true)}
              className="btn btn-primary"
              style={{ padding: '7px 14px', fontSize: 11 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              Update Portfolio
            </button>
          )}
          <Link
            href="/vault"
            className="btn btn-ghost"
            style={{ padding: '7px 14px', fontSize: 11 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Vault
          </Link>
          <button
            onClick={disconnect}
            className="btn btn-danger"
            style={{ padding: '7px 14px', fontSize: 11 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Disconnect
          </button>
        </div>
      </header>

      {/* ── Main Content ──────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Alert Banner */}
          <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
            <AlertBanner onSwapClick={handleSwapClick} />
          </div>

          <ChatInterface />
        </div>

        {/* Portfolio Sidebar */}
        <PortfolioSidebar />
      </div>

      {/* ── Swap Modal ────────────────────────────── */}
      <SwapModal
        isOpen={showSwapModal}
        onClose={() => {
          setShowSwapModal(false);
          setSelectedSwapRecommendation(null);
        }}
        recommendation={selectedSwapRecommendation}
      />

      {/* ── Toast Notification ────────────────────── */}
      {toastMsg && (
        <div
          className="animate-fade-up"
          style={{
            position: 'fixed', bottom: 24, left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--elevated)',
            border: '1px solid var(--cyan-dim)',
            borderRadius: 'var(--r-md)',
            padding: '10px 20px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--cyan)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 24px var(--cyan-glow)',
            zIndex: 100,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ marginRight: 8, color: 'var(--success)' }}>✓</span>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
