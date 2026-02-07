# BlindFold — Architecture Document

## NEARCON 2026 Innovation Sandbox | "The Private Web & Private Life" Track

---

## 1. Product Summary

**BlindFold** is the first privacy-verified crypto financial advisor. Users connect their NEAR wallet, their portfolio data gets encrypted into a personal NOVA vault, and an AI advisor (powered by NEAR AI Cloud's TEE-based private inference) answers questions like "How's my portfolio?", "What's my risk exposure?", or "Give me a weekly summary" — with every response cryptographically signed proving no one saw the data.

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

- $3,500 (Private Web track) + $4,500 ("Only on NEAR" bonus) + $3,000 (NOVA bounty) = **$11,000**

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                           │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ NEAR Wallet │  │  Chat UI     │  │ Verification       │  │
│  │ Connection  │  │  (Streaming) │  │ Panel              │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────────┘  │
│         │                │                   │               │
└─────────┼────────────────┼───────────────────┼───────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                   NEXT.JS API ROUTES                          │
│                                                              │
│  /api/wallet     /api/chat     /api/vault     /api/verify    │
│                                                              │
└────┬──────────────┬──────────────┬───────────────┬───────────┘
     │              │              │               │
     ▼              ▼              ▼               ▼
┌─────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────────┐
│ NEAR    │  │ NEAR AI   │  │  NOVA    │  │ Verification     │
│ RPC     │  │ Cloud     │  │  SDK     │  │ Endpoints        │
│         │  │           │  │  (TEE)   │  │                  │
│ Balance │  │ OpenAI    │  │ Encrypt  │  │ /v1/signature/   │
│ Tokens  │  │ SDK →     │  │ Store    │  │ /v1/attestation/ │
│ History │  │ base_url  │  │ Retrieve │  │ NVIDIA NRAS      │
└─────────┘  └───────────┘  └──────────┘  └──────────────────┘
     │              │              │               │
     ▼              ▼              ▼               ▼
  NEAR          Intel TDX       IPFS +          ECDSA Sigs +
  Blockchain    + NVIDIA TEE    NEAR Chain      GPU/TDX Quotes
                (H200 GPUs)
```

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
  → NEAR Wallet Selector connects (alice.near)
  → App calls NEAR RPC to fetch:
      - Account balance (NEAR + FTs)
      - Token balances (ft_balance_of for known tokens)
      - Recent transactions
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

---

## 4. Technology Stack

### Frontend

| Component | Technology | Why |
|-----------|-----------|-----|
| Framework | Next.js 14 (App Router) | SSR + API routes in one repo |
| Language | TypeScript | Type safety across NOVA/NEAR SDKs |
| Styling | Tailwind CSS | Rapid UI, no CSS conflicts |
| Wallet | @near-wallet-selector/* | Official NEAR wallet connection |
| State | React Context + useState | Simple, no Redux needed |

### Backend (Next.js API Routes)

| Component | Technology | Why |
|-----------|-----------|-----|
| AI Inference | `openai` npm package | OpenAI-compatible SDK, just change baseURL |
| Vault | `nova-sdk-js` v1.0.3 | Encrypted storage, group access control |
| Blockchain | `near-api-js` | RPC calls, account info |
| Verification | `ethers` v6 | ECDSA signature recovery & verification |
| Hashing | Node.js `crypto` | SHA-256 for request/response hashing |

### Infrastructure

| Component | Technology | Why |
|-----------|-----------|-----|
| Hosting | Vercel | Free tier, instant deploy, live URL |
| Storage | IPFS (via NOVA/Pinata) | Decentralized, encrypted |
| Blockchain | NEAR Protocol | Named accounts, low fees |
| Key Management | NOVA Shade Agents (Phala TEE) | Off-chain, verifiable |
| AI Compute | NEAR AI Cloud (Intel TDX + NVIDIA TEE) | Private inference, H200 GPUs |

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
| `/chat` | Main chat interface (protected, requires wallet) |
| `/vault` | Data controls: Inspect, Export, Delete, Revoke |
| `/verify` | Verification explorer: attestations, signatures |

### Components

| Component | Description |
|-----------|-------------|
| `WalletConnector` | NEAR Wallet Selector integration |
| `ChatInterface` | Message list + input + streaming SSE responses |
| `MessageBubble` | Single message with verification badge |
| `VerificationBadge` | Click to expand: hashes + signature + attestation proof |
| `PortfolioSidebar` | Current holdings, allocation chart |
| `VaultControls` | Inspect/Export/Delete/Revoke buttons |
| `AttestationViewer` | Full attestation report: GPU, TDX, compose manifest |

---

## 8. Database Schema (In-Vault JSON)

No external database. All state lives in the user's encrypted NOVA vault.

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
| Unauthorized vault access | NOVA group membership + ephemeral nonce-based ed25519 tokens (5min window) |
| Response tampering | ECDSA signatures generated inside TEE; any modification detectable via ethers.verifyMessage |
| Replay attacks | Nonce-based attestation (64-char hex, 32 bytes); timestamp-bound tokens |
| Network eavesdropping | End-to-end TLS encryption; TLS terminates only inside TEE |
| Model extraction | Model weights remain encrypted and isolated within NVIDIA TEE; extraction computationally infeasible |

---

## 10. "Only on NEAR" Qualification

This product **requires** NEAR-specific infrastructure and cannot exist on any other chain:

1. **NEAR AI Cloud** — TEE-based private inference (Intel TDX + NVIDIA H200) is a NEAR-native service; no other chain offers this
2. **NOVA on NEAR** — Encrypted vault with smart contract access control, Shade Agents for key management, all native to NEAR
3. **Named accounts** — `alice.near` as human-readable identity (not `0x7a3b...` hashes)
4. **NEAR Social** — On-chain profile integration for identity context
5. **Shade Agents** — TEE key management framework specific to NEAR ecosystem (Phala Cloud deployment)
6. **Dual attestation chain** — NEAR AI Cloud attestation (NVIDIA NRAS + Intel TDX) + NOVA Shade attestation = verifiable end-to-end
7. **OpenAI-compatible API** — Standard SDK works with just a `baseURL` change; developer experience matches centralized alternatives but with hardware-enforced privacy

---

## 11. Judging Criteria Alignment

| Criteria | How we score |
|----------|-------------|
| **Impact/Usefulness** | Daily use case (portfolio check), solves real privacy problem, targets NEAR Legion (4K users) |
| **Technical Execution** | Dual-TEE architecture (NEAR AI Cloud + NOVA Shade), per-message ECDSA verification, SHA-256 hashing, hardware attestation, client-side crypto |
| **Completeness/Functionality** | Working chat with streaming, real portfolio data from on-chain, encrypted vault, verification UI with hash/signature/attestation, data controls |
| **UX** | One-click wallet connect, natural language chat, green verification badges, inspect/export/delete/revoke, clean design |

---

## 12. File Structure

```
blindfold/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Landing page
│   ├── chat/
│   │   └── page.tsx            # Main chat interface
│   ├── vault/
│   │   └── page.tsx            # Data controls
│   ├── verify/
│   │   └── page.tsx            # Attestation explorer
│   └── api/
│       ├── chat/
│       │   └── route.ts        # NEAR AI Cloud proxy (OpenAI SDK, streaming)
│       ├── wallet/
│       │   └── route.ts        # Portfolio fetching (near-api-js RPC)
│       ├── vault/
│       │   └── route.ts        # NOVA operations (nova-sdk-js)
│       └── verify/
│           └── route.ts        # Signature + attestation fetching
├── components/
│   ├── WalletConnector.tsx
│   ├── ChatInterface.tsx
│   ├── MessageBubble.tsx
│   ├── VerificationBadge.tsx
│   ├── PortfolioSidebar.tsx
│   ├── VaultControls.tsx
│   └── AttestationViewer.tsx
├── lib/
│   ├── near-ai.ts              # OpenAI client config (baseURL override)
│   ├── nova.ts                 # NOVA SDK wrapper
│   ├── near-rpc.ts             # NEAR RPC helpers (balance, FT, history)
│   ├── verification.ts         # SHA-256 hashing + ethers ECDSA verification
│   ├── portfolio.ts            # Portfolio parsing/assembly
│   └── constants.ts            # Model IDs, token contracts, config
├── contexts/
│   ├── WalletContext.tsx        # Wallet connection state
│   └── VaultContext.tsx         # Vault state management
├── types/
│   └── index.ts                # TypeScript interfaces
├── public/
│   └── ...                     # Static assets
├── .env.local                  # API keys (gitignored)
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
    "openai": "^4",
    "nova-sdk-js": "^1.0.3",
    "near-api-js": "^5",
    "ethers": "^6",
    "tailwindcss": "^3"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18"
  }
}
```

---

## 15. Accounts to Create (Before Development)

| # | Service | URL | Steps | Output |
|---|---------|-----|-------|--------|
| 1 | NEAR AI Cloud | https://cloud.near.ai | Sign up → Add Credits → API Keys → Generate | `NEAR_AI_API_KEY` |
| 2 | NOVA | https://nova-sdk.com | Login (email/Google/Apple/GitHub) → Manage Account → Generate API Key | `NOVA_API_KEY` + `NOVA_ACCOUNT_ID` |
| 3 | NEAR Wallet | Auto-created by NOVA | — | `xxx.nova-sdk.near` account |
| 4 | Vercel | https://vercel.com | Sign up (free tier) | Deployment URL |

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

---

## 17. MVP Scope (Hackathon Submission)

### Must Have (MVP)

- [ ] Wallet connection (NEAR Wallet Selector)
- [ ] Portfolio fetching (NEAR balance + top fungible tokens)
- [ ] Encrypted vault creation (NOVA group per user)
- [ ] Portfolio storage in vault (upload encrypted JSON)
- [ ] Chat interface with AI advisor (NEAR AI Cloud, streaming SSE)
- [ ] Per-message verification display (SHA-256 hashes + ECDSA signature + badge)
- [ ] Data controls (inspect, export, delete)
- [ ] Landing page explaining the value prop
- [ ] Live deployed URL (Vercel)

### Nice to Have (Post-MVP)

- [ ] Reasoning mode toggle (`thinking: true` for deep analysis)
- [ ] E2EE chat completions (client-side ECIES encryption with model's public key)
- [ ] Full attestation explorer (GPU verification via NVIDIA NRAS, TDX quote display)
- [ ] Historical snapshots (auto-save weekly)
- [ ] NEAR Social profile integration
- [ ] Token price feed (for USD valuations)
- [ ] Self-learning loops (model refinement per NOVA Finance pattern)
- [ ] Share vault with trusted advisor (add member → revoke flow)
- [ ] Budget model selector (switch between DeepSeek V3.1 / GPT OSS 120B / Qwen3)
- [ ] Mobile-optimized UI

---

## 18. Demo Video Script (3 minutes)

```
0:00-0:20  HOOK
"Every time you ask ChatGPT about your crypto portfolio,
 OpenAI sees all your holdings. BlindFold fixes that."

