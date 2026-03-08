#!/usr/bin/env sh
set -eu

SSH_DIR="/root/.ssh"
PRIV="$SSH_DIR/id_ed25519"
PUB="$SSH_DIR/id_ed25519.pub"
KNOWN="$SSH_DIR/known_hosts"

mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

# known_hosts
if ! grep -q 'github.com' "$KNOWN" 2>/dev/null; then
  ssh-keyscan github.com >> "$KNOWN" 2>/dev/null || true
fi
chmod 644 "$KNOWN" 2>/dev/null || true

# Private key restore (from env secret)
# - GITHUB_SSH_PRIVATE_KEY: raw multi-line private key
# - GITHUB_SSH_PRIVATE_KEY_B64: base64 encoded private key
if [ ! -f "$PRIV" ]; then
  if [ -n "${GITHUB_SSH_PRIVATE_KEY_B64:-}" ]; then
    printf '%s' "$GITHUB_SSH_PRIVATE_KEY_B64" | base64 -d > "$PRIV"
  elif [ -n "${GITHUB_SSH_PRIVATE_KEY:-}" ]; then
    printf '%s\n' "$GITHUB_SSH_PRIVATE_KEY" > "$PRIV"
  fi
fi

# Public key restore (optional)
if [ ! -f "$PUB" ] && [ -n "${GITHUB_SSH_PUBLIC_KEY:-}" ]; then
  printf '%s\n' "$GITHUB_SSH_PUBLIC_KEY" > "$PUB"
fi

chmod 600 "$PRIV" 2>/dev/null || true
chmod 644 "$PUB" 2>/dev/null || true

if [ ! -f "$PRIV" ]; then
  echo "[init-github-ssh] Missing $PRIV"
  echo "Set GITHUB_SSH_PRIVATE_KEY or GITHUB_SSH_PRIVATE_KEY_B64 and rerun."
  exit 1
fi

ssh -o StrictHostKeyChecking=accept-new -T git@github.com || true

echo "[init-github-ssh] done"
