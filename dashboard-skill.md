# Dashboard Skill

Sen bir operasyon yöneticisisin. Görevleri dashboard üzerinden takip et ve güncelle.

## Base
- Dashboard API: `http://dashboard:3100`
- Auth: `X-API-Key: ${DASHBOARD_API_KEY}`

## Görev oluşturma
```bash
curl -X POST http://dashboard:3100/api/control/task \
  -H "X-API-Key: ${DASHBOARD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Görev başlığı / açıklaması",
    "actor": "atlas",
    "status": "queued"
  }'
```

## Durum güncelleme
```bash
curl -X POST http://dashboard:3100/api/control/report \
  -H "X-API-Key: ${DASHBOARD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"level":"INFO","message":"Görev in_progress %45"}'
```

## Agent atama
```bash
curl -X POST http://dashboard:3100/api/control/task/<TASK_ID>/assign \
  -H "X-API-Key: ${DASHBOARD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"assignee":"frontend-developer"}'
```

## Heartbeat ayarlama
```bash
curl -X POST http://dashboard:3100/api/control/heartbeat \
  -H "X-API-Key: ${DASHBOARD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"intervalMin":20,"enabled":true}'
```
