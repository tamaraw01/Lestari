// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IZKVerifier
 * @notice Interface untuk Zero-Knowledge proof verifier
 * @dev Kompatibel dengan snarkjs Groth16 verifier output
 */
interface IZKVerifier {
    /**
     * @notice Verify Zero-Knowledge proof untuk wasiat
     * @param proof Array [pi_a_0, pi_a_1, pi_b_0_0, pi_b_0_1, pi_b_1_0, pi_b_1_1, pi_c_0, pi_c_1]
     * @param input Array public inputs
     * @return valid true jika proof valid, false otherwise
     * @dev Proof harus dalam format Groth16 yang diproduksi oleh snarkjs
     */
    function verifyProof(uint256[8] calldata proof, uint256[4] calldata input)
        external
        view
        returns (bool valid);

    /**
     * @notice Verify ZK proof untuk wasiat execution dengan verifikasi LP
     * @param proof Compressed proof dalam format hex
     * @param wasiatHash Hash dari wasiat data
     * @param publicInputHash Hash dari public inputs
     * @return valid true jika proof valid
     */
    function verifyExecutionProof(
        bytes calldata proof,
        bytes32 wasiatHash,
        bytes32 publicInputHash
    ) external view returns (bool valid);

    /**
     * @notice Emit saat proof di-verify
     */
    event ProofVerified(bytes32 indexed wasiatHash, bool indexed valid);
}
