/**
 * NOVA Autonomous Agents
 * Shade Agents for automated portfolio monitoring and analysis
 */

import { NovaSdk } from 'nova-sdk-js';
import { getNovaClient } from './nova';
import { calculateHHI, getRiskLevel } from './portfolio-analytics';

export interface AgentConfig {
  id: string;
  name: string;
  accountId: string;
  schedule: string; // Cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface AgentNotification {
  timestamp: Date;
  agentId: string;
  accountId: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  data?: any;
}

/**
 * Create autonomous agent for daily portfolio risk monitoring
 */
export async function setupDailyRiskMonitor(
  accountId: string,
  vaultId: string
): Promise<AgentConfig> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  try {
    // Create Shade Agent for autonomous execution
    const agent = await nova.agents.create({
      name: 'Portfolio Risk Monitor',
      description: 'Daily portfolio risk analysis and notifications',
      trigger: {
        type: 'schedule',
        cron: '0 9 * * *', // 9:00 AM daily
        timezone: 'UTC',
      },
      task: {
        type: 'execute_function',
        vaultId,
        function: 'analyze_portfolio_risk',
        // Agent will fetch vault, decrypt, analyze, and notify
      },
      permissions: {
        vaults: ['read'],
        notifications: ['send'],
      },
      enabled: true,
    });

    return {
      id: agent.id,
      name: agent.name,
      accountId,
      schedule: '0 9 * * *',
      enabled: true,
      nextRun: getNextRunTime('0 9 * * *'),
    };
  } catch (error: any) {
    console.error('Failed to create autonomous agent:', error);

    // Return mock agent for fallback
    return {
      id: `mock-agent-${Date.now()}`,
      name: 'Portfolio Risk Monitor',
      accountId,
      schedule: '0 9 * * *',
      enabled: false,
      nextRun: getNextRunTime('0 9 * * *'),
    };
  }
}

/**
 * Manual execution of portfolio risk analysis
 * (Simulates what autonomous agent would do)
 */
export async function executeRiskAnalysis(
  accountId: string,
  vaultId: string
): Promise<AgentNotification> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  try {
    // Fetch latest portfolio data from vault
    const files = await nova.vaults.listFiles(vaultId);
    const latestFile = files.sort(
      (a, b) => b.timestamp - a.timestamp
    )[0];

    if (!latestFile) {
      return {
        timestamp: new Date(),
        agentId: 'risk-monitor',
        accountId,
        message: 'No portfolio data found in vault',
        severity: 'warning',
      };
    }

    // Download and decrypt
    const encryptedData = await nova.files.download(latestFile.cid);
    const decrypted = await nova.decrypt({
      ciphertext: encryptedData,
      keyDerivation: {
        type: 'shade-agent',
        accountId,
      },
    });

    // Parse portfolio data
    const portfolio = JSON.parse(decrypted.plaintext.toString());

    // Calculate risk metrics
    const hhi = calculateHHI(portfolio);
    const riskLevel = getRiskLevel(hhi);

    // Determine notification severity
    let severity: 'info' | 'warning' | 'critical' = 'info';
    let message = '';

    if (hhi > 7000) {
      severity = 'critical';
      message = `⚠️ CRITICAL: Extreme portfolio concentration detected (HHI: ${hhi.toFixed(0)}). Immediate diversification recommended.`;
    } else if (hhi > 5000) {
      severity = 'warning';
      message = `⚠️ WARNING: High portfolio concentration (HHI: ${hhi.toFixed(0)}). Consider rebalancing to reduce risk.`;
    } else if (hhi > 2500) {
      severity = 'info';
      message = `ℹ️ Moderate concentration (HHI: ${hhi.toFixed(0)}). Portfolio is reasonably diversified.`;
    } else {
      severity = 'info';
      message = `✅ Good diversification (HHI: ${hhi.toFixed(0)}). Portfolio risk is well-distributed.`;
    }

    return {
      timestamp: new Date(),
      agentId: 'risk-monitor',
      accountId,
      message,
      severity,
      data: {
        hhi,
        riskLevel,
        assetsCount: portfolio.assets?.length || 0,
        totalValue: portfolio.totalValue || 0,
      },
    };
  } catch (error: any) {
    console.error('Risk analysis error:', error);
    return {
      timestamp: new Date(),
      agentId: 'risk-monitor',
      accountId,
      message: `Error analyzing portfolio: ${error.message}`,
      severity: 'warning',
    };
  }
}

/**
 * List all autonomous agents for user
 */
export async function listAgents(accountId: string): Promise<AgentConfig[]> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    return [];
  }

  try {
    const agents = await nova.agents.list({ accountId });

    return agents.map((agent: any) => ({
      id: agent.id,
      name: agent.name,
      accountId,
      schedule: agent.trigger.cron,
      enabled: agent.enabled,
      lastRun: agent.lastRun ? new Date(agent.lastRun) : undefined,
      nextRun: agent.nextRun ? new Date(agent.nextRun) : undefined,
    }));
  } catch (error) {
    console.error('Failed to list agents:', error);
    return [];
  }
}

/**
 * Disable autonomous agent
 */
export async function disableAgent(
  accountId: string,
  agentId: string
): Promise<void> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  await nova.agents.update(agentId, { enabled: false });
}

/**
 * Enable autonomous agent
 */
export async function enableAgent(
  accountId: string,
  agentId: string
): Promise<void> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  await nova.agents.update(agentId, { enabled: true });
}

/**
 * Delete autonomous agent
 */
export async function deleteAgent(
  accountId: string,
  agentId: string
): Promise<void> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    throw new Error('NOVA client not configured');
  }

  await nova.agents.delete(agentId);
}

/**
 * Helper: Calculate next run time from cron expression
 */
function getNextRunTime(cron: string): Date {
  // Simple implementation - for '0 9 * * *' (9am daily)
  const now = new Date();
  const next = new Date(now);

  next.setHours(9, 0, 0, 0);

  // If 9am today has passed, schedule for tomorrow
  if (next < now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}
