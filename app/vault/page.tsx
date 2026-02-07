'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/contexts/VaultContext';
import VaultControls from '@/components/VaultControls';
import Link from 'next/link';

export default function VaultPage() {
  const { isConnected, accountId, disconnect } = useWallet();
  const { vaultId } = useVault();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              🔒 BlindFold
            </Link>
            <span className="text-sm text-gray-500">|</span>
            <span className="text-sm text-gray-600">Vault Controls</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Chat
            </Link>
            <button
              onClick={disconnect}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vault Controls</h1>
          <p className="text-gray-600">
            Manage your encrypted data vault. All data is encrypted with AES-256-GCM,
            with keys managed in Shade TEEs.
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Data Privacy Guarantee</h3>
              <p className="text-sm text-blue-800">
                Your portfolio and chat history are encrypted client-side before storage.
                Only you can decrypt this data. Vault operations are logged on the NEAR blockchain
                for transparency, but the encrypted content remains private.
              </p>
            </div>
          </div>
        </div>

        <VaultControls />

        <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Account</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Account ID:</span>
              <span className="ml-2 font-mono text-gray-900">{accountId}</span>
            </div>
            {vaultId && (
              <div>
                <span className="text-gray-600">Vault ID:</span>
                <span className="ml-2 font-mono text-gray-900">{vaultId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
