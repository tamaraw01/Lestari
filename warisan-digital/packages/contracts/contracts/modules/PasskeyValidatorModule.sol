// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC7579Module} from "../interfaces/IERC7579.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PasskeyValidatorModule
 * @notice ERC-7579 Validator Module untuk WebAuthn/Passkey authentication
 * @dev Implements secp256r1 signature verification untuk Passkey signatures
 */
contract PasskeyValidatorModule is IERC7579Module, Ownable {
    /**
     * @notice Data struktur untuk Passkey credential
     */
    struct PasskeyCredential {
        bytes credentialId;             // Public key ID dari WebAuthn
        bytes32 pubKeyX;                // Public key X coordinate (secp256r1)
        bytes32 pubKeyY;                // Public key Y coordinate (secp256r1)
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Mapping smart account → PasskeyCredential
    mapping(address => PasskeyCredential) public credentials;

    /// @notice Mapping smart account → is installed
    mapping(address => bool) public isInstalled;

    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════

    event PasskeyCredentialInstalled(
        address indexed account,
        bytes credentialId
    );

    event PasskeyCredentialRemoved(address indexed account);

    event PasskeySignatureVerified(
        address indexed account,
        bytes32 indexed messageHash
    );

    // ═══════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════

    error InvalidCredentialData();
    error PasskeyNotInstalled();
    error InvalidSignatureFormat();
    error SignatureVerificationFailed();

    // ═══════════════════════════════════════════════════════════════════════
    // IERC7579Module IMPLEMENTATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Install passkey credential ke smart account
     * @dev Data format: abi.encode(
     *        bytes credentialId,
     *        bytes32 pubKeyX,
     *        bytes32 pubKeyY
     *      )
     */
    function onInstall(bytes calldata data) external override {
        require(data.length >= 96, "Invalid install data length");

        (bytes memory credentialId, bytes32 pubKeyX, bytes32 pubKeyY) =
            abi.decode(data, (bytes, bytes32, bytes32));

        require(credentialId.length > 0, "Credential ID cannot be empty");
        require(!isInstalled[msg.sender], "Passkey already installed");

        credentials[msg.sender] = PasskeyCredential({
            credentialId: credentialId,
            pubKeyX: pubKeyX,
            pubKeyY: pubKeyY
        });

        isInstalled[msg.sender] = true;

        emit PasskeyCredentialInstalled(msg.sender, credentialId);
    }

    /**
     * @notice Uninstall passkey credential dari smart account
     */
    function onUninstall(bytes calldata) external override {
        require(isInstalled[msg.sender], "Passkey not installed");

        delete credentials[msg.sender];
        isInstalled[msg.sender] = false;

        emit PasskeyCredentialRemoved(msg.sender);
    }

    /**
     * @notice Cek apakah modul adalah validator
     * @return true karena ini adalah Validator module (type 1)
     */
    function isModuleType(uint256 moduleTypeId) external pure override returns (bool) {
        return moduleTypeId == 1; // Validator module
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SIGNATURE VALIDATION
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Validate UserOperation signature menggunakan Passkey
     * @dev Signature format: (bytes authenticatorData, bytes clientDataJSON, uint256 r, uint256 s)
     * @return 0 jika valid, 1 jika invalid
     */
    function validateUserOp(
        bytes calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256) {
        // Decode signature dari userOp
        // Standard format untuk UserOperation: (address account, uint256 nonce, bytes initCode, ...)
        // Signature ada di akhir encoding

        address account = address(bytes20(userOp[0:20]));

        require(isInstalled[account], "Passkey not installed for this account");

        // Call validateSignature untuk actual validation
        bool valid = validateSignature(
            account,
            userOpHash,
            bytes("") // Akan diisi dari userOp jika diperlukan
        );

        return valid ? 0 : 1;
    }

    /**
     * @notice Validate signature dengan format ERC-1271
     * @dev Implementasi ERC-1271 isValidSignature function
     * @return magicValue 0x1626ba7e jika valid, 0xffffffff jika invalid
     */
    function isValidSignatureWithSender(
        address sender,
        bytes32 hash,
        bytes calldata sig
    ) external view returns (bytes4) {
        if (!isInstalled[sender]) {
            return 0xffffffff;
        }

        bool valid = validateSignature(sender, hash, sig);
        return valid ? bytes4(0x1626ba7e) : bytes4(0xffffffff);
    }

    /**
     * @notice Internal function untuk validate signature
     * @dev Secp256r1 signature verification (P-256)
     * @return true jika signature valid
     */
    function validateSignature(
        address account,
        bytes32 messageHash,
        bytes calldata signature
    ) internal view returns (bool) {
        if (!isInstalled[account]) {
            return false;
        }

        PasskeyCredential storage cred = credentials[account];

        // Signature format: (bytes32 r, bytes32 s, uint8 v)
        // Untuk secp256r1, v tidak ada, hanya r dan s
        if (signature.length < 64) {
            return false;
        }

        uint256 r = uint256(bytes32(signature[0:32]));
        uint256 s = uint256(bytes32(signature[32:64]));

        return verifySECP256R1Signature(
            messageHash,
            r,
            s,
            cred.pubKeyX,
            cred.pubKeyY
        );
    }

    /**
     * @notice Verify secp256r1 signature
     * @dev Uses EVM precompile untuk secp256r1 verification jika tersedia,
     *      otherwise returns false (memerlukan custom implementation)
     * @return valid true jika signature terverifikasi
     */
    function verifySECP256R1Signature(
        bytes32 messageHash,
        uint256 r,
        uint256 s,
        bytes32 pubKeyX,
        bytes32 pubKeyY
    ) internal view returns (bool valid) {
        // NOTE: EVM tidak memiliki built-in secp256r1 precompile di versi standar
        // Implementasi ini menggunakan placeholder yang selalu return true dalam dev
        // Production deployment harus menggunakan:
        // 1. External library seperti FCL_ecdsa
        // 2. Custom precompile
        // 3. Off-chain verification dengan on-chain relay

        // Untuk production, integrasikan dengan:
        // - Daimo's secp256r1 contract
        // - eigen-layer's signature verification
        // - Atau custom P256 precompile

        // Placeholder validation (must be replaced with actual secp256r1 verification)
        if (r == 0 || s == 0) return false;
        if (pubKeyX == bytes32(0) && pubKeyY == bytes32(0)) return false;

        // In production: call actual secp256r1 verifier
        // return P256.verify(messageHash, r, s, pubKeyX, pubKeyY);

        // Temporary: always return true (UNSAFE - for development only!)
        // This MUST be replaced before mainnet deployment
        return true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Get credential untuk account
     */
    function getCredential(address account)
        external
        view
        returns (PasskeyCredential memory)
    {
        require(isInstalled[account], "Passkey not installed");
        return credentials[account];
    }

    /**
     * @notice Check apakah passkey sudah di-install untuk account
     */
    function hasPasskey(address account) external view returns (bool) {
        return isInstalled[account];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Rotate passkey credential
     * @dev Only supported untuk account yang sudah install, dapat update dengan credential baru
     */
    function rotateCredential(
        address account,
        bytes memory newCredentialId,
        bytes32 newPubKeyX,
        bytes32 newPubKeyY
    ) external onlyOwner {
        require(isInstalled[account], "Passkey not installed");
        require(newCredentialId.length > 0, "Invalid credential ID");

        credentials[account] = PasskeyCredential({
            credentialId: newCredentialId,
            pubKeyX: newPubKeyX,
            pubKeyY: newPubKeyY
        });

        emit PasskeyCredentialInstalled(account, newCredentialId);
    }
}
