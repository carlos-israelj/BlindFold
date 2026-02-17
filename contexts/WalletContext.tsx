'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Portfolio, PortfolioAnalytics, WalletState } from '@/types';

interface WalletContextType extends WalletState {
  connect: (accountId: string) => void;
  disconnect: () => void;
  setPortfolio: (portfolio: Portfolio, analytics?: PortfolioAnalytics) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshPortfolio: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    accountId: null,
    isConnected: false,
    portfolio: null,
    analytics: null,
    loading: false,
    error: null,
  });

  const connect = useCallback(async (accountId: string) => {
    console.log('WalletContext.connect() called with accountId:', accountId);
    setState((prev) => ({
      ...prev,
      accountId,
      isConnected: true,
      error: null,
      loading: true,
    }));

    // Try to restore portfolio from NOVA vault
    try {
      const vaultRes = await fetch(`/api/vault/portfolio?accountId=${encodeURIComponent(accountId)}&groupId=vault.${accountId}`);
      if (vaultRes.ok) {
        const vaultData = await vaultRes.json();
        if (vaultData.hasPortfolio && vaultData.portfolio?.assets) {
          // Convert vault portfolio format to Portfolio type
          const holdings = vaultData.portfolio.assets.map((a: any) => ({
            token: a.symbol,
            contract: '',
            balance: String(a.balance),
            decimals: 24,
            symbol: a.symbol,
            name: a.symbol,
            valueUSD: a.value,
          }));
          const restoredPortfolio: Portfolio = {
            version: 1,
            accountId,
            lastUpdated: vaultData.portfolio.metadata?.uploadedAt || new Date().toISOString(),
            holdings,
            totalValueUSD: String(holdings.reduce((s: number, h: any) => s + (h.valueUSD || 0), 0)),
          };
          setState((prev) => ({
            ...prev,
            portfolio: restoredPortfolio,
            loading: false,
          }));
          console.log('[WalletContext] Portfolio restored from NOVA vault');
          return;
        }
      }
    } catch (err) {
      console.warn('[WalletContext] Could not restore portfolio from NOVA vault:', err);
    }

    setState((prev) => ({ ...prev, loading: false }));
  }, []);

  const disconnect = useCallback(() => {
    setState({
      accountId: null,
      isConnected: false,
      portfolio: null,
      analytics: null,
      loading: false,
      error: null,
    });
  }, []);

  const setPortfolio = useCallback((portfolio: Portfolio, analytics?: PortfolioAnalytics) => {
    setState((prev) => ({
      ...prev,
      portfolio,
      analytics: analytics || null,
      error: null,
    }));
  }, []);

  const refreshPortfolio = useCallback(async () => {
    if (!state.accountId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: state.accountId }),
      });

      const result = await response.json();

      if (result.success) {
        setPortfolio(result.data.portfolio, result.data.analytics);
      } else {
        setError(result.error || 'Failed to refresh portfolio');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to refresh portfolio');
    } finally {
      setLoading(false);
    }
  }, [state.accountId]);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      loading,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
      loading: false,
    }));
  }, []);

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        setPortfolio,
        setLoading,
        setError,
        refreshPortfolio,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
