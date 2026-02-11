import { Portfolio, TokenHolding } from '@/types';

export function formatPortfolioForAI(portfolio: Portfolio): string {
  let output = `Account: ${portfolio.accountId}\n`;
  output += `Last Updated: ${new Date(portfolio.lastUpdated).toLocaleString()}\n\n`;
  output += `Holdings:\n`;

  // Defensive check for holdings
  const holdings = portfolio.holdings || [];

  holdings.forEach((holding) => {
    output += `- ${holding.token}: ${holding.balance}`;
    if (holding.valueUSD) {
      output += ` ($${holding.valueUSD.toFixed(2)})`;
    }
    output += `\n`;
  });

  const totalValue = holdings.reduce(
    (sum, h) => sum + (h.valueUSD || 0),
    0
  );

  if (totalValue > 0) {
    output += `\nTotal Value: $${totalValue.toFixed(2)}`;
  }

  return output;
}

export function calculateAllocation(holdings: TokenHolding[]): Record<string, number> {
  // Defensive check for holdings
  if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
    return {};
  }

  const totalValue = holdings.reduce((sum, h) => sum + (h.valueUSD || 0), 0);

  if (totalValue === 0) return {};

  const allocation: Record<string, number> = {};
  holdings.forEach((holding) => {
    const percentage = ((holding.valueUSD || 0) / totalValue) * 100;
    allocation[holding.token] = percentage;
  });

  return allocation;
}

export function exportPortfolioData(portfolio: Portfolio, chatHistory?: any): string {
  const exportData = {
    portfolio,
    chatHistory,
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(exportData, null, 2);
}
