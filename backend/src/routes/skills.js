import { Router } from 'express';
import { state, persistState } from '../services/state.js';
import { pushLog } from '../services/logStore.js';

export const skillsRouter = Router();

skillsRouter.get('/', (_, res) => res.json(state.skills));
skillsRouter.post('/', (req, res) => {
  const s = { id: `s-${Date.now()}`, createdAt: Date.now(), ...req.body };
  state.skills.push(s);
  pushLog({ ts: Date.now(), level: 'INFO', message: `[SKILL] created ${s.id}` });
  persistState();
  res.status(201).json(s);
});
skillsRouter.put('/:id', (req, res) => {
  const s = state.skills.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Skill not found' });
  Object.assign(s, req.body || {});
  persistState();
  res.json(s);
});
skillsRouter.delete('/:id', (req, res) => {
  const i = state.skills.findIndex(x => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Skill not found' });
  state.skills.splice(i, 1);
  pushLog({ ts: Date.now(), level: 'WARN', message: `[SKILL] deleted ${req.params.id}` });
  persistState();
  res.json({ ok: true });
});
skillsRouter.post('/:id/assign', (req, res) => {
  const s = state.skills.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Skill not found' });
  s.assignedAgentId = req.body?.agentId || null;
  persistState();
  res.json(s);
});
