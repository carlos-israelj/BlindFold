import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint to trigger Shade Agent portfolio analysis
 */
export async function GET() {
  const SHADE_API_URL = process.env.SHADE_API_URL || 'https://a24524b21160793c2054c610a2e9a300f97a8ae3-3001.dstack-pha-prod9.phala.network';
  const accountId = '3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae';
  const groupId = `vault.${accountId}`;

  try {
    console.log('🧪 Testing Shade Agent portfolio analysis...');
    console.log('Shade URL:', SHADE_API_URL);
    console.log('Account ID:', accountId);
    console.log('Group ID:', groupId);

    // Trigger analysis endpoint
    const response = await fetch(`${SHADE_API_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        groupId,
      }),
    });

    const status = response.status;
    let data;

    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    console.log('Shade Agent response:', data);

    return NextResponse.json({
      success: response.ok,
      status,
      shadeUrl: SHADE_API_URL,
      response: data,
    });

  } catch (error: any) {
    console.error('Error triggering Shade Agent analysis:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      shadeUrl: SHADE_API_URL,
    }, { status: 500 });
  }
}
