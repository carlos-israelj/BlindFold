/**
 * HOT KIT Integration - Client-side only
 * Multi-chain wallet connection and swap functionality
 *
 * HOT KIT supports: NEAR, EVM, Solana, TON, Stellar, Cosmos, Bitcoin, and 30+ chains
 *
 * IMPORTANT: This uses dynamic imports to avoid Next.js build issues with ESM modules.
 * The kit instance is only created in the browser.
 */

let kitInstance: any = null;

/**
 * Get or create the HOT Kit singleton instance
 * This uses dynamic import to ensure it only runs in the browser
 */
export async function getKit(): Promise<any> {
  // Return existing instance if available
  if (kitInstance) return kitInstance;

  // Dynamic import to avoid SSR/build issues
  const { HotConnector } = await import("@hot-labs/kit");
  const { defaultConnectors } = await import("@hot-labs/kit/defaults");

  // Create singleton instance
  kitInstance = new HotConnector({
    apiKey: process.env.NEXT_PUBLIC_HOT_API_KEY!,
    connectors: defaultConnectors, // NEAR + EVM + Solana + TON + Stellar
    walletConnect: {
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "default-project-id",
      metadata: {
        name: "BlindFold",
        description: "Privacy-First AI Financial Advisor - Your portfolio, encrypted in a vault. AI analyzes it in a secure enclave. Zero knowledge, maximum insight.",
        url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        icons: [`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/logo.png`],
      },
    },
  });

  return kitInstance;
}

/**
 * React hook for HOT Kit state (uses MobX under the hood)
 * Usage in components:
 *
 * import { observer } from "mobx-react-lite";
 * import { kit } from "@/lib/hot-kit";
 *
 * const MyComponent = observer(() => {
 *   const isConnected = kit.isConnected;
 *   const wallets = kit.wallets;
 *
 *   return (
 *     <button onClick={() => kit.connect()}>
 *       {isConnected ? `Connected: ${wallets.length} wallets` : "Connect Wallets"}
 *     </button>
 *   );
 * });
 */

/**
 * Helper: Get multi-chain portfolio balances
 * TODO: Implement after verifying HOT Kit API structure
 */
export async function getMultiChainPortfolio() {
  // Temporarily disabled - HOT Kit API needs verification
  console.warn("getMultiChainPortfolio: Not yet implemented");
  return {};
}

/**
 * Helper: Open HOT Kit built-in swap/bridge UI
 * This is the simplest way to enable cross-chain swaps
 */
export async function openSwapUI() {
  const kit = await getKit();
  kit.openBridge();
}

/**
 * Helper: Execute programmatic swap using NEAR Intents
 * For AI advisor-triggered rebalancing
 */
export async function executeSwap(params: {
  fromChain: string;
  fromToken: string;
  toChain: string;
  toToken: string;
  amount: string;
  walletAddress?: string;
}) {
  try {
    const kit = await getKit();

    // Ensure wallet is connected
    const senderWallet = kit.priorityWallet;
    if (!senderWallet) {
      throw new Error('No wallet connected. Please connect your wallet first.');
    }

    // Create Token objects
    const fromToken = kit.omni(`${params.fromChain}:${params.fromToken}`);
    const toToken = kit.omni(`${params.toChain}:${params.toToken}`);

    // Convert amount to bigint
    const amountBigInt = BigInt(Math.floor(parseFloat(params.amount) * 1e6));

    // Get review first
    const review = await kit.exchange.reviewSwap({
      from: fromToken,
      to: toToken,
      amount: amountBigInt,
      type: 'exactIn',
      slippage: 0.01, // 1% slippage
      sender: senderWallet,
    });

    // Execute the swap
    const pending = await kit.exchange.makeSwap(review);

    // Wait for transaction result
    const result = await pending.resolve();

    return {
      success: true,
      data: {
        txHash: result.hash || 'unknown',
        fromAmount: params.amount,
        toAmount: (Number(review.amountOut) / 1e6).toString(),
        explorerUrl: result.explorerUrl || '#',
      }
    };
  } catch (error: any) {
    console.error('executeSwap error:', error);
    return {
      success: false,
      error: error.message || 'Failed to execute swap'
    };
  }
}

/**
 * Helper: Get swap quote before execution
 * Uses HOT Kit Exchange API with reviewSwap
 */
export async function getSwapQuote(params: {
  fromChain: string;
  fromToken: string;
  toChain: string;
  toToken: string;
  amount: string;
}) {
  try {
    const kit = await getKit();

    // Create Token objects from chain/token params
    const fromToken = kit.omni(`${params.fromChain}:${params.fromToken}`);
    const toToken = kit.omni(`${params.toChain}:${params.toToken}`);

    // Convert amount to bigint (assuming token has standard decimals)
    const amountBigInt = BigInt(Math.floor(parseFloat(params.amount) * 1e6)); // 6 decimals default

    // Get quote using Exchange.reviewSwap
    const review = await kit.exchange.reviewSwap({
      from: fromToken,
      to: toToken,
      amount: amountBigInt,
      type: 'exactIn',
      slippage: 0.01, // 1% slippage
    });

    // Format response
    const toAmount = Number(review.amountOut) / 1e6; // Convert back from bigint
    const rate = toAmount / parseFloat(params.amount);

    return {
      success: true,
      data: {
        toAmount: toAmount.toString(),
        minToAmount: (Number(review.minAmountOut) / 1e6).toString(),
        rate: rate.toString(),
        slippage: review.slippage,
        fee: review.fee,
        estimatedTime: '~30 seconds',
      }
    };
  } catch (error: any) {
    console.error('getSwapQuote error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get swap quote'
    };
  }
}

/**
 * Helper: Disconnect all wallets
 */
export async function disconnectAll() {
  const kit = await getKit();
  // Disconnect all connected wallets
  // HOT Kit's disconnect() requires a wallet parameter
  const wallets = [kit.near, kit.evm, kit.solana, kit.ton, kit.stellar].filter(Boolean);
  for (const wallet of wallets) {
    if (wallet) {
      await kit.disconnect(wallet);
    }
  }
}

/**
 * Reference documentation:
 * - HOT Protocol: https://hot.xyz
 * - HOT Pay: https://pay.hot-labs.org
 * - NEAR Intents: https://docs.near.org/concepts/abstraction/chain-signatures
 * - Supported chains: NEAR, Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Solana, TON, Stellar, Cosmos
 */
