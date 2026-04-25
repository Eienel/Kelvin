#!/usr/bin/env bash
# Launch the Kelvin MiniEVM appchain in a tmux session.
#
# Usage:
#   ./scripts/launch-rollup.sh [init|up|down|logs|status]
#
#   init    — runs `weave init` interactively to create the rollup config.
#             Answer: network=initiation-2, chain_id=kelvin-1, vm=EVM,
#             da=Initia L1, fee denom=uinit. You'll be asked for your
#             operator key / mnemonic (testnet only — don't use mainnet
#             keys).
#
#   up      — starts minitiad, opinitd (executor), hermes relayer in
#             separate tmux panes inside a session named 'kelvin'.
#
#   down    — stops all three daemons and kills the tmux session.
#
#   logs    — attaches to the tmux session (Ctrl-b d to detach).
#
#   status  — block height + EVM chain ID + L1 peer health.

set -euo pipefail

SESSION="kelvin"

log() { printf "\n\033[1;33m→ %s\033[0m\n" "$*"; }
ok()  { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
die() { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; exit 1; }

need() { command -v "$1" >/dev/null || die "$1 not installed — run ./scripts/install-initia-tools.sh"; }

cmd="${1:-up}"

case "$cmd" in
  init)
    need weave
    log "Running interactive weave init"
    echo
    echo "Answers you want:"
    echo "  Network:          Testnet (initiation-2)"
    echo "  Chain ID:         kelvin-1"
    echo "  Chain name:       Kelvin"
    echo "  VM:               EVM"
    echo "  DA:               Initia L1"
    echo "  Fee denom:        uinit"
    echo "  Gas price:        0.015uinit (default)"
    echo "  Operator key:     (paste from your testnet-funded account)"
    echo
    weave init
    weave opinit init executor || true
    weave relayer init || true
    ok "init complete — run ./scripts/launch-rollup.sh up"
    ;;

  up)
    need weave
    need minitiad
    need tmux

    if tmux has-session -t "$SESSION" 2>/dev/null; then
      log "Session '$SESSION' already exists. Use 'down' to stop it first."
      exit 0
    fi

    log "Starting daemons in tmux session '$SESSION'"
    tmux new-session -d -s "$SESSION" -n rollup "minitiad start --home $HOME/.minitia 2>&1 | tee /tmp/kelvin-minitiad.log"
    tmux split-window -v -t "$SESSION:rollup" "weave opinit start executor 2>&1 | tee /tmp/kelvin-opinit.log"
    tmux split-window -v -t "$SESSION:rollup" "weave relayer start 2>&1 | tee /tmp/kelvin-relayer.log"
    tmux select-layout -t "$SESSION:rollup" tiled

    ok "Daemons started."
    echo
    echo "  ./scripts/launch-rollup.sh logs    # attach"
    echo "  ./scripts/launch-rollup.sh status  # one-shot health"
    ;;

  down)
    tmux kill-session -t "$SESSION" 2>/dev/null || true
    pkill -f "minitiad start" 2>/dev/null || true
    pkill -f "opinit start" 2>/dev/null || true
    pkill -f "hermes start" 2>/dev/null || true
    ok "stopped"
    ;;

  logs)
    tmux attach -t "$SESSION"
    ;;

  status)
    log "Cosmos block height (localhost:26657)"
    curl -fsS http://localhost:26657/status 2>/dev/null \
      | jq -r '.result.sync_info | "  height: \(.latest_block_height)  time: \(.latest_block_time)"' \
      || die "Cosmos RPC not responding — daemons may still be starting."

    log "EVM chain ID (localhost:8545)"
    curl -fsS -X POST http://localhost:8545 \
      -H 'content-type: application/json' \
      -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
      | jq -r '"  chainId: \(.result) (" + (.result[2:] | tonumber // 0 | tostring) + ")"'

    log "L1 peer (rpc.testnet.initia.xyz)"
    curl -fsS https://rpc.testnet.initia.xyz/status 2>/dev/null \
      | jq -r '.result.sync_info | "  L1 height: \(.latest_block_height)"' \
      || echo "  warn: cannot reach L1 RPC"
    ;;

  *)
    die "unknown command: $cmd  (use init|up|down|logs|status)"
    ;;
esac
