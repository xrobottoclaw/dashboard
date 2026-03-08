---
name: dashboard-ops
description: Operate OpenClaw through the dashboard API. Use when creating/updating tasks, assigning agents, managing skills, updating heartbeat cadence, and posting status reports so operations stay visible in the dashboard.
---

# Dashboard Ops

Use dashboard API as source-of-truth for operations visibility.

## Auth
- Header: `X-API-Key: ${DASHBOARD_API_KEY}`
- Base URL: `http://dashboard:3100`

## Core flows
1. Create/update task via `/api/tasks`
2. Assign agent via `/api/agents` + `/api/skills/:id/assign`
3. Emit progress logs via `/api/tasks/:id/log`
4. Update heartbeat via `/api/agents/:id/heartbeat`
5. Post summary report via `/api/control/report`

## Rule
- Always write operational state changes to dashboard endpoints.
- Keep task status in sync (`queued` → `in_progress` → `done/failed`).
- Include concise logs for observability.
