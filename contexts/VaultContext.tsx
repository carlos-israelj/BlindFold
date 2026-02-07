'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { VaultState } from '@/types';

interface VaultContextType extends VaultState {
  initializeVault: (vaultId: string) => void;
  clearVault: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPortfolioCID: (cid: string) => void;
  addChatCID: (cid: string) => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<VaultState>({
    vaultId: null,
    isInitialized: false,
    loading: false,
    error: null,
    portfolioCID: null,
    chatCIDs: [],
  });

  const initializeVault = useCallback((vaultId: string) => {
    setState((prev) => ({
      ...prev,
      vaultId,
      isInitialized: true,
      error: null,
    }));
  }, []);

  const clearVault = useCallback(() => {
    setState({
      vaultId: null,
      isInitialized: false,
      loading: false,
      error: null,
      portfolioCID: null,
      chatCIDs: [],
    });
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

  const setPortfolioCID = useCallback((cid: string) => {
    setState((prev) => ({
      ...prev,
      portfolioCID: cid,
    }));
  }, []);

  const addChatCID = useCallback((cid: string) => {
    setState((prev) => ({
      ...prev,
      chatCIDs: [...(prev.chatCIDs || []), cid],
    }));
  }, []);

  return (
    <VaultContext.Provider
      value={{
        ...state,
        initializeVault,
        clearVault,
        setLoading,
        setError,
        setPortfolioCID,
        addChatCID,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
