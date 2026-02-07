'use client';

import { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/contexts/VaultContext';
import { exportPortfolioData } from '@/lib/portfolio';

export default function VaultControls() {
  const { portfolio, accountId } = useWallet();
  const { vaultId, isInitialized } = useVault();
  const [inspecting, setInspecting] = useState(false);
  const [vaultData, setVaultData] = useState<any>(null);

  const handleInspect = async () => {
    if (!vaultId || !accountId) return;

    setInspecting(true);
    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          action: 'inspect',
          vaultId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setVaultData(data.data);
      }
    } catch (error) {
      console.error('Error inspecting vault:', error);
    } finally {
      setInspecting(false);
    }
  };

  const handleExport = () => {
    if (!portfolio) return;

    const data = exportPortfolioData(portfolio);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blindfold-export-${accountId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!vaultId || !accountId) return;

    const confirmed = confirm(
      'Are you sure you want to delete your vault? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          action: 'delete',
          vaultId,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Vault deleted successfully');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error deleting vault:', error);
      alert('Failed to delete vault');
    }
  };

  if (!isInitialized) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">Vault not initialized</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Vault Controls</h2>
        <p className="text-sm text-gray-600 mb-4">
          Vault ID: <span className="font-mono">{vaultId}</span>
        </p>

        <div className="space-y-2">
          <button
            onClick={handleInspect}
            disabled={inspecting}
            className="w-full px-4 py-2 text-left font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-50"
          >
            {inspecting ? 'Loading...' : 'Inspect Vault Data'}
          </button>

          <button
            onClick={handleExport}
            className="w-full px-4 py-2 text-left font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Export Portfolio & Chat History
          </button>

          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 text-left font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Delete Vault
          </button>
        </div>
      </div>

      {vaultData && (
        <div className="p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-md font-semibold mb-2">Vault Data</h3>
          <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(vaultData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
