import { NextRequest, NextResponse } from 'next/server';
import {
  createVault,
  uploadToVault,
  retrieveFromVault,
  deleteVault,
} from '@/lib/nova';

export async function POST(request: NextRequest) {
  try {
    const { accountId, action, vaultId, data, filename, cid } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create': {
        const newVaultId = await createVault(accountId);
        return NextResponse.json({
          success: true,
          data: { vaultId: newVaultId },
        });
      }

      case 'upload': {
        if (!vaultId || !data || !filename) {
          return NextResponse.json(
            { success: false, error: 'vaultId, data, and filename are required' },
            { status: 400 }
          );
        }
        const uploadCid = await uploadToVault(accountId, vaultId, data, filename);
        return NextResponse.json({
          success: true,
          data: { cid: uploadCid },
        });
      }

      case 'retrieve': {
        if (!vaultId || !cid) {
          return NextResponse.json(
            { success: false, error: 'vaultId and cid are required' },
            { status: 400 }
          );
        }
        const retrievedData = await retrieveFromVault(accountId, vaultId, cid);
        return NextResponse.json({
          success: true,
          data: retrievedData,
        });
      }

      case 'inspect': {
        if (!vaultId) {
          return NextResponse.json(
            { success: false, error: 'vaultId is required' },
            { status: 400 }
          );
        }
        // For now, return a placeholder
        // In a full implementation, you'd list all files in the vault
        return NextResponse.json({
          success: true,
          data: { vaultId, message: 'Vault inspection feature - list all CIDs here' },
        });
      }

      case 'delete': {
        if (!vaultId) {
          return NextResponse.json(
            { success: false, error: 'vaultId is required' },
            { status: 400 }
          );
        }
        await deleteVault(accountId, vaultId);
        return NextResponse.json({
          success: true,
          data: { message: 'Vault deleted successfully' },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Vault API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Vault operation failed' },
      { status: 500 }
    );
  }
}
