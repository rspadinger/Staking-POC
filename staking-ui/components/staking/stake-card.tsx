"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TokenLogo } from "@/components/staking/token-logo"
import { TooltipInfo } from "@/components/ui/tooltip-info"
import { LoadingSpinner } from "@/components/staking/loading-spinner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  getTokenBalance, 
  connectWallet, 
  hasEthereum, 
  approveTokens, 
  stakeTokens,
  getTokenName,
  getTokenSymbol
} from "../../lib/contracts"
import { useToast } from "@/hooks/use-toast"
import { useStaking } from "@/lib/staking-context"

interface StakeCardProps {
  tokenSymbol: string // Used as fallback
  apr: number
  tokenPrice: number
  totalStaked: number
}

// Simple React hook for wallet connection
const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState("0");
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  const connect = async () => {
    try {
      console.log("Manually connecting wallet...");
      const { account } = await connectWallet();
      setAccount(account);
      setIsConnected(true);
      
      // Get initial balance
      const balance = await getTokenBalance(account);
      setBalance(balance);
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
            
            // Get initial balance
            const balance = await getTokenBalance(accounts[0]);
            setBalance(balance);
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
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (hasEthereum()) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          console.log("Account changed to:", accounts[0]);
          setAccount(accounts[0]);
          setIsConnected(true);
          getTokenBalance(accounts[0]).then(setBalance);
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
  }, []);

  return { account, isConnected, isCheckingConnection, balance, connect };
};

export function StakeCard({
  tokenSymbol: fallbackSymbol,
  apr,
  tokenPrice,
  totalStaked,
}: StakeCardProps) {
  const [amount, setAmount] = useState<string>("")
  const [isApproving, setIsApproving] = useState(false)
  const [isStaking, setIsStaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { account, isConnected, isCheckingConnection, balance, connect } = useWallet()
  const { toast } = useToast()
  const { refreshStakedBalance } = useStaking() // Use the staking context
  
  // State for token information
  const [tokenName, setTokenName] = useState<string>("Loading...")
  const [tokenSymbol, setTokenSymbol] = useState<string>(fallbackSymbol)

  // Fetch token information when component mounts
  useEffect(() => {
    const fetchTokenInfo = async () => {
      try {
        const [name, symbol] = await Promise.all([
          getTokenName(),
          getTokenSymbol()
        ]);
        
        setTokenName(name);
        setTokenSymbol(symbol || fallbackSymbol);
      } catch (error) {
        console.error("Error fetching token information:", error);
        // Fall back to prop values if fetching fails
        setTokenSymbol(fallbackSymbol);
      }
    };

    fetchTokenInfo();
  }, [fallbackSymbol]);

  const handleStake = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (Number.parseFloat(amount) > Number.parseFloat(balance)) {
      setError("Insufficient balance")
      return
    }

    setError(null)
    
    try {
      // First approve tokens
      setIsApproving(true)
      toast({
        title: "Approving tokens",
        description: `Approving ${amount} ${tokenSymbol} for staking...`,
      })
      
      const approveTx = await approveTokens(amount)
      toast({
        title: "Approval submitted",
        description: "Please confirm the transaction in your wallet",
      })
      
      await approveTx.wait()
      toast({
        title: "Approval successful",
        description: `Successfully approved ${amount} ${tokenSymbol}`,
      })
      setIsApproving(false)
      
      // Then stake tokens
      setIsStaking(true)
      toast({
        title: "Staking tokens",
        description: `Staking ${amount} ${tokenSymbol}...`,
      })
      
      const stakeTx = await stakeTokens(amount)
      toast({
        title: "Staking submitted",
        description: "Please confirm the transaction in your wallet",
      })
      
      // Wait for the transaction to be confirmed
      await stakeTx.wait()
      
      // Success feedback
      toast({
        title: "Staking successful",
        description: `Successfully staked ${amount} ${tokenSymbol}`,
        variant: "default",
      })
      
      // Update balance after staking
      if (account) {
        try {
          // Refresh the wallet balance
          const newBalance = await getTokenBalance(account);
          console.log("Updated wallet balance after staking:", newBalance);
          
          // Refresh the staked balance using the context
          await refreshStakedBalance(account);
          
        } catch (balanceError) {
          console.error("Error updating balance after staking:", balanceError);
        }
      }
      
      setAmount("")
      setIsStaking(false)
    } catch (error: unknown) {
      console.error("Error staking tokens:", error)
      
      // More specific error messages
      const errorObj = error as { reason?: string; message?: string }
      const errorMessage = errorObj?.reason || errorObj?.message || "Transaction failed. Please try again."
      setError(errorMessage)
      
      toast({
        title: "Transaction failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      setIsApproving(false)
      setIsStaking(false)
    }
  }

  const handleMaxAmount = () => {
    setAmount(balance)
  }

  return (
    <Card className="w-full max-w-md border border-slate-700 bg-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Stake {tokenSymbol}</span>
          <span className="text-sm text-muted-foreground">
            Total staked: {totalStaked.toFixed(2)} {tokenSymbol} (${(totalStaked * tokenPrice).toFixed(2)})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TokenLogo symbol={tokenSymbol} />
            <div className="ml-3">
              <p className="font-medium">{tokenName}</p>
              <p className="text-sm text-muted-foreground">${tokenPrice.toFixed(2)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium flex items-center">
              APR: {apr}%
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <TooltipInfo content="Annual Percentage Rate based on current staking rewards" />
                  </TooltipTrigger>
                  <TooltipContent>Annual Percentage Rate based on current staking rewards</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
            <p className="text-sm text-muted-foreground">
              Wallet Balance: {Number.parseFloat(balance).toFixed(2)} {tokenSymbol}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="stake-amount" className="text-sm font-medium">
              Amount to Stake
            </label>
            <button
              onClick={handleMaxAmount}
              className="text-xs text-primary hover:underline"
              disabled={!isConnected || Number.parseFloat(balance) <= 0}
            >
              MAX
            </button>
          </div>
          <div className="relative">
            <Input
              id="stake-amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                // Clear error when user types
                if (error) setError(null)
              }}
              className="bg-slate-900 border-slate-700"
              disabled={!isConnected || isStaking || isApproving}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium">{tokenSymbol}</div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {amount && (
            <p className="text-sm text-muted-foreground">≈ ${(Number.parseFloat(amount) * tokenPrice).toFixed(2)}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {isCheckingConnection ? (
          <Button 
            className="w-full bg-gray-600 hover:bg-gray-600 text-white cursor-wait" 
            disabled={true}
          >
            <LoadingSpinner /> Checking wallet...
          </Button>
        ) : !isConnected ? (
          <Button
            onClick={connect}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            Connect Wallet
          </Button>
        ) : (
          <>
            <div className="w-full text-center mb-2 text-sm">
              {account && `Connected: ${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
            </div>
            <Button
              onClick={handleStake}
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={!isConnected || Number.parseFloat(balance) <= 0 || isStaking || isApproving || !amount || Number.parseFloat(amount) <= 0}
            >
              {isApproving ? 'Approving...' : isStaking ? <LoadingSpinner /> : "Stake"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

