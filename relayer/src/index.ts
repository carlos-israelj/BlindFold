import { Near, Account } from 'near-kit';
import OpenAI from 'openai';
import crypto from 'crypto';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

// Configuration
const CONFIG = {
  CONTRACT_ID: process.env.CONTRACT_ID || 'blindfold.testnet',
  NEAR_NETWORK: process.env.NEAR_NETWORK || 'testnet',
  RELAYER_ACCOUNT_ID: process.env.RELAYER_ACCOUNT_ID!,
  RELAYER_PRIVATE_KEY: process.env.RELAYER_PRIVATE_KEY!,
  NEAR_AI_API_KEY: process.env.NEAR_AI_API_KEY!,
  NEAR_AI_MODEL: process.env.NEAR_AI_MODEL || 'deepseek-ai/DeepSeek-V3.1',
  POLL_INTERVAL_MS: parseInt(process.env.POLL_INTERVAL_MS || '5000'),
};

// System prompt for the AI advisor
const SYSTEM_PROMPT = `You are BlindFold, a blindfolded AI financial advisor for crypto portfolios.
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
- Keep responses under 200 words for daily check-ins`;

interface AdvisorRequest {
  id: number;
  user: string;
  question: string;
  portfolio_data: string;
  timestamp: string;
  status: string;
}

class TEERelayer {
  private near: Near;
  private openai: OpenAI;
  private isProcessing = false;

  constructor() {
    // Initialize NEAR connection with private key
    this.near = new Near({
      network: CONFIG.NEAR_NETWORK,
      privateKey: CONFIG.RELAYER_PRIVATE_KEY,
      defaultSignerId: CONFIG.RELAYER_ACCOUNT_ID,
    });

    // Initialize NEAR AI Cloud client
    this.openai = new OpenAI({
      baseURL: 'https://cloud-api.near.ai/v1',
      apiKey: CONFIG.NEAR_AI_API_KEY,
    });

    console.log('✓ TEE Relayer initialized');
    console.log(`  Network: ${CONFIG.NEAR_NETWORK}`);
    console.log(`  Contract: ${CONFIG.CONTRACT_ID}`);
    console.log(`  Relayer: ${CONFIG.RELAYER_ACCOUNT_ID}`);
  }

  /**
   * Poll contract for pending requests
   */
  async pollPendingRequests(): Promise<AdvisorRequest[]> {
    try {
      const result = await this.near.view(
        CONFIG.CONTRACT_ID,
        'get_pending_requests',
        {}
      );
      return result || [];
    } catch (error) {
      console.error('Error polling pending requests:', error);
      return [];
    }
  }

  /**
   * Forward request to NEAR AI Cloud TEE and get verified response
   */
  async processRequest(request: AdvisorRequest) {
    console.log(`\n📨 Processing request #${request.id} from ${request.user}`);
    console.log(`   Question: "${request.question}"`);

    try {
      // Mark request as processing
      await this.near.transaction(CONFIG.RELAYER_ACCOUNT_ID)
        .functionCall(
          CONFIG.CONTRACT_ID,
          'mark_processing',
          { request_id: request.id },
          { gas: '10 Tgas' }
        )
        .send();
      console.log(`   ✓ Marked as processing`);

      // Build request body
      const requestBody = {
        model: CONFIG.NEAR_AI_MODEL,
        messages: [
          { role: 'system' as const, content: SYSTEM_PROMPT },
          {
            role: 'user' as const,
            content: `Portfolio:\n${request.portfolio_data}\n\nQuestion: ${request.question}`
          },
        ],
        stream: false,
      };

      // Hash request
      const requestBodyString = JSON.stringify(requestBody);
      const requestHash = crypto
        .createHash('sha256')
        .update(requestBodyString)
        .digest('hex');

      console.log(`   Request hash: sha256:${requestHash.substring(0, 16)}...`);

      // Call NEAR AI Cloud TEE
      const completion = await this.openai.chat.completions.create(requestBody);

      const chatId = completion.id;
      const responseText = completion.choices[0]?.message?.content || '';

      console.log(`   Response received (${responseText.length} chars)`);

      // Hash response
      const responseHash = crypto
        .createHash('sha256')
        .update(responseText)
        .digest('hex');

      console.log(`   Response hash: sha256:${responseHash.substring(0, 16)}...`);

      // Fetch signature from NEAR AI Cloud
      const signatureResponse = await fetch(
        `https://cloud-api.near.ai/v1/signature/${chatId}?model=${encodeURIComponent(CONFIG.NEAR_AI_MODEL)}&signing_algo=ecdsa`,
        {
          headers: {
            'Authorization': `Bearer ${CONFIG.NEAR_AI_API_KEY}`,
          },
        }
      );

      if (!signatureResponse.ok) {
        throw new Error(`Failed to fetch signature: ${signatureResponse.statusText}`);
      }

      const signatureData = await signatureResponse.json();

      console.log(`   TEE signature obtained`);
      console.log(`   Signing address: ${signatureData.signing_address}`);

      // Verify signature using signatureData.text (canonical signed string from NEAR AI Cloud)
      // Format: "requestHash:responseHash" — use the API's version, not our local computation
      const signedText = signatureData.text || `${requestHash}:${responseHash}`;
      const recoveredAddress = ethers.verifyMessage(signedText, signatureData.signature);
      const isValid = recoveredAddress.toLowerCase() === signatureData.signing_address.toLowerCase();

      if (!isValid) {
        throw new Error('Signature verification failed!');
      }

      // Parse canonical hashes from the signed text
      const [canonicalReqHash, canonicalResHash] = signedText.split(':');

      console.log(`   ✓ Signature verified locally`);

      // Call contract to store verification
      await this.near.transaction(CONFIG.RELAYER_ACCOUNT_ID)
        .functionCall(
          CONFIG.CONTRACT_ID,
          'store_verification',
          {
            request_id: request.id,
            request_hash: canonicalReqHash || requestHash,
            response_hash: canonicalResHash || responseHash,
            signature: signatureData.signature,
            signing_address: signatureData.signing_address,
            signing_algo: signatureData.signing_algo,
            tee_attestation: JSON.stringify({ chatId, model: CONFIG.NEAR_AI_MODEL }),
            response_text: responseText,
          },
          { gas: '30 Tgas' }
        )
        .send();

      console.log(`   ✓ Response provided to contract`);
      console.log(`   ✓ Verification stored on-chain\n`);

    } catch (error) {
      console.error(`   ✗ Error processing request #${request.id}:`, error);
    }
  }

