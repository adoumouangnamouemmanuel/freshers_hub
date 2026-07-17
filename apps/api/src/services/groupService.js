const groupRepository = require("../repositories/groupRepository");
const AppError = require("../utils/AppError");

const getGroups = async (filters, page, limit) => {
  return await groupRepository.getGroups(filters, page, limit);
};

const getMyGroups = async (userId, filters, page, limit) => {
  return await groupRepository.getMyGroups(userId, filters, page, limit);
};

const getGroupById = async (id) => {
  const group = await groupRepository.getGroupById(id);
  if (!group) {
    throw new AppError("Group not found", 404);
  }
  
  const members = await groupRepository.getGroupMembers(id);
  group.members = members;
  group.leaders = members.filter(m => m.is_leader);
  
  return group;
};

const createGroup = async (groupData, creatorId) => {
  return await groupRepository.createGroup(groupData, creatorId);
};

const updateGroup = async (id, groupData, userId) => {
  const membership = await groupRepository.checkGroupMembership(id, userId);
  
  if (!membership || !membership.is_leader) {
    throw new AppError("Only group leaders can update group info", 403);
  }
  
  const group = await groupRepository.updateGroup(id, groupData);
  if (!group) {
    throw new AppError("Group not found", 404);
  }
  return group;
};

const deleteGroup = async (id, userId, userRoles) => {
  const isAdmin = userRoles.includes("admin");
  const membership = await groupRepository.checkGroupMembership(id, userId);
  
  if (!isAdmin && (!membership || !membership.is_leader)) {
    throw new AppError("Only group leaders or admins can delete groups", 403);
  }
  
  const deleted = await groupRepository.deleteGroup(id);
  if (!deleted) {
    throw new AppError("Group not found", 404);
  }
  return true;
};

const joinGroup = async (groupId, userId) => {
  const group = await groupRepository.getGroupById(groupId);
  if (!group) {
    throw new AppError("Group not found", 404);
  }
  
  return await groupRepository.joinGroup(groupId, userId);
};

const leaveGroup = async (groupId, userId) => {
  const membership = await groupRepository.checkGroupMembership(groupId, userId);
  if (membership && membership.is_leader) {
    throw new AppError("Group leaders cannot leave the group directly. Transfer leadership first.", 400);
  }

  const success = await groupRepository.leaveGroup(groupId, userId);
  if (!success) {
    throw new AppError("You are not a member of this group", 400);
  }
  return success;
};

const getGroupPosts = async (groupId, page, limit) => {
  return await groupRepository.getGroupPosts(groupId, page, limit);
};

const getMyGroupsPosts = async (userId, page, limit) => {
  return await groupRepository.getMyGroupsPosts(userId, page, limit);
};

module.exports = {
  getGroups,
  getMyGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getGroupPosts,
  getMyGroupsPosts,
};
