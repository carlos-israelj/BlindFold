/**
 * Portfolio Analytics Engine
 * Calculates HHI, concentration risk, correlation, and rebalancing suggestions
 */

export interface PortfolioHolding {
  token: string;
  balance: string;
  decimals: number;
  price?: string;
  valueUSD?: number;
}

export interface PortfolioAnalytics {
  hhi: number; // Herfindahl-Hirschman Index
  concentration: 'Low' | 'Medium' | 'High';
  riskScore: number; // 0-100
  topHolding: {
    token: string;
    percentage: number;
  };
  diversification: {
    numAssets: number;
    effectiveAssets: number; // 1/HHI * 10000
  };
  recommendations: string[];
}

/**
 * Calculate Herfindahl-Hirschman Index (HHI)
 * HHI = Σ(market_share_i)^2 * 10000
 *
 * Interpretation:
 * HHI < 1500: Low concentration (competitive/diversified)
 * HHI 1500-2500: Moderate concentration
 * HHI > 2500: High concentration
 */
export function calculateHHI(holdings: PortfolioHolding[]): number {
  // Calculate total value
  const totalValue = holdings.reduce((sum, h) => {
    const value = h.valueUSD || parseFloat(h.balance);
    return sum + value;
  }, 0);

  if (totalValue === 0) return 10000; // Single asset or empty

  // Calculate HHI
  let hhi = 0;
  for (const holding of holdings) {
    const value = holding.valueUSD || parseFloat(holding.balance);
    const percentage = (value / totalValue) * 100;
    hhi += percentage * percentage;
  }

  return hhi;
}

/**
 * Calculate portfolio analytics
 */
export function analyzePortfolio(holdings: PortfolioHolding[]): PortfolioAnalytics {
  // Defensive: handle null/undefined/empty
  if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
    return {
      hhi: 0,
      concentration: 'Low',
      riskScore: 0,
      topHolding: { token: '', percentage: 0 },
      diversification: {
        numAssets: 0,
        effectiveAssets: 0,
      },
      recommendations: ['Connect your wallet to analyze your portfolio.'],
    };
  }

  // Calculate HHI
  const hhi = calculateHHI(holdings);

  // Determine concentration level
  let concentration: 'Low' | 'Medium' | 'High';
  let riskScore: number;

  if (hhi < 1500) {
    concentration = 'Low';
    riskScore = 30;
  } else if (hhi < 2500) {
    concentration = 'Medium';
    riskScore = 55;
  } else {
    concentration = 'High';
    riskScore = 82;
  }

  // Find top holding
  const totalValue = holdings.reduce((sum, h) => {
    const value = h.valueUSD || parseFloat(h.balance);
    return sum + value;
  }, 0);

  let topHolding = { token: '', percentage: 0 };
  let maxValue = 0;

  for (const holding of holdings) {
    const value = holding.valueUSD || parseFloat(holding.balance);
    if (value > maxValue) {
      maxValue = value;
      topHolding = {
        token: holding.token,
        percentage: (value / totalValue) * 100,
      };
    }
  }

  // Calculate effective number of assets
  const effectiveAssets = hhi > 0 ? 10000 / hhi : 0;

  // Generate recommendations
  const recommendations: string[] = [];

  if (hhi > 2500) {
    recommendations.push(
      `Your portfolio is highly concentrated in ${topHolding.token} (${topHolding.percentage.toFixed(1)}%). Consider diversifying to reduce risk.`
    );
    recommendations.push(
      'Recommended allocation: No single asset should exceed 40% of your portfolio.'
    );
  } else if (hhi > 1500) {
    recommendations.push(
      `Moderate concentration detected. ${topHolding.token} represents ${topHolding.percentage.toFixed(1)}% of your portfolio.`
    );
    recommendations.push('Consider rebalancing if your top holding exceeds 50%.');
  } else {
    recommendations.push('Your portfolio shows healthy diversification.');
    recommendations.push(
      `Maintain balanced allocation across your ${holdings.length} assets.`
    );
  }

  // Additional recommendations based on number of assets
  if (holdings.length < 3) {
    recommendations.push(
      'Consider adding more assets (3-10 recommended) to improve diversification.'
    );
  } else if (holdings.length > 15) {
    recommendations.push(
      'You hold many assets. Consider consolidating to reduce complexity while maintaining diversification.'
    );
  }

  return {
    hhi,
    concentration,
    riskScore,
    topHolding,
    diversification: {
      numAssets: holdings.length,
      effectiveAssets,
    },
    recommendations,
  };
}

/**
 * Calculate correlation between two asset price series
 * Useful for detecting correlated vs uncorrelated holdings
 */
export function calculateCorrelation(
  prices1: number[],
  prices2: number[]
): number {
  if (prices1.length !== prices2.length || prices1.length === 0) {
    return 0;
  }

  const n = prices1.length;

  // Calculate means
  const mean1 = prices1.reduce((sum, p) => sum + p, 0) / n;
  const mean2 = prices2.reduce((sum, p) => sum + p, 0) / n;

  // Calculate covariance and standard deviations
  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = prices1[i] - mean1;
    const diff2 = prices2[i] - mean2;

    covariance += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }

  const stdDev1 = Math.sqrt(variance1 / n);
  const stdDev2 = Math.sqrt(variance2 / n);

  if (stdDev1 === 0 || stdDev2 === 0) {
    return 0;
  }

  const correlation = covariance / (n * stdDev1 * stdDev2);
  return correlation;
}

/**
 * Suggest rebalancing actions
 */
export function generateRebalancingSuggestions(
  holdings: PortfolioHolding[],
  targetAllocation?: { [token: string]: number }
): string[] {
  const suggestions: string[] = [];
  const analytics = analyzePortfolio(holdings);

  // If highly concentrated, suggest selling some of the top holding
  if (analytics.concentration === 'High') {
    const excessPercentage = analytics.topHolding.percentage - 40;
    if (excessPercentage > 0) {
      suggestions.push(
        `Consider reducing ${analytics.topHolding.token} by ${excessPercentage.toFixed(1)}% to reach 40% allocation.`
      );
      suggestions.push(
        'Reallocate proceeds to stablecoins (USDC, USDT) or other established tokens (BTC, ETH).'
      );
    }
  }

  // If target allocation is provided, calculate deviations
  if (targetAllocation) {
    const totalValue = holdings.reduce(
      (sum, h) => sum + (h.valueUSD || parseFloat(h.balance)),
      0
    );

    for (const holding of holdings) {
      const currentPercentage =
        ((holding.valueUSD || parseFloat(holding.balance)) / totalValue) * 100;
      const targetPercentage = targetAllocation[holding.token] || 0;
      const deviation = currentPercentage - targetPercentage;

      if (Math.abs(deviation) > 5) {
        // Only suggest if deviation > 5%
        if (deviation > 0) {
          suggestions.push(
            `${holding.token}: Currently ${currentPercentage.toFixed(1)}%, target ${targetPercentage}%. Consider selling ${deviation.toFixed(1)}%.`
          );
        } else {
          suggestions.push(
            `${holding.token}: Currently ${currentPercentage.toFixed(1)}%, target ${targetPercentage}%. Consider buying ${Math.abs(deviation).toFixed(1)}%.`
          );
        }
      }
    }
  }

  return suggestions;
}
