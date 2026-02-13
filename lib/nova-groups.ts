/**
 * NOVA Group Vaults
 * Multi-party portfolio vaults with granular permissions
 */

import { NovaSdk } from 'nova-sdk-js';
import { getNovaClient } from './nova';

export interface GroupMember {
  accountId: string;
  role: 'admin' | 'editor' | 'viewer';
  addedAt: Date;
}

export interface GroupVault {
  id: string;
  name: string;
  description: string;
  owner: string;
  members: GroupMember[];
  permissions: {
    read: string[];
    write: string[];
    admin: string[];
  };
  createdAt: Date;
}

export interface ShareRequest {
  vaultId: string;
  recipientAccountId: string;
  role: 'viewer' | 'editor';
  expiresAt?: Date;
}

/**
 * Create family/group portfolio vault
 */
export async function createFamilyVault(
  ownerAccountId: string,
  familyMembers: string[],
  vaultName: string = 'Family Portfolio Vault'
): Promise<GroupVault> {
  const nova = await getNovaClient(ownerAccountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  try {
    // Create group vault with multi-party access
    const groupVault = await nova.vaults.createGroup({
      name: vaultName,
      description: 'Shared portfolio vault for family members',
      members: familyMembers.map((member) => ({
        accountId: member,
        role: member === ownerAccountId ? 'admin' : 'viewer',
      })),
      permissions: {
        read: familyMembers, // All members can view
        write: [ownerAccountId], // Only owner can modify
        admin: [ownerAccountId], // Only owner has admin rights
      },
      encryption: {
        type: 'group-key',
        keySharing: 'shade-agent', // Shade manages group keys
      },
    });

    return {
      id: groupVault.id,
      name: vaultName,
      description: 'Shared portfolio vault',
      owner: ownerAccountId,
      members: familyMembers.map((member) => ({
        accountId: member,
        role: member === ownerAccountId ? 'admin' : 'viewer',
        addedAt: new Date(),
      })),
      permissions: {
        read: familyMembers,
        write: [ownerAccountId],
        admin: [ownerAccountId],
      },
      createdAt: new Date(),
    };
  } catch (error: any) {
    console.error('Failed to create group vault:', error);

    // Fallback: Create individual vault
    console.warn('Creating individual vault as fallback');
    const vault = await nova.vaults.create({
      name: vaultName,
      description: 'Portfolio vault (individual)',
    });

    return {
      id: vault.id,
      name: vaultName,
      description: 'Portfolio vault (individual - group features unavailable)',
      owner: ownerAccountId,
      members: [
        {
          accountId: ownerAccountId,
          role: 'admin',
          addedAt: new Date(),
        },
      ],
      permissions: {
        read: [ownerAccountId],
        write: [ownerAccountId],
        admin: [ownerAccountId],
      },
      createdAt: new Date(),
    };
  }
}

/**
 * Add member to existing group vault
 */
export async function addMemberToVault(
  ownerAccountId: string,
  vaultId: string,
  newMemberAccountId: string,
  role: 'viewer' | 'editor' = 'viewer'
): Promise<void> {
  const nova = await getNovaClient(ownerAccountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  await nova.vaults.addMember(vaultId, {
    accountId: newMemberAccountId,
    role,
  });
}

/**
 * Remove member from group vault
 */
export async function removeMemberFromVault(
  ownerAccountId: string,
  vaultId: string,
  memberAccountId: string
): Promise<void> {
  const nova = await getNovaClient(ownerAccountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  await nova.vaults.removeMember(vaultId, memberAccountId);
}

/**
 * Update member role in group vault
 */
export async function updateMemberRole(
  ownerAccountId: string,
  vaultId: string,
  memberAccountId: string,
  newRole: 'viewer' | 'editor' | 'admin'
): Promise<void> {
  const nova = await getNovaClient(ownerAccountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  await nova.vaults.updateMember(vaultId, memberAccountId, {
    role: newRole,
  });
}

/**
 * Share vault with temporary access
 */
export async function shareVaultTemporary(
  ownerAccountId: string,
  shareRequest: ShareRequest
): Promise<{ shareToken: string; expiresAt: Date }> {
  const nova = await getNovaClient(ownerAccountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  try {
    const share = await nova.vaults.createShareLink({
      vaultId: shareRequest.vaultId,
      recipientAccountId: shareRequest.recipientAccountId,
      permissions: shareRequest.role === 'viewer' ? ['read'] : ['read', 'write'],
      expiresAt: shareRequest.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      shareToken: share.token,
      expiresAt: share.expiresAt,
    };
  } catch (error) {
    console.error('Failed to create share link:', error);
    throw new Error('Failed to create temporary share link');
  }
}

/**
 * Revoke access to vault
 */
export async function revokeVaultAccess(
  ownerAccountId: string,
  vaultId: string,
  memberAccountId: string
): Promise<void> {
  const nova = await getNovaClient(ownerAccountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  // Remove member access
  await nova.vaults.revokeAccess(vaultId, memberAccountId);
}

/**
 * Get all members of group vault
 */
export async function getVaultMembers(
  accountId: string,
  vaultId: string
): Promise<GroupMember[]> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    return [];
  }

  try {
    const vault = await nova.vaults.get(vaultId);
    const members = vault.members || [];

    return members.map((member: any) => ({
      accountId: member.accountId,
      role: member.role,
      addedAt: new Date(member.addedAt),
    }));
  } catch (error) {
    console.error('Failed to get vault members:', error);
    return [];
  }
}

/**
 * Check if user has access to vault
 */
export async function checkVaultAccess(
  accountId: string,
  vaultId: string
): Promise<{
  hasAccess: boolean;
  role?: 'admin' | 'editor' | 'viewer';
  permissions: string[];
}> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    return { hasAccess: false, permissions: [] };
  }

  try {
    const access = await nova.vaults.checkAccess(vaultId, accountId);

    return {
      hasAccess: access.granted,
      role: access.role,
      permissions: access.permissions,
    };
  } catch (error) {
    console.error('Failed to check vault access:', error);
    return { hasAccess: false, permissions: [] };
  }
}
