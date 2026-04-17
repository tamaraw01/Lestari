// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IEntryPoint
 * @notice Interface untuk ERC-4337 EntryPoint contract
 * @dev ERC-4337: Account Abstraction via Entry Point Contract specification
 */
interface IEntryPoint {
    /**
     * @notice Execute a list of UserOperations
     * @dev Contract must validate signature and pay for gas
     */
    function handleOps(
        bytes[] calldata userOps,
        address payable beneficiary
    ) external;

    /**
     * @notice Get balance of account
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @notice Get nonce of account
     */
    function getNonce(address sender, uint192 key)
        external
        view
        returns (uint256 nonce);

    /**
     * @notice Validate UserOperation
     * @dev Returns validation result (0 = valid, non-zero = invalid)
     */
    function simulateValidation(bytes calldata userOp)
        external
        view
        returns (bytes memory);

    event UserOperationEvent(
        bytes32 indexed userOpHash,
        address indexed sender,
        address indexed paymaster,
        uint256 nonce,
        bool success,
        uint256 actualGasCost,
        uint256 actualGasUsed
    );

    event AccountDeployed(
        bytes32 indexed userOpHash,
        address indexed sender,
        address factory,
        address indexOffset
    );

    event BeforeExecution();

    event SignatureAggregatorChanged(address indexed aggregator);

    event UserOperationRevertReason(
        bytes32 indexed userOpHash,
        address indexed sender,
        uint256 nonce,
        bytes revertReason
    );

    event PostOpRevertReason(
        bytes32 indexed userOpHash,
        address indexed sender,
        uint256 nonce,
        bytes revertReason
    );
}

/**
 * @title IAccount
 * @notice Interface untuk smart account kompatibel ERC-4337
 */
interface IAccount {
    /**
     * @notice Validate user operation
     * @param userOp User operation to validate
     * @param userOpHash Hashed user operation
     * @param missingAccountFunds Amount of funds needed to pay for operation
     * @return validationData Validation data bite field (first 6 bytes = aggregator, next 1 byte = valid, next 20 bytes = nonce)
     * @dev This function must validate the signature of the user operation
     */
    function validateUserOp(
        bytes calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);

    /**
     * @notice Pay for user operation
     * @param userOp User operation that is being paid for
     * @param userOpHash Hash of user operation
     * @param missingAccountFunds Amount of funds needed
     * @dev Called by entry point to pay for operation
     */
    function payPrefund(
        bytes calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external;
}
