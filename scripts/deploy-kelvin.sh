#!/usr/bin/env bash
# Deploy the Kelvin contract stack onto the running rollup.
# Reads values from .env; writes addresses back into .env.
#
# Prereqs:
#   - Rollup is running: ./scripts/launch-rollup.sh up
#   - .env has KELVIN_RPC_URL + DEPLOYER_PRIVATE_KEY set

set -euo pipefail

log() { printf "\n\033[1;33m→ %s\033[0m\n" "$*"; }
ok()  { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
die() { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; exit 1; }

# Load .env from repo root.
cd "$(dirname "$0")/.."
if [ ! -f .env ]; then
  cp .env.example .env
  die ".env didn't exist — copied .env.example. Fill in KELVIN_RPC_URL and DEPLOYER_PRIVATE_KEY, then re-run."
fi
# shellcheck disable=SC1091
set -a; source .env; set +a

: "${KELVIN_RPC_URL:?KELVIN_RPC_URL not set in .env}"
: "${DEPLOYER_PRIVATE_KEY:?DEPLOYER_PRIVATE_KEY not set in .env}"

export PATH="$HOME/.foundry/bin:$PATH"

log "Deploying Kelvin stack to $KELVIN_RPC_URL"
cd contracts/evm
forge script script/Deploy.s.sol:Deploy \
  --rpc-url "$KELVIN_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --broadcast --legacy --slow \
  --gas-estimate-multiplier 250 \
  2>&1 | tee /tmp/kelvin-deploy.log

log "Extracting addresses"
# Prefer the broadcast artifact (JSON) for reliability.
CHAIN_ID_DEC=$(curl -fsS -X POST "$KELVIN_RPC_URL" \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  | jq -r '.result' | awk '{printf "%d", $0}')
ARTIFACT="broadcast/Deploy.s.sol/$CHAIN_ID_DEC/run-latest.json"
[ -f "$ARTIFACT" ] || die "broadcast artifact not found at $ARTIFACT"

declare -A addrs
while IFS='=' read -r name addr; do
  addrs[$name]="$addr"
done < <(jq -r '.transactions[] | select(.transactionType=="CREATE") | "\(.contractName)=\(.contractAddress)"' "$ARTIFACT")

cd ../..

# Map contract names → .env keys the frontend expects.
set_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${val}|" .env
  else
    echo "${key}=${val}" >> .env
  fi
}

# Best-effort mapping — Deploy.s.sol creates contracts in a fixed order.
set_env NEXT_PUBLIC_KELVIN_CHAIN_ID "$KELVIN_CHAIN_ID"
set_env NEXT_PUBLIC_KELVIN_RPC_URL "$KELVIN_RPC_URL"
set_env NEXT_PUBLIC_KELVIN_EXPLORER_URL "${KELVIN_EXPLORER_URL:-https://scan.testnet.initia.xyz/kelvin-1}"
set_env NEXT_PUBLIC_LB_FACTORY_ADDRESS "${addrs[LBFactory]:-}"
set_env NEXT_PUBLIC_LB_ROUTER_ADDRESS "${addrs[LBRouter]:-}"
set_env NEXT_PUBLIC_POSITION_MANAGER_ADDRESS "${addrs[KelvinPositionManager]:-}"
set_env NEXT_PUBLIC_FEE_ROUTER_ADDRESS "${addrs[KelvinFeeRouter]:-}"
# Mock tokens — identify by index since MockERC20 repeats the contract name.
mocks=()
while IFS= read -r a; do mocks+=("$a"); done < <(jq -r '.transactions[] | select(.contractName=="MockERC20") | .contractAddress' "$ARTIFACT")
set_env NEXT_PUBLIC_MOCK_USDC_ADDRESS "${mocks[0]:-}"
set_env NEXT_PUBLIC_MOCK_ETH_ADDRESS "${mocks[1]:-}"
set_env NEXT_PUBLIC_MOCK_INIT_ADDRESS "${mocks[2]:-}"

# Pairs come from createLBPair CALLs, not CREATEs. Extract from logs.
pairs=()
while IFS= read -r a; do pairs+=("$a"); done < <(jq -r '
  .receipts[]?.logs[]?
  | select(.topics[0] == "0xde1ef2e7c25e7db1fa7a3159fb36bf8f7b7e43a4c1e6ee51f7e0df4a3c5c0a1c")
  | .topics[3]
' "$ARTIFACT" 2>/dev/null | awk '{ print "0x" substr($0, length($0)-39) }' || true)
set_env NEXT_PUBLIC_PAIR_ETH_USDC "${pairs[0]:-}"
set_env NEXT_PUBLIC_PAIR_INIT_USDC "${pairs[1]:-}"

# Mirror .env → frontend/.env.local for Next.js to see NEXT_PUBLIC_*.
grep '^NEXT_PUBLIC_' .env > frontend/.env.local || true

ok "Deployed. Addresses written to .env and frontend/.env.local"
cat <<EOF

╭─────────────────────────────────────────────────────────────────╮
│  Next: cd frontend && pnpm dev                                  │
╰─────────────────────────────────────────────────────────────────╯
EOF
