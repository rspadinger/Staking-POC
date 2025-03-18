"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStakedBalanceFormatted } from './contracts';

interface StakingContextType {
  stakedBalance: number;
  refreshStakedBalance: (address: string) => Promise<void>;
  lastRefreshed: number;
}

const StakingContext = createContext<StakingContextType | undefined>(undefined);

export function StakingProvider({ children, initialAddress = '' }: { children: ReactNode, initialAddress?: string }) {
  const [stakedBalance, setStakedBalance] = useState(0);
  const [currentAddress, setCurrentAddress] = useState(initialAddress);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());

  // Function to refresh staked balance
  const refreshStakedBalance = async (address: string) => {
    if (!address) return;
    
    try {
      setCurrentAddress(address);
      const balance = await getStakedBalanceFormatted(address);
      setStakedBalance(balance);
      setLastRefreshed(Date.now());
      console.log(`Staked balance refreshed for ${address}: ${balance}`);
    } catch (error) {
      console.error('Error refreshing staked balance:', error);
    }
  };

  // Initial load of staked balance when address changes
  useEffect(() => {
    if (currentAddress) {
      refreshStakedBalance(currentAddress);
    }
  }, [currentAddress]);

  return (
    <StakingContext.Provider value={{ stakedBalance, refreshStakedBalance, lastRefreshed }}>
      {children}
    </StakingContext.Provider>
  );
}

export function useStaking() {
  const context = useContext(StakingContext);
  if (context === undefined) {
    throw new Error('useStaking must be used within a StakingProvider');
  }
  return context;
} 