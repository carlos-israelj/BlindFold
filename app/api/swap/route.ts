import { NextRequest, NextResponse } from 'next/server';
// TODO: HOT Kit can only be used in client components, not API routes
// Move swap logic to client-side when implementing multi-chain swaps
// import { getSwapQuote, executeSwap } from '@/lib/hot-kit';

/**
 * GET /api/swap - Get swap quote (TEMPORARILY DISABLED - HOT Kit is client-only)
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Swap endpoint temporarily disabled. HOT Kit integration in progress. Use client-side swap UI instead.'
    },
    { status: 501 }
  );

  /* ORIGINAL CODE - To be moved to client component:
  try {
  try {
    const { searchParams } = new URL(request.url);

    const fromChain = searchParams.get('fromChain');
    const toChain = searchParams.get('toChain');
    const fromToken = searchParams.get('fromToken');
    const toToken = searchParams.get('toToken');
    const amount = searchParams.get('amount');
    const slippage = searchParams.get('slippage');

    if (!fromChain || !toChain || !fromToken || !toToken || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: fromChain, toChain, fromToken, toToken, amount'
        },
        { status: 400 }
      );
    }

    // Get swap quote from HOT Protocol
    const quote = await getSwapQuote({
      fromChain,
      toChain,
      fromToken,
      toToken,
      amount,
      slippage: slippage ? parseFloat(slippage) : 0.5, // Default 0.5% slippage
    });

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error: any) {
    console.error('Swap quote error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get swap quote' },
      { status: 500 }
    );
  }
  */
}

/**
 * POST /api/swap - Execute swap (TEMPORARILY DISABLED - HOT Kit is client-only)
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Swap endpoint temporarily disabled. HOT Kit integration in progress. Use client-side swap UI instead.'
    },
    { status: 501 }
  );

  /* ORIGINAL CODE - To be moved to client component:
  try {
  try {
    const body = await request.json();
    const { fromChain, toChain, fromToken, toToken, amount, walletAddress, slippage } = body;

    if (!fromChain || !toChain || !fromToken || !toToken || !amount || !walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters'
        },
        { status: 400 }
      );
    }

    // Execute swap via HOT Protocol using NEAR Intents
    const txHash = await executeSwap(
      {
        fromChain,
        toChain,
        fromToken,
        toToken,
        amount,
        slippage: slippage || 0.5,
      },
      walletAddress
    );

    return NextResponse.json({
      success: true,
      data: {
        txHash,
        explorerUrl: `https://hotscan.org/tx/${txHash}`,
      },
    });
  } catch (error: any) {
    console.error('Swap execution error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute swap' },
      { status: 500 }
    );
  }
  */
}
