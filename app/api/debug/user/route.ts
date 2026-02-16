import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { accountId },
      select: {
        id: true,
        accountId: true,
        publicKey: true,
        novaAccountId: true,
        novaApiKey: true,
        novaVaultId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        novaApiKey: user.novaApiKey ? '***encrypted***' : null,
        hasNovaApiKey: !!user.novaApiKey,
        hasNovaAccountId: !!user.novaAccountId,
      },
    });
  } catch (error: any) {
    console.error('Debug user error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
