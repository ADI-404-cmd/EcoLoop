/**
 * EcoLoop Database Initialization CLI Script
 * Usage:
 *   node server/db/init.js         # Production / Clean Setup (Empty submissions)
 *   node server/db/init.js --demo  # Seeds demo submission records
 */

const { getDb, closeDb } = require('./connection');
const { runMigrations } = require('./migrate');
const { seedDatabase } = require('./seed');

function init(options = {}) {
  const includeDemo = options.demo || process.argv.includes('--demo');

  console.log('[EcoLoop DB Init] Connecting to SQLite database...');
  const db = getDb();

  console.log('[EcoLoop DB Init] Running migrations...');
  const executed = runMigrations(db);
  console.log(`[EcoLoop DB Init] Executed ${executed.length} migration(s).`);

  console.log('[EcoLoop DB Init] Seeding reference data & collection centers...');
  const seedResult = seedDatabase({ db, includeDemo });
  console.log(`[EcoLoop DB Init] Seed completed. Demo submissions loaded: ${seedResult.demoLoaded ? 'YES' : 'NO'}`);

  return seedResult;
}

if (require.main === module) {
  try {
    init();
    console.log('[EcoLoop DB Init] Database initialized successfully!');
    closeDb();
    process.exit(0);
  } catch (err) {
    console.error('[EcoLoop DB Init] Fatal error during database initialization:', err);
    closeDb();
    process.exit(1);
  }
}

module.exports = { init };
