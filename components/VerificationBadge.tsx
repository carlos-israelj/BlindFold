'use client';

import { useState } from 'react';
import { VerificationBadgeProps } from '@/types';

export default function VerificationBadge({ verification }: VerificationBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (!verification) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200 transition-colors"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Verified in TEE
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg text-xs space-y-2">
          <div>
            <div className="font-semibold text-gray-700">Chat ID</div>
            <div className="font-mono text-gray-600 break-all">{verification.chat_id}</div>
          </div>

          <div>
            <div className="font-semibold text-gray-700">Request Hash (SHA-256)</div>
            <div className="font-mono text-gray-600 break-all">{verification.request_hash}</div>
          </div>

          <div>
            <div className="font-semibold text-gray-700">Response Hash (SHA-256)</div>
            <div className="font-mono text-gray-600 break-all">{verification.response_hash}</div>
          </div>

          <div>
            <div className="font-semibold text-gray-700">TEE Signature ({verification.signing_algo.toUpperCase()})</div>
            <div className="font-mono text-gray-600 break-all">{verification.signature}</div>
          </div>

          <div>
            <div className="font-semibold text-gray-700">Signing Address</div>
            <div className="font-mono text-gray-600 break-all">{verification.signing_address}</div>
          </div>

          {verification.nova_cid && (
            <div>
              <div className="font-semibold text-gray-700">NOVA CID</div>
              <div className="font-mono text-gray-600 break-all">{verification.nova_cid}</div>
            </div>
          )}

          <div className="pt-2 border-t border-gray-200">
            <div className="text-green-700 font-medium">
              ✓ Cryptographically verified in Trusted Execution Environment
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
