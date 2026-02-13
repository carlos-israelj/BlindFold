/**
 * NOVA Group Vaults
 * Multi-party portfolio vaults using real NOVA SDK group methods
 */

import { getNovaClient } from './nova';

export interface GroupMember {
  accountId: string;
  role: 'owner' | 'member';
  addedAt: Date;
}

export interface GroupVault {
  groupId: string;
  owner: string;
  members: GroupMember[];
  createdAt: Date;
}

/**
 * Create family/group portfolio vault
 * Uses real SDK registerGroup() method
 */
export async function createFamilyVault(
  ownerAccountId: string,
  groupId: string,
  familyMembers: string[] = []
): Promise<GroupVault> {
  const nova = await getNovaClient(ownerAccountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  // Register group using real SDK method
  await nova.registerGroup(groupId);

  // Add family members to group
  for (const memberAccountId of familyMembers) {
    if (memberAccountId !== ownerAccountId) {
      try {
        await nova.addGroupMember(groupId, memberAccountId);
      } catch (error) {
        console.error(`Failed to add member ${memberAccountId}:`, error);
      }
    }
  }

  return {
    groupId,
    owner: ownerAccountId,
    members: [
      {
        accountId: ownerAccountId,
        role: 'owner',
        addedAt: new Date(),
      },
      ...familyMembers
        .filter((m) => m !== ownerAccountId)
        .map((accountId) => ({
          accountId,
          role: 'member' as const,
          addedAt: new Date(),
        })),
    ],
    createdAt: new Date(),
  };
}

/**
 * Add member to existing group vault
 * Uses real SDK addGroupMember() method
 */
export async function addMemberToVault(
  ownerAccountId: string,
  groupId: string,
  newMemberAccountId: string
): Promise<void> {
  const nova = await getNovaClient(ownerAccountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  await nova.addGroupMember(groupId, newMemberAccountId);
}

/**
 * Remove member from group vault
 * Uses real SDK revokeGroupMember() method
 */
export async function removeMemberFromVault(
  ownerAccountId: string,
  groupId: string,
  memberAccountId: string
): Promise<void> {
  const nova = await getNovaClient(ownerAccountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  // Revoke member - this also rotates encryption keys
  await nova.revokeGroupMember(groupId, memberAccountId);
}

/**
 * Check if user has access to group
 * Uses real SDK isAuthorized() method
 */
export async function checkVaultAccess(
  accountId: string,
  groupId: string,
  targetAccountId?: string
): Promise<{
  hasAccess: boolean;
  role?: 'owner' | 'member';
}> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    return { hasAccess: false };
  }

  try {
    const userId = targetAccountId || accountId;
    const hasAccess = await nova.isAuthorized(groupId, userId);

    // Check if user is owner
    const owner = await nova.getGroupOwner(groupId);
    const isOwner = owner === userId;

    return {
      hasAccess,
      role: hasAccess ? (isOwner ? 'owner' : 'member') : undefined,
    };
  } catch (error) {
    console.error('Failed to check vault access:', error);
    return { hasAccess: false };
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
 * Get group checksum for TEE verification
 * Uses real SDK getGroupChecksum() method
 */
export async function getGroupChecksum(
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
    console.error('Failed to get group checksum:', error);
    return null;
  }
}

/**
 * Get transaction history for group
 * Uses real SDK getTransactionsForGroup() method
 */
export async function getGroupTransactions(
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
    console.error('Failed to get group transactions:', error);
    return [];
  }
}
