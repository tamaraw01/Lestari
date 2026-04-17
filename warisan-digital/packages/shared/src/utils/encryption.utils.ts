/**
 * Encryption utilities
 * Untuk enkripsi PII dan data sensitif
 */

import { createHash, randomBytes } from "crypto";

/**
 * Hash NIK dengan SHA-256 untuk lookup tanpa menyimpan NIK plaintext
 * @param nik NIK 16 digit
 * @returns SHA-256 hash sebagai hex string
 */
export function hashNik(nik: string): string {
  if (!/^\d{16}$/.test(nik)) {
    throw new Error("NIK harus 16 digit numerik");
  }
  return createHash("sha256").update(nik).digest("hex");
}

/**
 * Hash data generik dengan SHA-256
 * @param data Data string untuk di-hash
 * @returns SHA-256 hash sebagai hex string
 */
export function hashString(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Hash buffer dengan SHA-256
 * @param buffer Data buffer untuk di-hash
 * @returns SHA-256 hash sebagai hex string
 */
export function hashBuffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Validate NIK format (16 digit numeric)
 * @param nik NIK to validate
 * @returns true jika valid format
 */
export function validateNikFormat(nik: string): boolean {
  return /^\d{16}$/.test(nik);
}

/**
 * Mask NIK untuk logging (hanya tampilkan 4 digit pertama)
 * PENTING: Jangan pernah log NIK plaintext
 * @param nik NIK 16 digit
 * @returns Masked NIK format "KKKKXXXXXXXX6" dimana K = visible, X = masked
 */
export function maskNik(nik: string): string {
  if (!validateNikFormat(nik)) {
    return "INVALID_NIK";
  }
  return `${nik.substring(0, 4)}${"*".repeat(8)}${nik.substring(14)}`;
}

/**
 * Generate random hex string untuk salt/IV
 * @param bytes Jumlah bytes untuk di-generate
 * @returns Random hex string
 */
export function generateRandomHex(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Validate wallet address format (Ethereum/Polygon)
 * @param address Wallet address
 * @returns true jika valid format
 */
export function validateWalletAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Normalize wallet address (lowercase)
 * @param address Wallet address
 * @returns Normalized address
 */
export function normalizeWalletAddress(address: string): string {
  if (!validateWalletAddress(address)) {
    throw new Error("Invalid wallet address");
  }
  return address.toLowerCase();
}
