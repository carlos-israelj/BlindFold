import crypto from 'crypto';
import { ethers } from 'ethers';
import { SignatureData } from '@/types';

export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function verifySignature(data: SignatureData): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(data.text, data.signature);
    return recoveredAddress.toLowerCase() === data.signing_address.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

export async function fetchSignature(
  chatId: string,
  model: string,
  apiKey: string
): Promise<SignatureData | null> {
  try {
    const response = await fetch(
      `https://cloud-api.near.ai/v1/signature/${chatId}?model=${encodeURIComponent(model)}&signing_algo=ecdsa`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch signature: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching signature:', error);
    return null;
  }
}

export async function fetchAttestation(
  model: string,
  apiKey: string,
  nonce?: string
): Promise<any> {
  try {
    const nonceParam = nonce || crypto.randomBytes(32).toString('hex');
    const response = await fetch(
      `https://cloud-api.near.ai/v1/attestation/report?model=${encodeURIComponent(model)}&signing_algo=ecdsa&nonce=${nonceParam}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch attestation: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching attestation:', error);
    return null;
  }
}
