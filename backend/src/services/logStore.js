export const logBuffer = [];
let onPush = null;

export function setLogPushHandler(fn) {
  onPush = fn;
}

export function pushLog(entry) {
  logBuffer.push(entry);
  if (logBuffer.length > 5000) logBuffer.shift();
  if (onPush) onPush(entry);
}

export function queryLogs({ level, keyword } = {}) {
  return logBuffer.filter((l) => {
    if (level && l.level !== level) return false;
    if (keyword && !String(l.message).toLowerCase().includes(String(keyword).toLowerCase())) return false;
    return true;
  });
}
