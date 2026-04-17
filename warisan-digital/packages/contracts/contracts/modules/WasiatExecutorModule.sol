// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC7579Module} from "../interfaces/IERC7579.sol";
import {IERC7579Account} from "../interfaces/IERC7579.sol";
import {IZKVerifier} from "../interfaces/IZKVerifier.sol";
import {LegitimePortieLib} from "./LegitimePortieLib.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title WasiatExecutorModule
 * @notice ERC-7579 Executor Module untuk eksekusi wasiat (will) secara otonom
 * @dev Diimplementasikan sesuai KUHPerdata Pasal 913-915 (Legitieme Portie)
 * dan UU ITE Pasal 11 (TTE Tersertifikasi)
 */
contract WasiatExecutorModule is
    IERC7579Module,
    ReentrancyGuard,
    Ownable,
    Pausable
{
    using SafeERC20 for IERC20;
    using LegitimePortieLib for *;

    /**
     * @notice Data struktur untuk Ahli Waris (Heir)
     */
    struct AhliWaris {
        address dompetAddr;             // Alamat wallet ahli waris
        bytes32 nikHash;                // Hash NIK (tidak menyimpan plaintext)
        uint16 persentaseBps;           // Persentase alokasi (basis points)
        bool isLegitimePortie;          // Apakah termasuk bagian mutlak hukum
    }

    /**
     * @notice Data struktur untuk Wasiat
     */
    struct Wasiat {
        bytes32 wasiatHash;             // Hash dari wasiat data
        bytes32 ipfsCid;                // IPFS CID (dienkripsi)
        uint64 createdAt;               // Timestamp pembuatan
        uint64 executedAt;              // Timestamp eksekusi (0 = belum dieksekusi)
        bool isActive;                  // Status aktif
        AhliWaris[] ahliWarisList;      // Daftar ahli waris
    }

    /**
     * @notice Data struktur untuk Death Proof
     */
    struct DeathProof {
        bytes32 requestId;              // Chainlink request ID
        bytes zkProof;                  // ZK proof untuk death verification
        bytes32 publicInputHash;        // Hash public inputs
        uint64 tanggalMeninggal;        // Unix timestamp tanggal meninggal
        bool isValidated;               // Apakah sudah di-validate
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Mapping pewaris → Wasiat data
    mapping(address => Wasiat) public wasiatData;

    /// @notice Mapping pewaris → Death proof data
    mapping(address => DeathProof) public deathProofData;

    /// @notice Mapping pewaris → ahli waris confirmation status
    mapping(address => bool) public ahliWarisKonfirmasi;

    /// @notice Mapping pewaris → jumlah anak sah (untuk perhitungan LP)
    mapping(address => uint8) public jumlahAnakSah;

    /// @notice Mapping oracle address → is registered
    mapping(address => bool) public oracleTerdaftar;

    /// @notice ZK verifier contract address
    IZKVerifier public zkVerifier;

    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    event WasiatDibuat(
        address indexed pewaris,
        bytes32 indexed wasiatHash,
        bytes32 ipfsCid,
        uint256 jumlahAhliWaris
    );

    event WasiatDicabut(address indexed pewaris, bytes32 wasiatHash);

    event DeathProofDiterima(
        address indexed pewaris,
        bytes32 indexed requestId,
        uint64 tanggalMeninggal
    );

    event WasiatDieksekusi(
        address indexed pewaris,
        bytes32 indexed wasiatHash,
        uint256 totalToken
    );

    event TransferAhliWaris(
        address indexed pewaris,
        address indexed ahliWaris,
        address token,
        uint256 jumlah,
        bool isLP
    );

    event AhliWarisKonfirmasiDiterima(
        address indexed pewaris,
        address indexed ahliWaris
    );

    event OracleDidaftarkan(address indexed oracle, bool aktif);

    event ZKVerifierDiupdate(address indexed newVerifier);

    // ═══════════════════════════════════════════════════════════════════════
    // CUSTOM ERRORS
    // ═══════════════════════════════════════════════════════════════════════

    error WasiatTidakAktif(address pewaris);
    error WasiatSudahDieksekusi(address pewaris);
    error WasiatTidakDitemukan(address pewaris);
    error DeathProofTidakValid(bytes32 requestId);
    error ZKProofGagal(bytes32 publicInputHash);
    error LegitimePortieDilanggar(uint256 totalLPBps, uint256 minLPBps);
    error BukanOracleTerdaftar(address pengirim);
    error AhliWarisTidakTerdaftar(address ahliWaris);
    error KondisiBelumTerpenuhi(bool deathProof, bool ahliWarisKlaim);
    error InvalidIPFSCid(bytes32 cid);
    error InvalidJumlahAhliWaris();

    // ═══════════════════════════════════════════════════════════════════════
    // IERC7579Module IMPLEMENTATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Install modul ke smart account
     * @dev Data format: abi.encode(uint8 jumlahAnakSah)
     */
    function onInstall(bytes calldata data) external override {
        require(data.length == 32, "Invalid install data");

        (uint8 jumlahAnak) = abi.decode(data, (uint8));
        require(jumlahAnak <= 255, "Invalid jumlah anak sah");

        address pewaris = msg.sender;
        require(jumlahAnakSah[pewaris] == 0, "Already installed for this account");

        jumlahAnakSah[pewaris] = jumlahAnak;
    }

    /**
     * @notice Uninstall modul dari smart account
     * @dev Hanya bisa di-uninstall jika wasiat belum dieksekusi
     */
    function onUninstall(bytes calldata) external override {
        address pewaris = msg.sender;

        Wasiat storage w = wasiatData[pewaris];
        require(!w.isActive || w.executedAt == 0, "Cannot uninstall after execution");

        delete wasiatData[pewaris];
        delete deathProofData[pewaris];
        delete ahliWarisKonfirmasi[pewaris];
        delete jumlahAnakSah[pewaris];
    }

    /**
     * @notice Cek apakah modul mendukung tipe modul tertentu
     * @dev Modul ini adalah Executor (type 2)
     */
    function isModuleType(uint256 moduleTypeId) external pure override returns (bool) {
        return moduleTypeId == 2; // Executor module
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WASIAT MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Buat wasiat baru
     * @dev Harus memenuhi compliance Legitieme Portie sesuai KUHPerdata
     */
    function buatWasiat(
        bytes32 wasiatHash,
        bytes32 ipfsCid,
        AhliWaris[] calldata ahliWarisList
    ) external whenNotPaused {
        address pewaris = msg.sender;
        require(wasiatHash != bytes32(0), "Valid wasiatHash required");
        require(ipfsCid != bytes32(0), "Valid ipfsCid required");
        require(ahliWarisList.length > 0, "Minimal ada 1 ahli waris");
        require(ahliWarisList.length <= 50, "Maximum 50 ahli waris");

        uint8 numAnak = jumlahAnakSah[pewaris];
        require(numAnak > 0, "Module not installed");

        // Validasi Legitieme Portie compliance
        uint16[] memory bpsList = new uint16[](ahliWarisList.length);
        bool[] memory lpFlags = new bool[](ahliWarisList.length);

        for (uint256 i = 0; i < ahliWarisList.length; i++) {
            bpsList[i] = ahliWarisList[i].persentaseBps;
            lpFlags[i] = ahliWarisList[i].isLegitimePortie;
        }

        (bool valid, uint256 totalBps) = LegitimePortieLib.validasiPembagian(
            bpsList,
            lpFlags,
            numAnak
        );

        if (!valid) {
            uint256 minLP = LegitimePortieLib.hitungLPBasisPoints(numAnak);
            revert LegitimePortieDilanggar(0, minLP);
        }

        // Simpan wasiat
        Wasiat storage w = wasiatData[pewaris];
        w.wasiatHash = wasiatHash;
        w.ipfsCid = ipfsCid;
        w.createdAt = uint64(block.timestamp);
        w.isActive = true;

        // Clear dan reset ahli waris list
        delete w.ahliWarisList;
        for (uint256 i = 0; i < ahliWarisList.length; i++) {
            w.ahliWarisList.push(ahliWarisList[i]);
        }

        emit WasiatDibuat(pewaris, wasiatHash, ipfsCid, ahliWarisList.length);
    }

    /**
     * @notice Cabut wasiat yang masih draft
     * @dev Hanya bisa dicabut jika belum dieksekusi
     */
    function cabutWasiat() external {
        address pewaris = msg.sender;
        Wasiat storage w = wasiatData[pewaris];

        require(w.isActive, "Wasiat not active");
        require(w.executedAt == 0, "Cannot revoke executed wasiat");

        bytes32 wasiatHash = w.wasiatHash;
        w.isActive = false;

        delete wasiatData[pewaris];
        delete deathProofData[pewaris];
        delete ahliWarisKonfirmasi[pewaris];

        emit WasiatDicabut(pewaris, wasiatHash);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DEATH VERIFICATION & CONFIRMATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Terima proof kematian dari oracle
     * @dev Hanya dipanggil oleh oracle yang terdaftar
     */
    function terimaDeathProof(
        address pewaris,
        DeathProof calldata proof
    ) external {
        require(oracleTerdaftar[msg.sender], "Caller bukan registered oracle");
        require(proof.requestId != bytes32(0), "Valid requestId required");
        require(proof.tanggalMeninggal > 0, "Valid death date required");

        Wasiat storage w = wasiatData[pewaris];
        require(w.isActive, "Wasiat not active");
        require(w.executedAt == 0, "Wasiat already executed");

        // Verifikasi ZK proof
        if (proof.zkProof.length > 0 && address(zkVerifier) != address(0)) {
            bool validProof = zkVerifier.verifyExecutionProof(
                proof.zkProof,
                w.wasiatHash,
                proof.publicInputHash
            );
            require(validProof, "ZK proof verification failed");
        }

        // Simpan death proof
        deathProofData[pewaris] = DeathProof({
            requestId: proof.requestId,
            zkProof: proof.zkProof,
            publicInputHash: proof.publicInputHash,
            tanggalMeninggal: proof.tanggalMeninggal,
            isValidated: true
        });

        emit DeathProofDiterima(pewaris, proof.requestId, proof.tanggalMeninggal);
    }

    /**
     * @notice Konfirmasi kleim dari ahli waris
     * @dev Ahli waris mengkonfirmasi bahwa mereka siap menerima bagian warisan
     */
    function konfirmasiKlaimAhliWaris(address pewaris) external {
        Wasiat storage w = wasiatData[pewaris];
        require(w.isActive, "Wasiat not active");

        // Cek apakah caller adalah ahli waris
        bool isAhliWaris = false;
        for (uint256 i = 0; i < w.ahliWarisList.length; i++) {
            if (w.ahliWarisList[i].dompetAddr == msg.sender) {
                isAhliWaris = true;
                break;
            }
        }

        require(isAhliWaris, "Caller not registered heir");

        ahliWarisKonfirmasi[pewaris] = true;

        emit AhliWarisKonfirmasiDiterima(pewaris, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // WASIAT EXECUTION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Eksekusi wasiat - transfer aset sesuai alokasi ke ahli waris
     * @dev Requires: (1) Death proof validated, (2) Ahli waris confirmed, (3) Valid ZK proof
     */
    function eksekusiWasiat(
        address pewaris,
        address[] calldata tokens,
        bytes calldata zkProofFinal
    ) external nonReentrant whenNotPaused {
        Wasiat storage w = wasiatData[pewaris];

        // Cek preconditions
        require(w.isActive, "Wasiat not active");
        require(w.executedAt == 0, "Wasiat sudah dieksekusi");

        DeathProof storage dp = deathProofData[pewaris];
        require(dp.isValidated, "Death proof not validated");
        require(ahliWarisKonfirmasi[pewaris], "Ahli waris not confirmed");

        // Verifikasi ZK proof untuk eksekusi
        if (zkProofFinal.length > 0 && address(zkVerifier) != address(0)) {
            bool validProof = zkVerifier.verifyExecutionProof(
                zkProofFinal,
                w.wasiatHash,
                dp.publicInputHash
            );
            require(validProof, "Execution ZK proof verification failed");
        }

        // CHECKS-EFFECTS-INTERACTIONS pattern
        // 1. UPDATE STATE (Effects)
        w.executedAt = uint64(block.timestamp);
        w.isActive = false;

        // 2. TRANSFER (Interactions)
        uint256 tokenCount = tokens.length;
        require(tokenCount > 0, "Minimum 1 token");

        for (uint256 t = 0; t < tokenCount; t++) {
            address token = tokens[t];
            uint256 saldo = IERC20(token).balanceOf(pewaris);

            if (saldo > 0) {
                // Distribusi sesuai alokasi ahli waris
                for (uint256 i = 0; i < w.ahliWarisList.length; i++) {
                    AhliWaris storage aw = w.ahliWarisList[i];

                    uint256 jumlah = (saldo * uint256(aw.persentaseBps)) /
                        uint256(LegitimePortieLib.BASIS_POINTS);

                    if (jumlah > 0) {
                        // Transfer dengan SafeERC20
                        IERC20(token).safeTransferFrom(
                            pewaris,
                            aw.dompetAddr,
                            jumlah
                        );

                        emit TransferAhliWaris(
                            pewaris,
                            aw.dompetAddr,
                            token,
                            jumlah,
                            aw.isLegitimePortie
                        );
                    }
                }
            }
        }

        emit WasiatDieksekusi(pewaris, w.wasiatHash, tokenCount);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // QUERY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Cek kondisi eksekusi wasiat
     */
    function cekKondisiEksekusi(address pewaris)
        external
        view
        returns (bool deathProofReady, bool ahliWarisReady)
    {
        DeathProof storage dp = deathProofData[pewaris];
        deathProofReady = dp.isValidated;
        ahliWarisReady = ahliWarisKonfirmasi[pewaris];
    }

    /**
     * @notice Get wasiat data untuk pewaris
     */
    function getWasiat(address pewaris)
        external
        view
        returns (Wasiat memory)
    {
        return wasiatData[pewaris];
    }

    /**
     * @notice Get death proof untuk pewaris
     */
    function getDeathProof(address pewaris)
        external
        view
        returns (DeathProof memory)
    {
        return deathProofData[pewaris];
    }

    /**
     * @notice Get jumlah ahli waris
     */
    function getAhliWarisCount(address pewaris) external view returns (uint256) {
        return wasiatData[pewaris].ahliWarisList.length;
    }

    /**
     * @notice Get detail ahli waris by index
     */
    function getAhliWaris(address pewaris, uint256 index)
        external
        view
        returns (AhliWaris memory)
    {
        require(index < wasiatData[pewaris].ahliWarisList.length, "Index out of range");
        return wasiatData[pewaris].ahliWarisList[index];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Daftarkan atau batalkan pendaftaran oracle
     */
    function setOracle(address oracle, bool aktif) external onlyOwner {
        require(oracle != address(0), "Invalid oracle address");
        oracleTerdaftar[oracle] = aktif;
        emit OracleDidaftarkan(oracle, aktif);
    }

    /**
     * @notice Set ZK verifier address
     */
    function setZKVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "Invalid verifier address");
        zkVerifier = IZKVerifier(verifier);
        emit ZKVerifierDiupdate(verifier);
    }

    /**
     * @notice Pause/Unpause eksekusi wasiat
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
