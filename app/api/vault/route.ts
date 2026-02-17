import { NextRequest, NextResponse } from 'next/server';
import {
  createVault,
  uploadToVault,
  retrieveFromVault,
  deleteVault,
  listVaultFiles,
  getVaultInfo,
  addVaultMember,
  revokeVaultMember,
  getVaultChecksum,
  getVaultTransactions,
} from '@/lib/nova';
import { encryptAndUpload, getEncryptionInfo } from '@/lib/nova-encryption';

export async function POST(request: NextRequest) {
  try {
    const { accountId, action, vaultId, data, filename, cid, memberId } = await request.json();

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

        // Encrypt and upload using NOVA SDK (handles encryption internally)
        console.log('Encrypting and uploading to NOVA vault...');
        const metadata = await encryptAndUpload(
          accountId,
          vaultId,
          data,
          filename
        );

        return NextResponse.json({
          success: true,
          data: {
            ...metadata,
            message: 'Data encrypted with AES-256-GCM and uploaded to NOVA vault',
          },
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

      case 'list': {
        if (!vaultId) {
          return NextResponse.json(
            { success: false, error: 'vaultId is required' },
            { status: 400 }
          );
        }
        const files = await listVaultFiles(accountId, vaultId);
        return NextResponse.json({
          success: true,
          data: { vaultId, files },
        });
      }

      case 'inspect':
      case 'info': {
        if (!vaultId) {
          return NextResponse.json(
            { success: false, error: 'vaultId is required' },
            { status: 400 }
          );
        }
        const info = await getVaultInfo(accountId, vaultId);
        const files = await listVaultFiles(accountId, vaultId);
        return NextResponse.json({
          success: true,
          data: {
            ...info,
            files,
            filesCount: files.length,
          },
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

      case 'add_member': {
        if (!vaultId || !memberId) {
          return NextResponse.json({ success: false, error: 'vaultId and memberId are required' }, { status: 400 });
        }
        await addVaultMember(accountId, vaultId, memberId);
        return NextResponse.json({ success: true, data: { message: `Member ${memberId} added` } });
      }

      case 'revoke_member': {
        if (!vaultId || !memberId) {
          return NextResponse.json({ success: false, error: 'vaultId and memberId are required' }, { status: 400 });
        }
        await revokeVaultMember(accountId, vaultId, memberId);
        return NextResponse.json({ success: true, data: { message: `Member ${memberId} revoked` } });
      }

      case 'checksum': {
        if (!vaultId) return NextResponse.json({ success: false, error: 'vaultId is required' }, { status: 400 });
        const checksum = await getVaultChecksum(accountId, vaultId);
        return NextResponse.json({ success: true, data: { checksum } });
      }

      case 'transactions': {
        if (!vaultId) return NextResponse.json({ success: false, error: 'vaultId is required' }, { status: 400 });
        const transactions = await getVaultTransactions(accountId, vaultId);
        return NextResponse.json({ success: true, data: { transactions } });
      }

      case 'encryption_info': {
        // Get encryption information for a group
        if (!vaultId) {
          return NextResponse.json(
            { success: false, error: 'vaultId is required' },
            { status: 400 }
          );
        }

        const encryptionInfo = await getEncryptionInfo(accountId, vaultId);
        return NextResponse.json({
          success: true,
          data: {
            ...encryptionInfo,
            message: 'Encryption info retrieved',
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
    console.error('Vault API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Vault operation failed' },
      { status: 500 }
    );
  }
}
