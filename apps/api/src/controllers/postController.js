const { pool } = require("../services/db");
const { verifyJwt } = require("../services/authService");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const postService = require("../services/postService");

const extractUserPayload = (req, required = false) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) {
    if (required) throw new AppError("Missing token", 401);
    return null;
  }
  const payload = verifyJwt(token);
  if (!payload && required) {
    throw new AppError("Invalid token", 401);
  }
  return payload;
};

const handleGetPosts = asyncHandler(async (req, res) => {
  const payload = extractUserPayload(req, false);
  const userId = payload ? payload.sub : null;
  
  let authorId = null;
  if (req.query.author === 'me') {
    if (!userId) throw new AppError("Authentication required to fetch your posts", 401);
    authorId = userId;
  }

  const client = await pool.connect();
  try {
    const result = await postService.getPosts(client, {
      userId,
      page: req.query.page,
      limit: req.query.limit,
      category: req.query.category,
      authorId
    });
    res.json(result);
  } finally {
    client.release();
  }
});

const handleCreatePost = asyncHandler(async (req, res) => {
  const userPayload = extractUserPayload(req, true);
  
  const client = await pool.connect();
  try {
    const post = await postService.createPost(client, {
      userPayload,
      ...req.body
    });
    res.status(201).json({ post });
  } finally {
    client.release();
  }
});

const handleGetPostById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const post = await postService.getPostById(client, id);
    res.json({ post });
  } finally {
    client.release();
  }
});

const handleUpdatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userPayload = extractUserPayload(req, true);
  
  const client = await pool.connect();
  try {
    const post = await postService.updatePost(client, {
      postId: id,
      userPayload,
      updateData: req.body
    });
    res.json({ post });
  } finally {
    client.release();
  }
});

const handleDeletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userPayload = extractUserPayload(req, true);
  
  const client = await pool.connect();
  try {
    await postService.deletePost(client, {
      postId: id,
      userPayload
    });
    res.json({ success: true });
  } finally {
    client.release();
  }
});

module.exports = {
  handleGetPosts,
  handleGetPostById,
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost,
};
