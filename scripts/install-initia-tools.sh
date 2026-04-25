#!/usr/bin/env bash
# Install the Initia daemons needed to run the Kelvin rollup:
#   - weave:     operator / launcher CLI (includes relayer + opinit subcommands)
#   - minitiad:  the MiniEVM rollup node itself
#   - opinitd:   optimistic-rollup bridge executor
#   - hermes:    IBC relayer (ships with weave, no separate install)
#
# Installs into $HOME/.local/bin so no sudo is needed.
#
# Strategy:
#   1) Try `go install` from the canonical Initia Labs repos (works everywhere
#      Go is installed — including Codespaces via the devcontainer feature).
#   2) If that fails, fall back to prebuilt GitHub release binaries.
#   3) If both fail, print actionable error and bail.

set -euo pipefail

log() { printf "\n\033[1;33m→ %s\033[0m\n" "$*"; }
ok()  { printf "\033[1;32m✓ %s\033[0m\n" "$*"; }
warn(){ printf "\033[1;33m! %s\033[0m\n" "$*"; }
die() { printf "\033[1;31m✗ %s\033[0m\n" "$*" >&2; exit 1; }

mkdir -p "$HOME/.local/bin"
export PATH="$HOME/.local/bin:$HOME/go/bin:$PATH"

require_go() {
  if ! command -v go >/dev/null; then
    die "Go not found. Install Go 1.22+ first (Codespaces devcontainer feature adds it automatically)."
  fi
  ok "go $(go version | awk '{print $3}')"
}

install_via_go() {
  local module="$1"
  log "go install $module"
  if go install "$module" 2>&1; then
    ok "installed from $module"
    return 0
  fi
  warn "go install failed for $module"
  return 1
}

ARCH="$(uname -m)"
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
case "$ARCH" in
  x86_64|amd64) ARCH=amd64; ARCH_ALT=x86_64 ;;
  aarch64|arm64) ARCH=arm64; ARCH_ALT=aarch64 ;;
  *) die "unsupported arch $ARCH" ;;
esac

install_release() {
  local repo="$1" bin="$2"
  log "github releases: $repo"
  local url
  url="$(curl -fsSL "https://api.github.com/repos/$repo/releases/latest" \
    | jq -r ".assets[] | select(.name|test(\"${OS}.*${ARCH}|${ARCH}.*${OS}|${OS}.*${ARCH_ALT}|${ARCH_ALT}.*${OS}\"; \"i\")) | .browser_download_url" \
    | head -1)"
  if [ -z "$url" ] || [ "$url" = "null" ]; then
    warn "no release asset matched ${OS}_${ARCH} in $repo"
    return 1
  fi
  log "downloading $url"
  local tmp
  tmp="$(mktemp -d)"
  curl -fsSL "$url" -o "$tmp/dl"
  case "$url" in
    *.tar.gz) tar -xzf "$tmp/dl" -C "$tmp" ;;
    *.zip)    unzip -q "$tmp/dl" -d "$tmp" ;;
    *)        mv "$tmp/dl" "$tmp/$bin" ;;
  esac
  local found
  found="$(find "$tmp" -type f -name "$bin" -executable 2>/dev/null | head -1)"
  [ -z "$found" ] && found="$(find "$tmp" -type f -name "$bin" 2>/dev/null | head -1)"
  [ -z "$found" ] && { warn "couldn't locate $bin binary in archive"; return 1; }
  install -m 0755 "$found" "$HOME/.local/bin/$bin"
  ok "installed $bin at $HOME/.local/bin/$bin"
}

require_go

# ---------- weave ----------
if ! command -v weave >/dev/null; then
  install_via_go "github.com/initia-labs/weave@latest" \
    || install_release "initia-labs/weave" "weave" \
    || die "could not install weave — see https://github.com/initia-labs/weave/releases"
fi
weave version 2>/dev/null || warn "weave installed but 'weave version' errored"

# ---------- minitiad (MiniEVM rollup node) ----------
if ! command -v minitiad >/dev/null; then
  install_via_go "github.com/initia-labs/minievm/cmd/minitiad@latest" \
    || install_release "initia-labs/minievm" "minitiad" \
    || die "could not install minitiad — see https://github.com/initia-labs/minievm/releases"
fi
minitiad version 2>/dev/null || warn "minitiad installed but 'minitiad version' errored"

# ---------- opinitd (bridge executor) ----------
if ! command -v opinitd >/dev/null; then
  install_via_go "github.com/initia-labs/opinit-bots/cmd/opinitd@latest" \
    || install_release "initia-labs/opinit-bots" "opinitd" \
    || die "could not install opinitd — see https://github.com/initia-labs/opinit-bots/releases"
fi
opinitd version 2>/dev/null || warn "opinitd installed but 'opinitd version' errored"

cat <<EOF

╭─────────────────────────────────────────────────────────────────╮
│  Initia daemons installed.                                      │
│                                                                 │
│  Next:  ./scripts/launch-rollup.sh                              │
╰─────────────────────────────────────────────────────────────────╯
EOF
