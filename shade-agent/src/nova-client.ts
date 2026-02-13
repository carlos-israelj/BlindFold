/**
 * NOVA SDK Client for Shade Agent
 *
 * Note: This implementation is READ-ONLY for monitoring purposes.
 * Portfolio data should be uploaded through the web interface.
 */

import { NovaSdk } from 'nova-sdk-js';

let novaClient: NovaSdk | null = null;

export async function getNovaClient(accountId: string): Promise<NovaSdk> {
  if (novaClient) {
    return novaClient;
  }

  const network = process.env.NEAR_NETWORK || 'testnet';
  const privateKey = process.env.NEAR_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('NEAR_PRIVATE_KEY environment variable is required');
  }

  // Determine RPC based on network
  const rpcUrl = network === 'mainnet'
    ? 'https://rpc.mainnet.near.org'
    : 'https://rpc.testnet.near.org';

  // Initialize NOVA SDK
  // Note: contractId is auto-detected based on network
  novaClient = new NovaSdk(accountId, {
    rpcUrl,
  });

  return novaClient;
}

/**
 * Get latest portfolio CID from environment variable
 *
 * Since Shade Agent is READ-ONLY, the CID should be provided
 * via environment variable after portfolio upload from web interface.
 */
export async function getLatestPortfolioCid(
  accountId: string,
  groupId: string
): Promise<string | null> {
  // Check if CID is provided via environment variable
  const envCid = process.env.PORTFOLIO_CID;

  if (envCid) {
    console.log(`Using portfolio CID from environment: ${envCid}`);
    return envCid;
  }

  console.log('⚠️  No PORTFOLIO_CID set in environment.');
  console.log('💡 Upload your portfolio through the web interface,');
  console.log('   then set PORTFOLIO_CID environment variable with the returned CID.');

  return null;
}

/**
 * Retrieve and decrypt portfolio data
 */
export async function retrievePortfolio(
  accountId: string,
  groupId: string,
  cid: string
): Promise<any> {
  const nova = await getNovaClient(accountId);

  const result = await nova.retrieve(groupId, cid);
  const portfolioData = JSON.parse(result.data.toString('utf-8'));

  return portfolioData;
}
