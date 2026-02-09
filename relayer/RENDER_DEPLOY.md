# Deploying BlindFold Relayer to Render

## Prerequisites

1. A Render account (sign up at https://render.com)
2. Your GitHub repository connected to Render
3. The following credentials ready:
   - `RELAYER_PRIVATE_KEY` from `~/.near-credentials/mainnet/ecuador5.near.json`
   - `NEAR_AI_API_KEY` (sk-8920ddc89c22472ea80d0fe7beb85871)

## Deployment Steps

### Option 1: Deploy with Blueprint (Recommended)

1. **Push code to GitHub** (if not already done)
   ```bash
   git add relayer/
   git commit -m "Add Render configuration for relayer"
   git push origin main
   ```

2. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "Blueprint"

3. **Connect Repository**
   - Select your GitHub repository
   - Render will automatically detect `render.yaml`

4. **Configure Secret Environment Variables**
   - In the service settings, add these secrets:
     - `RELAYER_PRIVATE_KEY`: `ed25519:2bypafuHq7n1SqPTW6KxV812PTzCzaiaZntFqS859sGi6vSUncmywjFBShrPcZfB3z7nzYoBNFgTQKfFfU4XBno6`
     - `NEAR_AI_API_KEY`: `sk-8920ddc89c22472ea80d0fe7beb85871`

5. **Deploy**
   - Click "Apply" to deploy the service
   - Wait for the build to complete (~2-3 minutes)

### Option 2: Manual Deployment

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Select your GitHub repository
   - Root Directory: `relayer`

3. **Configure Service**
   - Name: `blindfold-relayer`
   - Region: Oregon (US West)
   - Branch: `main`
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Add Environment Variables**
   ```
   CONTRACT_ID=ecuador5.near
   NEAR_NETWORK=mainnet
   RELAYER_ACCOUNT_ID=ecuador5.near
   RELAYER_PRIVATE_KEY=ed25519:2bypafuHq7n1SqPTW6KxV812PTzCzaiaZntFqS859sGi6vSUncmywjFBShrPcZfB3z7nzYoBNFgTQKfFfU4XBno6
   NEAR_AI_API_KEY=sk-8920ddc89c22472ea80d0fe7beb85871
   NEAR_AI_MODEL=deepseek-ai/DeepSeek-V3.1
   POLL_INTERVAL_MS=5000
   NODE_ENV=production
   ```

5. **Create Service**
   - Click "Create Web Service"
   - Wait for deployment

## Verification

Once deployed, verify the relayer is working:

1. **Check Health Endpoint**
   ```bash
   curl https://blindfold-relayer.onrender.com/health
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-02-09T..."
   }
   ```

2. **Check Status Dashboard**
   ```bash
   curl https://blindfold-relayer.onrender.com/
   ```

   Expected response:
   ```json
   {
     "service": "BlindFold TEE Relayer",
     "status": "running",
     "uptime": 123.45,
     "lastPoll": null,
     "processedRequests": 0
   }
   ```

3. **Monitor Logs**
   - Go to your service in Render dashboard
   - Click "Logs" tab
   - You should see:
     ```
     ✓ TEE Relayer initialized
       Network: mainnet
       Contract: ecuador5.near
       Relayer: ecuador5.near
     🚀 TEE Relayer started
       Polling every 5000ms
     📊 Health check server running on port 10000
     ✓ Relayer polling active
     ```

## Testing End-to-End

To test if the relayer is working:

1. **Create a test request** (from your frontend or CLI):
   ```bash
   near call ecuador5.near ask_advisor '{"question":"What is my risk exposure?","portfolio_data":"{\"NEAR\":100}"}' --accountId ecuador5.near --deposit 0.01 --networkId mainnet
   ```

2. **Watch the relayer logs** in Render dashboard
   - Should see: "Found 1 pending request(s)"
   - Then: "Processing request #0"
   - Finally: "✓ Verification stored on-chain"

3. **Verify on-chain**:
   ```bash
   near view ecuador5.near get_stats '{}' --networkId mainnet
   ```

   Should show increased request/verification counts.

## Troubleshooting

### Relayer not processing requests
- Check logs for errors
- Verify `RELAYER_PRIVATE_KEY` is correct
- Ensure account has enough NEAR for gas fees

### "Error polling pending requests"
- Verify `CONTRACT_ID` is correct (ecuador5.near)
- Check contract is deployed and initialized

### "Failed to fetch signature"
- Verify `NEAR_AI_API_KEY` is valid
- Check NEAR AI Cloud API status

### Service keeps restarting
- Check the logs for crash errors
- Verify all environment variables are set
- Ensure health check is responding

## Render Free Tier Limits

- **750 hours/month** of runtime (enough for 24/7 operation)
- **512 MB RAM**
- **0.1 CPU**
- Service may spin down after 15 minutes of inactivity (first request after will take ~30s to spin up)

To prevent spin-down, you can use a service like UptimeRobot to ping the health endpoint every 5 minutes.

## Monitoring

### Set up monitoring with UptimeRobot (free)

1. Go to https://uptimerobot.com
2. Add new monitor:
   - Type: HTTP(s)
   - URL: `https://blindfold-relayer.onrender.com/health`
   - Interval: 5 minutes
3. Get alerts if service goes down

### View metrics in Render

- Go to service dashboard
- Click "Metrics" tab
- Monitor:
  - CPU usage
  - Memory usage
  - Request count
  - Response time

## Costs

- **Free tier**: $0/month (with limitations above)
- **Starter plan**: $7/month (no spin-down, more resources)

For production use with high volume, consider upgrading to Starter plan.
