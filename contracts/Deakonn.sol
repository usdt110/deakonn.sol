// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Deakonn
 * @notice ERC-20 token with role-based minting, burning, and emergency pause controls.
 */
contract Deakonn is ERC20, ERC20Burnable, ERC20Pausable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Fixed initial supply: 1 billion tokens (18 decimals).
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10 ** 18;

    /**
     * @param defaultAdmin Address that receives initial supply and all admin roles.
     */
    constructor(address defaultAdmin) ERC20("Deakonn", "DEAK") {
        if (defaultAdmin == address(0)) revert InvalidAdmin();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _grantRole(BURNER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);

        _mint(defaultAdmin, INITIAL_SUPPLY);
    }

    /// @notice Mint new tokens to `to`. Restricted to accounts with MINTER_ROLE.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /// @notice Burn tokens from `from` without requiring allowance. Restricted to BURNER_ROLE.
    function adminBurn(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }

    /// @notice Pause all token transfers.
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /// @notice Resume token transfers.
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /// @dev Required override for ERC20 + ERC20Pausable in OpenZeppelin v5.
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }

    error InvalidAdmin();
}
