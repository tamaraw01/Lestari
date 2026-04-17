// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IZKVerifier} from "../interfaces/IZKVerifier.sol";

/**
 * @title MockZKVerifier
 * @notice Mock ZK verifier untuk testing
 * @dev Dalam testing, selalu return true untuk proof verification
 */
contract MockZKVerifier is IZKVerifier {
    /// @notice Counter untuk tracking proof verifications
    uint256 public verifyCount;

    /// @notice Flag untuk toggle verification result (default true)
    bool public shouldVerify = true;

    /**
     * @notice Verify ZK proof
     * @dev Mock implementation - selalu return shouldVerify value
     */
    function verifyProof(uint256[8] calldata proof, uint256[4] calldata input)
        external
        override
        returns (bool valid)
    {
        require(proof.length == 8, "Invalid proof length");
        require(input.length == 4, "Invalid input length");

        verifyCount++;
        return shouldVerify;
    }

    /**
     * @notice Verify execution proof
     * @dev Mock implementation
     */
    function verifyExecutionProof(
        bytes calldata proof,
        bytes32 wasiatHash,
        bytes32 publicInputHash
    ) external override returns (bool valid) {
        require(proof.length > 0, "Empty proof");
        require(wasiatHash != bytes32(0), "Invalid wasiat hash");
        require(publicInputHash != bytes32(0), "Invalid public input hash");

        verifyCount++;

        emit ProofVerified(wasiatHash, shouldVerify);
        return shouldVerify;
    }

    /**
     * @notice Set verification result untuk testing
     */
    function setShouldVerify(bool value) external {
        shouldVerify = value;
    }

    /**
     * @notice Reset verification count
     */
    function resetCount() external {
        verifyCount = 0;
    }
}

/**
 * @title MockERC20
 * @notice Mock ERC-20 token untuk testing
 */
contract MockERC20 {
    string public name = "Mock Token";
    string public symbol = "MOCK";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply) {
        totalSupply = initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address to, uint256 value) public returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(balanceOf[msg.sender] >= value, "Insufficient balance");

        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;

        emit Transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public returns (bool) {
        require(to != address(0), "Invalid recipient");
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");

        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;

        emit Transfer(from, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) public {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
        emit Transfer(msg.sender, address(0), amount);
    }
}
