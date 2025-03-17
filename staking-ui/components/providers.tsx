'use client'

import { WagmiProvider, createConfig } from 'wagmi'
import { mainnet } from '@wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, createPublicClient } from 'viem'
import { initializeContracts } from '@/lib/contracts'

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
})

const queryClient = new QueryClient()

// Create a public client
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
})

// Initialize contracts with the public client
initializeContracts(publicClient)

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
} 