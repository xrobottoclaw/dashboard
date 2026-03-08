#!/usr/bin/env sh
set -eu

ROOT="/data/workspace"
PROJECTS="$ROOT/projects"

mkdir -p "$PROJECTS"

# Link current repo as dashboard (if not already)
ln -sfn "$ROOT" "$PROJECTS/dashboard"

# Auto-link other git repos directly under /data/workspace/*
for d in "$ROOT"/*; do
  [ -d "$d" ] || continue
  [ "$(basename "$d")" = "projects" ] && continue
  [ -d "$d/.git" ] || continue
  name="$(basename "$d")"
  ln -sfn "$d" "$PROJECTS/$name"
done

echo "Projects directory ready: $PROJECTS"
ls -la "$PROJECTS"
