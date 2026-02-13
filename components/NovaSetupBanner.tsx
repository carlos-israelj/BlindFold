'use client';

import { useState, useEffect } from 'react';
import NovaSetupModal from './NovaSetupModal';
import GroupSelectionModal from './GroupSelectionModal';
import PortfolioForm, { PortfolioAsset } from './PortfolioForm';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/contexts/VaultContext';

export default function NovaSetupBanner() {
  const { accountId } = useWallet();
  const { vaultId, initializeVault } = useVault();
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [hasNovaApiKey, setHasNovaApiKey] = useState<boolean | null>(null);
  const [hasGroup, setHasGroup] = useState<boolean | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has NOVA API key and group
    const checkNovaStatus = async () => {
      try {
        const response = await fetch('/api/user/nova');
        const data = await response.json();
        setHasNovaApiKey(data.data?.hasNovaApiKey || false);

        // Check if user has a group configured
        if (accountId) {
          const groupResponse = await fetch(`/api/vault/group?accountId=${accountId}`);
          const groupData = await groupResponse.json();
          setHasGroup(groupData.hasGroup);
          setGroupId(groupData.groupId);
        }
      } catch (error) {
        console.error('Failed to check NOVA status:', error);
        setHasNovaApiKey(false);
        setHasGroup(false);
      }
    };

    if (accountId && !vaultId) {
      checkNovaStatus();
    }
  }, [accountId, vaultId]);

  const handleNovaSetupSuccess = async () => {
    setShowNovaModal(false);
    setHasNovaApiKey(true);
    // Open group selection modal next
    setShowGroupModal(true);
  };

  const handleGroupSelected = async (selectedGroupId: string, isNew: boolean) => {
    try {
      const response = await fetch('/api/vault/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          groupId: selectedGroupId,
          isNew,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGroupId(selectedGroupId);
        setHasGroup(true);
        setShowGroupModal(false);
        // Open portfolio form next
        setShowPortfolioForm(true);
      } else {
        alert(data.error || 'Failed to configure group');
      }
    } catch (error) {
      console.error('Error configuring group:', error);
      alert('Failed to configure group');
    }
  };

  const handleSavePortfolio = async (assets: PortfolioAsset[]) => {
    try {
      const response = await fetch('/api/vault/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          groupId,
          assets,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Initialize vault context with the group ID
        if (groupId) {
          initializeVault(groupId);
        }
        setShowPortfolioForm(false);
        alert(`Portfolio saved successfully! CID: ${data.cid}`);
      } else {
        throw new Error(data.error || 'Failed to save portfolio');
      }
    } catch (error: any) {
      console.error('Error saving portfolio:', error);
      throw error;
    }
  };

  // Determine which banner to show based on setup progress
  const showBanner = !vaultId && !isDismissed && hasNovaApiKey !== null;
  const needsNovaSetup = !hasNovaApiKey;
  const needsGroupSetup = hasNovaApiKey && !hasGroup;

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* NOVA Setup Modal - Step 1 */}
      <NovaSetupModal
        isOpen={showNovaModal}
        onClose={() => setShowNovaModal(false)}
        onSuccess={handleNovaSetupSuccess}
        accountId={accountId || ''}
      />

      {/* Group Selection Modal - Step 2 */}
      <GroupSelectionModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupSelected={handleGroupSelected}
        accountId={accountId || ''}
      />

      {/* Portfolio Form - Step 3 */}
      <PortfolioForm
        isOpen={showPortfolioForm}
        onClose={() => setShowPortfolioForm(false)}
        onSave={handleSavePortfolio}
        groupId={groupId || ''}
      />

      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔐</div>
            <div>
              {needsNovaSetup && (
                <>
                  <h3 className="font-semibold text-sm">Enable NOVA Encrypted Vault</h3>
                  <p className="text-purple-100 text-xs">
                    Secure your portfolio data with TEE-encrypted storage. Quick 2-minute setup.
                  </p>
                </>
              )}
              {needsGroupSetup && (
                <>
                  <h3 className="font-semibold text-sm">Configure Your Vault Group</h3>
                  <p className="text-purple-100 text-xs">
                    Choose to join an existing group or create your own private vault.
                  </p>
                </>
              )}
              {hasNovaApiKey && hasGroup && !vaultId && (
                <>
                  <h3 className="font-semibold text-sm">Add Your Portfolio</h3>
                  <p className="text-purple-100 text-xs">
                    Upload your asset allocation to enable Shade Agent monitoring.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (needsNovaSetup) {
                  setShowNovaModal(true);
                } else if (needsGroupSetup) {
                  setShowGroupModal(true);
                } else {
                  setShowPortfolioForm(true);
                }
              }}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-semibold text-sm"
            >
              {needsNovaSetup && 'Setup NOVA'}
              {needsGroupSetup && 'Configure Group'}
              {hasNovaApiKey && hasGroup && !vaultId && 'Add Portfolio'}
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
