export const logBuffer = [];

export function pushLog(entry) {
  logBuffer.push(entry);
  if (logBuffer.length > 5000) logBuffer.shift();
}

export function queryLogs({ level, keyword } = {}) {
  return logBuffer.filter((l) => {
    if (level && l.level !== level) return false;
    if (keyword && !String(l.message).toLowerCase().includes(String(keyword).toLowerCase())) return false;
    return true;
  });
}
