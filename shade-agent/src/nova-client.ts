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
  const apiKey = process.env.NOVA_API_KEY;

  if (!apiKey) {
    throw new Error('NOVA_API_KEY environment variable is required');
  }

  // Determine RPC based on network
  const rpcUrl = network === 'mainnet'
    ? 'https://rpc.mainnet.near.org'
    : 'https://rpc.testnet.near.org';

  // Use NOVA account ID (e.g., ecuador10.nova-sdk.near) instead of wallet address
  const novaAccountId = process.env.NOVA_ACCOUNT_ID || accountId;

  // Initialize NOVA SDK with API key
  novaClient = new NovaSdk(novaAccountId, {
    rpcUrl,
    apiKey,
  });

  return novaClient;
}

/**
 * Get latest portfolio CID
 *
 * First tries to fetch from the frontend API (automatic),
 * then falls back to environment variable (manual).
 */
export async function getLatestPortfolioCid(
  accountId: string,
  groupId: string
): Promise<string | null> {
  // Try to fetch from frontend API first
  const frontendUrl = process.env.FRONTEND_URL;

  if (frontendUrl) {
    try {
      const apiUrl = `${frontendUrl}/api/vault/latest-cid?accountId=${accountId}&groupId=${groupId}`;
      console.log(`📡 Fetching latest CID from API: ${apiUrl}`);

      const response = await fetch(apiUrl);

      if (response.ok) {
        const data: any = await response.json();
        if (data.success && data.data && data.data.cid) {
          console.log(`✅ Latest CID from API: ${data.data.cid}`);
          console.log(`   Last updated: ${data.data.updatedAt}`);
          return data.data.cid;
        }
      } else if (response.status === 404) {
        console.log('ℹ️  No portfolio found in vault yet');
        return null;
      } else {
        console.log(`⚠️  API returned ${response.status}, falling back to environment variable`);
      }
    } catch (error: any) {
      console.log(`⚠️  Failed to fetch from API: ${error.message}`);
      console.log('   Falling back to environment variable...');
    }
  }

  // Fallback to environment variable
  const envCid = process.env.PORTFOLIO_CID;

  if (envCid) {
    console.log(`Using portfolio CID from environment: ${envCid}`);
    return envCid;
  }

  console.log('⚠️  No PORTFOLIO_CID available from API or environment.');
  console.log('💡 Upload your portfolio through the web interface.');

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
