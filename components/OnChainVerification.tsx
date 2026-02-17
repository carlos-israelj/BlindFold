'use client';

import React, { useState } from 'react';
import { MessageVerification } from '@/types';

interface OnChainVerificationProps {
  verification: MessageVerification;
  contractId?: string;
  network?: 'mainnet' | 'testnet';
}

export function OnChainVerification({
  verification,
  contractId = 'ecuador5.near',
  network = 'mainnet',
}: OnChainVerificationProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const nearBlocksBase =
    network === 'mainnet'
      ? 'https://nearblocks.io'
      : 'https://testnet.nearblocks.io';

  const truncate = (str: string, start = 8, end = 8) => {
    if (!str || str.length <= start + end) return str;
    return `${str.slice(0, start)}…${str.slice(-end)}`;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '5px 0',
    borderBottom: '1px solid var(--border)',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: 'var(--muted)',
    textTransform: 'uppercase' as const,
    flexShrink: 0,
    minWidth: 80,
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--dim)',
    flex: 1,
    textAlign: 'right' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  };

  const copyBtn: React.CSSProperties = {
    flexShrink: 0,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--muted)',
    padding: '2px 4px',
    borderRadius: 3,
    fontSize: 9,
    fontFamily: 'var(--font-mono)',
  };

  const linkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '5px 10px',
    background: 'var(--elevated)',
    border: '1px solid var(--border-hi)',
    borderRadius: 'var(--r-md)',
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: 'var(--dim)',
    textDecoration: 'none',
    transition: 'all 0.15s',
  };

  return (
    <div style={{
      marginTop: 6,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 10px',
        background: 'var(--elevated)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: 'var(--success)',
          boxShadow: '0 0 6px var(--success)',
        }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'var(--success)',
          textTransform: 'uppercase',
        }}>
          On-Chain Verification
        </span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--muted)',
        }}>
          {contractId}
        </span>
      </div>

      {/* Data rows */}
      <div style={{ padding: '4px 10px 2px' }}>
        {[
          { label: 'CHAT ID', value: verification.chat_id, key: 'chat_id' },
          { label: 'REQ HASH', value: verification.request_hash, key: 'req' },
          { label: 'RES HASH', value: verification.response_hash, key: 'res' },
          { label: 'SIGNER', value: verification.signing_address, key: 'signer' },
          { label: 'ALGO', value: verification.signing_algo?.toUpperCase(), key: 'algo', noCopy: true },
        ].map(({ label, value, key, noCopy }) => (
          <div key={key} style={rowStyle}>
            <span style={labelStyle}>{label}</span>
            <span style={valueStyle} title={value}>{truncate(value, 10, 8)}</span>
            {!noCopy && (
              <button
                style={copyBtn}
                onClick={() => copyToClipboard(value, key)}
                title="Copy"
              >
                {copied === key ? '✓' : '⎘'}
              </button>
            )}
          </div>
        ))}

        {verification.nova_cid && (
          <div style={rowStyle}>
            <span style={labelStyle}>NOVA CID</span>
            <a
              href={`https://ipfs.io/ipfs/${verification.nova_cid}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...valueStyle, color: 'var(--cyan)', textDecoration: 'none' }}
              title={verification.nova_cid}
            >
              {truncate(verification.nova_cid, 10, 8)}
            </a>
            <button
              style={copyBtn}
              onClick={() => copyToClipboard(verification.nova_cid!, 'cid')}
            >
              {copied === 'cid' ? '✓' : '⎘'}
            </button>
          </div>
        )}

        {/* NVIDIA GPU attestation status */}
        {(verification as any).attestation?.nvidia_verdict && (
          <div style={rowStyle}>
            <span style={labelStyle}>NVIDIA GPU</span>
            <span style={{
              ...valueStyle,
              color: (verification as any).attestation.nvidia_verdict === 'PASS'
                ? 'var(--success)' : 'var(--warning)',
            }}>
              {(verification as any).attestation.nvidia_verdict}
            </span>
          </div>
        )}

        {/* Intel TDX status */}
        {(verification as any).attestation?.tdx_verified !== undefined && (
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span style={labelStyle}>INTEL TDX</span>
            <span style={{
              ...valueStyle,
              color: (verification as any).attestation.tdx_verified
                ? 'var(--success)' : 'var(--warning)',
            }}>
              {(verification as any).attestation.tdx_verified ? 'VERIFIED' : 'UNVERIFIED'}
            </span>
          </div>
        )}
      </div>

      {/* External links */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '8px 10px',
        borderTop: '1px solid var(--border)',
        flexWrap: 'wrap',
      }}>
        <a
          href={`${nearBlocksBase}/address/${contractId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--cyan-dim)';
            (e.currentTarget as HTMLElement).style.color = 'var(--cyan)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hi)';
            (e.currentTarget as HTMLElement).style.color = 'var(--dim)';
          }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
            <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          NEARBLOCKS
        </a>
        <a
          href={`https://etherscan.io/verifiedSignatures?q=${verification.signature}`}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--cyan-dim)';
            (e.currentTarget as HTMLElement).style.color = 'var(--cyan)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hi)';
            (e.currentTarget as HTMLElement).style.color = 'var(--dim)';
          }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          VERIFY SIG
        </a>
        <a
          href="https://tee-attestation-explorer.near.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--cyan-dim)';
            (e.currentTarget as HTMLElement).style.color = 'var(--cyan)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hi)';
            (e.currentTarget as HTMLElement).style.color = 'var(--dim)';
          }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          TEE EXPLORER
        </a>
      </div>
    </div>
  );
}
