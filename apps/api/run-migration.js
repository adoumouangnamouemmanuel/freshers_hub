const { pool } = require("./src/services/db");

const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'migrations', '004_merge_clubs_to_groups.sql'), 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    for (const statement of statements) {
      await pool.query(statement);
    }
    console.log("Migration 004 successful");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
