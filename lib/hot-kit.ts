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
export function openSwapUI() {
  kit.openBridge();
}

/**
 * Helper: Execute programmatic swap using NEAR Intents
 * For AI advisor-triggered rebalancing
 * TODO: Implement after verifying HOT Kit API structure
 */
export async function executeSwap(params: {
  fromChain: string;
  fromToken: string;
  toChain: string;
  toToken: string;
  amount: string;
}) {
  // Temporarily disabled - HOT Kit API needs verification
  console.warn("executeSwap: Not yet implemented");
  return { success: false, message: "Not yet implemented" };
}

/**
 * Helper: Get swap quote before execution
 * TODO: Implement after verifying HOT Kit API structure
 */
export async function getSwapQuote(params: {
  fromChain: string;
  fromToken: string;
  toChain: string;
  toToken: string;
  amount: string;
}) {
  // Temporarily disabled - HOT Kit API needs verification
  console.warn("getSwapQuote: Not yet implemented");
  return { quote: "0", message: "Not yet implemented" };
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
