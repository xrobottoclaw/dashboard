import { WebSocketServer } from 'ws';
import pty from 'node-pty';

export function createTerminalWss() {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const p = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: process.env.WORKSPACE_ROOT || '/workspace',
      env: process.env
    });

    p.onData((data) => ws.send(data));
    ws.on('message', (msg) => p.write(msg.toString()));
    ws.on('close', () => p.kill());
  });

  return wss;
}
