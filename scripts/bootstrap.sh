#!/usr/bin/env bash
# Kelvin bootstrap — installs everything deterministic.
# Runs on Codespaces post-create, safe to re-run manually.
#
# What this does:
#   1) System deps (jq, tmux, build-essential)
#   2) Foundry (forge, cast, anvil)
#   3) pnpm
#   4) Foundry libs (forge-std, openzeppelin)
#   5) Frontend deps (pnpm install)
#   6) Sanity-check: `forge test` — must be 5/5
#
# What this does NOT do:
#   - Install the Initia daemons (weave, minitiad, opinitd). Run
#     ./scripts/install-initia-tools.sh for that.
#   - Launch the rollup. Run ./scripts/launch-rollup.sh.

set -euo pipefail

log() { printf "\n\033[1;33m→ %s\033[0m\n" "$*"; }
ok()  { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
die() { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; exit 1; }

log "1/6  System deps"
if command -v apt-get >/dev/null; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq jq tmux curl build-essential
fi
ok "apt deps"

log "2/6  Foundry"
export PATH="$HOME/.foundry/bin:$PATH"
if ! command -v forge >/dev/null; then
  curl -fsSL https://foundry.paradigm.xyz | bash
  export PATH="$HOME/.foundry/bin:$PATH"
  foundryup
fi
forge --version
ok "foundry"

log "3/6  pnpm"
if ! command -v pnpm >/dev/null; then
  npm install -g pnpm@10
fi
pnpm --version
ok "pnpm"

log "4/6  Foundry libs"
cd contracts/evm
if [ ! -d lib/forge-std ]; then
  forge install --no-git foundry-rs/forge-std
fi
if [ ! -d lib/openzeppelin-contracts ]; then
  forge install --no-git OpenZeppelin/openzeppelin-contracts@v4.9.6
fi
ok "forge libs"

log "5/6  Frontend deps"
cd ../../frontend
pnpm install --prefer-offline
ok "frontend deps"

log "6/6  Sanity — forge test"
cd ../contracts/evm
forge test
ok "tests green"

cat <<EOF

╭─────────────────────────────────────────────────────────────────╮
│  Kelvin is ready to build.                                      │
│                                                                 │
│  Next steps:                                                    │
│    ./scripts/install-initia-tools.sh    # weave, minitiad, ...  │
│    ./scripts/launch-rollup.sh           # brings up kelvin-1    │
│    ./scripts/deploy-kelvin.sh           # deploys contracts     │
│    cd frontend && pnpm dev              # frontend on :3000     │
╰─────────────────────────────────────────────────────────────────╯
EOF
