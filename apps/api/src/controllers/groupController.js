const groupService = require("../services/groupService");
const asyncHandler = require("../utils/asyncHandler");

const handleGetGroups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, q, type, category } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  const result = await groupService.getGroups({ q, type, category }, pageNum, limitNum);
  
  res.json({
    success: true,
    data: result.groups,
    meta: {
      total: result.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.total / limitNum),
    },
  });
});

const handleGetMyGroups = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, q, type, category } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  const result = await groupService.getMyGroups(userId, { q, type, category }, pageNum, limitNum);
  
  res.json({
    success: true,
    data: result.groups,
    meta: {
      total: result.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.total / limitNum),
    },
  });
});

const handleGetGroupById = asyncHandler(async (req, res) => {
  const group = await groupService.getGroupById(req.params.id);
  res.json({ success: true, data: group });
});

const handleCreateGroup = asyncHandler(async (req, res) => {
  const group = await groupService.createGroup(req.body, req.user.id);
  res.status(201).json({ success: true, data: group });
});

const handleUpdateGroup = asyncHandler(async (req, res) => {
  const group = await groupService.updateGroup(req.params.id, req.body, req.user.id);
  res.json({ success: true, data: group });
});

const handleDeleteGroup = asyncHandler(async (req, res) => {
  await groupService.deleteGroup(req.params.id, req.user.id, req.user.roles);
  res.status(204).send();
});

const handleJoinGroup = asyncHandler(async (req, res) => {
  await groupService.joinGroup(req.params.id, req.user.id);
  res.json({ success: true, message: "Successfully joined group" });
});

const handleLeaveGroup = asyncHandler(async (req, res) => {
  await groupService.leaveGroup(req.params.id, req.user.id);
  res.json({ success: true, message: "Successfully left group" });
});

const handleGetGroupPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  const result = await groupService.getGroupPosts(req.params.id, pageNum, limitNum);
  
  res.json({
    success: true,
    data: result.posts,
    meta: {
      total: result.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.total / limitNum),
    },
  });
});

const handleGetMyGroupsPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  const result = await groupService.getMyGroupsPosts(req.user.id, pageNum, limitNum);
  
  res.json({
    success: true,
    data: result.posts,
    meta: {
      total: result.total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(result.total / limitNum),
    },
  });
});

module.exports = { 
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
};
