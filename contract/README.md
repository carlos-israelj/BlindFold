# BlindFold Smart Contract

Smart contract for BlindFold - the first privacy-verified crypto financial advisor on NEAR.

## Features

- **Yield/Resume Pattern**: Contract yields execution while waiting for TEE to process AI queries
- **On-Chain Verification Registry**: Every AI interaction is permanently recorded with cryptographic proof
- **Risk Scoring**: Free view function to calculate portfolio risk (HHI concentration index)
- **Public Verifiability**: Anyone can query verifications to audit privacy claims

## Contract Methods

### Write Methods (Require Transaction)

#### `ask_advisor(question: String, portfolio_data: String)`
User calls this to ask the AI advisor a question. The contract yields and waits for the TEE Relayer to provide a response.

```bash
near call blindfold.near ask_advisor '{"question": "How is my portfolio?", "portfolio_data": "{...}"}' --accountId user.near --deposit 0.1
```

#### `provide_ai_response(...)`
TEE Relayer calls this after getting verified response from NEAR AI Cloud. This resumes the contract.

```bash
near call blindfold.near provide_ai_response '{
  "request_id": 0,
  "response_text": "Your portfolio...",
  "request_hash": "sha256:...",
  "response_hash": "sha256:...",
  "signature": "0x...",
  "signing_address": "0x...",
  "signing_algo": "ecdsa",
  "tee_attestation": "..."
}' --accountId relayer.near
```

### View Methods (Free to Call)

#### `get_verification(verification_id: u64)`
Get verification proof for any interaction. **Fully public** - judges can verify freely.

```bash
near view blindfold.near get_verification '{"verification_id": 0}'
```

#### `calculate_risk_score(portfolio_json: String)`
Calculate risk score from portfolio data using HHI concentration index.

```bash
near view blindfold.near calculate_risk_score '{"portfolio_json": "{...}"}'
```

#### `get_pending_requests()`
Get all pending advisor requests (used by TEE Relayer polling).

```bash
near view blindfold.near get_pending_requests '{}'
```

#### `get_user_requests(user: AccountId)`
Get all requests from a specific user.

```bash
near view blindfold.near get_user_requests '{"user": "alice.near"}'
```

#### `get_stats()`
Get contract statistics (total requests, verifications, etc).

```bash
near view blindfold.near get_stats '{}'
```

## Building

```bash
./build.sh
```

This will:
1. Compile the contract to WASM
2. Output to `../out/contract.wasm`
3. Show size and optimization tips

## Testing

```bash
cargo test
```

## Deploying

### Testnet

```bash
# Create account (if needed)
near create-account blindfold.testnet --masterAccount your-account.testnet

# Deploy
near deploy --accountId blindfold.testnet --wasmFile out/contract.wasm

# Initialize
near call blindfold.testnet new '{"owner": "your-account.testnet"}' --accountId your-account.testnet
```

### Mainnet

```bash
# Deploy
near deploy --accountId blindfold.near --wasmFile out/contract.wasm

# Initialize
near call blindfold.near new '{"owner": "your-account.near"}' --accountId your-account.near
```

## Architecture

```
User → ask_advisor() → Contract YIELDS
                             ↓
                    [Pending Request]
                             ↓
                    TEE Relayer polls
                             ↓
                    Forward to NEAR AI Cloud TEE
                             ↓
                    Get verified response
                             ↓
                    provide_ai_response() → Contract RESUMES
                             ↓
                    Verification stored on-chain
                             ↓
                    Anyone can query get_verification()
```

## Storage Patterns

- **IterableMap** for requests (need to iterate for pending requests)
- **LookupMap** for verifications (direct key lookup by ID)
- Permanent on-chain storage for all verifications (audit trail)

## Security

- Only contract owner or contract itself can call `provide_ai_response`
- All verifications are publicly queryable for transparency
- Request status prevents double-processing
- Timestamps and block heights for temporal proof

## License

MIT
