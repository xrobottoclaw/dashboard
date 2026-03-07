import { Router } from 'express';
import { state, persistState } from '../services/state.js';
import { pushLog } from '../services/logStore.js';
import { ocGet } from '../services/openclaw.js';

export const skillsRouter = Router();

function normalizeUpstreamSkills(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((s, i) => ({
    id: s.id || s.key || `sk-${i}`,
    name: s.name || s.key || `skill-${i}`,
    description: s.description || '',
    source: 'openclaw'
  }));
}

skillsRouter.get('/', async (_, res) => {
  const candidates = await Promise.all([
    ocGet('/api/skills', null),
    ocGet('/skills', null)
  ]);
  let upstream = [];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) { upstream = normalizeUpstreamSkills(c); break; }
    if (c?.items && Array.isArray(c.items) && c.items.length) { upstream = normalizeUpstreamSkills(c.items); break; }
  }
  const mergedMap = new Map();
  [...upstream, ...state.skills].forEach((s) => mergedMap.set(s.id, s));
  const merged = [...mergedMap.values()];
  if (merged.length !== state.skills.length) {
    state.skills = merged;
    persistState();
  }
  res.json(merged);
});
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
