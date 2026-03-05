const now = Date.now();

export const tasks = [
  { id: 't-1001', status: 'running', startedAt: now - 120000, durationMs: 120000, actor: 'atlas', prompt: 'Build dashboard', logs: ['INFO Booting'], tools: ['read', 'write'], tokens: 1200 },
  { id: 't-1002', status: 'done', startedAt: now - 420000, durationMs: 240000, actor: 'atlas', prompt: 'Refactor API', logs: ['INFO Done'], tools: ['edit'], tokens: 900 }
];

export const appSettings = {
  model: 'openai-codex/gpt-5.3-codex',
  maxTokens: 8192,
  temperature: 0.2,
  timeoutSec: 120,
  sessionTimeoutMin: 60,
  theme: 'dark',
  apiKeys: [{ provider: 'openai', key: 'sk-****-****' }]
};
