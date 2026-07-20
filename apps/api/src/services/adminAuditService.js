const adminAuditRepository = require('../repositories/adminAuditRepository');

const listAuditLogs = async (query) => {
  const page = parseInt(query.page, 10) || 1;
  const pageSize = parseInt(query.pageSize, 10) || 20;

  return adminAuditRepository.listAuditLogs({
    search: query.search || '',
    action: query.action || '',
    entity_type: query.entity_type || '',
    startDate: query.startDate || '',
    endDate: query.endDate || '',
    page,
    pageSize,
  });
};

module.exports = {
  listAuditLogs,
};
