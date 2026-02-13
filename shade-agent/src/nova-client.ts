/**
 * NOVA SDK Client for Shade Agent
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
  // Note: contractId is auto-detected by the SDK based on the network
  novaClient = new NovaSdk(accountId, {
    rpcUrl,
  });

  return novaClient;
}

/**
 * Get latest portfolio CID from group transactions
 */
export async function getLatestPortfolioCid(
  accountId: string,
  groupId: string
): Promise<string | null> {
  const nova = await getNovaClient(accountId);

  try {
    const transactions = await nova.getTransactionsForGroup(groupId);

    if (!transactions || transactions.length === 0) {
      return null;
    }

    // Return the most recent transaction's IPFS hash
    // Transactions are already sorted by most recent first
    return transactions[0].ipfs_hash;
  } catch (error) {
    console.error('Failed to get latest CID:', error);
    return null;
  }
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
