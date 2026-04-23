// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "openzeppelin/access/Ownable.sol";

/**
 * @title KelvinFeeRouter
 * @notice Sink for protocol-fee tokens collected from LBFactory.
 *         On a Kelvin appchain the operator is the chain itself, so protocol
 *         fees are revenue the chain keeps. This contract lets the owner set
 *         a treasury address, split fees to multiple recipients (future), and
 *         withdraw accumulated balances.
 */
contract KelvinFeeRouter is Ownable {
    using SafeERC20 for IERC20;

    address public treasury;
    event TreasurySet(address indexed treasury);
    event Withdrawn(address indexed token, address indexed to, uint256 amount);

    error ZeroAddress();

    constructor(address treasury_) {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        emit TreasurySet(treasury_);
    }

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        emit TreasurySet(treasury_);
    }

    function withdraw(IERC20 token, uint256 amount) external {
        address to = treasury;
        token.safeTransfer(to, amount);
        emit Withdrawn(address(token), to, amount);
    }

    function withdrawAll(IERC20 token) external {
        address to = treasury;
        uint256 bal = token.balanceOf(address(this));
        if (bal == 0) return;
        token.safeTransfer(to, bal);
        emit Withdrawn(address(token), to, bal);
    }
}
