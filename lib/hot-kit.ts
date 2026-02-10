/**
 * HOT KIT Integration
 * Multi-chain wallet connection and swap functionality
 *
 * HOT KIT supports: NEAR, EVM, Solana, TON, Stellar, Cosmos, Bitcoin, and 30+ chains
 */

import { HotConnector } from "@hot-labs/kit";
import { defaultConnectors } from "@hot-labs/kit/defaults";

// Initialize HOT Kit connector as singleton
export const kit = new HotConnector({
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
 */
export async function getMultiChainPortfolio() {
  if (!kit.isConnected) {
    throw new Error("No wallets connected");
  }

  const wallets = kit.wallets;
  const balances: Record<string, any> = {};

  for (const wallet of wallets) {
    try {
      const balance = await wallet.getBalance();
      balances[wallet.chain] = {
        address: wallet.address,
        balance: balance.toString(),
        tokens: await wallet.getTokens?.() || [],
      };
    } catch (error) {
      console.error(`Failed to fetch balance for ${wallet.chain}:`, error);
      balances[wallet.chain] = {
        address: wallet.address,
        balance: "0",
        tokens: [],
        error: String(error),
      };
    }
  }

  return balances;
}

/**
 * Helper: Open HOT Kit built-in swap/bridge UI
 * This is the simplest way to enable cross-chain swaps
 */
export function openSwapUI() {
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
}) {
  const { fromChain, fromToken, toChain, toToken, amount } = params;

  // Get the source wallet
  const sourceWallet = kit.wallets.find(w => w.chain === fromChain);
  if (!sourceWallet) {
    throw new Error(`No wallet connected for ${fromChain}`);
  }

  // Use IntentsBuilder for cross-chain swap
  // This is the programmatic API from the architecture
  const result = await sourceWallet.intents
    .swap({
      from: fromToken,
      to: toToken,
      amount,
      toChain,
    })
    .execute();

  return result;
}

/**
 * Helper: Get swap quote before execution
 */
export async function getSwapQuote(params: {
  fromChain: string;
  fromToken: string;
  toChain: string;
  toToken: string;
  amount: string;
}) {
  const { fromChain, fromToken, toChain, toToken, amount } = params;

  const sourceWallet = kit.wallets.find(w => w.chain === fromChain);
  if (!sourceWallet) {
    throw new Error(`No wallet connected for ${fromChain}`);
  }

  // Get quote without executing
  const quote = await sourceWallet.intents
    .swap({
      from: fromToken,
      to: toToken,
      amount,
      toChain,
    })
    .getQuote();

  return quote;
}

/**
 * Helper: Disconnect all wallets
 */
export async function disconnectAll() {
  await kit.disconnect();
}

/**
 * Reference documentation:
 * - HOT Protocol: https://hot.xyz
 * - HOT Pay: https://pay.hot-labs.org
 * - NEAR Intents: https://docs.near.org/concepts/abstraction/chain-signatures
 * - Supported chains: NEAR, Ethereum, BSC, Polygon, Arbitrum, Optimism, Base, Solana, TON, Stellar, Cosmos
 */
