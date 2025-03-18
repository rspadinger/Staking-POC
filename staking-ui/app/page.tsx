"use client"

import { useState, useEffect } from "react"
import { StakeCard } from "@/components/staking/stake-card"
import { WithdrawCard } from "@/components/staking/withdraw-card"
import { connectWallet, hasEthereum, getTokenName, getTokenSymbol } from "@/lib/contracts"

export default function StakingPage() {
  const [mounted, setMounted] = useState(false)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [tokenName, setTokenName] = useState<string>("Loading Token")
  const [tokenSymbol, setTokenSymbol] = useState<string>("TOKEN")

  // Mock data - in a real app, this would come from your blockchain connection
  const tokenData = {
    symbol: "TOKEN", // This will be replaced with actual symbol
    price: 1.25,
    apr: 12.5,
    stakedBalance: 50,
    totalStaked: 1250000,
    earlyWithdrawalPenalty: 3,
    stakingDuration: 30,
    timeStaked: 15, // days
  }

  // Fetch token information
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (mounted) {
        try {
          const [name, symbol] = await Promise.all([
            getTokenName(),
            getTokenSymbol()
          ]);
          
          setTokenName(name);
          setTokenSymbol(symbol || tokenData.symbol);
          console.log("Token info loaded:", { name, symbol });
        } catch (error) {
          console.error("Error fetching token information in page:", error);
        }
      }
    };

    fetchTokenInfo();
  }, [mounted]);

  // Check wallet connection status
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (hasEthereum()) {
        try {
          const { account } = await connectWallet();
          setIsWalletConnected(!!account);
        } catch (error) {
          console.error("Failed to check wallet connection:", error);
          setIsWalletConnected(false);
        }
      }
    };

    if (mounted) {
      checkWalletConnection();
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
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Staking</h1>
          <p className="text-muted-foreground">
            You can stake {tokenSymbol} ({tokenName}) and earn rewards. A {tokenData.earlyWithdrawalPenalty}% penalty applies for
            early withdrawals (before {tokenData.stakingDuration} days).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StakeCard
            tokenSymbol={tokenSymbol}
            apr={tokenData.apr}
            tokenPrice={tokenData.price}
            totalStaked={tokenData.totalStaked}
          />

          <WithdrawCard
            isWalletConnected={isWalletConnected}
            tokenSymbol={tokenSymbol}
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

