'use client';

import React from 'react';
import { MessageVerification } from '@/types';

interface OnChainVerificationProps {
  verification: MessageVerification;
  contractId: string;
  network?: 'mainnet' | 'testnet';
}

export function OnChainVerification({
  verification,
  contractId,
  network = 'testnet',
}: OnChainVerificationProps) {
  const nearBlocksBase =
    network === 'mainnet'
      ? 'https://nearblocks.io'
      : 'https://testnet.nearblocks.io';

  const truncate = (str: string, start = 8, end = 8) => {
    if (str.length <= start + end) return str;
    return `${str.slice(0, start)}...${str.slice(-end)}`;
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <h4 className="text-sm font-semibold text-gray-900">
          On-Chain Verification
        </h4>
      </div>

      {/* Request Hash */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-1">Request Hash</p>
        <div className="flex items-center space-x-2">
          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 flex-1 overflow-x-auto">
            {truncate(verification.request_hash, 12, 12)}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(verification.request_hash)}
            className="text-xs text-blue-600 hover:text-blue-700"
            title="Copy full hash"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Response Hash */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-1">Response Hash</p>
        <div className="flex items-center space-x-2">
          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 flex-1 overflow-x-auto">
            {truncate(verification.response_hash, 12, 12)}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(verification.response_hash)}
            className="text-xs text-blue-600 hover:text-blue-700"
            title="Copy full hash"
          >
            Copy
          </button>
        </div>
      </div>

      {/* TEE Signature */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-1">TEE Signature</p>
        <div className="flex items-center space-x-2">
          <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 flex-1 overflow-x-auto">
            {truncate(verification.signature, 10, 10)}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(verification.signature)}
            className="text-xs text-blue-600 hover:text-blue-700"
            title="Copy full signature"
          >
            Copy
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Signed by:{' '}
          <code className="bg-white px-1 rounded">
            {truncate(verification.signing_address, 6, 4)}
          </code>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Algorithm: {verification.signing_algo.toUpperCase()}
        </p>
      </div>

      {/* NOVA CID */}
      {verification.nova_cid && (
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">NOVA Vault CID</p>
          <a
            href={`https://ipfs.io/ipfs/${verification.nova_cid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 underline break-all"
          >
            {truncate(verification.nova_cid, 12, 12)}
          </a>
        </div>
      )}

      {/* Links to Block Explorers */}
      <div className="pt-3 border-t border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Verify On-Chain</p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`${nearBlocksBase}/address/${contractId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            <svg
              className="w-3 h-3 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            View Contract on NearBlocks
          </a>
          <a
            href={`https://etherscan.io/verifiedSignatures?q=${verification.signature}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
          >
            <svg
              className="w-3 h-3 mr-1.5"
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
            Verify Signature on Etherscan
          </a>
        </div>
      </div>

      {/* Verification Status */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-start space-x-2">
          <svg
            className="w-5 h-5 text-green-600 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div>
            <p className="text-xs font-semibold text-green-700">
              ✓ Verified in TEE
            </p>
            <p className="text-xs text-gray-600 mt-1">
              This response was generated inside a hardware-secured enclave (Intel
              TDX + NVIDIA H200 TEE) and cryptographically signed. The signature
              proves that your data was never exposed during processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
