import { Router } from 'express';
import { appSettings } from '../services/store.js';

export const configRouter = Router();

configRouter.get('/', (_, res) => res.json(appSettings));
configRouter.put('/', (req, res) => {
  Object.assign(appSettings, req.body || {});
  res.json(appSettings);
});
