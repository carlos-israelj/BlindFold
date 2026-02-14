# BlindFold Shade Agent

Autonomous portfolio risk monitoring agent running in Trusted Execution Environment (TEE).

## Features

- ✅ **Autonomous Monitoring**: Runs on schedule (default: daily at 9 AM)
- ✅ **Portfolio Risk Analysis**: Calculates HHI (Herfindahl-Hirschman Index) for concentration risk
- ✅ **NOVA Integration**: Fetches and decrypts portfolio data from NOVA vaults
- ✅ **Automated CID Sync**: Automatically fetches latest portfolio CID from frontend API (no manual updates needed)
- ✅ **Frontend Alert System**: Sends risk alerts to web interface with visual notifications
- ✅ **Smart Rebalancing**: Generates actionable swap recommendations to reduce portfolio risk
- ✅ **TEE-Ready**: Designed for deployment in Phala Cloud TEE

## Architecture

```
┌─────────────────────────────────────────┐
│         BlindFold Web App               │
│  1. User uploads portfolio to NOVA      │
│  2. CID stored in PostgreSQL            │
│  3. Display alerts from Shade Agent     │
│  4. Execute swap recommendations        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│          NOVA Vault (NEAR)              │
│   Encrypted portfolio storage + IPFS    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Shade Agent (TEE)               │
│  1. Auto-fetch latest CID from frontend │
│  2. Retrieve & decrypt from NOVA        │
│  3. Analyze risk (HHI + concentration)  │
│  4. Generate swap recommendations       │
│  5. Send alerts to frontend via webhook │
└─────────────────────────────────────────┘
```

## Setup

### 1. Install Dependencies

```bash
cd shade-agent
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# NEAR Configuration
NEAR_ACCOUNT_ID=your-account.testnet
NEAR_PRIVATE_KEY=ed25519:your-private-key
NEAR_NETWORK=testnet

# NOVA Configuration
NOVA_ACCOUNT_ID=your-nova-account.nova-sdk.near
NOVA_API_KEY=nova_sk_your_api_key
NOVA_GROUP_ID=vault.your-account-id

# Monitoring Configuration
SCHEDULE_CRON=0 9 * * *
MONITORING_ENABLED=true

# Frontend Integration (for automated CID fetching and alerts)
FRONTEND_URL=https://blindfold.lat

# Optional: Alert Configuration
WEBHOOK_URL=https://your-webhook.com/alerts
ALERT_EMAIL=your-email@example.com
```

### 3. Run Locally

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
npm start
```

## Deployment Options

### Option 1: Phala Cloud TEE (Recommended)

**Get $400 in free credits when you sign up!** ✨

#### Step 1: Sign up for Phala Cloud

Visit https://phala.network and create your account. You'll get $400 in credits to deploy and test your TEE workloads.

#### Step 2: Install Phala Cloud CLI

```bash
npm install -g @phala/cli
# or
npx @phala/cli --version
```

#### Step 3: Login to Phala Cloud

```bash
npx @phala/cli auth login
```

This will open your browser to authenticate.

#### Step 4: Prepare Environment Variables

In Phala Cloud dashboard, set the following environment variables:

**Required Variables:**
```
NEAR_ACCOUNT_ID=3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae
NOVA_ACCOUNT_ID=ecuador10.nova-sdk.near
NOVA_API_KEY=nova_sk_csdk39oEwHNjb3WNdlgC6V3tu0FqPk4j
NOVA_GROUP_ID=vault.3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae
NEAR_NETWORK=testnet
MONITORING_ENABLED=true
FRONTEND_URL=https://blindfold.lat
```

**Optional Variables:**
```
SCHEDULE_CRON=0 9 * * *
WEBHOOK_URL=https://your-webhook.com/alerts
ALERT_EMAIL=your-email@example.com
PORTFOLIO_CID=Qm...  (fallback if frontend API unavailable)
```

#### Step 5: Deploy to Phala Cloud

```bash
cd shade-agent

# Build and push Docker image
npx @phala/cli docker build --image blindfold-shade-agent --tag v1.0.0

# Deploy to TEE
npx @phala/cli cvms create \
  --name blindfold-shade-agent \
  --compose ./docker-compose.yml \
  --env-file ./.env
