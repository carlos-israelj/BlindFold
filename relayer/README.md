# BlindFold TEE Relayer Service

Bridge service between the BlindFold smart contract and NEAR AI Cloud TEE.

## What It Does

The TEE Relayer is a critical component of BlindFold's architecture:

1. **Polls** the smart contract for pending advisor requests
2. **Forwards** requests to NEAR AI Cloud TEE for private inference
3. **Verifies** cryptographic signatures from the TEE
4. **Resumes** the contract by calling `provide_ai_response()` with verified proofs
5. **Stores** verification permanently on-chain for public audit

```
User → ask_advisor() → Contract YIELDS
                            ↓
                    [Pending Request]
                            ↓
                    TEE Relayer polls ←─────┐
                            ↓                │
                    Forward to TEE           │
                            ↓                │
                    Get verified response    │
                            ↓                │
                    provide_ai_response()    │
                            ↓                │
                    Contract RESUMES         │
                            ↓                │
                    Verification on-chain    │
                            └────────────────┘
                            (Continuous polling)
```

## Setup

### 1. Install Dependencies

```bash
cd relayer
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `CONTRACT_ID`: Your deployed BlindFold contract (e.g., `blindfold.testnet`)
- `RELAYER_ACCOUNT_ID`: NEAR account that will call the contract
- `RELAYER_PRIVATE_KEY`: Private key for the relayer account
- `NEAR_AI_API_KEY`: API key from cloud.near.ai

### 3. Fund the Relayer Account

The relayer needs NEAR tokens to pay for gas when calling `provide_ai_response()`:

```bash
near send your-account.testnet relayer.testnet 5
```

Recommended: 5 NEAR minimum for testing.

## Running

### Development (with auto-reload)

```bash
npm run dev
```

### Production

```bash
npm start
```

### Docker (Production)

```bash
docker build -t blindfold-relayer .
docker run -d --env-file .env blindfold-relayer
```

## How It Works

### Polling Loop

Every 5 seconds (configurable), the relayer:

```typescript
const pendingRequests = await contract.get_pending_requests();

for (const request of pendingRequests) {
  // Process each request
  await processRequest(request);
}
```

### Processing a Request

```typescript
// 1. Forward to NEAR AI Cloud TEE
const completion = await openai.chat.completions.create({
  model: 'deepseek-ai/DeepSeek-V3.1',
  messages: [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Portfolio: ${portfolio}\n\nQuestion: ${question}` }
  ]
});

// 2. Hash request and response
const requestHash = SHA256(requestBody);
const responseHash = SHA256(response);

// 3. Fetch TEE signature
const signature = await fetchSignature(chatId);

// 4. Verify signature locally
const isValid = ethers.verifyMessage(requestHash + ':' + responseHash, signature);

// 5. Call contract to resume with verified response
await contract.provide_ai_response({
  request_id,
  response_text,
  request_hash,
  response_hash,
  signature,
  signing_address,
  signing_algo,
  tee_attestation
});
```

## Monitoring

The relayer logs all operations:

```
✓ TEE Relayer initialized
  Network: testnet
  Contract: blindfold.testnet
  Relayer: relayer.testnet

🚀 TEE Relayer started
   Polling every 5000ms

Found 1 pending request(s)
📨 Processing request #0 from alice.testnet
   Question: "How is my portfolio?"
   Request hash: sha256:b524f8f4b611b435...
   Response received (156 chars)
   Response hash: sha256:aae79d9de9c46f0a...
   TEE signature obtained
   Signing address: 0x319f1b8BB3b723A5...
   ✓ Signature verified locally
   ✓ Response provided to contract
   ✓ Verification stored on-chain
```

## Security

- **Private keys** are loaded from environment variables (never commit to git)
- **Signature verification** happens locally before calling contract
- **Rate limiting**: Only processes requests when not already processing
- **Error handling**: Failed requests don't crash the service
- **Gas management**: Each call uses a fixed gas amount (30 TGas)

## Cost Estimates

Per request:
- **NEAR AI Cloud**: ~$0.001-0.005 (depending on model and response length)
- **Gas fees**: ~0.0001-0.001 NEAR (~$0.0003-0.003)

For 100 requests:
- AI costs: ~$0.10-0.50
- Gas costs: ~0.01-0.1 NEAR (~$0.03-0.30)

**Total**: ~$0.13-0.80 per 100 requests

## Troubleshooting

### "Account not found"
→ Make sure the relayer account exists and is funded

### "Signature verification failed"
→ Check that NEAR_AI_API_KEY is correct and request/response hashing is exact

### "FunctionCallError"
→ Verify the contract is deployed and initialized

### No pending requests found
→ Check that users are calling `ask_advisor()` on the contract

## Deployment

For production deployment, consider:

1. **Multiple instances**: Run multiple relayers for redundancy
2. **Monitoring**: Add Prometheus metrics + Grafana dashboards
3. **Alerts**: Set up alerts for failed requests or stuck polling
4. **Key rotation**: Rotate relayer keys periodically
5. **Load balancing**: Distribute requests across multiple relayers

## License

MIT
