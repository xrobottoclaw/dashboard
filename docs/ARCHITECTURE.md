# OpenClaw Dashboard Architecture (Operational)

## Current Operation

- Emre (Telegram/PC) -> OpenClaw
- OpenClaw executes tasks, edits files, spawns sub-agents
- Dashboard visibility is limited/inconsistent

## Target Operation

- Emre -> Telegram -> OpenClaw
- OpenClaw can call Dashboard API for:
  - task create/update/assign
  - skill update records
  - heartbeat configuration updates
  - status reporting
- Dashboard UI shows real-time operational state:
  - task pipeline
  - agent/sub-agent activity
  - live logs
  - usage/cost trends

## Deployment Decision

**Recommended:** Same VPS, separate dashboard container, managed in Coolify stack.

Why:
- Same host/network: low-latency API/WS
- Same workspace mounts possible
- Independent lifecycle from OpenClaw container
- Safer upgrades and restarts

## Rejected Options

- OpenClaw container internal deployment
  - fragile lifecycle
  - port publishing limitations
- Different VPS deployment
  - network + storage context split
- Direct host process (docker dışı)
  - weak ops manageability, manual maintenance

## Runtime Topology

- `dashboard-backend` (Express)
- `dashboard-frontend` (Vite dev or built static serving)
- Internal bridge network between FE/BE
- Backend connects to OpenClaw Gateway (`OPENCLAW_BASE_URL` + token)
- Frontend exposed only via Tailscale IP / private hostname

## Security Baseline

- Tailnet-only exposure
- JWT auth for dashboard UI
- gateway token in env only (never commit)
- masked API keys in UI
- audit-friendly activity events
