/**
 * EcoLoop Database Connection Manager
 * Utilizes SQLite via better-sqlite3 for local relational persistence.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DEFAULT_DB_PATH = path.join(__dirname, '../../data/ecoloop.db');

let instance = null;

function getDb(customPath = null) {
  if (instance && !customPath) {
    return instance;
  }

  const dbPath = customPath || process.env.DATABASE_PATH || DEFAULT_DB_PATH;
  
  // Ensure target directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath);
  
  // Enforce referential integrity and concurrent performance
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');

  if (!customPath) {
    instance = db;
  }
  return db;
}

function closeDb() {
  if (instance) {
    try {
      instance.close();
    } catch {
      // Ignore if already closed
    }
    instance = null;
  }
}

module.exports = {
  getDb,
  closeDb,
  DEFAULT_DB_PATH
};
