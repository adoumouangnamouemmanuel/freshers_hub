const { pool } = require('../services/db');

class AdminNotificationsRepository {
  async getCategoryStats() {
    // Pull distinct categories from the notifications table with delivery counts
    const { rows } = await pool.query(
      `SELECT
         category,
         COUNT(*)                                          AS total_sent,
         COUNT(*) FILTER (WHERE read_at IS NOT NULL)      AS total_read,
         ROUND(
           COUNT(*) FILTER (WHERE read_at IS NOT NULL)::NUMERIC
           / NULLIF(COUNT(*), 0) * 100
         )                                                AS read_rate_pct
       FROM notifications
       GROUP BY category
       ORDER BY category`
    );
    return rows;
  }

  async getCategoryDefaults() {
    const { rows } = await pool.query(
      `SELECT key, value FROM platform_settings WHERE key LIKE 'notif_category_%'`
    );
    return rows;
  }

  async updateCategoryDefault(key, enabled) {
    const settingKey = key.startsWith('notif_category_') ? key : `notif_category_${key}`;
    const { rows } = await pool.query(
      `INSERT INTO platform_settings (key, value)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
       RETURNING *`,
      [settingKey, JSON.stringify({ enabled })]
    );
    return rows[0];
  }
}

module.exports = new AdminNotificationsRepository();
