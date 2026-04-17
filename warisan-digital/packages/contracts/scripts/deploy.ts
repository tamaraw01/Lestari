import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying Warisan Digital Contracts...");

  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying contracts with account: ${deployer.address}`);

  const network = await ethers.provider.getNetwork();
  console.log(`🌐 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // ═══════════════════════════════════════════════════════════════════════
  // DEPLOY MOCK CONTRACTS (untuk testing)
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n📦 Deploying mock contracts...");

  const MockZKVerifier = await ethers.getContractFactory("MockZKVerifier");
  const zkVerifier = await MockZKVerifier.deploy();
  await zkVerifier.waitForDeployment();
  const zkVerifierAddr = await zkVerifier.getAddress();
  console.log(`✅ MockZKVerifier deployed to: ${zkVerifierAddr}`);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy(ethers.parseUnits("1000000", 18));
  await mockToken.waitForDeployment();
  const mockTokenAddr = await mockToken.getAddress();
  console.log(`✅ MockERC20 deployed to: ${mockTokenAddr}`);

  // ═══════════════════════════════════════════════════════════════════════
  // DEPLOY MAIN CONTRACTS
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n📦 Deploying main contracts...");

  // Deploy WasiatExecutorModule
  const WasiatExecutorModule = await ethers.getContractFactory(
    "WasiatExecutorModule"
  );
  const wasiatModule = await WasiatExecutorModule.deploy(deployer.address);
  await wasiatModule.waitForDeployment();
  const wasiatModuleAddr = await wasiatModule.getAddress();
  console.log(`✅ WasiatExecutorModule deployed to: ${wasiatModuleAddr}`);

  // Setup WasiatExecutorModule
  let tx = await wasiatModule.setZKVerifier(zkVerifierAddr);
  await tx.wait();
  console.log(`✅ ZKVerifier set on WasiatExecutorModule`);

  tx = await wasiatModule.setOracle(deployer.address, true);
  await tx.wait();
  console.log(`✅ Oracle registered on WasiatExecutorModule`);

  // Deploy PasskeyValidatorModule
  const PasskeyValidatorModule = await ethers.getContractFactory(
    "PasskeyValidatorModule"
  );
  const passkeyModule = await PasskeyValidatorModule.deploy();
  await passkeyModule.waitForDeployment();
  const passkeyModuleAddr = await passkeyModule.getAddress();
  console.log(`✅ PasskeyValidatorModule deployed to: ${passkeyModuleAddr}`);

  // Deploy DeathVerificationOracle (requires Chainlink router)
  let dvoAddr = "0x0";
  const chainlinkRouter =
    network.chainId === 137
      ? "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C" // Polygon mainnet
      : "0x6E2dc0F9DB014aE19888F539E59285D2Ea04244C"; // Polygon Amoy testnet (same for now)

  const donId = ethers.encodeBytes32String("fun-polygon-mainnet-1");
  const subscriptionId = BigInt(process.env.CHAINLINK_SUBSCRIPTION_ID || "1");

  try {
    const DeathVerificationOracle = await ethers.getContractFactory(
      "DeathVerificationOracle"
    );
    const dvo = await DeathVerificationOracle.deploy(
      chainlinkRouter,
      donId,
      subscriptionId,
      wasiatModuleAddr
    );
    await dvo.waitForDeployment();
    dvoAddr = await dvo.getAddress();
    console.log(`✅ DeathVerificationOracle deployed to: ${dvoAddr}`);
  } catch (error) {
    console.warn(`⚠️  DeathVerificationOracle deployment failed: ${error}`);
    console.warn("   This is expected if Chainlink contracts are not available");
  }

  // ═══════════════════════════════════════════════════════════════════════
  // DEPLOYMENT SUMMARY
  // ═══════════════════════════════════════════════════════════════════════

  const deploymentData = {
    network: network.name,
    chainId: network.chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      WasiatExecutorModule: wasiatModuleAddr,
      PasskeyValidatorModule: passkeyModuleAddr,
      DeathVerificationOracle: dvoAddr,
      MockZKVerifier: zkVerifierAddr,
      MockERC20: mockTokenAddr,
    },
  };

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(JSON.stringify(deploymentData, null, 2));

  // Save deployment addresses
  const outputPath = path.join(__dirname, "..", "deployments.json");
  writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n✅ Deployment data saved to: ${outputPath}`);

  // ═══════════════════════════════════════════════════════════════════════
  // ENVIRONMENT VARIABLES
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n📝 Add these to your .env file:");
  console.log(
    `WASIAT_MODULE_ADDRESS=${wasiatModuleAddr}`
  );
  console.log(`DVO_ORACLE_ADDRESS=${dvoAddr}`);
  console.log(`PASSKEY_MODULE_ADDRESS=${passkeyModuleAddr}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
