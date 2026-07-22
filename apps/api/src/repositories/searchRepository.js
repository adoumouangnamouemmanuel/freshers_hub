const { pool } = require("../services/db");

const searchRepository = {
  async searchUsers(query, limit = 5) {
    const { rows } = await pool.query(`
      SELECT DISTINCT u.id, u.full_name as name, u.avatar_url, u.major, r.name as role
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      WHERE u.full_name ILIKE $1
      LIMIT $2
    `, [`%${query}%`, limit]);
    
    // Group roles for each user
    const usersMap = new Map();
    for (const row of rows) {
      if (!usersMap.has(row.id)) {
        usersMap.set(row.id, {
          id: row.id,
          name: row.name,
          avatar_url: row.avatar_url,
          major: row.major,
          roles: []
        });
      }
      usersMap.get(row.id).roles.push(row.role);
    }
    
    return Array.from(usersMap.values());
  },

  async searchPosts(query, userId, limit = 5) {
    let whereClause = `(p.title ILIKE $1 OR p.content ILIKE $1)`;
    let queryParams = [`%${query}%`, limit];

    if (userId) {
      whereClause += ` AND (
        p.visibility = 'public'
        OR p.author_id = $3
        OR EXISTS (
          SELECT 1 FROM post_targets pt
          JOIN group_members gm ON gm.group_id = pt.target_id AND pt.target_type = 'group'
          WHERE pt.post_id = p.id AND gm.user_id = $3
        )
        OR EXISTS (
          SELECT 1 FROM post_targets pt
          JOIN coach_assignments ca ON ca.peer_coach_id = pt.target_id AND pt.target_type = 'coach'
          WHERE pt.post_id = p.id AND ca.fresher_id = $3
        )
      )`;
      queryParams.push(userId);
    } else {
      whereClause += ` AND p.visibility = 'public'`;
    }

    const { rows } = await pool.query(`
      SELECT p.id, p.title, p.content, p.category, p.created_at, u.full_name as author_name
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $2
    `, queryParams);

    return rows;
  },

  async searchGroups(query, userId, limit = 5) {
    let whereClause = `(g.name ILIKE $1 OR g.description ILIKE $1)`;
    let queryParams = [`%${query}%`, limit];

    if (userId) {
      whereClause += ` AND (
        g.type = 'public'
        OR EXISTS (
          SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = $3
        )
      )`;
      queryParams.push(userId);
    } else {
      whereClause += ` AND g.type = 'public'`;
    }

    const { rows } = await pool.query(`
      SELECT g.id, g.name, g.description, g.category
      FROM groups g
      WHERE ${whereClause}
      LIMIT $2
    `, queryParams);

    return rows;
  },

  async searchFaqs(query, limit = 5) {
    const { rows } = await pool.query(`
      SELECT id, question, answer, category
      FROM faq_items
      WHERE question ILIKE $1 OR answer ILIKE $1
      LIMIT $2
    `, [`%${query}%`, limit]);
    
    return rows;
  },

  async searchLocations(query, limit = 5) {
    const { rows } = await pool.query(`
      SELECT id, name, short_name, category, building, description, icon
      FROM locations
      WHERE name ILIKE $1 OR short_name ILIKE $1 OR category ILIKE $1 OR description ILIKE $1
      LIMIT $2
    `, [`%${query}%`, limit]);
    
    return rows;
  }
};

module.exports = searchRepository;
