import { NextRequest, NextResponse } from 'next/server';
import { getNovaClient } from '@/lib/nova';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { accountId, groupId, isNew } = await request.json();

    if (!accountId || !groupId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get NOVA client
    const nova = await getNovaClient(accountId);
    if (!nova) {
      return NextResponse.json(
        { error: 'NOVA not configured. Please set up NOVA first.' },
        { status: 400 }
      );
    }

    let message = '';
    let cost = 0;

    if (isNew) {
      // Create new group
      console.log(`Creating new group: ${groupId} for ${accountId}`);

      try {
        await nova.registerGroup(groupId);
        message = `Successfully created group: ${groupId}`;
        cost = 1.3; // Approximate cost in NEAR

        // Save group ID to database
        await prisma.user.update({
          where: { accountId },
          data: {
            novaVaultId: groupId,
          },
        });
      } catch (error: any) {
        if (error.message?.includes('already exists')) {
          return NextResponse.json(
            { error: `Group ${groupId} already exists. Please choose a different name.` },
            { status: 409 }
          );
        }
        throw error;
      }
    } else {
      // Join existing group - just verify it exists
      console.log(`Joining existing group: ${groupId} for ${accountId}`);

      try {
        // Check if user is authorized for this group
        const isAuthorized = await nova.isAuthorized(groupId);

        if (!isAuthorized) {
          return NextResponse.json(
            { error: `You don't have access to group: ${groupId}` },
            { status: 403 }
          );
        }

        message = `Successfully connected to group: ${groupId}`;
        cost = 0;

        // Save group ID to database
        await prisma.user.update({
          where: { accountId },
          data: {
            novaVaultId: groupId,
          },
        });
      } catch (error: any) {
        if (error.message?.includes('does not exist') || error.message?.includes('not found')) {
          return NextResponse.json(
            { error: `Group ${groupId} does not exist` },
            { status: 404 }
          );
        }
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      groupId,
      message,
      cost,
    });
  } catch (error: any) {
    console.error('Group operation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to configure group' },
      { status: 500 }
    );
  }
}

// GET: Check if user has a group configured
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Missing accountId parameter' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { accountId },
      select: { novaVaultId: true },
    });

    return NextResponse.json({
      hasGroup: !!user?.novaVaultId,
      groupId: user?.novaVaultId || null,
    });
  } catch (error: any) {
    console.error('Error checking group status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check group status' },
      { status: 500 }
    );
  }
}
