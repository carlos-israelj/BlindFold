/**
 * NOVA Autonomous Agents Integration
 *
 * Shade Agents are SEPARATE TEE services deployed independently.
 * This file provides the interface between the web app and deployed agents.
 *
 * The actual agent code is in: /shade-agent/
 * Deploy to: Phala Cloud, Docker, or VPS
 */

import { getNovaClient } from './nova';
import { calculateHHI } from './portfolio-analytics';
import { retrievePortfolioData, getPortfolioHistory } from './nova-simple';

export interface AgentConfig {
  id: string;
  name: string;
  accountId: string;
  groupId: string;
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
 * Portfolio risk analysis function
 * This is what the deployed Shade Agent executes
 */
export async function analyzePortfolioRisk(
  accountId: string,
  groupId: string,
  latestCid: string
): Promise<AgentNotification> {
  try {
    // Retrieve latest portfolio data
    const portfolio = await retrievePortfolioData(accountId, groupId, latestCid);

    // Calculate risk metrics
    const hhi = calculateHHI(portfolio.assets || portfolio);

    // Determine concentration level
    let concentration: 'Low' | 'Medium' | 'High';
    if (hhi < 1500) {
      concentration = 'Low';
    } else if (hhi < 2500) {
      concentration = 'Medium';
    } else {
      concentration = 'High';
    }

    // Determine notification severity and message
    let severity: 'info' | 'warning' | 'critical' = 'info';
    let message = '';

    if (hhi > 7000) {
      severity = 'critical';
      message = `CRITICAL: Extreme portfolio concentration detected (HHI: ${hhi.toFixed(0)}). Immediate diversification recommended.`;
    } else if (hhi > 5000) {
      severity = 'warning';
      message = `WARNING: High portfolio concentration (HHI: ${hhi.toFixed(0)}). Consider rebalancing to reduce risk.`;
    } else if (hhi > 2500) {
      severity = 'info';
      message = `Moderate concentration (HHI: ${hhi.toFixed(0)}). Portfolio is reasonably diversified.`;
    } else {
      severity = 'info';
      message = `Good diversification (HHI: ${hhi.toFixed(0)}). Portfolio risk is well-distributed.`;
    }

    return {
      timestamp: new Date(),
      agentId: 'risk-monitor',
      accountId,
      message,
      severity,
      data: {
        hhi,
        concentration,
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
 * Get latest portfolio CID for analysis
 */
export async function getLatestPortfolioCid(
  accountId: string,
  groupId: string
): Promise<string | null> {
  try {
    const transactions = await getPortfolioHistory(accountId, groupId);

    if (!transactions || transactions.length === 0) {
      return null;
    }

    // Sort by timestamp and get latest
    const sorted = transactions.sort((a, b) => b.timestamp - a.timestamp);
    return sorted[0].ipfsHash;
  } catch (error) {
    console.error('Failed to get latest CID:', error);
    return null;
  }
}

/**
 * Get agent configuration for a group
 * In production, this would be fetched from database
 */
export async function getAgentConfig(
  accountId: string,
  groupId: string
): Promise<AgentConfig | null> {
  const nova = await getNovaClient(accountId);

  if (!nova) {
    return null;
  }

  try {
    // Check if user has access to the group
    const hasAccess = await nova.isAuthorized(groupId, accountId);

    if (!hasAccess) {
      return null;
    }

    // Return agent configuration
    // In production, this would be stored in database
    return {
      id: `agent-${groupId}`,
      name: 'Portfolio Risk Monitor',
      accountId,
      groupId,
      schedule: '0 9 * * *', // 9:00 AM daily
      enabled: true,
      nextRun: getNextRunTime('0 9 * * *'),
    };
  } catch (error) {
    console.error('Failed to get agent config:', error);
    return null;
  }
}

/**
 * Execute risk analysis manually (for testing)
 */
export async function executeRiskAnalysis(
  accountId: string,
  groupId: string
): Promise<AgentNotification> {
  const latestCid = await getLatestPortfolioCid(accountId, groupId);

  if (!latestCid) {
    return {
      timestamp: new Date(),
      agentId: 'risk-monitor',
      accountId,
      message: 'No portfolio data found in vault',
      severity: 'warning',
    };
  }

  return await analyzePortfolioRisk(accountId, groupId, latestCid);
}

/**
 * Helper: Calculate next run time from cron expression
 */
function getNextRunTime(cron: string): Date {
  // Simple implementation for '0 9 * * *' (9am daily)
  const now = new Date();
  const next = new Date(now);

  next.setHours(9, 0, 0, 0);

  // If 9am today has passed, schedule for tomorrow
  if (next < now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}
