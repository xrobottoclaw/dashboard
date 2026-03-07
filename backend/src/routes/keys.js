import { Router } from 'express';
import { appSettings } from '../services/store.js';

export const keysRouter = Router();

keysRouter.get('/', (_, res) => {
  const rows = (appSettings.apiKeys || []).map((k, i) => ({ id: i + 1, provider: k.provider, key: '****' }));
  res.json(rows);
});

keysRouter.post('/', (req, res) => {
  const { provider, key } = req.body || {};
  if (!provider || !key) return res.status(400).json({ error: 'provider and key required' });
  appSettings.apiKeys = appSettings.apiKeys || [];
  appSettings.apiKeys.push({ provider, key });
  res.status(201).json({ ok: true });
});

keysRouter.delete('/:id', (req, res) => {
  const idx = Number(req.params.id) - 1;
  if (!appSettings.apiKeys || idx < 0 || idx >= appSettings.apiKeys.length) return res.status(404).json({ error: 'Not found' });
  appSettings.apiKeys.splice(idx, 1);
  res.json({ ok: true });
});
