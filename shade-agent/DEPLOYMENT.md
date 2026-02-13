# Shade Agent - Phala Cloud Deployment Guide

## Quick Deployment to Phala Cloud TEE

This guide will help you deploy the BlindFold Shade Agent to Phala Cloud's Trusted Execution Environment.

### Prerequisites

✅ Phala Cloud account created (https://cloud.phala.com)
✅ NEAR account: `ecuador5.near`
✅ NOVA group registered: `ecuador5-portfolio-vault`
✅ Phala API Key obtained

### Step 1: Access Phala Cloud Dashboard

1. Go to https://cloud.phala.com/dashboard
2. Click "Deploy CVM" or navigate to deployment page

### Step 2: Configure Docker Compose

Copy and paste this `docker-compose.yml` into the Phala Cloud editor:

```yaml
version: '3.8'

services:
  shade-agent:
    image: node:20-alpine
    container_name: blindfold-shade-agent
    working_dir: /app
    restart: unless-stopped

    # Copy source code
    volumes:
      - ./:/app
      - /var/run/tappd.sock:/var/run/tappd.sock

    # Environment variables (will be encrypted by Phala)
    environment:
      - NEAR_ACCOUNT_ID=${NEAR_ACCOUNT_ID}
      - NEAR_PRIVATE_KEY=${NEAR_PRIVATE_KEY}
      - NEAR_NETWORK=${NEAR_NETWORK}
      - NOVA_GROUP_ID=${NOVA_GROUP_ID}
      - SCHEDULE_CRON=${SCHEDULE_CRON}
      - MONITORING_ENABLED=${MONITORING_ENABLED}

    # Install and run
    command: >
      sh -c "npm install &&
             npm run build &&
             npm start"

    # Resource limits
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

    # Health check
    healthcheck:
      test: ["CMD", "node", "-e", "console.log('healthy')"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Step 3: Configure Encrypted Secrets

In the Phala Cloud "Encrypted Secrets" section, add these variables:

| Key | Value |
|-----|-------|
| `NEAR_ACCOUNT_ID` | `ecuador5.near` |
| `NEAR_PRIVATE_KEY` | `ed25519:2bypafuHq7n1SqPTW6KxV812PTzCzaiaZntFqS859sGi6vSUncmywjFBShrPcZfB3z7nzYoBNFgTQKfFfU4XBno6` |
| `NEAR_NETWORK` | `mainnet` |
| `NOVA_GROUP_ID` | `ecuador5-portfolio-vault` |
| `SCHEDULE_CRON` | `0 9 * * *` |
| `MONITORING_ENABLED` | `true` |

**Note:** These values are end-to-end encrypted by Phala Cloud. Only your TEE can decrypt them.

### Step 4: Configure Instance Settings

1. **KMS Provider**: Select "Phala" (no wallet setup needed)
2. **Operating System**: Select "dstack-0.5.6" or latest
3. **Region**: Choose "US West" or closest to you
4. **Node**: Select any available node
5. **Instance Type**: Select "CPU TEE" → "Small TDX Instance"
   - 1 vCPU, 2GB RAM
   - Cost: ~$0.058/hour (~$44/month)
6. **Storage**: 20GB (default)
7. **File System**: ZFS (default)

### Step 5: Advanced Features

Enable these features:
- ✅ **dstack Gateway**: Enable for accessing logs
- ✅ **KMS**: Enable for key management
- ✅ **Public System Info**: Enable for monitoring
- ✅ **Public Logs**: Enable for debugging

### Step 6: Deploy

1. Review your configuration
2. Check the monthly estimate (~$44.34)
3. Click **"Deploy"** button
4. Wait for deployment to complete (2-5 minutes)

### Step 7: Verify Deployment

Once deployed, you can:

1. **View Logs:**
   ```bash
   # Via Phala Cloud Dashboard
   Navigate to: Dashboard → Your CVM → Logs tab
   ```

2. **Check Status:**
   ```bash
   # Via Phala Cloud Dashboard
   Navigate to: Dashboard → Your CVM → Status tab
   ```

3. **Verify TEE Attestation:**
   ```bash
   # Via Phala Cloud Dashboard
   Navigate to: Dashboard → Your CVM → Attestation tab
   Click "Check Attestation" to verify genuine TEE
   ```

### Step 8: Monitor Agent Activity

The Shade Agent will:
- ✅ Start monitoring portfolio at 9 AM UTC daily
- ✅ Fetch latest portfolio data from NOVA vault
- ✅ Calculate HHI risk score
- ✅ Log results (viewable in Phala dashboard)
- ✅ Send alerts if risk thresholds exceeded

### Troubleshooting

#### Agent Not Starting

Check logs for errors:
```
Dashboard → Your CVM → Logs
```

Common issues:
- Missing dependencies: Ensure `npm install` completed
- Environment variables: Verify all secrets are set correctly
- NEAR connection: Check NEAR_ACCOUNT_ID and NEAR_PRIVATE_KEY

#### NOVA Connection Issues

Ensure:
- NOVA_GROUP_ID exists and you have access
- Portfolio data has been uploaded to vault
- NEAR account has proper permissions

#### Build Failures

If build fails:
1. Check Node.js version (should be 20+)
2. Verify package.json dependencies
3. Review build logs in Phala dashboard

### Cost Breakdown

| Resource | Price | Monthly |
|----------|-------|---------|
| Small TDX Instance (1 vCPU, 2GB RAM) | $0.058/hour | $42.34 |
| Storage (20GB) | $0.003/hour | $2.19 |
| **Total** | **$0.061/hour** | **$44.53** |

**With $400 free credits:** You can run for ~6,500 hours (~270 days)

### Security Notes

🔒 **Security Features:**
- Private keys stored in encrypted secrets
- All operations run in TEE (Trusted Execution Environment)
- Hardware attestation available for verification
- No plaintext secrets in logs or storage

⚠️ **Important:**
- Never commit `.env` to git
- Rotate credentials periodically
- Monitor agent activity regularly

### Next Steps

After deployment:
1. ✅ Verify agent is running in Phala dashboard
2. ✅ Check attestation to confirm TEE execution
3. ✅ Monitor logs for first scheduled run
4. ✅ Configure webhook alerts (optional)
5. ✅ Set up monitoring dashboards (optional)

### Support

- **Phala Cloud Docs**: https://docs.phala.network
- **NOVA SDK Docs**: https://github.com/utnet-org/nova-sdk-js
- **BlindFold Issues**: https://github.com/your-repo/issues

---

## Alternative Deployment: Railway.app (Simpler)

If you prefer a simpler deployment without TEE (for development/testing):

```bash
cd shade-agent

# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up

# Set environment variables
railway variables set NEAR_ACCOUNT_ID=ecuador5.near
railway variables set NEAR_PRIVATE_KEY=ed25519:...
railway variables set NOVA_GROUP_ID=ecuador5-portfolio-vault
railway variables set NEAR_NETWORK=mainnet
railway variables set MONITORING_ENABLED=true
```

**Note:** Railway deployment won't have TEE security guarantees.
