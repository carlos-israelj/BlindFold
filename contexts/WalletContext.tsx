'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Portfolio, WalletState } from '@/types';

interface WalletContextType extends WalletState {
  connect: (accountId: string) => void;
  disconnect: () => void;
  setPortfolio: (portfolio: Portfolio) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    accountId: null,
    isConnected: false,
    portfolio: null,
    loading: false,
    error: null,
  });

  const connect = useCallback((accountId: string) => {
    setState((prev) => ({
      ...prev,
      accountId,
      isConnected: true,
      error: null,
    }));
  }, []);

  const disconnect = useCallback(() => {
    setState({
      accountId: null,
      isConnected: false,
      portfolio: null,
      loading: false,
      error: null,
    });
  }, []);

  const setPortfolio = useCallback((portfolio: Portfolio) => {
    setState((prev) => ({
      ...prev,
      portfolio,
      error: null,
    }));
  }, []);

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
