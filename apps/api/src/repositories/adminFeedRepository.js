const { pool } = require('../services/db');

class AdminFeedRepository {
  // ── Posts ──────────────────────────────────────────────────────────────────

  async listPosts({ type = '', audience = '', status = '', page = 1, pageSize = 20 } = {}) {
    const params = [];
    const conditions = [];
    let p = 1;

    if (type)     { conditions.push(`p.category = $${p++}`); params.push(type); }
    if (audience) { conditions.push(`p.audience = $${p++}`); params.push(audience); }
    if (status)   { conditions.push(`p.status = $${p++}`);   params.push(status); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const { rows } = await pool.query(
      `SELECT p.id, p.title, p.content, p.category, p.created_at,
              u.full_name AS author_name, u.id AS author_id, u.avatar_url AS author_avatar
       FROM posts p
       JOIN users u ON u.id = p.author_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, pageSize, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM posts p ${where}`,
      params
    );

    return { data: rows, total: parseInt(countRows[0].total), page, pageSize };
  }

  /**
   * Hard-delete a post for moderation.
   * The content is captured into res.locals.auditMetadata by the service
   * BEFORE calling this method, ensuring it is logged to audit_log even after removal.
   */
  async hardDeletePost(id) {
    // Fetch content snapshot first
    const { rows: snap } = await pool.query(
      `SELECT id, title, content, author_id, created_at FROM posts WHERE id = $1`,
      [id]
    );
    if (!snap.length) return null;

    const { rows } = await pool.query(
      `DELETE FROM posts WHERE id = $1 RETURNING id`,
      [id]
    );

    return { deleted: rows[0] || null, snapshot: snap[0] };
  }

  async createPost({ authorId, title, content, category = 'announcement', audience = 'all' }) {
    const { rows } = await pool.query(
      `INSERT INTO posts (author_id, title, content, category)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [authorId, title, content, category]
    );
    return rows[0];
  }

  // ── Groups ─────────────────────────────────────────────────────────────────

  async listGroups({ page = 1, pageSize = 20 } = {}) {
    const offset = (page - 1) * pageSize;
    const { rows } = await pool.query(
      `SELECT g.id, g.name, g.type, g.created_at,
              COUNT(gm.user_id) AS member_count
       FROM groups g
       LEFT JOIN group_members gm ON gm.group_id = g.id
       GROUP BY g.id
       ORDER BY g.name ASC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );
    const { rows: countRows } = await pool.query(`SELECT COUNT(*) AS total FROM groups`);
    return { data: rows, total: parseInt(countRows[0].total), page, pageSize };
  }

  async createGroup({ name, type }) {
    const { rows } = await pool.query(
      `INSERT INTO groups (name, type) VALUES ($1, $2) RETURNING *`,
      [name, type || null]
    );
    return rows[0];
  }

  async addGroupMembers(groupId, userIds) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const userId of userIds) {
        await client.query(
          `INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [groupId, userId]
        );
      }
      await client.query('COMMIT');
      return { groupId, added: userIds.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  async listEvents({ status = '', search = '', page = 1, pageSize = 20 } = {}) {
    const params = [];
    const conditions = [];
    let p = 1;

    if (status) { conditions.push(`e.status = $${p++}`); params.push(status); }
    if (search) { conditions.push(`e.title ILIKE $${p++}`); params.push(`%${search}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.description, e.location, e.starts_at, e.ends_at,
              e.status, e.created_at, u.full_name AS organizer_name
       FROM events e
       LEFT JOIN users u ON u.id = e.organizer_id
       ${where}
       ORDER BY e.starts_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, pageSize, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM events e ${where}`,
      params
    );

    return { data: rows, total: parseInt(countRows[0].total), page, pageSize };
  }

  async updateEvent(id, fields) {
    const allowed = ['title', 'description', 'location', 'starts_at', 'ends_at', 'status'];
    const sets = [];
    const params = [];
    let p = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = $${p++}`);
        params.push(fields[key]);
      }
    }
    if (sets.length === 0) return null;

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE events SET ${sets.join(', ')}, updated_at = now() WHERE id = $${p} RETURNING *`,
      params
    );
    return rows[0] || null;
  }
}

module.exports = new AdminFeedRepository();
