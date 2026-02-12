'use client';

import { observer } from 'mobx-react-lite';
import { useWallet } from '@/contexts/WalletContext';
import { useVault } from '@/contexts/VaultContext';
import { useEffect, useState } from 'react';
import { getNEARChallenge, signInWithNEAR } from '@/lib/auth-client';
import { signNEP413Message } from '@/lib/nep413';

// Use any type to avoid importing HOT Kit types during build
let getKit: any = null;

const HotWalletConnect = observer(() => {
  const { connect, setPortfolio, setLoading, setError, disconnect: contextDisconnect } = useWallet();
  const { initializeVault, setPortfolioCID } = useVault();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [kit, setKit] = useState<any>(null);
  const [hasHandledConnection, setHasHandledConnection] = useState(false);

  // Authenticate with Better Auth using NEP-413
  const authenticateWithNEAR = async (accountId: string, wallet: any) => {
    setIsAuthenticating(true);
    try {
      // Step 1: Get challenge from server
      const challenge = await getNEARChallenge(accountId);

      // Step 2: Sign message with wallet (NEP-413)
      const { signature, publicKey } = await signNEP413Message(wallet, challenge);

      // Step 3: Verify signature and create session
      const authResult = await signInWithNEAR(
        accountId,
        signature,
        publicKey,
        challenge
      );

      console.log('Authentication successful:', authResult);
      return authResult;
    } catch (error: any) {
      console.error('Authentication failed:', error);
      throw new Error('Failed to authenticate with wallet: ' + error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Dynamically import HOT Kit and initialize
  useEffect(() => {
    const initKit = async () => {
      try {
        const { HotConnector } = await import('@hot-labs/kit');
        const { defaultConnectors } = await import('@hot-labs/kit/defaults');

        const kitInstance = new HotConnector({
          apiKey: process.env.NEXT_PUBLIC_HOT_API_KEY!,
          connectors: defaultConnectors,
          walletConnect: {
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "default-project-id",
            metadata: {
              name: "BlindFold",
              description: "Privacy-First AI Financial Advisor",
              url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
              icons: [`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`],
            },
          },
        });

        setKit(kitInstance);
      } catch (err) {
        console.error('Failed to initialize HOT Kit:', err);
        setError('Failed to initialize wallet connector');
      }
    };

    initKit();
  }, []);

  // Monitor HOT Kit connection state
  useEffect(() => {
    console.log('HOT Kit state:', {
      isConnected: kit?.isConnected,
      hasNear: !!kit?.near,
      accountId: kit?.near?.accountId,
      hasHandledConnection
    });

    if (kit?.isConnected && kit.near?.accountId && !hasHandledConnection) {
      console.log('Triggering handleWalletConnected for:', kit.near.accountId);
      handleWalletConnected();
    }
  }, [kit?.isConnected, kit?.near?.accountId, hasHandledConnection]);

  const handleWalletConnected = async () => {
    if (!kit.near) return;

    const accountId = kit.near.accountId;
    if (!accountId) return;

    setHasHandledConnection(true);
    setLoading(true);
    setIsConnecting(true);

    try {
      // Step 1: Authenticate with Better Auth using NEP-413
      await authenticateWithNEAR(accountId, kit.near);

      // Step 2: Update wallet context
      connect(accountId);

      // Fetch portfolio from NEAR RPC
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
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
            accountId,
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
                accountId,
                action: 'upload',
                vaultId: vaultId,
                data: {
                  version: 1,
                  accountId,
                  lastUpdated: new Date().toISOString(),
                  holdings: data.data.portfolio.holdings || []
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
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
      setIsConnecting(false);
    }
  };

  const handleConnect = async () => {
    if (!kit) return;
    setIsConnecting(true);
    console.log('Starting wallet connection...');
    try {
      await kit.connect();
      console.log('kit.connect() resolved. Connected:', kit.isConnected);
      // If connect resolves but no wallet is connected, reset state
      if (!kit.isConnected) {
        console.log('No wallet connected after kit.connect(), resetting state');
        setIsConnecting(false);
      }
    } catch (err: any) {
      console.error('HOT Kit connect error:', err);
      // Only show error if it's not a user cancellation
      if (err.message && !err.message.toLowerCase().includes('cancel')) {
        setError(err.message || 'Failed to open wallet selector');
      }
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!kit) return;
    try {
      if (kit.near) {
        await kit.disconnect(kit.near);
      }
      setHasHandledConnection(false);
      contextDisconnect();
    } catch (err: any) {
      console.error('Disconnect error:', err);
    }
  };

  if (!kit) {
    return (
      <div className="w-full px-6 py-3 text-center text-gray-500 bg-gray-100 rounded-lg">
        Loading wallet connector...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!kit.isConnected ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting || isAuthenticating}
          className="w-full px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all font-semibold"
        >
          {isAuthenticating ? 'Authenticating...' : isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Connected</div>
                <div className="font-mono text-sm font-semibold text-gray-900 break-all">
                  {kit.near?.accountId || 'Unknown'}
                </div>
              </div>
              <div className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                NEAR
              </div>
            </div>
          </div>

          {/* Show other connected wallets if any */}
          {kit.evm && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">EVM Wallet</div>
                  <div className="font-mono text-sm font-semibold text-gray-900">
                    {kit.evm.address?.slice(0, 6)}...{kit.evm.address?.slice(-4)}
                  </div>
                </div>
                <div className="px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full">
                  EVM
                </div>
              </div>
            </div>
          )}

          {kit.solana && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Solana Wallet</div>
                  <div className="font-mono text-sm font-semibold text-gray-900">
                    {kit.solana.address?.slice(0, 6)}...{kit.solana.address?.slice(-4)}
                  </div>
                </div>
                <div className="px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full">
                  Solana
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleDisconnect}
            className="w-full px-6 py-3 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Disconnect
          </button>
        </div>
      )}

      {/* Multi-chain support notice */}
      <div className="text-xs text-gray-500 text-center">
        Supports NEAR, Ethereum, Solana, TON, Stellar, and 30+ chains
      </div>
    </div>
  );
});

export default HotWalletConnect;
