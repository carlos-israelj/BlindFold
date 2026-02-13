import { NextRequest, NextResponse } from 'next/server';
import {
  setupDailyRiskMonitor,
  executeRiskAnalysis,
  listAgents,
  enableAgent,
  disableAgent,
  deleteAgent,
} from '@/lib/nova-agents';

/**
 * POST /api/agents - Manage autonomous NOVA agents
 */
export async function POST(req: NextRequest) {
  try {
    const { accountId, action, agentId, vaultId } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'setup_risk_monitor': {
        if (!vaultId) {
          return NextResponse.json(
            { success: false, error: 'vaultId is required' },
            { status: 400 }
          );
        }

        console.log(`🤖 Setting up autonomous risk monitor for ${accountId}`);
        const agent = await setupDailyRiskMonitor(accountId, vaultId);

        return NextResponse.json({
          success: true,
          data: {
            agent,
            message:
              'Autonomous risk monitor created. Will analyze portfolio daily at 9:00 AM UTC.',
          },
        });
      }

      case 'execute_analysis': {
        if (!vaultId) {
          return NextResponse.json(
            { success: false, error: 'vaultId is required' },
            { status: 400 }
          );
        }

        console.log(`📊 Executing manual risk analysis for ${accountId}`);
        const notification = await executeRiskAnalysis(accountId, vaultId);

        return NextResponse.json({
          success: true,
          data: notification,
        });
      }

      case 'enable': {
        if (!agentId) {
          return NextResponse.json(
            { success: false, error: 'agentId is required' },
            { status: 400 }
          );
        }

        await enableAgent(accountId, agentId);

        return NextResponse.json({
          success: true,
          data: { message: 'Agent enabled successfully' },
        });
      }

      case 'disable': {
        if (!agentId) {
          return NextResponse.json(
            { success: false, error: 'agentId is required' },
            { status: 400 }
          );
        }

        await disableAgent(accountId, agentId);

        return NextResponse.json({
          success: true,
          data: { message: 'Agent disabled successfully' },
        });
      }

      case 'delete': {
        if (!agentId) {
          return NextResponse.json(
            { success: false, error: 'agentId is required' },
            { status: 400 }
          );
        }

        await deleteAgent(accountId, agentId);

        return NextResponse.json({
          success: true,
          data: { message: 'Agent deleted successfully' },
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
 * GET /api/agents - List all autonomous agents for user
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'accountId is required' },
        { status: 400 }
      );
    }

    const agents = await listAgents(accountId);

    return NextResponse.json({
      success: true,
      data: {
        agents,
        count: agents.length,
      },
    });
  } catch (error: any) {
    console.error('Agents GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list agents' },
      { status: 500 }
    );
  }
}
