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

    // NEP-413: The wallet signs only the message text, not the full object
    // The message format is: "message text"
    const messageBuffer = Buffer.from(message.message, 'utf-8');

    // Parse the public key
    const pubKey = PublicKey.fromString(publicKey);

    // Decode signature from base64
    const signatureBuffer = Buffer.from(signature, 'base64');

    // Verify signature
    const isValid = pubKey.verify(messageBuffer, signatureBuffer);

    console.log('NEP-413 verification:', {
      message: message.message,
      publicKey,
      signatureLength: signatureBuffer.length,
      isValid
    });

    return isValid;
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

    // Verify nonce matches
    const storedNonce = req.cookies.get('near_nonce')?.value;
    if (!storedNonce || storedNonce !== signatureData.message.nonce) {
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
