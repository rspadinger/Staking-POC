import { PublicClient } from 'viem'
import StakingTokenABI from '../abi/StakingToken.json'

// Contract addresses from environment variables
const STAKING_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_STAKING_TOKEN || '') as `0x${string}`

interface ContractInstance {
  address: `0x${string}`
  abi: typeof StakingTokenABI.abi
  publicClient: PublicClient
}

// Contract instances
let stakingTokenContract: ContractInstance | null = null

// Initialize contracts
export const initializeContracts = (provider: PublicClient) => {
  if (!STAKING_TOKEN_ADDRESS) {
    throw new Error('STAKING_TOKEN_ADDRESS not found in environment variables')
  }

  stakingTokenContract = {
    address: STAKING_TOKEN_ADDRESS,
    abi: StakingTokenABI.abi,
    publicClient: provider
  }

  return {
    stakingTokenContract,
  }
}

// Get token balance for a specific address
export const getTokenBalance = async (address: string): Promise<string> => {
  if (!stakingTokenContract) {
    throw new Error('Contracts not initialized')
  }

  try {
    const balance = await stakingTokenContract.publicClient.readContract({
      address: stakingTokenContract.address,
      abi: stakingTokenContract.abi,
      functionName: 'balanceOf',
      args: [address as `0x${string}`]
    })
    
    // Convert from wei to ether (assuming 18 decimals)
    return (Number(balance) / 1e18).toString()
  } catch (error) {
    console.error('Error getting token balance:', error)
    throw error
  }
} 