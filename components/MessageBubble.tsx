'use client';

import { MessageBubbleProps } from '@/types';
import VerificationBadge from './VerificationBadge';
import { OnChainVerification } from './OnChainVerification';

export default function MessageBubble({ message, isUser }: MessageBubbleProps) {
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  if (isUser) {
    return (
      <div
        className="animate-fade-up"
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}
      >
        <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--cyan-dim), var(--cyan))',
            color: 'var(--ink)',
            borderRadius: '14px 4px 14px 14px',
            padding: '10px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
            fontWeight: 500,
          }}>
            {message.content}
          </div>
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>{time}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="animate-fade-up"
      style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12, gap: 10 }}
    >
      {/* AI Avatar */}
      <div style={{
        flexShrink: 0,
        width: 28, height: 28,
        borderRadius: 7,
        background: 'var(--cyan-faint)',
        border: '1px solid var(--cyan-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 2,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--cyan)" strokeWidth="1.5"/>
          <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Message + badge */}
      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          background: 'var(--elevated)',
          border: '1px solid var(--border)',
          borderRadius: '4px 14px 14px 14px',
          padding: '10px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--body)',
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
        }}>
          {message.content}
        </div>

        {message.verification && (
          <div style={{ paddingLeft: 2 }}>
            <VerificationBadge verification={message.verification} />
            <OnChainVerification verification={message.verification} />
          </div>
        )}

        <span style={{ fontSize: 10, color: 'var(--muted)', paddingLeft: 2 }}>{time}</span>
      </div>
    </div>
  );
}
