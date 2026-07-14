const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  handleGetNotifications,
  handleMarkRead,
  handleMarkAllRead,
  handleUnreadCount,
} = require("../controllers/notificationController");

const router = express.Router();

// All notification routes require authentication
router.use(requireAuth);

router.get("/", handleGetNotifications);
router.get("/unread-count", handleUnreadCount);
router.patch("/read-all", handleMarkAllRead);
router.patch("/:id/read", handleMarkRead);

module.exports = router;
