/**
 * Utility functions untuk Legitieme Portie calculation
 * Pure functions untuk validasi dan perhitungan bagian hukum
 */

import { BASIS_POINTS, LEGITIEME_PORTIE, getLPMinimumBps } from "../constants/kuhperdata.constants.js";

export interface AhliWarisAllocation {
  persentaseBps: number;
  isLegitimePortie: boolean;
}

export interface LegitimePortieValidation {
  isValid: boolean;
  totalBps: number;
  totalLPBps: number;
  minLPBps: number;
  bebasPortieBps: number;
  kekuranganBps: number;
  pesan: string;
}

/**
 * Hitung Legitieme Portie minimum dalam basis points
 * @param jumlahAnakSah Jumlah anak sah pewaris
 * @returns Minimum LP dalam basis points (0-10000)
 */
export function hitungLPMinimum(jumlahAnakSah: number): number {
  return getLPMinimumBps(Math.max(0, jumlahAnakSah));
}

/**
 * Validasi kepatuhan Legitieme Portie
 * @param ahliWarisList Daftar ahli waris dengan alokasi
 * @param jumlahAnakSah Jumlah anak sah pewaris
 * @returns Validation result dengan detail
 */
export function validateLPCompliance(
  ahliWarisList: AhliWarisAllocation[],
  jumlahAnakSah: number,
): LegitimePortieValidation {
  // Hitung total alokasi
  const totalBps = ahliWarisList.reduce((sum, aw) => sum + aw.persentaseBps, 0);

  // Hitung total LP
  const totalLPBps = ahliWarisList
    .filter((aw) => aw.isLegitimePortie)
    .reduce((sum, aw) => sum + aw.persentaseBps, 0);

  // Hitung minimum yang required
  const minLPBps = hitungLPMinimum(jumlahAnakSah);

  // Validasi
  const totalBpsValid = totalBps === BASIS_POINTS;
  const lpValid = totalLPBps >= minLPBps;
  const isValid = totalBpsValid && lpValid;

  const kekuranganBps = Math.max(0, minLPBps - totalLPBps);

  let pesan = "";
  if (!totalBpsValid) {
    pesan = `Total alokasi harus 100% (10000 BPS), tapi didapat ${formatPersentage(totalBps)}`;
  } else if (!lpValid) {
    pesan = `Legitimate Portie kurang ${formatPersentage(kekuranganBps)} (minimum ${formatPersentage(minLPBps)})`;
  } else {
    pesan = "✓ Compliance dengan KUHPerdata Pasal 914";
  }

  return {
    isValid,
    totalBps,
    totalLPBps,
    minLPBps,
    bebasPortieBps: BASIS_POINTS - minLPBps,
    kekuranganBps,
    pesan,
  };
}

/**
 * Hitung pembagian aset ke seorang ahli waris
 * @param totalAsetWei Total aset dalam Wei
 * @param persentaseBps Persentase dalam basis points
 * @returns Jumlah yang diterima ahli waris dalam Wei
 */
export function hitungPembagianAset(totalAsetWei: bigint, persentaseBps: number): bigint {
  if (persentaseBps < 0 || persentaseBps > BASIS_POINTS) {
    throw new Error(`Persentase harus antara 0-${BASIS_POINTS}`);
  }

  // Hitung: total * (persentaseBps / 10000)
  // Gunakan BigInt untuk menghindari overflow: (total * bps) / 10000
  return (totalAsetWei * BigInt(persentaseBps)) / BigInt(BASIS_POINTS);
}

/**
 * Convert basis points to percentage string
 * @param bps Basis points (1-10000)
 * @returns Formatted percentage string "xx.xx%"
 */
export function formatPersentage(bps: number): string {
  const percentage = (bps / BASIS_POINTS) * 100;
  return `${percentage.toFixed(2)}%`;
}

/**
 * Convert percentage to basis points
 * @param percentage Percentage value (0-100)
 * @returns Basis points
 */
export function persentageToBebasPortie(percentage: number): number {
  if (percentage < 0 || percentage > 100) {
    throw new Error("Percentage harus antara 0-100");
  }
  return Math.round((percentage / 100) * BASIS_POINTS);
}

/**
 * Hitung jumlah LP yang diperlukan dalam basis points
 * berdasarkan jumlah anak sah
 */
export function calculateRequiredLP(jumlahAnakSah: number): {
  minBps: number;
  minPercentage: string;
  isPasal914: boolean;
} {
  const minBps = hitungLPMinimum(jumlahAnakSah);
  return {
    minBps,
    minPercentage: formatPersentage(minBps),
    isPasal914: jumlahAnakSah > 0,
  };
}
