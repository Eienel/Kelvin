// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {ERC20} from "openzeppelin/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Testnet-only ERC-20 with permissionless mint.
 *         Lets the Kelvin faucet hand out demo tokens.
 */
contract MockERC20 is ERC20 {
    uint8 private immutable _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
