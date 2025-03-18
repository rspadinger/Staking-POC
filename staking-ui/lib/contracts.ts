import { ethers } from 'ethers';
import StakingTokenABI from '../abi/StakingToken.json';
import StakingABI from '../abi/Staking.json';

// Define types for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (eventName: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (eventName: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

// Contract addresses from environment variables with fallback values
const STAKING_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_STAKING_TOKEN || '0xdAcA9A0186C17A9B7772771D8C275f19279Ae125';
const STAKING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_STAKING_CONTRACT || '0x841e3B679D022dff4e86Fa7b6A39CA736C2529A9';

// Define contract type for code reuse
type ContractType = 'token' | 'staking';

/**
 * Check if the browser has an Ethereum provider (like MetaMask)
 */
export const hasEthereum = (): boolean => {
  const hasProvider = typeof window !== "undefined" && !!window.ethereum;
  console.log("Checking for Ethereum provider:", hasProvider);
  return hasProvider;
};

/**
 * Get or create a provider based on the environment
 */
export const getProvider = (): ethers.Provider | null => {
  if (!hasEthereum()) {
    console.error('No Ethereum provider detected');
    
    // In development, create a fallback provider
    if (process.env.NODE_ENV === 'development') {
      try {
        console.log('Creating fallback JsonRpcProvider for development');
        return new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo');
      } catch (error) {
        console.error('Failed to create fallback provider:', error);
      }
    }
    
    return null;
  }
  
  try {
    console.log('Creating BrowserProvider...');
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      console.log('BrowserProvider created successfully');
      return provider;
    }
    return null;
  } catch (error) {
    console.error('Error creating provider:', error);
    return null;
  }
};

/**
 * Get signer from the provider
 */
export const getSigner = async (): Promise<ethers.Signer | null> => {
  const provider = getProvider();
  if (!provider) return null;
  
  try {
    if ('getSigner' in provider) {
      return await (provider as ethers.BrowserProvider).getSigner();
    } 
    else if (provider instanceof ethers.JsonRpcProvider) {
      console.log('Creating random wallet with JsonRpcProvider (read-only mode)');
      return new ethers.Wallet(ethers.Wallet.createRandom().privateKey, provider);
    }
    
    console.error('Provider type does not support getting a signer');
    return null;
  } catch (error) {
    console.error('Error getting signer:', error);
    return null;
  }
};

/**
 * Connect wallet and return account and signer
 */
export const connectWallet = async (): Promise<{ account: string, signer: ethers.Signer }> => {
  if (!hasEthereum()) {
    throw new Error('No ethereum provider found');
  }
  
  const provider = getProvider();
  if (!provider) {
    throw new Error('Failed to create provider');
  }

  if ('getSigner' in provider) {
    try {
      console.log('Requesting accounts...');
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log('Accounts received:', accounts);
        const signer = await (provider as ethers.BrowserProvider).getSigner();
        return { account: accounts[0] as string, signer };
      }
      throw new Error('Ethereum provider not found');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }
  else if (provider instanceof ethers.JsonRpcProvider) {
    console.log('Creating random wallet for testing with JsonRpcProvider');
    const wallet = ethers.Wallet.createRandom().connect(provider);
    return { 
      account: wallet.address, 
      signer: wallet 
    };
  }
  
  throw new Error('Unsupported provider type');
};

/**
 * Helper function to get contract address based on type
 */
const getContractAddress = (type: ContractType): string => {
  return type === 'token' ? STAKING_TOKEN_ADDRESS : STAKING_CONTRACT_ADDRESS;
};

/**
 * Helper function to get contract ABI based on type
 */
const getContractABI = (type: ContractType) => {
  return type === 'token' ? StakingTokenABI.abi : StakingABI.abi;
};

/**
 * Get contract instance (read-only)
 */
const getContract = (type: ContractType) => {
  const provider = getProvider();
  const address = getContractAddress(type);
  const contractName = type === 'token' ? 'Token' : 'Staking';

  console.log(`${contractName} Provider:`, provider ? 'Available' : 'Not available');
  console.log(`${contractName} Address:`, address);
  
  if (!provider || !address) {
    console.error(`${contractName} contract not available. Provider:`, !!provider, 'Address:', !!address);
    return null;
  }

  try {
    const contract = new ethers.Contract(
      address,
      getContractABI(type),
      provider
    );
    console.log(`${contractName} contract created successfully`);
    return contract;
  } catch (error) {
    console.error(`Error creating ${contractName} contract:`, error);
    return null;
  }
};

/**
 * Get contract with signer (for write operations)
 */
const getContractWithSigner = async (type: ContractType) => {
  const signer = await getSigner();
  const address = getContractAddress(type);
  
  if (!signer || !address) {
    return null;
  }

  return new ethers.Contract(
    address,
    getContractABI(type),
    signer
  );
};

