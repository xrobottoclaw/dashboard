#!/usr/bin/env bash
set -euo pipefail

# Mission Control task helper
# Usage examples:
#   MC_URL=http://100.86.181.56:4000 ./scripts/mc-task.sh create "Title" "Desc" "execution"
#   MC_URL=http://100.86.181.56:4000 ./scripts/mc-task.sh update <task_id> in_progress
#   MC_URL=http://100.86.181.56:4000 ./scripts/mc-task.sh activity <task_id> "Build started"
#   MC_URL=http://100.86.181.56:4000 ./scripts/mc-task.sh deliver <task_id> "API docs" "https://example.com"

MC_URL="${MC_URL:-http://100.86.181.56:4000}"
MC_TOKEN="${MC_TOKEN:-${MC_API_TOKEN:-}}"

api() {
  local method="$1"; shift
  local path="$1"; shift
  local data="${1:-}"

  local -a headers=( -H "Content-Type: application/json" )
  if [[ -n "$MC_TOKEN" ]]; then
    headers+=( -H "Authorization: Bearer $MC_TOKEN" )
  fi

  if [[ -n "$data" ]]; then
    curl -sS -X "$method" "$MC_URL$path" "${headers[@]}" -d "$data"
  else
    curl -sS -X "$method" "$MC_URL$path" "${headers[@]}"
  fi
}

cmd="${1:-}"; shift || true

case "$cmd" in
  create)
    title="${1:?title required}"
    description="${2:?description required}"
    agent_id="${3:-execution}"
    api POST "/api/tasks" "{\"title\":\"$title\",\"description\":\"$description\",\"agent_id\":\"$agent_id\"}"
    ;;
  update)
    task_id="${1:?task_id required}"
    status="${2:?status required}"
    api PATCH "/api/tasks/$task_id" "{\"status\":\"$status\"}"
    ;;
  activity)
    task_id="${1:?task_id required}"
    message="${2:?message required}"
    api POST "/api/tasks/$task_id/activities" "{\"message\":\"$message\",\"type\":\"progress\"}"
    ;;
  subagent)
    task_id="${1:?task_id required}"
    agent_id="${2:?agent_id required}"
    session_id="${3:?session_id required}"
    api POST "/api/tasks/$task_id/subagent" "{\"agent_id\":\"$agent_id\",\"session_id\":\"$session_id\"}"
    ;;
  deliver)
    task_id="${1:?task_id required}"
    title="${2:?title required}"
    content="${3:?content required}"
    api POST "/api/tasks/$task_id/deliverables" "{\"title\":\"$title\",\"content\":\"$content\",\"kind\":\"text\"}"
    ;;
  *)
    echo "Usage: $0 {create|update|activity|subagent|deliver} ..." >&2
    exit 1
    ;;
esac
