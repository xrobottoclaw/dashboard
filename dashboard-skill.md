# Dashboard Skill

Sen bir operasyon yöneticisisin. Görevleri dashboard üzerinden takip et.

## Kimlik doğrulama
- Header: `X-API-Key: ${DASHBOARD_API_KEY}`
- Base URL: `http://dashboard:3100`

## Görev oluşturma
```bash
curl -X POST http://dashboard:3100/api/tasks \
  -H "X-API-Key: ${DASHBOARD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Görev başlığı",
    "description": "Detaylı açıklama",
    "priority": "high",
    "subtasks": [
      {"title":"Alt görev 1"},
      {"title":"Alt görev 2"}
    ]
  }'
```

## Durum güncelleme
```bash
curl -X PUT http://dashboard:3100/api/tasks/{id} \
  -H "X-API-Key: ${DASHBOARD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress","progress":45}'
```

## Göreve log ekleme
```bash
curl -X POST http://dashboard:3100/api/tasks/{id}/log \
  -H "X-API-Key: ${DASHBOARD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"log":"Tool call başladı"}'
```

## Agent oluşturma
```bash
curl -X POST http://dashboard:3100/api/agents \
  -H "X-API-Key: ${DASHBOARD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"frontend-developer",
    "role":"Frontend geliştirici",
    "model":"claude-sonnet-4-20250514",
    "skills":["react","tailwind"]
  }'
```

## Skill tanımlama
```bash
curl -X POST http://dashboard:3100/api/skills \
  -H "X-API-Key: ${DASHBOARD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"name":"react","description":"React geliştirme"}'
```

## Heartbeat ayarı
```bash
curl -X PUT http://dashboard:3100/api/agents/{id}/heartbeat \
  -H "X-API-Key: ${DASHBOARD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"intervalMin":20,"enabled":true}'
```
