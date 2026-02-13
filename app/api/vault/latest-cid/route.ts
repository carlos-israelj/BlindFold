import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/vault/latest-cid - Get the latest portfolio CID for a user
 * This is used by the Shade Agent to automatically fetch the latest portfolio
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const groupId = searchParams.get('groupId');

    if (!accountId || !groupId) {
      return NextResponse.json(
        { error: 'Missing required parameters: accountId and groupId' },
        { status: 400 }
      );
    }

    // Find the vault for this user
    const vault = await prisma.vault.findUnique({
      where: { groupId },
      include: {
        user: {
          select: {
            accountId: true,
          },
        },
      },
    });

    if (!vault) {
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      );
    }

    // Verify the vault belongs to the requested account
    if (vault.user.accountId !== accountId) {
      return NextResponse.json(
        { error: 'Unauthorized: Vault does not belong to this account' },
        { status: 403 }
      );
    }

    if (!vault.novaCid) {
      return NextResponse.json(
        { error: 'No portfolio uploaded yet' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        cid: vault.novaCid,
        groupId: vault.groupId,
        updatedAt: vault.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching latest CID:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch latest CID' },
      { status: 500 }
    );
  }
}
