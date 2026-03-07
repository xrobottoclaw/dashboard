import { Router } from 'express';
import si from 'systeminformation';
import { tasks } from '../services/store.js';

export const overviewRouter = Router();

overviewRouter.get('/', async (_, res) => {
  const [load, mem, fs, osInfo] = await Promise.all([
    si.currentLoad(), si.mem(), si.fsSize(), si.osInfo()
  ]);

  const stats = {
    running: tasks.filter(t => t.status === 'running').length,
    queued: tasks.filter(t => t.status === 'queued').length,
    done: tasks.filter(t => t.status === 'done').length,
    failed: tasks.filter(t => t.status === 'failed').length
  };

  res.json({
    stats,
    agent: { uptimeSec: process.uptime(), version: process.env.OPENCLAW_VERSION || osInfo.release },
    resources: {
      cpu: Number(load.currentLoad.toFixed(2)),
      ram: Number(((mem.active / mem.total) * 100).toFixed(2)),
      disk: Number((fs[0]?.use || 0).toFixed(2))
    },
    recentTasks: tasks.slice(-5).reverse()
  });
});
