const { pool } = require('../services/db');

class AdminClubsRepository {
  async list({ search = '', category = '', page = 1, pageSize = 20 } = {}) {
    const params = [];
    const conditions = ["c.is_active = true", "c.type = 'club'"];
    let p = 1;

    if (search) {
      conditions.push(`c.name ILIKE $${p++}`);
      params.push(`%${search}%`);
    }
    if (category) {
      conditions.push(`c.category = $${p++}`);
      params.push(category);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * pageSize;

    const { rows } = await pool.query(
      `SELECT
         c.id, c.name, c.description, c.category, c.is_active, c.created_at,
         u.full_name AS lead_name, u.id AS lead_id,
         COUNT(cm.user_id) AS member_count
       FROM groups c
       LEFT JOIN users u ON u.id = c.lead_user_id
       LEFT JOIN group_members cm ON cm.group_id = c.id
       ${where}
       GROUP BY c.id, u.full_name, u.id
       ORDER BY c.name ASC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, pageSize, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM groups c ${where}`,
      params
    );

    return { data: rows, total: parseInt(countRows[0].total), page, pageSize };
  }

  async getById(id) {
    const { rows } = await pool.query(
      `SELECT c.*, u.full_name AS lead_name
       FROM groups c
       LEFT JOIN users u ON u.id = c.lead_user_id
       WHERE c.id = $1 AND c.type = 'club'`,
      [id]
    );
    return rows[0] || null;
  }

  async create({ name, description, category, leadUserId }) {
    const { rows } = await pool.query(
      `INSERT INTO groups (name, type, description, category, lead_user_id)
       VALUES ($1, 'club', $2, $3, $4)
       RETURNING *`,
      [name, description || null, category || null, leadUserId || null]
    );
    return rows[0];
  }

  async update(id, fields) {
    const allowed = ['name', 'description', 'category', 'lead_user_id', 'is_active'];
    const sets = [];
    const params = [];
    let p = 1;

    // Map camelCase to snake_case for lead_user_id
    const mapped = { ...fields, lead_user_id: fields.leadUserId ?? fields.lead_user_id };

    for (const key of allowed) {
      if (mapped[key] !== undefined) {
        sets.push(`${key} = $${p++}`);
        params.push(mapped[key]);
      }
    }
    if (sets.length === 0) return null;

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE groups SET ${sets.join(', ')}, updated_at = now() WHERE id = $${p} AND type = 'club' RETURNING *`,
      params
    );
    return rows[0] || null;
  }

  async softDelete(id) {
    const { rows } = await pool.query(
      `UPDATE groups SET is_active = false, updated_at = now() WHERE id = $1 AND type = 'club' RETURNING id`,
      [id]
    );
    return rows[0] || null;
  }

  async reassignLead(id, newLeadUserId) {
    const { rows } = await pool.query(
      `UPDATE groups SET lead_user_id = $1, updated_at = now() WHERE id = $2 AND type = 'club' RETURNING *`,
      [newLeadUserId, id]
    );
    return rows[0] || null;
  }

  async getMembers(clubId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows } = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.avatar_url, cm.joined_at, cm.role
       FROM group_members cm
       JOIN users u ON u.id = cm.user_id
       WHERE cm.group_id = $1
       ORDER BY cm.joined_at DESC
       LIMIT $2 OFFSET $3`,
      [clubId, pageSize, offset]
    );
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM group_members WHERE group_id = $1`,
      [clubId]
    );
    return { data: rows, total: parseInt(countRows[0].total), page, pageSize };
  }

  async getPosts(clubId, { page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    // Note: Assuming 'posts' uses group_id or target_id based on post_targets.
    // If posts table historically used club_id, query below adjusts it, but might fail if column doesn't exist.
    // For now we assume a group_id column exists or will be targeted.
    const { rows } = await pool.query(
      `SELECT p.id, p.title, p.content, p.category, p.created_at, u.full_name AS author_name
       FROM posts p
       JOIN users u ON u.id = p.author_id
       JOIN post_targets pt ON pt.post_id = p.id
       WHERE pt.target_id = $1 AND pt.target_type = 'group'
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [clubId, pageSize, offset]
    );
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM posts p
       JOIN post_targets pt ON pt.post_id = p.id
       WHERE pt.target_id = $1 AND pt.target_type = 'group'`,
      [clubId]
    );
    return { data: rows, total: parseInt(countRows[0].total), page, pageSize };
  }
}

module.exports = new AdminClubsRepository();
