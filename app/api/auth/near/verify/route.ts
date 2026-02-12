import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@near-js/crypto';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { webcrypto } from 'crypto';

interface NEP413Message {
  message: string;
  nonce: string;
  recipient: string;
  callbackUrl?: string;
}

interface NEP413Signature {
  accountId: string;
  publicKey: string;
  signature: string;
  message: NEP413Message;
}

/**
 * Verify NEP-413 signature
 */
async function verifyNEP413Signature(data: NEP413Signature): Promise<boolean> {
  try {
    const { publicKey, signature, message } = data;

    // Parse the public key first
    const pubKey = PublicKey.fromString(publicKey);

    // Decode signature from base64
    const signatureBuffer = Buffer.from(signature, 'base64');

    // NEP-413: Try different message formats to find which one the wallet signed

    // Format 1: Plain message text
    const messageBuffer1 = Buffer.from(message.message, 'utf-8');
    const isValid1 = pubKey.verify(messageBuffer1, signatureBuffer);

    // Format 2: Stringified JSON of the entire message object
    const messageBuffer2 = Buffer.from(JSON.stringify(message), 'utf-8');
    const isValid2 = pubKey.verify(messageBuffer2, signatureBuffer);

    // Format 3: NEP-413 tag + message (standard format)
    const nep413Tag = Buffer.from([0x4e, 0x45, 0x50, 0x34, 0x31, 0x33]); // "NEP413" in hex
    const messageBuffer3 = Buffer.concat([nep413Tag, messageBuffer1]);
    const isValid3 = pubKey.verify(messageBuffer3, signatureBuffer);

    console.log('NEP-413 verification attempts:', {
      message: message.message,
      publicKey,
      signatureLength: signatureBuffer.length,
      format1_plainText: isValid1,
      format2_jsonStringify: isValid2,
      format3_nep413Tag: isValid3,
      messageBuffer1Hex: messageBuffer1.toString('hex').substring(0, 40) + '...',
      messageBuffer2Hex: messageBuffer2.toString('hex').substring(0, 40) + '...',
      messageBuffer3Hex: messageBuffer3.toString('hex').substring(0, 40) + '...',
    });

    return isValid1 || isValid2 || isValid3;
  } catch (error) {
    console.error('NEP-413 signature verification failed:', error);
    return false;
  }
}

/**
 * POST /api/auth/near/verify
 * Verify NEP-413 signature and create session
 */
export async function POST(req: NextRequest) {
  try {
    const signatureData: NEP413Signature = await req.json();

    console.log('[VERIFY] Received signature data:', {
      accountId: signatureData.accountId,
      publicKey: signatureData.publicKey?.substring(0, 20) + '...',
      signature: signatureData.signature?.substring(0, 20) + '...',
      message: signatureData.message,
    });

    // Verify nonce matches
    const storedNonce = req.cookies.get('near_nonce')?.value;
    console.log('[VERIFY] Nonce comparison:', {
      storedNonce: storedNonce?.substring(0, 10) + '...',
      receivedNonce: signatureData.message.nonce?.substring(0, 10) + '...',
      match: storedNonce === signatureData.message.nonce
    });

    if (!storedNonce || storedNonce !== signatureData.message.nonce) {
      console.error('[VERIFY] Nonce mismatch or missing');
      return NextResponse.json(
        { error: 'Invalid or expired nonce' },
        { status: 400 }
      );
    }

    // Verify signature
    const isValid = await verifyNEP413Signature(signatureData);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Create or update user
    const { accountId, publicKey } = signatureData;

    let user = await prisma.user.findUnique({
      where: {
        accountId: accountId,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          accountId: accountId,
          publicKey: publicKey,
        },
      });
    }

    // Create session manually
    const sessionToken = Buffer.from(
      webcrypto.getRandomValues(new Uint8Array(32))
    ).toString('base64url');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
      },
    });

    // Set session cookie and clear nonce
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          accountId: user.accountId,
          publicKey: user.publicKey,
        },
        session: {
          id: session.id,
          token: session.token,
          expiresAt: session.expiresAt,
        },
      },
    });

    // Set session cookie
    response.cookies.set('blindfold_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
    });

    response.cookies.delete('near_nonce');

    return response;
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify signature' },
      { status: 500 }
    );
  }
}
