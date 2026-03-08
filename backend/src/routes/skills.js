import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { state, persistState } from '../services/state.js';
import { pushLog } from '../services/logStore.js';
import { ocGet } from '../services/openclaw.js';

export const skillsRouter = Router();

function normalizeUpstreamSkills(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((s, i) => ({
    id: s.id || s.key || s.slug || `sk-${i}`,
    name: s.name || s.key || s.slug || `skill-${i}`,
    description: s.description || s.prompt || '',
    source: 'openclaw'
  }));
}

function extractSkillArrays(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return [payload];
  const out = [];
  const keys = ['items', 'skills', 'data', 'rows'];
  for (const k of keys) {
    if (Array.isArray(payload[k])) out.push(payload[k]);
  }
  if (payload.config?.skills && Array.isArray(payload.config.skills)) out.push(payload.config.skills);
  return out;
}

skillsRouter.get('/', async (_, res) => {
  const candidates = await Promise.all([
    ocGet('/api/skills', null),
    ocGet('/skills', null),
    ocGet('/api/config', null),
    ocGet('/config', null)
  ]);
  let upstream = [];
  for (const c of candidates) {
    const arrays = extractSkillArrays(c);
    const firstNonEmpty = arrays.find((arr) => Array.isArray(arr) && arr.length);
    if (firstNonEmpty) { upstream = normalizeUpstreamSkills(firstNonEmpty); break; }
  }
  const mergedMap = new Map();
  [...upstream, ...state.skills].forEach((s) => mergedMap.set(s.id, s));
  let merged = [...mergedMap.values()];

  if (!merged.length) {
    try {
      const root = process.env.WORKSPACE_ROOT || '/workspace';
      const skillsDir = path.resolve(root, 'skills');
      const dirs = await fs.readdir(skillsDir, { withFileTypes: true });
      merged = dirs.filter(d => d.isDirectory()).map((d, i) => ({ id: `fs-${i}`, name: d.name, description: 'workspace skill', source: 'workspace' }));
    } catch {
      merged = [];
    }
  }

  if (JSON.stringify(merged) !== JSON.stringify(state.skills)) {
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
