/**
 * Ahli Waris (Heir) related types
 */

import type { HubunganKeluarga } from "./wasiat.types.js";

export interface AhliWarisProfile {
  id: string;
  smartAccountAddr: string;
  nikHash: string;
  namaEncrypted: string;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  kycVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AhliWarisData {
  id: string;
  wasiatId: string;
  dompetAddr: string;
  nikHash: string;
  hubunganKeluarga: HubunganKeluarga;
  persentaseBps: number;
  isLegitimePortie: boolean;
  sudahKonfirmasi: boolean;
  konfirmasiAt?: Date;
  jumlahDiterimaWei?: bigint;
  eksekusiTxHash?: string;
}

export interface AhliWarisKlaim {
  ahliWarisAddr: string;
  wasiatId: string;
  jumlahWei: bigint;
  tokenAddr: string;
  isLegitimePortie: boolean;
  verifyTxHash?: string;
}
