/**
 * NOVA SDK Simplified Wrappers
 * Uses only real APIs from nova-sdk-js v1.0.3
 */

import { NovaSdk } from 'nova-sdk-js';
import { getNovaClient } from './nova';

/**
 * Upload portfolio data to NOVA vault
 * Uses real SDK upload() method
 */
export async function uploadPortfolioData(
  accountId: string,
  groupId: string,
  portfolioData: any,
  filename: string = `portfolio-${Date.now()}.json`
): Promise<{
  cid: string;
  transactionId: string;
  fileHash: string;
}> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  // Convert portfolio to buffer
  const dataBuffer = Buffer.from(JSON.stringify(portfolioData), 'utf-8');

  // Upload (SDK handles encryption internally)
  const result = await nova.upload(groupId, dataBuffer, filename);

  return {
    cid: result.cid,
    transactionId: result.trans_id,
    fileHash: result.file_hash,
  };
}

/**
 * Retrieve portfolio data from NOVA vault
 * Uses real SDK retrieve() method
 */
export async function retrievePortfolioData(
  accountId: string,
  groupId: string,
  cid: string
): Promise<any> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  // Retrieve (SDK handles decryption internally)
  const result = await nova.retrieve(groupId, cid);

  // Parse JSON data
  const portfolioData = JSON.parse(result.data.toString('utf-8'));

  return portfolioData;
}

/**
 * Create a shared portfolio group
 * Uses real SDK registerGroup() method
 */
export async function createPortfolioGroup(
  accountId: string,
  groupId: string
): Promise<void> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  await nova.registerGroup(groupId);
}

/**
 * Share portfolio access with another user
 * Uses real SDK addGroupMember() method
 */
export async function sharePortfolioAccess(
  accountId: string,
  groupId: string,
  memberAccountId: string
): Promise<void> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  await nova.addGroupMember(groupId, memberAccountId);
}

/**
 * Revoke portfolio access from user
 * Uses real SDK revokeGroupMember() method
 */
export async function revokePortfolioAccess(
  accountId: string,
  groupId: string,
  memberAccountId: string
): Promise<void> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  await nova.revokeGroupMember(groupId, memberAccountId);
}

/**
 * Check if user is authorized to access group
 * Uses real SDK isAuthorized() method
 */
export async function checkPortfolioAccess(
  accountId: string,
  groupId: string,
  targetAccountId?: string
): Promise<boolean> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    return false;
  }

  const userId = targetAccountId || accountId;
  return await nova.isAuthorized(groupId, userId);
}

/**
 * Get group transactions (file uploads)
 * Uses real SDK getTransactionsForGroup() method
 */
export async function getPortfolioHistory(
  accountId: string,
  groupId: string
): Promise<
  Array<{
    fileHash: string;
    ipfsHash: string;
    timestamp: number;
    uploader: string;
  }>
> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    return [];
  }

  try {
    const transactions = await nova.getTransactionsForGroup(groupId);

    if (!transactions) {
      return [];
    }

    // Map SDK Transaction type to our expected format
    return transactions.map((tx) => ({
      fileHash: tx.file_hash,
      ipfsHash: tx.ipfs_hash,
      timestamp: Date.now(), // SDK doesn't provide timestamp
      uploader: tx.user_id,
    }));
  } catch (error) {
    console.error('Failed to get transaction history:', error);
    return [];
  }
}

/**
 * Get group owner
 * Uses real SDK getGroupOwner() method
 */
export async function getGroupOwner(
  accountId: string,
  groupId: string
): Promise<string | null> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    return null;
  }

  try {
    return await nova.getGroupOwner(groupId);
  } catch (error) {
    console.error('Failed to get group owner:', error);
    return null;
  }
}

/**
 * Get TEE attestation checksum for verification
 * Uses real SDK getGroupChecksum() method
 */
export async function getShadeChecksum(
  accountId: string,
  groupId: string
): Promise<string | null> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    return null;
  }

  try {
    return await nova.getGroupChecksum(groupId);
  } catch (error) {
    console.error('Failed to get checksum:', error);
    return null;
  }
}
