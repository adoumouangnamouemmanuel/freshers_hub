const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { 
  handleGetGroups, 
  handleGetMyGroups, 
  handleGetGroupById,
  handleJoinGroup,
  handleLeaveGroup
} = require("../controllers/groupController");

const router = express.Router();

router.get("/", handleGetGroups);
router.get("/my", requireAuth, handleGetMyGroups);
router.get("/:id", handleGetGroupById);
router.post("/:id/join", requireAuth, handleJoinGroup);
router.delete("/:id/leave", requireAuth, handleLeaveGroup);

module.exports = router;
