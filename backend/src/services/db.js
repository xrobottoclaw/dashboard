import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || '/data/dashboard.sqlite';
export const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL
);
`);

const insertStmt = db.prepare('INSERT INTO events (ts, type, payload) VALUES (?, ?, ?)');

export function recordEvent(type, payload) {
  insertStmt.run(Date.now(), type, JSON.stringify(payload || {}));
}
