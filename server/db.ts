import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const dbPath = path.join(DB_DIR, 'work_system.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS payouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_from TEXT NOT NULL,
    date_to TEXT NOT NULL,
    amount_net REAL NOT NULL,
    amount_gross REAL NOT NULL,
    document_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS work_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    break_minutes INTEGER NOT NULL DEFAULT 0,
    net_hours REAL NOT NULL,
    payout_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    default_start_time TEXT NOT NULL DEFAULT '08:00',
    default_end_time TEXT NOT NULL DEFAULT '16:00',
    default_break_minutes INTEGER NOT NULL DEFAULT 0
  );

  INSERT OR IGNORE INTO settings (id, default_start_time, default_end_time, default_break_minutes) 
  VALUES (1, '08:00', '16:00', 0);
`);

export default db;
