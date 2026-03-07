export const state = {
  tasks: [],
  agents: [],
  skills: [],
  logs: []
};

export const wsChannels = {
  logs: new Set(),
  tasks: new Set(),
  system: new Set()
};

export function broadcast(channel, payload) {
  for (const ws of wsChannels[channel] || []) {
    try { ws.send(JSON.stringify(payload)); } catch {}
  }
}
