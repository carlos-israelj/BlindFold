'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useWallet } from '@/contexts/WalletContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Dynamically import HotWalletConnect to avoid build-time HOT Kit imports
const HotWalletConnect = dynamic(() => import('@/components/HotWalletConnect'), {
  ssr: false,
  loading: () => (
    <div className="w-full px-6 py-3 text-center text-gray-500 bg-gray-100 rounded-lg">
      Loading wallet connector...
    </div>
  ),
});

export default function Home() {
  const { isConnected, error } = useWallet();
  const router = useRouter();

  useEffect(() => {
    console.log('Home page - isConnected:', isConnected);
    if (isConnected) {
      console.log('Redirecting to /chat...');
      router.push('/chat');
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">BlindFold</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The first privacy-verified crypto financial advisor
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Value Proposition */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Your AI advisor is blindfolded
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Every time you ask ChatGPT about your crypto portfolio, OpenAI sees all your holdings.
              <span className="font-semibold"> BlindFold fixes that.</span>
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-2">🔐</div>
                <h3 className="font-semibold text-gray-900 mb-2">Complete Privacy</h3>
                <p className="text-sm text-gray-600">
                  Your portfolio data is encrypted in a NOVA vault. AI processing happens inside a hardware-secured TEE.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">✓</div>
                <h3 className="font-semibold text-gray-900 mb-2">Cryptographic Proof</h3>
                <p className="text-sm text-gray-600">
                  Every response is signed with ECDSA. Hardware attestation proves no one saw your data.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-semibold text-gray-900 mb-2">Production Ready</h3>
                <p className="text-sm text-gray-600">
                  Powered by NEAR AI Cloud with NVIDIA H200 GPUs in TEE mode. Fast, scalable, verifiable.
                </p>
              </div>
            </div>

            {/* Wallet Connection */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Connect your wallet to get started
              </h3>
              <HotWalletConnect />
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Connect Wallet</h3>
                  <p className="text-gray-600 text-sm">
                    We fetch your NEAR balance and token holdings from on-chain data
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Encrypted Storage</h3>
                  <p className="text-gray-600 text-sm">
                    Your portfolio is encrypted with AES-256-GCM and stored in your personal NOVA vault
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Private AI Inference</h3>
                  <p className="text-gray-600 text-sm">
                    Ask questions about your portfolio. AI processes your data inside a Trusted Execution Environment (TEE)
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Cryptographic Verification</h3>
                  <p className="text-gray-600 text-sm">
                    Every response is cryptographically signed, proving it was generated in the TEE without data exposure
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why This Cannot Exist Elsewhere</h2>
            <div className="space-y-3 text-gray-700">
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <span><strong>NEAR AI Cloud:</strong> TEE-based private inference (Intel TDX + NVIDIA H200)</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <span><strong>NOVA:</strong> Encrypted vault with Shade Agents for key management</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <span><strong>Named Accounts:</strong> Human-readable identities (alice.near, not 0x7a3b...)</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">•</span>
                <span><strong>Dual Attestation:</strong> GPU attestation + CPU TEE quotes = verifiable privacy</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-600">
          <p className="text-sm">
            Built for NEARCON 2026 Innovation Sandbox - &ldquo;The Private Web & Private Life&rdquo; Track
          </p>
        </footer>
      </div>
    </div>
  );
}
