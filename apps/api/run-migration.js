const { pool } = require("./src/services/db");

async function run() {
  try {
    const res = await pool.query(`
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    console.log("Migration successful");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
}

run();
