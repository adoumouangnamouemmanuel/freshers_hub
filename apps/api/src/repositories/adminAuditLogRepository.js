const { pool } = require('../services/db');

class AdminAuditLogRepository {
  async list({ actorId = '', action = '', entity = '', from = '', to = '', page = 1, pageSize = 50 } = {}) {
    const params = [];
    const conditions = [];
    let p = 1;

    if (actorId) { conditions.push(`al.actor_id = $${p++}`); params.push(actorId); }
    if (action)  { conditions.push(`al.action ILIKE $${p++}`); params.push(`%${action}%`); }
    if (entity)  { conditions.push(`al.entity_type = $${p++}`); params.push(entity); }
    if (from)    { conditions.push(`al.created_at >= $${p++}`); params.push(from); }
    if (to)      { conditions.push(`al.created_at <= $${p++}`); params.push(to); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const { rows } = await pool.query(
      `SELECT
         al.id, al.action, al.entity_type, al.entity_id, al.metadata, al.ip_address, al.created_at,
         u.full_name AS actor_name, u.email AS actor_email
       FROM audit_log al
       JOIN users u ON u.id = al.actor_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, pageSize, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM audit_log al ${where}`,
      params
    );

    return { data: rows, total: parseInt(countRows[0].total), page, pageSize };
  }

  async createEntry(actorId, action, entityType, entityId, metadata, ip) {
    const { rows } = await pool.query(
      `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [actorId, action, entityType, entityId || null, metadata ? JSON.stringify(metadata) : null, ip || null]
    );
    return rows[0];
  }
}

module.exports = new AdminAuditLogRepository();
