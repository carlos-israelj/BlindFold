'use client';

import { useState } from 'react';

interface VerificationData {
  chat_id: string;
  request_hash: string;
  response_hash: string;
  signature: string;
  signing_address: string;
  signing_algo: string;
  verified?: boolean;
  attestation?: {
    report: string | null;
    signing_cert: string | null;
    nonce: string | null;
  };
}

interface VerificationBadgeProps {
  verification: VerificationData | null;
  onExpand?: () => void;
}

export default function VerificationBadge({ verification, onExpand }: VerificationBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!verification) return null;

  const isVerified = verification.verified === true;
  const hasAttestation = !!verification.attestation?.report;

  const handleToggle = () => {
    setExpanded(!expanded);
    if (onExpand) onExpand();
  };

  return (
    <div style={{ marginTop: 8 }}>
      {/* Badge button */}
      <button
        onClick={handleToggle}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          background: isVerified ? 'rgba(0,229,160,0.08)' : 'rgba(240,180,41,0.08)',
          border: `1px solid ${isVerified ? 'rgba(0,229,160,0.3)' : 'rgba(240,180,41,0.3)'}`,
          borderRadius: 20,
          cursor: 'pointer',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: isVerified ? 'var(--success)' : 'var(--warning)',
          transition: 'all 0.15s',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          {isVerified ? (
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          ) : (
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </svg>
        {isVerified ? 'TEE VERIFIED' : 'TEE UNVERIFIED'}
        {hasAttestation && (
          <span style={{
            padding: '1px 5px',
            background: 'rgba(0,212,255,0.15)',
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: 8,
            color: 'var(--cyan)',
            fontSize: 9,
          }}>
            + ATTESTATION
          </span>
        )}
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div
          className="animate-fade-in"
          style={{
            marginTop: 8,
            padding: '14px 16px',
            background: 'var(--elevated)',
            border: '1px solid var(--border-hi)',
            borderLeft: `3px solid ${isVerified ? 'var(--success)' : 'var(--warning)'}`,
            borderRadius: 'var(--r-md)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}
        >
          {/* Signature status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
                stroke={isVerified ? 'var(--success)' : 'var(--warning)'} strokeWidth="1.5" strokeLinejoin="round"/>
              {isVerified && <path d="M9 12l2 2 4-4" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: isVerified ? 'var(--success)' : 'var(--warning)', fontFamily: 'var(--font-mono)' }}>
              {isVerified ? 'Signature cryptographically valid' : 'Signature could not be verified'}
            </span>
          </div>

          {/* Data rows */}
          {[
            { label: 'CHAT ID', value: verification.chat_id },
            { label: 'REQ HASH', value: `${verification.request_hash.slice(0, 16)}…` },
            { label: 'RES HASH', value: `${verification.response_hash.slice(0, 16)}…` },
            { label: 'SIGNER', value: `${verification.signing_address.slice(0, 10)}…${verification.signing_address.slice(-6)}` },
            { label: 'ALGO', value: verification.signing_algo },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', flexShrink: 0 }}>
                {label}
              </span>
              <span style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {value}
              </span>
            </div>
          ))}

          {/* Attestation report */}
          {hasAttestation && (
            <div style={{
              marginTop: 6, padding: '10px 12px',
              background: 'rgba(0,212,255,0.04)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 6,
            }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--cyan)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginBottom: 6 }}>
                TEE ATTESTATION REPORT
              </p>
              <pre style={{
                fontSize: 9, color: 'var(--dim)', fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 120, overflowY: 'auto',
                lineHeight: 1.5, margin: 0,
              }}>
                {verification.attestation?.report
                  ? verification.attestation.report.slice(0, 400) + (verification.attestation.report.length > 400 ? '…' : '')
                  : 'No attestation data'}
              </pre>
              {verification.attestation?.nonce && (
                <p style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  nonce: {verification.attestation.nonce}
                </p>
              )}
            </div>
          )}

          <p style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2, lineHeight: 1.5 }}>
            Response generated by NEAR AI Cloud TEE. Signature proves the output was produced inside a Trusted Execution Environment.
          </p>
        </div>
      )}
    </div>
  );
}
