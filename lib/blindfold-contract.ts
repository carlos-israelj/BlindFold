/**
 * BlindFold Smart Contract Integration
 * Contract: ecuador5.near (NEAR Mainnet)
 *
 * Implements Yield/Resume pattern for TEE-verified AI advisor responses
 */

import { Near } from 'near-kit';

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
  const near = new Near({
    network: NEAR_NETWORK,
  });

  try {
    // Call smart contract's ask_advisor method
    // Requires 0.01 NEAR deposit for storage
    const result = await near
      .transaction(accountId)
      .functionCall(
        CONTRACT_ID,
        'ask_advisor',
        {
          question,
          portfolio_data: portfolioData,
        },
        {
          gas: '30 Tgas',
          attachedDeposit: '0.01 NEAR', // 0.01 NEAR for storage
        }
      )
      .send();

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
  const near = new Near({
    network: NEAR_NETWORK,
  });

  try {
    const request = await near.view<AdvisorRequest>(
      CONTRACT_ID,
      'get_request',
      { request_id: requestId }
    );

    return request;
  } catch (error) {
    console.error('Error getting request:', error);
    return null;
  }
}

/**
 * Get verification for a completed request
 */
export async function getVerification(verificationId: number): Promise<Verification | null> {
  const near = new Near({
    network: NEAR_NETWORK,
  });

  try {
    const verification = await near.view<Verification>(
      CONTRACT_ID,
      'get_verification',
      { verification_id: verificationId }
    );

    return verification;
  } catch (error) {
    console.error('Error getting verification:', error);
    return null;
  }
}

/**
 * Get all requests for a specific user
 */
export async function getUserRequests(accountId: string): Promise<AdvisorRequest[]> {
  const near = new Near({
    network: NEAR_NETWORK,
  });

  try {
    const requests = await near.view<AdvisorRequest[]>(
      CONTRACT_ID,
      'get_user_requests',
      { user: accountId }
    );

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
  const near = new Near({
    network: NEAR_NETWORK,
  });

  try {
    const verifications = await near.view<Verification[]>(
      CONTRACT_ID,
      'get_user_verifications',
      { user: accountId }
    );

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
  const near = new Near({
    network: NEAR_NETWORK,
  });

  try {
    const riskScore = await near.view<RiskScore>(
      CONTRACT_ID,
      'calculate_risk_score',
      { portfolio_json: portfolioJson }
    );

    return riskScore;
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
  const near = new Near({
    network: NEAR_NETWORK,
  });

  try {
    const stats = await near.view<[number, number, number, number]>(
      CONTRACT_ID,
      'get_stats',
      {}
    );

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
      throw new Error('Request failed on relayer');
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error('Request timeout - relayer took too long');
}
