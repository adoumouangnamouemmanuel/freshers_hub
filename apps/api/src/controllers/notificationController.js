const notificationService = require("../services/notificationService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

// ── GET /notifications ────────────────────────────────────────────────────────
const handleGetNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page, limit } = req.query;
  const result = await notificationService.getNotifications(userId, page, limit);
  res.json({
    success: true,
    notifications: result.notifications,
    unreadCount: result.unreadCount,
    meta: result.meta,
  });
});

// ── PATCH /notifications/:id/read ─────────────────────────────────────────────
const handleMarkRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await notificationService.markAsRead(id, req.user.id);
  res.json({ success: true });
});

// ── PATCH /notifications/read-all ─────────────────────────────────────────────
const handleMarkAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  res.json(result);
});

// ── GET /notifications/unread-count ──────────────────────────────────────────
const handleUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  res.json({ success: true, ...result });
});

// ── POST /notifications/push-token ────────────────────────────────────────────
const handleRegisterPushToken = asyncHandler(async (req, res) => {
  const { pushToken } = req.body;
  if (!pushToken || typeof pushToken !== "string") {
    throw new AppError("pushToken is required", 400);
  }
  await notificationService.registerPushToken(req.user.id, pushToken);
  res.json({ success: true });
});

// ── DELETE /notifications/push-token ─────────────────────────────────────────
const handleRemovePushToken = asyncHandler(async (req, res) => {
  const { pushToken } = req.body;
  if (!pushToken) throw new AppError("pushToken is required", 400);
  const repo = require("../repositories/notificationRepository");
  await repo.removePushToken(req.user.id, pushToken);
  res.json({ success: true });
});

// ── POST /notifications/send ──────────────────────────────────────────────────
// Allowed for coaches, counsellors, admins to send a notification to a user
const handleSendNotification = asyncHandler(async (req, res) => {
  const { toUserId, title, body, category = "nudge", relatedEntity = null, scheduledAt = null } = req.body;
  if (!toUserId || !title || !body) {
    throw new AppError("toUserId, title and body are required", 400);
  }

  if (scheduledAt) {
    // Schedule a reminder
    const reminder = await notificationService.scheduleReminder({
      userId: toUserId,
      category,
      title,
      body,
      scheduledAt: new Date(scheduledAt),
      relatedEntity,
    });
    return res.status(201).json({ success: true, reminder });
  }

  // Immediate send
  const notification = await notificationService.sendNotification({
    fromUserId: req.user.id,
    toUserId,
    category,
    title,
    body,
    relatedEntity,
  });
  res.status(201).json({ success: true, notification });
});

// ── GET /notifications/settings ───────────────────────────────────────────────
const handleGetSettings = asyncHandler(async (req, res) => {
  const settings = await notificationService.getUserSettings(req.user.id);
  res.json({ success: true, settings });
});

// ── PUT /notifications/settings ───────────────────────────────────────────────
const handleUpdateSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    throw new AppError("Invalid settings object", 400);
  }
  const result = await notificationService.updateUserSettings(req.user.id, settings);
  res.json(result);
});

module.exports = {
  handleGetNotifications,
  handleMarkRead,
  handleMarkAllRead,
  handleUnreadCount,
  handleRegisterPushToken,
  handleRemovePushToken,
  handleSendNotification,
  handleGetSettings,
  handleUpdateSettings,
};
