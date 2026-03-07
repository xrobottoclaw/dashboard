import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { signToken } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  const envUser = process.env.DASHBOARD_USERNAME || 'admin';
  const envPass = process.env.DASHBOARD_PASSWORD || 'admin123';
  const isMatch = username === envUser && (password === envPass || await bcrypt.compare(password, envPass));

  if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken({ username });
  res.json({ token, username });
});