  /**
   * Main polling loop with production-ready error handling
   */
  async start() {
    console.log('\n🚀 TEE Relayer started');
    console.log(`   Polling every ${CONFIG.POLL_INTERVAL_MS}ms`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);

    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;

    const poll = async () => {
      if (this.isProcessing) {
        return;
      }

      this.isProcessing = true;

      try {
        const pendingRequests = await this.pollPendingRequests();

        if (pendingRequests.length > 0) {
          console.log(`[${new Date().toISOString()}] Found ${pendingRequests.length} pending request(s)`);

          for (const request of pendingRequests) {
            await this.processRequest(request);
          }
        }

        // Reset error counter on success
        consecutiveErrors = 0;

      } catch (error) {
        consecutiveErrors++;
        console.error(`[${new Date().toISOString()}] Error in polling loop (${consecutiveErrors}/${maxConsecutiveErrors}):`, error);

        // Exponential backoff on consecutive errors
        if (consecutiveErrors >= maxConsecutiveErrors) {
          const backoffTime = Math.min(CONFIG.POLL_INTERVAL_MS * Math.pow(2, consecutiveErrors - maxConsecutiveErrors), 60000);
          console.warn(`⚠️  Backing off for ${backoffTime}ms due to repeated errors`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      } finally {
        this.isProcessing = false;
      }

      // Schedule next poll
      setTimeout(poll, CONFIG.POLL_INTERVAL_MS);
    };

    // Start polling
    poll();
    console.log('✓ Relayer polling active\n');
  }
}

// Start the relayer
async function main() {
  // Validate configuration
  if (!CONFIG.RELAYER_ACCOUNT_ID || !CONFIG.RELAYER_PRIVATE_KEY) {
    console.error('❌ Error: RELAYER_ACCOUNT_ID and RELAYER_PRIVATE_KEY must be set');
    process.exit(1);
  }

  if (!CONFIG.NEAR_AI_API_KEY) {
    console.error('❌ Error: NEAR_AI_API_KEY must be set');
    process.exit(1);
  }

  // Start health check HTTP server for Render
  const app = express();
  const PORT = process.env.PORT || 3000;

  let relayerStatus = {
    status: 'starting',
    uptime: 0,
    lastPoll: null as string | null,
    processedRequests: 0,
  };

  app.get('/', (req, res) => {
    res.json({
      service: 'BlindFold TEE Relayer',
      ...relayerStatus,
      uptime: process.uptime(),
    });
  });

  app.get('/health', (req, res) => {
    res.json({
      status: relayerStatus.status === 'running' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  });

  app.listen(PORT, () => {
    console.log(`📊 Health check server running on port ${PORT}`);
    relayerStatus.status = 'running';
  });

  // Start the relayer
  const relayer = new TEERelayer();
  await relayer.start();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down TEE Relayer...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down TEE Relayer...');
  process.exit(0);
});

// Start the relayer
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
