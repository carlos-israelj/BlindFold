# BlindFold Shade Agent

Autonomous portfolio risk monitoring agent running in Trusted Execution Environment (TEE).

## Features

- ✅ **Autonomous Monitoring**: Runs on schedule (default: daily at 9 AM)
- ✅ **Portfolio Risk Analysis**: Calculates HHI (Herfindahl-Hirschman Index) for concentration risk
- ✅ **NOVA Integration**: Fetches and decrypts portfolio data from NOVA vaults
- ✅ **Alert System**: Sends notifications for high-risk portfolios
- ✅ **TEE-Ready**: Designed for deployment in Phala Cloud TEE

## Architecture

```
┌─────────────────────────────────────────┐
│         BlindFold Web App               │
│  (uploads portfolio to NOVA vault)      │
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
│  1. Fetch latest portfolio from NOVA    │
│  2. Decrypt using Shade key derivation  │
│  3. Analyze risk (HHI calculation)      │
│  4. Send alerts if needed               │
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
NEAR_ACCOUNT_ID=your-account.testnet
NEAR_PRIVATE_KEY=ed25519:your-private-key
NOVA_GROUP_ID=portfolio-vault
SCHEDULE_CRON=0 9 * * *
MONITORING_ENABLED=true
NEAR_NETWORK=testnet
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

1. **Sign up for Phala Cloud**
   - Visit https://phala.network
   - Create account and get API credentials

2. **Deploy as TEE Worker**
   ```bash
   npm run deploy
   ```

3. **Configure Secrets**
   - Add `NEAR_PRIVATE_KEY` as secure environment variable in Phala dashboard
   - Set other config variables

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

### 2. Fetch Latest Portfolio

Queries NOVA SDK for latest transaction:

```typescript
const transactions = await nova.getTransactionsForGroup(groupId);
const latestCid = transactions[0].ipfs_hash;
```

### 3. Decrypt Portfolio

Uses NOVA SDK's built-in decryption (handles Shade key derivation internally):

```typescript
const result = await nova.retrieve(groupId, latestCid);
const portfolio = JSON.parse(result.data.toString('utf-8'));
```

### 4. Calculate Risk

Computes HHI for concentration risk:

```typescript
const hhi = calculateHHI(portfolio.assets);
// HHI > 7000 = Critical
// HHI > 5000 = Warning
// HHI < 2500 = Good
```

### 5. Send Alerts

Logs alerts and can send to webhooks:

```typescript
if (severity === 'warning' || severity === 'critical') {
  await sendNotification(analysis);
}
```

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

- [ ] NEAR account created and funded
- [ ] NOVA group registered
- [ ] Portfolio data uploaded to NOVA vault
- [ ] `.env` configured with production credentials
- [ ] Agent deployed to TEE (Phala Cloud)
- [ ] Webhook endpoint configured for alerts
- [ ] Monitoring/logging set up
- [ ] Backup agent instance running (redundancy)

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/blindfold
- NOVA SDK Docs: https://github.com/utnet-org/nova-sdk-js
- Phala Network: https://docs.phala.network
