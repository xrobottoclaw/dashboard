import fs from 'fs';
import path from 'path';

const statePath = process.env.DASHBOARD_STATE_PATH || '/data/state.json';

export function loadState() {
  try {
    if (!fs.existsSync(statePath)) return null;
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // noop
  }
}
