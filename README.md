# BlindFold - Privacy-Verified Crypto Financial Advisor

> The first AI financial advisor where your data is cryptographically proven to remain private. Built for NEARCON 2026 Innovation Sandbox.

🏆 **Target Prizes:** $14,000 total
💰 Private Web ($3,500) + Only on NEAR ($4,500) + NOVA Bounty ($3,000) + HOT Protocol ($3,000)

---

## 🎯 What is BlindFold?

BlindFold is a privacy-first crypto portfolio advisor powered by NEAR AI Cloud's TEE-based inference. Users connect their wallet, their portfolio data gets encrypted into a personal NOVA vault, and an AI advisor answers questions like "How's my portfolio?" or "What's my risk exposure?" — with **every response cryptographically signed** proving no one saw the data.

### Why This Can't Exist on Standard AI

On ChatGPT/Claude/Gemini, your wallet holdings and financial questions are visible to the AI provider. BlindFold uses **NEAR AI Cloud's TEE-based inference** where:

- **TLS terminates inside the Trusted Execution Environment** (not at a load balancer)
- Prompts remain encrypted from your machine all the way into the secure enclave
- **NOVA's encrypted vault** with keys managed in separate TEEs (Shade Agents)
- **No single party** can see your financial data — not the AI provider, not us, not anyone

### Three-Layer Architecture

Unlike typical hackathon projects, BlindFold has **three distinct backend layers**:

1. **Smart Contract (Rust)** — Yield/resume AI advisor + on-chain verification registry
2. **TEE Relayer (TypeScript)** — Bridges contract and NEAR AI Cloud TEE
3. **Portfolio Analytics (TypeScript)** — HHI concentration, correlation, rebalancing

---

## 🚀 Live Demo

- **Frontend:** Deploy to Vercel (see deployment guide)
- **Smart Contract:** `blindfold.testnet` on NEAR testnet
- **Relayer:** Railway.app background worker
- **Verification:** View on-chain proofs at https://testnet.nearblocks.io

---

## ✨ Features

### 🔒 Privacy-Verified AI Inference
- **NEAR AI Cloud TEE:** Intel TDX + NVIDIA H200 GPUs
- **Cryptographic Signatures:** Every response ECDSA-signed
- **On-Chain Verification:** Permanently stored on NEAR blockchain
- **NearBlocks Integration:** Judges can verify freely

### 📊 Portfolio Analytics
- **HHI (Herfindahl-Hirschman Index):** Real concentration risk calculation
- **Risk Scoring:** 0-100 score with color-coded levels
- **Diversification Metrics:** Effective number of assets
- **Smart Recommendations:** AI-powered rebalancing suggestions

### 💾 Encrypted Vault (NOVA)
- **Client-Side Encryption:** AES-256-GCM before upload
- **Shade TEE Key Management:** Keys never touch blockchain
- **IPFS Storage:** Decentralized encrypted data
- **Data Controls:** Inspect, export, delete, revoke access

### 🔄 Multi-Chain Swaps (HOT Protocol)
- **30+ Chains:** NEAR, EVM, Solana, TON, Bitcoin, Stellar, Cosmos
- **NEAR Intents:** Non-custodial, gasless swaps
- **AI-Suggested Actions:** "Your portfolio is 82% NEAR. Rebalance?" → Click to swap

### 🔐 Better Auth with NEP-413
- **Wallet-Based Sessions:** No passwords, only NEAR signatures
- **7-Day Persistent Sessions:** Survives page reloads
- **Rate Limiting:** 100 requests/hour per account
- **PostgreSQL Sessions:** Prisma + Vercel Postgres

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  USER'S BROWSER (Vercel)                 │
│  Next.js 14 + React + Tailwind + TypeScript            │
│  - Portfolio Analytics UI                               │
│  - Risk Score Card (HHI visualization)                  │
│  - On-Chain Verification Display                        │
│  - Multi-Chain Swap Modal                               │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────┐
│              TEE RELAYER (Railway/Render)                │
│  Background Worker 24/7                                 │
│  - Polls smart contract every 5s                        │
│  - Forwards to NEAR AI Cloud TEE                        │
│  - ECDSA signature verification                         │
│  - Stores verifications on-chain                        │
└─────────────────────────────────────────────────────────┘
                            │
                            │ RPC + TEE API
                            ▼
