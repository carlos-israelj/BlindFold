'use client';

import { useState } from 'react';

export interface PortfolioAsset {
  symbol: string;
  balance: number;
  value: number;
}

interface PortfolioFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assets: PortfolioAsset[]) => Promise<void>;
  groupId: string;
}

export default function PortfolioForm({
  isOpen,
  onClose,
  onSave,
  groupId
}: PortfolioFormProps) {
  const [assets, setAssets] = useState<PortfolioAsset[]>([
    { symbol: '', balance: 0, value: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  if (!isOpen) return null;

  const addAsset = () => {
    setAssets([...assets, { symbol: '', balance: 0, value: 0 }]);
  };

  const removeAsset = (index: number) => {
    if (assets.length === 1) {
      setError('You must have at least one asset');
      return;
    }
    setAssets(assets.filter((_, i) => i !== index));
  };

  const updateAsset = (index: number, field: keyof PortfolioAsset, value: string | number) => {
    const newAssets = [...assets];
    if (field === 'symbol') {
      newAssets[index][field] = value as string;
    } else {
      newAssets[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
    }
    setAssets(newAssets);
  };

  const totalValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);

  const validateAssets = (): boolean => {
    // Check for empty symbols
    const emptySymbols = assets.some(asset => !asset.symbol || asset.symbol.trim() === '');
    if (emptySymbols) {
      setError('All assets must have a name');
      return false;
    }

    // Check for duplicate symbols
    const symbols = assets.map(a => a.symbol.toLowerCase());
    const duplicates = symbols.filter((item, index) => symbols.indexOf(item) !== index);
    if (duplicates.length > 0) {
      setError(`Duplicate asset names found: ${duplicates.join(', ')}`);
      return false;
    }

    // Check for valid values
    const invalidValues = assets.some(asset => asset.value <= 0);
    if (invalidValues) {
      setError('All assets must have a value greater than 0');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateAssets()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSave(assets);
      // Reset form on success
      setAssets([{ symbol: '', balance: 0, value: 0 }]);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateJson = () => {
    return JSON.stringify({ assets }, null, 2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Add Your Portfolio Assets</h2>
              <p className="text-green-100 text-sm mt-1">
                Track your investments • Group: <span className="font-mono">{groupId}</span>
              </p>
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
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-1">💡 How it works</h3>
            <p className="text-blue-800 text-sm">
              Add each asset in your portfolio with its current value. The Shade Agent will calculate
              concentration risk (HHI) and monitor for imbalances.
            </p>
          </div>

          {/* Assets List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Your Assets</h3>
              <button
                type="button"
                onClick={addAsset}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Asset
              </button>
            </div>

            {assets.map((asset, index) => (
              <div key={index} className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Asset Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asset Name
                      </label>
                      <input
                        type="text"
                        value={asset.symbol}
                        onChange={(e) => updateAsset(index, 'symbol', e.target.value)}
                        placeholder="e.g., Bitcoin, AAPL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={asset.balance || ''}
                        onChange={(e) => updateAsset(index, 'balance', e.target.value)}
                        placeholder="0.00"
                        step="any"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    {/* Value (USD) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Value (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={asset.value || ''}
                          onChange={(e) => updateAsset(index, 'value', e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  {assets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAsset(index)}
                      className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Remove asset"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total Value */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Portfolio Value</p>
                <p className="text-2xl font-bold text-green-700">
                  ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Assets</p>
                <p className="text-2xl font-bold text-green-700">{assets.length}</p>
              </div>
            </div>
          </div>

          {/* JSON Preview Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowJsonPreview(!showJsonPreview)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              {showJsonPreview ? '▼' : '▶'} Preview JSON
            </button>

            {showJsonPreview && (
              <pre className="mt-2 bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {generateJson()}
              </pre>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalValue === 0}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving to Vault...
                </span>
              ) : (
                '💾 Save to NOVA Vault'
              )}
            </button>
          </div>

          {/* Info Footer */}
          <div className="text-xs text-gray-500 text-center">
            🔒 Your data will be encrypted end-to-end and stored securely in NOVA
          </div>
        </form>
      </div>
    </div>
  );
}
