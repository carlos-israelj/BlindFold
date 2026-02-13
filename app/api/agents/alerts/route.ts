import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/agents/alerts - Store risk alert from Shade Agent
 * This webhook receives alerts from the Shade Agent running in Phala Cloud
 */
export async function POST(req: NextRequest) {
  try {
    const analysis = await req.json();

    if (!analysis || !analysis.accountId) {
      return NextResponse.json(
        { success: false, error: 'Invalid alert data' },
        { status: 400 }
      );
    }

    // Store the alert in the database
    const alert = await prisma.riskAlert.create({
      data: {
        accountId: analysis.accountId,
        severity: analysis.severity,
        message: analysis.message,
        hhi: analysis.data.hhi,
        concentration: analysis.data.concentration,
        assetsCount: analysis.data.assetsCount,
        totalValue: analysis.data.totalValue,
        recommendations: analysis.recommendations || null,
        acknowledged: false,
      },
    });

    console.log(`📥 Risk alert stored for ${analysis.accountId}: ${analysis.severity}`);

    return NextResponse.json({
      success: true,
      data: { alertId: alert.id },
    });
  } catch (error: any) {
    console.error('Error storing risk alert:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to store alert' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/alerts - Get risk alerts for a user
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const unacknowledgedOnly = searchParams.get('unacknowledged') === 'true';

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId is required' },
        { status: 400 }
      );
    }

    const whereClause: any = { accountId };
    if (unacknowledgedOnly) {
      whereClause.acknowledged = false;
    }

    const alerts = await prisma.riskAlert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 alerts
    });

    return NextResponse.json({
      success: true,
      data: { alerts },
    });
  } catch (error: any) {
    console.error('Error fetching risk alerts:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/agents/alerts - Acknowledge an alert
 */
export async function PATCH(req: NextRequest) {
  try {
    const { alertId, acknowledged } = await req.json();

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'alertId is required' },
        { status: 400 }
      );
    }

    const alert = await prisma.riskAlert.update({
      where: { id: alertId },
      data: { acknowledged: acknowledged !== false },
    });

    return NextResponse.json({
      success: true,
      data: { alert },
    });
  } catch (error: any) {
    console.error('Error acknowledging alert:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to acknowledge alert' },
      { status: 500 }
    );
  }
}
