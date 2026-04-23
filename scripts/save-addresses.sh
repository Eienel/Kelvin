#!/usr/bin/env bash
# Parse the forge broadcast artifact to produce a .env snippet for the
# frontend.  Run after `forge script Deploy.s.sol --broadcast`.
#
# Usage: ./scripts/save-addresses.sh <chain-id-decimal>

set -euo pipefail

CHAIN_ID="${1:-48888}"
FILE="contracts/evm/broadcast/Deploy.s.sol/${CHAIN_ID}/run-latest.json"

if [ ! -f "$FILE" ]; then
  echo "Broadcast artifact not found at $FILE" >&2
  exit 1
fi

jq -r '
  .transactions
  | map(select(.transactionType == "CREATE"))
  | .[]
  | "\(.contractName)=\(.contractAddress)"
' "$FILE"

echo "# Copy the above into .env under NEXT_PUBLIC_* keys as needed."
