# BlindFold

The first privacy-verified crypto financial advisor. Built for NEARCON 2026 Innovation Sandbox - "The Private Web & Private Life" Track.

## Overview

BlindFold is a privacy-first AI financial advisor for crypto portfolios. Users connect their NEAR wallet, their portfolio data gets encrypted into a personal NOVA vault, and an AI advisor (powered by NEAR AI Cloud's TEE-based private inference) answers questions with cryptographic proof that no one saw the data.

### Why it can't exist on a standard AI stack

On ChatGPT/Claude/Gemini, your wallet holdings, transaction history, and financial questions are visible to the AI provider. BlindFold uses NEAR AI Cloud's TEE-based inference where TLS terminates inside the Trusted Execution Environment — not at an external load balancer. Your prompts remain encrypted from your machine all the way into the secure enclave before being decrypted.

## Key Features

- **Complete Privacy**: Portfolio data encrypted with AES-256-GCM in NOVA vaults
- **TEE-based AI**: NEAR AI Cloud with Intel TDX + NVIDIA H200 GPUs
- **Cryptographic Verification**: Every response is ECDSA-signed with hardware attestation
- **Data Controls**: Inspect, export, and delete your vault anytime
- **NEAR Integration**: Named accounts, on-chain portfolio data, blockchain logging

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **AI**: NEAR AI Cloud (OpenAI-compatible API)
- **Storage**: NOVA SDK (encrypted vaults with Shade Agents)
- **Blockchain**: NEAR Protocol (RPC for portfolio data)
- **Verification**: ethers.js (ECDSA signature verification)

## Getting Started

### Prerequisites

1. NEAR account (will be created automatically via NOVA)
2. NEAR AI Cloud API key ([cloud.near.ai](https://cloud.near.ai))
3. NOVA API key ([nova-sdk.com](https://nova-sdk.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/carlos-israelj/BlindFold.git
cd BlindFold

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

```env
# NEAR AI Cloud
NEAR_AI_API_KEY=your_near_ai_api_key

# NOVA
NOVA_API_KEY=your_nova_api_key
NOVA_ACCOUNT_ID=your_account.nova-sdk.near

# NEAR Network
NEXT_PUBLIC_NEAR_NETWORK=mainnet
NEXT_PUBLIC_NEAR_RPC_URL=https://rpc.mainnet.near.org

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      USER'S BROWSER                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │ NEAR Wallet │  │  Chat UI     │  │ Verification       │  │
│  │ Connection  │  │  (Streaming) │  │ Panel              │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────────┘  │
└─────────┼────────────────┼───────────────────┼───────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌──────────────────────────────────────────────────────────────┐
│                   NEXT.JS API ROUTES                          │
│  /api/wallet     /api/chat     /api/vault     /api/verify    │
└────┬──────────────┬──────────────┬───────────────┬───────────┘
     │              │              │               │
     ▼              ▼              ▼               ▼
┌─────────┐  ┌───────────┐  ┌──────────┐  ┌──────────────────┐
│ NEAR    │  │ NEAR AI   │  │  NOVA    │  │ Verification     │
│ RPC     │  │ Cloud     │  │  SDK     │  │ Endpoints        │
│ Balance │  │ TEE LLM   │  │  (TEE)   │  │ Signatures       │
└─────────┘  └───────────┘  └──────────┘  └──────────────────┘
```

## How It Works

1. **Connect Wallet**: Fetch NEAR balance and token holdings from on-chain data
2. **Create Vault**: Encrypt portfolio data with AES-256-GCM, store in NOVA vault
3. **Chat with AI**: Ask questions about your portfolio (processed in TEE)
4. **Verify Responses**: Every answer is cryptographically signed and verifiable

## Project Structure

```
blindfold/
├── app/
│   ├── api/
│   │   ├── chat/        # NEAR AI Cloud integration
│   │   ├── wallet/      # Portfolio fetching
│   │   ├── vault/       # NOVA operations
│   │   └── verify/      # Signature verification
│   ├── chat/           # Chat interface page
│   ├── vault/          # Vault controls page
│   └── page.tsx        # Landing page
├── components/         # React components
├── contexts/          # React contexts (Wallet, Vault)
├── lib/              # Utility functions
├── types/            # TypeScript types
└── public/           # Static assets
```

## Security Model

| Data | Protection | Who can access |
|------|-----------|---------------|
| Portfolio | Encrypted in NOVA vault (AES-256-GCM) | Only the user |
| Chat prompts | TLS terminates inside TEE | No one (encrypted in transit + in use) |
| AI responses | Generated inside TEE, ECDSA-signed | Only the user (+ cryptographic proof) |
| Encryption keys | Managed in Shade Agent TEE | No one (hardware-isolated) |

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Deployment

This project is optimized for deployment on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/carlos-israelj/BlindFold)

## Contributing

This is a hackathon project for NEARCON 2026. Contributions, issues, and feature requests are welcome!

## License

MIT

## Built With

- [Next.js](https://nextjs.org/)
- [NEAR AI Cloud](https://cloud.near.ai)
- [NOVA SDK](https://nova-sdk.com)
- [NEAR Protocol](https://near.org)
- [Tailwind CSS](https://tailwindcss.com)

---

Built for NEARCON 2026 Innovation Sandbox | "The Private Web & Private Life" Track
