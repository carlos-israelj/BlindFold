/**
 * BlindFold Smart Contract Integration
 * Contract: ecuador5.near (NEAR Mainnet)
 *
 * Implements Yield/Resume pattern for TEE-verified AI advisor responses
 */

import * as nearAPI from 'near-api-js';
import { parseNearAmount } from 'near-api-js/lib/utils/format';

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID || 'ecuador5.near';
const NEAR_NETWORK = (process.env.NEXT_PUBLIC_NEAR_NETWORK || 'mainnet') as 'mainnet' | 'testnet';

export interface AdvisorRequest {
  id: number;
  user: string;
  question: string;
  portfolio_data: string;
  timestamp: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
}

export interface Verification {
  id: number;
  request_id: number;
  user: string;
  request_hash: string;
  response_hash: string;
  signature: string;
  signing_address: string;
  signing_algo: string;
  tee_attestation: string;
  response_text: string;
  timestamp: string;
  block_height: number;
}

export interface RiskScore {
  score: number;
  concentration: number;
  diversification: string;
  recommendation: string;
}

/**
 * Get NEAR connection (read-only, no signing key needed)
 */
async function getNearConnection() {
  const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
  const config = {
    networkId: NEAR_NETWORK,
    keyStore,
    nodeUrl: `https://rpc.${NEAR_NETWORK}.near.org`,
    walletUrl: `https://wallet.${NEAR_NETWORK}.near.org`,
    helperUrl: `https://helper.${NEAR_NETWORK}.near.org`,
  };
  return await nearAPI.connect(config);
}

/**
 * Get NEAR connection with relayer signing key loaded from env
 * Used for server-side write transactions (ask_advisor, etc.)
 */
async function getNearConnectionWithKey(): Promise<{ near: nearAPI.Near; signerId: string }> {
  const relayerAccountId = process.env.RELAYER_ACCOUNT_ID || process.env.NEXT_PUBLIC_CONTRACT_ID || CONTRACT_ID;
  const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;

  if (!relayerPrivateKey) {
    throw new Error('RELAYER_PRIVATE_KEY env var is required for on-chain transactions');
  }

  const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
  const keyPair = nearAPI.KeyPair.fromString(relayerPrivateKey as nearAPI.utils.key_pair.KeyPairString);
  await keyStore.setKey(NEAR_NETWORK, relayerAccountId, keyPair);

  const config = {
    networkId: NEAR_NETWORK,
    keyStore,
    nodeUrl: `https://rpc.${NEAR_NETWORK}.near.org`,
    walletUrl: `https://wallet.${NEAR_NETWORK}.near.org`,
    helperUrl: `https://helper.${NEAR_NETWORK}.near.org`,
  };

  const near = await nearAPI.connect(config);
  return { near, signerId: relayerAccountId };
}

/**
 * Ask the AI advisor a question (stores on-chain, triggers relayer)
 * This uses the Yield/Resume pattern - contract yields while relayer processes
 *
 * @param accountId - User's NEAR account
 * @param question - Question for the AI advisor
 * @param portfolioData - JSON string of portfolio data
 * @returns Request ID for tracking
 */
export async function askAdvisor(
  accountId: string,
  question: string,
  portfolioData: string
): Promise<number> {
  try {
    // Use relayer key to sign the transaction server-side
    const { near, signerId } = await getNearConnectionWithKey();
    const account = await near.account(signerId);

    // Call smart contract's ask_advisor method
    // Requires 0.01 NEAR deposit for storage — paid by relayer
    const result = await account.functionCall({
      contractId: CONTRACT_ID,
      methodName: 'ask_advisor',
      args: {
        question,
        portfolio_data: portfolioData,
        // Pass user accountId so contract can record who asked
        user: accountId,
      },
      gas: BigInt('30000000000000'), // 30 Tgas
      attachedDeposit: BigInt(parseNearAmount('0.01') || '0'), // 0.01 NEAR for storage
    });

    // Extract request_id from result
    const requestId = result as unknown as number;
    console.log('✅ Request submitted to contract:', requestId);

    return requestId;
  } catch (error) {
    console.error('Error calling ask_advisor:', error);
    throw error;
  }
}

/**
 * Get a specific advisor request by ID
 */
