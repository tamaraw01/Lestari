// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";
import {IDVOOracle} from "../interfaces/IDVOOracle.sol";
import {IZKVerifier} from "../interfaces/IZKVerifier.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DeathVerificationOracle
 * @notice Oracle untuk verifikasi kematian menggunakan Chainlink Functions
 * @dev Query ke SATUSEHAT (Sertifikat Medis Penyebab Kematian) + Dukcapil (Status Kependudukan)
 */
contract DeathVerificationOracle is
    FunctionsClient,
    IDVOOracle,
    Ownable
{
    using FunctionsRequest for FunctionsRequest.Request;

    /**
     * @notice Data struktur untuk pending request
     */
    struct PendingRequest {
        address pewaris;
        string ihsNumber;
        string nikEncrypted;
        uint256 createdAt;
        uint8 status; // 0=pending, 1=fulfilled, 2=valid, 3=invalid
    }

    /**
     * @notice Data struktur untuk verification result
     */
    struct VerificationResult {
        bool valid;
        uint256 tanggalMeninggal; // Unix timestamp
        bytes32 requestId;
        string rawData; // Encrypted response dari API
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════

    /// @notice Chainlink DON ID
    bytes32 public donId;

    /// @notice Chainlink subscription ID
    uint64 public subscriptionId;

    /// @notice Gas limit untuk Chainlink Functions call
    uint32 public gasLimit = 300_000;

    /// @notice Wasiat Module address
    address public wasiatModule;

    /// @notice ZK Verifier address
    IZKVerifier public zkVerifier;

    /// @notice Mapping request ID → pending request data
    mapping(bytes32 => PendingRequest) public pendingRequests;

    /// @notice Mapping pewaris → latest request ID
    mapping(address => bytes32) public pewarisToRequestId;

    /// @notice Mapping pewaris → verification result
    mapping(address => VerificationResult) public verificationResults;

    /// @notice JavaScript source code untuk Chainlink Functions
    string public functionSource =
        'const ihsNumber = args[0];\n'
        'const nikHash = args[1];\n'
        'const satusehatToken = secrets.SATUSEHAT_TOKEN;\n'
        'const dukcapilKey = secrets.DUKCAPIL_KEY;\n'
        'const smpkResp = await Functions.makeHttpRequest({\n'
        '  url: `https://api.satusehat.kemkes.go.id/fhir-r4/v1/Observation?subject=Patient/${ihsNumber}&code=69449-7&status=final&_sort=-date&_count=1`,\n'
        '  headers: {\n'
        '    "Authorization": `Bearer ${satusehatToken}`,\n'
        '    "Accept": "application/fhir+json"\n'
        '  }\n'
        '});\n'
        'if (smpkResp.error) throw new Error(`SATUSEHAT error: ${smpkResp.error}`);\n'
        'const hasSmpk = smpkResp.data?.entry?.length > 0;\n'
        'if (!hasSmpk) return Functions.encodeUint256(0);\n'
        'const tglSmpk = smpkResp.data.entry[0].resource.effectiveDateTime;\n'
        'const dukcapilResp = await Functions.makeHttpRequest({\n'
        '  url: `https://api.dukcapil.kemendagri.go.id/verifikasi/nik`,\n'
        '  params: { nik: nikHash },\n'
        '  headers: { "x-api-key": dukcapilKey }\n'
        '});\n'
        'if (dukcapilResp.error) throw new Error(`Dukcapil error: ${dukcapilResp.error}`);\n'
        'const statusMeninggal = dukcapilResp.data?.status_kependudukan === "MENINGGAL";\n'
        'if (!statusMeninggal) return Functions.encodeUint256(0);\n'
        'const unixTimestamp = Math.floor(new Date(tglSmpk).getTime() / 1000);\n'
        'return Functions.encodeUint256(unixTimestamp);\n';

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════

    constructor(
        address router,
        bytes32 _donId,
        uint64 _subscriptionId,
        address _wasiatModule
    ) FunctionsClient(router) {
        require(router != address(0), "Invalid router");
        require(_wasiatModule != address(0), "Invalid wasiat module");

        donId = _donId;
        subscriptionId = _subscriptionId;
        wasiatModule = _wasiatModule;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ORACLE REQUEST FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Request death verification untuk pewaris
     * @dev Hanya bisa dipanggil oleh wasiat module
     */
    function requestVerifikasi(
        address pewaris,
        string calldata ihsNumber,
        string calldata nik,
        bytes calldata encryptedSecrets
    ) external override returns (bytes32 requestId) {
        require(msg.sender == wasiatModule, "Only wasiat module");
        require(pewaris != address(0), "Valid pewaris address required");
        require(bytes(ihsNumber).length > 0, "Valid IHS number required");
        require(bytes(nik).length > 0, "Valid NIK required");

        // Prevent duplicate pending requests
        bytes32 lastRequestId = pewarisToRequestId[pewaris];
        if (lastRequestId != bytes32(0)) {
            PendingRequest storage lastReq = pendingRequests[lastRequestId];
            require(
                lastReq.status != 0,
                "Another request still pending"
            );
        }

        // Build request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(functionSource);

        // Set args
        string[] memory args = new string[](2);
        args[0] = ihsNumber;
        args[1] = nik;
        req.setArgs(args);

        // Set encrypted secrets
        if (encryptedSecrets.length > 0) {
            req.setSecrets(encryptedSecrets);
        }

        // Send request
        requestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donId
        );

        // Store pending request
        pendingRequests[requestId] = PendingRequest({
            pewaris: pewaris,
            ihsNumber: ihsNumber,
            nikEncrypted: nik,
            createdAt: block.timestamp,
            status: 0 // pending
        });

        pewarisToRequestId[pewaris] = requestId;

        emit RequestDibuat(pewaris, requestId, ihsNumber);

        return requestId;
    }

    /**
     * @notice Callback dari Chainlink Functions dengan result
     * @dev Internal function dipanggil oleh Chainlink oracle network
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes calldata response,
        bytes calldata err
    ) internal override {
        require(pendingRequests[requestId].pewaris != address(0), "Unknown request");

        PendingRequest storage pendingReq = pendingRequests[requestId];
        address pewaris = pendingReq.pewaris;

        if (err.length > 0) {
            // Error from Chainlink
            pendingReq.status = 3; // invalid
            string memory errorMsg = string(err);
            emit VerifikasiGagal(pewaris, requestId, errorMsg);
            return;
        }

        // Decode response
        uint256 tanggalUnix = abi.decode(response, (uint256));

        if (tanggalUnix == 0) {
            // Death verification failed
            pendingReq.status = 3; // invalid
            emit VerifikasiGagal(pewaris, requestId, "Death not verified");
            return;
        }

        // Record successful verification
        pendingReq.status = 2; // valid
        verificationResults[pewaris] = VerificationResult({
            valid: true,
            tanggalMeninggal: tanggalUnix,
            requestId: requestId,
            rawData: string(response)
        });

        emit VerifikasiDiselesaikan(
            pewaris,
            requestId,
            true,
            tanggalUnix
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // QUERY FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Get status dari pending verification request
     */
    function getPendingRequestStatus(address pewaris)
        external
        view
        override
        returns (bytes32 requestId, uint8 status)
    {
        requestId = pewarisToRequestId[pewaris];
        if (requestId == bytes32(0)) {
            return (bytes32(0), 0);
        }

        status = pendingRequests[requestId].status;
    }

    /**
     * @notice Get verification result untuk pewaris
     */
    function getVerificationResult(address pewaris)
        external
        view
        override
        returns (
            bool valid,
            uint256 tanggalMeninggal,
            bytes32 requestId
        )
    {
        VerificationResult storage result = verificationResults[pewaris];
        return (result.valid, result.tanggalMeninggal, result.requestId);
    }

    /**
     * @notice Check apakah kematian sudah terverifikasi
     */
    function isDeathVerified(address pewaris) external view returns (bool) {
        return verificationResults[pewaris].valid;
    }

    /**
     * @notice Get tanggal meninggal (Unix timestamp)
     */
    function getTanggalMeninggal(address pewaris)
        external
        view
        returns (uint256)
    {
        require(
            verificationResults[pewaris].valid,
            "Death not verified"
        );
        return verificationResults[pewaris].tanggalMeninggal;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @notice Update Chainlink subscription ID
     */
    function setSubscriptionId(uint64 newSubId) external onlyOwner {
        subscriptionId = newSubId;
    }

    /**
     * @notice Update gas limit untuk Chainlink Functions
     */
    function setGasLimit(uint32 newGasLimit) external onlyOwner {
        require(newGasLimit > 0, "Invalid gas limit");
        gasLimit = newGasLimit;
    }

    /**
     * @notice Update DON ID
     */
    function setDonId(bytes32 newDonId) external onlyOwner {
        require(newDonId != bytes32(0), "Invalid DON ID");
        donId = newDonId;
    }

    /**
     * @notice Update Wasiat Module address
     */
    function setWasiatModule(address newModule) external onlyOwner {
        require(newModule != address(0), "Invalid module address");
        wasiatModule = newModule;
    }

    /**
     * @notice Update javascript source
     */
    function setFunctionSource(string calldata newSource) external onlyOwner {
        require(bytes(newSource).length > 0, "Invalid source");
        functionSource = newSource;
    }

    /**
     * @notice Set ZK Verifier address
     */
    function setZKVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "Invalid verifier");
        zkVerifier = IZKVerifier(verifier);
    }
}
