import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { authMiddleware, authOrApiKeyMiddleware } from './middleware/auth.js';
import { apiKeyMiddleware } from './middleware/apiKey.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.js';
import { overviewRouter } from './routes/overview.js';
import { tasksRouter } from './routes/tasks.js';
import { agentsRouter } from './routes/agents.js';
import { skillsRouter } from './routes/skills.js';
import { filesRouter } from './routes/files.js';
import { settingsRouter } from './routes/settings.js';
import { configRouter } from './routes/config.js';
import { keysRouter } from './routes/keys.js';
import { systemRouter } from './routes/system.js';
import { analyticsRouter } from './routes/analytics.js';
import { openclawProxyRouter } from './routes/openclawProxy.js';
import { logsRouter } from './routes/logs.js';
import { controlRouter } from './routes/control.js';
import { createLogsWss } from './websocket/logs.js';
import { createTasksWss } from './websocket/tasks.js';
import { createSystemWss } from './websocket/system.js';
import { createTerminalWss } from './websocket/terminal.js';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_, res) => res.json({ ok: true, version: '1.0.0' }));
app.get('/api/health', (_, res) => res.json({ ok: true, version: '1.0.0' }));
app.use('/api/auth', authRouter);
app.use('/api/control', apiKeyMiddleware, controlRouter);
app.use('/api', authOrApiKeyMiddleware);
app.use('/api/overview', overviewRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/files', filesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/config', configRouter);
app.use('/api/keys', keysRouter);
app.use('/api/system', systemRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/openclaw', openclawProxyRouter);
app.use('/api/logs', logsRouter);

const wssMap = {
  '/ws/logs': createLogsWss(),
  '/ws/tasks': createTasksWss(),
  '/ws/system': createSystemWss(),
  '/ws/terminal': createTerminalWss()
};

server.on('upgrade', (request, socket, head) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const wss = wssMap[pathname];
    if (!wss) {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } catch {
    socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
    socket.destroy();
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticDir = path.resolve(__dirname, '../../frontend-dist');
app.use(express.static(staticDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/ws')) return next();
  res.sendFile(path.join(staticDir, 'index.html'));
});

const PORT = process.env.PORT || 3100;
server.listen(PORT, '0.0.0.0', () => console.log(`Dashboard running on :${PORT}`));
