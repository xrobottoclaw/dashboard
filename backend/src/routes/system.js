import { Router } from 'express';
import si from 'systeminformation';
import { ocState } from '../services/openclaw.js';

export const systemRouter = Router();

systemRouter.get('/stats', async (_, res) => {
  const [load, mem, fs] = await Promise.all([si.currentLoad(), si.mem(), si.fsSize()]);
  res.json({
    cpu: Number(load.currentLoad.toFixed(2)),
    ram: Number(((mem.active / mem.total) * 100).toFixed(2)),
    disk: Number((fs[0]?.use || 0).toFixed(2)),
    ts: Date.now()
  });
});

systemRouter.get('/upstream', async (_, res) => {
  res.json({
    openclawBaseURL: ocState.baseURL,
    tokenConfigured: ocState.tokenConfigured,
    lastError: ocState.lastError
  });
});
