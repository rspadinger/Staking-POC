"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TokenLogo } from "@/components/staking/token-logo"
import { LoadingSpinner } from "@/components/staking/loading-spinner"
import { AlertCircle, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getTokenName, getTokenSymbol, withdrawTokens } from "@/lib/contracts"
import { useStaking } from "@/lib/staking-context"
import { useToast } from "@/hooks/use-toast"

interface WithdrawCardProps {
  isWalletConnected: boolean
  tokenSymbol: string // Used as fallback
  stakedBalance: number // This is now used as a fallback value
  tokenPrice: number
  earlyWithdrawalPenalty: number
  stakingDuration: number
  timeStaked: number
  account?: string // Optional connected account
}

export function WithdrawCard({
  isWalletConnected,
  tokenSymbol: fallbackSymbol,
  stakedBalance: fallbackStakedBalance,
  tokenPrice,
  earlyWithdrawalPenalty,
  stakingDuration,
  timeStaked,
  account,
}: WithdrawCardProps) {
  const [amount, setAmount] = useState<string>("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Use the staking context for real-time staked balance
  const { stakedBalance: contextStakedBalance, refreshStakedBalance } = useStaking()
  
  // State for token information
  const [tokenName, setTokenName] = useState<string>("Loading...")
  const [tokenSymbol, setTokenSymbol] = useState<string>(fallbackSymbol)
  
  // Use either the context staked balance (real-time) or the fallback value
  const stakedBalance = contextStakedBalance || fallbackStakedBalance

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
  
  // Refresh staked balance when the component mounts or account changes
  useEffect(() => {
    if (isWalletConnected && account) {
      refreshStakedBalance(account);
    }
  }, [isWalletConnected, account, refreshStakedBalance]);

  const isEarlyWithdrawal = timeStaked < stakingDuration
  const penaltyAmount = isEarlyWithdrawal && amount ? Number.parseFloat(amount) * (earlyWithdrawalPenalty / 100) : 0
  const withdrawalAmount = amount ? Number.parseFloat(amount) - penaltyAmount : 0

  const handleWithdraw = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (Number.parseFloat(amount) > stakedBalance) {
      setError("Insufficient staked balance")
      return
    }

    setError(null)
    setIsWithdrawing(true)

    try {
      toast({
        title: "Withdrawing tokens",
        description: `Withdrawing ${amount} ${tokenSymbol}...`,
      });
      
      const withdrawTx = await withdrawTokens(amount);
      
      toast({
        title: "Withdrawal submitted",
        description: "Please confirm the transaction in your wallet",
      });
      
      await withdrawTx.wait();
      
      toast({
        title: "Withdrawal successful",
        description: `Successfully withdrew ${amount} ${tokenSymbol}`,
        variant: "default",
      });

      // Refresh staked balance after withdrawal
      if (account) {
        await refreshStakedBalance(account);
      }
      
      setAmount("");
      setIsWithdrawing(false);
    } catch (error: unknown) {
      console.error("Error withdrawing tokens:", error);
      
      // More specific error messages
      const errorObj = error as { reason?: string; message?: string };
      const errorMessage = errorObj?.reason || errorObj?.message || "Transaction failed. Please try again.";
      setError(errorMessage);
      
      toast({
        title: "Transaction failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      setIsWithdrawing(false);
    }
  }

  const handleMaxAmount = () => {
    setAmount(stakedBalance.toString())
  }

  return (
    <Card className="w-full max-w-md border border-slate-700 bg-slate-800 shadow-lg">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-xl">Staked {tokenSymbol}</CardTitle>
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
            <p className="text-2xl font-bold">{stakedBalance.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">≈ ${(stakedBalance * tokenPrice).toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm">Time staked</p>
            <p className="font-medium">{timeStaked} days</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm flex items-center">
              Staking duration
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Staking for at least {stakingDuration} days avoids the early withdrawal penalty</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
            <p className="font-medium">{stakingDuration} days</p>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-between items-center">
              <label htmlFor="withdraw-amount" className="text-sm font-medium">
                Amount to Withdraw
              </label>
              <button
                onClick={handleMaxAmount}
                className="text-xs text-[#3CC0DD] hover:underline"
                disabled={!isWalletConnected || stakedBalance <= 0}
              >
                MAX
              </button>
            </div>
            <div className="relative">
              <Input
                id="withdraw-amount"
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                className="bg-slate-900 border-slate-700"
                disabled={!isWalletConnected || isWithdrawing || stakedBalance <= 0}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium">{tokenSymbol}</div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {amount && (
              <p className="text-sm text-muted-foreground">≈ ${(Number.parseFloat(amount) * tokenPrice).toFixed(2)}</p>
            )}
          </div>

          {isEarlyWithdrawal && amount && Number.parseFloat(amount) > 0 && (
            <div className="bg-red-900/20 border border-red-900 rounded-md p-3 mt-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-500">Early withdrawal penalty</p>
                  <p className="text-xs text-muted-foreground">
                    Withdrawing before {stakingDuration} days will incur a {earlyWithdrawalPenalty}% penalty. You will
                    receive {withdrawalAmount.toFixed(2)} {tokenSymbol} instead of{" "}
                    {Number.parseFloat(amount).toFixed(2)} {tokenSymbol}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {isWalletConnected && account && (
          <div className="w-full text-center mb-2 text-sm">
            Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
          </div>
        )}
        <Button
          onClick={handleWithdraw}
          className="w-full bg-[#203152] hover:bg-[#203152]/90 text-white"
          disabled={
            !isWalletConnected || stakedBalance <= 0 || isWithdrawing || !amount || Number.parseFloat(amount) <= 0
          }
        >
          {isWithdrawing ? <LoadingSpinner /> : "Withdraw"}
        </Button>
      </CardFooter>
    </Card>
  )
}

