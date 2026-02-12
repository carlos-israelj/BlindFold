import { webcrypto } from 'crypto';

/**
 * Encrypt sensitive data using AES-256-GCM
 * Uses a key derived from AUTH_SECRET environment variable
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET not configured');
  }

  // Derive encryption key from AUTH_SECRET
  const encoder = new TextEncoder();
  const secretData = encoder.encode(secret);
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    secretData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await webcrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('nova-api-key-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // Generate random IV
  const iv = webcrypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encrypted = await webcrypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(apiKey)
  );

  // Combine IV and ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Return as base64
  return Buffer.from(combined).toString('base64');
}

/**
 * Decrypt API key encrypted with encryptApiKey
 */
export async function decryptApiKey(encryptedData: string): Promise<string> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET not configured');
  }

  // Derive encryption key from AUTH_SECRET
  const encoder = new TextEncoder();
  const secretData = encoder.encode(secret);
  const keyMaterial = await webcrypto.subtle.importKey(
    'raw',
    secretData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await webcrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('nova-api-key-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  // Decode from base64
  const combined = Buffer.from(encryptedData, 'base64');

  // Extract IV and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  // Decrypt
  const decrypted = await webcrypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
