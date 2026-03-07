import { Router } from 'express';
import { tasks } from '../services/store.js';
import { pushLog } from '../services/logStore.js';

export const controlRouter = Router();

const audit = (type, payload = {}) => {
  pushLog({
    ts: Date.now(),
    level: 'TOOL_CALL',
    message: `[CONTROL] ${type} ${JSON.stringify(payload)}`
  });
};

controlRouter.post('/task', (req, res) => {
  const { prompt = '', actor = 'openclaw', status = 'queued' } = req.body || {};
  const task = {
    id: `t-${Date.now()}`,
    status,
    startedAt: Date.now(),
    durationMs: 0,
    actor,
    prompt,
    logs: ['INFO Task created by control API'],
    tools: ['control-api'],
    tokens: 0
  };
  tasks.push(task);
  audit('task.create', { id: task.id, actor, status });
  res.status(201).json(task);
});

controlRouter.post('/task/:id/assign', (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { assignee = 'unassigned' } = req.body || {};
  task.assignee = assignee;
  task.logs.push(`INFO Assigned to ${assignee}`);
  audit('task.assign', { id: task.id, assignee });
  res.json(task);
});

controlRouter.post('/skill/upsert', (req, res) => {
  const { name, version = 'draft', note = '' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  audit('skill.upsert', { name, version });
  res.json({ ok: true, name, version, note });
});

controlRouter.post('/heartbeat', (req, res) => {
  const { intervalMin = 30, enabled = true, note = '' } = req.body || {};
  audit('heartbeat.update', { intervalMin, enabled });
  res.json({ ok: true, intervalMin, enabled, note });
});

controlRouter.post('/report', (req, res) => {
  const { level = 'INFO', message = 'status report' } = req.body || {};
  pushLog({ ts: Date.now(), level, message: `[REPORT] ${message}` });
  res.json({ ok: true });
});
