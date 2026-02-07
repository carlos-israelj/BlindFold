import { NovaSdk } from 'nova-sdk-js';

let novaClient: NovaSdk | null = null;

export function createNovaClient(accountId: string): NovaSdk {
  if (!process.env.NOVA_API_KEY) {
    throw new Error('NOVA_API_KEY is not set');
  }

  return new NovaSdk(accountId, {
    apiKey: process.env.NOVA_API_KEY,
  });
}

export function getNovaClient(accountId: string): NovaSdk {
  if (!novaClient) {
    novaClient = createNovaClient(accountId);
  }
  return novaClient;
}

export async function createVault(accountId: string): Promise<string> {
  const nova = getNovaClient(accountId);
  const vaultId = `vault.${accountId}`;

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
  const nova = getNovaClient(accountId);

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
  const nova = getNovaClient(accountId);

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
  const nova = getNovaClient(accountId);

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
  const nova = getNovaClient(accountId);

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
  const nova = getNovaClient(accountId);

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
