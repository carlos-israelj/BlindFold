import { NextRequest, NextResponse } from 'next/server';
import {
  uploadPortfolioData,
  retrievePortfolioData,
  createPortfolioGroup,
  sharePortfolioAccess,
  revokePortfolioAccess,
  checkPortfolioAccess,
  getPortfolioHistory,
  getGroupOwner,
  getShadeChecksum,
} from '@/lib/nova-simple';

/**
 * POST /api/nova - NOVA operations using real SDK methods
 */
export async function POST(req: NextRequest) {
  try {
    const { accountId, action, groupId, data, filename, memberAccountId, cid } =
      await req.json();

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'create_group': {
        if (!groupId) {
          return NextResponse.json(
            { success: false, error: 'groupId is required' },
            { status: 400 }
          );
        }

        await createPortfolioGroup(accountId, groupId);

        return NextResponse.json({
          success: true,
          data: {
            groupId,
            owner: accountId,
            message: `Group '${groupId}' created successfully`,
          },
        });
      }

      case 'upload_portfolio': {
        if (!groupId || !data) {
          return NextResponse.json(
            { success: false, error: 'groupId and data are required' },
            { status: 400 }
          );
        }

        const result = await uploadPortfolioData(
          accountId,
          groupId,
          data,
          filename
        );

        return NextResponse.json({
          success: true,
          data: {
            cid: result.cid,
            transactionId: result.transactionId,
            fileHash: result.fileHash,
            message: 'Portfolio uploaded and encrypted',
          },
        });
      }

      case 'retrieve_portfolio': {
        if (!groupId || !cid) {
          return NextResponse.json(
            { success: false, error: 'groupId and cid are required' },
            { status: 400 }
          );
        }

        const portfolioData = await retrievePortfolioData(accountId, groupId, cid);

        return NextResponse.json({
          success: true,
          data: {
            portfolio: portfolioData,
            message: 'Portfolio retrieved and decrypted',
          },
        });
      }

      case 'share_access': {
        if (!groupId || !memberAccountId) {
          return NextResponse.json(
            { success: false, error: 'groupId and memberAccountId are required' },
            { status: 400 }
          );
        }

        await sharePortfolioAccess(accountId, groupId, memberAccountId);

        return NextResponse.json({
          success: true,
          data: {
            message: `Access granted to ${memberAccountId}`,
          },
        });
      }

      case 'revoke_access': {
        if (!groupId || !memberAccountId) {
          return NextResponse.json(
            { success: false, error: 'groupId and memberAccountId are required' },
            { status: 400 }
          );
        }

        await revokePortfolioAccess(accountId, groupId, memberAccountId);

        return NextResponse.json({
          success: true,
          data: {
            message: `Access revoked from ${memberAccountId}. Keys rotated.`,
          },
        });
      }

      case 'check_access': {
        if (!groupId) {
          return NextResponse.json(
            { success: false, error: 'groupId is required' },
            { status: 400 }
          );
        }

        const hasAccess = await checkPortfolioAccess(
          accountId,
          groupId,
          memberAccountId
        );

        return NextResponse.json({
          success: true,
          data: {
            accountId: memberAccountId || accountId,
            groupId,
            hasAccess,
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
    console.error('NOVA API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'NOVA operation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/nova - Get NOVA group info
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const groupId = searchParams.get('groupId');
    const action = searchParams.get('action') || 'info';

    if (!accountId || !groupId) {
      return NextResponse.json(
        { success: false, error: 'accountId and groupId are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'info': {
        const [owner, checksum, hasAccess] = await Promise.all([
          getGroupOwner(accountId, groupId),
          getShadeChecksum(accountId, groupId),
          checkPortfolioAccess(accountId, groupId),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            groupId,
            owner,
            shadeChecksum: checksum,
            userHasAccess: hasAccess,
          },
        });
      }

      case 'history': {
        const transactions = await getPortfolioHistory(accountId, groupId);

        return NextResponse.json({
          success: true,
          data: {
            groupId,
            transactions,
            count: transactions.length,
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
    console.error('NOVA GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get info' },
      { status: 500 }
    );
  }
}
