// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import {ERC721} from "openzeppelin/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "openzeppelin/token/ERC721/extensions/ERC721Enumerable.sol";
import {Ownable} from "openzeppelin/access/Ownable.sol";
import {ReentrancyGuard} from "openzeppelin/security/ReentrancyGuard.sol";
import {Math} from "openzeppelin/utils/math/Math.sol";

import {ILBPair} from "./lb/interfaces/ILBPair.sol";
import {ILBToken} from "./lb/interfaces/ILBToken.sol";
import {ILBFactory} from "./lb/interfaces/ILBFactory.sol";
import {PackedUint128Math} from "./lb/libraries/math/PackedUint128Math.sol";

/**
 * @title KelvinPositionManager
 * @notice Wraps a Liquidity Book LBPair position in an ERC-721.
 *         Each NFT = one LP position across a contiguous set of bins.
 *         Holds the underlying LBToken shares and exposes:
 *           - mint: deposit tokens into bins, receive NFT
 *           - burn: withdraw everything, NFT burned
 *           - collectFees: realize accrued fees without closing the position
 *           - rebalance: atomic burn + remint into new bins (session-UX-friendly)
 *           - setName: bind a .init handle string to the NFT (UI-only)
 */
contract KelvinPositionManager is ERC721Enumerable, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using PackedUint128Math for bytes32;

    struct Position {
        address pair;
        uint24[] binIds;
        uint256[] liquidity;
        uint128 principalX;
        uint128 principalY;
        uint128 feesCollectedX;
        uint128 feesCollectedY;
    }

    ILBFactory public immutable factory;

    uint256 private _nextId = 1;
    mapping(uint256 => Position) private _positions;
    // Display name — the frontend writes a resolved .init handle here at mint
    // time. Not authoritative; cleared on transfer.
    mapping(uint256 => string) public initName;

    event PositionMinted(
        uint256 indexed tokenId,
        address indexed owner,
        address indexed pair,
        uint128 amountX,
        uint128 amountY
    );
    event PositionBurned(
        uint256 indexed tokenId,
        address indexed owner,
        uint128 amountX,
        uint128 amountY
    );
    event FeesCollected(
        uint256 indexed tokenId,
        address indexed owner,
        uint128 feesX,
        uint128 feesY
    );
    event PositionRebalanced(
        uint256 indexed tokenId,
        address indexed owner,
        uint128 amountX,
        uint128 amountY
    );
    event NameBound(uint256 indexed tokenId, string name);

    error InvalidPair();
    error NotOwnerOrApproved();
    error LengthMismatch();

    constructor(ILBFactory factory_) ERC721("Kelvin LP Position", "KELVIN-LP") {
        factory = factory_;
    }

    // --- views ---

    function getPosition(uint256 tokenId) external view returns (Position memory) {
        return _positions[tokenId];
    }

    /**
     * @notice Estimate pending fees for `tokenId` without touching state.
     *         Pending fees = current redeemable value across held bins - principal.
     *         Note: this approximation ignores reserved protocol fees.
     */
    function pendingFees(uint256 tokenId)
        external
        view
        returns (uint128 feesX, uint128 feesY)
    {
        Position storage p = _positions[tokenId];
        ILBPair pair = ILBPair(p.pair);
        uint256 totalX;
        uint256 totalY;
        uint256 n = p.binIds.length;
        for (uint256 i; i < n; ++i) {
            uint24 id = p.binIds[i];
            uint256 myShares = p.liquidity[i];
            uint256 totalShares = ILBToken(address(pair)).totalSupply(id);
            if (totalShares == 0) continue;
            (uint128 binX, uint128 binY) = pair.getBin(id);
            // mulDiv handles the 512-bit intermediate; LBToken share units are
            // ~1e60 and binX/Y are uint128, so the product overflows uint256.
            totalX += Math.mulDiv(uint256(binX), myShares, totalShares);
            totalY += Math.mulDiv(uint256(binY), myShares, totalShares);
        }
        feesX = totalX > p.principalX ? uint128(totalX - p.principalX) : 0;
        feesY = totalY > p.principalY ? uint128(totalY - p.principalY) : 0;
    }

    // --- mutations ---

    /**
     * @notice Mint a new LP position.
     * @param pair        LBPair the position belongs to (must be a factory-known pair).
     * @param amountX     TokenX to deposit (pulled from caller).
     * @param amountY     TokenY to deposit (pulled from caller).
     * @param liquidityConfigs  LB-packed (distributionX, distributionY, binId) triples.
     * @param to          Recipient of the position NFT.
     * @param name        Optional .init display name (empty string for none).
     */
    function mintPosition(
        ILBPair pair,
        uint128 amountX,
        uint128 amountY,
        bytes32[] calldata liquidityConfigs,
        address to,
        string calldata name
    ) external nonReentrant returns (uint256 tokenId) {
        _checkPair(pair);

        IERC20 tokenX = pair.getTokenX();
        IERC20 tokenY = pair.getTokenY();
        if (amountX > 0) tokenX.safeTransferFrom(msg.sender, address(pair), amountX);
        if (amountY > 0) tokenY.safeTransferFrom(msg.sender, address(pair), amountY);

        (bytes32 amountsReceived,, uint256[] memory liquidityMinted) =
            pair.mint(address(this), liquidityConfigs, msg.sender);

        tokenId = _nextId++;
        Position storage p = _positions[tokenId];
        p.pair = address(pair);
        p.binIds = _extractBinIds(liquidityConfigs);
        p.liquidity = liquidityMinted;
        p.principalX = amountsReceived.decodeX();
        p.principalY = amountsReceived.decodeY();

        _safeMint(to, tokenId);
        if (bytes(name).length != 0) {
            initName[tokenId] = name;
            emit NameBound(tokenId, name);
        }
        emit PositionMinted(tokenId, to, address(pair), p.principalX, p.principalY);
    }

    /**
     * @notice Burn a position — withdraws full value, NFT destroyed.
     */
    function burnPosition(uint256 tokenId, address to)
        external
        nonReentrant
        returns (uint128 amountX, uint128 amountY)
    {
        _requireAuthorized(tokenId);
        Position storage p = _positions[tokenId];

        (amountX, amountY) = _withdrawAll(p, to);

        address owner = ownerOf(tokenId);
        _burn(tokenId);
        delete _positions[tokenId];
        delete initName[tokenId];
        emit PositionBurned(tokenId, owner, amountX, amountY);
    }

    /**
     * @notice Collect realized fees without closing the position.
     *         Burns all LBToken shares, takes (value - principal) as fees,
     *         and re-mints the principal into the same bins.
     */
    function collectFees(uint256 tokenId, address to)
        external
        nonReentrant
        returns (uint128 feesX, uint128 feesY)
    {
        _requireAuthorized(tokenId);
        Position storage p = _positions[tokenId];
        ILBPair pair = ILBPair(p.pair);

        // Withdraw everything.
        (uint128 totalX, uint128 totalY) = _withdrawAllToThis(p);

        // Compute fees.
        feesX = totalX > p.principalX ? totalX - p.principalX : 0;
        feesY = totalY > p.principalY ? totalY - p.principalY : 0;
        uint128 reinvestX = totalX - feesX;
        uint128 reinvestY = totalY - feesY;

        // Re-mint principal at same distribution.
        bytes32[] memory cfgs = _rebuildConfigs(p, reinvestX, reinvestY);
        if (reinvestX > 0) pair.getTokenX().safeTransfer(address(pair), reinvestX);
        if (reinvestY > 0) pair.getTokenY().safeTransfer(address(pair), reinvestY);
        (, , uint256[] memory liquidityMinted) =
            pair.mint(address(this), cfgs, address(this));
        p.liquidity = liquidityMinted;

        // Send fees out.
        if (feesX > 0) pair.getTokenX().safeTransfer(to, feesX);
        if (feesY > 0) pair.getTokenY().safeTransfer(to, feesY);

        p.feesCollectedX += feesX;
        p.feesCollectedY += feesY;
        emit FeesCollected(tokenId, ownerOf(tokenId), feesX, feesY);
    }

    /**
     * @notice Rebalance a position into a new set of bins.
     *         Realizes fees implicitly — new principal becomes
     *         whatever the current burn returns minus any optional slippage.
     *         Designed to be called inside an auto-sign session.
     */
    function rebalance(
        uint256 tokenId,
        bytes32[] calldata newConfigs
    ) external nonReentrant returns (uint128 newX, uint128 newY) {
        _requireAuthorized(tokenId);
        Position storage p = _positions[tokenId];
        ILBPair pair = ILBPair(p.pair);

        (uint128 totalX, uint128 totalY) = _withdrawAllToThis(p);

        if (totalX > 0) pair.getTokenX().safeTransfer(address(pair), totalX);
        if (totalY > 0) pair.getTokenY().safeTransfer(address(pair), totalY);
        (bytes32 amountsReceived,, uint256[] memory liquidityMinted) =
            pair.mint(address(this), newConfigs, address(this));

        p.binIds = _extractBinIds(newConfigs);
        p.liquidity = liquidityMinted;
        p.principalX = amountsReceived.decodeX();
        p.principalY = amountsReceived.decodeY();
        newX = p.principalX;
        newY = p.principalY;
        emit PositionRebalanced(tokenId, ownerOf(tokenId), newX, newY);
    }

    /**
     * @notice Bind a display name (e.g. resolved .init handle) to the NFT.
     *         Frontend-only signal — not authoritative.
     */
    function setName(uint256 tokenId, string calldata name) external {
        _requireAuthorized(tokenId);
        initName[tokenId] = name;
        emit NameBound(tokenId, name);
    }

    // --- internal ---

    function _checkPair(ILBPair pair) internal view {
        IERC20 tokenX = pair.getTokenX();
        IERC20 tokenY = pair.getTokenY();
        uint16 binStep = pair.getBinStep();
        ILBFactory.LBPairInformation memory info =
            factory.getLBPairInformation(tokenX, tokenY, binStep);
        if (address(info.LBPair) != address(pair)) revert InvalidPair();
    }

    function _requireAuthorized(uint256 tokenId) internal view {
        address owner = ownerOf(tokenId);
        if (
            msg.sender != owner
                && !isApprovedForAll(owner, msg.sender)
                && getApproved(tokenId) != msg.sender
        ) revert NotOwnerOrApproved();
    }

    function _withdrawAll(Position storage p, address to)
        internal
        returns (uint128 amountX, uint128 amountY)
    {
        ILBPair pair = ILBPair(p.pair);
        bytes32[] memory amounts = pair.burn(address(this), to, _idsAsU256(p.binIds), p.liquidity);
        for (uint256 i; i < amounts.length; ++i) {
            amountX += amounts[i].decodeX();
            amountY += amounts[i].decodeY();
        }
    }

    function _withdrawAllToThis(Position storage p)
        internal
        returns (uint128 amountX, uint128 amountY)
    {
        ILBPair pair = ILBPair(p.pair);
        bytes32[] memory amounts =
            pair.burn(address(this), address(this), _idsAsU256(p.binIds), p.liquidity);
        for (uint256 i; i < amounts.length; ++i) {
            amountX += amounts[i].decodeX();
            amountY += amounts[i].decodeY();
        }
    }

    function _idsAsU256(uint24[] storage src) internal view returns (uint256[] memory out) {
        out = new uint256[](src.length);
        for (uint256 i; i < src.length; ++i) out[i] = uint256(src[i]);
    }

    function _extractBinIds(bytes32[] calldata configs) internal pure returns (uint24[] memory ids) {
        ids = new uint24[](configs.length);
        for (uint256 i; i < configs.length; ++i) {
            // Lower 24 bits of the config encode the binId (LB LiquidityConfigurations layout).
            ids[i] = uint24(uint256(configs[i]));
        }
    }

    function _rebuildConfigs(
        Position storage p,
        uint128 reinvestX,
        uint128 reinvestY
    ) internal view returns (bytes32[] memory cfgs) {
        uint256 n = p.binIds.length;
        cfgs = new bytes32[](n);
        if (reinvestX == 0 && reinvestY == 0) return cfgs;

        // Composition rule: bins < active hold only Y, bins > active hold only X,
        // active bin holds both. We split each token uniformly across its
        // eligible bins.
        uint24 active = ILBPair(p.pair).getActiveId();
        uint256 xBins;
        uint256 yBins;
        for (uint256 i; i < n; ++i) {
            uint24 id = p.binIds[i];
            if (id >= active) ++xBins;
            if (id <= active) ++yBins;
        }
        uint64 distX = xBins == 0 ? 0 : uint64(1e18 / xBins);
        uint64 distY = yBins == 0 ? 0 : uint64(1e18 / yBins);

        for (uint256 i; i < n; ++i) {
            uint24 id = p.binIds[i];
            uint64 dx = id >= active ? distX : 0;
            uint64 dy = id <= active ? distY : 0;
            cfgs[i] = bytes32(
                (uint256(dx) << 88) | (uint256(dy) << 24) | uint256(id)
            );
        }
    }

    // --- ERC721 overrides ---

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override(ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
        // Clear display name on transfer — the new owner should set their own.
        if (from != address(0) && to != from) {
            for (uint256 i; i < batchSize; ++i) {
                delete initName[firstTokenId + i];
            }
        }
    }
}
