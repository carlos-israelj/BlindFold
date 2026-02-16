import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const SHADE_API_URL = process.env.SHADE_API_URL || 'https://a24524b21160793c2054c610a2e9a300f97a8ae3-3001.dstack-pha-prod9.phala.network';

  try {
    console.log('Testing Shade Agent connection...');
    console.log('Shade URL:', SHADE_API_URL);

    // Test health endpoint
    const response = await fetch(`${SHADE_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const status = response.status;
    let data;

    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    return NextResponse.json({
      success: response.ok,
      status,
      shadeUrl: SHADE_API_URL,
      response: data,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      shadeUrl: SHADE_API_URL,
    }, { status: 500 });
  }
}
