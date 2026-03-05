import { Router } from 'express';
import { tasks } from '../services/store.js';

export const tasksRouter = Router();

const byStatus = (arr, status) => status ? arr.filter(t => t.status === status) : arr;

tasksRouter.get('/', (req, res) => {
  const { status, q, from, to } = req.query;
  let out = byStatus(tasks, status);
  if (q) out = out.filter(t => `${t.id} ${t.actor} ${t.prompt}`.toLowerCase().includes(String(q).toLowerCase()));
  if (from) out = out.filter(t => t.startedAt >= Number(from));
  if (to) out = out.filter(t => t.startedAt <= Number(to));
  res.json(out.sort((a, b) => b.startedAt - a.startedAt));
});

tasksRouter.get('/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

tasksRouter.post('/', (req, res) => {
  const id = `t-${Date.now()}`;
  const task = {
    id,
    status: 'queued',
    startedAt: Date.now(),
    durationMs: 0,
    actor: req.user.username,
    prompt: req.body.prompt || '',
    logs: ['INFO Task created'],
    tools: [],
    tokens: 0
  };
  tasks.push(task);
  res.status(201).json(task);
});

tasksRouter.post('/:id/cancel', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.status = 'failed';
  task.logs.push('WARN Task canceled');
  res.json(task);
});

tasksRouter.post('/:id/restart', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.status = 'running';
  task.startedAt = Date.now();
  task.logs.push('INFO Task restarted');
  res.json(task);
});
