/**
 * ZK Proof utilities
 * Helper functions untuk generate dan verify ZK proofs
 */

import { hashBuffer } from "./encryption.utils.js";

export interface ZKProof {
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
  protocol: string;
  curve: string;
}

export interface ProofMetadata {
  circuitName: string;
  circuitVersion: string;
  generatedAt: number;
  publicInputs: string[];
}

/**
 * Validate ZK proof structure
 * @param proof Proof object untuk di-validate
 * @returns true jika struktur valid
 */
export function validateProofStructure(proof: unknown): proof is ZKProof {
  if (typeof proof !== "object" || proof === null) {
    return false;
  }

  const p = proof as Record<string, unknown>;

  if (!Array.isArray(p.pi_a) || p.pi_a.length !== 2) return false;
  if (!Array.isArray(p.pi_b) || p.pi_b.length !== 2) return false;
  if (!Array.isArray(p.pi_c) || p.pi_c.length !== 2) return false;
  if (typeof p.protocol !== "string") return false;
  if (typeof p.curve !== "string") return false;

  return true;
}

/**
 * Hash proof untuk creating proof identifier
 * @param proof ZK proof
 * @returns SHA-256 hash dari proof
 */
export function hashProof(proof: ZKProof): string {
  const proofStr = JSON.stringify(proof);
  return hashBuffer(Buffer.from(proofStr, "utf-8"));
}

/**
 * Create proof metadata
 * @param circuitName Nama circuit (e.g., "wasiat_verifier")
 * @param circuitVersion Versi circuit
 * @param publicInputs Public inputs array
 * @returns Proof metadata
 */
export function createProofMetadata(
  circuitName: string,
  circuitVersion: string,
  publicInputs: string[],
): ProofMetadata {
  return {
    circuitName,
    circuitVersion,
    generatedAt: Date.now(),
    publicInputs,
  };
}

/**
 * Validate public inputs format
 * @param inputs Public inputs
 * @returns true jika valid
 */
export function validatePublicInputs(inputs: string[]): boolean {
  if (!Array.isArray(inputs)) return false;
  if (inputs.length === 0) return false;

  // Setiap input harus berupa string yang valid
  return inputs.every((input) => {
    // Numeric values sebagai string
    return /^[0-9]+$/.test(input) || /^0x[0-9a-fA-F]+$/.test(input);
  });
}

/**
 * Parse proof dari JSON string
 * @param jsonStr JSON string dari proof
 * @returns Parsed proof
 * @throws Error jika parsing gagal atau struktur invalid
 */
export function parseProof(jsonStr: string): ZKProof {
  try {
    const proof = JSON.parse(jsonStr);
    if (!validateProofStructure(proof)) {
      throw new Error("Invalid proof structure");
    }
    return proof;
  } catch (err) {
    throw new Error(`Failed to parse proof: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Convert proof to hex format untuk on-chain verification
 * Concatenate pi_a, pi_b, pi_c components sebagai hex
 * @param proof ZK proof
 * @returns Concatenated hex string
 */
export function proofToHex(proof: ZKProof): string {
  // Format: pi_a[0] + pi_a[1] + pi_b[0][0] + pi_b[0][1] + pi_b[1][0] + pi_b[1][1] + pi_c[0] + pi_c[1]
  const parts = [
    proof.pi_a[0],
    proof.pi_a[1],
    proof.pi_b[0][0],
    proof.pi_b[0][1],
    proof.pi_b[1][0],
    proof.pi_b[1][1],
    proof.pi_c[0],
    proof.pi_c[1],
  ];

  return (
    "0x" +
    parts
      .map((part) => {
        // Remove 0x prefix jika ada dan pad ke 256 bits (32 bytes = 64 hex chars)
        const hex = part.toString().replace(/^0x/, "");
        return hex.padStart(64, "0");
      })
      .join("")
  );
}
