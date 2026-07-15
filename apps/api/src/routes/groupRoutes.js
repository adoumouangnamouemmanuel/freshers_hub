const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { 
  handleGetGroups, 
  handleGetMyGroups, 
  handleGetGroupById,
  handleJoinGroup,
  handleLeaveGroup,
  handleUpdateGroup,
  handleGetGroupPosts,
  handleGetMyGroupsPosts
} = require("../controllers/groupController");

const router = express.Router();

router.get("/", handleGetGroups);
router.get("/my", requireAuth, handleGetMyGroups);
router.get("/my/posts", requireAuth, handleGetMyGroupsPosts);
router.get("/:id", handleGetGroupById);
router.put("/:id", requireAuth, handleUpdateGroup);
router.get("/:id/posts", requireAuth, handleGetGroupPosts);
router.post("/:id/join", requireAuth, handleJoinGroup);
router.delete("/:id/leave", requireAuth, handleLeaveGroup);

module.exports = router;
