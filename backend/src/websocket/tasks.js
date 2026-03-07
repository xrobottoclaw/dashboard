import { WebSocketServer } from 'ws';
import { wsChannels } from '../services/state.js';

export function setupTasksWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws/tasks' });
  wss.on('connection', (ws) => {
    wsChannels.tasks.add(ws);
    ws.on('close', () => wsChannels.tasks.delete(ws));
  });
}
