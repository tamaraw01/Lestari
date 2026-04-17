import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import type {
  WasiatExecutorModule,
  MockZKVerifier,
  MockERC20,
} from "../typechain-types";

describe("WasiatExecutorModule", function () {
  // ═══════════════════════════════════════════════════════════════════════
  // FIXTURE SETUP
  // ═══════════════════════════════════════════════════════════════════════

  async function deployFixture() {
    // Get signers
    const [owner, pewaris, ahliWaris1, ahliWaris2, ahliWaris3, oracle] =
      await ethers.getSigners();

    // Deploy mock contracts
    const MockZKVerifier = await ethers.getContractFactory("MockZKVerifier");
    const zkVerifier = (await MockZKVerifier.deploy()) as unknown as MockZKVerifier;

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token1 = (await MockERC20.deploy(ethers.parseUnits("1000000", 18))) as unknown as MockERC20;
    const token2 = (await MockERC20.deploy(ethers.parseUnits("1000000", 18))) as unknown as MockERC20;

    // Deploy WasiatExecutorModule
    const WasiatExecutorModule = await ethers.getContractFactory("WasiatExecutorModule");
    const wasiatModule = (await WasiatExecutorModule.deploy(owner.address)) as unknown as WasiatExecutorModule;

    // Setup module
    await wasiatModule.setZKVerifier(await zkVerifier.getAddress());
    await wasiatModule.setOracle(oracle.address, true);

    // Fund the pewaris account with tokens
    await token1.transfer(pewaris.address, ethers.parseUnits("100000", 18));
    await token2.transfer(pewaris.address, ethers.parseUnits("50000", 18));

    // Approve module to spend tokens
    await token1.connect(pewaris).approve(wasiatModule.address, ethers.MaxUint256);
    await token2.connect(pewaris).approve(wasiatModule.address, ethers.MaxUint256);

    return {
      wasiatModule,
      zkVerifier,
      token1,
      token2,
      owner,
      pewaris,
      ahliWaris1,
      ahliWaris2,
      ahliWaris3,
      oracle,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // onInstall TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe("onInstall", function () {
    it("should install module dan menyimpan jumlah anak sah", async function () {
      const { wasiatModule, pewaris } = await loadFixture(deployFixture);

      const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint8"], [2]);
      await wasiatModule.connect(pewaris).onInstall(data);

      // Verify that jumlahAnakSah is set correctly
      // Note: jumlahAnakSah is public, so we can access it directly
      const storedCount = await wasiatModule.jumlahAnakSah(pewaris.address);
      expect(storedCount).to.equal(2);
    });

    it("should revert jika dipanggil dua kali untuk pewaris yang sama", async function () {
      const { wasiatModule, pewaris } = await loadFixture(deployFixture);

      const data = ethers.AbiCoder.defaultAbiCoder().encode(["uint8"], [1]);
      await wasiatModule.connect(pewaris).onInstall(data);

      // Try to install again
      await expect(
        wasiatModule.connect(pewaris).onInstall(data)
      ).to.be.revertedWith("Already installed for this account");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // buatWasiat TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe("buatWasiat", function () {
    it("should membuat wasiat dengan valid LP untuk 1 anak sah (50%)", async function () {
      const { wasiatModule, pewaris, ahliWaris1, ahliWaris2 } =
        await loadFixture(deployFixture);

      // Install module dengan 1 anak sah
      const installData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8"],
        [1]
      );
      await wasiatModule.connect(pewaris).onInstall(installData);

      // Create wasiat: 1 child (LP) gets 50%, other gets 50%
      const nikHash1 = ethers.id("NIK1");
      const nikHash2 = ethers.id("NIK2");

      const ahliWarisList = [
        {
          dompetAddr: ahliWaris1.address,
          nikHash: nikHash1,
          persentaseBps: 5000, // 50%
          isLegitimePortie: true,
        },
        {
          dompetAddr: ahliWaris2.address,
          nikHash: nikHash2,
          persentaseBps: 5000, // 50%
          isLegitimePortie: false,
        },
      ];

      const wasiatHash = ethers.id("WASIAT_HASH");
      const ipfsCid = ethers.id("IPFS_CID");

      await expect(
        wasiatModule
          .connect(pewaris)
          .buatWasiat(wasiatHash, ipfsCid, ahliWarisList)
      )
        .to.emit(wasiatModule, "WasiatDibuat")
        .withArgs(
          pewaris.address,
          wasiatHash,
          ipfsCid,
          2 // jumlah ahli waris
        );
    });

    it("should revert jika LP dilanggar - 1 anak, LP < 50%", async function () {
      const { wasiatModule, pewaris, ahliWaris1, ahliWaris2 } =
        await loadFixture(deployFixture);

      // Install module dengan 1 anak sah
      const installData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8"],
        [1]
      );
      await wasiatModule.connect(pewaris).onInstall(installData);

      // Try to allocate less than 50% to LP (violates KUHPerdata Pasal 914)
      const nikHash1 = ethers.id("NIK1");
      const nikHash2 = ethers.id("NIK2");

      const ahliWarisList = [
        {
          dompetAddr: ahliWaris1.address,
          nikHash: nikHash1,
          persentaseBps: 3000, // 30% - violates 50% minimum
          isLegitimePortie: true,
        },
        {
          dompetAddr: ahliWaris2.address,
          nikHash: nikHash2,
          persentaseBps: 7000, // 70%
          isLegitimePortie: false,
        },
      ];

      const wasiatHash = ethers.id("WASIAT_HASH");
      const ipfsCid = ethers.id("IPFS_CID");

      await expect(
        wasiatModule
          .connect(pewaris)
          .buatWasiat(wasiatHash, ipfsCid, ahliWarisList)
      ).to.be.revertedWithCustomError(
        wasiatModule,
        "LegitimePortieDilanggar"
      );
    });

    it("should revert jika total BPS bukan 10000", async function () {
      const { wasiatModule, pewaris, ahliWaris1, ahliWaris2 } =
        await loadFixture(deployFixture);

      // Install module
      const installData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8"],
        [1]
      );
      await wasiatModule.connect(pewaris).onInstall(installData);

      const nikHash1 = ethers.id("NIK1");
      const nikHash2 = ethers.id("NIK2");

      const ahliWarisList = [
        {
          dompetAddr: ahliWaris1.address,
          nikHash: nikHash1,
          persentaseBps: 5000, // 50%
          isLegitimePortie: true,
        },
        {
          dompetAddr: ahliWaris2.address,
          nikHash: nikHash2,
          persentaseBps: 4000, // 40% - total is only 90%
          isLegitimePortie: false,
        },
      ];

      const wasiatHash = ethers.id("WASIAT_HASH");
      const ipfsCid = ethers.id("IPFS_CID");

      await expect(
        wasiatModule
          .connect(pewaris)
          .buatWasiat(wasiatHash, ipfsCid, ahliWarisList)
      ).to.be.revertedWithCustomError(
        wasiatModule,
        "LegitimePortieDilanggar"
      );
    });

    it("should validate LP untuk 2 anak sah (minimum 66.67%)", async function () {
      const { wasiatModule, pewaris, ahliWaris1, ahliWaris2, ahliWaris3 } =
        await loadFixture(deployFixture);

      // Install dengan 2 anak sah
      const installData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8"],
        [2]
      );
      await wasiatModule.connect(pewaris).onInstall(installData);

      const nikHash1 = ethers.id("NIK1");
      const nikHash2 = ethers.id("NIK2");
      const nikHash3 = ethers.id("NIK3");

      const ahliWarisList = [
        {
          dompetAddr: ahliWaris1.address,
          nikHash: nikHash1,
          persentaseBps: 3334, // 33.34% LP
          isLegitimePortie: true,
        },
        {
          dompetAddr: ahliWaris2.address,
          nikHash: nikHash2,
          persentaseBps: 3333, // 33.33% LP
          isLegitimePortie: true,
        },
        {
          dompetAddr: ahliWaris3.address,
          nikHash: nikHash3,
          persentaseBps: 3333, // 33.33% free
          isLegitimePortie: false,
        },
      ];

      const wasiatHash = ethers.id("WASIAT_HASH");
      const ipfsCid = ethers.id("IPFS_CID");

      // Should succeed (total LP = 66.67%)
      await expect(
        wasiatModule
          .connect(pewaris)
          .buatWasiat(wasiatHash, ipfsCid, ahliWarisList)
      )
        .to.emit(wasiatModule, "WasiatDibuat");
    });

    it("should validate LP untuk 3+ anak sah (minimum 75%)", async function () {
      const { wasiatModule, pewaris, ahliWaris1, ahliWaris2, ahliWaris3 } =
        await loadFixture(deployFixture);

      // Install dengan 3 anak sah
      const installData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8"],
        [3]
      );
      await wasiatModule.connect(pewaris).onInstall(installData);

      const nikHash1 = ethers.id("NIK1");
      const nikHash2 = ethers.id("NIK2");
      const nikHash3 = ethers.id("NIK3");

      const ahliWarisList = [
        {
          dompetAddr: ahliWaris1.address,
          nikHash: nikHash1,
          persentaseBps: 2500, // 25% LP
          isLegitimePortie: true,
        },
        {
          dompetAddr: ahliWaris2.address,
          nikHash: nikHash2,
          persentaseBps: 2500, // 25% LP
          isLegitimePortie: true,
        },
        {
          dompetAddr: ahliWaris3.address,
          nikHash: nikHash3,
          persentaseBps: 5000, // 50% (25% LP + 25% free)
          isLegitimePortie: true,
        },
      ];

      const wasiatHash = ethers.id("WASIAT_HASH");
      const ipfsCid = ethers.id("IPFS_CID");

      await expect(
        wasiatModule
          .connect(pewaris)
          .buatWasiat(wasiatHash, ipfsCid,  ahliWarisList)
      )
        .to.emit(wasiatModule, "WasiatDibuat");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // QUERY FUNCTIONS TESTS
  // ═══════════════════════════════════════════════════════════════════════

  describe("Query Functions", function () {
    it("should get wasiat data", async function () {
      const { wasiatModule, pewaris, ahliWaris1, ahliWaris2 } =
        await loadFixture(deployFixture);

      // Setup
      const installData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint8"],
        [1]
      );
      await wasiatModule.connect(pewaris).onInstall(installData);

      const nikHash1 = ethers.id("NIK1");
      const nikHash2 = ethers.id("NIK2");

      const ahliWarisList = [
        {
          dompetAddr: ahliWaris1.address,
          nikHash: nikHash1,
          persentaseBps: 5000,
          isLegitimePortie: true,
        },
        {
          dompetAddr: ahliWaris2.address,
          nikHash: nikHash2,
          persentaseBps: 5000,
          isLegitimePortie: false,
        },
      ];

      const wasiatHash = ethers.id("WASIAT_HASH");
      const ipfsCid = ethers.id("IPFS_CID");

      await wasiatModule
        .connect(pewaris)
        .buatWasiat(wasiatHash, ipfsCid, ahliWarisList);

      // Query wasiat
      const wasiat = await wasiatModule.getWasiat(pewaris.address);
      expect(wasiat.wasiatHash).to.equal(wasiatHash);
      expect(wasiat.ipfsCid).to.equal(ipfsCid);
      expect(wasiat.isActive).to.be.true;
      expect(wasiat.executedAt).to.equal(0);
    });
  });
});
