import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { initializeContracts } from './contracts'

// Create a public client
export const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
})

// Initialize contracts with the public client
export const contracts = initializeContracts(publicClient) 