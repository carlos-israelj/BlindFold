/**
 * NEP-413 Message Signing Utilities
 * https://github.com/near/NEPs/blob/master/neps/nep-0413.md
 */

export interface NEP413Message {
  message: string;
  nonce: string;
  recipient: string;
  callbackUrl?: string;
}

/**
 * Sign a NEP-413 message using NEAR wallet
 * This function requests the wallet to sign a message
 */
export async function signNEP413Message(
  wallet: any, // HOT Kit wallet instance
  message: NEP413Message
): Promise<{
  signature: string;
  publicKey: string;
}> {
  try {
    // For NEAR wallets, we need to request signature
    // The wallet will display the message to the user
    const messageString = JSON.stringify(message);

    // HOT Kit should expose a signMessage method
    // If not available, we'll need to use the underlying wallet adapter
    if (wallet.signMessage) {
      const { signature, publicKey } = await wallet.signMessage({
        message: messageString,
        nonce: message.nonce,
        recipient: message.recipient,
      });

      return {
        signature: Buffer.from(signature).toString('base64'),
        publicKey,
      };
    }

    // Fallback: Try to use NEAR wallet selector directly
    if (wallet.wallet && wallet.wallet.signMessage) {
      const result = await wallet.wallet.signMessage({
        message: messageString,
        nonce: Buffer.from(message.nonce),
        recipient: message.recipient,
      });

      return {
        signature: Buffer.from(result.signature).toString('base64'),
        publicKey: result.publicKey.toString(),
      };
    }

    throw new Error('Wallet does not support message signing');
  } catch (error) {
    console.error('NEP-413 signing error:', error);
    throw error;
  }
}

/**
 * Format message for display to user
 */
export function formatNEP413MessageForDisplay(message: NEP413Message): string {
  return `${message.message}\n\nNonce: ${message.nonce.slice(0, 8)}...\nRecipient: ${message.recipient}`;
}
