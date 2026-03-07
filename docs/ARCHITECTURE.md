# OpenClaw Dashboard Architecture

## Hedef Operasyon

Emre (Telegram/PC) -> OpenClaw -> Dashboard API -> Dashboard UI (real-time)

Dashboard üstünden görülebilenler:
- Tüm görevlerin durumu
- Hangi agent/sub-agent ne yapıyor
- Log akışı ve hatalar
- Kullanım/maliyet trendleri
- Müdahale gereken noktalar

## Kurulum Kararı

**Seçim:** Aynı VPS, ayrı dashboard container (OpenClaw'dan bağımsız lifecycle)

### Neden
- Aynı host/network: hızlı erişim
- OpenClaw update/restart olduğunda dashboard bağımsız kalır
- Coolify/compose ile yönetim kolay
- Tailscale-only erişim uygulanabilir

## Container Tasarımı

Dashboard **tek container** olarak çalışır:
- Express API
- Build edilmiş React UI (static)
- Aynı port: `3100`

Böylece:
- CORS karmaşıklığı azalır
- Tek FQDN/tek port yönetilir
- Operasyon sadeleşir

## Güvenlik Modeli

- UI erişimi: JWT login
- OpenClaw otomasyon çağrıları: `X-API-Key` (`DASHBOARD_API_KEY`)
- Upstream OpenClaw erişimi: `OPENCLAW_GATEWAY_TOKEN`
- Yayın: yalnız Tailscale IP / private hostname
- Secret değerler sadece `.env` içinde

## Volume Modeli

- `/workspace` mount: read-only (dashboard okur)
- `dashboard-data` volume: DB/config/session

## Operasyon API

- `POST /api/control/task`
- `POST /api/control/task/:id/assign`
- `POST /api/control/skill/upsert`
- `POST /api/control/heartbeat`
- `POST /api/control/report`

Bu endpointler OpenClaw'ın Telegram'dan aldığı işleri dashboard'a işlem olarak kaydetmesi için tasarlandı.
