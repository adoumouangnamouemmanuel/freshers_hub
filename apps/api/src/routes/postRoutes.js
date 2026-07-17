const express = require("express");
const { 
  handleGetPosts, 
  handleCreatePost,
  handleGetPostById,
  handleUpdatePost,
  handleDeletePost
} = require("../controllers/postController");

const validate = require("../middleware/validate");
const { 
  getPostsQuerySchema, 
  createPostSchema, 
  updatePostSchema, 
  postIdParamSchema 
} = require("../schemas/postSchemas");

const router = express.Router();

// Fetch posts (supports pagination, filtering, and author=me via query)
router.get("/", validate(getPostsQuerySchema), handleGetPosts);

// Create a new post
router.post("/", validate(createPostSchema), handleCreatePost);

// Get specific post
router.get("/:id", validate(postIdParamSchema), handleGetPostById);

// Update specific post
router.put("/:id", validate(postIdParamSchema), validate(updatePostSchema), handleUpdatePost);

// Delete specific post
router.delete("/:id", validate(postIdParamSchema), handleDeletePost);

module.exports = router;
