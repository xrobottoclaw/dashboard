import { Router } from 'express';
import { oc } from '../services/openclaw.js';

export const openclawProxyRouter = Router();

openclawProxyRouter.all('/*', async (req, res) => {
  try {
    const path = `/${req.params[0] || ''}`;
    const method = req.method.toLowerCase();
    const r = await oc.request({
      url: path,
      method,
      params: req.query,
      data: req.body,
      validateStatus: () => true
    });
    res.status(r.status).json(r.data);
  } catch (e) {
    res.status(502).json({ error: 'OpenClaw upstream unavailable', detail: e.message });
  }
});
