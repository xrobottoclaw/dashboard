import { Router } from 'express';
import { queryLogs } from '../services/logStore.js';

export const logsRouter = Router();

logsRouter.get('/export', (req, res) => {
  const { format = 'txt', level, keyword } = req.query;
  const rows = queryLogs({ level, keyword });

  if (format === 'json') {
    res.setHeader('Content-Disposition', 'attachment; filename="logs.json"');
    return res.json(rows);
  }

  const txt = rows
    .map((l) => `${new Date(l.ts).toISOString()} [${l.level}] ${l.message}`)
    .join('\n');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="logs.txt"');
  res.send(txt);
});
