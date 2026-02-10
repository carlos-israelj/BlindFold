# HOT Kit Configuration

BlindFold now supports **multi-chain portfolio tracking and cross-chain swaps** via HOT Protocol!

## 🌐 Supported Chains

- **NEAR** - Native chain
- **Ethereum** (+ all EVM chains: BSC, Polygon, Arbitrum, Optimism, Base)
- **Solana**
- **TON** (Telegram blockchain)
- **Stellar**
- **Cosmos** ecosystem
- **Bitcoin** (via HOT Protocol)

## 🔑 API Keys Configured

### HOT Protocol API Key
```
NEXT_PUBLIC_HOT_API_KEY=a0080f5a30894a629767e49bfd7f0f51
```
- **Source**: https://pay.hot-labs.org/admin/api-keys
- **Used for**: Wallet connections, balance queries, swap quotes

### HOT Pay Partner JWT
```
HOT_PARTNER_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **Used for**: Partner API access, payment verification

### Webhook Secret
```
HOT_WEBHOOK_SECRET=a328-fb7-8d94-4172
```
- **Used for**: Validating HOT Protocol webhook callbacks

## 📦 Packages Installed

```json
{
  "@hot-labs/kit": "latest",           // Multi-chain wallet connector
  "@hot-labs/omni-sdk": "latest",      // Advanced bridge operations
  "mobx": "^6.12.0",                   // State management (HOT Kit uses MobX)
  "mobx-react-lite": "^4.0.5"         // React bindings for MobX
}
```

## 🚀 Usage Examples

### Connect Multi-Chain Wallets

```typescript
import { observer } from "mobx-react-lite";
import { kit } from "@/lib/hot-kit";

const WalletButton = observer(() => {
  return (
    <button onClick={() => kit.connect()}>
      {kit.isConnected
        ? `Connected: ${kit.wallets.length} wallets`
        : "Connect Wallets"}
    </button>
  );
});
```

### Get Portfolio Across All Chains

```typescript
import { getMultiChainPortfolio } from "@/lib/hot-kit";

const balances = await getMultiChainPortfolio();
// {
//   "NEAR": { address: "user.near", balance: "100", tokens: [...] },
//   "ETH": { address: "0x123...", balance: "0.5", tokens: [...] },
//   "SOL": { address: "ABC...", balance: "10", tokens: [...] }
// }
```

### Execute Cross-Chain Swap

```typescript
import { executeSwap, getSwapQuote } from "@/lib/hot-kit";

// Get quote first
const quote = await getSwapQuote({
  fromChain: "NEAR",
  fromToken: "NEAR",
  toChain: "ETH",
  toToken: "ETH",
  amount: "10"
});

// Execute swap
const result = await executeSwap({
  fromChain: "NEAR",
  fromToken: "NEAR",
  toChain: "ETH",
  toToken: "ETH",
  amount: "10"
});
```

### Open Built-in Swap UI

```typescript
import { openSwapUI } from "@/lib/hot-kit";

// Opens HOT Kit's pre-built swap/bridge interface
openSwapUI();
```

## 🔐 Security Features

1. **Non-Custodial**: Users always control their private keys
2. **NEAR Intents**: Declare intent, protocol handles execution
3. **TEE Verification**: All swaps verified in Trusted Execution Environment
4. **MPC Signatures**: Multi-party computation for cross-chain security

## 🎯 Integration with BlindFold AI Advisor

When the AI advisor suggests rebalancing (e.g., "Reduce NEAR exposure, increase ETH"):

1. User sees **one-click execute** button
2. Click triggers `executeSwap()` with AI-recommended parameters
3. HOT Protocol handles cross-chain complexity
4. Transaction verified and stored on-chain

## 📚 References

- **HOT Protocol**: https://hot.xyz
- **HOT Pay Dashboard**: https://pay.hot-labs.org
- **API Documentation**: https://docs.hot.xyz
- **NEAR Intents**: https://docs.near.org/concepts/abstraction/chain-signatures

## 🧪 Testing

1. **Local Development**:
   ```bash
   npm run dev
   # Visit http://localhost:3000
   # Click "Connect Wallets" → should show HOT Kit modal
   ```

2. **Verify API Key**:
   ```bash
   curl https://api.hot.xyz/v1/health \
     -H "Authorization: Bearer a0080f5a30894a629767e49bfd7f0f51"
   ```

3. **Test on Vercel** (after deployment):
   - Environment variables auto-loaded from `.env.local`
   - Multi-chain wallets should connect seamlessly

## ⚠️ Important Notes

- **WalletConnect Project ID**: Optional but recommended for better UX
  - Get one free at: https://cloud.walletconnect.com
  - Add to `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

- **Mobx**: HOT Kit uses MobX for reactive state
  - Wrap components with `observer()` to react to connection changes
  - Example: `export default observer(MyComponent)`

- **Rate Limits**: Free tier supports up to 10,000 requests/month
  - Upgrade at: https://pay.hot-labs.org/admin/billing

## 🚀 Next Steps for Production

1. ✅ Configure HOT Kit (DONE)
2. ⏳ Deploy to Vercel with environment variables
3. ⏳ Test multi-chain wallet connections
4. ⏳ Integrate AI advisor swap recommendations
5. ⏳ Add multi-chain portfolio to dashboard
