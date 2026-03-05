# OpenClaw Yönetim Dashboard

Modern web dashboard (React + Vite + Tailwind + Express + WebSocket) tek repo içinde.

## Özellikler
- JWT login (username/password `.env` tabanlı)
- Overview: görev sayıları, uptime/version, CPU/RAM/Disk canlı grafik
- Tasks: liste, filtre, yeni görev, iptal/yeniden başlat
- Live Logs: WebSocket log akışı + level/keyword filtre
- File Manager: workspace gezinme + içerik okuma/yazma/silme
- Web Terminal: xterm.js + backend pty websocket
- Settings: model/token/timeout benzeri ayarlar + restart endpoint
- History/Analytics: günlük görev, tool kullanımı, token/cost özeti

## Kurulum (Docker)
```bash
cd openclaw-dashboard
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend health: http://localhost:4001/health

Varsayılan giriş:
- kullanıcı: `admin`
- şifre: `admin123`

## Lokal Geliştirme
### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Ortam Değişkenleri (Backend)
- `DASHBOARD_USERNAME`
- `DASHBOARD_PASSWORD` (plain veya bcrypt hash)
- `JWT_SECRET`
- `JWT_EXPIRES`
- `WORKSPACE_ROOT`
- `OPENCLAW_BASE_URL` (örn: `https://robotto.duckdns.org:8080`)
- `OPENCLAW_GATEWAY_TOKEN`

## OpenClaw Proxy
Dashboard backend, upstream OpenClaw'a şu route ile proxy geçer:
- `/api/openclaw/*` -> `${OPENCLAW_BASE_URL}/*` (Authorization: Bearer `OPENCLAW_GATEWAY_TOKEN`)

## Modül Durumu / Öncelik
1. ✅ Backend API iskelet + Auth
2. ✅ Overview & Task List
3. ✅ Live Logs (WebSocket)
4. ✅ File Manager
5. ✅ Terminal
6. ✅ Settings & Analytics

## Secure Context Notu (Önemli)
OpenClaw Control UI ve bazı websocket akışları tarayıcıda **secure context** ister.
- `http://<ip>:port` ile açıldığında `disconnected (1008): requires HTTPS or localhost` alabilirsiniz.
- Üretimde `https://domain` üzerinden açın (örn. Traefik + TLS).
- Frontend varsayılan olarak `/api` ve `wss/ws` için mevcut origin'i kullanacak şekilde ayarlandı.

## Not
Bu sürüm üretim başlangıç iskeletidir. OpenClaw REST/WS endpointleri farklıysa `backend/src/routes/*` içinde gerçek proxy entegrasyonu yapılmalıdır.
