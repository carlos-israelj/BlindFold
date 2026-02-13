/**
 * NOVA Audit Logs
 * Track and verify all vault access with Shade TEE attestation
 */

import { NovaSdk } from 'nova-sdk-js';
import { getNovaClient } from './nova';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  vaultId: string;
  actorAccountId: string;
  action: 'read' | 'write' | 'share' | 'delete' | 'grant_access' | 'revoke_access';
  resourcePath?: string;
  metadata?: {
    fileName?: string;
    cid?: string;
    shareWith?: string;
    role?: string;
  };
  shadeSignature?: string; // TEE attestation
  verified: boolean;
}

export interface AuditSummary {
  vaultId: string;
  totalActions: number;
  uniqueActors: number;
  lastAccess: Date;
  actionsByType: {
    [key: string]: number;
  };
  recentLogs: AuditLogEntry[];
}

/**
 * Get audit logs for vault
 */
export async function getVaultAuditLogs(
  accountId: string,
  vaultId: string,
  limit: number = 50
): Promise<AuditLogEntry[]> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    return [];
  }

  try {
    const logs = await nova.vaults.getAuditLog(vaultId, { limit });

    return logs.map((log: any) => ({
      id: log.id,
      timestamp: new Date(log.timestamp),
      vaultId,
      actorAccountId: log.actor,
      action: log.action,
      resourcePath: log.resource,
      metadata: log.metadata,
      shadeSignature: log.signature,
      verified: log.verified || false,
    }));
  } catch (error: any) {
    console.error('Failed to get audit logs:', error);
    return [];
  }
}

/**
 * Get audit summary for vault
 */
export async function getAuditSummary(
  accountId: string,
  vaultId: string
): Promise<AuditSummary> {
  const logs = await getVaultAuditLogs(accountId, vaultId, 100);

  // Calculate statistics
  const actionsByType: { [key: string]: number } = {};
  const uniqueActors = new Set<string>();

  logs.forEach((log) => {
    actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
    uniqueActors.add(log.actorAccountId);
  });

  const sortedLogs = logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    vaultId,
    totalActions: logs.length,
    uniqueActors: uniqueActors.size,
    lastAccess: sortedLogs[0]?.timestamp || new Date(),
    actionsByType,
    recentLogs: sortedLogs.slice(0, 10),
  };
}

/**
 * Get all actions by specific user
 */
export async function getUserActions(
  accountId: string,
  vaultId: string,
  targetAccountId: string
): Promise<AuditLogEntry[]> {
  const allLogs = await getVaultAuditLogs(accountId, vaultId, 1000);

  return allLogs.filter((log) => log.actorAccountId === targetAccountId);
}

/**
 * Verify audit log entry signature (Shade TEE attestation)
 */
export async function verifyAuditEntry(
  accountId: string,
  logEntry: AuditLogEntry
): Promise<{ verified: boolean; details: string }> {
  const nova = await getNovaClient(accountId);

  if (!nova || !logEntry.shadeSignature) {
    return {
      verified: false,
      details: 'No Shade signature available',
    };
  }

  try {
    const verification = await nova.verifySignature({
      data: JSON.stringify({
        vaultId: logEntry.vaultId,
        actor: logEntry.actorAccountId,
        action: logEntry.action,
        timestamp: logEntry.timestamp,
      }),
      signature: logEntry.shadeSignature,
    });

    return {
      verified: verification.valid,
      details: verification.valid
        ? 'Shade TEE signature verified'
        : 'Signature verification failed',
    };
  } catch (error: any) {
    return {
      verified: false,
      details: `Verification error: ${error.message}`,
    };
  }
}

/**
 * Export audit logs to JSON
 */
export async function exportAuditLogs(
  accountId: string,
  vaultId: string,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  const logs = await getVaultAuditLogs(accountId, vaultId, 1000);

  if (format === 'json') {
    return JSON.stringify(logs, null, 2);
  }

  // CSV format
  const headers = 'Timestamp,Actor,Action,Resource,Verified\n';
  const rows = logs
    .map(
      (log) =>
        `${log.timestamp.toISOString()},${log.actorAccountId},${log.action},${log.resourcePath || 'N/A'},${log.verified}`
    )
    .join('\n');

  return headers + rows;
}

/**
 * Check for suspicious activity
 */
export async function detectSuspiciousActivity(
  accountId: string,
  vaultId: string
): Promise<{
  suspicious: boolean;
  alerts: string[];
  details: any;
}> {
  const logs = await getVaultAuditLogs(accountId, vaultId, 500);
  const alerts: string[] = [];

  // Check for excessive access
  const recentLogs = logs.filter(
    (log) => log.timestamp.getTime() > Date.now() - 24 * 60 * 60 * 1000 // Last 24h
  );

  if (recentLogs.length > 100) {
    alerts.push(`⚠️ Unusual access volume: ${recentLogs.length} actions in 24 hours`);
  }

  // Check for failed verification
  const unverifiedLogs = logs.filter((log) => !log.verified);
  if (unverifiedLogs.length > 5) {
    alerts.push(`⚠️ ${unverifiedLogs.length} unverified actions detected`);
  }

  // Check for access from unknown actors
  const vault = await getNovaClient(accountId);
  if (vault) {
    try {
      const vaultInfo = await vault.vaults.get(vaultId);
      const authorizedActors = vaultInfo.members?.map((m: any) => m.accountId) || [];

      const unauthorizedAccess = logs.filter(
        (log) => !authorizedActors.includes(log.actorAccountId)
      );

      if (unauthorizedAccess.length > 0) {
        alerts.push(
          `⚠️ ${unauthorizedAccess.length} actions from unauthorized accounts detected`
        );
      }
    } catch (error) {
      console.error('Failed to check authorized actors:', error);
    }
  }

  return {
    suspicious: alerts.length > 0,
    alerts,
    details: {
      totalLogs: logs.length,
      recentLogs: recentLogs.length,
      unverifiedLogs: unverifiedLogs.length,
    },
  };
}
