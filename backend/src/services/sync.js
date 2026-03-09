import { ocGet, ocState } from './openclaw.js';
import { state, persistState } from './state.js';

const syncState = {
  running: false,
  lastRunAt: null,
  lastOkAt: null,
  lastError: null,
  sourceCounts: { agents: 0, skills: 0, tasks: 0 },
  effectiveCounts: { agents: 0, skills: 0, tasks: 0 },
  upstreamRawKinds: {}
};

function tryParse(v) {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  if (!(t.startsWith('{') || t.startsWith('['))) return v;
  try { return JSON.parse(t); } catch { return v; }
}

function firstArray(payload, keys = []) {
  payload = tryParse(payload);
  if (Array.isArray(payload)) return payload;
  for (const k of keys) {
    if (Array.isArray(payload?.[k])) return payload[k];
  }
  return [];
}

function kindOfPayload(v) {
  const p = tryParse(v);
  if (Array.isArray(p)) return `array:${p.length}`;
  if (p && typeof p === 'object') {
    for (const k of ['items','agents','skills','tasks','sessions']) {
      if (Array.isArray(p[k])) return `${k}:${p[k].length}`;
    }
    return 'object';
  }
  return typeof p;
}

function normalizeAgents(arr) {
  return (arr || []).map((a, i) => ({
    id: a.id || a.agentId || a.key || a.slug || `up-agent-${i}`,
    name: a.name || a.label || a.agent || a.slug || `agent-${i}`,
    role: a.role || a.description || 'openclaw-agent',
    status: a.status || (a.active ? 'running' : 'idle'),
    source: 'upstream'
  }));
}

function normalizeSkills(arr) {
  return (arr || []).map((s, i) => ({
    id: s.id || s.key || s.slug || `up-skill-${i}`,
    name: s.name || s.key || s.slug || `skill-${i}`,
    description: s.description || s.prompt || '',
    source: 'upstream'
  }));
}

function normalizeTasks(arr) {
  return (arr || []).map((t, i) => ({
    id: t.id || t.taskId || `up-task-${i}`,
    title: t.title || t.prompt || `task-${i}`,
    status: t.status || 'queued',
    startedAt: t.startedAt || t.createdAt || Date.now(),
    durationMs: t.durationMs || 0,
    actor: t.actor || 'openclaw',
    assignee: t.assignee || null,
    logs: t.logs || [],
    tools: t.tools || [],
    tokens: t.tokens || 0,
    source: 'upstream'
  }));
}

function mergeById(base, incoming) {
  const map = new Map();
  [...incoming, ...base].forEach((x) => map.set(x.id, x));
  return [...map.values()];
}

export async function syncFromUpstream() {
  syncState.running = true;
  syncState.lastRunAt = Date.now();
  try {
    const [a1, a2, s1, s2, t1, t2] = await Promise.all([
      ocGet('/api/agents', null), ocGet('/agents', null),
      ocGet('/api/skills', null), ocGet('/skills', null),
      ocGet('/api/tasks', null), ocGet('/tasks', null)
    ]);

    syncState.upstreamRawKinds = {
      '/api/agents': kindOfPayload(a1),
      '/agents': kindOfPayload(a2),
      '/api/skills': kindOfPayload(s1),
      '/skills': kindOfPayload(s2),
      '/api/tasks': kindOfPayload(t1),
      '/tasks': kindOfPayload(t2)
    };

    const upAgents = normalizeAgents(firstArray(a1, ['items', 'agents', 'sessions']).length ? firstArray(a1, ['items', 'agents', 'sessions']) : firstArray(a2, ['items', 'agents', 'sessions']));
    const upSkills = normalizeSkills(firstArray(s1, ['items', 'skills']).length ? firstArray(s1, ['items', 'skills']) : firstArray(s2, ['items', 'skills']));
    const upTasks = normalizeTasks(firstArray(t1, ['items', 'tasks']).length ? firstArray(t1, ['items', 'tasks']) : firstArray(t2, ['items', 'tasks']));

    if (upAgents.length) state.agents = mergeById(state.agents, upAgents);
    if (upSkills.length) state.skills = mergeById(state.skills, upSkills);
    if (upTasks.length) state.tasks = mergeById(state.tasks, upTasks);

    syncState.sourceCounts = { agents: upAgents.length, skills: upSkills.length, tasks: upTasks.length };
    syncState.effectiveCounts = { agents: state.agents.length, skills: state.skills.length, tasks: state.tasks.length };
    syncState.lastOkAt = Date.now();
    syncState.lastError = null;
    persistState();
  } catch (e) {
    syncState.lastError = e?.message || 'sync failed';
  } finally {
    syncState.running = false;
    if (!syncState.lastError && ocState.lastError) syncState.lastError = ocState.lastError;
  }
}

let timer = null;
export function startSyncLoop() {
  if (timer) return;
  syncFromUpstream();
  timer = setInterval(syncFromUpstream, Number(process.env.SYNC_INTERVAL_MS || 15000));
}

export function getSyncState() {
  return syncState;
}
