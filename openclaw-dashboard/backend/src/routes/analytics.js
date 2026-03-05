import { Router } from 'express';
import { tasks } from '../services/store.js';

export const analyticsRouter = Router();

analyticsRouter.get('/', (_, res) => {
  const byDay = {};
  const toolCount = {};
  let totalDuration = 0;
  tasks.forEach(t => {
    const d = new Date(t.startedAt).toISOString().slice(0, 10);
    byDay[d] = (byDay[d] || 0) + 1;
    totalDuration += t.durationMs || 0;
    (t.tools || []).forEach(tool => toolCount[tool] = (toolCount[tool] || 0) + 1);
  });

  const avgDuration = tasks.length ? totalDuration / tasks.length : 0;
  const tokenUsage = tasks.reduce((s, t) => s + (t.tokens || 0), 0);

  res.json({
    dailyTasks: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    averageDurationSec: avgDuration / 1000,
    toolUsage: Object.entries(toolCount).map(([name, value]) => ({ name, value })),
    tokenUsage,
    estimatedCost: Number((tokenUsage / 1_000_000 * 5).toFixed(4))
  });
});
