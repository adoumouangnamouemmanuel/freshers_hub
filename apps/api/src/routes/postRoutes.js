const express = require("express");
const { 
  handleGetPosts, 
  handleCreatePost,
  handleGetPostById,
  handleUpdatePost,
  handleDeletePost
} = require("../controllers/postController");

const router = express.Router();

router.get("/", handleGetPosts);
router.post("/", handleCreatePost);
router.get("/:id", handleGetPostById);
router.put("/:id", handleUpdatePost);
router.delete("/:id", handleDeletePost);

module.exports = router;
