import { NextRequest, NextResponse } from 'next/server';
import {
  executeRiskAnalysis,
  getAgentConfig,
} from '@/lib/nova-agents';

/**
 * POST /api/agents - Execute risk analysis
 */
export async function POST(req: NextRequest) {
  try {
    const { accountId, action, groupId } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'execute_analysis': {
        if (!groupId) {
          return NextResponse.json(
            { success: false, error: 'groupId is required' },
            { status: 400 }
          );
        }

        console.log(`Executing manual risk analysis for ${accountId}`);
        const notification = await executeRiskAnalysis(accountId, groupId);

        return NextResponse.json({
          success: true,
          data: notification,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Agents API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Agent operation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents - Get agent configuration
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const groupId = searchParams.get('groupId');

    if (!accountId || !groupId) {
      return NextResponse.json(
        { success: false, error: 'accountId and groupId are required' },
        { status: 400 }
      );
    }

    const agentConfig = await getAgentConfig(accountId, groupId);

    if (!agentConfig) {
      return NextResponse.json(
        { success: false, error: 'No agent configured or no access to group' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agentConfig,
    });
  } catch (error: any) {
    console.error('Agents GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get agent config' },
      { status: 500 }
    );
  }
}
