'use client';

import { useState } from 'react';
import { VerificationBadgeProps } from '@/types';
import { OnChainVerification } from './OnChainVerification';

export default function VerificationBadge({ verification, onExpand }: VerificationBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID || 'blindfold.testnet';
  const network = (process.env.NEXT_PUBLIC_NEAR_NETWORK || 'testnet') as 'mainnet' | 'testnet';

  if (!verification) {
    return null;
  }

  const handleToggle = () => {
    setExpanded(!expanded);
    if (onExpand) onExpand();
  };

  return (
    <div className="mt-2">
      <button
        onClick={handleToggle}
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
        <div className="mt-3">
          <OnChainVerification
            verification={verification}
            contractId={contractId}
            network={network}
          />
        </div>
      )}
    </div>
  );
}
