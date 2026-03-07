import { Router } from 'express';
import { state } from '../services/state.js';

export const analyticsRouter = Router();

function build() {
  const byDay = {};
  const toolCount = {};
  const agentCount = {};
  let totalDuration = 0;
  state.tasks.forEach(t => {
    const d = new Date(t.startedAt).toISOString().slice(0, 10);
    byDay[d] = (byDay[d] || 0) + 1;
    totalDuration += t.durationMs || 0;
    (t.tools || []).forEach(tool => toolCount[tool] = (toolCount[tool] || 0) + 1);
    if (t.assignee) agentCount[t.assignee] = (agentCount[t.assignee] || 0) + 1;
  });
  const avgDuration = state.tasks.length ? totalDuration / state.tasks.length : 0;
  const tokenUsage = state.tasks.reduce((s, t) => s + (t.tokens || 0), 0);
  return {
    dailyTasks: Object.entries(byDay).map(([date, count]) => ({ date, count })),
    averageDurationSec: avgDuration / 1000,
    toolUsage: Object.entries(toolCount).map(([name, value]) => ({ name, value })),
    agentUsage: Object.entries(agentCount).map(([name, value]) => ({ name, value })),
    tokenUsage,
    estimatedCost: Number((tokenUsage / 1_000_000 * 5).toFixed(4))
  };
}

analyticsRouter.get('/', (_, res) => res.json(build()));
analyticsRouter.get('/tasks', (_, res) => res.json({ dailyTasks: build().dailyTasks, averageDurationSec: build().averageDurationSec }));
analyticsRouter.get('/costs', (_, res) => res.json({ tokenUsage: build().tokenUsage, estimatedCost: build().estimatedCost }));
analyticsRouter.get('/agents', (_, res) => res.json({ agentUsage: build().agentUsage }));
