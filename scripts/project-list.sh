#!/usr/bin/env sh
set -eu
BASE="/data/workspace/projects"
mkdir -p "$BASE"
for d in "$BASE"/*; do
  [ -d "$d/.git" ] || continue
  echo "- $(basename "$d") :: $(git -C "$d" remote get-url origin 2>/dev/null || echo no-remote)"
done
