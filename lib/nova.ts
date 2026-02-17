import { NovaSdk } from 'nova-sdk-js';
import { prisma } from '@/lib/prisma';
import { decryptApiKey } from '@/lib/encryption';

/**
 * Create NOVA client with user's API key
 * @param accountId - NEAR account ID
 * @param apiKey - User's NOVA API key (decrypted)
 */
export function createNovaClient(accountId: string, apiKey: string): NovaSdk {
  return new NovaSdk(accountId, {
    apiKey,
    mcpUrl: 'https://nova-mcp-server.onrender.com/mcp',
  });
}

/**
 * Get NOVA client for a user
 * Fetches and decrypts user's API key from database
 * @param accountId - NEAR account ID (wallet address)
 */
export async function getNovaClient(accountId: string): Promise<NovaSdk | null> {
  try {
    console.log(`[getNovaClient] Looking up user: ${accountId}`);

    // Find user by accountId
    const user = await prisma.user.findUnique({
      where: { accountId },
      select: { novaApiKey: true, novaAccountId: true },
    });

    console.log(`[getNovaClient] User found:`, !!user);
    console.log(`[getNovaClient] Has novaApiKey:`, !!user?.novaApiKey);
    console.log(`[getNovaClient] Has novaAccountId:`, !!user?.novaAccountId);

    if (!user || !user.novaApiKey || !user.novaAccountId) {
      console.warn(`NOVA credentials not found for ${accountId}`);
      return null;
    }

    // Decrypt API key
    console.log(`[getNovaClient] Decrypting API key...`);
    const apiKey = await decryptApiKey(user.novaApiKey);
    console.log(`[getNovaClient] API key decrypted successfully`);

    // Create client with NOVA account ID (not wallet address)
    console.log(`[getNovaClient] Creating NOVA client for ${user.novaAccountId}`);
    return createNovaClient(user.novaAccountId, apiKey);
  } catch (error) {
    console.error('[getNovaClient] Error getting NOVA client:', error);
    return null;
  }
}

export async function createVault(accountId: string): Promise<string> {
  console.log(`[createVault] Starting vault creation for: ${accountId}`);

  const nova = await getNovaClient(accountId);
  const vaultId = `vault.${accountId}`;

  console.log(`[createVault] NOVA client obtained:`, !!nova);

  if (!nova) {
    console.error(`[createVault] NOVA client is null for ${accountId}`);
    throw new Error('NOVA vault service is not available. Please save your NOVA API key first.');
  }

  try {
    console.log(`[createVault] Registering group: ${vaultId}`);
    await nova.registerGroup(vaultId);
    console.log(`[createVault] ✅ Vault created successfully: ${vaultId}`);
    return vaultId;
  } catch (error) {
    console.error('[createVault] Error creating vault:', error);
    throw error;
  }
}

export async function uploadToVault(
  accountId: string,
  vaultId: string,
  data: any,
  filename: string
): Promise<string> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA vault service is not available. Please save your NOVA API key first.');
  }

  try {
    const result = await nova.upload(
      vaultId,
      Buffer.from(JSON.stringify(data)),
      filename
    );
    return result.cid;
  } catch (error) {
    console.error('Error uploading to vault:', error);
    throw error;
  }
}

export async function retrieveFromVault(
  accountId: string,
  vaultId: string,
  cid: string
): Promise<any> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA vault service is not available. Please save your NOVA API key first.');
  }

  try {
    const { data } = await nova.retrieve(vaultId, cid);
    return JSON.parse(data.toString());
  } catch (error) {
    console.error('Error retrieving from vault:', error);
    throw error;
  }
}

export async function listVaultFiles(
  accountId: string,
  vaultId: string
): Promise<Array<{ cid: string; filename: string; size: number; uploadedAt: string }>> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    console.warn('NOVA vault service is not available');
    return [];
  }

  try {
    // Check if NOVA SDK has a list method
    if (typeof (nova as any).list === 'function') {
      const files = await (nova as any).list(vaultId);
      return files;
    } else {
      // If no list method, return placeholder
      console.log('NOVA SDK list method not available');
      return [];
    }
  } catch (error) {
    console.error('Error listing vault files:', error);
    // Return empty array instead of throwing
    return [];
  }
}

export async function getVaultInfo(
  accountId: string,
  vaultId: string
): Promise<any> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA vault service is not available. Please save your NOVA API key first.');
  }

  try {
    // Try to get group info
    if (typeof (nova as any).getGroupInfo === 'function') {
      const info = await (nova as any).getGroupInfo(vaultId);
      return info;
    } else {
      return {
        vaultId,
        message: 'Vault exists and is accessible',
      };
    }
  } catch (error) {
    console.error('Error getting vault info:', error);
    throw error;
  }
}

export async function deleteVault(accountId: string, vaultId: string): Promise<void> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA vault service is not available. Please save your NOVA API key first.');
  }

  try {
    // Soft-delete: revoke the owner's own access so the encrypted data
    // in IPFS becomes permanently inaccessible without the Shade-derived key.
    // The NOVA account ID is the member identifier, not the wallet address.
    const user = await prisma.user.findUnique({
      where: { accountId },
      select: { novaAccountId: true, id: true },
    });

    if (!user?.novaAccountId) {
      throw new Error('NOVA account ID not found');
    }

    await nova.revokeGroupMember(vaultId, user.novaAccountId);
    console.log(`Vault access revoked for ${user.novaAccountId} on group ${vaultId}`);

    // Remove vault record from database
    await prisma.vault.deleteMany({ where: { userId: user.id } });
    console.log(`Vault database record deleted for ${accountId}`);
  } catch (error) {
    console.error('Error deleting vault:', error);
    throw error;
  }
}

export async function addVaultMember(
  accountId: string,
  vaultId: string,
  memberNovaId: string
): Promise<void> {
  const nova = await getNovaClient(accountId);
  if (!nova) throw new Error('NOVA vault service is not available.');
  await nova.addGroupMember(vaultId, memberNovaId);
}

export async function revokeVaultMember(
  accountId: string,
  vaultId: string,
  memberNovaId: string
): Promise<void> {
  const nova = await getNovaClient(accountId);
  if (!nova) throw new Error('NOVA vault service is not available.');
  await nova.revokeGroupMember(vaultId, memberNovaId);
}

export async function getVaultChecksum(
  accountId: string,
  vaultId: string
): Promise<string | null> {
  const nova = await getNovaClient(accountId);
  if (!nova) return null;
  try {
    return await nova.getGroupChecksum(vaultId);
  } catch (error) {
    console.error('Error getting vault checksum:', error);
    return null;
  }
}

export async function getVaultTransactions(
  accountId: string,
  vaultId: string
): Promise<Array<{ group_id: string; user_id: string; file_hash: string; ipfs_hash: string }>> {
  const nova = await getNovaClient(accountId);
  if (!nova) return [];
  try {
    return await nova.getTransactionsForGroup(vaultId);
  } catch (error) {
    console.error('Error getting vault transactions:', error);
    return [];
  }
}
