const { pool } = require('./src/services/db');

async function run() {
  try {
    // Test updating the one session we know exists
    const { rows } = await pool.query(`
      UPDATE sessions
      SET location = COALESCE($1, location),
          description = COALESCE($2, description),
          scheduled_at = COALESCE($3, scheduled_at),
          updated_at = now()
      WHERE id = $4
      RETURNING id, location, description, scheduled_at, status
    `, ['Test Room 202', 'Test description update', null, '913e8b0e-7d18-4058-bb77-bdfef4acb257']);
    
    if (rows.length === 0) {
      console.log('No session found');
    } else {
      console.log('Updated session:', JSON.stringify(rows[0], null, 2));
    }
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    pool.end();
  }
}
run();
