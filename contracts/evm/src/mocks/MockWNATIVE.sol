// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {ERC20} from "openzeppelin/token/ERC20/ERC20.sol";
import {IWNATIVE} from "../lb/interfaces/IWNATIVE.sol";

/**
 * @title MockWNATIVE
 * @notice Minimal WETH9-style wrapped-native for testnet deploys.
 *         LBRouter requires an IWNATIVE address at construction — on the
 *         Kelvin appchain the gas token is bridged uinit, so this contract
 *         stands in as a placeholder.
 */
contract MockWNATIVE is ERC20, IWNATIVE {
    constructor() ERC20("Wrapped Native", "WNATIVE") {}

    function deposit() public payable override {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) public override {
        _burn(msg.sender, amount);
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "MockWNATIVE: withdraw failed");
    }

    receive() external payable {
        deposit();
    }
}
