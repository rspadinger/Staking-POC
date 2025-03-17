"use client"

import { useState, useEffect } from "react"
import { StakeCard } from "@/components/staking/stake-card"
import { WithdrawCard } from "@/components/staking/withdraw-card"

export default function StakingPage() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Mock data - in a real app, this would come from your blockchain connection
  const tokenData = {
    symbol: "TokenABC",
    price: 1.25,
    apr: 12.5,
    walletBalance: 100,
    stakedBalance: 50,
    totalStaked: 1250000,
    earlyWithdrawalPenalty: 3,
    stakingDuration: 30,
    timeStaked: 15, // days
  }

  // Ensure we only render client-side components after hydration
  useEffect(() => {
    setMounted(true)

    // Check if wallet is connected
    const checkConnection = async () => {
      if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          setIsWalletConnected(accounts.length > 0)
        } catch (error) {
          console.error("Error checking wallet connection", error)
        }
      }
    }

    checkConnection()

    // Listen for account changes
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setIsWalletConnected(accounts.length > 0)
      })
    }

    return () => {
      if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener("accountsChanged", () => {})
      }
    }
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
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Staking</h1>
          <p className="text-muted-foreground">
            You can stake {tokenData.symbol} and earn rewards. A {tokenData.earlyWithdrawalPenalty}% penalty applies for
            early withdrawals (before {tokenData.stakingDuration} days).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StakeCard
            isWalletConnected={isWalletConnected}
            tokenSymbol={tokenData.symbol}
            apr={tokenData.apr}
            walletBalance={tokenData.walletBalance}
            tokenPrice={tokenData.price}
            totalStaked={tokenData.totalStaked}
          />

          <WithdrawCard
            isWalletConnected={isWalletConnected}
            tokenSymbol={tokenData.symbol}
            stakedBalance={tokenData.stakedBalance}
            tokenPrice={tokenData.price}
            earlyWithdrawalPenalty={tokenData.earlyWithdrawalPenalty}
            stakingDuration={tokenData.stakingDuration}
            timeStaked={tokenData.timeStaked}
          />
        </div>
      </div>
    </div>
  )
}

