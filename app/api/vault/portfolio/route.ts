import { NextRequest, NextResponse } from 'next/server';
import { getNovaClient } from '@/lib/nova';
import { prisma } from '@/lib/prisma';

interface PortfolioAsset {
  symbol: string;
  balance: number;
  value: number;
}

export async function POST(request: NextRequest) {
  try {
    const { accountId, groupId, assets } = await request.json();

    if (!accountId || !groupId || !assets) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate assets format
    if (!Array.isArray(assets) || assets.length === 0) {
      return NextResponse.json(
        { error: 'Assets must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate each asset has required fields
    for (const asset of assets) {
      if (!asset.symbol || typeof asset.balance !== 'number' || typeof asset.value !== 'number') {
        return NextResponse.json(
          { error: 'Each asset must have symbol, balance, and value' },
          { status: 400 }
        );
      }
    }

    // Get NOVA client
    const nova = await getNovaClient(accountId);
    if (!nova) {
      return NextResponse.json(
        { error: 'NOVA not configured. Please set up NOVA first.' },
        { status: 400 }
      );
    }

    // Prepare portfolio data in the format expected by Shade Agent
    const portfolioData = {
      assets,
      metadata: {
        uploadedAt: new Date().toISOString(),
        uploadedBy: accountId,
        version: '1.0',
      },
    };

    console.log(`Uploading portfolio to group: ${groupId}`);
    console.log(`Assets:`, assets);

    // Upload to NOVA vault
    const result = await nova.upload(
      groupId,
      Buffer.from(JSON.stringify(portfolioData)),
      `portfolio-${Date.now()}.json`
    );

    console.log(`Portfolio uploaded successfully. CID: ${result.cid}`);

    // Update or create vault record with new CID
    const user = await prisma.user.findUnique({
      where: { accountId },
    });

    if (user) {
      await prisma.vault.upsert({
        where: { groupId },
        update: {
          novaCid: result.cid,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          groupId,
          novaCid: result.cid,
        },
      });

      // Create snapshot record
      await prisma.vaultSnapshot.create({
        data: {
          vaultId: groupId,
          novaCid: result.cid,
          portfolioHash: Buffer.from(JSON.stringify(portfolioData)).toString('base64'),
        },
      });

      console.log(`✅ Vault updated in database with CID: ${result.cid}`);
    }

    // Calculate total value for response
    const totalValue = assets.reduce((sum: number, asset: PortfolioAsset) => sum + asset.value, 0);

    return NextResponse.json({
      success: true,
      cid: result.cid,
      transactionId: result.trans_id,
      groupId,
      assetsCount: assets.length,
      totalValue,
      message: 'Portfolio uploaded successfully to NOVA vault',
    });
  } catch (error: any) {
    console.error('Portfolio upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload portfolio' },
      { status: 500 }
    );
  }
}

// GET: Retrieve latest portfolio from vault
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const groupId = searchParams.get('groupId');

    if (!accountId || !groupId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get NOVA client
    const nova = await getNovaClient(accountId);
    if (!nova) {
      return NextResponse.json(
        { error: 'NOVA not configured' },
        { status: 400 }
      );
    }

    // Get transactions for this group
    const transactions = await nova.getTransactionsForGroup(groupId, accountId);

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        hasPortfolio: false,
        message: 'No portfolio data found in vault',
      });
    }

    // Get the latest transaction
    const latestTransaction = transactions[0];

    // Retrieve and decrypt the portfolio data
    const retrieveResult = await nova.retrieve(groupId, latestTransaction.ipfs_hash);
    const portfolioData = JSON.parse(retrieveResult.data.toString('utf-8'));

    return NextResponse.json({
      hasPortfolio: true,
      portfolio: portfolioData,
      cid: latestTransaction.ipfs_hash,
      transactionId: latestTransaction.file_hash,
    });
  } catch (error: any) {
    console.error('Error retrieving portfolio:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve portfolio' },
      { status: 500 }
    );
  }
}
