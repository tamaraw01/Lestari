import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits untuk GCM
const TAG_LENGTH = 16; // 128 bits auth tag

/**
 * Service untuk enkripsi/dekripsi data dengan AES-256-GCM
 * Format output: IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
 */
export class EncryptionService {
  private readonly keyHex: string;

  constructor(keyHex: string) {
    if (keyHex.length !== 64) {
      throw new Error("Encryption key harus 32 bytes (64 hex chars)");
    }
    this.keyHex = keyHex;
  }

  private get key(): Buffer {
    return Buffer.from(this.keyHex, "hex");
  }

  /**
   * Enkripsi data dengan AES-256-GCM
   * @param plaintext Data untuk di-enkripsi
   * @returns Buffer dengan format: IV + AuthTag + Ciphertext
   */
  encrypt(plaintext: string | Buffer): Buffer {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const data =
      typeof plaintext === "string"
        ? Buffer.from(plaintext, "utf-8")
        : plaintext;

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Gabungkan: IV + AuthTag + Ciphertext
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Dekripsi data AES-256-GCM
   * @param encryptedBuffer Buffer dengan format: IV + AuthTag + Ciphertext
   * @returns Decrypted data
   */
  decrypt(encryptedBuffer: Buffer): Buffer {
    if (encryptedBuffer.length < IV_LENGTH + TAG_LENGTH + 1) {
      throw new Error("Data terenkripsi terlalu pendek / corrupt");
    }

    const iv = encryptedBuffer.subarray(0, IV_LENGTH);
    const authTag = encryptedBuffer.subarray(
      IV_LENGTH,
      IV_LENGTH + TAG_LENGTH
    );
    const ciphertext = encryptedBuffer.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
  }

  /**
   * Dekripsi ke string
   */
  decryptToString(encryptedBuffer: Buffer): string {
    return this.decrypt(encryptedBuffer).toString("utf-8");
  }

  /**
   * Hash satu-arah untuk lookup (SHA-256)
   * PENTING: Jangan gunakan untuk enkripsi, hanya untuk hashing
   */
  hash(data: string): string {
    return createHash("sha256").update(data).digest("hex");
  }

  /**
   * Mask NIK untuk logging
   * Hanya tampilkan 4 digit pertama dan 2 digit terakhir
   */
  maskNik(nik: string): string {
    if (!/^\d{16}$/.test(nik)) {
      return "INVALID_NIK";
    }
    return `${nik.substring(0, 4)}${"*".repeat(8)}${nik.substring(14)}`;
  }

  /**
   * Validasi NIK format
   */
  validateNikFormat(nik: string): boolean {
    return /^\d{16}$/.test(nik);
  }

  /**
   * Validasi wallet address format
   */
  validateWalletAddress(address: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  /**
   * Normalize wallet address ke lowercase
   */
  normalizeWalletAddress(address: string): string {
    if (!this.validateWalletAddress(address)) {
      throw new Error("Invalid wallet address");
    }
    return address.toLowerCase();
  }
}
