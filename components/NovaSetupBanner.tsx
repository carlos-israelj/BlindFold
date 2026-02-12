'use client';

import { useState, useEffect } from 'react';
import NovaSetupModal from './NovaSetupModal';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/contexts/VaultContext';

export default function NovaSetupBanner() {
  const { accountId } = useWallet();
  const { vaultId, initializeVault } = useVault();
  const [showModal, setShowModal] = useState(false);
  const [hasNovaApiKey, setHasNovaApiKey] = useState<boolean | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has NOVA API key
    const checkNovaStatus = async () => {
      try {
        const response = await fetch('/api/user/nova');
        const data = await response.json();
        setHasNovaApiKey(data.data?.hasNovaApiKey || false);
      } catch (error) {
        console.error('Failed to check NOVA status:', error);
        setHasNovaApiKey(false);
      }
    };

    if (accountId && !vaultId) {
      checkNovaStatus();
    }
  }, [accountId, vaultId]);

  const handleSetupSuccess = async () => {
    setShowModal(false);
    setHasNovaApiKey(true);

    // Try to create vault
    if (accountId) {
      try {
        const response = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId,
            action: 'create',
          }),
        });

        const data = await response.json();
        if (data.success) {
          initializeVault(data.data.vaultId);
          console.log('✅ Vault created successfully');
        }
      } catch (error) {
        console.error('Failed to create vault:', error);
      }
    }
  };

  // Don't show if:
  // - User already has vault
  // - We haven't checked API key status yet
  // - User has dismissed the banner
  if (vaultId || hasNovaApiKey === null || hasNovaApiKey || isDismissed) {
    return null;
  }

  return (
    <>
      <NovaSetupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSetupSuccess}
        accountId={accountId || ''}
      />

      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔐</div>
            <div>
              <h3 className="font-semibold text-sm">Enable NOVA Encrypted Vault</h3>
              <p className="text-purple-100 text-xs">
                Secure your portfolio data with TEE-encrypted storage. Quick 2-minute setup.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold text-sm"
            >
              Setup NOVA
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
