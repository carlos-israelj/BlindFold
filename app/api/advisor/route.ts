import { NextRequest, NextResponse } from 'next/server';
import { askAdvisor, getRequest, getUserRequests, getUserVerifications } from '@/lib/blindfold-contract';

/**
 * POST /api/advisor - Submit question to smart contract (on-chain verification)
 *
 * This endpoint uses the Yield/Resume pattern:
 * 1. User calls ask_advisor() → contract YIELDS
 * 2. Relayer polls and processes in TEE
 * 3. Relayer calls store_verification() → contract RESUMES
 * 4. Response is permanently stored on-chain
 *
 * Use this for maximum transparency and auditability.
 * For faster responses without on-chain storage, use /api/chat instead.
 */
export async function POST(req: NextRequest) {
  try {
    const { accountId, question, portfolio } = await req.json();

    if (!accountId || !question) {
      return NextResponse.json(
        { success: false, error: 'accountId and question are required' },
        { status: 400 }
      );
    }

    console.log(`📤 Submitting question to smart contract for ${accountId}`);

    // Submit to smart contract (requires 0.01 NEAR deposit)
    const requestId = await askAdvisor(accountId, question, portfolio || '{}');

    console.log(`✅ Request submitted with ID: ${requestId}`);

    // Return immediately — relayer processes asynchronously.
    // The client should poll GET /api/advisor?accountId=...&requestId=... for completion.
    return NextResponse.json({
      success: true,
      data: {
        requestId,
        content: `⏳ Request #${requestId} submitted to the NEAR blockchain. The TEE relayer is processing your question — this takes ~10–30 seconds. Your response will be stored on-chain at ecuador5.near.`,
        pending: true,
        verification: null,
      },
    });
  } catch (error: any) {
    console.error('Advisor API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit question' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/advisor - Get user's request history
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const requestId = searchParams.get('requestId');

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId is required' },
        { status: 400 }
      );
    }

    // Get specific request + its verification (single round-trip for polling)
    if (requestId) {
      const reqId = parseInt(requestId);
      const [request, verifications] = await Promise.all([
        getRequest(reqId),
        getUserVerifications(accountId),
      ]);
      const verification = verifications.find(v => v.request_id === reqId) || null;
      return NextResponse.json({
        success: true,
        data: { request, verification, verifications },
      });
    }

    // Get all user requests and verifications
    const [requests, verifications] = await Promise.all([
      getUserRequests(accountId),
      getUserVerifications(accountId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        requests,
        verifications,
        total: requests.length,
      },
    });
  } catch (error: any) {
    console.error('Advisor GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get requests' },
      { status: 500 }
    );
  }
}
