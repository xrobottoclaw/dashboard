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

## Control API (OpenClaw -> Dashboard)
Control API, JWT değil **X-API-Key** kullanır.

```bash
# görev oluştur
curl -X POST http://127.0.0.1:3100/api/control/task \
  -H 'X-API-Key: <DASHBOARD_API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"X görevini yap","actor":"atlas"}'

# göreve agent ata
curl -X POST http://127.0.0.1:3100/api/control/task/<TASK_ID>/assign \
  -H 'X-API-Key: <DASHBOARD_API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"assignee":"frontend-developer"}'

# heartbeat ayarı
curl -X POST http://127.0.0.1:3100/api/control/heartbeat \
  -H 'X-API-Key: <DASHBOARD_API_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"intervalMin":20,"enabled":true}'
```

## Dashboard Skill
OpenClaw için hazır skill şablonu: `dashboard-skill.md`
