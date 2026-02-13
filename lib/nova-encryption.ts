/**
 * NOVA Shade Agent Encryption
 * Uses Shade TEE for key management instead of client-side keys
 */

import { NovaSdk } from 'nova-sdk-js';
import { getNovaClient } from './nova';

/**
 * Encrypt data using Shade Agent key management
 * Keys are derived and stored in Phala TEE, never exposed
 */
export async function encryptWithShade(
  data: string,
  accountId: string
): Promise<{
  encrypted: string;
  metadata: {
    algorithm: string;
    keyDerivation: string;
    shadeAttestation: string;
  };
}> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  try {
    // Use NOVA's Shade-based encryption
    // Keys are managed in Phala TEE, derived from user's NEAR account
    const result = await nova.encrypt({
      data: Buffer.from(data, 'utf-8'),
      keyDerivation: {
        type: 'shade-agent',
        accountId: accountId,
      },
      algorithm: 'AES-256-GCM',
    });

    return {
      encrypted: result.ciphertext.toString('base64'),
      metadata: {
        algorithm: 'AES-256-GCM',
        keyDerivation: 'shade-agent-phala-tee',
        shadeAttestation: result.attestation || 'pending',
      },
    };
  } catch (error: any) {
    console.error('Shade encryption error:', error);

    // Fallback to client-side encryption if Shade not available
    console.warn('Falling back to client-side encryption');
    return fallbackEncryption(data, accountId);
  }
}

/**
 * Decrypt data using Shade Agent key management
 */
export async function decryptWithShade(
  encrypted: string,
  accountId: string
): Promise<string> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  try {
    const result = await nova.decrypt({
      ciphertext: Buffer.from(encrypted, 'base64'),
      keyDerivation: {
        type: 'shade-agent',
        accountId: accountId,
      },
    });

    return result.plaintext.toString('utf-8');
  } catch (error: any) {
    console.error('Shade decryption error:', error);
    throw new Error('Failed to decrypt with Shade Agent');
  }
}

/**
 * Fallback client-side encryption (for compatibility)
 */
function fallbackEncryption(data: string, accountId: string) {
  const crypto = require('crypto');

  // Derive key from account ID (deterministic)
  const key = crypto
    .createHash('sha256')
    .update(accountId + process.env.ENCRYPTION_SALT)
    .digest();

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(data, 'utf-8', 'base64');
  encrypted += cipher.final('base64');

  const tag = cipher.getAuthTag();

  const combined = JSON.stringify({
    encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  });

  return {
    encrypted: combined,
    metadata: {
      algorithm: 'AES-256-GCM',
      keyDerivation: 'client-side-fallback',
      shadeAttestation: 'not-available',
    },
  };
}

/**
 * Get Shade Agent attestation for verification
 */
export async function getShadeAttestation(accountId: string): Promise<{
  codehash: string;
  timestamp: number;
  signingKey: string;
  verified: boolean;
}> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  try {
    const attestation = await nova.getShadeAttestation();

    return {
      codehash: attestation.codeHash,
      timestamp: attestation.timestamp,
      signingKey: attestation.publicKey,
      verified: attestation.verified,
    };
  } catch (error) {
    console.error('Failed to get Shade attestation:', error);
    return {
      codehash: 'unavailable',
      timestamp: Date.now(),
      signingKey: 'unavailable',
      verified: false,
    };
  }
}
