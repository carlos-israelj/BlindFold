/**
 * NOVA Encryption Architecture Documentation
 *
 * NOTE: NOVA SDK handles encryption/decryption internally via upload() and retrieve().
 * This file documents how the encryption works and provides utilities for
 * understanding the security model.
 *
 * Encryption Flow:
 * 1. upload() - SDK encrypts data client-side with AES-256-GCM before uploading
 * 2. retrieve() - SDK decrypts data after downloading from IPFS
 *
 * Shade Agent Integration:
 * - Keys are derived from NEAR account using TEE-based key derivation
 * - Shade agents can access keys via ephemeral tokens signed by user
 * - No private keys ever leave the TEE environment
 */

import { getNovaClient } from './nova';
import { uploadPortfolioData, retrievePortfolioData } from './nova-simple';

export interface EncryptionMetadata {
  algorithm: 'AES-256-GCM';
  keyDerivation: 'shade-tee' | 'client-side';
  groupId: string;
  cid: string;
  transactionId: string;
}

/**
 * Upload and encrypt portfolio data
 * Uses NOVA SDK's built-in encryption (AES-256-GCM)
 */
export async function encryptAndUpload(
  accountId: string,
  groupId: string,
  data: any,
  filename?: string
): Promise<EncryptionMetadata> {
  // NOVA SDK handles encryption internally
  const result = await uploadPortfolioData(accountId, groupId, data, filename);

  return {
    algorithm: 'AES-256-GCM',
    keyDerivation: 'shade-tee',
    groupId,
    cid: result.cid,
    transactionId: result.transactionId,
  };
}

/**
 * Retrieve and decrypt portfolio data
 * Uses NOVA SDK's built-in decryption
 */
export async function retrieveAndDecrypt(
  accountId: string,
  groupId: string,
  cid: string
): Promise<any> {
  // NOVA SDK handles decryption internally
  return await retrievePortfolioData(accountId, groupId, cid);
}

/**
 * Check if user is authorized to access encrypted data
 */
export async function checkEncryptionAccess(
  accountId: string,
  groupId: string
): Promise<{
  hasAccess: boolean;
  keyDerivation: 'shade-tee' | 'unavailable';
}> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    return {
      hasAccess: false,
      keyDerivation: 'unavailable',
    };
  }

  try {
    const hasAccess = await nova.isAuthorized(groupId, accountId);

    return {
      hasAccess,
      keyDerivation: hasAccess ? 'shade-tee' : 'unavailable',
    };
  } catch (error) {
    console.error('Failed to check encryption access:', error);
    return {
      hasAccess: false,
      keyDerivation: 'unavailable',
    };
  }
}

/**
 * Get encryption metadata for a group
 */
export async function getEncryptionInfo(
  accountId: string,
  groupId: string
): Promise<{
  algorithm: string;
  keyManagement: string;
  teeProvider: string;
  owner: string | null;
  checksum: string | null;
}> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  try {
    const [owner, checksum] = await Promise.all([
      nova.getGroupOwner(groupId),
      nova.getGroupChecksum(groupId),
    ]);

    return {
      algorithm: 'AES-256-GCM',
      keyManagement: 'Shade TEE Key Derivation',
      teeProvider: 'Phala Network',
      owner,
      checksum,
    };
  } catch (error) {
    console.error('Failed to get encryption info:', error);
    throw error;
  }
}

/**
 * ENCRYPTION ARCHITECTURE DOCUMENTATION
 *
 * How NOVA Encryption Works:
 *
 * 1. CLIENT-SIDE ENCRYPTION (upload):
 *    - User calls nova.upload(groupId, data, filename)
 *    - SDK generates encryption key from:
 *      * User's NEAR account (deterministic)
 *      * Group ID
 *      * Shade TEE key derivation
 *    - Data encrypted with AES-256-GCM
 *    - Encrypted data uploaded to IPFS
 *    - Transaction recorded on NEAR blockchain
 *
 * 2. KEY MANAGEMENT (Shade TEE):
 *    - Keys never stored in plaintext
 *    - Derived on-demand from NEAR account + group ID
 *    - Shade agents can request ephemeral access tokens
 *    - Tokens signed with ed25519 and time-limited
 *    - Keys exist only in TEE memory during decryption
 *
 * 3. DECRYPTION (retrieve):
 *    - User calls nova.retrieve(groupId, cid)
 *    - SDK checks authorization via isAuthorized()
 *    - Key derived in TEE using same process
 *    - Data fetched from IPFS and decrypted
 *    - Plaintext returned to authorized user
 *
 * 4. GROUP SHARING:
 *    - Owner calls nova.addGroupMember(groupId, memberAccountId)
 *    - Member gets access to derived key
 *    - Member can now decrypt all group files
 *    - Revocation via revokeGroupMember() rotates keys
 *
 * 5. TEE ATTESTATION:
 *    - Phala Network provides TEE code attestation
 *    - Checksum verifies Shade agent code integrity
 *    - getGroupChecksum() returns attestation hash
 *    - Users can verify their data is processed by correct code
 *
 * Security Properties:
 * ✅ End-to-end encryption (data encrypted before upload)
 * ✅ Zero-knowledge (service never sees plaintext)
 * ✅ TEE key derivation (keys never leave secure enclave)
 * ✅ On-chain access control (authorization on NEAR)
 * ✅ Key rotation (on member revocation)
 * ✅ Code attestation (verify TEE integrity)
 */
