import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

export const filesRouter = Router();
const ROOT = path.resolve(process.env.WORKSPACE_ROOT || '/workspace');

const safePath = (p = '.') => {
  const abs = path.resolve(ROOT, p);
  if (!abs.startsWith(ROOT)) throw new Error('Invalid path');
  return abs;
};

filesRouter.get('/', async (req, res) => {
  try {
    const dir = safePath(req.query.path);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    res.json(entries.map(e => ({ name: e.name, type: e.isDirectory() ? 'dir' : 'file' })));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

filesRouter.get('/list', async (req, res) => {
  try {
    const dir = safePath(req.query.path);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    res.json(entries.map(e => ({ name: e.name, type: e.isDirectory() ? 'dir' : 'file' })));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

filesRouter.get('/read', async (req, res) => {
  try { res.send(await fs.readFile(safePath(req.query.path), 'utf8')); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

filesRouter.post('/write', async (req, res) => {
  try { await fs.writeFile(safePath(req.body.path), req.body.content || ''); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

filesRouter.post('/mkdir', async (req, res) => {
  try { await fs.mkdir(safePath(req.body.path), { recursive: true }); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

filesRouter.post('/rename', async (req, res) => {
  try { await fs.rename(safePath(req.body.oldPath), safePath(req.body.newPath)); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

filesRouter.get('/download', async (req, res) => {
  try { return res.download(safePath(req.query.path)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

filesRouter.get('/content', async (req, res) => {
  try { res.send(await fs.readFile(safePath(req.query.path), 'utf8')); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

filesRouter.put('/content', async (req, res) => {
  try { await fs.writeFile(safePath(req.query.path), req.body.content || ''); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

filesRouter.post('/mkdir-by-query', async (req, res) => {
  try { await fs.mkdir(safePath(req.query.path), { recursive: true }); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

filesRouter.delete('/', async (req, res) => {
  try { await fs.rm(safePath(req.query.path), { recursive: true, force: true }); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
