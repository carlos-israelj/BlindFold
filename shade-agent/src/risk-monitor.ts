/**
 * Portfolio Risk Monitoring
 */

import { retrievePortfolio } from './nova-client';

export interface PortfolioAsset {
  symbol: string;
  balance: number;
  value: number;
}

export interface SwapRecommendation {
  action: 'sell' | 'buy';
  symbol: string;
  currentPercentage: number;
  targetPercentage: number;
  amountUSD: number;
  reason: string;
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
  recommendations?: SwapRecommendation[];
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
 * Generate swap recommendations to reduce portfolio concentration
 */
function generateRebalancingRecommendations(
  assets: PortfolioAsset[],
  hhi: number
): SwapRecommendation[] {
  if (!assets || assets.length === 0 || hhi < 2500) {
    return [];
  }

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const recommendations: SwapRecommendation[] = [];

  // Sort assets by value descending
  const sortedAssets = [...assets].sort((a, b) => b.value - a.value);

  // Calculate current percentages
  const assetsWithPercentage = sortedAssets.map(asset => ({
    ...asset,
    percentage: (asset.value / totalValue) * 100
  }));

  // Find overconcentrated assets (>25% of portfolio)
  const overconcentrated = assetsWithPercentage.filter(a => a.percentage > 25);

  if (overconcentrated.length > 0) {
    // For each overconcentrated asset, recommend reducing to 20-25%
    for (const asset of overconcentrated) {
      const targetPercentage = 20; // Target 20% max per asset
      const excessPercentage = asset.percentage - targetPercentage;
      const sellAmount = (excessPercentage / 100) * totalValue;

      recommendations.push({
        action: 'sell',
        symbol: asset.symbol,
        currentPercentage: Math.round(asset.percentage * 100) / 100,
        targetPercentage,
        amountUSD: Math.round(sellAmount * 100) / 100,
        reason: `Reduce concentration from ${Math.round(asset.percentage)}% to ${targetPercentage}%`
      });
    }

    // Recommend diversifying into other assets
    const underweighted = assetsWithPercentage.filter(a => a.percentage < 15);

    if (underweighted.length > 0) {
      // Recommend buying more of existing underweighted assets
      const totalToRedistribute = recommendations.reduce((sum, r) => sum + r.amountUSD, 0);
      const amountPerAsset = totalToRedistribute / underweighted.length;

      for (const asset of underweighted) {
        const targetPercentage = Math.min(20, asset.percentage + 10);
        recommendations.push({
          action: 'buy',
          symbol: asset.symbol,
          currentPercentage: Math.round(asset.percentage * 100) / 100,
          targetPercentage: Math.round(targetPercentage * 100) / 100,
          amountUSD: Math.round(amountPerAsset * 100) / 100,
          reason: `Increase allocation to improve diversification`
        });
      }
    } else {
      // Recommend buying new assets for diversification
      const suggestedAssets = ['ETH', 'BTC', 'USDC', 'USDT'].filter(
        symbol => !assets.find(a => a.symbol === symbol)
      );

      if (suggestedAssets.length > 0) {
        const totalToRedistribute = recommendations.reduce((sum, r) => sum + r.amountUSD, 0);
        const amountPerAsset = totalToRedistribute / Math.min(suggestedAssets.length, 2);

        for (const symbol of suggestedAssets.slice(0, 2)) {
          recommendations.push({
            action: 'buy',
            symbol,
            currentPercentage: 0,
            targetPercentage: 15,
            amountUSD: Math.round(amountPerAsset * 100) / 100,
            reason: `Add new asset for better diversification`
          });
        }
      }
    }
  }

  return recommendations;
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

    // Support both 'assets' (from PortfolioForm) and 'holdings' (from wallet)
    let assets = portfolio.assets || portfolio.holdings || [];

    // If holdings don't have 'value', add it (using balance as approximation)
    if (assets.length > 0 && !assets[0].value && assets[0].balance) {
      assets = assets.map((asset: any) => ({
        ...asset,
        value: parseFloat(asset.balance) || 0
      }));
    }

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

    // Generate rebalancing recommendations if needed
    const recommendations = generateRebalancingRecommendations(assets, hhi);

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
      recommendations: recommendations.length > 0 ? recommendations : undefined,
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

  if (analysis.recommendations && analysis.recommendations.length > 0) {
    console.log('\n💡 REBALANCING RECOMMENDATIONS:');
    for (const rec of analysis.recommendations) {
      const emoji = rec.action === 'sell' ? '📉' : '📈';
      console.log(`  ${emoji} ${rec.action.toUpperCase()} ${rec.symbol}`);
      console.log(`     Current: ${rec.currentPercentage}% → Target: ${rec.targetPercentage}%`);
      console.log(`     Amount: $${rec.amountUSD.toFixed(2)}`);
      console.log(`     Reason: ${rec.reason}`);
    }
  }

  console.log('='.repeat(60) + '\n');

  // Send to frontend webhook to store in database
  const frontendUrl = process.env.FRONTEND_URL || process.env.WEBHOOK_URL;
  if (frontendUrl) {
    try {
      const webhookEndpoint = frontendUrl.endsWith('/api/agents/alerts')
        ? frontendUrl
        : `${frontendUrl}/api/agents/alerts`;

      const response = await fetch(webhookEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysis)
      });

      if (response.ok) {
        console.log('✅ Alert sent to frontend successfully');
      } else {
        const errorText = await response.text();
        console.error('❌ Frontend webhook failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Frontend webhook failed:', error);
    }
  } else {
    console.log('⚠️  No FRONTEND_URL or WEBHOOK_URL configured - alerts only logged locally');
  }
}
