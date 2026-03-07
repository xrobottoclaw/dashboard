import { WebSocketServer } from 'ws';
import { queryLogs } from '../services/logStore.js';
import { wsChannels } from '../services/state.js';

export function createLogsWss() {
  const wss = new WebSocketServer({ noServer: true });
  wss.on('connection', (ws) => {
    wsChannels.logs.add(ws);
    queryLogs().slice(-300).forEach((l) => ws.send(JSON.stringify(l)));
    ws.on('close', () => wsChannels.logs.delete(ws));
  });

  return wss;
}
