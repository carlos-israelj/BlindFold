'use client';

import { useState } from 'react';

interface GroupSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupSelected: (groupId: string, isNew: boolean) => void;
  accountId: string;
}

type GroupOption = 'join' | 'create';

export default function GroupSelectionModal({
  isOpen,
  onClose,
  onGroupSelected,
  accountId
}: GroupSelectionModalProps) {
  const [selectedOption, setSelectedOption] = useState<GroupOption>('join');
  const [customGroupId, setCustomGroupId] = useState('');
  const [existingGroupId, setExistingGroupId] = useState('ecuador5-portfolio-vault');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const groupId = selectedOption === 'join' ? existingGroupId : customGroupId;

    if (!groupId || groupId.trim() === '') {
      setError('Please enter a group ID');
      return;
    }

    // Validate group ID format
    if (!/^[a-z0-9-]+$/.test(groupId)) {
      setError('Group ID can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the callback with group ID and whether it's a new group
      await onGroupSelected(groupId, selectedOption === 'create');
    } catch (err: any) {
      setError(err.message || 'Failed to configure group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Configure Your NOVA Vault</h2>
              <p className="text-purple-100 text-sm mt-1">Choose how to store your portfolio</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">🔐 What is a NOVA Group?</h3>
            <p className="text-blue-800 text-sm">
              A NOVA group is an encrypted vault where your portfolio data is stored.
              You can join an existing group or create your own private one.
            </p>
          </div>

          {/* Option 1: Join Existing Group */}
          <label className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedOption === 'join'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="groupOption"
                value="join"
                checked={selectedOption === 'join'}
                onChange={() => setSelectedOption('join')}
                className="mt-1 w-4 h-4 text-purple-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  Join Existing Group
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Connect to a vault that's already been created
                </p>

                {selectedOption === 'join' && (
                  <div className="space-y-2 mt-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Group ID
                    </label>
                    <input
                      type="text"
                      value={existingGroupId}
                      onChange={(e) => setExistingGroupId(e.target.value)}
                      placeholder="e.g., ecuador5-portfolio-vault"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="text-xs">
                    <span className="text-green-600 font-semibold">💰 Cost: FREE</span>
                    <p className="text-gray-500">Already created</p>
                  </div>
                  <div className="text-xs">
                    <span className="text-blue-600 font-semibold">✅ Instant access</span>
                    <p className="text-gray-500">No setup needed</p>
                  </div>
                </div>

                <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Shared with group members - data is encrypted but accessible to all members
                </div>
              </div>
            </div>
          </label>

          {/* Option 2: Create New Private Group */}
          <label className={`block border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedOption === 'create'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}>
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="groupOption"
                value="create"
                checked={selectedOption === 'create'}
                onChange={() => setSelectedOption('create')}
                className="mt-1 w-4 h-4 text-purple-600"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  Create New Private Group
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Set up your own encrypted vault with full control
                </p>

                {selectedOption === 'create' && (
                  <div className="space-y-2 mt-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Group ID (must be unique)
                    </label>
                    <input
                      type="text"
                      value={customGroupId}
                      onChange={(e) => setCustomGroupId(e.target.value.toLowerCase())}
                      placeholder="e.g., my-portfolio-vault"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500">
                      Use lowercase letters, numbers, and hyphens only
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="text-xs">
                    <span className="text-purple-600 font-semibold">💰 Cost: ~1.3 NEAR</span>
                    <p className="text-gray-500">One-time setup fee</p>
                  </div>
                  <div className="text-xs">
                    <span className="text-purple-600 font-semibold">🔒 100% private</span>
                    <p className="text-gray-500">Only you have access</p>
                  </div>
                </div>

                <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                  ✨ Full control - You decide who can access your data
                </div>
              </div>
            </div>
          </label>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Account Info */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <span className="text-gray-600">Your account:</span>{' '}
            <span className="font-mono text-gray-900">{accountId}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
