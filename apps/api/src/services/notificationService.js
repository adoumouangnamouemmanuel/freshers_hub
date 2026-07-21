const notificationRepo = require("../repositories/notificationRepository");
const AppError = require("../utils/AppError");

// ── Helpers ────────────────────────────────────────────────────────────────────
const safePage  = (v) => (Number.isFinite(+v) && +v >= 1 ? Math.floor(+v) : 1);
const safeLimit = (v) => (Number.isFinite(+v) && +v >= 1 ? Math.min(Math.floor(+v), 100) : 20);

// ── Expo push sender ──────────────────────────────────────────────────────────
const sendExpoPush = async (tokens, title, body, data = {}) => {
  if (!tokens || tokens.length === 0) return;
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error("[Push] Failed to send Expo push:", err.message);
  }
};

// ── Core CRUD ──────────────────────────────────────────────────────────────────
const getNotifications = async (userId, page, limit) => {
  const p = safePage(page);
  const l = safeLimit(limit);
  const offset = (p - 1) * l;
  const result = await notificationRepo.getNotifications(userId, l, offset);
  const unreadCount = await notificationRepo.getUnreadCount(userId);
  return {
    notifications: result.notifications,
    unreadCount,
    meta: {
      total: result.total,
      page: p,
      limit: l,
      totalPages: Math.ceil(result.total / l),
    },
  };
};

const getUnreadCount = async (userId) => {
  const count = await notificationRepo.getUnreadCount(userId);
  return { unreadCount: count };
};

const markAsRead = async (id, userId) => {
  const success = await notificationRepo.markAsRead(id, userId);
  if (!success) throw new AppError("Notification not found or already read", 404);
  return { success: true };
};

const markAllAsRead = async (userId) => {
  const markedCount = await notificationRepo.markAllAsRead(userId);
  return { success: true, markedCount };
};

const createNotification = async (userId, category, title, body, relatedEntity = null) => {
  return await notificationRepo.createNotification(userId, category, title, body, relatedEntity);
};

// ── Push-token registration ────────────────────────────────────────────────────
const registerPushToken = async (userId, pushToken) => {
  await notificationRepo.upsertPushToken(userId, pushToken);
  return { success: true };
};

// ── Send notification (in-app + push) ─────────────────────────────────────────
const sendNotification = async ({ fromUserId, toUserId, category, title, body, relatedEntity = null }) => {
  // 1. Create in-app notification
  const notification = await notificationRepo.createNotification(toUserId, category, title, body, relatedEntity);

  // 2. Also push to device if user has opted in
  const tokens = await notificationRepo.getPushTokensForUser(toUserId);
  if (tokens.length > 0) {
    await sendExpoPush(tokens, title, body, { notificationId: notification.id, relatedEntity });
  }

  return notification;
};

// ── Scheduled reminder (stored for cron or one-shot delivery) ──────────────────
const scheduleReminder = async ({ userId, category, title, body, scheduledAt, relatedEntity = null }) => {
  const reminder = await notificationRepo.createReminder({
    userId,
    category,
    title,
    body,
    scheduledAt,
    relatedEntity,
  });
  return reminder;
};

// ── Process due reminders (called by a periodic job) ──────────────────────────
const processDueReminders = async () => {
  const due = await notificationRepo.getDueReminders();
  for (const reminder of due) {
    await sendNotification({
      toUserId: reminder.user_id,
      category: reminder.category,
      title: reminder.title,
      body: reminder.body,
      relatedEntity: reminder.related_entity,
    });
    await notificationRepo.markReminderSent(reminder.id);
  }
  return due.length;
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  registerPushToken,
  sendNotification,
  scheduleReminder,
  processDueReminders,
};
