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

  /**
   * BUG-02 fix: Rewrote to JOIN posts and use actual events table columns.
   * Previously queried non-existent columns (e.title, e.starts_at, e.organizer_id)
   * which would have crashed at runtime. Now mirrors the real schema.
   */
  async listEvents({ status = '', search = '', page = 1, pageSize = 20 } = {}) {
    const params = [];
    const conditions = [];
    let p = 1;

    if (status) { conditions.push(`e.status = $${p++}`); params.push(status); }
    if (search) { conditions.push(`p.title ILIKE $${p++}`); params.push(`%${search}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const { rows } = await pool.query(
      `SELECT
              e.id, e.status, e.event_date AS event_date, e.event_time AS event_time,
              e.end_date, e.end_time, e.is_all_day, e.is_online, e.meeting_link,
              e.location, e.organizer, e.capacity, e.rsvp_enabled,
              e.created_at,
              p.id AS post_id, p.title, p.content, p.visibility,
              p.author_id,
              u.full_name AS author_name, u.avatar_url AS author_avatar,
              (SELECT COUNT(*)::int FROM event_rsvps er WHERE er.event_id = e.id AND er.status = 'going') AS going_count
       FROM events e
       JOIN posts p ON p.id = e.post_id
       JOIN users u ON u.id = p.author_id
       ${where}
       ORDER BY e.event_date DESC, e.event_time DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, pageSize, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM events e
       JOIN posts p ON p.id = e.post_id
       ${where}`,
      params
    );

    return { data: rows, total: parseInt(countRows[0].total), page, pageSize };
  }

  /**
   * BUG-02 fix: updateEvent now uses the correct column names from the real
   * events table. Previously used 'title', 'description', 'starts_at', 'ends_at'
   * — none of which exist.
   */
  async updateEvent(id, fields) {
    // event-level fields
    const eventAllowed = ['event_date', 'event_time', 'end_date', 'end_time', 'location',
                         'organizer', 'capacity', 'rsvp_enabled', 'is_online', 'meeting_link',
                         'is_all_day', 'status'];
    const eventSets = [];
    const eventParams = [];
    let p = 1;

    for (const key of eventAllowed) {
      if (fields[key] !== undefined) {
        eventSets.push(`${key} = $${p++}`);
        eventParams.push(fields[key]);
      }
    }

    // post-level fields (title, content, visibility)
    const postAllowed = ['title', 'content', 'visibility'];
    const postSets = [];
    const postParams = [];
    let pp = 1;

    for (const key of postAllowed) {
      if (fields[key] !== undefined) {
        postSets.push(`${key} = $${pp++}`);
        postParams.push(fields[key]);
      }
    }

    if (eventSets.length === 0 && postSets.length === 0) return null;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let updatedEvent = null;
      if (eventSets.length > 0) {
        eventParams.push(id);
        const { rows } = await client.query(
          `UPDATE events SET ${eventSets.join(', ')}, updated_at = now()
           WHERE id = $${p} RETURNING *`,
          eventParams
        );
        updatedEvent = rows[0] || null;
      }

      if (postSets.length > 0) {
        // Get the post_id for this event
        const { rows: eventRows } = await client.query(
          `SELECT post_id FROM events WHERE id = $1`, [id]
        );
        if (eventRows.length > 0) {
          postParams.push(eventRows[0].post_id);
          await client.query(
            `UPDATE posts SET ${postSets.join(', ')}, updated_at = now()
             WHERE id = $${pp}`,
            postParams
          );
        }
      }

      await client.query('COMMIT');
      return updatedEvent;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new AdminFeedRepository();
