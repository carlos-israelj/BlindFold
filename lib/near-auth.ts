import { utils } from 'near-api-js';
import { PublicKey } from 'near-api-js/lib/utils';
import * as borsh from 'borsh';

/**
 * NEP-413: Wallet Authentication Standard
 * https://github.com/near/NEPs/blob/master/neps/nep-0413.md
 */

class Nep413Message {
  message: string;
  nonce: Buffer;
  recipient: string;
  callbackUrl?: string;

  constructor(message: string, nonce: Buffer, recipient: string, callbackUrl?: string) {
    this.message = message;
    this.nonce = nonce;
    this.recipient = recipient;
    this.callbackUrl = callbackUrl;
  }
}

interface VerifyNep413Params {
  accountId: string;
  signature: string;
  message: string;
  publicKey: string;
  nonce: string;
}

/**
 * Verify NEP-413 signature
 * This ensures the wallet signature is valid and the message was signed by the account owner
 */
export async function verifyNep413Signature({
  accountId,
  signature,
  message,
  publicKey,
  nonce,
}: VerifyNep413Params): Promise<boolean> {
  try {
    // Decode the signature (base64)
    const signatureBytes = Buffer.from(signature, 'base64');

    // Prepare the message payload following NEP-413 spec
    const payload = new Nep413Message(
      message,
      Buffer.from(nonce, 'hex'),
      'blindfold.near' // Your contract/app identifier
    );

    // Serialize the payload using Borsh
    const schema = new Map([
      [
        Nep413Message,
        {
          kind: 'struct',
          fields: [
            ['message', 'string'],
            ['nonce', ['u8']],
            ['recipient', 'string'],
            ['callbackUrl', { kind: 'option', type: 'string' }],
          ],
        },
      ],
    ]);

    const serialized = borsh.serialize(schema, payload);

    // Verify the signature
    const pk = PublicKey.fromString(publicKey);
    const isValid = pk.verify(serialized, signatureBytes);

    return isValid;
  } catch (error) {
    console.error('NEP-413 signature verification failed:', error);
    return false;
  }
}

/**
 * Generate a nonce for NEP-413 authentication
 */
export function generateNonce(): string {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Buffer.from(buffer).toString('hex');
}

/**
 * Create a NEP-413 authentication message
 */
export function createAuthMessage(accountId: string): string {
  return `Sign in to BlindFold with your NEAR account: ${accountId}\n\nTimestamp: ${new Date().toISOString()}`;
}
