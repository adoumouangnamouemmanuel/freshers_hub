const { pool } = require('../services/db');

class AdminSettingsRepository {
  async get(key) {
    const { rows } = await pool.query(
      `SELECT key, value, updated_at FROM platform_settings WHERE key = $1`,
      [key]
    );
    return rows[0] || null;
  }

  async getAll(keys = []) {
    if (keys.length === 0) {
      const { rows } = await pool.query(`SELECT key, value, updated_at FROM platform_settings ORDER BY key`);
      return rows;
    }
    const { rows } = await pool.query(
      `SELECT key, value, updated_at FROM platform_settings WHERE key = ANY($1)`,
      [keys]
    );
    return rows;
  }

  async set(key, value, updatedBy) {
    const { rows } = await pool.query(
      `INSERT INTO platform_settings (key, value, updated_by)
       VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = now(), updated_by = EXCLUDED.updated_by
       RETURNING *`,
      [key, JSON.stringify(value), updatedBy]
    );
    return rows[0];
  }

  // ── Platform Admins ────────────────────────────────────────────────────────

  async listAdmins() {
    const { rows } = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.avatar_url, ur.granted_at
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE r.name = 'platform_admin'
       ORDER BY u.full_name`
    );
    return rows;
  }

  async grantPlatformAdmin(userId, grantedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: roleRows } = await client.query(
        `SELECT id FROM roles WHERE name = 'platform_admin' LIMIT 1`
      );
      if (!roleRows.length) throw new Error('platform_admin role not defined in roles table');

      const roleId = roleRows[0].id;

      const { rows } = await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING
         RETURNING *`,
        [userId, roleId]
      );

      await client.query('COMMIT');
      return rows[0] || null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async revokePlatformAdmin(userId) {
    const { rows: roleRows } = await pool.query(
      `SELECT id FROM roles WHERE name = 'platform_admin' LIMIT 1`
    );
    if (!roleRows.length) return null;

    const { rows } = await pool.query(
      `DELETE FROM user_roles
       WHERE user_id = $1 AND role_id = $2
       RETURNING *`,
      [userId, roleRows[0].id]
    );
    return rows[0] || null;
  }
}

module.exports = new AdminSettingsRepository();
