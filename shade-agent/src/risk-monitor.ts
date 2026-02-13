/**
 * Portfolio Risk Monitoring
 */

import { retrievePortfolio } from './nova-client';

export interface PortfolioAsset {
  symbol: string;
  balance: number;
  value: number;
}

export interface RiskAnalysis {
  timestamp: Date;
  agentId: string;
  accountId: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  data: {
    hhi: number;
    concentration: 'Low' | 'Medium' | 'High';
    assetsCount: number;
    totalValue: number;
  };
}

/**
 * Calculate Herfindahl-Hirschman Index (HHI) for portfolio concentration
 */
function calculateHHI(assets: PortfolioAsset[]): number {
  if (!assets || assets.length === 0) {
    return 0;
  }

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  if (totalValue === 0) {
    return 0;
  }

  const hhi = assets.reduce((sum, asset) => {
    const marketShare = (asset.value / totalValue) * 100;
    return sum + marketShare * marketShare;
  }, 0);

  return Math.round(hhi);
}

/**
 * Analyze portfolio risk
 */
export async function analyzePortfolioRisk(
  accountId: string,
  groupId: string,
  cid: string
): Promise<RiskAnalysis> {
  try {
    // Retrieve and decrypt portfolio
    const portfolio = await retrievePortfolio(accountId, groupId, cid);

    // Calculate HHI
    const assets = portfolio.assets || [];
    const hhi = calculateHHI(assets);

    // Determine concentration level
    let concentration: 'Low' | 'Medium' | 'High';
    if (hhi < 1500) {
      concentration = 'Low';
    } else if (hhi < 2500) {
      concentration = 'Medium';
    } else {
      concentration = 'High';
    }

    // Determine severity and message
    let severity: 'info' | 'warning' | 'critical' = 'info';
    let message = '';

    if (hhi > 7000) {
      severity = 'critical';
      message = `🚨 CRITICAL: Extreme portfolio concentration (HHI: ${hhi}). Immediate diversification recommended.`;
    } else if (hhi > 5000) {
      severity = 'warning';
      message = `⚠️ WARNING: High portfolio concentration (HHI: ${hhi}). Consider rebalancing to reduce risk.`;
    } else if (hhi > 2500) {
      severity = 'info';
      message = `ℹ️ Moderate concentration (HHI: ${hhi}). Portfolio is reasonably diversified.`;
    } else {
      severity = 'info';
      message = `✅ Good diversification (HHI: ${hhi}). Portfolio risk is well-distributed.`;
    }

    const totalValue = assets.reduce((sum: number, asset: PortfolioAsset) => sum + asset.value, 0);

    return {
      timestamp: new Date(),
      agentId: 'shade-risk-monitor',
      accountId,
      message,
      severity,
      data: {
        hhi,
        concentration,
        assetsCount: assets.length,
        totalValue,
      },
    };
  } catch (error: any) {
    console.error('Risk analysis failed:', error);

    return {
      timestamp: new Date(),
      agentId: 'shade-risk-monitor',
      accountId,
      message: `❌ Error analyzing portfolio: ${error.message}`,
      severity: 'warning',
      data: {
        hhi: 0,
        concentration: 'Low',
        assetsCount: 0,
        totalValue: 0,
      },
    };
  }
}

/**
 * Send notification (could be webhook, email, etc.)
 */
export async function sendNotification(analysis: RiskAnalysis): Promise<void> {
  // In production, this would send to a webhook, email service, etc.
  // For now, just log the alert

  console.log('\n' + '='.repeat(60));
  console.log('📢 ALERT NOTIFICATION');
  console.log('='.repeat(60));
  console.log(`Severity: ${analysis.severity.toUpperCase()}`);
  console.log(`Message: ${analysis.message}`);
  console.log(`Time: ${analysis.timestamp.toISOString()}`);
  console.log(`Account: ${analysis.accountId}`);
  console.log('\nDetails:');
  console.log(`  HHI: ${analysis.data.hhi}`);
  console.log(`  Concentration: ${analysis.data.concentration}`);
  console.log(`  Assets: ${analysis.data.assetsCount}`);
  console.log(`  Total Value: $${analysis.data.totalValue.toFixed(2)}`);
  console.log('='.repeat(60) + '\n');

  // TODO: Add webhook integration for production
  // Example:
  // await fetch(process.env.WEBHOOK_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(analysis)
  // });
}
