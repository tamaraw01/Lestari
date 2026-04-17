/**
 * Smart contract deployment addresses
 * Ini akan di-update setelah deployment
 */

export interface ContractAddresses {
  wasiatModule: string;
  dvoOracle: string;
  zkVerifier: string;
  entryPoint: string;
}

export const CONTRACT_ADDRESSES: Record<number, Partial<ContractAddresses>> = {
  /** Polygon Mainnet (137) */
  137: {
    wasiatModule: process.env.WASIAT_MODULE_ADDRESS || "",
    dvoOracle: process.env.DVO_ORACLE_ADDRESS || "",
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  },

  /** Polygon Amoy Testnet (80002) */
  80002: {
    wasiatModule: process.env.WASIAT_MODULE_ADDRESS || "",
    dvoOracle: process.env.DVO_ORACLE_ADDRESS || "",
    entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  },
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Get contract address untuk chain
 */
export function getContractAddress(chainId: number, contract: keyof ContractAddresses): string {
  const addresses = CONTRACT_ADDRESSES[chainId];
  if (!addresses) {
    throw new Error(`No contract addresses for chain ${chainId}`);
  }

  const address = addresses[contract];
  if (!address || address === ZERO_ADDRESS) {
    throw new Error(`Contract ${contract} not deployed on chain ${chainId}`);
  }

  return address;
}
