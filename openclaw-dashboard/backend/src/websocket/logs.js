import { WebSocketServer } from 'ws';

export function setupLogWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws/logs' });
  const levels = ['INFO', 'WARN', 'ERROR', 'TOOL_CALL'];

  wss.on('connection', ws => {
    const timer = setInterval(() => {
      const level = levels[Math.floor(Math.random() * levels.length)];
      ws.send(JSON.stringify({ ts: Date.now(), level, message: `${level}: sample log event` }));
    }, 1500);
    ws.on('close', () => clearInterval(timer));
  });
}
