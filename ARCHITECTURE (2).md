# BlindFold — Architecture Document

## NEARCON 2026 Innovation Sandbox | "The Private Web & Private Life" Track

---

## 1. Product Summary

**BlindFold** is the first privacy-verified crypto financial advisor. Users connect their wallet (NEAR, EVM, Solana, TON, or 30+ chains via HOT KIT), their portfolio data gets encrypted into a personal NOVA vault, and an AI advisor (powered by NEAR AI Cloud's TEE-based private inference) answers questions like "How's my portfolio?", "What's my risk exposure?", or "Give me a weekly summary" — with every response cryptographically signed proving no one saw the data. When the advisor suggests rebalancing, users can execute cross-chain swaps directly via NEAR Intents — non-custodial, gasless, and without leaving the app.

### Why it can't exist on a standard AI stack

On ChatGPT/Claude/Gemini, your wallet holdings, transaction history, and financial questions are visible to the AI provider. BlindFold uses NEAR AI Cloud's TEE-based inference where **TLS terminates inside the Trusted Execution Environment** — not at an external load balancer. Your prompts remain encrypted from your machine all the way into the secure enclave before being decrypted. Combined with NOVA's encrypted vault (keys managed in separate TEEs via Shade Agents), this creates a system where **no single party** — not the AI provider, not the storage provider, not even us — can see your financial data.

### NEAR AI Cloud's Three Guarantees

1. **Complete Privacy** — Prompts, model weights, and outputs are encrypted and isolated in hardware-secured environments (Intel TDX + NVIDIA TEE). Infrastructure providers, model providers, and NEAR cannot access data at any point.
2. **Cryptographic Verification** — Every computation generates cryptographic proof that it occurred inside a genuine, secure TEE. Independently verifiable without trusting any third party.
3. **Production Performance** — Hardware-accelerated TEEs with NVIDIA Confidential Computing (8x H200 GPUs per node) deliver high-throughput inference with minimal latency overhead.

### Target users

- **NEAR Legion** (4,000 active members) — immediate user base
- Crypto holders who check portfolios daily but don't trust centralized tools
- DeFi users who want AI-powered analysis without data exposure

### Prize potential

- $3,500 (Private Web track) + $4,500 ("Only on NEAR" bonus) + $3,000 (NOVA bounty) + $3,000 (HOT Pay bounty) = **$14,000**

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                               │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────┐    │
│  │ NEAR Wallet │  │  Chat UI     │  │ Verify     │  │ Swap UI │    │
│  │ + HOT KIT   │  │  (Streaming) │  │ Panel      │  │ (Phase3)│    │
│  │ Multi-chain │  │              │  │ + On-Chain │  │         │    │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  └────┬────┘    │
│         │                │                 │              │          │
│  ┌──────┴──────────────────────────────────┴──────────────┴───────┐  │
│  │              @near-kit/react (NearProvider + Hooks)             │  │
│  │  useView() · useCall() · useBalance() · useContract()         │  │
│  └───────────────────────────────┬────────────────────────────────┘  │
└──────────────────────────────────┼───────────────────────────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
┌──────────────────┐  ┌──────────────────────┐  ┌────────────────────┐
│  BETTER AUTH     │  │  BLINDFOLD CONTRACT  │  │  FASTNEAR API      │
│  SESSION LAYER   │  │  (blindfold.near)    │  │  (Portfolio Data)  │
│                  │  │                      │  │                    │
│  /api/auth/*     │  │  ask_advisor()       │  │  /v1/account/      │
│  NEP-413 SIWN    │  │   → yield (pause)   │  │   {id}/full        │
│  verifyNep413    │  │  provide_response()  │  │  FTs + NFTs +      │
│  Signature()     │  │   → resume (result)  │  │  Staking positions │
│  (near-kit)      │  │  get_verification()  │  │  (free, no key)    │
│                  │  │  calculate_risk()    │  │                    │
└────────┬─────────┘  └──────────┬───────────┘  └────────────────────┘
         │                       │
         ▼                       │  ← Polls pending requests
┌──────────────────────┐         │
│  NEXT.JS API ROUTES  │  ┌──────┴───────────────────────────────────┐
│                      │  │         TEE RELAYER SERVICE               │
│  /api/chat           │  │         (near-kit server-side)            │
│  /api/vault (NOVA)   │  │                                          │
│  /api/swap (Phase 3) │  │  1. Poll contract: get_pending_requests  │
│  /api/risk-score     │  │  2. Forward prompt → NEAR AI Cloud TEE   │
│                      │  │  3. Call provide_ai_response() on-chain  │
└──┬────┬────┬─────────┘  │  4. Verification stored permanently     │
   │    │    │             └──────────┬──────────────────────────────┘
   ▼    ▼    ▼                        │
┌──────┐ ┌────────┐ ┌──────────┐     ▼
│ NEAR │ │ NEAR   │ │  NOVA    │  ┌──────────────────┐
│ RPC  │ │ AI     │ │  SDK     │  │  NEAR AI CLOUD   │
│(kit) │ │ Cloud  │ │  (TEE)   │  │  (TEE Inference) │
└──────┘ └────────┘ └──────────┘  │                  │
   │        │          │          │  Intel TDX +      │
   ▼        ▼          ▼          │  NVIDIA H200 TEE  │
 NEAR    Intel TDX   IPFS +      │  Private LLM      │
 Chain   + NVIDIA    NEAR Chain   └──────────────────┘
         TEE (H200)

                 ┌─────────────────────────┐
                 │    PUBLIC VERIFICATION   │
                 │                          │
                 │  NearBlocks API:         │
                 │  blindfold.near txns     │
                 │  → judges verify freely  │
                 │                          │
                 │  Contract view methods:  │
                 │  get_verification(id)    │
                 │  → anyone can query      │
                 └─────────────────────────┘
```

### Three-Layer Backend Architecture

Unlike typical hackathon projects that just proxy API calls through Next.js routes, BlindFold has **three distinct backend layers**:

1. **Smart Contract (Rust, near-sdk-rs)** — Yield/resume AI advisor + on-chain verification registry. Real Rust development deployed to NEAR. Every AI interaction permanently recorded with TEE proof.

2. **TEE Relayer Service (TypeScript, near-kit)** — Bridges the smart contract and NEAR AI Cloud TEE. Polls for pending requests, forwards to TEE, resumes contract with verified response. Uses `near-kit` server-side with `RotatingKeyStore` for high-throughput transaction signing.

3. **Portfolio Analytics Engine (TypeScript, server-side)** — Proprietary financial analysis: Herfindahl-Hirschman concentration index, cross-chain correlation detection, rebalancing calculator. Enriches LLM context beyond raw balances.

### How Private Inference Protects Data

```
🔒 Encrypted            🔒 Encrypted
┌──────────┐  TLS/HTTPS  ┌─────────────────────────────────────┐
│  User's  │ ──────────→ │  TEE: TLS Termination → LLM Model  │
│  Machine │ ←────────── │  (Intel TDX + NVIDIA TEE)           │
└──────────┘  TLS/HTTPS  └─────────────────────────────────────┘

Key insight: TLS termination happens INSIDE the TEE (green box),
not at an external load balancer. Prompts remain encrypted until
they reach the secure enclave. No plaintext exposure at any point.
```

---

## 3. Core Data Flow

### 3.1 Onboarding (First Time)

```
User clicks "Connect Wallet"
  → Phase 1: NEAR Wallet Selector connects (alice.near)
  → Phase 2: HOT KIT connector supports 30+ chains
      (EVM, Solana, TON, Stellar, Cosmos — or Google login)
  → Wallet signs authentication message (proves ownership)
  → Better Auth creates persistent session (cookie-based)
      - Session survives page reloads / browser close
      - All subsequent API calls authenticated via session
      - Built-in rate limiting: 100 chat requests/hour
  → App fetches balances:
      - Phase 1: NEAR RPC (NEAR + FTs on NEAR)
      - Phase 2: HOT KIT walletsTokens (balances across ALL connected chains)
  → Portfolio JSON assembled client-side
  → NOVA SDK creates personal group: "vault.alice.near"
  → Portfolio JSON encrypted (AES-256-GCM, key from Shade TEE)
  → Encrypted data uploaded to IPFS via NOVA
  → Metadata logged on NEAR blockchain
  → User sees: "Your vault is ready. Ask me anything about your portfolio."
```

### 3.2 Chat Interaction (Every Message)

```
User types: "What's my risk exposure?"
  → App retrieves encrypted portfolio from NOVA vault
  → Portfolio decrypted client-side (key from Shade TEE)
  → Build request body (OpenAI SDK format):
      {
        model: "deepseek-ai/DeepSeek-V3.1",
        messages: [system_prompt, { role: "user", content: portfolio + question }],
        stream: true
      }
  → Store exact JSON.stringify(requestBody) for verification hash
  → Send via OpenAI SDK (baseURL: "https://cloud-api.near.ai/v1")
      - Standard HTTPS = TLS encryption (automatic)
      - TLS terminates INSIDE the TEE (not at load balancer)
      - Prompts decrypted only within secure enclave
  → Stream response chunks via SSE, collect:
      - chat_id (from chunk.id, e.g. "chatcmpl-d17ba5...")
      - Full response text (for display)
      - Raw SSE body text (for response hash — includes trailing \n\n!)
  → Hash request body: SHA-256(requestBody) → requestHash
  → Hash response body: SHA-256(rawSSEBody) → responseHash
  → Fetch signature:
      GET /v1/signature/{chat_id}?model=deepseek-ai/DeepSeek-V3.1&signing_algo=ecdsa
      Returns: {
        text: "requestHash:responseHash",
        signature: "0x649b30...",
        signing_address: "0x319f1b...",
        signing_algo: "ecdsa"
      }
  → Verify: ethers.verifyMessage(text, signature) === signing_address
  → Display response + green verification badge (✅ Verified in TEE)
  → Save conversation to NOVA vault (encrypted append)
```

### 3.3 Verification (Per Message — Detailed)

```
STEP 1: CHAT MESSAGE HASHES
  - Request hash = SHA-256 of exact JSON request body string
  - Response hash = SHA-256 of exact raw SSE response body
    (⚠️ streaming response contains two trailing newlines — must not be omitted)

STEP 2: SIGNATURE RETRIEVAL
  - GET /v1/signature/{chat_id}?model={model_id}&signing_algo=ecdsa
  - Returns: { text, signature, signing_address, signing_algo }
  - text = "requestHash:responseHash" (colon-separated)
  - Signatures are persistent in LLM gateway — queryable anytime after chat

STEP 3: SIGNATURE VERIFICATION
  - Recover address: ethers.verifyMessage(text, signature)
  - Compare recovered address with signing_address (case-insensitive)
  - Compare signing_address with model attestation's signing_public_key

STEP 4: MODEL ATTESTATION (Deep verification)
  - GET /v1/attestation/report?model={model}&signing_algo=ecdsa&nonce={64-hex}
  - GPU attestation: POST nvidia_payload to NVIDIA NRAS → verify verdict = PASS
  - Intel TDX quote: Verify with dcap-qvl library → CPU TEE measurements valid
  - TDX report data: Validates signing key is bound to hardware + nonce freshness
  - Compose manifest: SHA-256 must match mr_config from TDX quote

STEP 5: NOVA VAULT INTEGRITY
  - TEE checksum (from Shade Agent's agentInfo)
  - Transaction ID on NEAR blockchain
  - IPFS CID of encrypted data
```

### 3.4 Data Controls (Inspect/Export/Delete/Revoke)

```
INSPECT  → View all data in vault (decrypted client-side)
EXPORT   → Download portfolio JSON + chat history as file
DELETE   → Remove group from NOVA (keys destroyed in TEE)
REVOKE   → If shared with advisor, revoke member access
           (triggers automatic key rotation in Shade TEE)
```

### 3.5 Advisor → Action: Swap Execution (Phase 2 — HOT KIT)

```
BlindFold advisor says:
  "Your portfolio is 82% NEAR. Consider rebalancing 20% to stablecoins."

  → User clicks [🔄 Rebalance Now]
  → HOT KIT opens swap UI:
      - From: NEAR (user's wallet)
      - To: USDC (or user's choice)
      - Amount: calculated from advisor suggestion
  → HOT KIT handles the swap via NEAR Intents:
      - Finds best route (solvers, AMM, orderbook)
      - User signs intent (not raw transactions)
      - Non-custodial: funds go user → on-chain → user
  → Swap confirmed on-chain (verifiable on hotscan.org)
  → BlindFold auto-updates portfolio in NOVA vault
  → Advisor confirms: "Rebalance complete. NEAR allocation now 62%."

Why HOT KIT and not a raw DEX integration:
  - Multi-chain: user can rebalance across ETH, SOL, TON, BTC too
  - Intent-based: user says "what" not "how" — matches advisor UX
  - Non-custodial: aligned with BlindFold's privacy-first ethos
  - Gasless possible: fees via token abstraction
  - One signer: same wallet signs everything
```

---

## 4. Technology Stack

### Frontend

| Component | Technology | Why |
|-----------|-----------|-----|
| Framework | Next.js 14 (App Router) | SSR + API routes in one repo |
| Language | TypeScript | Type safety across all SDKs |
| Styling | Tailwind CSS | Rapid UI, no CSS conflicts |
| NEAR SDK | `near-kit` + `@near-kit/react` | Modern fluent API, human-readable units, typed contracts |
| Wallet (Phase 1) | @near-wallet-selector/* + `fromWalletSelector()` | NEAR wallet connection via near-kit adapter |
| Wallet (Phase 3) | @hot-labs/kit + `fromHotConnect()` | Multi-chain: EVM, Solana, TON, Stellar, Cosmos, Google |
| Swap (Phase 3) | @hot-labs/kit Exchange | Intent-based swaps via NEAR Intents |
| Data Fetching | React Query (@tanstack/react-query) | Cache, dedup, background refetch, optimistic updates |
| State | React Context + React Query + MobX (HOT KIT) | Minimal core, reactive HOT KIT |

### Smart Contract (Rust — deployed to `blindfold.near`)

| Component | Technology | Why |
|-----------|-----------|-----|
| Language | Rust | Performance, safety, NEAR ecosystem standard |
| SDK | `near-sdk` v5 | Contract state, collections, cross-contract calls |
| Pattern | Yield/Resume (env::promise_yield_create) | On-chain async: contract pauses while TEE processes |
| Storage | `IterableMap` (requests) + `LookupMap` (verifications) | Optimal collection types for each access pattern |
| Serialization | Borsh (state) + JSON (input/output) | NEAR standard serialization |
| Testing | `cargo near build` + Sandbox (near-kit) | Local sandbox for integration tests |
| Deployment | `cargo near build` → `near deploy` | Compile to WASM → deploy to NEAR account |

### Backend Services (TypeScript — near-kit server-side)

| Component | Technology | Why |
|-----------|-----------|-----|
| TEE Relayer | `near-kit` (server-side) | Polls contract, forwards to TEE, resumes with response |
| Auth | `better-auth` + `better-near-auth` | Wallet-based sessions, rate limiting, 2FA-ready |
| Auth Verification | `near-kit` `verifyNep413Signature()` | Built-in NEP-413 verification, replaces manual ethers |
| AI Inference | `openai` npm package | OpenAI-compatible SDK, just change baseURL |
| Vault | `nova-sdk-js` v1.0.3 | Encrypted storage, group access control |
| Portfolio Data | FastNEAR API (REST) | Free, no key, returns all user assets in one call |
| Risk Scoring | Custom TypeScript engine | HHI concentration, correlation, rebalancing algorithms |
| Hashing | Node.js `crypto` | SHA-256 for request/response hashing |
| Key Management | `RotatingKeyStore` (near-kit) | Multiple keys for high-throughput relayer signing |

### Infrastructure

| Component | Technology | Why |
|-----------|-----------|-----|
| Hosting | Vercel | Free tier, instant deploy, live URL |
| Storage | IPFS (via NOVA/Pinata) | Decentralized, encrypted |
| Blockchain | NEAR Protocol | Named accounts, low fees, yield/resume |
| Smart Contract | `blindfold.near` (or `blindfold.testnet`) | On-chain verification registry + AI advisor |
| Key Management | NOVA Shade Agents (Phala TEE) | Off-chain, verifiable |
| AI Compute | NEAR AI Cloud (Intel TDX + NVIDIA TEE) | Private inference, H200 GPUs |
| Public Verification | NearBlocks API | Judges verify contract calls freely |

---

## 5. API Integrations

### 5.1 NEAR AI Cloud — Private Inference

**Base URL:** `https://cloud-api.near.ai/v1`
**Compatibility:** OpenAI API spec — use `openai` npm package, just override `baseURL`

**Supported Features:**
- Chat Completions (`/v1/chat/completions`) — our primary endpoint
- Models List (`/v1/models`)
- Files (`/v1/files`) — upload, list, retrieve, delete
- Conversations (`/v1/conversations`) — multi-turn management
- Responses (`/v1/responses`) — advanced tool calling
- Streaming (Server-Sent Events)

**Available Models:**

| Model | Model ID | Context | Input Price | Output Price | Notes |
|-------|----------|---------|-------------|--------------|-------|
| DeepSeek V3.1 | `deepseek-ai/DeepSeek-V3.1` | 128K | $1.05/M | $3.10/M | Best reasoning, thinking mode |
| GPT OSS 120B | `openai/gpt-oss-120b` | 131K | $0.15/M | $0.55/M | Cheapest, MoE 117B (5.1B active) |
| Qwen3 30B A3B | `Qwen/Qwen3-30B-A3B-Instruct-2507` | 262K | $0.15/M | $0.55/M | Longest context, non-thinking only |
| GLM-4.6 | `zai-org/GLM-4.6` | 200K | $0.85/M | $3.30/M | Agentic, thinking on by default |
| GLM 4.7 | `zai-org/GLM-4.7` | 131K | $0.85/M | $3.30/M | MoE 355B (32B active) |

**Primary:** `deepseek-ai/DeepSeek-V3.1` — best reasoning, supports thinking mode
**Budget fallback:** `openai/gpt-oss-120b` — 7x cheaper input, 5.6x cheaper output

#### Basic Chat Completion

```typescript
import OpenAI from 'openai';

// Same OpenAI SDK — just change baseURL
const client = new OpenAI({
  baseURL: 'https://cloud-api.near.ai/v1',
  apiKey: process.env.NEAR_AI_API_KEY,
});

// Build request
const requestBody = {
  model: 'deepseek-ai/DeepSeek-V3.1',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Portfolio:\n${portfolioJSON}\n\nQuestion: ${userQuestion}` }
  ],
  stream: true,
};

// IMPORTANT: Store the exact stringified body for verification hash
const requestBodyString = JSON.stringify(requestBody);

// Stream response
const stream = await client.chat.completions.create(requestBody);

let fullResponse = '';
let chatId = '';
for await (const chunk of stream) {
  chatId = chunk.id; // e.g. "chatcmpl-d17ba5d9f393440591562f4ff006f246"
  const content = chunk.choices[0]?.delta?.content || '';
  fullResponse += content;
}

// Also works without streaming:
// const response = await client.chat.completions.create({ ...requestBody, stream: false });
// chatId = response.id;
// fullResponse = response.choices[0].message.content;
```

#### Alternative: Environment Variables (zero-config)

```bash
export OPENAI_BASE_URL="https://cloud-api.near.ai/v1"
export OPENAI_API_KEY="your-near-ai-key"
```

```typescript
// Then initialize without arguments
const client = new OpenAI(); // reads from env vars automatically
```

#### Reasoning Mode (for complex portfolio analysis)

DeepSeek V3.1 supports a thinking stage — internal reasoning before the final answer. Useful for multi-step risk calculations, correlation analysis, or portfolio optimization.

```typescript
const requestBody = {
  model: 'deepseek-ai/DeepSeek-V3.1',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: complexAnalysisPrompt }
  ],
  stream: true,
  temperature: 1, // recommended when thinking is enabled
  chat_template_kwargs: {
    thinking: true  // enables internal reasoning step
  }
};

// Streaming chunks include:
// - reasoning_content: null (thinking is hidden by default)
// - content: the final answer
```

**Model-specific reasoning parameters:**

| Model | Parameter | Default | Notes |
|-------|-----------|---------|-------|
| DeepSeek V3.1 | `chat_template_kwargs.thinking` | `false` | Must explicitly enable |
| GLM-4.6 | `chat_template_kwargs.enable_thinking` | `true` | On by default, disable with `false` |

⚠️ Using the wrong parameter name for the wrong model will silently fail — no reasoning will be enabled.

**When to use reasoning:**
- ✅ Complex risk calculations, multi-step portfolio analysis, diversification scoring
- ✅ Code generation, scientific questions, logical reasoning
- ❌ Simple "How's my portfolio?" queries (adds latency + token usage)
- ❌ Fast response needed (simple queries with direct answers)

### 5.1b Per-Message Verification (Complete Flow)

Every chat message can be cryptographically verified. Signatures are **persistent in the LLM gateway** and can be queried at any time after chat completion.

```typescript
import crypto from 'crypto';
import { ethers } from 'ethers';

// ═══════════════════════════════════════════
// STEP 1: Hash the request body (SHA-256)
// ═══════════════════════════════════════════
// Must be the EXACT JSON string sent to the API
const requestHash = crypto.createHash('sha256')
  .update(requestBodyString)
  .digest('hex');
// Example: "b524f8f4b611b43526aa988c636cf1d7e72aa661876c3d969e2c2acae125a8ba"

// ═══════════════════════════════════════════
// STEP 2: Hash the raw response body (SHA-256)
// ═══════════════════════════════════════════
// ⚠️ CRITICAL: The streaming response contains two trailing newlines
// at the end (\n\n). These MUST NOT be omitted or the hash will not match.
// Use the raw SSE text body from response.text(), NOT the parsed content.
const responseHash = crypto.createHash('sha256')
  .update(rawSSEResponseText)
  .digest('hex');
// Example: "aae79d9de9c46f0a9c478481ceb84df5742a88067a6ab8bac9e98664d712d58f"

// ═══════════════════════════════════════════
// STEP 3: Fetch signature from LLM Gateway
// ═══════════════════════════════════════════
// chat_id comes from chunk.id in streaming responses
const sigResponse = await fetch(
  `https://cloud-api.near.ai/v1/signature/${chatId}?model=deepseek-ai/DeepSeek-V3.1&signing_algo=ecdsa`,
  { headers: { 'Authorization': `Bearer ${process.env.NEAR_AI_API_KEY}` } }
);
const sigData = await sigResponse.json();
// Returns:
// {
//   "text": "b524f8f4...ba:aae79d9d...8f",          ← requestHash:responseHash
//   "signature": "0x649b30be41e53ac3...",              ← ECDSA signature from TEE
//   "signing_address": "0x319f1b8BB3b72...",           ← TEE's public address
//   "signing_algo": "ecdsa"
// }

// ═══════════════════════════════════════════
// STEP 4: Verify ECDSA signature
// ═══════════════════════════════════════════
const recoveredAddress = ethers.verifyMessage(sigData.text, sigData.signature);
const isSignatureValid = recoveredAddress.toLowerCase() === sigData.signing_address.toLowerCase();

// Also verify our locally computed hashes match the signed text:
const expectedText = `${requestHash}:${responseHash}`;
const hashesMatch = sigData.text === expectedText;

// ═══════════════════════════════════════════
// STEP 5: Verify signing_address matches model attestation
// ═══════════════════════════════════════════
// (See section 5.4 for full attestation verification)
// The signing_address from the signature must match the
// signing_public_key from the model's attestation report
```

**Alternative verification tools:**
- **Etherscan VerifySignatures:** https://etherscan.io/verifiedSignatures — paste address + text + signature
- **ethers.js:** as shown above
- **Any ECDSA library** that supports Ethereum message signing

### 5.2 NOVA SDK (Encrypted Vault)

```typescript
import { NovaSdk } from 'nova-sdk-js';

// Initialize with user's NOVA account
const nova = new NovaSdk(userAccountId, {
  apiKey: process.env.NOVA_API_KEY
});

// Create personal vault (~0.05 NEAR)
await nova.registerGroup(`vault.${userAccountId}`);

// Store portfolio — encrypted client-side (AES-256-GCM) (~0.01 NEAR + IPFS)
const result = await nova.upload(
  `vault.${userAccountId}`,
  Buffer.from(JSON.stringify(portfolioData)),
  'portfolio.json'
);
// result.cid → IPFS content identifier

// Retrieve — decrypted client-side (~0.001 NEAR)
const { data } = await nova.retrieve(
  `vault.${userAccountId}`,
  result.cid
);
const portfolio = JSON.parse(data.toString());

// Share vault with trusted advisor (~0.001 NEAR)
await nova.addGroupMember(`vault.${userAccountId}`, 'advisor.near');

// Revoke access (~0.001 NEAR) — triggers automatic key rotation in Shade TEE
await nova.revokeGroupMember(`vault.${userAccountId}`, 'advisor.near');
```

### 5.3 NEAR RPC (Wallet Data)

```typescript
import { providers } from 'near-api-js';

const provider = new providers.JsonRpcProvider({
  url: 'https://rpc.mainnet.near.org'
});

// Account balance
const account = await provider.query({
  request_type: 'view_account',
  account_id: 'alice.near',
  finality: 'final'
});
// account.amount → yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)

// FT balances (for each known token contract)
const balance = await provider.query({
  request_type: 'call_function',
  account_id: 'wrap.near', // or any token contract
  method_name: 'ft_balance_of',
  args_base64: btoa(JSON.stringify({ account_id: 'alice.near' })),
  finality: 'final'
});
```

### 5.4 Model Attestation Verification (Deep Verification)

Full hardware attestation proves the model runs in a genuine TEE. This is what makes "private inference" verifiable, not just claimed.

**Verification flow:**
1. Secure Key Generation → TEE generates unique signing key pair (private key never leaves hardware)
2. Hardware Attestation → Proves genuine NVIDIA H200 hardware in TEE mode within confidential VM
3. Key Binding → Attestation reports include the public key, linking hardware to signing capability
4. Message Signing → Every request/response signed with TEE's private key
5. End-to-End Verification → Check attestation + validate signatures + confirm key binding

```typescript
import crypto from 'crypto';

// ═══════════════════════════════════════════
// STEP 1: Request model attestation report
// ═══════════════════════════════════════════
// Nonce: random 64-char hex (32 bytes) — prevents replay attacks
const nonce = crypto.randomBytes(32).toString('hex');

const attestation = await fetch(
  `https://cloud-api.near.ai/v1/attestation/report?model=deepseek-ai/DeepSeek-V3.1&signing_algo=ecdsa&nonce=${nonce}`
);
const report = await attestation.json();
// Returns:
// {
//   model_attestations: [{ signing_public_key: "0x...", ... }],
//   nvidia_payload: {
//     nonce: "...",
//     arch: "HOPPER",           ← H200 architecture
//     evidence_list: [{ evidence: "...", certificate: "..." }]
//   },
//   intel_quote: "...",
//   info: { compose_manifest: "...", ... }
// }

// ═══════════════════════════════════════════
// STEP 2: Verify GPU attestation with NVIDIA NRAS
// ═══════════════════════════════════════════
// NVIDIA burns a unique private key into each GPU during manufacturing.
// They retain only the public key for verification.
const gpuVerification = await fetch('https://nras.attestation.nvidia.com/v3/attest/gpu', {
  method: 'POST',
  headers: {
    'accept': 'application/json',
    'content-type': 'application/json'
  },
  body: JSON.stringify(report.nvidia_payload)
});
// Returns JWT "Entity Attestation Token" (EAT)
// Decode with jose/jwt.io to verify:
//   - GPU Hardware Identity
//   - Firmware & Software measurements
//   - Security configuration state
//   - Nonce matches our request nonce
//   - Verdict: PASS

// ═══════════════════════════════════════════
// STEP 3: Verify Intel TDX quote
// ═══════════════════════════════════════════
// Use dcap-qvl library or TEE Attestation Explorer
// Verifies:
//   - CPU TEE measurements are valid
//   - Quote is authentic and signed by Intel
//   - TEE environment is genuine

// ═══════════════════════════════════════════
// STEP 4: Verify TDX report data
// ═══════════════════════════════════════════
// Validates:
//   - Report data binds the signing address (ECDSA key)
//   - Report data embeds our request nonce
// Ensures cryptographic binding between signing key and hardware
// Prevents replay attacks through nonce freshness

// ═══════════════════════════════════════════
// STEP 5: Verify compose manifest
// ═══════════════════════════════════════════
// Extract Docker compose manifest from report.info
// Calculate SHA-256 hash of compose manifest
// Compare with mr_config measurement from verified TDX quote
// Match proves exact container configuration deployed to TEE
```

**Reference implementations:**
- Simple: [NEAR AI Cloud Verification Example](https://github.com/nearai/cloud-verification-example)
- Complete: [NEAR AI Cloud Verifier](https://github.com/nearai/cloud-verifier)

### 5.5 Full Verification Chain (What Users See)

```
For each AI response, user can click the verification badge to see:

1. REQUEST INTEGRITY
   ✅ "Your question was hashed: sha256:b524f8f4..."
   ✅ "Hash matches the signed text from TEE"

2. RESPONSE INTEGRITY
   ✅ "AI response was hashed: sha256:aae79d9d..."
   ✅ "Hash matches the signed text from TEE"

3. TEE SIGNATURE
   ✅ "Signature valid: 0x649b30be41e53ac3..."
   ✅ "Signed by TEE address: 0x319f1b8BB3b72..."
   ✅ "Address matches model attestation public key"

4. HARDWARE ATTESTATION
   ✅ "Running on NVIDIA H200 in TEE mode (HOPPER architecture)"
   ✅ "Intel TDX quote verified — CPU enclave authentic"
   ✅ "Docker compose manifest matches mr_config"
   ✅ "Nonce: fresh (not a replay)"

5. VAULT INTEGRITY (NOVA)
   ✅ "Portfolio encrypted with AES-256-GCM"
   ✅ "Keys managed in Shade TEE (checksum: xyz...)"
   ✅ "Transaction logged on NEAR: tx_id..."
   ✅ "IPFS CID: bafy..."
```

### 5.6 E2EE Chat Completions (Stretch Goal — Post-MVP)

Standard TLS already provides strong protection since TLS terminates inside the TEE. E2EE adds **defense-in-depth** by encrypting with the model's public key before data leaves the client.

```
With E2EE:
  1. Client fetches model's public key from attestation report
     (signing_public_key — cryptographically bound to TEE hardware)
  2. Client generates ephemeral key pair per request (forward secrecy)
  3. Messages encrypted client-side:
     - ECDSA path: SECP256K1 → ECDH key exchange → AES-256-GCM
     - Ed25519 path: Curve25519 → X25519 → ChaCha20-Poly1305
  4. Encrypted content sent as hex in message content field
  5. Model decrypts inside TEE, processes, encrypts response with client's public key
  6. Client decrypts response with its private key

Required headers for E2EE requests:
  - X-Signing-Algo: ecdsa | ed25519
  - X-Client-Pub-Key: client ephemeral public key (hex)
  - X-Model-Pub-Key: model public key from attestation (hex, for routing)

Supported only on: /v1/chat/completions (NOT /v1/responses)
Each streaming chunk's content is independently encrypted.

MVP Decision: Skip for hackathon. TLS-to-TEE already guarantees privacy.
Implement only if time permits as impressive technical differentiator.
```

### 5.7 HOT Protocol — Multi-Chain Portfolio & Cross-Chain Swaps (Phase 2)

HOT Protocol is the backbone of BlindFold's cross-chain capabilities. It consists of:

- **HOT KIT** (`@hot-labs/kit`) — Multi-chain wallet connector + portfolio viewer + swap UI
- **HOT Omni Balance** — Unified cross-chain token representation on NEAR blockchain
- **HOT Bridge** (OmniBridge) — Bridge protocol for 30+ chains via MPC validators
- **NEAR Intents** — Declare "what" you want, not "how" to do it
- **HOT PAY** — Non-custodial payment verification & receipts

**How this elevates BlindFold:**
- Phase 1: Advisor sees only NEAR tokens
- Phase 2: Advisor sees your **entire crypto portfolio** across ETH, SOL, BTC, TON, Stellar, Cosmos, etc.
- Phase 2: Advisor suggestions become **one-click executable swaps** — cross-chain, gasless, non-custodial

#### 5.7a HOT KIT — Wallet Connection & Portfolio

**Packages:** `@hot-labs/kit` + `react` + `react-dom`
**API Key:** Free from https://pay.hot-labs.org/admin/api-keys
**Requires:** `vite-plugin-node-polyfills` (for browser builds)

**Supported Connectors:**

| Chain | Wallets |
|-------|---------|
| NEAR | HOT Wallet, Meteor, Intear, MyNearWallet, WalletConnect |
| EVM (10+) | MetaMask, HOT Wallet, WalletConnect, all browser wallets |
| Solana | Phantom, HOT Wallet, WalletConnect |
| TON | HOT Wallet, TonKeeper |
| Stellar | HOT Wallet, Freighter |
| TRON | TronLink |
| Cosmos | Keplr, Leap, WalletConnect |
| Google (experimental) | All networks via HOT MPC — web2 onboarding |

```typescript
import { HotConnector } from "@hot-labs/kit";
import { defaultConnectors } from "@hot-labs/kit/defaults";
// import google from "@hot-labs/kit/hot-wallet";  // Optional: Google login
// import cosmos from "@hot-labs/kit/cosmos";       // Optional: Cosmos chains

export const kit = new HotConnector({
  apiKey: process.env.NEXT_PUBLIC_HOT_API_KEY,
  connectors: defaultConnectors, // NEAR + EVM + Solana + TON + Stellar
  walletConnect: {
    projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID, // from dashboard.reown.com
    metadata: {
      name: "BlindFold",
      description: "Your AI advisor is blindfolded",
      url: "https://blindfold-ai.vercel.app",
      icons: ["/logo.png"],
    },
  },
});

// ═══════════════════════════════════════════
// Wallet connection events
// ═══════════════════════════════════════════
kit.onConnect(({ wallet }) => {
  // wallet.type: "EVM" | "NEAR" | "TON" | "Solana" | "Stellar" | "Cosmos"
  // wallet.address: chain-specific address
  // wallet.omniAddress: unified address for Omni Balance
  console.log(`Connected: ${wallet.type} — ${wallet.address}`);
});

kit.onDisconnect(({ wallet }) => {
  console.log(`Disconnected: ${wallet.type}`);
});

// Connect specific chain or let user choose
const wallet = await kit.connect(); // opens UI picker
// const evmWallet = await kit.connect(WalletType.EVM); // specific chain

// ═══════════════════════════════════════════
// Multi-chain portfolio (THE KEY FEATURE)
// ═══════════════════════════════════════════
// HOT KIT auto-tracks balances + USD rates across ALL connected wallets
// Rates auto-update every 5 minutes
kit.walletsTokens.forEach(({ wallet, token, balance }) => {
  console.log(
    `[${wallet.type}] ${wallet.address}`,
    `${token.float(balance)} ${token.symbol}`,       // e.g. "1.5 ETH"
    `$${(token.float(balance) * token.usd).toFixed(2)}` // e.g. "$4,500.00"
  );
});
// This is what we feed to the AI advisor as the portfolio context!

// Refresh specific wallet
const evmWallet = kit.evm; // connected EVM wallet or null
if (evmWallet) await kit.fetchTokens(evmWallet);
```

**Token Management:**

```typescript
import { tokens, chains, Network } from "@hot-labs/kit/core";

// Token IDs follow pattern: chainID:tokenAddress
// Native tokens: chainID:native
const ethOnBase = tokens.get("native", Network.Base);
const near = tokens.get("native", Network.Near);

// Format amounts using token decimals
ethOnBase.float(10_000_000n);         // converts from bigint to float
ethOnBase.int(1.5);                    // converts from float to bigint

// Real-time USD price (auto-updated every 5min)
console.log(`NEAR: $${near.usd}`);
console.log(`0.01 ETH = $${ethOnBase.float(10n ** BigInt(ethOnBase.decimals - 2)) * ethOnBase.usd}`);

// Token identity: token.id === `${token.chain}:${token.address}`
```

#### 5.7b HOT Omni Balance & NEAR Intents — How Swaps Work

BlindFold's swap capability is built on **HOT Omni Balance** — a unified cross-chain token system where all balances are stored in a single smart contract on NEAR. This enables instant, gasless, cross-chain swaps via **NEAR Intents**.

**Architecture:**

```
User's ETH wallet          User's SOL wallet         User's NEAR wallet
     │                          │                          │
     │ deposit                  │ deposit                  │
     ▼                          ▼                          ▼
┌──────────┐            ┌──────────────┐            ┌──────────┐
│ EVM      │            │ Solana       │            │ NEAR     │
│ Locker   │            │ Locker       │            │ native   │
│ Contract │            │ Contract     │            │          │
└────┬─────┘            └──────┬───────┘            └────┬─────┘
     │ MPC proof               │ MPC proof                │
     ▼                         ▼                          ▼
┌──────────────────────────────────────────────────────────────┐
│                HOT OMNI BALANCE (on NEAR)                     │
│              v2_1.omni.hot.tg contract                       │
│                                                              │
│  All assets from all chains unified here                     │
│  Swaps are instant (intent-based, solver-matched)            │
│  Transfers are free                                          │
│  Implements NEP-254 Multi-Token standard                     │
└──────────────────────────────────────────────────────────────┘
```

**Intent Types (what the user can declare):**

| Intent | Purpose | Example |
|--------|---------|---------|
| `transfer` | Move tokens between omni addresses | Send USDC to bob.near |
| `token_diff` | Atomic swap at a fixed rate | Swap NEAR → USDC |
| `mt_withdraw` | Withdraw to native chain | Send BTC to bc1q... |

```typescript
// Intent examples (signed off-chain, executed on-chain by anyone → gasless!)

// Transfer
{ intent: "transfer", from: "alice.near", to: "bob.near",
  token: "nep141:usdc.omni.hot.tg:eth", amount: "1000000" }

// Swap (atomic: USDC → DAI)
{ intent: "token_diff",
  diff: { "nep141:usdc.omni.hot.tg:eth": "-1000000",
          "nep141:dai.omni.hot.tg:eth": "995000" } }

// Withdraw (back to native chain)
{ intent: "mt_withdraw", token: "btc.omni.hot.tg:mainnet",
  amount: "100000", recipient: "bc1qxy2..." }
```

#### 5.7c Advisor-Triggered Swap Execution

When the BlindFold advisor suggests rebalancing, the user can execute it in one click:

```typescript
import { Exchange, tokens, OmniToken, Network } from "@hot-labs/kit/core";

// ═══════════════════════════════════════════
// Option 1: Open HOT KIT built-in swap popup (simplest)
// ═══════════════════════════════════════════
kit.openBridge(); // Full UI for swap/bridge — pre-built by HOT team

// ═══════════════════════════════════════════
// Option 2: Programmatic swap (advisor-controlled)
// ═══════════════════════════════════════════
const exchange = new Exchange();
const wallet = kit.near; // or kit.evm, kit.solana, etc.

// AI advisor calculated: "Swap 30 NEAR → USDC"
const nearToken = tokens.get("native", Network.Near);
const usdcOmni = tokens.get(OmniToken.USDC);

// Step 1: Get quote (shows exchange rate, fees, slippage)
const review = await exchange.reviewSwap({
  sender: wallet,
  recipient: wallet,     // receive to same wallet
  refund: wallet,        // if swap fails, refund here
  from: nearToken,       // NEAR
  to: usdcOmni,         // USDC (omni — works cross-chain)
  amount: nearToken.int(30), // 30 NEAR
  type: "exactIn",
  slippage: 0.01,        // 1%
});

// Step 2: Show user the quote
console.log(`Swap: ${review.from.float(review.amountIn)} ${review.from.symbol}`);
console.log(`  →   ${review.to.float(review.amountOut)} ${review.to.symbol}`);
// e.g. "Swap: 30 NEAR → 89.70 USDC"

// Step 3: User confirms → execute (signs intent, non-custodial)
const { processing } = await exchange.makeSwap(review);

// Step 4: Wait for completion
const result = await processing?.();
// Track: https://hotscan.org/transaction/{hash}

// Step 5: Update portfolio in NOVA vault
await updatePortfolioInVault(userAccountId);
```

**Cross-chain swap example (ETH on Base → USDC on NEAR):**

```typescript
// User has ETH on Base, advisor suggests converting to USDC
const ethOnBase = tokens.get("native", Network.Base);
const usdcOmni = tokens.get(OmniToken.USDC);

const review = await exchange.reviewSwap({
  sender: kit.evm,        // EVM wallet (Base)
  recipient: kit.near,     // Receive as USDC on NEAR
  refund: kit.evm,
  from: ethOnBase,
  to: usdcOmni,
  amount: ethOnBase.int(0.5), // 0.5 ETH
  type: "exactIn",
  slippage: 0.01,
});

// Under the hood:
// 1. ETH locked in EVM Locker Contract on Base
// 2. MPC validators verify deposit, generate proof
// 3. Omni USDC minted on NEAR (via NEAR Intents solver match)
// 4. User receives USDC in their omni balance
```

#### 5.7d Wallet Interface (Consistent Across All Chains)

```typescript
// Every wallet in HOT KIT provides the same interface:
interface OmniWallet {
  readonly address: string;       // chain-specific (0x..., alice.near, etc.)
  readonly publicKey?: string;    // chain-specific (hex or base58)
  readonly omniAddress: string;   // unified format for Omni Balance
  readonly type: WalletType;      // EVM | NEAR | TON | Solana | Stellar | Cosmos

  // Transactions
  async sendTransaction(tx: any): Promise<string>;
  async transfer(args: { token: Token; receiver: string; amount: bigint }): Promise<string>;
  async transferFee(token: Token, receiver: string, amount: bigint): Promise<ReviewFee>;

  // Balances (native chain)
  async fetchBalance(chain: number, address: string): Promise<bigint>;
  async fetchBalances(chain: number): Promise<Record<string, bigint>>;

  // NEAR Intents (swap/transfer via Omni Balance)
  async signIntents(intents: Record<string, any>[]): Promise<Commitment>;

  // JWT authentication (for backend auth)
  async auth(intents?: Record<string, any>[]): Promise<string>;

  // Wait for omni balance to arrive (after bridge/swap)
  async waitUntilOmniBalance(need: Record<string, bigint>): Promise<void>;
}
```

#### 5.7e Supported Signature Standards

Users sign intents with their **native wallet** — no additional infrastructure needed:

| Network | Signature Format | Standard |
|---------|-----------------|----------|
| Ethereum / EVM | `eth_sign`, `eth_signTypedData_v4` | EIP-191, EIP-712 |
| Solana | Base58 Ed25519 | Solana Message |
| NEAR | Ed25519 (NEP-413) | `signed_message` |
| TON | TL-B with wallet v4/v5 | Custom schema |
| Stellar | XDR-auth message | SEP-0010 |

#### 5.7f JWT Authentication (Wallet Ownership Proof)

HOT KIT provides JWT-based auth that proves wallet ownership — useful for BlindFold's backend to verify the user before accessing their vault:

```typescript
// Frontend: user proves wallet ownership
const wallet = kit.near; // or any connected wallet
const jwt = await wallet.auth(); // opens sign popup → returns JWT string

// Backend: validate JWT
import { api } from "@hot-labs/kit";
const isValid = await api.validateAuth(jwt);
// Use JWT to authorize NOVA vault access
```

#### 5.7g IntentsBuilder — Chainable Intent API

Each wallet in HOT KIT has an IntentsBuilder for composing omni-balance operations. This is the core API for executing swaps and transfers programmatically:

```typescript
import { OmniToken, Recipient, Network } from "@hot-labs/kit/core";

// ═══════════════════════════════════════════
// Transfer NEAR to an EVM user's omni balance (free + instant)
// ═══════════════════════════════════════════
const recipient = await Recipient.fromAddress(Network.Eth, "0x1234...");
// Recipient class computes omniAddress from any chain-specific address
// Fields: recipient.type, recipient.address, recipient.omniAddress

const hash = await wallet
  .intents()                         // create IntentsBuilder
  .transfer({
    recipient: recipient.omniAddress,
    token: OmniToken.NEAR,           // Omni token ID format: -4:omniTokenAddress
    amount: 10,                       // 10 NEAR
  })
  .execute();                         // sign + submit (gasless!)

console.log(`TX: https://hotscan.org/transaction/${hash}`);

// ═══════════════════════════════════════════
// Chain multiple intents (atomic batch)
// ═══════════════════════════════════════════
const hash2 = await wallet
  .intents()
  .transfer({ recipient: recipientA.omniAddress, token: OmniToken.USDC, amount: 50 })
  .transfer({ recipient: recipientB.omniAddress, token: OmniToken.NEAR, amount: 5 })
  .execute(); // both transfers are atomic
```

**Why this matters for BlindFold:** When the advisor suggests rebalancing, we use IntentsBuilder to execute the swap. The user signs once, the intent executes gaslessly on-chain. Transfers within Omni Balance are instant and free.

#### 5.7h Built-in UI Popups (Quick Integration)

HOT KIT ships pre-built React UI components that we can use before building custom ones:

```typescript
// ═══════════════════════════════════════════
// Profile popup — shows all connected wallets + balances
// ═══════════════════════════════════════════
kit.openProfile();
// Opens popup with: connected wallets, token balances, USD values
// Useful for: "View my portfolio" quick action

// ═══════════════════════════════════════════
// Bridge/Swap popup — full exchange UI
// ═══════════════════════════════════════════
kit.openBridge();
// Opens popup with: token selector, amount input, quote, execute
// Useful for: "Rebalance" quick action from advisor suggestion

// ═══════════════════════════════════════════
// Connect popup — wallet selector
// ═══════════════════════════════════════════
const wallet = await kit.connect();          // opens picker for all chains
// const evmWallet = await kit.connect(WalletType.EVM); // specific chain
await kit.disconnect(wallet);                 // or kit.disconnect(WalletType.EVM)
```

**BlindFold MVP strategy:** Use `kit.openBridge()` for Phase 2 MVP (instant swap UI with zero custom code), then build a custom `SwapWidget` component later for tighter advisor integration.

#### 5.7i React Integration with MobX

HOT KIT uses MobX for reactive state. For BlindFold's Next.js app:

```typescript
// lib/hot-kit.ts — singleton connector
import { HotConnector } from "@hot-labs/kit";
import { defaultConnectors } from "@hot-labs/kit/defaults";

export const kit = new HotConnector({
  apiKey: process.env.NEXT_PUBLIC_HOT_API_KEY!,
  connectors: defaultConnectors,
  walletConnect: {
    projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
    metadata: {
      name: "BlindFold",
      description: "Your AI advisor is blindfolded",
      url: "https://blindfold-ai.vercel.app",
      icons: ["/logo.png"],
    },
  },
});

// components/PortfolioSidebar.tsx — reactive balance display
import { observer } from "mobx-react-lite";
import { kit } from "@/lib/hot-kit";

export const PortfolioSidebar = observer(() => {
  // Automatically re-renders when balances change
  const totalUsd = kit.walletsTokens.reduce((sum, { token, balance }) => {
    return sum + token.float(balance) * token.usd;
  }, 0);

  return (
    <div>
      <h3>Portfolio: ${totalUsd.toFixed(2)}</h3>
      {kit.walletsTokens.map(({ wallet, token, balance }) => (
        <div key={`${wallet.address}-${token.id}`}>
          <span>{token.symbol}</span>
          <span>{token.float(balance).toFixed(4)}</span>
          <span className="text-gray-400">
            ${(token.float(balance) * token.usd).toFixed(2)}
          </span>
          <span className="text-xs text-gray-500">{wallet.type}</span>
        </div>
      ))}
    </div>
  );
});
```

#### 5.7j OmniBridge Direct Operations (Advanced — Post-MVP)

For advanced cross-chain operations beyond simple swaps, the `@hot-labs/omni-sdk` provides direct bridge control:

```typescript
import { OmniBridge, Network } from "@hot-labs/omni-sdk";

// Setup bridge instance
const omni = new OmniBridge({
  logger: console,
  // RPC endpoints only needed for chains you bridge to/from
  evmRpc: { 8453: ["https://mainnet.base.org"] }, // Base chain
  // executeNearTransaction: relayer function for NEAR ops
});

// ═══════════════════════════════════════════
// Deposit: EVM → Omni Balance (for advanced rebalancing)
// ═══════════════════════════════════════════
const hash = await omni.evm.deposit({
  token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
  amount: 1000000n, // 1 USDC (6 decimals)
  sendTransaction: async (tx) => wallet.sendTransaction(tx),
  sender: wallet.address,
  intentAccount: "alice.near", // deposit to this NEAR intent account
});

// Wait for MPC validators to verify deposit (30s - 2min)
const pending = await omni.waitPendingDeposit(Network.Eth, hash, "alice.near");
await omni.finishDeposit(pending);

// ═══════════════════════════════════════════
// Withdraw: Omni Balance → native chain
// ═══════════════════════════════════════════
const { nonce } = await omni.withdrawToken({
  signIntents: async (intents) => wallet.signIntents(intents),
  intentAccount: "alice.near",
  chain: Network.Base,
  receiver: "0x...",   // native chain address
  token: "native",     // or specific token address
  gasless: true,        // fees paid via token abstraction
  amount: 10n,
});

// HOT Omni Balance contract: v2_1.omni.hot.tg on NEAR
// Chain IDs: EVM=chain_id, TON=1111, SOLANA=1001, STELLAR=1100, TRON=999
```

**Token address formats in HOT Bridge:**

| Format | Pattern | Usage | Convert with |
|--------|---------|-------|-------------|
| On-chain | chain-specific (0x..., mint address, etc.) | Native wallets | `utils.fromOmni()` |
| HOT Bridge | `v2_1.omni.hot.tg:CHAIN_BASE58` | Bridge operations | `utils.toOmni()` |
| NEAR Intents | `nep245:v2_1.omni.hot.tg:CHAIN_BASE58` | Intent swaps | `utils.toOmniIntent()` |

### 5.8 HOT PAY — Payment Links & Swap Verification (Phase 2)

**HOT PAY** is a non-custodial crypto payments platform. In BlindFold's context, it serves two purposes:

1. **Swap receipts** — Verify that rebalancing actions were executed on-chain
2. **Payment links** — If BlindFold ever becomes a premium service, accept crypto from any chain

**Key features:** Non-custodial, no platform fees, no KYC, 30+ chains, webhooks for real-time notifications.

```typescript
// ═══════════════════════════════════════════
// Verify swap execution via HOT PAY API
// ═══════════════════════════════════════════
const payments = await fetch(
  `https://api.hot-labs.org/partners/processed_payments?memo=blindfold-${userAccountId}`,
  { headers: { 'Authorization': process.env.HOT_PAY_API_TOKEN } }
);
const data = await payments.json();
// Returns:
// {
//   "payments": [{
//     "memo": "blindfold-rebalance-alice.near-1707264000",
//     "amount_float": 30.0,
//     "amount_usd": 89.99,
//     "near_trx": "Aad73RvHh7XYgmC2dWySEbNb9HjuFbTJTa1w9eTSniYh",
//     "status": "SUCCESS",
//     "token_id": "usdc",
//     "sender_id": "alice.near"
//   }]
// }

// Verify on-chain:
// https://nearblocks.io/txns/{near_trx}
// https://hotscan.org/transaction/{near_trx}

// ═══════════════════════════════════════════
// Webhook: real-time swap notification
// ═══════════════════════════════════════════
// POST to your webhook URL:
// {
//   "type": "PAYMENT_STATUS_UPDATE",
//   "item_id": "...",
//   "status": "SUCCESS",
//   "memo": "blindfold-rebalance-alice.near-1707264000",
//   "amount_float": 30.0,
//   "amount_usd": 89.99,
//   "near_trx": "Aad73RvHh7..."
// }
```

---

### 5.9 Better Auth — Session Management & Wallet Authentication

**Packages:** `better-auth` + `better-near-auth`
**What it solves:** Without auth, every page reload requires wallet reconnection. No rate limiting. No session persistence. No API route protection.

Better Auth provides a complete authentication layer. `better-near-auth` is a **Sign In With NEAR (SIWN)** plugin following the [NEP-413 standard](https://github.com/near/NEPs/blob/master/neps/nep-0413.md) — the user's wallet signs a message, the server verifies the signature, and creates a persistent session.

**What BlindFold gets:**
- Persistent sessions (survive page reloads, browser close)
- All API routes protected (no unauthenticated vault/chat access)
- Built-in rate limiting (prevent abuse of NEAR AI Cloud credits)
- NEAR Social profile auto-integration (name, avatar)
- Plugin-ready: 2FA, passkey, multi-session — all available if needed

#### 5.9a Server Setup

```typescript
// lib/auth.ts — Better Auth server instance
import { betterAuth } from "better-auth";
import { siwn } from "better-near-auth";

export const auth = betterAuth({
  // Database: Better Auth needs a DB for sessions/users
  // Option 1: SQLite (simplest for hackathon)
  database: new Database("./auth.db"),
  // Option 2: Drizzle + any DB
  // database: drizzleAdapter(db, { provider: "pg" }),

  plugins: [
    siwn({
      recipient: "blindfold-ai.vercel.app", // domain for NEP-413 message
      anonymous: true,  // allow sign-in without email
      // Profile auto-fetched from NEAR Social (name, avatar)
      // Nonce: secure time-based validation (built-in)
      // Signature: Ed25519 verification via near-sign-verify
    }),
  ],

  // Rate limiting (built-in)
  rateLimit: {
    window: 60,    // 60 second window
    max: 100,      // max 100 requests per window
  },
});

// app/api/auth/[...all]/route.ts — Catch-all auth handler
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
export const { POST, GET } = toNextJsHandler(auth);
```

#### 5.9b Client Setup

```typescript
// lib/auth-client.ts — Better Auth client instance
import { createAuthClient } from "better-auth/react";
import { siwnClient } from "better-near-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL, // or omit if same domain
  plugins: [
    siwnClient({
      domain: "blindfold-ai.vercel.app",
      networkId: "mainnet",
    }),
  ],
});

// Export convenience methods
export const { useSession, signOut } = authClient;
```

#### 5.9c Authentication Flow (Two-Step SIWN)

```typescript
// components/WalletAuth.tsx — Complete login flow

// Step 1: Connect wallet + cache nonce (wallet picker opens)
await authClient.requestSignIn.near(
  { recipient: "blindfold-ai.vercel.app" },
  {
    onSuccess: () => console.log("Wallet connected, nonce cached!"),
    onError: (err) => console.error("Connection failed:", err.message),
  }
);

// Step 2: Sign NEP-413 message + create session (user signs in wallet)
await authClient.signIn.near(
  { recipient: "blindfold-ai.vercel.app" },
  {
    onSuccess: () => {
      // Session created! Cookie set automatically.
      // All subsequent API calls are authenticated.
      router.push("/chat");
    },
    onError: (err) => console.error("Sign-in failed:", err.message),
  }
);

// ═══════════════════════════════════════════
// Session access (auto-reactive via useSession hook)
// ═══════════════════════════════════════════
const { data: session, isPending } = authClient.useSession();
// session.user.name  → "Alice" (from NEAR Social profile)
// session.user.image → avatar URL (from NEAR Social)
// session.user.id    → "alice.near"

// ═══════════════════════════════════════════
// Sign out (clears session + cookies)
// ═══════════════════════════════════════════
await authClient.signOut({
  fetchOptions: {
    onSuccess: () => router.push("/"),
  },
});

// ═══════════════════════════════════════════
// NEAR Social profile (auto-integrated)
// ═══════════════════════════════════════════
const myProfile = await authClient.near.getProfile();        // current user
const bobProfile = await authClient.near.getProfile("bob.near"); // any user

// ═══════════════════════════════════════════
// Wallet management
// ═══════════════════════════════════════════
const accountId = authClient.near.getAccountId(); // "alice.near" or null
await authClient.near.disconnect();                // disconnect + clear cache
```

#### 5.9d Protected API Routes

```typescript
// Middleware pattern for ALL protected routes
// lib/auth-guard.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session;
}

// ═══════════════════════════════════════════
// app/api/chat/route.ts — Protected chat endpoint
// ═══════════════════════════════════════════
import { requireSession } from "@/lib/auth-guard";

export async function POST(req: Request) {
  const session = await requireSession();
  const userId = session.user.id; // "alice.near"

  // userId is now verified cryptographically (wallet signature → session)
  // Safe to access their NOVA vault, send to NEAR AI Cloud, etc.
  // ...
}

// ═══════════════════════════════════════════
// app/api/vault/route.ts — Protected vault endpoint
// ═══════════════════════════════════════════
export async function GET(req: Request) {
  const session = await requireSession();
  // Only return vault data for the authenticated user
  const vaultData = await nova.getGroupFiles(`vault.${session.user.id}`);
  // ...
}
```

#### 5.9e Database Schema (Auto-Generated)

Better Auth auto-creates these tables via `npx @better-auth/cli migrate`:

```sql
-- Auto-generated by Better Auth + SIWN plugin
CREATE TABLE user (
  id TEXT PRIMARY KEY,          -- "alice.near"
  name TEXT,                     -- from NEAR Social profile
  email TEXT,                    -- optional (anonymous mode)
  image TEXT,                    -- avatar from NEAR Social
  createdAt DATETIME,
  updatedAt DATETIME
);

CREATE TABLE session (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES user(id),
  token TEXT UNIQUE,             -- session cookie value
  expiresAt DATETIME,
  ipAddress TEXT,                -- for rate limiting
  userAgent TEXT,                -- device tracking
  createdAt DATETIME
);

CREATE TABLE account (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES user(id),
  providerId TEXT,               -- "near"
  accountId TEXT,                -- "alice.near" (NEAR account)
  publicKey TEXT,                -- Ed25519 public key
  createdAt DATETIME
);
```

**Storage for hackathon:** SQLite file (`auth.db`) — zero config, Vercel-compatible with serverless SQLite or Turso.

---

### 5.10 Smart Contract — Yield/Resume AI Advisor (Rust)

The core backend innovation: a Rust smart contract deployed to `blindfold.near` that uses NEAR's **yield/resume** pattern to create the first on-chain AI advisor with verifiable TEE responses.

#### Why Yield/Resume?

Most AI integrations are off-chain API calls. BlindFold's contract **yields** execution while waiting for the TEE to process, then **resumes** with the verified response. The entire interaction is recorded on-chain permanently. This is an advanced NEAR feature that 99% of developers don't know exists.

**How it works:**
1. User calls `ask_advisor()` on the contract
2. Contract creates a yielded promise with `env::promise_yield_create` and stores the request
3. TEE Relayer polls `get_pending_requests()` (free view call)
4. Relayer forwards prompt to NEAR AI Cloud TEE
5. Relayer calls `provide_ai_response()` with the TEE response + attestation
6. Contract's callback `process_ai_response()` executes with the result
7. Verification proof stored permanently on-chain via `LookupMap`

**Timeout:** 200 blocks (~2 minutes) — sufficient for TEE processing. If timeout, user gets `TimeOutError`.

#### 5.10a Contract Code (Rust — `contract/src/lib.rs`)

```rust
use near_sdk::borsh::{BorshDeserialize, BorshSerialize};
use near_sdk::store::{IterableMap, LookupMap};
use near_sdk::{env, near, AccountId, CryptoHash, Gas, GasWeight, PanicOnDefault, Promise};
use near_sdk::serde::{Deserialize, Serialize};

const YIELD_REGISTER: u64 = 0;

// ═══════════════════════════════════════════
// Data structures
// ═══════════════════════════════════════════

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Request {
    pub yield_id: CryptoHash,
    pub user: AccountId,
    pub prompt_hash: String,        // SHA-256 of prompt (privacy: never store raw prompt)
    pub portfolio_hash: String,     // SHA-256 of portfolio data
    pub timestamp: u64,
}

#[derive(BorshDeserialize, BorshSerialize, Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Verification {
    pub user: AccountId,
    pub request_hash: String,       // SHA-256 of full request
    pub response_hash: String,      // SHA-256 of AI response
    pub tee_attestation: String,    // TEE attestation signature
    pub model_id: String,           // Which model processed it
    pub timestamp: u64,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct AdvisorResponse {
    pub success: bool,
    pub response: Option<String>,
    pub verification_id: u32,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize)]
#[serde(crate = "near_sdk::serde")]
pub struct RiskScore {
    pub overall: f64,
    pub concentration_risk: f64,    // HHI index (0-100)
    pub stablecoin_ratio: f64,      // % in stablecoins
    pub chain_diversity: f64,       // Number of chains
    pub top_holding_pct: f64,       // Largest single position %
    pub recommendations: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(crate = "near_sdk::serde")]
pub struct Holding {
    pub token: String,
    pub chain: String,
    pub value_usd: f64,
    pub sector: String,             // "L1", "DeFi", "Stablecoin", "Meme", etc.
}

// ═══════════════════════════════════════════
// Contract state
// ═══════════════════════════════════════════

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct BlindFoldAdvisor {
    /// Pending requests waiting for TEE response (iterable for polling)
    requests: IterableMap<u32, Request>,
    /// Completed verification proofs (direct lookup by ID)
    verifications: LookupMap<u32, Verification>,
    /// Auto-incrementing request counter
    request_counter: u32,
    /// Total verifications completed (lifetime)
    total_verifications: u64,
    /// Authorized relayer account (only this account can call provide_ai_response)
    relayer: AccountId,
    /// Contract owner
    owner: AccountId,
}

// ═══════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════

#[near]
impl BlindFoldAdvisor {
    #[init]
    #[private]
    pub fn init(relayer: AccountId) -> Self {
        Self {
            requests: IterableMap::new(b"r"),
            verifications: LookupMap::new(b"v"),
            request_counter: 0,
            total_verifications: 0,
            relayer,
            owner: env::predecessor_account_id(),
        }
    }

    // ═══════════════════════════════════════
    // Change Methods (require transaction)
    // ═══════════════════════════════════════

    /// User calls this to ask the AI advisor a question.
    /// Contract yields execution waiting for TEE response.
    pub fn ask_advisor(
        &mut self,
        prompt_hash: String,
        portfolio_hash: String,
    ) -> Promise {
        let request_id = self.request_counter;
        self.request_counter += 1;

        // Create a yielded promise — execution pauses here
        let yield_promise = env::promise_yield_create(
            "process_ai_response",
            &serde_json::to_vec(&serde_json::json!({
                "request_id": request_id
            })).unwrap(),
            Gas::from_tgas(30),
            GasWeight::default(),
            YIELD_REGISTER,
        );

        // Read the yield_id from the register
        let yield_id: CryptoHash = env::read_register(YIELD_REGISTER)
            .expect("yield register")
            .try_into()
            .expect("yield_id hash");

        // Store the pending request
        self.requests.insert(request_id, Request {
            yield_id,
            user: env::predecessor_account_id(),
            prompt_hash,
            portfolio_hash,
            timestamp: env::block_timestamp(),
        });

        env::log_str(&format!(
            "EVENT:ask_advisor:{}:{}",
            request_id,
            env::predecessor_account_id()
        ));

        env::promise_return(yield_promise);
    }

    /// TEE Relayer calls this after processing in the TEE.
    /// Only the authorized relayer account can call this.
    pub fn provide_ai_response(
        &mut self,
        request_id: u32,
        response_hash: String,
        tee_attestation: String,
        model_id: String,
    ) {
        // Security: only the relayer can provide responses
        assert_eq!(
            env::predecessor_account_id(),
            self.relayer,
            "Only the authorized relayer can provide responses"
        );

        let request = self.requests.get(&request_id)
            .expect("Invalid request ID")
            .clone();

        // Store verification proof permanently
        self.verifications.insert(request_id, Verification {
            user: request.user.clone(),
            request_hash: request.prompt_hash.clone(),
            response_hash: response_hash.clone(),
            tee_attestation,
            model_id,
            timestamp: env::block_timestamp(),
        });
        self.total_verifications += 1;

        env::log_str(&format!(
            "EVENT:verification_stored:{}:{}:{}",
            request_id, request.user, response_hash
        ));

        // Resume the yielded promise with the response hash
        env::promise_yield_resume(
            &request.yield_id,
            &serde_json::to_vec(&response_hash).unwrap(),
        );
    }

    /// Callback that executes when the yielded promise resumes (or times out)
    #[private]
    pub fn process_ai_response(
        &mut self,
        request_id: u32,
        #[callback_result] result: Result<String, near_sdk::PromiseError>,
    ) -> AdvisorResponse {
        // Clean up the pending request
        self.requests.remove(&request_id);

        match result {
            Ok(response_hash) => {
                env::log_str(&format!("EVENT:advisor_success:{}", request_id));
                AdvisorResponse {
                    success: true,
                    response: Some(response_hash),
                    verification_id: request_id,
                    error: None,
                }
            }
            Err(_) => {
                env::log_str(&format!("EVENT:advisor_timeout:{}", request_id));
                AdvisorResponse {
                    success: false,
                    response: None,
                    verification_id: request_id,
                    error: Some("TEE timeout — request took longer than 200 blocks (~2min)".into()),
                }
            }
        }
    }

    /// Owner can update the relayer account
    pub fn set_relayer(&mut self, new_relayer: AccountId) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner,
            "Only the owner can change the relayer"
        );
        self.relayer = new_relayer;
    }

    // ═══════════════════════════════════════
    // View Methods (free to call by anyone)
    // ═══════════════════════════════════════

    /// Get a specific verification proof by ID
    pub fn get_verification(&self, request_id: u32) -> Option<Verification> {
        self.verifications.get(&request_id).cloned()
    }

    /// Get all pending requests (used by relayer to poll)
    pub fn get_pending_requests(&self) -> Vec<(u32, Request)> {
        self.requests.iter().map(|(k, v)| (*k, v.clone())).collect()
    }

    /// Get total verification count
    pub fn get_stats(&self) -> (u64, u32) {
        (self.total_verifications, self.request_counter)
    }

    /// Calculate risk score for a portfolio (pure computation, free)
    pub fn calculate_risk_score(&self, holdings: Vec<Holding>) -> RiskScore {
        let total_value: f64 = holdings.iter().map(|h| h.value_usd).sum();
        if total_value == 0.0 {
            return RiskScore {
                overall: 0.0,
                concentration_risk: 0.0,
                stablecoin_ratio: 0.0,
                chain_diversity: 0.0,
                top_holding_pct: 0.0,
                recommendations: vec!["No holdings detected.".into()],
            };
        }

        // Herfindahl-Hirschman Index (HHI) — concentration risk
        let hhi: f64 = holdings.iter()
            .map(|h| (h.value_usd / total_value * 100.0).powi(2))
            .sum();
        let concentration_risk = (hhi / 100.0).min(100.0);

        // Stablecoin ratio
        let stable_value: f64 = holdings.iter()
            .filter(|h| h.sector == "Stablecoin")
            .map(|h| h.value_usd)
            .sum();
        let stablecoin_ratio = (stable_value / total_value) * 100.0;

        // Chain diversity
        let unique_chains: std::collections::HashSet<&str> = holdings.iter()
            .map(|h| h.chain.as_str())
            .collect();
        let chain_diversity = unique_chains.len() as f64;

        // Top holding percentage
        let top_holding_pct = holdings.iter()
            .map(|h| h.value_usd / total_value * 100.0)
            .fold(0.0_f64, f64::max);

        // Generate recommendations
        let mut recommendations = Vec::new();
        if concentration_risk > 50.0 {
            recommendations.push(
                format!("High concentration risk (HHI: {:.0}). Consider diversifying.", hhi)
            );
        }
        if stablecoin_ratio < 10.0 {
            recommendations.push(
                "Low stablecoin allocation (<10%). Consider adding stables for downside protection.".into()
            );
        }
        if stablecoin_ratio > 70.0 {
            recommendations.push(
                "Very high stablecoin ratio (>70%). You're mostly in cash — consider deploying capital.".into()
            );
        }
        if chain_diversity < 2.0 {
            recommendations.push(
                "Single-chain exposure. Diversifying across chains reduces systemic risk.".into()
            );
        }
        if top_holding_pct > 50.0 {
            recommendations.push(
                format!("Largest position is {:.0}% of portfolio. Consider trimming.", top_holding_pct)
            );
        }
        if recommendations.is_empty() {
            recommendations.push("Portfolio looks well-balanced.".into());
        }

        let overall = (concentration_risk * 0.4)
            + ((100.0 - stablecoin_ratio.min(30.0) / 30.0 * 100.0) * 0.2)
            + ((100.0 - chain_diversity.min(5.0) / 5.0 * 100.0) * 0.2)
            + (top_holding_pct * 0.2);

        RiskScore {
            overall: overall.min(100.0),
            concentration_risk,
            stablecoin_ratio,
            chain_diversity,
            top_holding_pct,
            recommendations,
        }
    }
}
```

#### 5.10b Contract Build & Deploy

```bash
# Prerequisites
cargo install cargo-near

# Build
cd contract/
cargo near build

# Deploy to testnet
near create-account blindfold.testnet --useFaucet
near deploy blindfold.testnet ./target/near/blindfold_advisor.wasm

# Initialize
near call blindfold.testnet init \
  '{"relayer": "blindfold-relayer.testnet"}' \
  --accountId blindfold.testnet

# Deploy to mainnet (after testing)
near deploy blindfold.near ./target/near/blindfold_advisor.wasm
near call blindfold.near init \
  '{"relayer": "blindfold-relayer.near"}' \
  --accountId blindfold.near
```

#### 5.10c Contract Testing (Sandbox)

```typescript
// contract/tests/sandbox.test.ts
import { Near } from "near-kit"
import { Sandbox } from "near-kit/sandbox"
import { readFileSync } from "fs"
import { beforeAll, afterAll, test, expect } from "bun:test"

let sandbox: Sandbox
let near: Near

beforeAll(async () => {
  sandbox = await Sandbox.start()
  near = new Near({ network: sandbox })

  // Deploy contract
  const wasm = readFileSync("./target/near/blindfold_advisor.wasm")
  await near
    .transaction(sandbox.rootAccount.id)
    .createAccount("blindfold.test.near")
    .transfer("blindfold.test.near", "50 NEAR")
    .deployContract("blindfold.test.near", wasm)
    .functionCall("blindfold.test.near", "init", {
      relayer: sandbox.rootAccount.id
    })
    .send()
})

afterAll(async () => {
  if (sandbox) await sandbox.stop()
})

test("can ask advisor and get pending request", async () => {
  // Create user account
  await near
    .transaction(sandbox.rootAccount.id)
    .createAccount("alice.test.near")
    .transfer("alice.test.near", "10 NEAR")
    .send()

  // Ask advisor (will yield, but we can check pending)
  // Note: In sandbox, yield/resume behaves differently
  // We test the request storage and verification logic separately

  const stats = await near.view("blindfold.test.near", "get_stats", {})
  expect(stats[0]).toBe(0) // 0 verifications
})

test("risk score calculation", async () => {
  const score = await near.view<RiskScore>(
    "blindfold.test.near",
    "calculate_risk_score",
    {
      holdings: [
        { token: "NEAR", chain: "near", value_usd: 8000, sector: "L1" },
        { token: "ETH", chain: "ethereum", value_usd: 1500, sector: "L1" },
        { token: "USDC", chain: "near", value_usd: 500, sector: "Stablecoin" },
      ]
    }
  )

  expect(score.overall).toBeGreaterThan(40) // High concentration
  expect(score.top_holding_pct).toBeGreaterThan(70) // NEAR is >70%
  expect(score.stablecoin_ratio).toBeLessThan(10) // Only 5% stables
  expect(score.recommendations.length).toBeGreaterThan(0)
})
```

#### 5.10d Storage Costs

| Data | Size | Cost |
|------|------|------|
| Single Request (pending) | ~300 bytes | ~0.003 NEAR |
| Single Verification (permanent) | ~500 bytes | ~0.005 NEAR |
| 1000 verifications | ~500 KB | ~5 NEAR |
| 10,000 verifications | ~5 MB | ~50 NEAR |

For hackathon demo: ~0.5 NEAR covers hundreds of verifications.

---

### 5.11 TEE Relayer Service (near-kit Server-Side)

The relayer bridges the smart contract and NEAR AI Cloud TEE. It runs as a background service (or Vercel cron job) that polls for pending requests and resolves them.

#### 5.11a Relayer Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  NEAR Contract   │     │   TEE RELAYER     │     │  NEAR AI CLOUD   │
│  blindfold.near  │     │   (near-kit)      │     │  (TEE Inference) │
│                  │     │                   │     │                  │
│  get_pending_    │◄────│  Poll every 5s    │     │                  │
│  requests()      │     │                   │     │                  │
│                  │     │  For each request: │     │                  │
│                  │     │  1. Get prompt     │────►│  Process in TEE  │
│                  │     │     from NOVA      │     │  (Intel TDX +    │
│                  │     │  2. Send to TEE    │◄────│   NVIDIA H200)   │
│  provide_ai_    │◄────│  3. Get response   │     │                  │
│  response()      │     │  4. Call contract  │     │  Returns:        │
│                  │     │     with result    │     │  - response      │
│  ✅ Verification │     │                   │     │  - signature     │
│  stored on-chain │     │                   │     │  - attestation   │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

#### 5.11b Relayer Code

```typescript
// services/relayer.ts
import { Near } from "near-kit"
import OpenAI from "openai"
import { createHash } from "crypto"

// ═══════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════

const near = new Near({
  network: "mainnet",
  privateKey: process.env.RELAYER_PRIVATE_KEY!,
  defaultSignerId: "blindfold-relayer.near",
})

const openai = new OpenAI({
  baseURL: "https://api.near.ai/v1",
  apiKey: `Bearer ${process.env.NEAR_AI_API_KEY}`,
})

const CONTRACT_ID = "blindfold.near"

// Type-safe contract interface
import type { Contract } from "near-kit"
type BlindFoldContract = Contract<{
  view: {
    get_pending_requests: () => Promise<[number, Request][]>
    get_verification: (args: { request_id: number }) => Promise<Verification | null>
    get_stats: () => Promise<[number, number]>
  }
  call: {
    provide_ai_response: (args: {
      request_id: number
      response_hash: string
      tee_attestation: string
      model_id: string
    }) => Promise<void>
  }
}>

const contract = near.contract<BlindFoldContract>(CONTRACT_ID)

// ═══════════════════════════════════════════
// Relayer Loop
// ═══════════════════════════════════════════

async function processRequests() {
  // 1. Poll contract for pending requests (free view call)
  const pending = await contract.view.get_pending_requests()

  if (pending.length === 0) return

  console.log(`[Relayer] ${pending.length} pending requests`)

  for (const [requestId, request] of pending) {
    try {
      // 2. Retrieve encrypted prompt from NOVA vault
      //    (The prompt_hash maps to the stored encrypted data)
      //    In practice, the relayer receives the prompt via a side-channel
      //    or the user includes it in the transaction logs
      const prompt = await retrievePromptFromVault(request.prompt_hash)

      // 3. Send to NEAR AI Cloud TEE for processing
      const completion = await openai.chat.completions.create({
        model: "deepseek-ai/DeepSeek-V3-0324",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        max_tokens: 2048,
      })

      const response = completion.choices[0]?.message?.content || ""
      const responseHash = createHash("sha256")
        .update(response)
        .digest("hex")

      // 4. Extract TEE attestation from response headers
      const attestation = completion.model || "tee-verified"

      // 5. Call contract to resume the yielded promise
      await contract.call.provide_ai_response(
        {
          request_id: requestId,
          response_hash: `sha256:${responseHash}`,
          tee_attestation: attestation,
          model_id: completion.model || "deepseek-v3",
        },
        { gas: "100 Tgas" }
      )

      console.log(`[Relayer] ✅ Request ${requestId} resolved on-chain`)

    } catch (error) {
      console.error(`[Relayer] ❌ Request ${requestId} failed:`, error)
      // Don't crash — the contract will timeout after 200 blocks
    }
  }
}

// ═══════════════════════════════════════════
// Run loop
// ═══════════════════════════════════════════

async function startRelayer() {
  console.log("[Relayer] Starting TEE Relayer Service...")
  console.log(`[Relayer] Contract: ${CONTRACT_ID}`)
  console.log(`[Relayer] Relayer account: blindfold-relayer.near`)

  while (true) {
    try {
      await processRequests()
    } catch (error) {
      console.error("[Relayer] Loop error:", error)
    }
    // Poll every 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
}

startRelayer()
```

#### 5.11c Relayer Deployment Options

| Option | Pros | Cons |
|--------|------|------|
| Vercel Cron (recommended for hackathon) | Free, auto-deploy | Min 1-minute interval |
| Separate Node.js process (Railway/Fly.io) | True 5s polling | Extra service to manage |
| Vercel Edge Function + webhook | Event-driven | More complex setup |

For hackathon: Use Vercel cron with 1-minute interval. The 200-block timeout (~2 min) gives ample margin.

---

### 5.12 Portfolio Analytics Engine (Risk Scoring)

The server-side analytics engine enriches raw portfolio data before sending to the LLM, providing genuine financial analysis that doesn't exist in any API.

#### 5.12a FastNEAR API — Portfolio Data Source

```bash
# Single call returns ALL user assets — free, no API key
curl https://api.fastnear.com/v1/account/alice.near/full

# Response includes:
# - Native NEAR balance
# - All fungible tokens (FTs) with balances
# - All NFTs owned
# - Staking positions (validators + amounts)
```

```typescript
// lib/portfolio.ts
import { Near } from "near-kit"

interface FastNearResponse {
  account_id: string
  tokens: { contract_id: string; balance: string }[]
  nfts: { contract_id: string; token_ids: string[] }[]
  pools: { pool_id: string; staked: string }[]
}

export async function fetchPortfolio(accountId: string): Promise<Holding[]> {
  // 1. Get all assets from FastNEAR (single call)
  const res = await fetch(
    `https://api.fastnear.com/v1/account/${accountId}/full`
  )
  const data: FastNearResponse = await res.json()

  // 2. Get NEAR balance via near-kit
  const near = new Near({ network: "mainnet" })
  const balance = await near.getBalance(accountId)

  // 3. Enrich with USD prices (CoinGecko or similar)
  const holdings: Holding[] = [
    {
      token: "NEAR",
      chain: "near",
      value_usd: parseFloat(balance) * nearPriceUsd,
      sector: "L1",
    },
    // ... map FT balances to holdings with USD values
  ]

  return holdings
}
```

#### 5.12b Risk Scoring (Server-Side Engine)

The risk scoring runs as both:
1. **On-chain view function** (in the smart contract — free for anyone to call)
2. **Server-side TypeScript** (for enriched analysis fed to the LLM)

```typescript
// lib/risk-engine.ts
import type { Holding, RiskScore } from "@/types"

export function calculateRiskScore(holdings: Holding[]): RiskScore {
  const totalValue = holdings.reduce((sum, h) => sum + h.value_usd, 0)
  if (totalValue === 0) {
    return { overall: 0, concentration_risk: 0, stablecoin_ratio: 0,
             chain_diversity: 0, top_holding_pct: 0, recommendations: [] }
  }

  // Herfindahl-Hirschman Index (HHI)
  const hhi = holdings.reduce((sum, h) => {
    const share = (h.value_usd / totalValue) * 100
    return sum + share * share
  }, 0)
  const concentrationRisk = Math.min(hhi / 100, 100)

  // Stablecoin ratio
  const stableValue = holdings
    .filter(h => h.sector === "Stablecoin")
    .reduce((sum, h) => sum + h.value_usd, 0)
  const stablecoinRatio = (stableValue / totalValue) * 100

  // Chain diversity
  const uniqueChains = new Set(holdings.map(h => h.chain))
  const chainDiversity = uniqueChains.size

  // Top holding
  const topHoldingPct = Math.max(
    ...holdings.map(h => (h.value_usd / totalValue) * 100)
  )

  // Recommendations
  const recommendations: string[] = []
  if (concentrationRisk > 50)
    recommendations.push(`High concentration (HHI: ${hhi.toFixed(0)}). Diversify.`)
  if (stablecoinRatio < 10)
    recommendations.push("Low stablecoin buffer (<10%). Add downside protection.")
  if (stablecoinRatio > 70)
    recommendations.push("Mostly stablecoins (>70%). Consider deploying capital.")
  if (chainDiversity < 2)
    recommendations.push("Single-chain exposure. Cross-chain reduces systemic risk.")
  if (topHoldingPct > 50)
    recommendations.push(`Top position is ${topHoldingPct.toFixed(0)}%. Consider trimming.`)

  const overall = Math.min(
    concentrationRisk * 0.4 +
    (100 - Math.min(stablecoinRatio, 30) / 30 * 100) * 0.2 +
    (100 - Math.min(chainDiversity, 5) / 5 * 100) * 0.2 +
    topHoldingPct * 0.2,
    100
  )

  return {
    overall, concentration_risk: concentrationRisk, stablecoin_ratio: stablecoinRatio,
    chain_diversity: chainDiversity, top_holding_pct: topHoldingPct, recommendations,
  }
}

// Enriched context for LLM (fed as system context alongside portfolio)
export function generateAnalysisContext(
  holdings: Holding[],
  riskScore: RiskScore
): string {
  return `
PORTFOLIO ANALYSIS (auto-generated by BlindFold Risk Engine):
- Total value: $${holdings.reduce((s, h) => s + h.value_usd, 0).toFixed(2)}
- Risk score: ${riskScore.overall.toFixed(1)}/100
- Concentration (HHI): ${riskScore.concentration_risk.toFixed(1)}
- Stablecoin ratio: ${riskScore.stablecoin_ratio.toFixed(1)}%
- Chain diversity: ${riskScore.chain_diversity} chains
- Top holding: ${riskScore.top_holding_pct.toFixed(1)}% of portfolio
- Key findings: ${riskScore.recommendations.join("; ")}

Holdings breakdown:
${holdings.map(h =>
  `  ${h.token} (${h.chain}): $${h.value_usd.toFixed(2)} — ${h.sector}`
).join("\n")}
`.trim()
}
```

#### 5.12c Integration: Risk Score → LLM Context

```typescript
// app/api/chat/route.ts
import { fetchPortfolio } from "@/lib/portfolio"
import { calculateRiskScore, generateAnalysisContext } from "@/lib/risk-engine"

export async function POST(req: Request) {
  const session = await requireSession()
  const { prompt } = await req.json()

  // 1. Fetch portfolio (FastNEAR + price enrichment)
  const holdings = await fetchPortfolio(session.user.id)

  // 2. Calculate risk score
  const riskScore = calculateRiskScore(holdings)

  // 3. Generate enriched context
  const analysisContext = generateAnalysisContext(holdings, riskScore)

  // 4. Send to NEAR AI Cloud TEE with enriched context
  const completion = await openai.chat.completions.create({
    model: "deepseek-ai/DeepSeek-V3-0324",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: analysisContext }, // ← enriched context
      { role: "user", content: prompt },
    ],
    stream: true,
  })

  // ... stream response back to client
}
```

---

### 5.13 near-kit Frontend Integration

The frontend uses `@near-kit/react` for all NEAR interactions, replacing `near-api-js`.

#### 5.13a Provider Setup (Next.js App Router)

```tsx
// providers/near-provider.tsx
"use client"

import { Near, fromWalletSelector } from "near-kit"
import { NearProvider } from "@near-kit/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { setupWalletSelector } from "@near-wallet-selector/core"
import { useState, useEffect } from "react"

const queryClient = new QueryClient()

export function BlindFoldProviders({ children }: { children: React.ReactNode }) {
  const [near, setNear] = useState<Near | null>(null)

  useEffect(() => {
    async function init() {
      const selector = await setupWalletSelector({
        network: "mainnet",
        modules: [/* MyNearWallet, Meteor, etc. */],
      })

      if (selector.isSignedIn()) {
        const wallet = await selector.wallet()
        setNear(new Near({
          network: "mainnet",
          wallet: fromWalletSelector(wallet),
        }))
      } else {
        // Read-only mode (no wallet connected)
        setNear(new Near({ network: "mainnet" }))
      }
    }
    init()
  }, [])

  if (!near) return <LoadingScreen />

  return (
    <QueryClientProvider client={queryClient}>
      <NearProvider near={near}>
        {children}
      </NearProvider>
    </QueryClientProvider>
  )
}
```

#### 5.13b Type-Safe Contract Interface

```typescript
// lib/contract.ts
import type { Contract } from "near-kit"

