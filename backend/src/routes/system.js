import { Router } from 'express';
import si from 'systeminformation';
import { ocState, ocGet } from '../services/openclaw.js';

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

systemRouter.get('/upstream/probe', async (_, res) => {
  const endpoints = ['/api/agents','/agents','/api/sessions','/sessions','/api/skills','/skills'];
  const result = {};
  for (const ep of endpoints) {
    const data = await ocGet(ep, null);
    if (Array.isArray(data)) result[ep] = { kind: 'array', count: data.length };
    else if (data?.items && Array.isArray(data.items)) result[ep] = { kind: 'items', count: data.items.length };
    else if (data?.sessions && Array.isArray(data.sessions)) result[ep] = { kind: 'sessions', count: data.sessions.length };
    else if (data === null) result[ep] = { kind: 'null' };
    else result[ep] = { kind: typeof data };
  }
  res.json({
    openclawBaseURL: ocState.baseURL,
    tokenConfigured: ocState.tokenConfigured,
    lastError: ocState.lastError,
    result
  });
});
