const notificationService = require("../services/notificationService");
const asyncHandler = require("../utils/asyncHandler");

const handleGetNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page, limit } = req.query; // Already validated and defaulted by Zod
  const result = await notificationService.getNotifications(userId, page, limit);
  
  res.json({
    success: true,
    data: result.notifications,
    unreadCount: result.unreadCount,
    meta: result.meta,
  });
});

const handleMarkRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  await notificationService.markAsRead(id, userId);
  res.json({ success: true });
});

const handleMarkAllRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await notificationService.markAllAsRead(userId);
  res.json(result);
});

const handleUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await notificationService.getUnreadCount(userId);
  res.json({ success: true, ...result });
});

module.exports = {
  handleGetNotifications,
  handleMarkRead,
  handleMarkAllRead,
  handleUnreadCount,
};