```

#### Step 6: Verify Deployment

```bash
# Check deployment status
npx @phala/cli cvms list

# View logs
npx @phala/cli cvms logs blindfold-shade-agent

# Get TEE attestation
npx @phala/cli cvms show blindfold-shade-agent
```

#### Step 7: Verify TEE Attestation

1. Go to your Phala Cloud dashboard
2. Click on your `blindfold-shade-agent` deployment
3. Navigate to "Attestation" tab
4. Click "Check Attestation" to verify your code is running in a genuine TEE
5. Share the TEE quote as proof of secure execution

#### Pricing

- **Free tier**: $400 credits (enough for extensive testing)
- **Paid tier**: $0.06/vCPU/hour or $5/month for a CVM
- Your Shade Agent uses minimal resources (~0.5 vCPU, 256MB RAM)

### Option 2: Docker Container

```bash
docker build -t blindfold-agent .
docker run -d --env-file .env blindfold-agent
```

### Option 3: VPS with systemd

```bash
# Copy files to server
scp -r shade-agent user@server:/opt/

# Create systemd service
sudo nano /etc/systemd/system/blindfold-agent.service
```

```ini
[Unit]
Description=BlindFold Shade Agent
After=network.target

[Service]
Type=simple
User=blindfold
WorkingDirectory=/opt/shade-agent
ExecStart=/usr/bin/node dist/index.js
Restart=always
EnvironmentFile=/opt/shade-agent/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable blindfold-agent
sudo systemctl start blindfold-agent
```

## How It Works

### 1. Scheduled Execution

The agent runs on a cron schedule (default: daily at 9 AM UTC):

```typescript
cron.schedule('0 9 * * *', async () => {
  await runMonitoring();
});
```

### 2. Auto-Fetch Latest Portfolio CID

First tries to fetch from frontend API, then falls back to environment variable:

```typescript
// Try frontend API first (automatic)
const apiUrl = `${FRONTEND_URL}/api/vault/latest-cid?accountId=${accountId}&groupId=${groupId}`;
const response = await fetch(apiUrl);
const { cid } = await response.json();

// Fallback to environment variable if API unavailable
const cid = process.env.PORTFOLIO_CID;
```

### 3. Decrypt Portfolio

Uses NOVA SDK's built-in decryption (handles Shade key derivation internally):

```typescript
const result = await nova.retrieve(groupId, cid);
const portfolio = JSON.parse(result.data.toString('utf-8'));
```

### 4. Calculate Risk & Generate Recommendations

Computes HHI for concentration risk and generates swap recommendations:

```typescript
const hhi = calculateHHI(portfolio.assets);
// HHI > 7000 = Critical
// HHI > 5000 = Warning
// HHI < 2500 = Good

// Generate rebalancing recommendations
const recommendations = generateRebalancingRecommendations(assets, hhi);
// Returns: [{ action: 'sell', symbol: 'NEAR', amountUSD: 500, reason: '...' }, ...]
```

### 5. Send Alerts to Frontend

Sends webhook to frontend API to store and display alerts:

```typescript
if (severity === 'warning' || severity === 'critical') {
  await fetch(`${FRONTEND_URL}/api/agents/alerts`, {
    method: 'POST',
    body: JSON.stringify({
      accountId,
      severity,
      message,
      hhi,
      recommendations,
    }),
  });
}
```

### 6. Frontend Alert Display

Users see alerts in the web interface with actionable swap recommendations:

- Visual alerts with severity indicators (warning/critical)
- HHI metrics and concentration analysis
- List of recommended swaps (SELL X, BUY Y)
- One-click execution of swap recommendations

## Risk Thresholds

- **HHI < 1500**: Low concentration (well diversified)
- **HHI 1500-2500**: Medium concentration
- **HHI 2500-5000**: High concentration (⚠️ warning)
- **HHI 5000-7000**: Very high concentration (⚠️ warning)
- **HHI > 7000**: Extreme concentration (🚨 critical alert)

## Security

- ✅ Private keys stored securely in environment variables
- ✅ NOVA SDK handles encryption/decryption in TEE
- ✅ No plaintext portfolio data written to disk
- ✅ Minimal dependencies to reduce attack surface

## Monitoring

View agent logs:

```bash
# Docker
docker logs -f blindfold-agent

