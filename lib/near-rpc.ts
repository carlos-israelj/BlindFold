import { providers } from 'near-api-js';
import { NEAR_RPC_URL, KNOWN_TOKENS } from './constants';
import { Portfolio, TokenHolding } from '@/types';

const provider = new providers.JsonRpcProvider({
  url: NEAR_RPC_URL,
});

export async function getAccountBalance(accountId: string): Promise<string> {
  try {
    const account = await provider.query({
      request_type: 'view_account',
      account_id: accountId,
      finality: 'final',
    });

    // Convert yoctoNEAR to NEAR (1 NEAR = 10^24 yoctoNEAR)
    const balance = (account as any).amount;
    return (BigInt(balance) / BigInt(10 ** 24)).toString();
  } catch (error) {
    console.error('Error fetching account balance:', error);
    return '0';
  }
}

export async function getTokenBalance(
  accountId: string,
  tokenContract: string
): Promise<string> {
  try {
    const result = await provider.query({
      request_type: 'call_function',
      account_id: tokenContract,
      method_name: 'ft_balance_of',
      args_base64: Buffer.from(
        JSON.stringify({ account_id: accountId })
      ).toString('base64'),
      finality: 'final',
    });

    const balance = JSON.parse(
      Buffer.from((result as any).result).toString()
    );

    return balance;
  } catch (error) {
    console.error(`Error fetching token balance for ${tokenContract}:`, error);
    return '0';
  }
}

export async function fetchPortfolio(accountId: string): Promise<Portfolio> {
  const holdings: TokenHolding[] = [];

  // Fetch NEAR balance
  const nearBalance = await getAccountBalance(accountId);
  if (parseFloat(nearBalance) > 0) {
    holdings.push({
      token: 'NEAR',
      contract: 'native',
      balance: nearBalance,
      decimals: 24,
    });
  }

  // Fetch known token balances
  for (const [token, { contract, decimals }] of Object.entries(KNOWN_TOKENS)) {
    if (contract === 'native') continue; // Already fetched NEAR

    const balance = await getTokenBalance(accountId, contract);
    const formattedBalance = (
      BigInt(balance) / BigInt(10 ** decimals)
    ).toString();

    if (parseFloat(formattedBalance) > 0) {
      holdings.push({
        token,
        contract,
        balance: formattedBalance,
        decimals,
      });
    }
  }

  return {
    version: 1,
    accountId,
    lastUpdated: new Date().toISOString(),
    holdings,
  };
}
