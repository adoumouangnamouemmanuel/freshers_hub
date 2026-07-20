const adminAuditService = require('../services/adminAuditService');
const asyncHandler = require('../utils/asyncHandler');

const listAuditLogs = asyncHandler(async (req, res) => {
  const result = await adminAuditService.listAuditLogs(req.query);
  res.json(result);
});

module.exports = {
  listAuditLogs,
};
