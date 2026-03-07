import { WebSocketServer } from 'ws';
import { wsChannels } from '../services/state.js';

export function createTasksWss() {
  const wss = new WebSocketServer({ noServer: true });
  wss.on('connection', (ws) => {
    wsChannels.tasks.add(ws);
    ws.on('close', () => wsChannels.tasks.delete(ws));
  });
  return wss;
}
