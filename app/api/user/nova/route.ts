import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptApiKey, decryptApiKey } from '@/lib/encryption';

/**
 * GET /api/user/nova
 * Check if user has NOVA API key configured
 */
export async function GET(req: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = req.cookies.get('blindfold_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find session and user
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const hasApiKey = !!session.user.novaApiKey;

    return NextResponse.json({
      success: true,
      data: {
        hasNovaApiKey: hasApiKey,
        accountId: session.user.accountId,
      },
    });
  } catch (error) {
    console.error('Error checking NOVA status:', error);
    return NextResponse.json(
      { error: 'Failed to check NOVA status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/nova
 * Save user's NOVA API key (encrypted)
 */
export async function POST(req: NextRequest) {
  try {
    const { novaApiKey } = await req.json();

    if (!novaApiKey || typeof novaApiKey !== 'string') {
      return NextResponse.json(
        { error: 'NOVA API key is required' },
        { status: 400 }
      );
    }

    // Validate API key format (starts with nova_sk_)
    if (!novaApiKey.startsWith('nova_sk_')) {
      return NextResponse.json(
        { error: 'Invalid NOVA API key format. Must start with "nova_sk_"' },
        { status: 400 }
      );
    }

    // Get session token from cookie
    const sessionToken = req.cookies.get('blindfold_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find session and user
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Encrypt API key before storing
    const encryptedApiKey = await encryptApiKey(novaApiKey);

    // Update user with encrypted API key
    await prisma.user.update({
      where: { id: session.userId },
      data: { novaApiKey: encryptedApiKey },
    });

    console.log(`✅ NOVA API key saved for user: ${session.user.accountId}`);

    return NextResponse.json({
      success: true,
      message: 'NOVA API key saved successfully',
    });
  } catch (error) {
    console.error('Error saving NOVA API key:', error);
    return NextResponse.json(
      { error: 'Failed to save NOVA API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/nova
 * Remove user's NOVA API key
 */
export async function DELETE(req: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = req.cookies.get('blindfold_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Find session and user
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Remove API key
    await prisma.user.update({
      where: { id: session.userId },
      data: { novaApiKey: null },
    });

    console.log(`🗑️ NOVA API key removed for user: ${session.user.accountId}`);

    return NextResponse.json({
      success: true,
      message: 'NOVA API key removed successfully',
    });
  } catch (error) {
    console.error('Error removing NOVA API key:', error);
    return NextResponse.json(
      { error: 'Failed to remove NOVA API key' },
      { status: 500 }
    );
  }
}
