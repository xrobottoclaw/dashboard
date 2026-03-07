import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'change-me';

export function signToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES || '8h' });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function authOrApiKeyMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey && process.env.DASHBOARD_API_KEY && apiKey === process.env.DASHBOARD_API_KEY) {
    req.user = { username: 'openclaw-api' };
    return next();
  }
  return authMiddleware(req, res, next);
}
