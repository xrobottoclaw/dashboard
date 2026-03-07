import { Router } from 'express';
import { state, persistState } from '../services/state.js';
import { pushLog } from '../services/logStore.js';

export const agentsRouter = Router();

agentsRouter.get('/', (_, res) => res.json(state.agents));
agentsRouter.post('/', (req, res) => {
  const a = { id: `a-${Date.now()}`, status: 'idle', createdAt: Date.now(), ...req.body };
  state.agents.push(a);
  pushLog({ ts: Date.now(), level: 'INFO', message: `[AGENT] created ${a.id}` });
  persistState();
  res.status(201).json(a);
});
agentsRouter.get('/:id', (req, res) => {
  const a = state.agents.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Agent not found' });
  res.json(a);
});
agentsRouter.put('/:id', (req, res) => {
  const a = state.agents.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Agent not found' });
  Object.assign(a, req.body || {});
  persistState();
  res.json(a);
});
agentsRouter.delete('/:id', (req, res) => {
  const i = state.agents.findIndex(x => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Agent not found' });
  state.agents.splice(i, 1);
  pushLog({ ts: Date.now(), level: 'WARN', message: `[AGENT] deleted ${req.params.id}` });
  persistState();
  res.json({ ok: true });
});
agentsRouter.put('/:id/heartbeat', (req, res) => {
  const a = state.agents.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Agent not found' });
  a.heartbeat = req.body || {};
  persistState();
  res.json(a);
});
agentsRouter.post('/:id/start', (req, res) => {
  const a = state.agents.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Agent not found' });
  a.status = 'running';
  persistState();
  res.json(a);
});
agentsRouter.post('/:id/stop', (req, res) => {
  const a = state.agents.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Agent not found' });
  a.status = 'stopped';
  persistState();
  res.json(a);
});
