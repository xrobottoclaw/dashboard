import { Router } from 'express';
import { state } from '../services/state.js';

export const skillsRouter = Router();

skillsRouter.get('/', (_, res) => res.json(state.skills));
skillsRouter.post('/', (req, res) => {
  const s = { id: `s-${Date.now()}`, createdAt: Date.now(), ...req.body };
  state.skills.push(s);
  res.status(201).json(s);
});
skillsRouter.put('/:id', (req, res) => {
  const s = state.skills.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Skill not found' });
  Object.assign(s, req.body || {});
  res.json(s);
});
skillsRouter.delete('/:id', (req, res) => {
  const i = state.skills.findIndex(x => x.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Skill not found' });
  state.skills.splice(i, 1);
  res.json({ ok: true });
});
skillsRouter.post('/:id/assign', (req, res) => {
  const s = state.skills.find(x => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: 'Skill not found' });
  s.assignedAgentId = req.body?.agentId || null;
  res.json(s);
});
