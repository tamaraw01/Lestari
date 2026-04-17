/**
 * Oracle related types
 * Integrasi dengan Chainlink Functions untuk verifikasi kematian
 */

export interface ChainlinkRequest {
  requestId: string;
  donId: string;
  subscriptionId: bigint;
  gasLimit: number;
  args: string[];
}

export interface DVOResponse {
  valid: boolean;
  tanggalUnix?: number;
  tanggalMeninggal?: Date;
  requestId: string;
  status: "PENDING" | "FULFILLED" | "ERROR";
  errorMessage?: string;
}

export interface SatusehatVerification {
  valid: boolean;
  smpkId?: string;
  ihsNumber?: string;
  tanggalMeninggal?: Date;
  sourceSystem: "SATUSEHAT";
}

export interface DukcapilVerification {
  valid: boolean;
  nik: string;
  namaLengkap?: string;
  statusKependudukan: "HIDUP" | "MENINGGAL" | "PINDAH" | "TIDAK_DIKETAHUI";
  tanggalMeninggal?: string;
  nomorAktaKematian?: string;
  sourceSystem: "DUKCAPIL";
}

export interface CrossVerificationResult {
  valid: boolean;
  consistent: boolean;
  daysDiff?: number;
  satusehat?: SatusehatVerification;
  dukcapil?: DukcapilVerification;
}

export interface ZKProofData {
  proof: {
    pi_a: [string, string];
    pi_b: [[string, string], [string, string]];
    pi_c: [string, string];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
}
