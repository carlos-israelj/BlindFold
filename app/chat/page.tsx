'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/contexts/VaultContext';
import ChatInterface from '@/components/ChatInterface';
import PortfolioSidebar from '@/components/PortfolioSidebar';
import NovaSetupBanner from '@/components/NovaSetupBanner';
import PortfolioForm, { PortfolioAsset } from '@/components/PortfolioForm';
import Link from 'next/link';

export default function ChatPage() {
  const { isConnected, accountId, disconnect } = useWallet();
  const { vaultId } = useVault();
  const router = useRouter();
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const handleSavePortfolio = async (assets: PortfolioAsset[]) => {
    try {
      const response = await fetch('/api/vault/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          groupId: vaultId,
          assets,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowPortfolioForm(false);
        alert(`Portfolio updated successfully! CID: ${data.cid}`);
      } else {
        throw new Error(data.error || 'Failed to save portfolio');
      }
    } catch (error: any) {
      console.error('Error saving portfolio:', error);
      throw error;
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p className="text-gray-600">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* NOVA Setup Banner */}
      <NovaSetupBanner />

      {/* Portfolio Form Modal */}
      <PortfolioForm
        isOpen={showPortfolioForm}
        onClose={() => setShowPortfolioForm(false)}
        onSave={handleSavePortfolio}
        groupId={vaultId || ''}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              🔒 BlindFold
            </Link>
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm text-gray-600">
              {accountId}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {vaultId && (
              <button
                onClick={() => setShowPortfolioForm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Update Portfolio
              </button>
            )}
            <Link
              href="/vault"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Vault Controls
            </Link>
            <button
              onClick={disconnect}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        {vaultId && (
          <div className="mt-2 text-xs text-gray-500">
            Vault: <span className="font-mono">{vaultId}</span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <ChatInterface />
        </div>
        <PortfolioSidebar />
      </div>
    </div>
  );
}
