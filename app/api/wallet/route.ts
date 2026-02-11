import { NextRequest, NextResponse } from 'next/server';
import { fetchAccountFull, convertToPortfolioJSON } from '@/lib/fastnear';
import { analyzePortfolio } from '@/lib/portfolio-analytics';

export async function POST(request: NextRequest) {
  try {
    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Fetch complete account data from FastNEAR API
    // This includes: NEAR balance, FTs, NFTs, staking positions
    const accountData = await fetchAccountFull(accountId);

    // Convert to portfolio JSON format
    const portfolio = convertToPortfolioJSON(accountData);

    // Calculate portfolio analytics (HHI, risk score, recommendations)
    const analytics = analyzePortfolio(
      (portfolio.holdings || []).map((h: any) => ({
        token: h.token,
        balance: h.balance,
        decimals: h.decimals,
        valueUSD: h.price ? parseFloat(h.balance) * parseFloat(h.price) : undefined,
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        portfolio,
        analytics,
      },
    });
  } catch (error: any) {
    console.error('Wallet API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}