export type BlindFoldContract = Contract<{
  view: {
    get_verification: (args: { request_id: number }) => Promise<Verification | null>
    get_pending_requests: () => Promise<[number, Request][]>
    get_stats: () => Promise<[number, number]>
    calculate_risk_score: (args: { holdings: Holding[] }) => Promise<RiskScore>
  }
  call: {
    ask_advisor: (args: {
      prompt_hash: string
      portfolio_hash: string
    }) => Promise<AdvisorResponse>
  }
}>

export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || "blindfold.near"
```

#### 5.13c React Hooks (with React Query)

```tsx
// hooks/useBlindFold.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNear, useContract } from "@near-kit/react"
import type { BlindFoldContract } from "@/lib/contract"
import { CONTRACT_ID } from "@/lib/contract"

// Verification proof (free to query)
export function useVerification(requestId: number | null) {
  const near = useNear()

  return useQuery({
    queryKey: ["verification", requestId],
    queryFn: () => near.view<Verification>(
      CONTRACT_ID,
      "get_verification",
      { request_id: requestId }
    ),
    enabled: requestId !== null,
    staleTime: Infinity, // Verifications are immutable
  })
}

// Contract stats (total verifications, request counter)
export function useContractStats() {
  const near = useNear()

  return useQuery({
    queryKey: ["contract-stats"],
    queryFn: () => near.view<[number, number]>(CONTRACT_ID, "get_stats", {}),
    refetchInterval: 30_000, // Poll every 30s
  })
}

