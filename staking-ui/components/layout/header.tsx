"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

export function Header() {
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [mounted, setMounted] = useState(false)

  // Ensure we only render client-side components after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const connectWallet = async () => {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        setWalletAddress(accounts[0])
        setIsConnected(true)
      } catch (error) {
        console.error("Error connecting to MetaMask", error)
      }
    } else {
      alert("Please install MetaMask to use this feature")
    }
  }

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  if (!mounted) {
    // Return a placeholder with the same structure to prevent layout shift
    return (
      <header className="bg-secondary py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-2">
            <span className="text-secondary font-bold">S</span>
          </div>
          <nav className="hidden md:flex ml-10 space-x-8">
            <span className="text-white">Dashboard</span>
            <span className="text-white border-b-2 border-primary">Stake</span>
            <span className="text-white">Rewards</span>
            <span className="text-white">Governance</span>
          </nav>
        </div>
        <Button className="bg-primary text-white">
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      </header>
    )
  }

  return (
    <header className="bg-secondary py-4 px-6 flex justify-between items-center">
      <div className="flex items-center">
        <Link href="/" className="text-white font-bold text-xl">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-2">
            <span className="text-secondary font-bold">S</span>
          </div>
        </Link>
        <nav className="hidden md:flex ml-10 space-x-8">
          <Link href="/" className="text-white hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/stake" className="text-white hover:text-primary transition-colors border-b-2 border-primary">
            Stake
          </Link>
          <Link href="/rewards" className="text-white hover:text-primary transition-colors">
            Rewards
          </Link>
          <Link href="/governance" className="text-white hover:text-primary transition-colors">
            Governance
          </Link>
        </nav>
      </div>

      <Button
        onClick={connectWallet}
        variant={isConnected ? undefined : "default"}
        className={isConnected ? "bg-green-600 hover:bg-green-700 text-white" : ""}
      >
        <Wallet className="mr-2 h-4 w-4" />
        {isConnected ? formatAddress(walletAddress) : "Connect Wallet"}
      </Button>
    </header>
  )
}

