export function apiKeyMiddleware(req, res, next) {
  const expected = process.env.DASHBOARD_API_KEY || '';
  if (!expected) return res.status(500).json({ error: 'DASHBOARD_API_KEY not configured' });
  const got = req.headers['x-api-key'];
  if (!got || got !== expected) return res.status(401).json({ error: 'Invalid API key' });
  next();
}