// Export specialized contract getters that use the common functions
export const getTokenContract = () => getContract('token');
export const getStakingContract = () => getContract('staking');
export const getTokenContractWithSigner = async () => getContractWithSigner('token');
export const getStakingContractWithSigner = async () => getContractWithSigner('staking');

/**
 * Get token name from the contract
 */
export const getTokenName = async (): Promise<string> => {
  const contract = getTokenContract();
  if (!contract) {
    console.error('Token contract not available for getting name');
    return "Unknown Token";
  }

  try {
    const name = await contract.name();
    console.log('Token name:', name);
    return name;
  } catch (error) {
    console.error('Error getting token name:', error);
    return "Unknown Token";
  }
};

/**
 * Get token symbol from the contract
 */
export const getTokenSymbol = async (): Promise<string> => {
  const contract = getTokenContract();
  if (!contract) {
    console.error('Token contract not available for getting symbol');
    return "???";
  }

  try {
    const symbol = await contract.symbol();
    console.log('Token symbol:', symbol);
    return symbol;
  } catch (error) {
    console.error('Error getting token symbol:', error);
    return "???";
  }
};

/**
 * Get token balance for a specific address
 */
export const getTokenBalance = async (address: string): Promise<string> => {
  const contract = getTokenContract();
  if (!contract) {
    throw new Error('Token contract not available');
  }

  try {
    const balance = await contract.balanceOf(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw error;
  }
};

/**
 * Get staked balance for a specific address, returns as a formatted string
 */
export const getStakedBalance = async (address: string): Promise<string> => {
  const contract = getStakingContract();
  if (!contract) {
    throw new Error('Staking contract not available');
  }

  try {
    const userInfo = await contract.userInfo(address);
    return ethers.formatEther(userInfo[0]); // totalStaked is the first element
  } catch (error) {
    console.error('Error getting staked balance:', error);
    throw error;
  }
};

/**
 * Get staked balance as a number for a specific address (for UI display)
 */
export const getStakedBalanceFormatted = async (address: string): Promise<number> => {
  try {
    const stakedBalance = await getStakedBalance(address);
    return parseFloat(stakedBalance);
  } catch (error) {
    console.error('Error getting formatted staked balance:', error);
    return 0;
  }
};

/**
 * Get pending rewards for a specific address
 */
export const getPendingRewards = async (address: string): Promise<string> => {
  const contract = getStakingContract();
  if (!contract) {
    throw new Error('Staking contract not available');
  }

  try {
    const rewards = await contract.pendingRewards(address);
    return ethers.formatEther(rewards);
  } catch (error) {
    console.error('Error getting pending rewards:', error);
    throw error;
  }
};

/**
 * Helper function to handle token operations with error handling
 */
const executeTokenOperation = async <T>(
  operation: string, 
  getContractFn: () => Promise<ethers.Contract | null>,
  actionFn: (contract: ethers.Contract) => Promise<T>
): Promise<T> => {
  const contract = await getContractFn();
  if (!contract) {
    throw new Error(`${operation} - Contract not available`);
  }

  try {
    return await actionFn(contract);
  } catch (error) {
    console.error(`Error ${operation}:`, error);
    throw error;
  }
};

/**
 * Approve token spending
 */
export const approveTokens = async (amount: string): Promise<ethers.TransactionResponse> => {
  return executeTokenOperation(
    'approving tokens',
    getTokenContractWithSigner,
    async (contract) => {
      const amountInWei = ethers.parseEther(amount);
      return await contract.approve(STAKING_CONTRACT_ADDRESS, amountInWei);
    }
  );
};

/**
 * Stake tokens
 */
export const stakeTokens = async (amount: string): Promise<ethers.TransactionResponse> => {
  return executeTokenOperation(
    'staking tokens',
    getStakingContractWithSigner,
    async (contract) => {
      const amountInWei = ethers.parseEther(amount);
      return await contract.stake(amountInWei);
    }
  );
};

/**
 * Withdraw tokens
 */
export const withdrawTokens = async (amount: string): Promise<ethers.TransactionResponse> => {
  return executeTokenOperation(
    'withdrawing tokens',
    getStakingContractWithSigner,
    async (contract) => {
      const amountInWei = ethers.parseEther(amount);
      return await contract.withdraw(amountInWei);
    }
  );
};

/**
 * Withdraw all tokens
 */
export const withdrawAllTokens = async (): Promise<ethers.TransactionResponse> => {
  return executeTokenOperation(
    'withdrawing all tokens',
    getStakingContractWithSigner,
    async (contract) => {
      return await contract.withdrawAll();
    }
  );
}; 