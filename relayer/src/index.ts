import { Near, Account } from 'near-kit';
import OpenAI from 'openai';
import crypto from 'crypto';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

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
  private account: Account;
  private openai: OpenAI;
  private isProcessing = false;

  constructor() {
    // Initialize NEAR connection
    this.near = new Near({
      networkId: CONFIG.NEAR_NETWORK,
      nodeUrl: CONFIG.NEAR_NETWORK === 'mainnet'
        ? 'https://rpc.mainnet.near.org'
        : 'https://rpc.testnet.near.org',
    });

    // Initialize relayer account
    this.account = new Account(
      this.near,
      CONFIG.RELAYER_ACCOUNT_ID,
      CONFIG.RELAYER_PRIVATE_KEY
    );

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
      const result = await this.account.view<AdvisorRequest[]>(
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

      // Verify signature locally
      const expectedText = `${requestHash}:${responseHash}`;
      const recoveredAddress = ethers.verifyMessage(expectedText, signatureData.signature);
      const isValid = recoveredAddress.toLowerCase() === signatureData.signing_address.toLowerCase();

      if (!isValid) {
        throw new Error('Signature verification failed!');
      }

      console.log(`   ✓ Signature verified locally`);

      // Call contract to provide response and store verification
      await this.provideResponseToContract(
        request.id,
        responseText,
        requestHash,
        responseHash,
        signatureData.signature,
        signatureData.signing_address,
        signatureData.signing_algo,
        JSON.stringify({ chatId, model: CONFIG.NEAR_AI_MODEL })
      );

      console.log(`   ✓ Response provided to contract`);
      console.log(`   ✓ Verification stored on-chain\n`);

    } catch (error) {
      console.error(`   ✗ Error processing request #${request.id}:`, error);
    }
  }

  /**
   * Call contract to provide AI response and store verification
   */
  async provideResponseToContract(
    requestId: number,
    responseText: string,
    requestHash: string,
    responseHash: string,
    signature: string,
    signingAddress: string,
    signingAlgo: string,
    teeAttestation: string
  ) {
    await this.account.call(
      CONFIG.CONTRACT_ID,
      'provide_ai_response',
      {
        request_id: requestId,
        response_text: responseText,
        request_hash: requestHash,
        response_hash: responseHash,
        signature,
        signing_address: signingAddress,
        signing_algo: signingAlgo,
        tee_attestation: teeAttestation,
      },
      {
        gas: '30000000000000', // 30 TGas
      }
    );
  }

  /**
   * Main polling loop
   */
  async start() {
    console.log('\n🚀 TEE Relayer started');
    console.log(`   Polling every ${CONFIG.POLL_INTERVAL_MS}ms\n`);

    setInterval(async () => {
      if (this.isProcessing) {
        return; // Skip if already processing
      }

      this.isProcessing = true;

      try {
        const pendingRequests = await this.pollPendingRequests();

        if (pendingRequests.length > 0) {
          console.log(`Found ${pendingRequests.length} pending request(s)`);

          // Process requests sequentially
          for (const request of pendingRequests) {
            await this.processRequest(request);
          }
        }
      } catch (error) {
        console.error('Error in polling loop:', error);
      } finally {
        this.isProcessing = false;
      }
    }, CONFIG.POLL_INTERVAL_MS);
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
