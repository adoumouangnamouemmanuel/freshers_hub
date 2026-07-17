const postRepository = require("../repositories/postRepository");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

const getPosts = async (client, { userId, page = 1, limit = 50, category, authorId }) => {
  try {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10))); // Max 100 per page

    const { rows, total } = await postRepository.findPosts(client, {
      userId,
      page: pageNum,
      limit: limitNum,
      category,
      authorId
    });

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: rows,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      }
    };
  } catch (error) {
    logger.error(`Error in getPosts service: ${error.message}`);
    throw error;
  }
};

const getPostById = async (client, postId) => {
  try {
    const post = await postRepository.findPostById(client, postId);
    if (!post) {
      throw new AppError("Post not found", 404);
    }
    return post;
  } catch (error) {
    logger.error(`Error in getPostById service: ${error.message}`);
    throw error;
  }
};

const createPost = async (client, { userPayload, title, content, category, visibility, targetGroupIds }) => {
  try {
    // Role Authorization Check
    const allowedRoles = ["staff", "faculty", "student_leader", "admin", "club_lead"];
    const hasAccess = userPayload.roles && userPayload.roles.some(r => allowedRoles.includes(r));
    
    if (!hasAccess) {
      logger.warn(`Unauthorized post creation attempt by user ${userPayload.sub}`);
      throw new AppError("Insufficient permissions to create post", 403);
    }

    await client.query("BEGIN");

    const post = await postRepository.insertPost(client, {
      authorId: userPayload.sub,
      title,
      content,
      category,
      visibility
    });

    if (visibility === "targeted" && targetGroupIds && targetGroupIds.length > 0) {
      await postRepository.insertPostTargets(client, post.id, targetGroupIds);
      
      await postRepository.insertNotificationsForTargets(client, {
        title,
        category,
        postId: post.id,
        targetGroupIds,
        authorId: userPayload.sub
      });
    }

    await client.query("COMMIT");
    return post;
  } catch (error) {
    await client.query("ROLLBACK");
    logger.error(`Error in createPost service: ${error.message}`);
    throw error;
  }
};

const updatePost = async (client, { postId, userPayload, updateData }) => {
  try {
    const authorId = await postRepository.findPostAuthor(client, postId);
    if (!authorId) {
      throw new AppError("Post not found", 404);
    }

    const isAuthor = authorId === userPayload.sub;
    const isAdmin = userPayload.roles && userPayload.roles.includes("admin");
    
    if (!isAuthor && !isAdmin) {
      logger.warn(`Unauthorized post update attempt by user ${userPayload.sub} on post ${postId}`);
      throw new AppError("Not authorized to edit this post", 403);
    }

    const post = await postRepository.updatePost(client, postId, updateData);
    return post;
  } catch (error) {
    logger.error(`Error in updatePost service: ${error.message}`);
    throw error;
  }
};

const deletePost = async (client, { postId, userPayload }) => {
  try {
    const authorId = await postRepository.findPostAuthor(client, postId);
    if (!authorId) {
      throw new AppError("Post not found", 404);
    }

    const isAuthor = authorId === userPayload.sub;
    const isAdmin = userPayload.roles && userPayload.roles.includes("admin");
    
    if (!isAuthor && !isAdmin) {
      logger.warn(`Unauthorized post deletion attempt by user ${userPayload.sub} on post ${postId}`);
      throw new AppError("Not authorized to delete this post", 403);
    }

    await postRepository.deletePost(client, postId);
  } catch (error) {
    logger.error(`Error in deletePost service: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost
};
