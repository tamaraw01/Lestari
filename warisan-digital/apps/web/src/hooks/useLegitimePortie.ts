"use client";

import { useMemo } from "react";
import {
  validateLPCompliance,
  hitungLPMinimum,
  formatPersentage,
} from "@warisan-digital/shared/utils";

interface AhliWarisInput {
  persentaseBps: number;
  isLegitimePortie: boolean;
}

interface LPResult {
  isValid: boolean;
  totalBps: number;
  totalLPBps: number;
  minLPBps: number;
  bebasPortieBps: number;
  kekuranganBps: number;
  pasalReferensi: string;
}

/**
 * Hook untuk real-time validasi Legitieme Portie
 * Digunakan oleh komponen WasiatForm untuk instant feedback
 */
export function useLegitimePortie(
  ahliWarisList: AhliWarisInput[],
  jumlahAnakSah: number
): LPResult {
  return useMemo(() => {
    const result = validateLPCompliance(ahliWarisList, jumlahAnakSah);

    return {
      isValid: result.isValid,
      totalBps: result.totalBps,
      totalLPBps: result.totalLPBps,
      minLPBps: result.minLPBps,
      bebasPortieBps: result.bebasPortieBps,
      kekuranganBps: result.kekuranganBps,
      pasalReferensi: result.pesan,
    };
  }, [ahliWarisList, jumlahAnakSah]);
}
