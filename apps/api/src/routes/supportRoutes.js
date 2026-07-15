const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const supportController = require("../controllers/supportController");
const supportAdminController = require("../controllers/supportAdminController");

const router = express.Router();

router.use(requireAuth);

router.get("/sessions", supportController.getSessions);
router.post("/sessions", supportController.bookSession);
router.put("/sessions/:id/status", supportController.updateSessionStatus);
router.put("/sessions/:id", supportController.updateSession);
router.delete("/sessions/:id", supportController.deleteSession);

router.get("/coaches/assigned", supportController.getCoachAssignments);
router.get("/coaches/freshers", supportController.getAssignedFreshers);

router.get("/buddy", supportController.getBuddyPairing);

router.post("/contact", supportController.logContactClick);

// Admin Routes
router.get("/admin/dashboard", supportAdminController.getAdminDashboardStats);
router.get("/admin/coaches", supportAdminController.getAdminCoaches);
router.post("/admin/coaches/promote", supportAdminController.promoteToCoach);
router.get("/admin/freshers", supportAdminController.getAdminFreshers);
router.get("/admin/users/:id", supportAdminController.getAdminUserProfile);
router.post("/admin/assignments", supportAdminController.assignFresherToCoach);
router.post("/admin/assignments/bulk", supportAdminController.bulkAssignFreshers);
router.get("/admin/reports", supportAdminController.getAdminReports);
router.put("/admin/reports/:id/flag", supportAdminController.flagReport);
router.post("/admin/compliance/followup", supportAdminController.logComplianceFollowUp);
router.get("/admin/announcements", supportAdminController.getAnnouncements);
router.post("/admin/announcements", supportAdminController.postAnnouncement);
router.put("/admin/announcements/:id", supportAdminController.updateAnnouncement);
router.delete("/admin/announcements/:id", supportAdminController.deleteAnnouncement);
router.get("/admin/sessions", supportAdminController.getAdminSessions);
router.post("/admin/sessions", supportAdminController.adminBookSession);
router.get("/admin/students", supportAdminController.getAdminStudents);

module.exports = router;
