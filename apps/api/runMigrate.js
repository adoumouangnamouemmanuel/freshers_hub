const fs = require('fs');
const path = require('path');
const { pool } = require('./src/services/db');

async function runMigration() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', '012_map_enhancements.sql'), 'utf8');
    await pool.query(sql);
    console.log("Migration 012 applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}
runMigration();
