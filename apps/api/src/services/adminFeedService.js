const adminFeedRepository = require('../repositories/adminFeedRepository');
const adminAuditLogRepository = require('../repositories/adminAuditLogRepository');
const AppError = require('../utils/AppError');

const listPosts = (filters)       => adminFeedRepository.listPosts(filters);
const createPost = (data)         => adminFeedRepository.createPost(data);
const listGroups = (pagination)   => adminFeedRepository.listGroups(pagination);
const createGroup = (data)        => adminFeedRepository.createGroup(data);
const addGroupMembers = (id, ids) => adminFeedRepository.addGroupMembers(id, ids);
const listEvents = (filters)      => adminFeedRepository.listEvents(filters);

/**
 * Moderation delete: snapshot content into audit log BEFORE removing the post.
 * The snapshot is stored in audit_log.metadata so "what was removed and why"
 * remains inspectable even after the post itself is gone.
 */
const deletePost = async (postId, actorId, ip) => {
  const result = await adminFeedRepository.hardDeletePost(postId);
  if (!result || !result.deleted) throw new AppError('Post not found', 404);

  // Write audit entry with content snapshot immediately
  await adminAuditLogRepository.createEntry(
    actorId,
    'post.removed',
    'post',
    postId,
    { snapshot: result.snapshot },
    ip
  );

  return result.deleted;
};

const updateEvent = async (id, fields) => {
  const updated = await adminFeedRepository.updateEvent(id, fields);
  if (!updated) throw new AppError('Event not found', 404);
  return updated;
};

module.exports = { listPosts, createPost, deletePost, listGroups, createGroup, addGroupMembers, listEvents, updateEvent };
