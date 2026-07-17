const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { uuidSchema, notificationQuerySchema } = require("../schemas/notificationSchemas");
const { z } = require("zod");
const {
  handleGetNotifications,
  handleMarkRead,
  handleMarkAllRead,
  handleUnreadCount,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(requireAuth);

router.get(
  "/",
  validate(z.object({ query: notificationQuerySchema })),
  handleGetNotifications
);

router.get("/unread-count", handleUnreadCount);

router.patch("/read-all", handleMarkAllRead);

router.patch(
  "/:id/read",
  validate(z.object({ params: z.object({ id: uuidSchema }) })),
  handleMarkRead
);

module.exports = router;
