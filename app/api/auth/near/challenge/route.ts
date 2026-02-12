import { NextRequest, NextResponse } from 'next/server';
import { webcrypto } from 'crypto';

/**
 * Generate cryptographically secure nonce
 */
function generateNonce(): string {
  const array = new Uint8Array(32);
  webcrypto.getRandomValues(array);
  return Buffer.from(array).toString('base64url');
}

/**
 * POST /api/auth/near/challenge
 * Generate challenge for NEP-413 wallet signing
 */
export async function POST(req: NextRequest) {
  try {
    const { accountId } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' },
        { status: 400 }
      );
    }

    const nonce = generateNonce();
    const challenge = {
      message: `Sign in to BlindFold\n\nNonce: ${nonce}`,
      nonce,
      recipient: 'blindfold.near',
      callbackUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    };

    // Store nonce in response header for verification
    const response = NextResponse.json({
      success: true,
      data: challenge,
    });

    // Set nonce cookie for verification (expires in 5 minutes)
    response.cookies.set('near_nonce', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60, // 5 minutes
    });

    return response;
  } catch (error) {
    console.error('Challenge generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate challenge' },
      { status: 500 }
    );
  }
}
