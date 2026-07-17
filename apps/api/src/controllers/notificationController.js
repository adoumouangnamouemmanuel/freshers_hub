const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { pool } = require("../services/db");

/**
 * GET /notifications
 * Returns the user's notifications with unread count.
 */
const handleGetNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    const { rows: notifications } = await client.query(
      `SELECT id, category, title, body, related_entity as "relatedEntity",
              read_at as "readAt", created_at as "createdAt"
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId]
    );

    const { rows: countRows } = await client.query(
      `SELECT COUNT(*)::int as "unreadCount"
       FROM notifications
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    res.json({
      notifications,
      unreadCount: countRows[0]?.unreadCount || 0,
    });
  } finally {
    client.release();
  }
});

/**
 * PATCH /notifications/:id/read
 * Marks a single notification as read.
 */
const handleMarkRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    const { rowCount } = await client.query(
      `UPDATE notifications SET read_at = now()
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
      [id, userId]
    );

    if (rowCount === 0) {
      throw new AppError("Notification not found or already read", 404);
    }

    res.json({ success: true });
  } finally {
    client.release();
  }
});

/**
 * PATCH /notifications/read-all
 * Marks all of the user's notifications as read.
 */
const handleMarkAllRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    const { rowCount } = await client.query(
      `UPDATE notifications SET read_at = now()
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    res.json({ success: true, markedCount: rowCount });
  } finally {
    client.release();
  }
});

/**
 * GET /notifications/unread-count
 * Returns just the unread count (lightweight endpoint for badge polling).
 */
const handleUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT COUNT(*)::int as "unreadCount"
       FROM notifications
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );

    res.json({ unreadCount: rows[0]?.unreadCount || 0 });
  } finally {
    client.release();
  }
});

module.exports = {
  handleGetNotifications,
  handleMarkRead,
  handleMarkAllRead,
  handleUnreadCount,
};
