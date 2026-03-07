import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { authMiddleware } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { overviewRouter } from './routes/overview.js';
import { tasksRouter } from './routes/tasks.js';
import { filesRouter } from './routes/files.js';
import { settingsRouter } from './routes/settings.js';
import { analyticsRouter } from './routes/analytics.js';
import { openclawProxyRouter } from './routes/openclawProxy.js';
import { logsRouter } from './routes/logs.js';
import { setupLogWebSocket } from './websocket/logs.js';
import { setupTerminalWebSocket } from './websocket/terminal.js';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_, res) => res.json({ ok: true, version: '1.0.0' }));
app.use('/api/auth', authRouter);
app.use('/api', authMiddleware);
app.use('/api/overview', overviewRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/files', filesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/openclaw', openclawProxyRouter);
app.use('/api/logs', logsRouter);

setupLogWebSocket(server);
setupTerminalWebSocket(server);

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => console.log(`Backend running on :${PORT}`));
