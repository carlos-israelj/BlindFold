import { NextRequest, NextResponse } from 'next/server';
import {
  createVault,
  uploadToVault,
  retrieveFromVault,
  deleteVault,
  listVaultFiles,
  getVaultInfo,
} from '@/lib/nova';
import { encryptWithShade, getShadeAttestation } from '@/lib/nova-encryption';

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

        // Encrypt with Shade Agent before upload
        console.log('🔐 Encrypting with Shade Agent TEE...');
        const { encrypted, metadata } = await encryptWithShade(
          JSON.stringify(data),
          accountId
        );

        // Upload encrypted data to NOVA vault
        const uploadCid = await uploadToVault(
          accountId,
          vaultId,
          encrypted,
          filename
        );

        return NextResponse.json({
          success: true,
          data: {
            cid: uploadCid,
            encryption: metadata,
            message: 'Data encrypted with Shade Agent and uploaded to NOVA vault',
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

      case 'attestation': {
        // Get Shade Agent attestation for verification
        const attestation = await getShadeAttestation(accountId);
        return NextResponse.json({
          success: true,
          data: {
            attestation,
            message: 'Shade Agent attestation retrieved',
            verified: attestation.verified,
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
