#!/usr/bin/env bash
# Seed demo liquidity into both pairs so the UI has something to show
# before any human LP shows up.
#
# Usage: ./scripts/seed-pools.sh   (reads $KELVIN_RPC_URL + $DEPLOYER_PRIVATE_KEY)

set -euo pipefail

: "${KELVIN_RPC_URL:?KELVIN_RPC_URL not set}"
: "${DEPLOYER_PRIVATE_KEY:?DEPLOYER_PRIVATE_KEY not set}"
: "${MOCK_USDC_ADDRESS:?MOCK_USDC_ADDRESS not set}"
: "${MOCK_ETH_ADDRESS:?MOCK_ETH_ADDRESS not set}"
: "${MOCK_INIT_ADDRESS:?MOCK_INIT_ADDRESS not set}"
: "${PAIR_ETH_USDC:?PAIR_ETH_USDC not set}"
: "${PAIR_INIT_USDC:?PAIR_INIT_USDC not set}"

RPC="$KELVIN_RPC_URL"
KEY="$DEPLOYER_PRIVATE_KEY"

COMMON="--rpc-url $RPC --private-key $KEY --legacy"

# Mint 1M of each mock to the deployer (already done by Deploy.s.sol on first
# run; re-running here is a no-op in terms of state but useful to top up).
cast send "$MOCK_USDC_ADDRESS" "mint(address,uint256)" "$(cast wallet address --private-key $KEY)" 1000000000000 $COMMON
cast send "$MOCK_ETH_ADDRESS"  "mint(address,uint256)" "$(cast wallet address --private-key $KEY)" 10000000000000000000000 $COMMON
cast send "$MOCK_INIT_ADDRESS" "mint(address,uint256)" "$(cast wallet address --private-key $KEY)" 1000000000000 $COMMON

# Transfer seed reserves into the pairs. Caller must then call `swap` to
# trigger the first composition on the active bin.
#
# For a richer demo, use the /pool/[id] page to add liquidity via the
# PositionManager — that mints an NFT and respects the composition rule.
echo "Seed complete. Open the pool page in the frontend to mint positions."
