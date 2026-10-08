/**
 * EcoLoop Database Migration Runner
 * Executes versioned SQL migrations in alphabetical/numerical order.
 */

const fs = require('fs');
const path = require('path');
const { getDb } = require('./connection');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function runMigrations(db = null) {
  const dbInstance = db || getDb();

  // 1. Ensure migrations ledger exists
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // 2. Fetch applied migration versions
  const appliedRows = dbInstance.prepare('SELECT version, name FROM schema_migrations ORDER BY version ASC').all();
  const appliedVersions = new Set(appliedRows.map(r => r.version));

  // 3. Read migration files
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const executed = [];

  for (const file of files) {
    const match = file.match(/^(\d+)_(.*)\.sql$/);
    if (!match) continue;

    const version = parseInt(match[1], 10);
    const name = match[2];

    if (!appliedVersions.has(version)) {
      const sqlContent = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      // Execute migration inside a transaction
      const runTransaction = dbInstance.transaction(() => {
        dbInstance.exec(sqlContent);
        dbInstance.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)').run(version, name);
      });

      runTransaction();
      executed.push({ version, name, file });
    }
  }

  return executed;
}

module.exports = {
  runMigrations
};
