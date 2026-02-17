'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import MessageBubble from './MessageBubble';
import { formatPortfolioForAI } from '@/lib/portfolio';
import { useWallet } from '@/contexts/WalletContext';

const SUGGESTED_PROMPTS = [
  'What is my portfolio concentration risk?',
  'Should I rebalance my holdings?',
  'What are my most overweight positions?',
  'Give me a risk summary',
];

export default function ChatInterface() {
  const { portfolio, accountId } = useWallet();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [onChainMode, setOnChainMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Poll the contract until request is Completed, then update the pending message
  const pollOnChainResult = async (requestId: number, msgTimestamp: string) => {
    const maxAttempts = 40; // 40 × 3s = 2 min max
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const res = await fetch(`/api/advisor?accountId=${encodeURIComponent(accountId || '')}&requestId=${requestId}`);
        const data = await res.json();
        const req = data?.data?.request;
        const verification = data?.data?.verification;

        if (req?.status === 'Completed') {
          const responseText = verification?.response_text || `Request #${requestId} completed. Check NEARBlocks for details.`;
          setMessages(prev => prev.map(m =>
            m.timestamp === msgTimestamp
              ? { ...m, content: responseText, verification }
              : m
          ));
          return;
        }

        if (req?.status === 'Failed') {
          setMessages(prev => prev.map(m =>
            m.timestamp === msgTimestamp
              ? { ...m, content: `❌ Request #${requestId} failed on-chain. Please try again.` }
              : m
          ));
          return;
        }
      } catch {
        // continue polling on error
      }
    }
    // Timeout
    setMessages(prev => prev.map(m =>
      m.timestamp === msgTimestamp
        ? { ...m, content: `⏱ Request #${requestId} is taking longer than expected. Check ecuador5.near on NEARBlocks for the result.` }
        : m
    ));
  };

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading || !portfolio) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const portfolioContext = formatPortfolioForAI(portfolio);
      const endpoint = onChainMode ? '/api/advisor' : '/api/chat';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          portfolio: portfolioContext,
          accountId,
          question: content,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to get response');

      const msgTimestamp = new Date().toISOString();
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.data.content,
        timestamp: msgTimestamp,
        verification: data.data.verification,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // On-chain mode: poll for the actual response in the background
      if (data.data.pending && data.data.requestId !== undefined) {
        setLoading(false);
        pollOnChainResult(data.data.requestId, msgTimestamp);
        return;
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasPortfolio = !!portfolio;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden',
      background: 'var(--ink)',
    }}>
      {/* ── Messages Area ──────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
      }}>
        {messages.length === 0 && (
          <div
            className="animate-fade-up"
            style={{
              textAlign: 'center',
              padding: '60px 20px 40px',
            }}
          >
            {/* Icon */}
            <div
              className="animate-float"
              style={{
                width: 64, height: 64,
                background: 'var(--cyan-faint)',
                border: '1px solid var(--cyan-dim)',
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 40px var(--cyan-glow)',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="var(--cyan)" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="var(--cyan)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--heading)',
              marginBottom: 8,
            }}>
              Private AI Advisor
            </h2>
            <p style={{ color: 'var(--dim)', fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
              {hasPortfolio
                ? 'Your portfolio is loaded. All conversations are encrypted and verified by TEE attestation.'
                : 'Set up your NOVA vault and upload your portfolio to start a private session.'}
            </p>

            {/* Suggested prompts */}
            {hasPortfolio && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'center',
                maxWidth: 600,
                margin: '0 auto',
              }}>
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    style={{
                      background: 'var(--elevated)',
                      border: '1px solid var(--border-hi)',
                      borderRadius: 'var(--r-md)',
                      padding: '8px 14px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      color: 'var(--dim)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      const t = e.currentTarget;
                      t.style.borderColor = 'var(--cyan-dim)';
                      t.style.color = 'var(--cyan)';
                      t.style.background = 'var(--cyan-faint)';
                    }}
                    onMouseLeave={e => {
                      const t = e.currentTarget;
                      t.style.borderColor = 'var(--border-hi)';
                      t.style.color = 'var(--dim)';
                      t.style.background = 'var(--elevated)';
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble
            key={index}
            message={message}
            isUser={message.role === 'user'}
          />
        ))}

        {/* Loading indicator */}
        {loading && (
          <div
            className="animate-fade-in"
            style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--elevated)',
              border: '1px solid var(--border)',
              borderRadius: '4px 14px 14px 14px',
              padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
              <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>
                Processing in TEE...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Area ────────────────────────────── */}
      <div style={{
        padding: '12px 20px 20px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {!hasPortfolio && (
          <div style={{
            padding: '8px 12px',
            background: 'rgba(240,180,41,0.06)',
            border: '1px solid rgba(240,180,41,0.2)',
            borderRadius: 'var(--r-md)',
            marginBottom: 10,
            fontSize: 11,
            color: 'var(--warning)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            No portfolio loaded — add your assets via the vault setup to begin
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
        }}>
          {/* Textarea */}
          <div style={{
            flex: 1,
            background: 'var(--elevated)',
            border: '1px solid var(--border-hi)',
            borderRadius: 'var(--r-lg)',
            padding: '10px 14px',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            display: 'flex',
            flexDirection: 'column',
          }}
          onFocus={() => {}}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasPortfolio ? 'Ask about your portfolio…' : 'Set up your vault to start chatting…'}
              disabled={loading || !hasPortfolio}
              rows={1}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                color: 'var(--heading)',
                lineHeight: 1.5,
                width: '100%',
                maxHeight: 120,
                overflowY: 'auto',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 6,
            }}>
              <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                Enter to send · Shift+Enter for new line
              </span>
              <span style={{ fontSize: 10, color: input.length > 800 ? 'var(--warning)' : 'var(--muted)' }}>
                {input.length}/1000
              </span>
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || !hasPortfolio}
            className="btn btn-primary"
            style={{
              padding: '13px 18px',
              borderRadius: 'var(--r-lg)',
              flexShrink: 0,
              opacity: (loading || !input.trim() || !hasPortfolio) ? 0.4 : 1,
              cursor: (loading || !input.trim() || !hasPortfolio) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2"/>
                <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>

        {/* Security note + on-chain toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="var(--success)" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>
              End-to-end encrypted · TEE-attested responses · Verified on NEAR
            </span>
          </div>

          {/* On-chain mode toggle */}
          <button
            onClick={() => setOnChainMode(m => !m)}
            title={onChainMode ? 'On-chain mode: response stored on NEAR blockchain' : 'Standard mode: fast private inference'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 8px',
              background: onChainMode ? 'rgba(0,212,255,0.1)' : 'var(--elevated)',
              border: `1px solid ${onChainMode ? 'var(--cyan-dim)' : 'var(--border-hi)'}`,
              borderRadius: 20,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: onChainMode ? 'var(--cyan)' : 'var(--muted)',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {onChainMode ? 'ON-CHAIN' : 'STANDARD'}
          </button>
        </div>
      </div>
    </div>
  );
}
