const express = require("express");
const router = express.Router();
const systemController = require("../controllers/systemController");
const { requireAuth, requireRoles } = require("../middleware/authMiddleware");

// Only admins and support_admins should see system health
router.use(requireAuth);
router.use(requireRoles("admin", "support_admin", "platform_admin"));

router.get("/health", systemController.getHealthStatus);
router.get("/metrics", systemController.getTrafficMetrics);

module.exports = router;
