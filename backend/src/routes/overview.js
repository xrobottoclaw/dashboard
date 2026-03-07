import { Router } from 'express';
import si from 'systeminformation';
import { state } from '../services/state.js';

export const overviewRouter = Router();

overviewRouter.get('/', async (_, res) => {
  const [load, mem, fs, osInfo] = await Promise.all([
    si.currentLoad(), si.mem(), si.fsSize(), si.osInfo()
  ]);

  const stats = {
    running: state.tasks.filter(t => ['running','in_progress'].includes(t.status)).length,
    queued: state.tasks.filter(t => t.status === 'queued').length,
    done: state.tasks.filter(t => t.status === 'done').length,
    failed: state.tasks.filter(t => t.status === 'failed').length
  };

  const agentStats = {
    running: state.agents.filter(a => a.status === 'running').length,
    idle: state.agents.filter(a => !a.status || a.status === 'idle').length,
    stopped: state.agents.filter(a => a.status === 'stopped').length
  };

  res.json({
    stats,
    agentStats,
    agent: { uptimeSec: process.uptime(), version: process.env.OPENCLAW_VERSION || osInfo.release },
    resources: {
      cpu: Number(load.currentLoad.toFixed(2)),
      ram: Number(((mem.active / mem.total) * 100).toFixed(2)),
      disk: Number((fs[0]?.use || 0).toFixed(2))
    },
    recentTasks: state.tasks.slice(-5).reverse()
  });
});
