/**
 * Blockchain constants
 * Chain IDs, RPC endpoints, kontrak addresses
 */

export const CHAIN_CONFIG = {
  /** Polygon Mainnet */
  POLYGON_MAINNET: {
    chainId: 137 as const,
    name: "Polygon Mainnet",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
  },

  /** Polygon Amoy (Testnet) */
  POLYGON_AMOY: {
    chainId: 80002 as const,
    name: "Polygon Amoy Testnet",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://amoy.polygonscan.com",
  },
} as const;

export const ERC4337_CONFIG = {
  /** EntryPoint v6 address pada Polygon Mainnet */
  ENTRYPOINT_V6_POLYGON: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",

  /** EntryPoint v6 address pada Polygon Amoy */
  ENTRYPOINT_V6_AMOY: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
} as const;

export const CHAINLINK_CONFIG = {
  /** Chainlink Functions Router pada Polygon Mainnet */
  ROUTER_POLYGON: "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C",

  /** DON ID untuk Polygon */
  DON_ID_POLYGON: "fun-polygon-mainnet-1",

  /** Default gas limit untuk Chainlink Functions */
  DEFAULT_GAS_LIMIT: 300_000,
} as const;

export const ERC7579_MODULE_TYPES = {
  VALIDATOR: 1,
  EXECUTOR: 2,
  FALLBACK: 3,
  HOOK: 4,
} as const;

export const SMART_CONTRACT_INTERFACES = {
  /** IERC7579Module interface ID */
  ERC7579_MODULE: "0x00000001",

  /** IERC7579Account interface ID */
  ERC7579_ACCOUNT: "0x00000002",

  /** IZKVerifier interface ID */
  ZK_VERIFIER: "0x00000003",

  /** IDVOOracle interface ID */
  DVO_ORACLE: "0x00000004",
} as const;

/**
 * Get chain config by chain ID
 */
export function getChainConfig(chainId: number) {
  const chains = Object.values(CHAIN_CONFIG);
  return chains.find((c) => c.chainId === chainId);
}

/**
 * Get RPC URL untuk chain
 */
export function getRpcUrl(chainId: number): string {
  const config = getChainConfig(chainId);
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config.rpcUrl;
}

/**
 * Get block explorer URL
 */
export function getBlockExplorerUrl(chainId: number, address: string): string {
  const config = getChainConfig(chainId);
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return `${config.blockExplorer}/address/${address}`;
}
