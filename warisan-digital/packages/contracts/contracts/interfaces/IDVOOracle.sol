// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IDVOOracle
 * @notice Interface untuk Death Verification Oracle (DVO)
 * @dev Oracle menggunakan Chainlink Functions untuk query ke SATUSEHAT + Dukcapil
 */
interface IDVOOracle {
    /**
     * @notice Request death verification untuk pewaris
     * @param pewaris Alamat pewaris (smart account)
     * @param ihsNumber IHS number dari SATUSEHAT
     * @param nik NIK encrypted
     * @param encryptedSecrets Encrypted secrets untuk API calls
     * @return requestId Chainlink request ID
     * @dev Function hanya bisa dipanggil oleh wasiat module atau authorized caller
     */
    function requestVerifikasi(
        address pewaris,
        string calldata ihsNumber,
        string calldata nik,
        bytes calldata encryptedSecrets
    ) external returns (bytes32 requestId);

    /**
     * @notice Oracle fulfills request dengan death verification result
     * @param requestId Chainlink request ID
     * @param response Encoded response dari oracle
     * @param err Error message jika ada
     * @dev Internal function, dipanggil oleh Chainlink oracle callback
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes calldata response,
        bytes calldata err
    ) external;

    /**
     * @notice Get status dari pending verification request
     * @param pewaris Alamat pewaris
     * @return requestId Pending request ID (atau 0 jika tidak ada)
     * @return status Status verification (0=pending, 1=fulfilled, 2=valid, 3=invalid)
     */
    function getPendingRequestStatus(address pewaris)
        external
        view
        returns (bytes32 requestId, uint8 status);

    /**
     * @notice Get verification result untuk pewaris
     * @param pewaris Alamat pewaris
     * @return valid true jika death verified
     * @return tanggalMeninggal Unix timestamp kematian
     * @return requestId Chainlink request ID
     */
    function getVerificationResult(address pewaris)
        external
        view
        returns (
            bool valid,
            uint256 tanggalMeninggal,
            bytes32 requestId
        );

    /**
     * @notice Emit saat verifikasi berhasil
     */
    event VerifikasiDiselesaikan(
        indexed address pewaris,
        indexed bytes32 requestId,
        bool valid,
        uint256 tanggalMeninggal
    );

    /**
     * @notice Emit saat verifikasi gagal
     */
    event VerifikasiGagal(
        indexed address pewaris,
        indexed bytes32 requestId,
        string reason
    );

    /**
     * @notice Emit saat request dibuat
     */
    event RequestDibuat(
        indexed address pewaris,
        indexed bytes32 requestId,
        string ihsNumber
    );
}
