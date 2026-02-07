import { NextRequest, NextResponse } from 'next/server';
import { fetchPortfolio } from '@/lib/near-rpc';

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const portfolio = await fetchPortfolio(accountId);

    return NextResponse.json({
      success: true,
      data: portfolio,
    });
  } catch (error: any) {
    console.error('Wallet API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}
