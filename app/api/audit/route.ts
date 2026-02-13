import { NextRequest, NextResponse } from 'next/server';
import {
  getVaultAuditLogs,
  getAuditSummary,
  getUserActions,
  verifyAuditEntry,
  exportAuditLogs,
  detectSuspiciousActivity,
} from '@/lib/nova-audit';

/**
 * GET /api/audit - Get audit logs for vault
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const vaultId = searchParams.get('vaultId');
    const action = searchParams.get('action') || 'logs';
    const targetAccountId = searchParams.get('targetAccountId');
    const format = searchParams.get('format') as 'json' | 'csv' || 'json';

    if (!accountId || !vaultId) {
      return NextResponse.json(
        { success: false, error: 'accountId and vaultId are required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'logs': {
        const logs = await getVaultAuditLogs(accountId, vaultId);

        return NextResponse.json({
          success: true,
          data: {
            logs,
            count: logs.length,
          },
        });
      }

      case 'summary': {
        const summary = await getAuditSummary(accountId, vaultId);

        return NextResponse.json({
          success: true,
          data: summary,
        });
      }

      case 'user_actions': {
        if (!targetAccountId) {
          return NextResponse.json(
            { success: false, error: 'targetAccountId is required for user_actions' },
            { status: 400 }
          );
        }

        const userLogs = await getUserActions(accountId, vaultId, targetAccountId);

        return NextResponse.json({
          success: true,
          data: {
            accountId: targetAccountId,
            actions: userLogs,
            count: userLogs.length,
          },
        });
      }

      case 'export': {
        const exported = await exportAuditLogs(accountId, vaultId, format);

        return new NextResponse(exported, {
          status: 200,
          headers: {
            'Content-Type': format === 'json' ? 'application/json' : 'text/csv',
            'Content-Disposition': `attachment; filename="audit-logs-${vaultId}.${format}"`,
          },
        });
      }

      case 'suspicious': {
        const analysis = await detectSuspiciousActivity(accountId, vaultId);

        return NextResponse.json({
          success: true,
          data: analysis,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Audit API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get audit logs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit - Verify audit entry
 */
export async function POST(req: NextRequest) {
  try {
    const { accountId, logEntry } = await req.json();

    if (!accountId || !logEntry) {
      return NextResponse.json(
        { success: false, error: 'accountId and logEntry are required' },
        { status: 400 }
      );
    }

    const verification = await verifyAuditEntry(accountId, logEntry);

    return NextResponse.json({
      success: true,
      data: verification,
    });
  } catch (error: any) {
    console.error('Audit verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
