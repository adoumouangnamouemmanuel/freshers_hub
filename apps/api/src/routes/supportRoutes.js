const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const supportController = require("../controllers/supportController");

const router = express.Router();

router.use(requireAuth);

router.get("/sessions", supportController.getSessions);
router.post("/sessions", supportController.bookSession);
router.put("/sessions/:id/status", supportController.updateSessionStatus);

router.get("/coaches/assigned", supportController.getCoachAssignments);
router.get("/coaches/freshers", supportController.getAssignedFreshers);

router.get("/buddy", supportController.getBuddyPairing);

router.post("/contact", supportController.logContactClick);

module.exports = router;
