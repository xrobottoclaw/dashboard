# OpenClaw Yönetim Dashboard

Operasyon odaklı dashboard: React + Express + WebSocket.

## Mimari (karar)
- OpenClaw: mevcut container
- Dashboard: **aynı VPS'te ayrı container**
- Yayın: sadece Tailscale/private network
- Tek container içinde API + UI aynı porttan servis edilir (**3100**)

Detay: `docs/ARCHITECTURE.md`

## Özellik Başlıkları
1. Overview
2. Tasks
3. Live Logs
4. File Manager
5. Agent Config
6. API Keys & Security
7. History/Analytics

## Kurulum (GitHub)
```bash
git clone git@github.com:xrobottoclaw/dashboard.git
cd dashboard
cp .env.example .env
```

`.env` düzenle:
- `DASHBOARD_BIND_IP=100.90.28.62`
- `DASHBOARD_API_KEY=...`
- `OPENCLAW_BASE_URL=http://127.0.0.1:18789`
- `OPENCLAW_GATEWAY_TOKEN=...`
- `JWT_SECRET=...`

Başlat:
```bash
docker compose up -d --build
```

Kontrol:
```bash
docker compose ps
curl -s http://127.0.0.1:3100/health
curl -I http://100.90.28.62:3100
```

Aç:
- `http://100.90.28.62:3100`
- veya `http://claw.taila2b846.ts.net:3100`

## API Tasarımı (OpenClaw + UI)
Hem JWT hem `X-API-Key` ile çalışır (OpenClaw için API Key önerilir).

- `GET /api/health`
- `GET /api/system/stats`
- `GET/POST /api/tasks`, `GET/PUT/DELETE /api/tasks/:id`
- `POST /api/tasks/:id/log`, `POST /api/tasks/:id/cancel`, `POST /api/tasks/:id/restart`
- `GET/POST /api/agents`, `GET/PUT/DELETE /api/agents/:id`
- `PUT /api/agents/:id/heartbeat`, `POST /api/agents/:id/start`, `POST /api/agents/:id/stop`
- `GET/POST /api/skills`, `PUT/DELETE /api/skills/:id`, `POST /api/skills/:id/assign`
- `GET /api/files`, `GET /api/files/content`, `PUT /api/files/content`, `POST /api/files/mkdir`, `DELETE /api/files`
- `GET/PUT /api/config`, `GET/POST/DELETE /api/keys`
- `GET /api/analytics/tasks`, `GET /api/analytics/costs`, `GET /api/analytics/agents`
- `GET /api/logs`, `GET /api/logs/export`
- `WS /ws/logs`, `WS /ws/tasks`, `WS /ws/system`

## GitHub SSH Init (restart sonrası)
Container restart sonrası SSH key erişimi dalgalanırsa:

```bash
# Coolify secret önerisi (birini kullan)
# GITHUB_SSH_PRIVATE_KEY=<raw private key>
# veya
# GITHUB_SSH_PRIVATE_KEY_B64=<base64 private key>
# opsiyonel:
# GITHUB_SSH_PUBLIC_KEY=<public key>
# (anahtarları repoya asla yazma)

./scripts/init-github-ssh.sh
```

Script:
- `known_hosts` içine github.com ekler
- private/public key'i env secret'tan restore eder
- `ssh -T git@github.com` ile doğrular

## Dashboard Skill
OpenClaw için hazır skill şablonu: `dashboard-skill.md`
