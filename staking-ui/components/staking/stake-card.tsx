"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TokenLogo } from "@/components/staking/token-logo"
import { TooltipInfo } from "@/components/ui/tooltip-info"
import { LoadingSpinner } from "@/components/staking/loading-spinner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getTokenBalance } from "@/lib/contracts"
import { useAccount } from "wagmi"

interface StakeCardProps {
  isWalletConnected: boolean
  tokenSymbol: string
  apr: number
  tokenPrice: number
  totalStaked: number
}

export function StakeCard({
  isWalletConnected,
  tokenSymbol,
  apr,
  tokenPrice,
  totalStaked,
}: StakeCardProps) {
  const [amount, setAmount] = useState<string>("")
  const [isStaking, setIsStaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<string>("0")
  const { address } = useAccount()

  useEffect(() => {
    const fetchBalance = async () => {
      if (address && isWalletConnected) {
        try {
          const balance = await getTokenBalance(address)
          setWalletBalance(balance)
        } catch (error) {
          console.error('Error fetching balance:', error)
          setError('Failed to fetch wallet balance')
        }
      }
    }

    fetchBalance()
  }, [address, isWalletConnected])

  const handleStake = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("Please enter a valid amount")
      return
    }

    if (Number.parseFloat(amount) > Number.parseFloat(walletBalance)) {
      setError("Insufficient balance")
      return
    }

    setError(null)
    setIsStaking(true)

    // Simulate staking process
    setTimeout(() => {
      setIsStaking(false)
      setAmount("")
      // Here you would update the staked balance
    }, 2000)
  }

  const handleMaxAmount = () => {
    setAmount(walletBalance)
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
              <p className="font-medium">{tokenSymbol}</p>
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
              Wallet Balance: {Number.parseFloat(walletBalance).toFixed(4)} {tokenSymbol}
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
              disabled={!isWalletConnected || Number.parseFloat(walletBalance) <= 0}
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
              onChange={(e) => setAmount(e.target.value)}
              className="bg-slate-900 border-slate-700"
              disabled={!isWalletConnected || isStaking}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium">{tokenSymbol}</div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {amount && (
            <p className="text-sm text-muted-foreground">≈ ${(Number.parseFloat(amount) * tokenPrice).toFixed(2)}</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleStake}
          className="w-full bg-primary hover:bg-primary/90 text-white"
          disabled={!isWalletConnected || Number.parseFloat(walletBalance) <= 0 || isStaking}
        >
          {isStaking ? <LoadingSpinner /> : "Stake"}
        </Button>
      </CardFooter>
    </Card>
  )
}