┌─────────────────────────────────────────────────────────┐
│              NEAR BLOCKCHAIN + AI CLOUD                  │
│  Smart Contract: blindfold.testnet                      │
│  - Yield/resume pattern (env::promise_yield_create)    │
│  - On-chain verification registry                       │
│  - Public view functions for judges                     │
│                                                         │
│  NEAR AI Cloud: Intel TDX + NVIDIA H200 TEE            │
│  - Private LLM inference (DeepSeek V3.1)               │
│  - ECDSA signature generation                          │
│  - Model attestation reports                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Tech Stack

### Frontend (Vercel)
- **Next.js 14** (App Router)
- **TypeScript** + **React 18**
- **Tailwind CSS**
- **React Query** (@tanstack/react-query)
- **NEAR Wallet Selector**
- **Vercel Postgres** (Better Auth sessions)

### Backend Services
- **Smart Contract:** Rust (`near-sdk` v5.5)
- **TEE Relayer:** TypeScript (Railway.app worker)
- **Auth:** Better Auth + NEP-413
- **Portfolio Data:** FastNEAR API (free, no key)
- **AI Inference:** NEAR AI Cloud (OpenAI SDK compatible)
- **Encrypted Storage:** NOVA SDK (Shade TEEs)

### Multi-Chain (Phase 3)
- **HOT Protocol:** Multi-chain wallets + swaps
- **MobX:** State management for HOT KIT
- **NEAR Intents:** Cross-chain transactions

---

## 🚀 Quick Start (Local Development)

### Prerequisites
```bash
node >= 20
npm >= 10
rust >= 1.75 (for smart contract)
near-cli
docker (optional, for relayer)
```

### 1. Clone & Install
```bash
git clone <your-repo>
cd Near
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local

# Edit .env.local with your keys:
# - NEAR_AI_API_KEY (from cloud.near.ai)
# - NOVA_API_KEY (from nova-sdk.com)
# - DATABASE_URL (local postgres or Vercel Postgres)
# - AUTH_SECRET (generate: openssl rand -base64 32)
```

