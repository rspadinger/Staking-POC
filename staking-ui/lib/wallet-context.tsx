"use client"

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { connectWallet, hasEthereum, getTokenBalance } from './contracts';

interface WalletContextType {
  account: string | null;
  isConnected: boolean;
  isCheckingConnection: boolean;
  balance: string;
  connect: () => Promise<void>;
  updateBalance: (address: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState("0");
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Function to update balance
  const updateBalance = useCallback(async (address: string) => {
    if (!address) return;
    try {
      const newBalance = await getTokenBalance(address);
      console.log(`Updated wallet balance for ${address}:`, newBalance);
      setBalance(newBalance);
    } catch (error) {
      console.error('Error updating wallet balance:', error);
    }
  }, []);

  const connect = async () => {
    try {
      console.log("Manually connecting wallet...");
      const { account: newAccount } = await connectWallet();
      setAccount(newAccount);
      setIsConnected(true);
      await updateBalance(newAccount);
    } catch (error) {
      console.error("Failed to connect wallet", error);
    }
  };

  // Auto-connect if MetaMask is already connected
  useEffect(() => {
    const autoConnect = async () => {
      setIsCheckingConnection(true);
      if (hasEthereum()) {
        try {
          console.log("Checking for existing wallet connection...");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const accounts = await (window.ethereum as any).request({ method: 'eth_accounts' });
          
          if (accounts && accounts.length > 0) {
            console.log("Found connected account:", accounts[0]);
            setAccount(accounts[0]);
            setIsConnected(true);
            await updateBalance(accounts[0]);
          } else {
            console.log("No connected accounts found");
            setIsConnected(false);
            setAccount(null);
          }
        } catch (error) {
          console.error("Error auto-connecting wallet:", error);
        } finally {
          setIsCheckingConnection(false);
        }
      } else {
        console.log("Ethereum provider not detected");
        setIsCheckingConnection(false);
      }
    };

    autoConnect();
  }, [updateBalance]);

  // Listen for account changes
  useEffect(() => {
    if (hasEthereum()) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          console.log("Account changed to:", accounts[0]);
          setAccount(accounts[0]);
          setIsConnected(true);
          updateBalance(accounts[0]);
        } else {
          console.log("Disconnected from wallet");
          setIsConnected(false);
          setAccount(null);
          setBalance("0");
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.ethereum as any).on('accountsChanged', handleAccountsChanged);

      return () => {
        if (hasEthereum()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [updateBalance]);

  return (
    <WalletContext.Provider value={{
      account,
      isConnected,
      isCheckingConnection,
      balance,
      connect,
      updateBalance
    }}>
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