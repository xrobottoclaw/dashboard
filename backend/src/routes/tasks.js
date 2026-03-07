import { Router } from 'express';
import { state, broadcast } from '../services/state.js';

export const tasksRouter = Router();

const byStatus = (arr, status) => status ? arr.filter(t => t.status === status) : arr;
const findTask = (id) => state.tasks.find(t => t.id === id);

tasksRouter.get('/', (req, res) => {
  const { status, q, from, to, agent } = req.query;
  let out = byStatus(state.tasks, status);
  if (q) out = out.filter(t => `${t.id} ${t.actor || ''} ${t.prompt || ''} ${t.title || ''}`.toLowerCase().includes(String(q).toLowerCase()));
  if (agent) out = out.filter(t => t.assignee === agent);
  if (from) out = out.filter(t => t.startedAt >= Number(from));
  if (to) out = out.filter(t => t.startedAt <= Number(to));
  res.json(out.sort((a, b) => b.startedAt - a.startedAt));
});

tasksRouter.post('/', (req, res) => {
  const id = `t-${Date.now()}`;
  const task = {
    id,
    title: req.body.title || req.body.prompt || id,
    description: req.body.description || '',
    status: req.body.status || 'queued',
    startedAt: Date.now(),
    durationMs: 0,
    actor: req.user?.username || 'system',
    assignee: req.body.assignee || null,
    prompt: req.body.prompt || '',
    logs: ['INFO Task created'],
    tools: [],
    tokens: 0,
    subtasks: req.body.subtasks || []
  };
  state.tasks.push(task);
  broadcast('tasks', { type: 'task.created', task });
  res.status(201).json(task);
});

tasksRouter.get('/:id', (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

tasksRouter.put('/:id', (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  Object.assign(task, req.body || {});
  broadcast('tasks', { type: 'task.updated', task });
  res.json(task);
});

tasksRouter.delete('/:id', (req, res) => {
  const i = state.tasks.findIndex(t => t.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Task not found' });
  state.tasks.splice(i, 1);
  broadcast('tasks', { type: 'task.deleted', id: req.params.id });
  res.json({ ok: true });
});

tasksRouter.post('/:id/log', (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const line = req.body?.log || req.body?.message || '';
  task.logs = task.logs || [];
  task.logs.push(line);
  broadcast('tasks', { type: 'task.log', id: task.id, log: line });
  res.json({ ok: true });
});

tasksRouter.post('/:id/cancel', (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.status = 'failed';
  task.logs.push('WARN Task canceled');
  broadcast('tasks', { type: 'task.updated', task });
  res.json(task);
});

tasksRouter.post('/:id/restart', (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  task.status = 'running';
  task.startedAt = Date.now();
  task.logs.push('INFO Task restarted');
  broadcast('tasks', { type: 'task.updated', task });
  res.json(task);
});
