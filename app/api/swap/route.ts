import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/swap - Get swap quote
 *
 * NOTE: HOT Kit is browser-only, so this endpoint redirects to client-side implementation.
 * The actual swap logic is in SwapModal.tsx using lib/hot-kit.ts
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'HOT Kit swaps must be executed client-side. Please use the SwapModal component.',
      info: 'This is not an error - HOT Kit requires browser environment for wallet signatures and NEAR Intents.'
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
 * POST /api/swap - Execute swap
 *
 * NOTE: HOT Kit is browser-only, so this endpoint redirects to client-side implementation.
 * The actual swap logic is in SwapModal.tsx using lib/hot-kit.ts
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'HOT Kit swaps must be executed client-side. Please use the SwapModal component.',
      info: 'This is not an error - HOT Kit requires browser environment for wallet signatures and NEAR Intents.'
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
