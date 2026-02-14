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
    // Find user by accountId
    const user = await prisma.user.findUnique({
      where: { accountId },
      select: { novaApiKey: true, novaAccountId: true },
    });

    if (!user || !user.novaApiKey || !user.novaAccountId) {
      console.warn(`NOVA credentials not found for ${accountId}`);
      return null;
    }

    // Decrypt API key
    const apiKey = await decryptApiKey(user.novaApiKey);

    // Create client with NOVA account ID (not wallet address)
    return createNovaClient(user.novaAccountId, apiKey);
  } catch (error) {
    console.error('Error getting NOVA client:', error);
    return null;
  }
}

export async function createVault(accountId: string): Promise<string> {
  const nova = await getNovaClient(accountId);
  const vaultId = `vault.${accountId}`;

  if (!nova) {
    throw new Error('NOVA vault service is not available. Please save your NOVA API key first.');
  }

  try {
    await nova.registerGroup(vaultId);
    return vaultId;
  } catch (error) {
    console.error('Error creating vault:', error);
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
    // Note: NOVA SDK may not have deleteGroup method
    // For now, this is a placeholder - vault deletion may need manual intervention
    console.log(`Vault deletion requested for ${vaultId}`);
    // await nova.deleteGroup(vaultId);
    throw new Error('Vault deletion not yet implemented in NOVA SDK');
  } catch (error) {
    console.error('Error deleting vault:', error);
    throw error;
  }
}
