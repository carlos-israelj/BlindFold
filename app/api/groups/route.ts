import { NextRequest, NextResponse } from 'next/server';
import {
  createFamilyVault,
  addMemberToVault,
  removeMemberFromVault,
  checkVaultAccess,
  getGroupOwner,
  getGroupChecksum,
  getGroupTransactions,
} from '@/lib/nova-groups';

/**
 * POST /api/groups - Manage group vaults
 */
export async function POST(req: NextRequest) {
  try {
    const { accountId, action, groupId, members } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create_family_vault': {
        if (!groupId) {
          return NextResponse.json(
            { success: false, error: 'groupId is required' },
            { status: 400 }
          );
        }

        console.log(`Creating family vault ${groupId} for ${accountId}`);
        const groupVault = await createFamilyVault(
          accountId,
          groupId,
          members || []
        );

        return NextResponse.json({
          success: true,
          data: {
            vault: groupVault,
            message: `Family vault ${groupId} created with ${groupVault.members.length} members`,
          },
        });
      }

      case 'add_member': {
        const { groupId: vaultId, memberAccountId } = await req.json();

        if (!vaultId || !memberAccountId) {
          return NextResponse.json(
            { success: false, error: 'groupId and memberAccountId are required' },
            { status: 400 }
          );
        }

        await addMemberToVault(accountId, vaultId, memberAccountId);

        return NextResponse.json({
          success: true,
          data: {
            message: `Member ${memberAccountId} added to group ${vaultId}`,
          },
        });
      }

      case 'remove_member': {
        const { groupId: vaultId, memberAccountId } = await req.json();

        if (!vaultId || !memberAccountId) {
          return NextResponse.json(
            { success: false, error: 'groupId and memberAccountId are required' },
            { status: 400 }
          );
        }

        await removeMemberFromVault(accountId, vaultId, memberAccountId);

        return NextResponse.json({
          success: true,
          data: {
            message: `Member ${memberAccountId} removed from group. Keys rotated.`,
          },
        });
      }

      case 'check_access': {
        const { groupId: vaultId, targetAccountId } = await req.json();

        if (!vaultId) {
          return NextResponse.json(
            { success: false, error: 'groupId is required' },
            { status: 400 }
          );
        }

        const access = await checkVaultAccess(accountId, vaultId, targetAccountId);

        return NextResponse.json({
          success: true,
          data: access,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Groups API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Group operation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/groups - Get vault info
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const groupId = searchParams.get('groupId');
    const action = searchParams.get('action') || 'info';

    if (!accountId || !groupId) {
      return NextResponse.json(
        { success: false, error: 'accountId and groupId are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'info': {
        const [owner, checksum, access] = await Promise.all([
          getGroupOwner(accountId, groupId),
          getGroupChecksum(accountId, groupId),
          checkVaultAccess(accountId, groupId),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            groupId,
            owner,
            checksum,
            userAccess: access,
          },
        });
      }

      case 'transactions': {
        const transactions = await getGroupTransactions(accountId, groupId);

        return NextResponse.json({
          success: true,
          data: {
            groupId,
            transactions,
            count: transactions.length,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Groups GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get group info' },
      { status: 500 }
    );
  }
}
