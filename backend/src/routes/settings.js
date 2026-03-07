import { Router } from 'express';
import { appSettings } from '../services/store.js';

export const settingsRouter = Router();

settingsRouter.get('/', (_, res) => {
  const masked = {
    ...appSettings,
    apiKeys: (appSettings.apiKeys || []).map((k) => ({
      provider: k.provider,
      key: String(k.key || '').length > 8 ? `${String(k.key).slice(0,3)}****${String(k.key).slice(-2)}` : '****'
    }))
  };
  res.json(masked);
});
settingsRouter.post('/', (req, res) => {
  Object.assign(appSettings, req.body || {});
  res.json(appSettings);
});
settingsRouter.post('/restart', (_, res) => {
  res.json({ ok: true, message: 'Agent restart requested (hook this to OpenClaw restart endpoint)' });
});