# systemd
sudo journalctl -u blindfold-agent -f

# PM2
pm2 logs blindfold-agent
```

## Testing

Test the agent manually:

```bash
npm run dev
```

The agent will:
1. Run analysis immediately on startup
2. Show results in console
3. Continue running on schedule

## Production Checklist

- [x] NEAR account created and funded
- [x] NOVA group registered
- [x] Portfolio data uploaded to NOVA vault
- [x] Environment variables configured in Phala Cloud
- [x] Agent deployed to TEE (Phala Cloud) - v1.0.5
- [x] FRONTEND_URL configured for automated CID sync
- [x] Frontend alert endpoint configured (`/api/agents/alerts`)
- [x] Database schema deployed (RiskAlert table)
- [x] AlertBanner component integrated in frontend
- [ ] Verify alerts display at https://blindfold.lat/chat
- [ ] Test swap recommendation execution
- [ ] Set up backup agent instance (redundancy)

## Current Deployment Status

**Shade Agent**: ✅ Running on Phala Cloud TEE
- Version: `ghcr.io/carlos-israelj/blindfold-shade-agent:v1.0.5`
- FRONTEND_URL: `https://blindfold.lat`
- Auto-fetching CID from frontend API
- Sending alerts to frontend webhook

**Frontend**: ✅ Deployed on Vercel
- URL: https://blindfold.lat
- Alert API: `/api/agents/alerts` (POST/GET)
- Latest CID API: `/api/vault/latest-cid` (GET)
- AlertBanner component integrated

**Known Issues**:
- ⚠️ NOVA MCP Server returning 500 errors (external service)
  - Error: `MCP tool 'prepare_retrieve' failed: Shade key fetch failed`
  - This is an external dependency issue, not our implementation
  - Our Shade Agent successfully fetches CID and sends alerts
  - Waiting for NOVA team to fix their MCP server configuration

## Troubleshooting

### Agent not fetching latest CID

**Symptoms**: Logs show `⚠️ No PORTFOLIO_CID available from API or environment`

**Solutions**:
1. Verify FRONTEND_URL is set in Phala Cloud environment variables
2. Check startup logs for: `Frontend URL: https://blindfold.lat`
3. Verify portfolio was uploaded through web interface
4. Check API is responding: `curl https://blindfold.lat/api/vault/latest-cid?accountId=YOUR_ACCOUNT&groupId=YOUR_GROUP_ID`

### NOVA MCP Server 500 Error

**Symptoms**: `MCP tool 'prepare_retrieve' failed: Shade key fetch failed: Internal Server Error`

**Cause**: External NOVA MCP Server at https://nova-mcp.fastmcp.app has configuration issues

**Status**: This is an external service maintained by the NOVA team, not fixable on our side

**Verification**: Check if your Shade Agent successfully:
- ✅ Fetches CID from frontend: `✅ Latest CID from API: Qm...`
- ✅ Sends alert to frontend: `✅ Alert sent to frontend successfully`

If both are true, our implementation is working correctly.

### Alerts not showing in frontend

**Solutions**:
1. Check database: `SELECT * FROM "RiskAlert" WHERE "accountId" = 'YOUR_ACCOUNT' ORDER BY "createdAt" DESC;`
2. Verify AlertBanner is rendered in `/app/chat/page.tsx`
3. Check browser console for API errors
4. Verify user is logged in with correct wallet

### Docker image not updating

**Solutions**:
1. Verify image was built and pushed: `docker pull ghcr.io/carlos-israelj/blindfold-shade-agent:v1.0.5`
2. Update docker-compose.yml with new version tag
3. Restart Phala Cloud deployment
4. Check logs show correct version in startup

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/blindfold
- NOVA SDK Docs: https://github.com/utnet-org/nova-sdk-js
- NOVA MCP Server: https://github.com/jcarbonnell/nova/tree/main/mcp-server
- Shade Agent: https://github.com/jcarbonnell/nova/tree/main/shade-agent
- Phala Network: https://docs.phala.network
