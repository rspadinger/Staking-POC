"use client"

import { useState, useEffect } from "react"
import { StakeCard } from "@/components/staking/stake-card"
import { WithdrawCard } from "@/components/staking/withdraw-card"
import { 
  connectWallet, 
  hasEthereum, 
  getTokenName, 
  getTokenSymbol, 
  getEarlyWithdrawalPenalty,
  getLockPeriod
} from "@/lib/contracts"
import { StakingProvider } from "@/lib/staking-context"

export default function StakingPage() {
  const [mounted, setMounted] = useState(false)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)
  const [tokenName, setTokenName] = useState<string>("Loading Token")
  const [tokenSymbol, setTokenSymbol] = useState<string>("TOKEN")
  const [account, setAccount] = useState<string>("")
  const [earlyWithdrawalPenalty, setEarlyWithdrawalPenalty] = useState<number>(0)
  const [stakingDuration, setStakingDuration] = useState<number>(0)

  // Mock data - we'll replace earlyWithdrawalPenalty and stakingDuration with real values
  const tokenData = {
    symbol: "TOKEN",
    price: 1.25,
    totalStaked: 1250000,
    timeStaked: 15, // days
  }

  // Fetch token information and contract parameters
  useEffect(() => {
    const fetchContractData = async () => {
      if (mounted) {
        try {
          const [name, symbol, penalty, lockPeriod] = await Promise.all([
            getTokenName(),
            getTokenSymbol(),
            getEarlyWithdrawalPenalty(),
            getLockPeriod()
          ]);
          
          setTokenName(name);
          setTokenSymbol(symbol || tokenData.symbol);
          
          // Set real values from contract
          setEarlyWithdrawalPenalty(penalty / 100); // Convert basis points to percentage
          setStakingDuration(lockPeriod);
          
          console.log("Contract data loaded:", { 
            name, 
            symbol, 
            earlyWithdrawalPenalty: penalty / 100, 
            stakingDuration: lockPeriod 
          });
        } catch (error) {
          console.error("Error fetching contract data:", error);
        }
      }
    };

    fetchContractData();
  }, [mounted]);

  // Check wallet connection status
  useEffect(() => {
    const checkWalletConnection = async () => {
      setIsCheckingConnection(true);
      
      if (hasEthereum()) {
        try {
          console.log("Checking for existing wallet connection...");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const accounts = await (window.ethereum as any).request({ method: 'eth_accounts' });
          
          if (accounts && accounts.length > 0) {
            console.log("Found connected account:", accounts[0]);
            setAccount(accounts[0]);
            setIsWalletConnected(true);
          } else {
            console.log("No connected accounts found");
            setIsWalletConnected(false);
            setAccount("");
            
            // Only try to connect if needed
            try {
              console.log("Attempting to connect to wallet...");
              const { account } = await connectWallet();
              setIsWalletConnected(!!account);
              setAccount(account);
              console.log("Connected to account:", account);
            } catch (connectError) {
              console.log("Initial wallet connection failed:", connectError);
              setIsWalletConnected(false);
            }
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
          setIsWalletConnected(false);
        } finally {
          setIsCheckingConnection(false);
        }
      } else {
        console.log("Ethereum provider not detected");
        setIsCheckingConnection(false);
      }
    };

    if (mounted) {
      checkWalletConnection();
    }
  }, [mounted]);

  // Add listener for account changes
  useEffect(() => {
    if (mounted && hasEthereum()) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          console.log("Account changed to:", accounts[0]);
          setAccount(accounts[0]);
          setIsWalletConnected(true);
        } else {
          console.log("Disconnected from wallet");
          setIsWalletConnected(false);
          setAccount("");
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
  }, [mounted]);

  // Ensure we only render client-side components after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder with the same structure to prevent layout shift
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Staking</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full max-w-md border border-slate-700 bg-slate-800 shadow-lg h-96"></div>
            <div className="w-full max-w-md border border-slate-700 bg-slate-800 shadow-lg h-96"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <StakingProvider initialAddress={account}>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Staking</h1>
            <p className="text-muted-foreground">
              You can stake {tokenSymbol} ({tokenName}) and earn rewards. A {earlyWithdrawalPenalty}% penalty applies for
              early withdrawals (before {stakingDuration} days).
            </p>
            {isCheckingConnection && (
              <p className="text-sm text-muted-foreground mt-2">
                Checking wallet connection...
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StakeCard
              tokenSymbol={tokenSymbol}              
              tokenPrice={tokenData.price}
              totalStaked={tokenData.totalStaked}
            />

            <WithdrawCard
              isWalletConnected={isWalletConnected}
              tokenSymbol={tokenSymbol}
              tokenPrice={tokenData.price}
              earlyWithdrawalPenalty={earlyWithdrawalPenalty}
              stakingDuration={stakingDuration}
              timeStaked={tokenData.timeStaked}
              account={account}
            />
          </div>
        </div>
      </div>
    </StakingProvider>
  )
}

