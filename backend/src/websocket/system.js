import { WebSocketServer } from 'ws';
import si from 'systeminformation';
import { wsChannels } from '../services/state.js';

export function createSystemWss() {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    wsChannels.system.add(ws);

    const timer = setInterval(async () => {
      const [load, mem, fs] = await Promise.all([si.currentLoad(), si.mem(), si.fsSize()]);
      ws.send(JSON.stringify({
        ts: Date.now(),
        cpu: Number(load.currentLoad.toFixed(2)),
        ram: Number(((mem.active / mem.total) * 100).toFixed(2)),
        disk: Number((fs[0]?.use || 0).toFixed(2))
      }));
    }, 2000);

    ws.on('close', () => {
      clearInterval(timer);
      wsChannels.system.delete(ws);
    });
  });

  return wss;
}
