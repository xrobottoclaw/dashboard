import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { state, persistState } from '../services/state.js';
import { pushLog } from '../services/logStore.js';
import { ocGet } from '../services/openclaw.js';

export const agentsRouter = Router();

function normalizeUpstreamAgents(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((a, i) => ({
    id: a.id || a.agentId || a.key || a.slug || `up-${i}`,
    name: a.name || a.label || a.agent || a.slug || a.id || `agent-${i}`,
    role: a.role || a.description || a.prompt || 'openclaw-agent',
    status: a.status || (a.active ? 'running' : 'idle'),
    source: 'openclaw'
  }));
}

function extractAgentArrays(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return [payload];
  const out = [];
  const keys = ['items', 'sessions', 'agents', 'data', 'rows'];
  for (const k of keys) {
    if (Array.isArray(payload[k])) out.push(payload[k]);
  }
  if (payload.config?.agents && Array.isArray(payload.config.agents)) out.push(payload.config.agents);
  if (payload.defaults?.agents && Array.isArray(payload.defaults.agents)) out.push(payload.defaults.agents);
  return out;
}

agentsRouter.get('/', async (_, res) => {
  const candidates = await Promise.all([
    ocGet('/api/agents', null),
    ocGet('/agents', null),
    ocGet('/api/sessions', null),
    ocGet('/sessions', null),
    ocGet('/api/config', null),
    ocGet('/config', null),
    ocGet('/api/status', null),
    ocGet('/status', null)
  ]);

  let upstream = [];
  for (const c of candidates) {
    const arrays = extractAgentArrays(c);
    const firstNonEmpty = arrays.find((arr) => Array.isArray(arr) && arr.length);
    if (firstNonEmpty) {
      upstream = normalizeUpstreamAgents(firstNonEmpty);
      break;
    }
  }

  const mergedMap = new Map();
  [...upstream, ...state.agents].forEach((a) => mergedMap.set(a.id, a));
  let merged = [...mergedMap.values()];

  if (!merged.length) {
    try {
      const root = process.env.WORKSPACE_ROOT || '/workspace';
      const agentsDir = path.resolve(root, 'agents');
      const dirs = await fs.readdir(agentsDir, { withFileTypes: true });
      merged = dirs.filter(d => d.isDirectory()).map((d, i) => ({
        id: `fs-agent-${i}`,
        name: d.name,
        role: 'workspace-agent',
        status: d.name === 'main' ? 'running' : 'idle',
        source: 'workspace'
      }));
    } catch {
      merged = [];
    }
  }

  if (!merged.length) {
    merged = [{ id: 'main', name: 'main', role: 'primary-agent', status: 'running', source: 'fallback' }];
  }

  if (JSON.stringify(merged) !== JSON.stringify(state.agents)) {
    state.agents = merged;
    persistState();
  }

  res.json(merged);
});
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
