'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { hasEthereum } from '../lib/contracts'

interface Web3ContextType {
  isMetaMaskInstalled: boolean
}

const Web3Context = createContext<Web3ContextType>({
  isMetaMaskInstalled: false
})

export const useWeb3 = () => useContext(Web3Context)

export function Web3Provider({ children }: { children: ReactNode }) {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false)

  useEffect(() => {
    // Check if MetaMask is installed
    const checkMetaMask = () => {
      setIsMetaMaskInstalled(hasEthereum())
    }

    checkMetaMask()
  }, [])

  const value = {
    isMetaMaskInstalled
  }

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  )
} 