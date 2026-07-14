const express = require("express");
const { requireAuth, requireRoles } = require("../middleware/authMiddleware");
const {
  handleCreateEvent,
  handleGetEvents,
  handleGetEventById,
  handleRsvp,
  handleGetRsvps,
} = require("../controllers/eventController");

const router = express.Router();

// All event routes require authentication
router.use(requireAuth);

router.post("/", requireRoles("staff", "faculty", "student_leader", "admin", "club_lead"), handleCreateEvent);
router.get("/", handleGetEvents);
router.get("/:id", handleGetEventById);
router.post("/:id/rsvp", handleRsvp);
router.get("/:id/rsvps", handleGetRsvps);

module.exports = router;
