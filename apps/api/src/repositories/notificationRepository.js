const { pool } = require("../services/db");

// ── Notifications ─────────────────────────────────────────────────────────────
const getNotifications = async (userId, limit, offset, filters = {}) => {
  let query = `
    SELECT id, category, title, body, related_entity as "relatedEntity",
           read_at as "readAt", created_at as "createdAt", updated_at as "updatedAt"
    FROM notifications
    WHERE user_id = $1
  `;
  let countQuery = `SELECT COUNT(*) FROM notifications WHERE user_id = $1`;
  const params = [userId];
  
  if (filters.category) {
    params.push(filters.category);
    query += ` AND category = $${params.length}`;
    countQuery += ` AND category = $${params.length}`;
  }
  
  if (filters.isRead !== undefined) {
    if (filters.isRead === 'true' || filters.isRead === true) {
      query += ` AND read_at IS NOT NULL`;
      countQuery += ` AND read_at IS NOT NULL`;
    } else if (filters.isRead === 'false' || filters.isRead === false) {
      query += ` AND read_at IS NULL`;
      countQuery += ` AND read_at IS NULL`;
    }
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  
  const queryParams = [...params, limit, offset];
  
  const { rows } = await pool.query(query, queryParams);
  const count = await pool.query(countQuery, params);

  return {
    notifications: rows,
    total: parseInt(count.rows[0].count, 10),
  };
};

const getUnreadCount = async (userId) => {
  const { rows } = await pool.query(`
    SELECT COUNT(*)::int as "unreadCount"
    FROM notifications
    WHERE user_id = $1 AND read_at IS NULL
  `, [userId]);
  return rows[0]?.unreadCount || 0;
};

const markAsRead = async (id, userId) => {
  const { rowCount } = await pool.query(`
    UPDATE notifications 
    SET read_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND user_id = $2 AND read_at IS NULL
  `, [id, userId]);
  return rowCount > 0;
};

const markAllAsRead = async (userId) => {
  const { rowCount } = await pool.query(`
    UPDATE notifications 
    SET read_at = NOW(), updated_at = NOW()
    WHERE user_id = $1 AND read_at IS NULL
  `, [userId]);
  return rowCount;
};

const createNotification = async (userId, category, title, body, relatedEntity) => {
  const { rows } = await pool.query(`
    INSERT INTO notifications (user_id, category, title, body, related_entity)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [userId, category, title, body, relatedEntity]);
  return rows[0];
};

// ── Push tokens ───────────────────────────────────────────────────────────────
const upsertPushToken = async (userId, pushToken) => {
  await pool.query(`
    INSERT INTO user_push_tokens (user_id, push_token, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id, push_token)
    DO UPDATE SET updated_at = NOW()
  `, [userId, pushToken]);
};

const removePushToken = async (userId, pushToken) => {
  await pool.query(`
    DELETE FROM user_push_tokens WHERE user_id = $1 AND push_token = $2
  `, [userId, pushToken]);
};

const removePushTokenByToken = async (pushToken) => {
  await pool.query(`
    DELETE FROM user_push_tokens WHERE push_token = $1
  `, [pushToken]);
};

const getPushTokensForUser = async (userId) => {
  const { rows } = await pool.query(`
    SELECT push_token FROM user_push_tokens WHERE user_id = $1
  `, [userId]);
  return rows.map((r) => r.push_token);
};

// ── Reminders ─────────────────────────────────────────────────────────────────
const createReminder = async ({ userId, category, title, body, scheduledAt, relatedEntity }) => {
  const { rows } = await pool.query(`
    INSERT INTO notification_reminders
      (user_id, category, title, body, scheduled_at, related_entity)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [userId, category, title, body, scheduledAt, relatedEntity]);
  return rows[0];
};

const getDueReminders = async () => {
  const { rows } = await pool.query(`
    SELECT * FROM notification_reminders
    WHERE scheduled_at <= NOW() AND sent_at IS NULL
    ORDER BY scheduled_at ASC
    LIMIT 100
  `);
  return rows;
};

const markReminderSent = async (id) => {
  await pool.query(`
    UPDATE notification_reminders SET sent_at = NOW() WHERE id = $1
  `, [id]);
};

// ── Settings ──────────────────────────────────────────────────────────────────
const getUserSettings = async (userId) => {
  const { rows } = await pool.query(`
    SELECT settings FROM user_notification_settings WHERE user_id = $1
  `, [userId]);
  return rows[0]?.settings || {};
};

const updateUserSettings = async (userId, settings) => {
  await pool.query(`
    INSERT INTO user_notification_settings (user_id, settings, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET settings = $2, updated_at = NOW()
  `, [userId, settings]);
};

// ── Pruning ───────────────────────────────────────────────────────────────────
const pruneOldNotifications = async () => {
  const { rowCount } = await pool.query(`
    DELETE FROM notifications 
    WHERE read_at < NOW() - INTERVAL '30 days'
  `);
  return rowCount;
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  upsertPushToken,
  removePushToken,
  removePushTokenByToken,
  getPushTokensForUser,
  createReminder,
  getDueReminders,
  markReminderSent,
  getUserSettings,
  updateUserSettings,
  pruneOldNotifications,
};
