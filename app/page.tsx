'use client';

import dynamic from 'next/dynamic';
import { useWallet } from '@/contexts/WalletContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const HotWalletConnect = dynamic(() => import('@/components/HotWalletConnect'), {
  ssr: false,
  loading: () => (
    <div className="btn btn-ghost w-full justify-center" style={{ opacity: 0.5 }}>
      <span className="animate-blink">_</span> Initializing secure connection...
    </div>
  ),
});

export default function Home() {
  const { isConnected, error } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.push('/chat');
  }, [isConnected, router]);

  return (
    <div className="min-h-screen mesh-hero bg-grid relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: '-10%', left: '-5%',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute', bottom: '-15%', right: '-5%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(240,180,41,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-20" style={{ maxWidth: 1100 }}>

        {/* ── Nav ─────────────────────────────────────── */}
        <nav className="flex items-center justify-between mb-24 animate-fade-in">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="BlindFold" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--heading)' }}>
              BlindFold
            </span>
          </div>
          <div className="badge badge-cyan animate-glow-pulse">
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block' }} />
            TEE Active
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────── */}
        <div className="text-center mb-20">
          <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
            <p className="label mb-5" style={{ letterSpacing: '0.2em' }}>
              Privacy-Verified Intelligence
            </p>
          </div>

          <h1
            className="animate-fade-up animate-delay-100"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(52px, 8vw, 96px)',
              fontWeight: 900,
              lineHeight: 1.0,
              color: 'var(--bright)',
              marginBottom: 24,
            }}
          >
            Your AI is{' '}
            <span className="text-gradient-cyan" style={{ fontStyle: 'italic' }}>
              blindfolded
            </span>
          </h1>

          <p
            className="animate-fade-up animate-delay-200"
            style={{
              fontSize: 18,
              color: 'var(--body)',
              maxWidth: 560,
              margin: '0 auto 48px',
              lineHeight: 1.7,
            }}
          >
            The first crypto financial advisor that processes your portfolio inside a hardware-secured TEE.
            The AI never sees your data — cryptographically guaranteed.
          </p>

          {/* Wallet Connect */}
          <div
            className="animate-fade-up animate-delay-300"
            style={{ maxWidth: 400, margin: '0 auto 16px' }}
          >
            <HotWalletConnect />
          </div>

          {error && (
            <div
              className="animate-fade-in"
              style={{
                maxWidth: 400,
                margin: '12px auto 0',
                padding: '10px 16px',
                background: 'rgba(255,77,109,0.08)',
                border: '1px solid rgba(255,77,109,0.3)',
                borderRadius: 'var(--r-md)',
                color: 'var(--critical)',
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* ── Feature Cards ───────────────────────────── */}
        <div
          className="animate-fade-up animate-delay-400"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            marginBottom: 80,
          }}
        >
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ),
              accent: 'var(--cyan)',
              accentFaint: 'var(--cyan-faint)',
              label: '01 — Encryption',
              title: 'Complete Privacy',
              body: 'Your portfolio lives in an AES-256-GCM encrypted NOVA vault. Keys are derived inside a hardware TEE — never exposed.',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              ),
              accent: 'var(--success)',
              accentFaint: 'rgba(0,229,160,0.06)',
              label: '02 — Attestation',
              title: 'Cryptographic Proof',
              body: 'Every AI response is ECDSA-signed. Intel TDX + NVIDIA H200 attestation proves no one saw your data — verifiable on-chain.',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ),
              accent: 'var(--gold)',
              accentFaint: 'var(--gold-glow)',
              label: '03 — Intelligence',
              title: 'Production AI',
              body: 'Powered by NEAR AI Cloud with NVIDIA H200 GPUs running in confidential computing mode. Fast, scalable, verifiable.',
            },
          ].map((card, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: '28px 24px',
                position: 'relative',
                overflow: 'hidden',
                animationDelay: `${400 + i * 80}ms`,
              }}
            >
              {/* Top accent line */}
              <div style={{
                position: 'absolute', top: 0, left: 24, right: 24,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${card.accent}, transparent)`,
                opacity: 0.5,
              }} />

              <div style={{
                width: 40, height: 40,
                background: card.accentFaint,
                border: `1px solid ${card.accent}33`,
                borderRadius: 'var(--r-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.accent,
                marginBottom: 16,
              }}>
                {card.icon}
              </div>

              <p className="label" style={{ marginBottom: 8, color: card.accent, opacity: 0.8 }}>
                {card.label}
              </p>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--heading)',
                marginBottom: 10,
              }}>
                {card.title}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--dim)', lineHeight: 1.65 }}>
                {card.body}
              </p>
            </div>
          ))}
        </div>

        {/* ── How It Works ────────────────────────────── */}
        <div
          className="animate-fade-up animate-delay-500"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 40,
            marginBottom: 80,
            alignItems: 'center',
          }}
        >
          <div>
            <p className="label" style={{ marginBottom: 16 }}>How it works</p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 36,
                fontWeight: 800,
                color: 'var(--heading)',
                lineHeight: 1.15,
                marginBottom: 12,
              }}
            >
              Zero-knowledge<br />
              <span className="text-gradient-gold">portfolio analysis</span>
            </h2>
            <p style={{ color: 'var(--dim)', fontSize: 14, lineHeight: 1.7 }}>
              The system is designed so the AI model processes your encrypted data
              inside a sealed hardware enclave. Your advisor is literally blindfolded.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: '01', title: 'Connect Wallet', body: 'Authenticate via NEP-413 message signing. No seed phrase, no custody.' },
              { n: '02', title: 'Encrypt & Store', body: 'Portfolio encrypted AES-256-GCM, keys derived in Phala TEE, data stored on IPFS.' },
              { n: '03', title: 'Private Inference', body: 'AI processes data inside Intel TDX + NVIDIA H200 TEE. Sealed execution guaranteed.' },
              { n: '04', title: 'Verify On-Chain', body: 'Response hash + ECDSA signature published to NEAR. Anyone can verify.' },
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  padding: '18px 0',
                  borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{
                  flexShrink: 0,
                  width: 32, height: 32,
                  borderRadius: 'var(--r-sm)',
                  background: 'var(--cyan-faint)',
                  border: '1px solid var(--cyan-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 500,
                  color: 'var(--cyan)',
                  letterSpacing: '0.05em',
                }}>
                  {step.n}
                </div>
                <div>
                  <p style={{ color: 'var(--heading)', fontWeight: 500, marginBottom: 3, fontSize: 13 }}>
                    {step.title}
                  </p>
                  <p style={{ color: 'var(--dim)', fontSize: 12, lineHeight: 1.6 }}>
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tech Stack ──────────────────────────────── */}
        <div
          className="card-glow animate-fade-up animate-delay-600"
          style={{ padding: '28px 32px' }}
        >
          <p className="label" style={{ marginBottom: 20 }}>Why this cannot exist elsewhere</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {[
              { tag: 'NEAR AI Cloud', desc: 'TEE-based private inference (Intel TDX + NVIDIA H200)' },
              { tag: 'NOVA Protocol', desc: 'Encrypted vault + Shade Agents for TEE key management' },
              { tag: 'Phala Network', desc: 'Hardware-attested execution environment for key derivation' },
              { tag: 'Dual Attestation', desc: 'GPU attestation + CPU TEE quotes = verifiable privacy' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span className="badge badge-cyan" style={{ alignSelf: 'flex-start' }}>{item.tag}</span>
                <p style={{ color: 'var(--dim)', fontSize: 12, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <footer
          className="animate-fade-in animate-delay-600"
          style={{ textAlign: 'center', marginTop: 60 }}
        >
          <p className="label" style={{ opacity: 0.5 }}>
            Built for NEARCON 2026 Innovation Sandbox · &ldquo;The Private Web &amp; Private Life&rdquo; Track
          </p>
        </footer>
      </div>
    </div>
  );
}
