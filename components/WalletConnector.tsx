'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/contexts/VaultContext';

export default function WalletConnector() {
  const { accountId, isConnected, disconnect, connect, setPortfolio, setLoading, setError } = useWallet();
  const { initializeVault, setPortfolioCID } = useVault();
  const [inputAccountId, setInputAccountId] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    if (!inputAccountId.trim()) {
      setError('Please enter a NEAR account ID');
      return;
    }

    setConnecting(true);
    setLoading(true);

    try {
      // Connect wallet
      connect(inputAccountId);

      // Fetch portfolio from NEAR RPC
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: inputAccountId }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch portfolio');
      }

      setPortfolio(data.data.portfolio, data.data.analytics);

      // Create or get vault (optional - app works without it)
      try {
        const vaultResponse = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: inputAccountId,
            action: 'create'
          }),
        });

        const vaultData = await vaultResponse.json();

        if (vaultData.success) {
          const vaultId = vaultData.data.vaultId;
          initializeVault(vaultId);

          // Upload portfolio to vault automatically
          try {
            const uploadResponse = await fetch('/api/vault', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accountId: inputAccountId,
                action: 'upload',
                vaultId: vaultId,
                data: {
                  version: 1,
                  accountId: inputAccountId,
                  lastUpdated: new Date().toISOString(),
                  holdings: data.data.holdings || []
                },
                filename: 'portfolio.json'
              }),
            });

            const uploadData = await uploadResponse.json();

            if (uploadData.success) {
              const portfolioCID = uploadData.data.cid;
              setPortfolioCID(portfolioCID);
              console.log('Portfolio uploaded to vault with CID:', portfolioCID);
            }
          } catch (uploadError) {
            console.error('Failed to upload portfolio to vault:', uploadError);
            // Continue anyway - vault is created
          }
        } else {
          console.warn('Vault service unavailable:', vaultData.error);
          // Continue without vault - app still works
        }
      } catch (vaultError) {
        console.warn('Vault service unavailable, continuing without encryption:', vaultError);
        // App works fine without vault - it's just an optional privacy feature
      }

    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      disconnect();
    } finally {
      setConnecting(false);
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setInputAccountId('');
  };

  if (isConnected && accountId) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Connected: <span className="font-semibold text-gray-900">{accountId}</span>
        </span>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={inputAccountId}
        onChange={(e) => setInputAccountId(e.target.value)}
        placeholder="Enter NEAR account (e.g., alice.near)"
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={connecting}
      />
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="px-6 py-2 font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
}
