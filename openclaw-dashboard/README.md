# OpenClaw Yönetim Dashboard

React (Vite) + Tailwind + Express + WebSocket tabanlı yönetim paneli.

## İçerik
- JWT login
- Overview (task stats, CPU/RAM/Disk)
- Tasks (filtre + detay + cancel/restart)
- Live Logs (WS + TXT/JSON export)
- File Manager (list/read/write/mkdir/rename/delete/download)
- Web Terminal (xterm.js)
- Settings + Analytics
- OpenClaw upstream proxy: `/api/openclaw/*`

---

## 1) GitHub’dan kurulum (önerilen)

```bash
git clone git@github.com:xrobottoclaw/dashboard.git
cd dashboard/openclaw-dashboard
cp .env.example .env
```

`.env` dosyasında en az şunları düzenleyin:
- `DASHBOARD_BIND_IP=100.90.28.62` (veya kendi tailscale ip)
- `OPENCLAW_BASE_URL=http://127.0.0.1:18789`
- `OPENCLAW_GATEWAY_TOKEN=<TOKEN>`
- `JWT_SECRET=<güçlü-secret>`

Başlat:
```bash
docker compose up -d --build
```

Kontrol:
```bash
docker compose ps
curl -s http://127.0.0.1:4001/health
curl -I http://100.90.28.62:5173
```

Aç:
- `http://100.90.28.62:5173`
- veya `http://claw.taila2b846.ts.net:5173`

---

## 2) Docker yoksa (container içinde çalışma)

Backend:
```bash
cd /data/workspace/openclaw-dashboard/backend
npm install
HOST=0.0.0.0 PORT=4001 OPENCLAW_BASE_URL=http://127.0.0.1:18789 OPENCLAW_GATEWAY_TOKEN=<TOKEN> npm start
```

Frontend (ayrı terminal):
```bash
cd /data/workspace/openclaw-dashboard/frontend
npm install --include=dev
BACKEND_PROXY_TARGET=http://127.0.0.1:4001 BACKEND_PROXY_WS_TARGET=ws://127.0.0.1:4001 npm run dev -- --host 0.0.0.0 --port 5173
```

---

## Güvenlik
- Public domain yerine Tailscale/private network kullanın.
- Token/secret değerlerini repoya commit etmeyin.
- `backend` portu yalnızca localhost bind edilmiştir; dış erişim frontend üzerinden yapılır.

## Varsayılan giriş
- kullanıcı: `admin`
- şifre: `admin123`