### 3. Setup Database
```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

### 5. Deploy Smart Contract (Optional)
```bash
cd contract
./build.sh
near deploy --accountId your-account.testnet --wasmFile target/wasm32-unknown-unknown/release/blindfold_contract.wasm
```

### 6. Run TEE Relayer (Optional)
```bash
cd relayer
cp .env.example .env
# Edit .env with your credentials
npm install
npm start
```

---

## 🌐 Production Deployment

### Frontend (Vercel) - 2 minutes
1. Push to GitHub
2. Import in Vercel (https://vercel.com/new)
3. Add environment variables
4. Deploy

### Relayer (Railway.app) - 1 minute
1. New Project → Deploy from GitHub
2. Root Directory: `relayer`
3. Add environment variables
4. Auto-deploy

### Smart Contract (NEAR Testnet)
```bash
near create-account blindfold.testnet --useFaucet
cd contract && ./build.sh
near deploy --accountId blindfold.testnet --wasmFile target/wasm32-unknown-unknown/release/blindfold_contract.wasm
near call blindfold.testnet new '{"owner":"blindfold.testnet"}' --accountId blindfold.testnet
```

**📖 Full Guide:** See `PRODUCTION_DEPLOY.md` for detailed instructions
**⚡ Quick Guide:** See `DEPLOY_QUICK.md` for 5-minute deployment

---

## 🧪 Testing

### Test Smart Contract
```bash
cd contract
cargo test
```

### Test Portfolio Analytics
```bash
npm run test
```

### E2E Flow Test
1. Connect wallet
2. Load portfolio (auto-fetched from FastNEAR)
3. Ask AI: "What's my risk exposure?"
4. Verify on-chain: Click "Verified in TEE" badge
5. Check NearBlocks: View transaction

---

## 📁 Project Structure

```
blindfold/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/         # Better Auth endpoints
│   │   ├── chat/         # AI advisor proxy
│   │   ├── vault/        # NOVA operations
│   │   ├── wallet/       # Portfolio fetching
│   │   └── swap/         # HOT Protocol swaps
│   ├── chat/             # Chat interface page
│   ├── vault/            # Vault controls page
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── RiskScoreCard.tsx     # Portfolio analytics UI
│   ├── OnChainVerification.tsx  # Verification display
│   ├── SwapModal.tsx         # Multi-chain swap UI
│   ├── WalletConnector.tsx   # NEAR wallet
│   └── ...
├── lib/                   # Core libraries
│   ├── auth.ts           # Better Auth config
│   ├── near-auth.ts      # NEP-413 verification
│   ├── fastnear.ts       # Portfolio API
│   ├── portfolio-analytics.ts  # HHI, risk scoring
│   ├── hot-kit.ts        # Multi-chain integration
│   └── nova.ts           # Encrypted vault
├── contexts/              # React contexts
│   ├── WalletContext.tsx
│   └── VaultContext.tsx
├── contract/              # Rust smart contract
│   ├── src/lib.rs        # Contract code
│   ├── Cargo.toml
│   └── build.sh
├── relayer/               # TEE Relayer service
│   ├── src/index.ts      # Polling loop
│   ├── Dockerfile        # Production container
│   └── package.json
├── prisma/
│   └── schema.prisma     # Database schema
├── PRODUCTION_DEPLOY.md  # Detailed deployment guide
├── DEPLOY_QUICK.md       # Quick deployment (5 min)
└── IMPLEMENTATION_COMPLETE.md  # Implementation summary
```

---

## 🎯 "Only on NEAR" Qualification

This product **requires** NEAR-specific infrastructure and cannot exist on any other chain:

1. ✅ **NEAR AI Cloud** — TEE-based private inference (Intel TDX + NVIDIA H200)
2. ✅ **NOVA on NEAR** — Encrypted vault with Shade Agent key management
3. ✅ **Named Accounts** — `alice.near` instead of `0x7a3b...`
4. ✅ **Yield/Resume Pattern** — `env::promise_yield_create` for on-chain async
5. ✅ **FastNEAR API** — Complete portfolio data (FTs, NFTs, staking)
6. ✅ **Dual TEE Attestation** — NEAR AI + NOVA Shade = end-to-end verification
7. ✅ **HOT Protocol** — NEAR Intents for multi-chain swaps

---

## 🔐 Security & Privacy

### What's Protected
- **Portfolio Data:** Encrypted (AES-256-GCM) in NOVA vault
- **AI Prompts:** TLS terminates inside TEE (never plaintext outside enclave)
- **Encryption Keys:** Managed in Shade TEE (Phala Cloud), never on-chain
- **Chat History:** Encrypted, stored in NOVA, verifiable on IPFS

### Cryptographic Verification
Every AI response includes:
- **SHA-256 Hashes:** Request + response integrity
- **ECDSA Signature:** Signed by TEE's private key
- **On-Chain Storage:** Permanent verification record
- **Public Verification:** Anyone can verify via NearBlocks or Etherscan

### Attack Vectors Mitigated
- ✅ AI provider can't read prompts (TLS-to-TEE)
- ✅ Cloud provider can't access data (Intel TDX isolation)
- ✅ Storage provider can't decrypt (client-side encryption)
- ✅ Developer can't see data (no plaintext access)
- ✅ Response tampering detected (ECDSA signatures)
- ✅ Replay attacks prevented (nonce-based attestation)

---

## 📊 Demo for Judges

### 1. Connect Wallet
- Click "Connect Wallet"
- Select MyNEARWallet or Meteor
- Sign authentication message (NEP-413)

### 2. View Portfolio Analysis
- Auto-fetched from FastNEAR API
- **Risk Score:** 0-100 with HHI calculation
- **Concentration:** Low/Medium/High badge
- **Top Holding:** Largest position %
- **Recommendations:** AI-generated suggestions

### 3. Ask AI Advisor
- Example: "What's my risk exposure?"
- Streams response from NEAR AI Cloud TEE
- Click "Verified in TEE" badge to expand

### 4. Verify On-Chain
- View SHA-256 hashes (request + response)
- See ECDSA signature from TEE
- Click "View on NearBlocks" → See transaction
- Click "Verify Signature on Etherscan" → External verification

### 5. Multi-Chain Swap (Phase 3)
- Click suggested "Rebalance" action
- Swap modal opens with HOT Protocol
- Select chains (NEAR → Ethereum, etc.)
- Execute non-custodial swap via NEAR Intents

---

## 🏆 Prize Criteria Alignment

| Criteria | How We Qualify |
|----------|----------------|
| **Impact/Usefulness** | Daily use case (portfolio check), 4K NEAR Legion users, solves real privacy problem |
| **Technical Execution** | Dual-TEE (NEAR AI + NOVA), yield/resume contract, ECDSA verification, HHI analytics |
| **Completeness** | Full E2E: wallet → portfolio → chat → verification → swaps, production-ready |
| **UX** | One-click wallet, natural language, expandable verification, risk score cards |
| **Only on NEAR** | Uses 7 NEAR-specific features that can't exist elsewhere |

---

## 📚 Documentation

- **Architecture:** `ARCHITECTURE (2).md` (complete specification)
- **Implementation:** `IMPLEMENTATION_COMPLETE.md` (summary of all 3 phases)
- **Production Deploy:** `PRODUCTION_DEPLOY.md` (detailed Vercel + Railway guide)
- **Quick Deploy:** `DEPLOY_QUICK.md` (5-minute setup)
- **Smart Contract:** `contract/README.md`
- **TEE Relayer:** `relayer/README.md`

---

## 🔗 External Resources

- **NEAR AI Cloud:** https://cloud.near.ai
- **NEAR AI Docs:** https://docs.near.ai/cloud
- **NOVA SDK:** https://nova-25.gitbook.io/nova-docs/
- **HOT Protocol:** https://hot.xyz
- **FastNEAR API:** https://api.fastnear.com
- **Better Auth:** https://www.better-auth.com
- **NearBlocks:** https://nearblocks.io

---

## 💰 Costs

### Development (Free)
- NEAR Testnet faucet
- NEAR AI Cloud pay-as-you-go (~$0.001/query)
- Railway $5 initial credit
- Vercel Hobby plan (free)

### Production (~$10/month)
- Railway Pro: $5/month
- Vercel Pro: $20/month (optional)
- NEAR Gas: ~0.01 NEAR per request
- NEAR AI Cloud: Pay-as-you-go

---

## 📞 Support

- **Issues:** Open GitHub issue
- **Questions:** See `PRODUCTION_DEPLOY.md` troubleshooting section
- **Smart Contract:** Check logs with `near view blindfold.testnet get_stats '{}'`
- **Relayer:** View logs in Railway/Render dashboard

---

## 📜 License

MIT License - See LICENSE file

---

## 🎉 Acknowledgments

Built for **NEARCON 2026 Innovation Sandbox** - "The Private Web & Private Life" Track

**Powered by:**
- NEAR AI Cloud (TEE-based private inference)
- NEAR Protocol (blockchain infrastructure)
- NOVA (encrypted vault + Shade TEEs)
- HOT Protocol (multi-chain swaps via NEAR Intents)

---

**Ready for production deployment!** 🚀

See `DEPLOY_QUICK.md` to deploy in 5 minutes.
