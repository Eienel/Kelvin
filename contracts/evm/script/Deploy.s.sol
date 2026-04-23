// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {Script, console2} from "forge-std/Script.sol";
import {LBFactory} from "../src/lb/LBFactory.sol";
import {LBPair} from "../src/lb/LBPair.sol";
import {LBRouter} from "../src/lb/LBRouter.sol";
import {LBQuoter} from "../src/lb/LBQuoter.sol";
import {IERC20} from "openzeppelin/token/ERC20/IERC20.sol";
import {ILBFactory} from "../src/lb/interfaces/ILBFactory.sol";
import {ILBPair} from "../src/lb/interfaces/ILBPair.sol";
import {IWNATIVE} from "../src/lb/interfaces/IWNATIVE.sol";
import {IJoeFactory} from "../src/lb/interfaces/IJoeFactory.sol";
import {ILBLegacyFactory} from "../src/lb/interfaces/ILBLegacyFactory.sol";
import {ILBLegacyRouter} from "../src/lb/interfaces/ILBLegacyRouter.sol";

import {KelvinPositionManager} from "../src/KelvinPositionManager.sol";
import {KelvinFeeRouter} from "../src/KelvinFeeRouter.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockWNATIVE} from "../src/mocks/MockWNATIVE.sol";

/**
 * @notice Deploys the full Kelvin stack to the Kelvin MiniEVM appchain.
 *         Usage:
 *           forge script script/Deploy.s.sol:Deploy \
 *             --rpc-url $KELVIN_RPC_URL \
 *             --private-key $DEPLOYER_PRIVATE_KEY \
 *             --broadcast --legacy --slow
 */
contract Deploy is Script {
    // Fee preset chosen for the demo pairs.
    // Matches Trader Joe's widely-used 0.25% base static-fee tier.
    uint16 constant BIN_STEP = 25;
    uint16 constant BASE_FACTOR = 1_000;
    uint16 constant FILTER_PERIOD = 30;
    uint16 constant DECAY_PERIOD = 600;
    uint16 constant REDUCTION_FACTOR = 5_000;
    uint24 constant VARIABLE_FEE_CONTROL = 40_000;
    uint16 constant PROTOCOL_SHARE = 1_000; // 10% of swap fees to protocol
    uint24 constant MAX_VOL_ACCUMULATOR = 350_000;

    uint24 constant START_ACTIVE_ID = 8_388_608; // 2^23, price = 1.0

    function run() external {
        uint256 pk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(pk);
        vm.startBroadcast(pk);

        // --- tokens ---
        MockERC20 usdc = new MockERC20("USD Coin (mock)", "mUSDC", 6);
        MockERC20 eth = new MockERC20("Ether (mock)", "mETH", 18);
        MockERC20 init = new MockERC20("INIT (mock)", "mINIT", 6);
        MockWNATIVE wnative = new MockWNATIVE();

        // --- fee router + factory ---
        KelvinFeeRouter feeRouter = new KelvinFeeRouter(deployer);
        LBFactory factory = new LBFactory(address(feeRouter), 0);

        // LBPair implementation (clone target for all pairs)
        LBPair pairImpl = new LBPair(ILBFactory(address(factory)));
        factory.setLBPairImplementation(address(pairImpl));

        // Register quote assets so createLBPair works for X/Y orderings.
        factory.addQuoteAsset(IERC20(address(usdc)));
        factory.addQuoteAsset(IERC20(address(init)));

        // Preset for our single bin-step tier.
        factory.setPreset(
            BIN_STEP,
            BASE_FACTOR,
            FILTER_PERIOD,
            DECAY_PERIOD,
            REDUCTION_FACTOR,
            VARIABLE_FEE_CONTROL,
            PROTOCOL_SHARE,
            MAX_VOL_ACCUMULATOR,
            true // isOpen
        );

        // --- pairs: ETH/USDC, INIT/USDC ---
        ILBPair ethUsdc = factory.createLBPair(
            IERC20(address(eth)), IERC20(address(usdc)), START_ACTIVE_ID, BIN_STEP
        );
        ILBPair initUsdc = factory.createLBPair(
            IERC20(address(init)), IERC20(address(usdc)), START_ACTIVE_ID, BIN_STEP
        );

        // --- router + quoter (unused by Kelvin's UI but LB-standard) ---
        LBRouter router = new LBRouter(
            ILBFactory(address(factory)),
            IJoeFactory(address(0)),
            ILBLegacyFactory(address(0)),
            ILBLegacyRouter(address(0)),
            IWNATIVE(address(wnative))
        );
        LBQuoter quoter = new LBQuoter(
            address(0),
            address(0),
            address(factory),
            address(0),
            address(router)
        );

        // --- Kelvin position manager ---
        KelvinPositionManager pm = new KelvinPositionManager(ILBFactory(address(factory)));

        // --- seed deployer with demo balances so the first swap works ---
        usdc.mint(deployer, 10_000_000 * 1e6);
        eth.mint(deployer, 10_000 * 1e18);
        init.mint(deployer, 10_000_000 * 1e6);

        vm.stopBroadcast();

        console2.log("--- Kelvin deployment ---");
        console2.log("mUSDC:           ", address(usdc));
        console2.log("mETH:            ", address(eth));
        console2.log("mINIT:           ", address(init));
        console2.log("wNATIVE:         ", address(wnative));
        console2.log("FeeRouter:       ", address(feeRouter));
        console2.log("LBFactory:       ", address(factory));
        console2.log("LBPair impl:     ", address(pairImpl));
        console2.log("LBRouter:        ", address(router));
        console2.log("LBQuoter:        ", address(quoter));
        console2.log("PositionManager: ", address(pm));
        console2.log("ETH/USDC pair:   ", address(ethUsdc));
        console2.log("INIT/USDC pair:  ", address(initUsdc));
    }
}
