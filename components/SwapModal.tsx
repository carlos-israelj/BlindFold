'use client';

import React, { useState, useEffect } from 'react';
import { getSwapQuote, executeSwap } from '@/lib/hot-kit';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFromToken?: string;
  defaultFromChain?: string;
  suggestedAmount?: string;
  suggestedToToken?: string;
}

export function SwapModal({
  isOpen,
  onClose,
  defaultFromToken = 'NEAR',
  defaultFromChain = 'NEAR',
  suggestedAmount,
  suggestedToToken = 'USDC',
}: SwapModalProps) {
  const [fromChain, setFromChain] = useState(defaultFromChain);
  const [fromToken, setFromToken] = useState(defaultFromToken);
  const [toChain, setToChain] = useState('NEAR');
  const [toToken, setToToken] = useState(suggestedToToken);
  const [amount, setAmount] = useState(suggestedAmount || '');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chains = [
    'NEAR',
    'Ethereum',
    'Solana',
    'TON',
    'Bitcoin',
    'Stellar',
    'Cosmos',
  ];

  const tokens: { [key: string]: string[] } = {
    NEAR: ['NEAR', 'USDC', 'USDT', 'wBTC'],
    Ethereum: ['ETH', 'USDC', 'USDT', 'WBTC', 'DAI'],
    Solana: ['SOL', 'USDC', 'USDT'],
    TON: ['TON', 'USDT'],
    Bitcoin: ['BTC'],
    Stellar: ['XLM', 'USDC'],
    Cosmos: ['ATOM', 'USDC'],
  };

  // Fetch quote when params change
  useEffect(() => {
    if (amount && fromToken && toToken && fromChain && toChain) {
      fetchQuote();
    }
  }, [amount, fromToken, toToken, fromChain, toChain]);

  const fetchQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call HOT Kit directly (client-side only)
      const result = await getSwapQuote({
        fromChain,
        toChain,
        fromToken,
        toToken,
        amount,
      });

      if (result.success) {
        setQuote(result.data);
      } else {
        setError(result.error || 'Failed to fetch quote');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteSwap = async () => {
    setExecuting(true);
    setError(null);

    try {
      // Call HOT Kit directly (client-side only)
      const result = await executeSwap({
        fromChain,
        toChain,
        fromToken,
        toToken,
        amount,
      });

      if (result.success && result.data) {
        alert(`Swap successful! Transaction: ${result.data.txHash}\n\nFrom: ${result.data.fromAmount} ${fromToken}\nTo: ${result.data.toAmount} ${toToken}`);
        onClose();
      } else {
        setError(result.error || 'Swap failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Swap Tokens</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* From */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={fromChain}
              onChange={(e) => setFromChain(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {chains.map((chain) => (
                <option key={chain} value={chain}>
                  {chain}
                </option>
              ))}
            </select>
            <select
              value={fromToken}
              onChange={(e) => setFromToken(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {tokens[fromChain]?.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Swap Icon */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => {
              // Swap from/to
              setFromChain(toChain);
              setToChain(fromChain);
              setFromToken(toToken);
              setToToken(fromToken);
            }}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* To */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={toChain}
              onChange={(e) => setToChain(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {chains.map((chain) => (
                <option key={chain} value={chain}>
                  {chain}
                </option>
              ))}
            </select>
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {tokens[toChain]?.map((token) => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
          </div>
          {quote && (
            <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold text-gray-900">
                ≈ {quote.toAmount} {toToken}
              </p>
              <p className="text-xs text-gray-500">
                Rate: 1 {fromToken} = {quote.rate} {toToken}
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
            <p className="text-xs text-red-600 mt-1">
              Note: HOT Protocol integration is a placeholder and not yet fully implemented.
            </p>
          </div>
        )}

        {/* Quote Details */}
        {quote && !error && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Network Fee:</span>
              <span className="text-gray-900">{quote.fees.network}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Protocol Fee:</span>
              <span className="text-gray-900">{quote.fees.protocol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Time:</span>
              <span className="text-gray-900">{quote.estimatedTime}s</span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleExecuteSwap}
          disabled={!quote || loading || executing || !!error}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {executing ? 'Swapping...' : loading ? 'Getting Quote...' : 'Swap'}
        </button>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Powered by HOT Protocol • Non-custodial • Gasless
        </p>
      </div>
    </div>
  );
}
