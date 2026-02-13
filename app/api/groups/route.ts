import { NextRequest, NextResponse } from 'next/server';
import {
  createFamilyVault,
  addMemberToVault,
  removeMemberFromVault,
  updateMemberRole,
  shareVaultTemporary,
  revokeVaultAccess,
  getVaultMembers,
  checkVaultAccess,
} from '@/lib/nova-groups';

/**
 * POST /api/groups - Manage group vaults
 */
export async function POST(req: NextRequest) {
  try {
    const { accountId, action, vaultId, vaultName, members, memberAccountId, role, shareRequest } =
      await req.json();

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create_family_vault': {
        if (!members || !Array.isArray(members)) {
          return NextResponse.json(
            { success: false, error: 'members array is required' },
            { status: 400 }
          );
        }

        console.log(`👨‍👩‍👧‍👦 Creating family vault for ${accountId} with ${members.length} members`);
        const groupVault = await createFamilyVault(
          accountId,
          members,
          vaultName || 'Family Portfolio Vault'
        );

        return NextResponse.json({
          success: true,
          data: {
            vault: groupVault,
            message: `Family vault created with ${members.length} members`,
          },
        });
      }

      case 'add_member': {
        if (!vaultId || !memberAccountId) {
          return NextResponse.json(
            { success: false, error: 'vaultId and memberAccountId are required' },
            { status: 400 }
          );
        }

        await addMemberToVault(accountId, vaultId, memberAccountId, role || 'viewer');

        return NextResponse.json({
          success: true,
          data: {
            message: `Member ${memberAccountId} added to vault as ${role || 'viewer'}`,
          },
        });
      }

      case 'remove_member': {
        if (!vaultId || !memberAccountId) {
          return NextResponse.json(
            { success: false, error: 'vaultId and memberAccountId are required' },
            { status: 400 }
          );
        }

        await removeMemberFromVault(accountId, vaultId, memberAccountId);

        return NextResponse.json({
          success: true,
          data: {
            message: `Member ${memberAccountId} removed from vault`,
          },
        });
      }

      case 'update_role': {
        if (!vaultId || !memberAccountId || !role) {
          return NextResponse.json(
            { success: false, error: 'vaultId, memberAccountId, and role are required' },
            { status: 400 }
          );
        }

        await updateMemberRole(accountId, vaultId, memberAccountId, role);

        return NextResponse.json({
          success: true,
          data: {
            message: `Member ${memberAccountId} role updated to ${role}`,
          },
        });
      }

      case 'share_temporary': {
        if (!shareRequest) {
          return NextResponse.json(
            { success: false, error: 'shareRequest is required' },
            { status: 400 }
          );
        }

        const share = await shareVaultTemporary(accountId, shareRequest);

        return NextResponse.json({
          success: true,
          data: {
            share,
            message: 'Temporary share link created',
          },
        });
      }

      case 'revoke_access': {
        if (!vaultId || !memberAccountId) {
          return NextResponse.json(
            { success: false, error: 'vaultId and memberAccountId are required' },
            { status: 400 }
          );
        }

        await revokeVaultAccess(accountId, vaultId, memberAccountId);

        return NextResponse.json({
          success: true,
          data: {
            message: `Access revoked for ${memberAccountId}`,
          },
        });
      }

      case 'check_access': {
        if (!vaultId) {
          return NextResponse.json(
            { success: false, error: 'vaultId is required' },
            { status: 400 }
          );
        }

        const access = await checkVaultAccess(accountId, vaultId);

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
 * GET /api/groups - Get vault members
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const vaultId = searchParams.get('vaultId');

    if (!accountId || !vaultId) {
      return NextResponse.json(
        { success: false, error: 'accountId and vaultId are required' },
        { status: 400 }
      );
    }

    const members = await getVaultMembers(accountId, vaultId);

    return NextResponse.json({
      success: true,
      data: {
        members,
        count: members.length,
      },
    });
  } catch (error: any) {
    console.error('Groups GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get vault members' },
      { status: 500 }
    );
  }
}
