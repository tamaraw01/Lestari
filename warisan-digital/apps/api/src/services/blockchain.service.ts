import { ethers, BrowserProvider, Contract, Wallet } from "ethers";
import { env } from "../config/env.js";

/**
 * Blockchain Service
 * Handles smart contract interactions dan blockchain queries
 */

export class BlockchainService {
  private provider: ethers.Provider;
  private relayer: Wallet;
  private wasiatModule: Contract;

  constructor() {
    const chainId = env.CHAIN_ID;
    const rpcUrl = env.POLYGON_RPC_URL;

    // Create provider
    this.provider = new ethers.JsonRpcProvider(rpcUrl, chainId);

    // Create relayer signer
    this.relayer = new Wallet(env.RELAYER_PRIVATE_KEY, this.provider);

    // TODO: Initialize contract instances dengan ABI
    // For now: placeholder
    this.wasiatModule = new Contract(
      env.WASIAT_MODULE_ADDRESS,
      [], // ABI should be imported
      this.relayer
    );
  }

  /**
   * Get current network info
   */
  async getNetworkInfo() {
    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();

    return {
      chainId: network.chainId,
      name: network.name,
      blockNumber,
    };
  }

  /**
   * Get balance of account
   */
  async getBalance(address: string): Promise<bigint> {
    return this.provider.getBalance(address);
  }

  /**
   * Get ETH/MATIC price (simplified)
   */
  async getNativePrice(): Promise<number> {
    // TODO: Implement via price oracle
    return 2300; // Placeholder
  }

  /**
   * Deploy wasiat ke blockchain
   * Call buatWasiat function pada WasiatExecutorModule
   */
  async deployWasiat(
    wasiatHash: string,
    ipfsCid: string,
    ahliWarisList: Array<{
      dompetAddr: string;
      nikHash: string;
      persentaseBps: number;
      isLegitimePortie: boolean;
    }>
  ) {
    try {
      // Create bytes32 from IPFS CID
      const ipfsCidBytes = ethers.id(ipfsCid);

      // Call contract
      const tx = await this.wasiatModule.buatWasiat(
        wasiatHash,
        ipfsCidBytes,
        ahliWarisList,
        { gasLimit: 500_000 }
      );

      const receipt = await tx.wait();
      return {
        txHash: tx.hash,
        blockNumber: receipt?.blockNumber,
      };
    } catch (error) {
      throw new Error(
        `Failed to deploy wasiat: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Listen untuk wallets ke smart contract
   */
  listenForWalletConnections(callback: (address: string) => void) {
    // TODO: Implement via WebSocket provider
  }

  /**
   * Verify if address is valid Ethereum address
   */
  isValidAddress(address: string): boolean {
    try {
      ethers.getAddress(address); // Will throw if invalid
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert ether to wei
   */
  etherToWei(ether: string): bigint {
    return ethers.parseEther(ether);
  }

  /**
   * Convert wei to ether
   */
  weiToEther(wei: bigint): string {
    return ethers.formatEther(wei);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string) {
    return this.provider.getTransactionReceipt(txHash);
  }

  /**
   * Wait for transaction confirm
   */
  async waitForTransaction(txHash: string, confirmations = 1) {
    const receipt = await this.provider.waitForTransaction(
      txHash,
      confirmations
    );
    return receipt;
  }
}
