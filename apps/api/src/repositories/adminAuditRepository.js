/**
 * Admin Audit Repository
 * Handles querying the audit_log table for the Platform Admin portal.
 */

const { pool } = require('../services/db');

class AdminAuditRepository {
  async listAuditLogs({ search = '', action = '', entity_type = '', startDate = '', endDate = '', page = 1, pageSize = 20 } = {}) {
    const params = [];
    const conditions = [];
    let p = 1;

    if (search) {
      conditions.push(`(u.full_name ILIKE $${p} OR u.email ILIKE $${p})`);
      params.push(`%${search}%`);
      p++;
    }

    if (action && action !== 'all') {
      conditions.push(`a.action = $${p}`);
      params.push(action);
      p++;
    }

    if (entity_type && entity_type !== 'all') {
      conditions.push(`a.entity_type = $${p}`);
      params.push(entity_type);
      p++;
    }

    if (startDate) {
      conditions.push(`a.created_at >= $${p}::timestamptz`);
      params.push(startDate);
      p++;
    }

    if (endDate) {
      conditions.push(`a.created_at <= $${p}::timestamptz`);
      params.push(endDate);
      p++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_log a
      LEFT JOIN users u ON u.id = a.actor_id
      ${where}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated data
    const dataQuery = `
      SELECT 
        a.id, 
        a.action, 
        a.entity_type, 
        a.entity_id, 
        a.metadata, 
        a.ip_address, 
        a.created_at,
        u.id as actor_id,
        u.full_name as actor_name,
        u.email as actor_email
      FROM audit_log a
      LEFT JOIN users u ON u.id = a.actor_id
      ${where}
      ORDER BY a.created_at DESC
      LIMIT $${p} OFFSET $${p + 1}
    `;
    
    const { rows } = await pool.query(dataQuery, [...params, pageSize, offset]);

    return {
      data: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }
}

module.exports = new AdminAuditRepository();
