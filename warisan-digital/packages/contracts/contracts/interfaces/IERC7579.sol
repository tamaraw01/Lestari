// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IERC7579Module
 * @notice Interface dasar untuk semua ERC-7579 modules
 * @dev ERC-7579: Extensible Smart Account Interface
 */
interface IERC7579Module {
    /**
     * @notice Dipanggil saat modul di-install ke smart account
     * @param data ABI-encoded initialization data
     * @dev Implementation harus validate data length dan format
     */
    function onInstall(bytes calldata data) external;

    /**
     * @notice Dipanggil saat modul di-uninstall dari smart account
     * @param data ABI-encoded cleanup data
     * @dev Implementation harus berhati-hati dengan state cleanup
     */
    function onUninstall(bytes calldata data) external;

    /**
     * @notice Cek apakah modul mendukung tipe modul tertentu
     * @param moduleTypeId 1=Validator, 2=Executor, 3=Fallback, 4=Hook
     * @return true jika modul mendukung tipe tersebut
     */
    function isModuleType(uint256 moduleTypeId) external view returns (bool);
}

/**
 * @title IERC7579Account
 * @notice Interface smart account yang kompatibel ERC-7579
 * @dev Smart account harus implement interface ini untuk support modular architecture
 */
interface IERC7579Account {
    /**
     * @notice Eksekusi transaksi dari executor module yang terinstall
     * @param executionCalldata ABI-encoded execution data
     * @return returnData Array return data dari setiap call
     * @dev Function hanya bisa dipanggil oleh executor module yang terinstall
     */
    function executeFromExecutor(bytes calldata executionCalldata)
        external
        returns (bytes[] memory returnData);

    /**
     * @notice Install module baru ke smart account
     * @param moduleTypeId Tipe module yang di-install
     * @param module Alamat module contract
     * @param initData ABI-encoded initialization data
     * @dev Caller harus authorized (biasanya lewat validator)
     */
    function installModule(
        uint256 moduleTypeId,
        address module,
        bytes calldata initData
    ) external;

    /**
     * @notice Uninstall module dari smart account
     * @param moduleTypeId Tipe module yang di-uninstall
     * @param module Alamat module contract
     * @param deInitData ABI-encoded cleanup data
     * @dev Caller harus authorized
     */
    function uninstallModule(
        uint256 moduleTypeId,
        address module,
        bytes calldata deInitData
    ) external;

    /**
     * @notice Cek apakah module terinstall pada smart account
     * @param moduleTypeId Tipe module
     * @param module Alamat module
     * @param additionalContext Additional context untuk validation
     * @return installed true jika module sudah terinstall
     */
    function isModuleInstalled(
        uint256 moduleTypeId,
        address module,
        bytes calldata additionalContext
    ) external view returns (bool installed);

    /**
     * @notice Emit saat module di-install
     */
    event ModuleInstalled(uint256 indexed moduleTypeId, address indexed module);

    /**
     * @notice Emit saat module di-uninstall
     */
    event ModuleUninstalled(uint256 indexed moduleTypeId, address indexed module);
}
