import axios from 'axios';

const baseURL = process.env.OPENCLAW_BASE_URL || 'http://127.0.0.1:18789';
const token = process.env.OPENCLAW_GATEWAY_TOKEN || '';

export const oc = axios.create({
  baseURL,
  timeout: 20000,
  headers: token ? { Authorization: `Bearer ${token}` } : {}
});

export async function ocGet(path, fallback) {
  try {
    const { data } = await oc.get(path);
    return data;
  } catch {
    return fallback;
  }
}

export async function ocPost(path, body = {}, fallback = null) {
  try {
    const { data } = await oc.post(path, body);
    return data;
  } catch {
    return fallback;
  }
}
