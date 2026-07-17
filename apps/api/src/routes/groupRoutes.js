const express = require("express");
const { requireAuth, requireRoles } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validate");
const { 
  createGroupSchema, 
  updateGroupSchema, 
  groupQuerySchema, 
  uuidSchema 
} = require("../schemas/groupSchemas");
const { z } = require("zod");

const { 
  handleGetGroups, 
  handleGetMyGroups, 
  handleGetGroupById,
  handleCreateGroup,
  handleUpdateGroup,
  handleDeleteGroup,
  handleJoinGroup,
  handleLeaveGroup,
  handleGetGroupPosts,
  handleGetMyGroupsPosts
} = require("../controllers/groupController");

const router = express.Router();

const idParamSchema = z.object({ params: z.object({ id: uuidSchema }) });

router.get("/", validate(z.object({ query: groupQuerySchema })), handleGetGroups);
router.post("/", requireAuth, validate(z.object({ body: createGroupSchema })), handleCreateGroup);

router.get("/my", requireAuth, validate(z.object({ query: groupQuerySchema })), handleGetMyGroups);
router.get("/my/posts", requireAuth, validate(z.object({ query: groupQuerySchema })), handleGetMyGroupsPosts);

router.get("/:id", validate(idParamSchema), handleGetGroupById);
router.put("/:id", requireAuth, validate(idParamSchema), validate(z.object({ body: updateGroupSchema })), handleUpdateGroup);
router.delete("/:id", requireAuth, validate(idParamSchema), handleDeleteGroup);

router.get("/:id/posts", requireAuth, validate(idParamSchema), validate(z.object({ query: groupQuerySchema })), handleGetGroupPosts);
router.post("/:id/join", requireAuth, validate(idParamSchema), handleJoinGroup);
router.delete("/:id/leave", requireAuth, validate(idParamSchema), handleLeaveGroup);

module.exports = router;
