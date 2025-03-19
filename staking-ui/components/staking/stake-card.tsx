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
  approveTokens, 
  stakeTokens,
  getTokenName,
  getTokenSymbol,
  getMinimumStakeAmount,
  calculateAPR,
} from "../../lib/contracts"
import { useToast } from "@/hooks/use-toast"
import { useStaking } from "@/lib/staking-context"
import { useWallet } from "@/lib/wallet-context"

interface StakeCardProps {
  tokenSymbol: string // Used as fallback
  tokenPrice: number
  totalStaked: number
}

export function StakeCard({
  tokenSymbol: fallbackSymbol,
  tokenPrice,
  totalStaked,
}: StakeCardProps) {
  const [amount, setAmount] = useState<string>("")
  const [isApproving, setIsApproving] = useState(false)
  const [isStaking, setIsStaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { account, isConnected, isCheckingConnection, balance, connect, updateBalance } = useWallet()
  const { toast } = useToast()
  const { refreshStakedBalance, stakedBalance } = useStaking()
  
  // State for token information
  const [tokenName, setTokenName] = useState<string>("Loading...")
  const [tokenSymbol, setTokenSymbol] = useState<string>(fallbackSymbol)
  const [minimumStakeAmount, setMinimumStakeAmount] = useState<string>("0")
  
  // State for real APR
  const [realApr, setRealApr] = useState<number>(0)
  const [isLoadingApr, setIsLoadingApr] = useState<boolean>(false)

  // Fetch token information and minimum stake amount when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [name, symbol, minAmount] = await Promise.all([
          getTokenName(),
          getTokenSymbol(),
          getMinimumStakeAmount()
        ]);
        
        setTokenName(name);
        setTokenSymbol(symbol || fallbackSymbol);
        setMinimumStakeAmount(minAmount);
        console.log("Minimum stake amount:", minAmount);
      } catch (error) {
        console.error("Error fetching token information:", error);
        // Fall back to prop values if fetching fails
        setTokenSymbol(fallbackSymbol);
      }
    };

    fetchData();
  }, [fallbackSymbol]);
  
  // Calculate APR when staked balance or amount changes
  useEffect(() => {
    const updateAPR = async () => {
      if (!account) {
        setRealApr(0);
        return;
      }
      
      setIsLoadingApr(true);
      try {
        // Get user's current staked balance
        const userStakedBalance = stakedBalance.toString();
        
        // Calculate APR based on current stake + new amount
        const calculatedApr = await calculateAPR(userStakedBalance, amount);
        setRealApr(calculatedApr);
        console.log("Calculated APR:", calculatedApr, "for staked:", userStakedBalance, "amount:", amount);
      } catch (error) {
        console.error("Error calculating APR:", error);
        setRealApr(0);
      } finally {
        setIsLoadingApr(false);
      }
    };
    
    updateAPR();
  }, [account, amount, stakedBalance]);

  const handleStake = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (Number.parseFloat(amount) > Number.parseFloat(balance)) {
      setError("Insufficient balance")
      return
    }

    // Check if amount is greater than or equal to minimum stake amount
    if (Number.parseFloat(amount) < Number.parseFloat(minimumStakeAmount)) {
      setError(`Amount must be at least ${minimumStakeAmount} ${tokenSymbol}`)
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
          // Refresh the wallet balance using the updateBalance function
          await updateBalance(account);
          
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
          <div className="flex flex-col">
            <span>Stake {tokenSymbol}</span>
            <span className="text-sm text-muted-foreground">
              Total staked: {totalStaked.toFixed(2)} {tokenSymbol} (${(totalStaked * tokenPrice).toFixed(2)})
            </span>
          </div>
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
            <div className="font-medium flex items-center">
              <span className="mr-1">APR:</span> {isLoadingApr ? (
                <span className="ml-1 flex items-center">
                  <LoadingSpinner /> calculating...
                </span>
              ) : (
                <span>{ realApr.toFixed(2)}%</span>
              )}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <TooltipInfo content="Annual Percentage Rate based on current staking rewards and tier rates" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div>
                      <p>Base APR + tier bonus based on your staked amount</p>
                      <p>Staking more tokens may increase your APR tier!</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Wallet Balance: {Number.parseFloat(balance).toFixed(2)} {tokenSymbol}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="stake-amount" className="text-sm font-medium">
              Amount to Stake
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <TooltipInfo content={`Minimum stake amount: ${minimumStakeAmount} ${tokenSymbol}`} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Minimum stake amount: {minimumStakeAmount} {tokenSymbol}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
              placeholder={`Min: ${minimumStakeAmount}`}
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
            <span className="inline-flex items-center"><LoadingSpinner /><span className="ml-1">Checking wallet...</span></span>
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
              {isApproving ? 'Approving...' : isStaking ? <span className="inline-flex items-center"><LoadingSpinner /><span className="ml-1">Staking...</span></span> : "Stake"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

