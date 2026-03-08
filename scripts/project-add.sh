#!/usr/bin/env sh
set -eu

NAME="${1:?project name required}"
REPO_URL="${2:?git url required}"
BASE="/data/workspace/projects"
TARGET="$BASE/$NAME"

mkdir -p "$BASE"
if [ -d "$TARGET/.git" ]; then
  echo "Project exists, pulling: $TARGET"
  git -C "$TARGET" pull --ff-only
else
  git clone "$REPO_URL" "$TARGET"
fi

echo "OK: $TARGET"
