#!/usr/bin/env sh
set -eu

SSH_DIR="/root/.ssh"
PRIV="$SSH_DIR/id_ed25519"
PUB="$SSH_DIR/id_ed25519.pub"
KNOWN="$SSH_DIR/known_hosts"

# Public key provided by Emre
PUB_CONTENT='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKNRbgnrWZAjRcJG+e7061x1R8JCqeCPnpVs5pdmhZF4 robottoclaw@gmail.com'

mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

# Ensure known_hosts has github.com
if ! grep -q 'github.com' "$KNOWN" 2>/dev/null; then
  ssh-keyscan github.com >> "$KNOWN" 2>/dev/null || true
fi
chmod 644 "$KNOWN" 2>/dev/null || true

# Ensure public key exists (informational)
if [ ! -f "$PUB" ]; then
  printf '%s\n' "$PUB_CONTENT" > "$PUB"
  chmod 644 "$PUB"
fi

if [ ! -f "$PRIV" ]; then
  echo "[init-github-ssh] Missing $PRIV"
  echo "Provide private key (id_ed25519) securely, then rerun."
  exit 1
fi

chmod 600 "$PRIV"

# Quick auth test
ssh -o StrictHostKeyChecking=accept-new -T git@github.com || true

echo "[init-github-ssh] done"
