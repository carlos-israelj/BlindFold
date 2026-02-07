/**
 * FastNEAR API Integration
 * Provides complete portfolio data: FTs, NFTs, staking positions
 * Free to use, no API key required
 */

const FASTNEAR_API_BASE = 'https://api.fastnear.com/v1';

export interface FastNEARToken {
  contract_id: string;
  amount: string;
  decimals: number;
  symbol: string;
  name: string;
  icon?: string;
  price?: string;
}

export interface FastNEARNFT {
  contract_id: string;
  token_id: string;
  metadata?: {
    title?: string;
    description?: string;
    media?: string;
  };
}

export interface FastNEARStaking {
  validator_id: string;
  staked_balance: string;
  unstaked_balance: string;
  can_withdraw: boolean;
  reward: string;
}

export interface FastNEARAccountData {
  account_id: string;
  near_balance: string;
  tokens: FastNEARToken[];
  nfts: FastNEARNFT[];
  staking: FastNEARStaking[];
  total_value_usd?: string;
}

/**
 * Fetch complete account data from FastNEAR API
 */
export async function fetchAccountFull(accountId: string): Promise<FastNEARAccountData> {
  try {
    const response = await fetch(`${FASTNEAR_API_BASE}/account/${accountId}/full`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FastNEAR API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching account data from FastNEAR:', error);
    throw error;
  }
}

/**
 * Fetch just token balances (lighter request)
 */
export async function fetchAccountTokens(accountId: string): Promise<FastNEARToken[]> {
  try {
    const response = await fetch(`${FASTNEAR_API_BASE}/account/${accountId}/ft`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FastNEAR API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.tokens || [];
  } catch (error) {
    console.error('Error fetching tokens from FastNEAR:', error);
    throw error;
  }
}

/**
 * Fetch account balance (NEAR only)
 */
export async function fetchAccountBalance(accountId: string): Promise<string> {
  try {
    const response = await fetch(`${FASTNEAR_API_BASE}/account/${accountId}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FastNEAR API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.amount || '0';
  } catch (error) {
    console.error('Error fetching balance from FastNEAR:', error);
    throw error;
  }
}

/**
 * Convert FastNEAR data to portfolio JSON format
 */
export function convertToPortfolioJSON(accountData: FastNEARAccountData): any {
  const holdings = [];

  // Add NEAR balance
  holdings.push({
    token: 'NEAR',
    contract: 'native',
    balance: accountData.near_balance,
    decimals: 24,
    symbol: 'NEAR',
    name: 'NEAR Protocol',
  });

  // Add fungible tokens
  for (const token of accountData.tokens) {
    holdings.push({
      token: token.symbol,
      contract: token.contract_id,
      balance: token.amount,
      decimals: token.decimals,
      symbol: token.symbol,
      name: token.name,
      price: token.price,
    });
  }

  // Add staked NEAR
  for (const stake of accountData.staking) {
    holdings.push({
      token: 'NEAR (Staked)',
      contract: 'staking',
      validator: stake.validator_id,
      balance: stake.staked_balance,
      decimals: 24,
      symbol: 'stNEAR',
      name: `Staked with ${stake.validator_id}`,
      reward: stake.reward,
    });
  }

  return {
    version: 1,
    accountId: accountData.account_id,
    lastUpdated: new Date().toISOString(),
    holdings,
    nfts: accountData.nfts.map(nft => ({
      contract: nft.contract_id,
      tokenId: nft.token_id,
      metadata: nft.metadata,
    })),
    totalValueUSD: accountData.total_value_usd,
  };
}
