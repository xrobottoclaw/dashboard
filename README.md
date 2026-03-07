# Dashboard Repo

Bu repository içinde asıl proje `openclaw-dashboard/` klasöründedir.

## Hızlı Başlangıç

```bash
git clone git@github.com:xrobottoclaw/dashboard.git
cd dashboard/openclaw-dashboard
cp .env.example .env
# .env içinde OPENCLAW_GATEWAY_TOKEN değerini gir
docker compose up -d --build
```

Ardından dashboard:
- `http://<TAILSCALE_IP>:5173`

Detaylı kurulum: `openclaw-dashboard/README.md`