0:20-0:50  CONNECT
- Show wallet connection (alice.near)
- Portfolio auto-detected from on-chain data
- "Your data is now encrypted in a personal vault.
   No one can see it — not even us."

0:50-1:30  CHAT
- Ask: "How's my portfolio looking?"
- AI responds with streaming analysis (DeepSeek V3.1 inside TEE)
- Click verification badge → show:
    ✅ Request hash: sha256:b524f8f4...
    ✅ Response hash: sha256:aae79d9d...
    ✅ ECDSA signature valid
    ✅ Signing address matches model attestation
- "This response was generated inside a hardware enclave.
   The signature proves no one saw your question or the answer."

1:30-2:00  PRIVACY CONTROLS
- Show Inspect (view all stored data, decrypted client-side)
- Show Export (download everything as JSON)
- Show Delete (destroy vault — keys destroyed in Shade TEE)
- "Your data, your rules. Always."

2:00-2:30  TECHNICAL DEPTH
- Architecture diagram (dual TEE)
- "NEAR AI Cloud: Intel TDX + NVIDIA H200 TEE for inference"
- "NOVA: AES-256-GCM encryption, keys in Shade TEE on Phala Cloud"
- "Every message: SHA-256 hash + ECDSA signature + hardware attestation"
- "This product literally cannot exist on a standard AI stack"

2:30-3:00  CLOSE
- "BlindFold: Your AI advisor is blindfolded. It helps you without ever seeing your data."
- Show NEAR named account, NOVA vault CID, attestation chain
- Call to action: try it live at [URL]
```

---

## 19. Reference Documentation

| Resource | URL |
|----------|-----|
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
| Etherscan Verify Signatures | https://etherscan.io/verifiedSignatures |
| NOVA Docs | https://nova-25.gitbook.io/nova-docs/ |
| NOVA SDK JS | https://github.com/jcarbonnell/nova/blob/main/nova-sdk-js/README.md |
| NOVA Repo | https://github.com/jcarbonnell/nova |
| NEAR Social JS | https://nearbuilders.github.io/near-social-js/ |
| Shade Agents | https://docs.near.org/ai/shade-agents/getting-started/introduction |
