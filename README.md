# BlindFold

> **The only AI financial advisor where your privacy is mathematically guaranteed.**
> Every response cryptographically signed. Every vault key managed in a separate TEE. Zero trust required.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Live Services](#live-services)
- [Quick Start](#quick-start)
- [Smart Contract](#smart-contract)
- [Tech Stack](#tech-stack)
- [Security Model](#security-model)
- [Only on NEAR](#only-on-near)
- [Prize Track Alignment](#prize-track-alignment)
- [Project Structure](#project-structure)
- [FAQ](#faq)
- [License](#license)

---

## Overview

BlindFold is a privacy-first crypto portfolio advisor that proves — not just claims — that your financial data is never seen by anyone. Users connect their NEAR wallet, portfolio data is encrypted into a personal NOVA vault, and an AI advisor answers questions like *"What's my risk exposure?"* or *"Should I rebalance?"* with every response **cryptographically signed by the TEE itself**.

The problem with ChatGPT, Claude, and every other AI advisor: your wallet holdings and financial questions are visible to the AI provider, the cloud operator, and anyone who breaches their infrastructure. BlindFold uses **NEAR AI Cloud's TEE-based inference** to eliminate this trust assumption entirely.

**Built for:** NEAR Hackathon 2025 — Privacy + NOVA + Only on NEAR tracks.

---

## Core Features

### Privacy-Verified AI Inference
- AI inference runs inside Intel TDX + NVIDIA H200 TEEs on NEAR AI Cloud
- TLS terminates inside the enclave — prompts are never plaintext outside the secure boundary
- Every response is ECDSA-signed by the TEE's private key
- SHA-256 hashes of the request and response are stored permanently on-chain
- Anyone can verify the signature via Etherscan or NearBlocks — no trust required

### Encrypted Portfolio Vault (NOVA)
- Portfolio data encrypted client-side with AES-256-GCM before upload
- Encryption keys managed in **Shade TEE agents** on Phala Cloud — never on-chain, never with us
- Vault stored on IPFS through NOVA's decentralized storage layer
- Full data controls: inspect, export, delete, revoke group access

### Shade Agent Portfolio Alerts
- A Shade Agent running on Phala Cloud monitors portfolio risk indicators
- Sends proactive risk alerts: concentration spikes, staking rewards, rebalancing signals
- Agent logic runs in a separate TEE, so even the alert trigger data stays private

### On-Chain Verification Registry
- Smart contract on NEAR mainnet (`ecuador5.near`) stores every verification record
- Uses the **Yield/Resume pattern** (`env::promise_yield_create`) for async TEE processing
- Public view functions let judges and users audit every interaction on NearBlocks

### Portfolio Analytics
- Herfindahl-Hirschman Index (HHI) for concentration risk
- Risk score 0–100 with color-coded levels (Low / Medium / High)
- Effective number of assets, top holding %, diversification metrics
- AI-powered rebalancing recommendations

---

## How It Works

### Standard Mode (Direct TEE Chat)

```
User question
     │
     ▼
Next.js API route (/api/chat)
     │  builds request + hashes it
     ▼
NEAR AI Cloud TEE  ←── TLS terminates here (inside enclave)
     │  generates response + ECDSA signature
     ▼
API route verifies signature locally
     │  stores verification in NOVA vault
     ▼
Frontend shows response + "TEE VERIFIED" badge
```

### On-Chain Mode (Yield/Resume)

```
User question
     │
     ▼
ask_advisor() → NEAR contract stores request, YIELDS
     │  returns requestId immediately
     ▼
Frontend polls GET /api/advisor?requestId=N every 3s
     │
     │  Meanwhile, in background:
     ▼
TEE Relayer polls get_pending_requests() every 5s
     │  forwards to NEAR AI Cloud TEE
     │  verifies ECDSA signature
     ▼
store_verification() → contract RESUMES, marks Completed
     │  response_text + signature stored on-chain permanently
     ▼
Frontend poll detects Completed → displays response + TEE VERIFIED badge
```

The on-chain mode provides maximum auditability: the entire verification record lives on the NEAR blockchain at `ecuador5.near` and can be inspected by anyone.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                               │
│  Next.js 14 + TypeScript                                       │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Portfolio UI   │  │  Chat Interface  │  │  Vault Panel │  │
│  │  HHI Analytics  │  │  On-Chain Mode   │  │  NOVA Vault  │  │
│  │  Risk Score     │  │  TEE VERIFIED    │  │  AES-256-GCM │  │
│  └─────────────────┘  └──────────────────┘  └──────────────┘  │
└──────────────────────────────┬─────────────────────────────────┘
                               │ HTTPS
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                 NEXT.JS API ROUTES (Vercel)                     │
│  /api/chat     → direct TEE proxy + signature verify           │
│  /api/advisor  → on-chain submit + poll results                │
│  /api/vault    → NOVA encrypt/upload/retrieve                  │
│  /api/wallet   → FastNEAR portfolio fetch                      │
│  /api/agents   → Shade Agent alerts                            │
└──────────┬────────────────────────┬────────────────────────────┘
           │                        │
           │ NEAR AI Cloud API      │ NEAR RPC (mainnet)
           ▼                        ▼
┌──────────────────┐    ┌───────────────────────────┐
│  NEAR AI Cloud   │    │  NEAR Mainnet              │
│  Intel TDX TEE   │    │  Contract: ecuador5.near   │
│  NVIDIA H200     │    │  - ask_advisor()           │
│  DeepSeek V3.1   │    │  - store_verification()    │
│  ECDSA signing   │    │  - get_pending_requests()  │
└──────────────────┘    └───────────┬───────────────┘
                                    │ polls every 5s
                                    ▼
┌────────────────────────────────────────────────────────────────┐
│              TEE RELAYER  (Render — 24/7 worker)               │
│  - Polls NEAR contract for pending requests                    │
│  - Forwards to NEAR AI Cloud TEE                               │
│  - Verifies ECDSA signature (ethers.verifyMessage)             │
│  - Calls store_verification() to write proof on-chain          │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│              NOVA MCP SERVER  (Render — always-on)             │
│  - MCP protocol interface for vault operations                 │
│  - AES-256-GCM encryption before IPFS upload                  │
│  - Group key management via Shade TEE                          │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│              SHADE AGENT  (Phala Cloud TEE)                    │
│  - Portfolio risk monitoring agent                             │
│  - Proactive alerts for concentration / rebalancing            │
│  - Encryption key custodian for NOVA vaults                    │
│  - Runs in separate TEE — isolated from relayer and app        │
└────────────────────────────────────────────────────────────────┘
```

---

## Live Services

| Service | Location | Status |
|---------|----------|--------|
| Smart Contract | `ecuador5.near` (NEAR mainnet) | Live |
| TEE Relayer | Render (24/7 background worker) | Live |
| NOVA MCP Server | Render | Live |
| Shade Agent | Phala Cloud TEE | Live |
| Frontend | Vercel | Live |

**Verify on-chain:** [nearblocks.io/address/ecuador5.near](https://nearblocks.io/address/ecuador5.near)

---

## Quick Start

### Prerequisites

```bash
node >= 20
npm >= 10
rust >= 1.75   # only for smart contract development
near-cli
```

### 1. Clone & Install

```bash
git clone https://github.com/carlos-israelj/BlindFold.git
cd BlindFold
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Required variables:

```env
# NEAR AI Cloud (cloud.near.ai)
NEAR_AI_API_KEY=your_key_here

# NOVA vault storage
NOVA_API_KEY=your_nova_key

# Database (Vercel Postgres or local)
DATABASE_URL=postgresql://...

# Auth secret
AUTH_SECRET=run: openssl rand -base64 32

# NEAR contract
NEXT_PUBLIC_CONTRACT_ID=ecuador5.near
NEAR_NETWORK=mainnet
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

### 5. Run TEE Relayer (Optional — for on-chain mode)

```bash
cd relayer
cp .env.example .env
# Set RELAYER_ACCOUNT_ID, RELAYER_PRIVATE_KEY, NEAR_AI_API_KEY, CONTRACT_ID
npm install
npm start
```

---

## Smart Contract

**Deployed at:** `ecuador5.near` (NEAR mainnet)

### Key Methods

| Method | Type | Description |
|--------|------|-------------|
| `ask_advisor(question, portfolio_data)` | Call | Submit question, deposit 0.01 NEAR, returns `request_id` |
| `store_verification(request_id, ...)` | Call | Relayer stores signed response on-chain |
| `mark_processing(request_id)` | Call | Relayer marks request as in-progress |
| `get_pending_requests()` | View | Returns all unprocessed requests |
| `get_request(id)` | View | Fetch specific request + status |
| `get_user_verifications(account_id)` | View | All verifications for an account |
| `get_stats()` | View | Contract-wide stats |

### Yield/Resume Pattern

The contract uses `env::promise_yield_create` — a NEAR-specific primitive that:
1. Suspends contract execution and emits a "yield" event
2. Allows an external actor (TEE relayer) to resume with a result
3. Stores the final verification record atomically

This pattern makes the AI response path fully auditable on-chain without blocking the user.

### Build & Deploy

```bash
cd contract
./build.sh
near deploy \
  --accountId your-account.near \
  --wasmFile target/wasm32-unknown-unknown/release/blindfold_contract.wasm
near call your-account.near new '{"owner":"your-account.near"}' \
  --accountId your-account.near
```

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router) — SSR + API routes
- **TypeScript** + **React 18**
- **NEAR Wallet Selector** — MyNEARWallet, Meteor
- **Better Auth** + **NEP-413** — wallet-based sessions, no passwords
- **Prisma** + **Vercel Postgres** — session store

### Backend Services
- **Smart Contract:** Rust (`near-sdk` v5.5), deployed to NEAR mainnet
- **TEE Relayer:** TypeScript + `near-kit`, deployed on Render
- **NOVA MCP Server:** TypeScript, deployed on Render
- **Shade Agent:** Phala Cloud TEE — portfolio alerts + key custody

### NEAR Ecosystem
- **NEAR AI Cloud** — OpenAI-compatible API backed by Intel TDX + NVIDIA H200 TEE
- **NOVA SDK** — Encrypted vault on IPFS with Shade Agent key management
- **FastNEAR API** — Portfolio data (FTs, NFTs, staking) — free, no key needed
- **Shade Agents** — TEE agent framework on Phala Cloud

### Cryptography
- **AES-256-GCM** — portfolio encryption at rest
- **ECDSA** — TEE response signing (secp256k1)
- **SHA-256** — request/response integrity hashes
- **ethers.verifyMessage** — signature recovery and verification

---

## Security Model

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| AI provider reads prompts | TLS terminates inside TEE — encrypted end-to-end to enclave |
| Cloud operator reads data | Intel TDX memory isolation — hypervisor cannot access enclave memory |
| Storage provider decrypts vault | AES-256-GCM client-side encryption — never plaintext outside browser |
| Developer accesses user data | No plaintext access at any layer; keys managed in separate Shade TEE |
| Response tampered in transit | ECDSA signature verified by relayer before storing on-chain |
| Replay attacks | Unique request IDs + on-chain deduplication |
| Fake verification badge | Badge requires `verified: true` which only comes from successful `ethers.verifyMessage` |

### Verification Flow

Every AI response carries:
1. **Request hash** — SHA-256 of the exact prompt sent to the TEE
2. **Response hash** — SHA-256 of the exact text returned
3. **ECDSA signature** — signs `"reqHash:resHash"` with TEE's private key
4. **Signing address** — Ethereum-format address of TEE's signing key
5. **On-chain record** — stored at `ecuador5.near` (publicly auditable)

Anyone can verify independently:
- [etherscan.io/verifySig](https://etherscan.io/verifySig) — recover signer from signature
- [nearblocks.io/address/ecuador5.near](https://nearblocks.io/address/ecuador5.near) — view on-chain records
- [cloud-api.near.ai/v1/attestation/report](https://cloud-api.near.ai/v1/attestation/report) — TEE attestation

---

## Only on NEAR

BlindFold requires NEAR-specific infrastructure and cannot be replicated on any other chain:

| NEAR Feature | How We Use It |
|-------------|---------------|
| **NEAR AI Cloud** | Intel TDX + NVIDIA H200 TEE for private AI inference — no equivalent elsewhere |
| **NOVA Vault** | Encrypted IPFS storage with Shade Agent key management — NEAR-native |
| **Shade Agents** | TEE agent framework on Phala Cloud for key custody + alerts |
| **Yield/Resume (`promise_yield_create`)** | On-chain async AI pattern — NEAR-specific contract primitive |
| **NEP-413** | Wallet-based auth signatures — NEAR standard |
| **Named Accounts** | `ecuador5.near` instead of `0x7a3b...` — readable, human-friendly |
| **FastNEAR API** | Complete portfolio data (FTs, NFTs, staking) in one call |

---

## Prize Track Alignment

### Private Web / Privacy Track
- Dual TEE architecture: NEAR AI Cloud (inference) + Shade Agent (key custody)
- Mathematically verifiable privacy — ECDSA signatures anyone can check
- No trust assumption at any layer: AI, storage, relayer, or developer

### NOVA Track
- NOVA MCP server deployed and live on Render
- AES-256-GCM encryption before every upload
- Shade TEE manages group keys — users can revoke access at any time
- Portfolio snapshots and chat history stored as encrypted CIDs

### Only on NEAR Track
- 7 NEAR-specific features in production (see table above)
- Smart contract live on NEAR mainnet at `ecuador5.near`
- Four deployed services: contract + relayer + NOVA MCP + Shade Agent
- Uses `promise_yield_create` — a contract pattern only possible on NEAR

---

## Project Structure

```
blindfold/
├── app/
│   ├── api/
│   │   ├── advisor/       # On-chain Yield/Resume endpoint
│   │   ├── agents/        # Shade Agent alerts
│   │   ├── audit/         # Verification audit log
│   │   ├── auth/          # Better Auth (NEP-413)
│   │   ├── chat/          # Direct TEE proxy
│   │   ├── nova/          # NOVA vault operations
│   │   ├── vault/         # Vault management
│   │   └── wallet/        # FastNEAR portfolio fetch
│   ├── chat/              # Chat interface page
│   ├── vault/             # Vault controls page
│   └── page.tsx           # Landing page
├── components/
│   ├── ChatInterface.tsx         # Main chat UI + polling
│   ├── OnChainVerification.tsx   # Verification data display
│   ├── RiskScoreCard.tsx         # HHI analytics UI
│   └── WalletConnector.tsx       # NEAR wallet selector
├── lib/
│   ├── blindfold-contract.ts     # NEAR contract client
│   ├── fastnear.ts               # Portfolio data API
│   ├── nova.ts                   # NOVA vault client
│   ├── portfolio-analytics.ts    # HHI, risk scoring
│   └── verify-signature.ts       # ECDSA verification
├── contexts/
│   ├── WalletContext.tsx
│   └── VaultContext.tsx
├── contract/
│   ├── src/lib.rs                # Rust smart contract
│   ├── Cargo.toml
│   └── build.sh
├── relayer/
│   ├── src/index.ts              # TEE relayer polling loop
│   ├── Dockerfile
│   └── package.json
├── types/index.ts                # Shared TypeScript types
└── prisma/schema.prisma          # Database schema
```

---

## FAQ

**Q: Can the relayer read my portfolio data?**
A: No. The relayer only sees request IDs and hashes. Portfolio data travels encrypted to the TEE — the relayer forwards it but cannot decrypt it.

**Q: What happens if I lose my vault key?**
A: Vault keys are managed by the Shade TEE agent. The agent uses your NEAR account signature to authenticate access — as long as you control your wallet, you control your vault.

**Q: How do I know the TEE signature is real?**
A: The signing address is published in NEAR AI Cloud's attestation report at `cloud-api.near.ai/v1/attestation/report`. Cross-reference the `signing_address` in any response against that report — if it matches, the signature came from inside the TEE.

**Q: Why store verifications on-chain instead of just showing them in the UI?**
A: On-chain storage means the verification record exists independently of our servers. Even if BlindFold shuts down, every verification at `ecuador5.near` remains auditable forever.

**Q: What's the difference between Standard mode and On-Chain mode?**
A: Standard mode gives you a response in ~3 seconds stored in your NOVA vault. On-Chain mode takes ~15–30 seconds but stores the verification permanently on the NEAR blockchain — useful when you want a public, auditable record.

---

## License

MIT — see `LICENSE`.

---

**Four live services. One privacy guarantee. Verified on-chain.**
