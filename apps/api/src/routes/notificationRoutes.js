const express = require("express");
const { requireAuth, requireRoles } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { uuidSchema, notificationQuerySchema } = require("../schemas/notificationSchemas");
const { z } = require("zod");
const {
  handleGetNotifications,
  handleMarkRead,
  handleMarkAllRead,
  handleUnreadCount,
  handleRegisterPushToken,
  handleRemovePushToken,
  handleSendNotification,
  handleGetSettings,
  handleUpdateSettings,
} = require("../controllers/notificationController");

const router = express.Router();
router.use(requireAuth);

// ── In-app notifications ──────────────────────────────────────────────────────
router.get(
  "/",
  validate(z.object({ query: notificationQuerySchema })),
  handleGetNotifications
);
router.get("/unread-count", handleUnreadCount);
router.get("/settings", handleGetSettings);
router.put("/settings", handleUpdateSettings);
router.patch("/read-all", handleMarkAllRead);
router.patch(
  "/:id/read",
  validate(z.object({ params: z.object({ id: uuidSchema }) })),
  handleMarkRead
);

// ── Push token opt-in / opt-out ───────────────────────────────────────────────
router.post("/push-token", handleRegisterPushToken);
router.delete("/push-token", handleRemovePushToken);

// ── Send notification (immediate or scheduled reminder) ───────────────────────
router.post(
  "/send",
  requireRoles("counsellor", "coach_admin", "advisor", "admin", "oipcc_admin", "staff", "faculty", "platform_admin"),
  handleSendNotification
);

module.exports = router;
