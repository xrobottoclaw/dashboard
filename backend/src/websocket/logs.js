import { WebSocketServer } from 'ws';
import { pushLog, queryLogs } from '../services/logStore.js';

export function createLogsWss() {
  const wss = new WebSocketServer({ noServer: true });
  const levels = ['INFO', 'WARN', 'ERROR', 'TOOL_CALL'];

  wss.on('connection', (ws) => {
    queryLogs().slice(-100).forEach((l) => ws.send(JSON.stringify(l)));

    const timer = setInterval(() => {
      const level = levels[Math.floor(Math.random() * levels.length)];
      const entry = { ts: Date.now(), level, message: `${level}: sample log event` };
      pushLog(entry);
      ws.send(JSON.stringify(entry));
    }, 1500);

    ws.on('close', () => clearInterval(timer));
  });

  return wss;
}
