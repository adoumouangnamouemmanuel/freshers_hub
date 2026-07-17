const notificationRepo = require("../repositories/notificationRepository");
const AppError = require("../utils/AppError");

const getNotifications = async (userId, page, limit) => {
  const offset = (page - 1) * limit;
  const result = await notificationRepo.getNotifications(userId, limit, offset);
  
  // Optionally fetch unread count at the same time
  const unreadCount = await notificationRepo.getUnreadCount(userId);

  return {
    notifications: result.notifications,
    unreadCount,
    meta: {
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    },
  };
};

const getUnreadCount = async (userId) => {
  const count = await notificationRepo.getUnreadCount(userId);
  return { unreadCount: count };
};

const markAsRead = async (id, userId) => {
  const success = await notificationRepo.markAsRead(id, userId);
  if (!success) {
    throw new AppError("Notification not found or already read", 404);
  }
  return { success: true };
};

const markAllAsRead = async (userId) => {
  const markedCount = await notificationRepo.markAllAsRead(userId);
  return { success: true, markedCount };
};

const createNotification = async (userId, category, title, body, relatedEntity = null) => {
  return await notificationRepo.createNotification(userId, category, title, body, relatedEntity);
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
};
