const { pool } = require("../services/db");

const getNotifications = async (userId, limit, offset) => {
  const { rows } = await pool.query(`
    SELECT id, category, title, body, related_entity as "relatedEntity",
           read_at as "readAt", created_at as "createdAt", updated_at as "updatedAt"
    FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `, [userId, limit, offset]);

  const count = await pool.query(`
    SELECT COUNT(*) 
    FROM notifications
    WHERE user_id = $1
  `, [userId]);

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

// Also expose an insert notification method used by other services (like posts and events)
const createNotification = async (userId, category, title, body, relatedEntity) => {
  const { rows } = await pool.query(`
    INSERT INTO notifications (user_id, category, title, body, related_entity)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [userId, category, title, body, relatedEntity]);
  return rows[0];
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
};
