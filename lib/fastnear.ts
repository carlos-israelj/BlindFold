/**
 * FastNEAR API Integration
 * Provides complete portfolio data: FTs, NFTs, staking positions
 * Free to use, no API key required
 */

const FASTNEAR_API_BASE = 'https://api.fastnear.com/v1';

export interface FastNEARAccountData {
  account_id: string;
  state: {
    balance: string;
    locked: string;
    storage_bytes: number;
  };
  tokens: Array<{
    contract_id: string;
    balance: string;
    last_update_block_height: number | null;
  }>;
  nfts: Array<{
    contract_id: string;
    last_update_block_height: number | null;
  }>;
  pools: Array<{
    pool_id: string;
    last_update_block_height: number | null;
  }>;
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
export async function fetchAccountTokens(accountId: string): Promise<any[]> {
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

  // Add NEAR balance (convert from yoctoNEAR)
  const nearBalance = (BigInt(accountData.state.balance) / BigInt(10 ** 24)).toString();
  holdings.push({
    token: 'NEAR',
    contract: 'native',
    balance: nearBalance,
    decimals: 24,
    symbol: 'NEAR',
    name: 'NEAR Protocol',
  });

  // Add fungible tokens
  for (const token of accountData.tokens) {
    // Skip if balance is empty or null
    if (!token.balance || token.balance === '') continue;

    holdings.push({
      token: token.contract_id.split('.')[0].toUpperCase(), // Extract token name
      contract: token.contract_id,
      balance: token.balance,
      decimals: 18, // Default, we'd need to fetch metadata for exact decimals
      symbol: token.contract_id.split('.')[0].toUpperCase(),
      name: token.contract_id,
    });
  }

  // Add staking pools
  for (const pool of accountData.pools) {
    holdings.push({
      token: 'NEAR (Staked)',
      contract: 'staking',
      validator: pool.pool_id,
      balance: '0', // FastNEAR doesn't return staked amounts directly
      decimals: 24,
      symbol: 'stNEAR',
      name: `Staked with ${pool.pool_id}`,
    });
  }

  return {
    version: 1,
    accountId: accountData.account_id,
    lastUpdated: new Date().toISOString(),
    holdings,
    nfts: accountData.nfts.map(nft => ({
      contract: nft.contract_id,
      tokenId: 'unknown', // FastNEAR v1/full doesn't include token IDs
      metadata: {},
    })),
    totalValueUSD: undefined, // Not provided by FastNEAR
  };
}
