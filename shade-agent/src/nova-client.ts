/**
 * NOVA SDK Client for Shade Agent
 */

import { NovaSdk } from 'nova-sdk-js';
import * as nearAPI from 'near-api-js';

let novaClient: NovaSdk | null = null;

export async function getNovaClient(accountId: string): Promise<NovaSdk> {
  if (novaClient) {
    return novaClient;
  }

  const network = process.env.NEAR_NETWORK || 'testnet';
  const privateKey = process.env.NEAR_PRIVATE_KEY!;

  if (!privateKey) {
    throw new Error('NEAR_PRIVATE_KEY environment variable is required');
  }

  // Initialize NEAR connection
  const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
  const keyPair = nearAPI.utils.KeyPair.fromString(privateKey);
  await keyStore.setKey(network, accountId, keyPair);

  const connectionConfig: nearAPI.ConnectConfig = {
    networkId: network,
    keyStore,
    nodeUrl: `https://rpc.${network}.near.org`,
    walletUrl: `https://wallet.${network}.near.org`,
    helperUrl: `https://helper.${network}.near.org`,
  };

  const nearConnection = await nearAPI.connect(connectionConfig);
  const account = await nearConnection.account(accountId);

  // Initialize NOVA SDK
  novaClient = new NovaSdk({
    nearAccount: account,
    ipfsGateway: process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud',
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

    // Sort by timestamp descending and get latest
    const sorted = transactions.sort((a, b) => b.block_timestamp - a.block_timestamp);
    return sorted[0].ipfs_hash;
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