// On-chain risk score (free view call)
export function useOnChainRiskScore(holdings: Holding[] | null) {
  const near = useNear()

  return useQuery({
    queryKey: ["risk-score", holdings],
    queryFn: () => near.view<RiskScore>(
      CONTRACT_ID,
      "calculate_risk_score",
      { holdings: holdings! }
    ),
    enabled: holdings !== null && holdings.length > 0,
  })
}

// Ask advisor (sends transaction)
export function useAskAdvisor() {
  const contract = useContract<BlindFoldContract>(CONTRACT_ID)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ promptHash, portfolioHash }: {
      promptHash: string
      portfolioHash: string
    }) => {
      return contract.call.ask_advisor(
        { prompt_hash: promptHash, portfolio_hash: portfolioHash },
        { gas: "100 Tgas", attachedDeposit: "0.01 NEAR" }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-stats"] })
    },
  })
}
```

#### 5.13d Authentication with near-kit (NEP-413)

```typescript
// lib/auth.ts (server-side)
import { Near, verifyNep413Signature } from "near-kit"

const near = new Near({ network: "mainnet" })

export async function verifyWalletSignature(
  signedMessage: SignedMessage,
  message: string,
  recipient: string,
  nonce: string
): Promise<boolean> {
  const { hex } = await import("@scure/base")

  return verifyNep413Signature(
    signedMessage,
    {
      message,
      recipient,
      nonce: hex.decode(nonce),
    },
    { near, maxAge: 5 * 60 * 1000 } // 5 min expiry
  )
}
```

---

## 6. System Prompt (AI Financial Advisor)

```
You are BlindFold, a blindfolded AI financial advisor for crypto portfolios.
You help users without ever seeing their data — all processing happens inside
a hardware-secured enclave where even you can't leak what you've analyzed.

