# Portfolio CID Configuration

## Overview

The Shade Agent now uses a simpler, more cost-effective approach for monitoring portfolios. Instead of querying NOVA transactions (which requires paying 1.3 NEAR per query), the agent reads the portfolio CID directly from an environment variable.

## How It Works

### 1. Upload Portfolio via Web Interface

When you upload your portfolio through the BlindFold web application:

```typescript
// Response from /api/vault/portfolio
{
  "success": true,
  "cid": "Qm...",  // <-- This is your Portfolio CID
  "transactionId": "abc123...",
  "groupId": "ecuador5-portfolio-vault",
  "assetsCount": 3,
  "totalValue": 45000
}
```

### 2. Save the CID

Copy the `cid` value from the response. For example:
```
QmXyZ123ABC...
```

### 3. Update Shade Agent Environment

Set the `PORTFOLIO_CID` environment variable in Phala Cloud:

**Via Phala Dashboard:**
1. Go to: https://cloud.phala.com/dashboard
2. Find your Shade Agent container
3. Edit environment variables
4. Add/Update: `PORTFOLIO_CID=QmXyZ123ABC...`
5. Restart container

**Via docker-compose (local testing):**
```bash
# Edit .env file
echo "PORTFOLIO_CID=QmXyZ123ABC..." >> .env

# Restart
docker-compose restart
```

### 4. Shade Agent Monitors

Once the CID is set, the Shade Agent will:
- Read the CID from environment
- Retrieve portfolio data from NOVA using that CID
- Decrypt and analyze the data
- Calculate HHI risk score
- Run on schedule (default: daily at 9am)

## Example Flow

```
User Action                          Result
─────────────────────────────────────────────────────────
1. Upload portfolio via web UI    → CID: QmABC123...

2. Copy CID from response         → QmABC123...

3. Set in Phala Cloud:            → PORTFOLIO_CID=QmABC123...
   Environment Variables

4. Restart Shade Agent            → Agent now monitoring!

5. Agent runs (9am daily)         → Reads CID from env
                                   → Retrieves from NOVA
                                   → Analyzes risk
                                   → Logs results
```

## Benefits

### Cost-Effective
- **Old approach**: 1.3 NEAR per query (expensive for frequent monitoring)
- **New approach**: FREE reading using known CID

### Simple
- No complex transaction queries
- Direct access to your portfolio data
- Easy to update when portfolio changes

### Reliable
- No dependency on transaction indexing
- Faster data retrieval
- Works in TEE environment

## Updating Your Portfolio

When you update your portfolio through the web interface:

1. New upload creates new CID
2. Copy the new CID from response
3. Update `PORTFOLIO_CID` in Phala Cloud
4. Restart Shade Agent
5. Agent now monitors updated portfolio

## Environment Variables

Full list of environment variables:

```bash
# NEAR Configuration
NEAR_ACCOUNT_ID=ecuador5.near
NEAR_PRIVATE_KEY=ed25519:...
NEAR_NETWORK=mainnet

# NOVA Configuration
NOVA_GROUP_ID=ecuador5-portfolio-vault
PORTFOLIO_CID=QmXyZ123ABC...  # <-- Add this after upload

# Monitoring
SCHEDULE_CRON=0 9 * * *
MONITORING_ENABLED=true
```

## Troubleshooting

### "No PORTFOLIO_CID set in environment"

**Problem**: Agent can't find portfolio CID

**Solution**:
1. Upload portfolio via web interface
2. Copy CID from response
3. Set `PORTFOLIO_CID` in environment
4. Restart agent

### "Failed to retrieve portfolio"

**Problem**: CID is invalid or data not accessible

**Solution**:
1. Verify CID is correct (starts with "Qm...")
2. Ensure you're authorized for the NOVA group
3. Check NOVA_GROUP_ID matches your group

### Multiple Portfolios

If you have multiple portfolios:
1. Latest CID will be monitored
2. Update CID whenever you upload new version
3. Agent always uses CID from environment

## Security

- CID is public (it's an IPFS hash)
- Data is encrypted in NOVA
- Only authorized group members can decrypt
- Private key stays in TEE environment

## Cost Comparison

**Traditional Approach (Query Transactions):**
- Cost: 1.3 NEAR per query
- Daily monitoring: 1.3 NEAR/day
- Monthly cost: ~39 NEAR/month ($156 at $4/NEAR)

**New Approach (CID from Environment):**
- Cost: FREE to read
- Daily monitoring: FREE
- Monthly cost: $0

**Upload Cost (one-time per update):**
- First upload to new group: 1.3 NEAR (group creation)
- Subsequent uploads: FREE (data upload only)

---

**Docker Image**: `ghcr.io/carlos-israelj/blindfold-shade-agent:v1.0.2`
**Last Updated**: February 13, 2026