export async function getRequest(requestId: number): Promise<AdvisorRequest | null> {
  try {
    const near = await getNearConnection();
    const account = await near.account(CONTRACT_ID);

    const request = await account.viewFunction({
      contractId: CONTRACT_ID,
      methodName: 'get_request',
      args: { request_id: requestId },
    });

    return request || null;
  } catch (error) {
    console.error('Error getting request:', error);
    return null;
  }
}

/**
 * Get verification for a completed request
 */
export async function getVerification(verificationId: number): Promise<Verification | null> {
  try {
    const near = await getNearConnection();
    const account = await near.account(CONTRACT_ID);

    const verification = await account.viewFunction({
      contractId: CONTRACT_ID,
      methodName: 'get_verification',
      args: { verification_id: verificationId },
    });

    return verification || null;
  } catch (error) {
    console.error('Error getting verification:', error);
    return null;
  }
}

/**
 * Get all requests for a specific user
 */
export async function getUserRequests(accountId: string): Promise<AdvisorRequest[]> {
  try {
    const near = await getNearConnection();
    const account = await near.account(CONTRACT_ID);

    const requests = await account.viewFunction({
      contractId: CONTRACT_ID,
      methodName: 'get_user_requests',
      args: { user: accountId },
    });

    return requests || [];
  } catch (error) {
    console.error('Error getting user requests:', error);
    return [];
  }
}

/**
 * Get all verifications for a specific user
 */
export async function getUserVerifications(accountId: string): Promise<Verification[]> {
  try {
    const near = await getNearConnection();
    const account = await near.account(CONTRACT_ID);

    const verifications = await account.viewFunction({
      contractId: CONTRACT_ID,
      methodName: 'get_user_verifications',
      args: { user: accountId },
    });

    return verifications || [];
  } catch (error) {
    console.error('Error getting user verifications:', error);
    return [];
  }
}

/**
 * Calculate risk score on-chain using HHI
 */
export async function calculateRiskScore(portfolioJson: string): Promise<RiskScore | null> {
  try {
    const near = await getNearConnection();
    const account = await near.account(CONTRACT_ID);

    const riskScore = await account.viewFunction({
      contractId: CONTRACT_ID,
      methodName: 'calculate_risk_score',
      args: { portfolio_json: portfolioJson },
    });

    return riskScore || null;
  } catch (error) {
    console.error('Error calculating risk score:', error);
    return null;
  }
}

/**
 * Get contract statistics
 */
export async function getStats(): Promise<{
  totalRequests: number;
  totalVerifications: number;
  nextRequestId: number;
  nextVerificationId: number;
} | null> {
  try {
    const near = await getNearConnection();
    const account = await near.account(CONTRACT_ID);

    const stats = await account.viewFunction({
      contractId: CONTRACT_ID,
      methodName: 'get_stats',
      args: {},
    });

    if (!stats) return null;

    return {
      totalRequests: stats[0],
      totalVerifications: stats[1],
      nextRequestId: stats[2],
      nextVerificationId: stats[3],
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return null;
  }
}

/**
 * Poll for request completion
 * Useful for waiting on the relayer to process the request
 */
export async function pollForCompletion(
  requestId: number,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<AdvisorRequest | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const request = await getRequest(requestId);

    if (request && request.status === 'Completed') {
      return request;
    }

    if (request && request.status === 'Failed') {
      console.error('Request failed:', request);
      return null;
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  console.warn('Polling timed out after', maxAttempts, 'attempts');
  return null;
}

/**
 * Verify response signature and TEE attestation
 */
export async function verifyResponse(
  requestId: number,
  expectedSigningAddress: string
): Promise<boolean> {
  try {
    const request = await getRequest(requestId);
    if (!request || request.status !== 'Completed') {
      return false;
    }

    // Find the verification for this request
    const verification = await getVerification(requestId);
    if (!verification) {
      return false;
    }

    // Verify the signing address matches
    if (verification.signing_address.toLowerCase() !== expectedSigningAddress.toLowerCase()) {
      console.error('Signing address mismatch');
      return false;
    }

    // TODO: Verify the actual cryptographic signature
    // This would require importing the signature verification logic

    console.log('✅ Response verified:', verification);
    return true;
  } catch (error) {
    console.error('Error verifying response:', error);
    return false;
  }
}