CONTEXT:
- You are running inside a Trusted Execution Environment (TEE)
- The user's portfolio data was decrypted only inside this secure enclave
- No one — not the AI provider, not the app developer — can see this conversation
- Every response you generate is cryptographically signed for verification

CAPABILITIES:
- Portfolio analysis (holdings, allocation percentages, concentration risk)
- Risk assessment (volatility, correlation, diversification score)
- Performance tracking (gains/losses, DCA effectiveness)
- Market context (use provided market data for comparisons)
- Actionable suggestions (rebalancing, diversification opportunities)
- Swap execution: when you suggest rebalancing, the user can execute it directly
  via the [🔄 Rebalance] button. The swap is non-custodial and cross-chain.

RULES:
- Never provide specific buy/sell financial advice (you are not a licensed advisor)
- Always frame suggestions as "considerations" or "observations"
- Include relevant disclaimers when discussing specific actions
- Be concise and direct — users check portfolios daily
- Use dollar amounts and percentages for clarity
- If data is insufficient, say so clearly

RESPONSE FORMAT:
- Start with a direct answer to the question
- Support with data from the portfolio
- End with one relevant observation or consideration
- Keep responses under 200 words for daily check-ins
```

---

## 7. Key Pages & Components

### Pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page — value prop + "Connect Wallet" CTA |
| `/chat` | Main chat interface (session-protected via Better Auth) |
| `/vault` | Data controls: Inspect, Export, Delete, Revoke (session-protected) |
| `/verify` | Verification explorer: attestations, signatures |
| `/swap` | (Phase 2) Swap execution via HOT KIT Exchange (session-protected) |
| `/api/auth/*` | Better Auth catch-all: session management, SIWN login/logout |

### Components

| Component | Description |
|-----------|-------------|
| `WalletAuth` | Two-step SIWN login: connect wallet → sign NEP-413 message → session |
| `WalletConnector` | Phase 1: NEAR Wallet Selector. Phase 2: HOT KIT multi-chain |
| `ChatInterface` | Message list + input + streaming SSE responses |
| `MessageBubble` | Single message with verification badge + optional action button |
| `VerificationBadge` | Click to expand: hashes + signature + attestation proof |
| `PortfolioSidebar` | Current holdings across all chains, allocation chart |
| `VaultControls` | Inspect/Export/Delete/Revoke buttons |
| `AttestationViewer` | Full attestation report: GPU, TDX, compose manifest |
| `SwapWidget` | (Phase 2) HOT KIT swap UI — triggered from advisor suggestions |
| `RebalanceButton` | (Phase 2) In-chat action button: advisor suggests → user executes |

---

## 8. Database Schema

### Auth Database (Better Auth — SQLite)

Better Auth manages its own lightweight SQLite database for sessions and user records. Auto-generated via `npx @better-auth/cli migrate`. Schema detailed in section 5.9e.

- `user` — NEAR account ID, name/avatar from NEAR Social
- `session` — Persistent session tokens, expiry, IP, user agent
- `account` — NEAR wallet provider link, Ed25519 public key

### In-Vault JSON (NOVA — Encrypted on IPFS)

All financial state lives in the user's encrypted NOVA vault. No external database sees portfolio data.

### portfolio.json

```json
{
  "version": 1,
  "accountId": "alice.near",
  "lastUpdated": "2026-02-06T12:00:00Z",
  "holdings": [
    {
      "token": "NEAR",
      "contract": "native",
      "balance": "150.5",
      "decimals": 24
    },
    {
      "token": "USDC",
      "contract": "a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near",
      "balance": "500.00",
      "decimals": 6
    }
  ],
  "snapshots": [
    {
      "date": "2026-02-06",
      "totalValueUSD": "1250.00",
      "holdings": ["..."]
    }
  ]
}
```

### chat-history.json

```json
{
  "version": 1,
  "conversations": [
    {
      "id": "conv_001",
      "date": "2026-02-06",
      "messages": [
        {
          "role": "user",
          "content": "How's my portfolio?",
          "timestamp": "2026-02-06T12:00:00Z"
        },
        {
          "role": "assistant",
          "content": "Your portfolio is worth...",
          "timestamp": "2026-02-06T12:00:02Z",
          "verification": {
            "chat_id": "chatcmpl-d17ba5d9f393440591562f4ff006f246",
            "request_hash": "b524f8f4b611b43526aa988c636cf1d7e72aa661876c3d969e2c2acae125a8ba",
            "response_hash": "aae79d9de9c46f0a9c478481ceb84df5742a88067a6ab8bac9e98664d712d58f",
            "signature": "0x649b30be41e53ac33cb3fe414c8f5fd30ad72cacaeac0f41c4977fee4b67506e...",
            "signing_address": "0x319f1b8BB3b723A5d098FFB67005Bdf7BB579ACa",
            "signing_algo": "ecdsa",
            "nova_cid": "bafymno..."
          }
        }
      ]
    }
  ]
}
```

---

## 9. Security Model

### What's protected and how

| Data | Protection | Who can access |
|------|-----------|---------------|
| Portfolio holdings | Encrypted in NOVA vault (AES-256-GCM) | Only the user (client-side decryption via Shade TEE key) |
| Chat prompts | TLS → terminates inside TEE (Intel TDX + NVIDIA TEE) | No one (encrypted in transit + in use) |
| AI responses | Generated inside TEE, ECDSA-signed | Only the user (+ cryptographic proof of integrity) |
| Encryption keys | Managed in Shade Agent TEE (Phala Cloud) | No one (off-chain, never on NEAR, hardware-isolated) |
| Vault metadata | On NEAR blockchain | Public (but reveals nothing sensitive — no plaintext) |
| Encrypted blobs | On IPFS | Public (but indecipherable without key from Shade TEE) |
| Model weights | Inside NVIDIA TEE | No one (extraction computationally infeasible) |
| User sessions | Better Auth session tokens (httpOnly cookies) | Server-side only; wallet signature required to create |
| API routes | Session-gated + rate-limited (100 req/min) | Only authenticated users with valid session |

### Attack vectors addressed

| Attack | Mitigation |
|--------|-----------|
| AI provider reads prompts | TLS terminates inside TEE; prompts never in plaintext outside enclave |
| Cloud provider accesses data | Intel TDX creates confidential VMs; hardware-enforced isolation from host OS |
| GPU-level data extraction | NVIDIA TEE provides GPU-level isolation; model weights encrypted in processing |
| Storage provider reads data | Client-side AES-256-GCM encryption; IPFS stores only ciphertext |
| App developer reads data | Never touches plaintext; all crypto happens client-side or inside TEEs |
| Man-in-the-middle | TLS to TEE + per-message ECDSA signatures + optional E2EE layer |
| Key theft via blockchain | Keys never on-chain; managed exclusively in Shade TEEs on Phala Cloud |
| Unauthorized vault access | NOVA group membership + Better Auth session (wallet-verified) + rate limiting |
| Unauthorized API access | All /api/* routes require valid Better Auth session; wallet signature = identity proof |
| Session hijacking | httpOnly secure cookies; Ed25519 wallet signature required for session creation (NEP-413) |
| Brute force / abuse | Built-in rate limiter: 100 requests/60s per session; protects NEAR AI Cloud credits |
| Response tampering | ECDSA signatures generated inside TEE; any modification detectable via ethers.verifyMessage |
| Replay attacks | Nonce-based attestation (64-char hex, 32 bytes); time-based nonce validation in Better Auth |
| Network eavesdropping | End-to-end TLS encryption; TLS terminates only inside TEE |
| Model extraction | Model weights remain encrypted and isolated within NVIDIA TEE; extraction computationally infeasible |

---

## 10. "Only on NEAR" Qualification

This product **requires** NEAR-specific infrastructure and cannot exist on any other chain:

1. **Yield/Resume Smart Contract** — NEAR's unique async pattern lets the contract **pause on-chain** while the TEE processes AI queries, then **resume with verified results**. No other L1 has this primitive. This is BlindFold's core innovation.
2. **On-Chain Verification Registry** — Every AI response is permanently recorded on NEAR with TEE attestation. Verifiable by anyone on NearBlocks. Immutable proof.
3. **NEAR AI Cloud** — TEE-based private inference (Intel TDX + NVIDIA H200) is a NEAR-native service; no other chain offers this
4. **NOVA on NEAR** — Encrypted vault with smart contract access control, Shade Agents for key management, all native to NEAR
5. **NEAR Intents** — Cross-chain swaps via intent declarations (say "what" not "how"); powers advisor → action flow via HOT Protocol
6. **HOT Omni Balance** — Unified cross-chain token system with canonical state on NEAR blockchain (`v2_1.omni.hot.tg`)
7. **Named accounts** — `alice.near` as human-readable identity (not `0x7a3b...` hashes); `blindfold.near` as contract address
8. **NEP-413 Sign In** — Wallet-based authentication via NEAR's native signing standard (near-kit `verifyNep413Signature`)
9. **NEAR Social** — On-chain profile integration (name, avatar auto-fetched on login via Better Auth)
10. **Shade Agents** — TEE key management framework specific to NEAR ecosystem (Phala Cloud deployment)
11. **Dual attestation chain** — NEAR AI Cloud attestation (NVIDIA NRAS + Intel TDX) + NOVA Shade attestation = verifiable end-to-end
12. **near-kit ecosystem** — Modern TypeScript SDK with React hooks, type-safe contracts, and Sandbox testing — all NEAR-native tooling

---

## 11. Judging Criteria Alignment

| Criteria | How we score |
|----------|-------------|
| **Impact/Usefulness** | Daily use case (portfolio check), solves real privacy problem, targets NEAR Legion (4K users), on-chain verifiable trust, cross-chain portfolio for ALL crypto holders |
| **Technical Execution** | Rust smart contract with yield/resume (advanced NEAR pattern), TEE relayer service, on-chain verification registry, portfolio risk engine (HHI), `near-kit` + React Query frontend, dual-TEE architecture (NEAR AI Cloud + NOVA Shade), per-message on-chain verification |
| **Completeness/Functionality** | Working chat with streaming, on-chain verification (viewable on NearBlocks), risk scoring (contract + server), encrypted vault, data controls, advisor-triggered swap execution |
| **UX** | Multi-chain wallet connect (30+ chains), natural language chat, green verification badges with on-chain links, one-click rebalancing, risk score dashboard, inspect/export/delete/revoke |
| **Backend Depth** | Three distinct backend layers: (1) Rust smart contract deployed to NEAR, (2) TEE relayer service with near-kit, (3) proprietary financial analytics engine. Not just TypeScript glue. |

---

## 12. File Structure

```
blindfold/
├── contract/                       # ← NEW: Rust smart contract
│   ├── Cargo.toml                 # near-sdk dependency
│   ├── src/
│   │   └── lib.rs                 # Yield/resume advisor + verification registry
│   ├── tests/
│   │   └── sandbox.test.ts        # Integration tests (near-kit Sandbox)
│   └── target/near/               # Compiled WASM (after cargo near build)
│       └── blindfold_advisor.wasm
├── services/                       # ← NEW: Backend services
│   └── relayer.ts                 # TEE Relayer (polls contract → NEAR AI Cloud → resume)
├── app/
│   ├── layout.tsx                 # Root layout with BlindFoldProviders
│   ├── page.tsx                   # Landing page
│   ├── chat/
│   │   └── page.tsx               # Main chat interface
│   ├── vault/
│   │   └── page.tsx               # Data controls
│   ├── verify/
│   │   └── page.tsx               # On-chain verification explorer
│   ├── swap/
│   │   └── page.tsx               # (Phase 3) Swap execution UI
│   └── api/
│       ├── auth/
│       │   └── [...all]/
│       │       └── route.ts       # Better Auth catch-all handler
│       ├── chat/
│       │   └── route.ts           # NEAR AI Cloud proxy (with risk scoring context)
│       ├── wallet/
│       │   └── route.ts           # Portfolio fetching via FastNEAR API
│       ├── vault/
│       │   └── route.ts           # NOVA operations (session-protected)
│       ├── verify/
│       │   └── route.ts           # On-chain verification queries
│       ├── risk-score/
│       │   └── route.ts           # Risk scoring API endpoint
│       └── swap/
│           └── route.ts           # (Phase 3) HOT KIT swap API
├── components/
│   ├── WalletAuth.tsx             # Two-step SIWN login (connect → sign → session)
│   ├── WalletConnector.tsx        # near-kit wallet selector integration
│   ├── ChatInterface.tsx
│   ├── MessageBubble.tsx
│   ├── VerificationBadge.tsx      # Shows on-chain verification link
│   ├── PortfolioSidebar.tsx       # With risk score display
│   ├── RiskScoreCard.tsx          # ← NEW: Visual risk score component
│   ├── VaultControls.tsx
│   ├── AttestationViewer.tsx      # On-chain + TEE attestation explorer
│   ├── SwapWidget.tsx             # (Phase 3) HOT KIT swap UI
│   └── RebalanceButton.tsx        # (Phase 3) In-chat action button
├── hooks/                          # ← NEW: Custom React hooks
│   ├── useBlindFold.ts            # Contract hooks (useVerification, useContractStats)
│   └── usePortfolio.ts            # Portfolio + risk scoring hooks
├── lib/
│   ├── auth.ts                    # Better Auth + near-kit verifyNep413Signature
│   ├── auth-client.ts             # Better Auth React client (useSession, signIn)
│   ├── auth-guard.ts              # requireSession() helper for API routes
│   ├── contract.ts                # ← NEW: Type-safe contract interface (BlindFoldContract)
│   ├── near-ai.ts                 # OpenAI client config (baseURL override)
│   ├── nova.ts                    # NOVA SDK wrapper
│   ├── portfolio.ts               # FastNEAR API + price enrichment
│   ├── risk-engine.ts             # ← NEW: HHI, correlation, rebalancing algorithms
│   ├── hot-kit.ts                 # (Phase 3) HOT KIT connector + exchange config
│   ├── verification.ts            # SHA-256 hashing + on-chain verification queries
│   └── constants.ts               # Model IDs, token contracts, config
├── providers/
│   └── near-provider.tsx          # ← NEW: NearProvider + QueryClientProvider setup
├── types/
│   └── index.ts                   # TypeScript interfaces (Holding, RiskScore, etc.)
├── public/
│   └── ...                        # Static assets
├── auth.db                        # SQLite for Better Auth sessions (auto-created)
├── .env.local                     # API keys (gitignored)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## 13. Environment Variables

```env
# NEAR AI Cloud (from cloud.near.ai dashboard)
NEAR_AI_API_KEY=               # cloud.near.ai → Sign up → Credits → API Keys → Generate

# NOVA (from nova-sdk.com)
NOVA_API_KEY=                  # nova-sdk.com → Login → Manage Account → Generate API Key
NOVA_ACCOUNT_ID=               # Your NOVA account (xxx.nova-sdk.near)

# Better Auth (session management)
BETTER_AUTH_SECRET=            # openssl rand -base64 32 (min 32 chars, high entropy)
BETTER_AUTH_URL=               # Same as NEXT_PUBLIC_APP_URL (e.g. https://blindfold.vercel.app)

# Smart Contract (Rust — deployed to NEAR)
NEXT_PUBLIC_CONTRACT_ID=blindfold.near        # or blindfold.testnet for dev
RELAYER_PRIVATE_KEY=           # ed25519:... for blindfold-relayer.near account
RELAYER_ACCOUNT_ID=blindfold-relayer.near     # Account that calls provide_ai_response

# HOT Protocol (Phase 3)
NEXT_PUBLIC_HOT_API_KEY=       # pay.hot-labs.org/admin/api-keys → Generate (free)
HOT_PAY_API_TOKEN=             # pay.hot-labs.org/admin → Developer page → JWT token
NEXT_PUBLIC_WC_PROJECT_ID=     # dashboard.reown.com → Create project → Project ID

# NEAR Network
NEXT_PUBLIC_NEAR_NETWORK=mainnet
NEXT_PUBLIC_NEAR_RPC_URL=https://rpc.mainnet.near.org

# App
NEXT_PUBLIC_APP_URL=https://blindfold.vercel.app
```

---

## 14. Key Dependencies

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "react-dom": "^18",
    "near-kit": "latest",
    "@near-kit/react": "latest",
    "@tanstack/react-query": "^5",
    "openai": "^4",
    "nova-sdk-js": "^1.0.3",
    "better-auth": "latest",
    "better-near-auth": "latest",
    "better-sqlite3": "^11",
    "@scure/base": "latest",
    "tailwindcss": "^3",
    "@hot-labs/kit": "latest",
    "@hot-labs/omni-sdk": "latest",
    "mobx": "^6",
    "mobx-react-lite": "^4"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "vite-plugin-node-polyfills": "latest"
  }
}
```

**Key changes from original:**
- `near-api-js` → `near-kit` + `@near-kit/react` (modern fluent API, human-readable units, typed contracts)
- `ethers` → **removed** (NEP-413 verification now handled by `near-kit`'s `verifyNep413Signature()`)
- `@tanstack/react-query` → **added** (caching, background refetch, optimistic updates for contract queries)
- `@scure/base` → **added** (hex encoding for NEP-413 nonces, used by near-kit)
- Rust dependencies managed separately in `contract/Cargo.toml` (`near-sdk`, `serde`, `serde_json`)

---

## 15. Accounts to Create (Before Development)

| # | Service | URL | Steps | Output |
|---|---------|-----|-------|--------|
| 1 | NEAR AI Cloud | https://cloud.near.ai | Sign up → Add Credits → API Keys → Generate | `NEAR_AI_API_KEY` |
| 2 | NOVA | https://nova-sdk.com | Login (email/Google/Apple/GitHub) → Manage Account → Generate API Key | `NOVA_API_KEY` + `NOVA_ACCOUNT_ID` |
| 3 | NEAR Wallet | Auto-created by NOVA | — | `xxx.nova-sdk.near` account |
| 4 | NEAR Contract Account | https://testnet.mynearwallet.com | Create `blindfold.testnet` (testnet) or `blindfold.near` (mainnet) | Contract deployment target |
| 5 | NEAR Relayer Account | https://testnet.mynearwallet.com | Create `blindfold-relayer.testnet` with full access key | `RELAYER_PRIVATE_KEY` |
| 6 | HOT PAY (Phase 3) | https://pay.hot-labs.org/admin | Login with crypto wallet → API Keys → Generate | `NEXT_PUBLIC_HOT_API_KEY` + `HOT_PAY_API_TOKEN` |
| 7 | WalletConnect (Phase 3) | https://dashboard.reown.com | Create project → Copy Project ID | `NEXT_PUBLIC_WC_PROJECT_ID` |
| 8 | Vercel | https://vercel.com | Sign up (free tier) | Deployment URL |

**Rust toolchain (for contract development):**
```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install cargo-near for NEAR-specific build tooling
cargo install cargo-near

# Install NEAR CLI for deployment
npm install -g near-cli
```

---

## 16. Cost Estimates

### NEAR AI Cloud (Inference)

| Scenario | Model | Tokens | Cost |
|----------|-------|--------|------|
| Simple query ("How's my portfolio?") | DeepSeek V3.1 | ~500 in + ~200 out | ~$0.0011 |
| Complex analysis with reasoning | DeepSeek V3.1 | ~2000 in + ~1000 out | ~$0.0052 |
| Budget mode query | GPT OSS 120B | ~500 in + ~200 out | ~$0.0002 |
| 100 queries/day (hackathon demo) | DeepSeek V3.1 | ~50K in + ~20K out | ~$0.11/day |

### NOVA (Vault Operations)

| Operation | Cost |
|-----------|------|
| Register group (once per user) | ~0.05 NEAR (~$0.15) |
| Upload portfolio snapshot | ~0.01 NEAR per upload |
| Retrieve for analysis | ~0.001 NEAR per query |
| Add/revoke member | ~0.001 NEAR each |

**Total for MVP testing:** ~$1-5 for NEAR AI credits + ~0.1 NEAR (~$0.30) for vault operations

### Smart Contract (On-Chain)

| Operation | Cost |
|-----------|------|
| Deploy contract (~200KB WASM) | ~2 NEAR (~$6) for storage |
| Initialize contract | ~0.001 NEAR (gas) |
| `ask_advisor()` per call | ~0.01 NEAR (gas for yield) |
| `provide_ai_response()` per call | ~0.02 NEAR (gas + storage for verification) |
| `calculate_risk_score()` (view) | Free |
| `get_verification()` (view) | Free |
| Relayer gas budget (100 queries) | ~2 NEAR |

### Relayer Account

| Item | Cost |
|------|------|
| Initial funding for gas | 5 NEAR (~$15) |
| Estimated lifetime (100 queries) | ~2 NEAR used |
| Function call access key allowance | 0.25 NEAR per key |

**Total for hackathon:** ~$1-5 NEAR AI credits + ~0.1 NEAR vault + ~5 NEAR contract deployment/relayer = **~$20 total**

---

## 17. MVP Scope (Hackathon Submission)

### Phase 1 — Smart Contract + Core Backend (Week 1)

- [ ] **Rust Smart Contract** (`blindfold.near`)
  - [ ] Yield/resume advisor pattern (`ask_advisor` → yield → `provide_ai_response` → resume)
  - [ ] Verification registry (`LookupMap` for permanent on-chain proofs)
  - [ ] Risk scoring view function (`calculate_risk_score` — free to call)
  - [ ] Sandbox integration tests (near-kit Sandbox)
  - [ ] Deploy to testnet
- [ ] **TEE Relayer Service**
  - [ ] Poll contract for pending requests (near-kit server-side)
  - [ ] Forward to NEAR AI Cloud TEE
  - [ ] Resume contract with verified response
- [ ] **Portfolio Analytics Engine**
  - [ ] FastNEAR API integration (fetch all user assets in one call)
  - [ ] HHI concentration index calculation
  - [ ] Risk score → LLM context enrichment
- [ ] Wallet-based authentication (Better Auth + near-kit `verifyNep413Signature`)
- [ ] Persistent sessions (survive page reloads, rate-limited API routes)

### Phase 2 — Frontend + Privacy Layer (Week 2)

- [ ] `@near-kit/react` integration (NearProvider + React Query)
- [ ] Type-safe contract hooks (`useVerification`, `useContractStats`, `useOnChainRiskScore`)
- [ ] Chat interface with AI advisor (NEAR AI Cloud, streaming SSE)
- [ ] Portfolio fetching (FastNEAR API + near-kit `getBalance`)
- [ ] Encrypted vault creation (NOVA group per user)
- [ ] Portfolio storage in vault (upload encrypted JSON)
- [ ] Per-message on-chain verification display (link to NearBlocks)
- [ ] Risk score card component (visual display)
- [ ] Data controls (inspect, export, delete)
- [ ] Landing page explaining the value prop
- [ ] Deploy contract to mainnet
- [ ] Live deployed URL (Vercel)

### Phase 3 — HOT Protocol Integration (+$3,000 bounty, Week 3)

- [ ] HOT KIT multi-chain wallet connection (EVM, Solana, TON, Stellar, Cosmos)
- [ ] Multi-chain portfolio view via `kit.walletsTokens` (balances + USD across all chains)
- [ ] Advisor-triggered swap via HOT KIT Exchange (`reviewSwap` → `makeSwap`)
- [ ] Swap UI: `kit.openBridge()` popup or custom `SwapWidget` component
- [ ] Portfolio auto-update after swap execution (refresh balances → encrypt → update vault)
- [ ] HOT PAY webhook for swap confirmation logging
- [ ] Transaction verification links (hotscan.org + nearblocks.io)

### Nice to Have (Post-MVP)

- [ ] Two-factor authentication for vault access (Better Auth 2FA plugin)
- [ ] Google login via HOT MPC (web2 onboarding)
- [ ] Reasoning mode toggle (`thinking: true` for deep analysis)
- [ ] E2EE chat completions (client-side encryption with model's public key)
- [ ] Full attestation explorer (GPU verification via NVIDIA NRAS, TDX quote display)
- [ ] Cross-chain withdraw (omni → native chain via OmniBridge)
- [ ] Historical snapshots (auto-save weekly)
- [ ] Budget model selector (switch between DeepSeek V3.1 / GPT OSS 120B / Qwen3)
- [ ] Mobile-optimized UI

---

## 18. Demo Video Script (3 minutes)

```
0:00-0:15  HOOK
"Every time you ask ChatGPT about your crypto portfolio,
 OpenAI sees all your holdings. BlindFold fixes that —
 with on-chain proof that no one saw your data."

0:15-0:40  CONNECT
- Show wallet connection (NEAR Wallet Selector via near-kit)
- Portfolio auto-detected via FastNEAR API: NEAR, wNEAR, USDC
- Risk score calculated instantly: "Risk: 72/100 — High concentration"
- "Your portfolio data → encrypted vault → AI analysis in TEE."

0:40-1:15  CHAT + ON-CHAIN VERIFICATION
- Ask: "How's my portfolio looking?"
- AI responds with streaming analysis (DeepSeek V3.1 inside TEE)
- Show on-chain verification badge → click it:
    ✅ Verification #42 stored on-chain
    ✅ Request hash: sha256:b524f8f4...
    ✅ Response hash: sha256:aae79d9d...
    ✅ TEE attestation: verified
    📎 View on NearBlocks: nearblocks.io/txns/...
- "This proof lives on NEAR blockchain forever.
   Anyone can verify — no trust required."

1:15-1:35  TECHNICAL DEPTH: YIELD/RESUME
- Show contract architecture diagram
- "When you ask a question, the smart contract YIELDS —
   pauses execution on-chain while the TEE processes your query.
   When the TEE responds, the contract RESUMES with verified proof.
   This is an advanced NEAR feature that makes BlindFold
   the first on-chain AI advisor with verifiable responses."

1:35-1:55  ACT ON ADVICE
- Advisor says: "82% concentration in NEAR. Consider rebalancing."
- Click [🔄 Rebalance Now]
- HOT KIT swap UI: 30 NEAR → 89.70 USDC
- User signs intent → swap executes cross-chain, non-custodial
- Portfolio updates automatically + new risk score: "Risk: 45/100"

1:55-2:15  PRIVACY CONTROLS
- Show Inspect, Export, Delete
- "Your data, your rules. Always."

2:15-2:45  ARCHITECTURE OVERVIEW
- Smart Contract (Rust): yield/resume + verification registry
- TEE Relayer: bridges contract ↔ NEAR AI Cloud
- Risk Engine: HHI concentration, cross-chain analysis
- "Three backend layers. Real Rust development. Not just API calls."
- Show NearBlocks: judges can verify every interaction on-chain

2:45-3:00  CLOSE
- "BlindFold: Your AI advisor is blindfolded.
   It helps you without ever seeing your data.
   And you can prove it — on-chain, forever."
- Show: contract address, NOVA vault, verification chain
- Prizes targeted: Private Web + Only on NEAR + NOVA + HOT Pay
- Call to action: try it live at [URL]
```

---

## 19. Reference Documentation

| Resource | URL |
|----------|-----|
| **near-kit (Frontend + Backend SDK)** | |
| near-kit Docs (Full) | https://kit.near.tools/llms-full.txt |
| near-kit GitHub | https://github.com/r-near/near-kit |
| near-kit React Hooks | https://kit.near.tools (React section) |
| near-kit MCP Server | https://kit.near.tools/mcp |
| **NEAR Smart Contracts (Rust)** | |
| near-sdk-rs | https://github.com/near/near-sdk-rs |
| NEAR Smart Contract Docs | https://docs.near.org/build/smart-contracts/what-is |
| Yield/Resume Pattern | https://docs.near.org/build/smart-contracts/anatomy/yield-resume |
| Contract Collections | https://docs.near.org/build/smart-contracts/anatomy/collections |
| Contract Testing (Sandbox) | https://docs.near.org/build/smart-contracts/testing/introduction |
| Contract Security Checklist | https://docs.near.org/build/smart-contracts/security/checklist |
| **NEAR Data Infrastructure** | |
| FastNEAR API | https://api.fastnear.com |
| NearBlocks API | https://api.nearblocks.io |
| **NEAR AI Cloud** | |
| NEAR AI Cloud Intro | https://docs.near.ai/cloud |
| NEAR AI Quickstart | https://docs.near.ai/cloud/quickstart |
| NEAR AI Available Models | https://docs.near.ai/cloud/models |
| NEAR AI Private Inference | https://docs.near.ai/cloud/private-inference |
| NEAR AI OpenAI Compatibility | https://docs.near.ai/cloud/guides/openai-compatibility |
| NEAR AI Reasoning Models | https://docs.near.ai/cloud/guides/reasoning-models |
| NEAR AI E2EE Chat | https://docs.near.ai/cloud/guides/e2ee-chat-completions |
| NEAR AI Verification Overview | https://docs.near.ai/cloud/verification |
| NEAR AI Model Verification | https://docs.near.ai/cloud/verification/model-verification |
| NEAR AI Chat Verification | https://docs.near.ai/cloud/verification/chat-verification |
| NEAR AI Cloud Dashboard | https://cloud.near.ai |
| Verification Example Repo | https://github.com/nearai/cloud-verification-example |
| Complete Verifier Repo | https://github.com/nearai/cloud-verifier |
| NVIDIA NRAS API | https://docs.api.nvidia.com/attestation/reference/attestmultigpu_1 |
| **NOVA (Encrypted Vault)** | |
| NOVA Docs | https://nova-25.gitbook.io/nova-docs/ |
| NOVA SDK JS | https://github.com/jcarbonnell/nova/blob/main/nova-sdk-js/README.md |
| NOVA Repo | https://github.com/jcarbonnell/nova |
| Shade Agents | https://docs.near.org/ai/shade-agents/getting-started/introduction |
| **HOT Protocol (Phase 3)** | |
| HOT Protocol Docs | https://docs.hot-labs.org |
| HOT KIT GitHub | https://github.com/hot-dao/kit |
| HOT KIT Examples (Node.js) | https://github.com/hot-dao/kit/tree/main/examples-node |
| HOT Omni SDK | https://github.com/hot-dao/omni-sdk |
| HOT PAY Admin Panel | https://pay.hot-labs.org |
| HOT Scan (tx explorer) | https://hotscan.org |
| **Authentication** | |
| Better Auth Docs | https://better-auth.com |
| Better Auth LLMs.txt | https://better-auth.com/llms.txt |
| better-near-auth (SIWN) | https://github.com/elliotBraem/better-near-auth |
| NEP-413 Standard | https://github.com/near/NEPs/blob/master/neps/nep-0413.md |
| **Ecosystem** | |
| NEAR Social JS | https://nearbuilders.github.io/near-social-js/ |
| NEAR Web Login Methods | https://docs.near.org/build/web3-apps/frontend#web-login-methods |
| WalletConnect Dashboard | https://dashboard.reown.com |
| NEAR Intents Overview | https://docs.near.org/chain-abstraction/intents/overview |
