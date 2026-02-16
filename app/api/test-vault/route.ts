import { NextResponse } from 'next/server';
import { createVault } from '@/lib/nova';

export const dynamic = 'force-dynamic';

export async function GET() {
  const accountId = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';

  try {
    console.log('=== TEST VAULT CREATION ===');
    console.log('Account ID:', accountId);

    const vaultId = await createVault(accountId);

    console.log('✅ Vault created successfully:', vaultId);

    return NextResponse.json({
      success: true,
      vaultId,
      message: 'Vault created successfully'
    });
  } catch (error: any) {
    console.error('❌ Vault creation failed:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
