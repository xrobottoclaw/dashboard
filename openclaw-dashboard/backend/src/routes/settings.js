import { Router } from 'express';
import { appSettings } from '../services/store.js';

export const settingsRouter = Router();

settingsRouter.get('/', (_, res) => res.json(appSettings));
settingsRouter.post('/', (req, res) => {
  Object.assign(appSettings, req.body || {});
  res.json(appSettings);
});
settingsRouter.post('/restart', (_, res) => {
  res.json({ ok: true, message: 'Agent restart requested (hook this to OpenClaw restart endpoint)' });
});
