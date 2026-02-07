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

export async function deleteVault(accountId: string, vaultId: string): Promise<void> {
  const nova = getNovaClient(accountId);

  try {
    await nova.deleteGroup(vaultId);
  } catch (error) {
    console.error('Error deleting vault:', error);
    throw error;
  }
}
