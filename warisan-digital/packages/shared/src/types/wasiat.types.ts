/**
 * Wasiat (Will) related types
 * Tipe data untuk wasiat digital dan manajementnya
 */

/** Status dari wasiat dalam sistem */
export enum WasiatStatus {
  DRAFT = "DRAFT",           // Drafing, belum di-deploy ke blockchain
  ACTIVE = "ACTIVE",         // Aktif dan telah di-deploy
  REVOKED = "REVOKED",       // Dibatalkan oleh pewaris
  EXECUTED = "EXECUTED",     // Sudah dieksekusi (pewaris meninggal)
  DISPUTED = "DISPUTED",     // Dalam sengketa hukum
}

/** Status TTE (Tanda Tangan Elektronik) Tersertifikasi */
export enum TteStatus {
  PENDING = "PENDING",       // Menunggu penandatanganan
  SIGNED = "SIGNED",         // Sudah ditandatangani
  EXPIRED = "EXPIRED",       // Sudah expired
  INVALID = "INVALID",       // Tanda tangan tidak valid
}

/** Status verifikasi kematian dari DVO (Death Verification Oracle) */
export enum DvoStatus {
  PENDING = "PENDING",       // Menunggu verifikasi
  FULFILLED = "FULFILLED",   // Data diterima dari oracle
  VALID = "VALID",           // Tervalidasi kematian
  INVALID = "INVALID",       // Data kematian tidak valid
  ERROR = "ERROR",           // Error dalam proses verifikasi
  EXPIRED = "EXPIRED",       // Request expired
}

/** KYC Status */
export enum KycStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
}

/** Hubungan keluarga untuk ahli waris */
export enum HubunganKeluarga {
  ANAK_SAH = "ANAK_SAH",
  ANAK_TIDAK_SAH = "ANAK_TIDAK_SAH",
  ISTRI = "ISTRI",
  SUAMI = "SUAMI",
  ORANG_TUA = "ORANG_TUA",
  SAUDARA = "SAUDARA",
  CUCU = "CUCU",
  LAINNYA = "LAINNYA",
}

/** Tipe aset yang bisa diwariskan */
export enum TipeAset {
  NATIVE = "NATIVE",         // Native token (ETH, MATIC)
  ERC20 = "ERC20",           // ERC-20 tokens
  ERC721 = "ERC721",         // NFT
  ERC1155 = "ERC1155",       // Multi-token
  RWA = "RWA",               // Real World Assets
}

/** Data ahli waris */
export interface AhliWaris {
  dompetAddr: string;         // Alamat wallet ahli waris
  nikHash: string;            // Hash NIK (tidak disimpan plaintext)
  namaEncrypted: string;      // Nama terenkripsi
  hubunganKeluarga: HubunganKeluarga;
  persentaseBps: number;      // Persentase alokasi dalam basis points (0-10000)
  isLegitimePortie: boolean;  // Apakah termasuk bagian mutlak hukum
}

/** Data wasiat lengkap */
export interface Wasiat {
  id: string;
  pewarisId: string;
  wasiatHash: string;
  ipfsCid?: string;            // IPFS content identifier setelah TTE
  status: WasiatStatus;
  tteStatus: TteStatus;
  zkCircuitVersion?: string;
  jumlahAnakSah: number;       // Jumlah anak sah pewaris (untuk perhitungan LP)
  lpBps?: number;              // Basis points untuk Legitieme Portie
  totalAhliWaris: number;
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
  revokedAt?: Date;
  ahliWarisList: AhliWaris[];
}

/** Input untuk membuat wasiat */
export interface BuatWasiatInput {
  jumlahAnakSah: number;
  ahliWarisList: AhliWaris[];
  catatanEncrypted?: string;
  asetList: { tokenAddr: string; tokenSymbol: string; tokenDecimals: number }[];
}

/** Proof kematian dari oracle */
export interface DeathProof {
  requestId: string;
  zkProof: string;
  publicInputHash: string;
  tanggalMeninggal: bigint;    // Unix timestamp
  isValidated: boolean;
}

/** Data untuk konfirmasi ahli waris */
export interface AhliWarisKonfirmasi {
  ahliWarisAddr: string;
  wasiatId: string;
  confirmedAt: Date;
  txHash: string;
}
