'use client';

import { useState } from 'react';

interface NovaSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountId: string;
}

export default function NovaSetupModal({ isOpen, onClose, onSuccess, accountId }: NovaSetupModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'instructions' | 'input'>('instructions');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/user/nova', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novaApiKey: apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save API key');
      }

      // Success!
      onSuccess();
      setApiKey('');
      setCurrentStep('instructions');
    } catch (err: any) {
      setError(err.message || 'Failed to save API key');
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
              <h2 className="text-2xl font-bold">Enable NOVA Vault</h2>
              <p className="text-purple-100 text-sm mt-1">Encrypted storage for your portfolio</p>
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
        <div className="p-6">
          {currentStep === 'instructions' && (
            <div className="space-y-6">
              {/* Why NOVA */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">🔐 Why Enable NOVA Vault?</h3>
                <p className="text-blue-800 text-sm">
                  NOVA provides TEE-secured encrypted storage for your portfolio data. Your data is encrypted
                  client-side with keys managed in Trusted Execution Environments, ensuring complete privacy.
                </p>
              </div>

              {/* Steps */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Setup Steps:</h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Visit NOVA SDK</h4>
                      <p className="text-gray-600 text-sm">
                        Go to{' '}
                        <a
                          href="https://nova-sdk.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                          nova-sdk.com
                        </a>
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Register Your Account</h4>
                      <p className="text-gray-600 text-sm">
                        Login or register with your NEAR account: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{accountId}</code>
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Generate API Key</h4>
                      <p className="text-gray-600 text-sm">
                        Click "Manage Account" → "Generate API Key"
                      </p>
                      <p className="text-amber-700 text-xs mt-1 bg-amber-50 p-2 rounded">
                        ⚠️ Copy the API key immediately - it's only shown once!
                      </p>
                    </div>
                  </li>

                  <li className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-semibold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Fund Your Account</h4>
                      <p className="text-gray-600 text-sm">
                        Add NEAR tokens to your NOVA account for vault operations
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        Typical costs: Register vault ~0.05 NEAR, Upload ~0.01 NEAR
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => window.open('https://nova-sdk.com', '_blank')}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  Open NOVA SDK
                </button>
                <button
                  onClick={() => setCurrentStep('input')}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  I Have My API Key
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              >
                Skip for Now
              </button>
            </div>
          )}

          {currentStep === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-900 mb-2">
                  NOVA API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="nova_sk_xxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent font-mono text-sm"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-gray-500 text-xs mt-2">
                  Your API key is encrypted before storage and never shared.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep('instructions')}
                  className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  disabled={isSubmitting}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50"
                  disabled={isSubmitting || !apiKey}
                >
                  {isSubmitting ? 'Saving...' : 'Save API Key'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
